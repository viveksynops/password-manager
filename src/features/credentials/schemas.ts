import { z } from "zod";

export const credentialSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  serviceName: z
    .string()
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name cannot exceed 100 characters"),
  loginUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (e.g. https://auth.service.com)")
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .trim()
    .min(1, "Username or email is required")
    .max(255, "Username cannot exceed 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(255, "Password cannot exceed 255 characters"),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export const createCredentialSchema = credentialSchema;

export const updateCredentialSchema = z.object({
  id: z.string().uuid("Invalid credential ID"),
  projectId: z.string().uuid("Invalid project ID"),
  serviceName: z
    .string()
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name cannot exceed 100 characters"),
  loginUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (e.g. https://auth.service.com)")
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .trim()
    .min(1, "Username or email is required")
    .max(255, "Username cannot exceed 255 characters"),
  password: z
    .string()
    .max(255, "Password cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export const deleteCredentialSchema = z.object({
  id: z.string().uuid("Invalid credential ID"),
  projectId: z.string().uuid("Invalid project ID"),
});

export const revealCredentialSchema = z.object({
  id: z.string().uuid("Invalid credential ID"),
  projectId: z.string().uuid("Invalid project ID"),
  action: z.enum(["reveal", "copy"]),
});

export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;
export type DeleteCredentialInput = z.infer<typeof deleteCredentialSchema>;
export type RevealCredentialInput = z.infer<typeof revealCredentialSchema>;
