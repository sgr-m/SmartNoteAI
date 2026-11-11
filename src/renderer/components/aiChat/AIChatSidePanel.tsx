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
  isSupportedDiagramCode,
  renderDiagramToSvg,
} from '../../services/vectorDiagramService';
import { markdownToHtml } from '../../services/markdownRenderService';
import {
  GEMINI_CURATED_MODELS,
  GEMINI_DEFAULT_MODEL,
  GEMINI_LEGACY_PHANTOM_MODEL_IDS,
  isSupportedGeminiChatModel,
  normalizeGeminiModelId,
  sortGeminiModels,
} from '../../../shared/geminiModelUtils';
import katex from 'katex';
import './AIChatSidePanel.css';

export interface WebImageItem {
  title: string;
  imageUrl: string;
  thumbUrl: string;
  pageUrl: string;
  source: string;
}

export interface WebGroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  title?: string;
  timestamp: number;
  provider?: string;
  isError?: boolean;
  errorMessage?: string;
  webImages?: WebImageItem[];
  webImageSearchUrl?: string;
  groundingSources?: WebGroundingSource[];
}

export interface ContentSegment {
  id: string;
  type: 'formula' | 'heading' | 'bullets' | 'table' | 'code' | 'paragraph' | 'diagram' | 'image';
  rawText: string;
  displayTitle: string;
  isFormula: boolean;
  diagramType?: DiagramType;
  imageUrl?: string;
  thumbUrl?: string;
  pageUrl?: string;
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
  onInsertImageUrlToBoard?: (url: string, title?: string, targetPos?: { x: number; y: number }) => void;
  onOpenInBrowser?: (url: string) => void;
  onOpenVectorStudio?: (code: string) => void;
  onEnhanceBoard?: () => void;
  currentTopic?: string;
  currentSubject?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
  initialQuery?: string | null;
  onClearInitialQuery?: () => void;
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

/**
 * Detects whether the user's message is ONLY a standalone greeting or introductory query
 * so real educational prompts starting with "hi explain..." or "help me solve..." are NEVER hijacked!
 */
export function isGreetingOrChitchat(text: string): boolean {
  const t = (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!t) return false;
  if (t === 'hi' || t === 'hello' || t === 'hey' || t === 'test' || t === 'help') {
    return true;
  }
  return (
    /^(?:hi+|hello+|hey+|howdy|greetings|hola)(?:\s+(?:there|ai|assistant|smartnoteai|bot|friend))?[!?.]*$/i.test(t) ||
    /^good\s+(?:morning|afternoon|evening|night)(?:\s+(?:there|ai|assistant))?[!?.]*$/i.test(t) ||
    /^(?:who\s+are\s+you|what\s+can\s+you\s+do|help\s+me)[?!.]*$/i.test(t)
  );
}

/**
 * Strips accidental leading "Welcome to SmartBoard / SmartNoteAI..." boilerplate
 * from model responses to educational prompts so content starts directly.
 */
export function stripLeadingWelcomeBoilerplate(text: string): string {
  if (!text) return '';
  let out = text.trim();
  const welcomeLineRe =
    /^(?:#+\s*)?(?:hello!?\s*|hi!?\s*|welcome\s+(?:back\s+)?to\s+(?:\*{0,2})?(?:smartboard|smartnoteai)(?:\*{0,2})?(?:\s+teaching\s+assistant)?[!.:👋\s]*\n+)+/i;
  out = out.replace(welcomeLineRe, '').trim();
  // Also strip standalone opening sentence like "Welcome to SmartBoard! " on same line
  out = out.replace(
    /^(?:hello!?\s*)?welcome\s+to\s+(?:\*{0,2})?(?:smartboard|smartnoteai)(?:\s+teaching\s+assistant)?(?:\*{0,2})?[!.,:\s-]+/i,
    ''
  ).trim();
  return out;
}

/**
 * On application startup, ensure the user starts with a fresh new chat,
 * while automatically archiving and preserving any prior conversation in history!
 */
function getInitialMessagesAndPreserveHistory(): ChatMessage[] {
  let isSessionStarted = false;
  try {
    isSessionStarted = Boolean(sessionStorage.getItem('smartnoteai_app_session_started'));
  } catch {}

  if (!isSessionStarted) {
    // New app launch: archive existing chat if it contains user messages
    try {
      const saved = localStorage.getItem('smartnoteai_chat_history');
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const userMsgs = parsed.filter((m) => m.role === 'user');
          if (userMsgs.length > 0) {
            const rawSessions = localStorage.getItem('smartnoteai_chat_sessions');
            const sessions: ChatSessionRecord[] = rawSessions ? JSON.parse(rawSessions) : [];
            const firstQ = userMsgs[0].content;
            const lastMsg = parsed[parsed.length - 1];
            const archived: ChatSessionRecord = {
              id: `session-startup-${Date.now()}`,
              title: firstQ.length > 38 ? `${firstQ.slice(0, 38)}...` : firstQ,
              preview: (lastMsg?.content || firstQ).slice(0, 75).replace(/[#*`$\n]/g, ' '),
              timestamp: lastMsg?.timestamp || Date.now(),
              messages: parsed,
            };
            const filtered = sessions.filter((s) => s.id !== 'session-active' && s.title !== archived.title);
            const updated = [archived, ...filtered].slice(0, 40);
            localStorage.setItem('smartnoteai_chat_sessions', JSON.stringify(updated));
          }
        }
      }
    } catch {}

    try {
      sessionStorage.setItem('smartnoteai_app_session_started', 'true');
      localStorage.setItem('smartnoteai_chat_history', JSON.stringify([]));
    } catch {}

    return [];
  }

  // App is already running in this session: load ongoing history
  try {
    const saved = localStorage.getItem('smartnoteai_chat_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((m: ChatMessage) => m && m.id !== 'welcome');
      }
    }
  } catch {}

  return [];
}

/**
 * Extracts [IMAGE_SEARCH: ...] tags from AI output and returns cleaned markdown text + queries.
 */
export function extractImageSearchTags(text: string): { cleanedText: string; queries: string[] } {
  const queries: string[] = [];
  const cleanedText = (text || '')
    .replace(/^\s*(?:[-*]\s*)?\[IMAGE_SEARCH\s*:\s*([^\]]+)\]\s*$/gim, (_, q: string) => {
      const trimmed = q.trim();
      if (trimmed) queries.push(trimmed);
      return '';
    })
    .replace(/\[IMAGE_SEARCH\s*:\s*([^\]]+)\]/gi, (_, q: string) => {
      const trimmed = q.trim();
      if (trimmed) queries.push(trimmed);
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { cleanedText, queries };
}

/**
 * Determines whether the user's prompt benefits from fetching web educational images,
 * and returns a clean search query when appropriate (or null).
 */
export function deriveWebImageQueryFromPrompt(prompt: string, isGreeting: boolean): string | null {
  if (isGreeting || !prompt) return null;
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  const explicitImageAsk =
    /\b(image|images|photo|photos|picture|pictures|pic|pics|diagram|illustration|search\s+web|find\s+on\s+(?:the\s+)?web|show\s+me)\b/i.test(
      trimmed
    );

  // Strip conversational lead-ins & image-request filler words to isolate core topic
  const stripped = trimmed
    .replace(
      /^(?:explain\s+or\s+derive\s*:|please\s+|can\s+you\s+|could\s+you\s+|tell\s+me\s+(?:about\s+)?|explain\s+|define\s+|describe\s+|show\s+me\s+|find\s+(?:me\s+)?|search\s+(?:for\s+)?|what\s+(?:is|are)\s+|how\s+does\s+)/gi,
      ''
    )
    .replace(
      /\b(?:(?:an?\s+)?(?:images?|photos?|pictures?|pics?|diagrams?|illustrations?)(?:\s+of)?|on\s+the\s+web|from\s+(?:the\s+)?internet)\b/gi,
      ''
    )
    .replace(/^(?:an?\s+|the\s+|of\s+|for\s+|about\s+)/i, '')
    .replace(/[?!.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (explicitImageAsk && stripped.length >= 2) {
    return stripped.slice(0, 80);
  }

  // Skip pure arithmetic / symbolic equations unless an image was explicitly requested
  if (/^[\d\s+\-*/=^().x yz]+$/i.test(trimmed) || /\b(solve|factor|simplify|differentiate|integrate|derive)\b/i.test(trimmed)) {
    return null;
  }

  const visualTopicKeywords =
    /\b(photosynthesis|chloroplast|mitochondria|cell|mitosis|meiosis|dna|rna|neuron|heart|brain|lungs|kidney|digestive|skeleton|flower|leaf|volcano|earthquake|solar\s+system|planet|galaxy|atom|molecule|microscope|telescope|pyramid|glacier|water\s+cycle|carbon\s+cycle|nitrogen\s+cycle|ecosystem|food\s+web|plate\s+tectonics|magnet|prism|circuit|crystal)\b/i;

  if (visualTopicKeywords.test(trimmed) && stripped.length >= 2) {
    return stripped.slice(0, 80);
  }

  // Short noun-phrase queries (1-4 words, non-trivial) also benefit from reference visuals
  const wordCount = stripped.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 1 && wordCount <= 4 && stripped.length >= 4 && !/^(help|test|why|when|where)$/i.test(stripped)) {
    return stripped.slice(0, 80);
  }

  return null;
}

async function fetchWebImagesForQuery(
  query: string,
  limit = 4
): Promise<{ images: WebImageItem[]; searchUrl: string }> {
  const cleanQ = query.trim();
  if (!cleanQ) return { images: [], searchUrl: '' };
  const fallbackSearchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(cleanQ)}`;
  try {
    const invoke = (window as any)?.electronAPI?.invoke;
    if (typeof invoke === 'function') {
      const res = await invoke('net:searchEducationalImages', cleanQ, limit);
      if (res && res.success) {
        return {
          images: Array.isArray(res.images) ? res.images : [],
          searchUrl:
            typeof res.searchUrl === 'string' && res.searchUrl ? res.searchUrl : fallbackSearchUrl,
        };
      }
    }
  } catch {
    // Non-fatal fallback to searchUrl
  }
  return { images: [], searchUrl: fallbackSearchUrl };
}

export function AIChatSidePanel({
  isOpen,
  onClose,
  onInsertToBoard,
  onInsertImageUrlToBoard,
  onOpenInBrowser,
  onOpenVectorStudio,
  onEnhanceBoard,
  currentTopic = '',
  currentSubject = '',
  width = 420,
  onWidthChange,
  initialQuery = null,
  onClearInitialQuery,
}: AIChatSidePanelProps): React.ReactElement | null {
  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessagesAndPreserveHistory);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('smartnoteai_web_search_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
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
      const sanitizeGeminiKey = (candidateModel: string): string => {
        const cleanId = normalizeGeminiModelId(candidateModel);
        if (!cleanId || !isSupportedGeminiChatModel(cleanId) || GEMINI_LEGACY_PHANTOM_MODEL_IDS.has(cleanId.toLowerCase())) {
          return `gemini:${GEMINI_DEFAULT_MODEL}`;
        }
        return `gemini:${cleanId}`;
      };
      const savedActive = localStorage.getItem('smartboard_active_model_key');
      if (savedActive) {
        if (savedActive.startsWith('gemini:')) {
          return sanitizeGeminiKey(savedActive.slice('gemini:'.length));
        }
        return savedActive;
      }
      const savedGemini = localStorage.getItem('smartboard_model_gemini');
      if (savedGemini) return sanitizeGeminiKey(savedGemini);
    } catch {}
    return `gemini:${GEMINI_DEFAULT_MODEL}`;
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
    let discoveredGemini: Array<{ id: string; displayName?: string }> = [];
    try {
      let hasGeminiKey = false;
      if (electronAi?.getApiKey) {
        const key = await electronAi.getApiKey('gemini');
        if (key && key.trim().length > 0) hasGeminiKey = true;
      }
      if (hasGeminiKey) {
        const cachedRaw = localStorage.getItem('smartboard_discovered_models_gemini');
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            if (Array.isArray(parsed)) {
              const filtered = parsed
                .map((m: any) => {
                  const rawId = typeof m === 'string' ? m : (m?.id || m?.name || '');
                  const cleanId = normalizeGeminiModelId(rawId);
                  const disp = typeof m === 'object' && m?.displayName ? m.displayName : cleanId;
                  return { id: cleanId, displayName: disp };
                })
                .filter((m) => isSupportedGeminiChatModel(m.id));
              discoveredGemini = sortGeminiModels(filtered);
              if (discoveredGemini.length !== parsed.length) {
                if (discoveredGemini.length > 0) {
                  localStorage.setItem('smartboard_discovered_models_gemini', JSON.stringify(discoveredGemini));
                } else {
                  localStorage.removeItem('smartboard_discovered_models_gemini');
                }
              }
            }
          } catch {}
        }

        // If no cache or empty, auto-query listModels from main process
        if (discoveredGemini.length === 0 && electronAi?.listModels) {
          try {
            const res = await electronAi.listModels('gemini', { timeoutMs: 8000 });
            const list = Array.isArray(res) ? res : (res?.models || []);
            const mapped = list
              .map((m: any) => {
                const rawId = typeof m === 'string' ? m : (m.id || m.name || '');
                const cleanId = normalizeGeminiModelId(rawId);
                const disp = typeof m === 'object' && m.displayName ? m.displayName : cleanId;
                return { id: cleanId, displayName: disp };
              })
              .filter((m: any) => isSupportedGeminiChatModel(m.id));
            discoveredGemini = sortGeminiModels(mapped);
            if (discoveredGemini.length > 0) {
              localStorage.setItem('smartboard_discovered_models_gemini', JSON.stringify(discoveredGemini));
            }
          } catch {}
        }

        if (discoveredGemini.length > 0) {
          for (const m of discoveredGemini) {
            const isRec = m.id === GEMINI_DEFAULT_MODEL;
            opts.push({
              key: `gemini:${m.id}`,
              provider: 'gemini',
              modelId: m.id,
              displayName: `${m.displayName || m.id}${isRec ? ' (Recommended)' : ''}`,
              group: '✨ Google Gemini (Discovered Live)',
              installed: true,
            });
          }
        } else {
          // Curated free-tier friendly defaults when live model discovery has not yet completed
          for (const curated of GEMINI_CURATED_MODELS) {
            opts.push({
              key: `gemini:${curated.id}`,
              provider: 'gemini',
              modelId: curated.id,
              displayName: curated.name,
              group: '✨ Google Gemini (Cloud)',
              installed: true,
            });
          }
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

    // 8. Also ensure valid custom/saved models from localStorage exist in options
    const discoveredGeminiIds = new Set(discoveredGemini.map((m) => m.id.toLowerCase()));
    const isValidSavedGeminiId = (modelId: string): boolean => {
      const cleanId = normalizeGeminiModelId(modelId);
      if (!cleanId || !isSupportedGeminiChatModel(cleanId)) return false;
      if (GEMINI_LEGACY_PHANTOM_MODEL_IDS.has(cleanId.toLowerCase())) {
        return discoveredGeminiIds.has(cleanId.toLowerCase());
      }
      return true;
    };

    for (const prov of ['gemini', 'ollama', 'kimi', 'deepseek', 'groq', 'openai', 'custom'] as const) {
      try {
        const savedM = localStorage.getItem(`smartboard_model_${prov}`);
        if (!savedM) continue;
        if (prov === 'gemini' && !isValidSavedGeminiId(savedM)) {
          continue;
        }
        const cleanM = prov === 'gemini' ? normalizeGeminiModelId(savedM) : savedM;
        if (!opts.some((o) => o.modelId === cleanM && o.provider === prov)) {
          opts.push({
            key: `${prov}:${cleanM}`,
            provider: prov as any,
            modelId: cleanM,
            displayName: `${cleanM} (${prov})`,
            group: '✨ Saved & Custom Models',
            installed: true,
          });
        }
      } catch {}
    }

    setModelOptions(opts);

    // Keep existing selected model if valid, else pick best active or recommended option
    setSelectedModelKey((prev) => {
      // 1. Check saved active model key first if updated
      try {
        const savedActive = localStorage.getItem('smartboard_active_model_key');
        if (savedActive) {
          const isStaleGemini =
            savedActive.startsWith('gemini:') && !isValidSavedGeminiId(savedActive.slice('gemini:'.length));
          if (!isStaleGemini) {
            const activeMatch = opts.find((o) => o.key === savedActive);
            if (activeMatch) return activeMatch.key;
          }
        }
      } catch {}

      // 2. If currently selected model is still in opts (and not stale Gemini), preserve it
      const prevStaleGemini = prev.startsWith('gemini:') && !isValidSavedGeminiId(prev.slice('gemini:'.length));
      if (!prevStaleGemini) {
        const currentMatch = opts.find((o) => o.key === prev);
        if (currentMatch) return currentMatch.key;
      }

      // 3. Fallback to saved per-provider models
      try {
        const savedGemini = localStorage.getItem('smartboard_model_gemini');
        if (savedGemini && isValidSavedGeminiId(savedGemini)) {
          const cleanGemini = normalizeGeminiModelId(savedGemini);
          const geminiOpt = opts.find((o) => o.key === `gemini:${cleanGemini}` || o.modelId === cleanGemini);
          if (geminiOpt) return geminiOpt.key;
        }
        const savedOllama = localStorage.getItem('smartboard_model_ollama');
        if (savedOllama) {
          const ollamaOpt = opts.find((o) => o.key === `ollama:${savedOllama}` || o.modelId === savedOllama);
          if (ollamaOpt) return ollamaOpt.key;
        }
      } catch {}

      // 4. Prefer installed local or Flash Gemini model over offline fallback
      const preferred =
        opts.find((o) => o.key === `gemini:${GEMINI_DEFAULT_MODEL}`) ||
        opts.find((o) => o.key !== 'offline:default') ||
        opts[0];
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

    const isGreeting = isGreetingOrChitchat(rawText);

    let systemPrompt = '';
    if (isGreeting) {
      systemPrompt = `You are SmartNoteAI Teaching Assistant, a concise AI assistant built for interactive whiteboard instruction.
The user greeted you (saying "${rawText}").
Reply briefly and warmly in 2-3 sentences asking what topic or lesson they would like to teach today. Do NOT output long welcome banners or invent random lecture topics.`;
    } else {
      const webImageRule = webSearchEnabled
        ? `\n- Web Image Lookup: When the topic benefits from real-world educational photos, biological/anatomical illustrations, maps, historical artifacts, or when the user asks for images/pictures, include ONE tag on its own line at the end: [IMAGE_SEARCH: concise 2-5 word search query]. Do NOT invent fake image URLs.`
        : '';
      systemPrompt = `You are SmartNoteAI Teaching Assistant, an intelligent pedagogical assistant built for interactive classroom whiteboard instruction.
The app name is SmartNoteAI.
${topicLine}${subjectLine}User Query: "${rawText}"

CRITICAL RESPONSE START RULE:
- NEVER start with "Welcome to SmartBoard", "Welcome to SmartNoteAI", "Hello! Welcome...", or conversational filler. Start DIRECTLY with the requested educational content.

CORE PEDAGOGICAL PHILOSOPHY:
Be dynamic, subject-adaptive, and deeply relevant to the user's specific query.
Select 2 to 4 of the most appropriate pedagogical components suited for this topic, separated by '---' on its own line so each element (heading, explanation, formula, diagram, table, code, or practice question) can be dragged individually onto the whiteboard.

SUPPORTED SMARTBOARD VECTOR DIAGRAMS (use ONLY valid syntax below inside fenced blocks):
1. Mathematics & Physics:
   - Display formulas on their own lines using $$...$$ and inline symbols using $...$.
   - Function plots: \`\`\`graph\n{ "type": "graph", "expressions": ["x^2 - 4"], "xRange": [-5, 5], "yRange": [-6, 10], "axes": true, "grid": true }\n\`\`\`
   - 2D Geometry: \`\`\`geometry\n{ "type": "geometry", "title": "...", "shapes": [{ "kind": "triangle", "points": [[0,0],[4,0],[1.5,3]], "labels": ["A","B","C"] }] }\n\`\`\`
   - Data charts: \`\`\`chart\n{ "type": "chart", "chartType": "bar", "title": "...", "labels": ["A","B"], "values": [10,20] }\n\`\`\`
2. Natural Sciences, History & Computer Science Flowcharts / Timelines:
   - Mermaid flowcharts: \`\`\`mermaid\nflowchart TD\n  A["Step 1 (Details)"] --> B["Step 2"]\n\`\`\`
     CRITICAL MERMAID RULE: Always enclose node labels containing spaces, parentheses, colons, math, or punctuation in double quotes inside brackets, e.g. A["Sea Level (1013.25 mb)"] --> B["Troposphere"], and use --> arrows (not Unicode arrows).
   - Timelines: \`\`\`mermaid\ntimeline\n  title Key Milestones\n  1900 : Discovery\n\`\`\`
   - Digital logic circuits: \`\`\`circuit\n{ "type": "circuit", "title": "...", "gates": [{ "id": "G1", "type": "AND", "x": 180, "y": 100 }], "wires": [] }\n\`\`\`

CRITICAL FORMATTING RULES:
1. Address the user's actual question directly with clean Markdown (### headings, **bold**, bullet points, or Markdown tables).
2. NEVER emit CSS font-size rules if writing HTML snippets.
3. NEVER include math formulas for non-mathematical subjects unless requested.
4. Keep distinct formulas, diagrams, tables, and questions separated by '---' on its own line.
5. Keep variable names and explanations on the same line (e.g. "1. **Amplitude ($A$):** Maximum displacement from equilibrium.").${webImageRule}`;
    }

    const speculativeImageQuery = webSearchEnabled ? deriveWebImageQueryFromPrompt(rawText, isGreeting) : null;
    const speculativeImagePromise = speculativeImageQuery
      ? fetchWebImagesForQuery(speculativeImageQuery, 4)
      : null;

    try {
      if (selectedModelKey === 'offline:default') {
        // Direct offline intelligent educational generator
        const rawOffline = generateIntelligentEducationalResponse(rawText, currentTopic, currentSubject);
        const { cleanedText, queries } = extractImageSearchTags(rawOffline);
        const content = isGreeting ? cleanedText : stripLeadingWelcomeBoilerplate(cleanedText);
        let webImages: WebImageItem[] = [];
        let webImageSearchUrl: string | undefined;
        if (webSearchEnabled && !isGreeting) {
          const explicitQ = queries[0];
          const imageRes =
            explicitQ && explicitQ.toLowerCase() !== (speculativeImageQuery || '').toLowerCase()
              ? await fetchWebImagesForQuery(explicitQ, 4)
              : speculativeImagePromise
              ? await speculativeImagePromise
              : null;
          if (imageRes) {
            webImages = imageRes.images;
            webImageSearchUrl = imageRes.searchUrl;
          }
        }
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content,
          timestamp: Date.now(),
          provider: 'Built-in Educational Engine',
          webImages: webImages.length > 0 ? webImages : undefined,
          webImageSearchUrl,
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
        const effectivePrompt = isGreeting && (provider === 'ollama' || selectedModelKey.startsWith('ollama:'))
          ? `Hello! Please introduce yourself briefly as SmartNoteAI Teaching Assistant and ask what lesson or topic they would like to explore today.`
          : rawText;

        const res = await aiProviderManager.generateText({
          provider,
          model,
          prompt: effectivePrompt,
          systemPrompt,
          temperature: 0.5,
          timeoutMs: provider === 'ollama' ? 180000 : 60000,
          signal: controller.signal,
          enableWebSearch: webSearchEnabled && !isGreeting,
        });

        if (res.success && res.text?.trim()) {
          const { cleanedText, queries } = extractImageSearchTags(res.text.trim());
          const finalContent = isGreeting ? cleanedText : stripLeadingWelcomeBoilerplate(cleanedText);
          let webImages: WebImageItem[] = [];
          let webImageSearchUrl: string | undefined;

          if (webSearchEnabled && !isGreeting) {
            const explicitQ = queries[0];
            const imageRes =
              explicitQ && explicitQ.toLowerCase() !== (speculativeImageQuery || '').toLowerCase()
                ? await fetchWebImagesForQuery(explicitQ, 4)
                : speculativeImagePromise
                ? await speculativeImagePromise
                : null;
            if (imageRes) {
              webImages = imageRes.images;
              webImageSearchUrl = imageRes.searchUrl;
            }
          }

          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: finalContent || res.text.trim(),
            timestamp: Date.now(),
            provider: `${provider.toUpperCase()} (${res.model || model})`,
            webImages: webImages.length > 0 ? webImages : undefined,
            webImageSearchUrl,
            groundingSources:
              Array.isArray(res.groundingSources) && res.groundingSources.length > 0
                ? res.groundingSources
                : undefined,
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

  // When Ask AI is clicked from canvas on selected text:
  // Populate chat input with "explain or derive: " prefix, focus the input, and let user click send
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      const q = initialQuery.trim();
      onClearInitialQuery?.();
      const prefix = 'explain or derive: ';
      const formatted = q.toLowerCase().startsWith('explain or derive:')
        ? q
        : `${prefix}${q}`;
      setInput(formatted);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(formatted.length, formatted.length);
        }
      }, 80);
    }
  }, [initialQuery, onClearInitialQuery]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('smartnoteai_web_search_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const handleClearHistory = () => {
    setMessages([]);
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

    setMessages([]);
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

  const currentModelOpt = modelOptions.find((m) => m.key === selectedModelKey);
  const currentModelDisplayName = currentModelOpt ? currentModelOpt.modelId : (selectedModelKey.split(':')[1] || selectedModelKey);

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
          {onEnhanceBoard && (
            <button
              type="button"
              className="ai-chat-enhance-header-btn"
              onClick={onEnhanceBoard}
              title="✨ 1-Click Enhance active whiteboard slide (Fonts, Theme Colors, Icons)"
            >
              ✨ Enhance
            </button>
          )}
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
            <span className="history-drawer-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Conversation History
            </span>
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
        {messages.length === 0 && !isLoading && (
          <div className="ai-chat-empty-state">
            <div className="ai-chat-empty-title">SmartNoteAI Teaching Assistant</div>
            <div className="ai-chat-empty-sub">
              Ask any concept, derivation, vector diagram, chart, or visual topic — drag cards or web images straight onto your whiteboard.
            </div>
          </div>
        )}
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
                  onInsertImageUrlToBoard={onInsertImageUrlToBoard}
                  onOpenInBrowser={onOpenInBrowser}
                  onOpenVectorStudio={onOpenVectorStudio}
                />
              ) : (
                /* Simple Markdown/Text (User or Welcome) */
                <div className="ai-bubble-content">
                  <RenderedAIContent content={msg.content} />
                </div>
              )}

              {/* Web Images fetched for visual topics / image requests */}
              {!msg.isError &&
                msg.role === 'assistant' &&
                ((msg.webImages && msg.webImages.length > 0) || msg.webImageSearchUrl) && (
                  <div className="chat-web-images-section">
                    <div className="chat-web-images-header">
                      <span>🖼️ Web Images (Drag to Board or Open in Browser)</span>
                      {msg.webImageSearchUrl && onOpenInBrowser && (
                        <button
                          type="button"
                          className="chat-grounding-source-btn"
                          onClick={() => onOpenInBrowser(msg.webImageSearchUrl!)}
                          title="Open image search results in built-in SmartNoteAI browser"
                        >
                          🌐 Browse All
                        </button>
                      )}
                    </div>
                    {msg.webImages && msg.webImages.length > 0 && (
                      <div className="chat-web-images-grid">
                        {msg.webImages.map((img, idx) => (
                          <WebImageCard
                            key={`${msg.id}-img-${idx}`}
                            imageUrl={img.imageUrl}
                            thumbUrl={img.thumbUrl}
                            pageUrl={img.pageUrl}
                            title={img.title}
                            onInsertImageUrlToBoard={onInsertImageUrlToBoard}
                            onOpenInBrowser={onOpenInBrowser}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

              {/* Web Grounding Sources (Gemini Google Search) */}
              {!msg.isError && msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="chat-grounding-sources">
                  {msg.groundingSources.map((src, idx) => (
                    <button
                      key={`${msg.id}-src-${idx}`}
                      type="button"
                      className="chat-grounding-source-btn"
                      onClick={() => onOpenInBrowser?.(src.url)}
                      title={src.url}
                    >
                      🔗 {src.title}
                    </button>
                  ))}
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

      {/* ─── Bottom Integrated Input Card (Image 3 Style) ─── */}
      <div className="ai-chat-bottom-card-container">
        <div
          className="ai-chat-input-card animated-input-glow"
          onClick={() => textareaRef.current?.focus()}
        >
          {/* Top Textarea */}
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

          {/* Bottom Card Toolbar (Left: New, Model, History; Right: Send) */}
          <div className="ai-chat-card-toolbar" onClick={(e) => e.stopPropagation()}>
            <div className="card-toolbar-left">
              {/* + New Chat */}
              <button
                type="button"
                className="card-toolbar-btn card-new-chat-btn"
                onClick={handleStartNewChat}
                title="Start a new lesson chat (+ New Chat)"
                aria-label="New Chat"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="btn-label">New</span>
              </button>

              {/* Model Selector Pill */}
              <div className="card-model-pill" title="Click to change active AI model">
                <span className="card-model-icon">✨</span>
                <span className="card-model-name" title={currentModelOpt?.displayName || selectedModelKey}>
                  {currentModelDisplayName}
                </span>
                <span className="card-model-chevron">▾</span>
                <select
                  id="ai-model-select-bottom"
                  className="card-model-native-select"
                  value={selectedModelKey}
                  onChange={handleModelChange}
                  title="Select AI model"
                  aria-label="Select AI model"
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
              </div>

              {/* Modern History Button with Clock Icon */}
              <button
                type="button"
                className={`card-toolbar-btn card-history-btn ${showHistoryDrawer ? 'active' : ''}`}
                onClick={() => {
                  setShowSettingsDrawer(false);
                  setShowHistoryDrawer((prev) => !prev);
                }}
                title="Conversation History (Clock Icon)"
                aria-label="Conversation History"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="btn-label">History</span>
                {savedSessions.length > 0 && (
                  <span className="card-history-badge">{savedSessions.length}</span>
                )}
              </button>

              {/* Web Search & Image Lookup Toggle */}
              <button
                type="button"
                className={`card-toolbar-btn web-search-toggle ${webSearchEnabled ? 'active' : ''}`}
                onClick={toggleWebSearch}
                title={
                  webSearchEnabled
                    ? 'Web Search & Educational Images enabled (click to disable)'
                    : 'Enable Web Search & Educational Images'
                }
                aria-pressed={webSearchEnabled}
              >
                <span>🌐</span>
                <span className="btn-label">Web</span>
              </button>
            </div>

            <div className="card-toolbar-right">
              {isLoading ? (
                <button
                  type="button"
                  className="ai-chat-stop-inline-btn"
                  onClick={handleStop}
                  title="Stop generation"
                  aria-label="Stop generation"
                >
                  ⏹ Stop
                </button>
              ) : (
                <button
                  type="button"
                  className="ai-chat-send-btn card-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim()}
                  title="Send (Enter)"
                  aria-label="Send"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-footer below card: Provider Badge & permissions */}
        <div className="ai-chat-card-subfooter">
          <div className="card-subfooter-left">
            <span className="card-provider-tag">
              {selectedModelKey.startsWith('ollama:') ? (
                <>💻 Local</>
              ) : selectedModelKey.startsWith('gemini:') ? (
                <>☁️ Gemini</>
              ) : selectedModelKey.startsWith('kimi:') ? (
                <>🌙 Kimi</>
              ) : selectedModelKey.startsWith('deepseek:') ? (
                <>⚡ DeepSeek</>
              ) : selectedModelKey.startsWith('groq:') ? (
                <>🚀 Groq</>
              ) : selectedModelKey.startsWith('openai:') ? (
                <>⚡ OpenAI</>
              ) : (
                <>📚 Offline</>
              )}
            </span>
            <span className="card-security-tag">🛡️ Classroom Safe</span>
          </div>
          <div className="card-subfooter-right">
            <span className="card-keyhint">↵ Send • Shift+↵ Line</span>
          </div>
        </div>
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
        const isChart = firstLine.includes('chart');

        if (
          isMermaid ||
          isGraph ||
          isCircuit ||
          isTiming ||
          isGeom ||
          isTikz ||
          isChart ||
          isSupportedDiagramCode(inner)
        ) {
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

      // Check if it's an explicit markdown image link ![alt](https://...) on its own line
      const imgMdMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/i);
      if (imgMdMatch) {
        segments.push({
          id,
          type: 'image',
          rawText: imgMdMatch[2],
          displayTitle: imgMdMatch[1]?.trim() || 'Web Image',
          isFormula: false,
          imageUrl: imgMdMatch[2],
        });
        continue;
      }

      // Check if it's a bare direct image URL
      if (/^https?:\/\/\S+\.(?:png|jpe?g|webp|gif|svg)(?:\?\S*)?$/i.test(trimmed)) {
        const fileNameTitle = decodeURIComponent(trimmed.split('/').pop()?.split('?')[0] || 'Web Image');
        segments.push({
          id,
          type: 'image',
          rawText: trimmed,
          displayTitle: fileNameTitle.slice(0, 36),
          isFormula: false,
          imageUrl: trimmed,
        });
        continue;
      }

      // Check if it's an un-fenced vector diagram code (e.g. JSON graph/geometry/circuit/chart spec, Mermaid, or TikZ)
      const isRawDiagram = isSupportedDiagramCode(trimmed);

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
function WebImageThumbnail({
  imageUrl,
  thumbUrl,
  title,
}: {
  imageUrl: string;
  thumbUrl?: string;
  title: string;
}): React.ReactElement {
  const [src, setSrc] = useState<string>(thumbUrl || imageUrl);
  const [fallbackTried, setFallbackTried] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleImgError = async () => {
    if (fallbackTried) {
      setFailed(true);
      return;
    }
    setFallbackTried(true);
    try {
      const invoke = (window as any)?.electronAPI?.invoke;
      if (typeof invoke === 'function') {
        const res = await invoke('net:fetchImageAsDataUrl', imageUrl);
        if (res?.success && res.dataUrl) {
          setSrc(res.dataUrl);
          return;
        }
      }
    } catch {}
    setFailed(true);
  };

  if (failed) {
    return (
      <div className="chat-web-image-thumb-wrap">
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>🌐 Open link or drop to load</span>
      </div>
    );
  }

  return (
    <div className="chat-web-image-thumb-wrap">
      <img
        src={src}
        alt={title}
        className="chat-web-image-thumb"
        referrerPolicy="no-referrer"
        draggable={false}
        onError={handleImgError}
      />
    </div>
  );
}

function WebImageCard({
  imageUrl,
  thumbUrl,
  pageUrl,
  title,
  onInsertImageUrlToBoard,
  onOpenInBrowser,
}: {
  imageUrl: string;
  thumbUrl?: string;
  pageUrl?: string;
  title: string;
  onInsertImageUrlToBoard?: (url: string, title?: string, targetPos?: { x: number; y: number }) => void;
  onOpenInBrowser?: (url: string) => void;
}): React.ReactElement {
  const targetOpenUrl = pageUrl || imageUrl;
  return (
    <div
      className="chat-web-image-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', imageUrl);
        e.dataTransfer.setData('text/uri-list', imageUrl);
        e.dataTransfer.setData(
          'application/x-smartboard-image',
          JSON.stringify({ imageUrl, title, pageUrl: targetOpenUrl })
        );
      }}
      title="Drag onto SmartBoard canvas to download and place image"
    >
      <WebImageThumbnail imageUrl={imageUrl} thumbUrl={thumbUrl} title={title} />
      <div className="chat-web-image-meta">
        <div className="chat-web-image-title" title={title}>
          {title}
        </div>
        <button
          type="button"
          className="chat-web-image-url"
          onClick={() => onOpenInBrowser?.(targetOpenUrl)}
          title={`Open in built-in browser: ${targetOpenUrl}`}
        >
          {imageUrl}
        </button>
        <div className="chat-web-image-actions">
          <button
            type="button"
            className="segment-action-btn seg-insert-btn"
            onClick={() => onInsertImageUrlToBoard?.(imageUrl, title)}
            title="Download image from URL and place onto SmartBoard"
          >
            ➕ Board
          </button>
          <button
            type="button"
            className="segment-action-btn seg-edit-btn"
            onClick={() => onOpenInBrowser?.(targetOpenUrl)}
            title="Open image link in integrated SmartNoteAI browser"
          >
            🌐 Browser
          </button>
        </div>
      </div>
    </div>
  );
}

function SegmentedMessageContent({
  content,
  copiedId,
  insertedId,
  onCopy,
  onInsert,
  onInsertImageUrlToBoard,
  onOpenInBrowser,
  onOpenVectorStudio,
}: {
  content: string;
  copiedId: string | null;
  insertedId: string | null;
  onCopy: (text: string) => void;
  onInsert: (text: string, title?: string, isFormula?: boolean) => void;
  onInsertImageUrlToBoard?: (url: string, title?: string, targetPos?: { x: number; y: number }) => void;
  onOpenInBrowser?: (url: string) => void;
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
              {seg.type === 'image' && <span className="seg-tag-diagram">🖼️ WEB IMAGE</span>}
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
                  if (seg.type === 'image' && seg.imageUrl) {
                    e.dataTransfer.setData('text/plain', seg.imageUrl);
                    e.dataTransfer.setData('text/uri-list', seg.imageUrl);
                    e.dataTransfer.setData(
                      'application/x-smartboard-image',
                      JSON.stringify({
                        imageUrl: seg.imageUrl,
                        title: seg.displayTitle,
                        pageUrl: seg.pageUrl || seg.imageUrl,
                      })
                    );
                    return;
                  }
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
                  seg.type === 'image'
                    ? 'Drag this image directly onto the SmartBoard'
                    : seg.type === 'diagram'
                    ? 'Drag this vector diagram directly onto the SmartBoard'
                    : seg.isFormula
                    ? 'Drag just this math formula onto the board'
                    : 'Drag this segment to board'
                }
              >
                {seg.type === 'image'
                  ? '⠿ Drag Image'
                  : seg.type === 'diagram'
                  ? '⠿ Drag Diagram'
                  : '⠿ Drag'}
              </button>

              <button
                className="segment-action-btn seg-insert-btn"
                onClick={() => {
                  if (seg.type === 'image' && seg.imageUrl && onInsertImageUrlToBoard) {
                    onInsertImageUrlToBoard(seg.imageUrl, seg.displayTitle);
                    return;
                  }
                  onInsert(seg.rawText, seg.displayTitle, seg.isFormula);
                }}
                title={
                  seg.type === 'image'
                    ? 'Download image and place onto SmartBoard'
                    : '1-Click insert this segment to board'
                }
              >
                {insertedId === seg.id ? '✓' : '➕ Insert'}
              </button>

              {seg.type === 'image' && seg.imageUrl && onOpenInBrowser && (
                <button
                  className="segment-action-btn seg-edit-btn"
                  onClick={() => onOpenInBrowser(seg.pageUrl || seg.imageUrl!)}
                  title="Open image link in integrated SmartNoteAI browser"
                >
                  🌐 Browser
                </button>
              )}

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
            {seg.type === 'image' && seg.imageUrl ? (
              <div>
                <WebImageThumbnail
                  imageUrl={seg.imageUrl}
                  thumbUrl={seg.thumbUrl}
                  title={seg.displayTitle}
                />
                <button
                  type="button"
                  className="chat-web-image-url"
                  onClick={() => onOpenInBrowser?.(seg.pageUrl || seg.imageUrl!)}
                  style={{ marginTop: 6 }}
                >
                  {seg.imageUrl}
                </button>
              </div>
            ) : seg.type === 'diagram' ? (
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

  // If greeting or chitchat, respond concisely without boilerplate banner
  if (isGreetingOrChitchat(prompt)) {
    return `Hi! Tell me any topic, derivation, flowchart, chart, or visual concept you'd like to teach today.`;
  }

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

  if (p.includes('code') || p.includes('python') || p.includes('javascript') || p.includes('programming') || p.includes('algorithm') || p.includes('function') || p.includes('loop')) {
    return (
      `### Algorithm & Code: ${effectiveTopic}\n\n` +
      `**Concept:** Key programming construct utilized to structure logic and automate iterative tasks.\n\n` +
      `---\n\n` +
      `\`\`\`python\n` +
      `# Implementation of ${effectiveTopic}\n` +
      `def execute_logic(items):\n` +
      `    results = []\n` +
      `    for item in items:\n` +
      `        if item > 0:\n` +
      `            results.append(item * 2)\n` +
      `    return results\n` +
      `\`\`\`\n\n` +
      `---\n\n` +
      `\`\`\`mermaid\n` +
      `flowchart TD\n` +
      `    Start(["Start"]) --> Input[/"Input Data"/]\n` +
      `    Input --> Cond{"Condition Met?"}\n` +
      `    Cond -- Yes --> Process["Process Item"]\n` +
      `    Process --> Output[/"Output Result"/]\n` +
      `    Cond -- No --> End(["End"])\n` +
      `    Output --> End\n` +
      `\`\`\`\n\n` +
      `---\n\n` +
      `#### Student Coding Challenge:\n` +
      `* Modify the algorithm above to handle edge cases where the input list contains negative or null values.`
    );
  }

  if (p.includes('biology') || p.includes('photosynthesis') || p.includes('cell') || p.includes('dna') || p.includes('plant') || p.includes('reaction') || p.includes('chemistry')) {
    return (
      `### Scientific Process: ${effectiveTopic}\n\n` +
      `**Definition:** **${effectiveTopic}** is a foundational scientific mechanism governing energy transfer and cellular/chemical transformations.\n\n` +
      `---\n\n` +
      `#### Step-by-Step Mechanism:\n` +
      `1. **Activation Phase:** Energy or catalyst initiates molecular transformation.\n` +
      `2. **Intermediate Complex:** Bonds are reorganized with conservation of mass and energy.\n` +
      `3. **Outcome / Synthesis:** End products are released for biological cellular utilization.\n\n` +
      `---\n\n` +
      `\`\`\`mermaid\n` +
      `flowchart LR\n` +
      `    Reactants["Reactants / Inputs"] --> Energy["Activation Energy"]\n` +
      `    Energy --> Cycle["Core Biochemical Cycle"]\n` +
      `    Cycle --> Products["Essential Products"]\n` +
      `\`\`\`\n\n` +
      `---\n\n` +
      `#### Classroom Verification Question:\n` +
      `* What external environmental factor acts as the primary rate-limiting step in **${effectiveTopic}**?`
    );
  }

  if (p.includes('history') || p.includes('war') || p.includes('revolution') || p.includes('empire') || p.includes('ancient') || p.includes('geography') || p.includes('continent') || p.includes('climate')) {
    return (
      `### Historical Overview: ${effectiveTopic}\n\n` +
      `**Context:** A major historical era or geographic phenomenon that shaped human civilization, institutions, and borders.\n\n` +
      `---\n\n` +
      `#### Key Chronological Phases:\n` +
      `1. **Underlying Causes:** Political, economic, and cultural tensions preceding the event.\n` +
      `2. **Turning Points:** Decisive diplomatic, military, or environmental shifts.\n` +
      `3. **Lasting Legacy:** Structural changes to modern governance, trade routes, and societal norms.\n\n` +
      `---\n\n` +
      `| Phase | Key Catalyst | Major Impact |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **Origins** | Resource scarcity / Governance breakdown | Rapid mobilization |\n` +
      `| **Climax** | Strategic confrontation | Realignment of powers |\n` +
      `| **Resolution** | Formal treaty / Reconstruction | Modern institutional frameworks |\n\n` +
      `---\n\n` +
      `#### Socratic Discussion Prompt:\n` +
      `* How do primary source accounts from this era differ from modern retrospective analyses?`
    );
  }

  if (p.includes('math') || p.includes('solve') || p.includes('quadratic') || p.includes('formula') || p.includes('geometry') || p.includes('calculus')) {
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
