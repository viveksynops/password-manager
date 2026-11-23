import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password - Company Vault",
  description: "Enter your new password to restore account access",
};

export default function ResetPasswordPage() {
  return (
    <AuthCardLayout
      title="Create New Password"
      description="Set a strong password to protect your vault access"
    >
      <ResetPasswordForm />
    </AuthCardLayout>
  );
}
