/**
 * ollamaAdapter.test.ts — Unit tests for Local Offline Ollama Adapter
 * Milestone 5: TASK-106 Verification
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  OllamaAdapter,
  formatBytes,
  OLLAMA_DEFAULT_ENDPOINT,
  OLLAMA_DEFAULT_MODEL,
  OLLAMA_RECOMMENDED_MODELS,
} from '../src/renderer/services/aiPresentation/adapters/ollamaAdapter';
import { AIProviderManager } from '../src/renderer/services/aiPresentation/aiProviderManager';

describe('TASK-106: Local Ollama Adapter', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('1. Byte Formatting & Metadata Handling', () => {
    it('formats byte sizes into clean GB and MB strings', () => {
      expect(formatBytes(2147483648)).toBe('2.0 GB');
      expect(formatBytes(4398046511)).toBe('4.1 GB');
      expect(formatBytes(524288000)).toBe('500 MB');
      expect(formatBytes(0)).toBe('');
      expect(formatBytes(undefined)).toBe('');
    });

    it('defaults to port 11434 and llama3.2 model', () => {
      const adapter = new OllamaAdapter();
      expect(adapter.defaultEndpoint).toBe(OLLAMA_DEFAULT_ENDPOINT);
      expect(adapter.defaultModel).toBe(OLLAMA_DEFAULT_MODEL);
      expect(adapter.resolveEndpoint('http://localhost:11434/')).toBe('http://localhost:11434');
    });
  });

  describe('2. Connection & Health Discovery (checkStatus & testConnection)', () => {
    const adapter = new OllamaAdapter();

    it('detects when Ollama daemon is offline/unavailable', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434'));

      const status = await adapter.checkStatus();
      expect(status.status).toBe('unavailable');
      expect(status.available).toBe(false);
      expect(status.message).toContain('Ollama is not running');
      expect(status.installedModels).toEqual([]);

      const testRes = await adapter.testConnection();
      expect(testRes.success).toBe(false);
      expect(testRes.error).toContain('Ollama is not running');
    });

    it('detects when Ollama is active but zero models are installed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: [] }),
      });

      const status = await adapter.checkStatus();
      expect(status.status).toBe('no-models');
      expect(status.available).toBe(true);
      expect(status.message).toContain('no models are installed');
      expect(status.installedModels).toEqual([]);

      const testRes = await adapter.testConnection();
      expect(testRes.success).toBe(true);
      expect(testRes.warning).toContain('no models are installed');
      expect(testRes.models).toEqual([]);
    });

    it('discovers installed models and verifies presence of requested model', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            {
              name: 'llama3.2:latest',
              model: 'llama3.2:latest',
              size: 2019393189,
              modified_at: '2024-10-01T12:00:00Z',
              details: {
                family: 'llama',
                parameter_size: '3.2B',
                quantization_level: 'Q4_K_M',
              },
            },
            {
              name: 'mistral:latest',
              model: 'mistral:latest',
              size: 4398046511,
              details: {
                family: 'llama',
                parameter_size: '7B',
                quantization_level: 'Q4_0',
              },
            },
          ],
        }),
      });

      const status = await adapter.checkStatus({ model: 'llama3.2' });
      expect(status.status).toBe('ready');
      expect(status.available).toBe(true);
      expect(status.selectedModelAvailable).toBe(true);
      expect(status.installedModels).toHaveLength(2);

      const m0 = status.installedModels[0];
      expect(m0.id).toBe('llama3.2:latest');
      expect(m0.parameterSize).toBe('3.2B');
      expect(m0.sizeFormatted).toBe('1.9 GB');
      expect(m0.name).toContain('3.2B • 1.9 GB');

      const testRes = await adapter.testConnection();
      expect(testRes.success).toBe(true);
      expect(testRes.models).toContain('llama3.2:latest');
      expect(testRes.models).toContain('mistral:latest');
    });

    it('returns empty array from listModels when server is unreachable without inventing fake models', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const models = await adapter.listModels();
      expect(models).toEqual([]);
    });
  });

  describe('3. Text Generation (/api/chat)', () => {
    const adapter = new OllamaAdapter();

    it('generates text in non-streaming mode with token statistics', async () => {
      let requestPayload: any = null;
      global.fetch = vi.fn().mockImplementation((url, init) => {
        requestPayload = JSON.parse(init.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            model: 'llama3.2',
            message: {
              role: 'assistant',
              content: 'Kinetic energy is given by KE = 1/2 m v^2.',
            },
            done: true,
            done_reason: 'stop',
            prompt_eval_count: 22,
            eval_count: 48,
          }),
        });
      });

      const res = await adapter.generateText({
        prompt: 'State formula for kinetic energy',
        systemPrompt: 'You are a physics teacher.',
        model: 'llama3.2',
        temperature: 0.5,
      });

      expect(res.success).toBe(true);
      expect(res.text).toBe('Kinetic energy is given by KE = 1/2 m v^2.');
      expect(res.usage?.promptTokens).toBe(22);
      expect(res.usage?.completionTokens).toBe(48);
      expect(res.usage?.totalTokens).toBe(70);

      expect(requestPayload.model).toBe('llama3.2');
      expect(requestPayload.stream).toBe(false);
      expect(requestPayload.messages).toHaveLength(2);
      expect(requestPayload.messages[0].content).toBe('You are a physics teacher.');
    });

    it('handles HTTP 404 (model not found) with informative pull instruction', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'model "uninstalled-model" not found, try pulling it first',
      });

      const res = await adapter.generateText({
        prompt: 'Hello',
        model: 'uninstalled-model',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('was not found in your local Ollama installation');
      expect(res.error).toContain('ollama pull uninstalled-model');
    });

    it('handles stream responses with onChunk callback', async () => {
      const chunks = [
        JSON.stringify({ message: { content: 'Photosynthesis ' }, done: false }) + '\n',
        JSON.stringify({ message: { content: 'produces ' }, done: false }) + '\n',
        JSON.stringify({ message: { content: 'glucose.' }, done: false }) + '\n',
        JSON.stringify({
          message: { content: '' },
          done: true,
          done_reason: 'stop',
          prompt_eval_count: 10,
          eval_count: 15,
        }) + '\n',
      ];

      let chunkIndex = 0;
      const mockStream = new ReadableStream({
        pull(controller) {
          if (chunkIndex < chunks.length) {
            controller.enqueue(new TextEncoder().encode(chunks[chunkIndex]));
            chunkIndex++;
          } else {
            controller.close();
          }
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const receivedTokens: string[] = [];
      const res = await adapter.generateText({
        prompt: 'Photosynthesis summary',
        onChunk: (token) => {
          receivedTokens.push(token);
        },
      });

      expect(res.success).toBe(true);
      expect(res.text).toBe('Photosynthesis produces glucose.');
      expect(receivedTokens).toEqual(['Photosynthesis ', 'produces ', 'glucose.']);
      expect(res.usage?.totalTokens).toBe(25);
    });
  });

  describe('4. Structured JSON Generation (format: "json")', () => {
    const adapter = new OllamaAdapter();

    it('requests format: "json" and extracts valid structured object', async () => {
      let requestPayload: any = null;
      global.fetch = vi.fn().mockImplementation((url, init) => {
        requestPayload = JSON.parse(init.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            model: 'llama3.2',
            message: {
              role: 'assistant',
              content: JSON.stringify({
                topic: 'Cell Biology',
                slides: [
                  { title: 'Membrane', bullets: ['Phospholipids', 'Proteins'] },
                  { title: 'Nucleus', bullets: ['DNA', 'Chromatin'] },
                ],
              }),
            },
          }),
        });
      });

      const res = await adapter.generateStructuredJson<{ topic: string; slides: any[] }>({
        prompt: 'Generate 2 slides on cell biology',
      });

      expect(res.success).toBe(true);
      expect(requestPayload.format).toBe('json');
      expect(res.data?.topic).toBe('Cell Biology');
      expect(res.data?.slides).toHaveLength(2);
    });

    it('handles markdown-fenced JSON from Ollama gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          message: {
            content: '```json\n{"atom": "Hydrogen", "atomicNumber": 1}\n```',
          },
        }),
      });

      const res = await adapter.generateStructuredJson<{ atom: string; atomicNumber: number }>({
        prompt: 'Atom spec',
      });

      expect(res.success).toBe(true);
      expect(res.data?.atom).toBe('Hydrogen');
      expect(res.data?.atomicNumber).toBe(1);
    });

    it('reports error when output cannot be parsed as JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          message: {
            content: 'I am sorry, I am unable to generate JSON right now.',
          },
        }),
      });

      const res = await adapter.generateStructuredJson({
        prompt: 'Generate data',
      });

      expect(res.success).toBe(false);
      expect(res.data).toBeNull();
      expect(res.error).toContain('Failed to extract valid JSON');
    });
  });

  describe('5. AIProviderManager Integration', () => {
    it('manages active provider switching to ollama', () => {
      const manager = new AIProviderManager();
      manager.setActiveProvider('ollama');

      expect(manager.getActiveProvider()).toBe('ollama');
      expect(manager.getSelectedModel('ollama')).toBe('llama3.2');
    });

    it('queries ollama adapter when fetching models for ollama provider', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama3.2:latest', size: 2019393189, details: { parameter_size: '3.2B' } },
          ],
        }),
      });

      const manager = new AIProviderManager();
      const models = await manager.getAvailableModels('ollama');

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('llama3.2:latest');
    });

    it('dispatches generateText to registered ollama adapter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          message: { content: 'Ollama local response' },
        }),
      });

      const manager = new AIProviderManager();
      manager.setActiveProvider('ollama');

      const res = await manager.generateText({
        prompt: 'Local prompt',
      });

      expect(res.success).toBe(true);
      expect(res.text).toBe('Ollama local response');
      expect(res.provider).toBe('ollama');
    });
  });
});
