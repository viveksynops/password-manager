"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientWithProjects } from "@/services/client.service";
import { UserRole } from "@/types/database.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import {
  Building2,
  Mail,
  Phone,
  User,
  FolderLock,
  ArrowLeft,
  Edit2,
  ExternalLink,
  GitBranch,
  Globe,
} from "lucide-react";
import { ClientFormDialog } from "./ClientFormDialog";

interface ClientDetailViewProps {
  client: ClientWithProjects;
  userRole: UserRole;
}

export function ClientDetailView({ client, userRole }: ClientDetailViewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const canManage = userRole === "admin" || userRole === "manager";

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" render={<Link href="/clients" />} aria-label="Back to Clients">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {client.name}
              </h1>
              <Badge variant={client.is_archived ? "outline" : "default"}>
                {client.is_archived ? "Archived" : "Active"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client ID: <span className="font-mono">{client.id}</span>
            </p>
          </div>
        </div>

        {canManage && (
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit2 className="mr-2 size-4" />
            Edit Client
          </Button>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Primary Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Name</span>
              <span className="font-medium text-foreground">
                {client.contact_person || "Not specified"}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block">Email</span>
              {client.contact_email ? (
                <a
                  href={`mailto:${client.contact_email}`}
                  className="inline-flex items-center text-primary hover:underline"
                >
                  <Mail className="mr-1.5 size-3.5" />
                  {client.contact_email}
                </a>
              ) : (
                <span className="text-muted-foreground">Not specified</span>
              )}
            </div>

            <div>
              <span className="text-xs text-muted-foreground block">Phone</span>
              {client.contact_phone ? (
                <a
                  href={`tel:${client.contact_phone}`}
                  className="inline-flex items-center text-primary hover:underline"
                >
                  <Phone className="mr-1.5 size-3.5" />
                  {client.contact_phone}
                </a>
              ) : (
                <span className="text-muted-foreground">Not specified</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Organization Notes
            </CardTitle>
            <CardDescription>
              Internal notes and instructions regarding this client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {client.notes ? (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {client.notes}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No internal notes recorded for this client.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client's Projects Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Client Projects ({client.projects.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              All applications, repos, and secret vaults associated with {client.name}.
            </p>
          </div>
        </div>

        {client.projects.length > 0 ? (
          <div className="rounded-md border bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Project Name</TableHead>
                  <TableHead>Hosting / Stack</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Vault</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.projects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-2.5 font-medium text-foreground hover:text-primary transition-colors group"
                      >
                        <FolderLock className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>{project.name}</span>
                      </Link>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex flex-col truncate">
                        <span>{project.hosting_info || "—"}</span>
                        {project.tech_stack && (
                          <span className="text-[11px] text-muted-foreground/80 truncate">
                            {project.tech_stack}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        {project.live_url && (
                          <a
                            href={project.live_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                            title="Live URL"
                          >
                            <Globe className="size-3.5 mr-1" />
                            Live
                          </a>
                        )}
                        {project.repo_url && (
                          <a
                            href={project.repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                            title="Repository URL"
                          >
                            <GitBranch className="size-3.5 mr-1" />
                            Repo
                          </a>
                        )}
                        {!project.live_url && !project.repo_url && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={project.is_archived ? "outline" : "default"}
                        className="text-xs capitalize"
                      >
                        {project.is_archived ? "Archived" : "Active"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/projects/${project.id}`} />}
                      >
                        Open
                        <ExternalLink className="ml-1 size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={FolderLock}
            title="No projects under this client"
            description="Projects organize credentials, environment secrets, and developer permissions."
            action={{
              label: "Browse Projects",
              href: "/projects",
            }}
          />
        )}
      </div>

      {/* Edit Client Dialog */}
      {canManage && (
        <ClientFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          client={client}
        />
      )}
    </div>
  );
}
