/**
 * credentialService.test.ts — Unit tests for Secure Credential Service
 * Milestone 5: TASK-105 Verification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { CredentialService, SafeStorageLike } from '../src/main/services/CredentialService';

describe('TASK-105: CredentialService', () => {
  let tempDir: string;
  let storePath: string;
  let mockSafeStorage: SafeStorageLike;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartboard-cred-test-'));
    storePath = path.join(tempDir, 'secure-credentials.json');

    // Create a deterministic mock SafeStorage implementation
    mockSafeStorage = {
      isEncryptionAvailable: () => true,
      encryptString: (plainText: string) => {
        // Simple reversible XOR/base64 simulation for unit testing
        const buffer = Buffer.from(`ENC:${plainText}`, 'utf8');
        return buffer;
      },
      decryptString: (encrypted: Buffer) => {
        const text = encrypted.toString('utf8');
        if (!text.startsWith('ENC:')) {
          throw new Error('Failed to decrypt buffer: invalid ciphertext');
        }
        return text.substring(4);
      },
    };
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('1. Availability & Initialization', () => {
    it('reports encryption availability correctly when available', () => {
      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      expect(service.isEncryptionAvailable()).toBe(true);
    });

    it('reports encryption unavailable when safeStorage reports false', () => {
      const unavailableStorage: SafeStorageLike = {
        isEncryptionAvailable: () => false,
        encryptString: () => Buffer.from(''),
        decryptString: () => '',
      };
      const service = new CredentialService({ storePath, safeStorage: unavailableStorage });
      expect(service.isEncryptionAvailable()).toBe(false);
    });
  });

  describe('2. Credential Storage & Encryption', () => {
    it('encrypts and saves an API key successfully', async () => {
      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      const result = await service.saveApiKey('openai', 'sk-test-openai-12345');

      expect(result.success).toBe(true);
      expect(fs.existsSync(storePath)).toBe(true);

      // Verify the file content on disk is encrypted (does NOT contain plaintext)
      const diskContent = fs.readFileSync(storePath, 'utf8');
      expect(diskContent).not.toContain('sk-test-openai-12345');
      expect(diskContent).toContain('openai');

      const parsed = JSON.parse(diskContent);
      expect(parsed.credentials.openai.encryptedData).toBeDefined();
    });

    it('retrieves and decrypts the original API key', async () => {
      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      await service.saveApiKey('gemini', 'AIzaSyTestGeminiKey9876');

      const retrieved = await service.getApiKey('gemini');
      expect(retrieved).toBe('AIzaSyTestGeminiKey9876');
    });

    it('normalizes provider names to lowercase and trims whitespace', async () => {
      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      await service.saveApiKey('  OPENAI  ', '  sk-key-with-whitespace  ');

      const hasKey = await service.hasApiKey('openai');
      expect(hasKey).toBe(true);

      const retrieved = await service.getApiKey('OpenAI');
      expect(retrieved).toBe('sk-key-with-whitespace');
    });

    it('rejects empty or whitespace-only API keys', async () => {
      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      const res1 = await service.saveApiKey('openai', '');
      expect(res1.success).toBe(false);
      expect(res1.error).toContain('cannot be empty');

      const res2 = await service.saveApiKey('openai', '   ');
      expect(res2.success).toBe(false);
    });

    it('refuses to store keys if encryption is unavailable (no plaintext fallback)', async () => {
      const unavailableStorage: SafeStorageLike = {
        isEncryptionAvailable: () => false,
        encryptString: () => Buffer.from(''),
        decryptString: () => '',
      };
      const service = new CredentialService({ storePath, safeStorage: unavailableStorage });
      const result = await service.saveApiKey('openai', 'sk-my-secret-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Plaintext storage is prohibited');
      expect(fs.existsSync(storePath)).toBe(false);
    });
  });

  describe('3. Key Existence, Deletion & Provider Listing', () => {
    it('accurately reports key existence with hasApiKey', async () => {
      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      expect(await service.hasApiKey('openai')).toBe(false);

      await service.saveApiKey('openai', 'sk-val-123');
      expect(await service.hasApiKey('openai')).toBe(true);
      expect(await service.hasApiKey('gemini')).toBe(false);
    });

    it('deletes stored keys cleanly', async () => {
      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      await service.saveApiKey('openai', 'sk-val-123');
      expect(await service.hasApiKey('openai')).toBe(true);

      const deleted = await service.deleteApiKey('openai');
      expect(deleted).toBe(true);
      expect(await service.hasApiKey('openai')).toBe(false);
      expect(await service.getApiKey('openai')).toBeNull();

      // Deleting again returns false
      expect(await service.deleteApiKey('openai')).toBe(false);
    });

    it('lists all configured providers without exposing keys', async () => {
      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      expect(await service.listConfiguredProviders()).toEqual([]);

      await service.saveApiKey('openai', 'sk-key-1');
      await service.saveApiKey('gemini', 'AIza-key-2');

      const providers = await service.listConfiguredProviders();
      expect(providers).toHaveLength(2);
      expect(providers).toContain('openai');
      expect(providers).toContain('gemini');
    });

    it('handles non-existent or corrupted files gracefully', async () => {
      // Write corrupted JSON to the file
      fs.writeFileSync(storePath, 'MALFORMED-CORRUPT-JSON{{{', 'utf8');

      const service = new CredentialService({ storePath, safeStorage: mockSafeStorage });
      expect(await service.hasApiKey('openai')).toBe(false);
      expect(await service.getApiKey('openai')).toBeNull();

      // Should recover and allow saving fresh keys
      const saveRes = await service.saveApiKey('openai', 'sk-recovered-key');
      expect(saveRes.success).toBe(true);
      expect(await service.getApiKey('openai')).toBe('sk-recovered-key');
    });
  });
});

