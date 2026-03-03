import { App, Modal, Setting } from "obsidian";

import type { SyncSummary } from "../types";

export class SyncReportModal extends Modal {
  constructor(
    app: App,
    private readonly summary: SyncSummary
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Boox sync report" });

    const summaryLines = [
      `Total books: ${this.summary.totalBooks}`,
      `Books synced: ${this.summary.booksSynced}`,
      `Books skipped: ${this.summary.skippedBooks}`,
      `Annotations synced: ${this.summary.annotationsSynced}`,
      `Cancelled: ${this.summary.cancelled ? "yes" : "no"}`,
      `Finished at: ${new Date(this.summary.lastSyncedAt).toLocaleString()}`,
    ];

    contentEl.createEl("pre", { text: summaryLines.join("\n") });

    if (this.summary.errorMessages.length > 0) {
      contentEl.createEl("h3", { text: "Errors" });
      contentEl.createEl("pre", { text: this.summary.errorMessages.join("\n") });
    }

    if (this.summary.activityLog.length > 0) {
      contentEl.createEl("h3", { text: "Activity log" });
      const logBlock = contentEl.createEl("textarea");
      logBlock.rows = 16;
      logBlock.cols = 80;
      logBlock.readOnly = true;
      logBlock.value = this.summary.activityLog
        .map((item) => `[${item.timestamp}] [${item.level}] ${item.message}`)
        .join("\n");

      new Setting(contentEl)
        .addButton((button) => {
          button.setButtonText("Copy log").setCta().onClick(() => {
            void copyText(logBlock.value).catch((error) => {
              console.error("Failed to copy sync log:", error);
            });
          });
        })
        .addButton((button) => {
          button.setButtonText("Close").onClick(() => this.close());
        });
      return;
    }

    new Setting(contentEl).addButton((button) => {
      button.setButtonText("Close").setCta().onClick(() => this.close());
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

async function copyText(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
  } else {
    throw new Error("Clipboard API is not available in this environment.");
  }
}
