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
