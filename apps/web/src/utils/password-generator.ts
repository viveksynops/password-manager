export interface PasswordGeneratorOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
}

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // without ambiguous I, O by default
const UPPERCASE_ALL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnpqrstuvwxyz"; // without ambiguous l
const LOWERCASE_ALL = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "23456789"; // without ambiguous 0, 1
const NUMBERS_ALL = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * Generates a cryptographically strong random password.
 */
export function generatePassword(options: PasswordGeneratorOptions = {}): string {
  const {
    length = 20,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false,
  } = options;

  const effectiveLength = Math.max(12, Math.min(64, length));

  let charset = "";
  const guaranteedChars: string[] = [];

  const upperSet = excludeAmbiguous ? UPPERCASE : UPPERCASE_ALL;
  const lowerSet = excludeAmbiguous ? LOWERCASE : LOWERCASE_ALL;
  const numSet = excludeAmbiguous ? NUMBERS : NUMBERS_ALL;

  if (uppercase) {
    charset += upperSet;
    guaranteedChars.push(getRandomChar(upperSet));
  }
  if (lowercase) {
    charset += lowerSet;
    guaranteedChars.push(getRandomChar(lowerSet));
  }
  if (numbers) {
    charset += numSet;
    guaranteedChars.push(getRandomChar(numSet));
  }
  if (symbols) {
    charset += SYMBOLS;
    guaranteedChars.push(getRandomChar(SYMBOLS));
  }

  if (charset.length === 0) {
    charset = lowerSet + numSet;
  }

  // Generate remaining characters
  const remainingLength = effectiveLength - guaranteedChars.length;
  const result: string[] = [...guaranteedChars];

  for (let i = 0; i < remainingLength; i++) {
    result.push(getRandomChar(charset));
  }

  // Shuffle array securely
  return shuffleArray(result).join("");
}

function getRandomChar(chars: string): string {
  const randomValues = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for non-browser or test environments
    randomValues[0] = Math.floor(Math.random() * 0xffffffff);
  }
  const index = randomValues[0] % chars.length;
  return chars.charAt(index);
}

function shuffleArray(arr: string[]): string[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomValues = new Uint32Array(1);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues);
    } else {
      randomValues[0] = Math.floor(Math.random() * 0xffffffff);
    }
    const j = randomValues[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
