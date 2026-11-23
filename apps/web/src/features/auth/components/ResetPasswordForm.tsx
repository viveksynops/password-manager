"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordInput } from "../schemas";
import { resetPasswordAction } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    startTransition(async () => {
      const res = await resetPasswordAction(data);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Password reset successfully. Please sign in.");
      router.push("/login");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.password || undefined}>
        <FieldLabel htmlFor="new-password">New Password</FieldLabel>
        <Input
          id="new-password"
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
        <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
        <Input
          id="confirm-password"
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
            Updating password...
          </>
        ) : (
          "Save New Password"
        )}
      </Button>
    </form>
  );
}
