import { describe, expect, it } from "vitest";

import { parseBooxLibrarySnapshot } from "../src/boox/parser";

describe("parseBooxLibrarySnapshot", () => {
  it("extracts books and groups active annotations by document id", () => {
    const snapshot = parseBooxLibrarySnapshot([
      {
        modeType: 4,
        uniqueId: "book-1",
        title: "Atomic Habits",
        authors: "James Clear",
        status: 0,
      },
      {
        modeType: 1,
        uniqueId: "ann-1",
        documentId: "book-1",
        quote: "Highlight text",
        note: "My note",
        chapter: "Chapter 1",
        updatedAt: 1710000000,
        status: 0,
      },
      {
        modeType: 1,
        uniqueId: "ann-2",
        documentId: "book-1",
        quote: "Inactive",
        status: 2,
      },
    ]);

    expect(snapshot.books).toHaveLength(1);
    expect(snapshot.books[0]).toMatchObject({
      uniqueId: "book-1",
      title: "Atomic Habits",
    });

    const annotations = snapshot.annotationsByBookId.get("book-1");
    expect(annotations).toHaveLength(1);
    expect(annotations?.[0]).toMatchObject({
      uniqueId: "ann-1",
      note: "My note",
    });
  });

  it("keeps the latest annotation when duplicate ids appear", () => {
    const snapshot = parseBooxLibrarySnapshot([
      {
        modeType: 4,
        uniqueId: "book-1",
        title: "Book",
        status: 0,
      },
      {
        modeType: 1,
        uniqueId: "dup-id",
        documentId: "book-1",
        quote: "old",
        updatedAt: 1,
        status: 0,
      },
      {
        modeType: 1,
        uniqueId: "dup-id",
        documentId: "book-1",
        quote: "new",
        updatedAt: 2,
        status: 0,
      },
    ]);

    const annotations = snapshot.annotationsByBookId.get("book-1") ?? [];
    expect(annotations).toHaveLength(1);
    expect(annotations[0]?.quote).toBe("new");
  });

  it("can include inactive records when includeInactive is true", () => {
    const snapshot = parseBooxLibrarySnapshot(
      [
        {
          modeType: 4,
          uniqueId: "book-1",
          title: "Book",
          status: 1,
        },
        {
          modeType: 1,
          uniqueId: "ann-1",
          documentId: "book-1",
          quote: "inactive",
          status: 3,
        },
      ],
      { includeInactive: true }
    );

    expect(snapshot.books).toHaveLength(1);
    expect(snapshot.annotationsByBookId.get("book-1")).toHaveLength(1);
  });
});
