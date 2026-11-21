"use server";

import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  mfaCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  acceptInviteSchema,
  LoginInput,
  MfaCodeInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AcceptInviteInput,
} from "@/features/auth/schemas";
import { ActionResult, successResult, errorResult, handleActionError } from "@/lib/action-result";
import { logAction } from "@/services/audit.service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

export interface LoginResult {
  requiresMfa: boolean;
  requiresMfaEnrollment: boolean;
}

export async function loginAction(rawInput: LoginInput): Promise<ActionResult<LoginResult>> {
  try {
    const parseResult = loginSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid input.");
    }

    const { email, password } = parseResult.data;
    const ipAddress = await getClientIp();
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      try {
        await logAction({
          action: "failed_login",
          targetType: "auth",
          ipAddress,
          metadata: { email },
        });
      } catch {
        // Log locally if audit insert fails during login
      }
      return errorResult("Invalid email or password.");
    }

    const userId = authData.user.id;

    // Verify user is not deactivated
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .maybeSingle();

    if (profile && profile.status === "deactivated") {
      await supabase.auth.signOut();
      return errorResult("This account has been deactivated. Please contact an administrator.");
    }

    // Check MFA enrollment & assurance level
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factorsData } = await supabase.auth.mfa.listFactors();

    const verifiedTotpFactors = factorsData?.totp?.filter((f) => f.status === "verified") || [];

    await logAction({
      userId,
      action: "login",
      targetType: "auth",
      ipAddress,
    });

    if (verifiedTotpFactors.length === 0) {
      // User must enroll in MFA before accessing vault (ADR-010, TASK-035)
      return successResult({
        requiresMfa: false,
        requiresMfaEnrollment: true,
      });
    }

    if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
      return successResult({
        requiresMfa: true,
        requiresMfaEnrollment: false,
      });
    }

    return successResult({
      requiresMfa: false,
      requiresMfaEnrollment: false,
    });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function verifyMfaAction(rawInput: MfaCodeInput): Promise<ActionResult<void>> {
  try {
    const parseResult = mfaCodeSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid code format.");
    }

    const { code } = parseResult.data;
    const ipAddress = await getClientIp();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResult("Authentication required.");
    }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError || !factors?.totp || factors.totp.length === 0) {
      return errorResult("No MFA factors found for this account.");
    }

    const factor = factors.totp.find((f) => f.status === "verified") || factors.totp[0];

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    });

    if (verifyError) {
      return errorResult("Invalid verification code. Please check your authenticator app.");
    }

    await logAction({
      userId: user.id,
      action: "mfa_verify",
      targetType: "auth",
      ipAddress,
    });

    return successResult(undefined);
  } catch (err) {
    return handleActionError(err);
  }
}

export interface MfaEnrollmentData {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export async function startMfaEnrollmentAction(): Promise<ActionResult<MfaEnrollmentData>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResult("You must be logged in to enroll in MFA.");
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "Company Vault",
    });

    if (error || !data) {
      return errorResult(error?.message || "Failed to initialize MFA enrollment.");
    }

    return successResult({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function confirmMfaEnrollmentAction(
  factorId: string,
  code: string
): Promise<ActionResult<void>> {
  try {
    const parseResult = mfaCodeSchema.safeParse({ code });
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid 6-digit code.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResult("Authentication required.");
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: parseResult.data.code,
    });

    if (error) {
      return errorResult("Invalid verification code. Please try again.");
    }

    await logAction({
      userId: user.id,
      action: "mfa_verify",
      targetType: "auth",
      metadata: { enrolled: true },
    });

    return successResult(undefined);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  rawInput: ForgotPasswordInput
): Promise<ActionResult<void>> {
  try {
    const parseResult = forgotPasswordSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid email address.");
    }

    const supabase = await createClient();
    // Generic response to avoid email enumeration (SECURITY.md line 43)
    await supabase.auth.resetPasswordForEmail(parseResult.data.email);

    return successResult(undefined);
  } catch {
    // Return generic success to prevent email discovery
    return successResult(undefined);
  }
}

export async function resetPasswordAction(
  rawInput: ResetPasswordInput
): Promise<ActionResult<void>> {
  try {
    const parseResult = resetPasswordSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid password format.");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parseResult.data.password,
    });

    if (error) {
      return errorResult(error.message || "Failed to update password.");
    }

    return successResult(undefined);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function acceptInviteAction(rawInput: AcceptInviteInput): Promise<ActionResult<void>> {
  try {
    const parseResult = acceptInviteSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid input.");
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResult("Invalid or expired invitation link. Please request a new invite.");
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: parseResult.data.password,
      data: { full_name: parseResult.data.fullName },
    });

    if (updateError) {
      return errorResult(updateError.message || "Failed to accept invite.");
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({
        full_name: parseResult.data.fullName,
        status: "active",
      })
      .eq("id", user.id);

    return successResult(undefined);
  } catch (err) {
    return handleActionError(err);
  }
}
