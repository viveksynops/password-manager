"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ItemPicker } from "./ItemPicker";
import { CredentialSummary } from "@/services/credential.service";
import { EnvVariableSummary } from "@/services/env.service";
import { ShareItemInput } from "@/features/share-links/schemas";
import { updateShareLinkItemsAction, getShareLinkDetailAction } from "@/actions/share-link.actions";
import { toast } from "sonner";
import { Edit, Loader2, AlertTriangle } from "lucide-react";

interface EditShareItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLinkId: string;
  projectId: string;
  credentials: CredentialSummary[];
  envVariables: EnvVariableSummary[];
  onSuccess: () => void;
}

export function EditShareItemsDialog({
  open,
  onOpenChange,
  shareLinkId,
  projectId,
  credentials,
  envVariables,
  onSuccess,
}: EditShareItemsDialogProps) {
  const [selectedItems, setSelectedItems] = useState<ShareItemInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && shareLinkId) {
      setIsLoading(true);
      getShareLinkDetailAction(shareLinkId).then((res) => {
        setIsLoading(false);
        if (res.success && res.data) {
          setSelectedItems(
            res.data.items.map((it) => ({
              itemType: it.itemType,
              itemId: it.itemId,
            }))
          );
        } else {
          toast.error("Failed to load share items");
        }
      });
    }
  }, [open, shareLinkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error("You must select at least one item to keep this link active");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateShareLinkItemsAction({
        shareLinkId,
        projectId,
        items: selectedItems,
      });

      if (res.success) {
        toast.success("Shared items updated");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to update shared items");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update shared items");
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
              <Edit className="size-5" />
              <DialogTitle>Edit Shared Items</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the credentials and environment variables visible via this share link.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3 p-3 text-xs bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Active client sessions will be reset</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Updating shared items invalidates active viewer sessions. Any client currently viewing these items will need to re-enter their PIN.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading current shared items...
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <ItemPicker
                credentials={credentials}
                envVariables={envVariables}
                selectedItems={selectedItems}
                onChange={setSelectedItems}
              />
            </div>
          )}

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
              disabled={isSubmitting || isLoading || selectedItems.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Updating Items...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
