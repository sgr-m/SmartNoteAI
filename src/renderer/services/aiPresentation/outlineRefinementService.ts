/**
 * outlineRefinementService.ts — Conversational Topic Refinement & Outline Architect
 * Phase 5: Connected Context-Aware AI Chatbox for Topic Planning
 *
 * Enables teachers to converse with AI to refine, expand, reorganize, and update
 * slide outlines dynamically while preserving manual edits and selection states.
 */

import {
  AIProviderType,
  OutlineChatMessage,
  OutlineRefinementResult,
  SlideLayoutType,
  SlideOutlineItem,
  TeachingStyle,
} from '../../../shared/aiPresentationTypes';
import { aiProviderManager, AIProviderManager } from './aiProviderManager';

export interface RefinementContext {
  topic: string;
  subject?: string;
  gradeLevel?: string;
  teachingStyle?: TeachingStyle;
  provider?: AIProviderType;
  model?: string;
  signal?: AbortSignal;
}

/**
 * Intelligent pedagogical outline refiner and conversational mediator.
 */
export class OutlineRefinementService {
  private providerManager: AIProviderManager;

  constructor(providerManager?: AIProviderManager) {
    this.providerManager = providerManager || aiProviderManager;
  }

  /**
   * Refines the presentation outline based on the teacher's instruction and conversational context.
   * Routes to the active AI provider when configured; seamlessly falls back to
   * the deterministic offline pedagogical heuristic refiner if unavailable or on error.
   */
  public async refineOutline(
    instruction: string,
    currentOutline: SlideOutlineItem[],
    context: RefinementContext,
    chatHistory: OutlineChatMessage[] = []
  ): Promise<OutlineRefinementResult> {
    const trimmedInstruction = (instruction || '').trim();
    if (!trimmedInstruction) {
      return {
        explanation: 'Please enter a teaching instruction or request to modify the slide outline.',
        updatedOutline: [...currentOutline],
        changes: { added: [], modified: [], removed: [], reordered: false },
      };
    }

    const safeOutline = currentOutline.length > 0
      ? currentOutline.map((item, idx) => ({
          ...item,
          id: item.id || `outline-slide-${idx + 1}`,
          slideNumber: idx + 1,
          selected: item.selected !== false,
          changeStatus: item.changeStatus || 'unchanged',
        }))
      : this.createDefaultStarterOutline(context.topic);

    const activeProvider = context.provider || this.providerManager.getActiveProvider();
    let isProviderAvailable = false;

    try {
      if (activeProvider === 'ollama') {
        const status = await this.providerManager.checkOllamaStatus();
        isProviderAvailable = status.available && (status.status === 'ready' || status.installedModels.length > 0);
      } else {
        isProviderAvailable = await this.providerManager.hasApiKey(activeProvider);
      }
    } catch {
      isProviderAvailable = false;
    }

    if (isProviderAvailable) {
      try {
        const aiResult = await this.callAiProvider(
          trimmedInstruction,
          safeOutline,
          context,
          chatHistory,
          activeProvider
        );
        if (aiResult && Array.isArray(aiResult.updatedOutline) && aiResult.updatedOutline.length > 0) {
          return aiResult;
        }
      } catch (err) {
        console.warn('[OutlineRefinementService] AI generation failed, falling back to heuristic refiner:', err);
      }
    }

    // Deterministic offline pedagogical heuristic refiner
    return refineOutlineHeuristic(trimmedInstruction, safeOutline, context);
  }

  /**
   * Calls the active AI provider to generate structured JSON outline refinements.
   */
  private async callAiProvider(
    instruction: string,
    currentOutline: SlideOutlineItem[],
    context: RefinementContext,
    chatHistory: OutlineChatMessage[],
    provider: AIProviderType
  ): Promise<OutlineRefinementResult | null> {
    const systemPrompt = `You are an expert pedagogical curriculum designer and presentation architect for SmartBoard Studio.
Your role is to assist teachers in refining, expanding, reorganizing, and updating their presentation slide outline.

CRITICAL RULES:
1. Understand the teacher's instruction in the context of the lesson topic ("${context.topic}") and grade level ("${context.gradeLevel || 'Standard'}").
2. Maintain pedagogical progression (Hook/Intro -> Core Definitions -> Mechanisms & Derivations -> Worked Problems -> Applications -> Summary/Quiz).
3. Preserve the teacher's previously existing slides and manual edits unless the instruction explicitly modifies, renames, or deletes them.
4. When adding a new topic, place it in the logically appropriate sequence (e.g. "before introducing formula", "after definition").
5. Return JSON conforming strictly to the following schema:
{
  "explanation": "Clear 1-2 sentence description of what was added, modified, removed, or reordered",
  "updatedOutline": [
    {
      "id": "existing-or-new-unique-id",
      "slideNumber": 1,
      "title": "Slide Title",
      "actionGoal": "Clear description of what AI will generate for this slide",
      "layoutArchetype": "concept-explanation",
      "selected": true,
      "changeStatus": "added" | "modified" | "removed" | "unchanged"
    }
  ],
  "changes": {
    "added": ["Title 1"],
    "modified": ["Title 2"],
    "removed": ["Title 3"],
    "reordered": false
  }
}
Always return valid JSON only.`;

    const recentHistory = chatHistory
      .slice(-4)
      .map((msg) => `${msg.sender === 'teacher' ? 'Teacher' : 'Assistant'}: ${msg.text}`)
      .join('\n');

    const outlineSummary = currentOutline
      .map(
        (s, idx) =>
          `Slide ${idx + 1}: "${s.title}" | Goal: "${s.actionGoal || s.objective || 'Standard explanation'}" | Selected: ${s.selected !== false}`
      )
      .join('\n');

    const userPrompt = `TOPIC: ${context.topic}
SUBJECT: ${context.subject || 'General Science / Mathematics'}
GRADE LEVEL: ${context.gradeLevel || 'Grade 10'}
TEACHING STYLE: ${context.teachingStyle || 'interactive'}

CURRENT OUTLINE:
${outlineSummary}

${recentHistory ? `RECENT CONVERSATION:\n${recentHistory}\n` : ''}
TEACHER'S LATEST INSTRUCTION:
"${instruction}"

Please update the outline according to the teacher's instruction and return the JSON response:`;

    const response = await this.providerManager.generateStructuredJson<OutlineRefinementResult>({
      provider,
      model: context.model,
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
      timeoutMs: 25000,
      signal: context.signal,
    });

    if (response.success && response.data) {
      const data = response.data;
      if (Array.isArray(data.updatedOutline) && data.updatedOutline.length > 0) {
        // Renumber slides and ensure changeStatus
        const renumbered = data.updatedOutline.map((item, idx) => ({
          ...item,
          id: item.id || `outline-slide-${Date.now()}-${idx + 1}`,
          slideNumber: idx + 1,
          selected: item.selected !== false,
          changeStatus: item.changeStatus || 'unchanged',
        }));

        return {
          explanation: data.explanation || 'Updated the outline per your instructions.',
          updatedOutline: renumbered,
          changes: {
            added: data.changes?.added || [],
            modified: data.changes?.modified || [],
            removed: data.changes?.removed || [],
            reordered: !!data.changes?.reordered,
          },
          appliedInstructions: instruction,
        };
      }
    }

    return null;
  }

  private createDefaultStarterOutline(topic: string): SlideOutlineItem[] {
    const clean = topic.trim() || 'Classroom Lesson';
    return [
      {
        id: 'starter-1',
        slideNumber: 1,
        title: `Introduction to ${clean}`,
        actionGoal: 'Generate core definition, real-world hook, and essential question',
        layoutArchetype: 'concept-explanation',
        selected: true,
        changeStatus: 'unchanged',
      },
      {
        id: 'starter-2',
        slideNumber: 2,
        title: 'Core Principles & Key Concepts',
        actionGoal: 'Explain fundamental rules, terminology, and key characteristics',
        layoutArchetype: 'definition-formula',
        selected: true,
        changeStatus: 'unchanged',
      },
      {
        id: 'starter-3',
        slideNumber: 3,
        title: 'Step-by-Step Worked Example',
        actionGoal: 'Provide a structured, step-by-step worked numerical problem with solution',
        layoutArchetype: 'problem-solution',
        selected: true,
        changeStatus: 'unchanged',
      },
      {
        id: 'starter-4',
        slideNumber: 4,
        title: 'Real-World Applications & Analysis',
        actionGoal: 'Explore authentic applications and student discussion questions',
        layoutArchetype: 'two-column-split',
        selected: true,
        changeStatus: 'unchanged',
      },
      {
        id: 'starter-5',
        slideNumber: 5,
        title: 'Summary & Check for Understanding',
        actionGoal: 'Interactive recap with 3 diagnostic questions and exit ticket',
        layoutArchetype: 'summary-quiz',
        selected: true,
        changeStatus: 'unchanged',
      },
    ];
  }
}

/**
 * Intelligent deterministic offline heuristic refiner.
 * Handles instructions such as:
 * - "Add <topic> before <target> / after <target>"
 * - "Also include <topic>"
 * - "Include at least two solved examples for every method..."
 * - "Remove <topic> and add <new topic>"
 * - "Rename slide <num|title> to <new title>"
 * - "Move slide <num> up/down or to position <pos>"
 */
export function refineOutlineHeuristic(
  instruction: string,
  currentOutline: SlideOutlineItem[],
  context: RefinementContext
): OutlineRefinementResult {
  const lower = instruction.toLowerCase().trim();
  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];
  let reordered = false;

  let workingOutline: SlideOutlineItem[] = currentOutline.map((item) => ({
    ...item,
    changeStatus: 'unchanged',
  }));

  const explanations: string[] = [];

  // 1. Handle Removals: "Remove real-life applications", "Delete slide 3", "Drop X"
  const removeMatch = lower.match(/(?:remove|delete|drop|exclude)\s+([^.,;\n]+?)(?=\s+(?:and\s+add|also|\.|$))/i);
  if (removeMatch) {
    const target = removeMatch[1].trim().toLowerCase();
    const slideNumMatch = target.match(/slide\s*(\d+)/i);

    let removedIndex = -1;
    if (slideNumMatch) {
      const idx = parseInt(slideNumMatch[1], 10) - 1;
      if (idx >= 0 && idx < workingOutline.length) {
        removedIndex = idx;
      }
    } else {
      // Keyword matching
      removedIndex = workingOutline.findIndex((item) => {
        const itemLower = item.title.toLowerCase();
        return itemLower.includes(target) || (target.includes('application') && itemLower.includes('application'));
      });
    }

    if (removedIndex >= 0) {
      const removedItem = workingOutline[removedIndex];
      removed.push(removedItem.title);
      workingOutline.splice(removedIndex, 1);
      explanations.push(`Removed "${removedItem.title}"`);
    }
  }

  // 2. Handle Renames: "Rename slide 2 to Standard Form & Coefficients" or "Change standard form to X"
  const renameMatch = lower.match(/(?:rename|change)\s+(?:slide\s*(\d+)|["']?([^"']+)["']?)\s+to\s+["']?([^"'\n.,;]+)["']?/i);
  if (renameMatch) {
    const slideNumStr = renameMatch[1];
    const targetTitle = renameMatch[2]?.toLowerCase().trim();
    const newTitle = renameMatch[3].trim();

    let targetIdx = -1;
    if (slideNumStr) {
      const num = parseInt(slideNumStr, 10) - 1;
      if (num >= 0 && num < workingOutline.length) {
        targetIdx = num;
      }
    } else if (targetTitle) {
      targetIdx = workingOutline.findIndex((item) => item.title.toLowerCase().includes(targetTitle));
    }

    if (targetIdx >= 0 && newTitle) {
      const oldTitle = workingOutline[targetIdx].title;
      workingOutline[targetIdx] = {
        ...workingOutline[targetIdx],
        title: capitalizeTopic(newTitle),
        changeStatus: 'modified',
      };
      modified.push(workingOutline[targetIdx].title);
      explanations.push(`Renamed "${oldTitle}" to "${workingOutline[targetIdx].title}"`);
    }
  }

  // 3. Handle Content Modification / Solved Examples requirement:
  // "Include at least two solved examples for every method of solving quadratic equations"
  // "Add worked examples to factorisation"
  const examplesMatch = lower.match(/(?:include|add)\s+(?:at\s+least\s+)?(\w+|\d+)?\s*(?:solved|worked)?\s*examples?\s*(?:for|to|in)?\s*([^.,;\n]*)/i);
  if (examplesMatch && !lower.includes('before') && !lower.includes('after')) {
    const scope = (examplesMatch[2] || '').trim().toLowerCase();
    let modifiedAny = false;

    workingOutline = workingOutline.map((item) => {
      const itemTitleLower = item.title.toLowerCase();
      const isTarget =
        scope.length === 0 ||
        scope.includes('every method') ||
        scope.includes('all') ||
        itemTitleLower.includes('method') ||
        itemTitleLower.includes('solving') ||
        itemTitleLower.includes('factorisation') ||
        itemTitleLower.includes('factorization') ||
        itemTitleLower.includes('formula') ||
        itemTitleLower.includes('completing the square') ||
        (scope.length > 0 && itemTitleLower.includes(scope));

      if (isTarget) {
        modifiedAny = true;
        const currentGoal = item.actionGoal || item.objective || '';
        const exampleNote = 'Include at least two solved worked examples with step-by-step solutions.';
        const updatedGoal = currentGoal ? `${currentGoal}. ${exampleNote}` : exampleNote;

        if (!modified.includes(item.title)) {
          modified.push(item.title);
        }

        return {
          ...item,
          actionGoal: updatedGoal,
          objective: updatedGoal,
          changeStatus: 'modified',
        };
      }
      return item;
    });

    if (modifiedAny) {
      explanations.push('Updated slide requirements to include at least two step-by-step solved examples for solving methods');
    }
  }

  // 4. Handle Additions / Insertions:
  // e.g. "Add completing the square before introducing the quadratic formula. Also include the geometrical interpretation of the roots."
  // or "Remove real-life applications and add more numerical problems."
  const segments = extractAdditionSegments(instruction);
  for (const seg of segments) {
    const segLower = seg.toLowerCase().trim();
    if (!segLower) continue;

    const beforeMatch = seg.match(/(?:before|prior to)\s+(?:introducing\s+|the\s+)?["']?([^"'\n.,;]+)["']?/i);
    const afterMatch = seg.match(/(?:after|following)\s+(?:introducing\s+|the\s+)?["']?([^"'\n.,;]+)["']?/i);

    // Extract raw topic name from segment
    let rawTopic = seg
      .replace(/^(?:also\s+)?(?:add|include|insert|put|and\s+add)\s+/i, '')
      .replace(/(?:before|prior to|after|following)\s+.*$/i, '')
      .trim();

    if (rawTopic.endsWith('.')) rawTopic = rawTopic.slice(0, -1).trim();

    if (rawTopic) {
      const newTitle = formatSlideTitle(rawTopic, context.topic);
      const actionGoal = generateActionGoalForTopic(newTitle, context.topic);
      const layout = detectLayoutForTopic(newTitle);

      const newSlide: SlideOutlineItem = {
        id: `outline-slide-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: newTitle,
        actionGoal,
        objective: actionGoal,
        layoutArchetype: layout,
        selected: true,
        changeStatus: 'added',
      };

      let insertIdx = -1;

      if (beforeMatch) {
        const targetRaw = beforeMatch[1].trim().toLowerCase();
        const targetClean = targetRaw.replace(/^(?:introducing\s+|the\s+|a\s+|an\s+)/i, '').trim();
        insertIdx = workingOutline.findIndex((item) => {
          const t = item.title.toLowerCase();
          return t.includes(targetClean) || targetClean.includes(t);
        });
      } else if (afterMatch) {
        const targetRaw = afterMatch[1].trim().toLowerCase();
        const targetClean = targetRaw.replace(/^(?:introducing\s+|the\s+|a\s+|an\s+)/i, '').trim();
        const found = workingOutline.findIndex((item) => {
          const t = item.title.toLowerCase();
          return t.includes(targetClean) || targetClean.includes(t);
        });
        if (found >= 0) insertIdx = found + 1;
      }

      // If no before/after specified, place pedagogically:
      if (insertIdx === -1) {
        // If it's a summary/quiz topic, place at the end
        if (newTitle.toLowerCase().includes('quiz') || newTitle.toLowerCase().includes('summary') || newTitle.toLowerCase().includes('exit ticket')) {
          insertIdx = workingOutline.length;
        } else if (newTitle.toLowerCase().includes('geometric') || newTitle.toLowerCase().includes('roots')) {
          // Place near roots or discriminant
          const rootsIdx = workingOutline.findIndex((item) => item.title.toLowerCase().includes('root') || item.title.toLowerCase().includes('discriminant'));
          insertIdx = rootsIdx >= 0 ? rootsIdx + 1 : workingOutline.length - 1;
        } else if (newTitle.toLowerCase().includes('numerical') || newTitle.toLowerCase().includes('practice') || newTitle.toLowerCase().includes('problem')) {
          // Place before summary/quiz or at the end
          const summaryIdx = workingOutline.findIndex((item) => item.title.toLowerCase().includes('summary') || item.title.toLowerCase().includes('quiz'));
          insertIdx = summaryIdx >= 0 ? summaryIdx : workingOutline.length;
        } else {
          // Default: before the final summary/quiz slide, or at end
          const summaryIdx = workingOutline.findIndex((item) => item.title.toLowerCase().includes('summary') || item.title.toLowerCase().includes('quiz'));
          insertIdx = summaryIdx >= 0 ? summaryIdx : workingOutline.length;
        }
      }

      insertIdx = Math.max(0, Math.min(workingOutline.length, insertIdx));
      workingOutline.splice(insertIdx, 0, newSlide);
      added.push(newTitle);

      if (beforeMatch) {
        explanations.push(`Added "${newTitle}" before "${beforeMatch[1].trim()}"`);
      } else if (afterMatch) {
        explanations.push(`Added "${newTitle}" after "${afterMatch[1].trim()}"`);
      } else {
        explanations.push(`Added "${newTitle}" to the outline`);
      }
    }
  }

  // 5. Handle Move / Reorder: "Move slide 4 up" or "Move slide 3 to position 1"
  const moveMatch = lower.match(/move\s+(?:slide\s*(\d+)|["']?([^"']+)["']?)\s+(up|down|to\s+position\s*(\d+)|before|after)/i);
  if (moveMatch) {
    const slideNumStr = moveMatch[1];
    const targetTitle = moveMatch[2]?.toLowerCase().trim();
    const action = moveMatch[3];
    const targetPosStr = moveMatch[4];

    let sourceIdx = -1;
    if (slideNumStr) {
      sourceIdx = parseInt(slideNumStr, 10) - 1;
    } else if (targetTitle) {
      sourceIdx = workingOutline.findIndex((item) => item.title.toLowerCase().includes(targetTitle));
    }

    if (sourceIdx >= 0 && sourceIdx < workingOutline.length) {
      let destIdx = sourceIdx;
      if (action.includes('position') && targetPosStr) {
        destIdx = parseInt(targetPosStr, 10) - 1;
      } else if (action === 'up') {
        destIdx = sourceIdx - 1;
      } else if (action === 'down') {
        destIdx = sourceIdx + 1;
      }

      destIdx = Math.max(0, Math.min(workingOutline.length - 1, destIdx));
      if (destIdx !== sourceIdx) {
        const [movedItem] = workingOutline.splice(sourceIdx, 1);
        workingOutline.splice(destIdx, 0, movedItem);
        reordered = true;
        explanations.push(`Moved "${movedItem.title}" to position ${destIdx + 1}`);
      }
    }
  }

  // Renumber all slides sequentially (1-based)
  const finalOutline = workingOutline.map((item, idx) => ({
    ...item,
    slideNumber: idx + 1,
    id: item.id || `outline-slide-${idx + 1}`,
  }));

  // Build user-friendly explanation
  let explanation = '';
  if (explanations.length > 0) {
    explanation = explanations.join('. ') + '.';
  } else {
    explanation = `Reviewed your instruction: "${instruction}". All existing slides and pedagogical flow preserved.`;
  }

  return {
    explanation,
    updatedOutline: finalOutline,
    changes: {
      added,
      modified,
      removed,
      reordered,
    },
    appliedInstructions: instruction,
  };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function extractAdditionSegments(instruction: string): string[] {
  const segments: string[] = [];
  // Split on sentence boundaries (., ;, newline) or conjunctions before add/include
  const rawParts = instruction.split(/[.;\n]+|\band\s+(?=(?:add|include|insert|put)\b)/i);

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (/(?:add|include|insert|put)\b/i.test(trimmed)) {
      segments.push(trimmed);
    }
  }

  // If no parts matched but instruction starts with "add" or "include"
  if (segments.length === 0 && /(?:add|include|insert|put)\b/i.test(instruction)) {
    segments.push(instruction.trim());
  }

  return segments;
}

function formatSlideTitle(raw: string, topic: string): string {
  let cleaned = raw
    .replace(/^(?:the\s+|a\s+|an\s+)/i, '')
    .trim();

  // Common pedagogical title mappings
  const lower = cleaned.toLowerCase();
  if (lower.includes('completing the square')) {
    return 'Solving by Completing the Square';
  }
  if (lower.includes('geometrical interpretation') || lower.includes('geometric interpretation')) {
    return 'Geometrical Interpretation of Roots';
  }
  if (lower.includes('numerical problem') || lower.includes('practice problem')) {
    return 'Numerical Problem Solving & Practice';
  }
  if (lower.includes('real-life') || lower.includes('real world')) {
    return 'Real-World Applications & Modeling';
  }
  if (lower.includes('quiz') || lower.includes('check for understanding')) {
    return 'Interactive Quiz & Concept Check';
  }

  return capitalizeTopic(cleaned);
}

function generateActionGoalForTopic(title: string, topic: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('completing the square')) {
    return 'Step-by-step algebraic derivation and worked example of completing the square method';
  }
  if (lower.includes('geometrical') || lower.includes('geometric')) {
    return 'Explain parabola vertex, axis of symmetry, and roots as x-intercepts with visual diagrams';
  }
  if (lower.includes('numerical') || lower.includes('practice') || lower.includes('problem')) {
    return 'Provide graded numerical problem sets with full step-by-step solutions and common pitfalls';
  }
  if (lower.includes('factoris') || lower.includes('factoriz')) {
    return 'Explain factoring techniques with at least two worked numerical examples';
  }
  if (lower.includes('formula')) {
    return 'State and derive quadratic formula x = (-b ± √(b² - 4ac)) / (2a) with worked solution';
  }
  if (lower.includes('discriminant')) {
    return 'Explain Δ = b² - 4ac and how it determines real, repeated, or complex roots';
  }
  return `Generate in-depth pedagogical teaching material and visual demonstrations for ${title}`;
}

function detectLayoutForTopic(title: string): SlideLayoutType {
  const lower = title.toLowerCase();
  if (lower.includes('example') || lower.includes('problem') || lower.includes('practice') || lower.includes('numerical')) {
    return 'problem-solution';
  }
  if (lower.includes('formula') || lower.includes('derivation') || lower.includes('completing the square')) {
    return 'mathematical-explanation';
  }
  if (lower.includes('geometric') || lower.includes('diagram') || lower.includes('graph')) {
    return 'diagram-explanation';
  }
  if (lower.includes('quiz') || lower.includes('question')) {
    return 'summary-quiz';
  }
  if (lower.includes('comparison') || lower.includes('vs')) {
    return 'comparison';
  }
  return 'concept-explanation';
}

function capitalizeTopic(text: string): string {
  if (!text) return '';
  const minorWords = new Set(['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'by']);
  return text
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && minorWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export const outlineRefinementService = new OutlineRefinementService();
