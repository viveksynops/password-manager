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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from "lucide-react";
import { deleteEnvVariableAction } from "@/actions/env.actions";
import { EnvVariableSummary } from "@/services/env.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteEnvConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variable: EnvVariableSummary | null;
  projectId: string;
}

export function DeleteEnvConfirmDialog({
  open,
  onOpenChange,
  variable,
  projectId,
}: DeleteEnvConfirmDialogProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isProduction = variable?.environment === "production";
  const isValidConfirmation = isProduction
    ? typedConfirmation.trim() === variable?.key.trim()
    : true;

  useEffect(() => {
    if (open) {
      setTypedConfirmation("");
    }
  }, [open]);

  if (!variable) return null;

  const handleDelete = () => {
    if (!isValidConfirmation) return;

    startTransition(async () => {
      const res = await deleteEnvVariableAction({
        id: variable.id,
        projectId,
        environment: variable.environment,
        confirmation: isProduction ? typedConfirmation.trim() : undefined,
      });

      if (res.success) {
        toast.success(`Variable "${variable.key}" deleted from ${variable.environment}.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>Delete Environment Variable</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-mono font-semibold text-foreground">
              {variable.key}
            </span>{" "}
            from the{" "}
            <Badge
              variant={isProduction ? "destructive" : "outline"}
              className="font-mono text-[11px] capitalize"
            >
              {variable.environment}
            </Badge>{" "}
            environment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {isProduction && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="size-4 shrink-0" />
              Production Safety Guard
            </p>
            <p className="text-foreground/80">
              To delete this production variable, please type{" "}
              <span className="font-mono font-bold text-destructive select-all">
                {variable.key}
              </span>{" "}
              below to confirm:
            </p>
            <Input
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder={`Type "${variable.key}" to confirm`}
              className="bg-background text-foreground font-mono text-xs border-destructive/40 focus-visible:ring-destructive"
              disabled={isPending}
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
            variant="destructive"
            disabled={!isValidConfirmation || isPending}
            onClick={handleDelete}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Delete Variable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
