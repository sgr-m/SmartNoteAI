/**
 * CommandSystem — Undo/Redo stack for all document mutations
 *
 * Each operation that changes the document must be wrapped in a Command.
 * Commands are stackable and support grouping for multi-object operations.
 */

import { Command } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

const MAX_HISTORY = 200;

export class CommandSystem {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private listeners: Array<(canUndo: boolean, canRedo: boolean) => void> = [];

  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    // Trim stack
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    // Clear redo on new action
    this.redoStack = [];
    this.notify();
  }

  undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
    this.notify();
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this.undoStack.push(cmd);
    this.notify();
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }

  getUndoDescription(): string | null {
    const cmd = this.undoStack[this.undoStack.length - 1];
    return cmd ? cmd.description : null;
  }

  getRedoDescription(): string | null {
    const cmd = this.redoStack[this.redoStack.length - 1];
    return cmd ? cmd.description : null;
  }

  onChange(listener: (canUndo: boolean, canRedo: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify(): void {
    for (const l of this.listeners) {
      l(this.canUndo(), this.canRedo());
    }
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }
}

// ─── Command Factories ────────────────────────────────────────────────────────

import { CanvasObject, Page } from '../../shared/types';

export function makeAddObjectCommand(
  page: Page,
  object: CanvasObject,
  onUpdate: (page: Page) => void
): Command {
  return {
    id: uuidv4(),
    description: `Add ${object.type}`,
    execute() {
      const updated = { ...page, objects: [...page.objects, object] };
      onUpdate(updated);
    },
    undo() {
      const updated = { ...page, objects: page.objects.filter(o => o.id !== object.id) };
      onUpdate(updated);
    },
  };
}

export function makeRemoveObjectCommand(
  page: Page,
  objectId: string,
  onUpdate: (page: Page) => void
): Command {
  const obj = page.objects.find(o => o.id === objectId);
  if (!obj) throw new Error(`Object ${objectId} not found`);
  return {
    id: uuidv4(),
    description: `Remove ${obj.type}`,
    execute() {
      const updated = { ...page, objects: page.objects.filter(o => o.id !== objectId) };
      onUpdate(updated);
    },
    undo() {
      const updated = { ...page, objects: [...page.objects, obj] };
      onUpdate(updated);
    },
  };
}

export function makeMoveObjectCommand(
  page: Page,
  objectId: string,
  fromX: number, fromY: number,
  toX: number, toY: number,
  onUpdate: (page: Page) => void
): Command {
  return {
    id: uuidv4(),
    description: 'Move object',
    execute() {
      const updated = {
        ...page, objects: page.objects.map(o => {
          if (o.id !== objectId) return o;
          if (o.type === 'stroke') return o; // strokes don't have x/y directly
          return { ...o, x: toX, y: toY } as CanvasObject;
        })
      };
      onUpdate(updated);
    },
    undo() {
      const updated = {
        ...page, objects: page.objects.map(o => {
          if (o.id !== objectId) return o;
          if (o.type === 'stroke') return o;
          return { ...o, x: fromX, y: fromY } as CanvasObject;
        })
      };
      onUpdate(updated);
    },
  };
}

export interface InsertPagesCommandOptions {
  dispatch: (action: any) => void;
  pages: Page[];
  afterIndex?: number;
  previousPageIndex?: number;
  description?: string;
}

/**
 * Creates an atomic, reversible command for inserting a batch of presentation pages.
 * Supports single-step undo (removing the entire batch) and redo (re-inserting the batch).
 */
export function makeInsertPagesCommand(options: InsertPagesCommandOptions): Command {
  const { dispatch, pages, afterIndex, previousPageIndex, description } = options;
  const pageIds = pages.map((p) => p.id);
  const count = pages.length;

  return {
    id: uuidv4(),
    description: description || `Insert ${count} Slide${count === 1 ? '' : 's'}`,
    execute() {
      dispatch({ type: 'INSERT_PAGES', pages, after: afterIndex });
    },
    undo() {
      dispatch({ type: 'DELETE_PAGES_BY_ID', pageIds });
      if (previousPageIndex !== undefined) {
        dispatch({ type: 'GOTO_PAGE', index: previousPageIndex });
      }
    },
  };
}

/**
 * Creates an atomic, reversible command for updating a single canvas object.
 */
export function makeUpdateObjectCommand(
  pageIndex: number,
  previousObject: CanvasObject,
  updatedObject: CanvasObject,
  dispatch: (action: any) => void,
  setSelectedObject?: (obj: CanvasObject | null) => void,
  description?: string
): Command {
  return {
    id: uuidv4(),
    description: description || `Update ${updatedObject.type}`,
    execute() {
      dispatch({ type: 'UPDATE_OBJECT', pageIndex, object: updatedObject });
      setSelectedObject?.(updatedObject);
    },
    undo() {
      dispatch({ type: 'UPDATE_OBJECT', pageIndex, object: previousObject });
      setSelectedObject?.(previousObject);
    },
  };
}

/**
 * Creates an atomic, reversible command for replacing a set of canvas objects.
 */
export function makeReplaceObjectsCommand(
  pageIndex: number,
  previousObjects: CanvasObject[],
  newObjects: CanvasObject[],
  dispatch: (action: any) => void,
  description?: string
): Command {
  const previousIds = previousObjects.map((o) => o.id);
  const newIds = newObjects.map((o) => o.id);
  return {
    id: uuidv4(),
    description: description || `Replace ${previousObjects.length} objects`,
    execute() {
      dispatch({
        type: 'REPLACE_OBJECTS',
        pageIndex,
        removeIds: previousIds,
        newObjects,
      });
    },
    undo() {
      dispatch({
        type: 'REPLACE_OBJECTS',
        pageIndex,
        removeIds: newIds,
        newObjects: previousObjects,
      });
    },
  };
}

/**
 * Creates an atomic, reversible command for renaming a presentation slide page.
 */
export function makeRenamePageCommand(
  pageIndex: number,
  previousTitle: string,
  newTitle: string,
  dispatch: (action: any) => void,
  description?: string
): Command {
  return {
    id: uuidv4(),
    description: description || `Rename Slide to "${newTitle}"`,
    execute() {
      dispatch({ type: 'RENAME_PAGE', pageIndex, title: newTitle });
    },
    undo() {
      dispatch({ type: 'RENAME_PAGE', pageIndex, title: previousTitle });
    },
  };
}
