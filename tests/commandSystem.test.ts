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

  describe('Undo/Redo for Moving and Rotating Content', () => {
    it('properly restores moved formula / text position on Undo and re-applies on Redo', () => {
      const cs = new CommandSystem();
      let selectedObj: any = null;
      let pageObjects: any[] = [
        {
          id: 'formula-1',
          type: 'text',
          isLatex: true,
          content: 'E = mc^2',
          x: 50,
          y: 80,
          width: 150,
          height: 60,
          fontSize: 32,
        },
      ];

      const initial = JSON.parse(JSON.stringify(pageObjects[0]));
      const moved = { ...initial, x: 250, y: 380 };

      // Execute Move command
      cs.execute({
        id: 'cmd-move-formula',
        description: 'Move text',
        execute() {
          pageObjects[0] = moved;
          selectedObj = moved;
        },
        undo() {
          pageObjects[0] = initial;
          selectedObj = initial;
        },
      });

      expect(pageObjects[0].x).toBe(250);
      expect(pageObjects[0].y).toBe(380);
      expect(selectedObj.x).toBe(250);
      expect(selectedObj.y).toBe(380);

      // Undo Move
      cs.undo();
      expect(pageObjects[0].x).toBe(50);
      expect(pageObjects[0].y).toBe(80);
      expect(selectedObj.x).toBe(50);
      expect(selectedObj.y).toBe(80);

      // Redo Move
      cs.redo();
      expect(pageObjects[0].x).toBe(250);
      expect(pageObjects[0].y).toBe(380);
      expect(selectedObj.x).toBe(250);
      expect(selectedObj.y).toBe(380);
    });

    it('properly restores rotated image and diagram angle on Undo and Redo', () => {
      const cs = new CommandSystem();
      let selectedObj: any = null;
      let pageObjects: any[] = [
        {
          id: 'img-diagram-1',
          type: 'image',
          x: 100,
          y: 100,
          width: 400,
          height: 300,
          rotation: 0,
        },
      ];

      const initial = JSON.parse(JSON.stringify(pageObjects[0]));
      const rotated = { ...initial, rotation: 90, x: 150, y: 50 };

      // Execute Rotate command
      cs.execute({
        id: 'cmd-rotate-image',
        description: 'Rotate 90°',
        execute() {
          pageObjects[0] = rotated;
          selectedObj = rotated;
        },
        undo() {
          pageObjects[0] = initial;
          selectedObj = initial;
        },
      });

      expect(pageObjects[0].rotation).toBe(90);
      expect(selectedObj.rotation).toBe(90);

      // Undo Rotate
      cs.undo();
      expect(pageObjects[0].rotation).toBe(0);
      expect(pageObjects[0].x).toBe(100);
      expect(selectedObj.rotation).toBe(0);
      expect(selectedObj.x).toBe(100);

      // Redo Rotate
      cs.redo();
      expect(pageObjects[0].rotation).toBe(90);
      expect(pageObjects[0].x).toBe(150);
      expect(selectedObj.rotation).toBe(90);
    });

    it('properly handles group transformation undo and redo including bounding box restoration', () => {
      const cs = new CommandSystem();
      let selectedGroup: any = null;
      const child1 = { id: 'c1', type: 'shape', x: 10, y: 10, width: 50, height: 50 };
      const child2 = { id: 'c2', type: 'text', x: 70, y: 10, width: 100, height: 40 };

      const initialGroup = {
        id: 'grp-1',
        type: 'group',
        x: 10,
        y: 10,
        width: 160,
        height: 50,
        bbox: { x: 10, y: 10, width: 160, height: 50 },
        rotation: 0,
        objects: [child1, child2],
      };

      const movedChild1 = { ...child1, x: 110, y: 110 };
      const movedChild2 = { ...child2, x: 170, y: 110 };
      const movedGroup = {
        ...initialGroup,
        x: 110,
        y: 110,
        bbox: { x: 110, y: 110, width: 160, height: 50 },
        rotation: 45,
        objects: [movedChild1, movedChild2],
      };

      const prevGroupCopy = JSON.parse(JSON.stringify(initialGroup));
      const prevChildrenCopy = JSON.parse(JSON.stringify(initialGroup.objects));
      const movedGroupCopy = JSON.parse(JSON.stringify(movedGroup));
      const movedChildrenCopy = JSON.parse(JSON.stringify(movedGroup.objects));

      let docChildren = [...initialGroup.objects];

      cs.execute({
        id: 'cmd-group-transform',
        description: 'Transform group',
        execute() {
          docChildren = movedChildrenCopy;
          selectedGroup = movedGroupCopy;
        },
        undo() {
          docChildren = prevChildrenCopy;
          selectedGroup = prevGroupCopy;
        },
      });

      expect(selectedGroup.x).toBe(110);
      expect(selectedGroup.rotation).toBe(45);
      expect(docChildren[0].x).toBe(110);

      // Undo restores group coordinates and all child objects
      cs.undo();
      expect(selectedGroup.x).toBe(10);
      expect(selectedGroup.rotation).toBe(0);
      expect(selectedGroup.bbox.x).toBe(10);
      expect(docChildren[0].x).toBe(10);

      // Redo re-applies
      cs.redo();
      expect(selectedGroup.x).toBe(110);
      expect(selectedGroup.rotation).toBe(45);
      expect(docChildren[0].x).toBe(110);
    });
  });
});
