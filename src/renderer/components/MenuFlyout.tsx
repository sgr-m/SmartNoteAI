/**
 * MenuFlyout — Hierarchical smartboard menu (Reference Image 5)
 * Opens upwards from the left bottom menu button.
 * Includes File, Import, Export, Print, Teaching/Presentation Mode, Settings, Help, Exit
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { PresentationTool } from './PresentationFloatingToolbar';
import './MenuFlyout.css';

interface MenuFlyoutProps {
  onClose: () => void;
  onOpenSettings?: () => void;
  onOpenRecentLessons?: () => void;
  onOpenSubjectTools?: () => void;
  onTogglePresentationMode?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenRecordingStudio?: () => void;
  onOpenBackground?: () => void;
  onOpenLayers?: () => void;
  onOpenDocumentImport?: () => void;
  onOpenExport?: () => void;
  onActivatePresentationTool?: (tool: PresentationTool) => void;
  onToggleTimer?: () => void;
  onScreenshot?: () => void;
  onDesktop?: () => void;
  alignRight?: boolean;
}

export function MenuFlyout({
  onClose,
  onOpenSettings,
  onOpenRecentLessons,
  onOpenSubjectTools,
  onTogglePresentationMode,
  onOpenAIAssistant,
  onOpenRecordingStudio,
  onOpenBackground,
  onOpenLayers,
  onOpenDocumentImport,
  onOpenExport,
  onActivatePresentationTool,
  onToggleTimer,
  onScreenshot,
  onDesktop,
  alignRight = false,
}: MenuFlyoutProps): React.ReactElement {
  const { newLesson, openLesson, saveLesson, saveLessonAs } = useAppContext();
  const [activeTab, setActiveTab] = useState<'file' | 'mode' | 'import' | 'export' | 'settings' | 'help'>('file');

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className={`smartboard-menu-flyout ${alignRight ? 'align-right' : ''}`} role="menu">
      <div className="menu-flyout-content">
        {/* Left Column: Main Category Buttons */}
        <div className="menu-left-column">
          <button
            className={`menu-category-btn ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <div className="menu-btn-content">
              <span className="menu-btn-icon">📁</span>
              <span className="menu-btn-text">File</span>
            </div>
            <span className="menu-arrow">►</span>
          </button>

          <button
            className={`menu-category-btn ${activeTab === 'mode' ? 'active' : ''}`}
            onClick={() => setActiveTab('mode')}
          >
            <div className="menu-btn-content">
              <span className="menu-btn-icon">🎭</span>
              <span className="menu-btn-text">Teaching</span>
            </div>
            <span className="menu-arrow">►</span>
          </button>

          <button
            className={`menu-category-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <div className="menu-btn-content">
              <span className="menu-btn-icon">📥</span>
              <span className="menu-btn-text">Import</span>
            </div>
            <span className="menu-arrow">►</span>
          </button>

          <button
            className={`menu-category-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <div className="menu-btn-content">
              <span className="menu-btn-icon">📤</span>
              <span className="menu-btn-text">Export</span>
            </div>
            <span className="menu-arrow">►</span>
          </button>

          <button
            className="menu-category-btn"
            onClick={() => {
              window.print();
              onClose();
            }}
          >
            <div className="menu-btn-content">
              <span className="menu-btn-icon">🖨️</span>
              <span className="menu-btn-text">Print</span>
            </div>
          </button>

          <button
            className={`menu-category-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <div className="menu-btn-content">
              <span className="menu-btn-icon">⚙️</span>
              <span className="menu-btn-text">Settings</span>
            </div>
          </button>

          <button
            className={`menu-category-btn ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            <div className="menu-btn-content">
              <span className="menu-btn-icon">❓</span>
              <span className="menu-btn-text">Help</span>
            </div>
          </button>

          <button
            className="menu-category-btn exit-btn"
            onClick={() => {
              if (window.confirm('Save and exit SmartNoteAI?')) {
                window.close();
              }
            }}
          >
            <div className="menu-btn-content">
              <span className="menu-btn-icon">⏻</span>
              <span className="menu-btn-text">Exit</span>
            </div>
          </button>
        </div>

        {/* Right Column: Submenu Options */}
        <div className="menu-right-column">
          {activeTab === 'file' && (
            <div className="submenu-grid">
              <button className="submenu-tile-btn" onClick={() => handleAction(newLesson)}>
                <div className="submenu-icon-box">📄</div>
                <span className="submenu-label">New Lesson</span>
              </button>
              <button className="submenu-tile-btn" onClick={() => handleAction(openLesson)}>
                <div className="submenu-icon-box">📂</div>
                <span className="submenu-label">Open...</span>
              </button>
              <button className="submenu-tile-btn" onClick={() => handleAction(saveLesson)}>
                <div className="submenu-icon-box">💾</div>
                <span className="submenu-label">Save</span>
              </button>
              <button className="submenu-tile-btn" onClick={() => handleAction(saveLessonAs)}>
                <div className="submenu-icon-box">📑</div>
                <span className="submenu-label">Save As...</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenRecentLessons?.())}
              >
                <div className="submenu-icon-box">🕒</div>
                <span className="submenu-label">Recent</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenBackground?.())}
              >
                <div className="submenu-icon-box">🎨</div>
                <span className="submenu-label">Background</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenLayers?.())}
              >
                <div className="submenu-icon-box">📑</div>
                <span className="submenu-label">Layers</span>
              </button>
            </div>
          )}

          {activeTab === 'mode' && (
            <div className="submenu-grid">
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenSubjectTools?.())}
                title="Subject Teaching Platform (Math, Physics, Chemistry, CS, Digital Logic)"
              >
                <div className="submenu-icon-box">🎓</div>
                <span className="submenu-label">Teaching Platform</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onTogglePresentationMode?.())}
                title="Full Screen Teaching Mode (F11)"
              >
                <div className="submenu-icon-box">⛶</div>
                <span className="submenu-label">Full Screen</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onActivatePresentationTool?.('spotlight'))}
                title="Spotlight focus tool"
              >
                <div className="submenu-icon-box">🔦</div>
                <span className="submenu-label">Spotlight</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onActivatePresentationTool?.('veil'))}
                title="Screen veil cover & progressive reveal"
              >
                <div className="submenu-icon-box">🪟</div>
                <span className="submenu-label">Screen Veil</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onActivatePresentationTool?.('magnifier'))}
                title="Magnifier lens"
              >
                <div className="submenu-icon-box">🔍</div>
                <span className="submenu-label">Magnifier</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onActivatePresentationTool?.('annotation'))}
                title="Desktop annotation overlay"
              >
                <div className="submenu-icon-box">✏️</div>
                <span className="submenu-label">Annotate</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onToggleTimer?.())}
                title="Floating timer and stopwatch"
              >
                <div className="submenu-icon-box">⏱️</div>
                <span className="submenu-label">Timer</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onScreenshot?.())}
                title="Screenshot capture & board insert"
              >
                <div className="submenu-icon-box">📸</div>
                <span className="submenu-label">Screenshot</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onDesktop?.())}
                title="Show Windows desktop (minimize board)"
              >
                <div className="submenu-icon-box">🖥️</div>
                <span className="submenu-label">Desktop</span>
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="submenu-grid">
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenDocumentImport?.())}
              >
                <div className="submenu-icon-box">📄</div>
                <span className="submenu-label">Import PDF</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenDocumentImport?.())}
              >
                <div className="submenu-icon-box">📊</div>
                <span className="submenu-label">PowerPoint</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenDocumentImport?.())}
              >
                <div className="submenu-icon-box">🖼️</div>
                <span className="submenu-label">Import Image</span>
              </button>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="submenu-grid">
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenExport?.())}
              >
                <div className="submenu-icon-box">📑</div>
                <span className="submenu-label">Export PDF</span>
              </button>
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenExport?.())}
              >
                <div className="submenu-icon-box">🌄</div>
                <span className="submenu-label">Export Image</span>
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ padding: 10, fontSize: 12, color: '#333' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Preferences</div>
              <p style={{ color: '#666', lineHeight: 1.5, marginBottom: 12 }}>
                SmartNoteAI v0.1.0<br />
                Bottom docked classroom interface.<br />
                Hardware acceleration: 120 FPS capable.<br />
                Latency optimized.
              </p>
              <button
                className="btn btn-primary"
                style={{ width: '100%', fontSize: 12, padding: '6px 12px' }}
                onClick={() => handleAction(() => onOpenSettings?.())}
              >
                ⚙️ Open Full Settings & Plugins
              </button>
            </div>
          )}

          {activeTab === 'help' && (
            <div style={{ padding: 10, fontSize: 12, color: '#333' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Keyboard Shortcuts</div>
              <ul style={{ listStyle: 'none', padding: 0, lineHeight: 1.8, color: '#555' }}>
                <li><b>P</b> — Pen Tool</li>
                <li><b>E</b> — Eraser Tool</li>
                <li><b>H</b> — Shapes</li>
                <li><b>T</b> — Text Tool</li>
                <li><b>S</b> — Select & Move</li>
                <li><b>Ctrl+Z</b> — Undo</li>
                <li><b>Ctrl+Shift+Z</b> — Redo</li>
                <li><b>Ctrl+S</b> — Save</li>
                <li><b>F11</b> — Full Screen Teaching</li>
                <li><b>Esc</b> — Close overlays / Fullscreen</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom callout pointer arrow */}
      <div className="menu-flyout-pointer" />
    </div>
  );
}
