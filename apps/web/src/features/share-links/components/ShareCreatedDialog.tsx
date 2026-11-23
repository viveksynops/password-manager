"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, AlertTriangle, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ShareCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  pin: string;
  label: string;
}

export function ShareCreatedDialog({
  open,
  onOpenChange,
  token,
  pin,
  label,
}: ShareCreatedDialogProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [confirmedLink, setConfirmedLink] = useState(false);
  const [confirmedPin, setConfirmedPin] = useState(false);
  const [confirmedLost, setConfirmedLost] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const shareUrl = `${origin}/share/${token}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setConfirmedLink(true);
    toast.success("Share link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = async () => {
    await navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setConfirmedPin(true);
    toast.success("6-digit PIN copied to clipboard");
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const allConfirmed = confirmedLink && confirmedPin && confirmedLost;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && !allConfirmed) return; onOpenChange(val); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <DialogTitle className="text-lg">Share Link Created</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Share link for &quot;{label}&quot; has been generated. Provide both the link and the 6-digit PIN to the client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Critical Warning Alert */}
          <div className="flex items-start gap-3 p-3 text-xs bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Save the PIN immediately</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                For zero-knowledge security, the PIN is hashed using scrypt and is never stored in plain text. You will not be able to view this PIN again once this window is closed.
              </p>
            </div>
          </div>

          {/* Share Link Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Share URL</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-muted/40 border border-input rounded-md px-3 py-2 text-xs font-mono text-foreground focus:outline-none select-all"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                Copy Link
              </Button>
            </div>
          </div>

          {/* 6-digit PIN Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">6-Digit Client PIN</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/40 border border-input rounded-md px-4 py-2.5 text-center font-mono text-xl tracking-[0.4em] font-bold text-primary select-all">
                {pin}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPin}
                className="gap-1.5 shrink-0 h-11"
              >
                {copiedPin ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                Copy PIN
              </Button>
            </div>
          </div>

          {/* Confirmation Checklist */}
          <div className="space-y-2 pt-2 border-t text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={confirmedLink} onCheckedChange={(v) => setConfirmedLink(Boolean(v))} />
              <span className="text-muted-foreground">I have copied the share link URL</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={confirmedPin} onCheckedChange={(v) => setConfirmedPin(Boolean(v))} />
              <span className="text-muted-foreground">I have copied the 6-digit PIN</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={confirmedLost} onCheckedChange={(v) => setConfirmedLost(Boolean(v))} />
              <span className="text-muted-foreground">I understand this PIN cannot be recovered later</span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="default"
            onClick={handleClose}
            disabled={!allConfirmed}
            className="w-full sm:w-auto"
          >
            I&apos;ve Saved Both, Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
