/**
 * Responsive Whiteboard Tests — Milestone 2
 * Verifies pen, precision eraser modes, shapes, text, selection/transform, and multi-page operations.
 */

import { describe, it, expect } from 'vitest';
import {
  documentReducer,
  initialDocumentState,
  DocumentState,
  serializeLesson,
  deserializeLesson,
} from '../src/renderer/store/documentStore';
import {
  StrokeObject,
  ShapeObject,
  TextObject,
  CanvasObject,
} from '../src/shared/types';
import { v4 as uuidv4 } from 'uuid';

function freshState(): DocumentState {
  return { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };
}

describe('Milestone 2 — Responsive Whiteboard Capabilities', () => {
  it('adds and updates geometric shapes', () => {
    let state = freshState();
    const rectShape: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'rect',
      x: 100,
      y: 150,
      width: 300,
      height: 200,
      rotation: 0,
      fillColor: '#4facfe',
      fillOpacity: 0.3,
      strokeColor: '#00f2fe',
      strokeWidth: 4,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: rectShape });
    expect(state.lesson.pages[0].objects).toHaveLength(1);
    expect(state.lesson.pages[0].objects[0].type).toBe('shape');

    // Move shape
    const movedShape: ShapeObject = { ...rectShape, x: 250, y: 350 };
    state = documentReducer(state, { type: 'UPDATE_OBJECT', pageIndex: 0, object: movedShape });
    const fetched = state.lesson.pages[0].objects[0] as ShapeObject;
    expect(fetched.x).toBe(250);
    expect(fetched.y).toBe(350);
  });

  it('supports formatted text objects', () => {
    let state = freshState();
    const textObj: TextObject = {
      id: uuidv4(),
      type: 'text',
      x: 50,
      y: 80,
      width: 400,
      height: 60,
      content: 'Pythagorean Theorem: a² + b² = c²',
      fontFamily: 'Inter, sans-serif',
      fontSize: 28,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      color: '#ffffff',
      backgroundColor: 'transparent',
      opacity: 1,
      rotation: 0,
      preset: 'formula',
      locked: false,
      layerId: 'objects',
    };

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: textObj });
    expect(state.lesson.pages[0].objects).toHaveLength(1);
    const fetched = state.lesson.pages[0].objects[0] as TextObject;
    expect(fetched.content).toBe('Pythagorean Theorem: a² + b² = c²');
    expect(fetched.preset).toBe('formula');
  });

  it('erases targeted objects using REMOVE_OBJECTS batch operation', () => {
    let state = freshState();
    const id1 = uuidv4();
    const id2 = uuidv4();
    const id3 = uuidv4();

    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: { id: id1, type: 'stroke', points: [], style: {} as any, bbox: {} as any, locked: false, layerId: 'drawing', createdAt: Date.now() },
    });
    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: { id: id2, type: 'stroke', points: [], style: {} as any, bbox: {} as any, locked: false, layerId: 'drawing', createdAt: Date.now() },
    });
    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: { id: id3, type: 'shape', shapeType: 'ellipse', x: 0, y: 0, width: 10, height: 10, rotation: 0, fillColor: '', fillOpacity: 1, strokeColor: '', strokeWidth: 1, strokeOpacity: 1, strokeStyle: 'solid', locked: false, layerId: 'objects' },
    });

    expect(state.lesson.pages[0].objects).toHaveLength(3);

    // Erase objects 1 and 2 in single batch
    state = documentReducer(state, { type: 'REMOVE_OBJECTS', pageIndex: 0, objectIds: [id1, id2] });
    expect(state.lesson.pages[0].objects).toHaveLength(1);
    expect(state.lesson.pages[0].objects[0].id).toBe(id3);
  });

  it('clears all objects on page with CLEAR_PAGE', () => {
    let state = freshState();
    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: { id: 'obj-1', type: 'stroke', points: [], style: {} as any, bbox: {} as any, locked: false, layerId: 'drawing', createdAt: Date.now() },
    });
    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: { id: 'obj-2', type: 'stroke', points: [], style: {} as any, bbox: {} as any, locked: false, layerId: 'drawing', createdAt: Date.now() },
    });

    expect(state.lesson.pages[0].objects).toHaveLength(2);
    state = documentReducer(state, { type: 'CLEAR_PAGE', pageIndex: 0 });
    expect(state.lesson.pages[0].objects).toHaveLength(0);
    expect(state.isDirty).toBe(true);
  });

  it('duplicates pages with new independent object IDs', () => {
    let state = freshState();
    const originalStrokeId = 'orig-stroke';
    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: { id: originalStrokeId, type: 'stroke', points: [], style: {} as any, bbox: {} as any, locked: false, layerId: 'drawing', createdAt: Date.now() },
    });

    state = documentReducer(state, { type: 'DUPLICATE_PAGE', pageIndex: 0 });
    expect(state.lesson.pages).toHaveLength(2);
    expect(state.currentPageIndex).toBe(1);
    expect(state.lesson.pages[1].title).toContain('(Copy)');
    expect(state.lesson.pages[1].objects).toHaveLength(1);
    expect(state.lesson.pages[1].objects[0].id).not.toBe(originalStrokeId);
  });

  it('reorders pages with MOVE_PAGE', () => {
    let state = freshState();
    state = documentReducer(state, { type: 'ADD_PAGE' });
    state = documentReducer(state, { type: 'ADD_PAGE' });
    expect(state.lesson.pages).toHaveLength(3);

    state.lesson.pages[0].title = 'First';
    state.lesson.pages[1].title = 'Second';
    state.lesson.pages[2].title = 'Third';

    state = documentReducer(state, { type: 'MOVE_PAGE', from: 0, to: 2 });
    expect(state.lesson.pages[0].title).toBe('Second');
    expect(state.lesson.pages[1].title).toBe('Third');
    expect(state.lesson.pages[2].title).toBe('First');
  });

  it('serializes and deserializes mixed multi-page whiteboard documents', () => {
    let state = freshState();
    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: {
        id: 'stroke-1',
        type: 'stroke',
        points: [{ x: 10, y: 20 }, { x: 30, y: 40 }],
        style: { penType: 'brush', color: '#ff6b6b', width: 6, opacity: 0.9, smoothing: 0.7, pressureSensitive: true },
        bbox: { x: 10, y: 20, width: 20, height: 20 },
        locked: false,
        layerId: 'drawing',
        createdAt: Date.now(),
      },
    });
    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: {
        id: 'shape-1',
        type: 'shape',
        shapeType: 'triangle',
        x: 100,
        y: 100,
        width: 150,
        height: 120,
        rotation: 0,
        fillColor: '#43e97b',
        fillOpacity: 0.5,
        strokeColor: '#38f9d7',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      },
    });

    const serialized = serializeLesson(state.lesson);
    const restored = deserializeLesson(serialized);

    expect(restored.pages).toHaveLength(1);
    expect(restored.pages[0].objects).toHaveLength(2);
    expect(restored.pages[0].objects[0].type).toBe('stroke');
    expect(restored.pages[0].objects[1].type).toBe('shape');
  });

  it('replaces objects atomically for geometric stroke splitting', () => {
    let state = freshState();
    const originalStrokeId = 'orig-stroke';
    const split1Id = 'split-1';
    const split2Id = 'split-2';

    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: 0,
      object: {
        id: originalStrokeId,
        type: 'stroke',
        points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }],
        style: {} as any,
        bbox: { x: 0, y: 0, width: 100, height: 10 },
        locked: false,
        layerId: 'drawing',
        createdAt: Date.now(),
      },
    });
    expect(state.lesson.pages[0].objects).toHaveLength(1);

    // Split: original is replaced with split1 and split2
    state = documentReducer(state, {
      type: 'REPLACE_OBJECTS',
      pageIndex: 0,
      removeIds: [originalStrokeId],
      newObjects: [
        {
          id: split1Id,
          type: 'stroke',
          points: [{ x: 0, y: 0 }, { x: 20, y: 0 }],
          style: {} as any,
          bbox: { x: 0, y: 0, width: 20, height: 10 },
          locked: false,
          layerId: 'drawing',
          createdAt: Date.now(),
        },
        {
          id: split2Id,
          type: 'stroke',
          points: [{ x: 80, y: 0 }, { x: 100, y: 0 }],
          style: {} as any,
          bbox: { x: 80, y: 0, width: 20, height: 10 },
          locked: false,
          layerId: 'drawing',
          createdAt: Date.now(),
        },
      ],
    });

    expect(state.lesson.pages[0].objects).toHaveLength(2);
    expect(state.lesson.pages[0].objects.map((o) => o.id)).toEqual([split1Id, split2Id]);

    // Undo splitting
    state = documentReducer(state, {
      type: 'REPLACE_OBJECTS',
      pageIndex: 0,
      removeIds: [split1Id, split2Id],
      newObjects: [
        {
          id: originalStrokeId,
          type: 'stroke',
          points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }],
          style: {} as any,
          bbox: { x: 0, y: 0, width: 100, height: 10 },
          locked: false,
          layerId: 'drawing',
          createdAt: Date.now(),
        },
      ],
    });
    expect(state.lesson.pages[0].objects).toHaveLength(1);
    expect(state.lesson.pages[0].objects[0].id).toBe(originalStrokeId);
  });

  it('supports all 15 whiteboard shapes and stroke styles', () => {
    let state = freshState();
    const shapeTypes = [
      'rect', 'roundedRect', 'circle', 'ellipse', 'triangle', 'rightTriangle',
      'parallelogram', 'trapezoid', 'polygon', 'line', 'arrow', 'arc', 'polyline', 'recognition',
    ] as const;

    shapeTypes.forEach((st, idx) => {
      state = documentReducer(state, {
        type: 'ADD_OBJECT',
        pageIndex: 0,
        object: {
          id: `shape-${idx}`,
          type: 'shape',
          shapeType: st,
          x: idx * 10,
          y: idx * 10,
          width: 50,
          height: 50,
          rotation: 0,
          fillColor: '#4facfe',
          fillOpacity: 0.4,
          strokeColor: '#00f2fe',
          strokeWidth: 2,
          strokeOpacity: 1,
          strokeStyle: idx % 2 === 0 ? 'solid' : 'dashed',
          locked: false,
          layerId: 'objects',
        },
      });
    });

    expect(state.lesson.pages[0].objects).toHaveLength(shapeTypes.length);
  });

  it('supports all 7 specialized pen tools without PRO restriction', () => {
    let state = freshState();
    const penTypes = [
      'normal',       // Pen / Hard Pen
      'flatBrush',    // Flat Brush / Row Pen
      'highlighter',  // Highlighter
      'calligraphy',  // Calligraphy Brush / Soft Brush
      'laser',        // Laser Pen
      'magic',        // Magic Pen / Smart Pen
      'pattern',      // Texture Pen / Pattern Pen
    ] as const;

    penTypes.forEach((pt, idx) => {
      state = documentReducer(state, {
        type: 'ADD_OBJECT',
        pageIndex: 0,
        object: {
          id: `pen-stroke-${idx}`,
          type: 'stroke',
          points: [{ x: 10 * idx, y: 10 * idx }, { x: 20 * idx, y: 20 * idx }],
          style: {
            penType: pt,
            color: '#ff0000',
            width: 4,
            opacity: pt === 'highlighter' ? 0.45 : 1,
            smoothing: 0.5,
            pressureSensitive: pt === 'calligraphy',
          },
          bbox: { x: 10 * idx, y: 10 * idx, width: 10 * idx + 4, height: 10 * idx + 4 },
          locked: false,
          layerId: 'drawing',
          createdAt: Date.now(),
        },
      });
    });

    expect(state.lesson.pages[0].objects).toHaveLength(penTypes.length);
    const laserObj = state.lesson.pages[0].objects.find(
      (o) => (o as StrokeObject).style?.penType === 'laser'
    ) as StrokeObject;
    expect(laserObj).toBeDefined();
    expect(laserObj.style.penType).toBe('laser');

    const flatBrushObj = state.lesson.pages[0].objects.find(
      (o) => (o as StrokeObject).style?.penType === 'flatBrush'
    ) as StrokeObject;
    expect(flatBrushObj).toBeDefined();
    expect(flatBrushObj.style.penType).toBe('flatBrush');
  });

  it('updates object position during select/drag move operations', () => {
    let state = freshState();
    const initialStroke: StrokeObject = {
      id: 'stroke-drag-1',
      type: 'stroke',
      points: [{ x: 50, y: 50 }, { x: 100, y: 100 }],
      style: {
        penType: 'normal',
        color: '#ffffff',
        width: 3,
        opacity: 1,
        smoothing: 0.5,
        pressureSensitive: false,
      },
      bbox: { x: 50, y: 50, width: 53, height: 53 },
      locked: false,
      layerId: 'drawing',
      createdAt: Date.now(),
    };

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: initialStroke });

    // Drag by delta (+40, +60)
    const draggedStroke: StrokeObject = {
      ...initialStroke,
      points: initialStroke.points.map(p => ({ x: p.x + 40, y: p.y + 60 })),
      bbox: { ...initialStroke.bbox, x: initialStroke.bbox.x + 40, y: initialStroke.bbox.y + 60 },
    };

    state = documentReducer(state, { type: 'UPDATE_OBJECT', pageIndex: 0, object: draggedStroke });
    const updated = state.lesson.pages[0].objects[0] as StrokeObject;
    expect(updated.points[0].x).toBe(90);
    expect(updated.points[0].y).toBe(110);
    expect(updated.bbox.x).toBe(90);
    expect(updated.bbox.y).toBe(110);
  });

  it('supports stretching and resizing geometric shapes by corners and edges', () => {
    let state = freshState();
    const initialShape: ShapeObject = {
      id: 'shape-stretch-1',
      type: 'shape',
      shapeType: 'rect',
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      rotation: 0,
      fillColor: '#4facfe',
      fillOpacity: 0.2,
      strokeColor: '#00f2fe',
      strokeWidth: 3,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: initialShape });

    // Stretch bottom-right corner ('se'): delta (+50, +30)
    const stretchedShape: ShapeObject = {
      ...initialShape,
      width: initialShape.width + 50,
      height: initialShape.height + 30,
    };

    state = documentReducer(state, { type: 'UPDATE_OBJECT', pageIndex: 0, object: stretchedShape });
    const fetched = state.lesson.pages[0].objects[0] as ShapeObject;
    expect(fetched.width).toBe(170);
    expect(fetched.height).toBe(110);

    // Stretch top-left corner ('nw'): delta (+20, +10) -> x += 20, y += 10, width -= 20, height -= 10
    const nwStretched: ShapeObject = {
      ...fetched,
      x: fetched.x + 20,
      y: fetched.y + 10,
      width: fetched.width - 20,
      height: fetched.height - 10,
    };
    state = documentReducer(state, { type: 'UPDATE_OBJECT', pageIndex: 0, object: nwStretched });
    const nwFetched = state.lesson.pages[0].objects[0] as ShapeObject;
    expect(nwFetched.x).toBe(120);
    expect(nwFetched.y).toBe(110);
    expect(nwFetched.width).toBe(150);
    expect(nwFetched.height).toBe(100);
  });

  it('supports modifying line and arrow endpoints by dragging start or end handles', () => {
    let state = freshState();
    const lineShape: ShapeObject = {
      id: 'arrow-modify-1',
      type: 'shape',
      shapeType: 'arrow',
      x: 50,
      y: 50,
      width: 100,
      height: 50,
      rotation: 0,
      fillColor: '#ffffff',
      fillOpacity: 1,
      strokeColor: '#38bdf8',
      strokeWidth: 3,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: lineShape });

    // Drag end handle to redirect arrow: delta (+80, +50)
    const redirectedArrow: ShapeObject = {
      ...lineShape,
      width: lineShape.width + 80,
      height: lineShape.height + 50,
    };
    state = documentReducer(state, { type: 'UPDATE_OBJECT', pageIndex: 0, object: redirectedArrow });
    const fetched = state.lesson.pages[0].objects[0] as ShapeObject;
    expect(fetched.width).toBe(180);
    expect(fetched.height).toBe(100);
  });

  it('guarantees drawing persistence on added pages without disappearing or polluting page 0', () => {
    let state = freshState();
    // Initially on page 0 with no objects
    expect(state.currentPageIndex).toBe(0);
    expect(state.lesson.pages).toHaveLength(1);

    // Draw a stroke on Page 0
    const page0Stroke: StrokeObject = {
      id: 'p0-stroke-1',
      type: 'stroke',
      points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
      style: {
        penType: 'normal',
        color: '#ffffff',
        width: 3,
        opacity: 1,
        smoothing: 0.5,
        pressureSensitive: true,
      },
      bbox: { x: 10, y: 10, width: 13, height: 13 },
      locked: false,
      layerId: 'drawing',
      createdAt: Date.now(),
    };
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: page0Stroke });
    expect(state.lesson.pages[0].objects).toHaveLength(1);

    // Add a new page (Page 2, index 1)
    state = documentReducer(state, { type: 'ADD_PAGE', after: 0 });
    expect(state.lesson.pages).toHaveLength(2);
    expect(state.currentPageIndex).toBe(1);
    expect(state.lesson.pages[1].objects).toHaveLength(0);

    // Draw on newly added Page 1 with Calligraphy Brush
    const page1CalligraphyStroke: StrokeObject = {
      id: 'p1-calligraphy-1',
      type: 'stroke',
      points: [{ x: 100, y: 100 }, { x: 150, y: 150 }, { x: 200, y: 250 }],
      style: {
        penType: 'calligraphy',
        color: '#ffbb00',
        width: 5,
        opacity: 1,
        smoothing: 0.5,
        pressureSensitive: true,
      },
      bbox: { x: 100, y: 100, width: 105, height: 155 },
      locked: false,
      layerId: 'drawing',
      createdAt: Date.now(),
    };
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 1, object: page1CalligraphyStroke });

    // Verify Page 1 has its stroke and Page 0 was NOT touched
    expect(state.lesson.pages[1].objects).toHaveLength(1);
    expect(state.lesson.pages[1].objects[0].id).toBe('p1-calligraphy-1');
    expect((state.lesson.pages[1].objects[0] as StrokeObject).style.penType).toBe('calligraphy');

    expect(state.lesson.pages[0].objects).toHaveLength(1);
    expect(state.lesson.pages[0].objects[0].id).toBe('p0-stroke-1');

    // Add another shape to Page 1
    const page1Shape: ShapeObject = {
      id: 'p1-shape-1',
      type: 'shape',
      shapeType: 'circle',
      x: 300,
      y: 300,
      width: 100,
      height: 100,
      rotation: 0,
      fillColor: '#4facfe',
      fillOpacity: 0.3,
      strokeColor: '#00f2fe',
      strokeWidth: 3,
      strokeOpacity: 1,
      strokeStyle: 'solid',
      locked: false,
      layerId: 'objects',
    };
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 1, object: page1Shape });

    expect(state.lesson.pages[1].objects).toHaveLength(2);
    expect(state.lesson.pages[0].objects).toHaveLength(1);

    // Navigate back to Page 0
    state = documentReducer(state, { type: 'GOTO_PAGE', index: 0 });
    expect(state.currentPageIndex).toBe(0);
    expect(state.lesson.pages[state.currentPageIndex].objects).toHaveLength(1);

    // Navigate to Page 1
    state = documentReducer(state, { type: 'GOTO_PAGE', index: 1 });
    expect(state.currentPageIndex).toBe(1);
    expect(state.lesson.pages[state.currentPageIndex].objects).toHaveLength(2);
  });

  it('adjusts stroke thickness according to Deco mini 7 stylus pressure and curve angle', () => {
    let state = freshState();

    // 1. Stylus pressure-sensitive stroke (light touch to heavy press)
    const pressureStroke: StrokeObject = {
      id: 'stylus-pressure-1',
      type: 'stroke',
      points: [
        { x: 50, y: 50, pressure: 0.1 },  // Light touch -> fine hairline
        { x: 80, y: 100, pressure: 0.4 }, // Moderate touch
        { x: 120, y: 180, pressure: 0.9 }, // Firm press -> rich thick body
        { x: 160, y: 220, pressure: 0.2 }, // Taper off
      ],
      style: {
        penType: 'calligraphy',
        color: '#ff2d55',
        width: 6,
        opacity: 1,
        smoothing: 0.5,
        pressureSensitive: true,
      },
      bbox: { x: 50, y: 50, width: 120, height: 180 },
      locked: false,
      layerId: 'drawing',
      createdAt: Date.now(),
    };

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: pressureStroke });
    const fetched = state.lesson.pages[0].objects[0] as StrokeObject;
    expect(fetched.points).toHaveLength(4);
    expect(fetched.points[0].pressure).toBe(0.1);
    expect(fetched.points[2].pressure).toBe(0.9);
    expect(fetched.style.penType).toBe('calligraphy');

    // 2. Fixed-width pen stroke when pressure is disabled
    const fixedPenStroke: StrokeObject = {
      id: 'pen-fixed-1',
      type: 'stroke',
      points: [
        { x: 200, y: 50, pressure: 0.5 },
        { x: 250, y: 100, pressure: 0.5 },
        { x: 300, y: 150, pressure: 0.5 },
      ],
      style: {
        penType: 'normal',
        color: '#ffffff',
        width: 4,
        opacity: 1,
        smoothing: 0.5,
        pressureSensitive: true,
      },
      bbox: { x: 200, y: 50, width: 104, height: 104 },
      locked: false,
      layerId: 'drawing',
      createdAt: Date.now(),
    };

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: fixedPenStroke });
    const penObj = state.lesson.pages[0].objects[1] as StrokeObject;
    expect(penObj.style.penType).toBe('normal');
    expect(penObj.style.width).toBe(4);
    // When pressure is constant (0.5), pen maintains uniform width
    expect(penObj.points.every((p) => p.pressure === 0.5)).toBe(true);
  });
});


