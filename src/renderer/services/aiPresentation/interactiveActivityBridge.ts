/**
 * interactiveActivityBridge.ts — Interactive Educational Activities Subsystem
 * Milestone 5: Stage 12 (TASK-112)
 *
 * Implements a modular, classroom-focused interactive activity engine that complements
 * the AI presentation generator. Supports 10 pedagogical activity types:
 * 1. Multiple-choice questions (mcq)
 * 2. True/false questions (true-false)
 * 3. Fill-in-the-blanks (fill-in-blanks)
 * 4. Match-the-following (matching)
 * 5. Arrange-in-correct-order activities (ordering)
 * 6. Question-and-answer reveal cards (qa-reveal)
 * 7. Flashcards (flashcard)
 * 8. Step-by-step solution reveal (step-reveal)
 * 9. Formula reveal (formula-reveal)
 * 10. Quick classroom polls (poll)
 *
 * Features:
 * - Strongly-typed activity data model separating answer keys from visual presentation.
 * - Strict structural validation and sanitization against ambiguous or malformed AI output.
 * - Interactive state transitions (select, submit, teacher-controlled reveal, hints, retries, scoring).
 * - High-fidelity compilation to native SmartBoard CanvasObjects (ShapeObject, TextObject).
 * - Full slide page creation with 1920x1080 resolution, headers, footers, and layers.
 * - Offline curriculum activity generator guaranteeing 100% classroom uptime without internet.
 * - LLM structured prompt generation and response parsing with OpenAI, Gemini, and Ollama.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ActivityEvaluationResult,
  ActivityInteractionState,
  ActivityOption,
  ActivityScoringConfig,
  AIProviderType,
  BoundingBox,
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
  EducationalActivity,
  EducationalActivityType,
  FormulaVariableItem,
  GenerateActivityOptions,
  MatchingPair,
  PresentationTheme,
  StepRevealItem,
} from '../../../shared/aiPresentationTypes';
import { CanvasObject, Layer, Page, ShapeObject, TextObject } from '../../../shared/types';
import { aiProviderManager, AIProviderManager } from './aiProviderManager';
import { DEFAULT_PRESENTATION_THEME, getThemeById } from './presentationThemes';
import { measureTextLines } from './slideLayoutEngine';

// ─── Default Layer Constants ──────────────────────────────────────────────────

const LAYER_OBJECTS = 'objects';
const LAYER_BACKGROUND = 'background';

// ─── Activity Catalog Metadata ────────────────────────────────────────────────

export interface ActivityCatalogEntry {
  type: EducationalActivityType;
  title: string;
  shortName: string;
  icon: string;
  badge: string;
  description: string;
  category: 'assessment' | 'reinforcement' | 'discussion' | 'engagement';
}

export const ACTIVITY_TYPES_CATALOG: Record<EducationalActivityType, ActivityCatalogEntry> = {
  mcq: {
    type: 'mcq',
    title: 'Multiple Choice Question',
    shortName: 'Multiple Choice',
    icon: '🎯',
    badge: 'MULTIPLE CHOICE',
    description: 'Single-choice question with 3-5 options, immediate feedback, and pedagogical explanation.',
    category: 'assessment',
  },
  'true-false': {
    type: 'true-false',
    title: 'True or False',
    shortName: 'True / False',
    icon: '⚖️',
    badge: 'TRUE / FALSE',
    description: 'Binary concept verification checking common misconceptions and key principles.',
    category: 'assessment',
  },
  'fill-in-blanks': {
    type: 'fill-in-blanks',
    title: 'Fill in the Blanks',
    shortName: 'Fill Blanks',
    icon: '✍️',
    badge: 'FILL IN THE BLANKS',
    description: 'Sentence or paragraph completion testing precise terminology and recall.',
    category: 'assessment',
  },
  matching: {
    type: 'matching',
    title: 'Match the Following',
    shortName: 'Matching Pairs',
    icon: '🧩',
    badge: 'MATCHING PAIRS',
    description: 'Two-column relational activity connecting terms to definitions, formulas, or examples.',
    category: 'reinforcement',
  },
  ordering: {
    type: 'ordering',
    title: 'Arrange in Correct Order',
    shortName: 'Sequence Order',
    icon: '🔢',
    badge: 'SEQUENCE ORDER',
    description: 'Chronological events, procedural steps, or algorithm sequences to arrange.',
    category: 'reinforcement',
  },
  'qa-reveal': {
    type: 'qa-reveal',
    title: 'Question & Answer Reveal',
    shortName: 'Q&A Discussion',
    icon: '💡',
    badge: 'CLASSROOM DISCUSSION',
    description: 'Thought-provoking discussion prompt with teacher-controlled answer & notes reveal.',
    category: 'discussion',
  },
  flashcard: {
    type: 'flashcard',
    title: 'Interactive Flashcard',
    shortName: 'Flashcard',
    icon: '🗂️',
    badge: 'FLASHCARD RECALL',
    description: 'Double-sided concept card with smooth flip interaction for memory reinforcement.',
    category: 'reinforcement',
  },
  'step-reveal': {
    type: 'step-reveal',
    title: 'Step-by-Step Solution Reveal',
    shortName: 'Step-by-Step',
    icon: '🪜',
    badge: 'WORKED SOLUTION',
    description: 'Progressive derivation or protocol revealed one numbered step at a time.',
    category: 'discussion',
  },
  'formula-reveal': {
    type: 'formula-reveal',
    title: 'Formula & Variable Breakdown',
    shortName: 'Formula Reveal',
    icon: '📐',
    badge: 'KEY FORMULA',
    description: 'Mathematical law or scientific formula with step-by-step variable definition reveals.',
    category: 'reinforcement',
  },
  poll: {
    type: 'poll',
    title: 'Quick Classroom Poll',
    shortName: 'Live Poll',
    icon: '📊',
    badge: 'LIVE CLASSROOM POLL',
    description: 'Instant student voting on debate questions with real-time percentage bar visualization.',
    category: 'engagement',
  },
};

// ─── Sanitization & String Helpers ───────────────────────────────────────────

export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    return String(input);
  }
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

function normalizeAnswerString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// ─── Activity Validation & Sanitization ───────────────────────────────────────

/**
 * Validates and normalizes raw activity data (e.g. from LLM JSON or external import).
 * Strict structural validation ensures answer keys are logically sound, non-ambiguous,
 * and immune to runtime crashes.
 */
export function validateActivity(raw: unknown): EducationalActivity {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid activity: input must be a non-null object.');
  }

  const r = raw as Record<string, any>;
  const rawType = String(r.type || r.activityType || 'mcq').toLowerCase().trim();
  const validTypes = Object.keys(ACTIVITY_TYPES_CATALOG) as EducationalActivityType[];
  const type: EducationalActivityType = validTypes.includes(rawType as EducationalActivityType)
    ? (rawType as EducationalActivityType)
    : 'mcq';

  const id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : uuidv4();
  const title = sanitizeText(r.title) || ACTIVITY_TYPES_CATALOG[type].title;
  const question = sanitizeText(r.question) || 'Classroom concept question';
  const instructions = r.instructions ? sanitizeText(r.instructions) : undefined;
  const explanation = sanitizeText(r.explanation) || 'Pedagogical explanation for this concept.';
  const difficulty = (['easy', 'intermediate', 'advanced'].includes(r.difficulty)
    ? r.difficulty
    : 'intermediate') as 'easy' | 'intermediate' | 'advanced';
  const topic = r.topic ? sanitizeText(r.topic) : undefined;
  const subject = r.subject ? sanitizeText(r.subject) : undefined;
  const hints = Array.isArray(r.hints)
    ? r.hints.map((h: any) => sanitizeText(h)).filter((h: string) => h.length > 0)
    : undefined;

  const scoring: ActivityScoringConfig = {
    pointsPerQuestion: typeof r.scoring?.pointsPerQuestion === 'number' ? r.scoring.pointsPerQuestion : 10,
    penaltyPerWrongAttempt: typeof r.scoring?.penaltyPerWrongAttempt === 'number' ? r.scoring.penaltyPerWrongAttempt : 2,
    maxAttempts: typeof r.scoring?.maxAttempts === 'number' ? r.scoring.maxAttempts : 3,
    showScoreImmediately: r.scoring?.showScoreImmediately !== false,
    passScorePercent: typeof r.scoring?.passScorePercent === 'number' ? r.scoring.passScorePercent : 70,
  };

  const activity: EducationalActivity = {
    id,
    type,
    title,
    question,
    instructions,
    explanation,
    difficulty,
    topic,
    subject,
    hints,
    scoring,
    source: r.source === 'ai' ? 'ai' : 'curriculum-template',
    correctAnswer: '',
  };

  // Type-specific structural validation & normalization
  switch (type) {
    case 'mcq': {
      let rawOptions: any[] = Array.isArray(r.options) ? r.options : [];
      if (rawOptions.length < 2) {
        rawOptions = [
          { id: 'opt-a', text: 'Option A (Correct)' },
          { id: 'opt-b', text: 'Option B' },
          { id: 'opt-c', text: 'Option C' },
          { id: 'opt-d', text: 'Option D' },
        ];
      }

      const options: ActivityOption[] = rawOptions.map((opt: any, idx: number) => {
        const optId = typeof opt.id === 'string' && opt.id.trim() ? opt.id.trim() : `opt-${String.fromCharCode(97 + idx)}`;
        const text = sanitizeText(opt.text || opt.label || `Option ${String.fromCharCode(65 + idx)}`);
        const badge = String.fromCharCode(65 + idx);
        return {
          id: optId,
          text,
          badge,
          feedback: opt.feedback ? sanitizeText(opt.feedback) : undefined,
        };
      });

      // Resolve correctAnswer to a valid option ID
      let correctId = options[0].id;
      if (typeof r.correctAnswer === 'string' && r.correctAnswer.trim()) {
        const found = options.find(
          (o) => o.id === r.correctAnswer.trim() || o.badge?.toLowerCase() === r.correctAnswer.trim().toLowerCase()
        );
        if (found) correctId = found.id;
      } else if (typeof r.correctAnswer === 'number' && r.correctAnswer >= 0 && r.correctAnswer < options.length) {
        correctId = options[r.correctAnswer].id;
      } else {
        const markedCorrect = rawOptions.findIndex((o: any) => o.isCorrect === true);
        if (markedCorrect >= 0) correctId = options[markedCorrect].id;
      }

      options.forEach((o) => {
        o.isCorrect = o.id === correctId;
      });

      activity.options = options;
      activity.correctAnswer = correctId;
      break;
    }

    case 'true-false': {
      let isTrue = true;
      if (typeof r.correctAnswer === 'boolean') {
        isTrue = r.correctAnswer;
      } else if (typeof r.correctAnswer === 'string') {
        const low = r.correctAnswer.toLowerCase().trim();
        isTrue = low === 'true' || low === 't' || low === '1' || low === 'yes';
      }

      const options: ActivityOption[] = [
        { id: 'true', text: 'True', badge: 'T', isCorrect: isTrue },
        { id: 'false', text: 'False', badge: 'F', isCorrect: !isTrue },
      ];

      activity.options = options;
      activity.correctAnswer = isTrue ? 'true' : 'false';
      break;
    }

    case 'fill-in-blanks': {
      // Ensure question has blank tokens [blank] or ___
      let q = activity.question;
      if (!q.includes('[blank]') && !q.includes('___') && !q.includes('[...]')) {
        q = `${q} [blank].`;
        activity.question = q;
      }

      let blanksAns: string[] = [];
      if (Array.isArray(r.blanksAnswer)) {
        blanksAns = r.blanksAnswer.map((a) => sanitizeText(a)).filter((a) => a.length > 0);
      } else if (typeof r.blanksAnswer === 'string' && r.blanksAnswer.trim()) {
        blanksAns = r.blanksAnswer.split(/[,;]/).map((a) => sanitizeText(a)).filter((a) => a.length > 0);
      } else if (typeof r.correctAnswer === 'string' && r.correctAnswer.trim()) {
        blanksAns = r.correctAnswer.split(/[,;]/).map((a) => sanitizeText(a)).filter((a) => a.length > 0);
      } else if (Array.isArray(r.correctAnswer)) {
        blanksAns = r.correctAnswer.map((a) => sanitizeText(a)).filter((a) => a.length > 0);
      }

      if (blanksAns.length === 0) {
        blanksAns = ['solution'];
      }

      activity.blanksAnswer = blanksAns;
      activity.correctAnswer = blanksAns;

      if (Array.isArray(r.options)) {
        activity.options = r.options.map((o: any, idx: number) => ({
          id: `bank-${idx}`,
          text: sanitizeText(o.text || o),
        }));
      }
      break;
    }

    case 'matching': {
      let rawPairs: any[] = Array.isArray(r.matchingPairs) ? r.matchingPairs : [];
      if (rawPairs.length < 2) {
        rawPairs = [
          { id: 'p1', left: 'Concept A', right: 'Definition of A' },
          { id: 'p2', left: 'Concept B', right: 'Definition of B' },
          { id: 'p3', left: 'Concept C', right: 'Definition of C' },
        ];
      }

      const matchingPairs: MatchingPair[] = rawPairs.map((pair: any, idx: number) => ({
        id: typeof pair.id === 'string' && pair.id.trim() ? pair.id.trim() : `pair-${idx + 1}`,
        left: sanitizeText(pair.left || pair.term || `Term ${idx + 1}`),
        right: sanitizeText(pair.right || pair.definition || `Definition ${idx + 1}`),
      }));

      activity.matchingPairs = matchingPairs;
      const answerMap: Record<string, string> = {};
      matchingPairs.forEach((p) => {
        answerMap[p.id] = p.right;
      });
      activity.correctAnswer = answerMap;
      break;
    }

    case 'ordering': {
      let items: string[] = Array.isArray(r.orderedItems)
        ? r.orderedItems.map((it: any) => sanitizeText(it)).filter((it: string) => it.length > 0)
        : [];
      if (items.length < 2) {
        items = ['Stage 1: Initialization', 'Stage 2: Core Processing', 'Stage 3: Verification & Output'];
      }
      activity.orderedItems = items;
      activity.correctAnswer = [...items];
      break;
    }

    case 'qa-reveal': {
      const answer = sanitizeText(r.answer || r.correctAnswer || r.explanation || 'Pedagogical answer revealed.');
      activity.correctAnswer = answer;
      activity.explanation = answer;
      break;
    }

    case 'flashcard': {
      const back = sanitizeText(r.flashcardBack || r.back || r.answer || r.explanation || 'Key concept explanation');
      activity.flashcardBack = back;
      activity.correctAnswer = back;
      break;
    }

    case 'step-reveal': {
      let rawSteps: any[] = Array.isArray(r.steps) ? r.steps : [];
      if (rawSteps.length < 2) {
        rawSteps = [
          { stepNumber: 1, title: 'Identify Knowns & Variables', content: 'Extract given values and governing laws.' },
          { stepNumber: 2, title: 'Formulate Equation', content: 'Set up mathematical or logical relationship.' },
          { stepNumber: 3, title: 'Compute Final Solution', content: 'Solve systematically with proper units.' },
        ];
      }

      const steps: StepRevealItem[] = rawSteps.map((s: any, idx: number) => ({
        stepNumber: typeof s.stepNumber === 'number' ? s.stepNumber : idx + 1,
        title: sanitizeText(s.title || `Step ${idx + 1}`),
        content: sanitizeText(s.content || s.text || ''),
        formula: s.formula ? sanitizeText(s.formula) : undefined,
        isRevealed: idx === 0,
      }));

      activity.steps = steps;
      activity.correctAnswer = steps.map((s) => `${s.title}: ${s.content}`).join(' -> ');
      break;
    }

    case 'formula-reveal': {
      const formula = sanitizeText(r.formula) || 'E = m \\cdot c^2';
      const formulaName = sanitizeText(r.formulaName || r.title || 'Mass-Energy Equivalence');
      let vars: FormulaVariableItem[] = [];
      if (Array.isArray(r.variableBreakdown)) {
        vars = r.variableBreakdown.map((v: any) => ({
          symbol: sanitizeText(v.symbol || ''),
          meaning: sanitizeText(v.meaning || ''),
          unit: v.unit ? sanitizeText(v.unit) : undefined,
        }));
      }
      if (vars.length === 0) {
        vars = [
          { symbol: 'E', meaning: 'Energy', unit: 'Joules (J)' },
          { symbol: 'm', meaning: 'Mass', unit: 'Kilograms (kg)' },
          { symbol: 'c', meaning: 'Speed of Light in Vacuum', unit: 'm/s (≈ 3 × 10⁸ m/s)' },
        ];
      }
      activity.formula = formula;
      activity.formulaName = formulaName;
      activity.variableBreakdown = vars;
      activity.correctAnswer = formula;
      break;
    }

    case 'poll': {
      let rawPollOpts: any[] = Array.isArray(r.pollOptions || r.options) ? (r.pollOptions || r.options) : [];
      if (rawPollOpts.length < 2) {
        rawPollOpts = [
          { id: 'poll-1', text: 'Strongly Agree', votes: 0 },
          { id: 'poll-2', text: 'Agree', votes: 0 },
          { id: 'poll-3', text: 'Neutral / Undecided', votes: 0 },
          { id: 'poll-4', text: 'Disagree', votes: 0 },
        ];
      }
      const pollOptions = rawPollOpts.map((opt: any, idx: number) => ({
        id: typeof opt.id === 'string' && opt.id.trim() ? opt.id.trim() : `poll-${idx + 1}`,
        text: sanitizeText(opt.text || opt.label || `Choice ${idx + 1}`),
        votes: typeof opt.votes === 'number' && opt.votes >= 0 ? opt.votes : 0,
      }));
      activity.pollOptions = pollOptions;
      activity.correctAnswer = 'poll-discussion';
      break;
    }
  }

  return activity;
}

// ─── Interaction Engine & State Transitions ───────────────────────────────────

/**
 * Creates a fresh, clean interaction state for a given activity.
 */
export function createInitialActivityState(activity: EducationalActivity): ActivityInteractionState {
  let initialOrder: string[] | undefined;
  if (activity.type === 'ordering' && activity.orderedItems) {
    // Deterministic pseudo-shuffle so items are not presented in solved order
    const copy = [...activity.orderedItems];
    if (copy.length > 1) {
      const first = copy.shift()!;
      copy.push(first);
    }
    initialOrder = copy;
  }

  return {
    activityId: activity.id,
    selectedOptionId: undefined,
    selectedOptions: [],
    matchingAnswers: {},
    currentOrder: initialOrder,
    blanksInput: activity.blanksAnswer ? new Array(activity.blanksAnswer.length).fill('') : [],
    isSubmitted: false,
    isCorrect: undefined,
    isRevealed: false,
    revealedStepIndex: 0,
    isFlashcardFlipped: false,
    hintsRevealedCount: 0,
    attemptsCount: 0,
    score: 0,
    earnedPoints: 0,
    feedbackMessage: undefined,
    pollVotedOptionId: undefined,
  };
}

/**
 * Selects an option (for MCQ, True/False, or Poll).
 */
export function selectOption(
  state: ActivityInteractionState,
  optionId: string
): ActivityInteractionState {
  if (state.isSubmitted && state.isCorrect) {
    return state; // Already solved correctly
  }

  return {
    ...state,
    selectedOptionId: optionId,
    selectedOptions: [optionId],
    feedbackMessage: undefined,
  };
}

/**
 * Connects a matching pair (left ID -> right value).
 */
export function setMatchingAnswer(
  state: ActivityInteractionState,
  leftId: string,
  rightValue: string
): ActivityInteractionState {
  return {
    ...state,
    matchingAnswers: {
      ...state.matchingAnswers,
      [leftId]: rightValue,
    },
    feedbackMessage: undefined,
  };
}

/**
 * Reorders items in an ordering activity (swaps or moves item).
 */
export function reorderItem(
  state: ActivityInteractionState,
  fromIndex: number,
  toIndex: number
): ActivityInteractionState {
  if (!state.currentOrder) return state;
  const list = [...state.currentOrder];
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return state;
  }
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);

  return {
    ...state,
    currentOrder: list,
    feedbackMessage: undefined,
  };
}

/**
 * Sets student input for a specific blank index.
 */
export function setBlankInput(
  state: ActivityInteractionState,
  blankIndex: number,
  value: string
): ActivityInteractionState {
  const current = state.blanksInput ? [...state.blanksInput] : [];
  current[blankIndex] = value;
  return {
    ...state,
    blanksInput: current,
    feedbackMessage: undefined,
  };
}

/**
 * Evaluates whether current interaction state matches correct answer.
 */
export function checkAnswer(
  activity: EducationalActivity,
  state: ActivityInteractionState
): ActivityEvaluationResult {
  const maxScore = activity.scoring?.pointsPerQuestion ?? 10;
  const penalty = (state.attemptsCount || 0) * (activity.scoring?.penaltyPerWrongAttempt ?? 2);
  const basePoints = Math.max(1, maxScore - penalty);

  switch (activity.type) {
    case 'mcq':
    case 'true-false': {
      const userChoice = state.selectedOptionId;
      const isCorrect = userChoice === activity.correctAnswer;
      return {
        isCorrect,
        scoreEarned: isCorrect ? basePoints : 0,
        maxScore,
        feedback: isCorrect
          ? '✓ Correct! Well done.'
          : '✕ Incorrect. Review the concept and try again.',
      };
    }

    case 'fill-in-blanks': {
      const expected = Array.isArray(activity.blanksAnswer)
        ? activity.blanksAnswer
        : [activity.blanksAnswer || ''];
      const userInputs = state.blanksInput || [];

      let allCorrect = true;
      let matchCount = 0;
      for (let i = 0; i < expected.length; i++) {
        const expNorm = normalizeAnswerString(expected[i]);
        const usrNorm = normalizeAnswerString(userInputs[i] || '');
        if (expNorm === usrNorm) {
          matchCount++;
        } else {
          allCorrect = false;
        }
      }

      const fraction = expected.length > 0 ? matchCount / expected.length : 0;
      const score = Math.round(basePoints * fraction);

      return {
        isCorrect: allCorrect,
        scoreEarned: score,
        maxScore,
        feedback: allCorrect
          ? '✓ Exactly right! All blanks filled accurately.'
          : `${matchCount}/${expected.length} correct blanks. Check spelling and retry!`,
      };
    }

    case 'matching': {
      const pairs = activity.matchingPairs || [];
      const userAnswers = state.matchingAnswers || {};
      let matches = 0;

      for (const p of pairs) {
        if (userAnswers[p.id] === p.right) {
          matches++;
        }
      }

      const isAll = pairs.length > 0 && matches === pairs.length;
      const frac = pairs.length > 0 ? matches / pairs.length : 0;
      const score = Math.round(basePoints * frac);

      return {
        isCorrect: isAll,
        scoreEarned: score,
        maxScore,
        feedback: isAll
          ? '✓ Outstanding! All pairs matched accurately.'
          : `${matches}/${pairs.length} pairs matched correctly. Keep trying!`,
      };
    }

    case 'ordering': {
      const canonical = activity.orderedItems || [];
      const userSeq = state.currentOrder || [];
      const isMatch =
        canonical.length === userSeq.length &&
        canonical.every((val, idx) => val === userSeq[idx]);

      return {
        isCorrect: isMatch,
        scoreEarned: isMatch ? basePoints : 0,
        maxScore,
        feedback: isMatch
          ? '✓ Perfect sequence! Steps are arranged correctly.'
          : '✕ Incorrect sequence. Re-evaluate the progression order.',
      };
    }

    case 'qa-reveal':
    case 'flashcard':
    case 'step-reveal':
    case 'formula-reveal':
    case 'poll':
    default: {
      // Non-scored participation activities
      return {
        isCorrect: true,
        scoreEarned: maxScore,
        maxScore,
        feedback: 'Classroom activity completed.',
      };
    }
  }
}

/**
 * Submits the current answer and updates state with score and feedback.
 */
export function submitAnswer(
  activity: EducationalActivity,
  state: ActivityInteractionState
): ActivityInteractionState {
  const evalResult = checkAnswer(activity, state);
  const attempts = state.attemptsCount + 1;

  return {
    ...state,
    isSubmitted: true,
    isCorrect: evalResult.isCorrect,
    attemptsCount: attempts,
    score: state.score + evalResult.scoreEarned,
    earnedPoints: evalResult.scoreEarned,
    feedbackMessage: evalResult.feedback,
  };
}

/**
 * Teacher-controlled reveal of correct answer and explanation.
 */
export function revealAnswer(
  state: ActivityInteractionState
): ActivityInteractionState {
  return {
    ...state,
    isRevealed: true,
    isSubmitted: true,
    feedbackMessage: 'Teacher revealed correct answer.',
  };
}

/**
 * Advances to reveal next step in step-reveal activity.
 */
export function revealNextStep(
  activity: EducationalActivity,
  state: ActivityInteractionState
): ActivityInteractionState {
  const total = activity.steps?.length ?? 1;
  const next = Math.min(total - 1, state.revealedStepIndex + 1);
  return {
    ...state,
    revealedStepIndex: next,
    isRevealed: next >= total - 1,
  };
}

/**
 * Flips double-sided flashcard.
 */
export function flipFlashcard(
  state: ActivityInteractionState
): ActivityInteractionState {
  return {
    ...state,
    isFlashcardFlipped: !state.isFlashcardFlipped,
  };
}

/**
 * Reveals next available hint.
 */
export function revealHint(
  activity: EducationalActivity,
  state: ActivityInteractionState
): ActivityInteractionState {
  const maxHints = activity.hints?.length ?? 0;
  const next = Math.min(maxHints, state.hintsRevealedCount + 1);
  return {
    ...state,
    hintsRevealedCount: next,
  };
}

/**
 * Resets student input to allow retrying without losing historical attempts count.
 */
export function retryActivity(
  activity: EducationalActivity,
  state: ActivityInteractionState
): ActivityInteractionState {
  const fresh = createInitialActivityState(activity);
  return {
    ...fresh,
    attemptsCount: state.attemptsCount,
    score: state.score,
  };
}

/**
 * Casts a vote on a classroom poll option.
 */
export function castPollVote(
  activity: EducationalActivity,
  state: ActivityInteractionState,
  optionId: string
): { updatedActivity: EducationalActivity; updatedState: ActivityInteractionState } {
  if (!activity.pollOptions) {
    return { updatedActivity: activity, updatedState: state };
  }

  const updatedPollOptions = activity.pollOptions.map((opt) => {
    if (opt.id === optionId) {
      return { ...opt, votes: (opt.votes || 0) + 1 };
    }
    return opt;
  });

  const updatedActivity: EducationalActivity = {
    ...activity,
    pollOptions: updatedPollOptions,
  };

  const updatedState: ActivityInteractionState = {
    ...state,
    pollVotedOptionId: optionId,
    isSubmitted: true,
    isRevealed: true,
    feedbackMessage: 'Your vote has been recorded!',
  };

  return { updatedActivity, updatedState };
}

// ─── Native SmartBoard CanvasObject Compilation ──────────────────────────────

/**
 * Compiles an EducationalActivity and its current interaction state into native
 * SmartBoard CanvasObjects (ShapeObject, TextObject).
 *
 * Guarantees:
 * - 100% native SmartBoard compatibility (no raw HTML or external iframes).
 * - High-contrast styling complying with WCAG 2.1 AA.
 * - Projector-ready card layout with crisp typography.
 * - Fully serializable state inside shape params for save/reopen fidelity.
 */
export function compileActivityToNativeObjects(
  activity: EducationalActivity,
  state: ActivityInteractionState,
  bounds: BoundingBox,
  theme: PresentationTheme,
  layerId: string = LAYER_OBJECTS
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const padding = theme.spacing.md;
  const innerW = bounds.width - padding * 2;
  let curY = bounds.y + padding;

  // 1. Outer Container Shape with embedded metadata in params
  const containerId = `activity-${activity.id}`;
  const containerShape: ShapeObject = {
    id: containerId,
    type: 'shape',
    shapeType: 'roundedRect',
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    rotation: 0,
    fillColor: theme.cardBackground,
    fillOpacity: 1,
    strokeColor: state.isCorrect === true
      ? theme.semantic.success
      : state.isCorrect === false && state.isSubmitted
      ? theme.semantic.danger
      : theme.cardBorder,
    strokeWidth: state.isSubmitted ? 2.5 : 1.5,
    strokeOpacity: 1,
    strokeStyle: 'solid',
    locked: false,
    layerId,
    label: activity.title,
    params: {
      isInteractiveActivity: true,
      activityId: activity.id,
      activityType: activity.type,
      activityData: activity,
      activityState: state,
    },
  };
  objects.push(containerShape);

  // 2. Top Header Row: Activity Badge & Type Pill
  const meta = ACTIVITY_TYPES_CATALOG[activity.type] || ACTIVITY_TYPES_CATALOG.mcq;
  const badgeText = `${meta.icon} ${meta.badge}`;
  const badgeWidth = Math.min(innerW * 0.45, 230);

  // Badge pill shape
  objects.push({
    id: uuidv4(),
    type: 'shape',
    shapeType: 'roundedRect',
    x: bounds.x + padding,
    y: curY,
    width: badgeWidth,
    height: 28,
    rotation: 0,
    fillColor: theme.accentColor,
    fillOpacity: 0.18,
    strokeColor: theme.accentColor,
    strokeWidth: 1,
    strokeOpacity: 0.8,
    strokeStyle: 'solid',
    locked: false,
    layerId,
  });

  // Badge text
  objects.push({
    id: uuidv4(),
    type: 'text',
    x: bounds.x + padding + 10,
    y: curY + 6,
    width: badgeWidth - 20,
    height: 18,
    content: badgeText,
    fontFamily: theme.typography.fontFamilyHeading,
    fontSize: 12,
    fontWeight: 700,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    color: theme.accentColor,
    backgroundColor: 'transparent',
    opacity: 1,
    rotation: 0,
    preset: 'label',
    locked: false,
    layerId,
  });

  // Score / Attempts counter pill (Top Right)
  if (state.attemptsCount > 0 || state.score > 0) {
    const scoreText = `Attempts: ${state.attemptsCount} | Score: ${state.score} pts`;
    objects.push({
      id: uuidv4(),
      type: 'text',
      x: bounds.x + bounds.width - padding - 220,
      y: curY + 6,
      width: 220,
      height: 18,
      content: scoreText,
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 12,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'right',
      color: theme.mutedText,
      backgroundColor: 'transparent',
      opacity: 1,
      rotation: 0,
      preset: 'label',
      locked: false,
      layerId,
    });
  }

  curY += 38;

  // 3. Question Prompt Box
  const questionMeasured = measureTextLines(activity.question, {
    fontFamily: theme.typography.fontFamilyHeading,
    fontSize: 18,
    maxWidth: innerW,
  });

  objects.push({
    id: uuidv4(),
    type: 'text',
    x: bounds.x + padding,
    y: curY,
    width: innerW,
    height: Math.max(26, questionMeasured.totalHeight),
    content: questionMeasured.lines.join('\n'),
    fontFamily: theme.typography.fontFamilyHeading,
    fontSize: 18,
    fontWeight: 700,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: theme.primaryText,
    backgroundColor: 'transparent',
    opacity: 1,
    rotation: 0,
    preset: 'heading',
    locked: false,
    layerId,
  });

  curY += Math.max(32, questionMeasured.totalHeight + 14);

  // 4. Instructions (if provided)
  if (activity.instructions) {
    objects.push({
      id: uuidv4(),
      type: 'text',
      x: bounds.x + padding,
      y: curY,
      width: innerW,
      height: 20,
      content: `💡 ${activity.instructions}`,
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 13,
      fontWeight: 500,
      fontStyle: 'italic',
      textDecoration: 'none',
      textAlign: 'left',
      color: theme.secondaryText,
      backgroundColor: 'transparent',
      opacity: 0.9,
      rotation: 0,
      preset: 'body',
      locked: false,
      layerId,
    });
    curY += 26;
  }

  // 5. Divider Line
  objects.push({
    id: uuidv4(),
    type: 'shape',
    shapeType: 'line',
    x: bounds.x + padding,
    y: curY,
    width: innerW,
    height: 1,
    rotation: 0,
    fillColor: theme.cardBorder,
    fillOpacity: 0.6,
    strokeColor: theme.cardBorder,
    strokeWidth: 1,
    strokeOpacity: 0.6,
    strokeStyle: 'solid',
    locked: false,
    layerId,
  });
  curY += 14;

  // 6. Type-Specific Interactive Cards / Options Rendering
  const availableH = bounds.y + bounds.height - padding - curY;

  switch (activity.type) {
    case 'mcq':
    case 'true-false': {
      const opts = activity.options || [];
      const optCount = Math.max(1, opts.length);
      const optH = Math.min(50, Math.max(38, Math.floor((availableH - 70) / optCount) - 8));

      opts.forEach((opt, idx) => {
        const isSelected = state.selectedOptionId === opt.id;
        const isCorrectOpt = opt.id === activity.correctAnswer;
        const showResult = state.isSubmitted || state.isRevealed;

        let optBg = theme.surfaceColor;
        let optStroke = theme.cardBorder;
        let strokeW = 1;

        if (isSelected) {
          optBg = `${theme.accentColor}26`;
          optStroke = theme.accentColor;
          strokeW = 2;
        }

        if (showResult) {
          if (isCorrectOpt) {
            optBg = `${theme.semantic.success}26`;
            optStroke = theme.semantic.success;
            strokeW = 2;
          } else if (isSelected && !isCorrectOpt) {
            optBg = `${theme.semantic.danger}26`;
            optStroke = theme.semantic.danger;
            strokeW = 2;
          }
        }

        // Option card container
        objects.push({
          id: uuidv4(),
          type: 'shape',
          shapeType: 'roundedRect',
          x: bounds.x + padding,
          y: curY,
          width: innerW,
          height: optH,
          rotation: 0,
          fillColor: optBg,
          fillOpacity: 1,
          strokeColor: optStroke,
          strokeWidth: strokeW,
          strokeOpacity: 1,
          strokeStyle: 'solid',
          locked: false,
          layerId,
        });

        // Option badge indicator (A, B, C...)
        const badgeLabel = opt.badge || String.fromCharCode(65 + idx);
        objects.push({
          id: uuidv4(),
          type: 'text',
          x: bounds.x + padding + 12,
          y: curY + (optH - 18) / 2,
          width: 24,
          height: 18,
          content: badgeLabel,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 13,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'center',
          color: isSelected ? theme.accentColor : theme.secondaryText,
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'label',
          locked: false,
          layerId,
        });

        // Option label text
        objects.push({
          id: uuidv4(),
          type: 'text',
          x: bounds.x + padding + 44,
          y: curY + (optH - 18) / 2,
          width: innerW - 60,
          height: 18,
          content: opt.text,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 14,
          fontWeight: isSelected ? 600 : 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: theme.primaryText,
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'body',
          locked: false,
          layerId,
        });

        curY += optH + 8;
      });
      break;
    }

    case 'matching': {
      const pairs = activity.matchingPairs || [];
      const colW = (innerW - 30) / 2;
      const rowH = Math.min(46, Math.max(36, Math.floor((availableH - 60) / Math.max(1, pairs.length)) - 6));

      pairs.forEach((p, idx) => {
        // Left Column (Term)
        objects.push({
          id: uuidv4(),
          type: 'shape',
          shapeType: 'roundedRect',
          x: bounds.x + padding,
          y: curY,
          width: colW,
          height: rowH,
          rotation: 0,
          fillColor: `${theme.accentColor}18`,
          fillOpacity: 1,
          strokeColor: theme.accentColor,
          strokeWidth: 1,
          strokeOpacity: 0.6,
          strokeStyle: 'solid',
          locked: false,
          layerId,
        });

        objects.push({
          id: uuidv4(),
          type: 'text',
          x: bounds.x + padding + 10,
          y: curY + (rowH - 16) / 2,
          width: colW - 20,
          height: 16,
          content: `${idx + 1}. ${p.left}`,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 13,
          fontWeight: 600,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: theme.primaryText,
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'body',
          locked: false,
          layerId,
        });

        // Right Column (Definition)
        const isMatched = state.matchingAnswers?.[p.id] === p.right;
        const rightBg = state.isRevealed || isMatched
          ? `${theme.semantic.success}20`
          : theme.surfaceColor;
        const rightBorder = state.isRevealed || isMatched
          ? theme.semantic.success
          : theme.cardBorder;

        objects.push({
          id: uuidv4(),
          type: 'shape',
          shapeType: 'roundedRect',
          x: bounds.x + padding + colW + 30,
          y: curY,
          width: colW,
          height: rowH,
          rotation: 0,
          fillColor: rightBg,
          fillOpacity: 1,
          strokeColor: rightBorder,
          strokeWidth: 1,
          strokeOpacity: 0.8,
          strokeStyle: 'solid',
          locked: false,
          layerId,
        });

        objects.push({
          id: uuidv4(),
          type: 'text',
          x: bounds.x + padding + colW + 40,
          y: curY + (rowH - 16) / 2,
          width: colW - 20,
          height: 16,
          content: `${String.fromCharCode(65 + idx)}) ${p.right}`,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 13,
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: theme.primaryText,
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'body',
          locked: false,
          layerId,
        });

        curY += rowH + 6;
      });
      break;
    }

    case 'step-reveal': {
      const steps = activity.steps || [];
      const stepH = Math.min(62, Math.max(44, Math.floor((availableH - 60) / Math.max(1, steps.length)) - 6));

      steps.forEach((s, idx) => {
        const isRevealed = state.isRevealed || idx <= state.revealedStepIndex;
        const stepBg = isRevealed ? `${theme.accentColor}18` : theme.surfaceColor;
        const stepBorder = isRevealed ? theme.accentColor : theme.cardBorder;

        objects.push({
          id: uuidv4(),
          type: 'shape',
          shapeType: 'roundedRect',
          x: bounds.x + padding,
          y: curY,
          width: innerW,
          height: stepH,
          rotation: 0,
          fillColor: stepBg,
          fillOpacity: 1,
          strokeColor: stepBorder,
          strokeWidth: isRevealed ? 1.5 : 1,
          strokeOpacity: 0.8,
          strokeStyle: isRevealed ? 'solid' : 'dashed',
          locked: false,
          layerId,
        });

        const stepText = isRevealed
          ? `Step ${s.stepNumber}: ${s.title} — ${s.content}`
          : `Step ${s.stepNumber}: [Hidden — Click "Next Step" to reveal]`;

        objects.push({
          id: uuidv4(),
          type: 'text',
          x: bounds.x + padding + 14,
          y: curY + (stepH - 18) / 2,
          width: innerW - 28,
          height: 18,
          content: stepText,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 13,
          fontWeight: isRevealed ? 600 : 400,
          fontStyle: isRevealed ? 'normal' : 'italic',
          textDecoration: 'none',
          textAlign: 'left',
          color: isRevealed ? theme.primaryText : theme.mutedText,
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'body',
          locked: false,
          layerId,
        });

        curY += stepH + 6;
      });
      break;
    }

    case 'formula-reveal': {
      // Large formula banner
      const fBoxH = 60;
      objects.push({
        id: uuidv4(),
        type: 'shape',
        shapeType: 'roundedRect',
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: fBoxH,
        rotation: 0,
        fillColor: `${theme.accentColor}20`,
        fillOpacity: 1,
        strokeColor: theme.accentColor,
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId,
      });

      objects.push({
        id: uuidv4(),
        type: 'text',
        x: bounds.x + padding + 20,
        y: curY + 16,
        width: innerW - 40,
        height: 28,
        content: activity.formula || '',
        fontFamily: theme.typography.fontFamilyCode,
        fontSize: 22,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: theme.primaryText,
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'formula',
        isLatex: true,
        locked: false,
        layerId,
      });

      curY += fBoxH + 12;

      // Variable breakdown pills
      const vars = activity.variableBreakdown || [];
      vars.forEach((v) => {
        const vText = `${v.symbol} : ${v.meaning}${v.unit ? ` (${v.unit})` : ''}`;
        objects.push({
          id: uuidv4(),
          type: 'text',
          x: bounds.x + padding + 10,
          y: curY,
          width: innerW - 20,
          height: 18,
          content: `• ${vText}`,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 13,
          fontWeight: 500,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: theme.secondaryText,
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'body',
          locked: false,
          layerId,
        });
        curY += 22;
      });
      break;
    }

    case 'poll': {
      const pollOpts = activity.pollOptions || [];
      const totalVotes = pollOpts.reduce((acc, o) => acc + (o.votes || 0), 0);
      const pollH = Math.min(48, Math.max(36, Math.floor((availableH - 60) / Math.max(1, pollOpts.length)) - 6));

      pollOpts.forEach((opt) => {
        const votes = opt.votes || 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const isVoted = state.pollVotedOptionId === opt.id;

        // Container
        objects.push({
          id: uuidv4(),
          type: 'shape',
          shapeType: 'roundedRect',
          x: bounds.x + padding,
          y: curY,
          width: innerW,
          height: pollH,
          rotation: 0,
          fillColor: theme.surfaceColor,
          fillOpacity: 1,
          strokeColor: isVoted ? theme.accentColor : theme.cardBorder,
          strokeWidth: isVoted ? 2 : 1,
          strokeOpacity: 0.8,
          strokeStyle: 'solid',
          locked: false,
          layerId,
        });

        // Progress bar fill for votes
        if (pct > 0) {
          objects.push({
            id: uuidv4(),
            type: 'shape',
            shapeType: 'roundedRect',
            x: bounds.x + padding,
            y: curY,
            width: (innerW * pct) / 100,
            height: pollH,
            rotation: 0,
            fillColor: `${theme.accentColor}33`,
            fillOpacity: 1,
            strokeColor: 'transparent',
            strokeWidth: 0,
            strokeOpacity: 0,
            strokeStyle: 'solid',
            locked: false,
            layerId,
          });
        }

        // Option text & percentage
        objects.push({
          id: uuidv4(),
          type: 'text',
          x: bounds.x + padding + 14,
          y: curY + (pollH - 16) / 2,
          width: innerW - 100,
          height: 16,
          content: `${opt.text} ${isVoted ? '✓' : ''}`,
          fontFamily: theme.typography.fontFamilyBody,
          fontSize: 13,
          fontWeight: isVoted ? 600 : 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: theme.primaryText,
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'body',
          locked: false,
          layerId,
        });

        objects.push({
          id: uuidv4(),
          type: 'text',
          x: bounds.x + bounds.width - padding - 70,
          y: curY + (pollH - 16) / 2,
          width: 60,
          height: 16,
          content: `${pct}% (${votes})`,
          fontFamily: theme.typography.fontFamilyHeading,
          fontSize: 12,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'right',
          color: theme.accentColor,
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'label',
          locked: false,
          layerId,
        });

        curY += pollH + 6;
      });
      break;
    }

    default: {
      // Generic card content (qa-reveal, flashcard, ordering, fill-in-blanks)
      const isRevealed = state.isRevealed || state.isSubmitted || state.isFlashcardFlipped;
      const revealBoxH = Math.min(100, availableH - 30);

      objects.push({
        id: uuidv4(),
        type: 'shape',
        shapeType: 'roundedRect',
        x: bounds.x + padding,
        y: curY,
        width: innerW,
        height: revealBoxH,
        rotation: 0,
        fillColor: isRevealed ? `${theme.semantic.success}18` : `${theme.accentColor}12`,
        fillOpacity: 1,
        strokeColor: isRevealed ? theme.semantic.success : theme.cardBorder,
        strokeWidth: 1.5,
        strokeOpacity: 0.8,
        strokeStyle: isRevealed ? 'solid' : 'dashed',
        locked: false,
        layerId,
      });

      const displayText = isRevealed
        ? `Answer & Key Takeaway:\n${activity.explanation || activity.correctAnswer}`
        : '🔒 Answer is hidden for classroom discussion.\nClick "Reveal Answer" or flip card to inspect.';

      objects.push({
        id: uuidv4(),
        type: 'text',
        x: bounds.x + padding + 16,
        y: curY + 14,
        width: innerW - 32,
        height: revealBoxH - 28,
        content: displayText,
        fontFamily: theme.typography.fontFamilyBody,
        fontSize: 14,
        fontWeight: isRevealed ? 500 : 400,
        fontStyle: isRevealed ? 'normal' : 'italic',
        textDecoration: 'none',
        textAlign: 'left',
        color: isRevealed ? theme.primaryText : theme.secondaryText,
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'body',
        locked: false,
        layerId,
      });

      curY += revealBoxH + 10;
      break;
    }
  }

  // 7. Feedback / Explanation Footer Banner
  if (state.feedbackMessage || state.isRevealed) {
    const feedbackText = state.feedbackMessage || `Answer: ${activity.explanation}`;
    objects.push({
      id: uuidv4(),
      type: 'text',
      x: bounds.x + padding,
      y: bounds.y + bounds.height - padding - 22,
      width: innerW,
      height: 20,
      content: feedbackText,
      fontFamily: theme.typography.fontFamilyBody,
      fontSize: 13,
      fontWeight: 600,
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      color: state.isCorrect === true
        ? theme.semantic.success
        : state.isCorrect === false
        ? theme.semantic.danger
        : theme.accentColor,
      backgroundColor: 'transparent',
      opacity: 1,
      rotation: 0,
      preset: 'important',
      locked: false,
      layerId,
    });
  }

  return objects;
}

/**
 * Creates a dedicated full 1920x1080 slide page hosting the interactive activity card.
 */
export function createActivitySlidePage(
  activity: EducationalActivity,
  theme: PresentationTheme = DEFAULT_PRESENTATION_THEME,
  pageIndex: number = 1
): Page {
  const pageId = `activity-page-${activity.id}`;
  const width = DEFAULT_SLIDE_WIDTH;
  const height = DEFAULT_SLIDE_HEIGHT;

  const layers: Layer[] = [
    { id: 'background', name: 'Background', visible: true, locked: true, opacity: 1, order: 0 },
    { id: 'imported-media', name: 'Imported Media', visible: true, locked: false, opacity: 1, order: 1 },
    { id: 'drawing', name: 'Drawing', visible: true, locked: false, opacity: 1, order: 2 },
    { id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 3 },
    { id: 'interaction', name: 'Interaction', visible: true, locked: false, opacity: 1, order: 4 },
  ];

  const pageObjects: CanvasObject[] = [];

  // Slide Background
  pageObjects.push({
    id: uuidv4(),
    type: 'shape',
    shapeType: 'rect',
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0,
    fillColor: theme.backgroundColor,
    fillOpacity: 1,
    strokeColor: 'transparent',
    strokeWidth: 0,
    strokeOpacity: 0,
    strokeStyle: 'solid',
    locked: true,
    layerId: LAYER_BACKGROUND,
  });

  // Slide Header: Lesson Topic & Slide Title
  const headerY = 70;
  pageObjects.push({
    id: uuidv4(),
    type: 'text',
    x: 80,
    y: headerY,
    width: width - 160,
    height: 38,
    content: activity.title,
    fontFamily: theme.typography.fontFamilyHeading,
    fontSize: 32,
    fontWeight: 700,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: theme.primaryText,
    backgroundColor: 'transparent',
    opacity: 1,
    rotation: 0,
    preset: 'title',
    locked: false,
    layerId: LAYER_OBJECTS,
  });

  // Activity Card Dimensions (centered)
  const cardBounds: BoundingBox = {
    x: 100,
    y: 135,
    width: width - 200,
    height: height - 230,
  };

  const initialStat = createInitialActivityState(activity);
  const cardObjects = compileActivityToNativeObjects(activity, initialStat, cardBounds, theme, LAYER_OBJECTS);
  pageObjects.push(...cardObjects);

  // Slide Footer: Topic tag & page indicator
  const footerY = height - 55;
  pageObjects.push({
    id: uuidv4(),
    type: 'text',
    x: 80,
    y: footerY,
    width: 600,
    height: 20,
    content: `${activity.subject || 'Classroom Teaching'} • Interactive Activity`,
    fontFamily: theme.typography.fontFamilyBody,
    fontSize: 13,
    fontWeight: 500,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: theme.mutedText,
    backgroundColor: 'transparent',
    opacity: 0.8,
    rotation: 0,
    preset: 'label',
    locked: false,
    layerId: LAYER_OBJECTS,
  });

  pageObjects.push({
    id: uuidv4(),
    type: 'text',
    x: width - 200,
    y: footerY,
    width: 120,
    height: 20,
    content: `Slide ${pageIndex}`,
    fontFamily: theme.typography.fontFamilyBody,
    fontSize: 13,
    fontWeight: 500,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'right',
    color: theme.mutedText,
    backgroundColor: 'transparent',
    opacity: 0.8,
    rotation: 0,
    preset: 'label',
    locked: false,
    layerId: LAYER_OBJECTS,
  });

  return {
    id: pageId,
    title: activity.title,
    width,
    height,
    background: {
      type: 'color',
      color: theme.backgroundColor,
    },
    layers,
    objects: pageObjects,
  };
}

// ─── Offline Curriculum Activity Library & Generator ──────────────────────────

/**
 * Generates an educational activity using built-in deterministic curriculum templates.
 * Guarantees high-quality classroom activities without internet connection or LLM keys.
 */
export function generateCurriculumActivity(
  topic: string,
  subject: string = 'General Science',
  type: EducationalActivityType = 'mcq',
  gradeLevel: string = 'High School (Grades 9-10)'
): EducationalActivity {
  const normTopic = sanitizeText(topic).toLowerCase();
  const actId = uuidv4();

  // Science / Photosynthesis
  if (normTopic.includes('photosynthesis') || normTopic.includes('plant') || normTopic.includes('chlorophyll')) {
    switch (type) {
      case 'mcq':
        return validateActivity({
          id: actId,
          type: 'mcq',
          title: 'Photosynthesis Knowledge Check',
          question: 'Which organelle is the primary site of photosynthesis in plant cells?',
          options: [
            { id: 'opt-a', text: 'Mitochondrion' },
            { id: 'opt-b', text: 'Chloroplast', isCorrect: true },
            { id: 'opt-c', text: 'Endoplasmic Reticulum' },
            { id: 'opt-d', text: 'Golgi Apparatus' },
          ],
          correctAnswer: 'opt-b',
          explanation: 'Chloroplasts contain chlorophyll pigments that capture sunlight energy to drive glucose synthesis.',
          topic,
          subject,
          hints: ['Look for the organelle containing the green pigment chlorophyll.'],
        });

      case 'formula-reveal':
        return validateActivity({
          id: actId,
          type: 'formula-reveal',
          title: 'Chemical Equation of Photosynthesis',
          question: 'What is the balanced stoichiometric equation for oxygenic photosynthesis?',
          formula: '6CO_2 + 6H_2O \\xrightarrow{sunlight} C_6H_{12}O_6 + 6O_2',
          formulaName: 'Photosynthesis Stoichiometry',
          variableBreakdown: [
            { symbol: '6 CO₂', meaning: 'Carbon Dioxide molecules from atmosphere' },
            { symbol: '6 H₂O', meaning: 'Water molecules absorbed via roots' },
            { symbol: 'C₆H₁₂O₆', meaning: 'Glucose (chemical energy stored)' },
            { symbol: '6 O₂', meaning: 'Oxygen released as a vital byproduct' },
          ],
          explanation: 'Six molecules of carbon dioxide and six water molecules yield one glucose molecule and six oxygen gas molecules.',
          topic,
          subject,
        });

      case 'matching':
        return validateActivity({
          id: actId,
          type: 'matching',
          title: 'Photosynthesis Reactions & Locations',
          question: 'Match each photosynthesis stage with its correct cellular compartment:',
          matchingPairs: [
            { id: 'p1', left: 'Light-Dependent Reactions', right: 'Thylakoid Membrane' },
            { id: 'p2', left: 'Calvin Cycle (Dark Reactions)', right: 'Stroma Matrix' },
            { id: 'p3', left: 'Water Photolysis', right: 'Thylakoid Lumen' },
          ],
          explanation: 'Photophosphorylation occurs along thylakoid membranes, while carbon fixation occurs in the liquid stroma.',
          topic,
          subject,
        });

      case 'step-reveal':
        return validateActivity({
          id: actId,
          type: 'step-reveal',
          title: 'Light-Dependent Reaction Progression',
          question: 'Trace the electron pathway during the light reactions of photosynthesis:',
          steps: [
            { stepNumber: 1, title: 'Photon Absorption in PSII', content: 'Light excites P680 chlorophyll, initiating water splitting.' },
            { stepNumber: 2, title: 'Electron Transport Chain', content: 'Plastoquinone and cytochrome b6f pump protons across thylakoid.' },
            { stepNumber: 3, title: 'Photosystem I & NADPH', content: 'Electrons re-excited at P700 transfer to ferredoxin to reduce NADP⁺.' },
            { stepNumber: 4, title: 'Chemiosmotic ATP Synthesis', content: 'Proton gradient drives ATP synthase to produce ATP.' },
          ],
          explanation: 'Photons excite electrons sequentially through PSII, ETC, and PSI, synthesizing both ATP and NADPH.',
          topic,
          subject,
        });

      default:
        break;
    }
  }

  // Physics / Newton's Laws
  if (normTopic.includes('newton') || normTopic.includes('force') || normTopic.includes('motion')) {
    switch (type) {
      case 'matching':
        return validateActivity({
          id: actId,
          type: 'matching',
          title: "Newton's Three Laws of Motion",
          question: "Match each of Newton's laws with its defining physical principle:",
          matchingPairs: [
            { id: 'p1', left: 'First Law of Motion', right: 'Inertia & Net Force = 0' },
            { id: 'p2', left: 'Second Law of Motion', right: 'F_net = m · a' },
            { id: 'p3', left: 'Third Law of Motion', right: 'Action & Equal Reaction Pairs' },
          ],
          explanation: "Inertia resists acceleration; force induces acceleration proportional to mass; forces occur in reciprocal action-reaction pairs.",
          topic,
          subject,
        });

      case 'formula-reveal':
        return validateActivity({
          id: actId,
          type: 'formula-reveal',
          title: "Newton's Second Law Formula Breakdown",
          question: 'What is the fundamental dynamical equation relating net force, mass, and acceleration?',
          formula: '\\vec{F}_{net} = m \\cdot \\vec{a}',
          formulaName: "Newton's Second Law of Dynamics",
          variableBreakdown: [
            { symbol: 'F_net', meaning: 'Net External Force Vector', unit: 'Newtons (N)' },
            { symbol: 'm', meaning: 'Inertial Mass of Object', unit: 'Kilograms (kg)' },
            { symbol: 'a', meaning: 'Resulting Acceleration Vector', unit: 'm/s²' },
          ],
          explanation: 'Acceleration is directly proportional to net force and inversely proportional to object mass.',
          topic,
          subject,
        });

      default:
        break;
    }
  }

  // Mathematics / Pythagorean Theorem & Geometry
  if (normTopic.includes('pythagor') || normTopic.includes('triangle') || normTopic.includes('geometry')) {
    switch (type) {
      case 'formula-reveal':
        return validateActivity({
          id: actId,
          type: 'formula-reveal',
          title: 'The Pythagorean Theorem',
          question: 'What is the metric relationship between sides of a Euclidean right triangle?',
          formula: 'a^2 + b^2 = c^2',
          formulaName: 'Pythagorean Theorem',
          variableBreakdown: [
            { symbol: 'a', meaning: 'Length of adjacent leg' },
            { symbol: 'b', meaning: 'Length of opposite leg' },
            { symbol: 'c', meaning: 'Length of hypotenuse (opposite right angle)' },
          ],
          explanation: 'In any planar right triangle, the sum of squares of legs equals the square of the hypotenuse.',
          topic,
          subject,
        });

      case 'step-reveal':
        return validateActivity({
          id: actId,
          type: 'step-reveal',
          title: 'Calculating the Hypotenuse: Worked Solution',
          question: 'Find hypotenuse c of a right triangle with legs a = 6 cm and b = 8 cm:',
          steps: [
            { stepNumber: 1, title: 'State the Formula', content: 'c² = a² + b²' },
            { stepNumber: 2, title: 'Substitute Leg Values', content: 'c² = (6)² + (8)² = 36 + 64' },
            { stepNumber: 3, title: 'Sum the Squares', content: 'c² = 100' },
            { stepNumber: 4, title: 'Take Square Root', content: 'c = √100 = 10 cm' },
          ],
          explanation: 'Squaring 6 and 8 gives 36 and 64, whose sum is 100; the principal square root is 10.',
          topic,
          subject,
        });

      default:
        break;
    }
  }

  // Computer Science / Binary Search
  if (normTopic.includes('binary search') || normTopic.includes('algorithm') || normTopic.includes('search')) {
    switch (type) {
      case 'ordering':
        return validateActivity({
          id: actId,
          type: 'ordering',
          title: 'Binary Search Algorithm Steps',
          question: 'Arrange the core execution steps of Binary Search in their correct procedural sequence:',
          orderedItems: [
            '1. Initialize low and high boundary pointers on sorted array',
            '2. Calculate midpoint: mid = floor((low + high) / 2)',
            '3. Compare target element with array[mid]',
            '4. Narrow search interval: adjust low or high pointer',
            '5. Terminate when target found or when low > high',
          ],
          explanation: 'Binary Search repeatedly halves the search space by evaluating the midpoint of a sorted array in O(log n) time.',
          topic,
          subject,
        });

      case 'poll':
        return validateActivity({
          id: actId,
          type: 'poll',
          title: 'Algorithm Design Discussion Poll',
          question: 'When should a software engineer prefer Binary Search over Linear Search in production?',
          pollOptions: [
            { id: 'opt-1', text: 'When the collection is already sorted and searched frequently', votes: 14 },
            { id: 'opt-2', text: 'When the array contains fewer than 10 unsorted items', votes: 2 },
            { id: 'opt-3', text: 'When linked lists are the primary data structure', votes: 1 },
            { id: 'opt-4', text: 'Only in distributed multi-node clusters', votes: 0 },
          ],
          explanation: 'Binary Search requires O(log n) time but requires sorted data; sorting overhead is justified when searches are frequent.',
          topic,
          subject,
        });

      default:
        break;
    }
  }

  // General Dynamic Fallback based on activity type
  switch (type) {
    case 'true-false':
      return validateActivity({
        id: actId,
        type: 'true-false',
        title: `${topic} — Concept Verification`,
        question: `True or False: The fundamental principles of ${topic} apply consistently across all standard conditions in ${subject}.`,
        correctAnswer: 'true',
        explanation: `Under standard foundational models in ${subject}, ${topic} represents an established, verified principle.`,
        topic,
        subject,
      });

    case 'fill-in-blanks':
      return validateActivity({
        id: actId,
        type: 'fill-in-blanks',
        title: `${topic} Terminology Check`,
        question: `In ${subject}, the primary mechanism governing ${topic} is known as [blank].`,
        blanksAnswer: ['conservation'],
        options: [
          { id: 'bank-0', text: 'conservation' },
          { id: 'bank-1', text: 'divergence' },
          { id: 'bank-2', text: 'equilibrium' },
        ],
        explanation: `The foundational law governing ${topic} guarantees conservation and predictable state transitions.`,
        topic,
        subject,
      });

    case 'matching':
      return validateActivity({
        id: actId,
        type: 'matching',
        title: `${topic} Concepts & Definitions`,
        question: `Match each key concept of ${topic} with its corresponding role:`,
        matchingPairs: [
          { id: 'p1', left: 'Core Principle', right: 'Fundamental governing rule' },
          { id: 'p2', left: 'Primary Mechanism', right: 'Operational process driving change' },
          { id: 'p3', left: 'Practical Application', right: 'Real-world utility in society' },
        ],
        explanation: `Understanding ${topic} requires connecting underlying principles, mechanisms, and applications.`,
        topic,
        subject,
      });

    case 'ordering':
      return validateActivity({
        id: actId,
        type: 'ordering',
        title: `${topic} Sequence Ordering`,
        question: `Arrange the logical phases of ${topic} in their proper chronological progression:`,
        orderedItems: [
          'Phase 1: Initial State & Conditions',
          'Phase 2: Activation & Transformation',
          'Phase 3: Stabilization & Equilibrium Output',
        ],
        explanation: `The process flows sequentially from initial inputs through activation to final equilibrium.`,
        topic,
        subject,
      });

    case 'qa-reveal':
      return validateActivity({
        id: actId,
        type: 'qa-reveal',
        title: `${topic} Discussion Prompt`,
        question: `Why is understanding ${topic} critical when analyzing contemporary problems in ${subject}?`,
        explanation: `It provides the predictive framework and analytical models required to make sound judgments and evaluate outcomes.`,
        topic,
        subject,
      });

    case 'flashcard':
      return validateActivity({
        id: actId,
        type: 'flashcard',
        title: `${topic} Flashcard`,
        question: `What is the core definition and significance of ${topic}?`,
        flashcardBack: `${topic} is a cornerstone concept in ${subject} that describes relationships, governing constraints, and system behaviors.`,
        explanation: 'Review this definition regularly to build long-term conceptual fluency.',
        topic,
        subject,
      });

    case 'step-reveal':
      return validateActivity({
        id: actId,
        type: 'step-reveal',
        title: `${topic} Step-by-Step Procedure`,
        question: `Follow the standard systematic procedure for analyzing ${topic}:`,
        steps: [
          { stepNumber: 1, title: 'Observe & Formulate Hypotheses', content: 'Identify starting parameters and boundary conditions.' },
          { stepNumber: 2, title: 'Apply Governing Models', content: 'Use proven relationships to calculate or predict transitions.' },
          { stepNumber: 3, title: 'Verify & Conclude', content: 'Test findings against empirical benchmarks.' },
        ],
        explanation: 'Methodical execution prevents common errors and ensures reproducible conclusions.',
        topic,
        subject,
      });

    case 'formula-reveal':
      return validateActivity({
        id: actId,
        type: 'formula-reveal',
        title: `${topic} Governing Relationship`,
        question: `What equation models the relationship governing ${topic}?`,
        formula: 'Y = f(X) + \\epsilon',
        formulaName: `${topic} General Model`,
        variableBreakdown: [
          { symbol: 'Y', meaning: 'Dependent Output Variable' },
          { symbol: 'X', meaning: 'Independent Input Factor' },
          { symbol: '\\epsilon', meaning: 'Empirical Variance / Uncertainty' },
        ],
        explanation: `Mathematical models for ${topic} express dependent outcomes as functions of state variables.`,
        topic,
        subject,
      });

    case 'poll':
      return validateActivity({
        id: actId,
        type: 'poll',
        title: `${topic} Classroom Poll`,
        question: `Which aspect of ${topic} warrants the deepest inquiry during today's lesson?`,
        pollOptions: [
          { id: 'opt-1', text: 'Theoretical Foundations & Proofs', votes: 8 },
          { id: 'opt-2', text: 'Hands-on Worked Exercises', votes: 12 },
          { id: 'opt-3', text: 'Real-World Industry Case Studies', votes: 15 },
          { id: 'opt-4', text: 'Common Exam Pitfalls & Review', votes: 9 },
        ],
        explanation: 'Student input guides pacing and emphasis during live instruction.',
        topic,
        subject,
      });

    case 'mcq':
    default:
      return validateActivity({
        id: actId,
        type: 'mcq',
        title: `${topic} Assessment Question`,
        question: `Which statement most accurately characterizes ${topic} in ${subject}?`,
        options: [
          { id: 'opt-a', text: `It establishes the fundamental principles governing ${topic}.`, isCorrect: true },
          { id: 'opt-b', text: 'It applies solely to historical, non-modern contexts.' },
          { id: 'opt-c', text: 'It contradicts standard conservation laws.' },
          { id: 'opt-d', text: 'It is an arbitrary convention with no empirical basis.' },
        ],
        correctAnswer: 'opt-a',
        explanation: `In ${subject}, ${topic} is recognized for providing foundational principles and verifiable rules.`,
        topic,
        subject,
      });
  }
}

/**
 * Generates a collection of diverse educational activities for a topic.
 */
export function generateCurriculumActivityDeck(
  topic: string,
  subject: string = 'General Science',
  types: EducationalActivityType[] = ['mcq', 'true-false', 'matching', 'step-reveal'],
  gradeLevel: string = 'High School (Grades 9-10)'
): EducationalActivity[] {
  return types.map((t) => generateCurriculumActivity(topic, subject, t, gradeLevel));
}

// ─── AI LLM Generation Pipeline ───────────────────────────────────────────────

/**
 * Builds a strict pedagogical prompt for LLM structured JSON generation.
 */
export function generateActivityPrompt(
  topic: string,
  subject: string,
  type: EducationalActivityType,
  gradeLevel: string = 'High School (Grades 9-10)'
): string {
  const meta = ACTIVITY_TYPES_CATALOG[type] || ACTIVITY_TYPES_CATALOG.mcq;

  return `You are a master pedagogical educator designing an interactive classroom teaching activity for SmartBoard Studio.

TOPIC: "${topic}"
SUBJECT: "${subject}"
GRADE LEVEL: "${gradeLevel}"
ACTIVITY TYPE: "${type}" (${meta.title})

REQUIREMENTS:
1. Construct a single, highly engaging, pedagogically sound educational activity.
2. For multiple-choice (mcq):
   - Provide 4 distinct options with ids "opt-a", "opt-b", "opt-c", "opt-d".
   - Set "correctAnswer" to the exact id of the single correct option.
   - Avoid trivial "all of the above" or trick questions.
3. For true-false:
   - Provide a clear declarative statement in "question".
   - "correctAnswer" MUST be either "true" or "false".
   - In "explanation", explicitly address why a student might mistake it.
4. For fill-in-blanks:
   - Include "[blank]" in the question text.
   - Provide the exact expected answer word in "blanksAnswer" as an array of strings.
5. For matching:
   - Provide 3-4 "matchingPairs" with "id", "left", and "right".
6. For ordering:
   - Provide 3-5 "orderedItems" in canonical chronological or procedural order.
7. For step-reveal:
   - Provide 3-4 progressive steps with "stepNumber", "title", and "content".
8. For formula-reveal:
   - Provide a LaTeX "formula", "formulaName", and "variableBreakdown" array.
9. For poll:
   - Provide a debate question and 3-4 "pollOptions" with "id" and "text".

OUTPUT FORMAT: Return ONLY a valid JSON object matching this schema:
{
  "type": "${type}",
  "title": "Short descriptive activity title",
  "question": "The question prompt or instruction",
  "instructions": "Brief student instructions",
  "explanation": "Clear educational explanation",
  "difficulty": "intermediate",
  "hints": ["Helpful pedagogical hint 1"],
  "options": [{ "id": "opt-a", "text": "Option text" }],
  "correctAnswer": "opt-a",
  "matchingPairs": [{ "id": "p1", "left": "Term", "right": "Definition" }],
  "orderedItems": ["Step 1", "Step 2", "Step 3"],
  "blanksAnswer": ["answer"],
  "steps": [{ "stepNumber": 1, "title": "Step 1", "content": "Details" }],
  "formula": "E = mc^2",
  "formulaName": "Mass-Energy Equivalence",
  "variableBreakdown": [{ "symbol": "E", "meaning": "Energy", "unit": "J" }],
  "pollOptions": [{ "id": "poll-1", "text": "Choice 1", "votes": 0 }]
}`;
}

/**
 * Central asynchronous generator for interactive educational activities.
 * Queries LLM provider with structured JSON schema and validates output;
 * automatically falls back to offline curriculum templates if provider is unavailable or fails.
 */
export async function generateActivityDeck(
  options: GenerateActivityOptions
): Promise<EducationalActivity[]> {
  const topic = sanitizeText(options.topic);
  const subject = sanitizeText(options.subject || 'General Education');
  const gradeLevel = sanitizeText(options.gradeLevel || 'High School (Grades 9-10)');
  const types = options.types && options.types.length > 0
    ? options.types
    : (['mcq', 'true-false', 'matching', 'step-reveal'] as EducationalActivityType[]);
  const targetCount = options.count ?? types.length;

  const activities: EducationalActivity[] = [];

  // Determine provider availability
  const provider = options.provider || 'openai';
  let isAvailable = false;
  try {
    if (provider === 'ollama') {
      const ollama = await aiProviderManager.checkOllamaStatus(options.endpoint);
      isAvailable = ollama.available;
    } else {
      isAvailable = await aiProviderManager.hasApiKey(provider);
    }
  } catch {
    isAvailable = false;
  }

  // Iterate requested types
  for (let i = 0; i < Math.min(types.length, targetCount); i++) {
    const actType = types[i];
    let generated: EducationalActivity | null = null;

    if (isAvailable && !options.signal?.aborted) {
      try {
        const prompt = generateActivityPrompt(topic, subject, actType, gradeLevel);
        const resp = await aiProviderManager.generateStructuredJson<any>({
          provider,
          model: options.model,
          prompt,
          systemPrompt: 'You are an expert pedagogical assessment developer for classroom smartboards.',
          apiKey: options.apiKey,
          endpoint: options.endpoint,
          signal: options.signal,
          temperature: 0.3,
        });

        if (resp.success && resp.data) {
          const validated = validateActivity({
            ...resp.data,
            type: actType,
            topic,
            subject,
            source: 'ai',
          });
          generated = validated;
        }
      } catch {
        generated = null;
      }
    }

    // Offline Curriculum Fallback
    if (!generated) {
      generated = generateCurriculumActivity(topic, subject, actType, gradeLevel);
    }

    activities.push(generated);
  }

  return activities;
}

