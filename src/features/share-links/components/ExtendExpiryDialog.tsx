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
import { Label } from "@/components/ui/label";
import { ExpirySelect } from "./ExpirySelect";
import { ExpiryPresetValue } from "@/features/share-links/schemas";
import { extendShareLinkAction } from "@/actions/share-link.actions";
import { toast } from "sonner";
import { Calendar, Loader2 } from "lucide-react";

interface ExtendExpiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLinkId: string;
  projectId: string;
  label: string;
  onSuccess: () => void;
}

export function ExtendExpiryDialog({
  open,
  onOpenChange,
  shareLinkId,
  projectId,
  label,
  onSuccess,
}: ExtendExpiryDialogProps) {
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPresetValue>("30d");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await extendShareLinkAction({
        shareLinkId,
        projectId,
        expiryPreset,
      });

      if (res.success) {
        toast.success("Share link expiration extended");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to extend expiration");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to extend expiration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="size-5" />
              <DialogTitle>Extend Expiration</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Extend the expiration window for &quot;{label}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs">New Expiration Period</Label>
            <ExpirySelect
              value={expiryPreset}
              onValueChange={setExpiryPreset}
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-muted-foreground">
              The new expiration time will be calculated starting from now.
            </p>
          </div>

          <DialogFooter className="gap-2.5 sm:gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Extending...
                </>
              ) : (
                "Extend Expiration"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
