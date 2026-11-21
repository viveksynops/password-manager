"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  FolderLock,
  KeyRound,
  FileCode2,
  ArrowRight,
  ShieldCheck,
  Users,
  ScrollText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthenticatedUser } from "@/lib/auth";
import { DashboardMetrics } from "@/services/dashboard.service";

interface DashboardOverviewProps {
  user: AuthenticatedUser;
  metrics: DashboardMetrics;
}

export function DashboardOverview({ user, metrics }: DashboardOverviewProps) {
  const statCards = [
    {
      title: "Clients",
      value: metrics.clientCount,
      description: "Active organization clients",
      icon: Building2,
      href: "/clients",
    },
    {
      title: "Projects",
      value: metrics.projectCount,
      description: user.role === "developer" ? "Assigned projects" : "Active projects",
      icon: FolderLock,
      href: "/projects",
    },
    {
      title: "Credentials",
      value: metrics.credentialCount,
      description: "Encrypted service logins",
      icon: KeyRound,
      href: "/projects",
    },
    {
      title: "Environment Variables",
      value: metrics.envVariableCount,
      description: "Encrypted configs & secrets",
      icon: FileCode2,
      href: "/projects",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {user.fullName || user.email.split("@")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Company Vault secure management console for client projects and secrets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-xs px-2.5 py-1">
            Role: <span className="font-semibold ml-1">{user.role}</span>
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                <div className="mt-3 pt-2 border-t flex justify-end">
                  <Link
                    href={card.href}
                    className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                  >
                    View details
                    <ArrowRight className="ml-1 size-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions & Security Banner */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Navigation</CardTitle>
            <CardDescription>
              Direct shortcuts to your assigned resources and management tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            <Button
              variant="outline"
              render={<Link href="/projects" />}
              className="justify-start"
            >
              <FolderLock className="mr-2 size-4" />
              Browse Projects & Vaults
            </Button>
            <Button
              variant="outline"
              render={<Link href="/clients" />}
              className="justify-start"
            >
              <Building2 className="mr-2 size-4" />
              Browse Client Accounts
            </Button>
            {user.role === "admin" && (
              <>
                <Button
                  variant="outline"
                  render={<Link href="/team" />}
                  className="justify-start"
                >
                  <Users className="mr-2 size-4" />
                  Manage Team Members
                </Button>
                <Button
                  variant="outline"
                  render={<Link href="/audit-logs" />}
                  className="justify-start"
                >
                  <ScrollText className="mr-2 size-4" />
                  Review Audit Trail
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Invariants Card */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <CardTitle className="text-base">Security Enforcements</CardTitle>
            </div>
            <CardDescription>
              Company Vault operates under strict zero-leakage security rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground shrink-0">• AES-256-GCM:</span>
              <span>All secrets and passwords are encrypted server-side with unique IVs.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground shrink-0">• On-Demand Decryption:</span>
              <span>Secrets are never decrypted during page loads, only on user action.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground shrink-0">• Immutable Audit Trail:</span>
              <span>Every reveal, copy, create, update, and delete is permanently logged.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground shrink-0">• Two-Layer Auth:</span>
              <span>Enforced by both PostgreSQL Row-Level Security and server action checks.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
