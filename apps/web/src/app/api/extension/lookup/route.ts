import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { logAction } from "@/services/audit.service";

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const allowed =
    origin.startsWith("chrome-extension://") ||
    origin.includes("password-manager-beige-seven.vercel.app") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1");

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/**
 * Normalizes raw URLs or domains to lowercase bare hostname (e.g. "https://github.com/login" -> "github.com")
 */
function normalizeHostname(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  try {
    const url = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Exact domain matching invariant (TASK-134).
 * Matches candidate domain strictly against target domain. Never uses substring / "contains".
 */
function matchesDomain(candidateUrl: string | null | undefined, targetDomain: string): boolean {
  const candidate = normalizeHostname(candidateUrl);
  const target = normalizeHostname(targetDomain);
  if (!candidate || !target) return false;
  return candidate === target;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No active Company Vault web session." },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetDomain = typeof body.domain === "string" ? body.domain : "";
    const action = body.action === "fill" ? "fill" : "list";
    const credentialId = typeof body.credentialId === "string" ? body.credentialId : null;

    if (!targetDomain && !credentialId) {
      return NextResponse.json(
        { error: "Missing required parameter: domain or credentialId" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createServerClient();

    // If filling a specific credential:
    if (action === "fill" && credentialId) {
      const { data: cred, error } = await supabase
        .from("credentials")
        .select("id, project_id, service_name, login_url, username, encrypted_password, iv, tag")
        .eq("id", credentialId)
        .single();

      if (error || !cred) {
        return NextResponse.json(
          { error: "Credential not found or access denied." },
          { status: 404, headers: corsHeaders }
        );
      }

      // Verify domain match before decrypting if domain provided
      if (targetDomain && !matchesDomain(cred.login_url, targetDomain) && !matchesDomain(cred.service_name, targetDomain)) {
        return NextResponse.json(
          { error: "Domain mismatch: Credential does not match the active site." },
          { status: 403, headers: corsHeaders }
        );
      }

      const decryptedPassword = decrypt(cred.encrypted_password, cred.iv, cred.tag);
      const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

      // Fail-closed audit log (TASK-137 / ADR-013)
      await logAction({
        userId: user.id,
        action: "reveal",
        targetType: "credential",
        targetId: cred.id,
        projectId: cred.project_id,
        ipAddress,
        metadata: {
          serviceName: cred.service_name,
          username: cred.username,
          domain: targetDomain || normalizeHostname(cred.login_url),
          source: "browser_extension",
          action: "extension_fill",
        },
      });

      return NextResponse.json(
        {
          id: cred.id,
          serviceName: cred.service_name,
          username: cred.username,
          password: decryptedPassword,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // List mode: Query credentials for user's assigned projects matching the exact domain
    const { data: allCreds, error } = await supabase
      .from("credentials")
      .select("id, project_id, service_name, login_url, username, updated_at")
      .order("service_name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }

    const matching = (allCreds || []).filter((cred) => {
      return (
        matchesDomain(cred.login_url, targetDomain) ||
        matchesDomain(cred.service_name, targetDomain)
      );
    });

    return NextResponse.json(
      {
        domain: normalizeHostname(targetDomain),
        credentials: matching.map((c) => ({
          id: c.id,
          projectId: c.project_id,
          serviceName: c.service_name,
          username: c.username,
          loginUrl: c.login_url,
          passwordMasked: "••••••••••••••••",
        })),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
