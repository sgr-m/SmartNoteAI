/**
 * Document Store Tests — Milestone 1 unit tests
 * Tests deterministic document state transformations
 */

import { describe, it, expect } from 'vitest';
import {
  documentReducer,
  initialDocumentState,
  DocumentState,
  serializeLesson,
  deserializeLesson,
} from '../src/renderer/store/documentStore';
import { StrokeObject } from '../src/shared/types';

function freshState(): DocumentState {
  return { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };
}

describe('DocumentReducer', () => {
  it('creates a new lesson with one page', () => {
    const state = documentReducer(freshState(), { type: 'NEW_LESSON' });
    expect(state.lesson.pages).toHaveLength(1);
    expect(state.isDirty).toBe(false);
    expect(state.lesson.meta.title).toBe('Untitled Lesson');
  });

  it('adds a page after current', () => {
    const state = documentReducer(freshState(), { type: 'ADD_PAGE', after: 0 });
    expect(state.lesson.pages).toHaveLength(2);
    expect(state.currentPageIndex).toBe(1);
    expect(state.isDirty).toBe(true);
  });

  it('inherits custom background and dimensions when adding a page', () => {
    let state = freshState();
    state = documentReducer(state, {
      type: 'SET_PAGE_BACKGROUND',
      pageIndex: 0,
      background: { type: 'grid', color: '#1b4332', gridSize: 48, lineColor: 'rgba(255,255,255,0.2)' },
    });
    state = documentReducer(state, {
      type: 'SET_PAGE_DIMENSIONS',
      pageIndex: 0,
      width: 2560,
      height: 1440,
    });
    state = documentReducer(state, { type: 'ADD_PAGE', after: 0 });
    expect(state.lesson.pages).toHaveLength(2);
    expect(state.lesson.pages[1].background.type).toBe('grid');
    expect(state.lesson.pages[1].background.color).toBe('#1b4332');
    expect(state.lesson.pages[1].background.gridSize).toBe(48);
    expect(state.lesson.pages[1].width).toBe(2560);
    expect(state.lesson.pages[1].height).toBe(1440);
  });

  it('adds multiple pages in sequence', () => {
    let state = freshState();
    state = documentReducer(state, { type: 'ADD_PAGE' });
    state = documentReducer(state, { type: 'ADD_PAGE' });
    expect(state.lesson.pages).toHaveLength(3);
  });

  it('deletes a page correctly', () => {
    let state = freshState();
    state = documentReducer(state, { type: 'ADD_PAGE' });
    state = documentReducer(state, { type: 'DELETE_PAGE', index: 0 });
    expect(state.lesson.pages).toHaveLength(1);
    expect(state.currentPageIndex).toBe(0);
  });

  it('does not delete the last remaining page', () => {
    const state = documentReducer(freshState(), { type: 'DELETE_PAGE', index: 0 });
    expect(state.lesson.pages).toHaveLength(1);
  });

  it('navigates to a page', () => {
    let state = freshState();
    state = documentReducer(state, { type: 'ADD_PAGE' });
    state = documentReducer(state, { type: 'GOTO_PAGE', index: 0 });
    expect(state.currentPageIndex).toBe(0);
  });

  it('does not navigate out of bounds', () => {
    const state = documentReducer(freshState(), { type: 'GOTO_PAGE', index: 99 });
    expect(state.currentPageIndex).toBe(0);
  });

  it('adds a stroke object to a page', () => {
    const state = freshState();
    const stroke: StrokeObject = {
      id: 'test-stroke-1',
      type: 'stroke',
      points: [
        { x: 0, y: 0, pressure: 0.5, timestamp: 0 },
        { x: 10, y: 10, pressure: 0.6, timestamp: 16 },
      ],
      style: { penType: 'normal', color: '#fff', width: 3, opacity: 1, smoothing: 0.5, pressureSensitive: true },
      bbox: { x: 0, y: 0, width: 10, height: 10 },
      locked: false,
      layerId: 'drawing',
      createdAt: Date.now(),
    };

    const newState = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: stroke });
    expect(newState.lesson.pages[0].objects).toHaveLength(1);
    expect(newState.lesson.pages[0].objects[0].id).toBe('test-stroke-1');
    expect(newState.isDirty).toBe(true);
  });

  it('removes an object from a page', () => {
    let state = freshState();
    const stroke: StrokeObject = {
      id: 'stroke-to-delete',
      type: 'stroke',
      points: [{ x: 0, y: 0 }],
      style: { penType: 'normal', color: '#fff', width: 3, opacity: 1, smoothing: 0.5, pressureSensitive: true },
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      locked: false,
      layerId: 'drawing',
      createdAt: Date.now(),
    };
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: stroke });
    state = documentReducer(state, { type: 'REMOVE_OBJECT', pageIndex: 0, objectId: 'stroke-to-delete' });
    expect(state.lesson.pages[0].objects).toHaveLength(0);
  });

  it('sets and clears dirty flag', () => {
    let state = documentReducer(freshState(), { type: 'SET_DIRTY' });
    expect(state.isDirty).toBe(true);
    state = documentReducer(state, { type: 'SET_CLEAN', savedPath: '/test/lesson.sbl' });
    expect(state.isDirty).toBe(false);
    expect(state.savedPath).toBe('/test/lesson.sbl');
  });

  it('sets title and marks dirty', () => {
    const state = documentReducer(freshState(), { type: 'SET_TITLE', title: 'My Lesson' });
    expect(state.lesson.meta.title).toBe('My Lesson');
    expect(state.isDirty).toBe(true);
  });

  it('moves a page correctly', () => {
    let state = freshState();
    state = documentReducer(state, { type: 'ADD_PAGE' }); // Page 2
    const page0Id = state.lesson.pages[0].id;
    const page1Id = state.lesson.pages[1].id;
    state = documentReducer(state, { type: 'MOVE_PAGE', from: 0, to: 1 });
    expect(state.lesson.pages[0].id).toBe(page1Id);
    expect(state.lesson.pages[1].id).toBe(page0Id);
  });
});

describe('Lesson Serialization', () => {
  it('serializes and deserializes a lesson roundtrip', () => {
    const state = freshState();
    const json = serializeLesson(state.lesson);
    expect(typeof json).toBe('string');
    const recovered = deserializeLesson(json);
    expect(recovered.meta.id).toBe(state.lesson.meta.id);
    expect(recovered.pages).toHaveLength(1);
  });

  it('throws on invalid JSON', () => {
    expect(() => deserializeLesson('not-json')).toThrow();
  });

  it('throws on missing meta.id', () => {
    const bad = JSON.stringify({ meta: {}, pages: [] });
    expect(() => deserializeLesson(bad)).toThrow('Invalid lesson file');
  });

  it('throws on missing pages array', () => {
    const bad = JSON.stringify({ meta: { id: 'x' }, notpages: [] });
    expect(() => deserializeLesson(bad)).toThrow('Invalid lesson file');
  });

  it('preserves lesson with multiple pages and objects after roundtrip', () => {
    let state = freshState();
    state = documentReducer(state, { type: 'ADD_PAGE' });
    const stroke: StrokeObject = {
      id: 'persist-stroke',
      type: 'stroke',
      points: [{ x: 5, y: 5 }, { x: 10, y: 20 }],
      style: { penType: 'normal', color: '#f00', width: 3, opacity: 1, smoothing: 0, pressureSensitive: false },
      bbox: { x: 5, y: 5, width: 5, height: 15 },
      locked: false,
      layerId: 'drawing',
      createdAt: 123456,
    };
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: stroke });

    const json = serializeLesson(state.lesson);
    const recovered = deserializeLesson(json);

    expect(recovered.pages).toHaveLength(2);
    expect(recovered.pages[0].objects[0].id).toBe('persist-stroke');
    expect((recovered.pages[0].objects[0] as StrokeObject).style.color).toBe('#f00');
  });
});
