import { z } from "zod";

export const shareItemTypeEnum = z.enum(["credential", "env_variable"]);
export type ShareItemType = z.infer<typeof shareItemTypeEnum>;

export const shareItemSchema = z.object({
  itemType: shareItemTypeEnum,
  itemId: z.string().uuid("Invalid item ID"),
});
export type ShareItemInput = z.infer<typeof shareItemSchema>;

export const expiryPresetEnum = z.enum(["30d", "60d", "120d", "1y", "never"]);
export type ExpiryPresetValue = z.infer<typeof expiryPresetEnum>;

export const createShareLinkSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  label: z
    .string()
    .trim()
    .min(1, "Label is required")
    .max(80, "Label cannot exceed 80 characters"),
  expiryPreset: expiryPresetEnum,
  maxViews: z
    .number()
    .int("Max views must be an integer")
    .positive("Max views must be greater than 0")
    .nullable()
    .optional(),
  items: z.array(shareItemSchema).min(1, "Select at least one item to share"),
});
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;

export const updateShareItemsSchema = z.object({
  shareLinkId: z.string().uuid("Invalid share link ID"),
  projectId: z.string().uuid("Invalid project ID"),
  items: z.array(shareItemSchema).min(1, "Select at least one item to share"),
});
export type UpdateShareItemsInput = z.infer<typeof updateShareItemsSchema>;

export const extendShareLinkSchema = z.object({
  shareLinkId: z.string().uuid("Invalid share link ID"),
  projectId: z.string().uuid("Invalid project ID"),
  expiryPreset: expiryPresetEnum,
});
export type ExtendShareLinkInput = z.infer<typeof extendShareLinkSchema>;

export const verifySharePinSchema = z.object({
  token: z.string().min(1, "Token is required"),
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
});
export type VerifySharePinInput = z.infer<typeof verifySharePinSchema>;

export const revealShareItemSchema = z.object({
  token: z.string().min(1, "Token is required"),
  itemId: z.string().uuid("Invalid item ID"),
  itemType: shareItemTypeEnum,
});
export type RevealShareItemInput = z.infer<typeof revealShareItemSchema>;
