/**
 * Subject Shape Renderer
 * Vector graphic rendering engine for all subject-specific teaching shapes and diagrams.
 * Used by both live DrawingEngine and documentExportService for 100% visual fidelity.
 */

import { ShapeObject } from '../../shared/types';
import { compileMathFunction, evaluateMathFunction } from '../services/subjectModules/mathFunctionParser';
import { PERIODIC_ELEMENTS, ChemicalElement } from '../services/subjectModules/chemistryModule';
import { getSolid3DModel, transform3D, projectTo2D, Solid3DType } from './geometry3DMath';

export function isSubjectShape(shapeType: string): boolean {
  return [
    'setSquare45',
    'setSquare30',
    'angleMeasurement',
    'cartesianAxes',
    'numberLine',
    'functionPlot',
    'geometry3D',
    'circuitComponent',
    'physicsDiagram',
    'periodicElement',
    'atomicModel',
    'labApparatus',
    'flowchartNode',
    'csDiagram',
    'logicGate',
    'truthTable',
    'karnaughMap',
    'teachingTemplate',
  ].includes(shapeType);
}

export function renderSubjectShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr = 1
): void {
  ctx.save();

  switch (shape.shapeType) {
    case 'setSquare45':
      renderSetSquare45(ctx, shape, x, y, w, h, dpr);
      break;
    case 'setSquare30':
      renderSetSquare30(ctx, shape, x, y, w, h, dpr);
      break;
    case 'angleMeasurement':
      renderAngleMeasurement(ctx, shape, x, y, w, h, dpr);
      break;
    case 'cartesianAxes':
      renderCartesianAxes(ctx, shape, x, y, w, h, dpr);
      break;
    case 'numberLine':
      renderNumberLine(ctx, shape, x, y, w, h, dpr);
      break;
    case 'functionPlot':
      renderFunctionPlot(ctx, shape, x, y, w, h, dpr);
      break;
    case 'geometry3D':
      renderGeometry3D(ctx, shape, x, y, w, h, dpr);
      break;
    case 'circuitComponent':
      renderCircuitComponent(ctx, shape, x, y, w, h, dpr);
      break;
    case 'physicsDiagram':
      renderPhysicsDiagram(ctx, shape, x, y, w, h, dpr);
      break;
    case 'periodicElement':
      renderPeriodicElement(ctx, shape, x, y, w, h, dpr);
      break;
    case 'atomicModel':
      renderAtomicModel(ctx, shape, x, y, w, h, dpr);
      break;
    case 'labApparatus':
      renderLabApparatus(ctx, shape, x, y, w, h, dpr);
      break;
    case 'flowchartNode':
      renderFlowchartNode(ctx, shape, x, y, w, h, dpr);
      break;
    case 'csDiagram':
      renderCSDiagram(ctx, shape, x, y, w, h, dpr);
      break;
    case 'logicGate':
      renderLogicGate(ctx, shape, x, y, w, h, dpr);
      break;
    case 'truthTable':
      renderTruthTable(ctx, shape, x, y, w, h, dpr);
      break;
    case 'karnaughMap':
      renderKarnaughMap(ctx, shape, x, y, w, h, dpr);
      break;
    case 'teachingTemplate':
      renderTeachingTemplate(ctx, shape, x, y, w, h, dpr);
      break;
  }

  ctx.restore();
}

// ─── 1. Mathematics Renderers ─────────────────────────────────────────────────

function renderSetSquare45(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const strokeColor = shape.strokeColor || '#0284c7';
  ctx.fillStyle = shape.fillColor || 'rgba(240, 249, 255, 0.85)';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = (shape.strokeWidth || 2) * dpr;

  // Outer 45°-45°-90° Triangle
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hollow Inner Cutout (leave 42px margin for ruler scales)
  const pad = 42 * dpr;
  if (w > pad * 2.2 && h > pad * 2.2) {
    ctx.beginPath();
    ctx.moveTo(x + pad, y + h - pad);
    ctx.lineTo(x + w - pad * 1.8, y + h - pad);
    ctx.lineTo(x + pad, y + pad * 1.8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.fill();
    ctx.stroke();
  }

  // Right-angle square indicator at (x, y+h)
  const sq = 16 * dpr;
  ctx.beginPath();
  ctx.moveTo(x, y + h - sq);
  ctx.lineTo(x + sq, y + h - sq);
  ctx.lineTo(x + sq, y + h);
  ctx.stroke();

  // Angle Labels
  ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = strokeColor;
  ctx.textAlign = 'left';
  ctx.fillText('45°', x + w - 48 * dpr, y + h - 14 * dpr);
  ctx.fillText('45°', x + 14 * dpr, y + 42 * dpr);

  // ─── Metric Units of Measurement (cm & mm graduations) ─────────────────────
  const pxPerCm = 24 * dpr;
  const pxPerMm = pxPerCm / 10;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;

  // 1. Horizontal Base Ruler (along y + h, moving from left to right)
  const startX = x + 16 * dpr;
  const maxCmX = Math.floor((w - 48 * dpr) / pxPerCm);

  // Unit Label "cm"
  ctx.font = `bold ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('cm', startX - 8 * dpr, y + h - 14 * dpr);

  for (let c = 0; c <= maxCmX; c++) {
    const cmX = startX + c * pxPerCm;

    // Major cm Tick
    ctx.lineWidth = 1.6 * dpr;
    ctx.beginPath();
    ctx.moveTo(cmX, y + h);
    ctx.lineTo(cmX, y + h - 12 * dpr);
    ctx.stroke();

    // Number label
    ctx.font = `600 ${Math.max(8, Math.round(9.5 * dpr))}px Inter, sans-serif`;
    ctx.fillText(String(c), cmX, y + h - 15 * dpr);

    // Millimeter sub-ticks
    if (c < maxCmX) {
      for (let m = 1; m < 10; m++) {
        const mmX = cmX + m * pxPerMm;
        const isHalf = m === 5;
        const tickLen = isHalf ? 8 * dpr : 4.5 * dpr;
        ctx.lineWidth = (isHalf ? 1.2 : 0.8) * dpr;
        ctx.beginPath();
        ctx.moveTo(mmX, y + h);
        ctx.lineTo(mmX, y + h - tickLen);
        ctx.stroke();
      }
    }
  }

  // 2. Vertical Leg Ruler (along x, moving from bottom to top)
  const startY = y + h - 16 * dpr;
  const maxCmY = Math.floor((h - 48 * dpr) / pxPerCm);

  // Unit Label "cm"
  ctx.font = `bold ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('cm', x + 14 * dpr, startY + 8 * dpr);

  for (let c = 0; c <= maxCmY; c++) {
    const cmY = startY - c * pxPerCm;

    // Major cm Tick
    ctx.lineWidth = 1.6 * dpr;
    ctx.beginPath();
    ctx.moveTo(x, cmY);
    ctx.lineTo(x + 12 * dpr, cmY);
    ctx.stroke();

    // Number label
    ctx.font = `600 ${Math.max(8, Math.round(9.5 * dpr))}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(String(c), x + 15 * dpr, cmY + 3.5 * dpr);

    // Millimeter sub-ticks
    if (c < maxCmY) {
      for (let m = 1; m < 10; m++) {
        const mmY = startY - (c * pxPerCm + m * pxPerMm);
        const isHalf = m === 5;
        const tickLen = isHalf ? 8 * dpr : 4.5 * dpr;
        ctx.lineWidth = (isHalf ? 1.2 : 0.8) * dpr;
        ctx.beginPath();
        ctx.moveTo(x, mmY);
        ctx.lineTo(x + tickLen, mmY);
        ctx.stroke();
      }
    }
  }
}

function renderSetSquare30(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const strokeColor = shape.strokeColor || '#0284c7';
  ctx.fillStyle = shape.fillColor || 'rgba(240, 249, 255, 0.85)';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = (shape.strokeWidth || 2) * dpr;

  // Outer 30°-60°-90° Triangle (Base w, Height h)
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hollow Inner Cutout
  const pad = 38 * dpr;
  if (w > pad * 2.2 && h > pad * 2.2) {
    ctx.beginPath();
    ctx.moveTo(x + pad, y + h - pad);
    ctx.lineTo(x + w - pad * 1.6, y + h - pad);
    ctx.lineTo(x + pad, y + pad * 2.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.fill();
    ctx.stroke();
  }

  // Right-angle square indicator at (x, y+h)
  const sq = 16 * dpr;
  ctx.beginPath();
  ctx.moveTo(x, y + h - sq);
  ctx.lineTo(x + sq, y + h - sq);
  ctx.lineTo(x + sq, y + h);
  ctx.stroke();

  // Angle Labels
  ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = strokeColor;
  ctx.textAlign = 'left';
  ctx.fillText('30°', x + 14 * dpr, y + 42 * dpr);
  ctx.fillText('60°', x + w - 44 * dpr, y + h - 14 * dpr);

  // ─── Metric Units of Measurement (cm & mm graduations) ─────────────────────
  const pxPerCm = 24 * dpr;
  const pxPerMm = pxPerCm / 10;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;

  // 1. Horizontal Base Ruler (along y + h)
  const startX = x + 16 * dpr;
  const maxCmX = Math.floor((w - 44 * dpr) / pxPerCm);

  // Unit Label "cm"
  ctx.font = `bold ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('cm', startX - 8 * dpr, y + h - 14 * dpr);

  for (let c = 0; c <= maxCmX; c++) {
    const cmX = startX + c * pxPerCm;

    ctx.lineWidth = 1.6 * dpr;
    ctx.beginPath();
    ctx.moveTo(cmX, y + h);
    ctx.lineTo(cmX, y + h - 12 * dpr);
    ctx.stroke();

    ctx.font = `600 ${Math.max(8, Math.round(9.5 * dpr))}px Inter, sans-serif`;
    ctx.fillText(String(c), cmX, y + h - 15 * dpr);

    if (c < maxCmX) {
      for (let m = 1; m < 10; m++) {
        const mmX = cmX + m * pxPerMm;
        const isHalf = m === 5;
        const tickLen = isHalf ? 8 * dpr : 4.5 * dpr;
        ctx.lineWidth = (isHalf ? 1.2 : 0.8) * dpr;
        ctx.beginPath();
        ctx.moveTo(mmX, y + h);
        ctx.lineTo(mmX, y + h - tickLen);
        ctx.stroke();
      }
    }
  }

  // 2. Vertical Height Ruler (along x)
  const startY = y + h - 16 * dpr;
  const maxCmY = Math.floor((h - 48 * dpr) / pxPerCm);

  ctx.font = `bold ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('cm', x + 14 * dpr, startY + 8 * dpr);

  for (let c = 0; c <= maxCmY; c++) {
    const cmY = startY - c * pxPerCm;

    ctx.lineWidth = 1.6 * dpr;
    ctx.beginPath();
    ctx.moveTo(x, cmY);
    ctx.lineTo(x + 12 * dpr, cmY);
    ctx.stroke();

    ctx.font = `600 ${Math.max(8, Math.round(9.5 * dpr))}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(String(c), x + 15 * dpr, cmY + 3.5 * dpr);

    if (c < maxCmY) {
      for (let m = 1; m < 10; m++) {
        const mmY = startY - (c * pxPerCm + m * pxPerMm);
        const isHalf = m === 5;
        const tickLen = isHalf ? 8 * dpr : 4.5 * dpr;
        ctx.lineWidth = (isHalf ? 1.2 : 0.8) * dpr;
        ctx.beginPath();
        ctx.moveTo(x, mmY);
        ctx.lineTo(x + tickLen, mmY);
        ctx.stroke();
      }
    }
  }
}

function renderAngleMeasurement(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const angle = shape.params?.angle ?? 60;
  const strokeColor = shape.strokeColor || '#38bdf8';
  const strokeWidth = (shape.strokeWidth || 2.5) * dpr;

  // Adapt vertex position based on angle range
  let vx: number;
  let vy: number;
  let armLen: number;

  if (angle <= 90) {
    vx = x + 36 * dpr;
    vy = y + h - 36 * dpr;
    armLen = Math.min(w - 60 * dpr, h - 60 * dpr);
  } else if (angle <= 180) {
    vx = x + w / 2;
    vy = y + h - 36 * dpr;
    armLen = Math.min(w / 2 - 30 * dpr, h - 60 * dpr);
  } else {
    // Reflex angle (180° - 360°)
    vx = x + w / 2;
    vy = y + h / 2;
    armLen = Math.min(w / 2 - 30 * dpr, h / 2 - 30 * dpr);
  }
  armLen = Math.max(50 * dpr, armLen);

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = strokeWidth;

  // 1. Base Ray (0 degrees, horizontal pointing right)
  ctx.beginPath();
  ctx.moveTo(vx, vy);
  ctx.lineTo(vx + armLen, vy);
  ctx.stroke();

  // Arrowhead on base ray
  const arrowSize = 8 * dpr;
  ctx.beginPath();
  ctx.moveTo(vx + armLen + arrowSize, vy);
  ctx.lineTo(vx + armLen, vy - arrowSize * 0.45);
  ctx.lineTo(vx + armLen, vy + arrowSize * 0.45);
  ctx.closePath();
  ctx.fill();

  // 2. Angled Ray (angle in degrees)
  const rad = (angle * Math.PI) / 180;
  const rx = vx + armLen * Math.cos(rad);
  const ry = vy - armLen * Math.sin(rad);

  ctx.beginPath();
  ctx.moveTo(vx, vy);
  ctx.lineTo(rx, ry);
  ctx.stroke();

  // Arrowhead on angled ray
  if (angle > 0) {
    const tipX = rx + arrowSize * Math.cos(rad);
    const tipY = ry - arrowSize * Math.sin(rad);
    const leftX = rx + arrowSize * 0.45 * Math.cos(rad + Math.PI / 2);
    const leftY = ry - arrowSize * 0.45 * Math.sin(rad + Math.PI / 2);
    const rightX = rx + arrowSize * 0.45 * Math.cos(rad - Math.PI / 2);
    const rightY = ry - arrowSize * 0.45 * Math.sin(rad - Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Angle Arc or 90° Square Box
  const arcR = Math.min(armLen * 0.45, 46 * dpr);
  ctx.lineWidth = 2 * dpr;
  ctx.strokeStyle = '#f59e0b';
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';

  if (angle === 90) {
    const sq = 18 * dpr;
    ctx.beginPath();
    ctx.rect(vx, vy - sq, sq, sq);
    ctx.fill();
    ctx.stroke();
  } else if (angle > 0 && angle < 360) {
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.arc(vx, vy, arcR, 0, -rad, true);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(vx, vy, arcR, 0, -rad, true);
    ctx.stroke();
  } else if (angle === 360) {
    ctx.beginPath();
    ctx.arc(vx, vy, arcR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 4. Vertex point
  ctx.beginPath();
  ctx.arc(vx, vy, 4.5 * dpr, 0, Math.PI * 2);
  ctx.fillStyle = strokeColor;
  ctx.fill();

  // 5. Angle Label
  ctx.font = `bold ${Math.max(12, Math.round(13 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const labelDist = arcR + 20 * dpr;
  const midRad = -rad / 2;
  const lx = vx + labelDist * Math.cos(midRad);
  const ly = vy + labelDist * Math.sin(midRad);

  const displayLabel = shape.params?.label || (angle === 90 ? '90°' : `θ = ${angle}°`);
  ctx.fillText(displayLabel, lx, ly);
}

export function renderCartesianAxes(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr = 1
): void {
  const strokeColor = shape.strokeColor || '#38bdf8';
  const xMin = shape.params?.xMin ?? -5;
  const xMax = shape.params?.xMax ?? 5;
  const yMin = shape.params?.yMin ?? -5;
  const yMax = shape.params?.yMax ?? 5;
  const step = Math.max(0.5, shape.params?.step ?? 1);
  const showGrid = shape.params?.showGrid !== false;
  const showDots = shape.params?.showDots !== false;

  // Frosted slate board background
  const boardRadius = 14 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, boardRadius);
  ctx.fillStyle = shape.fillColor && shape.fillColor !== 'transparent'
    ? shape.fillColor
    : 'rgba(15, 23, 42, 0.92)';
  ctx.fill();

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();

  // Header Title
  const tagFont = Math.max(10, Math.round(12 * dpr));
  ctx.font = `600 ${tagFont}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`📈 Cartesian Coordinate Plane (X: [${xMin}, ${xMax}], Y: [${yMin}, ${yMax}])`, x + 16 * dpr, y + 14 * dpr);

  // Plot Margins
  const padL = 46 * dpr;
  const padR = 46 * dpr;
  const padT = 44 * dpr;
  const padB = 44 * dpr;
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
    ctx.lineWidth = 1 * dpr;
    ctx.setLineDash([3 * dpr, 3 * dpr]);

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
        ctx.arc(px, py, 2.2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3. Main Axes
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = 2.5 * dpr;
  const arrowSize = 10 * dpr;

  const axisY = Math.max(plotY, Math.min(plotY + plotH, originY));
  const axisX = Math.max(plotX, Math.min(plotX + plotW, originX));

  // X Axis
  ctx.beginPath();
  ctx.moveTo(plotX - 12 * dpr, axisY);
  ctx.lineTo(plotX + plotW + 12 * dpr, axisY);
  ctx.stroke();

  // Arrowhead on +X
  ctx.beginPath();
  ctx.moveTo(plotX + plotW + 16 * dpr, axisY);
  ctx.lineTo(plotX + plotW + 16 * dpr - arrowSize, axisY - arrowSize * 0.45);
  ctx.lineTo(plotX + plotW + 16 * dpr - arrowSize, axisY + arrowSize * 0.45);
  ctx.closePath();
  ctx.fill();

  // Arrowhead on -X (if xMin < 0)
  if (xMin < 0) {
    ctx.beginPath();
    ctx.moveTo(plotX - 16 * dpr, axisY);
    ctx.lineTo(plotX - 16 * dpr + arrowSize, axisY - arrowSize * 0.45);
    ctx.lineTo(plotX - 16 * dpr + arrowSize, axisY + arrowSize * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  // Y Axis
  ctx.beginPath();
  ctx.moveTo(axisX, plotY + plotH + 12 * dpr);
  ctx.lineTo(axisX, plotY - 12 * dpr);
  ctx.stroke();

  // Arrowhead on +Y
  ctx.beginPath();
  ctx.moveTo(axisX, plotY - 16 * dpr);
  ctx.lineTo(axisX - arrowSize * 0.45, plotY - 16 * dpr + arrowSize);
  ctx.lineTo(axisX + arrowSize * 0.45, plotY - 16 * dpr + arrowSize);
  ctx.closePath();
  ctx.fill();

  // Arrowhead on -Y (if yMin < 0)
  if (yMin < 0) {
    ctx.beginPath();
    ctx.moveTo(axisX, plotY + plotH + 16 * dpr);
    ctx.lineTo(axisX - arrowSize * 0.45, plotY + plotH + 16 * dpr - arrowSize);
    ctx.lineTo(axisX + arrowSize * 0.45, plotY + plotH + 16 * dpr - arrowSize);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Numbered Ticks
  const fontSize = Math.max(10, Math.round(11 * dpr));
  ctx.font = `600 ${fontSize}px Inter, sans-serif`;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.8 * dpr;

  const tickHalf = 5 * dpr;

  // X ticks
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let vx = Math.ceil(xMin / step) * step; vx <= xMax; vx += step) {
    if (Math.abs(vx) < 1e-6) continue;
    const tx = mapX(vx);
    ctx.beginPath();
    ctx.moveTo(tx, axisY - tickHalf);
    ctx.lineTo(tx, axisY + tickHalf);
    ctx.stroke();

    ctx.fillText(String(vx), tx, axisY + tickHalf + 4 * dpr);
  }

  // Y ticks
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let vy = Math.ceil(yMin / step) * step; vy <= yMax; vy += step) {
    if (Math.abs(vy) < 1e-6) continue;
    const ty = mapY(vy);
    ctx.beginPath();
    ctx.moveTo(axisX - tickHalf, ty);
    ctx.lineTo(axisX + tickHalf, ty);
    ctx.stroke();

    ctx.fillText(String(vy), axisX - tickHalf - 5 * dpr, ty);
  }

  // 5. Origin (0,0) Indicator
  if (originX >= plotX && originX <= plotX + plotW && originY >= plotY && originY <= plotY + plotH) {
    ctx.beginPath();
    ctx.arc(originX, originY, 3.8 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('O(0,0)', originX - 6 * dpr, originY + 6 * dpr);
  }

  // 6. Axis Labels "x" and "y"
  const labelFont = Math.max(13, Math.round(15 * dpr));
  ctx.font = `bold italic ${labelFont}px 'Cambria Math', Georgia, serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('x', plotX + plotW + 20 * dpr, axisY);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('y', axisX, plotY - 18 * dpr);
}

function renderNumberLine(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const min = typeof shape.params?.min === 'number' ? shape.params.min : -5;
  const max = typeof shape.params?.max === 'number' ? shape.params.max : 5;
  const step = Math.max(0.01, typeof shape.params?.step === 'number' ? shape.params.step : 1);
  const highlight: number[] = Array.isArray(shape.params?.highlight) ? shape.params.highlight : [0];
  const strokeColor = shape.strokeColor || '#38bdf8';

  const cy = y + h / 2;
  const margin = 32 * dpr;
  const startX = x + margin;
  const endX = x + w - margin;
  const totalUnits = Math.max(0.1, max - min);
  const availableWidth = endX - startX;

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5 * dpr;

  // Main horizontal axis line
  ctx.beginPath();
  ctx.moveTo(startX, cy);
  ctx.lineTo(endX, cy);
  ctx.stroke();

  // Left arrow
  ctx.beginPath();
  ctx.moveTo(startX + 10 * dpr, cy - 6 * dpr);
  ctx.lineTo(startX, cy);
  ctx.lineTo(startX + 10 * dpr, cy + 6 * dpr);
  ctx.stroke();

  // Right arrow
  ctx.beginPath();
  ctx.moveTo(endX - 10 * dpr, cy - 6 * dpr);
  ctx.lineTo(endX, cy);
  ctx.lineTo(endX - 10 * dpr, cy + 6 * dpr);
  ctx.stroke();

  const totalSteps = Math.round(totalUnits / step);
  // Auto-skip labels if total steps would cause overlapping text
  const labelInterval = totalSteps > 30 ? Math.ceil(totalSteps / 15) : 1;

  ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.textAlign = 'center';

  let stepIdx = 0;
  for (let val = min; val <= max + step * 0.001; val += step, stepIdx++) {
    const norm = (val - min) / totalUnits;
    const tx = startX + norm * availableWidth;
    const isZero = Math.abs(val) < 1e-9;
    const isHighlighted = highlight.some((hVal) => Math.abs(hVal - val) < 1e-9);
    const showLabel = isZero || isHighlighted || stepIdx % labelInterval === 0;

    const tickH = isZero ? 13 * dpr : showLabel ? 8 * dpr : 5 * dpr;

    ctx.strokeStyle = isHighlighted ? '#f59e0b' : strokeColor;
    ctx.lineWidth = (isZero || isHighlighted ? 2.5 : 1.5) * dpr;

    ctx.beginPath();
    ctx.moveTo(tx, cy - tickH);
    ctx.lineTo(tx, cy + tickH);
    ctx.stroke();

    if (showLabel) {
      const formatted = Number(val.toFixed(2)).toString();
      ctx.fillStyle = isHighlighted ? '#f59e0b' : '#f8fafc';
      ctx.fillText(formatted, tx, cy + tickH + 14 * dpr);
    }

    if (isHighlighted) {
      ctx.beginPath();
      ctx.arc(tx, cy, 4.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    }
  }
}

function renderFunctionPlot(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const expression = shape.params?.expression || 'sin(x)';
  const xMin = shape.params?.xMin ?? -10;
  const xMax = shape.params?.xMax ?? 10;
  const yMin = shape.params?.yMin ?? -2;
  const yMax = shape.params?.yMax ?? 2;

  // Background Slate Card
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10 * dpr);
  ctx.fill();
  ctx.stroke();

  // Clean equation display
  const cleanExpr = expression.replace(/^[a-zA-Z](\([a-zA-Z]\))?\s*=\s*/, '');

  // Title Header
  ctx.font = `600 ${Math.max(12, Math.round(13 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText(`📈 Function Plot: y = ${cleanExpr}`, x + 16 * dpr, y + 20 * dpr);

  // Plot Area
  const padX = 40 * dpr;
  const padY = 40 * dpr;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;
  const plotL = x + padX;
  const plotT = y + padY;

  const validXRange = xMax > xMin ? xMax - xMin : 1;
  const validYRange = yMax > yMin ? yMax - yMin : 1;

  // Map math (x, y) to screen (sx, sy)
  const mapX = (mx: number) => plotL + ((mx - xMin) / validXRange) * plotW;
  const mapY = (my: number) => plotT + plotH - ((my - yMin) / validYRange) * plotH;

  // Axes lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 1.5 * dpr;

  const originX = mapX(0);
  const originY = mapY(0);

  // X axis
  if (originY >= plotT && originY <= plotT + plotH) {
    ctx.beginPath();
    ctx.moveTo(plotL, originY);
    ctx.lineTo(plotL + plotW, originY);
    ctx.stroke();
  }

  // Y axis
  if (originX >= plotL && originX <= plotL + plotW) {
    ctx.beginPath();
    ctx.moveTo(originX, plotT);
    ctx.lineTo(originX, plotT + plotH);
    ctx.stroke();
  }

  // Compile expression once for maximum performance
  const compiled = compileMathFunction(expression);
  if (!compiled.isValid) {
    ctx.font = `italic ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'center';
    ctx.fillText(`Syntax Error: ${compiled.error || 'Invalid equation'}`, x + w / 2, y + h / 2);
    return;
  }

  // Plot continuous curve
  ctx.strokeStyle = shape.strokeColor || '#38bdf8';
  ctx.lineWidth = (shape.strokeWidth || 2.5) * dpr;
  ctx.beginPath();

  const samples = 200;
  let inSegment = false;
  for (let i = 0; i <= samples; i++) {
    const mx = xMin + (i / samples) * validXRange;
    const my = compiled.fn(mx);
    if (isNaN(my) || !isFinite(my) || my < yMin - (validYRange * 0.2) || my > yMax + (validYRange * 0.2)) {
      inSegment = false;
      continue;
    }
    const sx = mapX(mx);
    const sy = mapY(my);
    if (!inSegment) {
      ctx.moveTo(sx, sy);
      inSegment = true;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();
}

function renderGeometry3D(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const solidType = (shape.params?.solidType || 'cube') as Solid3DType;
  const rotX = typeof shape.params?.rotX === 'number' ? shape.params.rotX : 28;
  const rotY = typeof shape.params?.rotY === 'number' ? shape.params.rotY : 35;
  const rotZ = typeof shape.params?.rotZ === 'number' ? shape.params.rotZ : 0;
  const strokeColor = shape.strokeColor || '#38bdf8';
  const fillColor = shape.fillColor || 'rgba(56, 189, 248, 0.14)';
  const strokeWidth = (shape.strokeWidth || 2) * dpr;

  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const scale = Math.min(w, h) * 0.35;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (solidType === 'sphere') {
    // ─── 1. Sphere: Clean smooth 3D globe with radial shading & tilted equator ───
    const r = scale;

    // Subtle 3D volumetric sphere gradient (light coming from top-left)
    const grad = ctx.createRadialGradient(
      centerX - r * 0.35,
      centerY - r * 0.35,
      r * 0.1,
      centerX,
      centerY,
      r
    );
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    grad.addColorStop(0.7, 'rgba(14, 116, 144, 0.18)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer circle outline
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    // Rotated Equator and Meridian circles
    const drawRotatedCircle = (isMeridian: boolean) => {
      const segs = 48;
      const pts: { x2d: number; y2d: number; depth: number }[] = [];
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        const p3d = isMeridian
          ? { x: Math.cos(theta), y: 0, z: Math.sin(theta) }
          : { x: Math.cos(theta), y: Math.sin(theta), z: 0 };
        const rot = transform3D(p3d, rotX, rotY, rotZ);
        const p2d = projectTo2D(rot, centerX, centerY, scale);
        pts.push(p2d);
      }

      // Draw in two passes: back half dashed, front half solid
      for (let i = 0; i < segs; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const avgDepth = (p1.depth + p2.depth) / 2;
        ctx.beginPath();
        if (avgDepth < 0) {
          ctx.setLineDash([4 * dpr, 4 * dpr]);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
          ctx.lineWidth = Math.max(1, strokeWidth * 0.75);
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
        }
        ctx.moveTo(p1.x2d, p1.y2d);
        ctx.lineTo(p2.x2d, p2.y2d);
        ctx.stroke();
      }
    };

    drawRotatedCircle(false); // Equator
    drawRotatedCircle(true);  // Meridian
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  if (solidType === 'cylinder') {
    // ─── 2. Cylinder: Smooth cylindrical body with top/bottom ellipses & silhouette sides ───
    const segs = 48;
    const botPts: { x2d: number; y2d: number; depth: number; nx: number; ny: number; nz: number }[] = [];
    const topPts: { x2d: number; y2d: number; depth: number; nx: number; ny: number; nz: number }[] = [];

    for (let i = 0; i < segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const normalRot = transform3D({ x: cosT, y: sinT, z: 0 }, rotX, rotY, rotZ);

      const bRot = transform3D({ x: cosT, y: sinT, z: -1 }, rotX, rotY, rotZ);
      const b2d = projectTo2D(bRot, centerX, centerY, scale);
      botPts.push({ ...b2d, nx: normalRot.x, ny: normalRot.y, nz: normalRot.z });

      const tRot = transform3D({ x: cosT, y: sinT, z: 1 }, rotX, rotY, rotZ);
      const t2d = projectTo2D(tRot, centerX, centerY, scale);
      topPts.push({ ...t2d, nx: normalRot.x, ny: normalRot.y, nz: normalRot.z });
    }

    const topNorm = transform3D({ x: 0, y: 0, z: 1 }, rotX, rotY, rotZ);
    const isTopVisible = topNorm.z > 0;

    // Fill mantle body
    ctx.beginPath();
    ctx.moveTo(topPts[0].x2d, topPts[0].y2d);
    for (let i = 1; i < segs; i++) ctx.lineTo(topPts[i].x2d, topPts[i].y2d);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(botPts[0].x2d, botPts[0].y2d);
    for (let i = 1; i < segs; i++) ctx.lineTo(botPts[i].x2d, botPts[i].y2d);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Side mantle quad strips
    for (let i = 0; i < segs; i++) {
      const next = (i + 1) % segs;
      const avgNz = (botPts[i].nz + botPts[next].nz) / 2;
      if (avgNz > 0) {
        ctx.beginPath();
        ctx.moveTo(botPts[i].x2d, botPts[i].y2d);
        ctx.lineTo(botPts[next].x2d, botPts[next].y2d);
        ctx.lineTo(topPts[next].x2d, topPts[next].y2d);
        ctx.lineTo(topPts[i].x2d, topPts[i].y2d);
        ctx.closePath();
        const light = Math.max(0.08, Math.min(0.24, 0.12 + avgNz * 0.10));
        ctx.fillStyle = `rgba(56, 189, 248, ${light})`;
        ctx.fill();
      }
    }

    // Draw the two smooth rim loops (top and bottom)
    const drawRim = (pts: typeof topPts, isFacingUs: boolean) => {
      for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        const p1 = pts[i];
        const p2 = pts[next];
        const isBack = isFacingUs ? false : ((p1.depth + p2.depth) / 2 < topNorm.z * 0.2);

        ctx.beginPath();
        if (isBack) {
          ctx.setLineDash([4 * dpr, 4 * dpr]);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
          ctx.lineWidth = Math.max(1, strokeWidth * 0.75);
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
        }
        ctx.moveTo(p1.x2d, p1.y2d);
        ctx.lineTo(p2.x2d, p2.y2d);
        ctx.stroke();
      }
    };

    drawRim(botPts, !isTopVisible);
    drawRim(topPts, isTopVisible);

    // Find and draw the two silhouette side tangent lines
    for (let i = 0; i < segs; i++) {
      const next = (i + 1) % segs;
      if ((botPts[i].nz <= 0 && botPts[next].nz > 0) || (botPts[i].nz > 0 && botPts[next].nz <= 0)) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.moveTo(botPts[i].x2d, botPts[i].y2d);
        ctx.lineTo(topPts[i].x2d, topPts[i].y2d);
        ctx.stroke();
      }
    }

    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  if (solidType === 'cone') {
    // ─── 3. Cone: Smooth conical mantle with base ellipse & tangent contour lines ───
    const segs = 48;
    const basePts: { x2d: number; y2d: number; depth: number }[] = [];

    for (let i = 0; i < segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      const bRot = transform3D({ x: Math.cos(theta), y: Math.sin(theta), z: -0.9 }, rotX, rotY, rotZ);
      basePts.push(projectTo2D(bRot, centerX, centerY, scale));
    }

    const apexRot = transform3D({ x: 0, y: 0, z: 1.25 }, rotX, rotY, rotZ);
    const apex2d = projectTo2D(apexRot, centerX, centerY, scale);

    const baseNorm = transform3D({ x: 0, y: 0, z: -1 }, rotX, rotY, rotZ);
    const isBaseFacingUs = baseNorm.z > 0;

    // Fill side mantle
    ctx.beginPath();
    ctx.moveTo(apex2d.x2d, apex2d.y2d);
    for (let i = 0; i < segs; i++) {
      ctx.lineTo(basePts[i].x2d, basePts[i].y2d);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Fill base disc if facing us
    if (isBaseFacingUs) {
      ctx.beginPath();
      ctx.moveTo(basePts[0].x2d, basePts[0].y2d);
      for (let i = 1; i < segs; i++) ctx.lineTo(basePts[i].x2d, basePts[i].y2d);
      ctx.closePath();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
      ctx.fill();
    }

    // Base rim outline
    for (let i = 0; i < segs; i++) {
      const next = (i + 1) % segs;
      const p1 = basePts[i];
      const p2 = basePts[next];
      const isBack = isBaseFacingUs ? false : ((p1.depth + p2.depth) / 2 < baseNorm.z * 0.2);

      ctx.beginPath();
      if (isBack) {
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
        ctx.lineWidth = Math.max(1, strokeWidth * 0.75);
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
      }
      ctx.moveTo(p1.x2d, p1.y2d);
      ctx.lineTo(p2.x2d, p2.y2d);
      ctx.stroke();
    }

    // Two extreme tangent silhouette lines from apex to base
    let minCross = Infinity;
    let maxCross = -Infinity;
    let minIdx = 0;
    let maxIdx = 0;

    for (let i = 0; i < segs; i++) {
      const dx = basePts[i].x2d - apex2d.x2d;
      const dy = basePts[i].y2d - apex2d.y2d;
      const cross = dx * baseNorm.y - dy * baseNorm.x;
      if (cross < minCross) {
        minCross = cross;
        minIdx = i;
      }
      if (cross > maxCross) {
        maxCross = cross;
        maxIdx = i;
      }
    }

    ctx.setLineDash([]);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(apex2d.x2d, apex2d.y2d);
    ctx.lineTo(basePts[minIdx].x2d, basePts[minIdx].y2d);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(apex2d.x2d, apex2d.y2d);
    ctx.lineTo(basePts[maxIdx].x2d, basePts[maxIdx].y2d);
    ctx.stroke();

    ctx.restore();
    return;
  }

  // ─── 4. Polyhedra: Cube, Pyramid, Triangular Prism ───
  const model = getSolid3DModel(solidType);

  // Transform all 3D vertices using true parallel projection
  const rotated3D = model.vertices.map((v) => transform3D(v, rotX, rotY, rotZ));
  const projected = rotated3D.map((p3d) => projectTo2D(p3d, centerX, centerY, scale));

  // Lighting vector (top-left-front)
  const lightVec = { x: -0.35, y: 0.55, z: 0.75 };
  const lightLen = Math.hypot(lightVec.x, lightVec.y, lightVec.z);
  const lx = lightVec.x / lightLen;
  const ly = lightVec.y / lightLen;
  const lz = lightVec.z / lightLen;

  interface FaceInfo {
    indices: number[];
    isFront: boolean;
    avgDepth: number;
    diffuse: number;
  }

  const faceInfos: FaceInfo[] = [];
  const edgeVisibility = new Array(model.edges.length).fill(false);

  for (const fIndices of model.faces) {
    if (fIndices.length < 3) continue;
    const p0 = rotated3D[fIndices[0]];
    const p1 = rotated3D[fIndices[1]];
    const p2 = rotated3D[fIndices[2]];

    // Cross product (p1 - p0) × (p2 - p0) to get outward normal
    const ux = p1.x - p0.x, uy = p1.y - p0.y, uz = p1.z - p0.z;
    const vx = p2.x - p0.x, vy = p2.y - p0.y, vz = p2.z - p0.z;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const nLen = Math.hypot(nx, ny, nz) || 1;
    const normX = nx / nLen, normY = ny / nLen, normZ = nz / nLen;

    const isFront = normZ > 0;
    const diffuse = Math.max(0, normX * lx + normY * ly + normZ * lz);

    let avgDepth = 0;
    for (const idx of fIndices) {
      avgDepth += rotated3D[idx].z;
    }
    avgDepth /= fIndices.length;

    faceInfos.push({ indices: fIndices, isFront, avgDepth, diffuse });

    // Mark visible edges
    if (isFront) {
      for (let i = 0; i < fIndices.length; i++) {
        const i1 = fIndices[i];
        const i2 = fIndices[(i + 1) % fIndices.length];
        for (let eIdx = 0; eIdx < model.edges.length; eIdx++) {
          const [e1, e2] = model.edges[eIdx];
          if ((e1 === i1 && e2 === i2) || (e1 === i2 && e2 === i1)) {
            edgeVisibility[eIdx] = true;
          }
        }
      }
    }
  }

  // Draw front-facing shaded faces
  const frontFaces = faceInfos.filter((f) => f.isFront).sort((a, b) => a.avgDepth - b.avgDepth);
  for (const face of frontFaces) {
    ctx.beginPath();
    const p0 = projected[face.indices[0]];
    ctx.moveTo(p0.x2d, p0.y2d);
    for (let i = 1; i < face.indices.length; i++) {
      const pt = projected[face.indices[i]];
      ctx.lineTo(pt.x2d, pt.y2d);
    }
    ctx.closePath();

    const alpha = 0.10 + face.diffuse * 0.22;
    ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
    ctx.fill();
  }

  // Draw hidden (back) edges dashed
  ctx.setLineDash([4 * dpr, 4 * dpr]);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
  ctx.lineWidth = Math.max(1, strokeWidth * 0.75);

  for (let i = 0; i < model.edges.length; i++) {
    if (!edgeVisibility[i]) {
      const [i1, i2] = model.edges[i];
      const p1 = projected[i1];
      const p2 = projected[i2];
      ctx.beginPath();
      ctx.moveTo(p1.x2d, p1.y2d);
      ctx.lineTo(p2.x2d, p2.y2d);
      ctx.stroke();
    }
  }

  // Draw visible (front) edges solid
  ctx.setLineDash([]);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;

  for (let i = 0; i < model.edges.length; i++) {
    if (edgeVisibility[i]) {
      const [i1, i2] = model.edges[i];
      const p1 = projected[i1];
      const p2 = projected[i2];
      ctx.beginPath();
      ctx.moveTo(p1.x2d, p1.y2d);
      ctx.lineTo(p2.x2d, p2.y2d);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ─── 2. Physics Renderers ─────────────────────────────────────────────────────

function renderCircuitComponent(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const compType = shape.params?.componentType || 'resistor';
  const strokeColor = shape.strokeColor || '#38bdf8';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5 * dpr;

  const cy = y + h / 2;
  const lead = 25 * dpr;

  if (compType === 'resistor') {
    // Left lead
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x + lead, cy);
    ctx.stroke();

    // Zigzag body (6 teeth)
    const zigW = (w - lead * 2) / 6;
    ctx.beginPath();
    ctx.moveTo(x + lead, cy);
    ctx.lineTo(x + lead + zigW * 0.5, cy - 14 * dpr);
    ctx.lineTo(x + lead + zigW * 1.5, cy + 14 * dpr);
    ctx.lineTo(x + lead + zigW * 2.5, cy - 14 * dpr);
    ctx.lineTo(x + lead + zigW * 3.5, cy + 14 * dpr);
    ctx.lineTo(x + lead + zigW * 4.5, cy - 14 * dpr);
    ctx.lineTo(x + lead + zigW * 5.5, cy + 14 * dpr);
    ctx.lineTo(x + w - lead, cy);
    ctx.stroke();

    // Right lead
    ctx.beginPath();
    ctx.moveTo(x + w - lead, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();

    // Label: value and unit
    const rVal = shape.params?.resistance ?? 100;
    const rUnit = shape.params?.unit || 'Ω';
    const displayLabel = shape.label || shape.params?.label || `R = ${rVal} ${rUnit}`;
    ctx.font = `600 ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(displayLabel, x + w / 2, cy - 22 * dpr);
  } else if (compType === 'rheostat' || compType === 'variableResistor') {
    // 🎚️ Variable Resistor (Rheostat)
    // Left lead
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x + lead, cy);
    ctx.stroke();

    // Zigzag body
    const zigW = (w - lead * 2) / 6;
    ctx.beginPath();
    ctx.moveTo(x + lead, cy);
    ctx.lineTo(x + lead + zigW * 0.5, cy - 14 * dpr);
    ctx.lineTo(x + lead + zigW * 1.5, cy + 14 * dpr);
    ctx.lineTo(x + lead + zigW * 2.5, cy - 14 * dpr);
    ctx.lineTo(x + lead + zigW * 3.5, cy + 14 * dpr);
    ctx.lineTo(x + lead + zigW * 4.5, cy - 14 * dpr);
    ctx.lineTo(x + lead + zigW * 5.5, cy + 14 * dpr);
    ctx.lineTo(x + w - lead, cy);
    ctx.stroke();

    // Right lead
    ctx.beginPath();
    ctx.moveTo(x + w - lead, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();

    // Diagonal adjustment arrow (↗) crossing through the center
    const cx = x + w / 2;
    drawArrow(ctx, cx - 18 * dpr, cy + 22 * dpr, cx + 24 * dpr, cy - 22 * dpr, strokeColor, dpr);

    // Label
    const curR = shape.params?.resistance ?? 50;
    const maxR = shape.params?.maxResistance ?? 100;
    const rUnit = shape.params?.unit || 'Ω';
    const displayLabel =
      shape.label ||
      shape.params?.label ||
      (shape.params?.maxResistance !== undefined
        ? `Rheostat (${curR} / ${maxR} ${rUnit})`
        : `R_var = ${curR} ${rUnit}`);
    ctx.font = `600 ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(displayLabel, cx, cy - 26 * dpr);
  } else if (compType === 'capacitor') {
    // Two parallel plates
    const cx = x + w / 2;
    const plateGap = 8 * dpr;
    const plateH = 22 * dpr;

    // Left lead
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(cx - plateGap / 2, cy);
    ctx.stroke();

    // Left plate
    ctx.beginPath();
    ctx.moveTo(cx - plateGap / 2, cy - plateH);
    ctx.lineTo(cx - plateGap / 2, cy + plateH);
    ctx.stroke();

    // Right plate
    ctx.beginPath();
    ctx.moveTo(cx + plateGap / 2, cy - plateH);
    ctx.lineTo(cx + plateGap / 2, cy + plateH);
    ctx.stroke();

    // Right lead
    ctx.beginPath();
    ctx.moveTo(cx + plateGap / 2, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();

    // Label
    const capVal = shape.params?.value ?? shape.params?.capacitance ?? 10;
    const capUnit = shape.params?.unit || 'µF';
    const displayLabel = shape.label || shape.params?.label || `C = ${capVal} ${capUnit}`;
    ctx.font = `600 ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(displayLabel, cx, cy - 26 * dpr);
  } else if (compType === 'inductor') {
    // Coiled inductor loops
    const coilStartX = x + lead;
    const coilEndX = x + w - lead;
    const numLoops = 4;
    const loopW = (coilEndX - coilStartX) / numLoops;

    // Left lead
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(coilStartX, cy);
    ctx.stroke();

    // Arcs
    for (let i = 0; i < numLoops; i++) {
      const arcCx = coilStartX + i * loopW + loopW / 2;
      ctx.beginPath();
      ctx.arc(arcCx, cy, loopW / 2, Math.PI, 0, false);
      ctx.stroke();
    }

    // Right lead
    ctx.beginPath();
    ctx.moveTo(coilEndX, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();

    // Label
    const indVal = shape.params?.value ?? shape.params?.inductance ?? 5;
    const indUnit = shape.params?.unit || 'mH';
    const displayLabel = shape.label || shape.params?.label || `L = ${indVal} ${indUnit}`;
    ctx.font = `600 ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(displayLabel, x + w / 2, cy - 24 * dpr);
  } else if (compType === 'battery') {
    const cx = x + w / 2;
    // Left lead
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(cx - 10 * dpr, cy);
    ctx.stroke();

    // Long thin positive plate
    ctx.beginPath();
    ctx.moveTo(cx - 10 * dpr, cy - 24 * dpr);
    ctx.lineTo(cx - 10 * dpr, cy + 24 * dpr);
    ctx.stroke();

    // Short thick negative plate
    ctx.lineWidth = 4.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx + 10 * dpr, cy - 14 * dpr);
    ctx.lineTo(cx + 10 * dpr, cy + 14 * dpr);
    ctx.stroke();

    // Right lead
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx + 10 * dpr, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();

    // + / - symbols
    ctx.font = `bold ${Math.max(12, Math.round(14 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText('+', cx - 22 * dpr, cy - 12 * dpr);
    ctx.fillText('-', cx + 22 * dpr, cy - 12 * dpr);
  } else if (compType === 'switch') {
    // Terminals
    const tx1 = x + 30 * dpr;
    const tx2 = x + w - 30 * dpr;

    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(tx1, cy);
    ctx.moveTo(tx2, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tx1, cy, 4 * dpr, 0, Math.PI * 2);
    ctx.arc(tx2, cy, 4 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();

    // Switch knife blade (angled for open)
    const isOpen = shape.params?.state !== 'closed';
    ctx.beginPath();
    ctx.moveTo(tx1, cy);
    if (isOpen) {
      ctx.lineTo(tx1 + (tx2 - tx1) * 0.9, cy - 20 * dpr);
    } else {
      ctx.lineTo(tx2, cy);
    }
    ctx.stroke();
  } else if (compType === 'lamp') {
    const cx = x + w / 2;
    const r = Math.min(w, h) * 0.35;

    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(cx - r, cy);
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();

    // Circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Cross filament
    const crossR = r * 0.707;
    ctx.beginPath();
    ctx.moveTo(cx - crossR, cy - crossR);
    ctx.lineTo(cx + crossR, cy + crossR);
    ctx.moveTo(cx + crossR, cy - crossR);
    ctx.lineTo(cx - crossR, cy + crossR);
    ctx.stroke();
  } else if (compType === 'meter') {
    const cx = x + w / 2;
    const r = Math.min(w, h) * 0.35;
    const meterType = shape.params?.meterType || 'A';

    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(cx - r, cy);
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(x + w, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${Math.max(14, Math.round(18 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meterType, cx, cy);
  }
}

/** Helper to draw an electronic component symbol at a specific coordinate and orientation */
function drawSchematicComponentSymbol(
  ctx: CanvasRenderingContext2D,
  type: string,
  cx: number,
  cy: number,
  orientation: 'horizontal' | 'vertical',
  label: string,
  valueText: string,
  dpr: number,
  state?: string,
  bgColor = 'rgba(15, 23, 42, 0.94)'
) {
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2 * dpr;

  const isH = orientation === 'horizontal';
  const clearW = isH ? 72 * dpr : 38 * dpr;
  const clearH = isH ? 38 * dpr : 68 * dpr;

  // Clear wire behind component
  ctx.fillRect(cx - clearW / 2, cy - clearH / 2, clearW, clearH);

  if (type === 'resistor' || type === 'rheostat') {
    const span = 46 * dpr;
    const half = span / 2;
    const numZigs = 5;
    const zigStep = span / numZigs;

    ctx.beginPath();
    if (isH) {
      ctx.moveTo(cx - half, cy);
      for (let i = 0; i < numZigs; i++) {
        const sign = i % 2 === 0 ? -1 : 1;
        ctx.lineTo(cx - half + (i + 0.5) * zigStep, cy + sign * 10 * dpr);
      }
      ctx.lineTo(cx + half, cy);
    } else {
      ctx.moveTo(cx, cy - half);
      for (let i = 0; i < numZigs; i++) {
        const sign = i % 2 === 0 ? -1 : 1;
        ctx.lineTo(cx + sign * 10 * dpr, cy - half + (i + 0.5) * zigStep);
      }
      ctx.lineTo(cx, cy + half);
    }
    ctx.stroke();

    if (type === 'rheostat') {
      drawArrow(ctx, cx - 14 * dpr, cy + 14 * dpr, cx + 16 * dpr, cy - 16 * dpr, '#38bdf8', dpr);
    }
  } else if (type === 'capacitor') {
    const gap = 7 * dpr;
    const plateLen = 14 * dpr;
    ctx.beginPath();
    if (isH) {
      ctx.moveTo(cx - gap / 2, cy - plateLen);
      ctx.lineTo(cx - gap / 2, cy + plateLen);
      ctx.moveTo(cx + gap / 2, cy - plateLen);
      ctx.lineTo(cx + gap / 2, cy + plateLen);
    } else {
      ctx.moveTo(cx - plateLen, cy - gap / 2);
      ctx.lineTo(cx + plateLen, cy - gap / 2);
      ctx.moveTo(cx - plateLen, cy + gap / 2);
      ctx.lineTo(cx + plateLen, cy + gap / 2);
    }
    ctx.stroke();
  } else if (type === 'inductor') {
    const loops = 3;
    const r = 6 * dpr;
    if (isH) {
      for (let i = 0; i < loops; i++) {
        const arcX = cx - (loops * r) + (i * 2 * r) + r;
        ctx.beginPath();
        ctx.arc(arcX, cy, r, Math.PI, 0, false);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < loops; i++) {
        const arcY = cy - (loops * r) + (i * 2 * r) + r;
        ctx.beginPath();
        ctx.arc(cx, arcY, r, -Math.PI / 2, Math.PI / 2, false);
        ctx.stroke();
      }
    }
  } else if (type === 'lamp') {
    const r = 12 * dpr;
    ctx.strokeStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const cross = r * 0.707;
    ctx.beginPath();
    ctx.moveTo(cx - cross, cy - cross);
    ctx.lineTo(cx + cross, cy + cross);
    ctx.moveTo(cx + cross, cy - cross);
    ctx.lineTo(cx - cross, cy + cross);
    ctx.stroke();
  } else if (type === 'switch') {
    const isOpen = state === 'open';
    const termSpan = 20 * dpr;
    ctx.beginPath();
    if (isH) {
      ctx.arc(cx - termSpan / 2, cy, 3 * dpr, 0, Math.PI * 2);
      ctx.arc(cx + termSpan / 2, cy, 3 * dpr, 0, Math.PI * 2);
    } else {
      ctx.arc(cx, cy - termSpan / 2, 3 * dpr, 0, Math.PI * 2);
      ctx.arc(cx, cy + termSpan / 2, 3 * dpr, 0, Math.PI * 2);
    }
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.beginPath();
    if (isH) {
      ctx.moveTo(cx - termSpan / 2, cy);
      if (isOpen) {
        ctx.lineTo(cx + termSpan / 2 - 2 * dpr, cy - 14 * dpr);
      } else {
        ctx.lineTo(cx + termSpan / 2, cy);
      }
    } else {
      ctx.moveTo(cx, cy - termSpan / 2);
      if (isOpen) {
        ctx.lineTo(cx + 14 * dpr, cy + termSpan / 2 - 2 * dpr);
      } else {
        ctx.lineTo(cx, cy + termSpan / 2);
      }
    }
    ctx.stroke();
  } else if (type === 'ammeter' || type === 'voltmeter') {
    const r = 13 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${Math.max(11, Math.round(13 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'voltmeter' ? 'V' : 'A', cx, cy);
  }

  // Draw Labels
  ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (isH) {
    if (label) ctx.fillText(label, cx, cy - 20 * dpr);
    if (valueText) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(valueText, cx, cy + 20 * dpr);
    }
  } else {
    ctx.textAlign = 'left';
    if (label) ctx.fillText(label, cx + 18 * dpr, cy - 6 * dpr);
    if (valueText) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(valueText, cx + 18 * dpr, cy + 8 * dpr);
    }
  }

  ctx.restore();
}

function renderPhysicsDiagram(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const diagType = shape.params?.diagramType || 'seriesCircuit';
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5 * dpr;

  // Background Slate Card
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12 * dpr);
  ctx.fill();
  ctx.stroke();

  // Header Title
  const isParallel = diagType === 'parallelCircuit';
  const headerTitle =
    shape.label || (isParallel ? '⚡ Parallel Circuit Diagram' : '⚡ Series Circuit Diagram');
  ctx.font = `bold ${Math.max(12, Math.round(14 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(headerTitle, x + 16 * dpr, y + 14 * dpr);

  const voltage = Number(shape.params?.voltage ?? 12);
  const showArrows = shape.params?.showCurrentArrows !== false;
  const showFormulas = shape.params?.showFormulas !== false;

  if (diagType === 'seriesCircuit') {
    // ─── Complete Configurable Series Circuit ──────────────────────────────
    const rawComps = shape.params?.components || [
      { id: 'c1', type: 'resistor', value: shape.params?.resistance ?? 4, unit: 'Ω', label: 'R1' },
      { id: 'c2', type: 'ammeter', value: shape.params?.current ?? 3, unit: 'A', label: 'A' },
      { id: 'c3', type: 'switch', value: 0, unit: '', label: 'Switch', state: 'closed' },
    ];

    // Calculate equivalent resistance
    let req = 0;
    for (const c of rawComps) {
      if (c.type === 'resistor' || c.type === 'rheostat') {
        req += Number(c.value) || 0;
      }
    }
    if (req === 0) req = Number(shape.params?.resistance) || 4;
    const current =
      shape.params?.current !== undefined
        ? Number(shape.params.current)
        : req > 0
        ? Number((voltage / req).toFixed(2))
        : 0;

    // Header Metric Badge
    const badgeText = `V = ${voltage}V | Req = ${req}Ω | I = ${current}A`;
    ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    const badgeW = ctx.measureText(badgeText).width + 20 * dpr;
    const badgeX = x + w - badgeW - 16 * dpr;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.beginPath();
    ctx.roundRect(badgeX, y + 10 * dpr, badgeW, 24 * dpr, 6 * dpr);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, y + 22 * dpr);

    // Circuit Loop Geometry
    const padX = 54 * dpr;
    const padTop = 56 * dpr;
    const padBtm = showFormulas ? 64 * dpr : 38 * dpr;
    const lx = x + padX;
    const ty = y + padTop;
    const lw = w - padX * 2;
    const lh = h - padTop - padBtm;

    // Outer Loop Wire
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.strokeRect(lx, ty, lw, lh);

    // Left Rail: Battery
    const battCx = lx;
    const battCy = ty + lh / 2;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(battCx - 22 * dpr, battCy - 26 * dpr, 44 * dpr, 52 * dpr);

    // Battery Plates
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    // Long + plate
    ctx.beginPath();
    ctx.moveTo(battCx - 14 * dpr, battCy - 8 * dpr);
    ctx.lineTo(battCx + 14 * dpr, battCy - 8 * dpr);
    ctx.stroke();
    // Short - plate
    ctx.lineWidth = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(battCx - 8 * dpr, battCy + 8 * dpr);
    ctx.lineTo(battCx + 8 * dpr, battCy + 8 * dpr);
    ctx.stroke();

    // Signs and label
    ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'right';
    ctx.fillText('+', battCx - 18 * dpr, battCy - 8 * dpr);
    ctx.fillText('−', battCx - 18 * dpr, battCy + 8 * dpr);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${voltage}V`, battCx, battCy + 24 * dpr);

    // Conventional current arrows along the loop
    if (showArrows) {
      drawArrow(ctx, lx + lw * 0.15, ty, lx + lw * 0.25, ty, '#10b981', dpr);
      drawArrow(ctx, lx + lw, ty + lh * 0.8, lx + lw, ty + lh * 0.9, '#10b981', dpr);
      drawArrow(ctx, lx + lw * 0.85, ty + lh, lx + lw * 0.75, ty + lh, '#10b981', dpr);
      drawArrow(ctx, lx, ty + lh * 0.25, lx, ty + lh * 0.15, '#10b981', dpr);
    }

    // Place Series Components across Top, Right, Bottom rails
    const numComps = rawComps.length;
    rawComps.forEach((comp: any, idx: number) => {
      let cx = lx + lw / 2;
      let cy = ty;
      let orientation: 'horizontal' | 'vertical' = 'horizontal';

      if (numComps === 1) {
        cx = lx + lw / 2;
        cy = ty + lh;
      } else if (numComps === 2) {
        if (idx === 0) {
          cx = lx + lw / 2;
          cy = ty;
        } else {
          cx = lx + lw / 2;
          cy = ty + lh;
        }
      } else if (numComps === 3) {
        if (idx === 0) {
          cx = lx + lw / 2;
          cy = ty;
        } else if (idx === 1) {
          cx = lx + lw;
          cy = ty + lh / 2;
          orientation = 'vertical';
        } else {
          cx = lx + lw / 2;
          cy = ty + lh;
        }
      } else {
        // 4 or more: distribute across top and bottom
        const halfCount = Math.ceil(numComps / 2);
        if (idx < halfCount) {
          const step = lw / (halfCount + 1);
          cx = lx + (idx + 1) * step;
          cy = ty;
        } else {
          const btmIdx = idx - halfCount;
          const btmCount = numComps - halfCount;
          const step = lw / (btmCount + 1);
          cx = lx + lw - (btmIdx + 1) * step;
          cy = ty + lh;
        }
      }

      const valText = comp.value ? `${comp.value} ${comp.unit || ''}` : '';
      drawSchematicComponentSymbol(
        ctx,
        comp.type,
        cx,
        cy,
        orientation,
        comp.label || `Comp ${idx + 1}`,
        valText,
        dpr,
        comp.state
      );
    });

    // Formula Banner at Bottom
    if (showFormulas) {
      const formY = y + h - 34 * dpr;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(x + 12 * dpr, formY, w - 24 * dpr, 24 * dpr);
      ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const power = (voltage * current).toFixed(1);
      ctx.fillText(
        `Ohm's Law: I = V / Req = ${voltage}V / ${req}Ω = ${current}A  |  Total Power: P = V · I = ${power}W`,
        x + w / 2,
        formY + 12 * dpr
      );
    }
  } else if (diagType === 'parallelCircuit') {
    // ─── Complete Configurable Parallel Circuit ───────────────────────────
    const rawComps = shape.params?.components || [
      { id: 'p1', type: 'resistor', value: 6, unit: 'Ω', label: 'R1' },
      { id: 'p2', type: 'resistor', value: 12, unit: 'Ω', label: 'R2' },
    ];

    // Calculate parallel equivalent resistance: 1/Req = 1/R1 + 1/R2 ...
    let invReq = 0;
    for (const c of rawComps) {
      if ((c.type === 'resistor' || c.type === 'rheostat') && c.value > 0) {
        invReq += 1 / Number(c.value);
      }
    }
    const req = invReq > 0 ? Number((1 / invReq).toFixed(2)) : Number(shape.params?.resistance) || 4;
    const current =
      shape.params?.current !== undefined
        ? Number(shape.params.current)
        : req > 0
        ? Number((voltage / req).toFixed(2))
        : 0;

    // Header Metric Badge
    const badgeText = `V = ${voltage}V | Req = ${req}Ω | I_total = ${current}A`;
    ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    const badgeW = ctx.measureText(badgeText).width + 20 * dpr;
    const badgeX = x + w - badgeW - 16 * dpr;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.beginPath();
    ctx.roundRect(badgeX, y + 10 * dpr, badgeW, 24 * dpr, 6 * dpr);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, y + 22 * dpr);

    // Parallel Rails Layout
    const padLeft = 60 * dpr;
    const padRight = 44 * dpr;
    const padTop = 64 * dpr;
    const padBtm = showFormulas ? 65 * dpr : 38 * dpr;

    const battX = x + padLeft;
    const topBusY = y + padTop;
    const btmBusY = y + h - padBtm;
    const rightBusX = x + w - padRight;

    // Draw Top & Bottom Horizontal Bus Wires
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(battX, topBusY);
    ctx.lineTo(rightBusX, topBusY);
    ctx.moveTo(battX, btmBusY);
    ctx.lineTo(rightBusX, btmBusY);
    ctx.stroke();

    // Draw Left Vertical Battery Branch
    ctx.beginPath();
    ctx.moveTo(battX, topBusY);
    ctx.lineTo(battX, btmBusY);
    ctx.stroke();

    // Battery in center of left rail
    const battCy = (topBusY + btmBusY) / 2;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(battX - 22 * dpr, battCy - 26 * dpr, 44 * dpr, 52 * dpr);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    // Long + plate
    ctx.beginPath();
    ctx.moveTo(battX - 14 * dpr, battCy - 8 * dpr);
    ctx.lineTo(battX + 14 * dpr, battCy - 8 * dpr);
    ctx.stroke();
    // Short - plate
    ctx.lineWidth = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(battX - 8 * dpr, battCy + 8 * dpr);
    ctx.lineTo(battX + 8 * dpr, battCy + 8 * dpr);
    ctx.stroke();

    ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'right';
    ctx.fillText('+', battX - 18 * dpr, battCy - 8 * dpr);
    ctx.fillText('−', battX - 18 * dpr, battCy + 8 * dpr);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${voltage}V`, battX, battCy + 24 * dpr);

    // Current arrow from battery into top rail
    if (showArrows) {
      drawArrow(ctx, battX + 15 * dpr, topBusY, battX + 35 * dpr, topBusY, '#10b981', dpr);
      ctx.font = `bold ${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'left';
      ctx.fillText(`Itot = ${current}A`, battX + 15 * dpr, topBusY - 12 * dpr);
    }

    // Distribute Vertical Parallel Branches
    const numBranches = rawComps.length;
    const branchSpan = rightBusX - (battX + 60 * dpr);
    const branchStep = branchSpan / Math.max(1, numBranches);

    rawComps.forEach((comp: any, idx: number) => {
      const branchX = battX + 60 * dpr + (idx + 0.5) * branchStep;

      // Vertical wire connecting top bus to bottom bus
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(branchX, topBusY);
      ctx.lineTo(branchX, btmBusY);
      ctx.stroke();

      // Kirchhoff Node Dots at Top and Bottom Junctions
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(branchX, topBusY, 4 * dpr, 0, Math.PI * 2);
      ctx.arc(branchX, btmBusY, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Branch current calculation
      const branchCurrent =
        comp.value > 0 ? Number((voltage / comp.value).toFixed(2)) : 0;

      // Downward current arrow on branch wire
      if (showArrows) {
        drawArrow(
          ctx,
          branchX,
          topBusY + 8 * dpr,
          branchX,
          topBusY + 24 * dpr,
          '#10b981',
          dpr
        );
        ctx.font = `bold ${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'right';
        ctx.fillText(`I${idx + 1}=${branchCurrent}A`, branchX - 8 * dpr, topBusY + 18 * dpr);
      }

      // Draw component vertically in center of branch
      const compCy = (topBusY + btmBusY) / 2;
      const valText = comp.value ? `${comp.value} ${comp.unit || ''}` : '';
      drawSchematicComponentSymbol(
        ctx,
        comp.type,
        branchX,
        compCy,
        'vertical',
        comp.label || `Branch ${idx + 1}`,
        valText,
        dpr,
        comp.state
      );
    });

    // Formula Banner at Bottom
    if (showFormulas) {
      const formY = y + h - 34 * dpr;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(x + 12 * dpr, formY, w - 24 * dpr, 24 * dpr);
      ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `Parallel Law: 1/Req = ∑(1/Ri) ⇒ Req = ${req}Ω  |  Kirchhoff's Node: I_total = ∑ I_branches = ${current}A`,
        x + w / 2,
        formY + 12 * dpr
      );
    }
  } else if (diagType === 'forceVector') {
    // ─── Force Vector with Components & Angles ──────────────────────────
    const mag = Number(shape.params?.magnitude ?? 50);
    const ang = Number(shape.params?.angle ?? 45);
    const vecName = shape.params?.name || 'F';
    const showComp = shape.params?.showComponents !== false;

    // Center origin
    const ox = x + 70 * dpr;
    const oy = y + h - 55 * dpr;
    const maxLen = Math.min(w - 140 * dpr, h - 110 * dpr);
    const len = Math.max(40 * dpr, Math.min(maxLen, (mag / 80) * maxLen));

    const rad = (ang * Math.PI) / 180;
    const fx = Number((mag * Math.cos(rad)).toFixed(1));
    const fy = Number((mag * Math.sin(rad)).toFixed(1));

    const tipX = ox + len * Math.cos(rad);
    const tipY = oy - len * Math.sin(rad);

    // Draw Coordinate Axes (+X, +Y)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(ox - 20 * dpr, oy);
    ctx.lineTo(x + w - 25 * dpr, oy);
    ctx.moveTo(ox, oy + 20 * dpr);
    ctx.lineTo(ox, y + 45 * dpr);
    ctx.stroke();

    // Axis labels
    ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.fillText('+x', x + w - 20 * dpr, oy + 4 * dpr);
    ctx.fillText('+y', ox, y + 40 * dpr);

    // Origin Dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(ox, oy, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Angle Arc
    const arcR = Math.min(32 * dpr, len * 0.45);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(ox, oy, arcR, -rad, 0, false);
    ctx.stroke();

    ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${ang}°`,
      ox + (arcR + 6 * dpr) * Math.cos(rad / 2),
      oy - (arcR + 6 * dpr) * Math.sin(rad / 2)
    );

    // Component Projections (dashed lines)
    if (showComp) {
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      // Fx along horizontal
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(tipX, oy);
      ctx.stroke();

      // Fy vertical drop
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(tipX, oy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Component Labels
      ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`Fx = ${fx} N`, (ox + tipX) / 2, oy + 16 * dpr);

      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'left';
      ctx.fillText(`Fy = ${fy} N`, tipX + 8 * dpr, (oy + tipY) / 2);
    }

    // Main Force Vector Arrow
    const vecColor = shape.strokeColor || '#f43f5e';
    drawArrow(ctx, ox, oy, tipX, tipY, vecColor, dpr);

    // Vector Label at tip
    ctx.font = `bold ${Math.max(11, Math.round(13 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${vecName} = ${mag} N`, tipX + 8 * dpr, tipY - 8 * dpr);

    // Formula Card at Bottom
    const formY = y + h - 30 * dpr;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x + 12 * dpr, formY, w - 24 * dpr, 22 * dpr);
    ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Components: Fx = F·cos(${ang}°) = ${fx} N  |  Fy = F·sin(${ang}°) = ${fy} N  |  |F| = √(Fx² + Fy²) = ${mag} N`,
      x + w / 2,
      formY + 11 * dpr
    );
  } else if (diagType === 'resultantForce') {
    // ─── Resultant Force Demonstration (Vector Addition) ───────────────
    const forces: Array<{ name: string; magnitude: number; angleDegrees: number; color?: string }> =
      shape.params?.forces || [
        { name: 'F1', magnitude: shape.params?.f1 ?? 40, angleDegrees: shape.params?.theta1 ?? 0, color: '#38bdf8' },
        { name: 'F2', magnitude: shape.params?.f2 ?? 30, angleDegrees: shape.params?.theta2 ?? 90, color: '#10b981' },
      ];

    // Compute resultant
    let sumX = 0;
    let sumY = 0;
    for (const f of forces) {
      const r = (f.angleDegrees * Math.PI) / 180;
      sumX += f.magnitude * Math.cos(r);
      sumY += f.magnitude * Math.sin(r);
    }
    const Rmag = Number(Math.sqrt(sumX * sumX + sumY * sumY).toFixed(1));
    let Rang = Number(((Math.atan2(sumY, sumX) * 180) / Math.PI).toFixed(1));
    if (Rang < 0) Rang += 360;

    const ox = x + 70 * dpr;
    const oy = y + h - 55 * dpr;
    const maxSpan = Math.min(w - 140 * dpr, h - 110 * dpr);
    const maxVal = Math.max(Rmag, ...forces.map((f) => f.magnitude), 1);
    const scale = maxSpan / (maxVal * 1.15);

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(ox - 20 * dpr, oy);
    ctx.lineTo(x + w - 25 * dpr, oy);
    ctx.moveTo(ox, oy + 20 * dpr);
    ctx.lineTo(ox, y + 45 * dpr);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillText('+x', x + w - 20 * dpr, oy + 4 * dpr);
    ctx.fillText('+y', ox, y + 40 * dpr);

    // Draw individual force vectors
    const tips: Array<{ x: number; y: number; f: (typeof forces)[0] }> = [];
    forces.forEach((f, idx) => {
      const frad = (f.angleDegrees * Math.PI) / 180;
      const tx = ox + f.magnitude * scale * Math.cos(frad);
      const ty = oy - f.magnitude * scale * Math.sin(frad);
      tips.push({ x: tx, y: ty, f });

      const col = f.color || (idx === 0 ? '#38bdf8' : '#10b981');
      drawArrow(ctx, ox, oy, tx, ty, col, dpr);

      ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = col;
      ctx.textAlign = 'left';
      ctx.fillText(`${f.name} (${f.magnitude}N @ ${f.angleDegrees}°)`, tx + 6 * dpr, ty - 6 * dpr);
    });

    // Parallelogram completion if 2 vectors
    if (tips.length === 2) {
      const RtipX = ox + sumX * scale;
      const RtipY = oy - sumY * scale;

      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5 * dpr;

      ctx.beginPath();
      ctx.moveTo(tips[0].x, tips[0].y);
      ctx.lineTo(RtipX, RtipY);
      ctx.lineTo(tips[1].x, tips[1].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Resultant Vector
    const RtipX = ox + sumX * scale;
    const RtipY = oy - sumY * scale;
    drawArrow(ctx, ox, oy, RtipX, RtipY, '#f43f5e', dpr);

    // Resultant Label
    ctx.font = `bold ${Math.max(11, Math.round(13 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText(`R = ${Rmag} N @ ${Rang}°`, RtipX + 8 * dpr, RtipY - 8 * dpr);

    // Resultant angle arc
    const arcR = Math.min(36 * dpr, Rmag * scale * 0.5);
    const Rrad = (Rang * Math.PI) / 180;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(ox, oy, arcR, -Rrad, 0, false);
    ctx.stroke();

    // Formula Banner at Bottom
    const formY = y + h - 30 * dpr;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x + 12 * dpr, formY, w - 24 * dpr, 22 * dpr);
    ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Resultant: Rx = ∑Fx = ${sumX.toFixed(1)} N  |  Ry = ∑Fy = ${sumY.toFixed(1)} N  |  |R| = √(Rx² + Ry²) = ${Rmag} N @ ${Rang}°`,
      x + w / 2,
      formY + 11 * dpr
    );
  } else if (diagType === 'freeBodyDiagram') {
    // ─── Free Body Diagram (FBD) with Mass, Incline & Forces ────────────
    const mass = Number(shape.params?.mass ?? 5);
    const g = Number(shape.params?.gravity ?? 9.8);
    const incline = Number(shape.params?.inclineAngle ?? 0);
    const applied = Number(shape.params?.appliedForce ?? 30);
    const mu = Number(shape.params?.frictionCoeff ?? 0.3);

    const alphaRad = (incline * Math.PI) / 180;
    const weight = Number((mass * g).toFixed(1));
    const normal = Number((weight * Math.cos(alphaRad)).toFixed(1));
    const friction =
      shape.params?.frictionForce !== undefined
        ? Number(shape.params.frictionForce)
        : Number((mu * normal).toFixed(1));
    const gravityParallel = Number((weight * Math.sin(alphaRad)).toFixed(1));
    const netForce = Number((applied - friction - gravityParallel).toFixed(1));
    const accel = mass > 0 ? Number((netForce / mass).toFixed(2)) : 0;

    const cx = x + w / 2;
    const cy = y + h / 2;
    const blockW = 75 * dpr;
    const blockH = 50 * dpr;

    // Surface / Incline Wedge
    if (incline > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(x + 30 * dpr, cy + blockH / 2 + 50 * dpr);
      ctx.lineTo(x + w - 30 * dpr, cy + blockH / 2 + 50 * dpr);
      ctx.lineTo(x + w - 30 * dpr, cy - 30 * dpr);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'left';
      ctx.fillText(`Incline θ = ${incline}°`, x + 50 * dpr, cy + blockH / 2 + 36 * dpr);
    } else {
      // Horizontal surface line with hatch
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(x + 35 * dpr, cy + blockH / 2);
      ctx.lineTo(x + w - 35 * dpr, cy + blockH / 2);
      ctx.stroke();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1 * dpr;
      for (let hx = x + 50 * dpr; hx < x + w - 50 * dpr; hx += 25 * dpr) {
        ctx.beginPath();
        ctx.moveTo(hx, cy + blockH / 2);
        ctx.lineTo(hx - 8 * dpr, cy + blockH / 2 + 8 * dpr);
        ctx.stroke();
      }
    }

    // Block rotation if inclined
    ctx.save();
    if (incline > 0) {
      ctx.translate(cx, cy);
      ctx.rotate(-alphaRad);
      ctx.translate(-cx, -cy);
    }

    // Mass Block
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.roundRect(cx - blockW / 2, cy - blockH / 2, blockW, blockH, 5 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`m = ${mass} kg`, cx, cy + 4 * dpr);

    // Normal force arrow Up
    drawArrow(ctx, cx, cy - blockH / 2, cx, cy - blockH / 2 - 55 * dpr, '#10b981', dpr);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`F_N = ${normal} N`, cx, cy - blockH / 2 - 62 * dpr);

    // Applied force arrow Right
    if (applied > 0) {
      drawArrow(ctx, cx + blockW / 2, cy, cx + blockW / 2 + 65 * dpr, cy, '#38bdf8', dpr);
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.fillText(`F_app = ${applied} N`, cx + blockW / 2 + 72 * dpr, cy + 4 * dpr);
    }

    // Friction arrow Left
    if (friction > 0) {
      drawArrow(ctx, cx - blockW / 2, cy, cx - blockW / 2 - 55 * dpr, cy, '#f59e0b', dpr);
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'right';
      ctx.fillText(`f_k = ${friction} N`, cx - blockW / 2 - 62 * dpr, cy + 4 * dpr);
    }

    ctx.restore();

    // Gravity force arrow Down (always points true vertical down)
    drawArrow(ctx, cx, cy + blockH / 2, cx, cy + blockH / 2 + 60 * dpr, '#f43f5e', dpr);
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'center';
    ctx.fillText(`W = mg = ${weight} N`, cx, cy + blockH / 2 + 75 * dpr);

    // Bottom formula banner
    const formY = y + h - 30 * dpr;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x + 12 * dpr, formY, w - 24 * dpr, 22 * dpr);
    ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Newton's 2nd Law: F_net = ${netForce} N  |  Acceleration a = F_net / m = ${accel} m/s²  |  μ_k = ${mu}`,
      x + w / 2,
      formY + 11 * dpr
    );
  } else if (diagType === 'motionDiagram') {
    // ─── Kinematic Motion & Projectile Trajectory ───────────────────────
    const v0 = Number(shape.params?.initialVelocity ?? 25);
    const ang = Number(shape.params?.angle ?? 45);
    const g = Number(shape.params?.gravity ?? 9.81);

    const rad = (ang * Math.PI) / 180;
    const v0x = v0 * Math.cos(rad);
    const v0y = v0 * Math.sin(rad);
    const flightTime = Number(((2 * v0y) / g).toFixed(2));
    const maxHeight = Number(((v0y * v0y) / (2 * g)).toFixed(2));
    const range = Number(((v0 * v0 * Math.sin(2 * rad)) / g).toFixed(2));

    const originX = x + 65 * dpr;
    const groundY = y + h - 55 * dpr;
    const plotW = w - 120 * dpr;
    const plotH = groundY - (y + 55 * dpr);

    // Ground Baseline & Vertical Axis
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(originX - 20 * dpr, groundY);
    ctx.lineTo(x + w - 25 * dpr, groundY);
    ctx.moveTo(originX, groundY + 10 * dpr);
    ctx.lineTo(originX, y + 40 * dpr);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillText('x (m)', x + w - 20 * dpr, groundY + 4 * dpr);
    ctx.fillText('y (m)', originX - 6 * dpr, y + 36 * dpr);

    // Parabolic trajectory path
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    const steps = 40;
    for (let s = 0; s <= steps; s++) {
      const frac = s / steps;
      const px = originX + frac * plotW;
      const py = groundY - 4 * plotH * frac * (1 - frac);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Apex Height Peak Indicator
    const apexX = originX + plotW / 2;
    const apexY = groundY - plotH;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.beginPath();
    ctx.moveTo(apexX, groundY);
    ctx.lineTo(apexX, apexY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(apexX, apexY, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`H_max = ${maxHeight} m`, apexX, apexY - 8 * dpr);

    // Launch Velocity Vector Arrow
    const arrowLen = 50 * dpr;
    const arrowTipX = originX + arrowLen * Math.cos(rad);
    const arrowTipY = groundY - arrowLen * Math.sin(rad);
    drawArrow(ctx, originX, groundY, arrowTipX, arrowTipY, '#f43f5e', dpr);

    // Launch Angle Arc
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(originX, groundY, 24 * dpr, -rad, 0, false);
    ctx.stroke();

    ctx.font = `bold ${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'left';
    ctx.fillText(`${ang}°`, originX + 28 * dpr, groundY - 8 * dpr);

    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`v0 = ${v0} m/s`, arrowTipX + 6 * dpr, arrowTipY - 6 * dpr);

    // Range Landing Point
    const landX = originX + plotW;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(landX, groundY, 4.5 * dpr, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${Math.max(10, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`Range R = ${range} m`, landX, groundY + 18 * dpr);

    // Formula Banner at Bottom
    const formY = y + h - 30 * dpr;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x + 12 * dpr, formY, w - 24 * dpr, 22 * dpr);
    ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Trajectory: Range = (v0²·sin(2θ))/g = ${range} m  |  H_max = ${maxHeight} m  |  Flight Time = ${flightTime} s`,
      x + w / 2,
      formY + 11 * dpr
    );
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  dpr: number
) {
  const headlen = 10 * dpr;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5 * dpr;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// ─── 3. Chemistry Renderers ───────────────────────────────────────────────────

const CHEM_CATEGORY_COLORS: Record<string, string> = {
  alkali: '#f87171',
  alkalineEarth: '#fb923c',
  transitionMetal: '#facc15',
  postTransition: '#4ade80',
  metalloid: '#2dd4bf',
  nonmetal: '#38bdf8',
  halogen: '#818cf8',
  nobleGas: '#c084fc',
  lanthanide: '#f472b6',
  actinide: '#e879f9',
};

function renderPeriodicElement(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const mode = shape.params?.mode || 'card';
  if (mode === 'table' || mode === 'overview') {
    renderCompletePeriodicTable(ctx, shape, x, y, w, h, dpr);
    return;
  }

  const elem: ChemicalElement = shape.params?.element || PERIODIC_ELEMENTS[5]; // Carbon default
  const catColor = CHEM_CATEGORY_COLORS[elem.category] || '#38bdf8';

  // Element Placard Card
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = catColor;
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * dpr);
  ctx.fill();
  ctx.stroke();

  // Category Header Bar
  ctx.fillStyle = catColor;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.roundRect(x + 4 * dpr, y + 4 * dpr, w - 8 * dpr, 28 * dpr, [10 * dpr, 10 * dpr, 0, 0]);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Atomic Number
  ctx.font = `bold ${Math.max(12, Math.round(14 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';
  ctx.fillText(`Z = ${elem.number}`, x + 14 * dpr, y + 23 * dpr);

  // Atomic Weight
  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`${elem.mass.toFixed(3)} u`, x + w - 14 * dpr, y + 23 * dpr);

  // Big Symbol with category tint
  ctx.font = `bold ${Math.max(34, Math.round(48 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = catColor;
  ctx.textAlign = 'center';
  ctx.fillText(elem.symbol, x + w / 2, y + h * 0.44);

  // Name
  ctx.font = `bold ${Math.max(13, Math.round(16 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(elem.name, x + w / 2, y + h * 0.58);

  // Category Pill
  ctx.font = `600 ${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = catColor;
  ctx.fillText(elem.category.toUpperCase(), x + w / 2, y + h * 0.68);

  // Electron Configuration
  ctx.font = `500 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(elem.electronConfig, x + w / 2, y + h * 0.79);

  // Shells distribution
  ctx.font = `600 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Shells: [${elem.electronsPerShell.join(', ')}]`, x + w / 2, y + h * 0.91);
}

/**
 * Renders complete 118-element periodic table on board with 18 groups, 7 periods,
 * lanthanides, actinides, category color coding, and legend banner.
 */
function renderCompletePeriodicTable(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  // Container Box
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.96)';
  ctx.strokeStyle = shape.strokeColor || '#38bdf8';
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * dpr);
  ctx.fill();
  ctx.stroke();

  // Title Banner
  const titleY = y + 26 * dpr;
  ctx.font = `bold ${Math.max(13, Math.round(16 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText('PERIODIC TABLE OF THE ELEMENTS', x + 24 * dpr, titleY);

  ctx.font = `500 ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Complete 118 Elements · Standard IUPAC Layout · Groups 1–18 · Periods 1–7', x + 340 * dpr, titleY);

  // Top Legend with category color chips
  const legendX = x + 24 * dpr;
  const legendY = y + 46 * dpr;
  const categories: { label: string; key: string }[] = [
    { label: 'Alkali', key: 'alkali' },
    { label: 'Alkaline Earth', key: 'alkalineEarth' },
    { label: 'Transition', key: 'transitionMetal' },
    { label: 'Post-Transition', key: 'postTransition' },
    { label: 'Metalloid', key: 'metalloid' },
    { label: 'Nonmetal', key: 'nonmetal' },
    { label: 'Halogen', key: 'halogen' },
    { label: 'Noble Gas', key: 'nobleGas' },
    { label: 'Lanthanide', key: 'lanthanide' },
    { label: 'Actinide', key: 'actinide' },
  ];

  ctx.font = `600 ${Math.max(8, Math.round(9.5 * dpr))}px Inter, sans-serif`;
  let legOffset = legendX;
  categories.forEach((cat) => {
    const color = CHEM_CATEGORY_COLORS[cat.key] || '#38bdf8';
    ctx.fillStyle = color;
    ctx.fillRect(legOffset, legendY - 8 * dpr, 9 * dpr, 9 * dpr);
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText(cat.label, legOffset + 13 * dpr, legendY);
    legOffset += (cat.label.length * 6.5 + 26) * dpr;
  });

  // Table Grid Metrics
  const leftPad = 32 * dpr;
  const topPad = 62 * dpr;
  const rightPad = 18 * dpr;
  const btmPad = 14 * dpr;
  const gridW = w - leftPad - rightPad;
  const gridH = h - topPad - btmPad;

  const cols = 18;
  const rows = 9.8; // 7 periods + gap + 2 f-block rows
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  // Group Headers (1 to 18)
  ctx.font = `bold ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  for (let c = 1; c <= 18; c++) {
    const gx = x + leftPad + (c - 1) * cellW + cellW / 2;
    ctx.fillText(String(c), gx, y + topPad - 4 * dpr);
  }

  // Period Headers (1 to 7)
  for (let r = 1; r <= 7; r++) {
    const gy = y + topPad + (r - 1) * cellH + cellH / 2 + 3 * dpr;
    ctx.fillText(String(r), x + leftPad - 12 * dpr, gy);
  }

  // Draw Element Cells
  PERIODIC_ELEMENTS.forEach((el) => {
    let col = el.group;
    let row = el.period;

    // Lanthanides & Actinides positioning
    if (el.category === 'lanthanide') {
      row = 8.5; // row index below period 7
      col = el.number - 57 + 3; // placed at cols 3 to 17
    } else if (el.category === 'actinide') {
      row = 9.5; // row index below lanthanides
      col = el.number - 89 + 3; // placed at cols 3 to 17
    }

    const cx = x + leftPad + (col - 1) * cellW;
    const cy = y + topPad + (row - 1) * cellH;
    const cw = cellW - 2.5 * dpr;
    const ch = cellH - 2.5 * dpr;

    const catColor = CHEM_CATEGORY_COLORS[el.category] || '#38bdf8';

    // Cell Background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 3 * dpr);
    ctx.fill();

    // Colored left accent bar / border
    ctx.strokeStyle = catColor;
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    // Top Category Color Bar
    ctx.fillStyle = catColor;
    ctx.fillRect(cx + 1 * dpr, cy + 1 * dpr, cw - 2 * dpr, 2.5 * dpr);

    // Atomic Number (top-left)
    ctx.font = `600 ${Math.max(7, Math.round(7.5 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(String(el.number), cx + 3 * dpr, cy + 9.5 * dpr);

    // Symbol (center)
    ctx.font = `bold ${Math.max(10, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = catColor;
    ctx.textAlign = 'center';
    ctx.fillText(el.symbol, cx + cw / 2, cy + ch * 0.62);

    // Atomic mass (bottom center)
    if (ch >= 32 * dpr) {
      ctx.font = `500 ${Math.max(6.5, Math.round(7 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(el.mass.toFixed(1), cx + cw / 2, cy + ch - 3 * dpr);
    }
  });

  // Lanthanide & Actinide placeholders in main table (Period 6 & 7, Group 3)
  const lRow = y + topPad + 5 * cellH;
  const aRow = y + topPad + 6 * cellH;
  const g3X = x + leftPad + 2 * cellW;
  const pW = cellW - 2.5 * dpr;
  const pH = cellH - 2.5 * dpr;

  // 57-71 La*
  ctx.fillStyle = 'rgba(244, 114, 182, 0.12)';
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.roundRect(g3X, lRow, pW, pH, 3 * dpr);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold ${Math.max(7.5, Math.round(8 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#f472b6';
  ctx.textAlign = 'center';
  ctx.fillText('57–71', g3X + pW / 2, lRow + pH * 0.45);
  ctx.fillText('La*', g3X + pW / 2, lRow + pH * 0.8);

  // 89-103 Ac**
  ctx.fillStyle = 'rgba(232, 121, 249, 0.12)';
  ctx.strokeStyle = '#e879f9';
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.roundRect(g3X, aRow, pW, pH, 3 * dpr);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e879f9';
  ctx.fillText('89–103', g3X + pW / 2, aRow + pH * 0.45);
  ctx.fillText('Ac**', g3X + pW / 2, aRow + pH * 0.8);

  // Row labels for f-block below table
  ctx.font = `bold ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#f472b6';
  ctx.textAlign = 'right';
  ctx.fillText('La* (57–71)', g3X - 6 * dpr, y + topPad + 7.5 * cellH + cellH / 2 + 3 * dpr);

  ctx.fillStyle = '#e879f9';
  ctx.fillText('Ac** (89–103)', g3X - 6 * dpr, y + topPad + 8.5 * cellH + cellH / 2 + 3 * dpr);
}

function renderAtomicModel(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const symbol = shape.params?.symbol || 'C';
  const name = shape.params?.name || 'Carbon';
  const atomicNum = Number(shape.params?.atomicNumber ?? 6);
  const mass = Number(shape.params?.mass ?? 12);
  const shells: number[] = shape.params?.electronsPerShell || [2, 4];
  const neutrons = Math.max(0, Math.round(mass - atomicNum));

  // Background Container
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = shape.strokeColor || '#38bdf8';
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * dpr);
  ctx.fill();
  ctx.stroke();

  const cx = x + w / 2;
  const cy = y + (h - 40 * dpr) / 2 + 10 * dpr;
  const maxR = Math.min(w * 0.44, (h - 70 * dpr) * 0.44);

  // Nucleus
  const nucR = Math.max(22 * dpr, Math.min(30 * dpr, maxR * 0.28));
  ctx.beginPath();
  ctx.arc(cx, cy, nucR, 0, Math.PI * 2);
  ctx.fillStyle = '#f43f5e';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();

  // Nucleus Text
  ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(symbol, cx, cy - 8 * dpr);
  ctx.font = `600 ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
  ctx.fillText(`${atomicNum}p⁺`, cx, cy + 3 * dpr);
  ctx.fillText(`${neutrons}n⁰`, cx, cy + 13 * dpr);

  // Shells
  const shellNames = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
  const shellStep = (maxR - nucR - 8 * dpr) / Math.max(1, shells.length);

  shells.forEach((electrons, sIdx) => {
    const orbitR = nucR + (sIdx + 1) * shellStep;
    const shellLetter = shellNames[sIdx] || `n=${sIdx + 1}`;

    // Orbital ring
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([3 * dpr, 3 * dpr]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Shell label
    ctx.font = `bold ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(`${shellLetter} (${electrons})`, cx, cy - orbitR - 3 * dpr);

    // Electrons on ring
    for (let e = 0; e < electrons; e++) {
      const theta = (e * 2 * Math.PI) / electrons - Math.PI / 2;
      const ex = cx + orbitR * Math.cos(theta);
      const ey = cy + orbitR * Math.sin(theta);

      // Glow
      ctx.beginPath();
      ctx.arc(ex, ey, 5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(ex, ey, 3.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
    }
  });

  // Bottom Info Banner
  const bannerY = y + h - 34 * dpr;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x + 12 * dpr, bannerY, w - 24 * dpr, 24 * dpr);

  ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `Bohr Model: ${name} (${symbol}) · Z = ${atomicNum} · Mass = ${mass.toFixed(1)} u · Shells [${shells.join(', ')}]`,
    x + w / 2,
    bannerY + 12 * dpr
  );
}

function renderLabApparatus(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const type = shape.params?.apparatusType || 'beaker';

  switch (type) {
    case 'beaker':
      renderBeaker(ctx, shape, x, y, w, h, dpr);
      break;
    case 'flask':
      renderErlenmeyerFlask(ctx, shape, x, y, w, h, dpr);
      break;
    case 'bunsenBurner':
      renderBunsenBurner(ctx, shape, x, y, w, h, dpr);
      break;
    case 'testTubeRack':
    case 'testTube':
      renderTestTubeRack(ctx, shape, x, y, w, h, dpr);
      break;
    default:
      renderBeaker(ctx, shape, x, y, w, h, dpr);
      break;
  }
}

/**
 * 1. Laboratory Beaker (Gravity-Responsive Fluid Simulation)
 * Water surface tilts counter to shape rotation so it stays horizontal in the world,
 * pours gracefully when tilted past the spout, with graduations and polished glassware.
 */
function renderBeaker(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const pad = 16 * dpr;
  const bx = x + pad;
  const by = y + pad;
  const bw = w - pad * 2;
  const bh = h - pad * 2;

  const level = Math.max(0.05, Math.min(0.95, Number(shape.params?.liquidLevel ?? 0.6)));
  const liquidColor = shape.params?.liquidColor || 'rgba(56, 189, 248, 0.55)';
  const solutionName = shape.params?.solutionName || shape.label || 'Glass Beaker (250 mL)';

  // Gravity fluid mechanics in beaker coordinate frame
  const rotDeg = shape.rotation || 0;
  const rotRad = (rotDeg * Math.PI) / 180;
  // Local water surface slope counteracts rotation: m = -tan(rotRad)
  const tanTheta = Math.tan(rotRad);
  const clampedTan = Math.max(-4, Math.min(4, tanTheta));

  const xL = bx + 3 * dpr;
  const xR = bx + bw - 3 * dpr;
  const innerW = xR - xL;
  const xMid = (xL + xR) / 2;
  const yBot = by + bh - 3 * dpr;
  const yTop = by + 2 * dpr;
  const innerH = yBot - yTop;

  // Un-tilted baseline water level
  let yMid = yBot - innerH * level;

  // Surface heights at left and right walls
  // When rotated clockwise (rotDeg > 0), water climbs the right wall (yR decreases towards top)
  let yL = yMid + (innerW / 2) * clampedTan;
  let yR = yMid - (innerW / 2) * clampedTan;

  // Pouring detection and spout clipping
  let isPouringRight = false;
  let isPouringLeft = false;

  if (rotDeg > 5 && yR <= yTop) {
    // Tilted right: water reaches right pour spout
    isPouringRight = true;
    yR = yTop;
    yL = Math.min(yBot, yTop + innerW * clampedTan);
  } else if (rotDeg < -5 && yL <= yTop) {
    // Tilted left: water reaches left pour spout
    isPouringLeft = true;
    yL = yTop;
    yR = Math.min(yBot, yTop - innerW * clampedTan);
  }

  // 1. Draw Liquid Fill clipped to inner glass container
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(xL, yTop);
  ctx.lineTo(xL, yBot - 8 * dpr);
  ctx.arcTo(xL, yBot, xL + 8 * dpr, yBot, 8 * dpr);
  ctx.lineTo(xR - 8 * dpr, yBot);
  ctx.arcTo(xR, yBot, xR, yBot - 8 * dpr, 8 * dpr);
  ctx.lineTo(xR, yTop);
  ctx.closePath();
  ctx.clip();

  // Fill liquid volume below surface line
  ctx.beginPath();
  ctx.moveTo(xL, yBot + 10 * dpr);
  ctx.lineTo(xL, yL);
  ctx.lineTo(xR, yR);
  ctx.lineTo(xR, yBot + 10 * dpr);
  ctx.closePath();

  const liquidGrad = ctx.createLinearGradient(xMid, yTop, xMid, yBot);
  liquidGrad.addColorStop(0, liquidColor);
  liquidGrad.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
  ctx.fillStyle = liquidColor;
  ctx.fill();

  // Liquid surface meniscus line
  ctx.beginPath();
  ctx.moveTo(xL, yL);
  ctx.lineTo(xR, yR);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.8 * dpr;
  ctx.stroke();

  ctx.restore();

  // 2. Pouring Stream (falling in direction of world gravity)
  if (isPouringRight || isPouringLeft) {
    ctx.save();
    const pourX = isPouringRight ? bx + bw + 4 * dpr : bx - 4 * dpr;
    const pourY = by + 2 * dpr;

    // Gravity vector in local frame: (-sin(rotRad), cos(rotRad))
    const gx = -Math.sin(rotRad);
    const gy = Math.cos(rotRad);
    const streamLen = 50 * dpr;

    ctx.beginPath();
    ctx.moveTo(pourX - 2 * dpr, pourY);
    ctx.lineTo(pourX + gx * streamLen, pourY + gy * streamLen);
    ctx.strokeStyle = liquidColor;
    ctx.lineWidth = 4 * dpr;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Falling droplets
    ctx.beginPath();
    ctx.arc(pourX + gx * (streamLen + 10 * dpr), pourY + gy * (streamLen + 10 * dpr), 2.5 * dpr, 0, Math.PI * 2);
    ctx.arc(pourX + gx * (streamLen + 20 * dpr), pourY + gy * (streamLen + 20 * dpr), 2 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = liquidColor;
    ctx.fill();
    ctx.restore();
  }

  // 3. Glass Beaker Outline with Pour Spout Lips
  ctx.beginPath();
  ctx.moveTo(bx - 7 * dpr, by); // Left spout
  ctx.lineTo(bx, by + 4 * dpr);
  ctx.lineTo(bx, by + bh - 8 * dpr);
  ctx.arcTo(bx, by + bh, bx + 8 * dpr, by + bh, 8 * dpr);
  ctx.lineTo(bx + bw - 8 * dpr, by + bh);
  ctx.arcTo(bx + bw, by + bh, bx + bw, by + bh - 8 * dpr, 8 * dpr);
  ctx.lineTo(bx + bw, by + 4 * dpr);
  ctx.lineTo(bx + bw + 7 * dpr, by); // Right spout
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5 * dpr;
  ctx.stroke();

  // Specular glass highlight reflection (left wall)
  ctx.beginPath();
  ctx.moveTo(bx + 5 * dpr, by + 10 * dpr);
  ctx.lineTo(bx + 5 * dpr, by + bh - 14 * dpr);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();

  // 4. Whiteboard Measurement Graduations (50, 100, 150, 200, 250 mL)
  ctx.font = `600 ${Math.max(8, Math.round(8.5 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (let i = 1; i <= 5; i++) {
    const gy = by + bh - (bh / 6) * i;
    const isMajor = i % 2 === 1;
    ctx.beginPath();
    ctx.moveTo(bx + 6 * dpr, gy);
    ctx.lineTo(bx + (isMajor ? 22 * dpr : 14 * dpr), gy);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.4 * dpr;
    ctx.stroke();

    if (isMajor) {
      ctx.fillText(`${i * 50}`, bx + 26 * dpr, gy);
    }
  }

  // 5. Solution Title Badge
  ctx.font = `bold ${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText(solutionName, xMid, by + bh + 14 * dpr);
}

/**
 * 2. Erlenmeyer Titration Flask (Modern Features)
 * Conical geometry with gravity fluid leveling, graduations, optional rubber stopper
 * with glass delivery tube, effervescent bubbles, and magnetic stirrer bar.
 */
function renderErlenmeyerFlask(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const cx = x + w / 2;
  const neckW = 30 * dpr;
  const neckH = 44 * dpr;
  const baseW = w * 0.8;
  const botY = y + h - 18 * dpr;
  const topY = y + 14 * dpr;

  const level = Math.max(0.05, Math.min(0.9, Number(shape.params?.liquidLevel ?? 0.55)));
  const liquidColor = shape.params?.liquidColor || 'rgba(168, 85, 247, 0.55)';
  const hasStopper = Boolean(shape.params?.hasStopper);
  const isBubbling = shape.params?.isBubbling !== false;
  const hasStirrer = Boolean(shape.params?.hasStirrer);
  const solutionName = shape.params?.solutionName || shape.label || 'Erlenmeyer Flask (250 mL)';

  // Gravity fluid mechanics
  const rotDeg = shape.rotation || 0;
  const rotRad = (rotDeg * Math.PI) / 180;
  const clampedTan = Math.max(-3, Math.min(3, Math.tan(rotRad)));

  const innerBaseW = baseW - 8 * dpr;
  const liquidHeight = (botY - (topY + neckH)) * level;
  const yMid = botY - liquidHeight;

  // 1. Clip to Flask Interior for Liquid Fill
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2 + 2 * dpr, topY + neckH);
  ctx.lineTo(cx - innerBaseW / 2 + 8 * dpr, botY - 3 * dpr);
  ctx.arcTo(cx - innerBaseW / 2, botY, cx - innerBaseW / 2 + 10 * dpr, botY, 8 * dpr);
  ctx.lineTo(cx + innerBaseW / 2 - 10 * dpr, botY);
  ctx.arcTo(cx + innerBaseW / 2, botY, cx + innerBaseW / 2 - 8 * dpr, botY - 3 * dpr, 8 * dpr);
  ctx.lineTo(cx + neckW / 2 - 2 * dpr, topY + neckH);
  ctx.closePath();
  ctx.clip();

  // Liquid with gravity surface angle
  const span = innerBaseW * 0.9;
  const yL = yMid + (span / 2) * clampedTan;
  const yR = yMid - (span / 2) * clampedTan;

  ctx.beginPath();
  ctx.moveTo(cx - span / 2, botY + 10 * dpr);
  ctx.lineTo(cx - span / 2, yL);
  ctx.lineTo(cx + span / 2, yR);
  ctx.lineTo(cx + span / 2, botY + 10 * dpr);
  ctx.closePath();
  ctx.fillStyle = liquidColor;
  ctx.fill();

  // Liquid surface meniscus line
  ctx.beginPath();
  ctx.moveTo(cx - span / 2, yL);
  ctx.lineTo(cx + span / 2, yR);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.6 * dpr;
  ctx.stroke();

  // Effervescent Reaction Micro-Bubbles
  if (isBubbling) {
    const bubbleOffsets = [
      { x: -16, y: -12, r: 2.2 },
      { x: 4, y: -18, r: 1.8 },
      { x: -6, y: -30, r: 2.5 },
      { x: 14, y: -26, r: 1.6 },
      { x: -22, y: -40, r: 2.0 },
      { x: 8, y: -45, r: 2.4 },
    ];
    bubbleOffsets.forEach((b) => {
      const byPos = botY + b.y * dpr;
      if (byPos > yMid) {
        ctx.beginPath();
        ctx.arc(cx + b.x * dpr, byPos, b.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 0.8 * dpr;
        ctx.stroke();
      }
    });
  }

  // Magnetic Stir Bar & Vortex
  if (hasStirrer) {
    // White Teflon stir bar
    ctx.beginPath();
    ctx.roundRect(cx - 10 * dpr, botY - 8 * dpr, 20 * dpr, 6 * dpr, 3 * dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    // Rotational vortex swirl
    ctx.beginPath();
    ctx.ellipse(cx, botY - 14 * dpr, 16 * dpr, 5 * dpr, 0, 0, Math.PI * 1.6);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();
  }

  ctx.restore();

  // 2. Glass Outline with Beaded Lip
  ctx.beginPath();
  // Beaded mouth lip
  ctx.roundRect(cx - (neckW + 8 * dpr) / 2, topY - 3 * dpr, neckW + 8 * dpr, 6 * dpr, 3 * dpr);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5 * dpr;
  ctx.stroke();

  // Body outline
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, topY + 3 * dpr);
  ctx.lineTo(cx - neckW / 2, topY + neckH);
  ctx.lineTo(cx - baseW / 2, botY - 8 * dpr);
  ctx.arcTo(cx - baseW / 2, botY, cx - baseW / 2 + 10 * dpr, botY, 10 * dpr);
  ctx.lineTo(cx + baseW / 2 - 10 * dpr, botY);
  ctx.arcTo(cx + baseW / 2, botY, cx + baseW / 2, botY - 8 * dpr, 10 * dpr);
  ctx.lineTo(cx + neckW / 2, topY + neckH);
  ctx.lineTo(cx + neckW / 2, topY + 3 * dpr);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5 * dpr;
  ctx.stroke();

  // Volume Graduation Markings
  ctx.font = `600 ${Math.max(8, Math.round(8 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  for (let i = 1; i <= 4; i++) {
    const gy = botY - ((botY - (topY + neckH)) / 5) * i;
    const progress = (botY - gy) / (botY - (topY + neckH));
    const currentW = baseW - (baseW - neckW) * progress;
    ctx.beginPath();
    ctx.moveTo(cx - currentW / 2 + 6 * dpr, gy);
    ctx.lineTo(cx - currentW / 2 + 18 * dpr, gy);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.3 * dpr;
    ctx.stroke();
    ctx.fillText(`${i * 50}`, cx - currentW / 2 + 22 * dpr, gy + 1 * dpr);
  }

  // 3. Optional Rubber Stopper with Glass Delivery Tube
  if (hasStopper) {
    // Terracotta silicone stopper
    ctx.beginPath();
    ctx.moveTo(cx - neckW / 2 + 2 * dpr, topY + 8 * dpr);
    ctx.lineTo(cx - neckW / 2 - 2 * dpr, topY - 10 * dpr);
    ctx.lineTo(cx + neckW / 2 + 2 * dpr, topY - 10 * dpr);
    ctx.lineTo(cx + neckW / 2 - 2 * dpr, topY + 8 * dpr);
    ctx.closePath();
    ctx.fillStyle = '#b45309';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Curved glass delivery tube exiting stopper
    ctx.beginPath();
    ctx.moveTo(cx, topY - 8 * dpr);
    ctx.lineTo(cx, topY - 26 * dpr);
    ctx.arcTo(cx, topY - 34 * dpr, cx + 14 * dpr, topY - 34 * dpr, 8 * dpr);
    ctx.lineTo(cx + 38 * dpr, topY - 34 * dpr);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3 * dpr;
    ctx.stroke();
  }

  // Solution Label Badge
  ctx.font = `bold ${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#c084fc';
  ctx.textAlign = 'center';
  ctx.fillText(solutionName, cx, botY + 14 * dpr);
}

/**
 * 3. Bunsen Burner (Classroom Laboratory Heating Engine)
 * Cast iron heavy base, gas inlet nozzle, chimney tube, adjustable air collar,
 * and realistic animated multi-stage flames (Safety Yellow, Gentle Blue, Roaring Dual-Cone).
 */
function renderBunsenBurner(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const cx = x + w / 2;
  const botY = y + h - 18 * dpr;
  const baseW = Math.min(w * 0.72, 130 * dpr);
  const baseH = 18 * dpr;

  const hasFlame = shape.params?.hasFlame !== false;
  const flameType = shape.params?.flameType || 'roaring'; // 'safety' | 'gentle' | 'roaring'
  const chimneyW = 20 * dpr;
  const chimneyH = 100 * dpr;
  const chimneyTop = botY - baseH - chimneyH;

  // 1. Heavy Cast-Iron Base Plate with Bevels and Rubber Feet
  // Rubber feet
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - baseW / 2 + 6 * dpr, botY, 14 * dpr, 4 * dpr);
  ctx.fillRect(cx + baseW / 2 - 20 * dpr, botY, 14 * dpr, 4 * dpr);

  // Base tier 1 (wide plate)
  const baseGrad = ctx.createLinearGradient(cx - baseW / 2, 0, cx + baseW / 2, 0);
  baseGrad.addColorStop(0, '#334155');
  baseGrad.addColorStop(0.5, '#1e293b');
  baseGrad.addColorStop(1, '#0f172a');

  ctx.beginPath();
  ctx.roundRect(cx - baseW / 2, botY - baseH, baseW, baseH, [6 * dpr, 6 * dpr, 2 * dpr, 2 * dpr]);
  ctx.fillStyle = baseGrad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.8 * dpr;
  ctx.stroke();

  // Base tier 2 (central raised boss)
  ctx.beginPath();
  ctx.roundRect(cx - 24 * dpr, botY - baseH - 10 * dpr, 48 * dpr, 10 * dpr, 3 * dpr);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // 2. Gas Supply Hose Nipple & Flexible Tubing
  ctx.beginPath();
  ctx.moveTo(cx - 24 * dpr, botY - baseH - 5 * dpr);
  ctx.lineTo(cx - 42 * dpr, botY - baseH - 5 * dpr);
  ctx.strokeStyle = '#f59e0b'; // Brass nozzle
  ctx.lineWidth = 6 * dpr;
  ctx.stroke();

  // Amber/Orange rubber gas hose
  ctx.beginPath();
  ctx.moveTo(cx - 42 * dpr, botY - baseH - 5 * dpr);
  ctx.bezierCurveTo(cx - 65 * dpr, botY - baseH - 5 * dpr, cx - 75 * dpr, botY - 2 * dpr, cx - 85 * dpr, botY);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 5 * dpr;
  ctx.stroke();

  // 3. Brass Needle Valve Control Wheel
  ctx.beginPath();
  ctx.ellipse(cx + 26 * dpr, botY - baseH - 5 * dpr, 7 * dpr, 4 * dpr, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.2 * dpr;
  ctx.stroke();

  // 4. Polished Brass/Steel Chimney Barrel
  const barrelGrad = ctx.createLinearGradient(cx - chimneyW / 2, 0, cx + chimneyW / 2, 0);
  barrelGrad.addColorStop(0, '#94a3b8');
  barrelGrad.addColorStop(0.35, '#f8fafc');
  barrelGrad.addColorStop(0.7, '#cbd5e1');
  barrelGrad.addColorStop(1, '#64748b');

  ctx.beginPath();
  ctx.rect(cx - chimneyW / 2, chimneyTop, chimneyW, chimneyH);
  ctx.fillStyle = barrelGrad;
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // 5. Air Hole Collar
  const collarY = botY - baseH - 24 * dpr;
  const collarH = 14 * dpr;
  ctx.beginPath();
  ctx.roundRect(cx - (chimneyW + 6 * dpr) / 2, collarY, chimneyW + 6 * dpr, collarH, 2 * dpr);
  ctx.fillStyle = '#475569';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2 * dpr;
  ctx.stroke();

  // Air intake hole aperture
  const isCollarOpen = flameType === 'roaring';
  const isCollarHalf = flameType === 'gentle';
  ctx.beginPath();
  const holeW = isCollarOpen ? 8 * dpr : isCollarHalf ? 4 * dpr : 1 * dpr;
  ctx.roundRect(cx - holeW / 2, collarY + 3 * dpr, holeW, collarH - 6 * dpr, 2 * dpr);
  ctx.fillStyle = isCollarOpen ? '#0f172a' : isCollarHalf ? '#1e293b' : '#334155';
  ctx.fill();

  // 6. Interactive Multi-Stage Flame
  if (hasFlame) {
    ctx.save();
    if (flameType === 'safety') {
      // 🟡 Safety Flame (~300°C) - Soft golden-yellow & orange
      const fH = 75 * dpr;
      const fW = 28 * dpr;

      ctx.beginPath();
      ctx.moveTo(cx - fW / 2, chimneyTop);
      ctx.bezierCurveTo(cx - fW, chimneyTop - fH * 0.5, cx - fW * 0.4, chimneyTop - fH, cx, chimneyTop - fH);
      ctx.bezierCurveTo(cx + fW * 0.4, chimneyTop - fH, cx + fW, chimneyTop - fH * 0.5, cx + fW / 2, chimneyTop);
      ctx.closePath();

      const safetyGrad = ctx.createRadialGradient(cx, chimneyTop - fH * 0.4, 2 * dpr, cx, chimneyTop - fH * 0.4, fH * 0.65);
      safetyGrad.addColorStop(0, '#fef08a');
      safetyGrad.addColorStop(0.5, '#f59e0b');
      safetyGrad.addColorStop(1, 'rgba(234, 88, 12, 0.85)');
      ctx.fillStyle = safetyGrad;
      ctx.fill();

    } else if (flameType === 'gentle') {
      // 🔵 Gentle Blue Flame (~700°C) - Translucent cyan with faint violet base
      const fH = 65 * dpr;
      const fW = 22 * dpr;

      ctx.beginPath();
      ctx.moveTo(cx - fW / 2, chimneyTop);
      ctx.bezierCurveTo(cx - fW * 0.8, chimneyTop - fH * 0.5, cx - 2 * dpr, chimneyTop - fH, cx, chimneyTop - fH);
      ctx.bezierCurveTo(cx + 2 * dpr, chimneyTop - fH, cx + fW * 0.8, chimneyTop - fH * 0.5, cx + fW / 2, chimneyTop);
      ctx.closePath();

      const gentleGrad = ctx.createLinearGradient(cx, chimneyTop, cx, chimneyTop - fH);
      gentleGrad.addColorStop(0, '#6366f1');
      gentleGrad.addColorStop(0.4, '#38bdf8');
      gentleGrad.addColorStop(1, 'rgba(125, 211, 252, 0.4)');
      ctx.fillStyle = gentleGrad;
      ctx.fill();

    } else {
      // ⚡ Roaring Non-Luminous Flame (~1400°C) - Hot dual-cone combustion
      const outerH = 82 * dpr;
      const outerW = 24 * dpr;
      const innerH = 42 * dpr;
      const innerW = 14 * dpr;

      // Outer oxidation mantle (translucent pale electric blue)
      ctx.beginPath();
      ctx.moveTo(cx - outerW / 2, chimneyTop);
      ctx.bezierCurveTo(cx - outerW * 0.8, chimneyTop - outerH * 0.5, cx - 1 * dpr, chimneyTop - outerH, cx, chimneyTop - outerH);
      ctx.bezierCurveTo(cx + 1 * dpr, chimneyTop - outerH, cx + outerW * 0.8, chimneyTop - outerH * 0.5, cx + outerW / 2, chimneyTop);
      ctx.closePath();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();

      // Inner reduction strike cone (intense bright turquoise/white point)
      ctx.beginPath();
      ctx.moveTo(cx - innerW / 2, chimneyTop);
      ctx.lineTo(cx, chimneyTop - innerH);
      ctx.lineTo(cx + innerW / 2, chimneyTop);
      ctx.closePath();

      const innerGrad = ctx.createLinearGradient(cx, chimneyTop, cx, chimneyTop - innerH);
      innerGrad.addColorStop(0, '#0284c7');
      innerGrad.addColorStop(0.6, '#38bdf8');
      innerGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = innerGrad;
      ctx.fill();
    }
    ctx.restore();
  }

  // 7. Interactive Temperature Readout Placard
  const tempText =
    !hasFlame
      ? 'Flame Off'
      : flameType === 'safety'
      ? '🔥 300°C · Safety Flame'
      : flameType === 'gentle'
      ? '🔥 700°C · Gentle Blue Flame'
      : '⚡ 1400°C · Roaring Blue Flame';

  ctx.font = `bold ${Math.max(9, Math.round(9.5 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = !hasFlame ? '#94a3b8' : flameType === 'safety' ? '#f59e0b' : '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText(tempText, cx, botY + 12 * dpr);
}

/**
 * 4. Test Tube Rack (Classroom Multi-Tube Chemical Station)
 * Realistic wooden/acrylic rack with 3 to 6 borosilicate glass test tubes,
 * individual chemical solution colors, fill levels, labels, stoppers, and reaction bubbles.
 */
function renderTestTubeRack(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const count = Math.max(2, Math.min(6, Number(shape.params?.count ?? 4)));
  const defaultColors = [
    'rgba(14, 165, 233, 0.65)',  // CuSO4 Cyan
    'rgba(168, 85, 247, 0.65)',  // KMnO4 Purple
    'rgba(245, 158, 11, 0.65)',  // FeCl3 Amber
    'rgba(236, 72, 153, 0.65)',  // Phenolphthalein Magenta
    'rgba(16, 185, 129, 0.65)',  // NiSO4 Green
    'rgba(148, 163, 184, 0.65)', // Effervescent Silver
  ];
  const defaultLevels = [0.65, 0.75, 0.5, 0.8, 0.6, 0.7];
  const defaultLabels = ['CuSO₄', 'KMnO₄', 'FeCl₃', 'Base+Ind', 'NiSO₄', 'Zn+HCl'];

  const tubeColors: string[] = shape.params?.tubeColors || defaultColors;
  const tubeLevels: number[] = shape.params?.tubeLevels || defaultLevels;
  const tubeLabels: string[] = shape.params?.tubeLabels || defaultLabels;
  const hasStoppers: boolean[] = shape.params?.stoppers || [false, false, true, false, false, false];

  const padX = 16 * dpr;
  const rackBot = y + h - 18 * dpr;
  const rackW = w - padX * 2;
  const rackTop = y + 40 * dpr;
  const rackH = rackBot - rackTop;

  // 1. Back Wall / Bottom Base Plate of Rack
  const woodGrad = ctx.createLinearGradient(x + padX, 0, x + padX + rackW, 0);
  woodGrad.addColorStop(0, '#334155');
  woodGrad.addColorStop(0.5, '#1e293b');
  woodGrad.addColorStop(1, '#0f172a');

  // Bottom Base Plate
  ctx.beginPath();
  ctx.roundRect(x + padX, rackBot - 16 * dpr, rackW, 16 * dpr, 4 * dpr);
  ctx.fillStyle = woodGrad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // Support Uprights (Left and Right Columns)
  const colW = 12 * dpr;
  ctx.beginPath();
  ctx.roundRect(x + padX + 2 * dpr, rackTop, colW, rackH - 14 * dpr, 3 * dpr);
  ctx.roundRect(x + padX + rackW - colW - 2 * dpr, rackTop, colW, rackH - 14 * dpr, 3 * dpr);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // Middle Stabilizer Rail
  const midRailY = rackTop + rackH * 0.5;
  ctx.beginPath();
  ctx.roundRect(x + padX + colW, midRailY, rackW - colW * 2, 10 * dpr, 2 * dpr);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2 * dpr;
  ctx.stroke();

  // 2. Render Test Tubes (placed in rack sockets)
  const availableW = rackW - colW * 2 - 20 * dpr;
  const stepX = availableW / count;
  const tubeW = Math.min(24 * dpr, stepX * 0.65);
  const tubeH = rackH * 0.95;
  const tubeTop = rackTop - 15 * dpr;
  const tubeBot = rackBot - 18 * dpr;

  for (let i = 0; i < count; i++) {
    const tx = x + padX + colW + 10 * dpr + stepX * i + (stepX - tubeW) / 2;
    const tColor = tubeColors[i % tubeColors.length];
    const tLevel = tubeLevels[i % tubeLevels.length] ?? 0.6;
    const tLabel = tubeLabels[i % tubeLabels.length] || `Tube ${i + 1}`;
    const hasStopper = hasStoppers[i] ?? false;

    // A. Glass Tube Clip for Liquid Fill
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tx + 2 * dpr, tubeTop);
    ctx.lineTo(tx + 2 * dpr, tubeBot - tubeW / 2);
    ctx.arc(tx + tubeW / 2, tubeBot - tubeW / 2, tubeW / 2 - 2 * dpr, Math.PI, 0, true);
    ctx.lineTo(tx + tubeW - 2 * dpr, tubeTop);
    ctx.closePath();
    ctx.clip();

    // Fill liquid from hemispherical bottom up
    const liqH = tubeH * tLevel;
    const liqY = tubeBot - liqH;
    ctx.fillStyle = tColor;
    ctx.fillRect(tx + 1 * dpr, liqY, tubeW - 2 * dpr, liqH + 10 * dpr);

    // Liquid surface meniscus
    ctx.beginPath();
    ctx.ellipse(tx + tubeW / 2, liqY, tubeW / 2 - 2 * dpr, 2.5 * dpr, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();

    // Micro-bubbles in active tube 1 and 6
    if (i === 0 || i === count - 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(tx + tubeW * 0.35, liqY + 12 * dpr, 1.5 * dpr, 0, Math.PI * 2);
      ctx.arc(tx + tubeW * 0.65, liqY + 22 * dpr, 1.2 * dpr, 0, Math.PI * 2);
      ctx.arc(tx + tubeW * 0.45, liqY + 32 * dpr, 1.8 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // B. Clear Borosilicate Glass Outline with Hemispherical Bottom
    ctx.beginPath();
    ctx.moveTo(tx, tubeTop);
    ctx.lineTo(tx, tubeBot - tubeW / 2);
    ctx.arc(tx + tubeW / 2, tubeBot - tubeW / 2, tubeW / 2, Math.PI, 0, true);
    ctx.lineTo(tx + tubeW, tubeTop);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8 * dpr;
    ctx.stroke();

    // Polished Glass Rim Lip at Top
    ctx.beginPath();
    ctx.roundRect(tx - 2 * dpr, tubeTop - 2 * dpr, tubeW + 4 * dpr, 4 * dpr, 2 * dpr);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Glass Reflection Highlight Stripe
    ctx.beginPath();
    ctx.moveTo(tx + 3 * dpr, tubeTop + 6 * dpr);
    ctx.lineTo(tx + 3 * dpr, tubeBot - tubeW / 2 - 4 * dpr);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();

    // C. Optional Cork Stopper
    if (hasStopper) {
      ctx.beginPath();
      ctx.moveTo(tx + 1 * dpr, tubeTop + 2 * dpr);
      ctx.lineTo(tx - 2 * dpr, tubeTop - 10 * dpr);
      ctx.lineTo(tx + tubeW + 2 * dpr, tubeTop - 10 * dpr);
      ctx.lineTo(tx + tubeW - 1 * dpr, tubeTop + 2 * dpr);
      ctx.closePath();
      ctx.fillStyle = '#b45309';
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
    }

    // D. Chemical Label Below Tube on Rack Base
    ctx.font = `600 ${Math.max(7, Math.round(8 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.fillText(tLabel, tx + tubeW / 2, rackBot - 6 * dpr);
  }

  // 3. Top Support Rail (rendered in front of tubes to anchor them in sockets)
  ctx.beginPath();
  ctx.roundRect(x + padX, rackTop - 2 * dpr, rackW, 12 * dpr, 3 * dpr);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // Socket rings
  for (let i = 0; i < count; i++) {
    const tx = x + padX + colW + 10 * dpr + stepX * i + (stepX - tubeW) / 2;
    ctx.beginPath();
    ctx.ellipse(tx + tubeW / 2, rackTop + 4 * dpr, tubeW / 2 + 1 * dpr, 3 * dpr, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
  }

  // Rack Overall Label
  ctx.font = `bold ${Math.max(9, Math.round(9.5 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText(shape.label || `Classroom Test Tube Rack (${count} Tubes)`, x + w / 2, rackBot + 12 * dpr);
}

// ─── 4. Computer Science Renderers ───────────────────────────────────────────

function renderCSDiagram(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const diagType = shape.params?.diagramType || 'codeBlock';

  // Base Dark Slate Frame
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.96)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10 * dpr);
  ctx.fill();
  ctx.stroke();

  if (diagType === 'codeBlock') {
    // Window header dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 16 * dpr, y + 16 * dpr, 4.5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + 30 * dpr, y + 16 * dpr, 4.5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + 44 * dpr, y + 16 * dpr, 4.5 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = `600 ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(`${shape.params?.language || 'python'}.py`, x + 65 * dpr, y + 19 * dpr);

    // Code lines
    const lines = (shape.params?.code || 'print("Hello World")').split('\n');
    const fontSize = Math.max(11, Math.round((shape.params?.fontSize || 13) * dpr));
    ctx.font = `${fontSize}px 'JetBrains Mono', Consolas, monospace`;

    lines.slice(0, 14).forEach((line: string, i: number) => {
      const ly = y + 46 * dpr + i * 20 * dpr;

      // Line number
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), x + 36 * dpr, ly);

      // Code text (syntax highlights)
      ctx.textAlign = 'left';
      ctx.fillStyle = line.includes('def') || line.includes('return') || line.includes('if') || line.includes('while')
        ? '#38bdf8'
        : '#f8fafc';
      ctx.fillText(line, x + 50 * dpr, ly);
    });
  } else if (diagType === 'traceTable') {
    const cols: string[] = shape.params?.columns || ['Step', 'Line', 'Var', 'Output'];
    const rows: string[][] = shape.params?.rows || [['1', '1', 'x=5', '-']];
    const colW = (w - 20 * dpr) / cols.length;

    // Header row
    ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.fillRect(x + 10 * dpr, y + 10 * dpr, w - 20 * dpr, 30 * dpr);

    ctx.font = `bold ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';

    cols.forEach((c, idx) => {
      ctx.fillText(c, x + 10 * dpr + idx * colW + colW / 2, y + 30 * dpr);
    });

    // Data rows
    ctx.font = `${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#f8fafc';

    rows.slice(0, 8).forEach((row, rIdx) => {
      const ry = y + 55 * dpr + rIdx * 24 * dpr;
      row.forEach((val, cIdx) => {
        ctx.fillText(String(val), x + 10 * dpr + cIdx * colW + colW / 2, ry);
      });
    });
  } else if (diagType === 'linkedList') {
    const nodes: string[] = shape.params?.nodes || ['A', 'B', 'C'];
    const nodeW = 80 * dpr;
    const nodeH = 46 * dpr;
    const gap = 45 * dpr;
    const startX = x + 30 * dpr;
    const cy = y + h / 2;

    nodes.forEach((data, idx) => {
      const nx = startX + idx * (nodeW + gap);

      // Node box
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.rect(nx, cy - nodeH / 2, nodeW, nodeH);
      ctx.fill();
      ctx.stroke();

      // Split line between data and pointer
      ctx.beginPath();
      ctx.moveTo(nx + nodeW * 0.6, cy - nodeH / 2);
      ctx.lineTo(nx + nodeW * 0.6, cy + nodeH / 2);
      ctx.stroke();

      // Data label
      ctx.font = `bold ${Math.max(12, Math.round(14 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(data, nx + nodeW * 0.3, cy + 5 * dpr);

      // Pointer arrow to next
      const ptrX = nx + nodeW * 0.8;
      if (idx < nodes.length - 1) {
        drawArrow(ctx, ptrX, cy, nx + nodeW + gap - 4 * dpr, cy, '#38bdf8', dpr);
      } else {
        // NULL arrow
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('NULL', ptrX + 35 * dpr, cy + 5 * dpr);
      }
    });
  }
}

function renderFlowchartNode(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const type = shape.params?.nodeType || 'process';
  const label = shape.params?.label || shape.label || 'Action';
  const strokeColor = shape.strokeColor || '#38bdf8';

  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2 * dpr;

  if (type === 'terminator') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'decision') {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === 'inputOutput') {
    const slant = 18 * dpr;
    ctx.beginPath();
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - slant, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Process rectangle
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6 * dpr);
    ctx.fill();
    ctx.stroke();
  }

  // Label text
  ctx.font = `600 ${Math.max(11, Math.round(13 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

// ─── 5. Digital Logic Renderers ───────────────────────────────────────────────

function renderLogicGate(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const gateType = shape.params?.gateType || 'AND';
  const strokeColor = shape.strokeColor || '#38bdf8';

  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5 * dpr;

  const lead = 25 * dpr;
  const gw = w - lead * 2;
  const gh = h;
  const gx = x + lead;
  const gy = y;

  // Input A & B leads
  ctx.beginPath();
  ctx.moveTo(x, gy + gh * 0.3);
  ctx.lineTo(gx, gy + gh * 0.3);
  if (gateType !== 'NOT') {
    ctx.moveTo(x, gy + gh * 0.7);
    ctx.lineTo(gx, gy + gh * 0.7);
  }
  ctx.stroke();

  // Output lead
  ctx.beginPath();
  ctx.moveTo(gx + gw, gy + gh / 2);
  ctx.lineTo(x + w, gy + gh / 2);
  ctx.stroke();

  if (gateType === 'AND' || gateType === 'NAND') {
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw * 0.5, gy);
    ctx.arc(gx + gw * 0.5, gy + gh / 2, gh / 2, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(gx, gy + gh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (gateType === 'NAND') {
      ctx.beginPath();
      ctx.arc(gx + gw + 5 * dpr, gy + gh / 2, 4 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fill();
      ctx.stroke();
    }
  } else if (gateType === 'OR' || gateType === 'NOR') {
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + gw * 0.5, gy, gx + gw, gy + gh / 2);
    ctx.quadraticCurveTo(gx + gw * 0.5, gy + gh, gx, gy + gh);
    ctx.quadraticCurveTo(gx + gw * 0.25, gy + gh / 2, gx, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (gateType === 'NOR') {
      ctx.beginPath();
      ctx.arc(gx + gw + 5 * dpr, gy + gh / 2, 4 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fill();
      ctx.stroke();
    }
  } else if (gateType === 'NOT') {
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw - 8 * dpr, gy + gh / 2);
    ctx.lineTo(gx, gy + gh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(gx + gw - 4 * dpr, gy + gh / 2, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Default IC box
    ctx.beginPath();
    ctx.roundRect(gx, gy, gw, gh, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${Math.max(12, Math.round(14 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(gateType, gx + gw / 2, gy + gh / 2 + 5 * dpr);
  }
}

function renderTruthTable(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const headers: string[] = shape.params?.headers || ['A', 'B', 'Y'];
  const rows: number[][] = shape.params?.rows || [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ];

  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8 * dpr);
  ctx.fill();
  ctx.stroke();

  const colW = w / headers.length;
  const headerH = 36 * dpr;

  // Header background
  ctx.fillStyle = 'rgba(2, 132, 199, 0.3)';
  ctx.fillRect(x, y, w, headerH);

  ctx.font = `bold ${Math.max(12, Math.round(13 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';

  headers.forEach((hName, idx) => {
    ctx.fillText(hName, x + idx * colW + colW / 2, y + headerH / 2 + 5 * dpr);
  });

  // Rows
  const rowH = (h - headerH) / rows.length;
  ctx.font = `600 ${Math.max(12, Math.round(13 * dpr))}px Inter, sans-serif`;

  rows.forEach((row, rIdx) => {
    const ry = y + headerH + rIdx * rowH;
    row.forEach((val, cIdx) => {
      ctx.fillStyle = val === 1 ? '#10b981' : '#94a3b8';
      ctx.fillText(String(val), x + cIdx * colW + colW / 2, ry + rowH / 2 + 5 * dpr);
    });
  });
}

function renderKarnaughMap(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8 * dpr);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold ${Math.max(11, Math.round(13 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText('Karnaugh Map (K-Map)', x + 16 * dpr, y + 22 * dpr);
}

// ─── 6. General Teaching Renderers ────────────────────────────────────────────

function renderTeachingTemplate(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const type = shape.params?.templateType || 'mindMap';

  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10 * dpr);
  ctx.fill();
  ctx.stroke();

  // Header Title
  ctx.font = `600 ${Math.max(12, Math.round(14 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText(shape.label || 'Teaching Template', x + 16 * dpr, y + 24 * dpr);

  if (type === 'mindMap') {
    const cx = x + w / 2;
    const cy = y + h / 2 + 10 * dpr;

    // Central bubble
    ctx.beginPath();
    ctx.ellipse(cx, cy, 60 * dpr, 36 * dpr, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.font = `bold ${Math.max(11, Math.round(13 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Central Idea', cx, cy + 5 * dpr);

    // 4 Radial subtopics
    const branches = ['Topic A', 'Topic B', 'Topic C', 'Topic D'];
    const angles = [-Math.PI / 4, Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4];

    branches.forEach((branch, i) => {
      const bx = cx + 130 * dpr * Math.cos(angles[i]);
      const by = cy + 90 * dpr * Math.sin(angles[i]);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx, by, bx, by);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(bx - 45 * dpr, by - 18 * dpr, 90 * dpr, 36 * dpr, 8 * dpr);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(branch, bx, by + 4 * dpr);
    });
  } else if (type === 'prosCons') {
    const halfW = (w - 30 * dpr) / 2;
    const topY = y + 45 * dpr;
    const cardH = h - 60 * dpr;

    // Pros card (green)
    ctx.beginPath();
    ctx.roundRect(x + 10 * dpr, topY, halfW, cardH, 8 * dpr);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    ctx.font = `bold ${Math.max(12, Math.round(14 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'center';
    ctx.fillText('✓ PROS & ADVANTAGES', x + 10 * dpr + halfW / 2, topY + 24 * dpr);

    // Cons card (rose)
    ctx.beginPath();
    ctx.roundRect(x + 20 * dpr + halfW, topY, halfW, cardH, 8 * dpr);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.fillText('✗ CONS & LIMITATIONS', x + 20 * dpr + halfW + halfW / 2, topY + 24 * dpr);
  }
}
