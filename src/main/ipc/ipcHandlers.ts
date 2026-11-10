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
import { UpdateService } from '../services/UpdateService';
import { CredentialService } from '../services/CredentialService';

// ─── Desktop Annotation Overlay Window ──────────────────────────────────────
let annotationWindow: BrowserWindow | null = null;
let wasFullScreenBeforeDesktop = false;
let wasMaximizedBeforeDesktop = false;

let isDocumentDirty = false;
let isForceQuitting = false;

export function getIsDocumentDirty(): boolean {
  return isDocumentDirty;
}

export function setIsDocumentDirty(dirty: boolean): void {
  isDocumentDirty = dirty;
}

export function getIsForceQuitting(): boolean {
  return isForceQuitting;
}

export function setIsForceQuitting(force: boolean): void {
  isForceQuitting = force;
}

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

function getAppIcon(): Electron.NativeImage | string {
  const candidates = [
    path.join(process.resourcesPath || '', 'assets/icons/icon.ico'),
    path.join(process.resourcesPath || '', 'assets/icons/icon.png'),
    path.join(process.resourcesPath || '', 'icon.ico'),
    path.join(__dirname, '../../assets/icons/icon.ico'),
    path.join(__dirname, '../../assets/icons/icon.png'),
    path.join(__dirname, '../assets/icons/icon.ico'),
    path.join(__dirname, '../assets/icons/icon.png'),
    path.join(app.getAppPath(), 'assets/icons/icon.ico'),
    path.join(app.getAppPath(), 'assets/icons/icon.png'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const img = nativeImage.createFromPath(c);
        if (!img.isEmpty()) return img;
        return c;
      }
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
  updateService?: UpdateService;
  credentialService?: CredentialService;
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
    if (next) {
      win.setAlwaysOnTop(true, 'screen-saver');
      win.setFullScreen(true);
    } else {
      win.setAlwaysOnTop(false);
      win.setFullScreen(false);
    }
    return win.isFullScreen();
  });

  ipcMain.handle('window:isFullScreen', async (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isFullScreen() ?? false;
  });

  // ─── Show Desktop / Desktop Mode ───────────────────────────────────────
  const restoreMainWindowState = (win: BrowserWindow) => {
    if (!win || win.isDestroyed()) return;

    if (wasFullScreenBeforeDesktop) {
      // Elevate above Windows taskbar and set fullscreen BEFORE showing
      win.setAlwaysOnTop(true, 'screen-saver');
      if (!win.isFullScreen()) {
        win.setFullScreen(true);
      }
      if (win.isMinimized()) {
        win.restore();
      }
      win.show();
      win.focus();
      win.webContents.send('window:setPresentationMode', true);
    } else if (wasMaximizedBeforeDesktop) {
      win.setAlwaysOnTop(false);
      if (win.isMinimized()) {
        win.restore();
      }
      if (!win.isMaximized()) {
        win.maximize();
      }
      win.show();
      win.focus();
      win.webContents.send('window:setPresentationMode', false);
    } else {
      win.setAlwaysOnTop(false);
      if (win.isMinimized()) {
        win.restore();
      }
      win.show();
      win.focus();
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
      icon: getAppIcon(),
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
      callerWin.setAlwaysOnTop(false);
      callerWin.hide();
    }
    return true;
  });

  ipcMain.handle('app:setDirty', (_e, dirty: boolean) => {
    isDocumentDirty = Boolean(dirty);
    return true;
  });

  ipcMain.handle('app:confirm-close', (e) => {
    isForceQuitting = true;
    const win = BrowserWindow.fromWebContents(e.sender) || services.getMainWindow?.();
    if (win && !win.isDestroyed()) {
      win.close();
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
      if (mainWin && !mainWin.isDestroyed()) {
        restoreMainWindowState(mainWin);
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

  // ─── Auto-Updater ────────────────────────────────────────────────────────
  ipcMain.handle('updater:check', async () => {
    if (services.updateService) {
      return services.updateService.checkForUpdates();
    }
    return { status: 'idle', currentVersion: app.getVersion() || '0.2.0' };
  });

  ipcMain.handle('updater:download', async () => {
    if (services.updateService) {
      return services.updateService.downloadUpdate();
    }
    return { status: 'idle', currentVersion: app.getVersion() || '0.2.0' };
  });

  ipcMain.handle('updater:install', async () => {
    if (services.updateService) {
      await services.updateService.installUpdate();
    }
    return true;
  });

  ipcMain.handle('updater:getVersion', async () => {
    return app.getVersion() || '0.2.0';
  });

  ipcMain.handle('updater:getState', async () => {
    if (services.updateService) {
      return services.updateService.getState();
    }
    return { status: 'idle', currentVersion: app.getVersion() || '0.2.0' };
  });

  // ─── AI Teaching Presentation Generator & Credentials (TASK-105) ───────────
  ipcMain.handle('ai:saveApiKey', async (_e, provider: unknown, apiKey: unknown) => {
    if (!services.credentialService) {
      return { success: false, error: 'CredentialService is unavailable in main process.' };
    }
    if (typeof provider !== 'string' || !provider.trim()) {
      return { success: false, error: 'Valid provider identifier is required.' };
    }
    if (typeof apiKey !== 'string' || !apiKey.trim()) {
      return { success: false, error: 'API key cannot be empty.' };
    }
    const cleanProvider = provider.trim().toLowerCase();
    const validProviders = ['openai', 'gemini', 'ollama', 'custom-openai'];
    if (!validProviders.includes(cleanProvider)) {
      return { success: false, error: `Unsupported AI provider: ${cleanProvider}` };
    }
    return services.credentialService.saveApiKey(cleanProvider, apiKey.trim());
  });

  ipcMain.handle('ai:hasApiKey', async (_e, provider: unknown) => {
    if (!services.credentialService || typeof provider !== 'string') return false;
    return services.credentialService.hasApiKey(provider.trim().toLowerCase());
  });

  ipcMain.handle('ai:deleteApiKey', async (_e, provider: unknown) => {
    if (!services.credentialService || typeof provider !== 'string') return false;
    return services.credentialService.deleteApiKey(provider.trim().toLowerCase());
  });

  ipcMain.handle('ai:listConfiguredProviders', async () => {
    if (!services.credentialService) return [];
    return services.credentialService.listConfiguredProviders();
  });

  ipcMain.handle('ai:getApiKey', async (_e, provider: unknown) => {
    if (!services.credentialService || typeof provider !== 'string') return null;
    return services.credentialService.getApiKey(provider.trim().toLowerCase());
  });

  ipcMain.handle('ai:testConnection', async (_e, provider: unknown, options?: unknown) => {
    if (!services.credentialService) {
      return { success: false, provider: String(provider), error: 'CredentialService is unavailable.' };
    }
    if (typeof provider !== 'string' || !provider.trim()) {
      return { success: false, provider: '', error: 'Provider identifier is required.' };
    }

    const normProvider = provider.trim().toLowerCase();
    const key = await services.credentialService.getApiKey(normProvider);
    if (!key && normProvider !== 'ollama') {
      return {
        success: false,
        provider: normProvider,
        error: `No API key configured for ${normProvider}. Please enter your key in Settings.`,
      };
    }

    const opts = (options && typeof options === 'object' ? options : {}) as {
      model?: string;
      customEndpoint?: string;
      timeoutMs?: number;
    };

    return executeProviderConnectionTest(normProvider, key || '', opts);
  });

  ipcMain.handle('ai:listModels', async (_e, provider: unknown, options?: unknown) => {
    if (typeof provider !== 'string' || !provider.trim()) return [];
    const normProvider = provider.trim().toLowerCase();
    const key = services.credentialService ? await services.credentialService.getApiKey(normProvider) : null;
    const opts = (options && typeof options === 'object' ? options : {}) as {
      customEndpoint?: string;
      timeoutMs?: number;
    };
    return executeProviderListModels(normProvider, key || '', opts);
  });

  ipcMain.handle('ai:generateText', async (_e, request: unknown) => {
    if (!request || typeof request !== 'object') {
      return { success: false, text: '', error: 'Invalid generation request' };
    }
    const req = request as {
      provider?: string;
      model?: string;
      prompt?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      customEndpoint?: string;
      timeoutMs?: number;
    };
    const normProvider = (req.provider || 'gemini').trim().toLowerCase();
    const key = services.credentialService ? await services.credentialService.getApiKey(normProvider) : null;
    if (!key && normProvider !== 'ollama') {
      return {
        success: false,
        text: '',
        provider: normProvider,
        error: `No API key configured for ${normProvider}. Please enter your key in Settings.`,
      };
    }
    return executeProviderGenerateText(normProvider, key || '', req);
  });

  ipcMain.handle('ai:generateStructuredJson', async (_e, request: unknown) => {
    if (!request || typeof request !== 'object') {
      return { success: false, data: null, error: 'Invalid generation request' };
    }
    const req = request as {
      provider?: string;
      model?: string;
      prompt?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      customEndpoint?: string;
      timeoutMs?: number;
    };
    const normProvider = (req.provider || 'gemini').trim().toLowerCase();
    const key = services.credentialService ? await services.credentialService.getApiKey(normProvider) : null;
    if (!key && normProvider !== 'ollama') {
      return {
        success: false,
        data: null,
        provider: normProvider,
        error: `No API key configured for ${normProvider}. Please enter your key in Settings.`,
      };
    }
    return executeProviderGenerateStructuredJson(normProvider, key || '', req);
  });
}

// ─── Main-Process AI Provider Helpers ─────────────────────────────────────────
function isOpenAICompatibleProvider(provider: string): boolean {
  const norm = provider.trim().toLowerCase();
  return (
    norm === 'openai' ||
    norm === 'custom-openai' ||
    norm === 'kimi' ||
    norm === 'moonshot' ||
    norm === 'deepseek' ||
    norm === 'groq' ||
    norm === 'openrouter' ||
    norm === 'custom'
  );
}

function resolveAIEndpoint(provider: string, customEndpoint?: string): string {
  if (customEndpoint && customEndpoint.trim().length > 0) {
    return customEndpoint.trim().replace(/\/+$/, '');
  }
  const norm = provider.trim().toLowerCase();
  if (norm === 'gemini') return 'https://generativelanguage.googleapis.com/v1beta';
  if (norm === 'ollama') return 'http://127.0.0.1:11434';
  if (norm === 'kimi' || norm === 'moonshot') return 'https://api.moonshot.cn/v1';
  if (norm === 'deepseek') return 'https://api.deepseek.com';
  if (norm === 'groq') return 'https://api.groq.com/openai/v1';
  if (norm === 'openrouter') return 'https://openrouter.ai/api/v1';
  return 'https://api.openai.com/v1';
}

// ─── Main-Process AI Connection Tester ───────────────────────────────────────
async function executeProviderConnectionTest(
  provider: string,
  apiKey: string,
  options?: { model?: string; customEndpoint?: string; timeoutMs?: number }
): Promise<{ success: boolean; latencyMs?: number; models?: string[]; error?: string; warning?: string; provider: string }> {
  const timeoutMs = options?.timeoutMs || 15000;
  const startTime = Date.now();
  const normProvider = provider.trim().toLowerCase();

  try {
    if (isOpenAICompatibleProvider(normProvider)) {
      const endpoint = resolveAIEndpoint(normProvider, options?.customEndpoint);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);

      try {
        const res = await fetch(`${endpoint}/models`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        const latencyMs = Date.now() - startTime;
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`${normProvider.toUpperCase()} returned status ${res.status}: ${body || res.statusText}`);
        }

        const json = (await res.json()) as any;
        const models = Array.isArray(json?.data)
          ? json.data
              .map((m: { id: string }) => m.id)
              .filter((id: string) => typeof id === 'string')
              .slice(0, 20)
          : [];

        return { success: true, latencyMs, models, provider: normProvider };
      } finally {
        clearTimeout(timer);
      }
    } else if (normProvider === 'gemini') {
      const endpoint = resolveAIEndpoint('gemini', options?.customEndpoint);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);

      try {
        const res = await fetch(`${endpoint}/models?key=${apiKey}`, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        const latencyMs = Date.now() - startTime;
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Google Gemini API returned status ${res.status}: ${body || res.statusText}`);
        }

        const json = (await res.json()) as any;
        const models = Array.isArray(json?.models)
          ? json.models
              .map((m: { name?: string }) => m.name?.replace(/^models\//, '') || '')
              .filter((name: string) => {
                const lower = name.toLowerCase();
                return (
                  lower.includes('gemini') &&
                  !lower.endsWith('-tts') &&
                  !lower.includes('-image') &&
                  !lower.includes('-transcribe') &&
                  !lower.includes('embedding') &&
                  !lower.includes('banana') &&
                  !lower.includes('aqa')
                );
              })
              .slice(0, 30)
          : ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-pro-latest'];

        return { success: true, latencyMs, models, provider: normProvider };
      } finally {
        clearTimeout(timer);
      }
    } else if (normProvider === 'ollama') {
      const endpoint = resolveAIEndpoint('ollama', options?.customEndpoint);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);

      try {
        const res = await fetch(`${endpoint}/api/tags`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });

        const latencyMs = Date.now() - startTime;
        if (!res.ok) {
          throw new Error(`Ollama returned status ${res.status}`);
        }

        const json = (await res.json()) as any;
        const rawModels = Array.isArray(json?.models) ? json.models : [];
        const models = rawModels.map((m: any) => m.name || m.model || '').filter(Boolean);

        if (models.length === 0) {
          return {
            success: true,
            latencyMs,
            models: [],
            provider: 'ollama',
            warning: 'Ollama is running, but no models installed yet. Run "ollama run llama3.2" to install one.',
          };
        }

        return { success: true, latencyMs, models, provider: 'ollama' };
      } finally {
        clearTimeout(timer);
      }
    } else {
      return { success: false, error: `Unsupported AI provider: ${normProvider}`, provider: normProvider };
    }
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const sanitized = apiKey ? rawMsg.split(apiKey).join('[REDACTED]') : rawMsg;
    let friendly = sanitized;
    if (sanitized.includes('401') || sanitized.toLowerCase().includes('unauthorized') || sanitized.toLowerCase().includes('invalid api key')) {
      friendly = 'Invalid API key or unauthorized. Please verify your credentials.';
    } else if (sanitized.includes('429') || sanitized.toLowerCase().includes('rate limit') || sanitized.toLowerCase().includes('quota')) {
      friendly = 'API rate limit or quota exceeded for this model.';
    } else if (sanitized.includes('AbortError') || sanitized.toLowerCase().includes('timeout') || sanitized.toLowerCase().includes('timed out')) {
      friendly = 'Connection timed out. Please verify your network/model.';
    } else if (sanitized.includes('ECONNREFUSED') || sanitized.includes('Failed to fetch') || sanitized.includes('ENOTFOUND')) {
      if (normProvider === 'ollama') {
        friendly = 'Ollama is not running. Please start the Ollama desktop app or run "ollama serve".';
      } else {
        friendly = `Network connection failed when reaching ${normProvider} server.`;
      }
    }
    return { success: false, error: friendly, provider: normProvider };
  }
}

// ─── Main-Process AI Model Discovery ─────────────────────────────────────────
async function executeProviderListModels(
  provider: string,
  apiKey: string,
  options?: { customEndpoint?: string; timeoutMs?: number }
): Promise<Array<{ id: string; name: string; sizeFormatted?: string; parameterSize?: string; isLocal?: boolean; provider: string }>> {
  const timeoutMs = options?.timeoutMs || 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const normProvider = provider.trim().toLowerCase();

  try {
    if (normProvider === 'ollama') {
      const endpoint = resolveAIEndpoint('ollama', options?.customEndpoint);
      const res = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      const raw = Array.isArray(json?.models) ? json.models : [];
      return raw.map((item: any) => {
        const id = item.name || item.model || '';
        const paramSize = item.details?.parameter_size;
        let sizeFormatted = '';
        if (typeof item.size === 'number' && item.size > 0) {
          const gb = item.size / (1024 * 1024 * 1024);
          sizeFormatted = gb >= 1 ? `${gb.toFixed(1)} GB` : `${(item.size / (1024 * 1024)).toFixed(0)} MB`;
        }
        let name = id;
        const meta: string[] = [];
        if (paramSize) meta.push(paramSize);
        if (sizeFormatted) meta.push(sizeFormatted);
        if (meta.length > 0) name = `${id} (${meta.join(' • ')})`;

        return {
          id,
          name,
          sizeFormatted,
          parameterSize: paramSize,
          isLocal: true,
          provider: 'ollama',
        };
      });
    } else if (normProvider === 'gemini') {
      if (!apiKey) return [];
      const endpoint = resolveAIEndpoint('gemini', options?.customEndpoint);
      const res = await fetch(`${endpoint}/models?key=${apiKey}`, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      const raw = Array.isArray(json?.models) ? json.models : [];
      return raw
        .filter((item: any) => {
          const rawId = (item.name || '').toLowerCase().replace(/^models\//, '');
          if (
            rawId.endsWith('-tts') ||
            rawId.includes('-image') ||
            rawId.includes('-transcribe') ||
            rawId.includes('embedding') ||
            rawId.includes('banana') ||
            rawId.includes('aqa')
          ) {
            return false;
          }
          const methods = item.supportedGenerationMethods || [];
          return rawId.includes('gemini') && (methods.length === 0 || methods.includes('generateContent'));
        })
        .map((item: any) => {
          const id = (item.name || '').replace(/^models\//, '');
          return {
            id,
            name: item.displayName ? `${item.displayName} (${id})` : id,
            provider: 'gemini',
            isLocal: false,
          };
        });
    } else if (isOpenAICompatibleProvider(normProvider)) {
      if (!apiKey) return [];
      const endpoint = resolveAIEndpoint(normProvider, options?.customEndpoint);
      const res = await fetch(`${endpoint}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      const raw = Array.isArray(json?.data) ? json.data : [];
      return raw
        .filter((item: any) => item && typeof item.id === 'string')
        .map((item: any) => ({
          id: item.id,
          name: item.id,
          provider: normProvider,
          isLocal: false,
        }));
    }
    return [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ─── Main-Process AI Text Generation ─────────────────────────────────────────
async function executeProviderGenerateText(
  provider: string,
  apiKey: string,
  req: {
    model?: string;
    prompt?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    customEndpoint?: string;
    timeoutMs?: number;
  }
): Promise<{ success: boolean; text: string; model?: string; provider: string; error?: string }> {
  const normProvider = provider.trim().toLowerCase();
  const timeoutMs = req.timeoutMs || (normProvider === 'ollama' ? 180000 : 60000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`AI generation timed out after ${timeoutMs}ms`)), timeoutMs);

  try {
    if (normProvider === 'gemini') {
      const endpoint = resolveAIEndpoint('gemini', req.customEndpoint);
      let rawModel = req.model?.trim() || 'gemini-3.5-flash-lite';
      // Strip display parenthetical if present e.g. "Gemini 3.5 Flash-Lite (gemini-3.5-flash-lite)"
      const parenMatch = rawModel.match(/\(([^)]+)\)$/);
      if (parenMatch && parenMatch[1]) {
        rawModel = parenMatch[1].trim();
      }
      if (
        rawModel.endsWith('-tts') ||
        rawModel.includes('-image') ||
        rawModel.includes('-transcribe') ||
        rawModel === 'gemini-1.5-flash' ||
        rawModel === 'gemini-2.0-flash' ||
        rawModel === 'gemini-2.5-flash' ||
        rawModel === 'gemini-3.5-flash' ||
        !rawModel
      ) {
        rawModel = 'gemini-3.5-flash-lite';
      }
      let cleanModel = rawModel.replace(/^models\//, '').trim();

      const bodyPayload: Record<string, unknown> = {
        contents: [{ role: 'user', parts: [{ text: req.prompt || '' }] }],
        generationConfig: {
          temperature: typeof req.temperature === 'number' ? req.temperature : 0.7,
          maxOutputTokens: req.maxTokens || 4096,
        },
      };
      if (req.systemPrompt && req.systemPrompt.trim()) {
        bodyPayload.systemInstruction = {
          parts: [{ text: req.systemPrompt.trim() }],
        };
      }

      // Helper for per-model fetch with sub-timeout to prevent hanging on preview models
      const attemptGenerate = async (targetModel: string): Promise<{ ok: boolean; text?: string; status?: number; error?: string }> => {
        const subController = new AbortController();
        const subTimer = setTimeout(() => subController.abort(new Error(`Model ${targetModel} timed out after 18000ms`)), 18000);
        try {
          const attemptRes = await fetch(`${endpoint}/models/${targetModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'x-goog-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyPayload),
            signal: subController.signal,
          });
          if (attemptRes.ok) {
            const fbJson = (await attemptRes.json()) as any;
            const fbText = fbJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return { ok: true, text: fbText };
          }
          const errBody = await attemptRes.text().catch(() => '');
          return { ok: false, status: attemptRes.status, error: errBody || attemptRes.statusText };
        } catch (err: any) {
          return { ok: false, error: err?.message || String(err) };
        } finally {
          clearTimeout(subTimer);
        }
      };

      // 1. Try requested model first
      const firstAttempt = await attemptGenerate(cleanModel);
      if (firstAttempt.ok && firstAttempt.text) {
        return { success: true, text: firstAttempt.text, model: cleanModel, provider: 'gemini' };
      }

      // 2. If first attempt was unavailable (503), timeout, deprecated (404), or rate-limited (429), try stable fallbacks!
      const fallbacks = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-3.8-flash'];
      for (const fbModel of fallbacks) {
        if (cleanModel === fbModel) continue;
        const fbAttempt = await attemptGenerate(fbModel);
        if (fbAttempt.ok && fbAttempt.text) {
          return { success: true, text: fbAttempt.text, model: fbModel, provider: 'gemini' };
        }
      }

      throw new Error(`Google Gemini failed: ${firstAttempt.error || 'All fallback models unavailable'}`);
    } else if (isOpenAICompatibleProvider(normProvider)) {
      const endpoint = resolveAIEndpoint(normProvider, req.customEndpoint);
      const model = req.model?.trim() || (normProvider === 'kimi' ? 'moonshot-v1-8k' : normProvider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');

      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (req.systemPrompt && req.systemPrompt.trim()) {
        messages.push({ role: 'system', content: req.systemPrompt.trim() });
      }
      messages.push({ role: 'user', content: req.prompt || '' });

      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: typeof req.temperature === 'number' ? req.temperature : 0.7,
          max_tokens: req.maxTokens || 4096,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`${normProvider.toUpperCase()} returned status ${res.status}: ${errText || res.statusText}`);
      }

      const json = (await res.json()) as any;
      const text = json?.choices?.[0]?.message?.content || '';
      return { success: true, text, model, provider: normProvider };
    } else if (normProvider === 'ollama') {
      const endpoint = resolveAIEndpoint('ollama', req.customEndpoint);
      let model = req.model?.trim() || 'qwen2.5-coder:3b';
      // Clean model name
      const parenMatch = model.match(/\(([^)]+)\)$/);
      if (parenMatch && parenMatch[1]) {
        model = parenMatch[1].trim();
      }
      model = model.replace(/\s+•.*$/, '').trim();

      // Primary: Use /api/chat so Ollama applies the model's native chat template (Gemma, Llama, Qwen)
      try {
        const chatRes = await fetch(`${endpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
              { role: 'user', content: req.prompt || '' },
            ],
            stream: false,
            options: {
              temperature: typeof req.temperature === 'number' ? req.temperature : 0.7,
            },
          }),
          signal: controller.signal,
        });

        if (chatRes.ok) {
          const chatJson = (await chatRes.json()) as any;
          const text = chatJson?.message?.content || '';
          return { success: true, text, model, provider: 'ollama' };
        }
      } catch {
        // Fallback to /api/generate only if /api/chat fails
      }

      // Fallback: /api/generate
      const res = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: req.prompt || '',
          system: req.systemPrompt || '',
          stream: false,
          options: {
            temperature: typeof req.temperature === 'number' ? req.temperature : 0.7,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      const json = (await res.json()) as any;
      const text = json?.response || '';
      return { success: true, text, model, provider: 'ollama' };
    } else {
      return { success: false, text: '', provider: normProvider, error: `Unsupported AI provider: ${normProvider}` };
    }
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const sanitized = apiKey ? rawMsg.split(apiKey).join('[REDACTED]') : rawMsg;
    return { success: false, text: '', provider: normProvider, error: sanitized };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Main-Process AI Structured JSON Generation ──────────────────────────────
async function executeProviderGenerateStructuredJson(
  provider: string,
  apiKey: string,
  req: {
    model?: string;
    prompt?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    customEndpoint?: string;
    timeoutMs?: number;
  }
): Promise<{ success: boolean; data: any; rawText?: string; model?: string; provider: string; error?: string }> {
  const timeoutMs = req.timeoutMs || 45000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`AI generation timed out after ${timeoutMs}ms`)), timeoutMs);

  try {
    let rawText = '';
    let usedModel = req.model || '';

    if (provider === 'gemini') {
      const endpoint = (req.customEndpoint?.trim() || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
      let rawModel = req.model?.trim() || 'gemini-3.5-flash-lite';
      const parenMatch = rawModel.match(/\(([^)]+)\)$/);
      if (parenMatch && parenMatch[1]) {
        rawModel = parenMatch[1].trim();
      }
      if (
        rawModel.endsWith('-tts') ||
        rawModel.includes('-image') ||
        rawModel.includes('-transcribe') ||
        rawModel === 'gemini-1.5-flash' ||
        rawModel === 'gemini-2.0-flash' ||
        rawModel === 'gemini-2.5-flash' ||
        rawModel === 'gemini-3.5-flash' ||
        !rawModel
      ) {
        rawModel = 'gemini-3.5-flash-lite';
      }
      usedModel = rawModel.replace(/^models\//, '').trim();

      const baseSystemPrompt = req.systemPrompt ? `${req.systemPrompt}\n\n` : '';
      const strictJsonPrompt = `${baseSystemPrompt}IMPORTANT: You must output ONLY a valid JSON object. Do not include markdown code blocks or explanations outside the JSON payload.`;

      const bodyPayload: Record<string, unknown> = {
        systemInstruction: {
          parts: [{ text: strictJsonPrompt }],
        },
        contents: [{ role: 'user', parts: [{ text: req.prompt || '' }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: typeof req.temperature === 'number' ? req.temperature : 0.4,
          maxOutputTokens: req.maxTokens || 4096,
        },
      };

      const attemptGenerate = async (targetModel: string): Promise<string | null> => {
        const subController = new AbortController();
        const subTimer = setTimeout(() => subController.abort(new Error(`Timeout on ${targetModel}`)), 18000);
        try {
          const attemptRes = await fetch(`${endpoint}/models/${targetModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'x-goog-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyPayload),
            signal: subController.signal,
          });
          if (attemptRes.ok) {
            const json = (await attemptRes.json()) as any;
            return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
          return null;
        } catch {
          return null;
        } finally {
          clearTimeout(subTimer);
        }
      };

      const firstText = await attemptGenerate(usedModel);
      if (firstText) {
        rawText = firstText;
      } else {
        const fallbacks = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-pro-latest', 'gemini-3.8-flash'];
        let gotText = false;
        for (const fbModel of fallbacks) {
          if (usedModel === fbModel) continue;
          const fbText = await attemptGenerate(fbModel);
          if (fbText) {
            rawText = fbText;
            usedModel = fbModel;
            gotText = true;
            break;
          }
        }
        if (!gotText) {
          throw new Error(`Google Gemini generation failed for ${usedModel} and fallbacks.`);
        }
      }
    } else if (provider === 'openai' || provider === 'custom-openai') {
      const endpoint = (req.customEndpoint?.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '');
      usedModel = req.model?.trim() || 'gpt-4o-mini';

      const baseSystem = req.systemPrompt ? `${req.systemPrompt}\n\n` : '';
      const sys = `${baseSystem}IMPORTANT: You must return ONLY a single, valid JSON object matching the requested schema. No markdown wrapping.`;

      const messages: Array<{ role: 'system' | 'user'; content: string }> = [
        { role: 'system', content: sys },
        { role: 'user', content: req.prompt || '' },
      ];

      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: usedModel,
          messages,
          temperature: typeof req.temperature === 'number' ? req.temperature : 0.4,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`OpenAI returned status ${res.status}: ${errText || res.statusText}`);
      }

      const json = (await res.json()) as any;
      rawText = json?.choices?.[0]?.message?.content || '';
    } else if (provider === 'ollama') {
      const endpoint = (req.customEndpoint?.trim() || 'http://127.0.0.1:11434').replace(/\/+$/, '');
      let rawModel = req.model?.trim() || 'qwen2.5-coder:3b';
      const parenMatch = rawModel.match(/\(([^)]+)\)$/);
      if (parenMatch && parenMatch[1]) {
        rawModel = parenMatch[1].trim();
      }
      usedModel = rawModel.replace(/\s+•.*$/, '').trim();

      const baseSystem = req.systemPrompt ? `${req.systemPrompt}\n\n` : '';
      const sys = `${baseSystem}IMPORTANT: Respond with ONLY a valid JSON object. No explanations outside JSON.`;

      const res = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: usedModel,
          prompt: req.prompt || '',
          system: sys,
          stream: false,
          format: 'json',
          options: {
            temperature: typeof req.temperature === 'number' ? req.temperature : 0.4,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      const json = (await res.json()) as any;
      rawText = json?.response || '';
    } else {
      return { success: false, data: null, provider, error: `Unsupported provider: ${provider}` };
    }

    // Extract JSON from raw response
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(clean);
    return { success: true, data, rawText, model: usedModel, provider };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const sanitized = apiKey ? rawMsg.split(apiKey).join('[REDACTED]') : rawMsg;
    return { success: false, data: null, provider, error: sanitized };
  } finally {
    clearTimeout(timer);
  }
}
