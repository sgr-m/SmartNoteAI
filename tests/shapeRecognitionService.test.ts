import { describe, it, expect } from 'vitest';
import { recognizeShapeGesture } from '../src/renderer/services/shapeRecognitionService';
import { Point } from '../src/shared/types';

function sampleSegment(a: Point, b: Point, steps: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    pts.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });
  }
  return pts;
}

function makePolygonStroke(vertices: Point[], stepsPerEdge = 16, close = true): Point[] {
  const pts: Point[] = [];
  const edgeCount = close ? vertices.length : vertices.length - 1;
  for (let i = 0; i < edgeCount; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    pts.push(...sampleSegment(a, b, stepsPerEdge));
  }
  pts.push(close ? { ...vertices[0] } : { ...vertices[vertices.length - 1] });
  return pts;
}

function makeEllipseStroke(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count = 64,
  rotationRad = 0,
  wobbleAmp = 0
): Point[] {
  const pts: Point[] = [];
  const cosR = Math.cos(rotationRad);
  const sinR = Math.sin(rotationRad);
  for (let i = 0; i <= count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const rScale = 1 + wobbleAmp * Math.sin(theta * 5);
    const lx = rx * rScale * Math.cos(theta);
    const ly = ry * rScale * Math.sin(theta);
    pts.push({
      x: cx + lx * cosR - ly * sinR,
      y: cy + lx * sinR + ly * cosR,
    });
  }
  return pts;
}

describe('shapeRecognitionService', () => {
  describe('quadrilaterals (must never be misclassified as circles)', () => {
    it('recognizes a geometric square as rect, never circle', () => {
      const square = makePolygonStroke([
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 300, y: 300 },
        { x: 100, y: 300 },
      ]);
      const result = recognizeShapeGesture(square);
      expect(result.shapeType).toBe('rect');
      expect(result.rotation ?? 0).toBe(0);
    });

    it('recognizes a rectangle started mid-edge with slight hand-drawn bow and rounded corners as rect', () => {
      // Simulates human drawing starting near top edge midpoint with slight curve/wobble
      const pts: Point[] = [
        ...sampleSegment({ x: 200, y: 102 }, { x: 394, y: 105 }, 14),
        { x: 398, y: 112 },
        ...sampleSegment({ x: 398, y: 120 }, { x: 395, y: 245 }, 12),
        { x: 390, y: 251 },
        ...sampleSegment({ x: 382, y: 253 }, { x: 108, y: 249 }, 20),
        { x: 101, y: 242 },
        ...sampleSegment({ x: 100, y: 235 }, { x: 103, y: 110 }, 12),
        { x: 112, y: 103 },
        ...sampleSegment({ x: 122, y: 102 }, { x: 196, y: 102 }, 8),
      ];
      const result = recognizeShapeGesture(pts);
      expect(result.shapeType).toBe('rect');
    });

    it('recognizes a square drawn with a slight unclosed gap as rect rather than arc or circle', () => {
      // Stops ~18% short on the final edge
      const openSquare = [
        ...sampleSegment({ x: 100, y: 100 }, { x: 300, y: 100 }, 18),
        ...sampleSegment({ x: 300, y: 100 }, { x: 300, y: 300 }, 18),
        ...sampleSegment({ x: 300, y: 300 }, { x: 100, y: 300 }, 18),
        ...sampleSegment({ x: 100, y: 300 }, { x: 100, y: 145 }, 14),
      ];
      const result = recognizeShapeGesture(openSquare);
      expect(result.shapeType).toBe('rect');
    });

    it('recognizes a rotated 45-degree diamond/rhombus as rotated rect instead of circle', () => {
      const diamond = makePolygonStroke([
        { x: 250, y: 100 },
        { x: 400, y: 250 },
        { x: 250, y: 400 },
        { x: 100, y: 250 },
      ]);
      const result = recognizeShapeGesture(diamond);
      expect(result.shapeType).toBe('rect');
      expect(Math.abs(result.rotation ?? 0)).toBeGreaterThan(20);
    });

    it('recognizes a slanted parallelogram as parallelogram', () => {
      const parallelogram = makePolygonStroke([
        { x: 160, y: 100 },
        { x: 380, y: 100 },
        { x: 320, y: 240 },
        { x: 100, y: 240 },
      ]);
      const result = recognizeShapeGesture(parallelogram);
      expect(result.shapeType).toBe('parallelogram');
    });

    it('recognizes a trapezoid as trapezoid', () => {
      const trapezoid = makePolygonStroke([
        { x: 160, y: 100 },
        { x: 300, y: 100 },
        { x: 380, y: 240 },
        { x: 80, y: 240 },
      ]);
      const result = recognizeShapeGesture(trapezoid);
      expect(result.shapeType).toBe('trapezoid');
    });
  });

  describe('triangles', () => {
    it('recognizes an equilateral/isosceles triangle cleanly', () => {
      const tri = makePolygonStroke([
        { x: 250, y: 80 },
        { x: 380, y: 300 },
        { x: 120, y: 300 },
      ]);
      const result = recognizeShapeGesture(tri);
      expect(result.shapeType).toBe('triangle');
    });

    it('recognizes a bottom-left right triangle cleanly', () => {
      const rightTri = makePolygonStroke([
        { x: 100, y: 100 },
        { x: 100, y: 300 },
        { x: 340, y: 300 },
      ]);
      const result = recognizeShapeGesture(rightTri);
      expect(result.shapeType).toBe('rightTriangle');
    });
  });

  describe('circles and ellipses', () => {
    it('recognizes a smooth circle as circle', () => {
      const circle = makeEllipseStroke(250, 250, 100, 100, 72);
      const result = recognizeShapeGesture(circle);
      expect(result.shapeType).toBe('circle');
    });

    it('recognizes a slightly wobbly hand-drawn circle as circle', () => {
      const wobblyCircle = makeEllipseStroke(250, 250, 100, 96, 72, 0, 0.05);
      const result = recognizeShapeGesture(wobblyCircle);
      expect(result.shapeType).toBe('circle');
    });

    it('recognizes an elongated oval (even 4:1) as ellipse, not rect or diamond', () => {
      const flatEllipse = makeEllipseStroke(300, 200, 200, 50, 72);
      const result = recognizeShapeGesture(flatEllipse);
      expect(result.shapeType).toBe('ellipse');
    });

    it('recognizes a tilted ellipse with rotation', () => {
      const tiltedEllipse = makeEllipseStroke(300, 250, 140, 60, 72, Math.PI / 4);
      const result = recognizeShapeGesture(tiltedEllipse);
      expect(result.shapeType).toBe('ellipse');
      expect(Math.abs(result.rotation ?? 0)).toBeGreaterThan(20);
    });
  });

  describe('open strokes (line, arrow, arc)', () => {
    it('recognizes a straight freehand stroke as line', () => {
      const line = sampleSegment({ x: 80, y: 120 }, { x: 420, y: 260 }, 24);
      line.push({ x: 420, y: 260 });
      const result = recognizeShapeGesture(line);
      expect(result.shapeType).toBe('line');
      expect(result.origin).toEqual({ x: 80, y: 120 });
      expect(result.current).toEqual({ x: 420, y: 260 });
    });

    it('recognizes an arrow and snaps current endpoint to the shaft tip rather than the barb tail', () => {
      const arrow = [
        ...sampleSegment({ x: 100, y: 200 }, { x: 350, y: 200 }, 24),
        { x: 350, y: 200 },
        ...sampleSegment({ x: 350, y: 200 }, { x: 320, y: 175 }, 8),
        { x: 320, y: 175 },
      ];
      const result = recognizeShapeGesture(arrow);
      expect(result.shapeType).toBe('arrow');
      expect(result.origin).toEqual({ x: 100, y: 200 });
      expect(result.current.x).toBeGreaterThan(335);
    });

    it('recognizes a smooth open semicircle curve as arc', () => {
      const arc: Point[] = [];
      for (let i = 0; i <= 36; i++) {
        const theta = (i / 36) * Math.PI;
        arc.push({ x: 250 + 120 * Math.cos(theta), y: 250 - 120 * Math.sin(theta) });
      }
      const result = recognizeShapeGesture(arc);
      expect(result.shapeType).toBe('arc');
    });
  });
});

