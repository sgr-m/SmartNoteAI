/**
 * App Context — provides the document store and tool state to all React components.
 * The drawing engine bypasses this context for pointer events (performance).
 */

import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import { documentReducer, initialDocumentState, DocumentState, DocumentAction, serializeLesson, deserializeLesson } from '../store/documentStore';
import { CommandSystem } from '../engine/CommandSystem';
import { StrokeStyle, ToolId, CanvasObject, StrokeObject, ShapeObject, TextObject, GroupObject, Point, LessonDocument } from '../../shared/types';
import { ShapeStyle } from '../engine/DrawingEngine';
import { v4 as uuidv4 } from 'uuid';

// ─── Tool State ───────────────────────────────────────────────────────────────

export type EraserMode = 'stroke' | 'object' | 'area';

export interface ToolState {
  activeTool: ToolId;
  penStyle: StrokeStyle;
  eraserMode: EraserMode;
  eraserSize: number;
  zoom: number;
  panX: number;
  panY: number;
}

const DEFAULT_TOOL_STATE: ToolState = {
  activeTool: 'pen',
  penStyle: {
    penType: 'normal',
    color: '#ffffff',
    width: 3,
    opacity: 1,
    smoothing: 0.5,
    pressureSensitive: true,
  },
  eraserMode: 'stroke',
  eraserSize: 20,
  zoom: 1,
  panX: 0,
  panY: 0,
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  // Document state
  docState: DocumentState;
  docDispatch: React.Dispatch<DocumentAction>;

  // Tool state
  toolState: ToolState;
  shapeStyle: ShapeStyle;
  setActiveTool: (tool: ToolId) => void;
  setPenStyle: (style: Partial<StrokeStyle>) => void;
  setShapeStyle: (style: Partial<ShapeStyle>) => void;
  setEraserMode: (mode: EraserMode) => void;
  setEraserSize: (size: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;

  // Toolbar Flyouts (Pen, Shape, Eraser, Menu)
  activeToolbarFlyout: 'none' | 'pen' | 'eraser' | 'shape' | 'menu';
  setActiveToolbarFlyout: (flyout: 'none' | 'pen' | 'eraser' | 'shape' | 'menu') => void;
  closeAllPopups: () => void;

  // Selection
  selectedObject: CanvasObject | null;
  setSelectedObject: (obj: CanvasObject | null) => void;
  deleteSelectedObject: () => void;

  // Cross-Page Clipboard & Duplication
  clipboardObject: CanvasObject | null;
  copyObject: (obj?: CanvasObject | null) => void;
  pasteObject: (targetPos?: { x: number; y: number }) => CanvasObject | null;
  canPaste: boolean;
  cloneMode: boolean;
  setCloneMode: React.Dispatch<React.SetStateAction<boolean>>;

  // Layer Ordering & Object Transforms
  moveObjectLayer: (objectId: string, direction: 'top' | 'bottom' | 'forward' | 'backward') => void;
  flipObject: (objectId: string, direction: 'horizontal' | 'vertical') => void;
  rotateObject: (objectId: string, degrees?: number) => void;
  setObjectColor: (objectId: string, color: string) => void;
  setObjectLineWidth: (objectId: string, width: number) => void;

  // Toast notifications
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;

  // Page operations
  clearCurrentPage: () => void;
  duplicateCurrentPage: () => void;

  // Command system
  commandSystem: CommandSystem;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Lesson I/O
  saveLesson: () => Promise<void>;
  saveLessonAs: () => Promise<void>;
  openLesson: () => Promise<void>;
  newLesson: () => void;

  // Crash Recovery & Transitions (Section 10)
  crashRecoveryDraft: { lesson: LessonDocument; timestamp: number; savedPath: string | null; currentPageIndex?: number } | null;
  restoreCrashRecoveryDraft: () => void;
  discardCrashRecoveryDraft: () => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [docState, docDispatch] = useReducer(documentReducer, initialDocumentState);
  const [toolState, setToolStateRaw] = React.useState<ToolState>(DEFAULT_TOOL_STATE);
  const [activeToolbarFlyout, setActiveToolbarFlyout] = React.useState<'none' | 'pen' | 'eraser' | 'shape' | 'menu'>('none');
  const [shapeStyle, setShapeStyleRaw] = React.useState<ShapeStyle>({
    shapeType: 'recognition',
    fillColor: '#4facfe',
    fillOpacity: 0.2,
    strokeColor: '#00f2fe',
    strokeWidth: 3,
    strokeOpacity: 1,
    strokeStyle: 'solid',
  });
  const [selectedObject, setSelectedObject] = React.useState<CanvasObject | null>(null);
  const [clipboardObject, setClipboardObject] = React.useState<CanvasObject | null>(null);
  const [cloneMode, setCloneMode] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  const closeAllPopups = useCallback(() => {
    setActiveToolbarFlyout('none');
  }, []);

  // Auto-dismiss toast notifications after 2.5 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const commandSystem = useRef(new CommandSystem()).current;

  // Subscribe to command system changes
  useEffect(() => {
    return commandSystem.onChange((u, r) => {
      setCanUndo(u);
      setCanRedo(r);
    });
  }, [commandSystem]);

  const [reducedMotion, setReducedMotion] = React.useState<boolean>(false);

  // Crash Recovery draft state (Section 10)
  const [crashRecoveryDraft, setCrashRecoveryDraft] = React.useState<{
    lesson: LessonDocument;
    timestamp: number;
    savedPath: string | null;
    currentPageIndex?: number;
  } | null>(() => {
    try {
      const stored = localStorage.getItem('smartboard_crash_recovery_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.lesson?.pages?.length > 0) {
          const hasContent =
            parsed.lesson.pages.some((p: any) => p.objects?.length > 0) ||
            parsed.lesson.meta?.title !== 'Untitled Lesson';
          if (hasContent) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse crash recovery draft:', e);
    }
    return null;
  });

  const restoreCrashRecoveryDraft = useCallback(() => {
    if (!crashRecoveryDraft) return;
    docDispatch({ type: 'LOAD_LESSON', lesson: crashRecoveryDraft.lesson });
    if (crashRecoveryDraft.currentPageIndex !== undefined) {
      docDispatch({ type: 'GOTO_PAGE', index: crashRecoveryDraft.currentPageIndex });
    }
    if (crashRecoveryDraft.savedPath) {
      docDispatch({ type: 'SET_SAVE_PATH', path: crashRecoveryDraft.savedPath });
    }
    docDispatch({ type: 'SET_DIRTY' });
    setToastMessage(`Restored "${crashRecoveryDraft.lesson.meta.title}" draft`);
    setCrashRecoveryDraft(null);
    try {
      localStorage.removeItem('smartboard_crash_recovery_v1');
    } catch {}
  }, [crashRecoveryDraft]);

  const discardCrashRecoveryDraft = useCallback(() => {
    setCrashRecoveryDraft(null);
    try {
      localStorage.removeItem('smartboard_crash_recovery_v1');
    } catch {}
    setToastMessage('Discarded recovery draft');
  }, []);

  // Auto-save & crash recovery snapshot every 15 seconds when dirty
  useEffect(() => {
    if (!docState.isDirty) return;
    const timer = setTimeout(() => {
      try {
        const draft = {
          lesson: docState.lesson,
          timestamp: Date.now(),
          savedPath: docState.savedPath,
          currentPageIndex: docState.currentPageIndex,
        };
        localStorage.setItem('smartboard_crash_recovery_v1', JSON.stringify(draft));
      } catch (err) {
        console.warn('Failed to save localStorage recovery snapshot:', err);
      }

      if (docState.savedPath) {
        performSave(docState.savedPath).catch(console.error);
      }
    }, 15_000);
    return () => clearTimeout(timer);
  }, [docState.isDirty, docState.savedPath, docState.lesson, docState.currentPageIndex]);

  // Listen to menu events from main process
  useEffect(() => {
    if (!window.electronAPI) return;
    const cleanups = [
      window.electronAPI.on('menu:file:new', () => newLesson()),
      window.electronAPI.on('menu:file:save', () => saveLesson()),
      window.electronAPI.on('menu:file:saveas', () => saveLessonAs()),
      window.electronAPI.on('menu:file:open', () => openLesson()),
      window.electronAPI.on('menu:edit:undo', () => undo()),
      window.electronAPI.on('menu:edit:redo', () => redo()),
      window.electronAPI.on('menu:tool:pen', () => setActiveTool('pen')),
      window.electronAPI.on('menu:tool:eraser', () => setActiveTool('eraser')),
      window.electronAPI.on('menu:tool:select', () => setActiveTool('select')),
      window.electronAPI.on('menu:tool:text', () => setActiveTool('text')),
      window.electronAPI.on('menu:tool:shape', () => setActiveTool('shape')),
    ];
    return () => cleanups.forEach(c => c());
  }, [docState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Tool Operations ───────────────────────────────────────────────────────

  const setActiveTool = useCallback((tool: ToolId) => {
    setToolStateRaw(s => ({ ...s, activeTool: tool }));
    if (tool !== 'select') {
      setSelectedObject(null);
    }
  }, [setSelectedObject]);

  const setPenStyle = useCallback((style: Partial<StrokeStyle>) => {
    setToolStateRaw(s => ({ ...s, penStyle: { ...s.penStyle, ...style } }));
  }, []);

  const setEraserMode = useCallback((mode: EraserMode) => {
    setToolStateRaw(s => ({ ...s, eraserMode: mode }));
  }, []);

  const setEraserSize = useCallback((size: number) => {
    setToolStateRaw(s => ({ ...s, eraserSize: size }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setToolStateRaw(s => ({ ...s, zoom: Math.max(0.1, Math.min(10, zoom)) }));
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    setToolStateRaw(s => ({ ...s, panX: x, panY: y }));
  }, []);

  // ─── Command System ────────────────────────────────────────────────────────

  const undo = useCallback(() => commandSystem.undo(), [commandSystem]);
  const redo = useCallback(() => commandSystem.redo(), [commandSystem]);

  // ─── Lesson I/O ───────────────────────────────────────────────────────────

  const performSave = async (filePath: string): Promise<void> => {
    const json = serializeLesson(docState.lesson);
    await window.electronAPI.invoke('file:writeText', filePath, json);
    docDispatch({ type: 'SET_CLEAN', savedPath: filePath });
    try {
      localStorage.removeItem('smartboard_crash_recovery_v1');
    } catch {}
    // Update DB record
    await window.electronAPI.invoke('db:upsertLesson', {
      id: docState.lesson.meta.id,
      title: docState.lesson.meta.title,
      file_path: filePath,
      page_count: docState.lesson.pages.length,
    });
  };

  const saveLesson = useCallback(async () => {
    if (!docState.savedPath) {
      await saveLessonAs();
      return;
    }
    await performSave(docState.savedPath);
  }, [docState]);

  const saveLessonAs = useCallback(async () => {
    const result = await window.electronAPI.invoke('file:saveDialog', {
      title: 'Save Lesson',
      filters: [{ name: 'SmartBoard Lesson', extensions: ['sbl'] }],
      defaultPath: docState.lesson.meta.title + '.sbl',
    }) as string | null;
    if (!result) return;
    await performSave(result);
  }, [docState]);

  const openLesson = useCallback(async () => {
    const files = await window.electronAPI.invoke('file:openDialog', {
      title: 'Open Lesson',
      filters: [{ name: 'SmartBoard Lesson', extensions: ['sbl'] }],
    }) as string[] | null;
    if (!files || files.length === 0) return;
    const json = await window.electronAPI.invoke('file:readText', files[0]) as string;
    const lesson = deserializeLesson(json);
    docDispatch({ type: 'LOAD_LESSON', lesson });
    docDispatch({ type: 'SET_CLEAN', savedPath: files[0] });
    commandSystem.clear();
  }, [commandSystem]);

  const newLesson = useCallback(() => {
    // TODO: prompt to save if dirty
    docDispatch({ type: 'NEW_LESSON' });
    commandSystem.clear();
  }, [commandSystem]);

  const setShapeStyle = useCallback((style: Partial<ShapeStyle>) => {
    setShapeStyleRaw(s => ({ ...s, ...style }));
  }, []);

  const deleteSelectedObject = useCallback(() => {
    if (!selectedObject) return;
    const pageIndex = docState.currentPageIndex;

    if (selectedObject.type === 'group') {
      const grp = selectedObject as GroupObject;
      const ids = grp.objects.map((o) => o.id);
      const objects = [...grp.objects];
      commandSystem.execute({
        id: uuidv4(),
        description: `Delete ${objects.length} objects`,
        execute() {
          docDispatch({ type: 'REMOVE_OBJECTS', pageIndex, objectIds: ids });
          setSelectedObject(null);
        },
        undo() {
          docDispatch({ type: 'ADD_OBJECTS', pageIndex, objects });
          setSelectedObject(selectedObject);
        },
      });
      setSelectedObject(null);
      return;
    }

    const obj = selectedObject;
    commandSystem.execute({
      id: uuidv4(),
      description: `Delete ${obj.type}`,
      execute() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: obj.id });
      },
      undo() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex, object: obj });
      },
    });
    setSelectedObject(null);
  }, [selectedObject, docState.currentPageIndex, commandSystem]);

  const clearCurrentPage = useCallback(() => {
    const pageIndex = docState.currentPageIndex;
    const prevObjects = [...docState.lesson.pages[pageIndex].objects];
    if (prevObjects.length === 0) return;
    commandSystem.execute({
      id: uuidv4(),
      description: 'Clear page',
      execute() {
        docDispatch({ type: 'CLEAR_PAGE', pageIndex });
      },
      undo() {
        for (const o of prevObjects) {
          docDispatch({ type: 'ADD_OBJECT', pageIndex, object: o });
        }
      },
    });
    setSelectedObject(null);
  }, [docState.currentPageIndex, docState.lesson.pages, commandSystem]);

  const duplicateCurrentPage = useCallback(() => {
    docDispatch({ type: 'DUPLICATE_PAGE', pageIndex: docState.currentPageIndex });
  }, [docState.currentPageIndex]);

  // ─── Clipboard & Duplication ────────────────────────────────────────────────

  const copyObject = useCallback((obj?: CanvasObject | null) => {
    const target = obj || selectedObject;
    if (!target) return;
    const copy = JSON.parse(JSON.stringify(target)) as CanvasObject;
    setClipboardObject(copy);
    if (copy.type === 'group') {
      setToastMessage(`Copied ${(copy as GroupObject).objects.length} elements to clipboard. Paste on any page (Ctrl+V)`);
    } else {
      setToastMessage(`Copied ${copy.type} to clipboard. Paste on any page (Ctrl+V)`);
    }
  }, [selectedObject]);

  const pasteObject = useCallback((targetPos?: { x: number; y: number }): CanvasObject | null => {
    if (!clipboardObject) return null;
    const pageIndex = docState.currentPageIndex;

    if (clipboardObject.type === 'group') {
      const srcGroup = clipboardObject as GroupObject;
      const offset = targetPos ? { x: targetPos.x - srcGroup.x, y: targetPos.y - srcGroup.y } : { x: 30, y: 30 };
      const newObjects: CanvasObject[] = srcGroup.objects.map((child) => {
        const c = JSON.parse(JSON.stringify(child)) as CanvasObject;
        c.id = uuidv4();
        if (c.type === 'stroke') {
          const str = c as StrokeObject;
          str.points = str.points.map((p) => ({ ...p, x: p.x + offset.x, y: p.y + offset.y }));
          str.bbox = { ...str.bbox, x: str.bbox.x + offset.x, y: str.bbox.y + offset.y };
        } else {
          (c as ShapeObject | TextObject).x += offset.x;
          (c as ShapeObject | TextObject).y += offset.y;
        }
        return c;
      });

      const newGroup: GroupObject = {
        ...srcGroup,
        id: `group_${uuidv4()}`,
        x: srcGroup.x + offset.x,
        y: srcGroup.y + offset.y,
        bbox: {
          x: srcGroup.bbox.x + offset.x,
          y: srcGroup.bbox.y + offset.y,
          width: srcGroup.bbox.width,
          height: srcGroup.bbox.height,
        },
        objects: newObjects,
      };

      const ids = newObjects.map((o) => o.id);
      commandSystem.execute({
        id: uuidv4(),
        description: `Paste ${newObjects.length} objects`,
        execute() {
          docDispatch({ type: 'ADD_OBJECTS', pageIndex, objects: newObjects });
          setSelectedObject(newGroup);
        },
        undo() {
          docDispatch({ type: 'REMOVE_OBJECTS', pageIndex, objectIds: ids });
          setSelectedObject(null);
        },
      });

      setToastMessage(`Pasted ${newObjects.length} objects on Page ${pageIndex + 1}`);
      return newGroup;
    }

    const copy = JSON.parse(JSON.stringify(clipboardObject)) as CanvasObject;
    copy.id = uuidv4();

    if (targetPos) {
      if (copy.type === 'stroke') {
        const str = copy as StrokeObject;
        const dx = targetPos.x - str.bbox.x;
        const dy = targetPos.y - str.bbox.y;
        str.points = str.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
        str.bbox = { ...str.bbox, x: str.bbox.x + dx, y: str.bbox.y + dy };
      } else {
        (copy as ShapeObject | TextObject).x = targetPos.x;
        (copy as ShapeObject | TextObject).y = targetPos.y;
      }
    } else {
      const offset = 30;
      if (copy.type === 'stroke') {
        const str = copy as StrokeObject;
        str.points = str.points.map((p) => ({ ...p, x: p.x + offset, y: p.y + offset }));
        str.bbox = { ...str.bbox, x: str.bbox.x + offset, y: str.bbox.y + offset };
      } else {
        (copy as ShapeObject | TextObject).x += offset;
        (copy as ShapeObject | TextObject).y += offset;
      }
    }

    commandSystem.execute({
      id: uuidv4(),
      description: `Paste ${copy.type}`,
      execute() {
        docDispatch({ type: 'ADD_OBJECT', pageIndex, object: copy });
        setSelectedObject(copy);
      },
      undo() {
        docDispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: copy.id });
        setSelectedObject(null);
      },
    });

    setToastMessage(`Pasted ${copy.type} on Page ${pageIndex + 1}`);
    return copy;
  }, [clipboardObject, docState.currentPageIndex, commandSystem]);

  // ─── Layer Ordering ─────────────────────────────────────────────────────────

  const moveObjectLayer = useCallback(
    (objectId: string, direction: 'top' | 'bottom' | 'forward' | 'backward') => {
      const pageIndex = docState.currentPageIndex;
      const currentObjects = docState.lesson.pages[pageIndex]?.objects;
      if (!currentObjects) return;
      const prevObjects = [...currentObjects];

      if (selectedObject && selectedObject.id === objectId && selectedObject.type === 'group') {
        const grp = selectedObject as GroupObject;
        const groupIds = new Set(grp.objects.map((o) => o.id));
        const targetObjects = prevObjects.filter((o) => groupIds.has(o.id));
        const otherObjects = prevObjects.filter((o) => !groupIds.has(o.id));
        let newObjects: CanvasObject[];

        if (direction === 'top') {
          newObjects = [...otherObjects, ...targetObjects];
        } else if (direction === 'bottom') {
          newObjects = [...targetObjects, ...otherObjects];
        } else if (direction === 'forward') {
          const maxIdx = Math.max(...prevObjects.map((o, idx) => (groupIds.has(o.id) ? idx : -1)));
          newObjects = [...prevObjects];
          if (maxIdx < newObjects.length - 1) {
            const nextItem = newObjects[maxIdx + 1];
            newObjects.splice(maxIdx + 1, 1);
            const firstIdx = Math.min(...newObjects.map((o, idx) => (groupIds.has(o.id) ? idx : Infinity)));
            newObjects.splice(firstIdx, 0, nextItem);
          }
        } else {
          const minIdx = Math.min(...prevObjects.map((o, idx) => (groupIds.has(o.id) ? idx : Infinity)));
          newObjects = [...prevObjects];
          if (minIdx > 0) {
            const prevItem = newObjects[minIdx - 1];
            newObjects.splice(minIdx - 1, 1);
            const maxIdxAfter = Math.max(...newObjects.map((o, idx) => (groupIds.has(o.id) ? idx : -1)));
            newObjects.splice(maxIdxAfter + 1, 0, prevItem);
          }
        }

        commandSystem.execute({
          id: uuidv4(),
          description: `Move group layer ${direction}`,
          execute() {
            docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: newObjects });
          },
          undo() {
            docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: prevObjects });
          },
        });
        return;
      }

      const idx = prevObjects.findIndex((o) => o.id === objectId);
      if (idx === -1) return;

      const newObjects = [...prevObjects];
      const [target] = newObjects.splice(idx, 1);
      if (direction === 'top') {
        newObjects.push(target);
      } else if (direction === 'bottom') {
        newObjects.unshift(target);
      } else if (direction === 'forward') {
        newObjects.splice(Math.min(newObjects.length, idx + 1), 0, target);
      } else if (direction === 'backward') {
        newObjects.splice(Math.max(0, idx - 1), 0, target);
      }

      commandSystem.execute({
        id: uuidv4(),
        description: `Move layer ${direction}`,
        execute() {
          docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: newObjects });
        },
        undo() {
          docDispatch({ type: 'REORDER_OBJECTS', pageIndex, objects: prevObjects });
        },
      });
    },
    [docState.currentPageIndex, docState.lesson.pages, commandSystem, selectedObject]
  );

  // ─── Object Transforms (Flip, Color, Width) ────────────────────────────────

  const flipObject = useCallback(
    (objectId: string, direction: 'horizontal' | 'vertical') => {
      const pageIndex = docState.currentPageIndex;
      const currentObjects = docState.lesson.pages[pageIndex]?.objects;
      if (!currentObjects) return;

      if (selectedObject && selectedObject.id === objectId && selectedObject.type === 'group') {
        const grp = selectedObject as GroupObject;
        const prevGroup = grp;
        const prevChildren = [...grp.objects];
        const cx = grp.bbox.x + grp.bbox.width / 2;
        const cy = grp.bbox.y + grp.bbox.height / 2;

        const updatedChildren: CanvasObject[] = grp.objects.map((obj) => {
          if (obj.type === 'stroke') {
            const str = obj as StrokeObject;
            const points = str.points.map((p) => ({
              ...p,
              x: direction === 'horizontal' ? 2 * cx - p.x : p.x,
              y: direction === 'vertical' ? 2 * cy - p.y : p.y,
            }));
            const pad = str.style.width / 2;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of points) {
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;
            }
            return {
              ...str,
              points,
              bbox: {
                x: minX - pad,
                y: minY - pad,
                width: Math.max(1, maxX - minX + str.style.width),
                height: Math.max(1, maxY - minY + str.style.width),
              },
            };
          }
          if (obj.type === 'shape') {
            const sh = obj as ShapeObject;
            const newX = direction === 'horizontal' ? 2 * cx - (sh.x + sh.width) : sh.x;
            const newY = direction === 'vertical' ? 2 * cy - (sh.y + sh.height) : sh.y;
            return {
              ...sh,
              x: newX,
              y: newY,
              rotation: direction === 'horizontal' ? (360 - (sh.rotation || 0)) % 360 : (180 - (sh.rotation || 0) + 360) % 360,
            };
          }
          if (obj.type === 'text') {
            const t = obj as TextObject;
            const newX = direction === 'horizontal' ? 2 * cx - (t.x + (t.width || 100)) : t.x;
            const newY = direction === 'vertical' ? 2 * cy - (t.y + (t.height || 40)) : t.y;
            return { ...t, x: newX, y: newY };
          }
          return { ...obj };
        });

        const updatedGroup: GroupObject = { ...grp, objects: updatedChildren };
        commandSystem.execute({
          id: uuidv4(),
          description: `Flip group ${direction}`,
          execute() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: updatedChildren });
            setSelectedObject(updatedGroup);
          },
          undo() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: prevChildren });
            setSelectedObject(prevGroup);
          },
        });
        return;
      }

      const obj = currentObjects?.find((o) => o.id === objectId);
      if (!obj) return;
      const prev = obj;
      let updated: CanvasObject;

      if (obj.type === 'stroke') {
        const str = obj as StrokeObject;
        const cx = str.bbox.x + str.bbox.width / 2;
        const cy = str.bbox.y + str.bbox.height / 2;
        const points = str.points.map((p) => ({
          ...p,
          x: direction === 'horizontal' ? 2 * cx - p.x : p.x,
          y: direction === 'vertical' ? 2 * cy - p.y : p.y,
        }));
        const pad = str.style.width / 2;
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const p of points) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
        const bbox = {
          x: minX - pad,
          y: minY - pad,
          width: Math.max(1, maxX - minX + str.style.width),
          height: Math.max(1, maxY - minY + str.style.width),
        };
        updated = { ...str, points, bbox };
      } else if (obj.type === 'shape') {
        const sh = obj as ShapeObject;
        updated = {
          ...sh,
          rotation:
            direction === 'horizontal'
              ? (360 - (sh.rotation || 0)) % 360
              : (180 - (sh.rotation || 0) + 360) % 360,
        };
      } else {
        updated = { ...obj };
      }

      commandSystem.execute({
        id: uuidv4(),
        description: `Flip ${direction}`,
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
          setSelectedObject(updated);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
          setSelectedObject(prev);
        },
      });
    },
    [docState.currentPageIndex, docState.lesson.pages, commandSystem, selectedObject]
  );

  const rotateObject = useCallback(
    (objectId: string, degrees: number = 90) => {
      const pageIndex = docState.currentPageIndex;
      const currentObjects = docState.lesson.pages[pageIndex]?.objects;

      const deltaRad = (degrees * Math.PI) / 180;
      const cos = Math.cos(deltaRad);
      const sin = Math.sin(deltaRad);

      const rotatePoint = (p: Point, cx: number, cy: number): Point => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return {
          ...p,
          x: cx + dx * cos - dy * sin,
          y: cy + dx * sin + dy * cos,
        };
      };

      const rotateSingleObj = (obj: CanvasObject, cx: number, cy: number): CanvasObject => {
        if (obj.type === 'stroke') {
          const str = obj as StrokeObject;
          const points = str.points.map((p) => rotatePoint(p, cx, cy));
          const pad = str.style.width / 2;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          }
          return {
            ...str,
            points,
            bbox: {
              x: minX - pad,
              y: minY - pad,
              width: Math.max(1, maxX - minX + str.style.width),
              height: Math.max(1, maxY - minY + str.style.width),
            },
          };
        }
        if (obj.type === 'shape') {
          const sh = obj as ShapeObject;
          if (sh.shapeType === 'line' || sh.shapeType === 'arrow' || sh.shapeType === 'arc') {
            const p1 = rotatePoint({ x: sh.x, y: sh.y }, cx, cy);
            const p2 = rotatePoint({ x: sh.x + sh.width, y: sh.y + sh.height }, cx, cy);
            return {
              ...sh,
              x: p1.x,
              y: p1.y,
              width: p2.x - p1.x,
              height: p2.y - p1.y,
            };
          }
          const scx = sh.x + sh.width / 2;
          const scy = sh.y + sh.height / 2;
          const newCenter = rotatePoint({ x: scx, y: scy }, cx, cy);
          return {
            ...sh,
            x: newCenter.x - sh.width / 2,
            y: newCenter.y - sh.height / 2,
            rotation: (((sh.rotation || 0) + degrees) % 360 + 360) % 360,
          };
        }
        if (obj.type === 'text') {
          const t = obj as TextObject;
          const tw = t.width || 200;
          const th = t.height || 40;
          const tcx = t.x + tw / 2;
          const tcy = t.y + th / 2;
          const newCenter = rotatePoint({ x: tcx, y: tcy }, cx, cy);
          return {
            ...t,
            x: newCenter.x - tw / 2,
            y: newCenter.y - th / 2,
            rotation: (((t.rotation || 0) + degrees) % 360 + 360) % 360,
          };
        }
        return { ...obj };
      };

      if (selectedObject && selectedObject.type === 'group' && selectedObject.id === objectId) {
        const grp = selectedObject as GroupObject;
        const prevGroup = grp;
        const prevChildren = grp.objects;
        const cx = grp.bbox.x + grp.bbox.width / 2;
        const cy = grp.bbox.y + grp.bbox.height / 2;

        const updatedChildren = grp.objects.map((c) => rotateSingleObj(c, cx, cy));
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const c of updatedChildren) {
          const b = (c as any).bbox || {
            x: (c as any).x || 0,
            y: (c as any).y || 0,
            width: (c as any).width || 0,
            height: (c as any).height || 0,
          };
          if (b.x < minX) minX = b.x;
          if (b.x + b.width > maxX) maxX = b.x + b.width;
          if (b.y < minY) minY = b.y;
          if (b.y + b.height > maxY) maxY = b.y + b.height;
        }
        const updatedGroup: GroupObject = {
          ...grp,
          x: minX,
          y: minY,
          width: Math.max(10, maxX - minX),
          height: Math.max(10, maxY - minY),
          bbox: {
            x: minX,
            y: minY,
            width: Math.max(10, maxX - minX),
            height: Math.max(10, maxY - minY),
          },
          objects: updatedChildren,
          rotation: (((grp.rotation || 0) + degrees) % 360 + 360) % 360,
        };

        commandSystem.execute({
          id: uuidv4(),
          description: `Rotate group ${degrees}°`,
          execute() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: updatedChildren });
            setSelectedObject(updatedGroup);
          },
          undo() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: prevChildren });
            setSelectedObject(prevGroup);
          },
        });
        return;
      }

      const obj = currentObjects?.find((o) => o.id === objectId);
      if (!obj) return;
      const prev = obj;
      let cx = 0, cy = 0;
      if (obj.type === 'stroke') {
        const s = obj as StrokeObject;
        cx = s.bbox.x + s.bbox.width / 2;
        cy = s.bbox.y + s.bbox.height / 2;
      } else if (obj.type === 'shape') {
        const s = obj as ShapeObject;
        cx = s.x + s.width / 2;
        cy = s.y + s.height / 2;
      } else if (obj.type === 'text') {
        const t = obj as TextObject;
        cx = t.x + (t.width || 200) / 2;
        cy = t.y + (t.height || 40) / 2;
      }

      const updated = rotateSingleObj(obj, cx, cy);

      commandSystem.execute({
        id: uuidv4(),
        description: `Rotate ${degrees}°`,
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
          setSelectedObject(updated);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
          setSelectedObject(prev);
        },
      });
    },
    [docState.currentPageIndex, docState.lesson.pages, commandSystem, selectedObject]
  );

  const setObjectColor = useCallback(
    (objectId: string, color: string) => {
      const pageIndex = docState.currentPageIndex;
      const currentObjects = docState.lesson.pages[pageIndex]?.objects;
      if (!currentObjects) return;

      if (selectedObject && selectedObject.id === objectId && selectedObject.type === 'group') {
        const grp = selectedObject as GroupObject;
        const prevGroup = grp;
        const prevChildren = [...grp.objects];
        const updatedChildren: CanvasObject[] = grp.objects.map((child) => {
          if (child.type === 'stroke') {
            return { ...child, style: { ...(child as StrokeObject).style, color } };
          }
          if (child.type === 'shape') {
            return { ...child, strokeColor: color, fillColor: color };
          }
          if (child.type === 'text') {
            return { ...child, color };
          }
          return child;
        });
        const updatedGroup: GroupObject = { ...grp, objects: updatedChildren };
        commandSystem.execute({
          id: uuidv4(),
          description: 'Change group color',
          execute() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: updatedChildren });
            setSelectedObject(updatedGroup);
          },
          undo() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: prevChildren });
            setSelectedObject(prevGroup);
          },
        });
        return;
      }

      const obj = currentObjects?.find((o) => o.id === objectId);
      if (!obj) return;
      const prev = obj;
      let updated: CanvasObject;

      if (obj.type === 'stroke') {
        updated = { ...obj, style: { ...(obj as StrokeObject).style, color } };
      } else if (obj.type === 'shape') {
        updated = { ...obj, strokeColor: color, fillColor: color };
      } else if (obj.type === 'text') {
        updated = { ...obj, color };
      } else {
        updated = { ...obj };
      }

      commandSystem.execute({
        id: uuidv4(),
        description: 'Change object color',
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
          setSelectedObject(updated);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
          setSelectedObject(prev);
        },
      });
    },
    [docState.currentPageIndex, docState.lesson.pages, commandSystem, selectedObject]
  );

  const setObjectLineWidth = useCallback(
    (objectId: string, width: number) => {
      const pageIndex = docState.currentPageIndex;
      const currentObjects = docState.lesson.pages[pageIndex]?.objects;
      if (!currentObjects) return;

      if (selectedObject && selectedObject.id === objectId && selectedObject.type === 'group') {
        const grp = selectedObject as GroupObject;
        const prevGroup = grp;
        const prevChildren = [...grp.objects];
        const updatedChildren: CanvasObject[] = grp.objects.map((child) => {
          if (child.type === 'stroke') {
            const str = child as StrokeObject;
            const pad = width / 2;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of str.points) {
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;
            }
            return {
              ...str,
              style: { ...str.style, width },
              bbox: {
                x: minX - pad,
                y: minY - pad,
                width: Math.max(1, maxX - minX + width),
                height: Math.max(1, maxY - minY + width),
              },
            };
          }
          if (child.type === 'shape') {
            return { ...child, strokeWidth: width };
          }
          return child;
        });

        const updatedGroup: GroupObject = { ...grp, objects: updatedChildren };
        commandSystem.execute({
          id: uuidv4(),
          description: 'Change group stroke width',
          execute() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: updatedChildren });
            setSelectedObject(updatedGroup);
          },
          undo() {
            docDispatch({ type: 'UPDATE_OBJECTS', pageIndex, objects: prevChildren });
            setSelectedObject(prevGroup);
          },
        });
        return;
      }

      const obj = currentObjects?.find((o) => o.id === objectId);
      if (!obj) return;
      const prev = obj;
      let updated: CanvasObject;

      if (obj.type === 'stroke') {
        const str = obj as StrokeObject;
        const pad = width / 2;
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const p of str.points) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
        const bbox = {
          x: minX - pad,
          y: minY - pad,
          width: Math.max(1, maxX - minX + width),
          height: Math.max(1, maxY - minY + width),
        };
        updated = { ...str, style: { ...str.style, width }, bbox };
      } else if (obj.type === 'shape') {
        updated = { ...obj, strokeWidth: width };
      } else {
        updated = { ...obj };
      }

      commandSystem.execute({
        id: uuidv4(),
        description: 'Change line thickness',
        execute() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updated });
          setSelectedObject(updated);
        },
        undo() {
          docDispatch({ type: 'UPDATE_OBJECT', pageIndex, object: prev });
          setSelectedObject(prev);
        },
      });
    },
    [docState.currentPageIndex, docState.lesson.pages, commandSystem, selectedObject]
  );

  const value: AppContextValue = {
    docState,
    docDispatch,
    toolState,
    shapeStyle,
    setActiveTool,
    setPenStyle,
    setShapeStyle,
    setEraserMode,
    setEraserSize,
    setZoom,
    setPan,
    activeToolbarFlyout,
    setActiveToolbarFlyout,
    closeAllPopups,
    selectedObject,
    setSelectedObject,
    deleteSelectedObject,
    clipboardObject,
    copyObject,
    pasteObject,
    canPaste: clipboardObject !== null,
    cloneMode,
    setCloneMode,
    moveObjectLayer,
    flipObject,
    rotateObject,
    setObjectColor,
    setObjectLineWidth,
    toastMessage,
    setToastMessage,
    clearCurrentPage,
    duplicateCurrentPage,
    commandSystem,
    undo,
    redo,
    canUndo,
    canRedo,
    saveLesson,
    saveLessonAs,
    openLesson,
    newLesson,
    crashRecoveryDraft,
    restoreCrashRecoveryDraft,
    discardCrashRecoveryDraft,
    reducedMotion,
    setReducedMotion,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
