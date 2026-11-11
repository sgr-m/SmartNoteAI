/**
 * SmartBoard Studio — Electron Main Process
 *
 * Architecture decisions:
 * - Electron 34 + React 19 + TypeScript + Vite for renderer
 * - Context isolation ON, nodeIntegration OFF in renderer
 * - Restricted IPC bridge via preload
 * - WM_POINTER / Pointer Events API used in renderer for stylus
 * - Separate BrowserWindows for overlay/annotation (future milestone)
 */

import { app, BrowserWindow, ipcMain, shell, dialog, Menu, nativeTheme, screen, nativeImage, clipboard } from 'electron';
import path from 'path';
import fs from 'fs';
import { setupIpcHandlers, getIsDocumentDirty, getIsForceQuitting, setIsForceQuitting } from './ipc/ipcHandlers';
import { DatabaseService } from './services/DatabaseService';
import { SettingsService } from './services/SettingsService';
import { FileService } from './services/FileService';
import { UpdateService } from './services/UpdateService';
import { CredentialService } from './services/CredentialService';

// ─── Single Instance Lock ────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

// ─── Dev vs Production Mode ────────────────────────────────────────────────
const isDev = !app.isPackaged;

// ─── Global State ──────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let db: DatabaseService | null = null;
let settings: SettingsService | null = null;
let updateService: UpdateService | null = null;
let credentialService: CredentialService | null = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

  // ─── App Configuration ─────────────────────────────────────────────────────
  // Ensure Windows Ink, digitizer pointer events, and XP-Pen / Wacom styluses deliver native pointer events
  app.commandLine.appendSwitch('enable-features', 'PointerEvents,TouchEvents,DirectManipulationStylus');
  app.commandLine.appendSwitch('disable-features', 'HideCursorWhileTyping');
  app.commandLine.appendSwitch('high-dpi-support', '1');
  // Request high-resolution pointer events for stylus accuracy
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');

  // ─── Path Resolvers ────────────────────────────────────────────────────────
  function getPreloadPath(): string {
    const candidates = [
      path.join(__dirname, '../preload/preload.js'),
      path.join(__dirname, '../../preload/preload.js'),
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
      path.join(__dirname, '../renderer/index.html'),
      path.join(__dirname, '../../renderer/index.html'),
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

  // ─── Window Creation ───────────────────────────────────────────────────────
  async function createMainWindow(): Promise<BrowserWindow> {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const preloadPath = getPreloadPath();
    const appIcon = getAppIcon();

    const win = new BrowserWindow({
      title: 'SmartNoteAI',
      width: Math.min(1600, width),
      height: Math.min(960, height),
      minWidth: 1024,
      minHeight: 640,
      show: true, // Show window directly to prevent hidden background zombie processes
      backgroundColor: '#1b4332',
      disableAutoHideCursor: true, // Keep the default Windows pointer visible at all times
      frame: false, // Custom TitleBar with min/max/close controls rendered by React
      icon: appIcon,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,          // SECURITY: context isolation on
        nodeIntegration: false,           // SECURITY: no Node in renderer
        sandbox: false,                   // need preload access to limited node
        webSecurity: true,
        allowRunningInsecureContent: false,
        webviewTag: true,                 // Enable <webview> for in-app educational browser
        // Enable high-resolution pointer events for stylus
        experimentalFeatures: false,
      },
    });

    if (typeof appIcon !== 'string' && appIcon) {
      win.setIcon(appIcon);
    }

    win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
      if (level >= 2) {
        console.error(`[Renderer Error] line ${line} (${sourceId}): ${message}`);
      } else {
        console.log(`[Renderer] ${message}`);
      }
    });

    win.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL) => {
      console.error(`[Main] did-fail-load: ${errorCode} - ${errorDescription} on ${validatedURL}`);
    });

    win.webContents.on('render-process-gone', (_e, details) => {
      console.error('[Main] render-process-gone:', details);
    });

    // Performance: use WillNavigate to block unwanted navigation
    win.webContents.on('will-navigate', (e, url) => {
      if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
        e.preventDefault();
      }
    });

    // Open external links in system browser
    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    win.on('enter-full-screen', () => {
      win.setAlwaysOnTop(true, 'screen-saver');
      win.webContents.send('window:setPresentationMode', true);
    });

    win.on('leave-full-screen', () => {
      win.setAlwaysOnTop(false);
      win.webContents.send('window:setPresentationMode', false);
    });

    win.on('close', async (e) => {
      if (getIsForceQuitting()) return; // Allow window to close

      if (getIsDocumentDirty()) {
        e.preventDefault();
        const choice = await dialog.showMessageBox(win, {
          type: 'question',
          buttons: ['Yes', 'No', 'Cancel'],
          defaultId: 0,
          cancelId: 2,
          title: 'SmartNoteAI',
          message: 'Do you want to save changes before exiting?',
          detail: 'If you close without saving, your unsaved changes will be lost.',
          noLink: true,
        });

        if (choice.response === 0) {
          // Yes: save and close
          win.webContents.send('app:request-save-and-close');
        } else if (choice.response === 1) {
          // No: don't save and close
          setIsForceQuitting(true);
          win.destroy();
        } else {
          // Cancel: do not close
        }
      }
    });

    // Safety fallback: ensure window is displayed even if ready-to-show takes time
    const showFallbackTimer = setTimeout(() => {
      if (!win.isDestroyed() && !win.isVisible()) {
        console.warn('[Main] ready-to-show timed out, showing window anyway');
        win.show();
      }
    }, 2500);

    win.once('ready-to-show', () => {
      clearTimeout(showFallbackTimer);
      win.show();
      if (isDev) {
        win.webContents.openDevTools({ mode: 'detach' });
      }
    });

    const localHtml = getRendererHtmlPath();

    if (isDev) {
      try {
        await win.loadURL('http://localhost:5173');
      } catch (err) {
        console.warn('[Main] Vite dev server at http://localhost:5173 unavailable, falling back to local build:', err);
        try {
          await win.loadFile(localHtml);
        } catch (fileErr) {
          console.error('[Main] Failed to load local html build:', fileErr);
          win.show();
        }
      }
    } else {
      try {
        await win.loadFile(localHtml);
      } catch (err) {
        console.error('[Main] Failed to load production local html:', err);
        win.show();
      }
    }

    return win;
  }

  // ─── App Lifecycle ──────────────────────────────────────────────────────────
  app.whenReady().then(async () => {
    // Windows App User Model ID ensures pinned shortcuts and taskbar group to SmartNoteAI
    app.setAppUserModelId('com.smartnoteai.app');

    // Initialize services
    db = new DatabaseService();
    await db.initialize();

    settings = new SettingsService(db);
    const fileService = new FileService(settings);
    await fileService.ensureDirectories();

    updateService = new UpdateService(() => mainWindow);
    credentialService = new CredentialService();

    // Register IPC handlers with direct mainWindow accessor
    setupIpcHandlers({ db, settings, fileService, updateService, credentialService, getMainWindow: () => mainWindow });

    mainWindow = await createMainWindow();

    mainWindow.on('closed', () => {
      mainWindow = null;
      app.quit();
    });

    // macOS: re-create window if dock icon clicked
    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = await createMainWindow();
      }
    });

    // Enable new-tab interception and right-click context menu inside <webview>
    app.on('web-contents-created', (_event, contents) => {
      if (contents.getType() === 'webview') {
        // Intercept target="_blank", window.open, middle-click, and Ctrl+click -> open as tab in WebBrowserModal
        contents.setWindowOpenHandler(({ url }) => {
          if (url && url !== 'about:blank') {
            mainWindow?.webContents.send('browser:open-in-new-tab', url);
          }
          return { action: 'deny' };
        });

        contents.on('context-menu', (_e, params) => {
          const menuItems: Electron.MenuItemConstructorOptions[] = [];

          if (params.linkURL) {
            menuItems.push(
              {
                label: 'Open Link in New Tab',
                click: () => {
                  mainWindow?.webContents.send('browser:open-in-new-tab', params.linkURL);
                },
              },
              {
                label: 'Open Link in Current Tab',
                click: () => {
                  contents.loadURL(params.linkURL);
                },
              },
              {
                label: 'Copy Link Address',
                click: () => {
                  clipboard.writeText(params.linkURL);
                },
              },
              { type: 'separator' }
            );
          }

          if (params.hasImageContents) {
            menuItems.push(
              {
                label: 'Copy Image',
                click: () => contents.copyImageAt(params.x, params.y),
              },
              {
                label: 'Copy Image Address',
                click: () => {
                  if (params.srcURL) {
                    clipboard.writeText(params.srcURL);
                  }
                },
              },
              { type: 'separator' }
            );
          }

          if (params.selectionText) {
            menuItems.push(
              { role: 'copy', label: 'Copy Text' },
              { type: 'separator' }
            );
          }

          menuItems.push(
            { role: 'selectAll', label: 'Select All' },
            { type: 'separator' },
            {
              label: 'Back',
              enabled: contents.navigationHistory?.canGoBack?.() ?? false,
              click: () => contents.navigationHistory?.goBack?.(),
            },
            {
              label: 'Forward',
              enabled: contents.navigationHistory?.canGoForward?.() ?? false,
              click: () => contents.navigationHistory?.goForward?.(),
            },
            {
              label: 'Reload',
              click: () => contents.reload(),
            }
          );

          const menu = Menu.buildFromTemplate(menuItems);
          menu.popup();
        });
      }
    });

    // Set application menu
    setupApplicationMenu();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      db?.close();
      app.quit();
    }
  });

// ─── Application Menu ─────────────────────────────────────────────────────────
function setupApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New Lesson', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu:file:new') },
        { label: 'Open Lesson...', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu:file:open') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu:file:save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow?.webContents.send('menu:file:saveas') },
        { type: 'separator' },
        { label: 'Import PDF...', click: () => mainWindow?.webContents.send('menu:file:importpdf') },
        { label: 'Export PDF...', click: () => mainWindow?.webContents.send('menu:file:exportpdf') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => mainWindow?.webContents.send('menu:edit:undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: () => mainWindow?.webContents.send('menu:edit:redo') },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow?.webContents.send('menu:view:zoomin') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow?.webContents.send('menu:view:zoomout') },
        { label: 'Fit Page', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.send('menu:view:fitpage') },
        { type: 'separator' },
        { label: 'Presentation Mode', accelerator: 'F5', click: () => mainWindow?.webContents.send('menu:view:presentation') },
        { label: 'Full Screen', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        ...(isDev ? [{ role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'Pen', accelerator: 'P', click: () => mainWindow?.webContents.send('menu:tool:pen') },
        { label: 'Eraser', accelerator: 'E', click: () => mainWindow?.webContents.send('menu:tool:eraser') },
        { label: 'Select', accelerator: 'S', click: () => mainWindow?.webContents.send('menu:tool:select') },
        { label: 'Text', accelerator: 'T', click: () => mainWindow?.webContents.send('menu:tool:text') },
        { label: 'Shape', accelerator: 'H', click: () => mainWindow?.webContents.send('menu:tool:shape') },
        { type: 'separator' },
        { label: 'Desktop Annotation', accelerator: 'CmdOrCtrl+D', click: () => mainWindow?.webContents.send('menu:tool:desktopannotation') },
        { label: 'Spotlight', click: () => mainWindow?.webContents.send('menu:tool:spotlight') },
      ],
    },
    {
      label: 'Browser & AI Tools',
      submenu: [
        {
          label: 'Web Browser (Google, Images & Wikipedia)...',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => mainWindow?.webContents.send('menu:tool:browser'),
        },
        {
          label: 'AI Teaching Assistant Chat...',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => mainWindow?.webContents.send('menu:tool:aichat'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: async () => {
            if (updateService) {
              const res = await updateService.checkForUpdates();
              if (res.status === 'available') {
                const choice = await dialog.showMessageBox({
                  type: 'info',
                  title: 'Update Available',
                  message: `A new version of SmartNoteAI (${res.latestVersion}) is available!`,
                  detail: res.releaseNotes ? `${res.releaseNotes}\n\nWould you like to download and install it now?` : 'Would you like to download and install it now?',
                  buttons: ['Download & Install', 'Later'],
                  defaultId: 0,
                  cancelId: 1,
                });
                if (choice.response === 0) {
                  await updateService.downloadUpdate();
                }
              } else if (res.status === 'not-available') {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'SmartNoteAI Up to Date',
                  message: `You are running the latest version of SmartNoteAI (v${res.currentVersion}).`,
                  buttons: ['OK'],
                });
              } else if (res.status === 'error') {
                dialog.showMessageBox({
                  type: 'warning',
                  title: 'Update Check Failed',
                  message: 'Unable to check for updates.',
                  detail: res.error || 'Please check your internet connection.',
                  buttons: ['OK'],
                });
              }
            }
          },
        },
        { type: 'separator' },
        { label: 'About SmartNoteAI', click: () => dialog.showMessageBox({
          title: 'SmartNoteAI',
          message: `SmartNoteAI v${app.getVersion() || '2.0.0'}`,
          detail: 'Intelligent digital whiteboard and teaching application.\nBuilt with Electron + React + TypeScript.',
          buttons: ['OK'],
        }) },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
