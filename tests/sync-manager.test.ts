import { describe, expect, it } from "vitest";

import { BooxSyncManager } from "../src/sync/manager";
import type { BooxAnnotation, BooxBook, BooxLibrarySnapshot, BooxPluginSettings } from "../src/types";

type UpsertArgs = {
  book: BooxBook;
  annotations: BooxAnnotation[];
  folderPath: string;
  syncedAt: Date;
};

type FileManagerStub = {
  upsertBookNote(args: UpsertArgs): Promise<void>;
  hasBookNote(bookId: string, folderPath: string): boolean;
};

type SnapshotClientStub = {
  fetchLibrarySnapshot(options?: { includeInactive?: boolean }): Promise<BooxLibrarySnapshot>;
};

function buildSettings(overrides?: Partial<BooxPluginSettings>): BooxPluginSettings {
  return {
    cloudHost: "send2boox.com",
    account: "",
    authToken: "token",
    highlightsFolder: "Boox Highlights",
    includeInactive: false,
    syncOnStartup: false,
    ...overrides,
  };
}

function book(id: string, title = id): BooxBook {
  return {
    uniqueId: id,
    title,
    authors: "",
    status: 0,
    readingStatus: 0,
  };
}

function annotation(documentId: string, uniqueId: string, updatedAt: number): BooxAnnotation {
  return {
    uniqueId,
    documentId,
    quote: "q",
    note: "",
    chapter: "c",
    pageNumber: 1,
    position: null,
    startPosition: null,
    endPosition: null,
    color: null,
    shape: null,
    status: 0,
    updatedAt,
  };
}

function createManager(options: {
  fileManager: FileManagerStub;
  snapshot: BooxLibrarySnapshot;
}): BooxSyncManager {
  const client: SnapshotClientStub = {
    fetchLibrarySnapshot: async () => options.snapshot,
  };

  return new BooxSyncManager(options.fileManager, () => client);
}

describe("BooxSyncManager", () => {
  it("syncs only changed books after lastSyncAt when local file exists", async () => {
    const upsertCalls: UpsertArgs[] = [];
    const manager = createManager({
      fileManager: {
        upsertBookNote: async (args) => {
          upsertCalls.push(args);
        },
        hasBookNote: (bookId: string) => bookId === "book-1",
      },
      snapshot: {
        books: [book("book-1"), book("book-2")],
        annotationsByBookId: new Map([
          ["book-1", [annotation("book-1", "a1", 100)]],
          ["book-2", [annotation("book-2", "a2", 200)]],
        ]),
      },
    });

    const summary = await manager.sync(buildSettings({ lastSyncAt: new Date(150000).toISOString() }));

    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]?.book.uniqueId).toBe("book-2");
    expect(summary.booksSynced).toBe(1);
    expect(summary.skippedBooks).toBe(1);
  });

  it("still syncs old annotations when local note does not exist", async () => {
    const upsertCalls: UpsertArgs[] = [];
    const manager = createManager({
      fileManager: {
        upsertBookNote: async (args) => {
          upsertCalls.push(args);
        },
        hasBookNote: () => false,
      },
      snapshot: {
        books: [book("book-1")],
        annotationsByBookId: new Map([["book-1", [annotation("book-1", "a1", 100)]]]),
      },
    });

    const summary = await manager.sync(buildSettings({ lastSyncAt: new Date(500000).toISOString() }));

    expect(upsertCalls).toHaveLength(1);
    expect(summary.booksSynced).toBe(1);
    expect(summary.skippedBooks).toBe(0);
  });

  it("supports cancellation during book loop", async () => {
    let cancel = false;
    let upsertCount = 0;

    const manager = createManager({
      fileManager: {
        upsertBookNote: async () => {
          upsertCount += 1;
          cancel = true;
        },
        hasBookNote: () => false,
      },
      snapshot: {
        books: [book("book-1"), book("book-2")],
        annotationsByBookId: new Map([
          ["book-1", [annotation("book-1", "a1", 100)]],
          ["book-2", [annotation("book-2", "a2", 200)]],
        ]),
      },
    });

    const summary = await manager.sync(buildSettings(), {
      isCancelled: () => cancel,
    });

    expect(summary.cancelled).toBe(true);
    expect(upsertCount).toBe(1);
  });

  it("isolates per-book failures and continues syncing", async () => {
    let upsertAttempt = 0;
    const manager = createManager({
      fileManager: {
        upsertBookNote: async () => {
          upsertAttempt += 1;
          if (upsertAttempt === 1) {
            throw new Error("write failed");
          }
        },
        hasBookNote: () => false,
      },
      snapshot: {
        books: [book("book-1", "Book 1"), book("book-2", "Book 2")],
        annotationsByBookId: new Map([
          ["book-1", [annotation("book-1", "a1", 100)]],
          ["book-2", [annotation("book-2", "a2", 200)]],
        ]),
      },
    });

    const summary = await manager.sync(buildSettings());

    expect(summary.booksSynced).toBe(1);
    expect(summary.errorMessages).toHaveLength(1);
    expect(summary.errorMessages[0]).toContain("Book 1");
  });
});
