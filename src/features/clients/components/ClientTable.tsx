"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { ClientWithProjectCount } from "@/services/client.service";
import { UserRole } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  MoreHorizontal,
  FolderLock,
  Edit2,
  Archive,
  ArchiveRestore,
  ExternalLink,
} from "lucide-react";
import { ClientFormDialog } from "./ClientFormDialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { archiveClientAction } from "@/actions/client.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClientTableProps {
  clients: ClientWithProjectCount[];
  userRole: UserRole;
}

export function ClientTable({ clients, userRole }: ClientTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Edit dialog state
  const [editingClient, setEditingClient] = useState<ClientWithProjectCount | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Archive dialog state
  const [archiveClientTarget, setArchiveClientTarget] = useState<ClientWithProjectCount | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const canManage = userRole === "admin" || userRole === "manager";

  const handleEdit = (client: ClientWithProjectCount) => {
    setEditingClient(client);
    setEditDialogOpen(true);
  };

  const handleArchiveClick = (client: ClientWithProjectCount) => {
    setArchiveClientTarget(client);
    setArchiveDialogOpen(true);
  };

  const confirmArchive = async () => {
    if (!archiveClientTarget) return;
    const newArchivedState = !archiveClientTarget.is_archived;

    setIsArchiving(true);
    startTransition(async () => {
      const res = await archiveClientAction({
        id: archiveClientTarget.id,
        isArchived: newArchivedState,
      });

      setIsArchiving(false);
      setArchiveDialogOpen(false);

      if (res.success) {
        toast.success(
          newArchivedState
            ? `Client "${archiveClientTarget.name}" archived.`
            : `Client "${archiveClientTarget.name}" restored.`
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <div className="rounded-md border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Client Organization</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Building2 className="size-4" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {client.name}
                      </span>
                      {client.notes && (
                        <span className="text-xs text-muted-foreground truncate max-w-xs">
                          {client.notes}
                        </span>
                      )}
                    </div>
                  </Link>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col text-xs truncate">
                    <span className="font-medium text-foreground truncate">
                      {client.contact_person || "—"}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {client.contact_email || client.contact_phone || "No contact info"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <Link
                    href={`/clients/${client.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FolderLock className="size-3.5" />
                    <span>
                      {client.project_count}{" "}
                      {client.project_count === 1 ? "project" : "projects"}
                    </span>
                  </Link>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={client.is_archived ? "outline" : "default"}
                    className="text-xs capitalize"
                  >
                    {client.is_archived ? "Archived" : "Active"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${client.name}`}
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
                        <ExternalLink className="mr-2 size-4" />
                        View Projects
                      </DropdownMenuItem>
                      {canManage && (
                        <>
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Edit2 className="mr-2 size-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant={client.is_archived ? "default" : "destructive"}
                            onClick={() => handleArchiveClick(client)}
                          >
                            {client.is_archived ? (
                              <>
                                <ArchiveRestore className="mr-2 size-4 text-primary" />
                                Restore Client
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 size-4 text-destructive" />
                                Archive Client
                              </>
                            )}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Client Dialog */}
      <ClientFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={editingClient}
      />

      {/* Archive / Restore Confirmation */}
      {archiveClientTarget && (
        <ConfirmDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          title={
            archiveClientTarget.is_archived
              ? "Restore Client Organization"
              : "Archive Client Organization"
          }
          description={
            archiveClientTarget.is_archived
              ? `Restore "${archiveClientTarget.name}" to active status? Its projects and secrets will be accessible in active filters again.`
              : `Are you sure you want to archive "${archiveClientTarget.name}"? It will be hidden from default project listings.`
          }
          confirmLabel={archiveClientTarget.is_archived ? "Restore" : "Archive"}
          destructive={!archiveClientTarget.is_archived}
          isLoading={isArchiving}
          onConfirm={confirmArchive}
        />
      )}
    </>
  );
}
