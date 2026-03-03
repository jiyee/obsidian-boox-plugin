import type { Command } from "obsidian";

export type BooxCommandPlugin = {
  addCommand(command: Command): Command;
  runSync(trigger?: "command" | "settings" | "startup"): Promise<void>;
  requestLoginCode(): Promise<void>;
  verifyLoginCodeAndSaveToken(): Promise<void>;
  cancelSync(): void;
  showLastSyncReport(): void;
};

export function registerCommands(plugin: BooxCommandPlugin): void {
  plugin.addCommand({
    id: "boox-sync-highlights-notes",
    name: "Sync boox highlights and notes",
    callback: () => {
      void plugin.runSync("command");
    },
  });

  plugin.addCommand({
    id: "boox-auth-request-code",
    name: "Request boox login code",
    callback: () => {
      void plugin.requestLoginCode();
    },
  });

  plugin.addCommand({
    id: "boox-auth-verify-code",
    name: "Verify boox code and save token",
    callback: () => {
      void plugin.verifyLoginCodeAndSaveToken();
    },
  });

  plugin.addCommand({
    id: "boox-sync-cancel",
    name: "Cancel boox sync",
    callback: () => {
      plugin.cancelSync();
    },
  });

  plugin.addCommand({
    id: "boox-sync-show-last-report",
    name: "Show last boox sync report",
    callback: () => {
      plugin.showLastSyncReport();
    },
  });
}
