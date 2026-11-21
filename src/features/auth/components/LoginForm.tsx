"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "../schemas";
import { loginAction } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await loginAction(data);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.data.requiresMfaEnrollment) {
        toast.info("Please set up Multi-Factor Authentication to secure your account.");
        router.push("/mfa/enroll");
        return;
      }

      if (result.data.requiresMfa) {
        toast.info("Please enter your two-factor authentication code.");
        router.push("/mfa");
        return;
      }

      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.email || undefined}>
        <FieldLabel htmlFor="email">Email Address</FieldLabel>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          disabled={isPending}
          {...register("email")}
        />
        {errors.email && <FieldError>{errors.email.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.password || undefined}>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••••••"
          autoComplete="current-password"
          disabled={isPending}
          {...register("password")}
        />
        {errors.password && <FieldError>{errors.password.message}</FieldError>}
      </Field>

      <Button type="submit" className="w-full mt-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
