/**
 * geminiAdapter.ts — Google Gemini API Adapter
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

export const GEMINI_DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
export const GEMINI_DEFAULT_MODEL = 'gemini-3.8-flash';

export const GEMINI_CURATED_MODELS: AIModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash (Fast & Capable — Google Recommended)',
    provider: 'gemini',
    isLocal: false,
    contextLength: 1048576,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest (Always Active Latest Flash)',
    provider: 'gemini',
    isLocal: false,
    contextLength: 1048576,
  },
  {
    id: 'gemini-pro-latest',
    name: 'Gemini Pro Latest (Deep Multimodal Reasoning)',
    provider: 'gemini',
    isLocal: false,
    contextLength: 2097152,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    isLocal: false,
    contextLength: 1048576,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    isLocal: false,
    contextLength: 2097152,
  },
];

export class GeminiAdapter implements AIProviderAdapter {
  readonly provider: AIProviderType = 'gemini';
  readonly defaultEndpoint: string = GEMINI_DEFAULT_ENDPOINT;
  readonly defaultModel: string = GEMINI_DEFAULT_MODEL;

  private resolveEndpoint(endpoint?: string): string {
    const raw = endpoint?.trim() || this.defaultEndpoint;
    return raw.replace(/\/+$/, '');
  }

  private cleanModelId(model: string): string {
    const trimmed = model.trim();
    return trimmed.startsWith('models/') ? trimmed.substring('models/'.length) : trimmed;
  }

  async testConnection(options?: AIConnectionTestOptions): Promise<AIConnectionTestResult> {
    const apiKey = options?.apiKey?.trim();
    if (!apiKey) {
      return {
        success: false,
        provider: this.provider,
        error: 'Google Gemini API key is missing. Please configure your key in Settings.',
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
            'x-goog-api-key': apiKey,
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
          `Google Gemini API returned status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const json = await response.json();
      const modelList: string[] = Array.isArray(json?.models)
        ? json.models
            .map((m: { name?: string }) => m.name?.replace(/^models\//, '') || '')
            .filter((name: string) => name.toLowerCase().includes('gemini'))
            .slice(0, 10)
        : [];

      return {
        success: true,
        provider: this.provider,
        latencyMs,
        models: modelList.length > 0 ? modelList : GEMINI_CURATED_MODELS.map((m) => m.id),
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
      return GEMINI_CURATED_MODELS;
    }

    const endpoint = this.resolveEndpoint(options?.endpoint);

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/models`,
        {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        },
        options?.timeoutMs || 15000,
        options?.signal
      );

      if (!response.ok) {
        return GEMINI_CURATED_MODELS;
      }

      const json = await response.json();
      if (!Array.isArray(json?.models)) {
        return GEMINI_CURATED_MODELS;
      }

      const discovered: AIModelInfo[] = json.models
        .filter((item: { name?: string; supportedGenerationMethods?: string[] }) => {
          const name = (item.name || '').toLowerCase();
          const methods = item.supportedGenerationMethods || [];
          return name.includes('gemini') && methods.includes('generateContent');
        })
        .map((item: { name: string; displayName?: string; inputTokenLimit?: number }) => {
          const cleanId = item.name.replace(/^models\//, '');
          const known = GEMINI_CURATED_MODELS.find((m) => m.id === cleanId);
          return (
            known || {
              id: cleanId,
              name: item.displayName || cleanId,
              provider: 'gemini' as AIProviderType,
              isLocal: false,
              contextLength: item.inputTokenLimit || 1048576,
            }
          );
        });

      return discovered.length > 0 ? discovered : GEMINI_CURATED_MODELS;
    } catch {
      return GEMINI_CURATED_MODELS;
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
        error: 'Google Gemini API key is missing. Please configure your key in Settings.',
      };
    }

    const endpoint = this.resolveEndpoint(request.endpoint);
    let rawModel = request.model?.trim() || this.defaultModel;
    if (rawModel === 'gemini-1.5-flash' || rawModel === 'gemini-2.0-flash') {
      rawModel = 'gemini-3.8-flash';
    }
    let cleanModel = this.cleanModelId(rawModel);

    const bodyPayload: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: request.prompt }],
        },
      ],
      generationConfig: {
        temperature: typeof request.temperature === 'number' ? request.temperature : 0.7,
        maxOutputTokens: request.maxTokens || 4096,
      },
    };

    if (request.systemPrompt && request.systemPrompt.trim().length > 0) {
      bodyPayload.systemInstruction = {
        parts: [{ text: request.systemPrompt.trim() }],
      };
    }

    try {
      let response = await fetchWithTimeout(
        `${endpoint}/models/${cleanModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        },
        request.timeoutMs || 45000,
        request.signal
      );

      // Auto-fallback if requested model is deprecated / 404
      if (!response.ok && response.status === 404 && cleanModel !== 'gemini-3.8-flash') {
        cleanModel = 'gemini-3.8-flash';
        response = await fetchWithTimeout(
          `${endpoint}/models/${cleanModel}:generateContent`,
          {
            method: 'POST',
            headers: {
              'x-goog-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyPayload),
          },
          request.timeoutMs || 45000,
          request.signal
        );
      }

      if (!response.ok && response.status === 404 && cleanModel !== 'gemini-flash-latest') {
        cleanModel = 'gemini-flash-latest';
        response = await fetchWithTimeout(
          `${endpoint}/models/${cleanModel}:generateContent`,
          {
            method: 'POST',
            headers: {
              'x-goog-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyPayload),
          },
          request.timeoutMs || 45000,
          request.signal
        );
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Google Gemini API returned status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const json = await response.json();
      const candidate = json?.candidates?.[0];
      const partText = candidate?.content?.parts?.[0]?.text || '';

      return {
        success: true,
        text: partText,
        model: cleanModel,
        provider: this.provider,
        finishReason: candidate?.finishReason,
        usage: {
          promptTokens: json?.usageMetadata?.promptTokenCount,
          completionTokens: json?.usageMetadata?.candidatesTokenCount,
          totalTokens: json?.usageMetadata?.totalTokenCount,
        },
      };
    } catch (err) {
      return {
        success: false,
        text: '',
        model: cleanModel,
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
        error: 'Google Gemini API key is missing. Please configure your key in Settings.',
      };
    }

    const endpoint = this.resolveEndpoint(request.endpoint);
    const rawModel = request.model?.trim() || this.defaultModel;
    const cleanModel = this.cleanModelId(rawModel);

    const baseSystemPrompt = request.systemPrompt ? `${request.systemPrompt}\n\n` : '';
    const strictJsonPrompt = `${baseSystemPrompt}IMPORTANT: You must output ONLY a valid JSON object. Do not include markdown code blocks or explanations outside the JSON payload.`;

    const bodyPayload: Record<string, unknown> = {
      systemInstruction: {
        parts: [{ text: strictJsonPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: request.prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: typeof request.temperature === 'number' ? request.temperature : 0.4,
        maxOutputTokens: request.maxTokens || 4096,
      },
    };

    try {
      const response = await fetchWithTimeout(
        `${endpoint}/models/${cleanModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        },
        request.timeoutMs || 45000,
        request.signal
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Google Gemini API returned status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const json = await response.json();
      const candidate = json?.candidates?.[0];
      const rawText = candidate?.content?.parts?.[0]?.text || '';

      const extracted = extractJsonFromResponse<T>(rawText);
      if (extracted.error || extracted.data === null) {
        return {
          success: false,
          data: null,
          rawText,
          model: cleanModel,
          provider: this.provider,
          error: extracted.error || 'Failed to parse structured JSON from Google Gemini output.',
        };
      }

      return {
        success: true,
        data: extracted.data,
        rawText,
        model: cleanModel,
        provider: this.provider,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        rawText: '',
        model: cleanModel,
        provider: this.provider,
        error: sanitizeErrorMessage(err, apiKey),
      };
    }
  }
}

