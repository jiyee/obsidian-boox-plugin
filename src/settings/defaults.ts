import type { BooxPluginSettings } from "../types";

export const DEFAULT_SETTINGS: BooxPluginSettings = {
  cloudHost: "send2boox.com",
  account: "",
  authToken: "",
  highlightsFolder: "Boox Highlights",
  includeInactive: false,
  syncOnStartup: false,
};

export function mergeSettings(storedData: unknown): BooxPluginSettings {
  const input = isObject(storedData) ? storedData : {};

  return {
    cloudHost: readString(input, "cloudHost", DEFAULT_SETTINGS.cloudHost),
    account: readString(input, "account", DEFAULT_SETTINGS.account),
    authToken: readString(input, "authToken", DEFAULT_SETTINGS.authToken),
    highlightsFolder: readString(input, "highlightsFolder", DEFAULT_SETTINGS.highlightsFolder),
    includeInactive: readBoolean(input, "includeInactive", DEFAULT_SETTINGS.includeInactive),
    syncOnStartup: readBoolean(input, "syncOnStartup", DEFAULT_SETTINGS.syncOnStartup),
    lastSyncAt: readOptionalString(input, "lastSyncAt"),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readString(
  input: Record<string, unknown>,
  key: keyof BooxPluginSettings,
  fallback: string
): string {
  const value = input[key];
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized === "" ? fallback : normalized;
}

function readOptionalString(
  input: Record<string, unknown>,
  key: keyof BooxPluginSettings
): string | undefined {
  const value = input[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
}

function readBoolean(
  input: Record<string, unknown>,
  key: keyof BooxPluginSettings,
  fallback: boolean
): boolean {
  const value = input[key];
  return typeof value === "boolean" ? value : fallback;
}
