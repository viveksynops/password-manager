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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemPicker } from "./ItemPicker";
import { ExpirySelect } from "./ExpirySelect";
import { CredentialSummary } from "@/services/credential.service";
import { EnvVariableSummary } from "@/services/env.service";
import { ShareItemInput, ExpiryPresetValue } from "@/features/share-links/schemas";
import { createShareLinkAction } from "@/actions/share-link.actions";
import { CreatedShareLinkResult } from "@/services/share-link.service";
import { toast } from "sonner";
import { Share2, Loader2 } from "lucide-react";

interface CreateShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  credentials: CredentialSummary[];
  envVariables: EnvVariableSummary[];
  onSuccess: (result: CreatedShareLinkResult) => void;
}

export function CreateShareDialog({
  open,
  onOpenChange,
  projectId,
  credentials,
  envVariables,
  onSuccess,
}: CreateShareDialogProps) {
  const [label, setLabel] = useState("");
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPresetValue>("30d");
  const [maxViews, setMaxViews] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<ShareItemInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Please provide a label for this share link");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please select at least one credential or environment variable to share");
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedMaxViews = maxViews.trim() ? parseInt(maxViews, 10) : null;
      const res = await createShareLinkAction({
        projectId,
        label: label.trim(),
        expiryPreset,
        maxViews: parsedMaxViews,
        items: selectedItems,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to create share link");
        return;
      }

      toast.success("Share link created successfully");
      onOpenChange(false);
      // Reset form
      setLabel("");
      setExpiryPreset("30d");
      setMaxViews("");
      setSelectedItems([]);
      onSuccess(res.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Share2 className="size-5" />
              <DialogTitle>Create Client Share Link</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Generate an expiring, PIN-protected link to share specific credentials and environment variables with clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="share-label" className="text-xs">
                Share Link Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="share-label"
                placeholder="e.g. Onboarding - Client QA Team"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={80}
                required
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Internal name to identify what or who this link was generated for.
              </p>
            </div>

            {/* Expiry & Max Views */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Expiration Preset</Label>
                <ExpirySelect
                  value={expiryPreset}
                  onValueChange={(val) => setExpiryPreset(val)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="share-max-views" className="text-xs">
                  Max Views (Optional)
                </Label>
                <Input
                  id="share-max-views"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Items Picker */}
            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs">
                Select Credentials & Environment Variables <span className="text-destructive">*</span>
              </Label>
              <ItemPicker
                credentials={credentials}
                envVariables={envVariables}
                selectedItems={selectedItems}
                onChange={setSelectedItems}
              />
            </div>
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
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || selectedItems.length === 0}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Generating Link & PIN...
                </>
              ) : (
                <>Generate Share Link</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
