/**
 * Document Export Service — PDF, Image (PNG/JPEG), CSV, and Native Lesson Export
 * Milestone 3, Section 12
 */

import { jsPDF } from 'jspdf';
import { LessonDocument, Page, CanvasObject, StrokeObject, ShapeObject, TextObject, ImageObject } from '../../shared/types';

export interface ExportRenderOptions {
  scale?: number; // 1 for normal, 2 for 300 DPI high-res
  includeBackground?: boolean;
  backgroundColor?: string;
  selectedLayerIds?: string[];
}

export interface PdfExportOptions {
  pages: 'current' | 'all' | 'custom';
  pageIndices?: number[];
  paperSize: '16:9' | '4:3' | 'a4' | 'letter' | 'custom';
  customDimensions?: { widthMm: number; heightMm: number };
  orientation: 'landscape' | 'portrait';
  marginsMm?: number;
  includeBackground?: boolean;
  highResolution?: boolean;
  addPagination?: boolean;
}

/**
 * Renders a single page onto an off-screen HTML5 Canvas with full fidelity.
 */
export async function renderPageToCanvas(
  page: Page,
  options: ExportRenderOptions = {}
): Promise<HTMLCanvasElement> {
  const scale = options.scale || 2; // Default to 2x for sharp print/export quality
  const includeBg = options.includeBackground !== false;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(page.width * scale);
  canvas.height = Math.round(page.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // 1. Draw Page Background
  if (includeBg && page.background) {
    const bg = page.background;
    ctx.fillStyle = bg.color || '#1a1a2e';
    ctx.fillRect(0, 0, page.width, page.height);

    if (bg.type === 'ruled') {
      const spacing = bg.gridSize || 36;
      ctx.strokeStyle = bg.lineColor || 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = spacing; y < page.height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(page.width, y);
      }
      ctx.stroke();

      // Red vertical margin line
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 0);
      ctx.lineTo(120, page.height);
      ctx.stroke();
    } else if (bg.type === 'grid') {
      const size = bg.gridSize || 40;
      ctx.strokeStyle = bg.lineColor || 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= page.width; x += size) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, page.height);
      }
      for (let y = 0; y <= page.height; y += size) {
        ctx.moveTo(0, y);
        ctx.lineTo(page.width, y);
      }
      ctx.stroke();
    } else if (bg.type === 'dotted') {
      const spacing = bg.gridSize || 32;
      ctx.fillStyle = bg.lineColor || 'rgba(255, 255, 255, 0.25)';
      for (let x = spacing; x < page.width; x += spacing) {
        for (let y = spacing; y < page.height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (bg.imageUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, page.width, page.height);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = bg.imageUrl!;
      });
    }
  } else {
    // Plain neutral white background for print if background is excluded
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, page.width, page.height);
  }

  // 2. Render Layer-Sorted Objects
  const layers = page.layers && page.layers.length > 0
    ? [...page.layers].sort((a, b) => a.order - b.order)
    : [{ id: 'default', name: 'Default', visible: true, locked: false, opacity: 1, order: 0 }];

  for (const layer of layers) {
    if (!layer.visible) continue;
    if (options.selectedLayerIds && !options.selectedLayerIds.includes(layer.id)) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

    const layerObjects = page.objects.filter((obj) => (obj.layerId || 'objects') === layer.id || layers.length === 1);

    for (const obj of layerObjects) {
      ctx.save();
      const objOpacity = (obj as any).opacity ?? (obj as any).style?.opacity;
      if (objOpacity !== undefined) ctx.globalAlpha *= objOpacity;

      if (obj.type === 'stroke') {
        renderStroke(ctx, obj as StrokeObject);
      } else if (obj.type === 'shape') {
        renderShape(ctx, obj as ShapeObject);
      } else if (obj.type === 'text') {
        renderText(ctx, obj as TextObject);
      } else if (obj.type === 'image') {
        await renderImage(ctx, obj as ImageObject);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  return canvas;
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: StrokeObject) {
  if (!stroke.points || stroke.points.length === 0) return;

  const color = stroke.style?.color || '#ffffff';
  const width = stroke.style?.width || 4;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.points.length === 1) {
    const pt = stroke.points[0];
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    const prev = stroke.points[i - 1];
    const curr = stroke.points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
  ctx.stroke();
}

function renderShape(ctx: CanvasRenderingContext2D, shape: ShapeObject) {
  ctx.save();
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  if (shape.rotation) {
    ctx.translate(centerX, centerY);
    ctx.rotate((shape.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  ctx.strokeStyle = shape.strokeColor || '#ffffff';
  ctx.lineWidth = shape.strokeWidth || 3;
  ctx.fillStyle = shape.fillColor || 'transparent';

  const x = shape.x;
  const y = shape.y;
  const w = shape.width;
  const h = shape.height;

  ctx.beginPath();
  switch (shape.shapeType) {
    case 'rect':
    case 'roundedRect':
      ctx.rect(x, y, w, h);
      break;
    case 'circle':
    case 'ellipse':
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
      break;
    case 'triangle':
    case 'rightTriangle':
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      break;
    case 'arrow': {
      const headLength = Math.min(w, h) * 0.35;
      ctx.moveTo(x, y + h * 0.35);
      ctx.lineTo(x + w - headLength, y + h * 0.35);
      ctx.lineTo(x + w - headLength, y);
      ctx.lineTo(x + w, y + h * 0.5);
      ctx.lineTo(x + w - headLength, y + h);
      ctx.lineTo(x + w - headLength, y + h * 0.65);
      ctx.lineTo(x, y + h * 0.65);
      ctx.closePath();
      break;
    }
    case 'cartesianAxes':
      ctx.rect(x, y, w, h);
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + h / 2);
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w / 2, y + h);
      break;
    default:
      ctx.rect(x, y, w, h);
      break;
  }

  if (shape.fillColor && shape.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

function renderText(ctx: CanvasRenderingContext2D, textObj: TextObject) {
  ctx.save();
  const centerX = textObj.x + textObj.width / 2;
  const centerY = textObj.y + textObj.height / 2;

  if (textObj.rotation) {
    ctx.translate(centerX, centerY);
    ctx.rotate((textObj.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  ctx.font = `${textObj.fontSize || 24}px ${textObj.fontFamily || 'Inter, sans-serif'}`;
  ctx.fillStyle = textObj.color || '#ffffff';
  ctx.textBaseline = 'top';

  const lines: string[] = (textObj.content || '').split('\n');
  const lineHeight = (textObj.fontSize || 24) * 1.3;
  lines.forEach((line: string, index: number) => {
    ctx.fillText(line, textObj.x, textObj.y + index * lineHeight);
  });
  ctx.restore();
}

async function renderImage(ctx: CanvasRenderingContext2D, imgObj: ImageObject) {
  const dataUrl = imgObj.dataUrl;
  if (!dataUrl) return;

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      const centerX = imgObj.x + imgObj.width / 2;
      const centerY = imgObj.y + imgObj.height / 2;

      if (imgObj.rotation) {
        ctx.translate(centerX, centerY);
        ctx.rotate((imgObj.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      ctx.drawImage(img, imgObj.x, imgObj.y, imgObj.width, imgObj.height);
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });
}

/**
 * Export single page as a PNG or JPEG data URL
 */
export async function exportPageAsImage(
  page: Page,
  format: 'png' | 'jpeg' = 'png',
  options: ExportRenderOptions = {}
): Promise<string> {
  const canvas = await renderPageToCanvas(page, options);
  return format === 'png'
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Export selected objects cropped as an image
 */
export async function exportSelectedObjectsAsImage(
  objects: CanvasObject[],
  scale = 2
): Promise<string | null> {
  if (objects.length === 0) return null;

  // Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach((obj) => {
    if (obj.type === 'stroke') {
      const stroke = obj as StrokeObject;
      stroke.points?.forEach((pt) => {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      });
    } else {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    }
  });

  const padding = 20;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 0 || height <= 0) return null;

  const virtualPage: Page = {
    id: 'export-selection',
    title: 'Selection',
    width,
    height,
    background: { type: 'blank', color: '#1a1a2e' },
    layers: [],
    objects: objects.map((obj) => {
      if (obj.type === 'stroke') {
        const stroke = obj as StrokeObject;
        return {
          ...stroke,
          points: stroke.points.map((p) => ({ ...p, x: p.x - minX, y: p.y - minY })),
        };
      }
      return {
        ...obj,
        x: obj.x - minX,
        y: obj.y - minY,
      };
    }),
  };

  const canvas = await renderPageToCanvas(virtualPage, { scale, includeBackground: false });
  return canvas.toDataURL('image/png');
}

/**
 * Export lesson to multi-page printable high-resolution PDF
 */
export async function exportLessonToPdf(
  lesson: LessonDocument,
  options: PdfExportOptions,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const isLandscape = options.orientation !== 'portrait';

  // Paper dimensions in mm
  let pageWidthMm = 297;
  let pageHeightMm = 167.06; // 16:9 widescreen default

  if (options.paperSize === 'a4') {
    pageWidthMm = isLandscape ? 297 : 210;
    pageHeightMm = isLandscape ? 210 : 297;
  } else if (options.paperSize === 'letter') {
    pageWidthMm = isLandscape ? 279.4 : 215.9;
    pageHeightMm = isLandscape ? 215.9 : 279.4;
  } else if (options.paperSize === '4:3') {
    pageWidthMm = isLandscape ? 297 : 222.75;
    pageHeightMm = isLandscape ? 222.75 : 297;
  } else if (options.paperSize === 'custom' && options.customDimensions) {
    pageWidthMm = options.customDimensions.widthMm;
    pageHeightMm = options.customDimensions.heightMm;
  }

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidthMm, pageHeightMm],
  });

  // Determine pages to include
  let pagesToExport: { page: Page; pageIndex: number }[] = [];
  if (options.pages === 'current' && options.pageIndices?.[0] !== undefined) {
    const idx = options.pageIndices[0];
    if (lesson.pages[idx]) pagesToExport.push({ page: lesson.pages[idx], pageIndex: idx });
  } else if (options.pages === 'custom' && options.pageIndices) {
    pagesToExport = options.pageIndices
      .filter((i) => i >= 0 && i < lesson.pages.length)
      .map((i) => ({ page: lesson.pages[i], pageIndex: i }));
  } else {
    // All pages
    pagesToExport = lesson.pages.map((p, i) => ({ page: p, pageIndex: i }));
  }

  if (pagesToExport.length === 0 && lesson.pages.length > 0) {
    pagesToExport = [{ page: lesson.pages[0], pageIndex: 0 }];
  }

  const total = pagesToExport.length;
  const margins = options.marginsMm || 0;
  const renderWidthMm = pageWidthMm - margins * 2;
  const renderHeightMm = pageHeightMm - margins * 2;
  const scale = options.highResolution ? 2 : 1.5;

  for (let i = 0; i < total; i++) {
    onProgress?.(Math.round(((i + 1) / total) * 90));

    if (i > 0) {
      pdf.addPage([pageWidthMm, pageHeightMm], isLandscape ? 'landscape' : 'portrait');
    }

    const { page, pageIndex } = pagesToExport[i];
    const canvas = await renderPageToCanvas(page, {
      scale,
      includeBackground: options.includeBackground !== false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Calculate scale-to-fit maintaining aspect ratio
    const pageAspect = page.width / page.height;
    const targetAspect = renderWidthMm / renderHeightMm;

    let destWidth = renderWidthMm;
    let destHeight = renderHeightMm;
    let destX = margins;
    let destY = margins;

    if (pageAspect > targetAspect) {
      destHeight = renderWidthMm / pageAspect;
      destY = margins + (renderHeightMm - destHeight) / 2;
    } else {
      destWidth = renderHeightMm * pageAspect;
      destX = margins + (renderWidthMm - destWidth) / 2;
    }

    pdf.addImage(imgData, 'JPEG', destX, destY, destWidth, destHeight, undefined, 'FAST');

    // Add pagination footer if enabled
    if (options.addPagination) {
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `${lesson.meta?.title || 'Lesson'} — Slide ${pageIndex + 1} of ${lesson.pages.length}`,
        pageWidthMm / 2,
        pageHeightMm - 5,
        { align: 'center' }
      );
    }
  }

  onProgress?.(100);
  return pdf.output('blob');
}

/**
 * Export Native Lesson Format (.sbl)
 */
export function exportNativeLesson(lesson: LessonDocument): string {
  const versionedDocument = {
    ...lesson,
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    generator: 'SmartNoteAI v0.1.0',
  };
  return JSON.stringify(versionedDocument, null, 2);
}

/**
 * Export structured lesson data to CSV (Section 12 Other export formats)
 */
export function exportLessonToCsv(lesson: LessonDocument): string {
  const rows = [
    ['Slide Index', 'Slide Title', 'Width', 'Height', 'Background Type', 'Object Count', 'Text Elements Summary'],
  ];

  lesson.pages.forEach((page, idx) => {
    const textObjects = page.objects
      .filter((obj) => obj.type === 'text')
      .map((t) => ((t as TextObject).content || '').replace(/"/g, '""'))
      .join(' | ');

    rows.push([
      (idx + 1).toString(),
      `"${(page.title || '').replace(/"/g, '""')}"`,
      page.width.toString(),
      page.height.toString(),
      page.background?.type || 'blank',
      page.objects.length.toString(),
      `"${textObjects}"`,
    ]);
  });

  return rows.map((r) => r.join(',')).join('\n');
}
