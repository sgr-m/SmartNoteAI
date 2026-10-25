/**
 * ShapeFlyout — Smartboard shapes popup (Reference Image 4)
 * Matches the exact 3x5 shape grid, intelligent recognition, metallic slider, and 14 color palette.
 */

import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { ShapeType } from '../../shared/types';
import './ShapeFlyout.css';

interface ShapeFlyoutProps {
  onClose: () => void;
}

interface ShapeGridItem {
  id: string;
  type: ShapeType;
  label: string;
  renderIcon: () => React.ReactElement;
  isFillToggle?: boolean;
}

const COLOR_TILES: string[] = [
  '#ff0000', '#ff7f00', '#ffbb00', // Red, Orange, Amber
  '#38d948', '#2222dd', '#2868ff', // Green, Indigo, Royal Blue
  '#17a2b8', '#e83e8c', '#1e7e34', // Teal, Magenta, Forest Green
  '#000000', '#888888', '#ffffff', // Black, Gray, White
  '#9966ff', '#00e5ff',            // Lilac, Cyan
];

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(79, 172, 254, ${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

const SHAPE_ITEMS: ShapeGridItem[] = [
  // Row 1
  {
    id: 'recognition',
    type: 'recognition',
    label: 'Intelligent identification',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="26" height="26">
          <polygon points="6,20 10,8 24,8 28,20" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
          <text x="14" y="26" fontSize="14">👆</text>
        </svg>
      </div>
    ),
  },
  {
    id: 'circle',
    type: 'circle',
    label: 'Circle',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <circle cx="16" cy="16" r="11" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      </div>
    ),
  },
  {
    id: 'ellipse',
    type: 'ellipse',
    label: 'Ellipse',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="26" height="26">
          <ellipse cx="16" cy="16" rx="13" ry="8" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      </div>
    ),
  },
  {
    id: 'parallelogram',
    type: 'parallelogram',
    label: 'Parallelogram',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <polygon points="10,6 26,6 22,26 6,26" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      </div>
    ),
  },
  {
    id: 'rightTriangle',
    type: 'rightTriangle',
    label: 'Right Triangle',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <polygon points="6,6 6,26 26,26" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      </div>
    ),
  },

  // Row 2
  {
    id: 'trapezoid',
    type: 'trapezoid',
    label: 'Trapezoid',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <polygon points="9,8 23,8 27,24 5,24" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      </div>
    ),
  },
  {
    id: 'triangle',
    type: 'triangle',
    label: 'Triangle',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <polygon points="16,5 27,26 5,26" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      </div>
    ),
  },
  {
    id: 'rect',
    type: 'rect',
    label: 'Square / Rectangle',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <rect x="5" y="5" width="22" height="22" rx="2" fill="#90caf9" stroke="#1565c0" strokeWidth="2" />
        </svg>
      </div>
    ),
  },
  {
    id: 'polyline',
    type: 'polyline',
    label: 'Polyline',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <polyline points="6,26 13,8 19,26 26,8" fill="none" stroke="#475569" strokeWidth="2.5" />
          <circle cx="6" cy="26" r="2.5" fill="#1e293b" />
          <circle cx="13" cy="8" r="2.5" fill="#1e293b" />
          <circle cx="19" cy="26" r="2.5" fill="#1e293b" />
          <circle cx="26" cy="8" r="2.5" fill="#1e293b" />
        </svg>
      </div>
    ),
  },
  {
    id: 'dottedPolyline',
    type: 'polyline',
    label: 'Dotted Polyline',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <polyline points="6,26 13,8 19,26 26,8" fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="2,3" />
          <circle cx="6" cy="26" r="2.5" fill="#1e293b" />
          <circle cx="13" cy="8" r="2.5" fill="#1e293b" />
          <circle cx="19" cy="26" r="2.5" fill="#1e293b" />
          <circle cx="26" cy="8" r="2.5" fill="#1e293b" />
        </svg>
      </div>
    ),
  },

  // Row 3
  {
    id: 'dashed',
    type: 'line',
    label: 'Dashed Line',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <line x1="5" y1="27" x2="27" y2="5" stroke="#334155" strokeWidth="3" strokeDasharray="5,4" />
        </svg>
      </div>
    ),
  },
  {
    id: 'arc',
    type: 'arc',
    label: 'Curved Line',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <path d="M 5,26 Q 16,0 27,26" fill="none" stroke="#334155" strokeWidth="2.5" />
        </svg>
      </div>
    ),
  },
  {
    id: 'arrow',
    type: 'arrow',
    label: 'Arrow',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <line x1="6" y1="26" x2="26" y2="6" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <polygon points="18,6 26,6 26,14" fill="#334155" />
        </svg>
      </div>
    ),
  },
  {
    id: 'line',
    type: 'line',
    label: 'Straight Line',
    renderIcon: () => (
      <div className="shape-icon-svg">
        <svg viewBox="0 0 32 32" width="24" height="24">
          <line x1="6" y1="26" x2="26" y2="6" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    ),
  },
  {
    id: 'fillBucket',
    type: 'rect',
    label: 'Fill / Outline Toggle',
    isFillToggle: true,
    renderIcon: () => (
      <div className="shape-icon-svg">
        <span style={{ fontSize: 20 }}>🪣</span>
      </div>
    ),
  },
];

export function ShapeFlyout({ onClose }: ShapeFlyoutProps): React.ReactElement {
  const { shapeStyle, setShapeStyle, setActiveTool } = useAppContext();
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const activeShape = SHAPE_ITEMS.find((s) => s.type === shapeStyle.shapeType && !s.isFillToggle) || SHAPE_ITEMS[0];

  const handleSelectShape = (item: ShapeGridItem) => {
    if (item.isFillToggle) {
      // Toggle fill opacity between 0 and 0.4
      setShapeStyle({ fillOpacity: shapeStyle.fillOpacity > 0 ? 0 : 0.4 });
      return;
    }

    if (item.id === 'dashed') {
      setShapeStyle({ shapeType: 'line', strokeStyle: 'dashed' });
    } else if (item.id === 'dottedPolyline') {
      setShapeStyle({ shapeType: 'polyline', strokeStyle: 'dotted' });
    } else {
      setShapeStyle({ shapeType: item.type, strokeStyle: 'solid' });
    }
    setActiveTool('shape');
  };

  const handleSelectColor = (color: string) => {
    setShapeStyle({ strokeColor: color, fillColor: color });
  };

  return (
    <div className="smartboard-shape-flyout" role="dialog" aria-label="Shape Settings">
      {/* Top Black Header Bar */}
      <div className="flyout-header-bar">
        <span className="flyout-title">{activeShape.label}</span>
        <button className="flyout-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="flyout-body">
        {/* Top Row: Metallic Slider + Preview + Color Grid */}
        <div className="flyout-top-row">
          <div className="slider-preview-col">
            <div className="shape-slider-group">
              {/* Outline Thickness Slider */}
              <div className="shape-slider-row">
                <div className="shape-slider-label">
                  <span>Outline:</span>
                  <span className="shape-slider-val">{shapeStyle.strokeWidth}px</span>
                </div>
                <div className="slider-track-wrapper">
                  <input
                    type="range"
                    className="metallic-slider"
                    min={1}
                    max={32}
                    value={shapeStyle.strokeWidth}
                    onChange={(e) => setShapeStyle({ strokeWidth: Number(e.target.value) })}
                    aria-label="Shape Outline Thickness"
                  />
                </div>
              </div>

              {/* Fill Opacity Slider (0% to 100%) */}
              <div className="shape-slider-row">
                <div className="shape-slider-label">
                  <span>Fill Opacity:</span>
                  <span className="shape-slider-val">
                    {shapeStyle.fillOpacity === 0 ? 'Transparent (0%)' : `${Math.round(shapeStyle.fillOpacity * 100)}%`}
                  </span>
                </div>
                <div className="slider-track-wrapper">
                  <input
                    type="range"
                    className="metallic-slider"
                    min={0}
                    max={1}
                    step={0.05}
                    value={shapeStyle.fillOpacity}
                    onChange={(e) => setShapeStyle({ fillOpacity: Number(e.target.value) })}
                    aria-label="Shape Fill Opacity"
                  />
                </div>
              </div>
            </div>

            {/* Checkered Live Stroke & Fill Preview */}
            <div
              className="preview-circle-container"
              title={shapeStyle.fillOpacity === 0 ? '100% Transparent fill' : `${Math.round(shapeStyle.fillOpacity * 100)}% fill opacity`}
            >
              <div className="preview-circle-checkered">
                <div
                  className="preview-shape-demo"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: shapeStyle.shapeType === 'circle' ? '50%' : 4,
                    border: `${Math.min(5, Math.max(2, shapeStyle.strokeWidth))}px solid ${shapeStyle.strokeColor}`,
                    backgroundColor: shapeStyle.fillOpacity > 0 ? hexToRgba(shapeStyle.fillColor, shapeStyle.fillOpacity) : 'transparent',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Color Grid on Right */}
          <div className="color-grid-right">
            {COLOR_TILES.map((c) => (
              <button
                key={c}
                className={`color-tile-btn ${shapeStyle.strokeColor.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => handleSelectColor(c)}
                title={c}
              />
            ))}

            <button
              className="color-tile-btn eyedropper-tile"
              onClick={() => colorPickerRef.current?.click()}
              title="Custom Color"
            >
              <span>🧪</span>
              <input
                ref={colorPickerRef}
                type="color"
                value={shapeStyle.strokeColor}
                onChange={(e) => handleSelectColor(e.target.value)}
                style={{ display: 'none' }}
              />
            </button>
          </div>
        </div>

        {/* Recessed Tray with 15 Shapes (3 rows x 5 columns) */}
        <div className="shape-tray-recessed">
          {SHAPE_ITEMS.map((s) => {
            const isSelected =
              s.isFillToggle
                ? shapeStyle.fillOpacity > 0
                : shapeStyle.shapeType === s.type;

            return (
              <button
                key={s.id}
                className={`shape-grid-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectShape(s)}
                title={s.label}
              >
                {s.renderIcon()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom callout pointer arrow */}
      <div className="shape-flyout-pointer" />
    </div>
  );
}
