import { BooxLibraryClient } from "../boox/client";
import { BooxFileManager } from "../file/manager";
import type {
  BooxAnnotation,
  BooxPluginSettings,
  SyncLogEntry,
  SyncProgressEvent,
  SyncSummary,
} from "../types";

type BooxSnapshotClient = {
  fetchLibrarySnapshot(options?: { includeInactive?: boolean }): Promise<{
    books: {
      uniqueId: string;
      title: string;
      authors: string;
      status: number | null;
      readingStatus: number | null;
    }[];
    annotationsByBookId: Map<string, BooxAnnotation[]>;
  }>;
};

type FileManagerLike = Pick<BooxFileManager, "upsertBookNote" | "hasBookNote">;

type SyncOptions = {
  isCancelled?: () => boolean;
  onProgress?: (event: SyncProgressEvent) => void;
};

export class BooxSyncManager {
  constructor(
    private readonly fileManager: FileManagerLike,
    private readonly createClient: (settings: BooxPluginSettings) => BooxSnapshotClient = (
      settings
    ) =>
      new BooxLibraryClient({
        cloudHost: settings.cloudHost,
        token: settings.authToken,
      })
  ) {}

  async sync(settings: BooxPluginSettings, options?: SyncOptions): Promise<SyncSummary> {
    const client = this.createClient(settings);

    const snapshot = await client.fetchLibrarySnapshot({
      includeInactive: settings.includeInactive,
    });

    const syncedAt = new Date();
    const lastSyncEpochMs = parseLastSyncAt(settings.lastSyncAt);
    let cancelled = false;
    let booksSynced = 0;
    let skippedBooks = 0;
    let processedBooks = 0;
    let annotationsSynced = 0;
    const errorMessages: string[] = [];
    const activityLog: SyncLogEntry[] = [];

    const emitProgress = (message: string, level: SyncLogEntry["level"] = "info"): void => {
      activityLog.push({
        timestamp: new Date().toISOString(),
        level,
        message,
      });

      options?.onProgress?.({
        message,
        level,
        totalBooks: snapshot.books.length,
        processedBooks,
        booksSynced,
        skippedBooks,
        annotationsSynced,
      });
    };

    emitProgress(`Fetched ${snapshot.books.length} book(s) from boox.`);

    for (const book of snapshot.books) {
      if (options?.isCancelled?.()) {
        cancelled = true;
        emitProgress("Sync cancelled by user.", "warn");
        break;
      }

      const annotations = snapshot.annotationsByBookId.get(book.uniqueId) ?? [];
      if (annotations.length === 0) {
        skippedBooks += 1;
        processedBooks += 1;
        emitProgress(`Skip ${book.title || book.uniqueId}: no annotations.`);
        continue;
      }

      if (!shouldSyncBook({
        bookId: book.uniqueId,
        annotations,
        folderPath: settings.highlightsFolder,
        fileManager: this.fileManager,
        lastSyncEpochMs,
      })) {
        skippedBooks += 1;
        processedBooks += 1;
        emitProgress(`Skip ${book.title || book.uniqueId}: unchanged since last sync.`);
        continue;
      }

      emitProgress(`Syncing ${book.title || book.uniqueId}...`);
      try {
        await this.fileManager.upsertBookNote({
          book,
          annotations,
          folderPath: settings.highlightsFolder,
          syncedAt,
        });
        booksSynced += 1;
        processedBooks += 1;
        annotationsSynced += annotations.length;
        emitProgress(`Synced ${book.title || book.uniqueId}.`);
      } catch (error) {
        processedBooks += 1;
        const label = book.title || book.uniqueId;
        const message = `${label}: ${String(error)}`;
        errorMessages.push(message);
        emitProgress(`Failed ${label}: ${String(error)}`, "error");
      }
    }

    if (!cancelled) {
      emitProgress("Sync loop finished.");
    }

    return {
      totalBooks: snapshot.books.length,
      booksSynced,
      skippedBooks,
      annotationsSynced,
      errorMessages,
      lastSyncedAt: syncedAt.toISOString(),
      cancelled,
      activityLog,
    };
  }
}

function parseLastSyncAt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function normalizeUpdatedAtToMs(value: number | null): number | null {
  if (typeof value !== "number") {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }

  if (value > 10_000_000_000) {
    return Math.trunc(value);
  }
  return Math.trunc(value * 1000);
}

function shouldSyncBook(options: {
  bookId: string;
  annotations: BooxAnnotation[];
  folderPath: string;
  fileManager: FileManagerLike;
  lastSyncEpochMs: number | null;
}): boolean {
  if (options.lastSyncEpochMs === null) {
    return true;
  }

  if (!options.fileManager.hasBookNote(options.bookId, options.folderPath)) {
    return true;
  }

  let latestUpdatedMs: number | null = null;
  for (const item of options.annotations) {
    const current = normalizeUpdatedAtToMs(item.updatedAt);
    if (current === null) {
      return true;
    }

    if (latestUpdatedMs === null || current > latestUpdatedMs) {
      latestUpdatedMs = current;
    }
  }

  if (latestUpdatedMs === null) {
    return true;
  }
  return latestUpdatedMs > options.lastSyncEpochMs;
}
