"use client";

import React, { useState, useEffect } from "react";
import { ShareLinkValidationResult } from "@/services/share-access.service";
import { ClientPinForm } from "./ClientPinForm";
import { ClientShareViewer } from "./ClientShareViewer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSharedItemsAction } from "@/actions/share-access.actions";
import { ShieldAlert, Clock, Ban, EyeOff, Lock, Loader2 } from "lucide-react";
import { formatRelativeFuture } from "@/lib/date";

interface SharePublicViewProps {
  token: string;
  validation: ShareLinkValidationResult;
  initialData: {
    projectName: string;
    label: string;
    credentials: {
      id: string;
      serviceName: string;
      loginUrl: string | null;
      username: string;
      notes: string | null;
    }[];
    envVariables: {
      id: string;
      key: string;
      environment: string;
      updatedAt: string;
    }[];
  } | null;
}

export function SharePublicView({ token, validation, initialData }: SharePublicViewProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // 1. Invalid or Inaccessible link states
  if (!validation.valid) {
    let icon = <ShieldAlert className="size-8 text-destructive" />;
    let title = "Share Link Unavailable";
    let desc = "The link you are trying to access is not valid or no longer available.";

    if (validation.error === "revoked") {
      icon = <Ban className="size-8 text-destructive" />;
      title = "Share Link Revoked";
      desc = "This share link has been revoked by a project manager or administrator and cannot be accessed.";
    } else if (validation.error === "expired") {
      icon = <Clock className="size-8 text-amber-500" />;
      title = "Share Link Expired";
      desc = "The expiration period for this link has elapsed. Contact your project team to request a new link.";
    } else if (validation.error === "max_views_reached") {
      icon = <EyeOff className="size-8 text-amber-500" />;
      title = "Maximum Views Limit Reached";
      desc = "This share link was configured with a view limit which has been exceeded.";
    } else if (validation.error === "locked") {
      icon = <Lock className="size-8 text-red-500" />;
      title = "Link Temporarily Locked";
      const lockTime = validation.lockedUntil
        ? formatRelativeFuture(validation.lockedUntil)
        : "in 30 minutes";
      desc = `Too many incorrect PIN attempts. This link is locked until ${lockTime}. Please wait or request an unlock from your project manager.`;
    }

    return (
      <Card className="w-full max-w-md mx-auto shadow-xl border-border bg-card text-center p-6 space-y-4">
        <div className="mx-auto size-14 rounded-full bg-muted/60 flex items-center justify-center">
          {icon}
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            {desc}
          </CardDescription>
        </div>
      </Card>
    );
  }

  // 2. Active Session -> Show secrets viewer
  if (data) {
    return (
      <ClientShareViewer
        token={token}
        projectName={data.projectName}
        label={data.label}
        credentials={data.credentials}
        envVariables={data.envVariables}
        onLock={() => setData(null)}
      />
    );
  }

  // 3. Loading data after PIN verification
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-xs gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span>Decrypting shared secrets session...</span>
      </div>
    );
  }

  // 4. No Active Session -> PIN Entry Form
  const handlePinSuccess = async () => {
    setIsLoading(true);
    const res = await getSharedItemsAction(token);
    setIsLoading(false);
    if (res.success && res.data) {
      setData(res.data);
    }
  };

  return (
    <ClientPinForm
      token={token}
      projectName={validation.link.projectName}
      label={validation.link.label}
      onSuccess={handlePinSuccess}
    />
  );
}
