import { describe, expect, it } from "vitest";

import { buildDefaultFileBaseName, normalizeFolderPath, sanitizeFileName } from "../src/file/mappers";

describe("file mappers", () => {
  it("sanitizes invalid filename characters", () => {
    expect(sanitizeFileName("A/B:C*D?E\"F<G>H|I")).toBe("A B C D E F G H I");
  });

  it("normalizes folder paths", () => {
    expect(normalizeFolderPath("/Boox Highlights/")).toBe("Boox Highlights");
    expect(normalizeFolderPath(".")).toBe("");
  });

  it("builds deterministic base name with title and id", () => {
    const base = buildDefaultFileBaseName({
      uniqueId: "1234567890abcdef",
      title: "My Book",
      authors: "",
      status: 0,
      readingStatus: 0,
    });

    expect(base).toBe("My Book-1234567890ab");
  });

  it("handles reserved windows names and trailing dots", () => {
    expect(sanitizeFileName("CON....")).toBe("CON_");
  });

  it("drops control chars and limits length", () => {
    const raw = `Title\u0000${"x".repeat(300)}`;
    const result = sanitizeFileName(raw);
    expect(result.length).toBeLessThanOrEqual(120);
    expect(result.includes("\u0000")).toBe(false);
  });
});
