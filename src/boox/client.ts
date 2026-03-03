import { BooxApi, fetchReaderLibrarySnapshot } from "onyx-send2boox-core/browser";
import type { BooxHttpSession } from "./obsidianHttpSession";

import type { BooxLibrarySnapshot } from "../types";

export class BooxLibraryClient {
  private readonly api: BooxApi;

  constructor(options: { cloudHost: string; token: string; session?: BooxHttpSession }) {
    this.api = new BooxApi({
      cloud: normalizeCloudHost(options.cloudHost),
      token: options.token,
      session: options.session,
    });
  }

  setToken(token: string): void {
    this.api.setToken(token);
  }

  async requestVerificationCode(account: string): Promise<void> {
    await this.api.request("users/sendMobileCode", {
      jsonData: { mobi: account },
      requireAuth: false,
    });
  }

  async authenticateWithEmailCode(account: string, code: string): Promise<string> {
    const payload = await this.api.request("users/signupByPhoneOrEmail", {
      jsonData: { mobi: account, code },
      requireAuth: false,
    });

    const token = readNestedString(payload, ["data", "token"]);
    if (!token) {
      throw new Error("Token is missing in Boox login response.");
    }

    this.setToken(token);
    return token;
  }

  async fetchLibrarySnapshot(options?: { includeInactive?: boolean }): Promise<BooxLibrarySnapshot> {
    this.requireToken();
    const snapshot = await fetchReaderLibrarySnapshot({
      api: this.api,
      includeInactive: options?.includeInactive ?? false,
    });

    return {
      books: snapshot.books,
      annotationsByBookId: snapshot.annotationsByBookId,
    };
  }

  private requireToken(): void {
    if (!this.api.token.trim()) {
      throw new Error("Boox auth token is empty. Set token in plugin settings first.");
    }
  }
}

function readNestedString(payload: Record<string, unknown>, path: string[]): string {
  let current: unknown = payload;
  for (const key of path) {
    if (current === null || typeof current !== "object" || Array.isArray(current)) {
      return "";
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current.trim() : "";
}

function normalizeCloudHost(value: string): string {
  const fallback = "send2boox.com";
  const normalized = value.trim();
  if (!normalized) {
    return fallback;
  }

  const noScheme = normalized.replace(/^https?:\/\//i, "");
  const hostOnly = noScheme.split("/")[0];
  return hostOnly || fallback;
}
