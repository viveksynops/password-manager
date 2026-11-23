import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - Company Vault",
  description: "Request a password reset link",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCardLayout
      title="Reset Password"
      description="Enter your email address to receive password reset instructions"
    >
      <ForgotPasswordForm />
    </AuthCardLayout>
  );
}
