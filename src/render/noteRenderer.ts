import type { BooxAnnotation, BooxBook } from "../types";

export function renderBookNote(options: {
  book: BooxBook;
  annotations: BooxAnnotation[];
  syncedAt: Date;
}): string {
  const { book, annotations, syncedAt } = options;
  const sortedAnnotations = [...annotations].sort((left, right) => {
    const leftTs = normalizeTimestamp(left.updatedAt);
    const rightTs = normalizeTimestamp(right.updatedAt);
    if (leftTs !== rightTs) {
      return leftTs - rightTs;
    }
    return left.uniqueId.localeCompare(right.uniqueId);
  });

  const lines: string[] = [
    "---",
    `boox-book-id: ${yamlString(book.uniqueId)}`,
    `boox-title: ${yamlString(book.title || "Unknown Book")}`,
    `boox-authors: ${yamlString(book.authors)}`,
    `boox-highlights-count: ${sortedAnnotations.length}`,
    `boox-last-sync-at: ${yamlString(syncedAt.toISOString())}`,
    "---",
    "",
    `# ${book.title || "Unknown Book"}`,
  ];

  if (book.authors.trim()) {
    lines.push(`- Authors: ${book.authors.trim()}`);
  }

  lines.push(`- Book ID: ${book.uniqueId}`);
  lines.push("");
  lines.push("## Highlights and notes");

  if (sortedAnnotations.length === 0) {
    lines.push("");
    lines.push("No annotations found.");
    return `${lines.join("\n")}\n`;
  }

  sortedAnnotations.forEach((annotation, index) => {
    lines.push("");
    lines.push(`### ${index + 1}. ${annotation.chapter || "Untitled section"}`);

    const updatedText = formatTimestamp(annotation.updatedAt);
    lines.push(`- Updated: ${updatedText}`);

    if (typeof annotation.pageNumber === "number") {
      lines.push(`- Page: ${annotation.pageNumber + 1}`);
    }

    lines.push("");
    appendQuoteBlock(lines, annotation.quote || "(empty highlight)");

    if (annotation.note.trim()) {
      lines.push("");
      lines.push("**Note**");
      lines.push(annotation.note.trim());
    }
  });

  return `${lines.join("\n")}\n`;
}

function appendQuoteBlock(lines: string[], quote: string): void {
  const quoteLines = quote
    .split("\n")
    .map((line) => line.replace(/\r$/, ""))
    .map((line) => `> ${line}`);

  lines.push(...quoteLines);
}

function yamlString(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function normalizeTimestamp(value: number | null): number {
  if (typeof value !== "number") {
    return -1;
  }

  if (value > 10_000_000_000) {
    return Math.trunc(value / 1000);
  }

  return Math.trunc(value);
}

function formatTimestamp(value: number | null): string {
  const normalized = normalizeTimestamp(value);
  if (normalized < 0) {
    return "unknown";
  }

  const date = new Date(normalized * 1000);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toLocaleString();
}
