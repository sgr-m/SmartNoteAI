/**
 * ModelSettingsDrawer.tsx — In-Chat Model & API Key Configuration Drawer
 * Allows teachers to configure Google Gemini, local Ollama, Kimi (Moonshot), DeepSeek,
 * Groq, OpenAI, and custom endpoints & models with live connection testing and auto-fetching.
 */

import React, { useState, useEffect } from 'react';
import {
  GEMINI_DEFAULT_MODEL,
  GEMINI_LEGACY_PHANTOM_MODEL_IDS,
  GEMINI_QUICK_PICK_MODELS,
  isSupportedGeminiChatModel,
  normalizeGeminiModelId,
  pickBestGeminiDefaultModel,
  sortGeminiModels,
} from '../../../shared/geminiModelUtils';
import './ModelSettingsDrawer.css';

export type AIProviderId = 'gemini' | 'ollama' | 'kimi' | 'deepseek' | 'groq' | 'openai' | 'custom';

export interface ProviderConfig {
  id: AIProviderId;
  name: string;
  icon: string;
  defaultEndpoint: string;
  defaultModel: string;
  helpUrl?: string;
  helpLabel?: string;
  description: string;
  isLocal?: boolean;
}

export const AI_PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: GEMINI_DEFAULT_MODEL,
    helpUrl: 'https://aistudio.google.com/app/apikey',
    helpLabel: 'Get free Gemini API Key',
    description: 'Google Flagship & Flash models. Supports Gemini 2.5 Flash (Recommended), Gemini 2.5 Flash-Lite, Gemini 2.0 Flash, and Gemini Flash Latest.',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local Offline)',
    icon: '🦙',
    defaultEndpoint: 'http://127.0.0.1:11434',
    defaultModel: 'qwen2.5-coder:3b',
    helpUrl: 'https://ollama.com/download',
    helpLabel: 'Download Ollama',
    description: '100% private offline models running on your computer. Zero subscription, no internet required.',
    isLocal: true,
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot AI)',
    icon: '🌙',
    defaultEndpoint: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    helpUrl: 'https://platform.moonshot.cn/console/api-keys',
    helpLabel: 'Get Kimi API Key',
    description: 'Moonshot AI / Kimi K3 long-context reasoning models.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    icon: '⚡',
    defaultEndpoint: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    helpUrl: 'https://platform.deepseek.com/api_keys',
    helpLabel: 'Get DeepSeek API Key',
    description: 'Deep mathematical and algorithmic reasoning (DeepSeek-V3 and DeepSeek-R1).',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    icon: '🚀',
    defaultEndpoint: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    helpUrl: 'https://console.groq.com/keys',
    helpLabel: 'Get Groq API Key',
    description: 'Ultra-fast LPU inference hosting Llama 3.3, Mixtral, and Gemma models.',
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    icon: '🤖',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'Get OpenAI API Key',
    description: 'GPT-4o, GPT-4o-mini, and OpenAI reasoning models.',
  },
  {
    id: 'custom',
    name: 'Custom Endpoint / Model',
    icon: '⚙️',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'custom-model',
    description: 'Connect any OpenAI-compatible API, local vLLM, LM Studio, or custom endpoint.',
  },
];

export interface ModelSettingsDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
  onModelConfigChanged?: (newActiveKey?: string) => void;
}

export function ModelSettingsDrawer({
  isOpen = true,
  onClose,
  onConfigSaved,
  onModelConfigChanged,
}: ModelSettingsDrawerProps): React.ReactElement | null {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [customEndpoint, setCustomEndpoint] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('');
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    models?: string[];
  } | null>(null);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);

  const activeProviderMeta = AI_PROVIDERS.find((p) => p.id === selectedProvider) || AI_PROVIDERS[0];

  // Load existing configuration when provider changes or drawer opens
  useEffect(() => {
    if (!isOpen) return;
    setTestResult(null);
    setApiKeyInput('');
    setShowApiKey(false);

    // Load custom endpoint & model from localStorage
    const savedEndpoint = localStorage.getItem(`smartboard_endpoint_${selectedProvider}`) || '';
    const savedModel = localStorage.getItem(`smartboard_model_${selectedProvider}`) || '';
    setCustomEndpoint(savedEndpoint || (selectedProvider === 'custom' ? 'https://api.openai.com/v1' : ''));

    let cleanDiscovered: Array<{ id: string; displayName: string; provider: string }> = [];
    const cachedDiscovered = localStorage.getItem(`smartboard_discovered_models_${selectedProvider}`);
    if (cachedDiscovered) {
      try {
        const parsed = JSON.parse(cachedDiscovered);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cleanDiscovered = parsed
            .map((m: any) => {
              const rawId = typeof m === 'string' ? m : (m?.id || m?.name || '');
              const cleanId = selectedProvider === 'gemini' ? normalizeGeminiModelId(rawId) : String(rawId).trim();
              const rawDisplay = typeof m === 'object' && m?.displayName ? m.displayName : cleanId;
              return {
                id: cleanId,
                displayName: rawDisplay.includes(cleanId) ? rawDisplay : `${rawDisplay} (${cleanId})`,
                provider: selectedProvider,
              };
            })
            .filter((item) => item.id && (selectedProvider !== 'gemini' || isSupportedGeminiChatModel(item.id)));
          if (selectedProvider === 'gemini') {
            cleanDiscovered = sortGeminiModels(cleanDiscovered);
          }
          if (cleanDiscovered.length > 0) {
            setTestResult({
              success: true,
              message: `Verified models available for ${activeProviderMeta.name}. Click any model to activate it:`,
              models: cleanDiscovered.map((m) => m.displayName),
            });
          }
        }
      } catch {}
    }

    let resolvedInitialModel = savedModel || activeProviderMeta.defaultModel;
    if (selectedProvider === 'gemini') {
      const normalizedSaved = normalizeGeminiModelId(savedModel);
      const discoveredIds = cleanDiscovered.map((m) => m.id);
      const isPhantomUnverified =
        GEMINI_LEGACY_PHANTOM_MODEL_IDS.has(normalizedSaved.toLowerCase()) &&
        (discoveredIds.length === 0 || !discoveredIds.includes(normalizedSaved));
      if (!normalizedSaved || !isSupportedGeminiChatModel(normalizedSaved) || isPhantomUnverified) {
        resolvedInitialModel =
          discoveredIds.length > 0 ? pickBestGeminiDefaultModel(discoveredIds) : GEMINI_DEFAULT_MODEL;
        if (savedModel) {
          localStorage.setItem('smartboard_model_gemini', resolvedInitialModel);
        }
      } else {
        resolvedInitialModel = normalizedSaved;
      }
    }
    setCustomModel(resolvedInitialModel);

    // Check existing key in secure storage
    const electronAi = (window as any).electronAPI?.ai;
    if (electronAi?.hasApiKey && selectedProvider !== 'ollama') {
      electronAi.hasApiKey(selectedProvider).then((exists: boolean) => {
        setHasExistingKey(Boolean(exists));
      }).catch(() => setHasExistingKey(false));
    } else {
      setHasExistingKey(false);
    }
  }, [isOpen, selectedProvider]);

  if (!isOpen) return null;

  const normalizeAndFilterDiscovered = (
    rawList: any[],
    providerKey: AIProviderId
  ): Array<{ id: string; displayName: string; provider: AIProviderId }> => {
    const mapped = rawList
      .map((m: any) => {
        const rawId = typeof m === 'string' ? m : (m.id || m.name || '');
        const cleanId =
          providerKey === 'gemini' ? normalizeGeminiModelId(rawId) : rawId.replace(/^models\//, '').trim();

        let displayName = cleanId;
        if (typeof m === 'object' && m.displayName) {
          displayName = m.displayName;
        } else if (typeof m === 'object' && m.name && m.name !== cleanId) {
          displayName = m.name;
        }

        return {
          id: cleanId,
          displayName: displayName.includes(cleanId) ? displayName : `${displayName} (${cleanId})`,
          provider: providerKey,
        };
      })
      .filter((item) => {
        if (!item.id) return false;
        if (providerKey === 'gemini') {
          return isSupportedGeminiChatModel(item.id);
        }
        const idLower = item.id.toLowerCase();
        return (
          !idLower.endsWith('-tts') &&
          !idLower.includes('-image') &&
          !idLower.includes('-transcribe') &&
          !idLower.includes('embedding') &&
          !idLower.includes('aqa') &&
          !idLower.includes('banana')
        );
      });
    return providerKey === 'gemini' ? sortGeminiModels(mapped) : mapped;
  };

  const savePendingApiKeyIfEntered = async (
    electronAi: any
  ): Promise<{ ok: boolean; savedNewKey: boolean; rawKey?: string; error?: string }> => {
    const trimmedKey = apiKeyInput.trim();
    if (!trimmedKey || selectedProvider === 'ollama') {
      return { ok: true, savedNewKey: false };
    }
    if (!electronAi?.saveApiKey) {
      return { ok: false, savedNewKey: false, error: 'Credential saving is unavailable.' };
    }
    const saveRes = await electronAi.saveApiKey(selectedProvider, trimmedKey);
    if (!saveRes?.success && saveRes?.error) {
      return { ok: false, savedNewKey: false, error: saveRes.error };
    }
    setHasExistingKey(true);
    setApiKeyInput('');
    localStorage.removeItem(`smartboard_discovered_models_${selectedProvider}`);
    return { ok: true, savedNewKey: true, rawKey: trimmedKey };
  };

  const handleTestAndSave = async () => {
    setIsTesting(true);
    setTestResult(null);

    const electronAi = (window as any).electronAPI?.ai;
    if (!electronAi) {
      setTestResult({
        success: false,
        message: 'Electron AI bridge is not available.',
      });
      setIsTesting(false);
      return;
    }

    const providerKey = selectedProvider;
    const finalEndpoint = customEndpoint.trim() || activeProviderMeta.defaultEndpoint;
    let finalModel = customModel.trim() || activeProviderMeta.defaultModel;

    try {
      // 1. If user entered a new key, save it first and invalidate old account's model cache
      const keySave = await savePendingApiKeyIfEntered(electronAi);
      if (!keySave.ok) {
        setTestResult({
          success: false,
          message: `Failed to store API key: ${keySave.error}`,
        });
        setIsTesting(false);
        return;
      }

      // 2. Persist custom endpoint and model
      if (customEndpoint.trim()) {
        localStorage.setItem(`smartboard_endpoint_${providerKey}`, customEndpoint.trim());
      } else {
        localStorage.removeItem(`smartboard_endpoint_${providerKey}`);
      }
      if (customModel.trim()) {
        localStorage.setItem(`smartboard_model_${providerKey}`, customModel.trim());
      }

      // 3. Test connection through main process (passing new key explicitly if just entered)
      const testRes = await electronAi.testConnection(providerKey, {
        apiKey: keySave.rawKey || undefined,
        customEndpoint: finalEndpoint,
        model: finalModel,
        timeoutMs: 12000,
      });

      if (testRes?.success) {
        const cleanModels = Array.isArray(testRes.models)
          ? normalizeAndFilterDiscovered(testRes.models, providerKey)
          : [];
        if (cleanModels.length > 0) {
          localStorage.setItem(`smartboard_discovered_models_${providerKey}`, JSON.stringify(cleanModels));
          if (providerKey === 'gemini') {
            const normModel = normalizeGeminiModelId(finalModel);
            const discoveredIds = cleanModels.map((m) => m.id);
            const shouldMigrate =
              !normModel ||
              !isSupportedGeminiChatModel(normModel) ||
              (keySave.savedNewKey && !discoveredIds.includes(normModel)) ||
              (GEMINI_LEGACY_PHANTOM_MODEL_IDS.has(normModel.toLowerCase()) && !discoveredIds.includes(normModel));
            if (shouldMigrate) {
              finalModel = pickBestGeminiDefaultModel(discoveredIds);
              setCustomModel(finalModel);
              localStorage.setItem(`smartboard_model_${providerKey}`, finalModel);
              localStorage.setItem('smartboard_active_model_key', `${providerKey}:${finalModel}`);
            }
          }
        }
        setTestResult({
          success: true,
          message: `Connected successfully! Latency: ${testRes.latencyMs || 0}ms`,
          models: cleanModels.length > 0 ? cleanModels.map((m) => m.displayName) : (testRes.models || []),
        });
        onConfigSaved?.();
        onModelConfigChanged?.();
      } else {
        setTestResult({
          success: false,
          message: testRes?.error || 'Connection failed. Please check credentials or host URL.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAutoFetchModels = async () => {
    setIsFetchingModels(true);
    setTestResult(null);

    const electronAi = (window as any).electronAPI?.ai;
    if (!electronAi?.listModels) {
      setIsFetchingModels(false);
      return;
    }

    try {
      const keySave = await savePendingApiKeyIfEntered(electronAi);
      if (!keySave.ok) {
        setTestResult({
          success: false,
          message: `Failed to store API key: ${keySave.error}`,
        });
        return;
      }

      const finalEndpoint = customEndpoint.trim() || activeProviderMeta.defaultEndpoint;
      const res = await electronAi.listModels(selectedProvider, {
        apiKey: keySave.rawKey || undefined,
        customEndpoint: finalEndpoint,
        timeoutMs: 12000,
      });

      const list = Array.isArray(res) ? res : (res?.models || []);
      if (list.length > 0) {
        const cleanModels = normalizeAndFilterDiscovered(list, selectedProvider);

        if (cleanModels.length > 0) {
          localStorage.setItem(`smartboard_discovered_models_${selectedProvider}`, JSON.stringify(cleanModels));

          setTestResult({
            success: true,
            message: `Discovered ${cleanModels.length} verified chat models from ${activeProviderMeta.name}! Click any model below to activate it:`,
            models: cleanModels.map((m) => m.displayName),
          });

          const currentSaved = localStorage.getItem(`smartboard_model_${selectedProvider}`) || '';
          const discoveredIds = cleanModels.map((m) => m.id);
          const shouldAutoPick =
            !currentSaved ||
            keySave.savedNewKey ||
            (selectedProvider === 'gemini' &&
              (!isSupportedGeminiChatModel(currentSaved) || !discoveredIds.includes(normalizeGeminiModelId(currentSaved))));
          if (shouldAutoPick) {
            const pickId =
              selectedProvider === 'gemini'
                ? pickBestGeminiDefaultModel(discoveredIds)
                : cleanModels[0].id;
            setCustomModel(pickId);
            localStorage.setItem(`smartboard_model_${selectedProvider}`, pickId);
            localStorage.setItem('smartboard_active_model_key', `${selectedProvider}:${pickId}`);
          }
          onConfigSaved?.();
          onModelConfigChanged?.();
        } else {
          setTestResult({
            success: false,
            message: 'No compatible chat models found for this provider.',
          });
        }
      } else {
        setTestResult({
          success: false,
          message: selectedProvider === 'ollama'
            ? 'Ollama is offline or has no models installed. Run "ollama run qwen2.5-coder:3b" in terminal.'
            : 'No models found. Please verify your API key and endpoint.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Failed to fetch models: ${err?.message || err}`,
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleClearKey = async () => {
    const electronAi = (window as any).electronAPI?.ai;
    if (electronAi?.deleteApiKey) {
      await electronAi.deleteApiKey(selectedProvider);
    }
    localStorage.removeItem(`smartboard_discovered_models_${selectedProvider}`);
    localStorage.removeItem(`smartboard_model_${selectedProvider}`);
    setCustomModel(activeProviderMeta.defaultModel);
    setHasExistingKey(false);
    setApiKeyInput('');
    setTestResult({
      success: true,
      message: `Cleared saved API key and model cache for ${activeProviderMeta.name}.`,
    });
    onConfigSaved?.();
    onModelConfigChanged?.();
  };

  return (
    <div className="model-settings-drawer-overlay" onClick={onClose}>
      <div className="model-settings-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-icon">⚙️</span>
            <div>
              <h3 className="drawer-title">AI Models & API Configuration</h3>
              <p className="drawer-desc">Configure connected cloud APIs, local Ollama, or custom models</p>
            </div>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose} title="Close Settings">
            ✕
          </button>
        </div>

        {/* Provider Pills Bar */}
        <div className="provider-tabs-bar">
          {AI_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`provider-tab-pill ${selectedProvider === p.id ? 'active' : ''}`}
              onClick={() => setSelectedProvider(p.id)}
            >
              <span className="tab-icon">{p.icon}</span>
              <span className="tab-name">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Provider Detail Form */}
        <div className="provider-form-body">
          <div className="provider-info-card">
            <div className="provider-card-header">
              <span className="provider-badge-icon">{activeProviderMeta.icon}</span>
              <div>
                <h4 className="provider-card-title">{activeProviderMeta.name}</h4>
                <p className="provider-card-desc">{activeProviderMeta.description}</p>
              </div>
            </div>
            {activeProviderMeta.helpUrl && (
              <a
                href={activeProviderMeta.helpUrl}
                target="_blank"
                rel="noreferrer"
                className="provider-help-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (activeProviderMeta.helpUrl) {
                    (window as any).electronAPI?.invoke?.('file:openInExplorer', activeProviderMeta.helpUrl);
                  }
                }}
              >
                🔗 {activeProviderMeta.helpLabel || 'Get API Key'} ↗
              </a>
            )}
          </div>

          {/* API Key Field (if not Ollama) */}
          {!activeProviderMeta.isLocal && (
            <div className="form-field-group">
              <label className="field-label" htmlFor="api-key-input">
                API Key {hasExistingKey && <span className="key-configured-badge">✓ Key Stored (Encrypted)</span>}
              </label>
              <div className="key-input-wrapper">
                <input
                  id="api-key-input"
                  type={showApiKey ? 'text' : 'password'}
                  className="settings-text-input"
                  placeholder={hasExistingKey ? '•••••••••••••••• (Leave blank to keep current key)' : 'Paste your API key here...'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-key-visibility-btn"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide key' : 'Show key'}
                >
                  {showApiKey ? '👁️' : '🔒'}
                </button>
                {hasExistingKey && (
                  <button
                    type="button"
                    className="clear-key-btn"
                    onClick={handleClearKey}
                    title="Remove saved API key"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Endpoint URL Field */}
          <div className="form-field-group">
            <label className="field-label" htmlFor="endpoint-input">
              API Endpoint URL
            </label>
            <input
              id="endpoint-input"
              type="text"
              className="settings-text-input font-mono"
              placeholder={activeProviderMeta.defaultEndpoint}
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
            />
            <span className="field-hint">
              Default: <code>{activeProviderMeta.defaultEndpoint}</code>
            </span>
          </div>

          {/* Target Model Name Field */}
          <div className="form-field-group">
            <label className="field-label" htmlFor="model-input">
              Target Model Name (e.g. {activeProviderMeta.defaultModel})
            </label>
            <input
              id="model-input"
              type="text"
              className="settings-text-input font-mono"
              placeholder={activeProviderMeta.defaultModel}
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
            />
            <span className="field-hint">
              You can type any supported or experimental model ID (e.g. <code>gemini-2.5-flash</code>, <code>qwen2.5-coder:3b</code>, <code>kimi-k3</code>).
            </span>

            {/* Quick Model Recommendation Pills */}
            <div className="quick-model-pills-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {(selectedProvider === 'gemini'
                ? [...GEMINI_QUICK_PICK_MODELS]
                : selectedProvider === 'ollama'
                ? ['qwen2.5-coder:3b', 'qwen2.5:3b', 'gemma3:4b', 'qwen2.5vl:3b', 'llama3.2']
                : selectedProvider === 'kimi'
                ? ['moonshot-v1-8k', 'moonshot-v1-32k', 'kimi-k3']
                : selectedProvider === 'deepseek'
                ? ['deepseek-chat', 'deepseek-reasoner']
                : selectedProvider === 'groq'
                ? ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
                : ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo']
              ).map((mId) => {
                const isSelected = customModel === mId;
                const fullKey = `${selectedProvider}:${mId}`;
                return (
                  <button
                    key={mId}
                    type="button"
                    className={`model-tag-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setCustomModel(mId);
                      localStorage.setItem(`smartboard_model_${selectedProvider}`, mId);
                      localStorage.setItem('smartboard_active_model_key', fullKey);
                      onConfigSaved?.();
                      onModelConfigChanged?.(fullKey);
                    }}
                    title={`Select ${mId}`}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255, 255, 255, 0.08)',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {isSelected ? '✓ ' : ''}{mId}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Action Buttons */}
          <div className="form-action-row">
            <button
              type="button"
              className="action-btn primary-test-btn"
              onClick={handleTestAndSave}
              disabled={isTesting || isFetchingModels}
            >
              {isTesting ? <span className="btn-spinner" /> : '⚡'} Test & Save Key
            </button>

            <button
              type="button"
              className="action-btn secondary-fetch-btn"
              onClick={handleAutoFetchModels}
              disabled={isTesting || isFetchingModels}
              title="Query the provider to retrieve all available models live"
            >
              {isFetchingModels ? <span className="btn-spinner" /> : '🌐'} Auto-Fetch Models
            </button>
          </div>

          {/* Real-time Connection Status Card */}
          {testResult && (
            <div className={`status-feedback-card ${testResult.success ? 'success' : 'error'}`}>
              <div className="status-header">
                <span className="status-dot" />
                <span className="status-text">{testResult.message}</span>
              </div>
              {testResult.models && testResult.models.length > 0 && (
                <div className="discovered-models-list">
                  <div className="discovered-title">Verified Models Available (Click to Select & Activate):</div>
                  <div className="models-tag-cloud">
                    {testResult.models.map((m) => {
                      const parenMatch = m.match(/\(([^)]+)\)$/);
                      const cleanId = (parenMatch && parenMatch[1] ? parenMatch[1] : m).replace(/^models\//, '').trim();
                      const fullKey = `${selectedProvider}:${cleanId}`;
                      const isSelected = customModel === cleanId || customModel === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          className={`model-tag-pill ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setCustomModel(cleanId);
                            localStorage.setItem(`smartboard_model_${selectedProvider}`, cleanId);
                            localStorage.setItem('smartboard_active_model_key', fullKey);
                            onConfigSaved?.();
                            onModelConfigChanged?.(fullKey);
                          }}
                          title={`Click to select & activate ${cleanId}`}
                        >
                          {isSelected ? '✓ ' : ''}{m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <span className="footer-secure-note">
            🔒 API keys are stored securely using OS DPAPI encryption and never shared.
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="drawer-apply-btn"
              onClick={async () => {
                const electronAi = (window as any).electronAPI?.ai;
                if (electronAi) {
                  const keySave = await savePendingApiKeyIfEntered(electronAi);
                  if (!keySave.ok) {
                    setTestResult({
                      success: false,
                      message: `Failed to store API key: ${keySave.error}`,
                    });
                    return;
                  }
                }
                if (customEndpoint.trim()) {
                  localStorage.setItem(`smartboard_endpoint_${selectedProvider}`, customEndpoint.trim());
                }
                const finalModel =
                  selectedProvider === 'gemini'
                    ? normalizeGeminiModelId(customModel) || activeProviderMeta.defaultModel
                    : customModel.trim() || activeProviderMeta.defaultModel;
                const fullKey = `${selectedProvider}:${finalModel}`;
                localStorage.setItem(`smartboard_model_${selectedProvider}`, finalModel);
                localStorage.setItem('smartboard_active_model_key', fullKey);
                onConfigSaved?.();
                onModelConfigChanged?.(fullKey);
                onClose();
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Apply model and return to chatbox"
            >
              ✓ Use Model & Start Chatting
            </button>
            <button
              type="button"
              className="drawer-done-btn"
              onClick={async () => {
                const electronAi = (window as any).electronAPI?.ai;
                if (electronAi) {
                  const keySave = await savePendingApiKeyIfEntered(electronAi);
                  if (!keySave.ok) {
                    setTestResult({
                      success: false,
                      message: `Failed to store API key: ${keySave.error}`,
                    });
                    return;
                  }
                  if (keySave.savedNewKey) {
                    onConfigSaved?.();
                    onModelConfigChanged?.();
                  }
                }
                onClose();
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

