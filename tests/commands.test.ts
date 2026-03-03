import { describe, expect, it, vi } from "vitest";

import type { Command } from "obsidian";

import type { BooxCommandPlugin } from "../src/commands";
import { registerCommands } from "../src/commands";

type CommandLike = {
  id: string;
  name: string;
  callback?: () => void;
};

describe("registerCommands", () => {
  it("registers sync and auth commands and wires callbacks", async () => {
    const registered: CommandLike[] = [];
    const runSync = vi.fn(async () => undefined);
    const requestLoginCode = vi.fn(async () => undefined);
    const verifyLoginCodeAndSaveToken = vi.fn(async () => undefined);
    const cancelSync = vi.fn();
    const showLastSyncReport = vi.fn();

    const plugin: BooxCommandPlugin = {
      addCommand: (command: Command) => {
        registered.push({
          id: command.id,
          name: command.name,
          callback: command.callback,
        });
        return command;
      },
      runSync,
      requestLoginCode,
      verifyLoginCodeAndSaveToken,
      cancelSync,
      showLastSyncReport,
    };

    registerCommands(plugin);

    const ids = registered.map((item) => item.id);
    expect(ids).toEqual([
      "boox-sync-highlights-notes",
      "boox-auth-request-code",
      "boox-auth-verify-code",
      "boox-sync-cancel",
      "boox-sync-show-last-report",
    ]);

    registered[0]?.callback?.();
    registered[1]?.callback?.();
    registered[2]?.callback?.();
    registered[3]?.callback?.();
    registered[4]?.callback?.();

    expect(runSync).toHaveBeenCalledWith("command");
    expect(requestLoginCode).toHaveBeenCalledTimes(1);
    expect(verifyLoginCodeAndSaveToken).toHaveBeenCalledTimes(1);
    expect(cancelSync).toHaveBeenCalledTimes(1);
    expect(showLastSyncReport).toHaveBeenCalledTimes(1);
  });
});
