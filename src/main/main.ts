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

import { app, BrowserWindow, ipcMain, shell, dialog, Menu, nativeTheme, screen } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc/ipcHandlers';
import { DatabaseService } from './services/DatabaseService';
import { SettingsService } from './services/SettingsService';
import { FileService } from './services/FileService';

// ─── Dev vs Production URL ──────────────────────────────────────────────────
const isDev = !app.isPackaged;
const RENDERER_URL = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../renderer/index.html')}`;

// ─── Global State ────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let db: DatabaseService | null = null;
let settings: SettingsService | null = null;

// ─── App Configuration ───────────────────────────────────────────────────────
// Ensure Windows Ink and digitizer pointer events deliver high-frequency pressure and cursor stays visible
app.commandLine.appendSwitch('enable-features', 'PointerEvents,TouchEvents');
app.commandLine.appendSwitch('disable-features', 'HideCursorWhileTyping,DirectManipulationStylus');
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('enable-pointer-events');
// Request high-resolution pointer events for stylus accuracy
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

// ─── Window Creation ─────────────────────────────────────────────────────────
async function createMainWindow(): Promise<BrowserWindow> {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    width: Math.min(1600, width),
    height: Math.min(960, height),
    minWidth: 1024,
    minHeight: 640,
    show: false, // show once ready to prevent flash
    backgroundColor: '#1a1a2e',
    disableAutoHideCursor: true, // Keep the default Windows pointer visible at all times
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#16213e',
      symbolColor: '#e0e0e0',
      height: 40,
    },
    icon: path.join(__dirname, '../../assets/icons/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,          // SECURITY: context isolation on
      nodeIntegration: false,           // SECURITY: no Node in renderer
      sandbox: false,                   // need preload access to limited node
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Enable high-resolution pointer events for stylus
      experimentalFeatures: false,
    },
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

  win.once('ready-to-show', () => {
    win.show();
    if (isDev) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  });

  await win.loadURL(RENDERER_URL);
  return win;
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Initialize services
  db = new DatabaseService();
  await db.initialize();

  settings = new SettingsService(db);
  const fileService = new FileService(settings);
  await fileService.ensureDirectories();

  // Register IPC handlers with direct mainWindow accessor
  setupIpcHandlers({ db, settings, fileService, getMainWindow: () => mainWindow });

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
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Equal', click: () => mainWindow?.webContents.send('menu:view:zoomin') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+Minus', click: () => mainWindow?.webContents.send('menu:view:zoomout') },
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
      label: 'Help',
      submenu: [
        { label: 'About SmartBoard Studio', click: () => dialog.showMessageBox({
          title: 'SmartBoard Studio',
          message: 'SmartBoard Studio v0.1.0',
          detail: 'High-performance Windows smartboard teaching application.\nBuilt with Electron + React + TypeScript.',
          buttons: ['OK'],
        }) },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
