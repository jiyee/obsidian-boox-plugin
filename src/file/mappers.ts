import type { BooxBook } from "../types";

export const BOOX_BOOK_ID_KEY = "boox-book-id";

export function buildDefaultFileBaseName(book: BooxBook): string {
  const safeTitle = sanitizeFileName(book.title || "Untitled");
  const shortId = sanitizeFileName(book.uniqueId).slice(0, 12) || "book";
  return `${safeTitle}-${shortId}`;
}

export function sanitizeFileName(value: string): string {
  const normalized = stripControlChars(value)
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const withoutTrailing = normalized.replace(/[. ]+$/g, "");
  if (!withoutTrailing) {
    return "Untitled";
  }

  const withReservedHandled = isWindowsReservedName(withoutTrailing)
    ? `${withoutTrailing}_`
    : withoutTrailing;

  const maxLength = 120;
  const bounded = withReservedHandled.slice(0, maxLength).replace(/[. ]+$/g, "").trim();
  return bounded || "Untitled";
}

export function normalizeFolderPath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  if (trimmed === "" || trimmed === ".") {
    return "";
  }
  return trimmed;
}

function isWindowsReservedName(value: string): boolean {
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value);
}

function stripControlChars(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if ((code >= 0 && code <= 31) || code === 127) {
      continue;
    }
    result += char;
  }
  return result;
}
