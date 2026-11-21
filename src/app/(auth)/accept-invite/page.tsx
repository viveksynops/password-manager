import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout";
import { AcceptInviteForm } from "@/features/auth/components/AcceptInviteForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept Team Invitation - Company Vault",
  description: "Complete your account setup and join Company Vault",
};

export default function AcceptInvitePage() {
  return (
    <AuthCardLayout
      title="Accept Invitation"
      description="Set your full name and password to join Company Vault"
    >
      <AcceptInviteForm />
    </AuthCardLayout>
  );
}
