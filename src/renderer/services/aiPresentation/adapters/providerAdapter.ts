/**
 * providerAdapter.ts — Unified Provider-Neutral Adapter Interface & Helpers
 * Milestone 5: TASK-105
 */

import { AIModelInfo, AIProviderType } from '../../../../shared/aiPresentationTypes';

export interface AIConnectionTestOptions {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface AIConnectionTestResult {
  success: boolean;
  provider: AIProviderType;
  latencyMs?: number;
  models?: string[];
  error?: string;
  warning?: string;
}

export interface AIListModelsOptions {
  apiKey?: string;
  endpoint?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface AITextGenerationRequest {
  provider?: AIProviderType;
  prompt: string;
  systemPrompt?: string;
  model?: string;
  apiKey?: string;
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onChunk?: (token: string, accumulated: string) => void;
  enableWebSearch?: boolean;
}

export interface AITokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AITextGenerationResponse {
  success: boolean;
  text: string;
  model: string;
  provider: AIProviderType;
  finishReason?: string;
  usage?: AITokenUsage;
  groundingSources?: Array<{ title: string; url: string }>;
  error?: string;
}

export interface AIStructuredGenerationRequest extends AITextGenerationRequest {
  schema?: Record<string, unknown>;
  schemaName?: string;
}

export interface AIStructuredGenerationResponse<T = unknown> {
  success: boolean;
  data: T | null;
  rawText: string;
  model: string;
  provider: AIProviderType;
  error?: string;
}

/**
 * Common contract that every AI provider adapter (OpenAI, Gemini, Ollama) must implement.
 */
export interface AIProviderAdapter {
  readonly provider: AIProviderType;
  readonly defaultEndpoint: string;
  readonly defaultModel: string;

  /**
   * Tests the provider connection with minimal latency and reports status.
   */
  testConnection(options?: AIConnectionTestOptions): Promise<AIConnectionTestResult>;

  /**
   * Retrieves the list of available models from the provider or returns curated defaults.
   */
  listModels(options?: AIListModelsOptions): Promise<AIModelInfo[]>;

  /**
   * Generates free-form text from prompt and system prompt.
   */
  generateText(request: AITextGenerationRequest): Promise<AITextGenerationResponse>;

  /**
   * Generates structured data strictly parsed into JSON.
   */
  generateStructuredJson<T = unknown>(request: AIStructuredGenerationRequest): Promise<AIStructuredGenerationResponse<T>>;
}

// ─── Security & Sanitization Helpers ──────────────────────────────────────────

/**
 * Redacts API keys and sensitive auth tokens from error messages or logs.
 */
export function sanitizeErrorMessage(error: unknown, apiKey?: string): string {
  let message = '';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    try {
      message = JSON.stringify(error);
    } catch {
      message = 'An unknown error occurred';
    }
  } else {
    message = 'An unknown error occurred';
  }

  // Redact explicit API key if known
  if (apiKey && apiKey.trim().length > 0) {
    const cleanKey = apiKey.trim();
    message = message.split(cleanKey).join('[REDACTED_API_KEY]');
  }

  // Redact potential Bearer tokens or key= parameters in URLs/headers
  message = message.replace(/Bearer\s+([A-Za-z0-9_\-\.]{8,})/gi, 'Bearer [REDACTED]');
  message = message.replace(/key=([A-Za-z0-9_\-\.]{8,})/gi, 'key=[REDACTED]');
  message = message.replace(/x-goog-api-key:\s*([A-Za-z0-9_\-\.]{8,})/gi, 'x-goog-api-key: [REDACTED]');

  // Provide human-friendly interpretations of common API errors
  if (message.includes('401') || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('invalid api key')) {
    return 'Invalid API key or unauthorized access. Please verify your credentials.';
  }
  if (message.includes('429') || message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota')) {
    return 'Rate limit exceeded or API quota exhausted. Please check your provider account or try again shortly.';
  }
  if (message.includes('404') || message.toLowerCase().includes('model_not_found') || message.toLowerCase().includes('not found')) {
    return 'The requested AI model was not found or is unavailable on this account.';
  }
  if (message.includes('AbortError') || message.toLowerCase().includes('timeout') || message.toLowerCase().includes('timed out')) {
    return 'The request to the AI provider timed out. Please verify your internet connection.';
  }
  if (message.includes('Failed to fetch') || message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
    return 'Unable to reach the AI provider endpoint. Please check your network connection.';
  }

  return message;
}

/**
 * Resilient JSON extractor that parses raw model outputs, handling markdown fences,
 * preamble conversational text, and JSON embedded in text.
 */
function tryParseWithLatexRepair<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    try {
      const repaired = str.replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');
      return JSON.parse(repaired) as T;
    } catch {
      try {
        const aggressive = str.replace(/\\/g, '\\\\');
        return JSON.parse(aggressive) as T;
      } catch {
        return null;
      }
    }
  }
}

function healLatexControlChars<T>(val: T): T {
  if (typeof val === 'string') {
    return val
      .replace(/\x08ar\{/g, '\\bar{')
      .replace(/(^|[^\\])\x08ar\b/g, '$1\\bar')
      .replace(/\x0cac\{/g, '\\frac{')
      .replace(/(^|[^\\])\x0cac\b/g, '$1\\frac') as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map(healLatexControlChars) as unknown as T;
  }
  if (val && typeof val === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = healLatexControlChars(v);
    }
    return out as T;
  }
  return val;
}

/**
 * Extracts and parses a JSON payload from a model response string.
 * Supports raw JSON, Markdown code fences (```json ... ```), and embedded objects.
 */
export function extractJsonFromResponse<T = unknown>(rawText: string): { data: T | null; error?: string } {
  if (!rawText || typeof rawText !== 'string') {
    return { data: null, error: 'Empty model response' };
  }

  const trimmed = rawText.trim();

  // 1. Try direct parse
  const direct = tryParseWithLatexRepair<T>(trimmed);
  if (direct) {
    return { data: healLatexControlChars(direct) };
  }

  // 2. Extract from markdown code fences: ```json ... ``` or ``` ... ```
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const fenceMatch = trimmed.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    const fenced = tryParseWithLatexRepair<T>(fenceMatch[1].trim());
    if (fenced) {
      return { data: healLatexControlChars(fenced) };
    }
  }

  // 3. Scan for the outermost JSON object {...} or array [...]
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    const parsedObj = tryParseWithLatexRepair<T>(candidate);
    if (parsedObj) {
      return { data: healLatexControlChars(parsedObj) };
    }
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.substring(firstBracket, lastBracket + 1);
    const parsedArr = tryParseWithLatexRepair<T>(candidate);
    if (parsedArr) {
      return { data: healLatexControlChars(parsedArr) };
    }
  }

  return {
    data: null,
    error: 'Failed to extract valid JSON from model response',
  };
}

/**
 * Native fetch with configurable timeout and abort cancellation support.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = 30000,
  customSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  const onCustomAbort = () => {
    controller.abort(customSignal?.reason || new Error('Request was aborted by user'));
  };

  if (customSignal) {
    if (customSignal.aborted) {
      clearTimeout(timer);
      throw customSignal.reason || new Error('Request was aborted');
    }
    customSignal.addEventListener('abort', onCustomAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
    if (customSignal) {
      customSignal.removeEventListener('abort', onCustomAbort);
    }
  }
}

