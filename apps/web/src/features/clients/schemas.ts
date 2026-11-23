import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Client name must be at least 2 characters.")
    .max(100, "Client name must not exceed 100 characters."),
  contactPerson: z
    .string()
    .trim()
    .max(100, "Contact person must not exceed 100 characters.")
    .optional()
    .or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .optional()
    .or(z.literal("")),
  contactPhone: z
    .string()
    .trim()
    .max(30, "Contact phone must not exceed 30 characters.")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must not exceed 2000 characters.")
    .optional()
    .or(z.literal("")),
});

export const createClientSchema = clientSchema;
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = clientSchema.extend({
  id: z.string().uuid("Invalid client ID."),
  isArchived: z.boolean().optional(),
});
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

export const archiveClientSchema = z.object({
  id: z.string().uuid("Invalid client ID."),
  isArchived: z.boolean(),
});
export type ArchiveClientInput = z.infer<typeof archiveClientSchema>;
