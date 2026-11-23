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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getShareAccessHistoryAction } from "@/actions/share-link.actions";
import { History, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime, formatFullDate } from "@/lib/date";

interface ShareAccessHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLinkId: string;
  label: string;
}

export function ShareAccessHistoryDialog({
  open,
  onOpenChange,
  shareLinkId,
  label,
}: ShareAccessHistoryDialogProps) {
  const [history, setHistory] = useState<{
    id: string;
    ip_address: string | null;
    success: boolean;
    created_at: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && shareLinkId) {
      setIsLoading(true);
      getShareAccessHistoryAction(shareLinkId).then((res) => {
        setIsLoading(false);
        if (res.success && res.data) {
          setHistory(res.data);
        } else {
          toast.error("Failed to load access history");
        }
      });
    }
  }, [open, shareLinkId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <History className="size-5" />
            <DialogTitle>Access History</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Recent authentication and access attempts for &quot;{label}&quot;.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
            <Loader2 className="size-4 animate-spin" />
            Loading access history...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No access attempts recorded yet for this share link.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">IP Address</TableHead>
                  <TableHead className="text-xs text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} className="text-xs">
                    <TableCell>
                      {item.success ? (
                        <Badge variant="outline" className="text-green-400 border-green-500/20 bg-green-500/10 gap-1 font-normal text-[11px]">
                          <CheckCircle2 className="size-3" />
                          Authorized
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-400 border-red-500/20 bg-red-500/10 gap-1 font-normal text-[11px]">
                          <XCircle className="size-3" />
                          Failed PIN
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {item.ip_address || "Unknown IP"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      <span title={formatFullDate(item.created_at)}>
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
