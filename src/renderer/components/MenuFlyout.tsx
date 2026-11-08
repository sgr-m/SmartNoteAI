/**
 * MenuFlyout — Hierarchical smartboard menu (Reference Image 5)
 * Opens upwards from the left bottom menu button.
 * Includes File, Import, Export, Print, Teaching/Presentation Mode, Settings, Help, Exit
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { PresentationTool } from './PresentationFloatingToolbar';
import './MenuFlyout.css';

interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadPercent?: number;
  downloadBytesPerSecond?: number;
  downloadTransferred?: number;
  downloadTotal?: number;
  downloadUrl?: string;
  installerPath?: string;
  error?: string;
}

interface MenuFlyoutProps {
  onClose: () => void;
  onOpenSettings?: () => void;
  onOpenRecentLessons?: () => void;
  onOpenSubjectTools?: () => void;
  onOpenVectorDiagram?: () => void;
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
  onOpenBrowser?: () => void;
}

export function MenuFlyout({
  onClose,
  onOpenSettings,
  onOpenRecentLessons,
  onOpenSubjectTools,
  onOpenVectorDiagram,
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
  onOpenBrowser,
}: MenuFlyoutProps): React.ReactElement {
  const { newLesson, openLesson, saveLesson, saveLessonAs, pasteObject, canPaste } = useAppContext();
  const [activeTab, setActiveTab] = useState<'file' | 'mode' | 'import' | 'export' | 'settings' | 'help' | 'update'>('file');
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: 'idle',
    currentVersion: '0.2.0',
  });

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const api = (window as any).electronAPI;
    if (api && typeof api.invoke === 'function') {
      api.invoke('updater:getState').then((res: any) => {
        if (res && res.status) {
          setUpdateState(res);
        }
      }).catch(() => {});

      if (typeof api.on === 'function') {
        unlisten = api.on('updater:status', (state: any) => {
          if (state && state.status) {
            setUpdateState(state);
          }
        });
      }
    }
    return () => {
      unlisten?.();
    };
  }, []);

  const handleCheckForUpdates = async () => {
    const api = (window as any).electronAPI;
    if (api && typeof api.invoke === 'function') {
      setUpdateState((prev) => ({ ...prev, status: 'checking', error: undefined }));
      try {
        const res = await api.invoke('updater:check');
        if (res && res.status) {
          setUpdateState(res);
        }
      } catch (err: any) {
        setUpdateState((prev) => ({
          ...prev,
          status: 'error',
          error: err.message || 'Update check failed',
        }));
      }
    } else {
      // Mock fallback for unit tests and browser environment
      setUpdateState((prev) => ({ ...prev, status: 'checking' }));
      setTimeout(() => {
        setUpdateState((prev) => ({
          ...prev,
          status: 'not-available',
          currentVersion: '0.2.0',
          latestVersion: '0.2.0',
        }));
      }, 500);
    }
  };

  const handleDownloadUpdate = async () => {
    const api = (window as any).electronAPI;
    if (api && typeof api.invoke === 'function') {
      try {
        const res = await api.invoke('updater:download');
        if (res && res.status) {
          setUpdateState(res);
        }
      } catch (err: any) {
        setUpdateState((prev) => ({
          ...prev,
          status: 'error',
          error: err.message || 'Download failed',
        }));
      }
    }
  };

  const handleInstallUpdate = async () => {
    const api = (window as any).electronAPI;
    if (api && typeof api.invoke === 'function') {
      await api.invoke('updater:install');
    }
  };

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
            className={`menu-category-btn ${activeTab === 'update' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('update');
              if (updateState.status === 'idle') {
                handleCheckForUpdates();
              }
            }}
          >
            <div className="menu-btn-content">
              <span
                className="menu-btn-icon"
                style={{
                  display: 'inline-block',
                  animation: updateState.status === 'checking' ? 'spin 1.2s linear infinite' : 'none',
                }}
              >
                🔄
              </span>
              <span className="menu-btn-text">Updates</span>
            </div>
            {updateState.status === 'available' && (
              <span className="badge-new" style={{ position: 'static' }}>NEW</span>
            )}
            <span className="menu-arrow">►</span>
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
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(pasteObject)}
                disabled={!canPaste}
                title="Paste copied element to this page (Ctrl+V)"
                style={{ opacity: canPaste ? 1 : 0.45 }}
              >
                <div className="submenu-icon-box">📋</div>
                <span className="submenu-label">Paste</span>
              </button>
            </div>
          )}

          {activeTab === 'mode' && (
            <div className="submenu-grid">
              <button
                className="submenu-tile-btn"
                onClick={() => handleAction(() => onOpenBrowser?.())}
                title="Educational Web Browser (Google, Images & Wikipedia) — Ctrl+Shift+B"
              >
                <div className="submenu-icon-box">🌐</div>
                <span className="submenu-label">Web Browser</span>
              </button>
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
                onClick={() => handleAction(() => onOpenVectorDiagram?.())}
                title="Code-to-Vector Diagram Studio (Mermaid, Function Graphs, Geometry, Circuits, Timing, TikZ)"
              >
                <div className="submenu-icon-box">📐</div>
                <span className="submenu-label">Vector Diagrams</span>
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
            <div className="preferences-panel">
              <div className="preferences-heading">Preferences</div>
              <p className="preferences-desc">
                SmartNoteAI v{updateState.currentVersion}<br />
                Bottom docked classroom interface.<br />
                Hardware acceleration: 120 FPS capable.<br />
                Latency optimized.
              </p>
              <button
                className="preferences-btn primary"
                onClick={() => handleAction(() => onOpenSettings?.())}
              >
                <span>⚙️</span> Open Full Settings & Plugins
              </button>
              <button
                className="preferences-btn secondary"
                onClick={() => {
                  setActiveTab('update');
                  handleCheckForUpdates();
                }}
              >
                <span>🔄</span> Check for Updates...
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

          {activeTab === 'update' && (
            <div className="updater-container">
              <div className="updater-header">
                <span className="updater-title">Software Updates</span>
                <span className="updater-ver-tag">Current: v{updateState.currentVersion}</span>
              </div>

              {/* Status: Checking */}
              {updateState.status === 'checking' && (
                <div className="updater-card" style={{ textAlign: 'center', padding: '16px 10px' }}>
                  <div style={{ fontSize: 24, animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>
                    🔄
                  </div>
                  <div style={{ fontWeight: 600, color: '#1f2328', marginTop: 8 }}>
                    Checking for updates...
                  </div>
                  <div style={{ fontSize: 11, color: '#57606a' }}>
                    Connecting to GitHub repository
                  </div>
                </div>
              )}

              {/* Status: Idle */}
              {updateState.status === 'idle' && (
                <div className="updater-card">
                  <div className="updater-state-row">
                    <span style={{ fontSize: 18 }}>💡</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Stay up to date</div>
                      <div style={{ fontSize: 11, color: '#57606a' }}>
                        Check for new features, bug fixes, and security improvements.
                      </div>
                    </div>
                  </div>
                  <button className="updater-btn action" onClick={handleCheckForUpdates}>
                    <span>🔄</span> Check for Updates Now
                  </button>
                </div>
              )}

              {/* Status: Up to date (not-available) */}
              {updateState.status === 'not-available' && (
                <div className="updater-card">
                  <div className="updater-state-row">
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1a7f37' }}>You are on the latest version!</div>
                      <div style={{ fontSize: 11, color: '#57606a' }}>
                        SmartNoteAI v{updateState.currentVersion} is currently the newest available release.
                      </div>
                    </div>
                  </div>
                  <button className="updater-btn secondary" onClick={handleCheckForUpdates}>
                    <span>🔄</span> Check Again
                  </button>
                </div>
              )}

              {/* Status: Update Available */}
              {updateState.status === 'available' && (
                <div className="updater-card">
                  <div className="updater-state-row">
                    <span style={{ fontSize: 22 }}>🚀</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0969da', fontSize: 13 }}>
                        New Version: v{updateState.latestVersion}
                      </div>
                      {updateState.releaseName && (
                        <div style={{ fontSize: 11, color: '#57606a', fontWeight: 500 }}>
                          {updateState.releaseName}
                        </div>
                      )}
                    </div>
                  </div>

                  {updateState.releaseNotes && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#57606a', textTransform: 'uppercase' }}>
                        Release Highlights:
                      </div>
                      <div className="updater-notes-box">
                        {updateState.releaseNotes}
                      </div>
                    </>
                  )}

                  <button className="updater-btn primary" onClick={handleDownloadUpdate}>
                    <span>⬇️</span> Download & Install Update
                  </button>
                </div>
              )}

              {/* Status: Downloading */}
              {updateState.status === 'downloading' && (
                <div className="updater-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#0969da' }}>
                      Downloading v{updateState.latestVersion}...
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1f2328' }}>
                      {Math.round(updateState.downloadPercent || 0)}%
                    </span>
                  </div>

                  <div className="updater-progress-track">
                    <div
                      className="updater-progress-bar"
                      style={{ width: `${Math.min(100, Math.max(0, updateState.downloadPercent || 0))}%` }}
                    />
                  </div>

                  <div className="updater-progress-stats">
                    <span>
                      {updateState.downloadTransferred
                        ? `${(updateState.downloadTransferred / (1024 * 1024)).toFixed(1)} MB`
                        : '0 MB'}
                      {updateState.downloadTotal
                        ? ` / ${(updateState.downloadTotal / (1024 * 1024)).toFixed(1)} MB`
                        : ''}
                    </span>
                    <span>
                      {updateState.downloadBytesPerSecond
                        ? `${(updateState.downloadBytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`
                        : 'Downloading...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Status: Downloaded */}
              {updateState.status === 'downloaded' && (
                <div className="updater-card" style={{ borderColor: '#2ea44f' }}>
                  <div className="updater-state-row">
                    <span style={{ fontSize: 22 }}>🎉</span>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1a7f37', fontSize: 13 }}>
                        Update Ready to Install!
                      </div>
                      <div style={{ fontSize: 11, color: '#57606a' }}>
                        The update has been downloaded and verified. Restart to apply.
                      </div>
                    </div>
                  </div>
                  <button className="updater-btn primary" onClick={handleInstallUpdate}>
                    <span>🔄</span> Restart & Install Now
                  </button>
                </div>
              )}

              {/* Status: Error */}
              {updateState.status === 'error' && (
                <div className="updater-card">
                  <div className="updater-error-box">
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>⚠️ Update Check Failed</div>
                    <div>{updateState.error || 'Unable to connect to GitHub releases.'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button className="updater-btn secondary" style={{ flex: 1 }} onClick={handleCheckForUpdates}>
                      Retry
                    </button>
                    <button
                      className="updater-btn secondary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        const api = (window as any).electronAPI;
                        if (api && typeof api.openExternal === 'function') {
                          api.openExternal('https://github.com/sgr-m/SmartNoteAI/releases');
                        } else {
                          window.open('https://github.com/sgr-m/SmartNoteAI/releases', '_blank');
                        }
                      }}
                    >
                      Web Releases
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom callout pointer arrow */}
      <div className="menu-flyout-pointer" />
    </div>
  );
}
