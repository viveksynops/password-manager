"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Download, FileDown, Loader2 } from "lucide-react";
import { exportEnvAction } from "@/actions/env.actions";
import { Environment } from "@/types/database.types";
import { toast } from "sonner";

interface ExportEnvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  environment: Environment;
}

export function ExportEnvDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  environment,
}: ExportEnvDialogProps) {
  const [exportedContent, setExportedContent] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setExportedContent("");
      setIsCopied(false);
      startTransition(async () => {
        const res = await exportEnvAction({
          projectId,
          environment,
        });

        if (res.success) {
          setExportedContent(res.data);
        } else {
          toast.error(res.error || "Failed to decrypt environment variables for export.");
        }
      });
    }
  }, [open, projectId, environment]);

  const handleCopy = async () => {
    if (!exportedContent) return;
    try {
      await navigator.clipboard.writeText(exportedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success("Exported .env content copied to clipboard.");
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const handleDownload = () => {
    if (!exportedContent) return;
    try {
      const blob = new Blob([exportedContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `.env.${environment}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded .env.${environment}`);
    } catch {
      toast.error("Failed to trigger file download.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileDown className="size-4" />
            </div>
            <DialogTitle className="flex items-center gap-2">
              <span>Export .env</span>
              <Badge variant="outline" className="font-mono text-[11px] capitalize">
                {environment}
              </Badge>
            </DialogTitle>
          </div>
          <DialogDescription>
            Decrypted secrets for project <span className="font-medium text-foreground">{projectName}</span> ({environment}). This action has been recorded in the immutable audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isPending ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Decrypting environment variables securely...</p>
            </div>
          ) : (
            <Textarea
              rows={12}
              value={exportedContent}
              readOnly
              className="font-mono text-xs select-all bg-muted/40"
            />
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between items-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || !exportedContent}
              onClick={handleCopy}
            >
              {isCopied ? (
                <>
                  <Check className="mr-1.5 size-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 size-3.5" />
                  Copy Text
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isPending || !exportedContent}
              onClick={handleDownload}
            >
              <Download className="mr-1.5 size-3.5" />
              Download .env.{environment}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
