import { z } from "zod";

export const environmentEnum = z.enum(["development", "staging", "production"]);
export type EnvironmentType = z.infer<typeof environmentEnum>;

// Env variable keys must follow standard conventions: letters, digits, underscores, starting with letter or underscore
export const envKeyRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const envVariableSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  environment: environmentEnum,
  key: z
    .string()
    .trim()
    .min(1, "Variable key is required")
    .max(256, "Key must be at most 256 characters")
    .regex(
      envKeyRegex,
      "Key must start with a letter or underscore and contain only letters, numbers, and underscores (e.g. DATABASE_URL, API_KEY_V2)"
    ),
  value: z.string().max(100000, "Value cannot exceed 100,000 characters"),
});

export const createEnvVariableSchema = envVariableSchema;

export const updateEnvVariableSchema = z.object({
  id: z.string().uuid("Invalid variable ID"),
  projectId: z.string().uuid("Invalid project ID"),
  environment: environmentEnum,
  key: z
    .string()
    .trim()
    .min(1, "Variable key is required")
    .max(256, "Key must be at most 256 characters")
    .regex(
      envKeyRegex,
      "Key must start with a letter or underscore and contain only letters, numbers, and underscores"
    ),
  // Optional on update: if omitted or empty, keep existing encrypted value
  value: z.string().max(100000, "Value cannot exceed 100,000 characters").optional(),
});

export const deleteEnvVariableSchema = z.object({
  id: z.string().uuid("Invalid variable ID"),
  projectId: z.string().uuid("Invalid project ID"),
  environment: environmentEnum,
  confirmation: z.string().optional(),
});

export const revealEnvVariableSchema = z.object({
  id: z.string().uuid("Invalid variable ID"),
  projectId: z.string().uuid("Invalid project ID"),
  action: z.enum(["reveal", "copy"]),
});

export const bulkImportEnvSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  environment: environmentEnum,
  rawEnv: z.string().min(1, "Please paste at least one environment variable"),
  overwriteExisting: z.boolean().default(false),
});

export const exportEnvSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  environment: environmentEnum,
});

export type CreateEnvVariableInput = z.infer<typeof createEnvVariableSchema>;
export type UpdateEnvVariableInput = z.infer<typeof updateEnvVariableSchema>;
export type DeleteEnvVariableInput = z.infer<typeof deleteEnvVariableSchema>;
export type RevealEnvVariableInput = z.infer<typeof revealEnvVariableSchema>;
export type BulkImportEnvInput = z.infer<typeof bulkImportEnvSchema>;
export type ExportEnvInput = z.infer<typeof exportEnvSchema>;
