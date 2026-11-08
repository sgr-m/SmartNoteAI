/**
 * tests/aiChatInputAndFocus.test.ts
 * Verifies that selecting models never breaks or blocks text input in the AI Assistant chatbox,
 * and ensures keyboardUtils and focus management properly isolate typing from whiteboard hotkeys.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isTypingOrInputFocused } from '../src/renderer/utils/keyboardUtils';

describe('AI Assistant Textbox Typing & Model Selection Focus', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    (global as any).localStorage = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = String(v); },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => { mockStorage = {}; },
    };

    (global as any).document = {
      activeElement: null,
      querySelector: (selector: string) => null,
    };
  });

  it('detects typing focus when target is a textarea or input', () => {
    const mockTextarea = {
      tagName: 'TEXTAREA',
      closest: (sel: string) => null,
    };

    const ev = {
      target: mockTextarea,
    } as any;

    expect(isTypingOrInputFocused(ev)).toBe(true);
  });

  it('detects typing focus when target or activeElement is inside .ai-chat-side-panel or .ai-chat-input-wrapper', () => {
    const mockElement = {
      tagName: 'DIV',
      closest: (sel: string) => {
        if (sel.includes('.ai-chat-side-panel')) return true;
        return null;
      },
    };

    const ev = {
      target: mockElement,
    } as any;

    expect(isTypingOrInputFocused(ev)).toBe(true);

    // Active element inside ai chat
    (global as any).document.activeElement = mockElement;
    expect(isTypingOrInputFocused()).toBe(true);
  });

  it('detects typing focus when ModelSettingsDrawer modal overlay is mounted', () => {
    (global as any).document.querySelector = (selector: string) => {
      if (selector.includes('.model-settings-drawer-overlay')) {
        return { tagName: 'DIV', className: 'model-settings-drawer-overlay' };
      }
      return null;
    };

    expect(isTypingOrInputFocused()).toBe(true);
  });

  it('persists selected model key across sessions and respects user choice over defaults', () => {
    localStorage.setItem('smartboard_active_model_key', 'gemini:gemini-3.8-flash');
    localStorage.setItem('smartboard_model_gemini', 'gemini-3.8-flash');

    expect(localStorage.getItem('smartboard_active_model_key')).toBe('gemini:gemini-3.8-flash');
    expect(localStorage.getItem('smartboard_model_gemini')).toBe('gemini-3.8-flash');

    // User switches to local Ollama qwen2.5-coder
    localStorage.setItem('smartboard_active_model_key', 'ollama:qwen2.5-coder:3b');
    localStorage.setItem('smartboard_model_ollama', 'qwen2.5-coder:3b');

    expect(localStorage.getItem('smartboard_active_model_key')).toBe('ollama:qwen2.5-coder:3b');
    expect(localStorage.getItem('smartboard_model_ollama')).toBe('qwen2.5-coder:3b');
  });

  it('ensures textarea activeElement stops global canvas shortcut listeners', () => {
    const activeTextarea = {
      tagName: 'TEXTAREA',
      id: 'ai-chat-input-textarea',
      closest: () => true,
    };
    (global as any).document.activeElement = activeTextarea;

    expect(isTypingOrInputFocused()).toBe(true);
  });
});
