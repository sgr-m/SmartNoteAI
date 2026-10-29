/**
 * Document Export Service — PDF, Image (PNG/JPEG), CSV, and Native Lesson Export
 * Milestone 3, Section 12
 */

import { jsPDF } from 'jspdf';
import { LessonDocument, Page, CanvasObject, StrokeObject, ShapeObject, TextObject, ImageObject } from '../../shared/types';
import { isLatexSyntax, latexToSvgDataUrl } from './latexService';

export interface ExportRenderOptions {
  scale?: number; // 1 for normal, 2 for 300 DPI high-res
  includeBackground?: boolean;
  backgroundColor?: string;
  selectedLayerIds?: string[];
  targetAspectRatio?: number; // e.g. 16/9, 4/3, etc.
  targetWidth?: number;       // base width before scale (e.g. 1920)
  targetHeight?: number;      // base height before scale (e.g. 1080)
}

export interface ImageExportOptions extends ExportRenderOptions {
  aspectRatio?: '16:9' | '4:3' | 'a4' | 'original' | 'auto';
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

export interface PageBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function getRotatedBounds(x: number, y: number, w: number, h: number, rotationDeg?: number) {
  if (!rotationDeg) {
    return { minX: x, minY: y, maxX: x + w, maxY: y + h };
  }
  const rad = (rotationDeg * Math.PI) / 180;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    const rx = cx + (c.x - cx) * cos - (c.y - cy) * sin;
    const ry = cy + (c.x - cx) * sin + (c.y - cy) * cos;
    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Calculates the bounding box that encompasses all content on a slide,
 * including objects written at the utmost left, right, top, or bottom.
 */
export function getPageContentBounds(page: Page, safetyMargin = 32): PageBounds {
  const defaultW = page.width || 1920;
  const defaultH = page.height || 1080;

  if (!page.objects || page.objects.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: defaultW,
      maxY: defaultH,
      width: defaultW,
      height: defaultH,
    };
  }

  let objMinX = Infinity;
  let objMinY = Infinity;
  let objMaxX = -Infinity;
  let objMaxY = -Infinity;
  let foundAny = false;

  const inspectObject = (obj: CanvasObject) => {
    if (obj.type === 'stroke') {
      const stroke = obj as StrokeObject;
      const strokeWidth = stroke.style?.width || 3;
      const halfW = Math.max(1, strokeWidth / 2);
      if (stroke.points && stroke.points.length > 0) {
        for (const pt of stroke.points) {
          objMinX = Math.min(objMinX, pt.x - halfW);
          objMinY = Math.min(objMinY, pt.y - halfW);
          objMaxX = Math.max(objMaxX, pt.x + halfW);
          objMaxY = Math.max(objMaxY, pt.y + halfW);
          foundAny = true;
        }
      } else if (stroke.bbox) {
        objMinX = Math.min(objMinX, stroke.bbox.x);
        objMinY = Math.min(objMinY, stroke.bbox.y);
        objMaxX = Math.max(objMaxX, stroke.bbox.x + stroke.bbox.width);
        objMaxY = Math.max(objMaxY, stroke.bbox.y + stroke.bbox.height);
        foundAny = true;
      }
    } else if (obj.type === 'shape') {
      const shape = obj as ShapeObject;
      const sw = (shape.strokeWidth || 3) / 2;
      const b = getRotatedBounds(
        shape.x - sw,
        shape.y - sw,
        shape.width + sw * 2,
        shape.height + sw * 2,
        shape.rotation
      );
      objMinX = Math.min(objMinX, b.minX);
      objMinY = Math.min(objMinY, b.minY);
      objMaxX = Math.max(objMaxX, b.maxX);
      objMaxY = Math.max(objMaxY, b.maxY);
      foundAny = true;
    } else if (obj.type === 'text') {
      const text = obj as TextObject;
      let w = text.width;
      let h = text.height;
      if (!w || !h || w <= 0 || h <= 0) {
        const lines = (text.content || '').split('\n');
        const maxLen = Math.max(1, ...lines.map((l) => l.length));
        const fs = text.fontSize || 24;
        w = w || maxLen * fs * 0.65;
        h = h || lines.length * fs * 1.3;
      }
      const b = getRotatedBounds(text.x, text.y, w, h, text.rotation);
      objMinX = Math.min(objMinX, b.minX);
      objMinY = Math.min(objMinY, b.minY);
      objMaxX = Math.max(objMaxX, b.maxX);
      objMaxY = Math.max(objMaxY, b.maxY);
      foundAny = true;
    } else if (obj.type === 'image') {
      const img = obj as ImageObject;
      const b = getRotatedBounds(img.x, img.y, img.width || 100, img.height || 100, img.rotation);
      objMinX = Math.min(objMinX, b.minX);
      objMinY = Math.min(objMinY, b.minY);
      objMaxX = Math.max(objMaxX, b.maxX);
      objMaxY = Math.max(objMaxY, b.maxY);
      foundAny = true;
    } else if (obj.type === 'group') {
      const group = obj as any;
      const children = group.objects || group.children || [];
      if (children.length > 0) {
        for (const child of children) inspectObject(child);
      } else if (group.bbox) {
        objMinX = Math.min(objMinX, group.bbox.x);
        objMinY = Math.min(objMinY, group.bbox.y);
        objMaxX = Math.max(objMaxX, group.bbox.x + group.bbox.width);
        objMaxY = Math.max(objMaxY, group.bbox.y + group.bbox.height);
        foundAny = true;
      }
    }
  };

  for (const obj of page.objects) {
    inspectObject(obj);
  }

  if (!foundAny) {
    return {
      minX: 0,
      minY: 0,
      maxX: defaultW,
      maxY: defaultH,
      width: defaultW,
      height: defaultH,
    };
  }

  // Include safety margin so content at the utmost edge never gets clipped
  let minX = objMinX - safetyMargin;
  let minY = objMinY - safetyMargin;
  let maxX = objMaxX + safetyMargin;
  let maxY = objMaxY + safetyMargin;

  // If content is located near or within the main slide canvas, union with [0, 0, defaultW, defaultH]
  const isNearMainSlide = !(
    maxX < -500 ||
    minX > defaultW + 500 ||
    maxY < -500 ||
    minY > defaultH + 500
  );

  if (isNearMainSlide) {
    minX = Math.min(0, minX);
    minY = Math.min(0, minY);
    maxX = Math.max(defaultW, maxX);
    maxY = Math.max(defaultH, maxY);
  }

  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);

  return { minX, minY, maxX, maxY, width, height };
}

/**
 * Renders a single page onto an off-screen HTML5 Canvas with full fidelity,
 * compressing all slide content into the target screen ratio so nothing is cropped.
 */
export async function renderPageToCanvas(
  page: Page,
  options: ExportRenderOptions = {}
): Promise<HTMLCanvasElement> {
  const scale = options.scale || 2; // Default to 2x for sharp print/export quality
  const includeBg = options.includeBackground !== false;

  // 1. Calculate uncropped content bounds
  const bounds = getPageContentBounds(page, 32);

  // 2. Determine target aspect ratio and base canvas dimensions
  let targetAspect = options.targetAspectRatio;
  if (!targetAspect || targetAspect <= 0) {
    if (options.targetWidth && options.targetHeight) {
      targetAspect = options.targetWidth / options.targetHeight;
    } else {
      targetAspect = (page.width || 1920) / (page.height || 1080);
    }
  }

  let baseW = options.targetWidth || 1920;
  let baseH = options.targetHeight || Math.round(baseW / targetAspect);

  if (targetAspect >= 1) {
    baseW = options.targetWidth || 1920;
    baseH = Math.round(baseW / targetAspect);
  } else {
    baseH = options.targetHeight || 1920;
    baseW = Math.round(baseH * targetAspect);
  }

  // 3. Compress all content to fit strictly within target dimensions (preserving aspect ratio)
  const scaleX = baseW / bounds.width;
  const scaleY = baseH / bounds.height;
  const fitScale = Math.min(scaleX, scaleY);

  const renderedContentW = bounds.width * fitScale;
  const renderedContentH = bounds.height * fitScale;
  const offsetX = (baseW - renderedContentW) / 2;
  const offsetY = (baseH - renderedContentH) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(baseW * scale);
  canvas.height = Math.round(baseH * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);

  // 4. Draw Page Background across baseW x baseH
  if (includeBg && page.background) {
    const bg = page.background;
    ctx.fillStyle = bg.color || '#1a1a2e';
    ctx.fillRect(0, 0, baseW, baseH);

    if (bg.type === 'ruled') {
      const spacing = bg.gridSize || 36;
      ctx.strokeStyle = bg.lineColor || 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = spacing; y < baseH; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(baseW, y);
      }
      ctx.stroke();

      // Red vertical margin line
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 0);
      ctx.lineTo(120, baseH);
      ctx.stroke();
    } else if (bg.type === 'grid') {
      const size = bg.gridSize || 40;
      ctx.strokeStyle = bg.lineColor || 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= baseW; x += size) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, baseH);
      }
      for (let y = 0; y <= baseH; y += size) {
        ctx.moveTo(0, y);
        ctx.lineTo(baseW, y);
      }
      ctx.stroke();
    } else if (bg.type === 'dotted') {
      const spacing = bg.gridSize || 32;
      ctx.fillStyle = bg.lineColor || 'rgba(255, 255, 255, 0.25)';
      for (let x = spacing; x < baseW; x += spacing) {
        for (let y = spacing; y < baseH; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (bg.imageUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, baseW, baseH);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = bg.imageUrl!;
        if (typeof (img as any).onload === 'function' && !(img as any).complete) {
          setTimeout(() => {
            try { (img as any).onload?.(); } catch {}
            resolve();
          }, 0);
        }
      });
    }
  } else {
    // Plain neutral white background for print if background is excluded
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, baseW, baseH);
  }

  // 5. Render Layer-Sorted Objects compressed to screen ratio
  const layers = page.layers && page.layers.length > 0
    ? [...page.layers].sort((a, b) => a.order - b.order)
    : [{ id: 'default', name: 'Default', visible: true, locked: false, opacity: 1, order: 0 }];

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(fitScale, fitScale);
  ctx.translate(-bounds.minX, -bounds.minY);

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
        await renderText(ctx, obj as TextObject);
      } else if (obj.type === 'image') {
        await renderImage(ctx, obj as ImageObject);
      } else if (obj.type === 'group') {
        const group = obj as any;
        const children = group.objects || group.children || [];
        for (const child of children) {
          if (child.type === 'stroke') renderStroke(ctx, child);
          else if (child.type === 'shape') renderShape(ctx, child);
          else if (child.type === 'text') await renderText(ctx, child);
          else if (child.type === 'image') await renderImage(ctx, child);
        }
      }
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();

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

async function renderText(ctx: CanvasRenderingContext2D, textObj: TextObject) {
  ctx.save();
  const centerX = textObj.x + textObj.width / 2;
  const centerY = textObj.y + textObj.height / 2;

  if (textObj.rotation) {
    ctx.translate(centerX, centerY);
    ctx.rotate((textObj.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  const isLatex = textObj.isLatex || isLatexSyntax(textObj.content);
  if (isLatex) {
    try {
      const fontSize = textObj.fontSize || 32;
      const w = textObj.width || 200;
      const h = textObj.height || 50;
      const dataUrl = latexToSvgDataUrl(
        textObj.content,
        textObj.color || '#ffffff',
        fontSize,
        w,
        h
      );
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, textObj.x, textObj.y, w, h);
          resolve();
        };
        img.onerror = () => {
          ctx.font = `${fontSize}px KaTeX_Main, 'Cambria Math', serif`;
          ctx.fillStyle = textObj.color || '#ffffff';
          ctx.fillText(textObj.content, textObj.x, textObj.y);
          resolve();
        };
        img.src = dataUrl;
        if (typeof (img as any).onload === 'function' && !(img as any).complete) {
          setTimeout(() => {
            try { (img as any).onload?.(); } catch {}
            resolve();
          }, 0);
        }
      });
      ctx.restore();
      return;
    } catch {
      // fallback to regular text
    }
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
  const dataUrl = imgObj.dataUrl || imgObj.filePath;
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
    if (typeof (img as any).onload === 'function' && !(img as any).complete) {
      setTimeout(() => {
        try { (img as any).onload?.(); } catch {}
        resolve();
      }, 0);
    }
  });
}

/**
 * Export single page as a PNG or JPEG data URL compressed to screen ratio
 */
export async function exportPageAsImage(
  page: Page,
  format: 'png' | 'jpeg' = 'png',
  options: ImageExportOptions = {}
): Promise<string> {
  let targetAspectRatio = options.targetAspectRatio;
  if (!targetAspectRatio) {
    if (options.aspectRatio === '16:9') targetAspectRatio = 16 / 9;
    else if (options.aspectRatio === '4:3') targetAspectRatio = 4 / 3;
    else if (options.aspectRatio === 'a4') targetAspectRatio = 297 / 210;
    else targetAspectRatio = (page.width || 1920) / (page.height || 1080);
  }

  const canvas = await renderPageToCanvas(page, {
    ...options,
    targetAspectRatio,
  });

  return format === 'png'
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Export selected objects cropped as an image
 */
export async function exportSelectedObjectsAsImage(
  objects: CanvasObject[],
  scale = 2
): Promise<string | null> {
  if (objects.length === 0) return null;

  const virtualPage: Page = {
    id: 'export-selection',
    title: 'Selection',
    width: 1920,
    height: 1080,
    background: { type: 'blank', color: 'transparent' },
    layers: [],
    objects,
  };

  const bounds = getPageContentBounds(virtualPage, 16);
  const targetAspect = bounds.width / bounds.height;

  const canvas = await renderPageToCanvas(virtualPage, {
    scale,
    includeBackground: false,
    targetAspectRatio: targetAspect,
    targetWidth: bounds.width,
    targetHeight: bounds.height,
  });

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
    const targetAspect = renderWidthMm / renderHeightMm;
    const canvas = await renderPageToCanvas(page, {
      scale,
      includeBackground: options.includeBackground !== false,
      targetAspectRatio: targetAspect,
      targetWidth: 1920,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    pdf.addImage(imgData, 'JPEG', margins, margins, renderWidthMm, renderHeightMm, undefined, 'FAST');

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
