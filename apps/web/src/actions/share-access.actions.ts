"use server";

import { cookies, headers } from "next/headers";
import {
  verifySharePinSchema,
  revealShareItemSchema,
  VerifySharePinInput,
  RevealShareItemInput,
} from "@/features/share-links/schemas";
import {
  validateShareLink,
  verifyPinAttempt,
  getSharedItems,
  revealSharedItem,
  ShareLinkValidationResult,
} from "@/services/share-access.service";
import {
  SHARE_SESSION_COOKIE_NAME,
  SHARE_SESSION_DURATION_SECONDS,
} from "@/lib/share/session";
import { ActionResult, successResult, errorResult, handleActionError } from "@/lib/action-result";
import { checkRateLimit } from "@/lib/rate-limit";

async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

export async function validateShareTokenAction(
  token: string
): Promise<ActionResult<ShareLinkValidationResult>> {
  try {
    const res = await validateShareLink(token);
    return successResult(res);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function verifySharePinAction(
  rawInput: VerifySharePinInput
): Promise<ActionResult<{ success: boolean; error?: string }>> {
  try {
    const parseResult = verifySharePinSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid PIN format.");
    }

    const ipAddress = await getClientIp();
    const result = await verifyPinAttempt(parseResult.data.token, parseResult.data.pin, ipAddress);

    if (!result.success || !result.sessionToken) {
      return errorResult(result.error || "Authentication failed.");
    }

    // Set secure HTTP-only sliding session cookie
    const cookieStore = await cookies();
    cookieStore.set(SHARE_SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SHARE_SESSION_DURATION_SECONDS,
    });

    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function getSharedItemsAction(token: string): Promise<
  ActionResult<Awaited<ReturnType<typeof getSharedItems>>>
> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SHARE_SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return errorResult("No active session. Please enter the PIN.");
    }

    const data = await getSharedItems(token, sessionCookie.value);

    // Slide session cookie expiration
    cookieStore.set(SHARE_SESSION_COOKIE_NAME, sessionCookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SHARE_SESSION_DURATION_SECONDS,
    });

    return successResult(data);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function revealSharedItemAction(
  rawInput: RevealShareItemInput
): Promise<ActionResult<{ value: string }>> {
  try {
    const parseResult = revealShareItemSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid reveal request.");
    }

    const ipAddress = await getClientIp();

    // Rate limit reveals per IP: 30 requests per minute
    const rateLimit = checkRateLimit(`share-reveal:${ipAddress}`, 30, 60);
    if (!rateLimit.allowed) {
      return errorResult("Too many requests. Please wait before revealing more secrets.");
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SHARE_SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return errorResult("Session expired. Please re-enter the PIN.");
    }

    const { value } = await revealSharedItem(
      parseResult.data.token,
      sessionCookie.value,
      parseResult.data.itemId,
      parseResult.data.itemType,
      ipAddress
    );

    // Slide session cookie
    cookieStore.set(SHARE_SESSION_COOKIE_NAME, sessionCookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SHARE_SESSION_DURATION_SECONDS,
    });

    return successResult({ value });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function logoutShareSessionAction(): Promise<ActionResult<{ success: true }>> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SHARE_SESSION_COOKIE_NAME);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}
