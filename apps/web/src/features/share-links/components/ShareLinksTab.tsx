"use client";

import React, { useState, useMemo } from "react";
import { ShareLinkSummary, CreatedShareLinkResult } from "@/services/share-link.service";
import { CredentialSummary } from "@/services/credential.service";
import { EnvVariableSummary } from "@/services/env.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateShareDialog } from "./CreateShareDialog";
import { ShareCreatedDialog } from "./ShareCreatedDialog";
import { EditShareItemsDialog } from "./EditShareItemsDialog";
import { ExtendExpiryDialog } from "./ExtendExpiryDialog";
import { RegeneratePinDialog } from "./RegeneratePinDialog";
import { ShareAccessHistoryDialog } from "./ShareAccessHistoryDialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  revokeShareLinkAction,
  unlockShareLinkAction,
  deleteShareLinkAction,
} from "@/actions/share-link.actions";
import {
  Share2,
  Plus,
  MoreHorizontal,
  Edit,
  Calendar,
  KeyRound,
  Unlock,
  Ban,
  Trash2,
  History,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Eye,
  Infinity as InfinityIcon,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatRelativeTime, formatRelativeFuture, formatFullDate } from "@/lib/date";

interface ShareLinksTabProps {
  projectId: string;
  projectName: string;
  shareLinks: ShareLinkSummary[];
  credentials: CredentialSummary[];
  envVariables: EnvVariableSummary[];
}

export function ShareLinksTab({
  projectId,
  projectName,
  shareLinks,
  credentials,
  envVariables,
}: ShareLinksTabProps) {
  const router = useRouter();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreatedShareLinkResult | null>(null);

  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [activeLink, setActiveLink] = useState<ShareLinkSummary | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "revoked">("all");

  const [editItemsOpen, setEditItemsOpen] = useState(false);
  const [extendExpiryOpen, setExtendExpiryOpen] = useState(false);
  const [regeneratePinOpen, setRegeneratePinOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Confirmation dialogs
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const filteredLinks = useMemo(() => {
    return shareLinks.filter((link) => {
      const matchesSearch = link.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return link.computedStatus === "active";
      if (statusFilter === "expired") return link.computedStatus === "expired" || link.computedStatus === "max_views_reached";
      if (statusFilter === "revoked") return link.computedStatus === "revoked";
      return true;
    });
  }, [shareLinks, searchQuery, statusFilter]);

  const handleCreated = (result: CreatedShareLinkResult) => {
    setCreatedResult(result);
    router.refresh();
  };

  const handleRevoke = async () => {
    if (!activeLinkId) return;
    setIsActionLoading(true);
    try {
      const res = await revokeShareLinkAction(activeLinkId, projectId);
      if (res.success) {
        toast.success("Share link revoked");
        setRevokeOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to revoke share link");
      }
    } catch {
      toast.error("Failed to revoke share link");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!activeLinkId) return;
    setIsActionLoading(true);
    try {
      const res = await unlockShareLinkAction(activeLinkId, projectId);
      if (res.success) {
        toast.success("Share link unlocked");
        setUnlockOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to unlock share link");
      }
    } catch {
      toast.error("Failed to unlock share link");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeLinkId) return;
    setIsActionLoading(true);
    try {
      const res = await deleteShareLinkAction(activeLinkId, projectId);
      if (res.success) {
        toast.success("Share link permanently deleted");
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete share link");
      }
    } catch {
      toast.error("Failed to delete share link");
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (link: ShareLinkSummary) => {
    switch (link.computedStatus) {
      case "active":
        return (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1.5 font-medium text-[11px] py-0.5 px-2.5 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            Active
          </Badge>
        );
      case "locked":
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1.5 font-medium text-[11px] py-0.5 px-2.5 rounded-full">
            <ShieldAlert className="size-3 shrink-0" />
            Locked ({link.failedAttempts} failed)
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="text-muted-foreground border-border/80 bg-muted/40 gap-1.5 font-normal text-[11px] py-0.5 px-2.5 rounded-full">
            <Clock className="size-3 shrink-0 text-muted-foreground" />
            Expired
          </Badge>
        );
      case "max_views_reached":
        return (
          <Badge variant="outline" className="text-muted-foreground border-border/80 bg-muted/40 gap-1.5 font-normal text-[11px] py-0.5 px-2.5 rounded-full">
            <Eye className="size-3 shrink-0 text-muted-foreground" />
            Max Views
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 gap-1.5 font-normal text-[11px] py-0.5 px-2.5 rounded-full">
            <Ban className="size-3 shrink-0" />
            Revoked
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Share2 className="size-4 text-primary" />
            Client Share Links
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create and manage expiring, read-only secret share links protected with a 6-digit PIN.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          Create Share Link
        </Button>
      </div>

      {/* Main Table or Empty State */}
      {shareLinks.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-3 text-primary">
              <Share2 className="size-6" />
            </div>
            <h3 className="text-sm font-medium text-foreground">No share links generated yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Generate a secure link and PIN to allow clients or external partners to view credentials and environment variables without needing an account.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="mt-4 gap-1.5"
            >
              <Plus className="size-4" />
              Generate First Share Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground/70" />
              <Input
                placeholder="Search share links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs bg-muted/20 border-border/70"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Button
                type="button"
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8 text-xs px-2.5"
              >
                All ({shareLinks.length})
              </Button>
              <Button
                type="button"
                variant={statusFilter === "active" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className="h-8 text-xs px-2.5"
              >
                Active ({shareLinks.filter((l) => l.computedStatus === "active").length})
              </Button>
              <Button
                type="button"
                variant={statusFilter === "expired" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("expired")}
                className="h-8 text-xs px-2.5"
              >
                Expired ({shareLinks.filter((l) => l.computedStatus === "expired" || l.computedStatus === "max_views_reached").length})
              </Button>
              <Button
                type="button"
                variant={statusFilter === "revoked" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("revoked")}
                className="h-8 text-xs px-2.5"
              >
                Revoked ({shareLinks.filter((l) => l.computedStatus === "revoked").length})
              </Button>
            </div>
          </div>

          <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/30 border-b border-border/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[260px]">
                    Share Link
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Shared Items
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Views
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Expires
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Last Accessed
                  </TableHead>
                  <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {filteredLinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                      No share links match the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLinks.map((link) => (
                    <TableRow key={link.id} className="text-xs hover:bg-muted/30 transition-colors group">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                            <Share2 className="size-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-foreground text-sm truncate">
                              {link.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="size-3 text-muted-foreground/60" />
                              Created {formatRelativeTime(link.createdAt)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {getStatusBadge(link)}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <Badge variant="secondary" className="text-xs font-mono gap-1.5 bg-muted/60 border border-border/50 px-2.5 py-0.5 rounded-md font-normal">
                          <KeyRound className="size-3 text-primary/70 shrink-0" />
                          <span>{link.itemCount} {link.itemCount === 1 ? "item" : "items"}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                          <Eye className="size-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="text-foreground font-semibold">{link.viewCount}</span>
                          {link.maxViews ? (
                            <span className="text-muted-foreground/60 text-[11px]">/ {link.maxViews}</span>
                          ) : (
                            <span className="text-muted-foreground/40 text-[10px]">views</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {link.neverExpires ? (
                          <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono">
                            <InfinityIcon className="size-3.5 shrink-0" />
                            <span>Never</span>
                          </div>
                        ) : link.expiresAt ? (
                          <div
                            className="inline-flex items-center gap-1.5 text-foreground/80 font-mono"
                            title={formatFullDate(link.expiresAt)}
                          >
                            <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
                            <span>{formatRelativeFuture(link.expiresAt)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {link.lastAccessedAt ? (
                          <div
                            className="inline-flex items-center gap-1.5 text-muted-foreground font-mono"
                            title={formatFullDate(link.lastAccessedAt)}
                          >
                            <Clock className="size-3.5 text-muted-foreground/60 shrink-0" />
                            <span>{formatRelativeTime(link.lastAccessedAt)}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/40 italic">Never</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="size-8 hover:bg-muted" aria-label="Actions">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            }
                          />
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuItem
                          onClick={() => {
                            setActiveLinkId(link.id);
                            setActiveLink(link);
                            setEditItemsOpen(true);
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="size-3.5" />
                          Edit Shared Items
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setActiveLinkId(link.id);
                            setActiveLink(link);
                            setExtendExpiryOpen(true);
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <Calendar className="size-3.5" />
                          Extend Expiration
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setActiveLinkId(link.id);
                            setActiveLink(link);
                            setRegeneratePinOpen(true);
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <KeyRound className="size-3.5" />
                          Regenerate PIN
                        </DropdownMenuItem>

                        {link.computedStatus === "locked" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveLinkId(link.id);
                              setActiveLink(link);
                              setUnlockOpen(true);
                            }}
                            className="gap-2 cursor-pointer text-amber-400"
                          >
                            <Unlock className="size-3.5" />
                            Unlock Link
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => {
                            setActiveLinkId(link.id);
                            setActiveLink(link);
                            setHistoryOpen(true);
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <History className="size-3.5" />
                          Access History
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {link.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveLinkId(link.id);
                              setActiveLink(link);
                              setRevokeOpen(true);
                            }}
                            className="gap-2 cursor-pointer text-destructive"
                          >
                            <Ban className="size-3.5" />
                            Revoke Link
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => {
                            setActiveLinkId(link.id);
                            setActiveLink(link);
                            setDeleteOpen(true);
                          }}
                          className="gap-2 cursor-pointer text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                          Delete Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </Card>
        </div>
      )}

      {/* Dialogs */}
      <CreateShareDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        credentials={credentials}
        envVariables={envVariables}
        onSuccess={handleCreated}
      />

      {createdResult && (
        <ShareCreatedDialog
          open={Boolean(createdResult)}
          onOpenChange={(open) => !open && setCreatedResult(null)}
          token={createdResult.token}
          pin={createdResult.pin}
          label={createdResult.shareLink.label}
        />
      )}

      {activeLinkId && activeLink && (
        <>
          <EditShareItemsDialog
            open={editItemsOpen}
            onOpenChange={setEditItemsOpen}
            shareLinkId={activeLinkId}
            projectId={projectId}
            credentials={credentials}
            envVariables={envVariables}
            onSuccess={() => router.refresh()}
          />

          <ExtendExpiryDialog
            open={extendExpiryOpen}
            onOpenChange={setExtendExpiryOpen}
            shareLinkId={activeLinkId}
            projectId={projectId}
            label={activeLink.label}
            onSuccess={() => router.refresh()}
          />

          <RegeneratePinDialog
            open={regeneratePinOpen}
            onOpenChange={setRegeneratePinOpen}
            shareLinkId={activeLinkId}
            projectId={projectId}
            label={activeLink.label}
            onSuccess={() => router.refresh()}
          />

          <ShareAccessHistoryDialog
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            shareLinkId={activeLinkId}
            label={activeLink.label}
          />

          <ConfirmDialog
            open={revokeOpen}
            onOpenChange={setRevokeOpen}
            title="Revoke Share Link"
            description={`Are you sure you want to revoke "${activeLink.label}"? Anyone using this link or PIN will immediately lose access.`}
            confirmLabel="Revoke Link"
            destructive={true}
            onConfirm={handleRevoke}
            isLoading={isActionLoading}
          />

          <ConfirmDialog
            open={unlockOpen}
            onOpenChange={setUnlockOpen}
            title="Unlock Share Link"
            description={`Unlock "${activeLink.label}"? This will reset the failed PIN attempts counter and allow client authentication attempts again.`}
            confirmLabel="Unlock Link"
            destructive={false}
            onConfirm={handleUnlock}
            isLoading={isActionLoading}
          />

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete Share Link"
            description={`Are you sure you want to permanently delete "${activeLink.label}"? All access logs and associated link data will be removed.`}
            confirmLabel="Delete Link"
            destructive={true}
            onConfirm={handleDelete}
            isLoading={isActionLoading}
          />
        </>
      )}
    </div>
  );
}
