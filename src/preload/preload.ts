/**
 * Preload Script — secure bridge between renderer and main process.
 * 
 * SECURITY:
 * - context isolation is ON
 * - nodeIntegration is OFF in renderer
 * - Only explicitly whitelisted channels are exposed
 * - No arbitrary IPC channel access
 */

import { contextBridge, ipcRenderer } from 'electron';

// Whitelist of allowed IPC channels the renderer may invoke
const ALLOWED_INVOKE = new Set([
  'settings:getAll',
  'settings:get',
  'settings:set',
  'file:readText',
  'file:readBinary',
  'file:writeText',
  'file:delete',
  'file:exists',
  'file:listDir',
  'file:openDialog',
  'file:saveDialog',
  'file:openInExplorer',
  'paths:autosave',
  'paths:lessons',
  'paths:resources',
  'db:getRecentLessons',
  'db:upsertLesson',
  'window:minimize',
  'window:maximize',
  'window:close',
  'window:isMaximized',
  'window:setFullScreen',
  'window:isFullScreen',
  'window:showDesktop',
  'window:restore',
  'window:moveOverlay',
  'screen:getAllDisplays',
  'screen:getPrimaryDisplay',
  'screenshot:captureScreen',
  'screenshot:captureWindow',
  'file:writeBinary',
  'clipboard:writeImage',
  'clipboard:read',
  'window:setIgnoreMouseEvents',
  'desktop:insertImage',
  'annotation:open',
  'annotation:close',
  'annotation:setClickThrough',
  'annotation:clear',
  'desktop:updateToolbarBounds',
  'desktop:setToolMode',
  'app:quit',
]);

// Whitelist of allowed channels the renderer may listen on (from main)
const ALLOWED_LISTEN = new Set([
  'menu:file:new',
  'menu:file:open',
  'menu:file:save',
  'menu:file:saveas',
  'menu:file:importpdf',
  'menu:file:exportpdf',
  'menu:edit:undo',
  'menu:edit:redo',
  'menu:view:zoomin',
  'menu:view:zoomout',
  'menu:view:fitpage',
  'menu:view:presentation',
  'menu:tool:pen',
  'menu:tool:eraser',
  'menu:tool:select',
  'menu:tool:text',
  'menu:tool:shape',
  'menu:tool:desktopannotation',
  'menu:tool:spotlight',
  'app:update-available',
  'annotation:closed',
  'annotation:doClear',
  'desktop:doInsertImage',
  'desktop:resetMode',
  'window:setPresentationMode',
]);

// The API surface exposed to the renderer via window.electronAPI
const electronAPI = {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!ALLOWED_INVOKE.has(channel)) {
      throw new Error(`IPC channel '${channel}' is not whitelisted`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  on: (channel: string, listener: (...args: unknown[]) => void): (() => void) => {
    if (!ALLOWED_LISTEN.has(channel)) {
      throw new Error(`Listen channel '${channel}' is not whitelisted`);
    }
    const wrapped = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => listener(...args);
    ipcRenderer.on(channel, wrapped);
    // Return cleanup function
    return () => ipcRenderer.removeListener(channel, wrapped);
  },

  once: (channel: string, listener: (...args: unknown[]) => void): void => {
    if (!ALLOWED_LISTEN.has(channel)) {
      throw new Error(`Listen channel '${channel}' is not whitelisted`);
    }
    ipcRenderer.once(channel, (_event, ...args) => listener(...args));
  },

  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript type for the renderer
export type ElectronAPI = typeof electronAPI;
