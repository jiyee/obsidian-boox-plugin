import { Notice, Plugin, requestUrl } from "obsidian";

import { CommandLoginFlow } from "./auth/commandLoginFlow";
import { BooxAuthManager } from "./auth/manager";
import { BooxLibraryClient } from "./boox/client";
import { createObsidianHttpSession } from "./boox/obsidianHttpSession";
import { registerCommands } from "./commands";
import { BooxFileManager } from "./file/manager";
import { DEFAULT_SETTINGS, mergeSettings } from "./settings/defaults";
import { BooxSettingTab } from "./settings/tab";
import { BooxSyncManager } from "./sync/manager";
import type { BooxPluginSettings } from "./types";
import type { SyncProgressEvent, SyncSummary } from "./types";
import { SyncReportModal } from "./ui/syncReportModal";
import { TextInputModal } from "./ui/textInputModal";

export default class BooxHighlightsPlugin extends Plugin {
  settings: BooxPluginSettings = DEFAULT_SETTINGS;
  private syncManager!: BooxSyncManager;
  private authManager!: BooxAuthManager;
  private syncInProgress = false;
  private syncCancelRequested = false;
  private ribbonIconEl: HTMLElement | null = null;
  private statusBarEl: HTMLElement | null = null;
  private lastSyncSummary: SyncSummary | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    const createHttpSession = () => createObsidianHttpSession(requestUrl);
    const fileManager = new BooxFileManager(this.app.vault, this.app.metadataCache);
    this.syncManager = new BooxSyncManager(
      fileManager,
      (settings) =>
        new BooxLibraryClient({
          cloudHost: settings.cloudHost,
          token: settings.authToken,
          session: createHttpSession(),
        })
    );
    this.authManager = new BooxAuthManager((options) =>
      new BooxLibraryClient({
        cloudHost: options.cloudHost,
        token: options.token,
        session: createHttpSession(),
      })
    );

    this.ribbonIconEl = this.addRibbonIcon(
      "book-open-text",
      "Sync boox highlights and notes",
      () => {
        void this.runSync("command");
      }
    );
    this.statusBarEl = this.addStatusBarItem();
    this.statusBarEl.setText("Boox: idle");
    this.statusBarEl.addClass("mod-clickable");
    this.statusBarEl.onClickEvent(() => {
      this.showLastSyncReport();
    });

    registerCommands(this);
    this.addSettingTab(new BooxSettingTab(this.app, this));

    if (this.settings.syncOnStartup) {
      window.setTimeout(() => {
        void this.runSync("startup");
      }, 250);
    }
  }

  async runSync(trigger: "command" | "settings" | "startup" = "command"): Promise<void> {
    if (this.syncInProgress) {
      new Notice("Boox sync is already running.");
      return;
    }

    this.syncInProgress = true;
    this.syncCancelRequested = false;
    this.ribbonIconEl?.toggleClass("boox-syncing", true);
    this.setStatusBar("Boox: starting sync...");
    new Notice(`Boox sync started (${trigger}).`);

    try {
      const summary = await this.syncManager.sync(this.settings, {
        isCancelled: () => this.syncCancelRequested,
        onProgress: (event) => {
          this.updateStatusFromProgress(event);
        },
      });
      this.lastSyncSummary = summary;
      if (!summary.cancelled && summary.errorMessages.length === 0) {
        this.settings.lastSyncAt = summary.lastSyncedAt;
        await this.saveSettings();
      }

      if (summary.cancelled) {
        new Notice(
          `Boox sync cancelled: ${summary.booksSynced} book(s), ${summary.annotationsSynced} annotation(s).`,
          7000
        );
      } else {
        const failureSuffix =
          summary.errorMessages.length === 0
            ? ""
            : `, ${summary.errorMessages.length} book(s) failed`;
        new Notice(
          `Boox sync complete: ${summary.booksSynced} book(s), ${summary.annotationsSynced} annotation(s)${failureSuffix}.`,
          7000
        );
      }

      if (summary.errorMessages.length > 0 || summary.cancelled) {
        console.error("Boox sync errors:", summary.errorMessages);
        this.showSyncReport(summary);
      }

      this.setStatusBar(
        summary.cancelled
          ? `Boox: cancelled (${summary.booksSynced}/${summary.totalBooks})`
          : `Boox: synced ${summary.booksSynced}/${summary.totalBooks} books`
      );
    } catch (error) {
      const message = `Boox sync failed: ${String(error)}`;
      console.error(message, error);
      new Notice(message, 10000);
      this.setStatusBar("Boox: sync failed");
    } finally {
      this.syncInProgress = false;
      this.syncCancelRequested = false;
      this.ribbonIconEl?.toggleClass("boox-syncing", false);
    }
  }

  async requestLoginCode(): Promise<void> {
    try {
      const flow = this.createCommandLoginFlow();
      const result = await flow.requestCodeThenVerifyAndSaveToken();
      if (result.cancelled) {
        if (result.codeRequested && result.account) {
          new Notice(`Verification code sent for ${result.account}. Run verify command to finish login.`, 7000);
        }
        return;
      }

      new Notice("Boox login successful. Token saved.", 7000);
    } catch (error) {
      const message = `Request login code failed: ${String(error)}`;
      console.error(message, error);
      new Notice(message, 10000);
    }
  }

  async verifyLoginCodeAndSaveToken(): Promise<void> {
    try {
      const flow = this.createCommandLoginFlow();
      const result = await flow.verifyCodeAndSaveToken();
      if (result.cancelled) {
        return;
      }

      new Notice("Boox login successful. Token saved.", 7000);
    } catch (error) {
      const message = `Verify code failed: ${String(error)}`;
      console.error(message, error);
      new Notice(message, 10000);
    }
  }

  cancelSync(): void {
    if (!this.syncInProgress) {
      new Notice("No boox sync is currently running.");
      return;
    }

    this.syncCancelRequested = true;
    this.setStatusBar("Boox: cancellation requested...");
    new Notice("Boox sync cancellation requested.");
  }

  showLastSyncReport(): void {
    if (!this.lastSyncSummary) {
      new Notice("No boox sync report available yet.");
      return;
    }
    this.showSyncReport(this.lastSyncSummary);
  }

  async updateSettings(update: Partial<BooxPluginSettings>): Promise<void> {
    this.settings = {
      ...this.settings,
      ...update,
    };
    await this.saveSettings();
  }

  private async loadSettings(): Promise<void> {
    const stored: unknown = await this.loadData();
    this.settings = mergeSettings(stored);
  }

  private async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private showSyncReport(summary: SyncSummary): void {
    new SyncReportModal(this.app, summary).open();
  }

  private setStatusBar(text: string): void {
    this.statusBarEl?.setText(text);
  }

  private updateStatusFromProgress(event: SyncProgressEvent): void {
    const prefix = `Boox: ${event.processedBooks}/${event.totalBooks}`;
    const stats = ` synced ${event.booksSynced}, skipped ${event.skippedBooks}`;
    this.setStatusBar(`${prefix}${stats} | ${event.message}`);
  }

  private createCommandLoginFlow(): CommandLoginFlow {
    return new CommandLoginFlow({
      getSettings: () => this.settings,
      updateSettings: async (update) => {
        await this.updateSettings(update);
      },
      promptAccount: async (defaultValue) => {
        return await new TextInputModal(this.app, {
          title: "Boox login account",
          description: "Enter the email or mobile used for boox login.",
          placeholder: "name@example.com",
          confirmText: "Continue",
          defaultValue,
        }).openAndGetValue();
      },
      promptCode: async () => {
        return await new TextInputModal(this.app, {
          title: "Verify boox login code",
          description: "Enter the verification code you received.",
          placeholder: "123456",
          confirmText: "Verify",
        }).openAndGetValue();
      },
      authManager: this.authManager,
    });
  }
}
