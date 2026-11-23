export type ExpiryPreset = "30d" | "60d" | "120d" | "1y" | "never";

export const EXPIRY_PRESET_OPTIONS: { label: string; value: ExpiryPreset }[] = [
  { label: "30 days", value: "30d" },
  { label: "60 days", value: "60d" },
  { label: "120 days", value: "120d" },
  { label: "1 year", value: "1y" },
  { label: "Never expires", value: "never" },
];

/**
 * Calculate the expiry timestamp for a given preset from now.
 */
export function calculateExpiry(preset: ExpiryPreset): Date | null {
  const now = new Date();
  switch (preset) {
    case "30d":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "60d":
      return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    case "120d":
      return new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case "never":
      return null;
  }
}

/**
 * Determine whether a share link is expired.
 */
export function isExpired(link: {
  expires_at: string | Date | null;
  never_expires: boolean;
}): boolean {
  if (link.never_expires || !link.expires_at) {
    return false;
  }
  const expiryTime = new Date(link.expires_at).getTime();
  return expiryTime <= Date.now();
}
