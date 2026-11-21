import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { MfaEnrollForm } from "@/features/auth/components/MfaEnrollForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up MFA - Company Vault",
  description: "Enroll in Multi-Factor Authentication for your vault account",
};

export default function MfaEnrollPage() {
  return (
    <AuthCardLayout
      title="Set Up Two-Factor Authentication"
      description="MFA is mandatory for all Company Vault accounts"
    >
      <MfaEnrollForm />
    </AuthCardLayout>
  );
}
