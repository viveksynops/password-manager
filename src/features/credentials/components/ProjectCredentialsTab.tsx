"use client";

import React, { useMemo, useState, useTransition } from "react";
import { CredentialSummary } from "@/services/credential.service";
import { UserRole } from "@/types/database.types";
import { SecretField } from "@/components/secret-field";
import { CredentialFormDialog } from "./CredentialFormDialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  KeyRound,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  MoreHorizontal,
  Info,
} from "lucide-react";
import { deleteCredentialAction } from "@/actions/credential.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectCredentialsTabProps {
  projectId: string;
  projectName: string;
  credentials: CredentialSummary[];
  userRole: UserRole;
}

export function ProjectCredentialsTab({
  projectId,
  projectName,
  credentials,
  userRole,
}: ProjectCredentialsTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUsernameId, setCopiedUsernameId] = useState<string | null>(null);

  // Add / Edit Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<CredentialSummary | null>(null);

  // Delete Confirm state
  const [deleteTarget, setDeleteTarget] = useState<CredentialSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = userRole === "admin" || userRole === "manager";

  const filteredCredentials = useMemo(() => {
    if (!searchQuery.trim()) return credentials;
    const query = searchQuery.toLowerCase().trim();
    return credentials.filter(
      (c) =>
        c.service_name.toLowerCase().includes(query) ||
        c.username.toLowerCase().includes(query) ||
        (c.notes && c.notes.toLowerCase().includes(query))
    );
  }, [credentials, searchQuery]);

  const handleCopyUsername = async (id: string, username: string) => {
    try {
      await navigator.clipboard.writeText(username);
      setCopiedUsernameId(id);
      setTimeout(() => setCopiedUsernameId(null), 2000);
      toast.success("Username copied to clipboard.");
    } catch {
      toast.error("Failed to copy username.");
    }
  };

  const handleEdit = (cred: CredentialSummary) => {
    setEditingCredential(cred);
    setDialogOpen(true);
  };

  const handleDeleteClick = (cred: CredentialSummary) => {
    setDeleteTarget(cred);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    startTransition(async () => {
      const res = await deleteCredentialAction({
        id: deleteTarget.id,
        projectId,
      });

      setIsDeleting(false);
      setDeleteDialogOpen(false);

      if (res.success) {
        toast.success(`Credential "${deleteTarget.service_name}" deleted.`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search service logins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          onClick={() => {
            setEditingCredential(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Add Credential
        </Button>
      </div>

      {/* Credentials Table / List */}
      {filteredCredentials.length === 0 ? (
        credentials.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No credentials saved yet"
            description="Securely store service logins, admin portals, and API dashboard accounts for this project."
            action={{
              label: "Add First Credential",
              onClick: () => {
                setEditingCredential(null);
                setDialogOpen(true);
              },
            }}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matching credentials"
            description="No saved credentials match your search query."
            action={{
              label: "Clear Search",
              onClick: () => setSearchQuery(""),
            }}
          />
        )
      ) : (
        <div className="rounded-md border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Service</TableHead>
                <TableHead>Username / Email</TableHead>
                <TableHead className="w-[240px]">Password</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredentials.map((cred) => (
                <TableRow key={cred.id} className="hover:bg-muted/50 transition-colors">
                  {/* Service Name & Site Link */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm">
                        {cred.service_name}
                      </span>
                      {cred.login_url && (
                        <a
                          href={cred.login_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs text-primary hover:underline mt-0.5"
                          title="Open login site (TASK-085)"
                        >
                          Open site
                          <ExternalLink className="ml-1 size-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>

                  {/* Username with Copy Button */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-foreground/90 select-all">
                        {cred.username}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopyUsername(cred.id, cred.username)}
                        aria-label="Copy username"
                        title="Copy username"
                      >
                        {copiedUsernameId === cred.id ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>

                  {/* Password with SecretField (Reveal/Copy/Auto-hide/Timer) */}
                  <TableCell>
                    <SecretField credentialId={cred.id} projectId={projectId} />
                  </TableCell>

                  {/* Notes */}
                  <TableCell className="text-xs text-muted-foreground max-w-xs">
                    {cred.notes ? (
                      <span className="line-clamp-2" title={cred.notes}>
                        {cred.notes}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${cred.service_name}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {cred.login_url && (
                          <DropdownMenuItem
                            render={<a href={cred.login_url} target="_blank" rel="noreferrer" />}
                          >
                            <ExternalLink className="mr-2 size-4" />
                            Open Site
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => handleEdit(cred)}>
                          <Edit2 className="mr-2 size-4" />
                          Edit Credential
                        </DropdownMenuItem>

                        {canManage && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(cred)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete Credential
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Credential Dialog */}
      <CredentialFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        credential={editingCredential}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Credential"
          description={`Are you sure you want to permanently delete the login for "${deleteTarget.service_name}"? This action cannot be undone.`}
          confirmLabel="Delete Credential"
          destructive
          isLoading={isDeleting}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
