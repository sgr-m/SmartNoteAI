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
  aiDefaultProvider: 'openai' | 'gemini' | 'ollama' | 'custom-openai';
  aiSelectedModel: string;
  aiCustomEndpoint: string;
  aiRequestTimeoutSeconds: number;
  aiTemperature: number;
}

function getDefaultResourcePath(): string {
  try {
    const docPath = app?.getPath ? app.getPath('documents') : process.cwd();
    return path.join(docPath, 'SmartboardStudio', 'Resources');
  } catch {
    return path.join(process.cwd(), 'SmartboardStudio', 'Resources');
  }
}

const DEFAULTS: AppSettings = {
  theme: 'dark',
  toolbarPosition: 'top',
  autosaveIntervalSeconds: 60,
  defaultPageSize: '16x9',
  penSmoothingEnabled: true,
  resourceLibraryPath: '',
  showGridByDefault: false,
  highDpiEnabled: true,
  aiDefaultProvider: 'openai',
  aiSelectedModel: 'gpt-4o-mini',
  aiCustomEndpoint: '',
  aiRequestTimeoutSeconds: 30,
  aiTemperature: 0.7,
};

export class SettingsService {
  constructor(private db: DatabaseService) {}

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const raw = this.db.getSetting(key as string);
    if (raw === null) {
      if (key === 'resourceLibraryPath') {
        return getDefaultResourcePath() as AppSettings[K];
      }
      return DEFAULTS[key];
    }
    try {
      const parsed = JSON.parse(raw);
      if (key === 'resourceLibraryPath' && (!parsed || parsed === 'null')) {
        return getDefaultResourcePath() as AppSettings[K];
      }
      return parsed as AppSettings[K];
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
    return this.get('resourceLibraryPath') || getDefaultResourcePath();
  }

  getLessonsPath(): string {
    const docPath = app?.getPath ? app.getPath('documents') : process.cwd();
    return path.join(docPath, 'SmartboardStudio', 'Lessons');
  }

  getAutosavePath(): string {
    const userPath = app?.getPath ? app.getPath('userData') : process.cwd();
    return path.join(userPath, 'autosave');
  }
}
