"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, Check, Loader2 } from "lucide-react";
import { revealSharedItemAction } from "@/actions/share-access.actions";
import { toast } from "sonner";

interface ClientSecretFieldProps {
  token: string;
  itemId: string;
  itemType: "credential" | "env_variable";
  label?: string;
  className?: string;
}

export function ClientSecretField({
  token,
  itemId,
  itemType,
  label = "Secret",
  className = "",
}: ClientSecretFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [secretValue, setSecretValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clipboardTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      const res = await revealSharedItemAction({
        token,
        itemId,
        itemType,
      });

      if (!res.success) {
        toast.error(res.error || `Failed to reveal ${label.toLowerCase()}.`);
        return;
      }

      setSecretValue(res.data.value);
      setIsRevealed(true);
      setSecondsRemaining(15);

      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
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

      autoHideTimerRef.current = setTimeout(() => {
        hideSecret();
      }, 15000);
    } catch {
      toast.error(`Error revealing ${label.toLowerCase()}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      let valToCopy = secretValue;
      if (!valToCopy) {
        setIsLoading(true);
        const res = await revealSharedItemAction({
          token,
          itemId,
          itemType,
        });
        setIsLoading(false);

        if (!res.success) {
          toast.error(res.error || `Failed to copy ${label.toLowerCase()}.`);
          return;
        }
        valToCopy = res.data.value;
      }

      await navigator.clipboard.writeText(valToCopy);
      setIsCopied(true);
      toast.success(`${label} copied to clipboard (will clear in 30s).`);

      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
      clipboardTimerRef.current = setTimeout(async () => {
        try {
          const currentText = await navigator.clipboard.readText();
          if (currentText === valToCopy) {
            await navigator.clipboard.writeText("");
          }
        } catch {
          // Clipboard read may be blocked if tab inactive
        }
      }, 30000);

      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 font-mono text-xs bg-muted/30 border border-input rounded px-2.5 py-1.5 flex items-center justify-between min-w-0 select-all overflow-hidden">
        {isRevealed && secretValue !== null ? (
          <span className="text-foreground truncate select-all">{secretValue}</span>
        ) : (
          <span className="text-muted-foreground tracking-widest select-none">
            ••••••••••••
          </span>
        )}
        {isRevealed && secondsRemaining > 0 && (
          <Badge variant="outline" className="text-[10px] ml-2 text-amber-400 border-amber-500/20 shrink-0">
            {secondsRemaining}s
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handleToggleReveal}
          disabled={isLoading}
          aria-label={isRevealed ? "Hide secret" : "Reveal secret"}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : isRevealed ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handleCopy}
          disabled={isLoading}
          aria-label="Copy secret"
        >
          {isCopied ? (
            <Check className="size-3.5 text-green-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
