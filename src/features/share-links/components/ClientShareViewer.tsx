"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientSecretField } from "./ClientSecretField";
import { logoutShareSessionAction } from "@/actions/share-access.actions";
import {
  KeyRound,
  FileCode2,
  Lock,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ClientShareViewerProps {
  token: string;
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
  onLock?: () => void;
}

export function ClientShareViewer({
  token,
  projectName,
  label,
  credentials,
  envVariables,
  onLock,
}: ClientShareViewerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"credentials" | "env">("credentials");

  const handleLogout = async () => {
    await logoutShareSessionAction();
    if (onLock) {
      onLock();
    }
    toast.success("Session locked");
    router.refresh();
  };

  const hasCredentials = credentials.length > 0;
  const hasEnvVars = envVariables.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {projectName}
              </span>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 gap-1 text-[11px] font-normal">
                <ShieldCheck className="size-3" />
                Verified Session
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-normal">
                Read-Only
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {label}
            </h1>
            <p className="text-xs text-muted-foreground">
              Securely shared credentials and environment variables. Secrets are decrypted on demand.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 self-start sm:self-auto text-xs"
          >
            <LogOut className="size-3.5" />
            Lock Session
          </Button>
        </CardContent>
      </Card>

      {/* Navigation Pills if both are available */}
      {hasCredentials && hasEnvVars && (
        <div className="flex items-center gap-2 border-b pb-2">
          <Button
            type="button"
            variant={activeTab === "credentials" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("credentials")}
            className="text-xs gap-1.5"
          >
            <KeyRound className="size-3.5" />
            Credentials ({credentials.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === "env" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("env")}
            className="text-xs gap-1.5"
          >
            <FileCode2 className="size-3.5" />
            Environment Variables ({envVariables.length})
          </Button>
        </div>
      )}

      {/* Credentials Section */}
      {(activeTab === "credentials" || !hasEnvVars) && hasCredentials && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <KeyRound className="size-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Credentials ({credentials.length})
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {credentials.map((cred) => (
              <Card key={cred.id} className="border-border bg-card/60 hover:bg-card transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-foreground truncate">
                      {cred.serviceName}
                    </CardTitle>
                    {cred.loginUrl && (
                      <a
                        href={cred.loginUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        Login URL
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-0.5">Username / Email</span>
                    <span className="font-mono text-foreground font-medium select-all block break-all">
                      {cred.username}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-1">Password</span>
                    <ClientSecretField
                      token={token}
                      itemId={cred.id}
                      itemType="credential"
                      label={`${cred.serviceName} password`}
                    />
                  </div>

                  {cred.notes && (
                    <div className="pt-2 border-t text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground block mb-0.5">Notes:</span>
                      <p className="whitespace-pre-wrap">{cred.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Environment Variables Section */}
      {(activeTab === "env" || !hasCredentials) && hasEnvVars && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <FileCode2 className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Environment Variables ({envVariables.length})
            </h2>
          </div>

          <div className="grid gap-3">
            {envVariables.map((env) => (
              <Card key={env.id} className="border-border bg-card/60 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground select-all break-all">
                        {env.key}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                        {env.environment}
                      </Badge>
                    </div>
                  </div>

                  <div className="w-full sm:w-80">
                    <ClientSecretField
                      token={token}
                      itemId={env.id}
                      itemType="env_variable"
                      label={env.key}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Security Info Card */}
      <div className="flex items-start gap-2.5 p-3 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Revealed secrets automatically hide after 15 seconds. Copying a secret copies it to your clipboard and schedules it to be cleared automatically after 30 seconds for security.
        </p>
      </div>
    </div>
  );
}
