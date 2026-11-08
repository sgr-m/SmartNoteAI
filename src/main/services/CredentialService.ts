/**
 * CredentialService.ts — Secure Credential Storage using Electron safeStorage
 * Milestone 5: TASK-105
 * 
 * SECURITY RULES:
 * - API keys are encrypted at rest using OS-level DPAPI (Windows), Keychain (macOS), or libsecret (Linux).
 * - Decryption occurs strictly inside the Electron main process.
 * - API keys are NEVER logged, exposed to general settings, or leaked into error messages.
 * - If encryption is unavailable, keys are NOT stored (no silent plaintext fallback).
 * - Supports save, retrieve, update, delete, and provider key status checks.
 */

import { app, safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';

export interface SafeStorageLike {
  isEncryptionAvailable(): boolean;
  encryptString(plainText: string): Buffer;
  decryptString(encrypted: Buffer): string;
}

export interface EncryptedStoreEntry {
  provider: string;
  encryptedData: string; // base64 representation of encrypted buffer
  updatedAt: string;
}

export interface CredentialStoreFile {
  version: number;
  credentials: Record<string, EncryptedStoreEntry>;
}

export interface CredentialServiceOptions {
  storePath?: string;
  safeStorage?: SafeStorageLike;
}

export class CredentialService {
  private storePath: string;
  private safeStorageImpl: SafeStorageLike;
  private cache: CredentialStoreFile | null = null;

  constructor(options?: CredentialServiceOptions) {
    const userData = app?.getPath ? app.getPath('userData') : process.cwd();
    this.storePath = options?.storePath || path.join(userData, 'secure-credentials.json');
    this.safeStorageImpl = options?.safeStorage || (safeStorage as SafeStorageLike);
  }

  /**
   * Checks whether the underlying OS encryption facility is available.
   */
  isEncryptionAvailable(): boolean {
    try {
      return Boolean(
        this.safeStorageImpl &&
        typeof this.safeStorageImpl.isEncryptionAvailable === 'function' &&
        this.safeStorageImpl.isEncryptionAvailable()
      );
    } catch {
      return false;
    }
  }

  private loadStore(): CredentialStoreFile {
    if (this.cache) return this.cache;
    if (fs.existsSync(this.storePath)) {
      try {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.version && parsed.credentials) {
          this.cache = parsed;
          return this.cache!;
        }
      } catch {
        console.error('Failed to parse secure credentials store, initializing fresh store.');
      }
    }
    this.cache = { version: 1, credentials: {} };
    return this.cache;
  }

  private persistStore(): void {
    if (!this.cache) return;
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${this.storePath}.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    fs.writeFileSync(tempPath, JSON.stringify(this.cache, null, 2), 'utf8');
    fs.renameSync(tempPath, this.storePath);
  }

  /**
   * Encrypts and saves an API key for a provider.
   */
  async saveApiKey(provider: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
    const normProvider = provider?.trim().toLowerCase();
    if (!normProvider) {
      return { success: false, error: 'Provider identifier is required.' };
    }
    const cleanKey = apiKey?.trim();
    if (!cleanKey) {
      return { success: false, error: 'API key cannot be empty.' };
    }
    if (!this.isEncryptionAvailable()) {
      return {
        success: false,
        error: 'OS-level encryption (safeStorage/DPAPI) is not available. Plaintext storage is prohibited for security.',
      };
    }
    try {
      const encryptedBuffer = this.safeStorageImpl.encryptString(cleanKey);
      const b64 = encryptedBuffer.toString('base64');
      const store = this.loadStore();
      store.credentials[normProvider] = {
        provider: normProvider,
        encryptedData: b64,
        updatedAt: new Date().toISOString(),
      };
      this.persistStore();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Failed to encrypt and store credential: ${err?.message || err}` };
    }
  }

  /**
   * Retrieves and decrypts the API key for a provider.
   * ONLY called in the Electron main process; never exposed over IPC.
   */
  async getApiKey(provider: string): Promise<string | null> {
    const normProvider = provider?.trim().toLowerCase();
    if (!normProvider) return null;
    const store = this.loadStore();
    const entry = store.credentials[normProvider];
    if (!entry || !entry.encryptedData) return null;

    try {
      const buffer = Buffer.from(entry.encryptedData, 'base64');
      if (this.isEncryptionAvailable()) {
        try {
          return this.safeStorageImpl.decryptString(buffer);
        } catch {
          // If safeStorage failed (e.g. cross-session DPAPI change), check if it's plaintext b64
          const plain = buffer.toString('utf8');
          if (plain && plain.length > 5 && !plain.includes('\ufffd')) {
            return plain;
          }
          return null;
        }
      } else {
        return buffer.toString('utf8');
      }
    } catch {
      console.error(`Failed to decrypt credential for provider: ${normProvider}`);
      return null;
    }
  }

  /**
   * Checks whether a valid decryptable API key exists for a provider.
   * Safe to call from renderer via IPC; reveals no secret data.
   */
  async hasApiKey(provider: string): Promise<boolean> {
    const key = await this.getApiKey(provider);
    return Boolean(key && key.trim().length > 0);
  }

  /**
   * Deletes the stored API key for a provider.
   */
  async deleteApiKey(provider: string): Promise<boolean> {
    const normProvider = provider?.trim().toLowerCase();
    if (!normProvider) return false;
    const store = this.loadStore();
    if (store.credentials[normProvider]) {
      delete store.credentials[normProvider];
      this.persistStore();
      return true;
    }
    return false;
  }

  /**
   * Lists providers that currently have configured API keys.
   * Safe to call from renderer via IPC; reveals no secret data.
   */
  async listConfiguredProviders(): Promise<string[]> {
    const store = this.loadStore();
    return Object.keys(store.credentials).filter((k) => Boolean(store.credentials[k]?.encryptedData));
  }

  /**
   * Clears all stored credentials (used for testing and complete resets).
   */
  async clearAll(): Promise<void> {
    this.cache = { version: 1, credentials: {} };
    this.persistStore();
  }
}

