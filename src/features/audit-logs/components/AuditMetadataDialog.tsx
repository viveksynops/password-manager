"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditLogWithDetails } from "@/services/audit.service";
import { AuditActionBadge } from "./AuditActionBadge";
import { FileJson } from "lucide-react";

interface AuditMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLogWithDetails | null;
}

export function AuditMetadataDialog({ open, onOpenChange, log }: AuditMetadataDialogProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileJson className="size-4" />
            </div>
            <DialogTitle className="flex items-center gap-2">
              <span>Audit Entry Details</span>
              <AuditActionBadge action={log.action} />
            </DialogTitle>
          </div>
          <DialogDescription className="font-mono text-xs">
            ID: {log.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3">
            <div>
              <span className="text-muted-foreground block text-[11px]">Actor:</span>
              <span className="font-medium text-foreground">
                {log.user_email || log.user_name || (log.user_id ? log.user_id.slice(0, 8) : "System")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">IP Address:</span>
              <span className="font-mono text-foreground">{log.ip_address || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Target Type:</span>
              <span className="font-mono text-foreground">{log.target_type}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Target ID:</span>
              <span className="font-mono text-foreground truncate block" title={log.target_id || ""}>
                {log.target_id || "—"}
              </span>
            </div>
            {log.project_name && (
              <div className="col-span-2">
                <span className="text-muted-foreground block text-[11px]">Associated Project:</span>
                <span className="font-medium text-foreground">{log.project_name}</span>
              </div>
            )}
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px] mb-1 font-medium">
              Payload Metadata:
            </span>
            <pre className="rounded-lg border bg-muted/50 p-3 font-mono text-[11px] overflow-x-auto text-foreground/90 max-h-56">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
