/**
 * onlineAiProviders.test.ts — Unit tests for Online AI Providers (OpenAI & Gemini)
 * Milestone 5: TASK-105 Verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeErrorMessage,
  extractJsonFromResponse,
  OpenAIAdapter,
  GeminiAdapter,
  OPENAI_CURATED_MODELS,
  GEMINI_CURATED_MODELS,
} from '../src/renderer/services/aiPresentation/adapters';
import { AIProviderManager } from '../src/renderer/services/aiPresentation/aiProviderManager';

describe('TASK-105: Online AI Providers Pipeline', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('1. Error Sanitization & Key Protection', () => {
    it('redacts explicit API keys from error messages', () => {
      const apiKey = 'sk-proj-super-secret-1234567890';
      const rawError = new Error(`Connection to OpenAI failed with key ${apiKey} at endpoint`);
      const sanitized = sanitizeErrorMessage(rawError, apiKey);

      expect(sanitized).not.toContain(apiKey);
      expect(sanitized).toContain('[REDACTED_API_KEY]');
    });

    it('redacts Bearer tokens and query string keys', () => {
      const msg = 'Authorization: Bearer secret_token_xyz123 failed for url https://api.com?key=AIzaSySecret999';
      const sanitized = sanitizeErrorMessage(msg);

      expect(sanitized).not.toContain('secret_token_xyz123');
      expect(sanitized).not.toContain('AIzaSySecret999');
      expect(sanitized).toContain('Bearer [REDACTED]');
      expect(sanitized).toContain('key=[REDACTED]');
    });

    it('translates HTTP 401 into helpful user message', () => {
      const msg = sanitizeErrorMessage('Request failed with status code 401 Unauthorized');
      expect(msg).toContain('Invalid API key or unauthorized access');
    });

    it('translates HTTP 429 rate limit into clear explanation', () => {
      const msg = sanitizeErrorMessage('Error 429: You exceeded your current quota, please check your plan');
      expect(msg).toContain('Rate limit exceeded or API quota exhausted');
    });

    it('translates AbortError/timeouts into friendly warning', () => {
      const msg = sanitizeErrorMessage('AbortError: The user aborted a request.');
      expect(msg).toContain('timed out');
    });

    it('translates connection refused / offline errors into clear message', () => {
      const msg = sanitizeErrorMessage('TypeError: Failed to fetch (ECONNREFUSED)');
      expect(msg).toContain('Unable to reach the AI provider endpoint');
    });
  });

  describe('2. Resilient JSON Output Extractor', () => {
    it('parses direct raw JSON objects', () => {
      const raw = '{"title": "Introduction to Photosynthesis", "slideCount": 5}';
      const res = extractJsonFromResponse<{ title: string; slideCount: number }>(raw);

      expect(res.error).toBeUndefined();
      expect(res.data?.title).toBe('Introduction to Photosynthesis');
      expect(res.data?.slideCount).toBe(5);
    });

    it('extracts JSON enclosed within markdown code fences (```json ... ```)', () => {
      const raw = `Here is your lesson plan:
\`\`\`json
{
  "topic": "Gravity and Orbital Motion",
  "cards": ["Intro", "Equations", "Summary"]
}
\`\`\`
Hope this helps!`;
      const res = extractJsonFromResponse<{ topic: string; cards: string[] }>(raw);

      expect(res.error).toBeUndefined();
      expect(res.data?.topic).toBe('Gravity and Orbital Motion');
      expect(res.data?.cards).toHaveLength(3);
    });

    it('extracts JSON enclosed in generic code fences without language tag', () => {
      const raw = `\`\`\`
{
  "key": "value"
}
\`\`\``;
      const res = extractJsonFromResponse<{ key: string }>(raw);
      expect(res.data?.key).toBe('value');
    });

    it('locates and parses outermost JSON brackets when conversational preamble is present', () => {
      const raw = `Sure! Here is the JSON data you asked for: {"status": "ok", "count": 42} Let me know if you need changes.`;
      const res = extractJsonFromResponse<{ status: string; count: number }>(raw);

      expect(res.data?.status).toBe('ok');
      expect(res.data?.count).toBe(42);
    });

    it('returns an error object when JSON is completely invalid or empty', () => {
      const res1 = extractJsonFromResponse('');
      expect(res1.error).toBeDefined();

      const res2 = extractJsonFromResponse('This contains no JSON whatsoever.');
      expect(res2.error).toBeDefined();
    });
  });

  describe('3. OpenAI Adapter', () => {
    const adapter = new OpenAIAdapter();

    it('verifies connection successfully with mock fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }, { id: 'whisper-1' }],
        }),
      });

      const res = await adapter.testConnection({ apiKey: 'sk-test-mock-key' });
      expect(res.success).toBe(true);
      expect(res.provider).toBe('openai');
      expect(res.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.models).toContain('gpt-4o');
      expect(res.models).toContain('gpt-4o-mini');
    });

    it('reports failure when API key is missing', async () => {
      const res = await adapter.testConnection({ apiKey: '' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('API key is missing');
    });

    it('handles 401 Unauthorized securely during connection test', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Incorrect API key provided: sk-test-bad-key',
      });

      const res = await adapter.testConnection({ apiKey: 'sk-test-bad-key' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Invalid API key');
      expect(res.error).not.toContain('sk-test-bad-key');
    });

    it('generates free-form text with token usage tracking', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gpt-4o-mini',
          choices: [
            {
              message: { content: 'Newton’s First Law describes inertia.' },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 25,
            completion_tokens: 8,
            total_tokens: 33,
          },
        }),
      });

      const res = await adapter.generateText({
        apiKey: 'sk-test-key',
        prompt: 'State Newton’s First Law',
        systemPrompt: 'You are a physics teacher.',
      });

      expect(res.success).toBe(true);
      expect(res.text).toBe('Newton’s First Law describes inertia.');
      expect(res.usage?.totalTokens).toBe(33);
    });

    it('generates structured JSON output with schema enforcement', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'gpt-4o-mini',
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Thermodynamics Overview',
                  laws: ['Zero', 'First', 'Second', 'Third'],
                }),
              },
            },
          ],
        }),
      });

      const res = await adapter.generateStructuredJson<{ title: string; laws: string[] }>({
        apiKey: 'sk-test-key',
        prompt: 'List the laws of thermodynamics',
      });

      expect(res.success).toBe(true);
      expect(res.data?.title).toBe('Thermodynamics Overview');
      expect(res.data?.laws).toHaveLength(4);
    });
  });

  describe('4. Google Gemini Adapter', () => {
    const adapter = new GeminiAdapter();

    it('verifies connection using x-goog-api-key header', async () => {
      let passedHeaders: any = null;
      global.fetch = vi.fn().mockImplementation((url, init) => {
        passedHeaders = init.headers;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            models: [
              { name: 'models/gemini-1.5-flash', supportedGenerationMethods: ['generateContent'] },
              { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
            ],
          }),
        });
      });

      const res = await adapter.testConnection({ apiKey: 'AIzaSyMockKey123' });
      expect(res.success).toBe(true);
      expect(res.provider).toBe('gemini');
      expect(passedHeaders['x-goog-api-key']).toBe('AIzaSyMockKey123');
      expect(res.models).toContain('gemini-1.5-flash');
      expect(res.models).toContain('gemini-1.5-pro');
    });

    it('lists filtered models removing "models/" prefix', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            {
              name: 'models/gemini-1.5-flash',
              displayName: 'Gemini 1.5 Flash',
              supportedGenerationMethods: ['generateContent'],
              inputTokenLimit: 1048576,
            },
            {
              name: 'models/text-embedding-004',
              supportedGenerationMethods: ['embedContent'],
            },
          ],
        }),
      });

      const models = await adapter.listModels({ apiKey: 'AIzaSyMock' });
      expect(models.some((m) => m.id === 'gemini-1.5-flash')).toBe(true);
      // text-embedding model should be excluded because it does not support generateContent
      expect(models.some((m) => m.id === 'text-embedding-004')).toBe(false);
    });

    it('generates text using Gemini content and systemInstruction payload', async () => {
      let sentBody: any = null;
      global.fetch = vi.fn().mockImplementation((url, init) => {
        sentBody = JSON.parse(init.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Cellular respiration converts glucose into ATP.' }],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 15,
              candidatesTokenCount: 10,
              totalTokenCount: 25,
            },
          }),
        });
      });

      const res = await adapter.generateText({
        apiKey: 'AIzaSyMock',
        prompt: 'Explain cellular respiration briefly',
        systemPrompt: 'You are a biology teacher.',
      });

      expect(res.success).toBe(true);
      expect(res.text).toBe('Cellular respiration converts glucose into ATP.');
      expect(sentBody.contents[0].parts[0].text).toBe('Explain cellular respiration briefly');
      expect(sentBody.systemInstruction.parts[0].text).toBe('You are a biology teacher.');
      expect(res.usage?.totalTokens).toBe(25);
    });

    it('generates structured JSON output with responseMimeType config', async () => {
      let sentBody: any = null;
      global.fetch = vi.fn().mockImplementation((url, init) => {
        sentBody = JSON.parse(init.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ organ: 'Mitochondria', role: 'Powerhouse' }) }],
                },
              },
            ],
          }),
        });
      });

      const res = await adapter.generateStructuredJson<{ organ: string; role: string }>({
        apiKey: 'AIzaSyMock',
        prompt: 'Name the powerhouse organelle',
      });

      expect(res.success).toBe(true);
      expect(res.data?.organ).toBe('Mitochondria');
      expect(sentBody.generationConfig.responseMimeType).toBe('application/json');
    });
  });

  describe('5. AIProviderManager Orchestration', () => {
    it('manages active provider and default models cleanly', () => {
      const manager = new AIProviderManager();
      expect(manager.getActiveProvider()).toBe('openai');
      expect(manager.getSelectedModel('openai')).toBe('gpt-4o-mini');

      manager.setActiveProvider('gemini');
      expect(manager.getActiveProvider()).toBe('gemini');
      expect(manager.getSelectedModel()).toBe('gemini-3.8-flash');

      manager.setSelectedModel('gemini-1.5-pro');
      expect(manager.getSelectedModel('gemini')).toBe('gemini-1.5-pro');
    });

    it('manages custom endpoints and request timeouts', () => {
      const manager = new AIProviderManager();
      manager.setCustomEndpoint('https://api.groq.com/openai/v1', 'custom-openai');
      expect(manager.getCustomEndpoint('custom-openai')).toBe('https://api.groq.com/openai/v1');

      manager.setTimeoutMs(45000);
      expect(manager.getTimeoutMs()).toBe(45000);

      // Clamps to at least 5000ms
      manager.setTimeoutMs(100);
      expect(manager.getTimeoutMs()).toBe(5000);
    });

    it('dispatches direct test connection when apiKey is provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'gpt-4o-mini' }] }),
      });

      const manager = new AIProviderManager();
      const res = await manager.testConnection('openai', { apiKey: 'sk-direct-test-key' });

      expect(res.success).toBe(true);
      expect(res.provider).toBe('openai');
    });

    it('returns curated models list when offline or unconfigured', async () => {
      const manager = new AIProviderManager();
      const openaiModels = await manager.getAvailableModels('openai');
      expect(openaiModels).toEqual(OPENAI_CURATED_MODELS);

      const geminiModels = await manager.getAvailableModels('gemini');
      expect(geminiModels).toEqual(GEMINI_CURATED_MODELS);
    });
  });
});

