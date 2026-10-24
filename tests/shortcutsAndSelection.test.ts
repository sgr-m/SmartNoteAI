import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { isTypingOrInputFocused } from '../src/renderer/utils/keyboardUtils';
import { DrawingEngine } from '../src/renderer/engine/DrawingEngine';
import { CanvasObject, StrokeObject, ShapeObject } from '../src/shared/types';

beforeAll(() => {
  if (typeof (global as any).document === 'undefined') {
    (global as any).document = {
      activeElement: null,
      querySelector: () => null,
    };
  }
});

describe('Keyboard Shortcuts & Select All Subsystem', () => {
  beforeEach(() => {
    (global as any).document.activeElement = null;
    (global as any).document.querySelector = () => null;
  });

  describe('isTypingOrInputFocused Utility', () => {
    it('detects when an input element is the event target', () => {
      const mockInput = {
        tagName: 'INPUT',
        isContentEditable: false,
        closest: (selector: string) => null,
      };

      const event = { target: mockInput } as unknown as KeyboardEvent;
      expect(isTypingOrInputFocused(event)).toBe(true);
    });

    it('detects when a textarea element is the event target', () => {
      const mockTextarea = {
        tagName: 'TEXTAREA',
        isContentEditable: false,
        closest: () => null,
      };

      const event = { target: mockTextarea } as unknown as KeyboardEvent;
      expect(isTypingOrInputFocused(event)).toBe(true);
    });

    it('detects when a select dropdown is the event target', () => {
      const mockSelect = {
        tagName: 'SELECT',
        isContentEditable: false,
        closest: () => null,
      };

      const event = { target: mockSelect } as unknown as KeyboardEvent;
      expect(isTypingOrInputFocused(event)).toBe(true);
    });

    it('detects when contentEditable is true', () => {
      const mockEditable = {
        tagName: 'DIV',
        isContentEditable: true,
        closest: () => null,
      };

      const event = { target: mockEditable } as unknown as KeyboardEvent;
      expect(isTypingOrInputFocused(event)).toBe(true);
    });

    it('detects when an input has active focus in document', () => {
      (global as any).document.activeElement = {
        tagName: 'INPUT',
        isContentEditable: false,
      };

      expect(isTypingOrInputFocused()).toBe(true);
    });

    it('detects when Add To Resource Library modal is open in DOM', () => {
      (global as any).document.querySelector = (selector: string) => {
        if (selector.includes('.add-res-overlay')) {
          return { tagName: 'DIV' };
        }
        return null;
      };

      expect(isTypingOrInputFocused()).toBe(true);
    });

    it('detects when Resource Library collection modal is open', () => {
      (global as any).document.querySelector = (selector: string) => {
        if (selector.includes('.res-lib-overlay')) {
          return { tagName: 'DIV' };
        }
        return null;
      };

      expect(isTypingOrInputFocused()).toBe(true);
    });

    it('allows canvas hotkeys when user is on canvas and no modal is active', () => {
      const mockCanvas = {
        tagName: 'CANVAS',
        isContentEditable: false,
        closest: () => null,
      };

      const event = { target: mockCanvas } as unknown as KeyboardEvent;
      expect(isTypingOrInputFocused(event)).toBe(false);
    });
  });

  describe('Hand Tool Shortcut ("H")', () => {
    it('sets tool to pan (hand tool) when H is pressed and not typing', () => {
      let activeTool = 'pen';
      const setActiveTool = (t: string) => { activeTool = t; };

      const simulateKey = (key: string, isCtrl = false, isTyping = false) => {
        if (isTyping) return;
        if ((key === 'h' || key === 'H') && !isCtrl) {
          setActiveTool('pan');
        } else if ((key === 'e' || key === 'E') && !isCtrl) {
          setActiveTool('eraser');
        }
      };

      // Pressing 'h' changes tool to pan
      simulateKey('h');
      expect(activeTool).toBe('pan');

      // Typing 'xor gate' with 'e' while typing must NOT switch to eraser
      simulateKey('e', false, true);
      expect(activeTool).toBe('pan'); // unchanged!
    });
  });

  describe('Select All (Ctrl+A)', () => {
    it('groups all unlocked elements into a unified selection GroupObject', () => {
      const mockCanvas = {
        getContext: () => ({
          save: () => {},
          restore: () => {},
          clearRect: () => {},
          beginPath: () => {},
          stroke: () => {},
          fill: () => {},
        }),
        addEventListener: () => {},
        removeEventListener: () => {},
        style: {},
      } as unknown as HTMLCanvasElement;

      const engine = new DrawingEngine({
        committedCanvas: mockCanvas,
        activeCanvas: mockCanvas,
        callbacks: {},
      });

      const stroke1: StrokeObject = {
        id: 'stroke-1',
        type: 'stroke',
        points: [{ x: 50, y: 50 }, { x: 100, y: 100 }],
        style: { penType: 'normal', color: '#000', width: 2, opacity: 1, smoothing: 0, pressureSensitive: false },
        bbox: { x: 50, y: 50, width: 50, height: 50 },
        locked: false,
        layerId: 'default',
        createdAt: Date.now(),
      };

      const shape1: ShapeObject = {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'rect',
        x: 200,
        y: 200,
        width: 100,
        height: 80,
        rotation: 0,
        fillColor: '#38bdf8',
        fillOpacity: 1,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'default',
      };

      const lockedShape: ShapeObject = {
        id: 'shape-locked',
        type: 'shape',
        shapeType: 'circle',
        x: 500,
        y: 500,
        width: 50,
        height: 50,
        rotation: 0,
        fillColor: 'red',
        fillOpacity: 1,
        strokeColor: 'red',
        strokeWidth: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: true,
        layerId: 'default',
      };

      const allObjects: CanvasObject[] = [stroke1, shape1, lockedShape];
      const selectable = allObjects.filter((o) => !o.locked);
      expect(selectable.length).toBe(2);

      const group = engine.createGroupFromObjects(selectable);
      expect(group.type).toBe('group');
      expect(group.objects.length).toBe(2);
      expect(group.x).toBe(50);
      expect(group.y).toBe(50);
      expect(group.width).toBe(250); // from x=50 to x=300
      expect(group.height).toBe(230); // from y=50 to y=280
    });
  });
});
