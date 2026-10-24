/**
 * File Service — platform file system operations
 * Keeps all OS-level file access in the main process, behind the IPC bridge.
 */

import fs from 'fs';
import path from 'path';
import { dialog, shell } from 'electron';
import { SettingsService } from './SettingsService';

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

export interface OpenDialogOptions {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  multiSelections?: boolean;
  defaultPath?: string;
}

export class FileService {
  constructor(private settings: SettingsService) {}

  async ensureDirectories(): Promise<void> {
    const dirs = [
      this.settings.getResourceLibraryPath(),
      this.settings.getLessonsPath(),
      this.settings.getAutosavePath(),
      path.join(this.settings.getResourceLibraryPath(), 'Images'),
      path.join(this.settings.getResourceLibraryPath(), 'Backgrounds'),
      path.join(this.settings.getResourceLibraryPath(), 'Shapes'),
      path.join(this.settings.getResourceLibraryPath(), 'Mathematics'),
      path.join(this.settings.getResourceLibraryPath(), 'Physics'),
      path.join(this.settings.getResourceLibraryPath(), 'Chemistry'),
      path.join(this.settings.getResourceLibraryPath(), 'ComputerScience'),
      path.join(this.settings.getResourceLibraryPath(), 'Audio'),
      path.join(this.settings.getResourceLibraryPath(), 'Video'),
      path.join(this.settings.getResourceLibraryPath(), 'PDF'),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    this.validatePath(filePath);
    return fs.promises.readFile(filePath);
  }

  async writeFile(filePath: string, data: string | Buffer): Promise<void> {
    this.validatePath(filePath);
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, data, 'utf8');
  }

  async writeFileBinary(filePath: string, data: Buffer): Promise<void> {
    this.validatePath(filePath);
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, data);
  }

  async deleteFile(filePath: string): Promise<void> {
    this.validatePath(filePath);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    return fs.existsSync(filePath);
  }

  async listDirectory(dirPath: string): Promise<string[]> {
    if (!fs.existsSync(dirPath)) return [];
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map(e => e.name);
  }

  async showOpenDialog(options: OpenDialogOptions): Promise<string[] | null> {
    const result = await dialog.showOpenDialog({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
      properties: options.multiSelections
        ? ['openFile', 'multiSelections']
        : ['openFile'],
    });
    return result.canceled ? null : result.filePaths;
  }

  async showSaveDialog(options: SaveDialogOptions): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
    });
    return result.canceled ? null : result.filePath ?? null;
  }

  openInExplorer(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      shell.openPath(dirPath);
    }
  }

  getAutosavePath(): string {
    return this.settings.getAutosavePath();
  }

  getLessonsPath(): string {
    return this.settings.getLessonsPath();
  }

  getResourceLibraryPath(): string {
    return this.settings.getResourceLibraryPath();
  }

  /**
   * Security: validate path is not attempting directory traversal
   * or accessing system directories
   */
  private validatePath(filePath: string): void {
    const resolved = path.resolve(filePath);
    const normalized = resolved.toLowerCase();
    
    // Block obvious system directories
    const blocked = ['c:\\windows', 'c:\\program files', '/etc/', '/usr/bin/'];
    for (const block of blocked) {
      if (normalized.startsWith(block.toLowerCase())) {
        throw new Error(`Access denied: protected path ${filePath}`);
      }
    }
  }
}
