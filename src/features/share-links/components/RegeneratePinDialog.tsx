"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { regenerateSharePinAction } from "@/actions/share-link.actions";
import { toast } from "sonner";
import { KeyRound, Copy, Check, AlertTriangle, Loader2 } from "lucide-react";

interface RegeneratePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLinkId: string;
  projectId: string;
  label: string;
  onSuccess: () => void;
}

export function RegeneratePinDialog({
  open,
  onOpenChange,
  shareLinkId,
  projectId,
  label,
  onSuccess,
}: RegeneratePinDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPin, setNewPin] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  const handleRegenerate = async () => {
    setIsSubmitting(true);
    try {
      const res = await regenerateSharePinAction(shareLinkId, projectId);
      if (!res.success) {
        toast.error(res.error || "Failed to regenerate PIN");
        return;
      }

      setNewPin(res.data.newPin);
      toast.success("New PIN generated successfully");
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate PIN");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPin = async () => {
    if (!newPin) return;
    await navigator.clipboard.writeText(newPin);
    setCopiedPin(true);
    toast.success("New PIN copied to clipboard");
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleClose = () => {
    setNewPin(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="size-5" />
            <DialogTitle>Regenerate PIN</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate a brand-new 6-digit access PIN for &quot;{label}&quot;.
          </DialogDescription>
        </DialogHeader>

        {!newPin ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3 text-xs bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Active sessions will be terminated</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Regenerating the PIN invalidates any existing PIN, resets any active failed attempt lockouts, and revokes all active client viewer sessions immediately.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2.5 sm:gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRegenerate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Generating...
                  </>
                ) : (
                  "Confirm & Regenerate PIN"
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3 text-xs bg-green-500/10 border border-green-500/20 rounded-md text-green-400">
              <div>
                <p className="font-semibold">New PIN Generated</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Save this PIN now and provide it to the client. This will not be shown again.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/40 border border-input rounded-md px-4 py-2.5 text-center font-mono text-xl tracking-[0.4em] font-bold text-primary select-all">
                {newPin}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPin}
                className="gap-1.5 shrink-0 h-11"
              >
                {copiedPin ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                Copy PIN
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" size="sm" onClick={handleClose} className="w-full">
                I&apos;ve Saved the New PIN
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
