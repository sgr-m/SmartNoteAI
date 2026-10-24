/**
 * TextModal — Rich smartboard text editor and style preset selector (Section 8)
 * Location-based text creation with presets: Title, Subtitle, Heading, Definition, Formula, Code, Warning, etc.
 */

import React, { useState, useRef, useEffect } from 'react';
import { TextPreset, TextObject } from '../../shared/types';
import './TextModal.css';

interface TextModalProps {
  initialPoint: { x: number; y: number };
  initialText?: TextObject | null;
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
}

const PRESETS: TextPresetConfig[] = [
  { preset: 'title', label: 'Title', fontSize: 44, fontWeight: 700, color: '#ffffff', backgroundColor: 'transparent', fontFamily: 'Inter, sans-serif', icon: '🏷️' },
  { preset: 'subtitle', label: 'Subtitle', fontSize: 32, fontWeight: 600, color: '#a0aec0', backgroundColor: 'transparent', fontFamily: 'Inter, sans-serif', icon: '🔖' },
  { preset: 'heading', label: 'Heading', fontSize: 26, fontWeight: 700, color: '#00f2fe', backgroundColor: 'transparent', fontFamily: 'Inter, sans-serif', icon: '📌' },
  { preset: 'subheading', label: 'Subheading', fontSize: 22, fontWeight: 600, color: '#4facfe', backgroundColor: 'transparent', fontFamily: 'Inter, sans-serif', icon: '📎' },
  { preset: 'body', label: 'Body Text', fontSize: 18, fontWeight: 400, color: '#e2e8f0', backgroundColor: 'transparent', fontFamily: 'Inter, sans-serif', icon: '📝' },
  { preset: 'definition', label: 'Definition', fontSize: 18, fontWeight: 500, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fontFamily: 'Inter, sans-serif', icon: '📖' },
  { preset: 'important', label: 'Important Note', fontSize: 19, fontWeight: 600, color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)', fontFamily: 'Inter, sans-serif', icon: '⭐' },
  { preset: 'qa', label: 'Q & A', fontSize: 18, fontWeight: 500, color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fontFamily: 'Inter, sans-serif', icon: '❓' },
  { preset: 'formula', label: 'Math Formula', fontSize: 24, fontWeight: 600, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', fontFamily: 'JetBrains Mono, Courier New, monospace', icon: '∑' },
  { preset: 'code', label: 'Code Block', fontSize: 16, fontWeight: 400, color: '#4ade80', backgroundColor: '#0f172a', fontFamily: 'JetBrains Mono, Consolas, monospace', icon: '💻' },
  { preset: 'label', label: 'Label / Tag', fontSize: 14, fontWeight: 600, color: '#ffffff', backgroundColor: '#334155', fontFamily: 'Inter, sans-serif', icon: '🏷️' },
  { preset: 'warning', label: 'Warning Callout', fontSize: 18, fontWeight: 600, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', fontFamily: 'Inter, sans-serif', icon: '⚠️' },
];

export function TextModal({ initialPoint, initialText, onSave, onClose }: TextModalProps): React.ReactElement {
  const [content, setContent] = useState(initialText?.content ?? '');
  const [activePreset, setActivePreset] = useState<TextPreset>(initialText?.preset ?? 'body');
  const [fontFamily, setFontFamily] = useState(initialText?.fontFamily ?? 'Inter, sans-serif');
  const [fontSize, setFontSize] = useState(initialText?.fontSize ?? 20);
  const [fontWeight, setFontWeight] = useState(initialText?.fontWeight ?? 400);
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(initialText?.fontStyle ?? 'normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>(initialText?.textDecoration ?? 'none');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(initialText?.textAlign ?? 'left');
  const [color, setColor] = useState(initialText?.color ?? '#ffffff');
  const [backgroundColor, setBackgroundColor] = useState(initialText?.backgroundColor ?? 'transparent');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const applyPreset = (preset: TextPresetConfig) => {
    setActivePreset(preset.preset);
    setFontSize(preset.fontSize);
    setFontWeight(preset.fontWeight);
    setColor(preset.color);
    setBackgroundColor(preset.backgroundColor);
    setFontFamily(preset.fontFamily);
    if (preset.fontStyle) setFontStyle(preset.fontStyle);
  };

  const handleCommit = () => {
    if (!content.trim()) {
      onClose();
      return;
    }

    onSave({
      x: initialPoint.x,
      y: initialPoint.y,
      content,
      preset: activePreset,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      color,
      backgroundColor,
      width: Math.max(160, Math.min(800, content.length * (fontSize * 0.6))),
      height: Math.max(48, fontSize * (content.split('\n').length + 1) * 1.3),
      opacity: 1,
      rotation: 0,
      locked: false,
      layerId: 'objects',
    });
    onClose();
  };

  return (
    <div className="smartboard-text-modal-overlay" onClick={onClose}>
      <div className="smartboard-text-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="text-modal-header">
          <span className="text-modal-title">Text & Typography Inspector</span>
          <button className="text-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Preset Selector Grid */}
        <div className="text-preset-tray">
          <div className="preset-scroll-container">
            {PRESETS.map((p) => (
              <button
                key={p.preset}
                className={`preset-chip ${activePreset === p.preset ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="text-formatting-bar">
          <select
            className="format-select"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            <option value="Inter, sans-serif">Inter (Modern Clean)</option>
            <option value="Georgia, serif">Georgia (Book Serif)</option>
            <option value="'JetBrains Mono', monospace">JetBrains Mono (Code/Math)</option>
            <option value="'Comic Sans MS', cursive">Marker / Handwriting</option>
          </select>

          <div className="format-group">
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Size:</span>
            <input
              type="number"
              className="format-number-input"
              min={12}
              max={120}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>

          <div className="format-group">
            <button
              className={`format-toggle-btn ${fontWeight >= 600 ? 'active' : ''}`}
              onClick={() => setFontWeight(fontWeight >= 600 ? 400 : 700)}
              title="Bold"
            >
              <b>B</b>
            </button>
            <button
              className={`format-toggle-btn ${fontStyle === 'italic' ? 'active' : ''}`}
              onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
              title="Italic"
            >
              <i>I</i>
            </button>
            <button
              className={`format-toggle-btn ${textDecoration === 'underline' ? 'active' : ''}`}
              onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')}
              title="Underline"
            >
              <u>U</u>
            </button>
          </div>

          <div className="format-group">
            <button
              className={`format-toggle-btn ${textAlign === 'left' ? 'active' : ''}`}
              onClick={() => setTextAlign('left')}
              title="Align Left"
            >
              ⇤
            </button>
            <button
              className={`format-toggle-btn ${textAlign === 'center' ? 'active' : ''}`}
              onClick={() => setTextAlign('center')}
              title="Align Center"
            >
              ≡
            </button>
            <button
              className={`format-toggle-btn ${textAlign === 'right' ? 'active' : ''}`}
              onClick={() => setTextAlign('right')}
              title="Align Right"
            >
              ⇥
            </button>
          </div>

          <div className="format-group">
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Color:</span>
            <input
              type="color"
              className="format-color-picker"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              title="Text Color"
            />
          </div>
        </div>

        {/* Live Text Editing Area */}
        <div className="text-editor-main">
          <textarea
            ref={textareaRef}
            className="text-modal-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleCommit();
              }
            }}
            placeholder="Type lesson content, formula (e.g. E = mc²), or code... (Ctrl+Enter to finish)"
            rows={5}
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight,
              fontStyle,
              textDecoration,
              textAlign,
              color,
              backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : '#0d1117',
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="text-modal-footer">
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            Tip: Press <b>Ctrl + Enter</b> to insert text on the board
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCommit}>
              Done / Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
