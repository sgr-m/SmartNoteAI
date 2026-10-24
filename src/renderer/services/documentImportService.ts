/**
 * Document Import Service — PDF, PowerPoint, Image, and Document Import Subsystem
 * Milestone 3, Section 11
 */

import { Page, PageBackground, ImageObject, CanvasObject } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export interface ImportedDocumentPage {
  pageNumber: number;
  thumbnailDataUrl: string;
  fullDataUrl: string;
  width: number;
  height: number;
}

export interface DocumentImportResult {
  fileName: string;
  fileType: 'pdf' | 'pptx' | 'image' | 'unknown';
  pageCount: number;
  pages: ImportedDocumentPage[];
  warnings?: string[];
}

/**
 * Basic SVG Sanitizer to treat SVG input as untrusted (Section 11.3)
 * Strips script tags, event handlers, and dangerous URL schemes.
 */
export function sanitizeSvg(svgContent: string): string {
  let clean = svgContent;
  // Remove <script>...</script>
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove onload, onclick, on* event handlers
  clean = clean.replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'href="#"');
  clean = clean.replace(/xlink:href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'xlink:href="#"');
  return clean;
}

/**
 * Creates an ImageObject from an imported image file or data URL
 */
export function createImageObject(
  dataUrl: string,
  fileName: string,
  targetX = 100,
  targetY = 100,
  maxWidth = 800,
  maxHeight = 600,
  naturalWidth = 800,
  naturalHeight = 600
): ImageObject {
  // Preserve aspect ratio within maxWidth and maxHeight
  const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
  const width = Math.round(naturalWidth * ratio);
  const height = Math.round(naturalHeight * ratio);

  return {
    id: uuidv4(),
    type: 'image',
    x: targetX,
    y: targetY,
    width,
    height,
    rotation: 0,
    filePath: fileName,
    dataUrl,
    opacity: 1,
    locked: false,
    layerId: 'imported-media',
  };
}

/**
 * Converts imported document pages into SmartBoard Studio Pages with annotation backgrounds
 */
export function convertDocumentPagesToSmartboardPages(
  importedPages: ImportedDocumentPage[],
  options: {
    asBackground: boolean;
    titlePrefix?: string;
  }
): Page[] {
  return importedPages.map((ip) => {
    const pageId = uuidv4();
    const title = `${options.titlePrefix || 'Imported'} (Page ${ip.pageNumber})`;

    // SmartBoard standard presentation canvas is 1920 x 1080
    const canvasW = 1920;
    const canvasH = 1080;

    if (options.asBackground) {
      const background: PageBackground = {
        type: 'image',
        color: '#ffffff',
        imageUrl: ip.fullDataUrl,
      };
      return {
        id: pageId,
        title,
        width: canvasW,
        height: canvasH,
        background,
        layers: [
          { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
          { id: 'imported-media', name: 'Imported Media', visible: true, locked: false, opacity: 1, order: 1 },
          { id: 'drawing', name: 'Drawings & Ink', visible: true, locked: false, opacity: 1, order: 2 },
          { id: 'objects', name: 'Shapes & Text', visible: true, locked: false, opacity: 1, order: 3 },
          { id: 'interaction', name: 'Interaction Tools', visible: true, locked: false, opacity: 1, order: 4 },
        ],
        objects: [],
      };
    } else {
      // Import as canvas ImageObject on imported-media layer, fitted and centered inside 1920x1080
      const ipW = ip.width || canvasW;
      const ipH = ip.height || canvasH;
      const fitScale = Math.min(canvasW / ipW, canvasH / ipH, 1);
      const fitW = Math.round(ipW * fitScale);
      const fitH = Math.round(ipH * fitScale);
      const posX = Math.round((canvasW - fitW) / 2);
      const posY = Math.round((canvasH - fitH) / 2);

      const imgObj = createImageObject(
        ip.fullDataUrl,
        title,
        posX,
        posY,
        fitW,
        fitH,
        ipW,
        ipH
      );
      return {
        id: pageId,
        title,
        width: canvasW,
        height: canvasH,
        background: { type: 'blank', color: '#1a1a2e' },
        layers: [
          { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
          { id: 'imported-media', name: 'Imported Media', visible: true, locked: false, opacity: 1, order: 1 },
          { id: 'drawing', name: 'Drawings & Ink', visible: true, locked: false, opacity: 1, order: 2 },
          { id: 'objects', name: 'Shapes & Text', visible: true, locked: false, opacity: 1, order: 3 },
          { id: 'interaction', name: 'Interaction Tools', visible: true, locked: false, opacity: 1, order: 4 },
        ],
        objects: [imgObj],
      };
    }
  });
}
