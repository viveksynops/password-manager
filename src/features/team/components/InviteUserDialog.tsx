"use client";

import React, { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { inviteUserSchema, InviteUserInput } from "../schemas";
import { inviteUserAction } from "@/actions/team.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      role: "developer",
    },
  });

  const onSubmit = (data: InviteUserInput) => {
    startTransition(async () => {
      const res = await inviteUserAction(data);
      if (res.success) {
        toast.success(`Invitation sent to ${res.data.email}`);
        reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="mr-2 size-4" />
            Invite Member
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Invite a new team member to Company Vault. They will receive an invitation to set up their password and MFA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.email || undefined}>
            <FieldLabel htmlFor="invite-email">Email Address</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              disabled={isPending}
              {...register("email")}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.fullName || undefined}>
            <FieldLabel htmlFor="invite-fullname">Full Name</FieldLabel>
            <Input
              id="invite-fullname"
              placeholder="Jane Doe"
              disabled={isPending}
              {...register("fullName")}
            />
            {errors.fullName && <FieldError>{errors.fullName.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.role || undefined}>
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => field.onChange(val as "admin" | "manager" | "developer")}
                >
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">
                      <div className="flex flex-col text-left">
                        <span className="font-medium">Developer</span>
                        <span className="text-xs text-muted-foreground">
                          Access only to assigned projects and secrets
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex flex-col text-left">
                        <span className="font-medium">Manager</span>
                        <span className="text-xs text-muted-foreground">
                          Manage clients, projects, and all project vaults
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex flex-col text-left">
                        <span className="font-medium">Admin</span>
                        <span className="text-xs text-muted-foreground">
                          Full system control, team access, and audit logs
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <FieldError>{errors.role.message}</FieldError>}
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
