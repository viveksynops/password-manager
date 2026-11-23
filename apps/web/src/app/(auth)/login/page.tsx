import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Company Vault",
  description: "Secure login to Company Vault password and secrets manager",
};

export default function LoginPage() {
  return (
    <AuthCardLayout
      title="Sign In"
      description="Enter your credentials to access the company vault"
      footer={
        <p className="text-xs text-muted-foreground text-center">
          Invite-only access. Contact your administrator if you need an account.
        </p>
      }
    >
      <LoginForm />
    </AuthCardLayout>
  );
}
