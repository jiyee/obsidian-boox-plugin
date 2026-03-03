import { BooxLibraryClient } from "../boox/client";
import type { BooxPluginSettings } from "../types";

export interface BooxAuthClient {
  requestVerificationCode(account: string): Promise<void>;
  authenticateWithEmailCode(account: string, code: string): Promise<string>;
}

export type BooxAuthClientFactory = (options: {
  cloudHost: string;
  token: string;
}) => BooxAuthClient;

export class BooxAuthManager {
  constructor(private readonly createClient: BooxAuthClientFactory = defaultAuthClientFactory) {}

  async requestVerificationCode(settings: BooxPluginSettings): Promise<string> {
    const account = normalizeAccount(settings.account);
    if (!account) {
      throw new Error("Account is empty. Set account in settings first.");
    }

    const client = this.createClient({
      cloudHost: settings.cloudHost,
      token: settings.authToken,
    });

    await client.requestVerificationCode(account);
    return account;
  }

  async exchangeCodeForToken(
    settings: BooxPluginSettings,
    codeInput: string
  ): Promise<{ account: string; token: string }> {
    const account = normalizeAccount(settings.account);
    if (!account) {
      throw new Error("Account is empty. Set account in settings first.");
    }

    const code = normalizeCode(codeInput);
    if (!code) {
      throw new Error("Verification code is empty.");
    }

    const client = this.createClient({
      cloudHost: settings.cloudHost,
      token: settings.authToken,
    });

    const token = (await client.authenticateWithEmailCode(account, code)).trim();
    if (!token) {
      throw new Error("Received empty token from boox.");
    }

    return {
      account,
      token,
    };
  }
}

function normalizeAccount(value: string): string {
  return value.trim();
}

function normalizeCode(value: string): string {
  return value.trim();
}

function defaultAuthClientFactory(options: {
  cloudHost: string;
  token: string;
}): BooxAuthClient {
  return new BooxLibraryClient(options);
}
