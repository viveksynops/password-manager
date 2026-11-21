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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Copy, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { SecretField } from "@/components/secret-field";
import { EnvVariableSummary } from "@/services/env.service";
import { UserRole, Environment } from "@/types/database.types";
import { toast } from "sonner";

interface EnvVariablesTableProps {
  variables: EnvVariableSummary[];
  projectId: string;
  userRole: UserRole;
  onEdit: (variable: EnvVariableSummary) => void;
  onDelete: (variable: EnvVariableSummary) => void;
}

export function EnvVariablesTable({
  variables,
  projectId,
  userRole,
  onEdit,
  onDelete,
}: EnvVariablesTableProps) {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const canManage = userRole === "admin" || userRole === "manager";

  const handleCopyKey = async (id: string, keyName: string) => {
    try {
      await navigator.clipboard.writeText(keyName);
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 2000);
      toast.success(`Copied key "${keyName}" to clipboard.`);
    } catch {
      toast.error("Failed to copy key.");
    }
  };

  const getEnvBadge = (env: Environment) => {
    switch (env) {
      case "development":
        return (
          <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Dev
          </Badge>
        );
      case "staging":
        return (
          <Badge variant="outline" className="text-[11px] font-mono border-amber-500/30 text-amber-400 bg-amber-500/10">
            Staging
          </Badge>
        );
      case "production":
        return (
          <Badge variant="outline" className="text-[11px] font-mono border-rose-500/30 text-rose-400 bg-rose-500/10">
            Prod
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-md border bg-card overflow-hidden shadow-xs w-full max-w-full min-w-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[34%] min-w-[220px] pl-4">Variable Key</TableHead>
            <TableHead className="w-[34%] min-w-[240px]">Value</TableHead>
            <TableHead className="w-[14%] min-w-[100px]">Environment</TableHead>
            <TableHead className="w-[12%] min-w-[110px]">Updated</TableHead>
            <TableHead className="w-[6%] min-w-[60px] text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variables.map((v) => (
            <TableRow key={v.id} className="hover:bg-muted/50 transition-colors h-14">
              {/* Variable Key with 1-click copy */}
              <TableCell className="pl-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-foreground select-all">
                    {v.key}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => handleCopyKey(v.id, v.key)}
                    aria-label={`Copy key ${v.key}`}
                    title="Copy variable key"
                  >
                    {copiedKeyId === v.id ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </TableCell>

              {/* SecretField for Value (TASK-095) */}
              <TableCell>
                <SecretField
                  envVariableId={v.id}
                  projectId={projectId}
                  label="Variable"
                />
              </TableCell>

              {/* Environment Badge */}
              <TableCell>
                {getEnvBadge(v.environment)}
              </TableCell>

              {/* Last Updated Date */}
              <TableCell className="text-xs text-muted-foreground font-mono">
                {new Date(v.updated_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>

              {/* Actions Dropdown */}
              <TableCell className="text-right pr-4">
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${v.key}`}
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyKey(v.id, v.key)}>
                        <Copy className="mr-2 size-4" />
                        Copy Key Name
                      </DropdownMenuItem>

                      {canManage && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(v)}>
                            <Edit2 className="mr-2 size-4" />
                            Edit Variable
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(v)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete Variable
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
