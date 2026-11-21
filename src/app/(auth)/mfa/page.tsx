import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { MfaVerifyForm } from "@/features/auth/components/MfaVerifyForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Two-Factor Authentication - Company Vault",
  description: "Verify your two-factor authentication code",
};

export default function MfaPage() {
  return (
    <AuthCardLayout
      title="Two-Factor Verification"
      description="Enter the 6-digit code from your authenticator device"
    >
      <MfaVerifyForm />
    </AuthCardLayout>
  );
}
