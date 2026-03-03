import { App, Modal, Setting } from "obsidian";

export class TextInputModal extends Modal {
  private resolveValue: ((value: string | null) => void) | null = null;
  private inputEl!: HTMLInputElement;
  private settled = false;

  constructor(
    app: App,
    private readonly options: {
      title: string;
      description: string;
      placeholder?: string;
      confirmText?: string;
      defaultValue?: string;
    }
  ) {
    super(app);
  }

  async openAndGetValue(): Promise<string | null> {
    return await new Promise<string | null>((resolve) => {
      this.resolveValue = resolve;
      this.open();
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", { text: this.options.description });

    new Setting(contentEl).addText((text) => {
      this.inputEl = text.inputEl;
      text
        .setPlaceholder(this.options.placeholder ?? "")
        .setValue(this.options.defaultValue ?? "");
    });

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText(this.options.confirmText ?? "Confirm")
          .setCta()
          .onClick(() => this.confirm());
      })
      .addButton((button) => {
        button.setButtonText("Cancel").onClick(() => this.cancel());
      });

    this.inputEl.focus();
    this.inputEl.select();

    this.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.confirm();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this.cancel();
      }
    });
  }

  onClose(): void {
    this.contentEl.empty();

    if (!this.settled) {
      this.resolve(null);
    }
  }

  private confirm(): void {
    this.resolve(this.inputEl?.value ?? "");
    this.close();
  }

  private cancel(): void {
    this.resolve(null);
    this.close();
  }

  private resolve(value: string | null): void {
    if (this.settled) {
      return;
    }

    this.settled = true;
    this.resolveValue?.(value);
  }
}
