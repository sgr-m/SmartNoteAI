import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BackgroundType, PageBackground, PageDimensionPreset } from '../../shared/types';
import './BackgroundModal.css';

interface BackgroundModalProps {
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Dark Studio', color: '#1a1a2e', textColor: '#ffffff' },
  { name: 'Chalkboard Green', color: '#1b4332', textColor: '#ffffff' },
  { name: 'Deep Navy', color: '#0f172a', textColor: '#ffffff' },
  { name: 'Classic White', color: '#ffffff', textColor: '#0f172a' },
  { name: 'Warm Cream', color: '#fefae0', textColor: '#283618' },
  { name: 'Charcoal', color: '#2b2d42', textColor: '#edf2f4' },
];

const DIMENSION_PRESETS: { id: PageDimensionPreset; name: string; width: number; height: number }[] = [
  { id: 'fullscreen', name: 'Fullscreen (Native Screen / Entire Board - Default)', width: 0, height: 0 },
  { id: '16:9', name: '16:9 Widescreen (1920×1080)', width: 1920, height: 1080 },
  { id: '16:10', name: '16:10 Presentation (1920×1200)', width: 1920, height: 1200 },
  { id: '4:3', name: '4:3 Standard Classroom (1600×1200)', width: 1600, height: 1200 },
  { id: 'a4-portrait', name: 'A4 Portrait (2480×3508)', width: 2480, height: 3508 },
  { id: 'a4-landscape', name: 'A4 Landscape (3508×2480)', width: 3508, height: 2480 },
  { id: 'custom', name: 'Custom Dimensions', width: 1920, height: 1080 },
];

function toValidHex(color: string): string {
  if (!color) return '#1a1a2e';
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return '#' + trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3];
  }
  return '#1a1a2e';
}

export function BackgroundModal({ onClose }: BackgroundModalProps): React.ReactElement {
  const { docState, docDispatch, setToastMessage } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;
  const currentPage = docState.lesson.pages[currentPageIndex];

  const currentBg = currentPage?.background || { type: 'blank', color: '#1a1a2e' };

  const [bgType, setBgType] = useState<BackgroundType>(currentBg.type || 'blank');
  const [bgColor, setBgColor] = useState<string>(currentBg.color || '#1a1a2e');
  const [customHexInput, setCustomHexInput] = useState<string>(currentBg.color || '#1a1a2e');
  const [gridSize, setGridSize] = useState<number>(currentBg.gridSize || 32);
  const [lineColor, setLineColor] = useState<string>(currentBg.lineColor || 'rgba(108, 99, 255, 0.2)');
  const [imageUrl, setImageUrl] = useState<string>(currentBg.imageUrl || '');

  const [dimPreset, setDimPreset] = useState<PageDimensionPreset>(() => {
    const w = currentPage?.width || 1920;
    const h = currentPage?.height || 1080;
    const sw = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1920;
    const sh = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1080;
    if (w === sw && h === sh) return 'fullscreen';
    const match = DIMENSION_PRESETS.find((p) => p.id !== 'fullscreen' && p.width === w && p.height === h);
    return match ? match.id : 'fullscreen';
  });
  const [pageWidth, setPageWidth] = useState<number>(() => {
    if (currentPage?.width) return currentPage.width;
    return typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1920;
  });
  const [pageHeight, setPageHeight] = useState<number>(() => {
    if (currentPage?.height) return currentPage.height;
    return typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1080;
  });
  const [applyToAll, setApplyToAll] = useState<boolean>(false);

  const handlePresetSelect = (presetId: PageDimensionPreset) => {
    setDimPreset(presetId);
    if (presetId === 'fullscreen') {
      const sw = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1920;
      const sh = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1080;
      setPageWidth(sw);
      setPageHeight(sh);
    } else {
      const p = DIMENSION_PRESETS.find((dp) => dp.id === presetId);
      if (p && presetId !== 'custom') {
        setPageWidth(p.width);
        setPageHeight(p.height);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setBgType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    const finalColor = bgColor.trim() || '#1a1a2e';
    const newBackground: PageBackground = {
      type: bgType,
      color: finalColor,
      gridSize,
      lineColor,
      imageUrl: bgType === 'image' ? imageUrl : undefined,
    };

    if (applyToAll) {
      docState.lesson.pages.forEach((_, idx) => {
        docDispatch({ type: 'SET_PAGE_BACKGROUND', pageIndex: idx, background: newBackground });
        docDispatch({ type: 'SET_PAGE_DIMENSIONS', pageIndex: idx, width: pageWidth, height: pageHeight });
      });
      setToastMessage?.('Background and dimensions applied to all pages');
    } else {
      docDispatch({ type: 'SET_PAGE_BACKGROUND', pageIndex: currentPageIndex, background: newBackground });
      docDispatch({ type: 'SET_PAGE_DIMENSIONS', pageIndex: currentPageIndex, width: pageWidth, height: pageHeight });
      setToastMessage?.(`Page ${currentPageIndex + 1} background updated`);
    }

    onClose();
  };

  const isPresetColor = COLOR_PRESETS.some((p) => p.color.toLowerCase() === bgColor.toLowerCase());
  const safeHex = toValidHex(bgColor);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="background-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Page Background & Setup">
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon">🎨</span>
            <h3>Canvas Background & Page Dimensions</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="background-modal-content">
          {/* Section 1: Background Style */}
          <div className="bg-section">
            <label className="bg-section-label">Background Pattern</label>
            <div className="bg-type-grid">
              <button
                className={`bg-type-btn ${bgType === 'blank' ? 'active' : ''}`}
                onClick={() => setBgType('blank')}
              >
                <div className="bg-preview-swatch swatch-solid" style={{ backgroundColor: bgColor }} />
                <span>Plain / Solid</span>
              </button>
              <button
                className={`bg-type-btn ${bgType === 'ruled' ? 'active' : ''}`}
                onClick={() => setBgType('ruled')}
              >
                <div className="bg-preview-swatch swatch-ruled" style={{ backgroundColor: bgColor }} />
                <span>Ruled Paper</span>
              </button>
              <button
                className={`bg-type-btn ${bgType === 'grid' ? 'active' : ''}`}
                onClick={() => setBgType('grid')}
              >
                <div className="bg-preview-swatch swatch-grid" style={{ backgroundColor: bgColor }} />
                <span>Graph Grid</span>
              </button>
              <button
                className={`bg-type-btn ${bgType === 'dotted' ? 'active' : ''}`}
                onClick={() => setBgType('dotted')}
              >
                <div className="bg-preview-swatch swatch-dotted" style={{ backgroundColor: bgColor }} />
                <span>Dotted Grid</span>
              </button>
              <button
                className={`bg-type-btn ${bgType === 'image' ? 'active' : ''}`}
                onClick={() => setBgType('image')}
              >
                <div className="bg-preview-swatch swatch-image">
                  {imageUrl ? <img src={imageUrl} alt="preview" /> : '🖼️'}
                </div>
                <span>Custom Image</span>
              </button>
            </div>
          </div>

          {/* Section 2: Colors */}
          <div className="bg-section">
            <label className="bg-section-label">Background Color</label>
            <div className="color-preset-row">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.color}
                  className={`color-preset-btn ${bgColor.toLowerCase() === p.color.toLowerCase() ? 'selected' : ''}`}
                  style={{ backgroundColor: p.color, color: p.textColor }}
                  onClick={() => {
                    setBgColor(p.color);
                    setCustomHexInput(p.color);
                    if (bgType === 'image') setBgType('blank');
                  }}
                  title={p.name}
                >
                  {bgColor.toLowerCase() === p.color.toLowerCase() && '✓'}
                </button>
              ))}

              <label
                htmlFor="bg-native-custom-color"
                className={`custom-color-input-wrapper ${!isPresetColor ? 'selected' : ''}`}
                title="Click to open Color Picker or type Hex code"
              >
                <div className="custom-color-preview-dot" style={{ backgroundColor: safeHex }} />
                <input
                  id="bg-native-custom-color"
                  type="color"
                  value={safeHex}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBgColor(val);
                    setCustomHexInput(val);
                    if (bgType === 'image') setBgType('blank');
                  }}
                  className="native-color-picker"
                />
                <span className="picker-label">🎨 Custom:</span>
                <input
                  type="text"
                  value={customHexInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomHexInput(val);
                    if (/^#[0-9a-fA-F]{6}$/.test(val) || /^#[0-9a-fA-F]{3}$/.test(val)) {
                      setBgColor(val);
                      if (bgType === 'image') setBgType('blank');
                    }
                  }}
                  placeholder="#1a1a2e"
                  className="custom-hex-text-input"
                  onClick={(e) => e.stopPropagation()}
                />
              </label>
            </div>
          </div>

          {/* Section 3: Pattern Settings (if ruled, grid, dotted) */}
          {(bgType === 'ruled' || bgType === 'grid' || bgType === 'dotted') && (
            <div className="bg-section">
              <label className="bg-section-label">Grid Spacing ({gridSize}px)</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="16"
                  max="96"
                  step="8"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="bg-range-slider"
                />
                <div className="spacing-preset-buttons">
                  {[24, 32, 48, 64].map((sz) => (
                    <button
                      key={sz}
                      className={`spacing-btn ${gridSize === sz ? 'active' : ''}`}
                      onClick={() => setGridSize(sz)}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Image Upload (if image type) */}
          {bgType === 'image' && (
            <div className="bg-section">
              <label className="bg-section-label">Custom Image File</label>
              <div className="image-upload-box">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleImageUpload}
                  id="bg-image-upload"
                  className="hidden-file-input"
                />
                <label htmlFor="bg-image-upload" className="upload-trigger-btn">
                  📁 Choose Image from Computer...
                </label>
                {imageUrl && <span className="image-loaded-badge">✓ Custom image loaded</span>}
              </div>
            </div>
          )}

          {/* Section 5: Canvas Dimensions & Aspect Ratio */}
          <div className="bg-section">
            <label className="bg-section-label">Canvas Dimensions & Aspect Ratio</label>
            <div className="dim-preset-grid">
              {DIMENSION_PRESETS.map((dp) => (
                <button
                  key={dp.id}
                  className={`dim-preset-btn ${dimPreset === dp.id ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(dp.id)}
                >
                  <span className="dim-name">{dp.name}</span>
                </button>
              ))}
            </div>

            {dimPreset === 'custom' && (
              <div className="custom-dim-row">
                <div className="custom-dim-group">
                  <label>Width (px)</label>
                  <input
                    type="number"
                    min="800"
                    max="7680"
                    step="10"
                    value={pageWidth}
                    onChange={(e) => setPageWidth(Math.max(640, Number(e.target.value)))}
                    className="dim-number-input"
                  />
                </div>
                <span className="dim-times">×</span>
                <div className="custom-dim-group">
                  <label>Height (px)</label>
                  <input
                    type="number"
                    min="600"
                    max="4320"
                    step="10"
                    value={pageHeight}
                    onChange={(e) => setPageHeight(Math.max(480, Number(e.target.value)))}
                    className="dim-number-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Apply Scope */}
          <div className="apply-scope-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
              />
              <span className="checkbox-label">Apply background and dimensions to all pages in this lesson</span>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save-bg" onClick={handleApply}>Apply Changes</button>
        </div>
      </div>
    </div>
  );
}
