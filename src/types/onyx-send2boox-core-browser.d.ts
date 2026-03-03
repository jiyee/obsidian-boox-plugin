declare module "onyx-send2boox-core/browser" {
  export interface CookieRecord {
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    expires?: number;
    rest?: Record<string, unknown>;
  }

  export class CookieJar implements Iterable<CookieRecord> {
    setCookie(cookie: CookieRecord): void;
    [Symbol.iterator](): Iterator<CookieRecord>;
    toArray(): CookieRecord[];
    buildCookieHeader(url: URL): string | null;
  }

  export interface HttpResponseLike {
    status: number;
    json(): Promise<unknown>;
  }

  export interface HttpSession {
    cookies: CookieJar;
    request(options: {
      method: string;
      url: string;
      params?: Record<string, unknown>;
      json?: Record<string, unknown>;
      headers?: Record<string, string>;
      timeoutSeconds: number;
    }): Promise<HttpResponseLike>;
  }

  export interface ReaderLibraryBook {
    uniqueId: string;
    title: string;
    authors: string;
    status: number | null;
    readingStatus: number | null;
  }

  export interface ReaderLibraryAnnotation {
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

  export interface ReaderLibrarySnapshot {
    books: ReaderLibraryBook[];
    annotationsByBookId: Map<string, ReaderLibraryAnnotation[]>;
  }

  export class BooxApi {
    token: string;
    constructor(options: {
      cloud: string;
      token?: string | null;
      apiPrefix?: string;
      timeoutSeconds?: number;
      session?: HttpSession;
    });
    setToken(token: string): void;
    request(
      endpoint: string,
      options?: {
        method?: string;
        params?: Record<string, unknown>;
        jsonData?: Record<string, unknown>;
        headers?: Record<string, string>;
        requireAuth?: boolean;
      }
    ): Promise<Record<string, unknown>>;
    requestPath(
      path: string,
      options?: {
        method?: string;
        params?: Record<string, unknown>;
        jsonData?: Record<string, unknown>;
        headers?: Record<string, string>;
        requireAuth?: boolean;
      }
    ): Promise<Record<string, unknown>>;
  }

  export function fetchReaderLibrarySnapshot(options: {
    api: BooxApi;
    includeInactive?: boolean;
  }): Promise<ReaderLibrarySnapshot>;

  export function parseReaderLibrarySnapshot(
    docs: Record<string, unknown>[],
    options?: { includeInactive?: boolean }
  ): ReaderLibrarySnapshot;
}
