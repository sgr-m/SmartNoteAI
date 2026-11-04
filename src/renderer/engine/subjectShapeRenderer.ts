/**
 * Subject Shape Renderer
 * Vector graphic rendering engine for all subject-specific teaching shapes and diagrams.
 * Used by both live DrawingEngine and documentExportService for 100% visual fidelity.
 */

import { ShapeObject } from '../../shared/types';
import { compileMathFunction, evaluateMathFunction } from '../services/subjectModules/mathFunctionParser';
import { PERIODIC_ELEMENTS, ChemicalElement } from '../services/subjectModules/chemistryModule';
import { getSolid3DModel, transform3D, projectTo2D, Solid3DType } from './geometry3DMath';
import { tokenizeCodeLine, getTokenColor } from '../services/subjectModules/csSyntaxHighlighter';
import {
  getKMapMintermIndex,
  getDefaultKMapVariableNames,
  evaluateMux,
  evaluateAdder,
  evaluateFlipFlopNextState,
  evaluateCounter,
} from '../services/subjectModules/digitalLogicModule';
import { renderGeographyShape } from './geographyShapeRenderer';

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
    'hierarchyChart',
    'mindmap',
    'timeline',
    'processChart',
    'geoMap',
    'geoGlobe',
    'geoTopoProfile',
    'geoCoordinateGrid',
    'geoThematicLayer',
  ].includes(shapeType);
}

export function renderSubjectShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x?: number,
  y?: number,
  w?: number,
  h?: number,
  dpr = 1
): void {
  // Support legacy or shorthand invocation (ctx, shape, dpr)
  let renderX = x ?? shape.x;
  let renderY = y ?? shape.y;
  let renderW = w ?? shape.width;
  let renderH = h ?? shape.height;
  let renderDpr = dpr;

  if (typeof x === 'number' && typeof y === 'undefined') {
    renderDpr = x;
    renderX = shape.x;
    renderY = shape.y;
    renderW = shape.width;
    renderH = shape.height;
  }
  ctx.save();

  switch (shape.shapeType) {
    case 'setSquare45':
      renderSetSquare45(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'setSquare30':
      renderSetSquare30(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'angleMeasurement':
      renderAngleMeasurement(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'cartesianAxes':
      renderCartesianAxes(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'numberLine':
      renderNumberLine(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'functionPlot':
      renderFunctionPlot(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'geometry3D':
      renderGeometry3D(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'circuitComponent':
      renderCircuitComponent(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'physicsDiagram':
      renderPhysicsDiagram(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'periodicElement':
      renderPeriodicElement(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'atomicModel':
      renderAtomicModel(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'labApparatus':
      renderLabApparatus(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'flowchartNode':
      renderFlowchartNode(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'csDiagram':
      renderCSDiagram(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'logicGate':
      renderLogicGate(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'truthTable':
      renderTruthTable(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'karnaughMap':
      renderKarnaughMap(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'teachingTemplate':
      renderTeachingTemplate(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'hierarchyChart':
      renderHierarchyChart(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'mindmap':
      renderMindmap(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'timeline':
      renderTimeline(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'processChart':
      renderProcessChart(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
      break;
    case 'geoMap':
    case 'geoGlobe':
    case 'geoTopoProfile':
    case 'geoCoordinateGrid':
    case 'geoThematicLayer':
      renderGeographyShape(ctx, shape, renderX, renderY, renderW, renderH, renderDpr);
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

  // Base unscaled widths per tool (at 1x DPR) for proportional scaling
  const defaultWidths: Record<string, number> = {
    codeBlock: 440,
    pseudocode: 440,
    flowchart: 480,
    traceTable: 540,
    callStack: 400,
    memoryLayout: 560,
    linkedList: 560,
    binaryTree: 500,
    graph: 520,
    sortingArray: 540,
    sortingSearching: 540,
    databaseTable: 480,
    erDiagram: 480,
    cpuArchitecture: 580,
    vonNeumann: 580,
    instructionCycle: 540,
    networkTopology: 560,
  };

  const baseW = (defaultWidths[diagType] || 500) * dpr;
  // Calculate proportional resize scale factor based on current width w relative to base width
  const resizeScale = Math.max(0.45, Math.min(3.8, w / baseW));

  // Base font size configurable from shape params (defaults to 14)
  const customFontSize =
    typeof shape.params?.fontSize === 'number' && shape.params.fontSize > 0
      ? shape.params.fontSize
      : 14;

  // Scale fonts proportionally with both the font size option and the corner drag scale
  const effectiveFontScale = (customFontSize / 14) * resizeScale;
  const sf = (basePx: number) => Math.max(7, Math.round(basePx * effectiveFontScale * dpr));
  const sc = (basePx: number) => Math.round(basePx * resizeScale * dpr);

  // Common Header Bar Height and Dot Sizes
  const barH = Math.max(28 * dpr, sc(32));
  const dotR = Math.max(3.5 * dpr, sc(4.5));
  const dotY = y + barH / 2;

  // Base Dark Slate Frame
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.96)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = Math.max(1, Math.round(1.5 * dpr));
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.round(10 * dpr));
  ctx.fill();
  ctx.stroke();

  if (diagType === 'codeBlock') {
    const isLight = shape.params?.theme === 'light';
    const lang = shape.params?.language || 'python';
    const defaultExt = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang === 'java' ? 'java' : lang === 'cpp' ? 'cpp' : lang === 'sql' ? 'sql' : 'txt';
    const fileName = shape.params?.fileName || `${lang}.${defaultExt}`;
    const code = shape.params?.code || 'print("Hello World")';
    const lines = code.split('\n');
    const fontSize = sf(customFontSize || 13);
    const lineHeight = Math.max(16 * dpr, Math.round(fontSize * 1.5));

    // Frame styling override based on theme
    ctx.fillStyle = isLight ? '#ffffff' : shape.fillColor || 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = isLight ? '#94a3b8' : '#0284c7';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * dpr);
    ctx.fill();
    ctx.stroke();

    // Window header bar
    ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    // Header divider
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(x, y + barH);
    ctx.lineTo(x + w, y + barH);
    ctx.stroke();

    // macOS Window control dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // File name
    ctx.font = `600 ${sf(12)}px 'JetBrains Mono', Consolas, sans-serif`;
    ctx.fillStyle = isLight ? '#334155' : '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(fileName, x + sc(60), dotY);

    // Language badge
    ctx.textAlign = 'right';
    ctx.font = `bold ${sf(9)}px Inter, sans-serif`;
    ctx.fillStyle = isLight ? '#0284c7' : '#38bdf8';
    ctx.fillText(lang.toUpperCase(), x + w - sc(16), dotY);
    ctx.textBaseline = 'alphabetic';

    // Gutter divider
    const gutterW = Math.max(34 * dpr, sc(44));
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(x + gutterW, y + barH);
    ctx.lineTo(x + gutterW, y + h);
    ctx.stroke();

    // Code lines with multi-token syntax highlighting
    ctx.font = `${fontSize}px 'JetBrains Mono', Consolas, monospace`;
    const maxVisibleLines = Math.floor((h - barH - 10 * dpr) / lineHeight);

    lines.slice(0, maxVisibleLines).forEach((line: string, i: number) => {
      const ly = y + barH + 16 * dpr + i * lineHeight;

      // Line number in gutter
      ctx.fillStyle = isLight ? '#94a3b8' : '#475569';
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), x + gutterW - 8 * dpr, ly);

      // Render syntax tokens
      const tokens = tokenizeCodeLine(line, lang);
      let curX = x + gutterW + 10 * dpr;
      ctx.textAlign = 'left';

      for (const tok of tokens) {
        ctx.fillStyle = getTokenColor(tok.type, isLight ? 'light' : 'dark');
        ctx.fillText(tok.text, curX, ly);
        curX += ctx.measureText(tok.text).width;
      }
    });
  } else if (diagType === 'pseudocode') {
    const title = shape.params?.title || shape.label || 'Algorithm Pseudocode';
    const standard = shape.params?.standard || 'Cambridge / Standard Pseudocode';
    const code = shape.params?.code || 'PROCEDURE Main()\n  OUTPUT "Hello World"\nENDPROCEDURE';
    const lines = code.split('\n');
    const fontSize = sf(customFontSize || 13);
    const lineHeight = Math.max(16 * dpr, Math.round(fontSize * 1.5));

    // Frame styling with purple pseudocode accent
    ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * dpr);
    ctx.fill();
    ctx.stroke();

    // Header bar
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y + barH);
    ctx.lineTo(x + w, y + barH);
    ctx.stroke();

    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = `600 ${sf(12)}px 'JetBrains Mono', Consolas, sans-serif`;
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📝 ${title}`, x + sc(60), dotY);

    // Standard badge
    ctx.textAlign = 'right';
    ctx.font = `bold ${sf(9)}px Inter, sans-serif`;
    ctx.fillStyle = '#e9d5ff';
    ctx.fillText(String(standard).split(' ')[0], x + w - sc(16), dotY);
    ctx.textBaseline = 'alphabetic';

    // Gutter divider
    const gutterW = Math.max(34 * dpr, sc(44));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(x + gutterW, y + barH);
    ctx.lineTo(x + gutterW, y + h);
    ctx.stroke();

    // Code lines with pseudocode token highlighting
    ctx.font = `${fontSize}px 'JetBrains Mono', Consolas, monospace`;
    const maxVisibleLines = Math.floor((h - barH - 10 * dpr) / lineHeight);

    lines.slice(0, maxVisibleLines).forEach((line: string, i: number) => {
      const ly = y + barH + 16 * dpr + i * lineHeight;

      // Line number
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), x + gutterW - 8 * dpr, ly);

      // Render tokens
      const tokens = tokenizeCodeLine(line, 'pseudocode');
      let curX = x + gutterW + 10 * dpr;
      ctx.textAlign = 'left';

      for (const tok of tokens) {
        ctx.fillStyle = getTokenColor(tok.type, 'dark');
        ctx.fillText(tok.text, curX, ly);
        curX += ctx.measureText(tok.text).width;
      }
    });
  } else if (diagType === 'flowchart') {
    const title = shape.params?.title || shape.label || 'Algorithm Flowchart';
    const nodes = shape.params?.nodes || [];
    const edges = shape.params?.edges || [];

    // Frame styling
    ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * dpr);
    ctx.fill();
    ctx.stroke();

    // Header bar
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y + barH);
    ctx.lineTo(x + w, y + barH);
    ctx.stroke();

    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = `600 ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔀 ${title}`, x + sc(60), dotY);
    ctx.textBaseline = 'alphabetic';

    // Render nodes within the card bounds
    const contentY = y + barH + 10 * dpr;
    const contentH = h - barH - 20 * dpr;
    const totalNodeH = nodes.reduce((sum: number, n: any) => sum + sc(n.height || (n.type === 'decision' ? 64 : n.type === 'terminator' ? 40 : 50)), 0);
    const gap = Math.max(12 * dpr, (contentH - totalNodeH) / Math.max(1, nodes.length));

    let curY = contentY + 6 * dpr;
    const nodeCoords = new Map<string, { cx: number; cy: number; w: number; h: number; bottomY: number; topY: number }>();

    // Calculate layout & render nodes
    for (const node of nodes) {
      const nw = Math.min(w - sc(36), sc(node.type === 'decision' ? 180 : node.type === 'terminator' ? 140 : 200));
      const nh = sc(node.type === 'decision' ? 64 : node.type === 'terminator' ? 40 : 50);
      const nx = x + (w - nw) / 2;
      const ny = curY;

      nodeCoords.set(node.id, {
        cx: nx + nw / 2,
        cy: ny + nh / 2,
        w: nw,
        h: nh,
        topY: ny,
        bottomY: ny + nh,
      });

      // Draw node shape
      ctx.lineWidth = 2 * dpr;
      if (node.type === 'terminator') {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(nx, ny, nw, nh, nh / 2);
        ctx.fill();
        ctx.stroke();
      } else if (node.type === 'decision') {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(nx + nw / 2, ny);
        ctx.lineTo(nx + nw, ny + nh / 2);
        ctx.lineTo(nx + nw / 2, ny + nh);
        ctx.lineTo(nx, ny + nh / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (node.type === 'inputOutput') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.strokeStyle = '#38bdf8';
        const slant = sc(14);
        ctx.beginPath();
        ctx.moveTo(nx + slant, ny);
        ctx.lineTo(nx + nw, ny);
        ctx.lineTo(nx + nw - slant, ny + nh);
        ctx.lineTo(nx, ny + nh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Process
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(nx, ny, nw, nh, 6 * dpr);
        ctx.fill();
        ctx.stroke();
      }

      // Label text
      ctx.font = `600 ${sf(11)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label || '', nx + nw / 2, ny + nh / 2);
      ctx.textBaseline = 'alphabetic';

      curY += nh + gap;
    }

    // Draw connecting edges
    for (const edge of edges) {
      const from = nodeCoords.get(edge.from);
      const to = nodeCoords.get(edge.to);
      if (from && to) {
        let edgeColor = '#38bdf8';
        if (edge.label === 'Yes' || edge.label === 'True') edgeColor = '#10b981';
        else if (edge.label === 'No' || edge.label === 'False') edgeColor = '#f43f5e';

        if (to.topY < from.bottomY) {
          // Loopback arrow
          const loopX = x + w - sc(24);
          ctx.strokeStyle = edgeColor;
          ctx.lineWidth = 1.5 * dpr;
          ctx.setLineDash([4 * dpr, 3 * dpr]);
          ctx.beginPath();
          ctx.moveTo(from.cx, from.bottomY);
          ctx.lineTo(loopX, from.bottomY);
          ctx.lineTo(loopX, to.cy);
          ctx.lineTo(to.cx + to.w / 2, to.cy);
          ctx.stroke();
          ctx.setLineDash([]);
          drawArrow(ctx, loopX, to.cy, to.cx + to.w / 2, to.cy, edgeColor, dpr);
        } else {
          // Standard downward connection
          drawArrow(ctx, from.cx, from.bottomY, to.cx, to.topY, edgeColor, dpr);
        }

        // Edge condition label
        if (edge.label) {
          const midY = (from.bottomY + to.topY) / 2;
          ctx.font = `bold ${sf(9.5)}px Inter, sans-serif`;
          ctx.fillStyle = edgeColor;
          ctx.textAlign = 'left';
          ctx.fillText(edge.label, from.cx + 8 * dpr, midY + 3 * dpr);
        }
      }
    }
  } else if (diagType === 'traceTable') {
    const title = shape.params?.title || shape.label || 'Algorithm Trace Table';
    const cols: string[] = shape.params?.columns || ['Step', 'Line', 'i', 'sum', 'Condition', 'Output'];
    const rows: string[][] = shape.params?.rows || [
      ['Init', '1-2', '0', '0', 'True', '-'],
      ['1', '3-4', '1', '1', 'True', '-'],
      ['2', '3-4', '2', '3', 'True', '-'],
      ['3', '3-4', '3', '6', 'True', '-'],
      ['4', '3-4', '4', '10', 'False', '10'],
    ];

    // Card Header Bar
    ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(2, 132, 199, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y + barH);
    ctx.lineTo(x + w, y + barH);
    ctx.stroke();

    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = `600 ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📊 ${title}`, x + sc(60), dotY);
    ctx.textBaseline = 'alphabetic';

    // Table Bounds
    const tableX = x + 12 * dpr;
    const tableY = y + barH + 10 * dpr;
    const tableW = w - 24 * dpr;
    const colW = tableW / Math.max(1, cols.length);
    const rowH = Math.max(22 * dpr, sc(26));

    // Header row
    ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.beginPath();
    ctx.roundRect(tableX, tableY, tableW, rowH, 4 * dpr);
    ctx.fill();

    ctx.font = `bold ${sf(11)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    cols.forEach((c, idx) => {
      ctx.fillText(c, tableX + idx * colW + colW / 2, tableY + rowH / 2);
    });

    // Data rows
    ctx.font = `${sf(11)}px 'JetBrains Mono', Consolas, monospace`;
    const maxRows = Math.floor((h - barH - 16 * dpr) / rowH);

    rows.slice(0, maxRows).forEach((row, rIdx) => {
      const ry = tableY + rowH + rIdx * rowH;

      // Alternating row background
      if (rIdx % 2 === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(tableX, ry, tableW, rowH);
      }

      // Row separator line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.moveTo(tableX, ry + rowH);
      ctx.lineTo(tableX + tableW, ry + rowH);
      ctx.stroke();

      row.forEach((val, cIdx) => {
        const strVal = String(val ?? '-');
        if (strVal.toLowerCase() === 'true') {
          ctx.fillStyle = '#10b981';
          ctx.font = `bold ${sf(11)}px 'JetBrains Mono', monospace`;
        } else if (strVal.toLowerCase() === 'false') {
          ctx.fillStyle = '#f43f5e';
          ctx.font = `bold ${sf(11)}px 'JetBrains Mono', monospace`;
        } else if (/^-?\d+(\.\d+)?$/.test(strVal)) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = `${sf(11)}px 'JetBrains Mono', monospace`;
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.font = `${sf(11)}px 'JetBrains Mono', monospace`;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(strVal, tableX + cIdx * colW + colW / 2, ry + rowH / 2);
      });
    });
    ctx.textBaseline = 'alphabetic';
  } else if (diagType === 'callStack') {
    const title = shape.params?.title || shape.label || 'Call Stack (LIFO Frames)';
    const frames = shape.params?.frames || [
      { func: 'factorial(n=1)', vars: 'n=1, return 1', isTop: true },
      { func: 'factorial(n=2)', vars: 'n=2, waiting on factorial(1)' },
      { func: 'factorial(n=3)', vars: 'n=3, waiting on factorial(2)' },
      { func: 'main()', vars: 'result = factorial(3)' },
    ];

    // Header bar
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = `600 ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📚 ${title}`, x + sc(60), dotY);

    // Direction badge
    ctx.textAlign = 'right';
    ctx.font = `bold ${sf(9.5)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('▲ PUSH / POP ▼', x + w - sc(16), dotY);
    ctx.textBaseline = 'alphabetic';

    // Render stack frames from top to bottom
    const contentY = y + barH + 12 * dpr;
    const contentH = h - barH - 20 * dpr;
    const frameH = Math.min(sc(64), (contentH - 16 * dpr) / Math.max(1, frames.length));
    const frameW = w - 36 * dpr;
    const frameX = x + 18 * dpr;

    frames.forEach((frame: any, idx: number) => {
      const fy = contentY + idx * (frameH + 6 * dpr);
      const isTop = idx === 0 || frame.isTop;

      // Frame container box
      ctx.fillStyle = isTop ? 'rgba(16, 185, 129, 0.16)' : 'rgba(30, 41, 59, 0.7)';
      ctx.strokeStyle = isTop ? '#10b981' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = (isTop ? 2 : 1) * dpr;
      ctx.beginPath();
      ctx.roundRect(frameX, fy, frameW, frameH, 6 * dpr);
      ctx.fill();
      ctx.stroke();

      // Top of stack pointer arrow
      if (isTop) {
        ctx.fillStyle = '#10b981';
        ctx.font = `bold ${sf(9)}px Inter, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('➔ TOP (ACTIVE)', frameX + 8 * dpr, fy + sc(14));
      }

      // Function name
      ctx.font = `bold ${sf(12)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = isTop ? '#34d399' : '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(frame.func || 'anonymous()', frameX + (isTop ? sc(90) : 12 * dpr), fy + (isTop ? sc(14) : sc(18)));

      // Variables / parameters
      ctx.font = `${sf(10.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(frame.vars || 'no locals', frameX + 12 * dpr, fy + frameH - 8 * dpr);
    });
  } else if (diagType === 'memoryLayout') {
    const title = shape.params?.title || shape.label || 'Memory Layout & Pointers';
    const cells = shape.params?.cells || [
      { address: '0x1000', name: 'ptr', type: 'int*', value: '0x1008', pointsTo: '0x1008' },
      { address: '0x1004', name: 'count', type: 'int', value: '42' },
      { address: '0x1008', name: '*ptr', type: 'int', value: '99' },
      { address: '0x100C', name: 'flag', type: 'bool', value: 'true' },
    ];

    // Header bar
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = `600 ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🧠 ${title}`, x + sc(60), dotY);
    ctx.textBaseline = 'alphabetic';

    // Memory Table Headers
    const startY = y + barH + 12 * dpr;
    const availW = w - 32 * dpr;
    const colAddrX = x + 16 * dpr;
    const colNameX = x + 16 * dpr + availW * 0.25;
    const colTypeX = x + 16 * dpr + availW * 0.48;
    const colValX = x + 16 * dpr + availW * 0.70;
    const rowH = Math.max(26 * dpr, sc(34));

    ctx.font = `bold ${sf(10.5)}px Inter, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('ADDRESS', colAddrX, startY + 12 * dpr);
    ctx.fillText('VARIABLE', colNameX, startY + 12 * dpr);
    ctx.fillText('TYPE', colTypeX, startY + 12 * dpr);
    ctx.fillText('VALUE', colValX, startY + 12 * dpr);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(x + 16 * dpr, startY + 20 * dpr);
    ctx.lineTo(x + w - 16 * dpr, startY + 20 * dpr);
    ctx.stroke();

    const rowCoords = new Map<string, number>();

    // Render cells
    cells.forEach((cell: any, idx: number) => {
      const cy = startY + 26 * dpr + idx * rowH;
      rowCoords.set(cell.address, cy + 12 * dpr);

      // Address tag (hex in amber)
      ctx.font = `bold ${sf(11)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'left';
      ctx.fillText(cell.address, colAddrX, cy + 14 * dpr);

      // Variable name
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(cell.name, colNameX, cy + 14 * dpr);

      // Type
      ctx.fillStyle = '#c084fc';
      ctx.fillText(cell.type, colTypeX, cy + 14 * dpr);

      // Value box
      const valW = availW * 0.26;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = cell.pointsTo ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.roundRect(colValX, cy, valW, 24 * dpr, 4 * dpr);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(cell.value, colValX + valW / 2, cy + 16 * dpr);
    });

    // Draw pointer arrows (pointing from pointer cell to target cell)
    cells.forEach((cell: any, idx: number) => {
      if (cell.pointsTo && rowCoords.has(cell.pointsTo)) {
        const fromY = startY + 26 * dpr + idx * rowH + 12 * dpr;
        const toY = rowCoords.get(cell.pointsTo)!;
        const valW = availW * 0.26;
        const fromX = colValX + valW;
        const curveX = Math.min(x + w - 8 * dpr, fromX + sc(28));

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(curveX, fromY, curveX, toY, fromX + 8 * dpr, toY);
        ctx.stroke();

        drawArrow(ctx, curveX - 4 * dpr, toY, fromX + 4 * dpr, toY, '#38bdf8', dpr);
      }
    });
  } else if (diagType === 'linkedList') {
    const title = shape.params?.title || shape.label || 'Linked List';
    const nodes: string[] = shape.params?.nodes || ['12', '99', '37', '5'];
    const isDoubly = shape.params?.isDoubly || false;
    const isCircular = shape.params?.isCircular || false;
    const activeNodeIdx = shape.params?.activeNodeIndex;
    const showAddresses = shape.params?.showAddresses ?? true;

    // Header bar
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title
    const typeLabel = isCircular ? 'Circular' : isDoubly ? 'Doubly' : 'Singly';
    ctx.font = `600 ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔗 ${title} (${typeLabel})`, x + sc(60), dotY);
    ctx.textBaseline = 'alphabetic';

    const nodeW = Math.min(sc(84), (w - sc(130)) / Math.max(1, nodes.length));
    const nodeH = Math.max(34 * dpr, sc(46));
    const gap = Math.min(sc(40), (w - nodeW * nodes.length - sc(130)) / Math.max(1, nodes.length));
    const startX = x + sc(65);
    const cy = y + h / 2 + (isCircular ? 0 : 6 * dpr);

    // HEAD pointer box
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x + 12 * dpr, cy - 16 * dpr, sc(40), 32 * dpr, 4 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${sf(10)}px Inter, sans-serif`;
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'center';
    ctx.fillText('HEAD', x + 12 * dpr + sc(20), cy + 4 * dpr);

    // Arrow from HEAD to first node
    drawArrow(ctx, x + 12 * dpr + sc(40), cy, startX - 2 * dpr, cy, '#10b981', dpr);

    let lastPtrX = startX;

    nodes.forEach((data, idx) => {
      const nx = startX + idx * (nodeW + gap);
      const isActive = activeNodeIdx === idx;
      const hexAddr = `0x${(0x1000 + idx * 0x20).toString(16).toUpperCase()}`;

      // Active pointer badge
      if (isActive) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${sf(9)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('curr ➔', nx + nodeW / 2, cy - nodeH / 2 - 6 * dpr);
      }

      // Node box
      ctx.fillStyle = isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.12)';
      ctx.strokeStyle = isActive ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = (isActive ? 2.5 : 2) * dpr;
      ctx.beginPath();
      ctx.roundRect(nx, cy - nodeH / 2, nodeW, nodeH, 6 * dpr);
      ctx.fill();
      ctx.stroke();

      // Split line between data and pointer
      ctx.strokeStyle = isActive ? '#fbbf24' : '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(nx + nodeW * 0.65, cy - nodeH / 2);
      ctx.lineTo(nx + nodeW * 0.65, cy + nodeH / 2);
      ctx.stroke();

      // Data label
      ctx.font = `bold ${sf(13)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(String(data), nx + nodeW * 0.32, cy + 5 * dpr);

      // Next bullet point
      ctx.fillStyle = isActive ? '#fbbf24' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(nx + nodeW * 0.82, cy, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Hex address label
      if (showAddresses) {
        ctx.font = `${sf(9)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(hexAddr, nx + nodeW / 2, cy + nodeH / 2 + 14 * dpr);
      }

      // Pointer arrow to next
      const ptrX = nx + nodeW * 0.82;
      lastPtrX = ptrX;

      if (idx < nodes.length - 1) {
        drawArrow(ctx, ptrX, cy, nx + nodeW + gap - 2 * dpr, cy, '#38bdf8', dpr);
        if (isDoubly) {
          // Backward arrow for doubly linked list
          drawArrow(ctx, nx + nodeW + gap - 2 * dpr, cy + 12 * dpr, ptrX, cy + 12 * dpr, '#c084fc', dpr);
        }
      }
    });

    // Terminator: NULL or Circular Loopback
    if (isCircular) {
      const loopY = cy + nodeH / 2 + 22 * dpr;
      const headX = x + 12 * dpr + sc(20);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(lastPtrX, cy);
      ctx.lineTo(lastPtrX + 16 * dpr, cy);
      ctx.lineTo(lastPtrX + 16 * dpr, loopY);
      ctx.lineTo(headX, loopY);
      ctx.lineTo(headX, cy + 16 * dpr);
      ctx.stroke();
      drawArrow(ctx, headX, cy + 16 * dpr, headX, cy + 18 * dpr, '#10b981', dpr);
    } else {
      // NULL box
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.roundRect(lastPtrX + 16 * dpr, cy - 14 * dpr, sc(42), 28 * dpr, 4 * dpr);
      ctx.fill();
      ctx.stroke();

      drawArrow(ctx, lastPtrX, cy, lastPtrX + 14 * dpr, cy, '#ef4444', dpr);

      ctx.font = `bold ${sf(10)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#f87171';
      ctx.textAlign = 'center';
      ctx.fillText('NULL', lastPtrX + 16 * dpr + sc(21), cy + 4 * dpr);
    }
  } else if (diagType === 'binaryTree' || diagType === 'graph' || shape.params?.graphMode === 'graph') {
    const isGraph = diagType === 'graph' || shape.params?.graphMode === 'graph';

    if (isGraph) {
      // ─── GRAPH NETWORK RENDERING ─────────────────────────────────────────
      const title = shape.params?.title || shape.label || 'Graph Network Topology';
      const isDirected = shape.params?.isDirected ?? true;
      const graphNodes = shape.params?.graphNodes || [
        { id: 'A', label: 'A' },
        { id: 'B', label: 'B' },
        { id: 'C', label: 'C' },
        { id: 'D', label: 'D' },
        { id: 'E', label: 'E' },
      ];
      const graphEdges = shape.params?.graphEdges || [
        { from: 'A', to: 'B', weight: '4' },
        { from: 'A', to: 'C', weight: '2' },
        { from: 'B', to: 'D', weight: '5' },
        { from: 'C', to: 'E', weight: '10' },
        { from: 'D', to: 'E', weight: '2' },
      ];

      // Header bar
      ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
      ctx.fill();

      // Dots
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();

      // Title
      ctx.font = `600 ${sf(12)}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🕸 ${title} (${isDirected ? 'Directed' : 'Undirected'})`, x + sc(60), dotY);
      ctx.textBaseline = 'alphabetic';

      // Circular layout of nodes
      const n = Math.max(1, graphNodes.length);
      const cx = x + w / 2;
      const cy = y + barH + (h - barH - 10 * dpr) / 2;
      const radius = Math.min(w * 0.38, (h - barH - 24 * dpr) * 0.38);
      const nodeR = Math.max(14 * dpr, sc(18));

      const nodeCoords = new Map<string, { x: number; y: number; label: string }>();

      graphNodes.forEach((node: any, i: number) => {
        const theta = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const nx = cx + radius * Math.cos(theta);
        const ny = cy + radius * Math.sin(theta);
        nodeCoords.set(node.id, { x: nx, y: ny, label: node.label || node.id });
      });

      // Draw Edges first
      graphEdges.forEach((edge: any) => {
        const p1 = nodeCoords.get(edge.from);
        const p2 = nodeCoords.get(edge.to);
        if (p1 && p2) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const startX = p1.x + (dx / dist) * nodeR;
            const startY = p1.y + (dy / dist) * nodeR;
            const endX = p2.x - (dx / dist) * nodeR;
            const endY = p2.y - (dy / dist) * nodeR;

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.8 * dpr;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            if (isDirected) {
              drawArrow(ctx, startX, startY, endX, endY, '#38bdf8', dpr);
            }

            // Weight badge
            if (edge.weight) {
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              ctx.fillStyle = '#0f172a';
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 1 * dpr;
              ctx.beginPath();
              ctx.roundRect(midX - sc(12), midY - sc(9), sc(24), sc(18), 3 * dpr);
              ctx.fill();
              ctx.stroke();

              ctx.font = `bold ${sf(10)}px 'JetBrains Mono', monospace`;
              ctx.fillStyle = '#fbbf24';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(String(edge.weight), midX, midY);
            }
          }
        }
      });

      // Draw Nodes
      nodeCoords.forEach((coords) => {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, nodeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `bold ${sf(12)}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(coords.label, coords.x, coords.y);
      });
      ctx.textBaseline = 'alphabetic';
    } else {
      // ─── BINARY SEARCH TREE RENDERING ──────────────────────────────────
      const title = shape.params?.title || shape.label || 'Binary Search Tree (BST)';
      const rVal = shape.params?.rootVal || '50';
      const lVal = shape.params?.leftVal || '30';
      const rtVal = shape.params?.rightVal || '70';
      const llVal = shape.params?.leftLeftVal || '20';
      const lrVal = shape.params?.leftRightVal || '40';
      const rlVal = shape.params?.rightLeftVal || '60';
      const rrVal = shape.params?.rightRightVal || '80';

      // Header bar
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
      ctx.fill();

      // Dots
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
      ctx.fill();

      // Title
      ctx.font = `600 ${sf(12)}px Inter, sans-serif`;
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🌳 ${title}`, x + sc(60), dotY);
      ctx.textBaseline = 'alphabetic';

      // Node coordinates (3 levels)
      const nodeR = Math.max(14 * dpr, sc(18));
      const availTreeH = h - barH - 30 * dpr;
      const l0Y = y + barH + availTreeH * 0.18;
      const l1Y = y + barH + availTreeH * 0.52;
      const l2Y = y + barH + availTreeH * 0.86;

      const rootX = x + w / 2;
      const leftX = x + w * 0.28;
      const rightX = x + w * 0.72;

      const llX = x + w * 0.16;
      const lrX = x + w * 0.40;
      const rlX = x + w * 0.60;
      const rrX = x + w * 0.84;

      // Draw branch lines first
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * dpr;

      // Root to Level 1
      ctx.beginPath();
      ctx.moveTo(rootX, l0Y);
      ctx.lineTo(leftX, l1Y);
      ctx.moveTo(rootX, l0Y);
      ctx.lineTo(rightX, l1Y);
      // Level 1 to Level 2
      ctx.moveTo(leftX, l1Y);
      ctx.lineTo(llX, l2Y);
      ctx.moveTo(leftX, l1Y);
      ctx.lineTo(lrX, l2Y);
      ctx.moveTo(rightX, l1Y);
      ctx.lineTo(rlX, l2Y);
      ctx.moveTo(rightX, l1Y);
      ctx.lineTo(rrX, l2Y);
      ctx.stroke();

      // Helper to draw circular tree node
      const drawTreeNode = (nx: number, ny: number, val: string, isRoot = false) => {
        ctx.fillStyle = isRoot ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = isRoot ? '#38bdf8' : '#10b981';
        ctx.lineWidth = (isRoot ? 2.5 : 2) * dpr;
        ctx.beginPath();
        ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `bold ${sf(11.5)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(val), nx, ny);
      };

      // Draw all nodes
      drawTreeNode(rootX, l0Y, rVal, true);
      drawTreeNode(leftX, l1Y, lVal);
      drawTreeNode(rightX, l1Y, rtVal);
      drawTreeNode(llX, l2Y, llVal);
      drawTreeNode(lrX, l2Y, lrVal);
      drawTreeNode(rlX, l2Y, rlVal);
      drawTreeNode(rrX, l2Y, rrVal);
      ctx.textBaseline = 'alphabetic';
    }
  } else if (diagType === 'sortingArray' || diagType === 'sortingSearching') {
    const title = shape.params?.title || shape.label || 'Sorting / Searching Demonstration';
    const arr: number[] = shape.params?.array || [14, 33, 27, 10, 35, 19, 42, 44];
    const activeIndices: number[] = shape.params?.activeIndices || [2, 3];
    const sortedIndices: number[] = shape.params?.sortedIndices || [];
    const pointers: { label: string; index: number }[] = shape.params?.pointers || [];
    const statusText = shape.params?.statusText || 'Comparing elements: swap if left > right';

    // Header bar
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = `600 ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📶 ${title}`, x + sc(60), dotY);
    ctx.textBaseline = 'alphabetic';

    // Array Bars
    const maxVal = Math.max(...arr, 50);
    const chartY = y + barH + 16 * dpr;
    const chartH = Math.max(60 * dpr, h - barH - sc(68));
    const barW = Math.min(sc(44), (w - sc(50)) / Math.max(1, arr.length));
    const startX = x + (w - (barW + 8 * dpr) * arr.length) / 2;

    arr.forEach((val, idx) => {
      const bx = startX + idx * (barW + 8 * dpr);
      const bh = Math.max(20 * dpr, (val / maxVal) * chartH);
      const by = chartY + chartH - bh;

      const isActive = activeIndices.includes(idx);
      const isSorted = sortedIndices.includes(idx);
      const ptr = pointers.find((p) => p.index === idx);

      // Bar fill
      ctx.fillStyle = isActive
        ? 'rgba(245, 158, 11, 0.85)'
        : isSorted
        ? 'rgba(16, 185, 129, 0.85)'
        : 'rgba(56, 189, 248, 0.45)';

      ctx.strokeStyle = isActive ? '#fbbf24' : isSorted ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 1.5 * dpr;

      ctx.beginPath();
      ctx.roundRect(bx, by, barW, bh, [4 * dpr, 4 * dpr, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Pointer badge above bar
      if (ptr) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${sf(9)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ptr.label, bx + barW / 2, by - 14 * dpr);
      }

      // Value label on top of bar
      ctx.font = `bold ${sf(11)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), bx + barW / 2, by - 3 * dpr);

      // Index label below baseline
      ctx.font = `${sf(10)}px Inter, sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(`[${idx}]`, bx + barW / 2, chartY + chartH + 16 * dpr);

      // Active comparison pointer arrow
      if (isActive) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('▲', bx + barW / 2, chartY + chartH + 28 * dpr);
      }
    });

    // Status explanation banner at bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x + 20 * dpr, y + h - sc(36), w - 40 * dpr, sc(26), 4 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.font = `500 ${sf(11)}px Inter, sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ ${statusText}`, x + w / 2, y + h - sc(23));
    ctx.textBaseline = 'alphabetic';
  } else if (diagType === 'databaseTable' || diagType === 'erDiagram') {
    // ─── RELATIONAL DATABASE TABLE / ER DIAGRAM ───────────────────────────
    const tableName = shape.params?.tableName || 'Students';
    const columns: Array<{ name: string; type: string; isPK?: boolean; isFK?: boolean; refTable?: string }> =
      shape.params?.columns || [
        { name: 'id', type: 'INT', isPK: true },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'email', type: 'VARCHAR(255)' },
        { name: 'course_id', type: 'INT', isFK: true },
        { name: 'created_at', type: 'TIMESTAMP' },
      ];

    // Frame styling with cyan accent
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * dpr);
    ctx.stroke();

    // Header bar
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y + barH);
    ctx.lineTo(x + w, y + barH);
    ctx.stroke();

    // Window Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Table title & Schema Badge
    ctx.font = `bold ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🗄️  Table: ${tableName}`, x + sc(60), dotY);

    ctx.font = `600 ${sf(9)}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`RELATIONAL SCHEMA • ${columns.length} COLUMNS`, x + w - sc(16), dotY);

    // Column Headers row
    const headerY = y + barH + 8 * dpr;
    const headerH = Math.max(22 * dpr, sc(26));
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.beginPath();
    ctx.roundRect(x + 10 * dpr, headerY, w - 20 * dpr, headerH, 4 * dpr);
    ctx.fill();

    const colW1 = (w - 20 * dpr) * 0.42;
    const colW2 = (w - 20 * dpr) * 0.36;

    ctx.font = `700 ${sf(10)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('COLUMN NAME', x + 20 * dpr, headerY + headerH / 2);
    ctx.fillText('DATA TYPE', x + 10 * dpr + colW1 + 10 * dpr, headerY + headerH / 2);
    ctx.fillText('CONSTRAINTS', x + 10 * dpr + colW1 + colW2 + 10 * dpr, headerY + headerH / 2);

    // Column Data Rows
    const rowH = Math.max(24 * dpr, sc(28));
    const startY = headerY + headerH + 6 * dpr;
    const maxVisibleRows = Math.floor((h - (startY - y) - 34 * dpr) / rowH);

    columns.slice(0, maxVisibleRows).forEach((col, idx) => {
      const rowY = startY + idx * rowH;

      // Row alternating highlight
      if (idx % 2 === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.fillRect(x + 10 * dpr, rowY, w - 20 * dpr, rowH);
      }

      // Bottom border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(x + 10 * dpr, rowY + rowH);
      ctx.lineTo(x + w - 10 * dpr, rowY + rowH);
      ctx.stroke();

      // Column name + Icon
      ctx.font = `600 ${sf(11)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (col.isPK) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`🔑 ${col.name}`, x + 20 * dpr, rowY + rowH / 2);
      } else if (col.isFK) {
        ctx.fillStyle = '#a78bfa';
        ctx.fillText(`🔗 ${col.name}`, x + 20 * dpr, rowY + rowH / 2);
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`   ${col.name}`, x + 20 * dpr, rowY + rowH / 2);
      }

      // Type Badge
      ctx.font = `500 ${sf(10)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(col.type, x + 10 * dpr + colW1 + 10 * dpr, rowY + rowH / 2);

      // Constraints / Keys Badge
      const keyX = x + 10 * dpr + colW1 + colW2 + 10 * dpr;
      if (col.isPK) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.roundRect(keyX, rowY + 3 * dpr, sc(42), rowH - 6 * dpr, 4 * dpr);
        ctx.fill();
        ctx.stroke();

        ctx.font = `bold ${sf(9)}px Inter, sans-serif`;
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText('PK', keyX + sc(21), rowY + rowH / 2);
      } else if (col.isFK) {
        ctx.fillStyle = 'rgba(167, 139, 250, 0.2)';
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.roundRect(keyX, rowY + 3 * dpr, sc(42), rowH - 6 * dpr, 4 * dpr);
        ctx.fill();
        ctx.stroke();

        ctx.font = `bold ${sf(9)}px Inter, sans-serif`;
        ctx.fillStyle = '#a78bfa';
        ctx.textAlign = 'center';
        ctx.fillText('FK', keyX + sc(21), rowY + rowH / 2);
      } else {
        ctx.font = `400 ${sf(9)}px Inter, sans-serif`;
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText('NULLABLE', keyX, rowY + rowH / 2);
      }
    });

    // Footer with SQL Query Hint
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x + 10 * dpr, y + h - sc(28), w - 20 * dpr, sc(22), 4 * dpr);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.stroke();

    ctx.font = `italic 500 ${sf(9.5)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SELECT * FROM ${tableName} LIMIT 50;`, x + w / 2, y + h - sc(17));
    ctx.textBaseline = 'alphabetic';
  } else if (diagType === 'cpuArchitecture' || diagType === 'vonNeumann') {
    // ─── CPU & VON NEUMANN ARCHITECTURE ──────────────────────────────────
    const title = shape.params?.title || shape.label || 'CPU & Von Neumann Architecture';
    const busWidth = shape.params?.busWidth || '64-bit';
    const registers: string[] = shape.params?.registers || ['PC', 'MAR', 'MDR', 'ACC', 'CIR'];
    const showIO = shape.params?.showIO ?? true;

    // Frame styling with emerald accent
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * dpr);
    ctx.stroke();

    // Header bar
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y + barH);
    ctx.lineTo(x + w, y + barH);
    ctx.stroke();

    // Window Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.font = `bold ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🖥️  ${title}`, x + sc(60), dotY);

    ctx.font = `600 ${sf(9)}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`STORED-PROGRAM • ${busWidth} BUS`, x + w - sc(16), dotY);

    // Layout blocks
    const contentY = y + barH + 10 * dpr;
    const availH = h - barH - 20 * dpr;
    const cpuW = w * 0.58;
    const memW = w * 0.35;
    const cpuX = x + 12 * dpr;
    const memX = x + w - memW - 12 * dpr;
    const topH = showIO ? availH * 0.55 : availH * 0.72;

    // ─── 1. CPU BLOCK ───
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8 * dpr;
    ctx.beginPath();
    ctx.roundRect(cpuX, contentY, cpuW, topH, 8 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${sf(11)}px Inter, sans-serif`;
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CENTRAL PROCESSING UNIT (CPU)', cpuX + 12 * dpr, contentY + 8 * dpr);

    // Inside CPU: Control Unit (CU) & ALU
    const innerW = (cpuW - 28 * dpr) / 2;
    const cuX = cpuX + 10 * dpr;
    const aluX = cuX + innerW + 8 * dpr;
    const cuY = contentY + 28 * dpr;
    const cuH = topH * 0.42;

    // Control Unit (CU)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    ctx.roundRect(cuX, cuY, innerW, cuH, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${sf(10)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Control Unit (CU)', cuX + innerW / 2, cuY + cuH * 0.35);
    ctx.font = `400 ${sf(8.5)}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Decodes & Controls', cuX + innerW / 2, cuY + cuH * 0.65);

    // Arithmetic Logic Unit (ALU)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    ctx.roundRect(aluX, cuY, innerW, cuH, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${sf(10)}px Inter, sans-serif`;
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Arithmetic Logic (ALU)', aluX + innerW / 2, cuY + cuH * 0.35);
    ctx.font = `400 ${sf(8.5)}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Math & Logic Ops', aluX + innerW / 2, cuY + cuH * 0.65);

    // Registers Row inside CPU
    const regY = cuY + cuH + 8 * dpr;
    const regH = topH - (regY - contentY) - 8 * dpr;
    const regCount = Math.max(1, registers.length);
    const regBoxW = (cpuW - 20 * dpr) / regCount;

    registers.forEach((r, idx) => {
      const rx = cpuX + 10 * dpr + idx * regBoxW;
      ctx.fillStyle = 'rgba(167, 139, 250, 0.18)';
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.roundRect(rx + 2 * dpr, regY, regBoxW - 4 * dpr, regH, 4 * dpr);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold ${sf(9)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r, rx + regBoxW / 2, regY + regH / 2);
    });

    // ─── 2. MEMORY (RAM) BLOCK ───
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.8 * dpr;
    ctx.beginPath();
    ctx.roundRect(memX, contentY, memW, topH, 8 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${sf(11)}px Inter, sans-serif`;
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('PRIMARY MEMORY (RAM)', memX + 12 * dpr, contentY + 8 * dpr);

    // RAM Cells
    const cellStartY = contentY + 28 * dpr;
    const cellH = (topH - 36 * dpr) / 4;
    const ramSlots = [
      { addr: '0x000', label: 'ADD R1, R2', isCode: true },
      { addr: '0x001', label: 'STORE 0x05', isCode: true },
      { addr: '0x002', label: 'DATA: 42', isCode: false },
      { addr: '0x003', label: 'DATA: 108', isCode: false },
    ];

    ramSlots.forEach((slot, idx) => {
      const cy = cellStartY + idx * cellH;
      ctx.fillStyle = slot.isCode ? 'rgba(56, 189, 248, 0.1)' : 'rgba(245, 158, 11, 0.1)';
      ctx.fillRect(memX + 8 * dpr, cy + 2 * dpr, memW - 16 * dpr, cellH - 4 * dpr);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(memX + 8 * dpr, cy + 2 * dpr, memW - 16 * dpr, cellH - 4 * dpr);

      ctx.font = `500 ${sf(8.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.addr, memX + 14 * dpr, cy + cellH / 2);

      ctx.font = `600 ${sf(8.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = slot.isCode ? '#38bdf8' : '#fbbf24';
      ctx.textAlign = 'right';
      ctx.fillText(slot.label, memX + memW - 14 * dpr, cy + cellH / 2);
    });

    // ─── 3. SYSTEM BUS (HORIZONTAL BAND) ───
    const busY = contentY + topH + 10 * dpr;
    const busH = showIO ? sc(32) : availH - topH - 16 * dpr;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x + 12 * dpr, busY, w - 24 * dpr, busH, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    // Bus lines inside band
    const busLine1 = busY + busH * 0.25;
    const busLine2 = busY + busH * 0.5;
    const busLine3 = busY + busH * 0.75;

    // Control Bus (Yellow)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(x + 20 * dpr, busLine1);
    ctx.lineTo(x + w - 20 * dpr, busLine1);
    ctx.stroke();

    // Address Bus (Cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(x + 20 * dpr, busLine2);
    ctx.lineTo(x + w - 20 * dpr, busLine2);
    ctx.stroke();

    // Data Bus (Green)
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(x + 20 * dpr, busLine3);
    ctx.lineTo(x + w - 20 * dpr, busLine3);
    ctx.stroke();

    ctx.font = `bold ${sf(8.5)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`⚡ SYSTEM BUSES: Control Bus (Yellow) • Address Bus (Cyan) • Data Bus (Green)`, x + w / 2, busY + busH / 2);

    // ─── 4. INPUT / OUTPUT (I/O) DEVICES ───
    if (showIO) {
      const ioY = busY + busH + 8 * dpr;
      const ioH = availH - (ioY - contentY);
      const ioBoxW = (w - 34 * dpr) / 2;

      // Input Devices
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.roundRect(x + 12 * dpr, ioY, ioBoxW, ioH, 6 * dpr);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold ${sf(9.5)}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('📥 Input Interface (Keyboard, Mouse, Sensor)', x + 18 * dpr, ioY + ioH / 2);

      // Output Devices
      const outX = x + 12 * dpr + ioBoxW + 10 * dpr;
      ctx.fillStyle = 'rgba(167, 139, 250, 0.08)';
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.roundRect(outX, ioY, ioBoxW, ioH, 6 * dpr);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold ${sf(9.5)}px Inter, sans-serif`;
      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('📤 Output Interface (Monitor, Storage, Speaker)', outX + 8 * dpr, ioY + ioH / 2);
    }
    ctx.textBaseline = 'alphabetic';
  } else if (diagType === 'instructionCycle') {
    // ─── CPU INSTRUCTION CYCLE (FETCH-DECODE-EXECUTE) ──────────────────────
    const title = shape.params?.title || shape.label || 'Instruction Cycle (Fetch-Decode-Execute)';

    // Frame styling with purple accent
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * dpr);
    ctx.stroke();

    // Header bar
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    // Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔁  ${title}`, x + sc(60), dotY);
    ctx.textBaseline = 'alphabetic';

    // 4 Lifecycle Stages
    const stages = [
      { name: '1. FETCH', desc: 'PC ➔ MAR ➔ RAM ➔ MDR ➔ CIR', color: '#38bdf8' },
      { name: '2. DECODE', desc: 'CU decodes opcode & addressing', color: '#fbbf24' },
      { name: '3. EXECUTE', desc: 'ALU performs math / data moved', color: '#10b981' },
      { name: '4. STORE & NEXT', desc: 'Results in ACC / RAM, PC++', color: '#a78bfa' },
    ];

    const boxW = (w - 44 * dpr) / 2;
    const boxH = (h - barH - 36 * dpr) / 2;

    stages.forEach((st, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = x + 14 * dpr + col * (boxW + 16 * dpr);
      const by = y + barH + 12 * dpr + row * (boxH + 12 * dpr);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 8 * dpr);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold ${sf(12)}px Inter, sans-serif`;
      ctx.fillStyle = st.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.name, bx + boxW / 2, by + boxH * 0.38);

      ctx.font = `500 ${sf(9.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(st.desc, bx + boxW / 2, by + boxH * 0.68);
    });
    ctx.textBaseline = 'alphabetic';
  } else if (diagType === 'networkTopology') {
    // ─── COMPUTER NETWORK TOPOLOGY ──────────────────────────────────────
    const topology = shape.params?.topology || 'star';
    const title = shape.params?.title || shape.label || `Network Topology (${topology.toUpperCase()})`;
    const nodes: Array<{ id: string; name: string; type: string; ip?: string }> =
      shape.params?.nodes || [
        { id: 'SW', name: 'Switch (Core)', type: 'switch', ip: '192.168.1.1' },
        { id: 'PC1', name: 'PC 1 (Lab)', type: 'pc', ip: '192.168.1.10' },
        { id: 'PC2', name: 'PC 2 (Lab)', type: 'pc', ip: '192.168.1.11' },
        { id: 'PC3', name: 'PC 3 (Lab)', type: 'pc', ip: '192.168.1.12' },
        { id: 'PRN', name: 'Printer', type: 'printer', ip: '192.168.1.20' },
      ];

    // Frame styling with cyan/sky accent
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * dpr);
    ctx.stroke();

    // Header bar
    ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, barH, [10 * dpr, 10 * dpr, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y + barH);
    ctx.lineTo(x + w, y + barH);
    ctx.stroke();

    // Window Dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + sc(16), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x + sc(30), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + sc(44), dotY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // Title & Topology Badge
    ctx.font = `bold ${sf(12)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🌐  ${title}`, x + sc(60), dotY);

    ctx.font = `600 ${sf(9)}px Inter, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`${topology.toUpperCase()} TOPOLOGY • ${nodes.length} DEVICES`, x + w - sc(16), dotY);

    // Layout bounds
    const contentY = y + barH + 12 * dpr;
    const contentH = h - barH - sc(48);
    const cx = x + w / 2;
    const cy = contentY + contentH / 2;

    const getNodeIcon = (type: string) => {
      switch (type) {
        case 'switch':
          return '🔀';
        case 'router':
          return '📡';
        case 'server':
          return '🗄️';
        case 'printer':
          return '🖨️';
        default:
          return '🖥️';
      }
    };

    const nodeBoxW = Math.max(50 * dpr, sc(64));
    const nodeBoxH = Math.max(34 * dpr, sc(44));

    const drawDeviceNode = (nx: number, ny: number, node: { id: string; name: string; type: string; ip?: string }) => {
      const isHub = node.type === 'switch' || node.type === 'router';
      ctx.fillStyle = isHub ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = isHub ? '#38bdf8' : '#64748b';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.roundRect(nx - nodeBoxW / 2, ny - nodeBoxH / 2, nodeBoxW, nodeBoxH, 6 * dpr);
      ctx.fill();
      ctx.stroke();

      // Icon & Name
      ctx.font = `bold ${sf(10)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${getNodeIcon(node.type)} ${node.id}`, nx, ny - sc(6));

      // IP Badge
      if (node.ip) {
        ctx.font = `500 ${sf(8)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = isHub ? '#38bdf8' : '#10b981';
        ctx.fillText(node.ip, nx, ny + sc(10));
      }
    };

    if (topology === 'bus') {
      // ─── BUS TOPOLOGY (Backbone line with Terminators) ───
      const busLineY = cy;
      const leftTermX = x + sc(35);
      const rightTermX = x + w - sc(35);

      // Main Backbone Cable
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(leftTermX, busLineY);
      ctx.lineTo(rightTermX, busLineY);
      ctx.stroke();

      // Terminators [T]
      const drawTerm = (tx: number) => {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(tx - 6 * dpr, busLineY - 12 * dpr, 12 * dpr, 24 * dpr);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(tx - 6 * dpr, busLineY - 12 * dpr, 12 * dpr, 24 * dpr);
        ctx.font = `bold ${sf(8)}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('T', tx, busLineY);
      };
      drawTerm(leftTermX);
      drawTerm(rightTermX);

      // Place nodes alternating above and below the backbone
      const count = Math.max(1, nodes.length);
      const stepX = (rightTermX - leftTermX - sc(40)) / Math.max(1, count);

      nodes.forEach((node, i) => {
        const nx = leftTermX + sc(20) + (i + 0.5) * stepX;
        const isAbove = i % 2 === 0;
        const ny = isAbove ? cy - sc(50) : cy + sc(50);

        // Drop line
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.8 * dpr;
        ctx.beginPath();
        ctx.moveTo(nx, busLineY);
        ctx.lineTo(nx, isAbove ? ny + nodeBoxH / 2 : ny - nodeBoxH / 2);
        ctx.stroke();

        // T-Connector dot on backbone
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(nx, busLineY, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fill();

        drawDeviceNode(nx, ny, node);
      });
    } else if (topology === 'mesh') {
      // ─── FULL MESH TOPOLOGY ───
      const count = Math.max(1, nodes.length);
      const radius = Math.min(w * 0.36, contentH * 0.38);
      const coords = nodes.map((n, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
        return {
          node: n,
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        };
      });

      // Interconnect every pair (Mesh)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5 * dpr;
      for (let i = 0; i < coords.length; i++) {
        for (let j = i + 1; j < coords.length; j++) {
          ctx.beginPath();
          ctx.moveTo(coords[i].x, coords[i].y);
          ctx.lineTo(coords[j].x, coords[j].y);
          ctx.stroke();
        }
      }

      // Draw nodes on top
      coords.forEach((c) => drawDeviceNode(c.x, c.y, c.node));
    } else if (topology === 'ring') {
      // ─── RING TOPOLOGY (Token Ring Loop) ───
      const count = Math.max(1, nodes.length);
      const radius = Math.min(w * 0.36, contentH * 0.38);
      const coords = nodes.map((n, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
        return {
          node: n,
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        };
      });

      // Closed loop cables with directional arrows
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2 * dpr;
      for (let i = 0; i < coords.length; i++) {
        const next = coords[(i + 1) % coords.length];
        ctx.beginPath();
        ctx.moveTo(coords[i].x, coords[i].y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();

        // Direction arrow halfway
        const midX = (coords[i].x + next.x) / 2;
        const midY = (coords[i].y + next.y) / 2;
        drawArrow(ctx, coords[i].x, coords[i].y, midX + 2 * dpr, midY + 2 * dpr, '#10b981', dpr);
      }

      // Draw nodes
      coords.forEach((c) => drawDeviceNode(c.x, c.y, c.node));
    } else if (topology === 'tree') {
      // ─── TREE / HIERARCHICAL TOPOLOGY ───
      const rootNode = nodes[0] || { id: 'CORE', name: 'Core Router', type: 'router', ip: '10.0.0.1' };
      const rootX = cx;
      const rootY = contentY + sc(28);

      const midNodes = nodes.slice(1, 3);
      const leafNodes = nodes.slice(3);

      const midY = contentY + contentH * 0.5;
      const leafY = contentY + contentH - sc(14);

      // Root Node
      drawDeviceNode(rootX, rootY, rootNode);

      // Mid level switches
      const midCoords: Array<{ x: number; y: number; node: any }> = [];
      const midW = w * 0.55;
      midNodes.forEach((mn, mi) => {
        const mx = cx - midW / 2 + (mi + 0.5) * (midW / Math.max(1, midNodes.length));
        midCoords.push({ x: mx, y: midY, node: mn });

        // Branch from root to mid
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8 * dpr;
        ctx.beginPath();
        ctx.moveTo(rootX, rootY + nodeBoxH / 2);
        ctx.lineTo(mx, midY - nodeBoxH / 2);
        ctx.stroke();

        drawDeviceNode(mx, midY, mn);
      });

      // Leaf nodes
      if (leafNodes.length > 0) {
        const leafW = w * 0.8;
        leafNodes.forEach((ln, li) => {
          const lx = cx - leafW / 2 + (li + 0.5) * (leafW / leafNodes.length);
          const parentMid = midCoords[li % midCoords.length] || { x: rootX, y: rootY };

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(parentMid.x, parentMid.y + nodeBoxH / 2);
          ctx.lineTo(lx, leafY - nodeBoxH / 2);
          ctx.stroke();

          drawDeviceNode(lx, leafY, ln);
        });
      }
    } else {
      // ─── STAR TOPOLOGY (DEFAULT) ───
      const centerNode = nodes.find((n) => n.type === 'switch' || n.type === 'router') || nodes[0];
      const peripheralNodes = nodes.filter((n) => n !== centerNode);

      const radius = Math.min(w * 0.36, contentH * 0.42);
      const count = Math.max(1, peripheralNodes.length);

      // Radial connecting cables
      peripheralNodes.forEach((pNode, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
        const px = cx + radius * Math.cos(angle);
        const py = cy + radius * Math.sin(angle);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8 * dpr;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Data pulse dot on cable
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx + (px - cx) * 0.45, cy + (py - cy) * 0.45, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();

        drawDeviceNode(px, py, pNode);
      });

      // Central Switch / Hub on top of cables
      drawDeviceNode(cx, cy, centerNode);
    }

    // Bottom explanation banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.roundRect(x + 16 * dpr, y + h - sc(30), w - 32 * dpr, sc(22), 4 * dpr);
    ctx.fill();
    ctx.stroke();

    const explanations: Record<string, string> = {
      star: 'Central switch coordinates traffic; failure of a single cable does not take down the network',
      mesh: 'Full redundancy (n(n-1)/2 links); highest fault tolerance but most expensive cabling',
      bus: 'Shared central backbone with terminators; easy to install but signal collisions & single break halts bus',
      ring: 'Token passes unidirectionally; deterministic access control without data collisions',
      tree: 'Hierarchical scalability combining star groups; ideal for multi-floor enterprise networks',
      clientServer: 'Centralized servers provide compute, database, and auth services to authenticated clients',
    };

    ctx.font = `500 ${sf(9.5)}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ ${explanations[topology] || 'High-performance structured network configuration'}`, x + w / 2, y + h - sc(19));
    ctx.textBaseline = 'alphabetic';
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
  const gateType = (shape.params?.gateType || 'AND').toUpperCase();
  const blockType = shape.params?.blockType;
  const strokeColor = shape.strokeColor || '#38bdf8';
  const showLabels = shape.params?.showLabels ?? true;

  // Base unscaled reference width for proportional corner resize scaling
  const defaultBaseW = blockType ? 220 : 170;
  const baseW = defaultBaseW * dpr;
  const resizeScale = Math.max(0.4, Math.min(3.8, w / baseW));

  const customFontSize = typeof shape.params?.fontSize === 'number' && shape.params.fontSize > 0 ? shape.params.fontSize : 14;
  const effectiveFontScale = (customFontSize / 14) * resizeScale;
  const sf = (basePx: number) => Math.max(7, Math.round(basePx * effectiveFontScale * dpr));
  const sc = (basePx: number) => Math.round(basePx * resizeScale * dpr);

  const lineWidth = Math.max(1.8 * dpr, sc(2.4));
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.92)';

  if (blockType) {
    // ─── COMBINATIONAL / SEQUENTIAL IC BLOCKS ──────────────────────────
    if (blockType === 'HalfAdder' || blockType === 'FullAdder') {
      const isFull = blockType === 'FullAdder';
      const title = isFull ? 'FULL ADDER (FA)' : 'HALF ADDER (HA)';

      const a = (shape.params?.inputA ?? 1) & 1;
      const b = (shape.params?.inputB ?? 0) & 1;
      const cin = (shape.params?.cin ?? (isFull ? 1 : 0)) & 1;

      const { sum, cout, formulaStr } = evaluateAdder(isFull, a, b, cin);

      const inputs = isFull
        ? [{ label: 'A', val: a }, { label: 'B', val: b }, { label: 'Cin', val: cin }]
        : [{ label: 'A', val: a }, { label: 'B', val: b }];

      const outputs = [
        { label: 'Sum (S)', val: sum },
        { label: isFull ? 'Cout' : 'Carry (C)', val: cout },
      ];

      const leadW = Math.max(20 * dpr, sc(28));
      const boxX = x + leadW;
      const boxW = w - leadW * 2;
      const boxY = y + sc(10);
      const boxH = h - sc(20);

      // IC Body
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 8 * dpr);
      ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Header Bar
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, sc(28), [8 * dpr, 8 * dpr, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.stroke();

      ctx.font = `bold ${sf(11.5)}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, boxX + boxW / 2, boxY + sc(14));

      // Live Arithmetic Display Box in center
      ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(formulaStr, boxX + boxW / 2, boxY + boxH * 0.48);

      // Logic Hint at bottom
      ctx.font = `${sf(8.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(
        isFull ? 'S = A ⊕ B ⊕ Cin,  Cout = AB + Cin(A⊕B)' : 'S = A ⊕ B,  Carry = A · B',
        boxX + boxW / 2,
        boxY + boxH - sc(12)
      );

      // Input pins on left
      inputs.forEach((inPin, i) => {
        const py = boxY + sc(34) + ((boxH - sc(50)) / (inputs.length + 1)) * (i + 1);
        const isActive = inPin.val === 1;

        ctx.strokeStyle = isActive ? '#10b981' : strokeColor;
        ctx.lineWidth = (isActive ? 2.5 : 1.5) * dpr;
        ctx.beginPath();
        ctx.moveTo(x, py);
        ctx.lineTo(boxX, py);
        ctx.stroke();

        if (showLabels) {
          ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = isActive ? '#10b981' : '#38bdf8';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${inPin.label} = ${inPin.val}`, x + sc(3), py - sc(3));
        }
      });

      // Output pins on right
      outputs.forEach((outPin, i) => {
        const py = boxY + sc(34) + ((boxH - sc(50)) / (outputs.length + 1)) * (i + 1);
        const isActive = outPin.val === 1;

        ctx.strokeStyle = isActive ? '#10b981' : strokeColor;
        ctx.lineWidth = (isActive ? 2.5 : 1.5) * dpr;
        ctx.beginPath();
        ctx.moveTo(boxX + boxW, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();

        if (showLabels) {
          ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = isActive ? '#10b981' : '#34d399';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${outPin.label} = ${outPin.val}`, x + w - sc(3), py - sc(3));
        }
      });
      ctx.textBaseline = 'alphabetic';
    } else if (blockType === 'MUX' || blockType.startsWith('MUX')) {
      // ─── CUSTOMIZABLE N:1 MULTIPLEXER (2:1, 4:1, 8:1, 16:1) ───
      const rawSize = shape.params?.muxSize || (Array.isArray(shape.params?.inputs) ? shape.params.inputs.length : 4);
      const muxSize = [2, 4, 8, 16].includes(rawSize) ? rawSize : 4;
      const selectCount = Math.ceil(Math.log2(muxSize));

      const rawInputValues = Array.isArray(shape.params?.inputValues) ? shape.params.inputValues : [];
      const inputValues = Array.from({ length: muxSize }, (_, i) => (rawInputValues[i] ?? (i % 2 === 1 ? 1 : 0)) & 1);

      let selectedChannel = 0;
      if (typeof shape.params?.selectedChannel === 'number') {
        selectedChannel = Math.max(0, Math.min(muxSize - 1, shape.params.selectedChannel));
      } else if (Array.isArray(shape.params?.selectValues)) {
        selectedChannel = shape.params.selectValues.reduce((acc, bit, idx) => acc | ((bit & 1) << idx), 0) % muxSize;
      }

      const outputVal = inputValues[selectedChannel] ?? 0;

      // Authentic Trapezoid Geometry
      const leadW = Math.max(18 * dpr, sc(26));
      const mx = x + leadW;
      const mw = w - leadW * 2;
      const topOffset = Math.min(h * 0.22, sc(28));
      const my = y + sc(8);
      const mh = h - sc(26);

      // Trapezoid Body
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + mw, my + topOffset);
      ctx.lineTo(mx + mw, my + mh - topOffset);
      ctx.lineTo(mx, my + mh);
      ctx.closePath();

      ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Title Banner
      ctx.font = `bold ${sf(12.5)}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${muxSize}:1 MUX`, mx + mw * 0.52, my + sc(20));

      // Status Equation inside
      ctx.font = `bold ${sf(9.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = outputVal === 1 ? '#10b981' : '#94a3b8';
      ctx.fillText(`Y = D${selectedChannel} (${outputVal})`, mx + mw * 0.52, my + mh - sc(16));

      // Internal Active Routing Wire (Connecting active input pin to output Y)
      const selectedPy = my + (mh / (muxSize + 1)) * (selectedChannel + 1);
      const outY = my + mh / 2;
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = Math.max(2.2 * dpr, sc(2.8));
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.beginPath();
      ctx.moveTo(mx, selectedPy);
      ctx.lineTo(mx + mw * 0.52, selectedPy);
      ctx.lineTo(mx + mw, outY);
      ctx.stroke();
      ctx.restore();

      // Data Inputs on Left (D0 .. D(n-1))
      for (let i = 0; i < muxSize; i++) {
        const py = my + (mh / (muxSize + 1)) * (i + 1);
        const isSelected = i === selectedChannel;
        const bitVal = inputValues[i] ?? 0;

        ctx.strokeStyle = isSelected ? '#10b981' : 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = (isSelected ? 2.5 : 1.5) * dpr;
        ctx.beginPath();
        ctx.moveTo(x, py);
        ctx.lineTo(mx, py);
        ctx.stroke();

        if (showLabels) {
          ctx.font = `bold ${sf(muxSize > 8 ? 8 : 9.5)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = isSelected ? '#10b981' : '#cbd5e1';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`D${i}=${bitVal}`, x + sc(2), py - sc(2));
        }
      }

      // Output Y on Right
      ctx.strokeStyle = outputVal === 1 ? '#10b981' : strokeColor;
      ctx.lineWidth = (outputVal === 1 ? 2.5 : 1.8) * dpr;
      ctx.beginPath();
      ctx.moveTo(mx + mw, outY);
      ctx.lineTo(x + w, outY);
      ctx.stroke();

      if (showLabels) {
        ctx.font = `bold ${sf(11)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = outputVal === 1 ? '#10b981' : '#34d399';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Y = ${outputVal}`, x + w - sc(3), outY - sc(3));
      }

      // Select Pins from Bottom (S0..S(k-1))
      for (let s = 0; s < selectCount; s++) {
        const sx = mx + mw * (0.35 + (s * 0.35) / Math.max(1, selectCount - 1));
        const selBit = (selectedChannel >> s) & 1;

        ctx.strokeStyle = selBit === 1 ? '#fbbf24' : 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(sx, my + mh - topOffset * 0.7);
        ctx.lineTo(sx, y + h);
        ctx.stroke();

        if (showLabels) {
          ctx.font = `bold ${sf(8.5)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`S${s}=${selBit}`, sx, y + h - sc(2));
        }
      }
      ctx.textBaseline = 'alphabetic';
    } else if (blockType === 'FlipFlop') {
      // ─── CLOCKED FLIP-FLOP (D, JK, T, SR) ───
      const ffType = (shape.params?.ffType || 'D') as 'D' | 'JK' | 'T' | 'SR';
      const stateQ = (shape.params?.stateQ ?? 0) & 1;
      const stateQbar = 1 - stateQ;

      const d = (shape.params?.inputD ?? 1) & 1;
      const j = (shape.params?.inputJ ?? 1) & 1;
      const k = (shape.params?.inputK ?? 0) & 1;
      const t = (shape.params?.inputT ?? 1) & 1;
      const s = (shape.params?.inputS ?? 1) & 1;
      const r = (shape.params?.inputR ?? 0) & 1;

      const { mode } = evaluateFlipFlopNextState(ffType, stateQ, { d, j, k, t, s, r });

      const leadW = Math.max(18 * dpr, sc(26));
      const bx = x + leadW;
      const bw = w - leadW * 2;
      const by = y + sc(10);
      const bh = h - sc(20);

      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6 * dpr);
      ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.94)';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      ctx.font = `bold ${sf(12.5)}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${ffType} FLIP-FLOP`, bx + bw / 2, by + sc(18));

      // Current State Display inside
      ctx.font = `bold ${sf(11)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = stateQ === 1 ? '#10b981' : '#cbd5e1';
      ctx.fillText(`State: Q = ${stateQ}`, bx + bw / 2, by + bh * 0.48);

      // Mode hint
      ctx.font = `${sf(8.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Mode: ${mode}`, bx + bw / 2, by + bh - sc(14));

      // Input pins tailored to Flip-Flop Type
      if (ffType === 'D' || ffType === 'T') {
        const inName = ffType;
        const inVal = ffType === 'D' ? d : t;
        const iy = by + bh * 0.35;
        const isActive = inVal === 1;

        ctx.strokeStyle = isActive ? '#10b981' : strokeColor;
        ctx.lineWidth = (isActive ? 2.5 : 1.5) * dpr;
        ctx.beginPath();
        ctx.moveTo(x, iy);
        ctx.lineTo(bx, iy);
        ctx.stroke();

        if (showLabels) {
          ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = isActive ? '#10b981' : '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${inName}=${inVal}`, x + sc(3), iy - sc(3));
        }
      } else if (ffType === 'JK' || ffType === 'SR') {
        const topName = ffType === 'JK' ? 'J' : 'S';
        const topVal = ffType === 'JK' ? j : s;
        const botName = ffType === 'JK' ? 'K' : 'R';
        const botVal = ffType === 'JK' ? k : r;

        const topY = by + bh * 0.25;
        const botY = by + bh * 0.75;

        // Top pin (J / S)
        ctx.strokeStyle = topVal === 1 ? '#10b981' : strokeColor;
        ctx.lineWidth = (topVal === 1 ? 2.5 : 1.5) * dpr;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(bx, topY);
        ctx.stroke();

        if (showLabels) {
          ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = topVal === 1 ? '#10b981' : '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${topName}=${topVal}`, x + sc(3), topY - sc(3));
        }

        // Bottom pin (K / R)
        ctx.strokeStyle = botVal === 1 ? '#10b981' : strokeColor;
        ctx.lineWidth = (botVal === 1 ? 2.5 : 1.5) * dpr;
        ctx.beginPath();
        ctx.moveTo(x, botY);
        ctx.lineTo(bx, botY);
        ctx.stroke();

        if (showLabels) {
          ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = botVal === 1 ? '#10b981' : '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${botName}=${botVal}`, x + sc(3), botY - sc(3));
        }
      }

      // CLK input with internal chevron indicator
      const clkY = by + bh * (ffType === 'JK' || ffType === 'SR' ? 0.50 : 0.70);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(x, clkY);
      ctx.lineTo(bx, clkY);
      ctx.stroke();

      // Clock triangle inside
      ctx.beginPath();
      ctx.moveTo(bx, clkY - sc(6));
      ctx.lineTo(bx + sc(9), clkY);
      ctx.lineTo(bx, clkY + sc(6));
      ctx.stroke();

      if (showLabels) {
        ctx.font = `bold ${sf(9.5)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('CLK', x + sc(3), clkY - sc(3));
      }

      // Q and Q-bar outputs
      const qY = by + bh * 0.35;
      const qbY = by + bh * 0.70;

      // Q wire
      ctx.strokeStyle = stateQ === 1 ? '#10b981' : strokeColor;
      ctx.lineWidth = (stateQ === 1 ? 2.5 : 1.5) * dpr;
      ctx.beginPath();
      ctx.moveTo(bx + bw, qY);
      ctx.lineTo(x + w, qY);
      ctx.stroke();

      // Q-bar wire
      ctx.strokeStyle = stateQbar === 1 ? '#10b981' : strokeColor;
      ctx.lineWidth = (stateQbar === 1 ? 2.5 : 1.5) * dpr;
      ctx.beginPath();
      ctx.moveTo(bx + bw, qbY);
      ctx.lineTo(x + w, qbY);
      ctx.stroke();

      if (showLabels) {
        ctx.font = `bold ${sf(11)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = stateQ === 1 ? '#10b981' : '#34d399';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Q = ${stateQ}`, x + w - sc(3), qY - sc(3));

        ctx.fillStyle = stateQbar === 1 ? '#10b981' : '#34d399';
        ctx.fillText(`Q̅ = ${stateQbar}`, x + w - sc(3), qbY - sc(3));
      }
      ctx.textBaseline = 'alphabetic';
    } else if (blockType === 'Counter4' || blockType === 'BinaryCounter') {
      // ─── 4-BIT BINARY COUNTER (74LS161 / 74LS93) ───
      const countVal = Math.max(0, Math.min(15, shape.params?.countValue ?? 0));
      const q3 = (countVal >> 3) & 1;
      const q2 = (countVal >> 2) & 1;
      const q1 = (countVal >> 1) & 1;
      const q0 = countVal & 1;
      const tc = countVal === 15 ? 1 : 0;

      const leadW = Math.max(20 * dpr, sc(28));
      const bx = x + leadW;
      const bw = w - leadW * 2;
      const by = y + sc(10);
      const bh = h - sc(20);

      // IC Body
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8 * dpr);
      ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.96)';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Header Bar
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, sc(28), [8 * dpr, 8 * dpr, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.stroke();

      ctx.font = `bold ${sf(11)}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('4-BIT BINARY COUNTER', bx + bw / 2, by + sc(14));

      // LED Digital Bezel inside
      const bezelW = bw * 0.72;
      const bezelH = sc(38);
      const bezelX = bx + (bw - bezelW) / 2;
      const bezelY = by + sc(38);

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.roundRect(bezelX, bezelY, bezelW, bezelH, 5 * dpr);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.stroke();

      // 4-bit Binary Digits [ Q3 Q2 Q1 Q0 ]
      ctx.font = `bold ${sf(15)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${q3}   ${q2}   ${q1}   ${q0}`, bezelX + bezelW / 2, bezelY + bezelH / 2);

      // Decimal value display
      ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`DECIMAL: ${countVal} / 15`, bx + bw / 2, by + bh - sc(16));

      // Left pins: RST (top), CLK (mid with chevron), EN (bottom)
      const rstY = by + bh * 0.28;
      const clkY = by + bh * 0.52;
      const enY = by + bh * 0.76;

      // RST
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(x, rstY);
      ctx.lineTo(bx, rstY);
      ctx.stroke();

      // CLK
      ctx.beginPath();
      ctx.moveTo(x, clkY);
      ctx.lineTo(bx, clkY);
      ctx.stroke();

      // Clock triangle inside
      ctx.beginPath();
      ctx.moveTo(bx, clkY - sc(6));
      ctx.lineTo(bx + sc(8), clkY);
      ctx.lineTo(bx, clkY + sc(6));
      ctx.stroke();

      // EN
      ctx.beginPath();
      ctx.moveTo(x, enY);
      ctx.lineTo(bx, enY);
      ctx.stroke();

      if (showLabels) {
        ctx.font = `bold ${sf(9.5)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('RST', x + sc(3), rstY - sc(3));

        ctx.fillStyle = '#fbbf24';
        ctx.fillText('CLK', x + sc(3), clkY - sc(3));

        ctx.fillStyle = '#38bdf8';
        ctx.fillText('EN', x + sc(3), enY - sc(3));
      }

      // Right output pins: Q3 (MSB), Q2, Q1, Q0 (LSB) + TC
      const outPins = [
        { label: 'Q3', val: q3 },
        { label: 'Q2', val: q2 },
        { label: 'Q1', val: q1 },
        { label: 'Q0', val: q0 },
        { label: 'TC', val: tc },
      ];

      outPins.forEach((p, idx) => {
        const py = by + sc(34) + ((bh - sc(48)) / (outPins.length + 1)) * (idx + 1);
        const isActive = p.val === 1;

        ctx.strokeStyle = isActive ? '#10b981' : strokeColor;
        ctx.lineWidth = (isActive ? 2.5 : 1.5) * dpr;
        ctx.beginPath();
        ctx.moveTo(bx + bw, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();

        if (showLabels) {
          ctx.font = `bold ${sf(10)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = isActive ? '#10b981' : '#34d399';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${p.label}=${p.val}`, x + w - sc(3), py - sc(3));
        }
      });
      ctx.textBaseline = 'alphabetic';
    } else {
      // Default IC Box
      const leadW = Math.max(18 * dpr, sc(26));
      const bx = x + leadW;
      const bw = w - leadW * 2;
      const by = y + sc(10);
      const bh = h - sc(20);

      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6 * dpr);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold ${sf(12)}px Inter, sans-serif`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shape.label || blockType, bx + bw / 2, by + bh / 2);
      ctx.textBaseline = 'alphabetic';
    }
    return;
  }

  // ─── STANDARD IEEE/ANSI LOGIC GATES ──────────────────────────────────
  // Input Leads & Labels Calculation
  const inputsCount = typeof shape.params?.inputs === 'number'
    ? shape.params.inputs
    : gateType === 'NOT'
    ? 1
    : 2;

  const rawLabels: string[] = Array.isArray(shape.params?.inputLabels)
    ? shape.params.inputLabels
    : [
        shape.params?.labelA || 'A',
        shape.params?.labelB || 'B',
        shape.params?.labelC || 'C',
      ];
  const inputLabels = rawLabels.slice(0, inputsCount);
  const labelY = shape.params?.labelY || shape.params?.output || 'Y';

  const leadW = Math.max(18 * dpr, sc(28));
  const gx = x + leadW;
  const gy = y + sc(6);
  const gh = h - sc(12);
  const gw = w - leadW * 2;
  const cy = gy + gh / 2;
  const bubbleR = Math.max(3.5 * dpr, sc(4.5));

  // Determine Input Pin Y Coordinates
  let pinYs: number[] = [];
  if (inputsCount === 1) {
    pinYs = [cy];
  } else if (inputsCount === 2) {
    pinYs = [gy + gh * 0.3, gy + gh * 0.7];
  } else if (inputsCount === 3) {
    pinYs = [gy + gh * 0.2, cy, gy + gh * 0.8];
  } else {
    pinYs = Array.from({ length: inputsCount }, (_, i) => gy + gh * ((i + 0.5) / inputsCount));
  }

  // ─── 1. DRAW INPUT LEADS & LABELS ───
  pinYs.forEach((py, idx) => {
    let leadEndX = gx;

    if (gateType === 'XOR' || gateType === 'XNOR') {
      // Connect to outer detached curved arc
      const xorOffset = Math.max(7 * dpr, sc(10));
      const arcBackX = gx - xorOffset;
      const t = (py - gy) / gh;
      // Quadratic curve x at parameter t
      leadEndX = (1 - t) * (1 - t) * arcBackX + 2 * (1 - t) * t * (arcBackX + gw * 0.28) + t * t * arcBackX;
    } else if (gateType === 'OR' || gateType === 'NOR') {
      // Connect to curved concave back
      const t = (py - gy) / gh;
      leadEndX = (1 - t) * (1 - t) * gx + 2 * (1 - t) * t * (gx + gw * 0.28) + t * t * gx;
    }

    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(leadEndX, py);
    ctx.stroke();

    if (showLabels) {
      // Input Label Text (e.g. A, B, C)
      const lbl = inputLabels[idx] || (idx === 0 ? 'A' : idx === 1 ? 'B' : 'C');
      ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', Inter, monospace`;
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(lbl, x + sc(3), py - sc(4));
    }
  });

  // ─── 2. DRAW GATE BODY (AUTHENTIC IEEE SYMBOL) ───
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.92)';

  if (gateType === 'AND' || gateType === 'NAND') {
    // ── AND / NAND GATE ──
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw * 0.5, gy);
    ctx.arc(gx + gw * 0.5, cy, gh / 2, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(gx, gy + gh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (gateType === 'NAND') {
      ctx.beginPath();
      ctx.arc(gx + gw + bubbleR, cy, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fill();
      ctx.stroke();
    }
  } else if (gateType === 'OR' || gateType === 'NOR') {
    // ── OR / NOR GATE ──
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + gw * 0.28, cy, gx, gy + gh);
    ctx.quadraticCurveTo(gx + gw * 0.55, gy + gh, gx + gw, cy);
    ctx.quadraticCurveTo(gx + gw * 0.55, gy, gx, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (gateType === 'NOR') {
      ctx.beginPath();
      ctx.arc(gx + gw + bubbleR, cy, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fill();
      ctx.stroke();
    }
  } else if (gateType === 'XOR' || gateType === 'XNOR') {
    // ── XOR / XNOR GATE (AUTHENTIC IEEE COMPLIANT) ──
    const xorOffset = Math.max(7 * dpr, sc(10));
    const arcBackX = gx - xorOffset;

    // 1. Detached Outer Curved Back Arc
    ctx.beginPath();
    ctx.moveTo(arcBackX, gy);
    ctx.quadraticCurveTo(arcBackX + gw * 0.28, cy, arcBackX, gy + gh);
    ctx.stroke();

    // 2. Main Gate Body
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + gw * 0.28, cy, gx, gy + gh);
    ctx.quadraticCurveTo(gx + gw * 0.55, gy + gh, gx + gw, cy);
    ctx.quadraticCurveTo(gx + gw * 0.55, gy, gx, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Inversion Bubble for XNOR
    if (gateType === 'XNOR') {
      ctx.beginPath();
      ctx.arc(gx + gw + bubbleR, cy, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fill();
      ctx.stroke();
    }
  } else if (gateType === 'NOT') {
    // ── NOT INVERTER GATE ──
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw - bubbleR * 2, cy);
    ctx.lineTo(gx, gy + gh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(gx + gw - bubbleR, cy, bubbleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // ─── 3. DRAW OUTPUT LEAD & LABEL ───
  let outLeadStartX = gx + gw;
  if (gateType === 'NAND' || gateType === 'NOR' || gateType === 'XNOR') {
    outLeadStartX = gx + gw + bubbleR * 2;
  } else if (gateType === 'NOT') {
    outLeadStartX = gx + gw;
  }

  ctx.beginPath();
  ctx.moveTo(outLeadStartX, cy);
  ctx.lineTo(x + w, cy);
  ctx.stroke();

  if (showLabels) {
    // Output Label Text (e.g. Y, Q, Sum)
    ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', Inter, monospace`;
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(labelY, x + w - sc(3), cy - sc(4));
  }

  // Gate Type Label inside/under
  ctx.font = `600 ${sf(9)}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(gateType, gx + gw * 0.42, cy);
  ctx.textBaseline = 'alphabetic';
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
  const rows: any[][] = shape.params?.rows || [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ];
  const inputCount = shape.params?.inputCount ?? (headers.length > 1 ? headers.length - 1 : 1);
  const baseFontSize = typeof shape.params?.fontSize === 'number' && shape.params.fontSize > 0 ? shape.params.fontSize : 13;

  // Proportional corner resize scaling
  const baseW = 420 * dpr;
  const resizeScale = Math.max(0.4, Math.min(3.8, w / baseW));
  const effectiveFontScale = (baseFontSize / 13) * resizeScale;
  const sf = (basePx: number) => Math.max(7, Math.round(basePx * effectiveFontScale * dpr));
  const sc = (basePx: number) => Math.round(basePx * resizeScale * dpr);

  // Outer Card Frame
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.96)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = Math.max(1.5 * dpr, sc(1.8));
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8 * dpr);
  ctx.fill();
  ctx.stroke();

  const colCount = Math.max(1, headers.length);
  const colW = w / colCount;
  const headerH = Math.max(26 * dpr, sc(34));

  // ─── 1. HEADER ROW WITH INPUT VS OUTPUT DISTINCTION ───
  // Input headers background (Blue/Cyan tint)
  const inputW = Math.min(w, inputCount * colW);
  ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
  ctx.fillRect(x, y, inputW, headerH);

  // Output headers background (Emerald tint)
  if (w > inputW) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.fillRect(x + inputW, y, w - inputW, headerH);
  }

  // Header bottom border
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.moveTo(x, y + headerH);
  ctx.lineTo(x + w, y + headerH);
  ctx.stroke();

  // Column headers text
  ctx.textBaseline = 'middle';
  headers.forEach((hName, idx) => {
    const isInput = idx < inputCount;
    ctx.font = `bold ${sf(11.5)}px Inter, sans-serif`;
    ctx.fillStyle = isInput ? '#38bdf8' : '#34d399';
    ctx.textAlign = 'center';
    ctx.fillText(hName, x + idx * colW + colW / 2, y + headerH / 2);
  });

  // ─── 2. VISIBLE ROWS (SLIGHTLY DIM IN COLOUR) ───
  const availH = h - headerH;
  const rowCount = Math.max(1, rows.length);
  const rowH = availH / rowCount;

  rows.forEach((row, rIdx) => {
    const ry = y + headerH + rIdx * rowH;

    // Alternating visible row background (slightly dim in colour)
    if (rIdx % 2 === 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.fillRect(x, ry, w, rowH);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(x, ry, w, rowH);
    }

    // Visible horizontal row border (slightly dim in colour)
    if (rIdx < rowCount - 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(x, ry + rowH);
      ctx.lineTo(x + w, ry + rowH);
      ctx.stroke();
    }

    // Cell values
    row.forEach((val: any, cIdx: number) => {
      const cx = x + cIdx * colW + colW / 2;
      const cy = ry + rowH / 2;
      const isInput = cIdx < inputCount;

      if (val === 1 || val === '1') {
        ctx.fillStyle = '#10b981';
        ctx.font = `bold ${sf(12)}px 'JetBrains Mono', monospace`;
        ctx.fillText('1', cx, cy);
      } else if (val === 0 || val === '0') {
        ctx.fillStyle = isInput ? '#cbd5e1' : '#94a3b8';
        ctx.font = `${sf(12)}px 'JetBrains Mono', monospace`;
        ctx.fillText('0', cx, cy);
      } else if (val === '' || val === '-' || val == null) {
        // Blank row value for classroom exercise / quiz: keep empty (nothing drawn)
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.font = `600 ${sf(11.5)}px 'JetBrains Mono', monospace`;
        ctx.fillText(String(val), cx, cy);
      }
    });
  });

  // ─── 3. VISIBLE COLUMN DIVIDERS ───
  for (let c = 1; c < colCount; c++) {
    const vx = x + c * colW;
    const isSplit = c === inputCount;

    // Distinct prominent divider between inputs and outputs, and clear visible dividers between all columns
    ctx.strokeStyle = isSplit ? '#38bdf8' : 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = (isSplit ? 2 : 1.2) * dpr;
    ctx.beginPath();
    ctx.moveTo(vx, y);
    ctx.lineTo(vx, y + h);
    ctx.stroke();
  }

  ctx.textBaseline = 'alphabetic'; // reset
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
  const vars = Math.max(2, Math.min(5, Number(shape.params?.variables) || 3));
  const baseFontSize = typeof shape.params?.fontSize === 'number' && shape.params.fontSize > 0 ? shape.params.fontSize : 14;

  const rawVarNames: string[] = Array.isArray(shape.params?.varNames) && shape.params.varNames.length >= vars
    ? shape.params.varNames
    : getDefaultKMapVariableNames(vars);
  const varNames = rawVarNames.slice(0, vars);

  // Proportional corner resize scaling
  const baseW = (vars === 5 ? 780 : vars === 4 ? 460 : vars === 2 ? 340 : 440) * dpr;
  const resizeScale = Math.max(0.35, Math.min(3.8, w / baseW));
  const effectiveFontScale = (baseFontSize / 14) * resizeScale;
  const sf = (basePx: number) => Math.max(6, Math.round(basePx * effectiveFontScale * dpr));
  const sc = (basePx: number) => Math.round(basePx * resizeScale * dpr);

  // Outer Frame
  ctx.fillStyle = shape.fillColor || 'rgba(15, 23, 42, 0.96)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = Math.max(1.5 * dpr, sc(1.8));
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8 * dpr);
  ctx.fill();
  ctx.stroke();

  // Header Bar
  const headerH = Math.max(24 * dpr, sc(30));
  ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, headerH, [8 * dpr, 8 * dpr, 0, 0]);
  ctx.fill();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.beginPath();
  ctx.moveTo(x, y + headerH);
  ctx.lineTo(x + w, y + headerH);
  ctx.stroke();

  const functionExpr = shape.params?.canonicalExpr ? ` · ${shape.params.canonicalExpr}` : '';
  ctx.font = `bold ${sf(11.5)}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🔲 ${vars}-Variable Karnaugh Map (${varNames.join(', ')})${functionExpr}`, x + sc(14), y + headerH / 2);

  const gridData: any = shape.params?.grid || [];

  if (vars === 5) {
    // ─── 5-VARIABLE TRADITIONAL DUAL K-MAP (A=0 and A=1) ───
    const subPad = sc(12);
    const subW = (w - subPad * 3) / 2;
    const subH = h - headerH - subPad * 2;
    const subY = y + headerH + subPad;

    const v0 = varNames[0] || 'A';
    const rowVars = `${varNames[1] || 'B'}${varNames[2] || 'C'}`;
    const colVars = `${varNames[3] || 'D'}${varNames[4] || 'E'}`;

    // Submap 1: V0 = 0 (minterms 0 to 15)
    renderSingleKMapBlock(
      ctx,
      x + subPad,
      subY,
      subW,
      subH,
      dpr,
      4,
      rowVars,
      colVars,
      ['00', '01', '11', '10'],
      ['00', '01', '11', '10'],
      gridData,
      0, // colOffset = 0
      `${v0} = 0 (m0 - m15)`,
      vars,
      sf,
      sc
    );

    // Submap 2: V0 = 1 (minterms 16 to 31)
    renderSingleKMapBlock(
      ctx,
      x + subPad * 2 + subW,
      subY,
      subW,
      subH,
      dpr,
      4,
      rowVars,
      colVars,
      ['00', '01', '11', '10'],
      ['00', '01', '11', '10'],
      gridData,
      4, // colOffset = 4
      `${v0} = 1 (m16 - m31)`,
      vars,
      sf,
      sc
    );
  } else {
    // ─── 2, 3, or 4-VARIABLE STANDARD TRADITIONAL K-MAP ───
    const pad = sc(16);
    const mapX = x + pad;
    const mapY = y + headerH + pad;
    const mapW = w - pad * 2;
    const mapH = h - headerH - pad * 2;

    const rowVarText = vars === 2 ? varNames[0] : vars === 3 ? varNames[0] : `${varNames[0]}${varNames[1]}`;
    const colVarText = vars === 2 ? varNames[1] : vars === 3 ? `${varNames[1]}${varNames[2]}` : `${varNames[2]}${varNames[3]}`;

    const rowLabels = vars === 4 ? ['00', '01', '11', '10'] : ['0', '1'];
    const colLabels = vars === 2 ? ['0', '1'] : ['00', '01', '11', '10'];

    renderSingleKMapBlock(
      ctx,
      mapX,
      mapY,
      mapW,
      mapH,
      dpr,
      vars,
      rowVarText,
      colVarText,
      rowLabels,
      colLabels,
      gridData,
      0,
      '',
      vars,
      sf,
      sc
    );
  }

  ctx.textBaseline = 'alphabetic'; // reset
}

/**
 * Renders a single traditional K-Map block with diagonal slash header, Gray-code axes,
 * small decimal minterm index in bottom-right of each cell, and centered cell value.
 */
function renderSingleKMapBlock(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  dpr: number,
  blockVars: number,
  rowVarText: string,
  colVarText: string,
  rowLabels: string[],
  colLabels: string[],
  gridData: any[][],
  colOffset: number,
  submapTitle: string,
  totalVars: number,
  sf: (px: number) => number,
  sc: (px: number) => number
) {
  let curY = by;
  let curH = bh;

  // Optional submap title banner (e.g. for 5-variable maps: "A = 0 (m0 - m15)")
  if (submapTitle) {
    const titleH = sc(22);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.beginPath();
    ctx.roundRect(bx, curY, bw, titleH, 4 * dpr);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.stroke();

    ctx.font = `bold ${sf(10.5)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(submapTitle, bx + bw / 2, curY + titleH / 2);

    curY += titleH + sc(6);
    curH -= titleH + sc(6);
  }

  const numRows = rowLabels.length;
  const numCols = colLabels.length;

  const labelW = sc(colLabels.length === 2 ? 36 : 46);
  const labelH = sc(26);

  const cellW = (bw - labelW) / numCols;
  const cellH = (curH - labelH) / numRows;

  // 1. Diagonal Header Cell (e.g. AB \ CD)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2 * dpr;
  ctx.strokeRect(bx, curY, labelW, labelH);

  ctx.beginPath();
  ctx.moveTo(bx, curY);
  ctx.lineTo(bx + labelW, curY + labelH);
  ctx.stroke();

  // Top-right of slash: Column Variables
  ctx.font = `bold ${sf(9)}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(colVarText, bx + labelW - sc(3), curY + sc(3));

  // Bottom-left of slash: Row Variables
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(rowVarText, bx + sc(3), curY + labelH - sc(3));

  // 2. Column Gray Code Headers (e.g. 00, 01, 11, 10)
  colLabels.forEach((cl, cIdx) => {
    const cx = bx + labelW + cIdx * cellW;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(cx, curY, cellW, labelH);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.fillRect(cx, curY, cellW, labelH);

    ctx.font = `bold ${sf(10)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cl, cx + cellW / 2, curY + labelH / 2);
  });

  // 3. Row Gray Code Headers (e.g. 00, 01, 11, 10)
  rowLabels.forEach((rl, rIdx) => {
    const ry = curY + labelH + rIdx * cellH;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(bx, ry, labelW, cellH);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.fillRect(bx, ry, labelW, cellH);

    ctx.font = `bold ${sf(10)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rl, bx + labelW / 2, ry + cellH / 2);
  });

  // 4. Data Cells with Decimal Indices and Values
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const cx = bx + labelW + c * cellW;
      const cy = curY + labelH + r * cellH;
      const actualCol = c + colOffset;
      const val = gridData[r]?.[actualCol] ?? '';

      // Authentic minterm decimal index
      const mintermIdx = getKMapMintermIndex(totalVars, r, actualCol);

      // Cell background based on value
      ctx.fillStyle = val === '1' || val === 1
        ? 'rgba(16, 185, 129, 0.14)'
        : val === 'X' || val === 'x'
        ? 'rgba(245, 158, 11, 0.14)'
        : 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(cx, cy, cellW, cellH);

      // Textbook cell border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(cx, cy, cellW, cellH);

      // Decimal minterm index in bottom-right corner of each cell
      ctx.font = `${sf(8.5)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(mintermIdx), cx + cellW - sc(4), cy + cellH - sc(3));

      // Cell value centered (if blank, render nothing!)
      if (val === '1' || val === 1) {
        ctx.font = `bold ${sf(13.5)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', cx + cellW / 2, cy + cellH / 2);
      } else if (val === '0' || val === 0) {
        ctx.font = `${sf(13.5)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('0', cx + cellW / 2, cy + cellH / 2);
      } else if (val === 'X' || val === 'x') {
        ctx.font = `bold ${sf(13.5)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', cx + cellW / 2, cy + cellH / 2);
      }
    }
  }
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

// ─── 8. Common Resources Renderers (Hierarchy, Mindmap, Timeline, Process) ──

const timelineImageCache = new Map<string, HTMLImageElement>();
function getCachedTimelineImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  const existing = timelineImageCache.get(src);
  if (existing) {
    if (existing.complete && existing.naturalWidth > 0) return existing;
    return null;
  }
  const img = new Image();
  img.src = src;
  timelineImageCache.set(src, img);
  return null;
}

// ─── Hierarchy Chart Renderer ───────────────────────────────────────────────

interface HierarchyLayoutBox {
  id: string;
  label: string;
  role?: string;
  color?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  children: HierarchyLayoutBox[];
}

function renderHierarchyChart(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const tree = shape.params?.tree || {
    id: 'node-root',
    label: 'Main Organization / Core Topic',
    role: 'Root',
    children: [
      { id: 'sub-1', label: 'Division A', role: 'Team 1' },
      { id: 'sub-2', label: 'Division B', role: 'Team 2' },
      { id: 'sub-3', label: 'Division C', role: 'Team 3' },
    ],
  };

  const theme = shape.params?.theme || 'ocean';
  const style = shape.params?.style || 'rounded';
  const fontSize = (shape.params?.fontSize || 14) * dpr;
  const selectedNodeId = shape.params?.selectedNodeId || 'node-root';

  // Theme palettes
  const THEME_PALETTES: Record<string, { bg: string; border: string; rootBg: string; nodeBg: string; text: string; roleText: string; line: string }> = {
    ocean: { bg: 'rgba(15, 23, 42, 0.94)', border: '#38bdf8', rootBg: 'rgba(2, 132, 199, 0.4)', nodeBg: 'rgba(30, 41, 59, 0.9)', text: '#f8fafc', roleText: '#38bdf8', line: '#38bdf8' },
    emerald: { bg: 'rgba(6, 78, 59, 0.94)', border: '#34d399', rootBg: 'rgba(5, 150, 105, 0.4)', nodeBg: 'rgba(6, 95, 70, 0.9)', text: '#ecfdf5', roleText: '#a7f3d0', line: '#34d399' },
    sunset: { bg: 'rgba(67, 20, 7, 0.94)', border: '#f97316', rootBg: 'rgba(234, 88, 12, 0.4)', nodeBg: 'rgba(124, 45, 18, 0.9)', text: '#fff7ed', roleText: '#fed7aa', line: '#f97316' },
    purple: { bg: 'rgba(59, 7, 100, 0.94)', border: '#c084fc', rootBg: 'rgba(147, 51, 234, 0.4)', nodeBg: 'rgba(88, 28, 135, 0.9)', text: '#faf5ff', roleText: '#e9d5ff', line: '#c084fc' },
    monochrome: { bg: 'rgba(24, 24, 27, 0.94)', border: '#a1a1aa', rootBg: 'rgba(63, 63, 70, 0.5)', nodeBg: 'rgba(39, 39, 42, 0.9)', text: '#ffffff', roleText: '#d4d4d8', line: '#a1a1aa' },
  };

  const pal = THEME_PALETTES[theme] || THEME_PALETTES.ocean;

  // Outer container
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * dpr);
  ctx.fillStyle = pal.bg;
  ctx.fill();
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = 1.8 * dpr;
  ctx.stroke();

  // Header Title
  ctx.font = `bold ${Math.max(12, Math.round(15 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = pal.border;
  ctx.textAlign = 'left';
  ctx.fillText('🏛️ Hierarchy Chart', x + 16 * dpr, y + 26 * dpr);

  ctx.font = `${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = pal.roleText;
  ctx.fillText(`Theme: ${theme.toUpperCase()} • Style: ${style.toUpperCase()}`, x + 16 * dpr, y + 42 * dpr);

  // Measure and layout tree recursively
  ctx.font = `bold ${Math.max(10, Math.round(fontSize))}px Inter, sans-serif`;

  function layoutTree(node: any): { box: HierarchyLayoutBox; totalWidth: number } {
    const labelW = ctx.measureText(node.label || 'Node').width;
    const boxW = Math.max(96 * dpr, labelW + 28 * dpr);
    const boxH = node.role ? 46 * dpr : 36 * dpr;

    if (!node.children || node.children.length === 0) {
      const box: HierarchyLayoutBox = {
        id: node.id,
        label: node.label,
        role: node.role,
        color: node.color,
        x: 0,
        y: 0,
        w: boxW,
        h: boxH,
        children: [],
      };
      return { box, totalWidth: boxW };
    }

    const childResults = node.children.map((c: any) => layoutTree(c));
    const gap = 16 * dpr;
    const childrenTotalW = childResults.reduce((acc: number, cur: any) => acc + cur.totalWidth, 0) + (childResults.length - 1) * gap;
    const totalW = Math.max(boxW, childrenTotalW);

    const box: HierarchyLayoutBox = {
      id: node.id,
      label: node.label,
      role: node.role,
      color: node.color,
      x: 0,
      y: 0,
      w: boxW,
      h: boxH,
      children: childResults.map((r: any) => r.box),
    };

    return { box, totalWidth: totalW };
  }

  const { box: rootLayout, totalWidth: treeTotalW } = layoutTree(tree);

  // Position nodes within available area
  const contentTop = y + 60 * dpr;
  const contentHeight = h - 75 * dpr;
  const levelHeight = Math.min(85 * dpr, contentHeight / 3.2);

  function assignPositions(node: HierarchyLayoutBox, left: number, width: number, level: number) {
    node.x = left + width / 2 - node.w / 2;
    node.y = contentTop + level * levelHeight;

    if (node.children.length > 0) {
      const gap = 14 * dpr;
      let curLeft = left;
      const childWidth = (width - (node.children.length - 1) * gap) / node.children.length;
      for (const child of node.children) {
        assignPositions(child, curLeft, childWidth, level + 1);
        curLeft += childWidth + gap;
      }
    }
  }

  const startLeft = x + Math.max(16 * dpr, (w - treeTotalW) / 2);
  const effectiveW = Math.min(w - 32 * dpr, Math.max(treeTotalW, w - 32 * dpr));
  assignPositions(rootLayout, startLeft, effectiveW, 0);

  // Draw connectors and nodes recursively
  function drawNodeAndConnectors(node: HierarchyLayoutBox, isRoot = false) {
    // Connectors to children
    if (node.children.length > 0) {
      const parentBottomY = node.y + node.h;
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      const midY = parentBottomY + (firstChild.y - parentBottomY) * 0.5;

      ctx.save();
      ctx.strokeStyle = pal.line;
      ctx.lineWidth = 1.8 * dpr;

      // Stem down from parent
      ctx.beginPath();
      ctx.moveTo(node.x + node.w / 2, parentBottomY);
      ctx.lineTo(node.x + node.w / 2, midY);
      ctx.stroke();

      // Horizontal bus bar
      const leftX = firstChild.x + firstChild.w / 2;
      const rightX = lastChild.x + lastChild.w / 2;
      ctx.beginPath();
      ctx.moveTo(leftX, midY);
      ctx.lineTo(rightX, midY);
      ctx.stroke();

      // Drops down to each child
      for (const child of node.children) {
        ctx.beginPath();
        ctx.moveTo(child.x + child.w / 2, midY);
        ctx.lineTo(child.x + child.w / 2, child.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw node box
    const isSelected = node.id === selectedNodeId;
    const nodeRadius = style === 'sharp' ? 2 * dpr : style === 'pill' ? 22 * dpr : 8 * dpr;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.w, node.h, nodeRadius);
    ctx.fillStyle = isRoot ? pal.rootBg : (node.color ? `${node.color}33` : pal.nodeBg);
    ctx.fill();

    ctx.strokeStyle = isSelected ? '#38bdf8' : (node.color || pal.border);
    ctx.lineWidth = isSelected ? 3 * dpr : (isRoot ? 2.2 * dpr : 1.5 * dpr);
    if (isSelected) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10 * dpr;
    }
    ctx.stroke();

    // Flat style bottom accent bar
    if (style === 'flat') {
      ctx.beginPath();
      ctx.roundRect(node.x, node.y + node.h - 3 * dpr, node.w, 3 * dpr, [0, 0, 4 * dpr, 4 * dpr]);
      ctx.fillStyle = node.color || pal.border;
      ctx.fill();
    }

    // Role text
    if (node.role) {
      ctx.font = `600 ${Math.max(9, Math.round(fontSize * 0.7))}px Inter, sans-serif`;
      ctx.fillStyle = pal.roleText;
      ctx.textAlign = 'center';
      ctx.fillText(node.role.toUpperCase(), node.x + node.w / 2, node.y + 14 * dpr);
    }

    // Label text
    ctx.font = `bold ${Math.max(10, Math.round(fontSize))}px Inter, sans-serif`;
    ctx.fillStyle = pal.text;
    ctx.textAlign = 'center';
    const textY = node.role ? node.y + 32 * dpr : node.y + node.h / 2 + fontSize * 0.35;
    ctx.fillText(node.label, node.x + node.w / 2, textY);

    ctx.restore();

    // Recurse children
    for (const child of node.children) {
      drawNodeAndConnectors(child, false);
    }
  }

  drawNodeAndConnectors(rootLayout, true);
}

// ─── Interactive Mindmap Renderer ───────────────────────────────────────────

function renderMindmap(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const root = shape.params?.root || {
    id: 'mm-root',
    text: 'Central Topic',
    color: '#6366f1',
    icon: '💡',
    children: [
      { id: 'b1', text: 'Subtopic 1', color: '#38bdf8' },
      { id: 'b2', text: 'Subtopic 2', color: '#10b981' },
      { id: 'b3', text: 'Subtopic 3', color: '#f59e0b' },
      { id: 'b4', text: 'Subtopic 4', color: '#ec4899' },
    ],
  };

  const selectedNodeId = shape.params?.selectedNodeId || 'mm-root';

  // Outer container
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * dpr);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fill();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.8 * dpr;
  ctx.stroke();

  // Header Title
  ctx.font = `bold ${Math.max(12, Math.round(15 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#818cf8';
  ctx.textAlign = 'left';
  ctx.fillText('🧠 Interactive Mindmap', x + 16 * dpr, y + 26 * dpr);
  ctx.font = `${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Click any node on board to expand, collapse, or highlight branch', x + 16 * dpr, y + 42 * dpr);

  const cx = x + w / 2;
  const cy = y + 50 * dpr + (h - 50 * dpr) / 2;

  // Central Root Node
  const rootText = `${root.icon ? root.icon + ' ' : ''}${root.text}`;
  ctx.font = `bold ${Math.max(12, Math.round(16 * dpr))}px Inter, sans-serif`;
  const rootTextW = ctx.measureText(rootText).width;
  const rootW = Math.max(130 * dpr, rootTextW + 36 * dpr);
  const rootH = 46 * dpr;
  const isRootSelected = selectedNodeId === root.id;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - rootW / 2, cy - rootH / 2, rootW, rootH, 24 * dpr);
  ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
  ctx.fill();
  ctx.strokeStyle = isRootSelected ? '#a5b4fc' : '#6366f1';
  ctx.lineWidth = isRootSelected ? 3 * dpr : 2.2 * dpr;
  if (isRootSelected) {
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 12 * dpr;
  }
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rootText, cx, cy);
  ctx.restore();

  // Distribute children between right and left sides
  const children = root.children || [];
  if (children.length === 0) return;

  const rightChildren = children.filter((_: any, i: number) => i % 2 === 0);
  const leftChildren = children.filter((_: any, i: number) => i % 2 === 1);

  function renderBranchSide(nodes: any[], isRight: boolean) {
    if (nodes.length === 0) return;
    const startX = isRight ? cx + rootW / 2 : cx - rootW / 2;
    const targetX = isRight ? cx + w * 0.28 : cx - w * 0.28;
    const totalSpanY = Math.min(h - 110 * dpr, nodes.length * 75 * dpr);
    const startY = cy - totalSpanY / 2;
    const stepY = nodes.length > 1 ? totalSpanY / (nodes.length - 1) : 0;

    nodes.forEach((node: any, idx: number) => {
      const nodeY = nodes.length === 1 ? cy : startY + idx * stepY;
      const branchColor = node.color || (isRight ? '#38bdf8' : '#10b981');
      const isSelected = selectedNodeId === node.id;

      // Smooth Organic Bezier Branch Curve
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, cy);
      const cpX = (startX + targetX) / 2;
      if (typeof ctx.bezierCurveTo === 'function') {
        ctx.bezierCurveTo(cpX, cy, cpX, nodeY, targetX, nodeY);
      } else {
        ctx.lineTo(targetX, nodeY);
      }
      ctx.strokeStyle = branchColor;
      ctx.lineWidth = isSelected ? 3 * dpr : 2.2 * dpr;
      ctx.stroke();
      ctx.restore();

      // Branch Node Card
      const text = `${node.icon ? node.icon + ' ' : ''}${node.text}`;
      ctx.font = `600 ${Math.max(11, Math.round(13 * dpr))}px Inter, sans-serif`;
      const textW = ctx.measureText(text).width;
      const cardW = Math.max(90 * dpr, textW + 26 * dpr);
      const cardH = 34 * dpr;
      const cardX = isRight ? targetX : targetX - cardW;
      const cardY = nodeY - cardH / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 17 * dpr);
      ctx.fillStyle = `${branchColor}2b`;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : branchColor;
      ctx.lineWidth = isSelected ? 2.5 * dpr : 1.6 * dpr;
      if (isSelected) {
        ctx.shadowColor = branchColor;
        ctx.shadowBlur = 10 * dpr;
      }
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cardX + cardW / 2, cardY + cardH / 2);

      // Collapsed indicator badge (+ N)
      if (node.children && node.children.length > 0) {
        if (node.collapsed) {
          const badgeX = isRight ? cardX + cardW + 10 * dpr : cardX - 10 * dpr;
          ctx.beginPath();
          ctx.arc(badgeX, nodeY, 8 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = branchColor;
          ctx.fill();
          ctx.font = `bold ${Math.max(8, Math.round(9 * dpr))}px Inter, sans-serif`;
          ctx.fillStyle = '#0f172a';
          ctx.fillText(`+${node.children.length}`, badgeX, nodeY + 1 * dpr);
        } else {
          // Render Level 2 sub-nodes
          const subNodes = node.children;
          const subStartX = isRight ? cardX + cardW : cardX;
          const subTargetX = isRight ? cardX + cardW + 80 * dpr : cardX - 80 * dpr;
          const subSpanY = Math.min(100 * dpr, subNodes.length * 36 * dpr);
          const subStartY = nodeY - subSpanY / 2;
          const subStepY = subNodes.length > 1 ? subSpanY / (subNodes.length - 1) : 0;

          subNodes.forEach((sub: any, subIdx: number) => {
            const subY = subNodes.length === 1 ? nodeY : subStartY + subIdx * subStepY;
            ctx.beginPath();
            ctx.moveTo(subStartX, nodeY);
            ctx.lineTo(subTargetX, subY);
            ctx.strokeStyle = `${branchColor}88`;
            ctx.lineWidth = 1.2 * dpr;
            ctx.stroke();

            ctx.font = `${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
            const subW = ctx.measureText(sub.text).width + 16 * dpr;
            const subCardX = isRight ? subTargetX : subTargetX - subW;
            ctx.beginPath();
            ctx.roundRect(subCardX, subY - 12 * dpr, subW, 24 * dpr, 12 * dpr);
            ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
            ctx.fill();
            ctx.strokeStyle = sub.id === selectedNodeId ? '#ffffff' : `${branchColor}aa`;
            ctx.lineWidth = 1 * dpr;
            ctx.stroke();

            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(sub.text, subCardX + subW / 2, subY + 1 * dpr);
          });
        }
      }

      ctx.restore();
    });
  }

  renderBranchSide(rightChildren, true);
  renderBranchSide(leftChildren, false);
}

// ─── Animated Timeline Renderer ─────────────────────────────────────────────

function renderTimeline(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const events: any[] = shape.params?.events || [
    { id: '1', dateOrEra: '1969', title: 'Moon Landing', description: 'Apollo 11 lands first humans on Moon.' },
    { id: '2', dateOrEra: '1977', title: 'Voyager Launch', description: 'Twin probes explore deep space.' },
    { id: '3', dateOrEra: '1990', title: 'Hubble Telescope', description: 'Space observatory deployed.' },
  ];

  const orientation = shape.params?.orientation || 'horizontal';
  const activeEventIndex = Math.min(events.length - 1, Math.max(0, shape.params?.activeEventIndex || 0));

  // Outer container
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * dpr);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.8 * dpr;
  ctx.stroke();

  // Header Title & Controls
  ctx.font = `bold ${Math.max(12, Math.round(15 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText('⏳ Interactive Timeline', x + 16 * dpr, y + 26 * dpr);

  ctx.font = `${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Event ${activeEventIndex + 1} of ${events.length} • Layout: ${orientation.toUpperCase()}`, x + 16 * dpr, y + 42 * dpr);

  // Horizontal Layout
  if (orientation === 'horizontal') {
    const axisY = y + h * 0.52;
    const startX = x + 36 * dpr;
    const endX = x + w - 36 * dpr;
    const stepX = events.length > 1 ? (endX - startX) / (events.length - 1) : 0;

    // Timeline Axis Line
    ctx.beginPath();
    ctx.moveTo(startX - 12 * dpr, axisY);
    ctx.lineTo(endX + 12 * dpr, axisY);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3 * dpr;
    ctx.stroke();

    events.forEach((evt: any, i: number) => {
      const evtX = events.length === 1 ? x + w / 2 : startX + i * stepX;
      const isActive = i === activeEventIndex;
      const isTop = i % 2 === 0;
      const evtColor = evt.color || (isActive ? '#38bdf8' : '#64748b');

      // Milestone circle on axis
      ctx.save();
      ctx.beginPath();
      ctx.arc(evtX, axisY, isActive ? 9 * dpr : 6 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#38bdf8' : '#0f172a';
      ctx.fill();
      ctx.strokeStyle = evtColor;
      ctx.lineWidth = isActive ? 3 * dpr : 2 * dpr;
      if (isActive) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10 * dpr;
      }
      ctx.stroke();
      ctx.restore();

      // Connector stem
      const stemH = 24 * dpr;
      const cardY = isTop ? axisY - stemH - 85 * dpr : axisY + stemH;
      ctx.beginPath();
      ctx.moveTo(evtX, isTop ? axisY - 8 * dpr : axisY + 8 * dpr);
      ctx.lineTo(evtX, isTop ? axisY - stemH : axisY + stemH);
      ctx.strokeStyle = evtColor;
      ctx.lineWidth = 1.6 * dpr;
      ctx.stroke();

      // Event Card
      const cardW = Math.min(180 * dpr, Math.max(120 * dpr, (w - 70 * dpr) / events.length));
      const cardH = 78 * dpr;
      const cardX = evtX - cardW / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 8 * dpr);
      ctx.fillStyle = isActive ? 'rgba(14, 165, 233, 0.22)' : 'rgba(30, 41, 59, 0.85)';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = isActive ? 2.4 * dpr : 1.2 * dpr;
      if (isActive) {
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 8 * dpr;
      }
      ctx.stroke();

      // Date badge
      ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = isActive ? '#38bdf8' : '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText(evt.dateOrEra, cardX + 8 * dpr, cardY + 16 * dpr);

      // Title
      ctx.font = `bold ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#f8fafc';
      const truncatedTitle = evt.title.length > 20 ? evt.title.slice(0, 19) + '…' : evt.title;
      ctx.fillText(truncatedTitle, cardX + 8 * dpr, cardY + 34 * dpr);

      // Description / Image
      if (evt.imageDataUrl) {
        const img = getCachedTimelineImage(evt.imageDataUrl);
        if (img) {
          ctx.drawImage(img, cardX + cardW - 38 * dpr, cardY + 8 * dpr, 30 * dpr, 30 * dpr);
        }
      }

      ctx.font = `${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      const truncatedDesc = (evt.description || '').length > 40 ? evt.description.slice(0, 38) + '…' : evt.description;
      ctx.fillText(truncatedDesc, cardX + 8 * dpr, cardY + 52 * dpr);

      ctx.restore();
    });
  }
  // Vertical Layout
  else {
    const spineX = x + w * 0.35;
    const startY = y + 70 * dpr;
    const endY = y + h - 30 * dpr;
    const stepY = events.length > 1 ? (endY - startY) / (events.length - 1) : 0;

    // Vertical spine
    ctx.beginPath();
    ctx.moveTo(spineX, startY - 10 * dpr);
    ctx.lineTo(spineX, endY + 10 * dpr);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3 * dpr;
    ctx.stroke();

    events.forEach((evt: any, i: number) => {
      const evtY = events.length === 1 ? y + h / 2 : startY + i * stepY;
      const isActive = i === activeEventIndex;
      const evtColor = evt.color || (isActive ? '#38bdf8' : '#64748b');

      // Milestone circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(spineX, evtY, isActive ? 9 * dpr : 6 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#38bdf8' : '#0f172a';
      ctx.fill();
      ctx.strokeStyle = evtColor;
      ctx.lineWidth = isActive ? 3 * dpr : 2 * dpr;
      ctx.stroke();
      ctx.restore();

      // Date marker on left
      ctx.font = `bold ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = isActive ? '#38bdf8' : '#94a3b8';
      ctx.textAlign = 'right';
      ctx.fillText(evt.dateOrEra, spineX - 16 * dpr, evtY + 4 * dpr);

      // Card on right
      const cardX = spineX + 20 * dpr;
      const cardW = w - (cardX - x) - 16 * dpr;
      const cardH = 50 * dpr;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, evtY - cardH / 2, cardW, cardH, 8 * dpr);
      ctx.fillStyle = isActive ? 'rgba(14, 165, 233, 0.22)' : 'rgba(30, 41, 59, 0.85)';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = isActive ? 2.4 * dpr : 1.2 * dpr;
      ctx.stroke();

      ctx.font = `bold ${Math.max(11, Math.round(12 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(evt.title, cardX + 10 * dpr, evtY - 6 * dpr);

      ctx.font = `${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(evt.description || '', cardX + 10 * dpr, evtY + 12 * dpr);

      if (evt.imageDataUrl) {
        const img = getCachedTimelineImage(evt.imageDataUrl);
        if (img) {
          ctx.drawImage(img, cardX + cardW - 42 * dpr, evtY - 18 * dpr, 36 * dpr, 36 * dpr);
        }
      }

      ctx.restore();
    });
  }
}

// ─── Process Flow Chart Renderer ────────────────────────────────────────────

function renderProcessChart(
  ctx: CanvasRenderingContext2D,
  shape: ShapeObject,
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number
) {
  const steps: any[] = shape.params?.steps || [
    { id: '1', stepNumber: 1, title: 'Step 1: Input', description: 'Initialize data' },
    { id: '2', stepNumber: 2, title: 'Step 2: Process', description: 'Compute results' },
    { id: '3', stepNumber: 3, title: 'Step 3: Output', description: 'Display values' },
  ];

  const style = shape.params?.style || 'chevron';
  const activeStepIndex = Math.min(steps.length - 1, Math.max(0, shape.params?.activeStepIndex || 0));

  // Outer container
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * dpr);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.8 * dpr;
  ctx.stroke();

  // Header Title
  ctx.font = `bold ${Math.max(12, Math.round(15 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText('🔄 Process Flow Chart', x + 16 * dpr, y + 26 * dpr);

  ctx.font = `${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Style: ${style.toUpperCase()} • Step ${activeStepIndex + 1} of ${steps.length}`, x + 16 * dpr, y + 42 * dpr);

  const contentY = y + 60 * dpr;
  const contentH = h - 75 * dpr;

  // 1. Chevron Flow Style
  if (style === 'chevron') {
    const gap = 6 * dpr;
    const arrowIndent = 16 * dpr;
    const stepW = (w - 32 * dpr - (steps.length - 1) * gap) / steps.length;
    const stepH = Math.min(120 * dpr, contentH);
    const startX = x + 16 * dpr;

    steps.forEach((step: any, i: number) => {
      const stepX = startX + i * (stepW + gap);
      const isActive = i === activeStepIndex;
      const stepColor = step.color || (isActive ? '#38bdf8' : '#0284c7');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stepX, contentY);
      ctx.lineTo(stepX + stepW - arrowIndent, contentY);
      ctx.lineTo(stepX + stepW, contentY + stepH / 2);
      ctx.lineTo(stepX + stepW - arrowIndent, contentY + stepH);
      ctx.lineTo(stepX, contentY + stepH);
      if (i > 0) {
        ctx.lineTo(stepX + arrowIndent, contentY + stepH / 2);
      }
      ctx.closePath();

      ctx.fillStyle = isActive ? 'rgba(14, 165, 233, 0.35)' : 'rgba(30, 41, 59, 0.9)';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = isActive ? 2.5 * dpr : 1.4 * dpr;
      if (isActive) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10 * dpr;
      }
      ctx.stroke();

      // Step Number circle
      const numX = stepX + (i > 0 ? arrowIndent + 16 * dpr : 18 * dpr);
      const numY = contentY + 24 * dpr;
      ctx.beginPath();
      ctx.arc(numX, numY, 11 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = stepColor;
      ctx.fill();
      ctx.font = `bold ${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(step.stepNumber || i + 1), numX, numY);

      // Title & Description
      ctx.font = `bold ${Math.max(10, Math.round(12 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(step.title, numX + 16 * dpr, numY);

      ctx.font = `${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(step.description || '', stepX + (i > 0 ? arrowIndent + 8 * dpr : 10 * dpr), contentY + 54 * dpr);

      ctx.restore();
    });
  }
  // 2. Numbered Cards Style
  else if (style === 'cards') {
    const gap = 14 * dpr;
    const cardW = (w - 32 * dpr - (steps.length - 1) * gap) / steps.length;
    const cardH = Math.min(130 * dpr, contentH);
    const startX = x + 16 * dpr;

    steps.forEach((step: any, i: number) => {
      const cardX = startX + i * (cardW + gap);
      const isActive = i === activeStepIndex;
      const stepColor = step.color || (isActive ? '#38bdf8' : '#10b981');

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, contentY, cardW, cardH, 10 * dpr);
      ctx.fillStyle = isActive ? 'rgba(14, 165, 233, 0.28)' : 'rgba(30, 41, 59, 0.9)';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = isActive ? 2.5 * dpr : 1.2 * dpr;
      if (isActive) {
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 8 * dpr;
      }
      ctx.stroke();

      // Large stylized number badge
      ctx.font = `900 ${Math.max(16, Math.round(20 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = stepColor;
      ctx.textAlign = 'left';
      ctx.fillText(`0${step.stepNumber || i + 1}`, cardX + 12 * dpr, contentY + 28 * dpr);

      // Title
      ctx.font = `bold ${Math.max(10, Math.round(12 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(step.title, cardX + 12 * dpr, contentY + 52 * dpr);

      // Description
      ctx.font = `${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(step.description || '', cardX + 12 * dpr, contentY + 74 * dpr);

      // Arrow link to next card
      if (i < steps.length - 1) {
        const arrowX = cardX + cardW + gap / 2;
        const arrowY = contentY + cardH / 2;
        ctx.font = `bold ${Math.max(12, Math.round(14 * dpr))}px Inter, sans-serif`;
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText('➔', arrowX, arrowY);
      }

      ctx.restore();
    });
  }
  // 3. Circular Cycle Style
  else if (style === 'cycle') {
    const cx = x + w / 2;
    const cy = contentY + contentH / 2;
    const radius = Math.min(w * 0.35, contentH * 0.42);

    // Central circular hub
    ctx.beginPath();
    ctx.arc(cx, cy, 32 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    ctx.font = `bold ${Math.max(10, Math.round(11 * dpr))}px Inter, sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CYCLE', cx, cy);

    steps.forEach((step: any, i: number) => {
      const angle = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
      const nx = cx + Math.cos(angle) * radius;
      const ny = cy + Math.sin(angle) * radius;
      const isActive = i === activeStepIndex;
      const stepColor = step.color || '#38bdf8';

      // Curved directional arrow arc
      const nextAngle = ((i + 0.7) / steps.length) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, angle + 0.25, nextAngle);
      ctx.strokeStyle = `${stepColor}88`;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Step node
      ctx.save();
      const nodeW = 100 * dpr;
      const nodeH = 40 * dpr;
      ctx.beginPath();
      ctx.roundRect(nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, 8 * dpr);
      ctx.fillStyle = isActive ? 'rgba(14, 165, 233, 0.4)' : 'rgba(30, 41, 59, 0.9)';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#38bdf8' : stepColor;
      ctx.lineWidth = isActive ? 2.5 * dpr : 1.4 * dpr;
      if (isActive) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8 * dpr;
      }
      ctx.stroke();

      ctx.font = `bold ${Math.max(9, Math.round(11 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${step.stepNumber || i + 1}. ${step.title}`, nx, ny);
      ctx.restore();
    });
  }
  // 4. Staged Pipeline / Funnel Style
  else {
    const stepW = (w - 32 * dpr) / steps.length;
    const startX = x + 16 * dpr;

    steps.forEach((step: any, i: number) => {
      const pipeX = startX + i * stepW;
      const isActive = i === activeStepIndex;
      const stepColor = step.color || (isActive ? '#38bdf8' : '#0ea5e9');

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(pipeX + 4 * dpr, contentY, stepW - 8 * dpr, contentH, 8 * dpr);
      ctx.fillStyle = isActive ? 'rgba(14, 165, 233, 0.3)' : 'rgba(30, 41, 59, 0.9)';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = isActive ? 2.5 * dpr : 1.2 * dpr;
      ctx.stroke();

      // Progress bar fill
      const progressH = ((i + 1) / steps.length) * (contentH - 40 * dpr);
      ctx.beginPath();
      ctx.roundRect(pipeX + 8 * dpr, contentY + contentH - progressH - 8 * dpr, stepW - 16 * dpr, progressH, 4 * dpr);
      ctx.fillStyle = `${stepColor}33`;
      ctx.fill();

      // Title & Step #
      ctx.font = `bold ${Math.max(10, Math.round(12 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = stepColor;
      ctx.textAlign = 'left';
      ctx.fillText(`Stage ${step.stepNumber || i + 1}`, pipeX + 12 * dpr, contentY + 24 * dpr);

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(step.title, pipeX + 12 * dpr, contentY + 44 * dpr);

      ctx.font = `${Math.max(9, Math.round(10 * dpr))}px Inter, sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(step.description || '', pipeX + 12 * dpr, contentY + 64 * dpr);

      ctx.restore();
    });
  }
}

