import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildGeminiFallbackCandidates,
  isSupportedGeminiChatModel,
  normalizeGeminiModelId,
  pickBestGeminiDefaultModel,
  resolveGeminiChatModel,
  runGeminiGenerateWithFallback,
  sortGeminiModels,
} from '../src/shared/geminiModelUtils';
import { GeminiAdapter } from '../src/renderer/services/aiPresentation/adapters/geminiAdapter';
import { AIProviderManager } from '../src/renderer/services/aiPresentation/aiProviderManager';

describe('Gemini model discovery, quota resilience & account-switch fixes', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('excludes specialized/zero-free-tier Gemini models while keeping valid chat models', () => {
    expect(isSupportedGeminiChatModel('gemini-2.5-flash')).toBe(true);
    expect(isSupportedGeminiChatModel('gemini-2.5-flash-lite')).toBe(true);
    expect(isSupportedGeminiChatModel('gemini-2.0-flash')).toBe(true);
    expect(isSupportedGeminiChatModel('gemini-1.5-flash')).toBe(true);
    expect(isSupportedGeminiChatModel('gemini-1.5-pro')).toBe(true);
    expect(isSupportedGeminiChatModel('models/gemini-flash-latest')).toBe(true);

    expect(isSupportedGeminiChatModel('gemini-2.5-computer-use-preview-10-2025')).toBe(false);
    expect(isSupportedGeminiChatModel('gemini-deep-research-pro-preview-12-2025')).toBe(false);
    expect(isSupportedGeminiChatModel('gemini-robotics-er-1.5-preview')).toBe(false);
    expect(isSupportedGeminiChatModel('gemini-2.5-flash-preview-tts')).toBe(false);
    expect(isSupportedGeminiChatModel('gemini-2.5-flash-image')).toBe(false);
    expect(isSupportedGeminiChatModel('gemini-2.5-flash-native-audio-latest')).toBe(false);
    expect(isSupportedGeminiChatModel('gemini-live-2.5-flash-preview')).toBe(false);
    expect(isSupportedGeminiChatModel('text-embedding-004')).toBe(false);
  });

  it('normalizes and resolves models without silently hijacking gemini-1.5/2.0/2.5-flash', () => {
    expect(normalizeGeminiModelId('Gemini 2.5 Flash (gemini-2.5-flash)')).toBe('gemini-2.5-flash');
    expect(normalizeGeminiModelId('models/gemini-2.0-flash')).toBe('gemini-2.0-flash');
    expect(normalizeGeminiModelId('Gemini Experimental (Preview)')).toBe('Gemini Experimental (Preview)');

    expect(resolveGeminiChatModel('gemini-1.5-flash')).toBe('gemini-1.5-flash');
    expect(resolveGeminiChatModel('gemini-2.0-flash')).toBe('gemini-2.0-flash');
    expect(resolveGeminiChatModel('gemini-2.5-flash')).toBe('gemini-2.5-flash');
    expect(resolveGeminiChatModel('gemini-2.5-computer-use-preview-10-2025')).toBe('gemini-2.5-flash');
  });

  it('ranks free-tier Flash models ahead of Pro, Argon, and Preview models', () => {
    const unsorted = [
      { id: 'gemini-4-argon' },
      { id: 'gemini-2.5-pro' },
      { id: 'gemini-2.0-flash' },
      { id: 'gemini-2.5-flash-lite' },
      { id: 'gemini-2.5-flash' },
    ];
    const sorted = sortGeminiModels(unsorted).map((m) => m.id);
    expect(sorted[0]).toBe('gemini-2.5-flash');
    expect(sorted[1]).toBe('gemini-2.5-flash-lite');
    expect(sorted[2]).toBe('gemini-2.0-flash');
    expect(pickBestGeminiDefaultModel(['gemini-4-argon', 'gemini-2.5-pro', 'gemini-2.0-flash'])).toBe(
      'gemini-2.0-flash'
    );

    const fallbacks = buildGeminiFallbackCandidates('gemini-4-argon', [
      'gemini-2.5-computer-use-preview-10-2025',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
    ]);
    expect(fallbacks[0]).toBe('gemini-2.5-flash');
    expect(fallbacks).toContain('gemini-2.5-flash-lite');
    expect(fallbacks).not.toContain('gemini-2.5-computer-use-preview-10-2025');
    expect(fallbacks).not.toContain('gemini-2.5-pro');
  });

  it('retries the same model without google_search when grounding triggers 429 or 403 on free tier', async () => {
    const calls: Array<{ model: string; search: boolean }> = [];
    const result = await runGeminiGenerateWithFallback({
      requestedModel: 'gemini-2.5-flash',
      enableWebSearch: true,
      invokeModel: async (targetModel, useSearchTool) => {
        calls.push({ model: targetModel, search: useSearchTool });
        if (useSearchTool) {
          return { ok: false, status: 429, error: 'Quota exceeded for search grounding metric' };
        }
        return { ok: true, text: 'Photosynthesis converts light energy into glucose.' };
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.model).toBe('gemini-2.5-flash');
      expect(result.groundingDisabledOnRetry).toBe(true);
      expect(result.attempt.text).toContain('Photosynthesis');
    }
    expect(calls).toEqual([
      { model: 'gemini-2.5-flash', search: true },
      { model: 'gemini-2.5-flash', search: false },
    ]);
  });

  it('recovers from gemini-4-argon limit:0 by discovering & falling back to working Flash models without grounding', async () => {
    const calls: Array<{ model: string; search: boolean }> = [];
    const fetchModels = vi.fn(async () => [
      'gemini-2.5-computer-use-preview-10-2025',
      'gemini-4-argon',
      'gemini-2.5-flash',
    ]);

    const result = await runGeminiGenerateWithFallback({
      requestedModel: 'gemini-4-argon',
      enableWebSearch: true,
      fetchModels,
      invokeModel: async (targetModel, useSearchTool) => {
        calls.push({ model: targetModel, search: useSearchTool });
        if (targetModel === 'gemini-4-argon') {
          return { ok: false, status: 429, error: 'Quota exceeded, limit: 0, model: gemini-4-argon' };
        }
        return { ok: true, text: 'Recovered answer from Flash!' };
      },
    });

    expect(result.ok).toBe(true);
    expect(fetchModels).toHaveBeenCalledTimes(1);
    if (result.ok) {
      expect(result.model).toBe('gemini-2.5-flash');
      expect(result.usedFallback).toBe(true);
    }
    expect(calls).toEqual([
      { model: 'gemini-4-argon', search: true },
      { model: 'gemini-4-argon', search: false },
      { model: 'gemini-2.5-flash', search: false },
    ]);
  });

  it('normalizes computer-use requests upfront so API calls go straight to gemini-2.5-flash', async () => {
    const calls: string[] = [];
    const result = await runGeminiGenerateWithFallback({
      requestedModel: 'gemini-2.5-computer-use-preview-10-2025',
      enableWebSearch: false,
      invokeModel: async (targetModel) => {
        calls.push(targetModel);
        return { ok: true, text: 'Clean answer' };
      },
    });

    expect(result.ok).toBe(true);
    expect(calls).toEqual(['gemini-2.5-flash']);
  });

  it('stops immediately on invalid API key (401 / API_KEY_INVALID) instead of retrying fallbacks', async () => {
    const calls: string[] = [];
    const result = await runGeminiGenerateWithFallback({
      requestedModel: 'gemini-2.5-flash',
      enableWebSearch: true,
      invokeModel: async (targetModel) => {
        calls.push(targetModel);
        return { ok: false, status: 400, error: 'API key not valid. Please pass a valid API key. API_KEY_INVALID' };
      },
    });

    expect(result.ok).toBe(false);
    expect(calls).toEqual(['gemini-2.5-flash']);
    if (!result.ok) {
      expect(result.error).toContain('API_KEY_INVALID');
    }
  });

  it('GeminiAdapter honors user-selected gemini-2.0-flash and filters specialized models from discovery', async () => {
    const adapter = new GeminiAdapter();
    const urls: string[] = [];

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      urls.push(url);
      if (url.endsWith('/models')) {
        return new Response(
          JSON.stringify({
            models: [
              { name: 'models/gemini-2.5-computer-use-preview-10-2025', supportedGenerationMethods: ['generateContent'] },
              { name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['generateContent'] },
              { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
              { name: 'models/gemini-1.5-flash', supportedGenerationMethods: ['generateContent'] },
              { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Hello from 2.0 Flash' }] }, finishReason: 'STOP' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as any;

    const listed = await adapter.listModels({ apiKey: 'AIzaTest' });
    const ids = listed.map((m) => m.id);
    expect(ids[0]).toBe('gemini-2.5-flash');
    expect(ids).toContain('gemini-1.5-flash');
    expect(ids).toContain('gemini-1.5-pro');
    expect(ids).not.toContain('gemini-2.5-computer-use-preview-10-2025');
    expect(ids).not.toContain('gemini-2.5-flash-preview-tts');

    const genRes = await adapter.generateText({
      apiKey: 'AIzaTest',
      model: 'gemini-2.0-flash',
      prompt: 'Say hi',
    });
    expect(genRes.success).toBe(true);
    expect(genRes.model).toBe('gemini-2.0-flash');
    expect(urls.some((u) => u.includes('/models/gemini-2.0-flash:generateContent'))).toBe(true);
  });

  it('AIProviderManager migrates unsupported cached Gemini models and clears model cache when switching keys', async () => {
    localStorage.setItem('smartboard_active_model_key', 'gemini:gemini-2.5-computer-use-preview-10-2025');
    localStorage.setItem('smartboard_model_gemini', 'gemini-2.5-computer-use-preview-10-2025');
    localStorage.setItem('smartboard_discovered_models_gemini', JSON.stringify([{ id: 'gemini-4-argon' }]));

    const manager = new AIProviderManager();
    expect(manager.getSelectedModel('gemini')).toBe('gemini-2.5-flash');

    localStorage.setItem('smartboard_active_model_key', 'gemini:gemini-2.0-flash');
    expect(manager.getSelectedModel('gemini')).toBe('gemini-2.0-flash');

    const saveApiKeyMock = vi.fn(async () => ({ success: true }));
    vi.stubGlobal('window', {
      electronAPI: { ai: { saveApiKey: saveApiKeyMock } },
    });

    await manager.saveApiKey('gemini', 'AIzaNewAccountKey');
    expect(saveApiKeyMock).toHaveBeenCalledWith('gemini', 'AIzaNewAccountKey');
    expect(localStorage.getItem('smartboard_discovered_models_gemini')).toBeNull();
  });
});

