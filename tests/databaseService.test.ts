/**
 * Database Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '../src/main/services/DatabaseService';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('DatabaseService', () => {
  let db: DatabaseService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartboard-test-'));
    db = new DatabaseService();
    // Override dbPath for isolated testing
    (db as unknown as { dbPath: string }).dbPath = path.join(tempDir, 'test-db.json');
    await db.initialize();
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('initializes with default settings', () => {
    const theme = db.getSetting('theme');
    expect(theme).toBe('"dark"');
    const autosave = db.getSetting('autosaveIntervalSeconds');
    expect(autosave).toBe('60');
  });

  it('updates and persists settings', () => {
    db.setSetting('theme', '"light"');
    expect(db.getSetting('theme')).toBe('"light"');
  });

  it('upserts and retrieves lessons in recents order', () => {
    db.upsertLesson({
      id: 'lesson-1',
      title: 'Math Grade 10',
      file_path: '/path/to/math.sbl',
      page_count: 5,
      subject: 'Mathematics',
    });

    db.upsertLesson({
      id: 'lesson-2',
      title: 'Physics Lab',
      file_path: '/path/to/physics.sbl',
      page_count: 3,
      subject: 'Physics',
    });

    const recents = db.getRecentLessons(10);
    expect(recents).toHaveLength(2);
    // lesson-2 was upserted last, should be first
    expect(recents[0].id).toBe('lesson-2');
    expect(recents[1].id).toBe('lesson-1');
  });

  it('handles resources storage and retrieval', () => {
    db.upsertResource({
      id: 'res-1',
      name: 'Grid Background',
      description: 'Square math grid',
      category: 'Mathematics',
      file_path: '/assets/grid.svg',
      tags: ['grid', 'math'],
      is_favorite: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const mathResources = db.getResources('Mathematics');
    expect(mathResources).toHaveLength(1);
    expect(mathResources[0].name).toBe('Grid Background');

    const physResources = db.getResources('Physics');
    expect(physResources).toHaveLength(0);
  });
});
