/**
 * DocumentStore — centralized document state management
 * 
 * Uses React's useReducer pattern (not a class) so the UI can subscribe to
 * changes via context, while the drawing engine bypasses React for hot paths.
 *
 * Autosave is triggered here but executed in the background without blocking drawing.
 */

import { LessonDocument, LessonMeta, Page, CanvasObject, StrokeObject, PageBackground, Layer, PageTransition } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export type DocumentAction =
  | { type: 'LOAD_LESSON'; lesson: LessonDocument }
  | { type: 'NEW_LESSON' }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_LESSON_META'; meta: Partial<LessonMeta> }
  | { type: 'ADD_PAGE'; after?: number }
  | { type: 'INSERT_PAGES'; pages: Page[]; after?: number }
  | { type: 'DELETE_PAGE'; index: number }
  | { type: 'MOVE_PAGE'; from: number; to: number }
  | { type: 'GOTO_PAGE'; index: number }
  | { type: 'RENAME_PAGE'; pageIndex: number; title: string }
  | { type: 'SET_PAGE_BACKGROUND'; pageIndex: number; background: PageBackground }
  | { type: 'SET_PAGE_DIMENSIONS'; pageIndex: number; width: number; height: number }
  | { type: 'SET_PAGE_TRANSITION'; pageIndex: number; transition: PageTransition }
  | { type: 'SET_LAYER_VISIBILITY'; pageIndex: number; layerId: string; visible: boolean }
  | { type: 'SET_LAYER_LOCKED'; pageIndex: number; layerId: string; locked: boolean }
  | { type: 'SET_LAYER_OPACITY'; pageIndex: number; layerId: string; opacity: number }
  | { type: 'REORDER_LAYERS'; pageIndex: number; layers: Layer[] }
  | { type: 'ADD_OBJECT'; pageIndex: number; object: CanvasObject }
  | { type: 'ADD_OBJECTS'; pageIndex: number; objects: CanvasObject[] }
  | { type: 'REMOVE_OBJECT'; pageIndex: number; objectId: string }
  | { type: 'REMOVE_OBJECTS'; pageIndex: number; objectIds: string[] }
  | { type: 'REPLACE_OBJECTS'; pageIndex: number; removeIds: string[]; newObjects: CanvasObject[] }
  | { type: 'CLEAR_PAGE'; pageIndex: number }
  | { type: 'DUPLICATE_PAGE'; pageIndex: number }
  | { type: 'UPDATE_OBJECT'; pageIndex: number; object: CanvasObject }
  | { type: 'UPDATE_OBJECTS'; pageIndex: number; objects: CanvasObject[] }
  | { type: 'MOVE_OBJECT_LAYER'; pageIndex: number; objectId: string; direction: 'top' | 'bottom' | 'forward' | 'backward' }
  | { type: 'REORDER_OBJECTS'; pageIndex: number; objects: CanvasObject[] }
  | { type: 'SET_DIRTY' }
  | { type: 'SET_CLEAN'; savedPath: string }
  | { type: 'SET_SAVE_PATH'; path: string };

export interface DocumentState {
  lesson: LessonDocument;
  currentPageIndex: number;
  isDirty: boolean;
  savedPath: string | null;
  lastSavedAt: number | null;
}

export function createDefaultPage(): Page {
  const defaultW = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1920;
  const defaultH = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1080;
  return {
    id: uuidv4(),
    title: 'Page 1',
    width: defaultW,
    height: defaultH,
    background: { type: 'blank', color: '#1a1a2e' },
    layers: [
      { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
      { id: 'imported-media', name: 'Imported Media', visible: true, locked: false, opacity: 1, order: 1 },
      { id: 'drawing', name: 'Drawing', visible: true, locked: false, opacity: 1, order: 2 },
      { id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 3 },
      { id: 'interaction', name: 'Interaction', visible: true, locked: false, opacity: 1, order: 4 },
    ],
    objects: [],
    transition: { type: 'none', duration: 300 },
  };
}

function createNewLesson(): LessonDocument {
  const now = Date.now();
  return {
    meta: {
      id: uuidv4(),
      title: 'Untitled Lesson',
      tags: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    pages: [createDefaultPage()],
  };
}

export const initialDocumentState: DocumentState = {
  lesson: createNewLesson(),
  currentPageIndex: 0,
  isDirty: false,
  savedPath: null,
  lastSavedAt: null,
};

export function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case 'NEW_LESSON':
      return { ...initialDocumentState, lesson: createNewLesson() };

    case 'LOAD_LESSON':
      return {
        ...state,
        lesson: action.lesson,
        currentPageIndex: 0,
        isDirty: false,
        lastSavedAt: Date.now(),
      };

    case 'SET_TITLE': {
      const meta = { ...state.lesson.meta, title: action.title, updatedAt: Date.now() };
      return { ...state, lesson: { ...state.lesson, meta }, isDirty: true };
    }

    case 'SET_LESSON_META': {
      const meta = { ...state.lesson.meta, ...action.meta, updatedAt: Date.now() };
      return { ...state, lesson: { ...state.lesson, meta }, isDirty: true };
    }

    case 'ADD_PAGE': {
      const refPage =
        action.after !== undefined
          ? state.lesson.pages[action.after]
          : state.lesson.pages[state.currentPageIndex];
      const inheritedBackground: PageBackground = refPage?.background
        ? { ...refPage.background }
        : { type: 'blank', color: '#1a1a2e' };
      const defaultW = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1920;
      const defaultH = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1080;
      const inheritedWidth = refPage?.width ?? defaultW;
      const inheritedHeight = refPage?.height ?? defaultH;

      const newPage: Page = {
        ...createDefaultPage(),
        title: `Page ${state.lesson.pages.length + 1}`,
        background: inheritedBackground,
        width: inheritedWidth,
        height: inheritedHeight,
      };
      const pages = [...state.lesson.pages];
      const insertAt = action.after !== undefined ? action.after + 1 : pages.length;
      pages.splice(insertAt, 0, newPage);
      return {
        ...state,
        lesson: { ...state.lesson, pages },
        currentPageIndex: insertAt,
        isDirty: true,
      };
    }

    case 'INSERT_PAGES': {
      if (!action.pages || action.pages.length === 0) return state;
      const pages = [...state.lesson.pages];
      const insertAt = action.after !== undefined ? action.after + 1 : pages.length;
      pages.splice(insertAt, 0, ...action.pages);
      return {
        ...state,
        lesson: { ...state.lesson, pages },
        currentPageIndex: insertAt,
        isDirty: true,
      };
    }

    case 'DELETE_PAGE': {
      if (state.lesson.pages.length <= 1) return state; // can't delete last page
      const pages = state.lesson.pages.filter((_, i) => i !== action.index);
      const currentPageIndex = Math.min(state.currentPageIndex, pages.length - 1);
      return { ...state, lesson: { ...state.lesson, pages }, currentPageIndex, isDirty: true };
    }

    case 'MOVE_PAGE': {
      const pages = [...state.lesson.pages];
      const [moved] = pages.splice(action.from, 1);
      pages.splice(action.to, 0, moved);
      return {
        ...state,
        lesson: { ...state.lesson, pages },
        currentPageIndex: action.to,
        isDirty: true,
      };
    }

    case 'GOTO_PAGE':
      if (action.index < 0 || action.index >= state.lesson.pages.length) return state;
      return { ...state, currentPageIndex: action.index };

    case 'RENAME_PAGE': {
      const pages = state.lesson.pages.map((p, i) =>
        i === action.pageIndex ? { ...p, title: action.title } : p
      );
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'SET_PAGE_BACKGROUND': {
      const pages = state.lesson.pages.map((p, i) =>
        i === action.pageIndex ? { ...p, background: action.background } : p
      );
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'SET_PAGE_DIMENSIONS': {
      const pages = state.lesson.pages.map((p, i) =>
        i === action.pageIndex ? { ...p, width: action.width, height: action.height } : p
      );
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'SET_PAGE_TRANSITION': {
      const pages = state.lesson.pages.map((p, i) =>
        i === action.pageIndex ? { ...p, transition: action.transition } : p
      );
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'SET_LAYER_VISIBILITY': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        const layers = p.layers.map((l) =>
          l.id === action.layerId ? { ...l, visible: action.visible } : l
        );
        return { ...p, layers };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'SET_LAYER_LOCKED': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        const layers = p.layers.map((l) =>
          l.id === action.layerId ? { ...l, locked: action.locked } : l
        );
        return { ...p, layers };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'SET_LAYER_OPACITY': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        const layers = p.layers.map((l) =>
          l.id === action.layerId ? { ...l, opacity: action.opacity } : l
        );
        return { ...p, layers };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'REORDER_LAYERS': {
      const pages = state.lesson.pages.map((p, i) =>
        i === action.pageIndex ? { ...p, layers: action.layers } : p
      );
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'ADD_OBJECT': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        return { ...p, objects: [...p.objects, action.object] };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'ADD_OBJECTS': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        return { ...p, objects: [...p.objects, ...action.objects] };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'REMOVE_OBJECT': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        return { ...p, objects: p.objects.filter(o => o.id !== action.objectId) };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'REMOVE_OBJECTS': {
      const idSet = new Set(action.objectIds);
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        return { ...p, objects: p.objects.filter(o => !idSet.has(o.id)) };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'REPLACE_OBJECTS': {
      const removeSet = new Set(action.removeIds);
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        const kept = p.objects.filter(o => !removeSet.has(o.id));
        return { ...p, objects: [...kept, ...action.newObjects] };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'CLEAR_PAGE': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        return { ...p, objects: [] };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'DUPLICATE_PAGE': {
      const src = state.lesson.pages[action.pageIndex];
      if (!src) return state;
      const copy: Page = {
        ...src,
        id: uuidv4(),
        title: `${src.title} (Copy)`,
        objects: src.objects.map(o => ({ ...o, id: uuidv4() })),
      };
      const pages = [...state.lesson.pages];
      pages.splice(action.pageIndex + 1, 0, copy);
      return {
        ...state,
        lesson: { ...state.lesson, pages },
        currentPageIndex: action.pageIndex + 1,
        isDirty: true,
      };
    }

    case 'UPDATE_OBJECT': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        return { ...p, objects: p.objects.map(o => o.id === action.object.id ? action.object : o) };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'UPDATE_OBJECTS': {
      const objMap = new Map(action.objects.map((o) => [o.id, o]));
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        return { ...p, objects: p.objects.map((o) => objMap.get(o.id) || o) };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'MOVE_OBJECT_LAYER': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        const objects = [...p.objects];
        const idx = objects.findIndex(o => o.id === action.objectId);
        if (idx === -1) return p;
        const [target] = objects.splice(idx, 1);
        if (action.direction === 'top') {
          objects.push(target);
        } else if (action.direction === 'bottom') {
          objects.unshift(target);
        } else if (action.direction === 'forward') {
          const newIdx = Math.min(objects.length, idx + 1);
          objects.splice(newIdx, 0, target);
        } else if (action.direction === 'backward') {
          const newIdx = Math.max(0, idx - 1);
          objects.splice(newIdx, 0, target);
        }
        return { ...p, objects };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'REORDER_OBJECTS': {
      const pages = state.lesson.pages.map((p, i) => {
        if (i !== action.pageIndex) return p;
        return { ...p, objects: action.objects };
      });
      return { ...state, lesson: { ...state.lesson, pages }, isDirty: true };
    }

    case 'SET_DIRTY':
      return { ...state, isDirty: true };

    case 'SET_CLEAN':
      return { ...state, isDirty: false, savedPath: action.savedPath, lastSavedAt: Date.now() };

    case 'SET_SAVE_PATH':
      return { ...state, savedPath: action.path };

    default:
      return state;
  }
}

// ─── Lesson Serialization ─────────────────────────────────────────────────────

export function serializeLesson(lesson: LessonDocument): string {
  return JSON.stringify({ ...lesson, meta: { ...lesson.meta, updatedAt: Date.now() } }, null, 2);
}

export function deserializeLesson(json: string): LessonDocument {
  const data = JSON.parse(json) as LessonDocument;
  // Validate basic structure
  if (!data.meta?.id || !Array.isArray(data.pages)) {
    throw new Error('Invalid lesson file: missing meta.id or pages array');
  }
  return data;
}
