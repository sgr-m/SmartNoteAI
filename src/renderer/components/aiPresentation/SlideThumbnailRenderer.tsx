/**
 * SlideThumbnailRenderer.tsx — Shared High-Fidelity 16:9 Vector Thumbnail & Slide Preview
 * Milestone 5: Rebuild & Fix AI Teaching Presentation Generation Workflow
 *
 * Provides a unified, accurate SVG renderer for:
 * 1. Filmstrip thumbnails in SlideDeckPreview and PagePanel.
 * 2. Master slide template thumbnails in the template gallery.
 * 3. High-resolution vector preview in the main slide workspace.
 *
 * Fixes previous thumbnail bugs:
 * - Eliminates 30-character single-line text truncation.
 * - Implements word-wrapping for long paragraph text and bullet points.
 * - Fixes centered text coordinates (`x = t.x + t.width / 2`).
 * - Accurately scales to any thumbnail dimension while preserving strict 16:9 aspect ratio.
 */

import React, { useMemo } from 'react';
import { Page, CanvasObject, ShapeObject, TextObject, ImageObject, StrokeObject, GroupObject } from '../../../shared/types';
import { SlideTemplateDefinition, PresentationTheme, CustomSlideMaster } from '../../../shared/aiPresentationTypes';
import { compileTemplateToNativeObjects, compileCustomMasterToNativeObjects } from '../../services/aiPresentation/templateCompiler';
import { DEFAULT_PRESENTATION_THEME } from '../../services/aiPresentation/presentationThemes';
import { customSlideMasterService } from '../../services/aiPresentation/customSlideMasterService';
import { isLatexSyntax, renderLatexHtml } from '../../services/latexService';
import { KATEX_SVG_CSS } from '../../services/katexStyles';

export interface SlideThumbnailRendererProps {
  page?: Page;
  template?: SlideTemplateDefinition;
  master?: CustomSlideMaster;
  theme?: PresentationTheme;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  showBorder?: boolean;
}

/**
 * Word wraps text into lines fitting within approx character width.
 */
function wrapLines(text: string, maxWidthPx: number, fontSize: number): string[] {
  if (!text) return [];
  const rawLines = text.split('\n');
  const avgCharWidth = fontSize * 0.52;
  const maxCharsPerLine = Math.max(12, Math.floor(maxWidthPx / avgCharWidth));

  const resultLines: string[] = [];

  for (const raw of rawLines) {
    if (raw.length <= maxCharsPerLine) {
      resultLines.push(raw);
      continue;
    }

    const words = raw.split(' ');
    let currentLine = '';

    for (const w of words) {
      if ((currentLine + (currentLine ? ' ' : '') + w).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + w;
      } else {
        if (currentLine) resultLines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) resultLines.push(currentLine);
  }

  return resultLines;
}

export function SlideThumbnailRenderer({
  page,
  template,
  master,
  theme = DEFAULT_PRESENTATION_THEME,
  width = '100%',
  height = '100%',
  className = '',
  style = {},
  showBorder = false,
}: SlideThumbnailRendererProps): React.ReactElement {
  // Resolve objects to render
  const { objects, bgColor, slideW, slideH } = useMemo(() => {
    if (page) {
      return {
        objects: page.objects || [],
        bgColor: page.background?.color || theme.backgroundColor || '#ffffff',
        slideW: page.width || 1920,
        slideH: page.height || 1080,
      };
    }
    if (master) {
      const masterTheme = customSlideMasterService.masterToPresentationTheme(master);
      const compiled = compileCustomMasterToNativeObjects(master);
      return {
        objects: compiled,
        bgColor: master.theme.backgroundColor || '#ffffff',
        slideW: master.width || 1920,
        slideH: master.height || 1080,
      };
    }
    if (template) {
      const compiled = compileTemplateToNativeObjects(template, theme);
      return {
        objects: compiled,
        bgColor: theme.backgroundColor || '#ffffff',
        slideW: template.width || 1920,
        slideH: template.height || 1080,
      };
    }
    return {
      objects: [],
      bgColor: '#1e293b',
      slideW: 1920,
      slideH: 1080,
    };
  }, [page, template, master, theme]);

  const renderSvgObject = (obj: CanvasObject): React.ReactElement | null => {
    switch (obj.type) {
      case 'stroke': {
        const s = obj as StrokeObject;
        if (!s.points || s.points.length < 2) return null;
        const d =
          `M ${s.points[0].x} ${s.points[0].y} ` +
          s.points
            .slice(1)
            .map((p) => `L ${p.x} ${p.y}`)
            .join(' ');
        return (
          <path
            key={s.id}
            d={d}
            stroke={s.style?.color || '#ffffff'}
            strokeWidth={Math.max(2, (s.style?.width || 2) * 1.5)}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={s.style?.opacity ?? 1}
          />
        );
      }

      case 'shape': {
        const sh = obj as ShapeObject;
        const strokeW = Math.max(1, sh.strokeWidth || 1);
        const isRounded = sh.shapeType === 'roundedRect';
        const rx = isRounded ? 14 : 0;

        if (sh.shapeType === 'rect' || sh.shapeType === 'roundedRect') {
          return (
            <rect
              key={sh.id}
              x={sh.x}
              y={sh.y}
              width={sh.width}
              height={sh.height}
              rx={rx}
              fill={sh.fillColor || 'transparent'}
              fillOpacity={sh.fillOpacity ?? 1}
              stroke={sh.strokeColor || 'transparent'}
              strokeWidth={sh.strokeWidth ?? 0}
              opacity={sh.strokeOpacity ?? 1}
            />
          );
        }

        if (sh.shapeType === 'ellipse') {
          return (
            <ellipse
              key={sh.id}
              cx={sh.x + sh.width / 2}
              cy={sh.y + sh.height / 2}
              rx={Math.abs(sh.width / 2)}
              ry={Math.abs(sh.height / 2)}
              fill={sh.fillColor || 'transparent'}
              fillOpacity={sh.fillOpacity ?? 1}
              stroke={sh.strokeColor || 'transparent'}
              strokeWidth={strokeW}
              opacity={sh.strokeOpacity ?? 1}
            />
          );
        }

        if (sh.shapeType === 'line' || sh.shapeType === 'arrow') {
          return (
            <line
              key={sh.id}
              x1={sh.x}
              y1={sh.y}
              x2={sh.x + sh.width}
              y2={sh.y + sh.height}
              stroke={sh.strokeColor || '#38bdf8'}
              strokeWidth={Math.max(2, strokeW)}
              strokeLinecap="round"
            />
          );
        }

        return (
          <rect
            key={sh.id}
            x={sh.x}
            y={sh.y}
            width={sh.width}
            height={sh.height}
            rx={8}
            fill={sh.fillColor && sh.fillColor !== 'transparent' ? sh.fillColor : 'rgba(56, 189, 248, 0.15)'}
            stroke={sh.strokeColor || '#38bdf8'}
            strokeWidth={strokeW}
          />
        );
      }

      case 'text': {
        const t = obj as TextObject;
        const fontSize = t.fontSize || 20;
        const isCenter = t.textAlign === 'center';
        const isRight = t.textAlign === 'right';
        const isLatex = Boolean(t.isLatex || isLatexSyntax(t.content));

        // High-fidelity KaTeX vector rendering for mathematical equations in SVG previews
        if (isLatex) {
          const res = renderLatexHtml(t.content, true);
          if (res.success && res.html) {
            const foW = Math.max(120, t.width || 400);
            const foH = Math.max(44, t.height || 60);
            return (
              <foreignObject
                key={t.id}
                x={t.x}
                y={t.y}
                width={foW}
                height={foH}
                style={{ overflow: 'visible' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
                    color: t.color || '#ffffff',
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.2,
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: res.html }}
                />
              </foreignObject>
            );
          }
        }

        const anchor = isCenter ? 'middle' : isRight ? 'end' : 'start';
        const startX = isCenter ? t.x + (t.width || 200) / 2 : isRight ? t.x + (t.width || 200) : t.x;
        const lines = wrapLines(t.content || '', t.width || 600, fontSize);
        const lineHeight = fontSize * 1.35;

        return (
          <text
            key={t.id}
            x={startX}
            y={t.y + fontSize * 0.9}
            fill={t.color || '#ffffff'}
            fontSize={fontSize}
            fontFamily={t.fontFamily || 'Inter, -apple-system, sans-serif'}
            fontWeight={t.fontWeight || 400}
            fontStyle={t.fontStyle || 'normal'}
            textAnchor={anchor}
          >
            {lines.map((line, idx) => (
              <tspan key={idx} x={startX} dy={idx === 0 ? 0 : lineHeight}>
                {line}
              </tspan>
            ))}
          </text>
        );
      }

      case 'image': {
        const img = obj as ImageObject;
        if (!img.dataUrl) return null;
        return (
          <image
            key={img.id}
            href={img.dataUrl}
            x={img.x}
            y={img.y}
            width={img.width}
            height={img.height}
            opacity={img.opacity ?? 1}
            preserveAspectRatio="xMidYMid meet"
          />
        );
      }

      case 'group': {
        const g = obj as GroupObject;
        return (
          <g key={g.id}>
            {g.objects?.map((child) => renderSvgObject(child))}
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox={`0 0 ${slideW} ${slideH}`}
      className={`slide-thumbnail-svg ${className}`}
      style={{
        width,
        height,
        display: 'block',
        borderRadius: 6,
        overflow: 'hidden',
        border: showBorder ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
        ...style,
      }}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <style>{KATEX_SVG_CSS}</style>
      </defs>

      {/* Background Rect */}
      <rect width={slideW} height={slideH} fill={bgColor} />

      {/* Render Canvas Objects */}
      {objects.map((obj) => renderSvgObject(obj))}
    </svg>
  );
}

/**
 * Specialized thumbnail for displaying a SlideTemplateDefinition in the template gallery.
 */
export function TemplateThumbnail({
  template,
  master,
  theme,
  width = '100%',
  height = '100%',
  className = '',
}: {
  template?: SlideTemplateDefinition;
  master?: CustomSlideMaster;
  theme?: PresentationTheme;
  width?: number | string;
  height?: number | string;
  className?: string;
}): React.ReactElement {
  return (
    <SlideThumbnailRenderer
      template={template}
      master={master}
      theme={theme}
      width={width}
      height={height}
      className={className}
      showBorder={false}
    />
  );
}

