import { describe, expect, it, vi } from "vitest";

import type { BooxPluginSettings } from "../src/types";
import { BooxAuthManager } from "../src/auth/manager";

function buildSettings(overrides?: Partial<BooxPluginSettings>): BooxPluginSettings {
  return {
    cloudHost: "send2boox.com",
    account: "user@example.com",
    authToken: "",
    highlightsFolder: "Boox Highlights",
    includeInactive: false,
    syncOnStartup: false,
    ...overrides,
  };
}

describe("BooxAuthManager", () => {
  it("requests verification code with trimmed account", async () => {
    const requestVerificationCode = vi.fn(async () => undefined);
    const manager = new BooxAuthManager(() => ({
      requestVerificationCode,
      authenticateWithEmailCode: vi.fn(),
    }));

    const account = await manager.requestVerificationCode(
      buildSettings({ account: "  user@example.com  " })
    );

    expect(account).toBe("user@example.com");
    expect(requestVerificationCode).toHaveBeenCalledWith("user@example.com");
  });

  it("fails requesting code when account is empty", async () => {
    const manager = new BooxAuthManager(() => ({
      requestVerificationCode: vi.fn(),
      authenticateWithEmailCode: vi.fn(),
    }));

    await expect(manager.requestVerificationCode(buildSettings({ account: "  " }))).rejects.toThrow(
      "Account is empty"
    );
  });

  it("exchanges code for token", async () => {
    const authenticateWithEmailCode = vi.fn(async () => "  token-123  ");
    const manager = new BooxAuthManager(() => ({
      requestVerificationCode: vi.fn(),
      authenticateWithEmailCode,
    }));

    const result = await manager.exchangeCodeForToken(
      buildSettings({ account: "  user@example.com  " }),
      "  123456  "
    );

    expect(authenticateWithEmailCode).toHaveBeenCalledWith("user@example.com", "123456");
    expect(result).toEqual({
      account: "user@example.com",
      token: "token-123",
    });
  });

  it("fails exchanging code when code is empty", async () => {
    const manager = new BooxAuthManager(() => ({
      requestVerificationCode: vi.fn(),
      authenticateWithEmailCode: vi.fn(),
    }));

    await expect(manager.exchangeCodeForToken(buildSettings(), "   ")).rejects.toThrow(
      "Verification code is empty"
    );
  });

  it("fails exchanging code when token is empty", async () => {
    const manager = new BooxAuthManager(() => ({
      requestVerificationCode: vi.fn(),
      authenticateWithEmailCode: vi.fn(async () => "  "),
    }));

    await expect(manager.exchangeCodeForToken(buildSettings(), "123456")).rejects.toThrow(
      "Received empty token"
    );
  });
});
