/**
 * SettingsModal — Preferences and Plugin Management (Section 4.2 #10)
 * Themes, Toolbar position, Stylus smoothing, Autosave, Plugins
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { aiProviderManager } from '../services/aiPresentation/aiProviderManager';
import { AIProviderType } from '../../shared/aiPresentationTypes';
import { OPENAI_CURATED_MODELS, GEMINI_CURATED_MODELS, OLLAMA_RECOMMENDED_MODELS } from '../services/aiPresentation/adapters';
import { AIModelInfo } from '../../shared/aiPresentationTypes';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps): React.ReactElement {
  const { toolState, setPenStyle, toolbarScale, setToolbarScale } = useAppContext();
  const [activeTab, setActiveTab] = useState<'general' | 'stylus' | 'plugins' | 'ai'>('general');

  // Local settings state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toolbarPosition, setToolbarPosition] = useState<'bottom' | 'top' | 'side'>('bottom');
  const [autosaveMinutes, setAutosaveMinutes] = useState(3);
  const [smoothing, setSmoothing] = useState(toolState.penStyle.smoothing || 0.7);
  const [pressureSensitivity, setPressureSensitivity] = useState(toolState.penStyle.pressureSensitive);
  const [palmRejection, setPalmRejection] = useState(true);

  // AI Provider settings state (TASK-105)
  const [aiProvider, setAiProvider] = useState<AIProviderType>(aiProviderManager.getActiveProvider());
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [hasKeyOpenAI, setHasKeyOpenAI] = useState(false);
  const [hasKeyGemini, setHasKeyGemini] = useState(false);
  const [selectedModel, setSelectedModel] = useState(aiProviderManager.getSelectedModel());
  const [customEndpoint, setCustomEndpoint] = useState(aiProviderManager.getCustomEndpoint());
  const [timeoutSec, setTimeoutSec] = useState(Math.round(aiProviderManager.getTimeoutMs() / 1000));
  const [testingConn, setTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{ success: boolean; message: string } | null>(null);
  const [keyFeedback, setKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ollamaModels, setOllamaModels] = useState<AIModelInfo[]>([]);

  useEffect(() => {
    aiProviderManager.hasApiKey('openai').then(setHasKeyOpenAI).catch(() => {});
    aiProviderManager.hasApiKey('gemini').then(setHasKeyGemini).catch(() => {});
    if (aiProvider === 'ollama') {
      aiProviderManager.getAvailableModels('ollama').then(setOllamaModels).catch(() => {});
    }
  }, [aiProvider]);

  const handleProviderChange = (newProvider: AIProviderType) => {
    setAiProvider(newProvider);
    setSelectedModel(aiProviderManager.getSelectedModel(newProvider));
    setCustomEndpoint(aiProviderManager.getCustomEndpoint(newProvider));
    setConnResult(null);
    setKeyFeedback(null);
    if (newProvider === 'ollama') {
      aiProviderManager.getAvailableModels('ollama').then(setOllamaModels).catch(() => {});
    }
  };

  const handleSaveApiKey = async (): Promise<boolean> => {
    const trimmed = aiKeyInput.trim();
    if (!trimmed) return false;
    try {
      const res = await aiProviderManager.saveApiKey(aiProvider, trimmed);
      if (res.success) {
        setAiKeyInput('');
        localStorage.removeItem(`smartboard_discovered_models_${aiProvider}`);
        setKeyFeedback({
          type: 'success',
          message: `API key encrypted and securely stored for ${aiProvider.toUpperCase()} via OS safeStorage.`,
        });
        if (aiProvider === 'openai') setHasKeyOpenAI(true);
        if (aiProvider === 'gemini') setHasKeyGemini(true);
        return true;
      } else {
        setKeyFeedback({
          type: 'error',
          message: res.error || 'Failed to securely store API key.',
        });
        return false;
      }
    } catch (err: any) {
      setKeyFeedback({
        type: 'error',
        message: err?.message || 'Error communicating with credential service.',
      });
      return false;
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      await aiProviderManager.deleteApiKey(aiProvider);
      localStorage.removeItem(`smartboard_discovered_models_${aiProvider}`);
      localStorage.removeItem(`smartboard_model_${aiProvider}`);
      if (aiProvider === 'openai') setHasKeyOpenAI(false);
      if (aiProvider === 'gemini') setHasKeyGemini(false);
      setKeyFeedback({
        type: 'success',
        message: `API key removed for ${aiProvider.toUpperCase()}.`,
      });
      setConnResult(null);
    } catch {
      setKeyFeedback({
        type: 'error',
        message: 'Failed to remove API key.',
      });
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnResult(null);
    try {
      if (aiKeyInput.trim() && aiProvider !== 'ollama') {
        const savedOk = await handleSaveApiKey();
        if (!savedOk) {
          setTestingConn(false);
          return;
        }
      }
      const res = await aiProviderManager.testConnection(aiProvider);
      if (res.success) {
        if (aiProvider === 'ollama') {
          aiProviderManager.getAvailableModels('ollama').then(setOllamaModels).catch(() => {});
        }
        setConnResult({
          success: true,
          message: res.warning || `Connected successfully! Latency: ${res.latencyMs || 0}ms (${res.models?.length || 0} models verified)`,
        });
      } else {
        setConnResult({
          success: false,
          message: res.error || 'Connection failed. Please verify API key and network.',
        });
      }
    } catch (err: any) {
      setConnResult({
        success: false,
        message: err?.message || 'Connection test failed.',
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSave = async () => {
    setPenStyle({
      smoothing,
      pressureSensitive: pressureSensitivity,
    });
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);

    if (aiKeyInput.trim() && aiProvider !== 'ollama') {
      await handleSaveApiKey();
    }

    // Save AI non-secret preferences & synchronize smartboard localStorage keys
    aiProviderManager.setActiveProvider(aiProvider);
    aiProviderManager.setSelectedModel(selectedModel, aiProvider);
    aiProviderManager.setCustomEndpoint(customEndpoint, aiProvider);
    aiProviderManager.setTimeoutMs(timeoutSec * 1000);

    if (selectedModel.trim()) {
      localStorage.setItem(`smartboard_model_${aiProvider}`, selectedModel.trim());
      localStorage.setItem('smartboard_active_model_key', `${aiProvider}:${selectedModel.trim()}`);
    }

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
          <button
            className={`settings-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            🤖 AI Teaching Assistant
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
                  <div className="setting-label">Toolbar & Icon Size</div>
                  <div className="setting-desc">Scale toolbars, buttons, and icons to fit your display (recommended compact for 1366×768)</div>
                </div>
                <select
                  className="setting-select"
                  value={toolbarScale}
                  onChange={(e) => setToolbarScale(e.target.value as 'compact' | 'standard' | 'large')}
                >
                  <option value="compact">Compact (Recommended for 1366×768 / Laptops)</option>
                  <option value="standard">Standard (Default / 1080p Full HD)</option>
                  <option value="large">Large (High-DPI / 4K Interactive Smartboards)</option>
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

          {activeTab === 'ai' && (
            <div className="settings-section">
              {/* Provider Selection */}
              <div className="setting-row">
                <div>
                  <div className="setting-label">AI Generation Provider</div>
                  <div className="setting-desc">Select online LLM service for presentation deck and slide generation</div>
                </div>
                <select
                  className="setting-select"
                  value={aiProvider}
                  onChange={(e) => handleProviderChange(e.target.value as AIProviderType)}
                >
                  <option value="openai">OpenAI (GPT-4o / GPT-4o Mini)</option>
                  <option value="gemini">Google Gemini (Gemini 3.8 Flash / Pro / Latest)</option>
                  <option value="ollama">Local Ollama (100% Offline / Private — No API Key)</option>
                  <option value="custom-openai">Custom OpenAI-Compatible (Groq, DeepSeek, etc.)</option>
                </select>
              </div>

              {/* Provider Connection / API Key Configuration */}
              {aiProvider === 'ollama' ? (
                <div className="plugin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="setting-label">Local Ollama Connection</div>
                    <span className="ai-status-badge configured">
                      ✓ 100% Offline / Private
                    </span>
                  </div>
                  <div className="setting-desc" style={{ marginTop: 4 }}>
                    Ollama executes neural models directly on your computer hardware. Zero internet connectivity or external credentials needed.
                  </div>
                  <div className="setting-row" style={{ marginTop: 12, padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ flex: 1, marginRight: 16 }}>
                      <div className="setting-label" style={{ fontSize: 13 }}>Ollama Base Address</div>
                      <div className="setting-desc">Local endpoint (default: http://localhost:11434)</div>
                    </div>
                    <input
                      type="text"
                      className="ai-text-input"
                      style={{ maxWidth: 280 }}
                      placeholder="http://localhost:11434"
                      value={customEndpoint || 'http://localhost:11434'}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="plugin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="setting-label">
                      {aiProvider === 'openai' && 'OpenAI API Key'}
                      {aiProvider === 'gemini' && 'Google Gemini API Key'}
                      {aiProvider === 'custom-openai' && 'Custom Provider API Key'}
                    </div>
                    <span
                      className={`ai-status-badge ${
                        (aiProvider === 'openai' && hasKeyOpenAI) || (aiProvider === 'gemini' && hasKeyGemini)
                          ? 'configured'
                          : 'missing'
                      }`}
                    >
                      {(aiProvider === 'openai' && hasKeyOpenAI) || (aiProvider === 'gemini' && hasKeyGemini)
                        ? '✓ Key Encrypted & Saved'
                        : '○ No Key Configured'}
                    </span>
                  </div>
                  <div className="setting-desc" style={{ marginTop: 4 }}>
                    Keys are encrypted at rest using OS-level security (DPAPI / Keychain) and decrypted strictly in the Electron main process.
                  </div>

                  <div className="ai-key-input-row">
                    <input
                      type="password"
                      className="ai-text-input"
                      placeholder="Enter new API key (sk-... or AIza...)"
                      value={aiKeyInput}
                      onChange={(e) => setAiKeyInput(e.target.value)}
                    />
                    <button
                      className="ai-btn-sm primary"
                      onClick={handleSaveApiKey}
                      disabled={!aiKeyInput.trim()}
                    >
                      Save Key
                    </button>
                    {((aiProvider === 'openai' && hasKeyOpenAI) || (aiProvider === 'gemini' && hasKeyGemini)) && (
                      <button className="ai-btn-sm danger" onClick={handleDeleteApiKey}>
                        Remove Key
                      </button>
                    )}
                  </div>

                  {keyFeedback && (
                    <div className={`ai-feedback-banner ${keyFeedback.type}`}>
                      {keyFeedback.message}
                    </div>
                  )}
                </div>
              )}

              {/* Model Selection */}
              <div className="setting-row">
                <div>
                  <div className="setting-label">Default Slide Generation Model</div>
                  <div className="setting-desc">Recommended models tuned for structured pedagogical presentation output</div>
                </div>
                <select
                  className="setting-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {aiProvider === 'ollama'
                    ? (ollamaModels.length > 0 ? ollamaModels : OLLAMA_RECOMMENDED_MODELS).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))
                    : (aiProvider === 'gemini' ? GEMINI_CURATED_MODELS : OPENAI_CURATED_MODELS).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                </select>
              </div>

              {/* Custom Endpoint (if custom-openai) */}
              {aiProvider === 'custom-openai' && (
                <div className="setting-row">
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <div className="setting-label">Custom API Base Endpoint</div>
                    <div className="setting-desc">e.g. https://api.groq.com/openai/v1 or https://api.deepseek.com/v1</div>
                  </div>
                  <input
                    type="text"
                    className="ai-text-input"
                    style={{ maxWidth: 300 }}
                    placeholder="https://api.openai.com/v1"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                  />
                </div>
              )}

              {/* Request Timeout */}
              <div className="setting-row">
                <div>
                  <div className="setting-label">API Request Timeout</div>
                  <div className="setting-desc">Maximum wait time for slide deck outline and slide generation</div>
                </div>
                <select
                  className="setting-select"
                  value={timeoutSec}
                  onChange={(e) => setTimeoutSec(Number(e.target.value))}
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds (Default)</option>
                  <option value={45}>45 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>

              {/* Connection Testing */}
              <div className="setting-row">
                <div>
                  <div className="setting-label">Verify Connection</div>
                  <div className="setting-desc">Test authorization and model latency with the selected provider</div>
                </div>
                <button
                  className="ai-btn-sm"
                  onClick={handleTestConnection}
                  disabled={testingConn}
                >
                  {testingConn ? 'Testing...' : '⚡ Test Connection'}
                </button>
              </div>

              {connResult && (
                <div className={`ai-feedback-banner ${connResult.success ? 'success' : 'error'}`}>
                  {connResult.message}
                </div>
              )}
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
