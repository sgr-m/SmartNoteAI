/**
 * PenFlyout — Smartboard pen settings popup (Reference Image 2)
 * Matches the exact layout, color grid, thickness slider, and pen tray.
 * Color palette is placed on the right side of the pen menu to eliminate wasted space.
 */

import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { PenType } from '../../shared/types';
import './PenFlyout.css';

interface PenFlyoutProps {
  onClose: () => void;
}

interface PenTypeOption {
  type: PenType;
  label: string;
  desc: string;
  renderIcon: () => React.ReactElement;
}

const COLOR_TILES: string[] = [
  '#ff0000', '#ff7f00', '#ffbb00', // Red, Orange, Amber
  '#38d948', '#2222dd', '#2868ff', // Green, Indigo, Royal Blue
  '#17a2b8', '#e83e8c', '#1e7e34', // Teal, Magenta, Forest Green
  '#000000', '#888888', '#ffffff', // Black, Gray, White
  '#9966ff', '#00e5ff',            // Lilac, Cyan
];

const PEN_TYPES: PenTypeOption[] = [
  {
    type: 'normal',
    label: 'Pen / Hard Pen',
    desc: 'The standard pen for regular, solid-stroke writing, drawing, and diagramming.',
    renderIcon: () => (
      <div className="pen-graphic pencil-graphic">
        <div className="pencil-tip" />
        <div className="pencil-body" />
      </div>
    ),
  },
  {
    type: 'calligraphy',
    label: 'Paint Brush / Calligraphy Brush',
    desc: 'An expressive paint and calligraphy brush with dynamic stroke thickness responding to curves and stylus pressure.',
    renderIcon: () => (
      <div className="pen-graphic calligraphy-graphic">
        <div className="calligraphy-tip" />
        <div className="calligraphy-ferrule" />
        <div className="calligraphy-handle" />
      </div>
    ),
  },
  {
    type: 'highlighter',
    label: 'Highlighter',
    desc: 'A semi-transparent chisel-tip marker used to emphasize text or background areas without obscuring underlying content.',
    renderIcon: () => (
      <div className="pen-graphic highlighter-graphic">
        <div className="highlighter-tip" />
        <div className="highlighter-body" />
      </div>
    ),
  },
  {
    type: 'brush',
    label: 'Art Brush / Watercolor Brush',
    desc: 'An artistic brush for painting, expressive handwriting, and creative artwork.',
    renderIcon: () => (
      <div className="pen-graphic flatbrush-graphic">
        <div className="flatbrush-tip" />
        <div className="flatbrush-ferrule" />
        <div className="flatbrush-handle" />
      </div>
    ),
  },
  {
    type: 'laser',
    label: 'Laser Pen',
    desc: 'A presentation pointer tool that leaves temporary, glowing trails or highlights that automatically fade away after a few seconds.',
    renderIcon: () => (
      <div className="pen-graphic laser-graphic">
        <div className="laser-beam" />
        <div className="laser-barrel" />
      </div>
    ),
  },
  {
    type: 'magic',
    label: 'Magic Pen / Smart Pen',
    desc: 'An interactive tool used for special effects, gestures (such as drawing a circle to zoom/spotlight or drawing a square to open a magnification window), and shape recognition.',
    renderIcon: () => (
      <div className="pen-graphic magic-graphic">
        <div className="magic-star">★</div>
        <div className="magic-wand" />
      </div>
    ),
  },
  {
    type: 'pattern',
    label: 'Texture Pen / Pattern Pen',
    desc: 'A decorative pen that writes using textured, patterned, or custom artistic stroke fills instead of solid colors.',
    renderIcon: () => (
      <div className="pen-graphic pattern-graphic">
        <div className="pattern-eraser" />
        <div className="pattern-body" />
      </div>
    ),
  },
];

export function PenFlyout({ onClose }: PenFlyoutProps): React.ReactElement {
  const { toolState, setPenStyle, setActiveTool } = useAppContext();
  const currentStyle = toolState.penStyle;
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const activePenOption = PEN_TYPES.find((p) => p.type === currentStyle.penType) || PEN_TYPES[0];

  const handleSelectPenType = (type: PenType) => {
    setPenStyle({ penType: type });
    setActiveTool('pen');
  };

  const handleSelectColor = (color: string) => {
    setPenStyle({ color });
  };

  return (
    <div className="smartboard-pen-flyout" role="dialog" aria-label="Pen Settings">
      {/* Top Black Header Bar */}
      <div className="flyout-header-bar">
        <span className="flyout-title">{activePenOption.label}</span>
        <button className="flyout-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="flyout-body flyout-split-layout">
        {/* Left Column: Thickness slider & preview on top, pen tray below */}
        <div className="flyout-left-column">
          <div className="thickness-row">
            <div className="slider-track-wrapper">
              <input
                type="range"
                className="metallic-slider"
                min={1}
                max={48}
                value={currentStyle.width}
                onChange={(e) => setPenStyle({ width: Number(e.target.value) })}
                aria-label="Stroke Thickness"
              />
            </div>
            <div className="thickness-val-badge">{currentStyle.width}px</div>
            <div className="preview-circle-container">
              <div className="preview-circle-checkered">
                <div
                  className="preview-circle-dot"
                  style={{
                    width: Math.min(36, Math.max(3, currentStyle.width)),
                    height: Math.min(36, Math.max(3, currentStyle.width)),
                    backgroundColor: currentStyle.color,
                    opacity: currentStyle.opacity,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recessed Pen Tray with 7 Realistic Pens */}
          <div className="pen-tray-recessed">
            {PEN_TYPES.map((p) => (
              <button
                key={p.type}
                className={`pen-tray-item ${currentStyle.penType === p.type ? 'active' : ''}`}
                onClick={() => handleSelectPenType(p.type)}
                title={`${p.label}\n${p.desc}`}
              >
                {p.renderIcon()}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Full-Height Color Palette */}
        <div className="flyout-right-palette-column">
          <div className="color-grid-full-height">
            {COLOR_TILES.map((c) => (
              <button
                key={c}
                className={`color-tile-btn ${currentStyle.color.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => handleSelectColor(c)}
                title={c}
              />
            ))}

            {/* Eyedropper / Custom Color Tile */}
            <button
              className="color-tile-btn eyedropper-tile"
              onClick={() => colorPickerRef.current?.click()}
              title="Custom Color"
            >
              <span>🧪</span>
              <input
                ref={colorPickerRef}
                type="color"
                value={currentStyle.color}
                onChange={(e) => handleSelectColor(e.target.value)}
                style={{ display: 'none' }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom callout pointer arrow */}
      <div className="pen-flyout-pointer" />
    </div>
  );
}
