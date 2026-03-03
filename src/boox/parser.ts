import { parseReaderLibrarySnapshot } from "onyx-send2boox-core/browser";

import type { BooxLibrarySnapshot } from "../types";

type JsonObject = Record<string, unknown>;

export function parseBooxLibrarySnapshot(
  docs: JsonObject[],
  options?: { includeInactive?: boolean }
): BooxLibrarySnapshot {
  const snapshot = parseReaderLibrarySnapshot(docs, options);
  return {
    books: snapshot.books,
    annotationsByBookId: snapshot.annotationsByBookId,
  };
}
