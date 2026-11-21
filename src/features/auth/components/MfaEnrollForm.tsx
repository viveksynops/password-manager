"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mfaCodeSchema, MfaCodeInput } from "../schemas";
import {
  startMfaEnrollmentAction,
  confirmMfaEnrollmentAction,
  MfaEnrollmentData,
  logoutAction,
} from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check } from "lucide-react";

export function MfaEnrollForm() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<MfaEnrollmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaCodeInput>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    async function initEnrollment() {
      setIsLoading(true);
      const res = await startMfaEnrollmentAction();
      if (!res.success) {
        toast.error(res.error);
      } else {
        setEnrollment(res.data);
      }
      setIsLoading(false);
    }
    initEnrollment();
  }, []);

  const handleCopySecret = () => {
    if (!enrollment?.secret) return;
    navigator.clipboard.writeText(enrollment.secret);
    setIsCopied(true);
    toast.success("Secret copied to clipboard.");
    setTimeout(() => setIsCopied(false), 3000);
  };

  const onSubmit = (data: MfaCodeInput) => {
    if (!enrollment?.factorId) return;
    startTransition(async () => {
      const result = await confirmMfaEnrollmentAction(enrollment.factorId, data.code);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("MFA successfully enabled for your account!");
      router.push("/");
      router.refresh();
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating your secure MFA key...</p>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="text-center py-4 space-y-4">
        <p className="text-sm text-destructive">Failed to initialize MFA enrollment.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
          {/* Supabase returns SVG data URI */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrollment.qrCode} alt="MFA QR Code" className="size-48" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Scan this QR code using Google Authenticator, 1Password, or Authy.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono text-foreground font-semibold">
              {enrollment.secret}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleCopySecret}
              aria-label="Copy secret key"
            >
              {isCopied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field data-invalid={!!errors.code || undefined}>
          <FieldLabel htmlFor="enroll-code">Enter 6-digit code to confirm</FieldLabel>
          <Input
            id="enroll-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            className="text-center font-mono tracking-widest text-lg"
            disabled={isPending}
            {...register("code")}
          />
          <FieldDescription>
            Verify that your authenticator app is generating valid codes.
          </FieldDescription>
          {errors.code && <FieldError>{errors.code.message}</FieldError>}
        </Field>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Confirming...
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => logoutAction()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel and log out
          </button>
        </div>
      </form>
    </div>
  );
}
