"use client";

import React, { useState, useTransition, useMemo } from "react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { bulkImportEnvAction } from "@/actions/env.actions";
import { parseEnvText } from "@/utils/env-parser";
import { Environment } from "@/types/database.types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PasteEnvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultEnvironment: Environment;
}

export function PasteEnvDialog({
  open,
  onOpenChange,
  projectId,
  defaultEnvironment,
}: PasteEnvDialogProps) {
  const [environment, setEnvironment] = useState<Environment>(defaultEnvironment);
  const [rawText, setRawText] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Parse live on text change
  const parseResult = useMemo(() => {
    return parseEnvText(rawText);
  }, [rawText]);

  const handleImport = () => {
    if (parseResult.items.length === 0) {
      toast.error("Please paste at least one valid environment variable.");
      return;
    }

    startTransition(async () => {
      const res = await bulkImportEnvAction({
        projectId,
        environment,
        rawEnv: rawText,
        overwriteExisting: overwrite,
      });

      if (res.success) {
        const { importedCount, updatedCount, errors } = res.data;
        toast.success(
          `Import complete: ${importedCount} created, ${updatedCount} updated in ${environment}.`
        );
        if (errors.length > 0) {
          toast.warning(`${errors.length} items had warnings during import.`);
        }
        setRawText("");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileUp className="size-4" />
            </div>
            <DialogTitle>Paste .env Bulk Import</DialogTitle>
          </div>
          <DialogDescription>
            Paste your raw .env contents below to import multiple variables at once. All values will be AES-256 encrypted before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-w-0 max-w-full">
          {/* Environment Target */}
          <Field>
            <FieldLabel htmlFor="import-env">Target Environment</FieldLabel>
            <Select
              value={environment}
              onValueChange={(val) => setEnvironment(val as Environment)}
              disabled={isPending}
            >
              <SelectTrigger id="import-env" className="w-full">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Raw Text Input */}
          <Field className="min-w-0 max-w-full">
            <FieldLabel htmlFor="raw-env">.env Text Content</FieldLabel>
            <Textarea
              id="raw-env"
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`# Paste your .env file contents here\nDATABASE_URL=postgres://...\nNEXT_PUBLIC_API_URL=https://...\nSTRIPE_SECRET_KEY="sk_live_..."`}
              className="font-mono text-xs w-full max-w-full min-w-0 break-all resize-y"
              disabled={isPending}
            />
          </Field>

          {/* Live Parser Feedback */}
          {rawText.trim() && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5 text-foreground">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Detected Variables
                </span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {parseResult.items.length} valid
                </Badge>
              </div>

              {parseResult.items.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1">
                  {parseResult.items.map((it) => (
                    <span
                      key={it.key}
                      className="inline-flex items-center rounded bg-background px-1.5 py-0.5 font-mono text-[11px] border text-foreground/90"
                    >
                      {it.key}
                    </span>
                  ))}
                </div>
              )}

              {parseResult.duplicates.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-500 pt-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>
                    Duplicate keys detected ({parseResult.duplicates.join(", ")}). The last value in the file will be used.
                  </span>
                </div>
              )}

              {parseResult.errors.length > 0 && (
                <div className="space-y-1 text-destructive pt-1">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    Syntax Issues ({parseResult.errors.length}):
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {parseResult.errors.slice(0, 3).map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                    {parseResult.errors.length > 3 && (
                      <li>...and {parseResult.errors.length - 3} more line errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Overwrite Toggle */}
          <div className="flex items-center gap-2.5 pt-1">
            <Checkbox
              id="overwrite-toggle"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(Boolean(checked))}
              disabled={isPending}
            />
            <label
              htmlFor="overwrite-toggle"
              className="text-xs text-foreground cursor-pointer select-none"
            >
              Overwrite existing variables in {environment} if key already exists
            </label>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={parseResult.items.length === 0 || isPending}
            onClick={handleImport}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Import {parseResult.items.length} Variables
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
