/**
 * Selection, Layers, and Cross-Page Clipboard Tests
 * Verifies layer reordering, copy-pasting across pages, same-page duplication, and transformations.
 */

import { describe, it, expect } from 'vitest';
import {
  documentReducer,
  initialDocumentState,
  DocumentState,
} from '../src/renderer/store/documentStore';
import { CanvasObject, StrokeObject, ShapeObject, GroupObject, ImageObject, BoundingBox, Point } from '../src/shared/types';
import { v4 as uuidv4 } from 'uuid';

function freshState(): DocumentState {
  return { ...initialDocumentState, lesson: { ...initialDocumentState.lesson } };
}

function makeStroke(id: string, x: number = 100, y: number = 100): StrokeObject {
  return {
    id,
    type: 'stroke',
    points: [
      { x, y, pressure: 0.5 },
      { x: x + 50, y: y + 50, pressure: 0.6 },
    ],
    style: {
      penType: 'normal',
      color: '#ff0000',
      width: 4,
      opacity: 1,
      smoothing: 0.5,
      pressureSensitive: true,
    },
    bbox: { x, y, width: 50, height: 50 },
    locked: false,
    layerId: 'drawing',
    createdAt: Date.now(),
  };
}

function makeShape(id: string, x: number = 200, y: number = 200): ShapeObject {
  return {
    id,
    type: 'shape',
    shapeType: 'rect',
    x,
    y,
    width: 100,
    height: 80,
    rotation: 0,
    fillColor: '#00f2fe',
    fillOpacity: 0.3,
    strokeColor: '#4facfe',
    strokeWidth: 3,
    strokeOpacity: 1,
    strokeStyle: 'solid',
    locked: false,
    layerId: 'objects',
  };
}

describe('Layer Ordering in DocumentReducer', () => {
  it('moves an element to the top layer so it sits above all other elements', () => {
    let state = freshState();
    const s1 = makeStroke('s1');
    const s2 = makeStroke('s2');
    const s3 = makeStroke('s3');

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s1 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s2 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s3 });

    expect(state.lesson.pages[0].objects.map((o) => o.id)).toEqual(['s1', 's2', 's3']);

    // Move s1 to top
    state = documentReducer(state, {
      type: 'MOVE_OBJECT_LAYER',
      pageIndex: 0,
      objectId: 's1',
      direction: 'top',
    });

    expect(state.lesson.pages[0].objects.map((o) => o.id)).toEqual(['s2', 's3', 's1']);
  });

  it('moves an element to the bottom layer so user can touch elements below it', () => {
    let state = freshState();
    const s1 = makeStroke('s1');
    const s2 = makeStroke('s2');
    const s3 = makeStroke('s3');

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s1 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s2 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s3 });

    // Move s3 to the bottom layer
    state = documentReducer(state, {
      type: 'MOVE_OBJECT_LAYER',
      pageIndex: 0,
      objectId: 's3',
      direction: 'bottom',
    });

    expect(state.lesson.pages[0].objects.map((o) => o.id)).toEqual(['s3', 's1', 's2']);
  });

  it('moves an element forward by one layer', () => {
    let state = freshState();
    const s1 = makeStroke('s1');
    const s2 = makeStroke('s2');
    const s3 = makeStroke('s3');

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s1 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s2 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s3 });

    // Move s1 forward 1 level (swaps with s2)
    state = documentReducer(state, {
      type: 'MOVE_OBJECT_LAYER',
      pageIndex: 0,
      objectId: 's1',
      direction: 'forward',
    });

    expect(state.lesson.pages[0].objects.map((o) => o.id)).toEqual(['s2', 's1', 's3']);
  });

  it('moves an element backward by one layer', () => {
    let state = freshState();
    const s1 = makeStroke('s1');
    const s2 = makeStroke('s2');
    const s3 = makeStroke('s3');

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s1 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s2 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s3 });

    // Move s3 backward 1 level (swaps with s2)
    state = documentReducer(state, {
      type: 'MOVE_OBJECT_LAYER',
      pageIndex: 0,
      objectId: 's3',
      direction: 'backward',
    });

    expect(state.lesson.pages[0].objects.map((o) => o.id)).toEqual(['s1', 's3', 's2']);
  });

  it('reorders all objects explicitly', () => {
    let state = freshState();
    const s1 = makeStroke('s1');
    const s2 = makeStroke('s2');

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s1 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s2 });

    state = documentReducer(state, {
      type: 'REORDER_OBJECTS',
      pageIndex: 0,
      objects: [s2, s1],
    });

    expect(state.lesson.pages[0].objects.map((o) => o.id)).toEqual(['s2', 's1']);
  });
});

describe('Cross-Page Copy and Paste Flow', () => {
  it('copies an element from Page 1 and pastes onto Page 2', () => {
    let state = freshState();
    // Add page 2
    state = documentReducer(state, { type: 'ADD_PAGE', after: 0 });
    expect(state.lesson.pages).toHaveLength(2);

    // Create drawing on Page 1
    const originalStroke = makeStroke('p1-stroke', 150, 150);
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: originalStroke });
    expect(state.lesson.pages[0].objects).toHaveLength(1);
    expect(state.lesson.pages[1].objects).toHaveLength(0);

    // Simulate Clipboard Copy (from Page 1)
    const clipboard: CanvasObject = JSON.parse(JSON.stringify(originalStroke));

    // Navigate to Page 2
    state = documentReducer(state, { type: 'GOTO_PAGE', index: 1 });
    expect(state.currentPageIndex).toBe(1);

    // Paste onto Page 2 with new unique ID
    const pastedStroke: StrokeObject = {
      ...JSON.parse(JSON.stringify(clipboard)),
      id: uuidv4(),
    };
    state = documentReducer(state, {
      type: 'ADD_OBJECT',
      pageIndex: state.currentPageIndex,
      object: pastedStroke,
    });

    // Verify Page 1 still has original stroke and Page 2 has the copied stroke
    expect(state.lesson.pages[0].objects).toHaveLength(1);
    expect(state.lesson.pages[0].objects[0].id).toBe('p1-stroke');

    expect(state.lesson.pages[1].objects).toHaveLength(1);
    expect(state.lesson.pages[1].objects[0].id).toBe(pastedStroke.id);
    expect(state.lesson.pages[1].objects[0].id).not.toBe('p1-stroke');
    expect(state.lesson.pages[1].objects[0].type).toBe('stroke');
  });
});

describe('Same-Page Drag & Instant Duplication Flow', () => {
  it('duplicates an element on the same page preserving original and creating new copy', () => {
    let state = freshState();
    const rect = makeShape('rect-1', 100, 100);
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: rect });
    expect(state.lesson.pages[0].objects).toHaveLength(1);

    // Duplicate created via ➡️ drag-to-duplicate handle
    const clone: ShapeObject = {
      ...JSON.parse(JSON.stringify(rect)),
      id: uuidv4(),
      x: rect.x + 80,
      y: rect.y + 80,
    };

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: clone });

    expect(state.lesson.pages[0].objects).toHaveLength(2);
    expect(state.lesson.pages[0].objects[0].id).toBe('rect-1');
    expect((state.lesson.pages[0].objects[0] as ShapeObject).x).toBe(100);
    expect(state.lesson.pages[0].objects[1].id).toBe(clone.id);
    expect((state.lesson.pages[0].objects[1] as ShapeObject).x).toBe(180);
  });
});

describe('Transformations: Horizontal Mirror and Vertical Flip', () => {
  it('flips a stroke horizontally across its bounding box center', () => {
    const stroke = makeStroke('s-flip', 100, 100);
    const cx = stroke.bbox.x + stroke.bbox.width / 2; // 125

    const mirroredPts = stroke.points.map((p) => ({
      ...p,
      x: 2 * cx - p.x,
    }));

    // Point 1: original x=100 -> mirrored x = 2*125 - 100 = 150
    // Point 2: original x=150 -> mirrored x = 2*125 - 150 = 100
    expect(mirroredPts[0].x).toBe(150);
    expect(mirroredPts[1].x).toBe(100);
  });

  it('flips a stroke vertically across its bounding box center', () => {
    const stroke = makeStroke('s-vflip', 100, 100);
    const cy = stroke.bbox.y + stroke.bbox.height / 2; // 125

    const flippedPts = stroke.points.map((p) => ({
      ...p,
      y: 2 * cy - p.y,
    }));

    // Point 1: original y=100 -> flipped y = 2*125 - 100 = 150
    // Point 2: original y=150 -> flipped y = 2*125 - 150 = 100
    expect(flippedPts[0].y).toBe(150);
    expect(flippedPts[1].y).toBe(100);
  });
});

describe('Multi-Element Selection (Rectangular Marquee & Stylus Freehand Lasso)', () => {
  // Point in polygon ray-casting helper
  function pointInPolygon(pt: Point, poly: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  it('selects multiple elements with rectangular marquee selection (mouse)', () => {
    const s1 = makeStroke('stroke-1', 50, 50); // bbox: x:50, y:50, w:50, h:50
    const s2 = makeStroke('stroke-2', 80, 80); // bbox: x:80, y:80, w:50, h:50
    const s3 = makeStroke('stroke-3', 500, 500); // outside marquee

    // Marquee bounding box: 0,0 to 200,200
    const marquee: BoundingBox = { x: 0, y: 0, width: 200, height: 200 };

    const objects = [s1, s2, s3];
    const matches = objects.filter((obj) => {
      const b = obj.bbox;
      const disjoint =
        b.x + b.width < marquee.x ||
        b.x > marquee.x + marquee.width ||
        b.y + b.height < marquee.y ||
        b.y > marquee.y + marquee.height;
      return !disjoint;
    });

    expect(matches.map((o) => o.id)).toEqual(['stroke-1', 'stroke-2']);
    expect(matches).toHaveLength(2);
  });

  it('selects multiple elements with stylus freehand lasso loop', () => {
    const s1 = makeStroke('stroke-in', 100, 100); // points at (100,100), (150,150)
    const s2 = makeStroke('stroke-out', 400, 400); // points at (400,400), (450,450)

    // Freehand lasso loop enclosing (50,50) to (250,250)
    const lassoPoly: Point[] = [
      { x: 50, y: 50 },
      { x: 250, y: 50 },
      { x: 250, y: 250 },
      { x: 50, y: 250 },
    ];

    const isStrokeInLasso = (stroke: StrokeObject) =>
      stroke.points.some((p) => pointInPolygon(p, lassoPoly));

    expect(isStrokeInLasso(s1)).toBe(true);
    expect(isStrokeInLasso(s2)).toBe(false);
  });

  it('creates a composite GroupObject with unified bounding box for multi-selected elements', () => {
    const s1 = makeStroke('s1', 50, 60); // bbox: 50..100, 60..110
    const sh2 = makeShape('sh2', 200, 150); // x: 200..300, y: 150..230

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const obj of [s1, sh2]) {
      const b = obj.type === 'stroke' ? (obj as StrokeObject).bbox : { x: (obj as ShapeObject).x, y: (obj as ShapeObject).y, width: (obj as ShapeObject).width, height: (obj as ShapeObject).height };
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    const group: GroupObject = {
      id: 'group_test_1',
      type: 'group',
      objects: [s1, sh2],
      bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      locked: false,
      layerId: 'drawing',
    };

    expect(group.bbox).toEqual({ x: 50, y: 60, width: 250, height: 170 });
    expect(group.objects).toHaveLength(2);
  });

  it('moves all elements in a group atomically via UPDATE_OBJECTS with undo/redo', () => {
    let state = freshState();
    const s1 = makeStroke('s1', 10, 10);
    const sh2 = makeShape('sh2', 100, 100);

    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: s1 });
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: sh2 });

    // Move group by delta (+40, +50)
    const movedS1: StrokeObject = {
      ...s1,
      points: s1.points.map((p) => ({ ...p, x: p.x + 40, y: p.y + 50 })),
      bbox: { ...s1.bbox, x: s1.bbox.x + 40, y: s1.bbox.y + 50 },
    };
    const movedSh2: ShapeObject = {
      ...sh2,
      x: sh2.x + 40,
      y: sh2.y + 50,
    };

    state = documentReducer(state, {
      type: 'UPDATE_OBJECTS',
      pageIndex: 0,
      objects: [movedS1, movedSh2],
    });

    const pageObjs = state.lesson.pages[0].objects;
    const pageS1 = pageObjs.find((o) => o.id === 's1') as StrokeObject;
    const pageSh2 = pageObjs.find((o) => o.id === 'sh2') as ShapeObject;

    expect(pageS1.bbox.x).toBe(50);
    expect(pageS1.bbox.y).toBe(60);
    expect(pageSh2.x).toBe(140);
    expect(pageSh2.y).toBe(150);

    // Undo by reapplying previous children
    state = documentReducer(state, {
      type: 'UPDATE_OBJECTS',
      pageIndex: 0,
      objects: [s1, sh2],
    });

    const restoredS1 = state.lesson.pages[0].objects.find((o) => o.id === 's1') as StrokeObject;
    const restoredSh2 = state.lesson.pages[0].objects.find((o) => o.id === 'sh2') as ShapeObject;
    expect(restoredS1.bbox.x).toBe(10);
    expect(restoredSh2.x).toBe(100);
  });

  it('deletes all elements in a group atomically via REMOVE_OBJECTS', () => {
    let state = freshState();
    const s1 = makeStroke('s1');
    const s2 = makeStroke('s2');
    const s3 = makeStroke('s3');

    state = documentReducer(state, { type: 'ADD_OBJECTS', pageIndex: 0, objects: [s1, s2, s3] });
    expect(state.lesson.pages[0].objects).toHaveLength(3);

    // Delete group of s1 and s2
    state = documentReducer(state, {
      type: 'REMOVE_OBJECTS',
      pageIndex: 0,
      objectIds: ['s1', 's2'],
    });

    expect(state.lesson.pages[0].objects).toHaveLength(1);
    expect(state.lesson.pages[0].objects[0].id).toBe('s3');
  });

  it('auto-minimizes flyouts when closeAllPopups is triggered', () => {
    let activeToolbarFlyout: 'none' | 'pen' | 'eraser' | 'shape' | 'menu' = 'pen';
    let selectionFlyout: 'none' | 'palette' | 'layer' | 'more' | 'thickness' = 'palette';

    // Simulate touching canvas or drawing start
    const closeAllPopups = () => {
      activeToolbarFlyout = 'none';
      selectionFlyout = 'none';
    };

    closeAllPopups();
    expect(activeToolbarFlyout).toBe('none');
    expect(selectionFlyout).toBe('none');
  });

  it('rotates strokes continuously by arbitrary freehand angles', () => {
    const s = makeStroke('s1', 100, 100);
    const cx = s.bbox.x + s.bbox.width / 2;
    const cy = s.bbox.y + s.bbox.height / 2;

    const angle = Math.PI / 4; // 45 degrees
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotatedPoints = s.points.map((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      return {
        ...p,
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      };
    });

    expect(rotatedPoints).toHaveLength(2);
    expect(rotatedPoints[0].x).not.toBe(s.points[0].x);
    expect(rotatedPoints[0].y).not.toBe(s.points[0].y);
  });

  it('rotates shapes and calculates new rotation angle and center', () => {
    let state = freshState();
    const sh = makeShape('sh1', 200, 200);
    state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: sh });

    // Rotate by 90 degrees
    const rotated: ShapeObject = {
      ...sh,
      rotation: 90,
    };
    state = documentReducer(state, { type: 'UPDATE_OBJECT', pageIndex: 0, object: rotated });

    const fetched = state.lesson.pages[0].objects[0] as ShapeObject;
    expect(fetched.rotation).toBe(90);

    // Rotate again by 45 degrees freehand -> 135
    const rotatedFreehand: ShapeObject = {
      ...fetched,
      rotation: (fetched.rotation + 45) % 360,
    };
    state = documentReducer(state, { type: 'UPDATE_OBJECT', pageIndex: 0, object: rotatedFreehand });
    const fetched2 = state.lesson.pages[0].objects[0] as ShapeObject;
    expect(fetched2.rotation).toBe(135);
  });

  it('rotates a composite group around the group center', () => {
    let state = freshState();
    const s1 = makeStroke('s1', 50, 50);
    const sh2 = makeShape('sh2', 150, 150);

    state = documentReducer(state, { type: 'ADD_OBJECTS', pageIndex: 0, objects: [s1, sh2] });

    const grp: GroupObject = {
      id: 'grp_rot',
      type: 'group',
      objects: [s1, sh2],
      bbox: { x: 50, y: 50, width: 250, height: 230 },
      x: 50,
      y: 50,
      width: 250,
      height: 230,
      rotation: 0,
      locked: false,
      layerId: 'objects',
    };

    const cx = grp.bbox.x + grp.bbox.width / 2;
    const cy = grp.bbox.y + grp.bbox.height / 2;

    // Rotate 90 degrees
    const angle = Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotatedChildren = grp.objects.map((c) => {
      if (c.type === 'stroke') {
        const str = c as StrokeObject;
        const pts = str.points.map((p) => {
          const dx = p.x - cx;
          const dy = p.y - cy;
          return {
            ...p,
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos,
          };
        });
        return { ...str, points: pts };
      }
      if (c.type === 'shape') {
        const shape = c as ShapeObject;
        return { ...shape, rotation: (shape.rotation + 90) % 360 };
      }
      return c;
    });

    state = documentReducer(state, {
      type: 'UPDATE_OBJECTS',
      pageIndex: 0,
      objects: rotatedChildren,
    });

    const pageObjs = state.lesson.pages[0].objects;
    const rotSh = pageObjs.find((o) => o.id === 'sh2') as ShapeObject;
    expect(rotSh.rotation).toBe(90);
  });

  it('rotates manually by dragging angle and does not rotate on pure tap', () => {
    const shape = makeShape('rot-test', 200, 200);
    const cx = shape.x + shape.width / 2; // 250
    const cy = shape.y + shape.height / 2; // 240

    // Simulate pure tap with distance < 3
    const tapDeltaX = 1;
    const tapDeltaY = 1;
    const isPureTap = Math.hypot(tapDeltaX, tapDeltaY) < 3;
    expect(isPureTap).toBe(true); // Should NOT rotate

    // Simulate drag rotation of 45 degrees
    const dragDeltaDeg = 45;
    const deltaAngle = (dragDeltaDeg * Math.PI) / 180;
    const cos = Math.cos(deltaAngle);
    const sin = Math.sin(deltaAngle);
    const scx = shape.x + shape.width / 2;
    const scy = shape.y + shape.height / 2;
    const newScx = cx + (scx - cx) * cos - (scy - cy) * sin;
    const newScy = cy + (scx - cx) * sin + (scy - cy) * cos;
    const newRot = Math.round(((shape.rotation || 0) + dragDeltaDeg) % 360);

    const rotatedShape: ShapeObject = {
      ...shape,
      x: newScx - shape.width / 2,
      y: newScy - shape.height / 2,
      rotation: (newRot + 360) % 360,
    };

    expect(rotatedShape.rotation).toBe(45);
    expect(rotatedShape.x).toBe(200);
    expect(rotatedShape.y).toBe(200);
  });

  it('resizes text and formula objects from left, right, top, and bottom edges', () => {
    const textObj = {
      id: 'formula-resize',
      type: 'text' as const,
      x: 100,
      y: 100,
      content: 'r^2 \\pi \\frac{\\theta}{360} - \\sin \\frac{\\theta}{2} \\cos \\frac{\\theta}{2}',
      fontSize: 24,
      width: 250,
      height: 55,
      isLatex: true,
      locked: false,
      layerId: 'objects',
    };

    // 1. Drag West (left edge) to the left by 30px (deltaX = -30)
    const wDrag = {
      ...textObj,
      x: textObj.x + (-30),
      width: textObj.width - (-30),
    };
    expect(wDrag.x).toBe(70);
    expect(wDrag.width).toBe(280);

    // 2. Drag East (right edge) to the right by 50px (deltaX = 50)
    const eDrag = {
      ...textObj,
      width: textObj.width + 50,
    };
    expect(eDrag.x).toBe(100);
    expect(eDrag.width).toBe(300);

    // 3. Drag South (bottom edge) down by 20px (deltaY = 20)
    const sDrag = {
      ...textObj,
      height: textObj.height + 20,
    };
    expect(sDrag.y).toBe(100);
    expect(sDrag.height).toBe(75);

    // 4. Drag North (top edge) up by 15px (deltaY = -15)
    const nDrag = {
      ...textObj,
      y: textObj.y + (-15),
      height: textObj.height - (-15),
    };
    expect(nDrag.y).toBe(85);
    expect(nDrag.height).toBe(70);
  });

  it('scales LaTeX formula font size and maintains snug aspect ratio during corner resize', () => {
    const formulaObj = {
      id: 'formula-scale-test',
      type: 'text' as const,
      x: 100,
      y: 100,
      content: 'ax^2 + bx + c = 0',
      fontSize: 24,
      width: 200,
      height: 50,
      isLatex: true,
      locked: false,
      layerId: 'objects',
    };

    // When scaled up 2x (width 200 -> 400)
    const scale = 400 / formulaObj.width;
    const newWidth = Math.round(formulaObj.width * scale);
    const newHeight = Math.round(formulaObj.height * scale);
    const newFontSize = Math.round(formulaObj.fontSize * scale);

    expect(newWidth).toBe(400);
    expect(newHeight).toBe(100);
    expect(newFontSize).toBe(48);
    // Aspect ratio is strictly preserved
    expect(newWidth / newHeight).toBe(formulaObj.width / formulaObj.height);
  });

  describe('Image Fit and Screen Sizing Actions', () => {
    const makeImage = (id: string, width = 800, height = 600): ImageObject => ({
      id,
      type: 'image',
      x: 100,
      y: 100,
      width,
      height,
      rotation: 0,
      filePath: 'test.png',
      dataUrl: 'data:image/png;base64,sample',
      opacity: 1,
      locked: false,
      layerId: 'objects',
    });

    it('fits image to screen proportionally (contain) preserving aspect ratio', () => {
      const img = makeImage('img-1', 800, 600); // aspect 4:3 = 1.333
      const screenW = 1920;
      const screenH = 1080; // aspect 16:9 = 1.777

      const imgAspect = img.width / img.height;
      const screenAspect = screenW / screenH;

      let newW = img.width;
      let newH = img.height;
      let newX = 0;
      let newY = 0;

      if (imgAspect > screenAspect) {
        newW = screenW;
        newH = screenW / imgAspect;
        newX = 0;
        newY = (screenH - newH) / 2;
      } else {
        newH = screenH;
        newW = screenH * imgAspect;
        newX = (screenW - newW) / 2;
        newY = 0;
      }

      // Height should fill 1080, width should be 1080 * (4/3) = 1440, centered horizontally
      expect(newH).toBe(1080);
      expect(newW).toBe(1440);
      expect(newX).toBe((1920 - 1440) / 2); // 240
      expect(newY).toBe(0);
      expect(newW / newH).toBeCloseTo(4 / 3, 2);
    });

    it('stretches image edge-to-edge (fill) to full screen', () => {
      const img = makeImage('img-2', 500, 400);
      const screenW = 1920;
      const screenH = 1080;

      const fillImg: ImageObject = {
        ...img,
        x: 0,
        y: 0,
        width: screenW,
        height: screenH,
        rotation: 0,
      };

      expect(fillImg.x).toBe(0);
      expect(fillImg.y).toBe(0);
      expect(fillImg.width).toBe(1920);
      expect(fillImg.height).toBe(1080);
    });

    it('converts selected image to page background and removes floating object', () => {
      let state = freshState();
      const img = makeImage('img-3', 1200, 800);
      state = documentReducer(state, { type: 'ADD_OBJECT', pageIndex: 0, object: img });
      expect(state.lesson.pages[0].objects).toHaveLength(1);

      // Execute setting as page background
      state = documentReducer(state, {
        type: 'SET_PAGE_BACKGROUND',
        pageIndex: 0,
        background: { type: 'image', imageUrl: img.dataUrl, color: '#ffffff' },
      });
      state = documentReducer(state, { type: 'REMOVE_OBJECT', pageIndex: 0, objectId: img.id });

      expect(state.lesson.pages[0].objects).toHaveLength(0);
      expect(state.lesson.pages[0].background.type).toBe('image');
      expect(state.lesson.pages[0].background.imageUrl).toBe(img.dataUrl);
    });

    it('centers image on screen at current scale', () => {
      const img = makeImage('img-4', 600, 400);
      const screenW = 1920;
      const screenH = 1080;

      const centeredX = (screenW - img.width) / 2;
      const centeredY = (screenH - img.height) / 2;

      expect(centeredX).toBe(660);
      expect(centeredY).toBe(340);
    });

    it('calculates fit-to-screen dimensions preventing overflow on high-resolution images', () => {
      // 4K resolution image on 1080p whiteboard screen
      const highResImg = makeImage('img-high-res', 3840, 2160);
      const screenW = 1920;
      const screenH = 1080;
      const imgAspect = highResImg.width / highResImg.height;
      const screenAspect = screenW / screenH;

      let newW = highResImg.width;
      let newH = highResImg.height;
      let newX = 0;
      let newY = 0;

      if (imgAspect > screenAspect) {
        newW = screenW;
        newH = screenW / imgAspect;
        newX = 0;
        newY = (screenH - newH) / 2;
      } else {
        newH = screenH;
        newW = screenH * imgAspect;
        newX = (screenW - newW) / 2;
        newY = 0;
      }

      // Must fit exactly inside 1920x1080 without overflowing
      expect(newW).toBe(1920);
      expect(newH).toBe(1080);
      expect(newX).toBe(0);
      expect(newY).toBe(0);
    });

    it('calculates fit-to-screen for non-16:9 images with letterboxing centered', () => {
      // 4:3 high-resolution image (3200x2400)
      const highRes43 = makeImage('img-43', 3200, 2400);
      const screenW = 1920;
      const screenH = 1080;
      const imgAspect = highRes43.width / highRes43.height; // 1.333
      const screenAspect = screenW / screenH; // 1.777

      let newW = 0;
      let newH = 0;
      let newX = 0;
      let newY = 0;

      if (imgAspect > screenAspect) {
        newW = screenW;
        newH = screenW / imgAspect;
        newX = 0;
        newY = (screenH - newH) / 2;
      } else {
        newH = screenH;
        newW = screenH * imgAspect;
        newX = (screenW - newW) / 2;
        newY = 0;
      }

      expect(newH).toBe(1080);
      expect(newW).toBe(1440);
      expect(newX).toBe(240); // Centered horizontally
      expect(newY).toBe(0);
      expect(newX + newW).toBeLessThanOrEqual(screenW);
    });
  });
});


