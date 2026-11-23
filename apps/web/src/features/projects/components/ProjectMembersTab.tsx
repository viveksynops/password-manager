"use client";

import React, { useState, useTransition } from "react";
import { ProjectMemberWithProfile } from "@/services/project.service";
import { UserProfile, UserRole } from "@/types/database.types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Users, UserPlus, UserMinus, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import {
  assignProjectMemberAction,
  removeProjectMemberAction,
} from "@/actions/project.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectMembersTabProps {
  projectId: string;
  projectName: string;
  members: ProjectMemberWithProfile[];
  allUsers: UserProfile[];
  userRole: UserRole;
}

export function ProjectMembersTab({
  projectId,
  projectName,
  members,
  allUsers,
  userRole,
}: ProjectMembersTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Add Member Dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Remove Member Confirm state
  const [removeTarget, setRemoveTarget] = useState<ProjectMemberWithProfile | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const canManage = userRole === "admin" || userRole === "manager";

  // Filter out users already assigned to this project
  const assignedUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter(
    (u) => !assignedUserIds.has(u.id) && u.status === "active"
  );

  const handleAssignMember = () => {
    if (!selectedUserId) {
      toast.error("Please select a team member.");
      return;
    }

    startTransition(async () => {
      const res = await assignProjectMemberAction({
        projectId,
        userId: selectedUserId,
      });

      if (res.success) {
        toast.success("Team member assigned to project.");
        setAssignDialogOpen(false);
        setSelectedUserId("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;

    setIsRemoving(true);
    startTransition(async () => {
      const res = await removeProjectMemberAction({
        projectId,
        userId: removeTarget.user_id,
      });

      setIsRemoving(false);
      setRemoveDialogOpen(false);

      if (res.success) {
        toast.success("Team member removed from project.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const getRoleBadgeVariant = (role?: UserRole) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Assign Button */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Project Team Members</h3>
          <p className="text-xs text-muted-foreground">
            Developers assigned here gain access to view credentials and environment variables for this project.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => setAssignDialogOpen(true)}
            disabled={availableUsers.length === 0}
          >
            <UserPlus className="mr-2 size-3.5" />
            Assign Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members assigned"
          description="Only managers and administrators can view this project until team members are assigned."
          action={
            canManage && availableUsers.length > 0
              ? {
                  label: "Assign First Member",
                  onClick: () => setAssignDialogOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="rounded-md border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Assigned Date</TableHead>
                {canManage && <TableHead className="w-[100px] text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const profile = member.profile;
                const name = profile?.full_name || profile?.email || "Unknown User";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-sm">{name}</span>
                          <span className="text-xs text-muted-foreground">
                            {profile?.email || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(profile?.role)} className="capitalize">
                        {profile?.role === "admin" && (
                          <ShieldCheck className="mr-1 size-3 text-primary-foreground" />
                        )}
                        {profile?.role || "developer"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>

                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2"
                          onClick={() => {
                            setRemoveTarget(member);
                            setRemoveDialogOpen(true);
                          }}
                        >
                          <UserMinus className="size-3.5 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Assign Member Dialog */}
      {canManage && (
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Team Member</DialogTitle>
              <DialogDescription>
                Select an active team member to grant access to &ldquo;{projectName}&rdquo;.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Select User</label>
                <Select
                  value={selectedUserId || undefined}
                  onValueChange={(val) => setSelectedUserId(val || "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{u.full_name || u.email}</span>
                          <span className="text-muted-foreground text-xs">({u.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={isPending || !selectedUserId}
                onClick={handleAssignMember}
              >
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Assign to Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove Confirmation Dialog */}
      {removeTarget && (
        <ConfirmDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          title="Remove Member from Project"
          description={`Are you sure you want to remove ${
            removeTarget.profile?.full_name || removeTarget.profile?.email || "this user"
          } from "${projectName}"? They will immediately lose access to this project's secrets.`}
          confirmLabel="Remove Member"
          destructive
          isLoading={isRemoving}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
