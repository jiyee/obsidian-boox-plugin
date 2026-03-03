import { CookieJar } from "onyx-send2boox-core/browser";

type RequestUrlLikeParams = {
  url: string;
  method?: string;
  body?: string | ArrayBuffer;
  headers?: Record<string, string>;
  throw?: boolean;
};

type RequestUrlLikeResponse = {
  status: number;
  text: string;
  json: unknown;
};

export type RequestUrlLike = (
  params: RequestUrlLikeParams
) => Promise<RequestUrlLikeResponse>;

export interface BooxHttpResponseLike {
  status: number;
  json(): Promise<unknown>;
}

export interface CookieJarLike {
  setCookie(cookie: {
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    expires?: number;
  }): void;
  buildCookieHeader(url: URL): string | null;
  toArray(): Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    expires?: number;
  }>;
  [Symbol.iterator](): Iterator<{
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    expires?: number;
  }>;
}

export interface BooxHttpSession {
  cookies: CookieJarLike;
  request(options: {
    method: string;
    url: string;
    params?: Record<string, unknown>;
    json?: Record<string, unknown>;
    headers?: Record<string, string>;
    timeoutSeconds: number;
  }): Promise<BooxHttpResponseLike>;
}

export function createObsidianHttpSession(requestUrl: RequestUrlLike): BooxHttpSession {
  return new ObsidianHttpSession(requestUrl);
}

class ObsidianHttpSession implements BooxHttpSession {
  cookies: CookieJarLike = new CookieJar();

  constructor(private readonly requestUrl: RequestUrlLike) {}

  async request(options: {
    method: string;
    url: string;
    params?: Record<string, unknown>;
    json?: Record<string, unknown>;
    headers?: Record<string, string>;
    timeoutSeconds: number;
  }): Promise<BooxHttpResponseLike> {
    const requestUrl = new URL(options.url);
    const requestHeaders: Record<string, string> = { ...(options.headers ?? {}) };

    for (const [key, value] of Object.entries(options.params ?? {})) {
      requestUrl.searchParams.set(key, String(value));
    }

    const cookieHeader = this.cookies.buildCookieHeader(requestUrl);
    if (cookieHeader && !requestHeaders.Cookie && !requestHeaders.cookie) {
      requestHeaders.Cookie = cookieHeader;
    }

    const response = await withTimeout(
      this.requestUrl({
        url: requestUrl.toString(),
        method: options.method,
        body: options.json === undefined ? undefined : JSON.stringify(options.json),
        headers: requestHeaders,
        throw: false,
      }),
      Math.max(options.timeoutSeconds, 0) * 1000
    );

    return {
      status: response.status,
      json: async (): Promise<unknown> => parseResponseJson(response),
    };
  }
}

function parseResponseJson(response: RequestUrlLikeResponse): unknown {
  if (typeof response.text === "string") {
    return JSON.parse(response.text);
  }

  throw new Error("Response body is not JSON.");
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) {
    return promise;
  }

  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`HTTP request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}
