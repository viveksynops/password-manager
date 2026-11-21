import { describe, it, expect } from "vitest";
import { validateEnv } from "@/lib/env";

describe("validateEnv", () => {
  it("validates valid environment variables successfully", () => {
    const valid = {
      NEXT_PUBLIC_SUPABASE_URL: "https://xyzcompany.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-12345",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-12345",
      MASTER_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    };

    const result = validateEnv(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NEXT_PUBLIC_SUPABASE_URL).toBe("https://xyzcompany.supabase.co");
      expect(result.data.MASTER_KEY).toHaveLength(64);
    }
  });

  it("fails when MASTER_KEY is not 64 hex characters", () => {
    const invalid = {
      NEXT_PUBLIC_SUPABASE_URL: "https://xyzcompany.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-12345",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-12345",
      MASTER_KEY: "short-key",
    };

    const result = validateEnv(invalid);
    expect(result.success).toBe(false);
  });

  it("fails when NEXT_PUBLIC_SUPABASE_URL is not a valid URL", () => {
    const invalid = {
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-12345",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-12345",
      MASTER_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    };

    const result = validateEnv(invalid);
    expect(result.success).toBe(false);
  });
});
