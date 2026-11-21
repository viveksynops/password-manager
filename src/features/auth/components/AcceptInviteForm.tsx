"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptInviteSchema, AcceptInviteInput } from "../schemas";
import { acceptInviteAction } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AcceptInviteForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  const onSubmit = (data: AcceptInviteInput) => {
    startTransition(async () => {
      const res = await acceptInviteAction(data);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Invitation accepted! Please enroll in MFA to complete account activation.");
      router.push("/mfa/enroll");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.fullName || undefined}>
        <FieldLabel htmlFor="invite-name">Full Name</FieldLabel>
        <Input
          id="invite-name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          disabled={isPending}
          {...register("fullName")}
        />
        {errors.fullName && <FieldError>{errors.fullName.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.password || undefined}>
        <FieldLabel htmlFor="invite-password">Set Password</FieldLabel>
        <Input
          id="invite-password"
          type="password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          disabled={isPending}
          {...register("password")}
        />
        <FieldDescription>Minimum 12 characters.</FieldDescription>
        {errors.password && <FieldError>{errors.password.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.confirmPassword || undefined}>
        <FieldLabel htmlFor="invite-confirm">Confirm Password</FieldLabel>
        <Input
          id="invite-confirm"
          type="password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          disabled={isPending}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
      </Field>

      <Button type="submit" className="w-full mt-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Setting up account...
          </>
        ) : (
          "Accept & Setup MFA"
        )}
      </Button>
    </form>
  );
}
