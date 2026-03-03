import { describe, expect, it, vi } from "vitest";

import type { BooxPluginSettings } from "../src/types";
import { CommandLoginFlow } from "../src/auth/commandLoginFlow";

function buildSettings(overrides?: Partial<BooxPluginSettings>): BooxPluginSettings {
  return {
    cloudHost: "send2boox.com",
    account: "saved@example.com",
    authToken: "",
    highlightsFolder: "Boox Highlights",
    includeInactive: false,
    syncOnStartup: false,
    ...overrides,
  };
}

describe("CommandLoginFlow", () => {
  it("completes login by requesting code then verifying token with one account prompt", async () => {
    const requestVerificationCode = vi.fn(async () => undefined);
    const exchangeCodeForToken = vi.fn(async () => ({
      account: "new@example.com",
      token: "token-123",
    }));
    const updateSettings = vi.fn(async () => undefined);
    const promptAccount = vi.fn(async () => "  new@example.com ");
    const promptCode = vi.fn(async () => " 123456 ");

    const flow = new CommandLoginFlow({
      getSettings: () => buildSettings({ account: "saved@example.com" }),
      updateSettings,
      promptAccount,
      promptCode,
      authManager: {
        requestVerificationCode,
        exchangeCodeForToken,
      },
    });

    const result = await flow.requestCodeThenVerifyAndSaveToken();

    expect(result).toEqual({
      cancelled: false,
      account: "new@example.com",
      token: "token-123",
    });
    expect(promptAccount).toHaveBeenCalledTimes(1);
    expect(promptCode).toHaveBeenCalledTimes(1);
    expect(requestVerificationCode).toHaveBeenCalledWith(
      expect.objectContaining({ account: "new@example.com" })
    );
    expect(exchangeCodeForToken).toHaveBeenCalledWith(
      expect.objectContaining({ account: "new@example.com" }),
      " 123456 "
    );
    expect(updateSettings).toHaveBeenNthCalledWith(1, { account: "new@example.com" });
    expect(updateSettings).toHaveBeenNthCalledWith(2, {
      account: "new@example.com",
      authToken: "token-123",
    });
  });

  it("returns cancelled when code prompt is closed after sending verification code", async () => {
    const requestVerificationCode = vi.fn(async () => undefined);
    const exchangeCodeForToken = vi.fn();
    const updateSettings = vi.fn(async () => undefined);

    const flow = new CommandLoginFlow({
      getSettings: () => buildSettings({ account: "saved@example.com" }),
      updateSettings,
      promptAccount: vi.fn(async () => "new@example.com"),
      promptCode: vi.fn(async () => null),
      authManager: {
        requestVerificationCode,
        exchangeCodeForToken,
      },
    });

    const result = await flow.requestCodeThenVerifyAndSaveToken();

    expect(result).toEqual({
      cancelled: true,
      account: "new@example.com",
      codeRequested: true,
    });
    expect(requestVerificationCode).toHaveBeenCalledWith(
      expect.objectContaining({ account: "new@example.com" })
    );
    expect(exchangeCodeForToken).not.toHaveBeenCalled();
  });

  it("requests code using prompted account and persists account", async () => {
    const requestVerificationCode = vi.fn(async () => "new@example.com");
    const exchangeCodeForToken = vi.fn();
    const updateSettings = vi.fn(async () => undefined);

    const flow = new CommandLoginFlow({
      getSettings: () => buildSettings({ account: "saved@example.com" }),
      updateSettings,
      promptAccount: vi.fn(async () => "  new@example.com  "),
      promptCode: vi.fn(async () => null),
      authManager: {
        requestVerificationCode,
        exchangeCodeForToken,
      },
    });

    const result = await flow.requestCode();

    expect(result).toEqual({ cancelled: false, account: "new@example.com" });
    expect(updateSettings).toHaveBeenCalledWith({ account: "new@example.com" });
    expect(requestVerificationCode).toHaveBeenCalledWith(
      expect.objectContaining({ account: "new@example.com" })
    );
    expect(exchangeCodeForToken).not.toHaveBeenCalled();
  });

  it("returns cancelled when account prompt is cancelled", async () => {
    const requestVerificationCode = vi.fn();

    const flow = new CommandLoginFlow({
      getSettings: () => buildSettings(),
      updateSettings: vi.fn(async () => undefined),
      promptAccount: vi.fn(async () => null),
      promptCode: vi.fn(async () => null),
      authManager: {
        requestVerificationCode,
        exchangeCodeForToken: vi.fn(),
      },
    });

    const result = await flow.requestCode();
    expect(result).toEqual({ cancelled: true });
    expect(requestVerificationCode).not.toHaveBeenCalled();
  });

  it("verifies code and persists account and token", async () => {
    const exchangeCodeForToken = vi.fn(async () => ({
      account: "new@example.com",
      token: "token-123",
    }));
    const updateSettings = vi.fn(async () => undefined);

    const flow = new CommandLoginFlow({
      getSettings: () => buildSettings({ account: "saved@example.com" }),
      updateSettings,
      promptAccount: vi.fn(async () => "new@example.com"),
      promptCode: vi.fn(async () => "  123456  "),
      authManager: {
        requestVerificationCode: vi.fn(),
        exchangeCodeForToken,
      },
    });

    const result = await flow.verifyCodeAndSaveToken();

    expect(result).toEqual({
      cancelled: false,
      account: "new@example.com",
      token: "token-123",
    });

    expect(exchangeCodeForToken).toHaveBeenCalledWith(
      expect.objectContaining({ account: "new@example.com" }),
      "  123456  "
    );

    expect(updateSettings).toHaveBeenNthCalledWith(1, { account: "new@example.com" });
    expect(updateSettings).toHaveBeenNthCalledWith(2, {
      account: "new@example.com",
      authToken: "token-123",
    });
  });

  it("returns cancelled when verification code prompt is cancelled", async () => {
    const exchangeCodeForToken = vi.fn();

    const flow = new CommandLoginFlow({
      getSettings: () => buildSettings({ account: "saved@example.com" }),
      updateSettings: vi.fn(async () => undefined),
      promptAccount: vi.fn(async () => "new@example.com"),
      promptCode: vi.fn(async () => null),
      authManager: {
        requestVerificationCode: vi.fn(),
        exchangeCodeForToken,
      },
    });

    const result = await flow.verifyCodeAndSaveToken();
    expect(result).toEqual({ cancelled: true });
    expect(exchangeCodeForToken).not.toHaveBeenCalled();
  });
});
