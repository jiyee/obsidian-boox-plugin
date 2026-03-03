import type { BooxPluginSettings } from "../types";
import type { BooxAuthManager } from "./manager";

export interface CommandLoginFlowDeps {
  getSettings(): BooxPluginSettings;
  updateSettings(update: Partial<BooxPluginSettings>): Promise<void>;
  promptAccount(defaultValue: string): Promise<string | null>;
  promptCode(): Promise<string | null>;
  authManager: Pick<BooxAuthManager, "requestVerificationCode" | "exchangeCodeForToken">;
}

export class CommandLoginFlow {
  constructor(private readonly deps: CommandLoginFlowDeps) {}

  async requestCodeThenVerifyAndSaveToken(): Promise<
    { cancelled: true; account?: string; codeRequested?: boolean } | { cancelled: false; account: string; token: string }
  > {
    const settings = this.deps.getSettings();
    const account = await this.askAccount(settings.account);
    if (!account) {
      return { cancelled: true };
    }

    await this.persistAccountIfNeeded(settings.account, account);

    await this.deps.authManager.requestVerificationCode({
      ...settings,
      account,
    });

    const code = await this.deps.promptCode();
    if (code === null) {
      return {
        cancelled: true,
        account,
        codeRequested: true,
      };
    }

    const result = await this.deps.authManager.exchangeCodeForToken(
      {
        ...settings,
        account,
      },
      code
    );

    await this.deps.updateSettings({
      account: result.account,
      authToken: result.token,
    });

    return {
      cancelled: false,
      account: result.account,
      token: result.token,
    };
  }

  async requestCode(): Promise<{ cancelled: boolean; account?: string }> {
    const settings = this.deps.getSettings();
    const account = await this.askAccount(settings.account);
    if (!account) {
      return { cancelled: true };
    }

    await this.persistAccountIfNeeded(settings.account, account);

    await this.deps.authManager.requestVerificationCode({
      ...settings,
      account,
    });

    return {
      cancelled: false,
      account,
    };
  }

  async verifyCodeAndSaveToken(): Promise<{ cancelled: boolean; account?: string; token?: string }> {
    const settings = this.deps.getSettings();
    const account = await this.askAccount(settings.account);
    if (!account) {
      return { cancelled: true };
    }

    await this.persistAccountIfNeeded(settings.account, account);

    const code = await this.deps.promptCode();
    if (code === null) {
      return { cancelled: true };
    }

    const result = await this.deps.authManager.exchangeCodeForToken(
      {
        ...settings,
        account,
      },
      code
    );

    await this.deps.updateSettings({
      account: result.account,
      authToken: result.token,
    });

    return {
      cancelled: false,
      account: result.account,
      token: result.token,
    };
  }

  private async askAccount(defaultValue: string): Promise<string | null> {
    const raw = await this.deps.promptAccount(defaultValue);
    if (raw === null) {
      return null;
    }

    const normalized = raw.trim();
    if (!normalized) {
      return null;
    }

    return normalized;
  }

  private async persistAccountIfNeeded(previous: string, next: string): Promise<void> {
    if (previous.trim() === next) {
      return;
    }

    await this.deps.updateSettings({ account: next });
  }
}
