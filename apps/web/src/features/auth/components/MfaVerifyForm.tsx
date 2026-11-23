"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mfaCodeSchema, MfaCodeInput } from "../schemas";
import { verifyMfaAction, logoutAction } from "@/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function MfaVerifyForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaCodeInput>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = (data: MfaCodeInput) => {
    startTransition(async () => {
      const result = await verifyMfaAction(data);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Identity verified successfully!");
      router.push("/");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.code || undefined}>
        <FieldLabel htmlFor="mfa-code">6-Digit Authenticator Code</FieldLabel>
        <Input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="123456"
          autoComplete="one-time-code"
          className="text-center font-mono tracking-widest text-lg"
          disabled={isPending}
          {...register("code")}
        />
        <FieldDescription>
          Enter the 6-digit verification code from your authenticator app (e.g. Google
          Authenticator, 1Password).
        </FieldDescription>
        {errors.code && <FieldError>{errors.code.message}</FieldError>}
      </Field>

      <Button type="submit" className="w-full mt-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify & Continue"
        )}
      </Button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => logoutAction()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel and return to sign in
        </button>
      </div>
    </form>
  );
}
