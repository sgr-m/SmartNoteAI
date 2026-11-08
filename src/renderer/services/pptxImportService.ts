/**
 * PPTX Import Service — Parses PowerPoint (.pptx) presentations
 * Extracts slides, shapes, text boxes, tables, and embedded media into native SmartBoard CanvasObjects.
 * Generates both editable SmartBoard objects and high-resolution raster images for teaching mode.
 */

import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { CanvasObject, TextObject, ShapeObject, ImageObject } from '../../shared/types';
import { ImportedDocumentPage } from './documentImportService';

export interface ParsedPptxSlide {
  slideNumber: number;
  title: string;
  backgroundColor: string;
  objects: CanvasObject[];
  fullDataUrl: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
}

// Standard 16:9 PowerPoint slide dimensions in EMUs (1 inch = 914,400 EMUs)
const DEFAULT_SLIDE_WIDTH_EMU = 12192000;  // 13.33 inches
const DEFAULT_SLIDE_HEIGHT_EMU = 6858000;  // 7.5 inches

// Target SmartBoard presentation canvas size
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Standard Office theme color palette mapping
const DEFAULT_THEME_COLORS: Record<string, string> = {
  accent1: '#4472c4',
  accent2: '#ed7d31',
  accent3: '#a5a5a5',
  accent4: '#ffc000',
  accent5: '#5b9bd5',
  accent6: '#70ad47',
  tx1: '#1e293b',
  dk1: '#1e293b',
  tx2: '#475569',
  dk2: '#334155',
  bg1: '#ffffff',
  lt1: '#ffffff',
  bg2: '#f8fafc',
  lt2: '#f1f5f9',
  hlink: '#2563eb',
  folHlink: '#7c3aed',
};

/**
 * Safely parse XML string into a DOM Document (cross-environment: browser or Node)
 */
function parseXmlDocument(xmlText: string): Document {
  if (typeof window !== 'undefined' && window.DOMParser) {
    return new window.DOMParser().parseFromString(xmlText, 'application/xml');
  }
  // Fallback for Node test environments if DOMParser is not available
  try {
    const { DOMParser } = require('@xmldom/xmldom');
    return new DOMParser().parseFromString(xmlText, 'application/xml');
  } catch {
    throw new Error('No DOMParser available to parse PowerPoint XML');
  }
}

/**
 * Helper to get elements by tag name regardless of namespace prefix (e.g. "p:sp" or "sp")
 */
function findElementsByTagName(parent: Element | Document, tagName: string): Element[] {
  const result: Element[] = [];
  const all = parent.getElementsByTagName('*');
  const lowerTag = tagName.toLowerCase();
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const local = (el.localName || el.nodeName).toLowerCase();
    const name = el.nodeName.toLowerCase();
    if (local === lowerTag || name === lowerTag || name.endsWith(':' + lowerTag)) {
      result.push(el);
    }
  }
  return result;
}

function getFirstChildByTagName(parent: Element | Document, tagName: string): Element | null {
  const matches = findElementsByTagName(parent, tagName);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Converts EMU coordinate string to Canvas pixel coordinate
 */
function emuToPixel(emuStr: string | null | undefined, totalEmu: number, totalPx: number, fallback = 0): number {
  if (!emuStr) return fallback;
  const emu = parseInt(emuStr, 10);
  if (isNaN(emu)) return fallback;
  return Math.round((emu / totalEmu) * totalPx);
}

/**
 * Converts hex color strings (e.g. "00A2E8") to CSS hex "#00A2E8"
 */
function parseColorHex(val: string | null | undefined, fallback = '#1e293b'): string {
  if (!val) return fallback;
  const clean = val.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return '#' + clean.toLowerCase();
  }
  return fallback;
}

/**
 * Extracts color and opacity from a solidFill element supporting srgbClr, schemeClr, and sysClr
 */
function extractColorFromFill(
  fillEl: Element | null | undefined,
  themePalette: Record<string, string> = DEFAULT_THEME_COLORS,
  fallback = '#1e293b'
): { color: string; opacity: number } {
  if (!fillEl) return { color: fallback, opacity: 1 };

  const srgb = getFirstChildByTagName(fillEl, 'srgbClr');
  if (srgb) {
    const hex = srgb.getAttribute('val');
    let opacity = 1;
    const alphaEl = getFirstChildByTagName(srgb, 'alpha');
    if (alphaEl) {
      const alphaVal = parseInt(alphaEl.getAttribute('val') || '100000', 10);
      opacity = Math.max(0, Math.min(1, alphaVal / 100000));
    }
    return { color: parseColorHex(hex, fallback), opacity };
  }

  const schemeClr = getFirstChildByTagName(fillEl, 'schemeClr');
  if (schemeClr) {
    const val = schemeClr.getAttribute('val') || '';
    const mapped = themePalette[val] || DEFAULT_THEME_COLORS[val] || fallback;
    let opacity = 1;
    const alphaEl = getFirstChildByTagName(schemeClr, 'alpha');
    if (alphaEl) {
      const alphaVal = parseInt(alphaEl.getAttribute('val') || '100000', 10);
      opacity = Math.max(0, Math.min(1, alphaVal / 100000));
    }
    return { color: mapped, opacity };
  }

  const sysClr = getFirstChildByTagName(fillEl, 'sysClr');
  if (sysClr) {
    const val = sysClr.getAttribute('lastClr');
    if (val) return { color: parseColorHex(val, fallback), opacity: 1 };
  }

  const prstClr = getFirstChildByTagName(fillEl, 'prstClr');
  if (prstClr) {
    const val = prstClr.getAttribute('val') || '';
    return { color: val, opacity: 1 };
  }

  return { color: fallback, opacity: 1 };
}

/**
 * Parses theme colors from ppt/theme/theme1.xml if present
 */
async function parseThemePalette(zip: JSZip): Promise<Record<string, string>> {
  const palette: Record<string, string> = { ...DEFAULT_THEME_COLORS };
  try {
    const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('text');
    if (!themeXml) return palette;
    const doc = parseXmlDocument(themeXml);
    const clrScheme = getFirstChildByTagName(doc, 'clrScheme');
    if (!clrScheme) return palette;

    const colorKeys = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
    for (const key of colorKeys) {
      const el = getFirstChildByTagName(clrScheme, key);
      if (el) {
        const srgb = getFirstChildByTagName(el, 'srgbClr');
        if (srgb) {
          const val = srgb.getAttribute('val');
          if (val) palette[key] = parseColorHex(val, palette[key]);
        } else {
          const sys = getFirstChildByTagName(el, 'sysClr');
          if (sys) {
            const val = sys.getAttribute('lastClr');
            if (val) palette[key] = parseColorHex(val, palette[key]);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not parse theme1.xml palette:', e);
  }
  return palette;
}

/**
 * Parses a single slide XML into CanvasObjects
 */
async function parseSlideXml(
  slideXmlText: string,
  slideRelsXmlText: string | null,
  zip: JSZip,
  slideWidthEmu: number,
  slideHeightEmu: number,
  themePalette: Record<string, string>
): Promise<{ objects: CanvasObject[]; backgroundColor: string; title: string }> {
  const doc = parseXmlDocument(slideXmlText);
  const objects: CanvasObject[] = [];
  let detectedTitle = '';
  let backgroundColor = '#ffffff';

  // Build relationships map for media (images)
  const relsMap: Record<string, string> = {};
  if (slideRelsXmlText) {
    try {
      const relsDoc = parseXmlDocument(slideRelsXmlText);
      const relElements = findElementsByTagName(relsDoc, 'relationship');
      for (const r of relElements) {
        const id = r.getAttribute('Id');
        const target = r.getAttribute('Target');
        if (id && target) {
          // Normalize media target (e.g. "../media/image1.png" -> "ppt/media/image1.png")
          let cleanTarget = target.replace(/^\.\.\//, 'ppt/');
          if (!cleanTarget.startsWith('ppt/')) {
            cleanTarget = 'ppt/' + cleanTarget.replace(/^\//, '');
          }
          relsMap[id] = cleanTarget;
        }
      }
    } catch (e) {
      console.warn('Failed to parse slide rels XML:', e);
    }
  }

  // 1. Detect Background Color
  const bgPr = getFirstChildByTagName(doc, 'bgPr') || getFirstChildByTagName(doc, 'bg');
  if (bgPr) {
    const solidFill = getFirstChildByTagName(bgPr, 'solidFill');
    if (solidFill) {
      const extracted = extractColorFromFill(solidFill, themePalette, '#ffffff');
      backgroundColor = extracted.color;
    }
  }

  // 2. Parse Shapes (<p:sp>)
  const shapeNodes = findElementsByTagName(doc, 'sp');
  for (const sp of shapeNodes) {
    // Coordinate Transform (<a:xfrm>)
    const xfrm = getFirstChildByTagName(sp, 'xfrm');
    const off = xfrm ? getFirstChildByTagName(xfrm, 'off') : null;
    const ext = xfrm ? getFirstChildByTagName(xfrm, 'ext') : null;

    const x = emuToPixel(off?.getAttribute('x'), slideWidthEmu, CANVAS_WIDTH, 100);
    const y = emuToPixel(off?.getAttribute('y'), slideHeightEmu, CANVAS_HEIGHT, 100);
    const width = Math.max(16, emuToPixel(ext?.getAttribute('cx'), slideWidthEmu, CANVAS_WIDTH, 400));
    const height = Math.max(16, emuToPixel(ext?.getAttribute('cy'), slideHeightEmu, CANVAS_HEIGHT, 120));

    // Preset geometry
    const prstGeom = getFirstChildByTagName(sp, 'prstGeom');
    const prst = prstGeom?.getAttribute('prst') || 'rect';

    // Solid Fill
    const spPr = getFirstChildByTagName(sp, 'spPr');
    let fillColor = 'transparent';
    let hasFill = false;
    let fillOpacity = 1;

    if (spPr) {
      const solidFill = getFirstChildByTagName(spPr, 'solidFill');
      if (solidFill) {
        const extracted = extractColorFromFill(solidFill, themePalette, '#3b82f6');
        fillColor = extracted.color;
        fillOpacity = extracted.opacity;
        hasFill = true;
      }
    }

    // Stroke / Border (<a:ln>)
    let strokeColor = 'transparent';
    let strokeWidth = 0;
    let hasStroke = false;
    if (spPr) {
      const ln = getFirstChildByTagName(spPr, 'ln');
      if (ln) {
        const wStr = ln.getAttribute('w');
        strokeWidth = wStr ? Math.max(1, Math.round((parseInt(wStr, 10) / 12700) * 1.33)) : 1;
        const lnSolidFill = getFirstChildByTagName(ln, 'solidFill');
        if (lnSolidFill) {
          const extractedLn = extractColorFromFill(lnSolidFill, themePalette, '#2563eb');
          strokeColor = extractedLn.color;
          hasStroke = true;
        }
      }
    }

    // Text Body (<p:txBody>)
    const txBody = getFirstChildByTagName(sp, 'txBody');
    let hasText = false;
    let combinedText = '';
    let primaryFontSize = 24;
    let primaryColor = '#1e293b';
    let primaryFontFamily = 'Segoe UI, sans-serif';
    let isBold = false;
    let isItalic = false;
    let textAlign: 'left' | 'center' | 'right' = 'left';

    if (txBody) {
      const paragraphs = findElementsByTagName(txBody, 'p');
      const paragraphStrings: string[] = [];

      for (const p of paragraphs) {
        const pPr = getFirstChildByTagName(p, 'pPr');
        if (pPr) {
          const algn = pPr.getAttribute('algn');
          if (algn === 'ctr') textAlign = 'center';
          else if (algn === 'r') textAlign = 'right';
          else if (algn === 'l') textAlign = 'left';
        }

        const buChar = pPr ? getFirstChildByTagName(pPr, 'buChar') : null;
        const buAuto = pPr ? getFirstChildByTagName(pPr, 'buAutoNum') : null;
        const lvl = parseInt(pPr?.getAttribute('lvl') || '0', 10);
        const isBullet = Boolean(buChar || buAuto || lvl > 0);
        const bulletPrefix = isBullet ? (buChar?.getAttribute('char') || '•') + ' ' : '';

        const runs = findElementsByTagName(p, 'r');
        let pText = '';
        for (const r of runs) {
          const t = getFirstChildByTagName(r, 't');
          if (t && t.textContent) {
            pText += t.textContent;
            hasText = true;

            const rPr = getFirstChildByTagName(r, 'rPr');
            if (rPr) {
              const szStr = rPr.getAttribute('sz');
              if (szStr) {
                // sz is in hundredths of a point (e.g. 2400 = 24pt)
                const pt = parseInt(szStr, 10) / 100;
                primaryFontSize = Math.max(12, Math.round(pt * 1.33 * 1.2));
              }
              if (rPr.getAttribute('b') === '1') isBold = true;
              if (rPr.getAttribute('i') === '1') isItalic = true;

              const rSolidFill = getFirstChildByTagName(rPr, 'solidFill');
              if (rSolidFill) {
                const extractedTextClr = extractColorFromFill(rSolidFill, themePalette, '#1e293b');
                primaryColor = extractedTextClr.color;
              }

              const latin = getFirstChildByTagName(rPr, 'latin');
              if (latin && latin.getAttribute('typeface')) {
                primaryFontFamily = latin.getAttribute('typeface') + ', sans-serif';
              }
            }
          }
        }
        if (pText.trim().length > 0) {
          paragraphStrings.push(bulletPrefix + pText);
        }
      }

      combinedText = paragraphStrings.join('\n');
    }

    // Determine if this shape is a title
    const nvSpPr = getFirstChildByTagName(sp, 'nvSpPr');
    const ph = nvSpPr ? getFirstChildByTagName(nvSpPr, 'ph') : null;
    const isTitle = ph?.getAttribute('type') === 'title' || ph?.getAttribute('type') === 'ctrTitle';
    if (isTitle && combinedText && !detectedTitle) {
      detectedTitle = combinedText.split('\n')[0].trim().replace(/^[•\s]+/, '');
    }

    // Insert as ShapeObject or TextObject
    if (hasText && combinedText.trim().length > 0) {
      // If the shape has a visible background or border, insert shape first
      if (hasFill || hasStroke) {
        const shapeObj: ShapeObject = {
          id: uuidv4(),
          type: 'shape',
          shapeType: prst === 'ellipse' ? 'circle' : prst === 'roundRect' ? 'roundedRect' : 'rect',
          x,
          y,
          width,
          height,
          rotation: 0,
          fillColor: hasFill ? fillColor : 'transparent',
          fillOpacity: hasFill ? fillOpacity : 0,
          strokeColor: hasStroke ? strokeColor : 'transparent',
          strokeWidth: hasStroke ? strokeWidth : 0,
          strokeOpacity: hasStroke ? 1 : 0,
          strokeStyle: 'solid',
          locked: false,
          layerId: 'objects',
        };
        objects.push(shapeObj);
      }

      const textObj: TextObject = {
        id: uuidv4(),
        type: 'text',
        x,
        y,
        width,
        height,
        content: combinedText,
        fontFamily: primaryFontFamily,
        fontSize: primaryFontSize,
        fontWeight: isBold ? 700 : 400,
        fontStyle: isItalic ? 'italic' : 'normal',
        textDecoration: 'none',
        textAlign,
        color: primaryColor,
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: isTitle ? 'title' : 'body',
        locked: false,
        layerId: 'objects',
      };
      objects.push(textObj);
    } else if (hasFill || hasStroke) {
      // Graphic shape without text
      let mappedType: ShapeObject['shapeType'] = 'rect';
      if (prst === 'ellipse') mappedType = 'circle';
      else if (prst === 'roundRect') mappedType = 'roundedRect';
      else if (prst === 'line' || prst === 'straightConnector1') mappedType = 'line';
      else if (prst.includes('Arrow')) mappedType = 'arrow';

      const shapeObj: ShapeObject = {
        id: uuidv4(),
        type: 'shape',
        shapeType: mappedType,
        x,
        y,
        width,
        height,
        rotation: 0,
        fillColor: hasFill ? fillColor : '#38bdf8',
        fillOpacity: hasFill ? fillOpacity : 0.8,
        strokeColor: hasStroke ? strokeColor : '#0284c7',
        strokeWidth: hasStroke ? strokeWidth : 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      };
      objects.push(shapeObj);
    }
  }

  // 3. Parse Embedded Pictures (<p:pic>)
  const picNodes = findElementsByTagName(doc, 'pic');
  for (const pic of picNodes) {
    const xfrm = getFirstChildByTagName(pic, 'xfrm');
    const off = xfrm ? getFirstChildByTagName(xfrm, 'off') : null;
    const ext = xfrm ? getFirstChildByTagName(xfrm, 'ext') : null;

    const x = emuToPixel(off?.getAttribute('x'), slideWidthEmu, CANVAS_WIDTH, 100);
    const y = emuToPixel(off?.getAttribute('y'), slideHeightEmu, CANVAS_HEIGHT, 100);
    const width = Math.max(30, emuToPixel(ext?.getAttribute('cx'), slideWidthEmu, CANVAS_WIDTH, 300));
    const height = Math.max(30, emuToPixel(ext?.getAttribute('cy'), slideHeightEmu, CANVAS_HEIGHT, 200));

    const blip = getFirstChildByTagName(pic, 'blip');
    const embedId = blip?.getAttribute('r:embed') || blip?.getAttribute('embed');
    if (embedId && relsMap[embedId]) {
      const mediaPath = relsMap[embedId];
      const mediaFile = zip.file(mediaPath);
      if (mediaFile) {
        try {
          const base64Data = await mediaFile.async('base64');
          const extName = mediaPath.split('.').pop()?.toLowerCase() || 'png';
          let mime = 'image/png';
          if (extName === 'jpg' || extName === 'jpeg') mime = 'image/jpeg';
          else if (extName === 'svg') mime = 'image/svg+xml';
          else if (extName === 'webp') mime = 'image/webp';

          const dataUrl = `data:${mime};base64,${base64Data}`;
          const imgObj: ImageObject = {
            id: uuidv4(),
            type: 'image',
            x,
            y,
            width,
            height,
            rotation: 0,
            filePath: mediaPath.split('/').pop() || 'slide-image.png',
            dataUrl,
            opacity: 1,
            locked: false,
            layerId: 'imported-media',
          };
          objects.push(imgObj);
        } catch (mediaErr) {
          console.warn(`Failed to read slide media at ${mediaPath}:`, mediaErr);
        }
      }
    }
  }

  // 4. Parse Tables (<p:graphicFrame> -> <a:tbl>)
  const graphicFrames = findElementsByTagName(doc, 'graphicFrame');
  for (const gf of graphicFrames) {
    const xfrm = getFirstChildByTagName(gf, 'xfrm');
    const off = xfrm ? getFirstChildByTagName(xfrm, 'off') : null;
    const ext = xfrm ? getFirstChildByTagName(xfrm, 'ext') : null;

    const frameX = emuToPixel(off?.getAttribute('x'), slideWidthEmu, CANVAS_WIDTH, 100);
    const frameY = emuToPixel(off?.getAttribute('y'), slideHeightEmu, CANVAS_HEIGHT, 100);
    const frameW = emuToPixel(ext?.getAttribute('cx'), slideWidthEmu, CANVAS_WIDTH, 800);
    const frameH = emuToPixel(ext?.getAttribute('cy'), slideHeightEmu, CANVAS_HEIGHT, 400);

    const tbl = getFirstChildByTagName(gf, 'tbl');
    if (!tbl) continue;

    const gridCols = findElementsByTagName(tbl, 'gridCol');
    const rows = findElementsByTagName(tbl, 'tr');
    if (rows.length === 0) continue;

    let totalColEmu = 0;
    const colEmus = gridCols.map((col) => {
      const w = parseInt(col.getAttribute('w') || '0', 10);
      totalColEmu += w;
      return w;
    });

    let currentY = frameY;
    const defaultRowH = Math.round(frameH / Math.max(1, rows.length));

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const rowHEmu = parseInt(row.getAttribute('h') || '0', 10);
      const rowH = rowHEmu > 0 ? emuToPixel(String(rowHEmu), slideHeightEmu, CANVAS_HEIGHT, defaultRowH) : defaultRowH;

      let currentX = frameX;
      const cells = findElementsByTagName(row, 'tc');

      for (let cIdx = 0; cIdx < cells.length; cIdx++) {
        const cell = cells[cIdx];
        const colW = totalColEmu > 0 && colEmus[cIdx]
          ? Math.round((colEmus[cIdx] / totalColEmu) * frameW)
          : Math.round(frameW / Math.max(1, cells.length));

        // Cell background & border
        const tcPr = getFirstChildByTagName(cell, 'tcPr');
        const solidFill = tcPr ? getFirstChildByTagName(tcPr, 'solidFill') : null;
        const cellFill = solidFill
          ? extractColorFromFill(solidFill, themePalette, rIdx === 0 ? '#3b82f6' : '#f8fafc')
          : { color: rIdx === 0 ? '#e2e8f0' : '#ffffff', opacity: 1 };

        const cellShape: ShapeObject = {
          id: uuidv4(),
          type: 'shape',
          shapeType: 'rect',
          x: currentX,
          y: currentY,
          width: colW,
          height: rowH,
          rotation: 0,
          fillColor: cellFill.color,
          fillOpacity: cellFill.opacity,
          strokeColor: '#cbd5e1',
          strokeWidth: 1,
          strokeOpacity: 1,
          strokeStyle: 'solid',
          locked: false,
          layerId: 'objects',
        };
        objects.push(cellShape);

        // Cell text
        const txBody = getFirstChildByTagName(cell, 'txBody');
        if (txBody) {
          const paras = findElementsByTagName(txBody, 'p');
          const cellTexts: string[] = [];
          for (const p of paras) {
            const runs = findElementsByTagName(p, 'r');
            let pText = '';
            for (const r of runs) {
              const t = getFirstChildByTagName(r, 't');
              if (t && t.textContent) pText += t.textContent;
            }
            if (pText.trim()) cellTexts.push(pText.trim());
          }
          if (cellTexts.length > 0) {
            const cellTextObj: TextObject = {
              id: uuidv4(),
              type: 'text',
              x: currentX + 6,
              y: currentY + 6,
              width: colW - 12,
              height: rowH - 12,
              content: cellTexts.join('\n'),
              fontFamily: 'Segoe UI, sans-serif',
              fontSize: rIdx === 0 ? 18 : 16,
              fontWeight: rIdx === 0 ? 700 : 400,
              fontStyle: 'normal',
              textDecoration: 'none',
              textAlign: 'left',
              color: rIdx === 0 && cellFill.color !== '#ffffff' ? '#ffffff' : '#1e293b',
              backgroundColor: 'transparent',
              opacity: 1,
              rotation: 0,
              preset: rIdx === 0 ? 'title' : 'body',
              locked: false,
              layerId: 'objects',
            };
            objects.push(cellTextObj);
          }
        }

        currentX += colW;
      }
      currentY += rowH;
    }
  }

  return {
    objects,
    backgroundColor,
    title: detectedTitle || 'PowerPoint Slide',
  };
}

/**
 * Renders slide objects onto an offscreen canvas to generate high-resolution PNG image
 */
async function renderSlideToHighResDataUrl(
  objects: CanvasObject[],
  backgroundColor: string,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
): Promise<{ fullDataUrl: string; thumbnailDataUrl: string }> {
  if (typeof document === 'undefined') {
    // Return placeholder data URL in non-browser test environment
    const emptyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return { fullDataUrl: emptyPng, thumbnailDataUrl: emptyPng };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const empty = canvas.toDataURL('image/png');
    return { fullDataUrl: empty, thumbnailDataUrl: empty };
  }

  // 1. Draw Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Render CanvasObjects sequentially
  for (const obj of objects) {
    ctx.save();

    if (obj.type === 'shape') {
      const s = obj as ShapeObject;
      ctx.fillStyle = s.fillColor;
      ctx.globalAlpha = s.fillOpacity;
      ctx.strokeStyle = s.strokeColor;
      ctx.lineWidth = s.strokeWidth;

      if (s.shapeType === 'circle') {
        ctx.beginPath();
        ctx.ellipse(s.x + s.width / 2, s.y + s.height / 2, s.width / 2, s.height / 2, 0, 0, Math.PI * 2);
        if (s.fillOpacity > 0) ctx.fill();
        if (s.strokeWidth > 0) ctx.stroke();
      } else if (s.shapeType === 'line') {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.width, s.y + s.height);
        ctx.stroke();
      } else {
        // Rectangle / Rounded Rectangle
        if (s.fillOpacity > 0) ctx.fillRect(s.x, s.y, s.width, s.height);
        if (s.strokeWidth > 0) ctx.strokeRect(s.x, s.y, s.width, s.height);
      }
    } else if (obj.type === 'image') {
      const imgObj = obj as ImageObject;
      if (imgObj.dataUrl) {
        const url = imgObj.dataUrl;
        try {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.globalAlpha = imgObj.opacity ?? 1;
              ctx.drawImage(img, imgObj.x, imgObj.y, imgObj.width, imgObj.height);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = url;
          });
        } catch {}
      }
    } else if (obj.type === 'text') {
      const t = obj as TextObject;
      ctx.fillStyle = t.color;
      ctx.font = `${t.fontStyle} ${t.fontWeight} ${t.fontSize}px ${t.fontFamily}`;
      ctx.textBaseline = 'top';

      const lines = t.content.split('\n');
      const lineHeight = Math.round(t.fontSize * 1.35);
      let currY = t.y + 4;

      for (const line of lines) {
        let currX = t.x + 4;
        if (t.textAlign === 'center') {
          ctx.textAlign = 'center';
          currX = t.x + t.width / 2;
        } else if (t.textAlign === 'right') {
          ctx.textAlign = 'right';
          currX = t.x + t.width - 4;
        } else {
          ctx.textAlign = 'left';
        }
        ctx.fillText(line, currX, currY);
        currY += lineHeight;
      }
    }

    ctx.restore();
  }

  const fullDataUrl = canvas.toDataURL('image/png');

  // Render thumbnail (320 x 180)
  const thumbW = 320;
  const thumbH = 180;
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) {
    thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
  }
  const thumbnailDataUrl = thumbCanvas.toDataURL('image/png');

  return { fullDataUrl, thumbnailDataUrl };
}

/**
 * Main Entry Point: Parses a PowerPoint (.pptx) file buffer into an array of ImportedDocumentPage items
 */
export async function parsePptxPresentation(
  fileOrBuffer: File | ArrayBuffer,
  onProgress?: (percent: number) => void
): Promise<ImportedDocumentPage[]> {
  const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  onProgress?.(15);

  const zip = await JSZip.loadAsync(buffer);
  onProgress?.(30);

  // 1. Read Presentation Dimensions (<p:sldSz>)
  let slideWidthEmu = DEFAULT_SLIDE_WIDTH_EMU;
  let slideHeightEmu = DEFAULT_SLIDE_HEIGHT_EMU;

  const presentationXml = await zip.file('ppt/presentation.xml')?.async('text');
  if (presentationXml) {
    try {
      const pDoc = parseXmlDocument(presentationXml);
      const sldSz = getFirstChildByTagName(pDoc, 'sldSz');
      if (sldSz) {
        const cx = parseInt(sldSz.getAttribute('cx') || '', 10);
        const cy = parseInt(sldSz.getAttribute('cy') || '', 10);
        if (cx > 0 && cy > 0) {
          slideWidthEmu = cx;
          slideHeightEmu = cy;
        }
      }
    } catch (e) {
      console.warn('Failed to parse presentation.xml dimensions:', e);
    }
  }

  // 2. Discover Slides and Ordered Sequence
  const slidePaths: string[] = [];
  const presentationRelsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text');

  if (presentationXml && presentationRelsXml) {
    try {
      const pDoc = parseXmlDocument(presentationXml);
      const relsDoc = parseXmlDocument(presentationRelsXml);

      const relsMap: Record<string, string> = {};
      const relEls = findElementsByTagName(relsDoc, 'relationship');
      for (const r of relEls) {
        const id = r.getAttribute('Id');
        const target = r.getAttribute('Target');
        if (id && target) {
          // Normalize slide target (e.g. "slides/slide1.xml" -> "ppt/slides/slide1.xml")
          const clean = target.startsWith('ppt/') ? target : 'ppt/' + target.replace(/^\//, '');
          relsMap[id] = clean;
        }
      }

      const sldIdLst = getFirstChildByTagName(pDoc, 'sldIdLst');
      if (sldIdLst) {
        const sldIds = findElementsByTagName(sldIdLst, 'sldId');
        for (const sld of sldIds) {
          const rId = sld.getAttribute('r:id') || sld.getAttribute('id');
          if (rId && relsMap[rId] && zip.file(relsMap[rId])) {
            slidePaths.push(relsMap[rId]);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to resolve presentation slide sequence from rels:', e);
    }
  }

  // Fallback: If rels ordering failed, inspect all files in ppt/slides/
  if (slidePaths.length === 0) {
    const allFiles = Object.keys(zip.files);
    const regex = /^ppt\/slides\/slide(\d+)\.xml$/i;
    const matched = allFiles
      .filter((f) => regex.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(regex)?.[1] || '0', 10);
        const numB = parseInt(b.match(regex)?.[1] || '0', 10);
        return numA - numB;
      });
    slidePaths.push(...matched);
  }

  if (slidePaths.length === 0) {
    throw new Error('No readable presentation slides found in this PowerPoint file.');
  }

  // Parse presentation theme colors if present
  const themePalette = await parseThemePalette(zip);

  onProgress?.(45);

  // 3. Process each slide
  const importedPages: ImportedDocumentPage[] = [];
  const totalSlides = slidePaths.length;

  for (let idx = 0; idx < totalSlides; idx++) {
    const sPath = slidePaths[idx];
    const slideNumber = idx + 1;
    const progress = 45 + Math.round(((idx + 1) / totalSlides) * 50);
    onProgress?.(progress);

    const slideXml = await zip.file(sPath)?.async('text');
    if (!slideXml) continue;

    // Read slide relationships (for pictures & media)
    const relsPath = sPath.replace(/ppt\/slides\/slide(\d+)\.xml/i, 'ppt/slides/_rels/slide$1.xml.rels');
    const relsXml = await zip.file(relsPath)?.async('text');

    const { objects, backgroundColor, title } = await parseSlideXml(
      slideXml,
      relsXml || null,
      zip,
      slideWidthEmu,
      slideHeightEmu,
      themePalette
    );

    const { fullDataUrl, thumbnailDataUrl } = await renderSlideToHighResDataUrl(
      objects,
      backgroundColor,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    importedPages.push({
      pageNumber: slideNumber,
      thumbnailDataUrl,
      fullDataUrl,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      objects,
      backgroundColor,
    });
  }

  onProgress?.(100);
  return importedPages;
}
