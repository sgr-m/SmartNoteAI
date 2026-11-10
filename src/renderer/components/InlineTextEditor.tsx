/**
 * InlineTextEditor.tsx — Direct On-Board Text Typing & Right-Side Typography/LaTeX/HTML Inspector
 * Rebuilt to provide:
 * 1. Streamlined presets: Math Formula, Code Block, Important Note only.
 * 2. Windows Font Library dropdown.
 * 3. 1-Click Font Size Pills (26, 36, 46, 56, 66) + Steppers.
 * 4. Bold, Italic, Underline, and Alignment.
 * 5. Ink Color Swatches + Native Color Picker.
 * 6. Dual Mode Toggles: LaTeX Math Mode and HTML / CSS Web Mode with live on-board previews.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { TextPreset, TextObject } from '../../shared/types';
import { getAvailableFonts } from '../services/fontService';
import {
  isLatexSyntax,
  isPureLatexFormula,
  renderLatexHtml,
  autoFormatLatexFractions,
  autoFormatMathOperators,
  measureLatexSize,
} from '../services/latexService';
import { measureHtmlSize } from '../services/htmlRenderService';
import {
  isMarkdownSyntax,
  measureMarkdownSize,
  markdownToHtml,
} from '../services/markdownRenderService';
import { detectTextFormatMode } from '../services/formatDetectionService';
import './InlineTextEditor.css';

interface InlineTextEditorProps {
  initialPoint: { x: number; y: number };
  initialText?: TextObject | null;
  zoom: number;
  panX: number;
  panY: number;
  onSave: (textObj: Partial<TextObject>) => void;
  onClose: () => void;
}

interface TextPresetConfig {
  preset: TextPreset;
  label: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  fontFamily: string;
  fontStyle?: 'normal' | 'italic';
  icon: string;
  isLatex?: boolean;
}

// Streamlined presets: only Math Formula, Code Block, and Important Note
const PRESETS: TextPresetConfig[] = [
  {
    preset: 'formula',
    label: 'Math Formula',
    fontSize: 36,
    fontWeight: 600,
    color: '#facc15',
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    fontFamily: '"Cambria Math", serif',
    icon: '∑',
    isLatex: true,
  },
  {
    preset: 'code',
    label: 'Code Block',
    fontSize: 18,
    fontWeight: 400,
    color: '#34d399',
    backgroundColor: '#0f172a',
    fontFamily: '"Cascadia Code", Consolas, monospace',
    icon: '💻',
  },
  {
    preset: 'important',
    label: 'Important Note',
    fontSize: 24,
    fontWeight: 600,
    color: '#fb923c',
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    fontFamily: '"Segoe UI", sans-serif',
    icon: '⭐',
  },
];

const QUICK_FONT_SIZES = [26, 30, 36, 46, 56, 66];

const LATEX_SNIPPETS = [
  { label: 'Fraction (a/b)', latex: '\\frac{a}{b}' },
  { label: '1/2 Half', latex: '\\frac{1}{2}' },
  { label: 'Square Root', latex: '\\sqrt{x}' },
  { label: 'Power', latex: 'x^{2}' },
  { label: 'Subscript', latex: 'x_{1}' },
  { label: 'Integral', latex: '\\int_{a}^{b} f(x) dx' },
  { label: 'Summation', latex: '\\sum_{i=1}^{n} i' },
  { label: 'Limit', latex: '\\lim_{x \\to 0}' },
  { label: '± Plus/Minus', latex: '\\pm' },
  { label: '∞ Infinity', latex: '\\infty' },
  { label: 'π Pi', latex: '\\pi' },
  { label: 'θ Theta', latex: '\\theta' },
  { label: 'α Alpha', latex: '\\alpha' },
  { label: 'β Beta', latex: '\\beta' },
  { label: 'λ Lambda', latex: '\\lambda' },
  { label: '≤ Less/Equal', latex: '\\le' },
  { label: '≥ Greater/Equal', latex: '\\ge' },
  { label: '≠ Not Equal', latex: '\\neq' },
  { label: 'Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Quadratic', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
];

const HTML_SNIPPETS = [
  { label: 'Card Box', code: '<div style="background: rgba(30, 41, 59, 0.8); border: 2px solid #38bdf8; border-radius: 8px; padding: 12px; color: #ffffff;">\n  <h3>Important Concept</h3>\n  <p>Write custom note here.</p>\n</div>' },
  { label: 'Highlight Tag', code: '<span style="background: #facc15; color: #000000; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Highlight</span>' },
  { label: 'Color Banner', code: '<div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 10px 16px; border-radius: 8px; color: #ffffff; font-weight: bold;">\n  Classroom Header Banner\n</div>' },
  { label: 'Simple Table', code: '<table style="width: 100%; border-collapse: collapse; color: #ffffff;">\n  <tr style="border-bottom: 2px solid #38bdf8;">\n    <th style="padding: 6px; text-align: left;">Term</th>\n    <th style="padding: 6px; text-align: left;">Definition</th>\n  </tr>\n  <tr>\n    <td style="padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.2);">Example A</td>\n    <td style="padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.2);">Description text</td>\n  </tr>\n</table>' },
];

export function InlineTextEditor({
  initialPoint,
  initialText,
  zoom,
  panX,
  panY,
  onSave,
  onClose,
}: InlineTextEditorProps): React.ReactElement {
  const [content, setContent] = useState(initialText?.content ?? '');
  const [activePreset, setActivePreset] = useState<TextPreset>(initialText?.preset ?? 'body');
  const [fontFamily, setFontFamily] = useState(initialText?.fontFamily ?? '"Segoe UI", sans-serif');
  const [fontSize, setFontSize] = useState<number>(initialText?.fontSize ?? 36);
  const [lineHeight, setLineHeight] = useState<number>(initialText?.lineHeight ?? 1.4);
  const [fontWeight, setFontWeight] = useState(initialText?.fontWeight ?? 400);
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(initialText?.fontStyle ?? 'normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>(initialText?.textDecoration ?? 'none');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(initialText?.textAlign ?? 'left');
  const [color, setColor] = useState(initialText?.color ?? '#ffffff');
  const [backgroundColor, setBackgroundColor] = useState(initialText?.backgroundColor ?? 'transparent');
  const initialMode = useMemo(() => {
    return detectTextFormatMode(initialText?.content || '', {
      isHtml: initialText?.isHtml,
      isLatex: initialText?.isLatex,
      isMarkdown: initialText?.isMarkdown,
    });
  }, [initialText]);

  const [isLatexMode, setIsLatexMode] = useState<boolean>(initialMode.isLatex);
  const [isHtmlMode, setIsHtmlMode] = useState<boolean>(initialMode.isHtml);
  const [isMarkdownMode, setIsMarkdownMode] = useState<boolean>(initialMode.isMarkdown);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorBoxRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const colorPickerInputRef = useRef<HTMLInputElement>(null);

  const availableFonts = useMemo(() => getAvailableFonts(), []);

  // Calculate screen position on canvas
  const screenLeft = (initialPoint.x + panX) * zoom;
  const screenTop = (initialPoint.y + panY) * zoom;

  // Auto-focus textarea immediately on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, []);

  // Auto-resize textarea to fit text
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(40, el.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, fontSize, zoom, adjustTextareaHeight]);

  const maxAvailableWidth = useMemo(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    // Ensure the text box has generous width across the board (leaving comfortable margin for right toolbar)
    return Math.max(720, Math.min(1500, screenWidth - screenLeft - 380));
  }, [screenLeft]);

  // Real-time KaTeX formula / Markdown math live preview
  const latexPreview = useMemo(() => {
    if (!isLatexMode || isMarkdownMode || isHtmlMode || !content.trim()) return null;
    const isPure = isPureLatexFormula(content);
    if (!isPure && (content.includes('$') || isMarkdownSyntax(content) || /\b[a-zA-Z]{3,}\b/.test(content))) {
      const html = markdownToHtml(content);
      return { html, success: true, isMixed: true, error: undefined };
    }
    return renderLatexHtml(content || 'E = mc^2', true);
  }, [content, isLatexMode, isMarkdownMode, isHtmlMode]);

  // Commit text to canvas document
  const handleCommit = useCallback(() => {
    if (!content.trim()) {
      onClose();
      return;
    }

    const detected = detectTextFormatMode(content, {
      isHtml: isHtmlMode,
      isLatex: isLatexMode,
      isMarkdown: isMarkdownMode,
    });
    const isLatex = detected.isLatex;
    const isHtml = detected.isHtml;
    const isMarkdown = detected.isMarkdown;

    const normalizedContent = isLatex ? autoFormatLatexFractions(autoFormatMathOperators(content)) : content;
    let estimatedWidth: number;
    let estimatedHeight: number;

    if (isHtml) {
      const measured = measureHtmlSize(normalizedContent, fontSize, fontFamily, maxAvailableWidth);
      estimatedWidth = Math.min(maxAvailableWidth, measured.width);
      estimatedHeight = measured.height;
    } else if (isLatex) {
      const measured = measureLatexSize(normalizedContent, fontSize);
      estimatedWidth = measured.width;
      estimatedHeight = measured.height;
    } else if (isMarkdown) {
      const measured = measureMarkdownSize(normalizedContent, fontSize, fontFamily, maxAvailableWidth);
      estimatedWidth = Math.min(maxAvailableWidth, measured.width);
      estimatedHeight = measured.height;
    } else {
      const linesCount = normalizedContent.split('\n').length;
      estimatedWidth = maxAvailableWidth;
      estimatedHeight = Math.max(48, fontSize * linesCount * 1.35 + 24);
    }

    onSave({
      x: initialPoint.x,
      y: initialPoint.y,
      content: normalizedContent,
      preset: isLatex ? 'formula' : activePreset,
      fontFamily: isLatex ? "KaTeX_Main, 'Cambria Math', 'Times New Roman', serif" : fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      color,
      backgroundColor,
      width: isLatex ? Math.max(initialText?.width || 0, estimatedWidth) : (initialText?.width || estimatedWidth),
      height: isLatex ? Math.max(initialText?.height || 0, estimatedHeight) : (initialText?.height || estimatedHeight),
      lineHeight,
      opacity: 1,
      rotation: initialText?.rotation || 0,
      locked: false,
      layerId: initialText?.layerId || 'objects',
      isLatex,
      isHtml,
      isMarkdown,
    });
    onClose();
  }, [
    content,
    initialPoint,
    initialText,
    activePreset,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    textDecoration,
    textAlign,
    color,
    backgroundColor,
    lineHeight,
    isLatexMode,
    isHtmlMode,
    isMarkdownMode,
    maxAvailableWidth,
    onSave,
    onClose,
  ]);

  const mountedAtRef = useRef(Date.now());

  // Click outside to commit:
  useEffect(() => {
    let cleanupClick: (() => void) | undefined;

    const timer = setTimeout(() => {
      const handleDocumentClick = (e: MouseEvent) => {
        if (Date.now() - mountedAtRef.current < 450) return;
        const target = e.target as Node;
        if (
          (editorBoxRef.current && editorBoxRef.current.contains(target)) ||
          (sidebarRef.current && sidebarRef.current.contains(target))
        ) {
          return;
        }
        handleCommit();
      };

      window.addEventListener('mousedown', handleDocumentClick);
      cleanupClick = () => window.removeEventListener('mousedown', handleDocumentClick);
    }, 350);

    return () => {
      clearTimeout(timer);
      cleanupClick?.();
    };
  }, [handleCommit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleCommit();
    }
  };

  const insertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => (prev ? `${prev}\n${snippet}` : snippet));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const updated = content.substring(0, start) + snippet + content.substring(end);
    setContent(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 10);
  };

  const applyPreset = (p: TextPresetConfig) => {
    setActivePreset(p.preset);
    setFontSize(p.fontSize);
    setFontWeight(p.fontWeight);
    setColor(p.color);
    setBackgroundColor(p.backgroundColor);
    setFontFamily(p.fontFamily);
    if (p.fontStyle) setFontStyle(p.fontStyle);
    if (p.isLatex !== undefined) {
      setIsLatexMode(p.isLatex);
      setIsHtmlMode(false);
    }
    if (p.preset === 'formula' && !content.trim()) {
      setContent('ax^2 + bx + c = 0');
    }
    textareaRef.current?.focus();
  };

  // Group fonts by category
  const fontGroups = useMemo(() => {
    const map = new Map<string, typeof availableFonts>();
    for (const f of availableFonts) {
      const cat = f.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(f);
    }
    return Array.from(map.entries());
  }, [availableFonts]);

  return (
    <>
      {/* ─── Part 1: Direct On-Board Text Box (rendered exactly at board position) ─── */}
      <div
        ref={editorBoxRef}
        className="inline-board-text-wrapper"
        style={{
          position: 'absolute',
          left: screenLeft,
          top: screenTop,
          width: `${maxAvailableWidth}px`,
          maxWidth: `${maxAvailableWidth}px`,
          zIndex: 125,
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="inline-board-text-container"
          style={{
            backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : 'rgba(15, 23, 42, 0.45)',
          }}
        >
          <textarea
            ref={textareaRef}
            className="inline-board-textarea"
            placeholder={
              isHtmlMode
                ? 'Type custom HTML & CSS (e.g. <div style="color: yellow">...</div>)...'
                : isLatexMode
                ? 'Type LaTeX formula (e.g. \\frac{a}{b}, E=mc^2)...'
                : 'Type here on board (Markdown supported: # Headings, **bold**, --- horizontal line)...'
            }
            value={content}
            onDragStart={(e) => e.preventDefault()}
            onChange={(e) => {
              const val = e.target.value;
              setContent(val);
              const detected = detectTextFormatMode(val);
              if (detected.isHtml) {
                setIsHtmlMode(true);
                setIsLatexMode(false);
                setIsMarkdownMode(false);
              } else if (detected.isLatex) {
                setIsLatexMode(true);
                setIsHtmlMode(false);
                setIsMarkdownMode(false);
                setFontSize((prev) => Math.max(28, prev));
              } else if (detected.isMarkdown) {
                setIsMarkdownMode(true);
                setIsLatexMode(false);
                setIsHtmlMode(false);
              }
            }}
            onKeyDown={handleKeyDown}
            style={{
              fontFamily,
              fontSize: `${fontSize * zoom}px`,
              fontWeight,
              fontStyle,
              textDecoration,
              textAlign,
              color,
              lineHeight: `${lineHeight}`,
            }}
            rows={1}
          />

          {/* Real-time On-Board KaTeX Formula Preview */}
          {isLatexMode && latexPreview && (
            <div
              className="inline-latex-live-preview clickable-formula-preview"
              title="Click formula to apply directly to board"
              onClick={(e) => {
                e.stopPropagation();
                handleCommit();
              }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                <span className="latex-badge">{(latexPreview as any)?.isMixed ? '∑ Markdown & Math' : '∑ LaTeX Formula'}</span>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>Click to apply to board ↵</span>
              </div>
              <div
                className="latex-rendered-content"
                style={{ color, fontSize: `${Math.max(16, fontSize * 1.1 * zoom)}px` }}
                dangerouslySetInnerHTML={{ __html: latexPreview.html }}
              />
              {latexPreview.error && (
                <span className="latex-error-hint" title={latexPreview.error}>
                  (Syntax incomplete...)
                </span>
              )}
            </div>
          )}

          {/* Real-time On-Board HTML / CSS Live Preview */}
          {isHtmlMode && content.trim() && (
            <div
              className="inline-html-live-preview"
              title="Click to apply HTML directly to board"
              onClick={(e) => {
                e.stopPropagation();
                handleCommit();
              }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                <span className="html-badge">🌐 HTML / CSS Live Preview</span>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>Click to apply to board ↵</span>
              </div>
              <div
                className="html-rendered-container"
                style={{
                  color,
                  fontFamily,
                  fontSize: `${fontSize * zoom}px`,
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}

          {/* Real-time On-Board Markdown + KaTeX Live Preview */}
          {isMarkdownMode && content.trim() && (
            <div
              className="inline-markdown-live-preview"
              title="Click to apply Markdown directly to board"
              onClick={(e) => {
                e.stopPropagation();
                handleCommit();
              }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                <span className="md-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  📝 Markdown + KaTeX Live Preview
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>Click to apply to board ↵</span>
              </div>
              <div
                className="markdown-rendered-container"
                style={{
                  color,
                  fontFamily,
                  fontSize: `${fontSize * zoom}px`,
                  lineHeight: '1.45',
                }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
              />
            </div>
          )}

          {/* Quick inline commit button */}
          <div className="inline-board-actions">
            <button
              type="button"
              className="inline-commit-btn"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleCommit();
              }}
              title="Commit text to board (Esc or Ctrl+Enter)"
            >
              ✓ Done
            </button>
          </div>
        </div>
      </div>

      {/* ─── Part 2: Right-Side Typography & Math Toolbar ─── */}
      <div
        ref={sidebarRef}
        className="board-typography-sidebar"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="typo-sidebar-header">
          <div className="typo-sidebar-title">
            <span className="typo-icon">Aa</span>
            <span>Typography & Math</span>
          </div>
          <button
            type="button"
            className="typo-done-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleCommit();
            }}
            title="Finish & Commit (Esc)"
          >
            ✓ Done
          </button>
        </div>

        {/* 1. Mode Toggles Row: LaTeX Mode, Markdown Mode & HTML Mode */}
        <div className="typo-section">
          <div className="typo-modes-row">
            <label className="md-toggle-label" title="Enable Markdown Mode with KaTeX formulas and clean formatting">
              <input
                type="checkbox"
                checked={isMarkdownMode}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsMarkdownMode(checked);
                  if (checked) {
                    setIsLatexMode(false);
                    setIsHtmlMode(false);
                  }
                }}
              />
              <span className="md-toggle-text">📝 MD Mode</span>
            </label>

            <label className="latex-toggle-label" title="Enable LaTeX math rendering for formulas">
              <input
                type="checkbox"
                checked={isLatexMode}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsLatexMode(checked);
                  if (checked) {
                    setIsHtmlMode(false);
                    setIsMarkdownMode(false);
                  }
                }}
              />
              <span className="latex-toggle-text">∑ LaTeX Mode</span>
            </label>

            <label className="html-toggle-label" title="Enable HTML / CSS rendering for custom markup">
              <input
                type="checkbox"
                checked={isHtmlMode}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsHtmlMode(checked);
                  if (checked) {
                    setIsLatexMode(false);
                    setIsMarkdownMode(false);
                  }
                }}
              />
              <span className="html-toggle-text">🌐 HTML Mode</span>
            </label>
          </div>

          {/* LaTeX Snippets Grid */}
          {isLatexMode && (
            <div className="latex-snippets-grid">
              {LATEX_SNIPPETS.map((snip) => (
                <button
                  key={snip.label}
                  className="latex-snippet-chip"
                  onClick={() => insertSnippet(snip.latex)}
                  title={`Insert ${snip.label} (${snip.latex})`}
                >
                  {snip.label}
                </button>
              ))}
            </div>
          )}

          {/* HTML Quick Snippets */}
          {isHtmlMode && (
            <div className="latex-snippets-grid">
              {HTML_SNIPPETS.map((snip) => (
                <button
                  key={snip.label}
                  className="latex-snippet-chip html-snippet-chip"
                  onClick={() => insertSnippet(snip.code)}
                  title={`Insert ${snip.label}`}
                >
                  {snip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Streamlined Presets: Math Formula, Code Block, Important Note ONLY */}
        <div className="typo-section">
          <span className="typo-section-label">SPECIAL PRESETS</span>
          <div className="three-presets-grid">
            {PRESETS.map((p) => (
              <button
                key={p.preset}
                className={`typo-preset-btn ${activePreset === p.preset ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
                title={`Apply ${p.label}`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Windows Font Library */}
        <div className="typo-section">
          <span className="typo-section-label">WINDOWS FONT LIBRARY</span>
          <select
            className="typo-font-select"
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              textareaRef.current?.focus();
            }}
          >
            {fontGroups.map(([category, fonts]) => (
              <optgroup key={category} label={category}>
                {fonts.map((f) => (
                  <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
                    {f.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* 4. Font Size & Quick Size Pills */}
        <div className="typo-section">
          <span className="typo-section-label">FONT SIZE & STYLES</span>
          <div className="typo-controls-row">
            <div className="typo-size-group">
              <button
                className="typo-stepper-btn"
                onClick={() => {
                  setFontSize((prev) => Math.max(12, prev - 2));
                  textareaRef.current?.focus();
                }}
                title="Decrease font size"
              >
                −
              </button>
              <input
                type="number"
                className="typo-size-input"
                min={12}
                max={160}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
              <button
                className="typo-stepper-btn"
                onClick={() => {
                  setFontSize((prev) => Math.min(160, prev + 2));
                  textareaRef.current?.focus();
                }}
                title="Increase font size"
              >
                +
              </button>
            </div>

            <div className="typo-style-buttons">
              <button
                className={`typo-icon-btn ${fontWeight >= 600 ? 'active' : ''}`}
                onClick={() => {
                  setFontWeight((prev) => (prev >= 600 ? 400 : 700));
                  textareaRef.current?.focus();
                }}
                title="Bold (Ctrl+B)"
              >
                <b>B</b>
              </button>
              <button
                className={`typo-icon-btn ${fontStyle === 'italic' ? 'active' : ''}`}
                onClick={() => {
                  setFontStyle((prev) => (prev === 'italic' ? 'normal' : 'italic'));
                  textareaRef.current?.focus();
                }}
                title="Italic (Ctrl+I)"
              >
                <i>I</i>
              </button>
              <button
                className={`typo-icon-btn ${textDecoration === 'underline' ? 'active' : ''}`}
                onClick={() => {
                  setTextDecoration((prev) => (prev === 'underline' ? 'none' : 'underline'));
                  textareaRef.current?.focus();
                }}
                title="Underline (Ctrl+U)"
              >
                <u>U</u>
              </button>
            </div>
          </div>

          {/* 1-Click Font Size Pills */}
          <div className="typo-quick-sizes-row">
            <span className="quick-sizes-title">Quick Sizes:</span>
            {QUICK_FONT_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                className={`typo-quick-size-btn ${fontSize === sz ? 'active' : ''}`}
                onClick={() => {
                  setFontSize(sz);
                  textareaRef.current?.focus();
                }}
                title={`Set font size to ${sz}px`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Line Spacing Options */}
        <div className="typo-section">
          <span className="typo-section-label">LINE SPACING</span>
          <div className="typo-line-spacing-row" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((lh) => (
              <button
                key={lh}
                type="button"
                className={`typo-line-spacing-btn ${Math.abs(lineHeight - lh) < 0.05 ? 'active' : ''}`}
                onClick={() => {
                  setLineHeight(lh);
                  textareaRef.current?.focus();
                }}
                title={`Set Line Spacing to ${lh.toFixed(1)}x`}
                style={{
                  flex: '1 1 auto',
                  minWidth: '42px',
                  padding: '5px 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: Math.abs(lineHeight - lh) < 0.05 ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: Math.abs(lineHeight - lh) < 0.05 ? 'rgba(56, 189, 248, 0.22)' : 'rgba(15, 23, 42, 0.55)',
                  color: Math.abs(lineHeight - lh) < 0.05 ? '#38bdf8' : '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {lh.toFixed(1)}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Paragraph Alignment */}
        <div className="typo-section">
          <span className="typo-section-label">ALIGNMENT</span>
          <div className="typo-align-row">
            <button
              className={`typo-align-btn ${textAlign === 'left' ? 'active' : ''}`}
              onClick={() => {
                setTextAlign('left');
                textareaRef.current?.focus();
              }}
              title="Align Left"
            >
              ⇤ Left
            </button>
            <button
              className={`typo-align-btn ${textAlign === 'center' ? 'active' : ''}`}
              onClick={() => {
                setTextAlign('center');
                textareaRef.current?.focus();
              }}
              title="Align Center"
            >
              ≡ Center
            </button>
            <button
              className={`typo-align-btn ${textAlign === 'right' ? 'active' : ''}`}
              onClick={() => {
                setTextAlign('right');
                textareaRef.current?.focus();
              }}
              title="Align Right"
            >
              ⇥ Right
            </button>
          </div>
        </div>

        {/* 6. Color Selection & Color Picker */}
        <div className="typo-section">
          <span className="typo-section-label">INK COLOR & PICKER</span>
          <div className="typo-colors-row">
            {[
              { val: '#ffffff', label: 'White' },
              { val: '#facc15', label: 'Yellow' },
              { val: '#38bdf8', label: 'Cyan' },
              { val: '#4ade80', label: 'Emerald' },
              { val: '#f87171', label: 'Coral' },
              { val: '#c084fc', label: 'Purple' },
              { val: '#fb923c', label: 'Orange' },
              { val: '#94a3b8', label: 'Slate' },
              { val: '#0f172a', label: 'Dark' },
            ].map((c) => (
              <button
                key={c.val}
                className={`typo-color-swatch ${color === c.val ? 'active' : ''}`}
                style={{ backgroundColor: c.val }}
                onClick={() => {
                  setColor(c.val);
                  textareaRef.current?.focus();
                }}
                title={c.label}
              />
            ))}

            {/* Custom Color Picker Trigger Button */}
            <div className="custom-color-picker-wrapper" title="Open Color Picker">
              <button
                type="button"
                className="custom-color-picker-trigger"
                onClick={() => colorPickerInputRef.current?.click()}
                style={{
                  background: color,
                  boxShadow: `0 0 6px ${color}55`,
                }}
                title="Pick custom color"
              >
                🎨
              </button>
              <input
                ref={colorPickerInputRef}
                type="color"
                className="hidden-color-input"
                value={color.startsWith('#') && color.length === 7 ? color : '#ffffff'}
                onChange={(e) => {
                  setColor(e.target.value);
                  textareaRef.current?.focus();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
