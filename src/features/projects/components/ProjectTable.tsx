"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { ProjectWithDetails } from "@/services/project.service";
import { UserRole, Client } from "@/types/database.types";
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
  FolderLock,
  MoreHorizontal,
  Building2,
  Users,
  KeyRound,
  FileCode2,
  Edit2,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Globe,
  GitBranch,
} from "lucide-react";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { archiveProjectAction } from "@/actions/project.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectTableProps {
  projects: ProjectWithDetails[];
  userRole: UserRole;
  clients: Pick<Client, "id" | "name">[];
}

export function ProjectTable({ projects, userRole, clients }: ProjectTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Edit dialog state
  const [editingProject, setEditingProject] = useState<ProjectWithDetails | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Archive dialog state
  const [archiveTarget, setArchiveTarget] = useState<ProjectWithDetails | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const canManage = userRole === "admin" || userRole === "manager";

  const handleEdit = (project: ProjectWithDetails) => {
    setEditingProject(project);
    setEditDialogOpen(true);
  };

  const handleArchiveClick = (project: ProjectWithDetails) => {
    setArchiveTarget(project);
    setArchiveDialogOpen(true);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    const newArchivedState = !archiveTarget.is_archived;

    setIsArchiving(true);
    startTransition(async () => {
      const res = await archiveProjectAction({
        id: archiveTarget.id,
        isArchived: newArchivedState,
      });

      setIsArchiving(false);
      setArchiveDialogOpen(false);

      if (res.success) {
        toast.success(
          newArchivedState
            ? `Project "${archiveTarget.name}" archived.`
            : `Project "${archiveTarget.name}" restored.`
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
            <TableRow>
              <TableHead className="w-[280px]">Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Platform / Stack</TableHead>
              <TableHead className="text-center">Team</TableHead>
              <TableHead className="text-center">Vault</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((proj) => (
              <TableRow key={proj.id} className="hover:bg-muted/50 transition-colors">
                {/* Project Name & Description */}
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors group"
                    >
                      <FolderLock className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <span className="truncate">{proj.name}</span>
                    </Link>
                    {proj.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {proj.description}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Client Link */}
                <TableCell>
                  <Link
                    href={`/clients/${proj.client_id}`}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Building2 className="size-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors shrink-0" />
                    <span className="truncate max-w-[140px]">{proj.client_name}</span>
                  </Link>
                </TableCell>

                {/* Platform / Tech Stack */}
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex flex-col truncate max-w-[180px]">
                    <span className="font-medium text-foreground/90">{proj.hosting_info || "—"}</span>
                    {proj.tech_stack && (
                      <span className="text-[11px] text-muted-foreground/80 truncate">
                        {proj.tech_stack}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Team Members Count */}
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    {proj.member_count}
                  </span>
                </TableCell>

                {/* Vault Summary (Credentials & Env) */}
                <TableCell className="text-center">
                  <div className="inline-flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1" title="Credentials">
                      <KeyRound className="size-3.5 text-muted-foreground/70" />
                      {proj.credentials_count}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Environment Variables">
                      <FileCode2 className="size-3.5 text-muted-foreground/70" />
                      {proj.env_count}
                    </span>
                  </div>
                </TableCell>

                {/* Status Badge */}
                <TableCell>
                  <Badge variant={proj.is_archived ? "outline" : "default"}>
                    {proj.is_archived ? "Archived" : "Active"}
                  </Badge>
                </TableCell>

                {/* Row Actions Dropdown */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${proj.name}`}
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={<Link href={`/projects/${proj.id}`} />}
                      >
                        <ExternalLink className="mr-2 size-4" />
                        Open Project
                      </DropdownMenuItem>

                      {proj.live_url && (
                        <DropdownMenuItem
                          render={
                            <a
                              href={proj.live_url}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          <Globe className="mr-2 size-4" />
                          Visit Live URL
                        </DropdownMenuItem>
                      )}

                      {proj.repo_url && (
                        <DropdownMenuItem
                          render={
                            <a
                              href={proj.repo_url}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          <GitBranch className="mr-2 size-4" />
                          View Repository
                        </DropdownMenuItem>
                      )}

                      {canManage && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(proj)}>
                            <Edit2 className="mr-2 size-4" />
                            Edit Project
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleArchiveClick(proj)}
                            className={
                              proj.is_archived
                                ? "text-foreground"
                                : "text-destructive focus:text-destructive"
                            }
                          >
                            {proj.is_archived ? (
                              <>
                                <ArchiveRestore className="mr-2 size-4" />
                                Restore Project
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 size-4" />
                                Archive Project
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

      {/* Edit Project Dialog */}
      {canManage && (
        <ProjectFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={editingProject}
          clients={clients}
        />
      )}

      {/* Archive / Restore Confirmation Dialog */}
      {archiveTarget && (
        <ConfirmDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          title={archiveTarget.is_archived ? "Restore Project" : "Archive Project"}
          description={
            archiveTarget.is_archived
              ? `Are you sure you want to restore "${archiveTarget.name}"? It will become visible in active project listings.`
              : `Are you sure you want to archive "${archiveTarget.name}"? Its credentials and environment variables will remain safely stored but hidden from active lists.`
          }
          confirmLabel={archiveTarget.is_archived ? "Restore Project" : "Archive Project"}
          destructive={!archiveTarget.is_archived}
          isLoading={isArchiving}
          onConfirm={confirmArchive}
        />
      )}
    </>
  );
}
