"use client";

import React, { useState, useTransition } from "react";
import { UserProfile, UserRole } from "@/types/database.types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { MoreHorizontal, ShieldCheck, UserX, UserCheck } from "lucide-react";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { setUserStatusAction } from "@/actions/team.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TeamTableProps {
  users: UserProfile[];
  currentUserId: string;
}

export function TeamTable({ users, currentUserId }: TeamTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Dialog state
  const [roleUser, setRoleUser] = useState<UserProfile | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // Status confirm dialog state
  const [statusUser, setStatusUser] = useState<UserProfile | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleRoleClick = (user: UserProfile) => {
    setRoleUser(user);
    setRoleDialogOpen(true);
  };

  const handleStatusClick = (user: UserProfile) => {
    setStatusUser(user);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!statusUser) return;
    const newStatus = statusUser.status === "deactivated" ? "active" : "deactivated";

    setIsUpdatingStatus(true);
    startTransition(async () => {
      const res = await setUserStatusAction({
        userId: statusUser.id,
        status: newStatus,
      });

      setIsUpdatingStatus(false);
      setStatusDialogOpen(false);

      if (res.success) {
        toast.success(`User ${statusUser.email} is now ${newStatus}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      case "developer":
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "invited":
        return "outline";
      case "deactivated":
      default:
        return "destructive";
    }
  };

  return (
    <>
      <div className="rounded-md border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const initials = (user.full_name || user.email)
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const isSelf = user.id === currentUserId;

              return (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="default">
                        <AvatarFallback className="text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <span className="truncate">{user.full_name || "Unnamed Member"}</span>
                          {isSelf && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              You
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize font-normal text-xs">
                      {user.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)} className="capitalize text-xs">
                      {user.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${user.email}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleRoleClick(user)}>
                          <ShieldCheck className="mr-2 size-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant={user.status === "deactivated" ? "default" : "destructive"}
                          disabled={isSelf}
                          onClick={() => handleStatusClick(user)}
                        >
                          {user.status === "deactivated" ? (
                            <>
                              <UserCheck className="mr-2 size-4 text-primary" />
                              Reactivate Account
                            </>
                          ) : (
                            <>
                              <UserX className="mr-2 size-4 text-destructive" />
                              Deactivate Account
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Role Dialog */}
      <ChangeRoleDialog
        user={roleUser}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />

      {/* Deactivate/Reactivate Confirmation Dialog */}
      {statusUser && (
        <ConfirmDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          title={statusUser.status === "deactivated" ? "Reactivate User" : "Deactivate User"}
          description={
            statusUser.status === "deactivated"
              ? `Are you sure you want to reactivate access for ${statusUser.email}? They will be able to sign in again.`
              : `Are you sure you want to deactivate ${statusUser.email}? All active sessions will be terminated immediately, and they will lose access to all vaults.`
          }
          confirmLabel={statusUser.status === "deactivated" ? "Reactivate" : "Deactivate"}
          destructive={statusUser.status !== "deactivated"}
          isLoading={isUpdatingStatus}
          onConfirm={confirmStatusChange}
        />
      )}
    </>
  );
}
