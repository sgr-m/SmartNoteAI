/**
 * Command System Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { CommandSystem } from '../src/renderer/engine/CommandSystem';

describe('CommandSystem', () => {
  it('executes a command', () => {
    const cs = new CommandSystem();
    const execute = vi.fn();
    const undo = vi.fn();
    cs.execute({ id: '1', description: 'test', execute, undo });
    expect(execute).toHaveBeenCalledOnce();
    expect(cs.canUndo()).toBe(true);
    expect(cs.canRedo()).toBe(false);
  });

  it('undoes a command', () => {
    const cs = new CommandSystem();
    const execute = vi.fn();
    const undo = vi.fn();
    cs.execute({ id: '1', description: 'test', execute, undo });
    cs.undo();
    expect(undo).toHaveBeenCalledOnce();
    expect(cs.canUndo()).toBe(false);
    expect(cs.canRedo()).toBe(true);
  });

  it('redoes a command', () => {
    const cs = new CommandSystem();
    const execute = vi.fn();
    const undo = vi.fn();
    cs.execute({ id: '1', description: 'test', execute, undo });
    cs.undo();
    cs.redo();
    expect(execute).toHaveBeenCalledTimes(2);
    expect(cs.canRedo()).toBe(false);
    expect(cs.canUndo()).toBe(true);
  });

  it('clears redo stack on new command', () => {
    const cs = new CommandSystem();
    cs.execute({ id: '1', description: 'a', execute: vi.fn(), undo: vi.fn() });
    cs.undo();
    cs.execute({ id: '2', description: 'b', execute: vi.fn(), undo: vi.fn() });
    expect(cs.canRedo()).toBe(false);
  });

  it('provides undo/redo descriptions', () => {
    const cs = new CommandSystem();
    cs.execute({ id: '1', description: 'Draw stroke', execute: vi.fn(), undo: vi.fn() });
    expect(cs.getUndoDescription()).toBe('Draw stroke');
    expect(cs.getRedoDescription()).toBeNull();
    cs.undo();
    expect(cs.getRedoDescription()).toBe('Draw stroke');
  });

  it('notifies listeners on change', () => {
    const cs = new CommandSystem();
    const listener = vi.fn();
    cs.onChange(listener);
    cs.execute({ id: '1', description: 'x', execute: vi.fn(), undo: vi.fn() });
    expect(listener).toHaveBeenCalledWith(true, false);
  });

  it('cleans up listener when cleanup is called', () => {
    const cs = new CommandSystem();
    const listener = vi.fn();
    const cleanup = cs.onChange(listener);
    cleanup();
    cs.execute({ id: '1', description: 'x', execute: vi.fn(), undo: vi.fn() });
    expect(listener).not.toHaveBeenCalled();
  });

  it('clears all history', () => {
    const cs = new CommandSystem();
    cs.execute({ id: '1', description: 'x', execute: vi.fn(), undo: vi.fn() });
    cs.clear();
    expect(cs.canUndo()).toBe(false);
    expect(cs.canRedo()).toBe(false);
  });

  it('handles undo on empty stack gracefully', () => {
    const cs = new CommandSystem();
    expect(() => cs.undo()).not.toThrow();
  });

  it('handles redo on empty stack gracefully', () => {
    const cs = new CommandSystem();
    expect(() => cs.redo()).not.toThrow();
  });
});
