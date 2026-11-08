/**
 * ollamaAdapter.ts — Local Offline Ollama LLM Adapter
 * Milestone 5: TASK-106
 * 
 * Supports local, 100% offline educational presentation generation using Ollama.
 * No internet connection or cloud API key required.
 */

import {
  AIModelInfo,
  AIProviderType,
  OllamaStatus,
  OllamaStatusInfo,
} from '../../../../shared/aiPresentationTypes';
import {
  AIConnectionTestOptions,
  AIConnectionTestResult,
  AIListModelsOptions,
  AIProviderAdapter,
  AIStructuredGenerationRequest,
  AIStructuredGenerationResponse,
  AITextGenerationRequest,
  AITextGenerationResponse,
  AITokenUsage,
  extractJsonFromResponse,
  fetchWithTimeout,
  sanitizeErrorMessage,
} from './providerAdapter';

export const OLLAMA_DEFAULT_ENDPOINT = 'http://localhost:11434';
export const OLLAMA_DEFAULT_MODEL = 'llama3.2';

export const OLLAMA_RECOMMENDED_MODELS: AIModelInfo[] = [
  {
    id: 'llama3.2:latest',
    name: 'Llama 3.2 (3.2B • 2.0 GB — Fast & Recommended)',
    provider: 'ollama',
    isLocal: true,
    family: 'llama',
    parameterSize: '3.2B',
    contextLength: 131072,
  },
  {
    id: 'mistral:latest',
    name: 'Mistral (7B • 4.1 GB — Strong Classroom Reasoning)',
    provider: 'ollama',
    isLocal: true,
    family: 'llama',
    parameterSize: '7B',
    contextLength: 32768,
  },
  {
    id: 'deepseek-r1:latest',
    name: 'DeepSeek R1 (7B/8B — Deep Pedagogical Explanations)',
    provider: 'ollama',
    isLocal: true,
    family: 'qwen2',
    parameterSize: '7B',
    contextLength: 65536,
  },
  {
    id: 'phi3:latest',
    name: 'Phi-3 Mini (3.8B • 2.3 GB — Lightweight & Efficient)',
    provider: 'ollama',
    isLocal: true,
    family: 'phi3',
    parameterSize: '3.8B',
    contextLength: 128000,
  },
];

/**
 * Formats byte size into human-readable representation (e.g. "2.0 GB" or "500 MB").
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || typeof bytes !== 'number' || bytes <= 0) return '';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

export interface OllamaRawTagItem {
  name: string;
  model?: string;
  modified_at?: string;
  size?: number;
  digest?: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export class OllamaAdapter implements AIProviderAdapter {
  readonly provider: AIProviderType = 'ollama';
  readonly defaultEndpoint: string = OLLAMA_DEFAULT_ENDPOINT;
  readonly defaultModel: string = OLLAMA_DEFAULT_MODEL;

  resolveEndpoint(endpoint?: string): string {
    const raw = endpoint?.trim() || this.defaultEndpoint;
    return raw.replace(/\/+$/, '');
  }

  /**
   * Performs an in-depth health and discovery check on the local Ollama instance.
   * Accurately distinguishes:
   * - 'unavailable': Ollama is not installed or not running
   * - 'no-models': Ollama is active, but 0 models are installed
   * - 'ready': Ollama is running and has installed models
   */
  async checkStatus(options?: {
    endpoint?: string;
    model?: string;
    timeoutMs?: number;
    signal?: AbortSignal;
  }): Promise<OllamaStatusInfo> {
    const endpoint = this.resolveEndpoint(options?.endpoint);
    const targetModel = options?.model?.trim() || this.defaultModel;

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/api/tags`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        options?.timeoutMs || 5000,
        options?.signal
      );

      if (!response.ok) {
        return {
          status: 'unavailable',
          available: false,
          message: `Ollama returned status ${response.status}. Please check your local Ollama daemon.`,
          installedModels: [],
          selectedModelAvailable: false,
        };
      }

      const json = await response.json();
      const rawModels: OllamaRawTagItem[] = Array.isArray(json?.models) ? json.models : [];

      if (rawModels.length === 0) {
        return {
          status: 'no-models',
          available: true,
          message: 'Ollama is running locally, but no models are installed yet. Open your terminal and run: ollama run llama3.2',
          installedModels: [],
          selectedModelAvailable: false,
        };
      }

      const installedModels: AIModelInfo[] = rawModels.map((item) => {
        const id = item.name || item.model || '';
        const paramSize = item.details?.parameter_size;
        const sizeStr = formatBytes(item.size);

        // Build human-friendly label if metadata is available without inventing data
        let name = id;
        const metaParts: string[] = [];
        if (paramSize) metaParts.push(paramSize);
        if (sizeStr) metaParts.push(sizeStr);
        if (metaParts.length > 0) {
          name = `${id} (${metaParts.join(' • ')})`;
        }

        return {
          id,
          name,
          provider: 'ollama',
          isLocal: true,
          sizeBytes: item.size,
          sizeFormatted: sizeStr,
          family: item.details?.family,
          parameterSize: paramSize,
          quantizationLevel: item.details?.quantization_level,
          modifiedAt: item.modified_at,
        };
      });

      const isModelInstalled = installedModels.some(
        (m) =>
          m.id === targetModel ||
          m.id.startsWith(`${targetModel}:`) ||
          (targetModel.includes(':') && m.id === targetModel)
      );

      return {
        status: 'ready',
        available: true,
        message: isModelInstalled
          ? `Ollama is running and ready with ${targetModel}.`
          : `Ollama is running with ${installedModels.length} models installed. (Model "${targetModel}" not installed).`,
        installedModels,
        selectedModelAvailable: isModelInstalled,
      };
    } catch {
      return {
        status: 'unavailable',
        available: false,
        message: `Ollama is not running at ${endpoint}. Please launch the Ollama desktop app or run "ollama serve".`,
        installedModels: [],
        selectedModelAvailable: false,
      };
    }
  }

  async testConnection(options?: AIConnectionTestOptions): Promise<AIConnectionTestResult> {
    const startTime = Date.now();
    const statusInfo = await this.checkStatus({
      endpoint: options?.endpoint,
      model: options?.model,
      timeoutMs: options?.timeoutMs || 8000,
      signal: options?.signal,
    });

    const latencyMs = Date.now() - startTime;

    if (statusInfo.status === 'unavailable') {
      return {
        success: false,
        provider: this.provider,
        error: statusInfo.message,
      };
    }

    if (statusInfo.status === 'no-models') {
      return {
        success: true,
        provider: this.provider,
        latencyMs,
        models: [],
        warning: statusInfo.message,
      };
    }

    return {
      success: true,
      provider: this.provider,
      latencyMs,
      models: statusInfo.installedModels.map((m) => m.id),
    };
  }

  async listModels(options?: AIListModelsOptions): Promise<AIModelInfo[]> {
    const statusInfo = await this.checkStatus({
      endpoint: options?.endpoint,
      timeoutMs: options?.timeoutMs || 8000,
      signal: options?.signal,
    });

    if (statusInfo.installedModels.length > 0) {
      return statusInfo.installedModels;
    }

    // Do not invent missing local models if Ollama is empty or unavailable
    return [];
  }

  async generateText(request: AITextGenerationRequest): Promise<AITextGenerationResponse> {
    const endpoint = this.resolveEndpoint(request.endpoint);
    const model = request.model?.trim() || this.defaultModel;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (request.systemPrompt && request.systemPrompt.trim().length > 0) {
      messages.push({ role: 'system', content: request.systemPrompt.trim() });
    }
    messages.push({ role: 'user', content: request.prompt });

    const isStreaming = typeof request.onChunk === 'function';

    const bodyPayload = {
      model,
      messages,
      stream: isStreaming,
      options: {
        temperature: typeof request.temperature === 'number' ? request.temperature : 0.7,
        num_predict: request.maxTokens || 4096,
      },
    };

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        },
        request.timeoutMs || 60000,
        request.signal
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            text: '',
            model,
            provider: this.provider,
            error: `Model "${model}" was not found in your local Ollama installation. Please run "ollama pull ${model}" to install it.`,
          };
        }
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Ollama API returned status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      // Handle streaming responses
      if (isStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        let finishReason = 'stop';
        let totalUsage: AITokenUsage = {};
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed);
              const token = chunk?.message?.content || '';
              if (token) {
                accumulated += token;
                request.onChunk!(token, accumulated);
              }
              if (chunk?.done) {
                finishReason = chunk.done_reason || 'stop';
                totalUsage = {
                  promptTokens: chunk.prompt_eval_count,
                  completionTokens: chunk.eval_count,
                  totalTokens: (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
                };
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }

        return {
          success: true,
          text: accumulated,
          model,
          provider: this.provider,
          finishReason,
          usage: totalUsage,
        };
      }

      // Handle standard non-streaming response
      const json = await response.json();
      const text = json?.message?.content || '';

      return {
        success: true,
        text,
        model: json?.model || model,
        provider: this.provider,
        finishReason: json?.done_reason || 'stop',
        usage: {
          promptTokens: json?.prompt_eval_count,
          completionTokens: json?.eval_count,
          totalTokens: (json?.prompt_eval_count || 0) + (json?.eval_count || 0),
        },
      };
    } catch (err) {
      return {
        success: false,
        text: '',
        model,
        provider: this.provider,
        error: sanitizeErrorMessage(err),
      };
    }
  }

  async generateStructuredJson<T = unknown>(
    request: AIStructuredGenerationRequest
  ): Promise<AIStructuredGenerationResponse<T>> {
    const endpoint = this.resolveEndpoint(request.endpoint);
    const model = request.model?.trim() || this.defaultModel;

    const baseSystemPrompt = request.systemPrompt ? `${request.systemPrompt}\n\n` : '';
    const strictJsonPrompt = `${baseSystemPrompt}IMPORTANT: You must return strictly valid JSON. Do not include markdown code fences (like \`\`\`json) or conversational explanations outside the JSON object. Output pure JSON only.`;

    const messages = [
      { role: 'system', content: strictJsonPrompt },
      { role: 'user', content: request.prompt },
    ];

    const bodyPayload = {
      model,
      messages,
      stream: false,
      format: 'json', // Ollama JSON-mode format constraint
      options: {
        temperature: typeof request.temperature === 'number' ? request.temperature : 0.4,
        num_predict: request.maxTokens || 4096,
      },
    };

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        },
        request.timeoutMs || 60000,
        request.signal
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            data: null,
            rawText: '',
            model,
            provider: this.provider,
            error: `Model "${model}" was not found in your local Ollama installation. Please run "ollama pull ${model}" to install it.`,
          };
        }
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Ollama API returned status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const json = await response.json();
      const rawText = json?.message?.content || '';

      const extracted = extractJsonFromResponse<T>(rawText);
      if (extracted.error || extracted.data === null) {
        return {
          success: false,
          data: null,
          rawText,
          model: json?.model || model,
          provider: this.provider,
          error: extracted.error || 'Failed to parse structured JSON from local Ollama output.',
        };
      }

      return {
        success: true,
        data: extracted.data,
        rawText,
        model: json?.model || model,
        provider: this.provider,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        rawText: '',
        model,
        provider: this.provider,
        error: sanitizeErrorMessage(err),
      };
    }
  }
}
