/**
 * openaiAdapter.ts — OpenAI & OpenAI-Compatible API Adapter
 * Milestone 5: TASK-105
 */

import { AIModelInfo, AIProviderType } from '../../../../shared/aiPresentationTypes';
import {
  AIConnectionTestOptions,
  AIConnectionTestResult,
  AIListModelsOptions,
  AIProviderAdapter,
  AIStructuredGenerationRequest,
  AIStructuredGenerationResponse,
  AITextGenerationRequest,
  AITextGenerationResponse,
  extractJsonFromResponse,
  fetchWithTimeout,
  sanitizeErrorMessage,
} from './providerAdapter';

export const OPENAI_DEFAULT_ENDPOINT = 'https://api.openai.com/v1';
export const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';

export const OPENAI_CURATED_MODELS: AIModelInfo[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Fast & Cost-Effective — Recommended)',
    provider: 'openai',
    isLocal: false,
    contextLength: 128000,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (High Intelligence Multimodal Flagship)',
    provider: 'openai',
    isLocal: false,
    contextLength: 128000,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    isLocal: false,
    contextLength: 128000,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo (Legacy Speed)',
    provider: 'openai',
    isLocal: false,
    contextLength: 16385,
  },
];

export class OpenAIAdapter implements AIProviderAdapter {
  readonly provider: AIProviderType = 'openai';
  readonly defaultEndpoint: string = OPENAI_DEFAULT_ENDPOINT;
  readonly defaultModel: string = OPENAI_DEFAULT_MODEL;

  private resolveEndpoint(endpoint?: string): string {
    const raw = endpoint?.trim() || this.defaultEndpoint;
    return raw.replace(/\/+$/, '');
  }

  async testConnection(options?: AIConnectionTestOptions): Promise<AIConnectionTestResult> {
    const apiKey = options?.apiKey?.trim();
    if (!apiKey) {
      return {
        success: false,
        provider: this.provider,
        error: 'OpenAI API key is missing. Please configure your API key in Settings.',
      };
    }

    const endpoint = this.resolveEndpoint(options?.endpoint);
    const startTime = Date.now();

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/models`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
        options?.timeoutMs || 15000,
        options?.signal
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `OpenAI API returned status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const json = await response.json();
      const modelList: string[] = Array.isArray(json?.data)
        ? json.data
            .map((m: { id: string }) => m.id)
            .filter((id: string) => typeof id === 'string' && (id.includes('gpt') || id.includes('o1') || id.includes('o3')))
            .slice(0, 10)
        : [];

      return {
        success: true,
        provider: this.provider,
        latencyMs,
        models: modelList.length > 0 ? modelList : OPENAI_CURATED_MODELS.map((m) => m.id),
      };
    } catch (err) {
      return {
        success: false,
        provider: this.provider,
        error: sanitizeErrorMessage(err, apiKey),
      };
    }
  }

  async listModels(options?: AIListModelsOptions): Promise<AIModelInfo[]> {
    const apiKey = options?.apiKey?.trim();
    if (!apiKey) {
      return OPENAI_CURATED_MODELS;
    }

    const endpoint = this.resolveEndpoint(options?.endpoint);

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/models`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
        options?.timeoutMs || 15000,
        options?.signal
      );

      if (!response.ok) {
        return OPENAI_CURATED_MODELS;
      }

      const json = await response.json();
      if (!Array.isArray(json?.data)) {
        return OPENAI_CURATED_MODELS;
      }

      const discovered: AIModelInfo[] = json.data
        .filter((item: { id: string }) => {
          const id = item.id.toLowerCase();
          return id.startsWith('gpt-4') || id.startsWith('gpt-3.5') || id.startsWith('o1') || id.startsWith('o3');
        })
        .map((item: { id: string }) => {
          const known = OPENAI_CURATED_MODELS.find((m) => m.id === item.id);
          return (
            known || {
              id: item.id,
              name: item.id,
              provider: 'openai' as AIProviderType,
              isLocal: false,
              contextLength: item.id.includes('mini') || item.id.includes('4o') ? 128000 : 16385,
            }
          );
        });

      return discovered.length > 0 ? discovered : OPENAI_CURATED_MODELS;
    } catch {
      return OPENAI_CURATED_MODELS;
    }
  }

  async generateText(request: AITextGenerationRequest): Promise<AITextGenerationResponse> {
    const apiKey = request.apiKey?.trim();
    if (!apiKey) {
      return {
        success: false,
        text: '',
        model: request.model || this.defaultModel,
        provider: this.provider,
        error: 'OpenAI API key is missing. Please configure your key in settings.',
      };
    }

    const endpoint = this.resolveEndpoint(request.endpoint);
    const model = request.model?.trim() || this.defaultModel;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (request.systemPrompt && request.systemPrompt.trim().length > 0) {
      messages.push({ role: 'system', content: request.systemPrompt.trim() });
    }
    messages.push({ role: 'user', content: request.prompt });

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: typeof request.temperature === 'number' ? request.temperature : 0.7,
            max_tokens: request.maxTokens || 4096,
          }),
        },
        request.timeoutMs || 45000,
        request.signal
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `OpenAI API returned status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const json = await response.json();
      const choice = json?.choices?.[0];
      const text = choice?.message?.content || '';

      return {
        success: true,
        text,
        model: json?.model || model,
        provider: this.provider,
        finishReason: choice?.finish_reason,
        usage: {
          promptTokens: json?.usage?.prompt_tokens,
          completionTokens: json?.usage?.completion_tokens,
          totalTokens: json?.usage?.total_tokens,
        },
      };
    } catch (err) {
      return {
        success: false,
        text: '',
        model,
        provider: this.provider,
        error: sanitizeErrorMessage(err, apiKey),
      };
    }
  }

  async generateStructuredJson<T = unknown>(
    request: AIStructuredGenerationRequest
  ): Promise<AIStructuredGenerationResponse<T>> {
    const apiKey = request.apiKey?.trim();
    if (!apiKey) {
      return {
        success: false,
        data: null,
        rawText: '',
        model: request.model || this.defaultModel,
        provider: this.provider,
        error: 'OpenAI API key is missing. Please configure your key in settings.',
      };
    }

    const endpoint = this.resolveEndpoint(request.endpoint);
    const model = request.model?.trim() || this.defaultModel;

    const baseSystemPrompt = request.systemPrompt ? `${request.systemPrompt}\n\n` : '';
    const strictJsonPrompt = `${baseSystemPrompt}IMPORTANT: You must return strictly valid JSON matching the required schema. Do not include markdown preamble, conversational commentary, or explanations outside the JSON object.`;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      { role: 'system', content: strictJsonPrompt },
      { role: 'user', content: request.prompt },
    ];

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            response_format: { type: 'json_object' },
            temperature: typeof request.temperature === 'number' ? request.temperature : 0.5,
            max_tokens: request.maxTokens || 4096,
          }),
        },
        request.timeoutMs || 45000,
        request.signal
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `OpenAI API returned status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const json = await response.json();
      const choice = json?.choices?.[0];
      const rawText = choice?.message?.content || '';

      const extracted = extractJsonFromResponse<T>(rawText);
      if (extracted.error || extracted.data === null) {
        return {
          success: false,
          data: null,
          rawText,
          model: json?.model || model,
          provider: this.provider,
          error: extracted.error || 'Failed to parse structured JSON from OpenAI output.',
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
        error: sanitizeErrorMessage(err, apiKey),
      };
    }
  }
}

