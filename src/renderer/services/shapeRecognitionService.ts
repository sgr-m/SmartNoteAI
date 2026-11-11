/**
 * shapeRecognitionService.ts
 * Geometric intelligent shape recognition for freehand whiteboard strokes.
 *
 * Classifies freehand strokes into canonical SmartNoteAI ShapeTypes:
 * - Open strokes: line, arrow, arc
 * - Closed strokes: circle, ellipse, triangle, rightTriangle, rect (with optional rotation for diamonds/tilted rects),
 *   parallelogram, trapezoid
 */

import { Point, ShapeType } from '../../shared/types';

export interface RecognizedShapeResult {
  shapeType: ShapeType;
  origin: Point;
  current: Point;
  rotation?: number;
}

interface NormalizedStrokeStats {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  diag: number;
  totalLength: number;
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizeAngleDiff(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Filter near-duplicate consecutive points while preserving start and end.
 */
function dedupePoints(points: Point[], minStep = 0.5): Point[] {
  if (points.length <= 2) return [...points];
  const out: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    if (dist(out[out.length - 1], points[i]) >= minStep) {
      out.push(points[i]);
    }
  }
  const last = points[points.length - 1];
  if (dist(out[out.length - 1], last) >= 0.01 || out.length === 1) {
    out.push(last);
  }
  return out;
}

function computeStats(pts: Point[]): NormalizedStrokeStats {
  let minX = pts[0].x;
  let maxX = pts[0].x;
  let minY = pts[0].y;
  let maxY = pts[0].y;
  let totalLength = 0;

  for (let i = 0; i < pts.length; i++) {
    if (pts[i].x < minX) minX = pts[i].x;
    if (pts[i].x > maxX) maxX = pts[i].x;
    if (pts[i].y < minY) minY = pts[i].y;
    if (pts[i].y > maxY) maxY = pts[i].y;
    if (i > 0) {
      totalLength += dist(pts[i - 1], pts[i]);
    }
  }

  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);
  const diag = Math.hypot(width, height);
  return { minX, maxX, minY, maxY, width, height, diag, totalLength };
}

/**
 * Uniformly resample a polyline into `count` equidistant points by arc length.
 */
export function resamplePolyline(pts: Point[], count: number): Point[] {
  if (pts.length === 0) return [];
  if (pts.length === 1 || count <= 1) return [pts[0]];

  const cumLen: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    cumLen.push(cumLen[i - 1] + dist(pts[i - 1], pts[i]));
  }
  const total = cumLen[cumLen.length - 1];
  if (total < 1e-6) {
    return Array.from({ length: count }, () => ({ x: pts[0].x, y: pts[0].y }));
  }

  const result: Point[] = [{ x: pts[0].x, y: pts[0].y }];
  const step = total / (count - 1);
  let segIdx = 0;

  for (let k = 1; k < count - 1; k++) {
    const target = k * step;
    while (segIdx < cumLen.length - 2 && cumLen[segIdx + 1] < target) {
      segIdx++;
    }
    const segStart = cumLen[segIdx];
    const segEnd = cumLen[segIdx + 1];
    const segLen = segEnd - segStart;
    const t = segLen > 1e-9 ? (target - segStart) / segLen : 0;
    const a = pts[segIdx];
    const b = pts[segIdx + 1];
    result.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });
  }

  const last = pts[pts.length - 1];
  result.push({ x: last.x, y: last.y });
  return result;
}

function pointToSegmentDist(p: Point, a: Point, b: Point): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const lenSq = vx * vx + vy * vy;
  if (lenSq <= 1e-9) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / lenSq));
  const projX = a.x + t * vx;
  const projY = a.y + t * vy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Compute unsigned area of a closed polygon via the Shoelace formula.
 */
export function computePolygonArea(pts: Point[]): number {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function rdpOpenIndices(pts: Point[], startIdx: number, endIdx: number, eps: number, keep: boolean[]): void {
  if (endIdx <= startIdx + 1) return;
  let maxD = 0;
  let bestIdx = -1;
  const a = pts[startIdx];
  const b = pts[endIdx];

  for (let i = startIdx + 1; i < endIdx; i++) {
    const d = pointToSegmentDist(pts[i], a, b);
    if (d > maxD) {
      maxD = d;
      bestIdx = i;
    }
  }

  if (maxD > eps && bestIdx !== -1) {
    keep[bestIdx] = true;
    rdpOpenIndices(pts, startIdx, bestIdx, eps, keep);
    rdpOpenIndices(pts, bestIdx, endIdx, eps, keep);
  }
}

/**
 * Cyclic Ramer-Douglas-Peucker simplification on a closed loop.
 * Rotates the loop to begin at the vertex farthest from the centroid so start-point placement never splits an edge.
 */
export function simplifyClosedPolygonRDP(loop: Point[], eps: number): Point[] {
  if (loop.length < 4) return [...loop];

  let cx = 0;
  let cy = 0;
  for (const p of loop) {
    cx += p.x;
    cy += p.y;
  }
  cx /= loop.length;
  cy /= loop.length;

  let startIdx = 0;
  let maxR = -1;
  for (let i = 0; i < loop.length; i++) {
    const r = Math.hypot(loop[i].x - cx, loop[i].y - cy);
    if (r > maxR) {
      maxR = r;
      startIdx = i;
    }
  }

  const rotated: Point[] = [];
  for (let i = 0; i < loop.length; i++) {
    rotated.push(loop[(startIdx + i) % loop.length]);
  }

  // Split closed loop at the farthest point from rotated[0] first, then run RDP on both halves
  let oppIdx = Math.floor(rotated.length / 2);
  let maxOppD = -1;
  for (let i = 1; i < rotated.length - 1; i++) {
    const d = dist(rotated[0], rotated[i]);
    if (d > maxOppD) {
      maxOppD = d;
      oppIdx = i;
    }
  }

  const closedExtended = [...rotated, rotated[0]];
  const keep = new Array<boolean>(closedExtended.length).fill(false);
  keep[0] = true;
  keep[oppIdx] = true;
  keep[closedExtended.length - 1] = true;

  rdpOpenIndices(closedExtended, 0, oppIdx, eps, keep);
  rdpOpenIndices(closedExtended, oppIdx, closedExtended.length - 1, eps, keep);

  const rawVerts: Point[] = [];
  for (let i = 0; i < closedExtended.length - 1; i++) {
    if (keep[i]) rawVerts.push(closedExtended[i]);
  }
  return rawVerts;
}

/**
 * Interior turning angle in degrees at vertex B (180 = collinear straight line, 90 = right corner).
 */
function interiorAngleDeg(a: Point, b: Point, c: Point): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 < 1e-6 || m2 < 1e-6) return 180;
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Merge nearly-collinear or micro-edge vertices in a closed polygon.
 */
function mergePolygonVertices(verts: Point[], diag: number): Point[] {
  let out = [...verts];
  let changed = true;

  while (changed && out.length > 3) {
    changed = false;

    // 1. Remove shortest edge vertex if edge is tiny (< 10% of diag)
    let shortestIdx = -1;
    let shortestLen = Infinity;
    for (let i = 0; i < out.length; i++) {
      const len = dist(out[i], out[(i + 1) % out.length]);
      if (len < shortestLen) {
        shortestLen = len;
        shortestIdx = i;
      }
    }

    if (shortestIdx !== -1 && shortestLen < 0.11 * diag) {
      const nextIdx = (shortestIdx + 1) % out.length;
      const prevA = out[(shortestIdx - 1 + out.length) % out.length];
      const vA = out[shortestIdx];
      const vB = out[nextIdx];
      const nextB = out[(nextIdx + 1) % out.length];
      // Replace short edge with whichever vertex forms sharper corner or midpoint
      const angA = interiorAngleDeg(prevA, vA, nextB);
      const angB = interiorAngleDeg(prevA, vB, nextB);
      const removeIdx = angA > angB ? shortestIdx : nextIdx;
      out.splice(removeIdx, 1);
      changed = true;
      continue;
    }

    // 2. Remove the straightest collinear vertex (interior angle > 152 deg -> turn < 28 deg)
    let straightestIdx = -1;
    let maxInterior = -1;
    for (let i = 0; i < out.length; i++) {
      const prev = out[(i - 1 + out.length) % out.length];
      const curr = out[i];
      const next = out[(i + 1) % out.length];
      const ang = interiorAngleDeg(prev, curr, next);
      if (ang > 152 && ang > maxInterior) {
        maxInterior = ang;
        straightestIdx = i;
      }
    }

    if (straightestIdx !== -1) {
      out.splice(straightestIdx, 1);
      changed = true;
    }
  }

  return out;
}

/**
 * Reduce polygon down to exact `targetCount` vertices by greedily dropping vertices
 * that add the least area / deviation when removed.
 */
function reducePolygonToK(verts: Point[], targetCount: number): Point[] {
  const out = [...verts];
  while (out.length > targetCount) {
    let bestIdx = 0;
    let bestCost = Infinity;
    for (let i = 0; i < out.length; i++) {
      const prev = out[(i - 1 + out.length) % out.length];
      const curr = out[i];
      const next = out[(i + 1) % out.length];
      const offset = pointToSegmentDist(curr, prev, next);
      if (offset < bestCost) {
        bestCost = offset;
        bestIdx = i;
      }
    }
    out.splice(bestIdx, 1);
  }
  return out;
}

/**
 * Compute RMS and max perpendicular distance from sample points to a closed polygon, normalized by `diag`.
 */
function computePolygonFitError(samples: Point[], polyVerts: Point[], diag: number): { rms: number; max: number } {
  if (polyVerts.length < 3 || samples.length === 0 || diag <= 1e-6) {
    return { rms: 1, max: 1 };
  }
  let sumSq = 0;
  let maxD = 0;

  for (const p of samples) {
    let best = Infinity;
    for (let i = 0; i < polyVerts.length; i++) {
      const a = polyVerts[i];
      const b = polyVerts[(i + 1) % polyVerts.length];
      const d = pointToSegmentDist(p, a, b);
      if (d < best) best = d;
    }
    const normD = best / diag;
    sumSq += normD * normD;
    if (normD > maxD) maxD = normD;
  }

  return {
    rms: Math.sqrt(sumSq / samples.length),
    max: maxD,
  };
}

interface PcaFrame {
  cx: number;
  cy: number;
  ux: number;
  uy: number;
  vx: number;
  vy: number;
  angleDeg: number;
  ow: number;
  oh: number;
  ocx: number;
  ocy: number;
  projected: Point[];
}

function computePcaFrame(samples: Point[]): PcaFrame {
  let mx = 0;
  let my = 0;
  for (const p of samples) {
    mx += p.x;
    my += p.y;
  }
  mx /= samples.length;
  my /= samples.length;

  let cxx = 0;
  let cxy = 0;
  let cyy = 0;
  for (const p of samples) {
    const dx = p.x - mx;
    const dy = p.y - my;
    cxx += dx * dx;
    cxy += dx * dy;
    cyy += dy * dy;
  }
  cxx /= samples.length;
  cxy /= samples.length;
  cyy /= samples.length;

  const theta = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  const vx = -uy;
  const vy = ux;

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  const projected: Point[] = [];

  for (const p of samples) {
    const dx = p.x - mx;
    const dy = p.y - my;
    const u = dx * ux + dy * uy;
    const v = dx * vx + dy * vy;
    projected.push({ x: u, y: v });
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  const ow = Math.max(10, maxU - minU);
  const oh = Math.max(10, maxV - minV);
  const ocxLocal = (minU + maxU) / 2;
  const ocyLocal = (minV + maxV) / 2;

  return {
    cx: mx + ocxLocal * ux + ocyLocal * vx,
    cy: my + ocxLocal * uy + ocyLocal * vy,
    ux,
    uy,
    vx,
    vy,
    angleDeg: (theta * 180) / Math.PI,
    ow,
    oh,
    ocx: ocxLocal,
    ocy: ocyLocal,
    projected,
  };
}

/**
 * Geometric normalized RMS and max distance from sample points to the PCA-oriented bounding ellipse.
 */
export function computeEllipseFitError(
  frame: PcaFrame,
  diag: number
): { rms: number; max: number; radialMaxDev: number } {
  const a = Math.max(5, frame.ow / 2);
  const b = Math.max(5, frame.oh / 2);
  let sumSq = 0;
  let maxDist = 0;
  let radialMaxDev = 0;

  for (const p of frame.projected) {
    const du = p.x - frame.ocx;
    const dv = p.y - frame.ocy;
    const rNorm = Math.hypot(du / a, dv / b);
    const radDev = Math.abs(rNorm - 1);
    if (radDev > radialMaxDev) radialMaxDev = radDev;

    const r = Math.hypot(du, dv);
    const geomErr = rNorm > 1e-6 ? (Math.abs(1 - 1 / rNorm) * r) / diag : Math.min(a, b) / diag;
    sumSq += geomErr * geomErr;
    if (geomErr > maxDist) maxDist = geomErr;
  }

  return {
    rms: Math.sqrt(sumSq / frame.projected.length),
    max: maxDist,
    radialMaxDev,
  };
}

/**
 * Detect whether a closed stroke looks like a right triangle matching DrawingEngine's bottom-left rightTriangle,
 * or a standard triangle.
 */
function classifyTriangle(verts: Point[], stats: NormalizedStrokeStats): ShapeType {
  if (verts.length !== 3) return 'triangle';

  // Find vertex closest to bottom-left corner (minX, maxY)
  let blIdx = -1;
  let bestBlDist = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = Math.hypot(verts[i].x - stats.minX, verts[i].y - stats.maxY);
    if (d < bestBlDist) {
      bestBlDist = d;
      blIdx = i;
    }
  }

  if (bestBlDist < 0.18 * stats.diag && blIdx !== -1) {
    const prev = verts[(blIdx + 2) % 3];
    const curr = verts[blIdx];
    const next = verts[(blIdx + 1) % 3];
    const ang = interiorAngleDeg(prev, curr, next);

    if (ang >= 72 && ang <= 108) {
      const others = [prev, next];
      const hasTopLeft = others.some((p) => Math.hypot(p.x - stats.minX, p.y - stats.minY) < 0.22 * stats.diag);
      const hasBottomRight = others.some((p) => Math.hypot(p.x - stats.maxX, p.y - stats.maxY) < 0.22 * stats.diag);
      if (hasTopLeft && hasBottomRight) {
        return 'rightTriangle';
      }
    }
  }

  return 'triangle';
}

/**
 * Order 4 vertices clockwise starting from top-left-most in document coordinates.
 */
function orderQuadVertices(verts: Point[]): [Point, Point, Point, Point] {
  let cx = 0;
  let cy = 0;
  for (const v of verts) {
    cx += v.x;
    cy += v.y;
  }
  cx /= 4;
  cy /= 4;

  const sortedByAngle = [...verts].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
  );
  // Find index closest to top-left (-3pi/4 in atan2 screen space where y goes down -> top-left is around -3pi/4)
  let tlIdx = 0;
  let minScore = Infinity;
  for (let i = 0; i < 4; i++) {
    const score = sortedByAngle[i].x + sortedByAngle[i].y;
    if (score < minScore) {
      minScore = score;
      tlIdx = i;
    }
  }

  return [
    sortedByAngle[tlIdx],
    sortedByAngle[(tlIdx + 1) % 4],
    sortedByAngle[(tlIdx + 2) % 4],
    sortedByAngle[(tlIdx + 3) % 4],
  ];
}

/**
 * Classify a confirmed 4-vertex quadrilateral into rect (possibly rotated diamond), parallelogram, or trapezoid.
 */
function classifyQuadrilateral(
  verts: Point[],
  stats: NormalizedStrokeStats,
  pca: PcaFrame
): RecognizedShapeResult {
  const [tl, tr, br, bl] = orderQuadVertices(verts);

  const topAngle = Math.abs((Math.atan2(tr.y - tl.y, tr.x - tl.x) * 180) / Math.PI);
  const bottomAngle = Math.abs((Math.atan2(br.y - bl.y, br.x - bl.x) * 180) / Math.PI);
  const topLen = dist(tl, tr);
  const bottomLen = dist(bl, br);
  const horizontalTopBottom = topAngle <= 16 && bottomAngle <= 16;

  // Compute corner angle deviation from 90 degrees
  const angles = [
    interiorAngleDeg(bl, tl, tr),
    interiorAngleDeg(tl, tr, br),
    interiorAngleDeg(tr, br, bl),
    interiorAngleDeg(br, bl, tl),
  ];
  const maxRightDev = Math.max(...angles.map((a) => Math.abs(a - 90)));
  const avgRightDev = angles.reduce((acc, a) => acc + Math.abs(a - 90), 0) / 4;

  // 1. Axis-aligned rectangle/square -> rect (rotation 0)
  if (maxRightDev <= 22 && avgRightDev <= 16) {
    // Check if shape is clearly rotated (e.g. 45° diamond / rhombus or strongly tilted rectangle)
    // Edge angle mod 90 gives orientation offset from horizontal/vertical axes
    const edgeAngDeg = ((Math.atan2(tr.y - tl.y, tr.x - tl.x) * 180) / Math.PI + 360) % 90;
    const tiltFromAxis = Math.min(edgeAngDeg, 90 - edgeAngDeg);

    if (tiltFromAxis > 20) {
      const snappedRot = Math.abs(pca.angleDeg) > 15 ? Math.round(pca.angleDeg / 5) * 5 : Math.round(edgeAngDeg / 5) * 5;
      return {
        shapeType: 'rect',
        origin: { x: pca.cx - pca.ow / 2, y: pca.cy - pca.oh / 2 },
        current: { x: pca.cx + pca.ow / 2, y: pca.cy + pca.oh / 2 },
        rotation: snappedRot,
      };
    }

    return {
      shapeType: 'rect',
      origin: { x: stats.minX, y: stats.minY },
      current: { x: stats.maxX, y: stats.maxY },
      rotation: 0,
    };
  }

  // 2. Trapezoid (horizontal top/bottom, top noticeably shorter and inset relative to bottom)
  if (
    horizontalTopBottom &&
    bottomLen > 1 &&
    topLen / bottomLen >= 0.3 &&
    topLen / bottomLen <= 0.78 &&
    tl.x > bl.x + 0.08 * stats.width &&
    tr.x < br.x - 0.08 * stats.width
  ) {
    return {
      shapeType: 'trapezoid',
      origin: { x: stats.minX, y: stats.minY },
      current: { x: stats.maxX, y: stats.maxY },
      rotation: 0,
    };
  }

  // 3. Parallelogram (horizontal top/bottom, similar lengths, sides skewed right to match DrawingEngine parallelogram)
  if (horizontalTopBottom && bottomLen > 1 && topLen > 1) {
    const lenRatio = Math.min(topLen, bottomLen) / Math.max(topLen, bottomLen);
    const leftSkew = tl.x - bl.x;
    const rightSkew = tr.x - br.x;
    if (
      lenRatio >= 0.72 &&
      leftSkew >= 0.14 * stats.width &&
      rightSkew >= 0.14 * stats.width
    ) {
      return {
        shapeType: 'parallelogram',
        origin: { x: stats.minX, y: stats.minY },
        current: { x: stats.maxX, y: stats.maxY },
        rotation: 0,
      };
    }
  }

  // 4. Diamond / Rhombus rotated ~45 deg even with slight skew
  const edgeAngDeg = ((Math.atan2(tr.y - tl.y, tr.x - tl.x) * 180) / Math.PI + 360) % 90;
  const tiltFromAxis = Math.min(edgeAngDeg, 90 - edgeAngDeg);
  if (tiltFromAxis > 24 && avgRightDev <= 28) {
    const snappedRot = Math.round(pca.angleDeg / 5) * 5 || 45;
    return {
      shapeType: 'rect',
      origin: { x: pca.cx - pca.ow / 2, y: pca.cy - pca.oh / 2 },
      current: { x: pca.cx + pca.ow / 2, y: pca.cy + pca.oh / 2 },
      rotation: snappedRot,
    };
  }

  // Fallback for general quadrilaterals: clean rectangle aligned to bounding box
  return {
    shapeType: 'rect',
    origin: { x: stats.minX, y: stats.minY },
    current: { x: stats.maxX, y: stats.maxY },
    rotation: 0,
  };
}

/**
 * Detect whether an open gesture represents a straight line, arrow (with barb reversal), or curved arc.
 */
function recognizeOpenGesture(pts: Point[], stats: NormalizedStrokeStats): RecognizedShapeResult {
  const start = pts[0];
  const end = pts[pts.length - 1];
  const chordDist = dist(start, end);
  const straightness = stats.totalLength > 0 ? chordDist / stats.totalLength : 1;

  // Compute max perpendicular deviation from segment start -> end
  let maxPerpDev = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = pointToSegmentDist(pts[i], start, end);
    if (d > maxPerpDev) maxPerpDev = d;
  }

  if (straightness >= 0.91 && maxPerpDev <= Math.max(12, 0.085 * stats.diag)) {
    return { shapeType: 'line', origin: start, current: end };
  }

  // Resample uniformly so reversal detection works regardless of drawing speed
  const uniform = resamplePolyline(pts, 48);
  const windowStep = 3;

  // Search for a sharp arrow tip reversal in the second half (standard: shaft then barb)
  let bestTipIdx = -1;
  let lowestCos = 1;
  const startSearch = Math.floor(uniform.length * 0.52);
  const endSearch = uniform.length - 3;

  for (let i = startSearch; i <= endSearch; i++) {
    const prevPt = uniform[Math.max(0, i - windowStep)];
    const tipPt = uniform[i];
    const nextPt = uniform[Math.min(uniform.length - 1, i + windowStep)];

    const vInX = tipPt.x - prevPt.x;
    const vInY = tipPt.y - prevPt.y;
    const vOutX = nextPt.x - tipPt.x;
    const vOutY = nextPt.y - tipPt.y;

    const mIn = Math.hypot(vInX, vInY);
    const mOut = Math.hypot(vOutX, vOutY);
    if (mIn < 2 || mOut < 2) continue;

    const cos = (vInX * vOutX + vInY * vOutY) / (mIn * mOut);
    if (cos < lowestCos) {
      lowestCos = cos;
      bestTipIdx = i;
    }
  }

  if (bestTipIdx !== -1 && lowestCos < 0.18) {
    const tipPt = uniform[bestTipIdx];
    const shaftLen = dist(start, tipPt);
    const tailEndDist = dist(tipPt, end);

    if (shaftLen >= 0.45 * stats.diag && tailEndDist >= 0.06 * stats.diag && tailEndDist <= 0.62 * shaftLen) {
      // Also verify the shaft start -> tip is reasonably directional (not a random closed loop)
      let maxShaftDev = 0;
      for (let j = 1; j < bestTipIdx; j++) {
        const d = pointToSegmentDist(uniform[j], start, tipPt);
        if (d > maxShaftDev) maxShaftDev = d;
      }
      if (maxShaftDev <= Math.max(16, 0.22 * shaftLen)) {
        return { shapeType: 'arrow', origin: start, current: tipPt };
      }
    }
  }

  // Fallback arrow check: user drew shaft cleanly and short turn at the very end without many tail points
  if (uniform.length >= 12) {
    const splitIdx = Math.floor(uniform.length * 0.72);
    const pivot = uniform[splitIdx];
    const vMain = { x: pivot.x - start.x, y: pivot.y - start.y };
    const vHead = { x: end.x - pivot.x, y: end.y - pivot.y };
    const m1 = Math.hypot(vMain.x, vMain.y);
    const m2 = Math.hypot(vHead.x, vHead.y);
    if (m1 > 0.45 * stats.diag && m2 > 0.05 * stats.diag && m2 < 0.55 * m1) {
      const cosAngle = (vMain.x * vHead.x + vMain.y * vHead.y) / (m1 * m2);
      if (cosAngle < -0.1) {
        // Pick furthest point along vMain direction as actual arrow tip
        let furthest = pivot;
        let maxProj = -Infinity;
        for (let i = splitIdx - 2; i < uniform.length; i++) {
          if (i < 0) continue;
          const proj = (uniform[i].x - start.x) * (vMain.x / m1) + (uniform[i].y - start.y) * (vMain.y / m1);
          if (proj > maxProj) {
            maxProj = proj;
            furthest = uniform[i];
          }
        }
        return { shapeType: 'arrow', origin: start, current: furthest };
      }
    }
  }

  return { shapeType: 'arc', origin: start, current: end };
}

/**
 * Intelligent freehand gesture recognizer supporting open primitives and closed geometric polygons/ellipses.
 */
export function recognizeShapeGesture(rawPoints: Point[]): RecognizedShapeResult {
  if (!rawPoints || rawPoints.length < 2) {
    const fallback = rawPoints?.[0] || { x: 0, y: 0 };
    return { shapeType: 'line', origin: fallback, current: fallback };
  }

  const pts = dedupePoints(rawPoints);
  if (pts.length < 2) {
    return { shapeType: 'line', origin: pts[0], current: pts[0] };
  }

  const stats = computeStats(pts);
  const start = pts[0];
  const end = pts[pts.length - 1];
  const chordDist = dist(start, end);

  if (pts.length === 2 || stats.diag < 6) {
    return { shapeType: 'line', origin: start, current: end };
  }

  // Compute cumulative signed angle sweep around bounding-box center
  const cx = (stats.minX + stats.maxX) / 2;
  const cy = (stats.minY + stats.maxY) / 2;
  let angularSweep = 0;
  let prevAng = Math.atan2(pts[0].y - cy, pts[0].x - cx);

  for (let i = 1; i < pts.length; i++) {
    const ang = Math.atan2(pts[i].y - cy, pts[i].x - cx);
    angularSweep += normalizeAngleDiff(ang - prevAng);
    prevAng = ang;
  }

  const closureRatio = chordDist / stats.diag;
  const lengthRatio = stats.totalLength / stats.diag;
  const absSweep = Math.abs(angularSweep);

  // Determine whether stroke represents a closed or nearly-closed shape
  const isClosed =
    (closureRatio <= 0.36 && lengthRatio >= 1.45) ||
    (absSweep >= 1.45 * Math.PI && closureRatio <= 0.5 && lengthRatio >= 1.85);

  if (!isClosed) {
    return recognizeOpenGesture(pts, stats);
  }

  // Trim minor overdrawn tail if stroke overshoots past the start point
  let workingPts = [...pts];
  if (absSweep > 2.02 * Math.PI && workingPts.length > 10) {
    const tailStart = Math.floor(workingPts.length * 0.72);
    let closestIdx = -1;
    let minCloseDist = chordDist;
    for (let i = tailStart; i < workingPts.length - 1; i++) {
      const d = dist(workingPts[i], start);
      if (d < minCloseDist) {
        minCloseDist = d;
        closestIdx = i;
      }
    }
    if (closestIdx !== -1 && minCloseDist < 0.14 * stats.diag && minCloseDist < 0.55 * chordDist) {
      workingPts = workingPts.slice(0, closestIdx + 1);
    }
  }

  const loopBase = dist(workingPts[0], workingPts[workingPts.length - 1]) > 1
    ? [...workingPts, workingPts[0]]
    : [...workingPts];

  const loopStats = computeStats(workingPts);
  const resampled = resamplePolyline(loopBase, 73);
  const samples = resampled.slice(0, 72); // 72 cyclic points around closed contour

  const area = computePolygonArea(samples);
  const perimeter = loopBase.reduce((acc, p, i) => (i > 0 ? acc + dist(loopBase[i - 1], p) : 0), 0);
  const isoperimetric = perimeter > 1e-6 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;

  const pca = computePcaFrame(samples);
  const orientedArea = pca.ow * pca.oh;
  const orientedFillRatio = orientedArea > 1e-6 ? area / orientedArea : 0;
  const ellipseErr = computeEllipseFitError(pca, loopStats.diag);

  const rawRdpVerts = simplifyClosedPolygonRDP(samples, 0.048 * loopStats.diag);
  const mergedVerts = mergePolygonVertices(rawRdpVerts, loopStats.diag);

  // Also test slightly coarser tolerance for hand-drawn polygons with slight bowing
  const coarseVerts = mergePolygonVertices(
    simplifyClosedPolygonRDP(samples, 0.065 * loopStats.diag),
    loopStats.diag
  );

  // Compute best 3-gon and 4-gon geometric errors on the same normalized scale as ellipseErr.rms
  const triCandidate =
    mergedVerts.length === 3
      ? mergedVerts
      : coarseVerts.length === 3
      ? coarseVerts
      : mergedVerts.length >= 3
      ? reducePolygonToK(mergedVerts, 3)
      : null;

  const quadCandidate =
    mergedVerts.length === 4
      ? mergedVerts
      : coarseVerts.length === 4
      ? coarseVerts
      : mergedVerts.length >= 4
      ? reducePolygonToK(mergedVerts, 4)
      : null;

  const poly3Err = triCandidate ? computePolygonFitError(samples, triCandidate, loopStats.diag) : { rms: 1, max: 1 };
  const poly4Err = quadCandidate ? computePolygonFitError(samples, quadCandidate, loopStats.diag) : { rms: 1, max: 1 };

  // 1. Triangle Classification
  const looksLikeTriangle =
    triCandidate !== null &&
    (mergedVerts.length === 3 || coarseVerts.length === 3) &&
    poly3Err.rms <= 0.048 &&
    poly3Err.max <= 0.115 &&
    orientedFillRatio <= 0.72 &&
    poly3Err.rms < ellipseErr.rms * 1.15;

  if (looksLikeTriangle && triCandidate) {
    return {
      shapeType: classifyTriangle(triCandidate, loopStats),
      origin: { x: loopStats.minX, y: loopStats.minY },
      current: { x: loopStats.maxX, y: loopStats.maxY },
      rotation: 0,
    };
  }

  // 2. Smoothness guard for clearly circular / elliptical shapes
  const isStronglyCircular =
    isoperimetric >= 0.915 &&
    ellipseErr.rms <= 0.025 &&
    rawRdpVerts.length >= 6 &&
    orientedFillRatio >= 0.72 &&
    orientedFillRatio <= 0.84;

  // 3. Quadrilateral Classification (must strictly precede circle/ellipse to prevent square -> circle confusion)
  const looksLikeQuad =
    !isStronglyCircular &&
    quadCandidate !== null &&
    (
      // Dominant 4 vertices with tight quad fit compared to ellipse fit
      ((mergedVerts.length === 4 || coarseVerts.length === 4) &&
        poly4Err.rms <= 0.05 &&
        poly4Err.max <= 0.12 &&
        (poly4Err.rms <= ellipseErr.rms * 1.25 || orientedFillRatio >= 0.855 || ellipseErr.radialMaxDev >= 0.2)) ||
      // High bounding-box fill ratio (> 0.855 indicates straight edges/corners vs pi/4 = 0.785 for ellipse)
      (orientedFillRatio >= 0.855 && poly4Err.rms <= 0.055 && rawRdpVerts.length <= 7)
    );

  if (looksLikeQuad && quadCandidate) {
    return classifyQuadrilateral(quadCandidate, loopStats, pca);
  }

  // 4. Circle vs Ellipse
  const axisRatio = loopStats.width / loopStats.height;
  const pcaRatio = Math.max(pca.ow, pca.oh) / Math.max(1, Math.min(pca.ow, pca.oh));

  if (pcaRatio <= 1.28 && axisRatio >= 0.76 && axisRatio <= 1.32) {
    return {
      shapeType: 'circle',
      origin: { x: loopStats.minX, y: loopStats.minY },
      current: { x: loopStats.maxX, y: loopStats.maxY },
      rotation: 0,
    };
  }

  // Tilted ellipse support when strongly elongated at a diagonal angle
  const angleMod90 = ((Math.abs(pca.angleDeg) % 90) + 90) % 90;
  const isDiagonalEllipse = pcaRatio > 1.35 && Math.min(angleMod90, 90 - angleMod90) > 20;
  if (isDiagonalEllipse) {
    return {
      shapeType: 'ellipse',
      origin: { x: pca.cx - pca.ow / 2, y: pca.cy - pca.oh / 2 },
      current: { x: pca.cx + pca.ow / 2, y: pca.cy + pca.oh / 2 },
      rotation: Math.round(pca.angleDeg / 5) * 5,
    };
  }

  return {
    shapeType: 'ellipse',
    origin: { x: loopStats.minX, y: loopStats.minY },
    current: { x: loopStats.maxX, y: loopStats.maxY },
    rotation: 0,
  };
}

