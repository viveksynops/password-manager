import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, message: "No active web session found." },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}
