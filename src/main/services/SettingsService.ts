/**
 * Settings Service — typed wrapper around the database settings table
 */

import { DatabaseService } from './DatabaseService';
import path from 'path';
import { app } from 'electron';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  toolbarPosition: 'top' | 'left' | 'bottom' | 'right';
  autosaveIntervalSeconds: number;
  defaultPageSize: '16x9' | '16x10' | '4x3' | 'a4' | 'custom';
  penSmoothingEnabled: boolean;
  resourceLibraryPath: string;
  showGridByDefault: boolean;
  highDpiEnabled: boolean;
}

const DEFAULT_RESOURCE_PATH = path.join(
  app.getPath('documents'),
  'SmartboardStudio',
  'Resources'
);

const DEFAULTS: AppSettings = {
  theme: 'dark',
  toolbarPosition: 'top',
  autosaveIntervalSeconds: 60,
  defaultPageSize: '16x9',
  penSmoothingEnabled: true,
  resourceLibraryPath: DEFAULT_RESOURCE_PATH,
  showGridByDefault: false,
  highDpiEnabled: true,
};

export class SettingsService {
  constructor(private db: DatabaseService) {}

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const raw = this.db.getSetting(key as string);
    if (raw === null) return DEFAULTS[key];
    try {
      return JSON.parse(raw) as AppSettings[K];
    } catch {
      return DEFAULTS[key];
    }
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.db.setSetting(key as string, JSON.stringify(value));
  }

  getAll(): AppSettings {
    const result = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS) as Array<keyof AppSettings>) {
      (result as Record<string, unknown>)[key] = this.get(key);
    }
    return result;
  }

  getResourceLibraryPath(): string {
    return this.get('resourceLibraryPath') || DEFAULT_RESOURCE_PATH;
  }

  getLessonsPath(): string {
    return path.join(app.getPath('documents'), 'SmartboardStudio', 'Lessons');
  }

  getAutosavePath(): string {
    return path.join(app.getPath('userData'), 'autosave');
  }
}
