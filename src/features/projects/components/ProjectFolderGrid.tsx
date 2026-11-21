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
  FolderLock,
  MoreVertical,
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
  ChevronRight,
  Star,
} from "lucide-react";
import { useFavoritesStore } from "@/features/favorites/store";
import { ProjectEditSheet } from "./ProjectEditSheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { archiveProjectAction } from "@/actions/project.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectFolderGridProps {
  projects: ProjectWithDetails[];
  userRole: UserRole;
  clients: Pick<Client, "id" | "name">[];
}

export function ProjectFolderGrid({ projects, userRole, clients }: ProjectFolderGridProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { isProjectFavorited, toggleProjectFavorite } = useFavoritesStore();

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="group relative flex flex-col justify-between rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md dark:hover:border-primary/40 hover:-translate-y-0.5"
          >
            {/* Top row: Folder icon, Status badge, Dropdown menu */}
            <div className="flex items-center justify-between">
              <Link
                href={`/projects/${proj.id}`}
                className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 shadow-2xs"
                aria-label={`Open folder ${proj.name}`}
              >
                <FolderLock className="size-6" />
              </Link>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`size-7 ${isProjectFavorited(proj.id) ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground/40 hover:text-foreground"}`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleProjectFavorite(proj.id);
                  }}
                  aria-label={isProjectFavorited(proj.id) ? "Remove from favorites" : "Add to favorites"}
                  title={isProjectFavorited(proj.id) ? "Favorited" : "Add to favorites"}
                >
                  <Star className={`size-3.5 ${isProjectFavorited(proj.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                </Button>

                <Badge variant={proj.is_archived ? "outline" : "default"} className="text-[11px] px-2 py-0">
                  {proj.is_archived ? "Archived" : "Active"}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        aria-label={`Options for ${proj.name}`}
                      />
                    }
                  >
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link href={`/projects/${proj.id}`} />}>
                      <ExternalLink className="mr-2 size-4" />
                      Open Folder
                    </DropdownMenuItem>

                    {proj.live_url && (
                      <DropdownMenuItem render={<a href={proj.live_url} target="_blank" rel="noreferrer" />}>
                        <Globe className="mr-2 size-4" />
                        Visit Live Site
                      </DropdownMenuItem>
                    )}

                    {proj.repo_url && (
                      <DropdownMenuItem render={<a href={proj.repo_url} target="_blank" rel="noreferrer" />}>
                        <GitBranch className="mr-2 size-4" />
                        View Repository
                      </DropdownMenuItem>
                    )}

                    {canManage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(proj)}>
                          <Edit2 className="mr-2 size-4" />
                          Edit Folder Info
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
                              Restore Folder
                            </>
                          ) : (
                            <>
                              <Archive className="mr-2 size-4" />
                              Archive Folder
                            </>
                          )}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Middle: Project (Folder) Name & Client Path */}
            <div className="mt-3.5 mb-3">
              <Link
                href={`/projects/${proj.id}`}
                className="block font-semibold text-foreground text-base tracking-tight truncate hover:underline group-hover:text-primary transition-colors"
                title={proj.name}
              >
                {proj.name}
              </Link>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
                <Building2 className="size-3 text-muted-foreground/70 shrink-0" />
                <span className="truncate">{proj.client_name}</span>
              </div>

              {(proj.hosting_info || proj.tech_stack) && (
                <p className="text-[11px] text-muted-foreground/75 truncate mt-1">
                  {proj.hosting_info || proj.tech_stack}
                </p>
              )}
            </div>

            {/* Bottom Row: Vault & Members counts, Open folder link */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1" title="Credentials">
                  <KeyRound className="size-3.5 text-muted-foreground/80" />
                  {proj.credentials_count}
                </span>

                <span className="inline-flex items-center gap-1" title="Environment Variables">
                  <FileCode2 className="size-3.5 text-muted-foreground/80" />
                  {proj.env_count}
                </span>

                <span className="inline-flex items-center gap-1" title="Team Members">
                  <Users className="size-3.5 text-muted-foreground/80" />
                  {proj.member_count}
                </span>
              </div>

              <Link
                href={`/projects/${proj.id}`}
                className="inline-flex items-center text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors"
              >
                Open
                <ChevronRight className="size-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Project Slide-Over Sheet (Right Side) */}
      {canManage && (
        <ProjectEditSheet
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
          title={archiveTarget.is_archived ? "Restore Project Folder" : "Archive Project Folder"}
          description={
            archiveTarget.is_archived
              ? `Are you sure you want to restore "${archiveTarget.name}"? It will reappear in active folder listings.`
              : `Are you sure you want to archive "${archiveTarget.name}"? Its credentials and environment variables will remain safely stored but hidden from active folders.`
          }
          confirmLabel={archiveTarget.is_archived ? "Restore Folder" : "Archive Folder"}
          destructive={!archiveTarget.is_archived}
          isLoading={isArchiving}
          onConfirm={confirmArchive}
        />
      )}
    </>
  );
}
