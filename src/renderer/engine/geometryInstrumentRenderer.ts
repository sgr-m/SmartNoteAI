/**
 * Geometry Instrument Renderer
 * Dedicated high-fidelity canvas renderers for educational mathematical instruments:
 * - Classroom Ruler (cm & mm units, calibration marks, acrylic bevel)
 * - 180° Protractor (dual degree scales, center origin, angle ray)
 * - Geometric Compass (sweep arc, radius readout, legs & pencil)
 * - Cartesian Coordinate Plane (axes, arrows, grid, numbered ticks, origin)
 *
 * Used by both live WhiteboardCanvas / DrawingEngine and DocumentExportService for 100% fidelity.
 */

import { ShapeObject } from '../../shared/types';
import { renderCartesian3DPlane } from './subjectShapeRenderer';

export function isGeometryInstrument(shapeType: string): boolean {
  return (
    shapeType === 'ruler' ||
    shapeType === 'protractor' ||
    shapeType === 'compass' ||
    shapeType === 'cartesianAxes' ||
    shapeType === 'cartesian3DPlane'
  );
}

/**
 * Renders calibrated classroom ruler with centimeter and millimeter markings
 */
export function renderRuler(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1
): void {
  const s = Math.max(0.5, scale);
  const dpr = 1;
  const rLen = Math.max(100, w);
  const rH = Math.max(40, h);

  ctx.save();
  ctx.globalAlpha = 1;

  // 1. Acrylic Translucent Ruler Body with Gloss Reflection
  const radius = 8;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, rLen, rH, radius);
  } else {
    ctx.rect(x, y, rLen, rH);
  }
  ctx.fillStyle = 'rgba(248, 250, 252, 0.90)';
  ctx.fill();

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Subtle top reflection shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(x + 4, y + 2, rLen - 8, 3);

  // 2. Calibrated Centimeter and Millimeter Ticks
  const pxPerCm = 32;
  const totalCm = Math.floor((rLen - 44) / pxPerCm);
  const startX = x + 24;

  // Unit Emblem at the start
  const unitFont = 12;
  ctx.font = `bold ${unitFont}px Inter, sans-serif`;
  ctx.fillStyle = '#0369a1';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('cm', x + 12, y + 22);

  // Number font for 0, 1, 2, 3...
  const numFont = 12;
  ctx.font = `600 ${numFont}px Inter, sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#0f172a';

  const mmTickLen = 6;
  const halfCmTickLen = 11;
  const cmTickLen = 17;

  for (let cm = 0; cm <= totalCm; cm++) {
    const cmX = startX + cm * pxPerCm;
    if (cmX > x + rLen - 10) break;

    // Centimeter major tick
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cmX, y);
    ctx.lineTo(cmX, y + cmTickLen);
    ctx.stroke();

    // Number label
    ctx.fillText(String(cm), cmX, y + cmTickLen + 9);

    // Millimeter sub-ticks (1 to 9)
    if (cm < totalCm) {
      ctx.lineWidth = 0.8;
      for (let mm = 1; mm <= 9; mm++) {
        const mmX = cmX + (mm * pxPerCm) / 10;
        if (mmX > x + rLen - 8) break;
        const tLen = mm === 5 ? halfCmTickLen : mmTickLen;
        ctx.beginPath();
        ctx.moveTo(mmX, y);
        ctx.lineTo(mmX, y + tLen);
        ctx.stroke();
      }
    }
  }

  // Ruler brand watermark
  const brandFont = 10;
  ctx.font = `500 ${brandFont}px Inter, sans-serif`;
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText(`SmartNoteAI • ${totalCm} cm`, x + rLen - 16, y + rH - 12);

  ctx.restore();
}

/**
 * Renders 180° Classroom Protractor with dual degree scales
 */
export function renderProtractor(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1
): void {
  const radius = Math.min(w / 2, h);
  const cx = x + w / 2;
  const cy = y + radius; // baseline is at bottom of semicircle

  ctx.save();
  ctx.globalAlpha = 1;

  // 1. Semi-Circular Frosted Acrylic Protractor Body
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, 0, false);
  ctx.closePath();
  ctx.fillStyle = 'rgba(224, 242, 254, 0.78)';
  ctx.fill();

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center cutout semicircle
  const innerRadius = radius * 0.32;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, Math.PI, 0, false);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(2, 132, 199, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Origin crosshair at center
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy);
  ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy);
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0369a1';
  ctx.fill();

  // 2. Dual Degree Scales (0..180 and 180..0)
  const tickFont = 10;
  ctx.font = `600 ${tickFont}px Inter, sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const outerTickR = radius;
  const majorTickLen = 14;
  const midTickLen = 9;
  const minorTickLen = 5;

  for (let deg = 0; deg <= 180; deg++) {
    const rad = Math.PI - (deg * Math.PI) / 180; // 0 on right, 180 on left
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const isMajor = deg % 10 === 0;
    const isMid = deg % 5 === 0 && !isMajor;
    const tLen = isMajor ? majorTickLen : isMid ? midTickLen : minorTickLen;

    // Tick line
    ctx.beginPath();
    ctx.moveTo(cx + outerTickR * cos, cy - outerTickR * sin);
    ctx.lineTo(cx + (outerTickR - tLen) * cos, cy - (outerTickR - tLen) * sin);
    ctx.strokeStyle = isMajor ? '#0f172a' : '#64748b';
    ctx.lineWidth = isMajor ? 1.4 : 0.8;
    ctx.stroke();

    // Outer Scale numbers every 10 degrees (0 -> 180)
    if (isMajor && deg >= 10 && deg <= 170) {
      const textR = outerTickR - majorTickLen - 10;
      ctx.fillStyle = '#0f172a';
      ctx.fillText(String(deg), cx + textR * cos, cy - textR * sin);

      // Inner Scale numbers every 10 degrees (180 -> 0)
      const innerTextR = outerTickR - majorTickLen - 22;
      ctx.fillStyle = '#0284c7';
      ctx.fillText(String(180 - deg), cx + innerTextR * cos, cy - innerTextR * sin);
    }
  }

  // 3. Central Angle Demonstration Ray (showing 60 degrees)
  const demoAngleDeg = 60;
  const demoRad = Math.PI - (demoAngleDeg * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + radius * 0.92 * Math.cos(demoRad), cy - radius * 0.92 * Math.sin(demoRad));
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Angle Arc
  const arcR = radius * 0.45;
  ctx.beginPath();
  ctx.arc(cx, cy, arcR, Math.PI, demoRad, true);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = `bold 12px Inter, sans-serif`;
  ctx.fillStyle = '#dc2626';
  ctx.fillText('60°', cx + arcR * 1.25 * Math.cos(Math.PI - (30 * Math.PI) / 180), cy - arcR * 1.25 * Math.sin(Math.PI - (30 * Math.PI) / 180));

  // Protractor Label
  ctx.font = `bold 11px Inter, sans-serif`;
  ctx.fillStyle = '#0369a1';
  ctx.fillText('180° Classroom Protractor', cx, cy - radius * 0.16);

  ctx.restore();
}

/**
 * Renders geometric drawing compass with needle and pencil legs
 */
export function renderCompass(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1
): void {
  const topX = x + w / 2;
  const topY = y + 16;
  const needleX = x + 20;
  const needleY = y + h - 10;
  const pencilX = x + w - 20;
  const pencilY = y + h - 10;

  ctx.save();
  ctx.globalAlpha = 1;

  // 1. Swept Circle Arc drawn by compass
  const radiusDoc = Math.abs(pencilX - needleX);
  ctx.beginPath();
  ctx.arc(needleX, needleY, radiusDoc, -Math.PI * 0.4, 0.1, false);
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Calibrated Radius Dimension Line & Readout
  ctx.beginPath();
  ctx.moveTo(needleX, needleY);
  ctx.lineTo(pencilX, pencilY);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const radiusCm = (radiusDoc / 32).toFixed(1);
  const midX = (needleX + pencilX) / 2;
  const midY = needleY - 8;
  ctx.font = `bold 13px Inter, sans-serif`;
  ctx.fillStyle = '#0284c7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`r = ${radiusCm} cm`, midX, midY);

  // 3. Top Knurled Hinge Knob
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(topX, topY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Central brass hinge screw
  ctx.beginPath();
  ctx.arc(topX, topY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();

  // 4. Left Leg (Steel Needle Leg)
  ctx.beginPath();
  ctx.moveTo(topX - 3, topY);
  ctx.lineTo(needleX + 3, needleY - 14);
  ctx.lineTo(needleX, needleY);
  ctx.lineTo(needleX - 3, needleY - 14);
  ctx.closePath();
  ctx.fillStyle = '#94a3b8';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Needle point dot
  ctx.beginPath();
  ctx.arc(needleX, needleY, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  // 5. Right Leg (Pencil Holder & Graphite Tip)
  ctx.beginPath();
  ctx.moveTo(topX + 3, topY);
  ctx.lineTo(pencilX + 6, pencilY - 26);
  ctx.lineTo(pencilX - 6, pencilY - 26);
  ctx.closePath();
  ctx.fillStyle = '#94a3b8';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Yellow wooden pencil inserted in clamp
  ctx.beginPath();
  ctx.moveTo(pencilX - 4, pencilY - 28);
  ctx.lineTo(pencilX + 4, pencilY - 28);
  ctx.lineTo(pencilX + 4, pencilY - 8);
  ctx.lineTo(pencilX, pencilY);
  ctx.lineTo(pencilX - 4, pencilY - 8);
  ctx.closePath();
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Lead tip
  ctx.beginPath();
  ctx.moveTo(pencilX - 2, pencilY - 4);
  ctx.lineTo(pencilX + 2, pencilY - 4);
  ctx.lineTo(pencilX, pencilY);
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  ctx.restore();
}

/**
 * Renders Cartesian coordinate plane with grid lines, directional arrowheads, ticks, and labels
 */
export function renderCartesianAxes(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1
): void {
  const strokeColor = shape.strokeColor || '#38bdf8';

  ctx.save();
  ctx.globalAlpha = 1;

  // 0. Frosted Slate Cartesian Board Panel Background
  const boardRadius = 14;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, boardRadius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fillStyle =
    shape.fillColor && shape.fillColor !== 'transparent'
      ? shape.fillColor
      : 'rgba(15, 23, 42, 0.92)';
  ctx.fill();

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Board Header Title Badge
  ctx.font = `600 12px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const xMin = shape.params?.xMin ?? -5;
  const xMax = shape.params?.xMax ?? 5;
  const yMin = shape.params?.yMin ?? -5;
  const yMax = shape.params?.yMax ?? 5;
  const step = Math.max(0.5, shape.params?.step ?? 1);
  const showGrid = shape.params?.showGrid !== false;
  const showDots = shape.params?.showDots !== false;

  ctx.fillText(
    `📈 Cartesian Coordinate Plane (X: [${xMin}, ${xMax}], Y: [${yMin}, ${yMax}])`,
    x + 16,
    y + 14
  );

  // Plot margins
  const padL = 46;
  const padR = 46;
  const padT = 44;
  const padB = 44;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const plotX = x + padL;
  const plotY = y + padT;

  const rangeX = Math.max(1, xMax - xMin);
  const rangeY = Math.max(1, yMax - yMin);

  const mapX = (val: number) => plotX + ((val - xMin) / rangeX) * plotW;
  const mapY = (val: number) => plotY + plotH - ((val - yMin) / rangeY) * plotH;

  const originX = mapX(0);
  const originY = mapY(0);

  // 1. Grid Mesh Lines
  if (showGrid) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.20)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (let vx = Math.ceil(xMin / step) * step; vx <= xMax; vx += step) {
      if (Math.abs(vx) < 1e-6) continue;
      const gx = mapX(vx);
      ctx.beginPath();
      ctx.moveTo(gx, plotY);
      ctx.lineTo(gx, plotY + plotH);
      ctx.stroke();
    }

    for (let vy = Math.ceil(yMin / step) * step; vy <= yMax; vy += step) {
      if (Math.abs(vy) < 1e-6) continue;
      const gy = mapY(vy);
      ctx.beginPath();
      ctx.moveTo(plotX, gy);
      ctx.lineTo(plotX + plotW, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 2. Coordinate Point Dots
  if (showDots) {
    ctx.fillStyle = '#38bdf8';
    for (let vx = Math.ceil(xMin / step) * step; vx <= xMax; vx += step) {
      for (let vy = Math.ceil(yMin / step) * step; vy <= yMax; vy += step) {
        if (Math.abs(vx) < 1e-6 && Math.abs(vy) < 1e-6) continue;
        const px = mapX(vx);
        const py = mapY(vy);
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3. Main Axes with Directional Arrowheads
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = 2.5;
  const arrowSize = 10;

  const axisY = Math.max(plotY, Math.min(plotY + plotH, originY));
  const axisX = Math.max(plotX, Math.min(plotX + plotW, originX));

  // X Axis
  ctx.beginPath();
  ctx.moveTo(plotX - 12, axisY);
  ctx.lineTo(plotX + plotW + 12, axisY);
  ctx.stroke();

  // Arrowhead on +X
  ctx.beginPath();
  ctx.moveTo(plotX + plotW + 16, axisY);
  ctx.lineTo(plotX + plotW + 16 - arrowSize, axisY - arrowSize * 0.45);
  ctx.lineTo(plotX + plotW + 16 - arrowSize, axisY + arrowSize * 0.45);
  ctx.closePath();
  ctx.fill();

  // Arrowhead on -X (if xMin < 0)
  if (xMin < 0) {
    ctx.beginPath();
    ctx.moveTo(plotX - 16, axisY);
    ctx.lineTo(plotX - 16 + arrowSize, axisY - arrowSize * 0.45);
    ctx.lineTo(plotX - 16 + arrowSize, axisY + arrowSize * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  // Y Axis
  ctx.beginPath();
  ctx.moveTo(axisX, plotY + plotH + 12);
  ctx.lineTo(axisX, plotY - 12);
  ctx.stroke();

  // Arrowhead on +Y
  ctx.beginPath();
  ctx.moveTo(axisX, plotY - 16);
  ctx.lineTo(axisX - arrowSize * 0.45, plotY - 16 + arrowSize);
  ctx.lineTo(axisX + arrowSize * 0.45, plotY - 16 + arrowSize);
  ctx.closePath();
  ctx.fill();

  // Arrowhead on -Y (if yMin < 0)
  if (yMin < 0) {
    ctx.beginPath();
    ctx.moveTo(axisX, plotY + plotH + 16);
    ctx.lineTo(axisX - arrowSize * 0.45, plotY + plotH + 16 - arrowSize);
    ctx.lineTo(axisX + arrowSize * 0.45, plotY + plotH + 16 - arrowSize);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Numbered Ticks along X and Y
  ctx.font = `600 11px Inter, sans-serif`;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.8;
  const tickHalf = 5;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let vx = Math.ceil(xMin / step) * step; vx <= xMax; vx += step) {
    if (Math.abs(vx) < 1e-6) continue;
    const tx = mapX(vx);
    ctx.beginPath();
    ctx.moveTo(tx, axisY - tickHalf);
    ctx.lineTo(tx, axisY + tickHalf);
    ctx.stroke();
    ctx.fillText(String(vx), tx, axisY + tickHalf + 4);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let vy = Math.ceil(yMin / step) * step; vy <= yMax; vy += step) {
    if (Math.abs(vy) < 1e-6) continue;
    const ty = mapY(vy);
    ctx.beginPath();
    ctx.moveTo(axisX - tickHalf, ty);
    ctx.lineTo(axisX + tickHalf, ty);
    ctx.stroke();
    ctx.fillText(String(vy), axisX - tickHalf - 5, ty);
  }

  // 5. Origin (0,0) indicator
  if (originX >= plotX && originX <= plotX + plotW && originY >= plotY && originY <= plotY + plotH) {
    ctx.beginPath();
    ctx.arc(originX, originY, 3.8, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = `bold 11px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('O(0,0)', originX - 6, originY + 6);
  }

  // 6. Axis Labels "x" and "y"
  ctx.font = `bold italic 15px 'Cambria Math', Georgia, serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('x', plotX + plotW + 20, axisY);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('y', axisX, plotY - 18);

  ctx.restore();
}

/**
 * Universal dispatcher for geometry instruments
 */
export function renderGeometryInstrument(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1
): boolean {
  switch (shape.shapeType) {
    case 'ruler':
      renderRuler(ctx, shape, x, y, w, h, scale);
      return true;
    case 'protractor':
      renderProtractor(ctx, shape, x, y, w, h, scale);
      return true;
    case 'compass':
      renderCompass(ctx, shape, x, y, w, h, scale);
      return true;
    case 'cartesianAxes':
      renderCartesianAxes(ctx, shape, x, y, w, h, scale);
      return true;
    case 'cartesian3DPlane':
      renderCartesian3DPlane(ctx, shape, x, y, w, h, scale);
      return true;
    default:
      return false;
  }
}

