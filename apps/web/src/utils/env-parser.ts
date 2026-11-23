/**
 * Utility for parsing and formatting .env configuration text.
 * Handles single/double quotes, multiline values, inline comments, empty values, and exports.
 */

export interface ParsedEnvItem {
  key: string;
  value: string;
  comment?: string;
  lineNumber: number;
}

export interface ParseEnvResult {
  items: ParsedEnvItem[];
  duplicates: string[];
  errors: { line: number; message: string }[];
}

/**
 * Parses raw .env string into structured key-value items.
 */
export function parseEnvText(raw: string): ParseEnvResult {
  const items: ParsedEnvItem[] = [];
  const duplicates: string[] = [];
  const errors: { line: number; message: string }[] = [];
  const seenKeys = new Set<string>();

  if (!raw || typeof raw !== "string") {
    return { items, duplicates, errors };
  }

  const lines = raw.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    // Skip empty lines or pure comment lines
    if (!trimmed || trimmed.startsWith("#")) {
      i++;
      continue;
    }

    // Strip leading "export " if present (e.g., export KEY=VALUE)
    let lineToParse = trimmed;
    if (lineToParse.startsWith("export ") || lineToParse.startsWith("export\t")) {
      lineToParse = lineToParse.replace(/^export\s+/, "");
    }

    const eqIndex = lineToParse.indexOf("=");
    if (eqIndex === -1) {
      errors.push({
        line: lineNum,
        message: `Line ${lineNum}: Missing '=' separator in "${trimmed.slice(0, 30)}..."`,
      });
      i++;
      continue;
    }

    const key = lineToParse.slice(0, eqIndex).trim();
    if (!key) {
      errors.push({
        line: lineNum,
        message: `Line ${lineNum}: Variable key cannot be empty`,
      });
      i++;
      continue;
    }

    // Validate key name (alphanumeric + underscore, cannot start with a digit)
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      errors.push({
        line: lineNum,
        message: `Line ${lineNum}: Invalid key name "${key}". Must contain only letters, numbers, and underscores.`,
      });
      i++;
      continue;
    }

    let valPart = lineToParse.slice(eqIndex + 1).trim();
    let finalValue = "";
    let inlineComment: string | undefined;

    // Check if value is wrapped in quotes
    if (valPart.startsWith('"')) {
      // Double-quoted string - may span multiple lines
      let quoteContent = valPart.slice(1);
      let closed = false;

      // Check if closing quote is on the same line
      while (!closed) {
        let escaped = false;
        let closeIdx = -1;

        for (let c = 0; c < quoteContent.length; c++) {
          if (escaped) {
            escaped = false;
            continue;
          }
          if (quoteContent[c] === "\\") {
            escaped = true;
            continue;
          }
          if (quoteContent[c] === '"') {
            closeIdx = c;
            break;
          }
        }

        if (closeIdx !== -1) {
          finalValue = quoteContent.slice(0, closeIdx);
          const remainder = quoteContent.slice(closeIdx + 1).trim();
          if (remainder.startsWith("#")) {
            inlineComment = remainder.slice(1).trim();
          }
          closed = true;
        } else {
          // Multiline string: continue to next line
          i++;
          if (i >= lines.length) {
            // Unclosed quote: use whatever we have
            finalValue = quoteContent;
            closed = true;
          } else {
            quoteContent += "\n" + lines[i];
          }
        }
      }

      // Unescape standard escape sequences
      finalValue = finalValue
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    } else if (valPart.startsWith("'")) {
      // Single-quoted string (raw, no escape interpretation)
      let quoteContent = valPart.slice(1);
      let closed = false;

      while (!closed) {
        const closeIdx = quoteContent.indexOf("'");
        if (closeIdx !== -1) {
          finalValue = quoteContent.slice(0, closeIdx);
          const remainder = quoteContent.slice(closeIdx + 1).trim();
          if (remainder.startsWith("#")) {
            inlineComment = remainder.slice(1).trim();
          }
          closed = true;
        } else {
          i++;
          if (i >= lines.length) {
            finalValue = quoteContent;
            closed = true;
          } else {
            quoteContent += "\n" + lines[i];
          }
        }
      }
    } else {
      // Unquoted value: check for inline comment
      const commentIdx = valPart.indexOf(" #");
      if (commentIdx !== -1) {
        inlineComment = valPart.slice(commentIdx + 2).trim();
        valPart = valPart.slice(0, commentIdx).trim();
      }
      finalValue = valPart;
    }

    if (seenKeys.has(key)) {
      duplicates.push(key);
      // Update existing item with the latest value (standard .env behavior)
      const existingIdx = items.findIndex((it) => it.key === key);
      if (existingIdx !== -1) {
        items[existingIdx] = {
          key,
          value: finalValue,
          comment: inlineComment,
          lineNumber: lineNum,
        };
      }
    } else {
      seenKeys.add(key);
      items.push({
        key,
        value: finalValue,
        comment: inlineComment,
        lineNumber: lineNum,
      });
    }

    i++;
  }

  return { items, duplicates, errors };
}

/**
 * Exports key-value items back to clean .env string format.
 */
export function exportEnvText(
  items: { key: string; value: string; comment?: string | null }[],
  options?: { environment?: string; projectName?: string }
): string {
  const lines: string[] = [];

  // Header comment
  lines.push("# -------------------------------------------------------------");
  if (options?.projectName) {
    lines.push(`# Project: ${options.projectName}`);
  }
  if (options?.environment) {
    lines.push(`# Environment: ${options.environment.toUpperCase()}`);
  }
  lines.push(`# Exported: ${new Date().toISOString()}`);
  lines.push("# -------------------------------------------------------------");
  lines.push("");

  for (const item of items) {
    const key = item.key.trim();
    let val = item.value ?? "";

    // Escape or quote value if it contains spaces, newlines, quotes, or '#'
    const needsQuotes =
      val.includes(" ") ||
      val.includes("\n") ||
      val.includes("\t") ||
      val.includes("#") ||
      val.includes('"') ||
      val.includes("'") ||
      val === "";

    let formattedVal: string;
    if (needsQuotes) {
      const escaped = val
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      formattedVal = `"${escaped}"`;
    } else {
      formattedVal = val;
    }

    if (item.comment) {
      lines.push(`${key}=${formattedVal} # ${item.comment}`);
    } else {
      lines.push(`${key}=${formattedVal}`);
    }
  }

  return lines.join("\n") + "\n";
}
