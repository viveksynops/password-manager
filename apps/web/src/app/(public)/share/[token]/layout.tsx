import React from "react";
import { ShieldCheck } from "lucide-react";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Company Vault
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Secure Client Portal</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-4">
        {children}
      </main>

      <footer className="max-w-4xl mx-auto w-full text-center pt-8 text-[11px] text-muted-foreground">
        Protected by Zero-Knowledge Access Controls • End-to-End Encrypted
      </footer>
    </div>
  );
}
