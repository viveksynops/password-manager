import { CredentialCustomField } from "@/features/credentials/schemas";

const META_PREFIX = "\n<!-- VAULT_META:";
const META_SUFFIX = " -->";

export interface ParsedCredentialNotes {
  notes: string;
  customFields: CredentialCustomField[];
  tags: string[];
}

/**
 * Packs user notes, custom fields, and tags into a single text payload
 * while preserving human-readable notes at the top.
 */
export function formatNotesWithMetadata(
  notes?: string | null,
  customFields?: CredentialCustomField[],
  tags?: string[]
): string | null {
  const cleanNotes = (notes || "").trim();
  const validFields = (customFields || []).filter((f) => f.label.trim() !== "");
  const validTags = (tags || []).filter((t) => t.trim() !== "");

  if (validFields.length === 0 && validTags.length === 0) {
    return cleanNotes || null;
  }

  const metaPayload = JSON.stringify({
    customFields: validFields,
    tags: validTags,
  });

  if (!cleanNotes) {
    return `<!-- VAULT_META:${metaPayload} -->`;
  }

  return `${cleanNotes}${META_PREFIX}${metaPayload}${META_SUFFIX}`;
}

/**
 * Parses raw credential notes to extract human-readable notes, custom fields, and tags.
 */
export function parseNotesWithMetadata(rawNotes?: string | null): ParsedCredentialNotes {
  if (!rawNotes) {
    return { notes: "", customFields: [], tags: [] };
  }

  const metaIndex = rawNotes.indexOf("<!-- VAULT_META:");
  if (metaIndex === -1) {
    return { notes: rawNotes, customFields: [], tags: [] };
  }

  const cleanNotes = rawNotes.slice(0, metaIndex).trim();
  const afterPrefix = rawNotes.slice(metaIndex + "<!-- VAULT_META:".length);
  const endIndex = afterPrefix.indexOf(" -->");

  if (endIndex === -1) {
    return { notes: rawNotes, customFields: [], tags: [] };
  }

  const jsonStr = afterPrefix.slice(0, endIndex);
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      notes: cleanNotes,
      customFields: Array.isArray(parsed.customFields) ? parsed.customFields : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  } catch {
    return { notes: rawNotes, customFields: [], tags: [] };
  }
}
