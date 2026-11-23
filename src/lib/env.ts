import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  MASTER_KEY: z
    .string()
    .length(64, "MASTER_KEY must be a 64-character (32-byte) hex string")
    .regex(/^[0-9a-fA-F]+$/, "MASTER_KEY must be a valid hex string"),
  SHARE_PIN_PEPPER: z
    .string()
    .length(64, "SHARE_PIN_PEPPER must be a 64-character (32-byte) hex string")
    .regex(/^[0-9a-fA-F]+$/, "SHARE_PIN_PEPPER must be a valid hex string")
    .optional(),
  SHARE_SESSION_SECRET: z
    .string()
    .length(64, "SHARE_SESSION_SECRET must be a 64-character (32-byte) hex string")
    .regex(/^[0-9a-fA-F]+$/, "SHARE_SESSION_SECRET must be a valid hex string")
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, string | undefined> = process.env) {
  const result = envSchema.safeParse(rawEnv);
  return result;
}

export function getEnv(): Partial<Env> {
  // During CI or early setup before keys are provided, return partial/safe values
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      MASTER_KEY: process.env.MASTER_KEY,
    };
  }
  return result.data;
}

export { envSchema };
