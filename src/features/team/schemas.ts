import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please provide a valid email address.")
    .toLowerCase(),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must not exceed 100 characters."),
  role: z.enum(["admin", "manager", "developer"], {
    error: "Role must be admin, manager, or developer.",
  }),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID."),
  role: z.enum(["admin", "manager", "developer"], {
    error: "Role must be admin, manager, or developer.",
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const deactivateUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID."),
  status: z.enum(["active", "deactivated"], {
    error: "Status must be active or deactivated.",
  }),
});

export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;
