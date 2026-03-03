export interface BooxPluginSettings {
  cloudHost: string;
  account: string;
  authToken: string;
  highlightsFolder: string;
  includeInactive: boolean;
  syncOnStartup: boolean;
  lastSyncAt?: string;
}

export interface BooxBook {
  uniqueId: string;
  title: string;
  authors: string;
  status: number | null;
  readingStatus: number | null;
}

export interface BooxAnnotation {
  uniqueId: string;
  documentId: string;
  quote: string;
  note: string;
  chapter: string;
  pageNumber: number | null;
  position: string | null;
  startPosition: string | null;
  endPosition: string | null;
  color: number | null;
  shape: number | null;
  status: number | null;
  updatedAt: number | null;
}

export interface BooxLibrarySnapshot {
  books: BooxBook[];
  annotationsByBookId: Map<string, BooxAnnotation[]>;
}

export interface SyncSummary {
  totalBooks: number;
  booksSynced: number;
  skippedBooks: number;
  annotationsSynced: number;
  errorMessages: string[];
  lastSyncedAt: string;
  cancelled: boolean;
  activityLog: SyncLogEntry[];
}

export interface SyncLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface SyncProgressEvent {
  message: string;
  level: "info" | "warn" | "error";
  totalBooks: number;
  processedBooks: number;
  booksSynced: number;
  skippedBooks: number;
  annotationsSynced: number;
}
