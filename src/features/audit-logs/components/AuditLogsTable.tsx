"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RelativeTimeTooltip } from "./RelativeTimeTooltip";
import { AuditActionBadge } from "./AuditActionBadge";
import { AuditMetadataDialog } from "./AuditMetadataDialog";
import { AuditLogWithDetails } from "@/services/audit.service";
import { Code2, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";

interface AuditLogsTableProps {
  logs: AuditLogWithDetails[];
}

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDetails = (log: AuditLogWithDetails) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  const getTargetDescription = (log: AuditLogWithDetails) => {
    const meta = (log.metadata || {}) as Record<string, any>;
    if (log.target_type === "credential" && meta.serviceName) {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-xs">{meta.serviceName}</span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {meta.username ? `(${meta.username})` : "credential"}
          </span>
        </div>
      );
    }
    if (log.target_type === "env_variable" && meta.key) {
      return (
        <div className="flex flex-col">
          <span className="font-mono font-semibold text-foreground text-xs">{meta.key}</span>
          <span className="text-[11px] text-muted-foreground capitalize">
            {meta.environment ? `${meta.environment} env` : "env_variable"}
          </span>
        </div>
      );
    }
    if (log.target_type === "project" && meta.name) {
      return (
        <span className="font-medium text-foreground text-xs">{meta.name}</span>
      );
    }
    if (log.target_type === "client" && meta.name) {
      return (
        <span className="font-medium text-foreground text-xs">{meta.name}</span>
      );
    }
    if (log.target_type === "user" && meta.targetEmail) {
      return (
        <span className="font-medium text-foreground text-xs">{meta.targetEmail}</span>
      );
    }
    return (
      <Badge variant="outline" className="font-mono text-[11px]">
        {log.target_type}
      </Badge>
    );
  };

  return (
    <>
      <div className="rounded-md border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[18%] min-w-[140px] pl-4">Timestamp</TableHead>
              <TableHead className="w-[24%] min-w-[180px]">Actor</TableHead>
              <TableHead className="w-[14%] min-w-[110px]">Action</TableHead>
              <TableHead className="w-[20%] min-w-[160px]">Target Resource</TableHead>
              <TableHead className="w-[16%] min-w-[130px]">Project</TableHead>
              <TableHead className="w-[8%] min-w-[80px] text-right pr-4">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/50 transition-colors h-14">
                {/* Timestamp with RelativeTime & Hover Tooltip */}
                <TableCell className="pl-4">
                  <RelativeTimeTooltip timestamp={log.created_at} />
                </TableCell>

                {/* Actor Email / Name + IP Address */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground text-xs truncate max-w-[180px]">
                      {log.user_email || log.user_name || "System Actor"}
                    </span>
                    {log.ip_address && (
                      <span className="font-mono text-[10px] text-muted-foreground/70">
                        {log.ip_address}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Action Badge */}
                <TableCell>
                  <AuditActionBadge action={log.action} />
                </TableCell>

                {/* Target Resource */}
                <TableCell>
                  {getTargetDescription(log)}
                </TableCell>

                {/* Project */}
                <TableCell>
                  {log.project_name && log.project_id ? (
                    <Link
                      href={`/projects/${log.project_id}`}
                      className="text-xs text-foreground/90 hover:text-primary transition-colors underline decoration-dotted decoration-muted-foreground/40 underline-offset-4 truncate block max-w-[140px]"
                      title={log.project_name}
                    >
                      {log.project_name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </TableCell>

                {/* Metadata JSON Inspector */}
                <TableCell className="text-right pr-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenDetails(log)}
                    aria-label={`View metadata for log ${log.id}`}
                  >
                    <Code2 className="mr-1 size-3.5" />
                    Inspect
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AuditMetadataDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        log={selectedLog}
      />
    </>
  );
}
