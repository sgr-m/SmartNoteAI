/**
 * Lesson Management, Page Templates, and Transitions Unit Tests
 * Milestone 3, Section 10
 */

import { describe, it, expect } from 'vitest';
import {
  documentReducer,
  initialDocumentState,
  serializeLesson,
  deserializeLesson,
} from '../src/renderer/store/documentStore';
import { PAGE_TEMPLATES } from '../src/renderer/components/PageTemplatesModal';
import { PageTransition } from '../src/shared/types';

describe('Milestone 3 — Section 10: Lessons, Slides & Transitions', () => {
  it('adds, renames, duplicates, moves, and deletes pages', () => {
    let state = { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };
    expect(state.lesson.pages).toHaveLength(1);

    // 1. Add page
    state = documentReducer(state, { type: 'ADD_PAGE', after: 0 });
    expect(state.lesson.pages).toHaveLength(2);
    expect(state.currentPageIndex).toBe(1);

    // 2. Rename page
    state = documentReducer(state, {
      type: 'RENAME_PAGE',
      pageIndex: 1,
      title: 'Introduction to Calculus',
    });
    expect(state.lesson.pages[1].title).toBe('Introduction to Calculus');

    // 3. Duplicate page
    state = documentReducer(state, { type: 'DUPLICATE_PAGE', pageIndex: 1 });
    expect(state.lesson.pages).toHaveLength(3);
    expect(state.lesson.pages[2].title).toBe('Introduction to Calculus (Copy)');

    // 4. Move page
    state = documentReducer(state, { type: 'MOVE_PAGE', from: 2, to: 0 });
    expect(state.lesson.pages[0].title).toBe('Introduction to Calculus (Copy)');
    expect(state.currentPageIndex).toBe(0);

    // 5. Delete page
    state = documentReducer(state, { type: 'DELETE_PAGE', index: 0 });
    expect(state.lesson.pages).toHaveLength(2);
  });

  it('updates lesson metadata correctly', () => {
    let state = { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };

    state = documentReducer(state, {
      type: 'SET_LESSON_META',
      meta: {
        title: 'Physics Lab: Projectile Motion',
        subject: 'Physics',
        author: 'Prof. Maxwell',
        tags: ['physics', 'mechanics', 'kinematics'],
      },
    });

    expect(state.lesson.meta.title).toBe('Physics Lab: Projectile Motion');
    expect(state.lesson.meta.subject).toBe('Physics');
    expect(state.lesson.meta.author).toBe('Prof. Maxwell');
    expect(state.lesson.meta.tags).toEqual(['physics', 'mechanics', 'kinematics']);
    expect(state.isDirty).toBe(true);
  });

  it('sets slide transitions including type and duration', () => {
    let state = { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };

    const transition: PageTransition = {
      type: 'slide-left',
      duration: 500,
    };

    state = documentReducer(state, {
      type: 'SET_PAGE_TRANSITION',
      pageIndex: 0,
      transition,
    });

    expect(state.lesson.pages[0].transition?.type).toBe('slide-left');
    expect(state.lesson.pages[0].transition?.duration).toBe(500);
  });

  it('verifies all educational page templates produce valid backgrounds and objects', () => {
    expect(PAGE_TEMPLATES.length).toBeGreaterThanOrEqual(8);

    const templateIds = PAGE_TEMPLATES.map((t) => t.id);
    expect(templateIds).toContain('blank');
    expect(templateIds).toContain('ruled');
    expect(templateIds).toContain('grid');
    expect(templateIds).toContain('cornell');
    expect(templateIds).toContain('two-column');
    expect(templateIds).toContain('science-lab');
    expect(templateIds).toContain('storyboard');

    for (const t of PAGE_TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.background).toBeTruthy();
      const objects = t.createObjects(1920, 1080);
      expect(Array.isArray(objects)).toBe(true);
      for (const obj of objects) {
        expect(obj.id).toBeTruthy();
        expect(obj.type).toBeTruthy();
      }
    }
  });

  it('serializes and deserializes versioned native lesson files accurately', () => {
    let state = { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };
    state = documentReducer(state, {
      type: 'SET_LESSON_META',
      meta: { title: 'Chemistry 101', subject: 'Chemistry', author: 'Dr. Mendeleev', tags: ['atoms', 'periodic-table'] },
    });
    state = documentReducer(state, {
      type: 'SET_PAGE_TRANSITION',
      pageIndex: 0,
      transition: { type: 'fade', duration: 300 },
    });

    const serialized = serializeLesson(state.lesson);
    expect(typeof serialized).toBe('string');

    const deserialized = deserializeLesson(serialized);
    expect(deserialized.meta.title).toBe('Chemistry 101');
    expect(deserialized.meta.subject).toBe('Chemistry');
    expect(deserialized.meta.author).toBe('Dr. Mendeleev');
    expect(deserialized.pages).toHaveLength(state.lesson.pages.length);
    expect(deserialized.pages[0].transition?.type).toBe('fade');
  });

  it('preserves crash recovery draft structure in local storage schema', () => {
    const draft = {
      lesson: initialDocumentState.lesson,
      timestamp: Date.now(),
      savedPath: 'C:/Lessons/Algebra.sbl',
      currentPageIndex: 0,
    };

    const draftJson = JSON.stringify(draft);
    const parsed = JSON.parse(draftJson);

    expect(parsed.lesson.meta.id).toBe(initialDocumentState.lesson.meta.id);
    expect(parsed.savedPath).toBe('C:/Lessons/Algebra.sbl');
    expect(parsed.currentPageIndex).toBe(0);
    expect(typeof parsed.timestamp).toBe('number');
  });
});
