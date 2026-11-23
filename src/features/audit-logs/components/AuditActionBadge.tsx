"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Copy,
  Download,
  Trash2,
  PlusCircle,
  Edit,
  LogIn,
  AlertTriangle,
  ShieldCheck,
  UserPlus,
  ShieldAlert,
  UserX,
  Share2,
} from "lucide-react";

interface AuditActionBadgeProps {
  action: string;
}

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  switch (action) {
    case "reveal":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/40 text-amber-400 bg-amber-500/10 font-mono text-[11px] gap-1"
        >
          <Eye className="size-3" />
          reveal
        </Badge>
      );
    case "copy":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/40 text-blue-400 bg-blue-500/10 font-mono text-[11px] gap-1"
        >
          <Copy className="size-3" />
          copy
        </Badge>
      );
    case "export":
      return (
        <Badge
          variant="outline"
          className="border-purple-500/40 text-purple-400 bg-purple-500/10 font-mono text-[11px] gap-1"
        >
          <Download className="size-3" />
          export
        </Badge>
      );
    case "delete":
      return (
        <Badge
          variant="outline"
          className="border-destructive/40 text-destructive bg-destructive/10 font-mono text-[11px] gap-1"
        >
          <Trash2 className="size-3" />
          delete
        </Badge>
      );
    case "create":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-[11px] gap-1"
        >
          <PlusCircle className="size-3" />
          create
        </Badge>
      );
    case "update":
      return (
        <Badge
          variant="outline"
          className="border-sky-500/40 text-sky-400 bg-sky-500/10 font-mono text-[11px] gap-1"
        >
          <Edit className="size-3" />
          update
        </Badge>
      );
    case "login":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-[11px] gap-1"
        >
          <LogIn className="size-3" />
          login
        </Badge>
      );
    case "failed_login":
      return (
        <Badge
          variant="outline"
          className="border-destructive/40 text-destructive bg-destructive/10 font-mono text-[11px] gap-1"
        >
          <AlertTriangle className="size-3" />
          failed_login
        </Badge>
      );
    case "mfa_verify":
      return (
        <Badge
          variant="outline"
          className="border-indigo-500/40 text-indigo-400 bg-indigo-500/10 font-mono text-[11px] gap-1"
        >
          <ShieldCheck className="size-3" />
          mfa_verify
        </Badge>
      );
    case "invite":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono text-[11px] gap-1"
        >
          <UserPlus className="size-3" />
          invite
        </Badge>
      );
    case "role_change":
      return (
        <Badge
          variant="outline"
          className="border-orange-500/40 text-orange-400 bg-orange-500/10 font-mono text-[11px] gap-1"
        >
          <ShieldAlert className="size-3" />
          role_change
        </Badge>
      );
    case "deactivate":
      return (
        <Badge
          variant="outline"
          className="border-destructive/40 text-destructive bg-destructive/10 font-mono text-[11px] gap-1"
        >
          <UserX className="size-3" />
          deactivate
        </Badge>
      );
    default:
      if (action.startsWith("share.")) {
        return (
          <Badge
            variant="outline"
            className="border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-mono text-[11px] gap-1"
          >
            <Share2 className="size-3" />
            {action}
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="font-mono text-[11px]">
          {action}
        </Badge>
      );
  }
}
