import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface AuthCardLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCardLayout({ title, description, children, footer }: AuthCardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-6" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Company Vault
          </span>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer && (
            <CardFooter className="flex justify-center border-t border-border pt-4">
              {footer}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
