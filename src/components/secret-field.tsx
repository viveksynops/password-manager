"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, Check, Loader2 } from "lucide-react";
import { revealCredentialAction } from "@/actions/credential.actions";
import { toast } from "sonner";

interface SecretFieldProps {
  credentialId: string;
  projectId: string;
  className?: string;
}

export function SecretField({ credentialId, projectId, className = "" }: SecretFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [secretValue, setSecretValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clipboardTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    };
  }, []);

  const hideSecret = () => {
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIsRevealed(false);
    setSecretValue(null);
    setSecondsRemaining(0);
  };

  const handleToggleReveal = async () => {
    if (isRevealed) {
      hideSecret();
      return;
    }

    setIsLoading(true);
    try {
      const res = await revealCredentialAction({
        id: credentialId,
        projectId,
        action: "reveal",
      });

      if (!res.success) {
        toast.error(res.error || "Failed to reveal secret.");
        return;
      }

      setSecretValue(res.data);
      setIsRevealed(true);
      setSecondsRemaining(15);

      // 1-second countdown interval
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-hide after 15 seconds (TASK-084)
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => {
        hideSecret();
        toast.info("Password hidden automatically after 15 seconds.");
      }, 15000);
    } catch {
      toast.error("Failed to decrypt password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    setIsLoading(true);
    try {
      const res = await revealCredentialAction({
        id: credentialId,
        projectId,
        action: "copy",
      });

      if (!res.success) {
        toast.error(res.error || "Failed to copy secret.");
        return;
      }

      await navigator.clipboard.writeText(res.data);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      toast.success("Password copied. Clipboard will be cleared in 30 seconds.");

      // Clear clipboard after 30 seconds (TASK-083)
      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
      clipboardTimerRef.current = setTimeout(async () => {
        try {
          // Check if clipboard still has the secret before wiping
          const currentText = await navigator.clipboard.readText();
          if (currentText === res.data) {
            await navigator.clipboard.writeText("");
            toast.info("Clipboard cleared for security.");
          }
        } catch {
          // Non-blocking clipboard clear fallback
          try {
            await navigator.clipboard.writeText("");
          } catch {
            // ignore if permissions deny
          }
        }
      }, 30000);
    } catch {
      toast.error("Failed to copy password to clipboard.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 font-mono text-sm ${className}`}>
      {/* Secret text or masked dots */}
      <span
        className={`px-2 py-0.5 rounded select-all ${
          isRevealed
            ? "bg-muted font-mono text-foreground font-medium text-xs tracking-normal"
            : "text-muted-foreground tracking-widest text-base select-none"
        }`}
      >
        {isRevealed && secretValue ? secretValue : "••••••••••••"}
      </span>

      {/* Auto-hide countdown badge */}
      {isRevealed && secondsRemaining > 0 && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-5 font-mono text-amber-500 border-amber-500/30 bg-amber-500/10"
          title="Auto-hides in"
        >
          {secondsRemaining}s
        </Badge>
      )}

      {/* Reveal Button */}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-foreground"
        onClick={handleToggleReveal}
        disabled={isLoading}
        aria-label={isRevealed ? "Hide password" : "Reveal password"}
        title={isRevealed ? "Hide password" : "Reveal password"}
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isRevealed ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
      </Button>

      {/* Copy Button */}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        disabled={isLoading}
        aria-label="Copy password"
        title="Copy password to clipboard"
      >
        {isCopied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  );
}
