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
let wasFullScreenBeforeDesktop = false;
let wasMaximizedBeforeDesktop = false;

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

  ipcMain.handle('clipboard:read', async () => {
    try {
      // 1. Check if image is available on clipboard
      const img = clipboard.readImage();
      if (!img.isEmpty()) {
        const size = img.getSize();
        return {
          type: 'image',
          dataUrl: img.toDataURL(),
          width: size.width,
          height: size.height,
        };
      }

      // 2. Check if text or drawing JSON is on clipboard
      const text = clipboard.readText();
      if (text && text.trim().length > 0) {
        try {
          const parsed = JSON.parse(text);
          if (
            (parsed && typeof parsed === 'object' && parsed.type && (parsed.id || parsed.type === 'stroke' || parsed.type === 'shape' || parsed.type === 'image' || parsed.type === 'text' || parsed.type === 'group')) ||
            (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type)
          ) {
            return {
              type: 'drawing',
              data: parsed,
            };
          }
        } catch {
          // plain text
        }

        return {
          type: 'text',
          text: text.trim(),
        };
      }
    } catch (err) {
      console.error('Failed to read system clipboard:', err);
    }
    return null;
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
  const restoreMainWindowState = (win: BrowserWindow) => {
    if (!win || win.isDestroyed()) return;

    // Prevent duplicate restore event loops
    win.removeAllListeners('restore');

    if (win.isMinimized()) {
      win.restore();
    }
    win.show();
    win.focus();

    if (wasFullScreenBeforeDesktop) {
      // Force exit and re-entry so Electron doesn't skip setFullScreen when its internal flag was already true
      win.setFullScreen(false);
      win.setFullScreen(true);
      win.webContents.send('window:setPresentationMode', true);

      // Verify after DWM unminimize animation completes
      setTimeout(() => {
        if (!win.isDestroyed() && wasFullScreenBeforeDesktop) {
          const display = screen.getDisplayMatching(win.getBounds());
          const b = win.getBounds();
          if (!win.isFullScreen() || b.width !== display.bounds.width || b.height !== display.bounds.height) {
            win.setFullScreen(false);
            win.setFullScreen(true);
          }
          win.webContents.send('window:setPresentationMode', true);
        }
      }, 100);
    } else if (wasMaximizedBeforeDesktop) {
      if (!win.isMaximized()) {
        win.maximize();
      }
      win.webContents.send('window:setPresentationMode', false);
    } else {
      win.webContents.send('window:setPresentationMode', false);
    }
  };

  const openDesktopOverlayWindow = async (callerWin: BrowserWindow | null, callerBounds?: Rectangle | null) => {
    if (annotationWindow && !annotationWindow.isDestroyed()) {
      annotationWindow.destroy();
      annotationWindow = null;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const display = callerBounds ? screen.getDisplayMatching(callerBounds) : primaryDisplay;
    const { bounds } = display;
    const preloadPath = getPreloadPath();

    const pillSize = 56;
    const pillX = bounds.x + 28;
    const pillY = bounds.y + 120;

    annotationWindow = new BrowserWindow({
      x: pillX,
      y: pillY,
      width: pillSize,
      height: pillSize,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      focusable: true,
      resizable: false,
      skipTaskbar: true,
      title: 'SmartBoard Studio - Return',
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

    annotationWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    annotationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    annotationWindow.on('blur', () => {
      if (annotationWindow && !annotationWindow.isDestroyed()) {
        annotationWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      }
    });

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
        restoreMainWindowState(mainWin);
      }
    });

    return annotationWindow.id;
  };

  ipcMain.handle('window:showDesktop', async (e, options?: { isPresentationMode?: boolean }) => {
    const callerWin = BrowserWindow.fromWebContents(e.sender);
    const callerBounds = callerWin && !callerWin.isMinimized() ? callerWin.getBounds() : null;

    // Preserve previous fullscreen / presentation mode state
    wasFullScreenBeforeDesktop = Boolean(
      options?.isPresentationMode ??
      (callerWin ? callerWin.isFullScreen() : false)
    );
    wasMaximizedBeforeDesktop = callerWin ? callerWin.isMaximized() : false;

    await openDesktopOverlayWindow(callerWin, callerBounds);
    if (callerWin && !callerWin.isDestroyed()) {
      callerWin.removeAllListeners('restore');
      callerWin.once('restore', () => {
        if (annotationWindow && !annotationWindow.isDestroyed()) {
          annotationWindow.destroy();
          annotationWindow = null;
        }
        restoreMainWindowState(callerWin);
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

  ipcMain.handle('window:moveOverlay', (_e, { deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
    if (annotationWindow && !annotationWindow.isDestroyed()) {
      const [x, y] = annotationWindow.getPosition();
      annotationWindow.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
    }
    return true;
  });

  ipcMain.handle('window:restore', async () => {
    try {
      const mainWin = services.getMainWindow?.() || BrowserWindow.getAllWindows().find((w) => w !== annotationWindow && !w.isDestroyed());
      if (annotationWindow && !annotationWindow.isDestroyed()) {
        annotationWindow.destroy();
        annotationWindow = null;
      }
      if (mainWin && !mainWin.isDestroyed()) {
        restoreMainWindowState(mainWin);
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
