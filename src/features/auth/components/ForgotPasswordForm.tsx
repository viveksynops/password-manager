"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordInput } from "../schemas";
import { forgotPasswordAction } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    startTransition(async () => {
      await forgotPasswordAction(data);
      setSubmitted(true);
      toast.success("Instructions sent if the account exists.");
    });
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="flex justify-center text-green-600">
          <CheckCircle2 className="size-12" />
        </div>
        <p className="text-sm text-foreground">
          If an account exists with that email address, a password reset link has been dispatched.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-primary hover:underline font-medium"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.email || undefined}>
        <FieldLabel htmlFor="forgot-email">Account Email</FieldLabel>
        <Input
          id="forgot-email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          disabled={isPending}
          {...register("email")}
        />
        {errors.email && <FieldError>{errors.email.message}</FieldError>}
      </Field>

      <Button type="submit" className="w-full mt-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Sending link...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
