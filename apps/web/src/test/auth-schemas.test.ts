import { describe, it, expect } from "vitest";
import {
  loginSchema,
  mfaCodeSchema,
  resetPasswordSchema,
  acceptInviteSchema,
  forgotPasswordSchema,
} from "@/features/auth/schemas";

describe("Authentication Schemas (Phase 4)", () => {
  describe("loginSchema", () => {
    it("accepts valid email and non-empty password", () => {
      const res = loginSchema.safeParse({
        email: "admin@company.com",
        password: "ValidPassword123!",
      });
      expect(res.success).toBe(true);
    });

    it("rejects invalid email formats", () => {
      const res = loginSchema.safeParse({
        email: "not-an-email",
        password: "Password123",
      });
      expect(res.success).toBe(false);
    });

    it("rejects empty password", () => {
      const res = loginSchema.safeParse({
        email: "admin@company.com",
        password: "",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("mfaCodeSchema", () => {
    it("accepts exactly 6 digits", () => {
      const res = mfaCodeSchema.safeParse({ code: "123456" });
      expect(res.success).toBe(true);
    });

    it("rejects non-numeric characters", () => {
      const res = mfaCodeSchema.safeParse({ code: "12345a" });
      expect(res.success).toBe(false);
    });

    it("rejects codes that are not 6 digits long", () => {
      expect(mfaCodeSchema.safeParse({ code: "12345" }).success).toBe(false);
      expect(mfaCodeSchema.safeParse({ code: "1234567" }).success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts passwords of 12+ characters that match", () => {
      const res = resetPasswordSchema.safeParse({
        password: "super_strong_password_123",
        confirmPassword: "super_strong_password_123",
      });
      expect(res.success).toBe(true);
    });

    it("rejects passwords under 12 characters", () => {
      const res = resetPasswordSchema.safeParse({
        password: "short123",
        confirmPassword: "short123",
      });
      expect(res.success).toBe(false);
    });

    it("rejects mismatched passwords", () => {
      const res = resetPasswordSchema.safeParse({
        password: "super_strong_password_123",
        confirmPassword: "different_password_123",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("acceptInviteSchema", () => {
    it("accepts full name and matching 12+ character password", () => {
      const res = acceptInviteSchema.safeParse({
        fullName: "Developer Jane",
        password: "strong_invite_password_123",
        confirmPassword: "strong_invite_password_123",
      });
      expect(res.success).toBe(true);
    });

    it("rejects empty or single character full name", () => {
      const res = acceptInviteSchema.safeParse({
        fullName: "A",
        password: "strong_invite_password_123",
        confirmPassword: "strong_invite_password_123",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("validates valid email", () => {
      expect(forgotPasswordSchema.safeParse({ email: "user@test.local" }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false);
    });
  });
});
