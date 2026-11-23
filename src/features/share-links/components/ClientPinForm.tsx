"use client";

import React, { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { verifySharePinAction } from "@/actions/share-access.actions";
import { Lock, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientPinFormProps {
  token: string;
  projectName: string;
  label: string;
  onSuccess?: () => void;
}

export function ClientPinForm({
  token,
  projectName,
  label,
  onSuccess,
}: ClientPinFormProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmitPin = async (candidatePin: string) => {
    if (candidatePin.length !== 6) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifySharePinAction({
        token,
        pin: candidatePin,
      });

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        setErrorMessage(res.error || "Authentication failed. Please check the PIN.");
        setPin("");
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setPin(value);
    setErrorMessage(null);
    if (value.length === 6 && !isLoading) {
      handleSubmitPin(value);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-border bg-card">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
          <Lock className="size-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
            {projectName}
          </span>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground mt-1">
            Protected Share Access
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Enter the 6-digit access PIN provided to you for &quot;{label}&quot;.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitPin(pin);
          }}
          className="space-y-6"
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <InputOTP
              maxLength={6}
              value={pin}
              onChange={handleOtpChange}
              disabled={isLoading}
              autoFocus
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="size-11 sm:size-12 text-lg font-mono rounded-md border" />
                <InputOTPSlot index={1} className="size-11 sm:size-12 text-lg font-mono rounded-md border" />
                <InputOTPSlot index={2} className="size-11 sm:size-12 text-lg font-mono rounded-md border" />
                <InputOTPSlot index={3} className="size-11 sm:size-12 text-lg font-mono rounded-md border" />
                <InputOTPSlot index={4} className="size-11 sm:size-12 text-lg font-mono rounded-md border" />
                <InputOTPSlot index={5} className="size-11 sm:size-12 text-lg font-mono rounded-md border" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isLoading || pin.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying PIN...
              </>
            ) : (
              <>
                Unlock Shared Secrets
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            5 consecutive failed attempts will lock this share link for 30 minutes.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
