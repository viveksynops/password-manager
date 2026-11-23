import { z } from "zod";

/**
 * Base project schema validation
 */
export const projectSchema = z.object({
  clientId: z.string().uuid("Please select a valid client organization"),
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name cannot exceed 100 characters"),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  liveUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (e.g. https://example.com)")
    .optional()
    .or(z.literal("")),
  repoUrl: z
    .string()
    .trim()
    .url("Must be a valid repository URL (e.g. https://github.com/org/repo)")
    .optional()
    .or(z.literal("")),
  hostingInfo: z
    .string()
    .trim()
    .max(255, "Hosting info cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),
  techStack: z
    .string()
    .trim()
    .max(255, "Tech stack cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),
  memberIds: z.array(z.string().uuid("Invalid member UUID")).optional(),
});

export const createProjectSchema = projectSchema;

export const updateProjectSchema = projectSchema.extend({
  id: z.string().uuid("Invalid project ID"),
  isArchived: z.boolean().optional(),
});

export const archiveProjectSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  isArchived: z.boolean(),
});

export const assignMemberSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  userId: z.string().uuid("Invalid user ID"),
});

export const removeMemberSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  userId: z.string().uuid("Invalid user ID"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ArchiveProjectInput = z.infer<typeof archiveProjectSchema>;
export type AssignMemberInput = z.infer<typeof assignMemberSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
