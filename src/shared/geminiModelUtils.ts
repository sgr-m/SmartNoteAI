/**
 * Shared Gemini model filtering, normalization, ranking, and fallback utilities.
 * Used across both the Electron main process (IPC handlers) and renderer (UI + GeminiAdapter).
 */

export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Curated list of standard Gemini models shown when live model discovery has not yet run
 * or when listing preset choices in adapters.
 */
export const GEMINI_CURATED_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast, balanced free-tier & general reasoning model (Recommended)',
    contextWindow: 1_048_576,
    isFreeTierFriendly: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    description: 'Ultra-fast, generous free-tier quota for formatting & quick tasks',
    contextWindow: 1_048_576,
    isFreeTierFriendly: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Reliable high-quota workhorse model for chat and JSON generation',
    contextWindow: 1_048_576,
    isFreeTierFriendly: true,
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    description: 'Lightweight model with high rate-limit headroom',
    contextWindow: 1_048_576,
    isFreeTierFriendly: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest Alias)',
    description: 'Google-managed latest stable Flash release',
    contextWindow: 1_048_576,
    isFreeTierFriendly: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Advanced reasoning model (may require paid billing / lower free-tier quota)',
    contextWindow: 1_048_576,
    isFreeTierFriendly: false,
  },
  {
    id: 'gemini-pro-latest',
    name: 'Gemini Pro (Latest Alias)',
    description: 'Google-managed latest Pro release (paid tier recommended)',
    contextWindow: 1_048_576,
    isFreeTierFriendly: false,
  },
] as const;

export const GEMINI_QUICK_PICK_MODELS: readonly string[] = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
];

/**
 * Ordered fallback sequence used when the user's primary model returns 404, 429 (e.g. limit: 0
 * on a preview/pro/argon model), 403, or 503.
 */
export const GEMINI_RECOMMENDED_FALLBACK_MODELS: readonly string[] = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-1.5-flash',
];

/**
 * Specialized/non-text or zero-free-tier agent tokens that must be excluded from standard
 * chat & structured-JSON model lists and generation requests.
 */
const EXCLUDED_GEMINI_MODEL_SUBSTRINGS = [
  '-image',
  '-transcribe',
  'embedding',
  'banana',
  'aqa',
  'computer-use',
  'deep-research',
  'robotics',
  'native-audio',
  '-live',
  '-dialog',
  'veo',
  'imagen',
  'lyria',
  'customtools',
] as const;

/**
 * Legacy/unlisted phantom model IDs that older versions of SmartNoteAI wrote to localStorage
 * and forced on users even when their key supported standard Flash models.
 */
export const GEMINI_LEGACY_PHANTOM_MODEL_IDS = new Set([
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-4-argon',
]);

/**
 * Extracts the bare Gemini model ID from a raw model string, display label such as
 * `"Gemini 2.5 Flash (gemini-2.5-flash)"`, or `"models/gemini-2.5-flash"` resource name.
 */
export function normalizeGeminiModelId(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let trimmed = raw.trim();
  if (!trimmed) return '';

  const parenMatch = trimmed.match(/\(([^)]+)\)$/);
  if (parenMatch && parenMatch[1]) {
    const inner = parenMatch[1].trim();
    if (inner && !/\s/.test(inner) && inner.toLowerCase().includes('gemini')) {
      trimmed = inner;
    }
  }

  return trimmed.replace(/^models\//i, '').trim();
}

/**
 * Returns true if the Gemini model ID represents a standard text/multimodal chat model
 * capable of generateContent (excludes TTS, image-only, audio-live, embeddings, robotics,
 * deep-research, computer-use, etc.).
 */
export function isSupportedGeminiChatModel(modelId: string, supportedMethods?: string[]): boolean {
  const normalized = normalizeGeminiModelId(modelId).toLowerCase();
  if (!normalized || !normalized.includes('gemini')) {
    return false;
  }
  if (normalized.endsWith('-tts') || normalized.includes('-tts-')) {
    return false;
  }
  for (const token of EXCLUDED_GEMINI_MODEL_SUBSTRINGS) {
    if (normalized.includes(token)) {
      return false;
    }
  }
  if (Array.isArray(supportedMethods) && supportedMethods.length > 0) {
    return supportedMethods.includes('generateContent');
  }
  return true;
}

/**
 * Returns true when a model ID is a low-cost / high-quota Flash variant suitable as an
 * automatic default or fallback for free-tier and general-tier Gemini API keys.
 */
export function isFreeTierPreferredGeminiModel(modelId: string): boolean {
  const lower = normalizeGeminiModelId(modelId).toLowerCase();
  if (!isSupportedGeminiChatModel(lower)) return false;
  if (lower.includes('-pro') || lower.includes('argon')) return false;
  return lower.includes('flash');
}

/**
 * Priority rank for sorting Gemini models (lower number = higher preference).
 * Puts stable Flash & Flash-Lite models at the top and preview/pro/specialized models below.
 */
export function getGeminiModelPriority(modelId: string): number {
  const lower = normalizeGeminiModelId(modelId).toLowerCase();
  const exactOrder: Record<string, number> = {
    'gemini-2.5-flash': 0,
    'gemini-2.5-flash-lite': 1,
    'gemini-2.0-flash': 2,
    'gemini-2.0-flash-lite': 3,
    'gemini-flash-latest': 4,
    'gemini-flash-lite-latest': 5,
    'gemini-1.5-flash': 6,
    'gemini-2.5-pro': 20,
    'gemini-pro-latest': 21,
    'gemini-1.5-pro': 22,
  };
  if (lower in exactOrder) {
    return exactOrder[lower];
  }

  const isPreviewOrExp =
    lower.includes('preview') ||
    lower.includes('-exp') ||
    lower.includes('experimental') ||
    /-\d{3,4}$/.test(lower);

  if (lower.includes('flash-lite')) return isPreviewOrExp ? 14 : 8;
  if (lower.includes('flash')) return isPreviewOrExp ? 15 : 9;
  if (lower.includes('argon')) return 32;
  if (lower.includes('pro')) return isPreviewOrExp ? 28 : 24;
  return isPreviewOrExp ? 40 : 30;
}

/**
 * Deterministically sorts Gemini models so standard free-tier-friendly Flash models appear first.
 */
export function sortGeminiModels<T extends { id: string }>(models: readonly T[]): T[] {
  return [...models].sort((a, b) => {
    const diff = getGeminiModelPriority(a.id) - getGeminiModelPriority(b.id);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Resolves the requested Gemini model without silently hijacking valid models like
 * `gemini-1.5-flash`, `gemini-2.0-flash`, or `gemini-2.5-flash`. Only falls back to a
 * healthy default when the requested ID is missing or an unsupported non-chat variant.
 */
export function resolveGeminiChatModel(raw?: string | null, discoveredIds?: readonly string[]): string {
  const clean = normalizeGeminiModelId(raw);
  if (clean && isSupportedGeminiChatModel(clean)) {
    return clean;
  }

  if (Array.isArray(discoveredIds) && discoveredIds.length > 0) {
    const valid = discoveredIds
      .map((id) => normalizeGeminiModelId(id))
      .filter((id) => isSupportedGeminiChatModel(id));
    if (valid.length > 0) {
      const sorted = sortGeminiModels(valid.map((id) => ({ id })));
      return sorted[0].id;
    }
  }

  return GEMINI_DEFAULT_MODEL;
}

/**
 * Picks the best default model for UI auto-selection (prefers stable Flash / Flash-Lite, never
 * computer-use, argon, pro, or experimental models when a Flash option exists).
 */
export function pickBestGeminiDefaultModel(discoveredIds: readonly string[]): string {
  const normalized = discoveredIds
    .map((id) => normalizeGeminiModelId(id))
    .filter((id) => isSupportedGeminiChatModel(id));

  if (normalized.length === 0) {
    return GEMINI_DEFAULT_MODEL;
  }

  const sorted = sortGeminiModels(normalized.map((id) => ({ id })));
  const preferred = sorted.find((m) => isFreeTierPreferredGeminiModel(m.id));
  return preferred ? preferred.id : sorted[0].id;
}

/**
 * Builds an ordered, deduplicated list of fallback models to try if the primary model fails.
 * Prioritizes live-discovered Flash models (excluding Pro/Argon), followed by standard curated
 * Flash fallbacks, capped at `maxCandidates`.
 */
export function buildGeminiFallbackCandidates(
  primaryModel: string,
  discoveredIds?: readonly string[],
  maxCandidates = 6
): string[] {
  const cleanPrimary = normalizeGeminiModelId(primaryModel).toLowerCase();
  const seen = new Set<string>([cleanPrimary]);
  const result: string[] = [];

  const pushIfNew = (candidate: string) => {
    const norm = normalizeGeminiModelId(candidate);
    const lower = norm.toLowerCase();
    if (!norm || seen.has(lower) || !isSupportedGeminiChatModel(norm)) return;
    seen.add(lower);
    result.push(norm);
  };

  if (Array.isArray(discoveredIds) && discoveredIds.length > 0) {
    const flashDiscovered = sortGeminiModels(
      discoveredIds
        .map((id) => normalizeGeminiModelId(id))
        .filter((id) => isFreeTierPreferredGeminiModel(id))
        .map((id) => ({ id }))
    );
    for (const item of flashDiscovered) {
      pushIfNew(item.id);
    }
  }

  for (const fallback of GEMINI_RECOMMENDED_FALLBACK_MODELS) {
    pushIfNew(fallback);
  }

  return result.slice(0, maxCandidates);
}

/**
 * Returns true if the Google Gemini HTTP error clearly indicates an invalid API key or auth
 * failure where retrying alternate models will not succeed.
 */
export function isGeminiAuthError(status: number, errorText: string): boolean {
  if (status === 401) return true;
  if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(errorText)) {
    return true;
  }
  return false;
}

/**
 * Formats a concise, accurate error message summarizing both the primary model failure and any
 * fallback models that were also attempted.
 */
export function formatGeminiFailureMessage(
  primaryModel: string,
  primaryError: string,
  attemptedFallbacks: readonly string[] = []
): string {
  const cleanError = (primaryError || 'All fallback models unavailable').trim();
  if (attemptedFallbacks.length === 0) {
    return `Google Gemini failed (${primaryModel}): ${cleanError}`;
  }
  const suffix = `Tried ${primaryModel} and fallbacks (${attemptedFallbacks.join(', ')}).`;
  return `Google Gemini failed: ${cleanError} [${suffix}]`;
}

export interface GeminiAttemptOutcome<TMeta = Record<string, unknown>> {
  ok: boolean;
  text?: string;
  meta?: TMeta;
  status?: number;
  error?: string;
}

export type GeminiGenerateWithFallbackResult<TMeta = Record<string, unknown>> =
  | {
      ok: true;
      model: string;
      attempt: GeminiAttemptOutcome<TMeta>;
      usedFallback: boolean;
      groundingDisabledOnRetry: boolean;
    }
  | {
      ok: false;
      model: string;
      error: string;
      primaryError: string;
      attemptedFallbacks: string[];
    };

/**
 * Executes a Gemini generation call with automatic recovery from:
 * 1) Unsupported/deprecated/zero-free-tier primary model IDs,
 * 2) Search-grounding rejections or quota limits (retries the same model without `google_search`
 *    on any non-auth failure, including 429 and 403, not only 400),
 * 3) Per-model rate limits (`429 limit: 0`), `404`, `503`, or timeouts across live-discovered
 *    and curated Flash fallback models.
 */
export async function runGeminiGenerateWithFallback<TMeta = Record<string, unknown>>(params: {
  requestedModel?: string | null;
  enableWebSearch: boolean;
  signal?: AbortSignal;
  fetchModels?: () => Promise<string[]>;
  invokeModel: (targetModel: string, useSearchTool: boolean) => Promise<GeminiAttemptOutcome<TMeta>>;
}): Promise<GeminiGenerateWithFallbackResult<TMeta>> {
  const { requestedModel, enableWebSearch, signal, fetchModels, invokeModel } = params;
  const cleanModel = resolveGeminiChatModel(requestedModel);
  const hasContent = (res: GeminiAttemptOutcome<TMeta>) =>
    res.ok && Boolean(res.text && res.text.trim().length > 0);

  const primaryAttempt = await invokeModel(cleanModel, enableWebSearch);
  if (hasContent(primaryAttempt)) {
    return {
      ok: true,
      model: cleanModel,
      attempt: primaryAttempt,
      usedFallback: false,
      groundingDisabledOnRetry: false,
    };
  }

  let effectivePrimaryError =
    primaryAttempt.error || (primaryAttempt.ok ? 'Empty response returned by Gemini' : 'Gemini request failed');

  if (isGeminiAuthError(primaryAttempt.status || 0, effectivePrimaryError)) {
    return {
      ok: false,
      model: cleanModel,
      error: formatGeminiFailureMessage(cleanModel, effectivePrimaryError, []),
      primaryError: effectivePrimaryError,
      attemptedFallbacks: [],
    };
  }

  // If Google Search grounding was attached and the request failed (including 429 Free Tier
  // grounding limits or 403/400), retry the SAME model immediately without tools before falling back.
  if (enableWebSearch && !signal?.aborted) {
    const ungrounded = await invokeModel(cleanModel, false);
    if (hasContent(ungrounded)) {
      return {
        ok: true,
        model: cleanModel,
        attempt: ungrounded,
        usedFallback: false,
        groundingDisabledOnRetry: true,
      };
    }
    const ungroundedErr = ungrounded.error || effectivePrimaryError;
    if (isGeminiAuthError(ungrounded.status || 0, ungroundedErr)) {
      return {
        ok: false,
        model: cleanModel,
        error: formatGeminiFailureMessage(cleanModel, ungroundedErr, []),
        primaryError: ungroundedErr,
        attemptedFallbacks: [],
      };
    }
    if (ungrounded.error) {
      effectivePrimaryError = ungrounded.error;
    }
  }

  if (signal?.aborted) {
    return {
      ok: false,
      model: cleanModel,
      error: formatGeminiFailureMessage(cleanModel, effectivePrimaryError, []),
      primaryError: effectivePrimaryError,
      attemptedFallbacks: [],
    };
  }

  let discoveredIds: string[] = [];
  if (fetchModels) {
    try {
      discoveredIds = await fetchModels();
    } catch {
      discoveredIds = [];
    }
  }

  const fallbacks = buildGeminiFallbackCandidates(cleanModel, discoveredIds);
  const attemptedFallbacks: string[] = [];

  for (const fbModel of fallbacks) {
    if (signal?.aborted) break;
    attemptedFallbacks.push(fbModel);
    const fbAttempt = await invokeModel(fbModel, false);
    if (hasContent(fbAttempt)) {
      return {
        ok: true,
        model: fbModel,
        attempt: fbAttempt,
        usedFallback: true,
        groundingDisabledOnRetry: enableWebSearch,
      };
    }
    const fbErr = fbAttempt.error || '';
    if (isGeminiAuthError(fbAttempt.status || 0, fbErr)) {
      return {
        ok: false,
        model: cleanModel,
        error: formatGeminiFailureMessage(cleanModel, fbErr || effectivePrimaryError, attemptedFallbacks),
        primaryError: fbErr || effectivePrimaryError,
        attemptedFallbacks,
      };
    }
  }

  return {
    ok: false,
    model: cleanModel,
    error: formatGeminiFailureMessage(cleanModel, effectivePrimaryError, attemptedFallbacks),
    primaryError: effectivePrimaryError,
    attemptedFallbacks,
  };
}
