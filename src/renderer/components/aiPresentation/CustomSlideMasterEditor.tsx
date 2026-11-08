/**
 * CustomSlideMasterEditor.tsx — Custom Slide Master & Layout Designer
 * Milestone 5: TASK Phase 2 (Custom Slide Master)
 *
 * Allows teachers to design, customize, and persist reusable educational slide layouts:
 * - Custom backgrounds, surfaces, and card themes
 * - Typography, color palettes, and high-contrast projector presets
 * - Named, typed, bounded placeholders (title, subtitle, main content, secondary content, formula, diagram)
 * - School / Department branding logo area and footer text
 * - Accent bars, dividing rules, and decorative geometric shapes
 * - Interactive 16:9 canvas layout preview with coordinate inspector
 */

import React, { useState, useMemo } from 'react';
import {
  CustomSlideMaster,
  SlidePlaceholderDefinition,
  PlaceholderContentType,
} from '../../../shared/aiPresentationTypes';
import {
  customSlideMasterService,
  BUILT_IN_MASTERS,
  DEFAULT_MASTER_THEME_ACADEMIC,
  DEFAULT_MASTER_THEME_DARK,
} from '../../services/aiPresentation/customSlideMasterService';
import { SlideThumbnailRenderer } from './SlideThumbnailRenderer';
import './CustomSlideMasterEditor.css';

export interface CustomSlideMasterEditorProps {
  isOpen: boolean;
  initialMasterId?: string;
  initialMaster?: CustomSlideMaster;
  onClose: () => void;
  onSave: (savedMaster: CustomSlideMaster) => void;
}

type EditorTab = 'theme' | 'placeholders' | 'branding';

export function CustomSlideMasterEditor({
  isOpen,
  initialMasterId,
  initialMaster: propInitialMaster,
  onClose,
  onSave,
}: CustomSlideMasterEditorProps): React.ReactElement | null {
  if (!isOpen) return null;

  // Selected or Active Master state
  const initialMaster = useMemo(() => {
    if (propInitialMaster) {
      return propInitialMaster;
    }
    if (initialMasterId) {
      return customSlideMasterService.getMasterById(initialMasterId);
    }
    return customSlideMasterService.getAllMasters()[0] || BUILT_IN_MASTERS[0];
  }, [propInitialMaster, initialMasterId]);

  const [master, setMaster] = useState<CustomSlideMaster>(() =>
    JSON.parse(JSON.stringify(initialMaster))
  );

  const [activeTab, setActiveTab] = useState<EditorTab>('placeholders');
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<string>(
    master.placeholders[0]?.id || 'title'
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const allMasters = useMemo(() => customSlideMasterService.getAllMasters(), [saveFeedback]);

  // Handle Preset Switching
  const handleSelectPreset = (presetId: string) => {
    const selected = customSlideMasterService.getMasterById(presetId);
    if (!selected) return;
    setMaster(JSON.parse(JSON.stringify(selected)));
    setSelectedPlaceholderId(selected.placeholders[0]?.id || 'title');
    setSaveFeedback(null);
  };

  // Selected placeholder definition
  const selectedPlaceholder = useMemo(() => {
    return master.placeholders.find((p) => p.id === selectedPlaceholderId);
  }, [master.placeholders, selectedPlaceholderId]);

  // Update Master Field
  const updateMasterField = <K extends keyof CustomSlideMaster>(field: K, value: CustomSlideMaster[K]) => {
    setMaster((prev) => ({ ...prev, [field]: value }));
  };

  // Update Theme Field
  const updateThemeField = (field: keyof CustomSlideMaster['theme'], value: string) => {
    setMaster((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  // Update Decoration Field
  const updateDecorationField = <K extends keyof CustomSlideMaster['decorations']>(
    field: K,
    value: CustomSlideMaster['decorations'][K]
  ) => {
    setMaster((prev) => ({
      ...prev,
      decorations: { ...prev.decorations, [field]: value },
    }));
  };

  // Update Selected Placeholder
  const updateSelectedPlaceholder = (updates: Partial<SlidePlaceholderDefinition>) => {
    if (!selectedPlaceholderId) return;
    setMaster((prev) => ({
      ...prev,
      placeholders: prev.placeholders.map((p) =>
        p.id === selectedPlaceholderId ? { ...p, ...updates } : p
      ),
    }));
  };

  // Add New Placeholder
  const handleAddPlaceholder = (type: PlaceholderContentType) => {
    const newId = `ph-${Date.now().toString().slice(-4)}`;
    let label = 'New Content Card';
    let bounds = { x: 100, y: 190, width: 840, height: 400 };

    if (type === 'formula') {
      label = 'Formula Box';
      bounds = { x: 100, y: 480, width: 840, height: 180 };
    } else if (type === 'bullet-list') {
      label = 'Key Principles List';
      bounds = { x: 980, y: 190, width: 840, height: 420 };
    } else if (type === 'callout-takeaway') {
      label = 'Classroom Analogy / Callout';
      bounds = { x: 980, y: 640, width: 840, height: 300 };
    } else if (type === 'diagram-viewport') {
      label = 'Diagram / Schematic Area';
      bounds = { x: 100, y: 190, width: 900, height: 600 };
    }

    const newPlaceholder: SlidePlaceholderDefinition = {
      id: newId,
      role: type === 'formula' ? 'formula' : 'concept-explanation',
      contentType: type,
      label,
      bounds,
      isRequired: false,
      defaultPlaceholderText: `Sample content for ${label}`,
      formatting: {
        backgroundColorRole: 'card',
        borderRole: type === 'formula' ? 'accent' : 'cardBorder',
        borderRadius: 14,
        padding: 22,
        fontSize: type === 'formula' ? 26 : 18,
      },
    };

    setMaster((prev) => ({
      ...prev,
      placeholders: [...prev.placeholders, newPlaceholder],
    }));
    setSelectedPlaceholderId(newId);
  };

  // Remove Placeholder
  const handleRemovePlaceholder = (id: string) => {
    if (master.placeholders.length <= 1) return;
    setMaster((prev) => ({
      ...prev,
      placeholders: prev.placeholders.filter((p) => p.id !== id),
    }));
    const remaining = master.placeholders.filter((p) => p.id !== id);
    if (remaining.length > 0) {
      setSelectedPlaceholderId(remaining[0].id);
    }
  };

  // Save Master
  const handleSave = () => {
    const saved = customSlideMasterService.saveMaster(master);
    setSaveFeedback(`Master "${saved.name}" saved successfully!`);
    onSave(saved);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Clone Master as New
  const handleSaveAsNew = () => {
    const cloned = customSlideMasterService.cloneMaster(master.id, `${master.name} (Copy)`);
    setMaster(cloned);
    setSaveFeedback(`Created copy "${cloned.name}"!`);
    onSave(cloned);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  return (
    <div className="cs-master-overlay" role="dialog" aria-modal="true" aria-labelledby="cs-master-title">
      <div className="cs-master-modal">
        {/* Modal Header */}
        <div className="cs-master-header">
          <div className="cs-master-header-left">
            <span className="cs-master-icon">📐</span>
            <div>
              <h2 id="cs-master-title" className="cs-master-title">
                Custom Slide Master Designer
              </h2>
              <div className="cs-master-subtitle">
                Design custom backgrounds, branding pills, headers, and placeholders for AI generation
              </div>
            </div>
          </div>

          <div className="cs-master-header-right">
            {saveFeedback && <div className="cs-master-feedback">✓ {saveFeedback}</div>}
            <button type="button" className="cs-btn-secondary" onClick={handleSaveAsNew} title="Create a new copy">
              Save As New
            </button>
            <button type="button" className="cs-btn-primary" onClick={handleSave}>
              Save Master
            </button>
            <button type="button" className="cs-master-close-btn" onClick={onClose} aria-label="Close Editor">
              ✕
            </button>
          </div>
        </div>

        {/* Master Selector Toolbar */}
        <div className="cs-master-preset-bar">
          <div className="cs-preset-label">Active Master:</div>
          <select
            className="cs-preset-select"
            value={master.id}
            onChange={(e) => handleSelectPreset(e.target.value)}
          >
            <optgroup label="Built-in Educational Masters">
              {BUILT_IN_MASTERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Built-in)
                </option>
              ))}
            </optgroup>
            {allMasters.filter((m) => !m.isBuiltIn).length > 0 && (
              <optgroup label="Your Saved Custom Masters">
                {allMasters
                  .filter((m) => !m.isBuiltIn)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>

          <input
            type="text"
            className="cs-master-name-input"
            value={master.name}
            onChange={(e) => updateMasterField('name', e.target.value)}
            placeholder="Master Name (e.g., Oakwood Math Master)"
          />

          <div className="cs-master-tabs">
            <button
              type="button"
              className={`cs-tab-btn ${activeTab === 'placeholders' ? 'active' : ''}`}
              onClick={() => setActiveTab('placeholders')}
            >
              Placeholders ({master.placeholders.length})
            </button>
            <button
              type="button"
              className={`cs-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              Colors &amp; Theme
            </button>
            <button
              type="button"
              className={`cs-tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              Branding &amp; Footer
            </button>
          </div>
        </div>

        {/* Modal Body: Left Canvas Preview, Right Inspector */}
        <div className="cs-master-body">
          {/* Canvas Preview Viewport */}
          <div className="cs-master-viewport">
            <div className="cs-viewport-header">
              <span>Interactive 16:9 Canvas Preview (1920 × 1080)</span>
              <span className="cs-viewport-hint">Click any placeholder to inspect and position it</span>
            </div>

            <div className="cs-canvas-frame">
              <SlideThumbnailRenderer master={master} showBorder={true} />

              {/* Interactive Placeholder Overlay Highlights */}
              <div className="cs-placeholder-interactive-layer">
                {master.placeholders.map((ph) => {
                  const isSelected = ph.id === selectedPlaceholderId;
                  // Compute scale percentage relative to 1920x1080
                  const leftPct = (ph.bounds.x / 1920) * 100;
                  const topPct = (ph.bounds.y / 1080) * 100;
                  const widthPct = (ph.bounds.width / 1920) * 100;
                  const heightPct = (ph.bounds.height / 1080) * 100;

                  return (
                    <div
                      key={ph.id}
                      className={`cs-ph-overlay-box ${isSelected ? 'selected' : ''}`}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                      }}
                      onClick={() => {
                        setSelectedPlaceholderId(ph.id);
                        setActiveTab('placeholders');
                      }}
                      title={`${ph.label} (${ph.bounds.width}×${ph.bounds.height})`}
                    >
                      <div className="cs-ph-pill-tag">
                        <span>{ph.label}</span>
                        <span className="cs-ph-coords">
                          {ph.bounds.width}×{ph.bounds.height}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Inspector Panel */}
          <div className="cs-master-sidebar">
            {/* TAB 1: Placeholders */}
            {activeTab === 'placeholders' && (
              <div className="cs-inspector-section">
                <div className="cs-section-title">
                  <span>Layout Placeholders</span>
                  <div className="cs-add-ph-dropdown">
                    <select
                      className="cs-add-select"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleAddPlaceholder(e.target.value as PlaceholderContentType);
                      }}
                    >
                      <option value="">+ Add Placeholder...</option>
                      <option value="text">Text / Theory Card</option>
                      <option value="bullet-list">Key Principles List</option>
                      <option value="formula">Formula Box</option>
                      <option value="callout-takeaway">Classroom Analogy / Callout</option>
                      <option value="diagram-viewport">Diagram Viewport</option>
                    </select>
                  </div>
                </div>

                <div className="cs-ph-list">
                  {master.placeholders.map((p) => (
                    <div
                      key={p.id}
                      className={`cs-ph-item ${p.id === selectedPlaceholderId ? 'active' : ''}`}
                      onClick={() => setSelectedPlaceholderId(p.id)}
                    >
                      <div className="cs-ph-item-info">
                        <span className="cs-ph-item-name">{p.label}</span>
                        <span className="cs-ph-item-role">{p.contentType}</span>
                      </div>
                      {master.placeholders.length > 1 && (
                        <button
                          type="button"
                          className="cs-ph-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlaceholder(p.id);
                          }}
                          title="Delete placeholder"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {selectedPlaceholder && (
                  <div className="cs-ph-editor-form">
                    <div className="cs-editor-subtitle">Placeholder Properties: {selectedPlaceholder.label}</div>

                    <div className="cs-form-row">
                      <label className="cs-label">Label</label>
                      <input
                        type="text"
                        className="cs-input"
                        value={selectedPlaceholder.label}
                        onChange={(e) => updateSelectedPlaceholder({ label: e.target.value })}
                      />
                    </div>

                    <div className="cs-form-row">
                      <label className="cs-label">Content Type</label>
                      <select
                        className="cs-select"
                        value={selectedPlaceholder.contentType}
                        onChange={(e) =>
                          updateSelectedPlaceholder({ contentType: e.target.value as PlaceholderContentType })
                        }
                      >
                        <option value="title">Slide Title</option>
                        <option value="subtitle">Slide Subtitle</option>
                        <option value="text">Paragraph / Explanation</option>
                        <option value="bullet-list">Bullet Points List</option>
                        <option value="formula">Mathematical Formula</option>
                        <option value="definition">Definition Card</option>
                        <option value="callout-takeaway">Key Takeaways Callout</option>
                        <option value="diagram-viewport">Diagram / Media Viewport</option>
                      </select>
                    </div>

                    {/* Coordinate & Dimensions Controls */}
                    <div className="cs-coords-grid">
                      <div>
                        <label className="cs-coord-label">X Position</label>
                        <input
                          type="number"
                          className="cs-input"
                          value={selectedPlaceholder.bounds.x}
                          step={20}
                          onChange={(e) =>
                            updateSelectedPlaceholder({
                              bounds: { ...selectedPlaceholder.bounds, x: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="cs-coord-label">Y Position</label>
                        <input
                          type="number"
                          className="cs-input"
                          value={selectedPlaceholder.bounds.y}
                          step={20}
                          onChange={(e) =>
                            updateSelectedPlaceholder({
                              bounds: { ...selectedPlaceholder.bounds, y: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="cs-coord-label">Width</label>
                        <input
                          type="number"
                          className="cs-input"
                          value={selectedPlaceholder.bounds.width}
                          step={20}
                          onChange={(e) =>
                            updateSelectedPlaceholder({
                              bounds: { ...selectedPlaceholder.bounds, width: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="cs-coord-label">Height</label>
                        <input
                          type="number"
                          className="cs-input"
                          value={selectedPlaceholder.bounds.height}
                          step={20}
                          onChange={(e) =>
                            updateSelectedPlaceholder({
                              bounds: { ...selectedPlaceholder.bounds, height: Number(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Typography & Sizing */}
                    <div className="cs-form-row" style={{ marginTop: 12 }}>
                      <label className="cs-label">Font Size (pt)</label>
                      <input
                        type="number"
                        className="cs-input"
                        min={12}
                        max={72}
                        value={selectedPlaceholder.formatting?.fontSize || 18}
                        onChange={(e) =>
                          updateSelectedPlaceholder({
                            formatting: {
                              ...selectedPlaceholder.formatting,
                              fontSize: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Theme & Colors */}
            {activeTab === 'theme' && (
              <div className="cs-inspector-section">
                <div className="cs-section-title">Color Palette &amp; Background</div>

                <div className="cs-quick-palette-row">
                  <button
                    type="button"
                    className="cs-quick-palette-btn"
                    onClick={() => {
                      setMaster((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, ...DEFAULT_MASTER_THEME_ACADEMIC },
                      }));
                    }}
                  >
                    Academic Light
                  </button>
                  <button
                    type="button"
                    className="cs-quick-palette-btn"
                    onClick={() => {
                      setMaster((prev) => ({
                        ...prev,
                        theme: { ...prev.theme, ...DEFAULT_MASTER_THEME_DARK },
                      }));
                    }}
                  >
                    Dark Technology
                  </button>
                </div>

                <div className="cs-form-row">
                  <label className="cs-label">Slide Canvas Background</label>
                  <div className="cs-color-picker-row">
                    <input
                      type="color"
                      className="cs-color-input"
                      value={master.theme.backgroundColor}
                      onChange={(e) => updateThemeField('backgroundColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="cs-input"
                      value={master.theme.backgroundColor}
                      onChange={(e) => updateThemeField('backgroundColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="cs-form-row">
                  <label className="cs-label">Primary Accent Color</label>
                  <div className="cs-color-picker-row">
                    <input
                      type="color"
                      className="cs-color-input"
                      value={master.theme.accentColor}
                      onChange={(e) => updateThemeField('accentColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="cs-input"
                      value={master.theme.accentColor}
                      onChange={(e) => updateThemeField('accentColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="cs-form-row">
                  <label className="cs-label">Card Surface Background</label>
                  <div className="cs-color-picker-row">
                    <input
                      type="color"
                      className="cs-color-input"
                      value={master.theme.cardBackgroundColor}
                      onChange={(e) => updateThemeField('cardBackgroundColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="cs-input"
                      value={master.theme.cardBackgroundColor}
                      onChange={(e) => updateThemeField('cardBackgroundColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="cs-form-row">
                  <label className="cs-label">Card Border Color</label>
                  <div className="cs-color-picker-row">
                    <input
                      type="color"
                      className="cs-color-input"
                      value={master.theme.cardBorderColor}
                      onChange={(e) => updateThemeField('cardBorderColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="cs-input"
                      value={master.theme.cardBorderColor}
                      onChange={(e) => updateThemeField('cardBorderColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="cs-form-row">
                  <label className="cs-label">Primary Text Color</label>
                  <div className="cs-color-picker-row">
                    <input
                      type="color"
                      className="cs-color-input"
                      value={master.theme.primaryTextColor}
                      onChange={(e) => updateThemeField('primaryTextColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="cs-input"
                      value={master.theme.primaryTextColor}
                      onChange={(e) => updateThemeField('primaryTextColor', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Branding & Footer */}
            {activeTab === 'branding' && (
              <div className="cs-inspector-section">
                <div className="cs-section-title">Branding, Badges &amp; Footers</div>

                <div className="cs-checkbox-row">
                  <input
                    type="checkbox"
                    id="cb-brand-pill"
                    checked={master.decorations.hasBrandingLogo}
                    onChange={(e) => updateDecorationField('hasBrandingLogo', e.target.checked)}
                  />
                  <label htmlFor="cb-brand-pill">Enable School / Department Branding Pill</label>
                </div>

                {master.decorations.hasBrandingLogo && (
                  <div className="cs-form-row">
                    <label className="cs-label">Branding Label / School Name</label>
                    <input
                      type="text"
                      className="cs-input"
                      value={master.decorations.brandingText || ''}
                      onChange={(e) => updateDecorationField('brandingText', e.target.value)}
                      placeholder="e.g. Oakwood High School • Math Dept"
                    />
                  </div>
                )}

                <div className="cs-checkbox-row" style={{ marginTop: 14 }}>
                  <input
                    type="checkbox"
                    id="cb-accent-bar"
                    checked={master.decorations.hasAccentBar}
                    onChange={(e) => updateDecorationField('hasAccentBar', e.target.checked)}
                  />
                  <label htmlFor="cb-accent-bar">Top Accent Bar</label>
                </div>

                <div className="cs-checkbox-row" style={{ marginTop: 10 }}>
                  <input
                    type="checkbox"
                    id="cb-divider"
                    checked={master.decorations.hasHeaderDivider}
                    onChange={(e) => updateDecorationField('hasHeaderDivider', e.target.checked)}
                  />
                  <label htmlFor="cb-divider">Header Horizontal Divider</label>
                </div>

                <div className="cs-checkbox-row" style={{ marginTop: 10 }}>
                  <input
                    type="checkbox"
                    id="cb-footer"
                    checked={master.decorations.hasFooter}
                    onChange={(e) => updateDecorationField('hasFooter', e.target.checked)}
                  />
                  <label htmlFor="cb-footer">Footer Lecture Notes</label>
                </div>

                {master.decorations.hasFooter && (
                  <div className="cs-form-row">
                    <label className="cs-label">Footer Text</label>
                    <input
                      type="text"
                      className="cs-input"
                      value={master.decorations.footerText || ''}
                      onChange={(e) => updateDecorationField('footerText', e.target.value)}
                      placeholder="e.g. Classroom Presentation • Chapter 4"
                    />
                  </div>
                )}

                <div className="cs-checkbox-row" style={{ marginTop: 10 }}>
                  <input
                    type="checkbox"
                    id="cb-slide-num"
                    checked={master.decorations.showSlideNumber}
                    onChange={(e) => updateDecorationField('showSlideNumber', e.target.checked)}
                  />
                  <label htmlFor="cb-slide-num">Show Slide Numbering (Slide X of Y)</label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
