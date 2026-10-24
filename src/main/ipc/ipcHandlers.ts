/**
 * IPC Handlers — all IPC channels registered here, validated and typed.
 * The renderer can only access these via the preload bridge.
 */

import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { DatabaseService } from '../services/DatabaseService';
import { SettingsService } from '../services/SettingsService';
import { FileService } from '../services/FileService';

interface Services {
  db: DatabaseService;
  settings: SettingsService;
  fileService: FileService;
}

export function setupIpcHandlers(services: Services): void {
  const { db, settings, fileService } = services;

  // ─── Settings ────────────────────────────────────────────────────────────
  ipcMain.handle('settings:getAll', async () => {
    return settings.getAll();
  });

  ipcMain.handle('settings:get', async (_e, key: string) => {
    return settings.get(key as keyof typeof settings.getAll extends (...args: infer _A) => infer R ? keyof R : never);
  });

  ipcMain.handle('settings:set', async (_e, key: string, value: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings.set(key as any, value as any);
    return true;
  });

  // ─── File Operations ─────────────────────────────────────────────────────
  ipcMain.handle('file:readText', async (_e, filePath: string) => {
    const buf = await fileService.readFile(filePath);
    return buf.toString('utf8');
  });

  ipcMain.handle('file:readBinary', async (_e, filePath: string) => {
    const buf = await fileService.readFile(filePath);
    return buf;
  });

  ipcMain.handle('file:writeText', async (_e, filePath: string, data: string) => {
    await fileService.writeFile(filePath, data);
    return true;
  });

  ipcMain.handle('file:delete', async (_e, filePath: string) => {
    await fileService.deleteFile(filePath);
    return true;
  });

  ipcMain.handle('file:exists', async (_e, filePath: string) => {
    return fileService.exists(filePath);
  });

  ipcMain.handle('file:listDir', async (_e, dirPath: string) => {
    return fileService.listDirectory(dirPath);
  });

  ipcMain.handle('file:openDialog', async (_e, options) => {
    return fileService.showOpenDialog(options);
  });

  ipcMain.handle('file:saveDialog', async (_e, options) => {
    return fileService.showSaveDialog(options);
  });

  ipcMain.handle('file:openInExplorer', async (_e, dirPath: string) => {
    fileService.openInExplorer(dirPath);
    return true;
  });

  // ─── Paths ───────────────────────────────────────────────────────────────
  ipcMain.handle('paths:autosave', async () => fileService.getAutosavePath());
  ipcMain.handle('paths:lessons', async () => fileService.getLessonsPath());
  ipcMain.handle('paths:resources', async () => fileService.getResourceLibraryPath());

  // ─── Lessons DB ──────────────────────────────────────────────────────────
  ipcMain.handle('db:getRecentLessons', async (_e, limit?: number) => {
    return db.getRecentLessons(limit);
  });

  ipcMain.handle('db:upsertLesson', async (_e, lesson) => {
    db.upsertLesson(lesson);
    return true;
  });

  // ─── Window Controls (used by custom titlebar) ───────────────────────────
  ipcMain.handle('window:minimize', async (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize();
  });

  ipcMain.handle('window:maximize', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle('window:close', async (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close();
  });

  ipcMain.handle('window:isMaximized', async (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false;
  });

  ipcMain.handle('window:setFullScreen', async (e, flag?: boolean) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) return false;
    const next = flag !== undefined ? flag : !win.isFullScreen();
    win.setFullScreen(next);
    return win.isFullScreen();
  });

  ipcMain.handle('window:isFullScreen', async (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isFullScreen() ?? false;
  });
}
