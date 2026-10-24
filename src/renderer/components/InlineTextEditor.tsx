/**
 * InlineTextEditor.tsx — Direct On-Board Text Typing & Right-Side Typography/LaTeX Inspector
 * Allows direct typing on the whiteboard canvas with real-time typography styling and KaTeX formula support.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { TextPreset, TextObject } from '../../shared/types';
import { getAvailableFonts } from '../services/fontService';
import {
  isLatexSyntax,
  renderLatexHtml,
  autoFormatLatexFractions,
  autoFormatMathOperators,
  measureLatexSize,
} from '../services/latexService';
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

const PRESETS: TextPresetConfig[] = [
  { preset: 'title', label: 'Title', fontSize: 40, fontWeight: 700, color: '#ffffff', backgroundColor: 'transparent', fontFamily: '"Segoe UI", sans-serif', icon: '🏷️' },
  { preset: 'subtitle', label: 'Subtitle', fontSize: 28, fontWeight: 600, color: '#94a3b8', backgroundColor: 'transparent', fontFamily: '"Segoe UI", sans-serif', icon: '🔖' },
  { preset: 'heading', label: 'Heading', fontSize: 24, fontWeight: 700, color: '#38bdf8', backgroundColor: 'transparent', fontFamily: '"Segoe UI", sans-serif', icon: '📌' },
  { preset: 'body', label: 'Body Text', fontSize: 20, fontWeight: 400, color: '#e2e8f0', backgroundColor: 'transparent', fontFamily: 'Calibri, sans-serif', icon: '📝' },
  { preset: 'formula', label: 'Math Formula', fontSize: 24, fontWeight: 600, color: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.08)', fontFamily: '"Cambria Math", serif', icon: '∑', isLatex: true },
  { preset: 'definition', label: 'Definition', fontSize: 18, fontWeight: 500, color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.08)', fontFamily: 'Cambria, serif', icon: '📖' },
  { preset: 'important', label: 'Important Note', fontSize: 19, fontWeight: 600, color: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.1)', fontFamily: '"Segoe UI", sans-serif', icon: '⭐' },
  { preset: 'code', label: 'Code Block', fontSize: 16, fontWeight: 400, color: '#34d399', backgroundColor: '#0f172a', fontFamily: '"Cascadia Code", monospace', icon: '💻' },
];

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
  const [fontSize, setFontSize] = useState(initialText?.fontSize ?? 22);
  const [fontWeight, setFontWeight] = useState(initialText?.fontWeight ?? 400);
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(initialText?.fontStyle ?? 'normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>(initialText?.textDecoration ?? 'none');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(initialText?.textAlign ?? 'left');
  const [color, setColor] = useState(initialText?.color ?? '#ffffff');
  const [backgroundColor, setBackgroundColor] = useState(initialText?.backgroundColor ?? 'transparent');
  const [isLatexMode, setIsLatexMode] = useState<boolean>(initialText?.isLatex ?? (initialText ? isLatexSyntax(initialText.content) : false));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorBoxRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  // Real-time KaTeX formula rendering
  const latexPreview = useMemo(() => {
    if (!isLatexMode && !isLatexSyntax(content)) return null;
    return renderLatexHtml(content || 'E = mc^2', true);
  }, [content, isLatexMode]);

  // Commit text to canvas document
  const handleCommit = useCallback(() => {
    if (!content.trim()) {
      onClose();
      return;
    }

    const isLatex = isLatexMode || isLatexSyntax(content);
    const normalizedContent = isLatex ? autoFormatLatexFractions(autoFormatMathOperators(content)) : content;
    let estimatedWidth: number;
    let estimatedHeight: number;

    if (isLatex) {
      const measured = measureLatexSize(normalizedContent, fontSize);
      estimatedWidth = measured.width;
      estimatedHeight = measured.height;
    } else {
      const linesCount = normalizedContent.split('\n').length;
      estimatedWidth = Math.max(140, Math.min(1000, content.length * (fontSize * 0.65) + 30));
      estimatedHeight = Math.max(44, fontSize * linesCount * 1.35 + 20);
    }

    onSave({
      x: initialPoint.x,
      y: initialPoint.y,
      content: normalizedContent,
      preset: activePreset,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      color,
      backgroundColor,
      width: isLatex ? estimatedWidth : (initialText?.width || estimatedWidth),
      height: isLatex ? estimatedHeight : (initialText?.height || estimatedHeight),
      opacity: 1,
      rotation: initialText?.rotation || 0,
      locked: false,
      layerId: initialText?.layerId || 'objects',
      isLatex,
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
    isLatexMode,
    onSave,
    onClose,
  ]);

  // Click outside to commit: "when it select somewhere else the popup must disappear"
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const timer = setTimeout(() => {
      const handleDocumentClick = (e: MouseEvent | PointerEvent) => {
        const target = e.target as Node;
        if (
          editorBoxRef.current &&
          !editorBoxRef.current.contains(target) &&
          sidebarRef.current &&
          !sidebarRef.current.contains(target)
        ) {
          handleCommit();
        }
      };

      // Use pointerdown with capture so clicking elsewhere commits and closes immediately
      window.addEventListener('pointerdown', handleDocumentClick, { capture: true });
      cleanup = () => window.removeEventListener('pointerdown', handleDocumentClick, { capture: true });
    }, 60);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [handleCommit]);

  // Keyboard shortcut handlers (Escape commits, Ctrl+Enter commits)
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
      setContent((prev) => (prev ? `${prev} ${snippet}` : snippet));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const updated = content.substring(0, start) + snippet + content.substring(end);
    setContent(updated);
    setIsLatexMode(true);
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
    if (p.isLatex !== undefined) setIsLatexMode(p.isLatex);
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
          zIndex: 125,
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
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
            placeholder={isLatexMode ? 'Type LaTeX formula (e.g. \\frac{a}{b}, E=mc^2)...' : 'Type here on board...'}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (isLatexSyntax(e.target.value)) {
                setIsLatexMode(true);
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
            }}
            rows={1}
          />

          {/* Real-time On-Board KaTeX Formula Preview */}
          {latexPreview && (
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
                <span className="latex-badge">LaTeX Formula</span>
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

          {/* Quick inline commit button */}
          <div className="inline-board-actions">
            <button
              className="inline-commit-btn"
              onClick={handleCommit}
              title="Commit text to board (Esc or Ctrl+Enter)"
            >
              ✓ Done
            </button>
          </div>
        </div>
      </div>

      {/* ─── Part 2: Right-Side Typography & Formula Toolbar ─── */}
      <div
        ref={sidebarRef}
        className="board-typography-sidebar"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="typo-sidebar-header">
          <div className="typo-sidebar-title">
            <span className="typo-icon">Aa</span>
            <span>Typography & Math</span>
          </div>
          <button className="typo-done-btn" onClick={handleCommit} title="Finish & Commit (Esc)">
            ✓ Done
          </button>
        </div>

        {/* 1. LaTeX Formula Mode Toggle & Snippets */}
        <div className="typo-section">
          <div className="typo-section-header">
            <span className="typo-section-label">MATH & FORMULAS (LATEX)</span>
            <label className="latex-toggle-label">
              <input
                type="checkbox"
                checked={isLatexMode}
                onChange={(e) => setIsLatexMode(e.target.checked)}
              />
              <span className="latex-toggle-text">LaTeX Mode</span>
            </label>
          </div>

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
        </div>

        {/* 2. Style Preset Badges */}
        <div className="typo-section">
          <span className="typo-section-label">QUICK PRESETS</span>
          <div className="typo-presets-grid">
            {PRESETS.map((p) => (
              <button
                key={p.preset}
                className={`typo-preset-btn ${activePreset === p.preset ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
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

        {/* 4. Font Size & Styles */}
        <div className="typo-section">
          <span className="typo-section-label">SIZE & STYLES</span>
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
        </div>

        {/* 5. Paragraph Alignment */}
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

        {/* 6. Color Selection */}
        <div className="typo-section">
          <span className="typo-section-label">INK COLOR</span>
          <div className="typo-colors-row">
            {[
              { val: '#ffffff', label: 'White' },
              { val: '#facc15', label: 'Yellow' },
              { val: '#38bdf8', label: 'Cyan' },
              { val: '#4ade80', label: 'Emerald' },
              { val: '#f87171', label: 'Coral' },
              { val: '#c084fc', label: 'Purple' },
              { val: '#fb923c', label: 'Orange' },
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
            <input
              type="color"
              className="typo-custom-color-picker"
              value={color.startsWith('#') && color.length === 7 ? color : '#ffffff'}
              onChange={(e) => {
                setColor(e.target.value);
                textareaRef.current?.focus();
              }}
              title="Custom Color"
            />
          </div>
        </div>
      </div>
    </>
  );
}
