/**
 * aiProviderManager.ts — Client-Side AI Provider Configuration & Dispatcher
 * Milestone 5: TASK-105
 * 
 * Manages provider selection, model selection, non-secret preferences,
 * and delegates encrypted key operations to the Electron main process via secure IPC.
 */

import {
  AIConnectionTestResult,
  AIModelInfo,
  AIProviderConfig,
  AIProviderType,
  AIStructuredGenerationRequest,
  AIStructuredGenerationResponse,
  AITextGenerationRequest,
  AITextGenerationResponse,
} from '../../../shared/aiPresentationTypes';
import {
  GEMINI_LEGACY_PHANTOM_MODEL_IDS,
  isSupportedGeminiChatModel,
  normalizeGeminiModelId,
} from '../../../shared/geminiModelUtils';
import {
  AIConnectionTestOptions,
  AIProviderAdapter,
  GeminiAdapter,
  GEMINI_CURATED_MODELS,
  GEMINI_DEFAULT_ENDPOINT,
  GEMINI_DEFAULT_MODEL,
  OllamaAdapter,
  OLLAMA_DEFAULT_ENDPOINT,
  OLLAMA_DEFAULT_MODEL,
  OLLAMA_RECOMMENDED_MODELS,
  OpenAIAdapter,
  OPENAI_CURATED_MODELS,
  OPENAI_DEFAULT_ENDPOINT,
  OPENAI_DEFAULT_MODEL,
} from './adapters';
import { OllamaStatusInfo } from '../../../shared/aiPresentationTypes';

export interface ProviderManagerSettings {
  activeProvider: AIProviderType;
  selectedModels: Record<AIProviderType, string>;
  customEndpoints: Record<AIProviderType, string>;
  temperatures: Record<AIProviderType, number>;
  timeoutMs: number;
}

const DEFAULT_SETTINGS: ProviderManagerSettings = {
  activeProvider: 'openai',
  selectedModels: {
    openai: OPENAI_DEFAULT_MODEL,
    gemini: GEMINI_DEFAULT_MODEL,
    'custom-openai': OPENAI_DEFAULT_MODEL,
    ollama: 'llama3.2',
  },
  customEndpoints: {
    openai: OPENAI_DEFAULT_ENDPOINT,
    gemini: GEMINI_DEFAULT_ENDPOINT,
    'custom-openai': '',
    ollama: 'http://localhost:11434',
  },
  temperatures: {
    openai: 0.7,
    gemini: 0.7,
    'custom-openai': 0.7,
    ollama: 0.7,
  },
  timeoutMs: 30000,
};

export class AIProviderManager {
  private settings: ProviderManagerSettings;
  private adapters: Map<AIProviderType, AIProviderAdapter>;

  constructor(initialSettings?: Partial<ProviderManagerSettings>) {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...initialSettings,
      selectedModels: {
        ...DEFAULT_SETTINGS.selectedModels,
        ...(initialSettings?.selectedModels || {}),
      },
      customEndpoints: {
        ...DEFAULT_SETTINGS.customEndpoints,
        ...(initialSettings?.customEndpoints || {}),
      },
      temperatures: {
        ...DEFAULT_SETTINGS.temperatures,
        ...(initialSettings?.temperatures || {}),
      },
    };

    this.adapters = new Map();
    this.adapters.set('openai', new OpenAIAdapter());
    this.adapters.set('gemini', new GeminiAdapter());
    this.adapters.set('custom-openai', new OpenAIAdapter());
    this.adapters.set('ollama', new OllamaAdapter());
  }

  // ─── Provider & Model Settings ─────────────────────────────────────────────

  getActiveProvider(): AIProviderType {
    if (typeof localStorage !== 'undefined') {
      const activeKey = localStorage.getItem('smartboard_active_model_key');
      if (activeKey && activeKey !== 'offline:default') {
        const prov = activeKey.split(':')[0] as AIProviderType;
        if (['ollama', 'gemini', 'openai', 'custom-openai'].includes(prov)) {
          return prov;
        }
      }
      const savedOllama = localStorage.getItem('smartboard_model_ollama');
      if (savedOllama) return 'ollama';
      const savedGemini = localStorage.getItem('smartboard_model_gemini');
      if (savedGemini) return 'gemini';
    }
    return this.settings.activeProvider;
  }

  setActiveProvider(provider: AIProviderType): void {
    this.settings.activeProvider = provider;
  }

  getSelectedModel(provider?: AIProviderType): string {
    const p = provider || this.getActiveProvider();
    const sanitizeGeminiCandidate = (candidate: string): string | null => {
      const cleanId = normalizeGeminiModelId(candidate);
      if (!cleanId || !isSupportedGeminiChatModel(cleanId)) return null;
      if (GEMINI_LEGACY_PHANTOM_MODEL_IDS.has(cleanId.toLowerCase())) {
        try {
          const cachedRaw = localStorage.getItem('smartboard_discovered_models_gemini');
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (Array.isArray(parsed) && parsed.some((m: any) => normalizeGeminiModelId(typeof m === 'string' ? m : m?.id) === cleanId)) {
              return cleanId;
            }
          }
        } catch {}
        return null;
      }
      return cleanId;
    };

    if (typeof localStorage !== 'undefined') {
      const activeKey = localStorage.getItem('smartboard_active_model_key');
      if (activeKey && activeKey.startsWith(`${p}:`)) {
        const candidate = activeKey.slice(p.length + 1);
        if (p === 'gemini') {
          return sanitizeGeminiCandidate(candidate) || GEMINI_DEFAULT_MODEL;
        }
        return candidate;
      }
      const savedM = localStorage.getItem(`smartboard_model_${p}`);
      if (savedM) {
        if (p === 'gemini') {
          return sanitizeGeminiCandidate(savedM) || GEMINI_DEFAULT_MODEL;
        }
        return savedM;
      }
    }
    return this.settings.selectedModels[p] || (p === 'gemini' ? GEMINI_DEFAULT_MODEL : p === 'ollama' ? 'llama3.2' : OPENAI_DEFAULT_MODEL);
  }

  setSelectedModel(model: string, provider?: AIProviderType): void {
    const p = provider || this.settings.activeProvider;
    this.settings.selectedModels[p] = model;
  }

  getCustomEndpoint(provider?: AIProviderType): string {
    const p = provider || this.settings.activeProvider;
    return this.settings.customEndpoints[p] || '';
  }

  setCustomEndpoint(endpoint: string, provider?: AIProviderType): void {
    const p = provider || this.settings.activeProvider;
    this.settings.customEndpoints[p] = endpoint;
  }

  getTemperature(provider?: AIProviderType): number {
    const p = provider || this.settings.activeProvider;
    return this.settings.temperatures[p] ?? 0.7;
  }

  setTemperature(temp: number, provider?: AIProviderType): void {
    const p = provider || this.settings.activeProvider;
    this.settings.temperatures[p] = Math.max(0, Math.min(2, temp));
  }

  getTimeoutMs(): number {
    return this.settings.timeoutMs;
  }

  setTimeoutMs(ms: number): void {
    this.settings.timeoutMs = Math.max(5000, ms);
  }

  getConfig(provider?: AIProviderType): AIProviderConfig {
    const p = provider || this.settings.activeProvider;
    return {
      provider: p,
      selectedModel: this.getSelectedModel(p),
      endpoint: this.getCustomEndpoint(p),
      temperature: this.getTemperature(p),
      timeoutMs: this.getTimeoutMs(),
    };
  }

  // ─── Key Management via Secure IPC ─────────────────────────────────────────

  /**
   * Encrypts and securely stores an API key in Electron safeStorage.
   * Renderer never retains the key in storage or variables.
   */
  async saveApiKey(provider: AIProviderType, apiKey: string): Promise<{ success: boolean; error?: string }> {
    const cleanKey = apiKey?.trim();
    if (!cleanKey) {
      return { success: false, error: 'API key cannot be empty.' };
    }

    if (typeof window !== 'undefined' && (window as any).electronAPI?.ai?.saveApiKey) {
      const res = await (window as any).electronAPI.ai.saveApiKey(provider, cleanKey);
      if (res?.success && typeof localStorage !== 'undefined') {
        localStorage.removeItem(`smartboard_discovered_models_${provider}`);
      }
      return res;
    }

    return {
      success: false,
      error: 'Electron secure credential bridge is not available.',
    };
  }

  /**
   * Checks whether an API key has been securely configured for the provider.
   */
  async hasApiKey(provider?: AIProviderType): Promise<boolean> {
    const p = provider || this.settings.activeProvider;
    if (typeof window !== 'undefined' && (window as any).electronAPI?.ai?.hasApiKey) {
      return (window as any).electronAPI.ai.hasApiKey(p);
    }
    return false;
  }

  /**
   * Deletes the stored API key for the provider.
   */
  async deleteApiKey(provider?: AIProviderType): Promise<boolean> {
    const p = provider || this.settings.activeProvider;
    if (typeof window !== 'undefined' && (window as any).electronAPI?.ai?.deleteApiKey) {
      const deleted = await (window as any).electronAPI.ai.deleteApiKey(p);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`smartboard_discovered_models_${p}`);
        localStorage.removeItem(`smartboard_model_${p}`);
      }
      return deleted;
    }
    return false;
  }

  /**
   * Lists providers that currently have configured API keys.
   */
  async listConfiguredProviders(): Promise<string[]> {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.ai?.listConfiguredProviders) {
      return (window as any).electronAPI.ai.listConfiguredProviders();
    }
    return [];
  }

  // ─── Connection Testing & Model Discovery ──────────────────────────────────

  /**
   * Tests the connection for the specified provider.
   * If running in Electron, test occurs in the main process using the decrypted key.
   * If an explicit key is supplied (e.g. during testing), routes directly to the adapter.
   */
  async testConnection(provider?: AIProviderType, options?: AIConnectionTestOptions): Promise<AIConnectionTestResult> {
    const p = provider || this.settings.activeProvider;

    // Direct adapter execution if explicit apiKey is provided
    if (options?.apiKey) {
      const adapter = this.adapters.get(p);
      if (!adapter) {
        return { success: false, provider: p, error: `No adapter available for ${p}` };
      }
      return adapter.testConnection({
        ...options,
        endpoint: options.endpoint || this.getCustomEndpoint(p),
      });
    }

    // Electron IPC execution (decoupled key in main process)
    if (typeof window !== 'undefined' && (window as any).electronAPI?.ai?.testConnection) {
      return (window as any).electronAPI.ai.testConnection(p, {
        customEndpoint: this.getCustomEndpoint(p),
        timeoutMs: this.settings.timeoutMs,
      });
    }

    return {
      success: false,
      provider: p,
      error: 'Cannot test connection: No API key provided and Electron bridge is unavailable.',
    };
  }

  /**
   * Fetches models available for the provider, falling back to curated defaults.
   */
  async getAvailableModels(provider?: AIProviderType, apiKey?: string): Promise<AIModelInfo[]> {
    const p = provider || this.settings.activeProvider;

    // First attempt discovery through Electron main process bridge
    if (typeof window !== 'undefined' && (window as any).electronAPI?.ai?.listModels) {
      try {
        const live = await (window as any).electronAPI.ai.listModels(p, {
          customEndpoint: this.getCustomEndpoint(p),
          timeoutMs: 6000,
        });
        if (Array.isArray(live) && live.length > 0) {
          return live.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            provider: p,
            isLocal: Boolean(m.isLocal ?? p === 'ollama'),
            sizeFormatted: m.sizeFormatted,
            parameterSize: m.parameterSize,
          }));
        }
      } catch {
        // Fall through to adapter
      }
    }

    const adapter = this.adapters.get(p);
    if (!adapter) {
      if (p === 'gemini') return GEMINI_CURATED_MODELS;
      if (p === 'ollama') return OLLAMA_RECOMMENDED_MODELS;
      return OPENAI_CURATED_MODELS;
    }

    if (p === 'ollama') {
      const ollamaModels = await (adapter as OllamaAdapter).listModels({
        endpoint: this.getCustomEndpoint('ollama'),
        timeoutMs: 5000,
      });
      return ollamaModels.length > 0 ? ollamaModels : OLLAMA_RECOMMENDED_MODELS;
    }

    if (apiKey) {
      return adapter.listModels({
        apiKey,
        endpoint: this.getCustomEndpoint(p),
        timeoutMs: 10000,
      });
    }

    return p === 'gemini' ? GEMINI_CURATED_MODELS : OPENAI_CURATED_MODELS;
  }

  /**
   * Checks the live health status of local Ollama daemon and model availability.
   */
  async checkOllamaStatus(endpoint?: string, model?: string): Promise<OllamaStatusInfo> {
    const adapter = this.adapters.get('ollama') as OllamaAdapter | undefined;
    const ep = endpoint || this.getCustomEndpoint('ollama');
    const targetModel = model || this.getSelectedModel('ollama');

    if (adapter) {
      return adapter.checkStatus({ endpoint: ep, model: targetModel });
    }

    return {
      status: 'unavailable',
      available: false,
      message: 'Ollama adapter is not registered.',
      installedModels: [],
      selectedModelAvailable: false,
    };
  }

  // ─── Text & Structured JSON Generation ──────────────────────────────────────

  getAdapter(provider?: AIProviderType): AIProviderAdapter | undefined {
    const p = provider || this.settings.activeProvider;
    return this.adapters.get(p);
  }

  /**
   * Direct text generation dispatcher.
   */
  async generateText(request: AITextGenerationRequest): Promise<AITextGenerationResponse> {
    const p = request.provider || this.getActiveProvider();

    // Route through Electron main-process IPC if no direct key is supplied
    if (!request.apiKey && typeof window !== 'undefined' && (window as any).electronAPI?.ai?.generateText) {
      try {
        const res = await (window as any).electronAPI.ai.generateText({
          provider: p,
          model: request.model || this.getSelectedModel(p),
          prompt: request.prompt,
          systemPrompt: request.systemPrompt,
          temperature: typeof request.temperature === 'number' ? request.temperature : this.getTemperature(p),
          maxTokens: request.maxTokens,
          customEndpoint: request.endpoint || this.getCustomEndpoint(p),
          timeoutMs: request.timeoutMs || this.settings.timeoutMs,
          enableWebSearch: request.enableWebSearch,
        });
        if (res && (res.success || res.error)) {
          return {
            success: Boolean(res.success),
            text: res.text || '',
            model: res.model || request.model || this.getSelectedModel(p),
            provider: p,
            groundingSources: Array.isArray(res.groundingSources) ? res.groundingSources : undefined,
            error: res.error,
          };
        }
      } catch (err: any) {
        console.warn('Electron IPC generateText failed, falling back to renderer adapter:', err);
      }
    }

    const adapter = this.adapters.get(p);
    if (!adapter) {
      return {
        success: false,
        text: '',
        model: request.model || this.getSelectedModel(p),
        provider: p,
        error: `Provider adapter for "${p}" is not registered.`,
      };
    }

    return adapter.generateText({
      ...request,
      model: request.model || this.getSelectedModel(p),
      endpoint: request.endpoint || this.getCustomEndpoint(p),
      temperature: typeof request.temperature === 'number' ? request.temperature : this.getTemperature(p),
      timeoutMs: request.timeoutMs || this.settings.timeoutMs,
    });
  }

  /**
   * Structured JSON generation dispatcher.
   */
  async generateStructuredJson<T = unknown>(
    request: AIStructuredGenerationRequest
  ): Promise<AIStructuredGenerationResponse<T>> {
    const p = request.provider || this.getActiveProvider();

    // Route through Electron main-process IPC if no direct key is supplied
    if (!request.apiKey && typeof window !== 'undefined' && (window as any).electronAPI?.ai?.generateStructuredJson) {
      try {
        const res = await (window as any).electronAPI.ai.generateStructuredJson({
          provider: p,
          model: request.model || this.getSelectedModel(p),
          prompt: request.prompt,
          systemPrompt: request.systemPrompt,
          temperature: typeof request.temperature === 'number' ? request.temperature : 0.4,
          maxTokens: request.maxTokens,
          customEndpoint: request.endpoint || this.getCustomEndpoint(p),
          timeoutMs: request.timeoutMs || this.settings.timeoutMs,
        });
        if (res && res.success && res.data) {
          return {
            success: true,
            data: res.data as T,
            rawText: res.rawText || JSON.stringify(res.data),
            model: res.model || request.model || this.getSelectedModel(p),
            provider: p,
          };
        } else if (res && !res.success) {
          return {
            success: false,
            data: null,
            rawText: res.rawText || '',
            model: res.model || request.model || this.getSelectedModel(p),
            provider: p,
            error: res.error || 'Failed to generate structured JSON',
          };
        }
      } catch (err: any) {
        console.warn('Electron IPC generateStructuredJson failed, falling back to renderer adapter:', err);
      }
    }

    const adapter = this.adapters.get(p);
    if (!adapter) {
      return {
        success: false,
        data: null,
        rawText: '',
        model: request.model || this.getSelectedModel(p),
        provider: p,
        error: `Provider adapter for "${p}" is not registered.`,
      };
    }

    return adapter.generateStructuredJson<T>({
      ...request,
      model: request.model || this.getSelectedModel(p),
      endpoint: request.endpoint || this.getCustomEndpoint(p),
      temperature: typeof request.temperature === 'number' ? request.temperature : 0.4,
      timeoutMs: request.timeoutMs || this.settings.timeoutMs,
    });
  }
}

/** Global singleton instance */
export const aiProviderManager = new AIProviderManager();

