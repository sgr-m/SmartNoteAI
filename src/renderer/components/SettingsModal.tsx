/**
 * SettingsModal — Preferences and Plugin Management (Section 4.2 #10)
 * Themes, Toolbar position, Stylus smoothing, Autosave, Plugins
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps): React.ReactElement {
  const { toolState, setPenStyle } = useAppContext();
  const [activeTab, setActiveTab] = useState<'general' | 'stylus' | 'plugins'>('general');

  // Local settings state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toolbarPosition, setToolbarPosition] = useState<'bottom' | 'top' | 'side'>('bottom');
  const [autosaveMinutes, setAutosaveMinutes] = useState(3);
  const [smoothing, setSmoothing] = useState(toolState.penStyle.smoothing || 0.7);
  const [pressureSensitivity, setPressureSensitivity] = useState(toolState.penStyle.pressureSensitive);
  const [palmRejection, setPalmRejection] = useState(true);

  const handleSave = () => {
    setPenStyle({
      smoothing,
      pressureSensitive: pressureSensitivity,
    });
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    onClose();
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <div className="settings-title-group">
            <span className="settings-icon">⚙️</span>
            <div>
              <h3>Application Settings & Plugins</h3>
              <p>Configure stylus dynamics, workspace layout, and extensions</p>
            </div>
          </div>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            🎨 Workspace & Display
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'stylus' ? 'active' : ''}`}
            onClick={() => setActiveTab('stylus')}
          >
            ✏️ Stylus & Drawing Engine
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'plugins' ? 'active' : ''}`}
            onClick={() => setActiveTab('plugins')}
          >
            🔌 Plugins & Extensions
          </button>
        </div>

        {/* Content */}
        <div className="settings-body">
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="setting-row">
                <div>
                  <div className="setting-label">Interface Theme</div>
                  <div className="setting-desc">Switch between modern classroom dark and light themes</div>
                </div>
                <select
                  className="setting-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                >
                  <option value="dark">Dark Theme (Eye Comfort)</option>
                  <option value="light">Light Theme (Classic Whiteboard)</option>
                </select>
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Toolbar Docking Location</div>
                  <div className="setting-desc">Place smartboard tools at bottom (recommended), top, or side</div>
                </div>
                <select
                  className="setting-select"
                  value={toolbarPosition}
                  onChange={(e) => setToolbarPosition(e.target.value as 'bottom' | 'top' | 'side')}
                >
                  <option value="bottom">Bottom Dock (Reference Standard)</option>
                  <option value="top">Top Dock</option>
                  <option value="side">Left Side Dock</option>
                </select>
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Automatic Background Lesson Recovery</div>
                  <div className="setting-desc">Save emergency backups periodically to prevent data loss</div>
                </div>
                <select
                  className="setting-select"
                  value={autosaveMinutes}
                  onChange={(e) => setAutosaveMinutes(Number(e.target.value))}
                >
                  <option value={1}>Every 1 minute</option>
                  <option value={3}>Every 3 minutes (Default)</option>
                  <option value={5}>Every 5 minutes</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'stylus' && (
            <div className="settings-section">
              <div className="setting-row">
                <div>
                  <div className="setting-label">Stroke Smoothing & Interpolation</div>
                  <div className="setting-desc">Catmull-Rom spline curve smoothing level (0 to 1)</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={smoothing}
                    onChange={(e) => setSmoothing(Number(e.target.value))}
                  />
                  <span style={{ fontSize: 13, color: '#38bdf8', minWidth: 32 }}>
                    {Math.round(smoothing * 100)}%
                  </span>
                </div>
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Stylus Hardware Pressure Sensitivity</div>
                  <div className="setting-desc">Map pen tip pressure to dynamic stroke width</div>
                </div>
                <input
                  type="checkbox"
                  checked={pressureSensitivity}
                  onChange={(e) => setPressureSensitivity(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              <div className="setting-row">
                <div>
                  <div className="setting-label">Hardware Palm Rejection</div>
                  <div className="setting-desc">Ignore accidental touch touches while active pen is detected</div>
                </div>
                <input
                  type="checkbox"
                  checked={palmRejection}
                  onChange={(e) => setPalmRejection(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'plugins' && (
            <div className="settings-section">
              <div className="plugin-card">
                <div className="plugin-info">
                  <h4>LaTeX Math Engine</h4>
                  <p>Render complex mathematical equations and expressions on canvas</p>
                  <span className="plugin-status enabled">Enabled (Core)</span>
                </div>
              </div>

              <div className="plugin-card" style={{ marginTop: 12 }}>
                <div className="plugin-info">
                  <h4>Cloud Backup Sync</h4>
                  <p>Automatic synchronisation with Google Drive and OneDrive</p>
                  <span className="plugin-status disabled">Available</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
