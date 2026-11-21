"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProjectDetail } from "@/services/project.service";
import { UserProfile, UserRole, Client } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProjectMembersTab } from "./ProjectMembersTab";
import { ProjectCredentialsTab } from "@/features/credentials/components/ProjectCredentialsTab";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { archiveProjectAction } from "@/actions/project.actions";
import { CredentialSummary } from "@/services/credential.service";
import {
  FolderLock,
  Building2,
  ArrowLeft,
  Edit2,
  Globe,
  GitBranch,
  KeyRound,
  FileCode2,
  Users,
  Info,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Server,
  Code2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectDetailViewProps {
  detail: ProjectDetail;
  allUsers: UserProfile[];
  clients: Pick<Client, "id" | "name">[];
  initialCredentials?: CredentialSummary[];
  userRole: UserRole;
}

export function ProjectDetailView({
  detail,
  allUsers,
  clients,
  initialCredentials = [],
  userRole,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const { project, client, members, credentials_count, env_count } = detail;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const canManage = userRole === "admin" || userRole === "manager";

  const handleArchive = async () => {
    setIsArchiving(true);
    const newArchived = !project.is_archived;
    const res = await archiveProjectAction({
      id: project.id,
      isArchived: newArchived,
    });
    setIsArchiving(false);
    setArchiveDialogOpen(false);

    if (res.success) {
      toast.success(
        newArchived
          ? `Project "${project.name}" archived.`
          : `Project "${project.name}" restored.`
      );
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb-like back action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            render={<Link href="/projects" />}
            aria-label="Back to Projects"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {project.name}
              </h1>
              <Badge variant={project.is_archived ? "outline" : "default"}>
                {project.is_archived ? "Archived" : "Active"}
              </Badge>
              <Link
                href={`/clients/${client.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Building2 className="size-3" />
                {client.name}
              </Link>
            </div>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {project.live_url && (
            <Button variant="outline" size="sm" render={<a href={project.live_url} target="_blank" rel="noreferrer" />}>
              <Globe className="mr-1.5 size-3.5" />
              Live Site
            </Button>
          )}

          {project.repo_url && (
            <Button variant="outline" size="sm" render={<a href={project.repo_url} target="_blank" rel="noreferrer" />}>
              <GitBranch className="mr-1.5 size-3.5" />
              Repo
            </Button>
          )}

          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Edit2 className="mr-1.5 size-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveDialogOpen(true)}
                className={project.is_archived ? "" : "text-destructive hover:bg-destructive/10"}
              >
                {project.is_archived ? (
                  <>
                    <ArchiveRestore className="mr-1.5 size-3.5" />
                    Restore
                  </>
                ) : (
                  <>
                    <Archive className="mr-1.5 size-3.5" />
                    Archive
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid">
          <TabsTrigger value="credentials" className="gap-2">
            <KeyRound className="size-4" />
            <span>Credentials</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
              {initialCredentials.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="env" className="gap-2">
            <FileCode2 className="size-4" />
            <span>Env Variables</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
              {env_count}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" />
            <span>Team Members</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
              {members.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="overview" className="gap-2">
            <Info className="size-4" />
            <span>Project Info</span>
          </TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-4">
          <ProjectCredentialsTab
            projectId={project.id}
            projectName={project.name}
            credentials={initialCredentials}
            userRole={userRole}
          />
        </TabsContent>

        {/* Environment Variables Tab */}
        <TabsContent value="env" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Environment Variables (.env)</CardTitle>
                  <CardDescription>
                    Per-environment secret keys and configs for Development, Staging, and Production.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-dashed p-8 text-center bg-muted/20">
                <FileCode2 className="mx-auto size-9 text-muted-foreground/60 mb-3" />
                <h4 className="text-sm font-semibold text-foreground">
                  Environment Manager ({env_count} variables stored)
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                  Full .env bulk import/export, environment switching (Dev, Staging, Prod), and reveal protection are coming in Phase 10.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardContent className="pt-6">
              <ProjectMembersTab
                projectId={project.id}
                projectName={project.name}
                members={members}
                allUsers={allUsers}
                userRole={userRole}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Info / Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Platform & Stack Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="size-4 text-muted-foreground" />
                  Infrastructure & Hosting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Hosting Platform</span>
                  <span className="font-medium text-foreground">
                    {project.hosting_info || "Not specified"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Tech Stack</span>
                  <span className="font-medium text-foreground">
                    {project.tech_stack || "Not specified"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Live Website URL</span>
                  {project.live_url ? (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs"
                    >
                      {project.live_url}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Repository URL</span>
                  {project.repo_url ? (
                    <a
                      href={project.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs"
                    >
                      {project.repo_url}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client & Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  Client Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Client Organization</span>
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {client.name}
                    <ExternalLink className="size-3" />
                  </Link>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Primary Contact</span>
                  <span className="text-foreground">
                    {client.contact_person || "—"}{" "}
                    {client.contact_email && (
                      <span className="text-muted-foreground text-xs">({client.contact_email})</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Created Date</span>
                  <span className="text-foreground inline-flex items-center gap-1.5 text-xs">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    {new Date(project.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Project ID</span>
                  <span className="font-mono text-xs text-muted-foreground select-all">
                    {project.id}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      {canManage && (
        <ProjectFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={project}
          clients={clients}
        />
      )}

      {/* Archive / Restore Confirmation Dialog */}
      {canManage && (
        <ConfirmDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          title={project.is_archived ? "Restore Project" : "Archive Project"}
          description={
            project.is_archived
              ? `Are you sure you want to restore "${project.name}"? It will reappear in active project lists.`
              : `Are you sure you want to archive "${project.name}"? It will be hidden from active lists, but its credentials and environment variables remain safely stored.`
          }
          confirmLabel={project.is_archived ? "Restore Project" : "Archive Project"}
          destructive={!project.is_archived}
          isLoading={isArchiving}
          onConfirm={handleArchive}
        />
      )}
    </div>
  );
}
