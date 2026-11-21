"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import { UserProfile, UserRole } from "@/types/database.types";
import { updateUserRoleAction } from "@/actions/team.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ChangeRoleDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || "developer");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateUserRoleAction({
        userId: user.id,
        role: selectedRole,
      });

      if (res.success) {
        toast.success(`Role updated for ${user.email} to ${selectedRole}`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update role permissions for <strong className="text-foreground">{user.full_name || user.email}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="change-role">Select New Role</FieldLabel>
            <Select
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as UserRole)}
            >
              <SelectTrigger id="change-role" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developer">
                  <div className="flex flex-col text-left">
                    <span className="font-medium">Developer</span>
                    <span className="text-xs text-muted-foreground">
                      Assigned projects only
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex flex-col text-left">
                    <span className="font-medium">Manager</span>
                    <span className="text-xs text-muted-foreground">
                      Manage all client vaults & projects
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col text-left">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Full administrative access & audit logs
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
