import { MetadataCache, normalizePath, TFile, Vault } from "obsidian";

import { renderBookNote } from "../render/noteRenderer";
import type { BooxAnnotation, BooxBook } from "../types";
import { BOOX_BOOK_ID_KEY, buildDefaultFileBaseName, normalizeFolderPath } from "./mappers";

export class BooxFileManager {
  constructor(
    private readonly vault: Vault,
    private readonly metadataCache: MetadataCache
  ) {}

  async upsertBookNote(options: {
    book: BooxBook;
    annotations: BooxAnnotation[];
    folderPath: string;
    syncedAt: Date;
  }): Promise<TFile> {
    const folderPath = normalizeFolderPath(options.folderPath);
    if (folderPath) {
      await this.ensureFolder(folderPath);
    }

    const existing = this.findBookFile(options.book.uniqueId, folderPath);
    const rendered = renderBookNote({
      book: options.book,
      annotations: options.annotations,
      syncedAt: options.syncedAt,
    });

    if (existing) {
      await this.vault.modify(existing, rendered);
      return existing;
    }

    const baseName = buildDefaultFileBaseName(options.book);
    const fileName = this.resolveAvailableFileName(baseName, folderPath);
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    return await this.vault.create(normalizePath(filePath), rendered);
  }

  hasBookNote(bookId: string, folderPath: string): boolean {
    return this.findBookFile(bookId, folderPath) !== null;
  }

  private findBookFile(bookId: string, folderPath: string): TFile | null {
    const normalizedFolder = normalizeFolderPath(folderPath);
    const files = this.vault.getMarkdownFiles();

    for (const file of files) {
      if (!belongsToFolder(file.path, normalizedFolder)) {
        continue;
      }

      const frontmatter = this.metadataCache.getFileCache(file)?.frontmatter as
        | Record<string, unknown>
        | undefined;
      if (!frontmatter) {
        continue;
      }

      const rawValue = frontmatter[BOOX_BOOK_ID_KEY];
      if (typeof rawValue !== "string") {
        continue;
      }

      if (rawValue.trim() === bookId) {
        return file;
      }
    }

    return null;
  }

  private resolveAvailableFileName(baseName: string, folderPath: string): string {
    let candidate = `${baseName}.md`;
    let index = 2;

    while (this.fileExists(candidate, folderPath)) {
      candidate = `${baseName}-${index}.md`;
      index += 1;
    }

    return candidate;
  }

  private fileExists(fileName: string, folderPath: string): boolean {
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    return this.vault.getAbstractFileByPath(normalizePath(filePath)) !== null;
  }

  private async ensureFolder(path: string): Promise<void> {
    const segments = normalizeFolderPath(path)
      .split("/")
      .filter((segment) => segment.length > 0);

    let currentPath = "";
    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const normalized = normalizePath(currentPath);
      if (this.vault.getAbstractFileByPath(normalized)) {
        continue;
      }
      await this.vault.createFolder(normalized);
    }
  }
}

function belongsToFolder(filePath: string, folderPath: string): boolean {
  if (!folderPath) {
    return !normalizePath(filePath).includes("/");
  }

  const normalizedFilePath = normalizePath(filePath);
  const normalizedFolder = normalizePath(folderPath);
  return normalizedFilePath.startsWith(`${normalizedFolder}/`);
}
