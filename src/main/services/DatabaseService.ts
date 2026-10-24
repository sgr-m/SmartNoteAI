/**
 * Database Service — High-performance JSON-backed persistence layer
 * Zero native C++ compilation dependencies; rock-solid atomic file writes.
 * Supports schema versioning, settings, recent lessons, and resource indexing.
 */

import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface LessonRecord {
  id: string;
  title: string;
  file_path: string;
  created_at: string;
  updated_at: string;
  thumbnail_path?: string | null;
  page_count: number;
  subject?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface RecentFileRecord {
  lesson_id: string;
  file_path: string;
  opened_at: string;
}

export interface ResourceRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  file_path: string;
  thumbnail_path?: string | null;
  tags: string[];
  file_type?: string;
  file_size?: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  version: number;
  settings: Record<string, string>;
  lessons: Record<string, LessonRecord>;
  recent_files: RecentFileRecord[];
  resources: Record<string, ResourceRecord>;
  resource_collections: Record<string, { id: string; name: string; parent_id?: string | null; created_at: string }>;
}

const DEFAULT_SETTINGS: Record<string, string> = {
  theme: '"dark"',
  toolbarPosition: '"top"',
  autosaveIntervalSeconds: '60',
  defaultPageSize: '"16x9"',
  penSmoothingEnabled: 'true',
  resourceLibraryPath: 'null',
  showGridByDefault: 'false',
  highDpiEnabled: 'true',
};

export class DatabaseService {
  private dbPath: string;
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
    this.dbPath = path.join(userDataPath, 'smartboard-studio-db.json');
    this.data = {
      version: 1,
      settings: { ...DEFAULT_SETTINGS },
      lessons: {},
      recent_files: [],
      resources: {},
      resource_collections: {},
    };
  }

  async initialize(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
        this.data = {
          version: parsed.version ?? 1,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
          lessons: parsed.lessons ?? {},
          recent_files: parsed.recent_files ?? [],
          resources: parsed.resources ?? {},
          resource_collections: parsed.resource_collections ?? {},
        };
      } catch (err) {
        console.error('[DB] Failed to parse existing database file, initializing defaults:', err);
        this.flushSync();
      }
    } else {
      this.flushSync();
    }
  }

  private flushSync(): void {
    try {
      const tempPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      console.error('[DB] Error writing database to disk:', err);
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.flushSync();
      this.saveTimeout = null;
    }, 250);
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  getSetting(key: string): string | null {
    return this.data.settings[key] ?? null;
  }

  setSetting(key: string, value: string): void {
    this.data.settings[key] = value;
    this.scheduleSave();
  }

  // ─── Lessons ──────────────────────────────────────────────────────────────

  getRecentLessons(limit = 20): LessonRecord[] {
    const sortedRecents = [...this.data.recent_files].sort(
      (a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
    );

    const lessons: LessonRecord[] = [];
    const seen = new Set<string>();

    for (const r of sortedRecents) {
      if (seen.has(r.lesson_id)) continue;
      const lesson = this.data.lessons[r.lesson_id];
      if (lesson) {
        lessons.push(lesson);
        seen.add(r.lesson_id);
      }
      if (lessons.length >= limit) break;
    }

    return lessons;
  }

  upsertLesson(lesson: {
    id: string;
    title: string;
    file_path: string;
    page_count: number;
    subject?: string;
    thumbnail_path?: string;
  }): void {
    const now = new Date().toISOString();
    const existing = this.data.lessons[lesson.id];

    const record: LessonRecord = {
      id: lesson.id,
      title: lesson.title,
      file_path: lesson.file_path,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      page_count: lesson.page_count,
      subject: lesson.subject ?? null,
      thumbnail_path: lesson.thumbnail_path ?? null,
      tags: existing?.tags ?? [],
      metadata: existing?.metadata ?? {},
    };

    this.data.lessons[lesson.id] = record;

    // Update recent files list
    this.data.recent_files = this.data.recent_files.filter(
      (rf) => rf.file_path !== lesson.file_path
    );
    this.data.recent_files.unshift({
      lesson_id: lesson.id,
      file_path: lesson.file_path,
      opened_at: now,
    });

    this.scheduleSave();
  }

  // ─── Resources (Milestone 5) ─────────────────────────────────────────────

  getResources(category?: string): ResourceRecord[] {
    const items = Object.values(this.data.resources);
    if (!category) return items;
    return items.filter((r) => r.category === category);
  }

  upsertResource(resource: ResourceRecord): void {
    this.data.resources[resource.id] = resource;
    this.scheduleSave();
  }

  close(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.flushSync();
  }

  getDbPath(): string {
    return this.dbPath;
  }
}
