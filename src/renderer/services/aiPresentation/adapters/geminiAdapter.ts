/**
 * geminiAdapter.ts — Google Gemini API Adapter
 * Milestone 5: TASK-105
 */

import { AIModelInfo, AIProviderType } from '../../../../shared/aiPresentationTypes';
import {
  GEMINI_CURATED_MODELS as SHARED_GEMINI_CURATED_MODELS,
  GEMINI_DEFAULT_MODEL as SHARED_GEMINI_DEFAULT_MODEL,
  GeminiAttemptOutcome,
  isSupportedGeminiChatModel,
  normalizeGeminiModelId,
  runGeminiGenerateWithFallback,
  sortGeminiModels,
} from '../../../../shared/geminiModelUtils';
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
export const GEMINI_DEFAULT_MODEL = SHARED_GEMINI_DEFAULT_MODEL;

export const GEMINI_CURATED_MODELS: AIModelInfo[] = SHARED_GEMINI_CURATED_MODELS.map((m) => ({
  id: m.id,
  name: m.name,
  provider: 'gemini' as AIProviderType,
  isLocal: false,
  contextLength: m.contextWindow,
}));

export class GeminiAdapter implements AIProviderAdapter {
  readonly provider: AIProviderType = 'gemini';
  readonly defaultEndpoint: string = GEMINI_DEFAULT_ENDPOINT;
  readonly defaultModel: string = GEMINI_DEFAULT_MODEL;

  private resolveEndpoint(endpoint?: string): string {
    const raw = endpoint?.trim() || this.defaultEndpoint;
    return raw.replace(/\/+$/, '');
  }

  private cleanModelId(model: string): string {
    return normalizeGeminiModelId(model);
  }

  private async invokeGenerateContent(params: {
    endpoint: string;
    apiKey: string;
    targetModel: string;
    bodyPayload: Record<string, unknown>;
    timeoutMs: number;
    signal?: AbortSignal;
  }): Promise<
    GeminiAttemptOutcome<{
      finishReason?: string;
      usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
    }>
  > {
    const { endpoint, apiKey, targetModel, bodyPayload, timeoutMs, signal } = params;
    try {
      const response = await fetchWithTimeout(
        `${endpoint}/models/${encodeURIComponent(targetModel)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        },
        timeoutMs,
        signal
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        return {
          ok: false,
          status: response.status,
          error: `Google Gemini API returned status ${response.status}: ${errorBody || response.statusText}`,
        };
      }

      const json = await response.json();
      const candidate = json?.candidates?.[0];
      const partText = candidate?.content?.parts?.map((p: { text?: string }) => p?.text || '').join('') || '';
      return {
        ok: true,
        text: partText,
        meta: {
          finishReason: candidate?.finishReason,
          usage: {
            promptTokens: json?.usageMetadata?.promptTokenCount,
            completionTokens: json?.usageMetadata?.candidatesTokenCount,
            totalTokens: json?.usageMetadata?.totalTokenCount,
          },
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: sanitizeErrorMessage(err, apiKey),
      };
    }
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
      const rawModels: Array<{ name?: string; supportedGenerationMethods?: string[] }> = Array.isArray(json?.models)
        ? json.models
        : [];
      const modelList: string[] = sortGeminiModels(
        rawModels
          .filter((m) => isSupportedGeminiChatModel(m.name || '', m.supportedGenerationMethods))
          .map((m) => ({ id: this.cleanModelId(m.name || '') }))
      )
        .map((m) => m.id)
        .slice(0, 20);

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
        .filter((item: { name?: string; supportedGenerationMethods?: string[] }) =>
          isSupportedGeminiChatModel(item.name || '', item.supportedGenerationMethods)
        )
        .map((item: { name: string; displayName?: string; inputTokenLimit?: number }) => {
          const cleanId = this.cleanModelId(item.name);
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

      return discovered.length > 0 ? sortGeminiModels(discovered) : GEMINI_CURATED_MODELS;
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
    const timeoutMs = request.timeoutMs || 45000;

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

    const result = await runGeminiGenerateWithFallback<{
      finishReason?: string;
      usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
    }>({
      requestedModel: request.model || this.defaultModel,
      enableWebSearch: false,
      signal: request.signal,
      invokeModel: (targetModel) =>
        this.invokeGenerateContent({
          endpoint,
          apiKey,
          targetModel,
          bodyPayload,
          timeoutMs,
          signal: request.signal,
        }),
    });

    if (!result.ok) {
      return {
        success: false,
        text: '',
        model: result.model,
        provider: this.provider,
        error: sanitizeErrorMessage(result.error, apiKey),
      };
    }

    return {
      success: true,
      text: result.attempt.text || '',
      model: result.model,
      provider: this.provider,
      finishReason: result.attempt.meta?.finishReason,
      usage: result.attempt.meta?.usage,
    };
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
    const timeoutMs = request.timeoutMs || 45000;

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

    const result = await runGeminiGenerateWithFallback({
      requestedModel: request.model || this.defaultModel,
      enableWebSearch: false,
      signal: request.signal,
      invokeModel: (targetModel) =>
        this.invokeGenerateContent({
          endpoint,
          apiKey,
          targetModel,
          bodyPayload,
          timeoutMs,
          signal: request.signal,
        }),
    });

    if (!result.ok) {
      return {
        success: false,
        data: null,
        rawText: '',
        model: result.model,
        provider: this.provider,
        error: sanitizeErrorMessage(result.error, apiKey),
      };
    }

    const rawText = result.attempt.text || '';
    const extracted = extractJsonFromResponse<T>(rawText);
    if (extracted.error || extracted.data === null) {
      return {
        success: false,
        data: null,
        rawText,
        model: result.model,
        provider: this.provider,
        error: extracted.error || 'Failed to parse structured JSON from Google Gemini output.',
      };
    }

    return {
      success: true,
      data: extracted.data,
      rawText,
      model: result.model,
      provider: this.provider,
    };
  }
}

