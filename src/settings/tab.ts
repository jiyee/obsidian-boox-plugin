import { App, PluginSettingTab, Setting } from "obsidian";

import type BooxHighlightsPlugin from "../main";
import { runLoginActionAndRefresh } from "./loginActionRunner";
import { getLoginSettingsRows } from "./loginConfig";

export class BooxSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: BooxHighlightsPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Boox sync").setHeading();

    new Setting(containerEl)
      .setName("Send2boox host")
      .setDesc("Server host used by the plugin")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.cloudHost)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ cloudHost: value.trim() || "send2boox.com" });
          });
      });

    new Setting(containerEl)
      .setName("Account")
      .setDesc("Email or mobile used when requesting and verifying login code")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.account)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ account: value.trim() });
          });
      });

    for (const row of getLoginSettingsRows()) {
      new Setting(containerEl)
        .setName(row.name)
        .setDesc(row.desc)
        .addButton((button) => {
          button.setButtonText(row.buttonText).onClick(async () => {
            button.setDisabled(true).setButtonText("Sending...");
            try {
              await runLoginActionAndRefresh({
                plugin: this.plugin,
                action: row.action,
                refresh: () => this.display(),
              });
            } finally {
              button.setDisabled(false).setButtonText(row.buttonText);
            }
          });
        });
    }

    new Setting(containerEl)
      .setName("Auth token")
      .setDesc("Paste your send2boox token. Required for syncing.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("SEND2BOOX_TOKEN")
          .setValue(this.plugin.settings.authToken)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ authToken: value.trim() });
          });
      });

    new Setting(containerEl)
      .setName("Highlights folder")
      .setDesc("Vault folder where boox notes will be created")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.highlightsFolder)
          .onChange(async (value) => {
            await this.plugin.updateSettings({ highlightsFolder: value.trim() || "Boox Highlights" });
          });
      });

    new Setting(containerEl)
      .setName("Include inactive")
      .setDesc("Include deleted/archived books and annotations returned by boox")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.includeInactive).onChange(async (value) => {
          await this.plugin.updateSettings({ includeInactive: value });
        });
      });

    new Setting(containerEl)
      .setName("Sync on startup")
      .setDesc("Run one sync shortly after Obsidian loads")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.syncOnStartup).onChange(async (value) => {
          await this.plugin.updateSettings({ syncOnStartup: value });
        });
      });

    new Setting(containerEl)
      .setName("Run sync now")
      .setDesc("Trigger a manual boox sync immediately")
      .addButton((button) => {
        button.setButtonText("Sync now").onClick(async () => {
          button.setDisabled(true).setButtonText("Syncing...");
          try {
            await this.plugin.runSync("settings");
          } finally {
            button.setDisabled(false).setButtonText("Sync now");
          }
        });
      });

    new Setting(containerEl)
      .setName("Cancel sync")
      .setDesc("Request cancellation for the current sync")
      .addButton((button) => {
        button.setButtonText("Cancel sync").onClick(() => {
          this.plugin.cancelSync();
        });
      });

    new Setting(containerEl)
      .setName("Show last sync report")
      .setDesc("Open the latest sync report with logs and errors")
      .addButton((button) => {
        button.setButtonText("Show report").onClick(() => {
          this.plugin.showLastSyncReport();
        });
      });

    if (this.plugin.settings.lastSyncAt) {
      new Setting(containerEl)
        .setName("Last successful sync")
        .setDesc(new Date(this.plugin.settings.lastSyncAt).toLocaleString());
    }
  }
}
