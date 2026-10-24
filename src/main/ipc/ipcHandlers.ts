/**
 * IPC Handlers — all IPC channels registered here, validated and typed.
 * The renderer can only access these via the preload bridge.
 */

import { app, ipcMain, BrowserWindow, desktopCapturer, screen, nativeImage, clipboard, Rectangle } from 'electron';
import path from 'path';
import fs from 'fs';
import { DatabaseService } from '../services/DatabaseService';
import { SettingsService } from '../services/SettingsService';
import { FileService } from '../services/FileService';

// ─── Desktop Annotation Overlay Window ──────────────────────────────────────
let annotationWindow: BrowserWindow | null = null;

function getPreloadPath(): string {
  const candidates = [
    path.join(__dirname, '../../preload/preload.js'),
    path.join(__dirname, '../preload/preload.js'),
    path.join(app.getAppPath(), 'dist/preload/preload.js'),
    path.join(app.getAppPath(), 'preload/preload.js'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      // ignore
    }
  }
  return candidates[0];
}

function getRendererHtmlPath(): string {
  const candidates = [
    path.join(__dirname, '../../renderer/index.html'),
    path.join(__dirname, '../renderer/index.html'),
    path.join(app.getAppPath(), 'dist/renderer/index.html'),
    path.join(app.getAppPath(), 'renderer/index.html'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      // ignore
    }
  }
  return candidates[0];
}

function getAppIconPath(): string {
  const candidates = [
    path.join(__dirname, '../../assets/icons/icon.ico'),
    path.join(__dirname, '../assets/icons/icon.ico'),
    path.join(app.getAppPath(), 'assets/icons/icon.ico'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      // ignore
    }
  }
  return candidates[0];
}

interface Services {
  db: DatabaseService;
  settings: SettingsService;
  fileService: FileService;
  getMainWindow?: () => BrowserWindow | null;
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

  ipcMain.handle('file:writeBinary', async (_e, filePath: string, base64Data: string) => {
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');
    await fileService.writeFileBinary(filePath, buffer);
    return true;
  });

  ipcMain.handle('clipboard:writeImage', async (_e, dataUrl: string) => {
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      clipboard.writeImage(img);
      return true;
    } catch (err) {
      console.error('Failed to write image to clipboard:', err);
      return false;
    }
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

  // ─── Show Desktop / Desktop Mode ───────────────────────────────────────
  const openDesktopOverlayWindow = async (callerWin: BrowserWindow | null, callerBounds?: Rectangle | null) => {
    // If an overlay already exists, destroy it cleanly so a fresh one with clean native hooks is created
    if (annotationWindow && !annotationWindow.isDestroyed()) {
      annotationWindow.destroy();
      annotationWindow = null;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const display = callerBounds ? screen.getDisplayMatching(callerBounds) : primaryDisplay;
    const { bounds } = display;
    const preloadPath = getPreloadPath();

    annotationWindow = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      focusable: true,
      skipTaskbar: false, // Keep visible on Windows taskbar
      title: 'SmartBoard Studio - Desktop Overlay',
      icon: getAppIconPath(),
      hasShadow: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    annotationWindow.setAlwaysOnTop(true, 'status');
    annotationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    const isDev = !app.isPackaged;
    const fallbackFile = `file://${getRendererHtmlPath()}`;
    const callerUrl = callerWin && !callerWin.isDestroyed() ? callerWin.webContents.getURL() : null;
    const activeUrl = callerUrl || (isDev ? 'http://localhost:5173' : fallbackFile);
    const baseUrl = activeUrl.split('#')[0].split('?')[0];
    const overlayUrl = `${baseUrl}?overlay=desktop#overlay=desktop`;
    await annotationWindow.loadURL(overlayUrl);

    if (annotationWindow && !annotationWindow.isDestroyed()) {
      annotationWindow.show();
      annotationWindow.focus();
    }

    annotationWindow.on('closed', () => {
      annotationWindow = null;
      // Failsafe: if the desktop overlay is closed, always ensure main lesson window is restored and shown
      const mainWin = services.getMainWindow?.() || callerWin;
      if (mainWin && !mainWin.isDestroyed()) {
        if (mainWin.isMinimized()) {
          mainWin.restore();
        }
        mainWin.show();
        mainWin.focus();
      }
    });

    return annotationWindow.id;
  };

  ipcMain.handle('window:showDesktop', async (e) => {
    const callerWin = BrowserWindow.fromWebContents(e.sender);
    const callerBounds = callerWin && !callerWin.isMinimized() ? callerWin.getBounds() : null;
    await openDesktopOverlayWindow(callerWin, callerBounds);
    if (callerWin && !callerWin.isDestroyed()) {
      callerWin.removeAllListeners('restore');
      callerWin.on('restore', () => {
        if (annotationWindow && !annotationWindow.isDestroyed()) {
          annotationWindow.destroy();
          annotationWindow = null;
        }
      });
      callerWin.minimize();
    }
    return true;
  });

  ipcMain.handle('app:quit', async () => {
    if (annotationWindow && !annotationWindow.isDestroyed()) {
      annotationWindow.destroy();
      annotationWindow = null;
    }
    app.quit();
    return true;
  });

  ipcMain.handle('window:restore', async () => {
    try {
      const mainWin = services.getMainWindow?.() || BrowserWindow.getAllWindows().find((w) => w !== annotationWindow);
      if (mainWin && !mainWin.isDestroyed()) {
        if (mainWin.isMinimized()) {
          mainWin.restore();
        }
        mainWin.show();
        mainWin.focus();
        mainWin.setAlwaysOnTop(true);
        mainWin.setAlwaysOnTop(false);
      }
      if (annotationWindow && !annotationWindow.isDestroyed()) {
        annotationWindow.destroy();
        annotationWindow = null;
      }
    } catch (err) {
      console.error('Failed to restore main window:', err);
    }
    return true;
  });

  ipcMain.handle('window:setIgnoreMouseEvents', async (e, ignore: boolean) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win && !win.isDestroyed()) {
      if (ignore) {
        win.setIgnoreMouseEvents(true, { forward: true });
      } else {
        win.setIgnoreMouseEvents(false);
      }
    }
    return true;
  });

  ipcMain.handle('desktop:insertImage', async (_e, dataUrl: string) => {
    const wins = BrowserWindow.getAllWindows();
    const mainWin = wins.find((w) => w !== annotationWindow);
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.webContents.send('desktop:doInsertImage', dataUrl);
    }
    return true;
  });

  // ─── Screen Geometry ─────────────────────────────────────────────────────
  ipcMain.handle('screen:getAllDisplays', async () => {
    return screen.getAllDisplays().map((d) => ({
      id: d.id,
      bounds: d.bounds,
      workArea: d.workArea,
      scaleFactor: d.scaleFactor,
      isPrimary: d.id === screen.getPrimaryDisplay().id,
    }));
  });

  ipcMain.handle('screen:getPrimaryDisplay', async () => {
    const d = screen.getPrimaryDisplay();
    return { id: d.id, bounds: d.bounds, workArea: d.workArea, scaleFactor: d.scaleFactor };
  });

  // ─── Screenshot Capture ──────────────────────────────────────────────────
  ipcMain.handle('screenshot:captureScreen', async (_e, displayId?: number) => {
    try {
      const primary = screen.getPrimaryDisplay();
      const { width, height } = primary.bounds;
      const scale = primary.scaleFactor || 1;
      const thumbnailSize = {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
      };

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize,
      });
      let src = sources[0];
      if (displayId !== undefined) {
        src = sources.find((s) => s.display_id === String(displayId)) || sources[0];
      }
      if (!src) return null;
      return src.thumbnail.toDataURL();
    } catch (err) {
      console.error('Screenshot failed:', err);
      return null;
    }
  });

  ipcMain.handle('screenshot:captureWindow', async (_e, mainWinId?: number) => {
    try {
      const wins = BrowserWindow.getAllWindows();
      const target = mainWinId ? wins.find((w) => w.id === mainWinId) : wins[0];
      if (!target) return null;
      const img = await target.webContents.capturePage();
      return img.toDataURL();
    } catch (err) {
      console.error('Window screenshot failed:', err);
      return null;
    }
  });

  // ─── Desktop Annotation Overlay ──────────────────────────────────────────
  ipcMain.handle('annotation:open', async (e) => {
    const callerWin = BrowserWindow.fromWebContents(e.sender);
    return openDesktopOverlayWindow(callerWin);
  });

  ipcMain.handle('annotation:close', async () => {
    if (annotationWindow && !annotationWindow.isDestroyed()) {
      annotationWindow.close();
    }
    annotationWindow = null;
    return true;
  });

  ipcMain.handle('annotation:setClickThrough', async (_e, enable: boolean) => {
    if (annotationWindow && !annotationWindow.isDestroyed()) {
      annotationWindow.setIgnoreMouseEvents(enable, { forward: true });
    }
    return true;
  });

  ipcMain.handle('annotation:clear', async () => {
    if (annotationWindow && !annotationWindow.isDestroyed()) {
      annotationWindow.webContents.send('annotation:doClear');
    }
    return true;
  });
}
