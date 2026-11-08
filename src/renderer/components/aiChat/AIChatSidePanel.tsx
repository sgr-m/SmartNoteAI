/**
 * AIChatSidePanel.tsx — Modern Animated AI Teaching Assistant Chat Panel
 * Features:
 * - SmartNoteAI Logo with AI Theme & Glowing Badges
 * - Model Settings Drawer (⚙️) for API keys, custom models (Gemini 3.8 Flash, Kimi K3, DeepSeek, Groq, Ollama)
 * - Auto-detection of local Ollama models with metadata
 * - Left-edge draggable resize handle strictly capped at 40% of screen size
 * - Animated glowing colorful border
 * - Smooth typing animation for placeholder ("Ask AI to explain concept, create math problems or write notes...")
 * - Honest error diagnostics with direct settings action button (no canned fake answers on API failures)
 * - Drag-to-Board and 1-Click Insert onto whiteboard canvas with LaTeX math rendering
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { aiProviderManager } from '../../services/aiPresentation/aiProviderManager';
import { AIProviderType } from '../../../shared/aiPresentationTypes';
import { ModelSettingsDrawer } from './ModelSettingsDrawer';
import {
  DiagramType,
  detectDiagramType,
  renderDiagramToSvg,
} from '../../services/vectorDiagramService';
import { markdownToHtml } from '../../services/markdownRenderService';
import katex from 'katex';
import './AIChatSidePanel.css';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  title?: string;
  timestamp: number;
  provider?: string;
  isError?: boolean;
  errorMessage?: string;
}

export interface ContentSegment {
  id: string;
  type: 'formula' | 'heading' | 'bullets' | 'table' | 'code' | 'paragraph' | 'diagram';
  rawText: string;
  displayTitle: string;
  isFormula: boolean;
  diagramType?: DiagramType;
}

export interface ChatSessionRecord {
  id: string;
  title: string;
  timestamp: number;
  preview: string;
  messages: ChatMessage[];
}

export interface AIChatSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToBoard: (content: string, title?: string, targetPos?: { x: number; y: number }, isFormulaHint?: boolean) => void;
  onOpenVectorStudio?: (code: string) => void;
  currentTopic?: string;
  currentSubject?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
}

export interface ConnectedModelOption {
  key: string;
  provider: AIProviderType;
  modelId: string;
  displayName: string;
  group: string;
  installed?: boolean;
}

const QUICK_PROMPTS = [
  { label: '💡 Explain Simply', prompt: 'Explain this concept in simple, student-friendly terms with an engaging analogy:' },
  { label: '📐 Vector Diagram', prompt: 'Generate an interactive vector diagram code (Mermaid flowchart, Function Graph, Logic Circuit, or Geometry) for:' },
  { label: '📝 3 Practice Questions', prompt: 'Generate 3 classroom practice questions with complete solutions and explanations for:' },
  { label: '🧮 Step-by-Step Math', prompt: 'Provide a complete step-by-step mathematical worked example with formulas and derivations for:' },
  { label: '🌍 Real-World Analogy', prompt: 'Give a memorable real-world analogy and practical application to help students visualize:' },
  { label: '📊 Comparison Table', prompt: 'Create a clear comparison table contrasting the key features and differences of:' },
];

const TYPING_PHRASES = [
  'Ask AI to explain concept, create math problems or write notes...',
  'Ask AI: "Explain Artificial Intelligence in simple terms for class"...',
  'Ask AI: "Derive quadratic formula with step-by-step proofs"...',
  'Ask AI: "Generate 3 interactive physics practice questions"...',
  'Ask AI: "Create an engaging biology photosynthesis analogy"...',
];

/**
 * Custom hook for realistic typewriter placeholder animation
 */
function useTypingPlaceholder(phrases: string[], typingSpeed = 55, pauseTime = 2200): string {
  const [displayedText, setDisplayedText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex % phrases.length];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && charIndex <= currentPhrase.length) {
      setDisplayedText(currentPhrase.substring(0, charIndex));
      timeout = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, typingSpeed);
    } else if (!isDeleting && charIndex > currentPhrase.length) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseTime);
    } else if (isDeleting && charIndex > 0) {
      setDisplayedText(currentPhrase.substring(0, charIndex));
      timeout = setTimeout(() => {
        setCharIndex((prev) => prev - 1);
      }, typingSpeed / 2);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      timeout = setTimeout(() => {
        setCharIndex(1);
      }, 350);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, phrases, typingSpeed, pauseTime]);

  return displayedText;
}

export function AIChatSidePanel({
  isOpen,
  onClose,
  onInsertToBoard,
  onOpenVectorStudio,
  currentTopic = '',
  currentSubject = '',
  width = 420,
  onWidthChange,
}: AIChatSidePanelProps): React.ReactElement | null {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('smartnoteai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content:
          `Welcome to **SmartNoteAI** Teaching Assistant!\n\nAsk me to generate lesson notes, step-by-step math derivations, classroom vector diagrams, or practice problems.\n\n• **Drag to Board**: Drag any formula, diagram, or explanation card directly onto your whiteboard.\n• **1-Click Insert**: Click **➕ Insert** to place content instantly on board.\n• **Vector Diagrams**: Ask for flowcharts (Mermaid), mathematical graphs (parabolas, sine waves), logic circuits, or geometry figures.\n• **Model Settings**: Click **⚙️ Settings** to configure Gemini, local Ollama, Kimi, DeepSeek, or custom models!`,
        timestamp: Date.now(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  // Settings & History Drawer Toggles
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Saved chat history sessions
  const [savedSessions, setSavedSessions] = useState<ChatSessionRecord[]>(() => {
    try {
      const raw = localStorage.getItem('smartnoteai_chat_sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Persist chat messages across closes
  useEffect(() => {
    try {
      localStorage.setItem('smartnoteai_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Available connected models
  const [modelOptions, setModelOptions] = useState<ConnectedModelOption[]>([]);
  const [selectedModelKey, setSelectedModelKey] = useState<string>(() => {
    try {
      const savedActive = localStorage.getItem('smartboard_active_model_key');
      if (savedActive) return savedActive;
      const savedGemini = localStorage.getItem('smartboard_model_gemini');
      if (savedGemini) return `gemini:${savedGemini}`;
    } catch {}
    return 'gemini:gemini-3.8-flash';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Animated typing placeholder
  const animatedPlaceholder = useTypingPlaceholder(TYPING_PHRASES);

  // Draggable Left Edge Resizer
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (ev: PointerEvent) => {
      if (!isResizingRef.current) return;
      const delta = startXRef.current - ev.clientX;
      const maxAllowed = Math.floor(window.innerWidth * 0.40); // Maximum 40% of screen
      const minAllowed = 320;
      const nextWidth = Math.max(minAllowed, Math.min(maxAllowed, startWidthRef.current + delta));
      onWidthChange?.(nextWidth);
    };

    const handlePointerUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Discover and list all connected models
  const refreshConnectedModels = useCallback(async () => {
    const opts: ConnectedModelOption[] = [];
    const electronAi = (window as any).electronAPI?.ai;

    // 1. Check local Ollama models (both array format and object format)
    try {
      if (electronAi?.listModels) {
        const ollamaRes = await electronAi.listModels('ollama');
        const rawList = Array.isArray(ollamaRes) ? ollamaRes : (ollamaRes?.models || []);
        if (Array.isArray(rawList) && rawList.length > 0) {
          for (const m of rawList) {
            const mId = typeof m === 'string' ? m : m.id;
            const mName = typeof m === 'string' ? m : m.name || m.id;
            opts.push({
              key: `ollama:${mId}`,
              provider: 'ollama',
              modelId: mId,
              displayName: `${mName} (Local Installed)`,
              group: '🖥️ Local Ollama (Installed & Offline)',
              installed: true,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[AIChat] Could not list Ollama models:', err);
    }

    // 2. Google Gemini Models
    try {
      let hasGeminiKey = false;
      if (electronAi?.getApiKey) {
        const key = await electronAi.getApiKey('gemini');
        if (key && key.trim().length > 0) hasGeminiKey = true;
      }
      if (hasGeminiKey) {
        let discoveredGemini: Array<{ id: string; displayName?: string }> = [];
        const cachedRaw = localStorage.getItem('smartboard_discovered_models_gemini');
        if (cachedRaw) {
          try {
            discoveredGemini = JSON.parse(cachedRaw);
          } catch {}
        }

        // If no cache or empty, auto-query listModels from main process
        if (discoveredGemini.length === 0 && electronAi?.listModels) {
          try {
            const res = await electronAi.listModels('gemini', { timeoutMs: 8000 });
            const list = Array.isArray(res) ? res : (res?.models || []);
            discoveredGemini = list
              .map((m: any) => {
                const rawId = typeof m === 'string' ? m : (m.id || m.name || '');
                let cleanId = rawId;
                const paren = cleanId.match(/\(([^)]+)\)$/);
                if (paren && paren[1]) cleanId = paren[1].trim();
                cleanId = cleanId.replace(/^models\//, '').trim();
                const disp = typeof m === 'object' && m.displayName ? m.displayName : cleanId;
                return { id: cleanId, displayName: disp };
              })
              .filter((m: any) => {
                const lower = m.id.toLowerCase();
                return (
                  !lower.endsWith('-tts') &&
                  !lower.includes('-image') &&
                  !lower.includes('-transcribe') &&
                  !lower.includes('embedding') &&
                  !lower.includes('banana')
                );
              });
            if (discoveredGemini.length > 0) {
              localStorage.setItem('smartboard_discovered_models_gemini', JSON.stringify(discoveredGemini));
            }
          } catch {}
        }

        if (discoveredGemini.length > 0) {
          for (const m of discoveredGemini) {
            const isRec = m.id === 'gemini-3.5-flash';
            opts.push({
              key: `gemini:${m.id}`,
              provider: 'gemini',
              modelId: m.id,
              displayName: `${m.displayName || m.id}${isRec ? ' (Fast & Stable — Recommended)' : ''}`,
              group: '✨ Google Gemini (Discovered Live)',
              installed: true,
            });
          }
        } else {
          // Curated reliable high-speed defaults
          opts.push(
            {
              key: 'gemini:gemini-3.5-flash-lite',
              provider: 'gemini',
              modelId: 'gemini-3.5-flash-lite',
              displayName: 'Gemini 3.5 Flash-Lite (Fast & Reliable — Recommended)',
              group: '✨ Google Gemini (Cloud)',
              installed: true,
            },
            {
              key: 'gemini:gemini-3.6-flash',
              provider: 'gemini',
              modelId: 'gemini-3.6-flash',
              displayName: 'Gemini 3.6 Flash (Fast Response)',
              group: '✨ Google Gemini (Cloud)',
              installed: true,
            },
            {
              key: 'gemini:gemini-3.8-flash',
              provider: 'gemini',
              modelId: 'gemini-3.8-flash',
              displayName: 'Gemini 3.8 Flash (Preview)',
              group: '✨ Google Gemini (Cloud)',
              installed: true,
            },
            {
              key: 'gemini:gemini-flash-latest',
              provider: 'gemini',
              modelId: 'gemini-flash-latest',
              displayName: 'Gemini Flash Latest',
              group: '✨ Google Gemini (Cloud)',
              installed: true,
            },
            {
              key: 'gemini:gemini-pro-latest',
              provider: 'gemini',
              modelId: 'gemini-pro-latest',
              displayName: 'Gemini Pro Latest (Deep Multimodal Reasoning)',
              group: '✨ Google Gemini (Cloud)',
              installed: true,
            }
          );
        }
      }
    } catch {
      // ignore
    }

    // 3. Kimi (Moonshot AI)
    try {
      if (electronAi?.getApiKey) {
        const kimiKey = await electronAi.getApiKey('kimi');
        if (kimiKey && kimiKey.trim().length > 0) {
          opts.push(
            {
              key: 'kimi:moonshot-v1-8k',
              provider: 'openai',
              modelId: 'moonshot-v1-8k',
              displayName: 'Kimi / Moonshot v1 8K',
              group: '🌙 Moonshot AI (Kimi)',
              installed: true,
            },
            {
              key: 'kimi:kimi-k3',
              provider: 'openai',
              modelId: 'kimi-k3',
              displayName: 'Kimi K3 (Next-Gen Reasoning)',
              group: '🌙 Moonshot AI (Kimi)',
              installed: true,
            }
          );
        }
      }
    } catch {}

    // 4. DeepSeek AI
    try {
      if (electronAi?.getApiKey) {
        const dsKey = await electronAi.getApiKey('deepseek');
        if (dsKey && dsKey.trim().length > 0) {
          opts.push(
            {
              key: 'deepseek:deepseek-chat',
              provider: 'openai',
              modelId: 'deepseek-chat',
              displayName: 'DeepSeek-V3 Chat',
              group: '⚡ DeepSeek AI',
              installed: true,
            },
            {
              key: 'deepseek:deepseek-reasoner',
              provider: 'openai',
              modelId: 'deepseek-reasoner',
              displayName: 'DeepSeek-R1 Reasoner',
              group: '⚡ DeepSeek AI',
              installed: true,
            }
          );
        }
      }
    } catch {}

    // 5. Groq Cloud
    try {
      if (electronAi?.getApiKey) {
        const groqKey = await electronAi.getApiKey('groq');
        if (groqKey && groqKey.trim().length > 0) {
          opts.push({
            key: 'groq:llama-3.3-70b-versatile',
            provider: 'openai',
            modelId: 'llama-3.3-70b-versatile',
            displayName: 'Groq Llama 3.3 70B (Ultra-Fast)',
            group: '🚀 Groq Cloud',
            installed: true,
          });
        }
      }
    } catch {}

    // 6. OpenAI
    try {
      let hasOpenAiKey = false;
      if (electronAi?.getApiKey) {
        const key = await electronAi.getApiKey('openai');
        if (key && key.trim().length > 0) hasOpenAiKey = true;
      }
      if (hasOpenAiKey) {
        opts.push(
          {
            key: 'openai:gpt-4o-mini',
            provider: 'openai',
            modelId: 'gpt-4o-mini',
            displayName: 'GPT-4o Mini (Fast)',
            group: '⚡ OpenAI (Cloud)',
            installed: true,
          },
          {
            key: 'openai:gpt-4o',
            provider: 'openai',
            modelId: 'gpt-4o',
            displayName: 'GPT-4o (Flagship)',
            group: '⚡ OpenAI (Cloud)',
            installed: true,
          }
        );
      }
    } catch {}

    // 7. Built-in Offline Educational Engine
    opts.push({
      key: 'offline:default',
      provider: 'ollama',
      modelId: 'offline',
      displayName: 'Built-in Educational Engine (No Internet/Key Required)',
      group: '📚 Built-in Offline Assistant',
      installed: true,
    });

    // 8. Also ensure any custom/saved models from localStorage exist in options
    for (const prov of ['gemini', 'ollama', 'kimi', 'deepseek', 'groq', 'openai', 'custom'] as const) {
      try {
        const savedM = localStorage.getItem(`smartboard_model_${prov}`);
        if (savedM && !opts.some((o) => o.modelId === savedM && o.provider === prov)) {
          opts.push({
            key: `${prov}:${savedM}`,
            provider: prov as any,
            modelId: savedM,
            displayName: `${savedM} (${prov})`,
            group: '✨ Saved & Custom Models',
            installed: true,
          });
        }
      } catch {}
    }

    setModelOptions(opts);

    // Keep existing selected model if valid, else check saved custom models
    setSelectedModelKey((prev) => {
      // 1. Check saved active model key first if updated
      try {
        const savedActive = localStorage.getItem('smartboard_active_model_key');
        if (savedActive) {
          const activeMatch = opts.find((o) => o.key === savedActive);
          if (activeMatch) return activeMatch.key;
        }
      } catch {}

      // 2. If currently selected model is still in opts, preserve it
      const currentMatch = opts.find((o) => o.key === prev);
      if (currentMatch) return currentMatch.key;

      // 3. Fallback to saved per-provider models
      try {
        const savedGemini = localStorage.getItem('smartboard_model_gemini');
        if (savedGemini) {
          const geminiOpt = opts.find((o) => o.key === `gemini:${savedGemini}` || o.modelId === savedGemini);
          if (geminiOpt) return geminiOpt.key;
        }
        const savedOllama = localStorage.getItem('smartboard_model_ollama');
        if (savedOllama) {
          const ollamaOpt = opts.find((o) => o.key === `ollama:${savedOllama}` || o.modelId === savedOllama);
          if (ollamaOpt) return ollamaOpt.key;
        }
      } catch {}

      // 4. Prefer installed local or gemini model over fallback
      const preferred = opts.find((o) => o.key !== 'offline:default') || opts[0];
      return preferred ? preferred.key : 'offline:default';
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshConnectedModels();
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen, refreshConnectedModels]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedModelKey(key);

    // Cancel any hanging/in-progress generation so input is instantly unlocked
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    const chosen = modelOptions.find((m) => m.key === key);
    if (chosen) {
      if (chosen.key !== 'offline:default') {
        aiProviderManager.setActiveProvider(chosen.provider);
        aiProviderManager.setSelectedModel(chosen.modelId, chosen.provider);
        try {
          localStorage.setItem(`smartboard_model_${chosen.provider}`, chosen.modelId);
        } catch {}
      }
      try {
        localStorage.setItem('smartboard_active_model_key', chosen.key);
      } catch {}
    }

    // Instantly transfer focus to the chat textarea so teacher can type immediately!
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(140, Math.max(48, textareaRef.current.scrollHeight))}px`;
    }
  };

  const handleCopy = useCallback(async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleInsert = useCallback(
    (msgId: string, content: string, title?: string, isFormulaHint?: boolean) => {
      onInsertToBoard(content, title, undefined, isFormulaHint);
      setInsertedId(msgId);
      setTimeout(() => setInsertedId(null), 2000);
    },
    [onInsertToBoard]
  );

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = (textToSend || input).trim();
    if (!rawText || isLoading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: rawText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentChosen = modelOptions.find((m) => m.key === selectedModelKey);
    const provider = currentChosen?.provider || aiProviderManager.getActiveProvider();
    const model = currentChosen?.modelId || aiProviderManager.getSelectedModel(provider);

    const hasRealTopic = Boolean(currentTopic && currentTopic.trim() && !/^untitled(\s+lesson)?$/i.test(currentTopic.trim()));
    const topicLine = hasRealTopic ? `Active Lesson Topic: "${currentTopic.trim()}"\n` : '';
    const subjectLine = currentSubject && currentSubject.trim() && currentSubject !== 'General Education' ? `Subject Area: "${currentSubject.trim()}"\n` : '';

    const systemPrompt = `You are SmartNoteAI Teaching Assistant, an intelligent pedagogical AI assistant built for interactive whiteboard instruction, students, and classroom learning.
The app name is SmartNoteAI (never refer to yourself as SmartBoard Studio).
${topicLine}${subjectLine}User Query: "${rawText}"

Your goal is to answer the query accurately and with high pedagogical clarity, formatted into clean modular segments separated by '---' on its own line so formulas, diagrams, explanations, and questions can be dragged onto the smartboard individually.
NEVER say "Welcome teacher!" or include conversational greetings, preamble, or pleasantries. Only generate the exact educational content requested.
NEVER invent placeholder topics like "Untitled Lesson represents a foundational educational concept". Always address the user's actual question directly!

Pedagogical & Formatting Rules:
1. Answer the query directly and accurately.
2. Structure your response into distinct modular segments separated by '---' on its own line:
   - Concept / Definition (use ### Heading)
   - Step-by-Step Explanation / Key Pedagogical Points (clean bullet points)
   - Mathematical Formulas: ONLY IF the query or topic involves mathematics, physics, or quantitative equations. DO NOT generate math formulas or quadratic equations for humanities, history, biology, computer science concepts, or general queries (like "what is ai"). When formulas are needed, write display equations on their own lines using $$...$$, and inline symbols using $...$.
   - Vector Diagrams: When asked for a diagram, flowchart, graph, circuit, timing, or geometry, provide executable diagram code in markdown codeblocks:
     * For flowcharts, UML: \`\`\`mermaid ... \`\`\`
     * For mathematical graphs (e.g. parabolas, quadratics, trig): \`\`\`graph { "type": "graph", "expressions": ["y = x^2 - 4"], "xRange": [-5, 5], "yRange": [-5, 10], "axes": true, "grid": true } \`\`\`
     * For 2D geometry (triangles, angles, circles): \`\`\`geometry { "type": "geometry", "title": "Triangle ABC", "shapes": [{ "kind": "triangle", "points": [[-3, -2], [3, -2], [3, 2.5]], "label": "Triangle ABC", "rightAngle": true }] } \`\`\`
     * For digital logic circuits: \`\`\`circuit { "type": "circuit", "title": "Logic Circuit", "gates": [{ "type": "AND", "label": "AND1", "x": 220, "y": 140, "inputs": ["A", "B"], "output": "Y = A·B" }] } \`\`\`
     * For timing diagrams: \`\`\`timing { "signal": [{ "name": "CLK", "wave": "p........" }, { "name": "DATA", "wave": "0.10.10.1" }] } \`\`\`
     * For TikZ / vector paths: \`\`\`tikz ... \`\`\`
   - Classroom Practice Questions or Key Discussion Points (bullet points)
3. Do NOT merge multiple distinct formulas into a single continuous paragraph. Keep each primary formula separated so it can be dragged individually.
4. Keep explanations concise, classroom-ready, and formatted in clean Markdown (### headings, **bold**, and bullet points).
5. For mathematical expressions, terms, and variable definitions: ALWAYS keep variable names and explanations on the same line (e.g. "1. **First Term ($a$ or $a_1$):** The starting number of the sequence."). NEVER break variables, parentheses, or terms onto separate lines. Write complete, fluent pedagogical sentences.`;

    try {
      if (selectedModelKey === 'offline:default') {
        // Direct offline intelligent educational generator
        const content = generateIntelligentEducationalResponse(rawText, currentTopic, currentSubject);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content,
          timestamp: Date.now(),
          provider: 'Built-in Educational Engine',
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-archive active session
        const allUserMsgs = [...messages, userMsg].filter((m) => m.role === 'user');
        if (allUserMsgs.length > 0) {
          const firstQ = allUserMsgs[0].content;
          const sessionRec: ChatSessionRecord = {
            id: `session-active`,
            title: firstQ.length > 38 ? `${firstQ.slice(0, 38)}...` : firstQ,
            preview: content.slice(0, 75).replace(/[#*`$\n]/g, ' '),
            timestamp: Date.now(),
            messages: [...messages, userMsg, assistantMsg],
          };
          setSavedSessions((prev) => {
            const filtered = prev.filter((s) => s.id !== 'session-active');
            const updated = [sessionRec, ...filtered].slice(0, 30);
            try {
              localStorage.setItem('smartnoteai_chat_sessions', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      } else {
        // Call the configured AI provider
        const res = await aiProviderManager.generateText({
          provider,
          model,
          prompt: rawText,
          systemPrompt,
          temperature: 0.5,
          timeoutMs: provider === 'ollama' ? 180000 : 60000,
          signal: controller.signal,
        });

        if (res.success && res.text?.trim()) {
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: res.text.trim(),
            timestamp: Date.now(),
            provider: `${provider.toUpperCase()} (${model})`,
          };
          setMessages((prev) => [...prev, assistantMsg]);

          // Auto-archive active session
          const allUserMsgs = [...messages, userMsg].filter((m) => m.role === 'user');
          if (allUserMsgs.length > 0) {
            const firstQ = allUserMsgs[0].content;
            const sessionRec: ChatSessionRecord = {
              id: `session-active`,
              title: firstQ.length > 38 ? `${firstQ.slice(0, 38)}...` : firstQ,
              preview: assistantMsg.content.slice(0, 75).replace(/[#*`$\n]/g, ' '),
              timestamp: Date.now(),
              messages: [...messages, userMsg, assistantMsg],
            };
            setSavedSessions((prev) => {
              const filtered = prev.filter((s) => s.id !== 'session-active');
              const updated = [sessionRec, ...filtered].slice(0, 30);
              try {
                localStorage.setItem('smartnoteai_chat_sessions', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        } else {
          // HONEST ERROR DISPLAY: Never return canned fake math on API errors!
          const errorMsg = res.error || 'Connection failed or API key invalid/expired.';
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: '',
            isError: true,
            errorMessage: errorMsg,
            timestamp: Date.now(),
            provider: `${provider.toUpperCase()} (${model})`,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      }
    } catch (err: any) {
      if (controller.signal.aborted) {
        return;
      }
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        isError: true,
        errorMessage: err?.message || 'Network request failed or timed out.',
        timestamp: Date.now(),
        provider: `${provider.toUpperCase()} (${model})`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Chat history cleared!\n\nAsk me any question or choose a prompt chip below to generate lesson content.`,
        timestamp: Date.now(),
      },
    ]);
    try {
      localStorage.removeItem('smartnoteai_chat_history');
    } catch {}
  };

  const handleStartNewChat = () => {
    // If current conversation has user messages, archive it to saved sessions with unique id
    const userMsgs = messages.filter((m) => m.role === 'user');
    if (userMsgs.length > 0) {
      const firstQ = userMsgs[0].content;
      const archived: ChatSessionRecord = {
        id: `session-${Date.now()}`,
        title: firstQ.length > 38 ? `${firstQ.slice(0, 38)}...` : firstQ,
        preview: messages[messages.length - 1]?.content.slice(0, 75).replace(/[#*`$\n]/g, ' ') || firstQ,
        timestamp: Date.now(),
        messages: [...messages],
      };
      setSavedSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== 'session-active' && s.id !== archived.id);
        const updated = [archived, ...filtered].slice(0, 30);
        try {
          localStorage.setItem('smartnoteai_chat_sessions', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Started a fresh lesson session with **SmartNoteAI**!\n\nAsk any question or choose a prompt chip below to generate lesson content.`,
        timestamp: Date.now(),
      },
    ]);
    setShowHistoryDrawer(false);
  };

  const handleLoadSession = (session: ChatSessionRecord) => {
    setMessages(session.messages);
    setShowHistoryDrawer(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSavedSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem('smartnoteai_chat_sessions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAllSessions = () => {
    setSavedSessions([]);
    try {
      localStorage.removeItem('smartnoteai_chat_sessions');
    } catch {}
  };

  if (!isOpen) return null;

  // Group model options for select dropdown
  const groupedModels: { [group: string]: ConnectedModelOption[] } = {};
  for (const opt of modelOptions) {
    if (!groupedModels[opt.group]) {
      groupedModels[opt.group] = [];
    }
    groupedModels[opt.group].push(opt);
  }

  return (
    <div
      className="ai-chat-side-panel animated-glow-panel"
      style={{ width: `${width}px` }}
      data-testid="ai-chat-side-panel"
    >
      {/* Draggable Left Edge Resize Handle (Max 40% screen width) */}
      <div
        className="chat-resize-handle"
        onPointerDown={handleResizePointerDown}
        title="Drag left/right to resize chatbox (Max 40% of screen)"
      >
        <div className="chat-resize-bar" />
      </div>

      {/* ─── Modern Animated Header with SmartNoteAI Logo ─── */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-brand">
          <div className="ai-chat-logo-icon">
            <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect x="2" y="4" width="28" height="24" rx="7" fill="url(#logoGrad)" filter="url(#glowFilter)" />
              {/* Inner screen */}
              <rect x="5" y="7" width="22" height="18" rx="4" fill="#0f172a" />
              {/* Magic spark & pencil */}
              <path d="M12 12l8 8M16 11l-1 3 3-1z" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M21 9l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2z" fill="#facc15" />
            </svg>
          </div>
          <div className="ai-chat-brand-meta">
            <div className="ai-chat-title-row">
              <span className="brand-name">SmartNote<span className="ai-highlight">AI</span></span>
              <span className="badge-ai-pill">Teaching Assistant</span>
            </div>
            <div className="ai-chat-status-subtitle">
              <span className="status-dot-pulse" />
              <span className="status-text">
                {currentTopic ? `Active: ${currentTopic}` : 'Classroom Studio Ready'}
              </span>
            </div>
          </div>
        </div>

        <div className="ai-chat-header-actions">
          {/* Model Settings Drawer Icon */}
          <button
            className={`ai-chat-btn-icon settings-gear-btn ${showSettingsDrawer ? 'active' : ''}`}
            onClick={() => {
              setShowHistoryDrawer(false);
              setShowSettingsDrawer((prev) => !prev);
            }}
            title="Model Settings & API Keys (Configure Gemini, Ollama, Kimi, DeepSeek, Groq)"
            aria-label="Model Settings"
          >
            ⚙️
          </button>
          <button
            className={`ai-chat-btn-icon ${showHistoryDrawer ? 'active' : ''}`}
            onClick={() => {
              setShowSettingsDrawer(false);
              setShowHistoryDrawer((prev) => !prev);
            }}
            title="Conversation History & Saved Sessions"
            aria-label="Chat History"
          >
            📜
          </button>
          <button
            className="ai-chat-btn-icon"
            onClick={refreshConnectedModels}
            title="Refresh Connected Models"
            aria-label="Refresh Models"
          >
            🔄
          </button>
          <button
            className="ai-chat-btn-icon"
            onClick={handleClearHistory}
            title="Clear Chat History"
            aria-label="Clear History"
          >
            🗑️
          </button>
          <button
            className="ai-chat-btn-icon close-btn"
            onClick={onClose}
            title="Close Assistant"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ─── Model Settings Drawer Overlay (Inside Chatbox) ─── */}
      {showSettingsDrawer && (
        <ModelSettingsDrawer
          isOpen={showSettingsDrawer}
          onClose={() => {
            setShowSettingsDrawer(false);
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 60);
          }}
          onConfigSaved={() => {
            refreshConnectedModels();
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 80);
          }}
          onModelConfigChanged={(newKey) => {
            if (newKey) {
              setSelectedModelKey(newKey);
            }
            refreshConnectedModels();
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 80);
          }}
        />
      )}

      {/* ─── Conversation History Drawer Overlay (Inside Chatbox) ─── */}
      {showHistoryDrawer && (
        <div className="ai-chat-history-drawer">
          <div className="history-drawer-header">
            <span className="history-drawer-title">📜 Conversation History</span>
            <div className="history-drawer-header-actions">
              <button
                className="history-new-chat-btn"
                onClick={handleStartNewChat}
                title="Start a new lesson chat"
              >
                + New Chat
              </button>
              <button
                className="history-close-btn"
                onClick={() => setShowHistoryDrawer(false)}
                title="Close History"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="history-sessions-list">
            {savedSessions.length === 0 ? (
              <div className="history-empty-state">
                <span className="empty-icon">💭</span>
                <span className="empty-title">No saved conversations yet</span>
                <p>Your previous questions and lecture notes will appear here automatically.</p>
              </div>
            ) : (
              savedSessions.map((session) => (
                <div
                  key={session.id}
                  className="history-session-item"
                  onClick={() => handleLoadSession(session)}
                  title="Click to restore this chat"
                >
                  <div className="session-item-main">
                    <span className="session-item-title">{session.title}</span>
                    <span className="session-item-preview">{session.preview}</span>
                    <span className="session-item-meta">
                      {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.messages.length} messages
                    </span>
                  </div>
                  <button
                    className="session-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    title="Delete session"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          {savedSessions.length > 0 && (
            <div className="history-drawer-footer">
              <button className="clear-all-history-btn" onClick={handleClearAllSessions}>
                Clear All Past Conversations
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Model Selection Bar with Status Badge ─── */}
      <div className="ai-chat-model-bar">
        <label htmlFor="ai-model-select" className="ai-model-label">
          🤖 Model:
        </label>
        <select
          id="ai-model-select"
          className="ai-model-dropdown"
          value={selectedModelKey}
          onChange={handleModelChange}
          title="Select active AI intelligence engine"
        >
          {Object.entries(groupedModels).map(([group, options]) => (
            <optgroup key={group} label={group}>
              {options.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.displayName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          className="model-quick-configure-btn"
          onClick={() => setShowSettingsDrawer(true)}
          title="Add API Keys & Configure Custom Models"
        >
          + Setup
        </button>
      </div>

      {/* ─── Quick Prompt Chips ─── */}
      <div className="ai-chat-chips-scroll">
        {QUICK_PROMPTS.map((chip, idx) => (
          <button
            key={idx}
            className="ai-chat-chip"
            onClick={() => {
              const base = chip.prompt;
              const full = currentTopic ? `${base} "${currentTopic}"` : base;
              handleSendMessage(full);
            }}
            disabled={isLoading}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ─── Messages Scroll Area ─── */}
      <div className="ai-chat-messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`ai-chat-message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}
          >
            <div className={`ai-chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
              <div className="ai-bubble-header">
                <span className="bubble-author">
                  {msg.role === 'user' ? 'Question' : 'AI Assistant'}
                </span>
                {msg.provider && (
                  <span className="bubble-provider-tag">{msg.provider}</span>
                )}
              </div>

              {msg.isError ? (
                /* Honest Error Diagnostic Card */
                <div className="ai-chat-error-card">
                  <div className="ai-chat-error-title">
                    <span className="error-icon">⚠️</span>
                    <strong>Generation Failed</strong>
                  </div>
                  <div className="ai-chat-error-body">
                    {msg.errorMessage || 'Unable to communicate with the selected model.'}
                  </div>
                  <div className="ai-chat-error-actions">
                    <button
                      className="error-action-btn"
                      onClick={() => setShowSettingsDrawer(true)}
                    >
                      ⚙️ Configure API Key / Model
                    </button>
                    <button
                      className="error-action-btn secondary"
                      onClick={() => {
                        setSelectedModelKey('offline:default');
                        handleSendMessage(messages[messages.length - 2]?.content || currentTopic || 'Help me teach this');
                      }}
                    >
                      Switch to Offline Engine
                    </button>
                  </div>
                </div>
              ) : msg.role === 'assistant' && msg.id !== 'welcome' ? (
                /* Segmented Modular Assistant Response (Every formula, heading, paragraph separate) */
                <SegmentedMessageContent
                  content={msg.content}
                  copiedId={copiedId}
                  insertedId={insertedId}
                  onCopy={(text) => handleCopy(msg.id, text)}
                  onInsert={(text, title, isFormula) => handleInsert(msg.id, text, title, isFormula)}
                  onOpenVectorStudio={onOpenVectorStudio}
                />
              ) : (
                /* Simple Markdown/Text (User or Welcome) */
                <div className="ai-bubble-content">
                  <RenderedAIContent content={msg.content} />
                </div>
              )}

              {/* Action Buttons for Assistant Content (Full Response) */}
              {msg.role === 'assistant' && !msg.isError && (
                <div className="ai-bubble-actions">
                  <button
                    className="ai-action-btn drag-btn"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', msg.content);
                      e.dataTransfer.setData(
                        'application/x-smartboard-chat',
                        JSON.stringify({
                          text: msg.content,
                          title: currentTopic || 'Lesson Notes',
                          isFormula: false,
                        })
                      );
                    }}
                    title="Drag entire response onto whiteboard canvas"
                  >
                    ⠿ Drag Complete Response
                  </button>

                  <button
                    className="ai-action-btn copy-btn"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    title="Copy full text to clipboard"
                  >
                    {copiedId === msg.id ? '✓ Copied!' : '📋 Copy All'}
                  </button>

                  <button
                    className="ai-action-btn insert-btn"
                    onClick={() => handleInsert(msg.id, msg.content, currentTopic, false)}
                    title="1-Click insert entire response onto active smartboard slide"
                  >
                    {insertedId === msg.id ? '✓ Inserted!' : '➕ Insert All'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="ai-chat-message-row assistant-row">
            <div className="ai-chat-bubble assistant-bubble loading-bubble">
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span className="loading-text">Generating instructional content...</span>
              <button className="stop-gen-btn" onClick={handleStop} title="Stop generation">
                ⏹ Stop
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Animated Colorful Input Box with Typing Placeholder ─── */}
      <div
        className="ai-chat-input-wrapper animated-input-glow"
        onClick={() => textareaRef.current?.focus()}
        title="Click to type question"
      >
        <textarea
          ref={textareaRef}
          id="ai-chat-input-textarea"
          className="ai-chat-textarea"
          value={input}
          onChange={handleInputChange}
          placeholder={isLoading ? 'AI generating... click Stop or wait' : animatedPlaceholder}
          rows={1}
          autoFocus
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            textareaRef.current?.focus();
          }}
          disabled={isLoading}
        />
        {isLoading ? (
          <button
            type="button"
            className="ai-chat-stop-inline-btn"
            onClick={handleStop}
            title="Cancel generation and enable typing"
            aria-label="Stop generation"
          >
            ⏹ Stop
          </button>
        ) : (
          <button
            className="ai-chat-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!input.trim()}
            title="Send Question (Enter)"
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Render Markdown formatting + LaTeX equations with unified high fidelity
 */
function RenderedAIContent({ content }: { content: string }): React.ReactElement {
  const html = useMemo(() => markdownToHtml(content), [content]);
  return (
    <div
      className="ai-chat-content-rendered"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Live Vector Diagram Preview inside AI Chat message card
 */
function LiveDiagramPreview({
  code,
  diagramType,
  onOpenVectorStudio,
}: {
  code: string;
  diagramType?: DiagramType;
  onOpenVectorStudio?: (code: string) => void;
}): React.ReactElement {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [svg, setSvg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    renderDiagramToSvg(code, diagramType)
      .then((res) => {
        if (!cancelled) {
          setSvg(res.svg);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Diagram syntax parsing error');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, diagramType]);

  return (
    <div className="chat-diagram-wrapper">
      <div className="chat-diagram-tabs-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(15, 23, 42, 0.65)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px 6px 0 0' }}>
        <div className="diagram-mode-tabs" style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className={`diagram-tab-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            title="View rendered vector diagram"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              background: viewMode === 'preview' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: viewMode === 'preview' ? '#38bdf8' : '#94a3b8',
              border: viewMode === 'preview' ? '1px solid #38bdf8' : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            📊 Preview
          </button>
          <button
            type="button"
            className={`diagram-tab-btn ${viewMode === 'code' ? 'active' : ''}`}
            onClick={() => setViewMode('code')}
            title="View raw diagram code"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              background: viewMode === 'code' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: viewMode === 'code' ? '#38bdf8' : '#94a3b8',
              border: viewMode === 'code' ? '1px solid #38bdf8' : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            💻 Code
          </button>
        </div>
        {onOpenVectorStudio && (
          <button
            type="button"
            className="diagram-studio-open-btn"
            onClick={() => onOpenVectorStudio(code)}
            title="Open in Code-to-Vector Studio to edit"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(124, 58, 237, 0.25)',
              color: '#c084fc',
              border: '1px solid #c084fc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            📐 Edit in Studio
          </button>
        )}
      </div>

      {viewMode === 'preview' ? (
        loading ? (
          <div className="chat-diagram-loading">📐 Rendering vector diagram...</div>
        ) : error ? (
          <div className="chat-diagram-error">
            <div style={{ color: '#f87171', fontWeight: 600, marginBottom: '6px' }}>⚠️ Diagram preview error: {error}</div>
            <pre className="chat-diagram-raw-code">{code}</pre>
          </div>
        ) : (
          <div className="chat-diagram-viewport">
            <div
              className="chat-diagram-svg-container"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        )
      ) : (
        <div className="chat-diagram-code-view" style={{ padding: '8px' }}>
          <pre className="chat-diagram-raw-code" style={{ margin: 0, maxHeight: '200px', overflowY: 'auto' }}>{code}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Parse assistant response into discrete, modular teaching segments
 * (diagrams, formulas, headings, paragraphs, bullet lists, code blocks, tables)
 */
export function parseMessageSegments(content: string): ContentSegment[] {
  if (!content || !content.trim()) return [];

  // 1. Split by thematic break '---'
  const majorChunks = content
    .split(/\n\s*---\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  const segments: ContentSegment[] = [];
  let segIndex = 0;

  for (const chunk of majorChunks) {
    // If chunk contains an isolated display formula $$...$$ or code block ```...```,
    // split it out into discrete modular draggable segments!
    const subParts = chunk.split(/(\$\$[\s\S]*?\$\$|```[\s\S]*?```)/g);

    for (const part of subParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      segIndex++;
      const id = `seg-${segIndex}`;

      // Check if it's a display LaTeX formula
      if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
        segments.push({
          id,
          type: 'formula',
          rawText: trimmed,
          displayTitle: 'Math Formula',
          isFormula: true,
        });
        continue;
      }

      // Check if it's a code block (and check if it's a diagram!)
      if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
        const inner = trimmed.replace(/^```[a-z0-9_-]*\n?|\n?```$/gi, '').trim();
        const firstLine = trimmed.split('\n')[0].toLowerCase();
        const isMermaid = firstLine.includes('mermaid');
        const isGraph = firstLine.includes('graph') || firstLine.includes('function');
        const isCircuit = firstLine.includes('circuit');
        const isTiming = firstLine.includes('timing') || firstLine.includes('wavedrom');
        const isGeom = firstLine.includes('geometry') || firstLine.includes('jsxgraph');
        const isTikz = firstLine.includes('tikz');
        const isJsonDiagram =
          inner.startsWith('{') &&
          (inner.includes('"type": "graph"') ||
            inner.includes('"type":"graph"') ||
            inner.includes('"type": "geometry"') ||
            inner.includes('"type":"geometry"') ||
            inner.includes('"type": "circuit"') ||
            inner.includes('"type":"circuit"') ||
            inner.includes('"signal"'));

        if (isMermaid || isGraph || isCircuit || isTiming || isGeom || isTikz || isJsonDiagram) {
          const diagType = detectDiagramType(inner);
          segments.push({
            id,
            type: 'diagram',
            rawText: inner,
            displayTitle: `${diagType.toUpperCase()} Vector Diagram`,
            isFormula: false,
            diagramType: diagType,
          });
          continue;
        }

        segments.push({
          id,
          type: 'code',
          rawText: trimmed,
          displayTitle: 'Code Block',
          isFormula: false,
        });
        continue;
      }

      // Check if it's an un-fenced vector diagram code (e.g. JSON graph spec or raw Mermaid)
      const isRawDiagram =
        (trimmed.startsWith('{') &&
          (trimmed.includes('"type": "graph"') ||
            trimmed.includes('"type":"graph"') ||
            trimmed.includes('"type": "geometry"') ||
            trimmed.includes('"type":"geometry"') ||
            trimmed.includes('"type": "circuit"') ||
            trimmed.includes('"type":"circuit"') ||
            trimmed.includes('"signal"'))) ||
        trimmed.startsWith('graph TD') ||
        trimmed.startsWith('graph LR') ||
        trimmed.startsWith('sequenceDiagram') ||
        trimmed.startsWith('\\begin{tikzpicture}');

      if (isRawDiagram) {
        const diagType = detectDiagramType(trimmed);
        segments.push({
          id,
          type: 'diagram',
          rawText: trimmed,
          displayTitle: `${diagType.toUpperCase()} Vector Diagram`,
          isFormula: false,
          diagramType: diagType,
        });
        continue;
      }

      // Check if it's a markdown table
      const lines = trimmed.split('\n').map((l) => l.trim());
      if (lines.length >= 2 && lines[0].startsWith('|') && lines[lines.length - 1].endsWith('|')) {
        segments.push({
          id,
          type: 'table',
          rawText: trimmed,
          displayTitle: 'Comparison Table',
          isFormula: false,
        });
        continue;
      }

      // Check if it's a heading (and split any following bullets/paragraphs into their own draggable card)
      if (trimmed.startsWith('#')) {
        const lines = trimmed.split('\n');
        const firstLine = lines[0].trim();
        const remaining = lines.slice(1).join('\n').trim();

        const cleanHeading = firstLine.replace(/^#+\s*/, '');
        segments.push({
          id,
          type: 'heading',
          rawText: firstLine,
          displayTitle: cleanHeading.slice(0, 32),
          isFormula: false,
        });

        if (remaining) {
          segIndex++;
          const remId = `seg-${segIndex}`;
          const isRemBullets = remaining.startsWith('* ') || remaining.startsWith('- ') || /^\d+\.\s/.test(remaining);
          segments.push({
            id: remId,
            type: isRemBullets ? 'bullets' : 'paragraph',
            rawText: remaining,
            displayTitle: isRemBullets ? 'Key Points & Questions' : 'Teaching Explanation',
            isFormula: false,
          });
        }
        continue;
      }

      // Check if it's bullet list or practice questions
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
        segments.push({
          id,
          type: 'bullets',
          rawText: trimmed,
          displayTitle: 'Key Points & Questions',
          isFormula: false,
        });
        continue;
      }

      // Default paragraph
      segments.push({
        id,
        type: 'paragraph',
        rawText: trimmed,
        displayTitle: 'Teaching Explanation',
        isFormula: false,
      });
    }
  }

  if (segments.length === 0) {
    segments.push({
      id: 'seg-1',
      type: 'paragraph',
      rawText: content.trim(),
      displayTitle: 'Lesson Content',
      isFormula: false,
    });
  }

  return segments;
}

/**
 * Segmented Message Content Component:
 * Renders each modular segment as an interactive card with its own
 * [⠿ Drag], [➕ Insert], [✏️ Edit Code], and [📋 Copy] controls.
 */
function SegmentedMessageContent({
  content,
  copiedId,
  insertedId,
  onCopy,
  onInsert,
  onOpenVectorStudio,
}: {
  content: string;
  copiedId: string | null;
  insertedId: string | null;
  onCopy: (text: string) => void;
  onInsert: (text: string, title?: string, isFormula?: boolean) => void;
  onOpenVectorStudio?: (code: string) => void;
}): React.ReactElement {
  const segments = useMemo(() => parseMessageSegments(content), [content]);

  return (
    <div className="ai-bubble-segmented-container">
      {segments.map((seg) => (
        <div
          key={seg.id}
          className={`message-segment-card ${seg.isFormula ? 'segment-card-formula' : ''} ${seg.type === 'diagram' ? 'segment-card-diagram' : ''}`}
        >
          <div className="segment-card-topbar">
            <div className="segment-card-type-tag">
              {seg.type === 'diagram' && <span className="seg-tag-diagram">📐 VECTOR DIAGRAM</span>}
              {seg.isFormula && <span className="seg-tag-math">∑ FORMULA</span>}
              {seg.type === 'heading' && <span className="seg-tag-heading">📌 SECTION</span>}
              {seg.type === 'bullets' && <span className="seg-tag-bullets">📝 PRACTICE / LIST</span>}
              {seg.type === 'code' && <span className="seg-tag-code">💻 CODE</span>}
              {seg.type === 'table' && <span className="seg-tag-table">📊 TABLE</span>}
              {seg.type === 'paragraph' && <span className="seg-tag-text">📖 EXPLANATION</span>}
            </div>

            <div className="segment-card-actions">
              <button
                className="segment-action-btn seg-drag-btn"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', seg.rawText);
                  e.dataTransfer.setData(
                    'application/x-smartboard-chat',
                    JSON.stringify({
                      text: seg.rawText,
                      title: seg.displayTitle,
                      isFormula: seg.isFormula,
                      isDiagram: seg.type === 'diagram',
                    })
                  );
                }}
                title={
                  seg.type === 'diagram'
                    ? 'Drag this vector diagram directly onto the SmartBoard'
                    : seg.isFormula
                    ? 'Drag just this math formula onto the board'
                    : 'Drag this segment to board'
                }
              >
                {seg.type === 'diagram' ? '⠿ Drag Diagram' : '⠿ Drag'}
              </button>

              <button
                className="segment-action-btn seg-insert-btn"
                onClick={() => onInsert(seg.rawText, seg.displayTitle, seg.isFormula)}
                title="1-Click insert this segment to board"
              >
                {insertedId === seg.id ? '✓' : '➕ Insert'}
              </button>

              {seg.type === 'diagram' && onOpenVectorStudio && (
                <button
                  className="segment-action-btn seg-edit-btn"
                  onClick={() => onOpenVectorStudio(seg.rawText)}
                  title="Open in Code-to-Vector Diagram Studio to edit"
                >
                  ✏️ Edit Code
                </button>
              )}

              <button
                className="segment-action-btn seg-copy-btn"
                onClick={() => onCopy(seg.rawText)}
                title="Copy this segment"
              >
                {copiedId === seg.id ? '✓' : '📋'}
              </button>
            </div>
          </div>

          <div className="segment-card-body">
            {seg.type === 'diagram' ? (
              <LiveDiagramPreview code={seg.rawText} diagramType={seg.diagramType} onOpenVectorStudio={onOpenVectorStudio} />
            ) : (
              <RenderedAIContent content={seg.rawText} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Intelligent educational generator for offline mode — accurately extracts teacher query
 */
function generateIntelligentEducationalResponse(prompt: string, topic?: string, subject?: string): string {
  const p = prompt.toLowerCase();
  const rawQuery = prompt.replace(/^(what is|explain|define|tell me about|how to)\s*/i, '').trim();
  const effectiveTopic = rawQuery.length > 2 ? rawQuery : (topic || 'Key Classroom Concept');

  if (p.includes('ai') || p.includes('artificial intelligence')) {
    return (
      `### What is Artificial Intelligence (AI)?\n\n` +
      `**Definition:** **Artificial Intelligence (AI)** is the simulation of human intelligence processes by computer systems, enabling machines to learn, reason, problem-solve, and make decisions.\n\n` +
      `---\n\n` +
      `#### Core Branches of AI:\n` +
      `- **Machine Learning (ML):** Algorithms that improve automatically through experience and data analysis.\n` +
      `- **Deep Learning & Neural Networks:** Multi-layered neural architectures inspired by the biological brain (e.g. transformers for LLMs and vision).\n` +
      `- **Natural Language Processing (NLP):** Systems that understand, interpret, and generate human language.\n` +
      `- **Computer Vision:** Enabling computers to derive meaningful information from digital images and videos.\n\n` +
      `---\n\n` +
      `#### Classroom Discussion Point:\n` +
      `"How does modern generative AI differ from traditional rule-based algorithms?"`
    );
  }

  if (p.includes('math') || p.includes('solve') || p.includes('quadratic') || p.includes('formula')) {
    return (
      `### Step-by-Step Worked Derivation: ${effectiveTopic}\n\n` +
      `**Standard Form of Quadratic Equation:**\n\n` +
      `---\n\n` +
      `$$ax^2 + bx + c = 0 \\quad (a \\ne 0)$$\n\n` +
      `---\n\n` +
      `#### The Quadratic Formula:\n\n` +
      `$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n` +
      `---\n\n` +
      `#### Step-by-Step Solved Example:\n` +
      `Solve $x^2 + 5x + 6 = 0$:\n` +
      `1. **Identify Coefficients:** $a = 1, \\quad b = 5, \\quad c = 6$\n` +
      `2. **Compute Discriminant ($D$):**\n\n` +
      `$$D = b^2 - 4ac = 5^2 - 4(1)(6) = 25 - 24 = 1$$\n\n` +
      `3. **Calculate Roots:**\n\n` +
      `$$x = \\frac{-5 \\pm \\sqrt{1}}{2(1)} = \\frac{-5 \\pm 1}{2}$$\n\n` +
      `$$x_1 = -2, \\qquad x_2 = -3$$\n\n` +
      `---\n\n` +
      `**Final Answer:** The roots are $x = -2$ and $x = -3$.`
    );
  }

  if (p.includes('question') || p.includes('practice') || p.includes('quiz')) {
    return (
      `### Classroom Practice Questions: ${effectiveTopic}\n\n` +
      `1. **Conceptual Understanding:** State the primary definition of **${effectiveTopic}** and explain why it is essential in ${subject || 'this discipline'}.\n\n` +
      `---\n\n` +
      `2. **Problem Solving:** Given a standard scenario involving **${effectiveTopic}**, predict the outcome when conditions change by a factor of 2.\n\n` +
      `---\n\n` +
      `3. **Critical Thinking:** What are the most common student misconceptions when studying **${effectiveTopic}**, and how can we verify our answer?`
    );
  }

  return (
    `### Classroom Concept: ${effectiveTopic}\n\n` +
    `**Overview:** **${effectiveTopic}** is a core pedagogical subject in **${subject || 'General Studies'}**.\n\n` +
    `---\n\n` +
    `#### Key Instructional Points:\n` +
    `- **Foundational Principle:** Clarifies the core mechanisms and relationships governing ${effectiveTopic}.\n` +
    `- **Real-World Connection:** Relates theoretical concepts to practical everyday phenomena.\n` +
    `- **Common Student Pitfall:** Conflating definitions or omitting boundary conditions.\n\n` +
    `---\n\n` +
    `#### Classroom Discussion Point:\n` +
    `"How does the study of ${effectiveTopic} apply to modern real-world problem solving?"`
  );
}
