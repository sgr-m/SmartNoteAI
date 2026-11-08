/**
 * promptTemplates.ts — Structured Teaching Content Generation Pipeline
 * Milestone 5: TASK-107
 * 
 * Converts teacher topic inputs into pedagogically structured, logically organized
 * presentation decks. Focuses purely on educational content quality, grade-level tuning,
 * schema validation, and offline curriculum template fallbacks.
 */

import {
  AIProviderType,
  CardComponentType,
  ContentGenerationResult,
  HtmlCardSpec,
  PresentationDeckSpec,
  PresentationThemeId,
  SlideContentSpec,
  SlideLayoutType,
  TeacherPromptInput,
  TeachingDifficulty,
  TeachingStyle,
  CustomSlideMaster,
  SlideOutlineItem,
  SlideValidationReport,
  DeckValidationResult,
} from '../../../shared/aiPresentationTypes';
import { aiProviderManager, AIProviderManager } from './aiProviderManager';
import { extractJsonFromResponse } from './adapters';
import { selectContentAwareLayout } from './slideLayoutEngine';
import {
  isLatexSyntax,
  cleanLatexDelimiters,
  autoFormatLatexFractions,
  autoFormatMathOperators,
  renderLatexHtml,
} from '../latexService';

// ─── Constants & Allowed Archetypes ──────────────────────────────────────────

export const ALLOWED_LAYOUT_TYPES: readonly SlideLayoutType[] = [
  'title-hero',
  'concept-overview',
  'concept-explanation',
  'two-column-split',
  'three-card-grid',
  'four-card-grid',
  'problem-solution',
  'definition-formula',
  'mathematical-explanation',
  'comparison',
  'diagram-explanation',
  'timeline-milestones',
  'step-process',
  'summary-quiz',
  'summary-takeaway',
] as const;

export const ALLOWED_CARD_TYPES: readonly CardComponentType[] = [
  'basic-info',
  'key-takeaway',
  'definition',
  'problem-solution',
  'metric-highlight',
  'quote',
  'comparison',
  'multi-column-feature',
  'numbered-steps',
  'timeline',
  'warning-note',
  'question-answer',
  'interactive-activity',
  'summary',
] as const;

export const DEFAULT_GRADE_LEVEL = 'High School (Grades 9-10)';
export const DEFAULT_LANGUAGE = 'English';
export const DEFAULT_DIFFICULTY: TeachingDifficulty = 'intermediate';
export const DEFAULT_TEACHING_STYLE: TeachingStyle = 'interactive';
export const DEFAULT_SLIDE_COUNT = 5;

// ─── Subject Keyword Auto-Detector ────────────────────────────────────────────

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Physics: ['physics', 'motion', 'gravity', 'velocity', 'force', 'energy', 'newton', 'optics', 'thermodynamics', 'circuit', 'quantum', 'relativity', 'wave'],
  Biology: ['biology', 'cell', 'organism', 'photosynthesis', 'genetics', 'dna', 'rna', 'evolution', 'ecosystem', 'mitosis', 'anatomy', 'respiration'],
  Chemistry: ['chemistry', 'chemical', 'reaction', 'atom', 'molecule', 'bond', 'acid', 'base', 'periodic', 'organic', 'stoichiometry', 'equilibrium'],
  Mathematics: ['math', 'mathematics', 'calculus', 'algebra', 'geometry', 'trigonometr', 'trig', 'integral', 'derivative', 'equation', 'matrix', 'probability', 'statistics', 'pythagor', 'place value', 'number system', 'arithmetic', 'fraction', 'decimal', 'percentage', 'integers', 'polynomial', 'quadratic', 'linear', 'exponent', 'expanded form', 'face value'],
  'Computer Science': ['computer', 'algorithm', 'data structure', 'programming', 'binary', 'python', 'javascript', 'sorting', 'tree', 'graph', 'database', 'network'],
  History: ['history', 'revolution', 'war', 'empire', 'ancient', 'civilization', 'renaissance', 'monarchy', 'independence', 'century', 'treaty'],
  Geography: ['geography', 'earth', 'map', 'climate', 'plate tectonics', 'river', 'mountain', 'continent', 'volcano', 'atmosphere', 'biome'],
  Literature: ['literature', 'poetry', 'novel', 'metaphor', 'shakespeare', 'character', 'theme', 'rhetoric', 'stanza', 'symbolism'],
};

export function detectSubjectFromTopic(topic: string): string {
  const clean = topic.trim();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (
      keywords.some((kw) => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}`, 'i');
        return regex.test(clean);
      })
    ) {
      return subject;
    }
  }
  return 'General Education';
}

// ─── Teacher Input Normalization ─────────────────────────────────────────────

export interface NormalizedTeacherInput {
  topic: string;
  subject: string;
  gradeLevel: string;
  language: string;
  difficulty: TeachingDifficulty;
  learningObjectives: string[];
  numberOfSlides: number;
  durationMinutes: number;
  teachingStyle: TeachingStyle;
  additionalInstructions: string;
  themeId: PresentationThemeId;
  customMasterId?: string;
  customMaster?: CustomSlideMaster;
  slideOutline?: SlideOutlineItem[];
}

export function normalizeTeacherInput(input: TeacherPromptInput): NormalizedTeacherInput {
  const cleanTopic = (input.topic || '').trim() || 'Untitled Lesson';
  const cleanSubject = (input.subject || '').trim() || detectSubjectFromTopic(cleanTopic);
  const cleanGrade = (input.gradeLevel || '').trim() || DEFAULT_GRADE_LEVEL;
  const cleanLang = (input.language || '').trim() || DEFAULT_LANGUAGE;
  const cleanDiff = input.difficulty || DEFAULT_DIFFICULTY;
  const cleanStyle = input.teachingStyle || DEFAULT_TEACHING_STYLE;

  let cleanOutline: SlideOutlineItem[] | undefined;
  if (Array.isArray(input.slideOutline) && input.slideOutline.length > 0) {
    cleanOutline = input.slideOutline
      .filter((o) => o && typeof o.title === 'string' && o.title.trim() && o.selected !== false)
      .map((o, idx) => ({
        id: o.id || `outline-${idx + 1}`,
        slideNumber: idx + 1,
        title: o.title.trim(),
        objective: o.objective?.trim() || o.actionGoal?.trim(),
        actionGoal: o.actionGoal?.trim(),
        teachingNotesHint: o.teachingNotesHint?.trim(),
        selected: o.selected !== false,
        changeStatus: o.changeStatus || 'unchanged',
        layoutArchetype:
          o.layoutArchetype ||
          selectContentAwareLayout({
            title: o.title,
            contentText: o.objective || o.actionGoal || '',
            slideIndex: idx,
            totalSlides: input.slideOutline!.length,
          }),
      }));
  }

  const count =
    cleanOutline && cleanOutline.length > 0
      ? cleanOutline.length
      : Math.max(3, Math.min(15, Number(input.numberOfSlides) || DEFAULT_SLIDE_COUNT));

  const duration = Number(input.durationMinutes) || Math.max(15, count * 5);
  const theme = input.themeId || 'modern-academic';

  let objectives: string[] = [];
  if (Array.isArray(input.learningObjectives)) {
    objectives = input.learningObjectives.map((o) => String(o).trim()).filter(Boolean);
  } else if (typeof input.learningObjectives === 'string' && input.learningObjectives.trim()) {
    objectives = input.learningObjectives
      .split(/[\n,;]+/)
      .map((o) => o.trim())
      .filter(Boolean);
  }

  return {
    topic: cleanTopic,
    subject: cleanSubject,
    gradeLevel: cleanGrade,
    language: cleanLang,
    difficulty: cleanDiff,
    learningObjectives: objectives,
    numberOfSlides: count,
    durationMinutes: duration,
    teachingStyle: cleanStyle,
    additionalInstructions: (input.additionalInstructions || '').trim(),
    themeId: theme,
    customMasterId: input.customMasterId,
    customMaster: input.customMaster,
    slideOutline: cleanOutline,
  };
}

// ─── Pedagogical Sequence Planner ─────────────────────────────────────────────

export interface SlideSequencePlanItem {
  slideNumber: number;
  role: string;
  recommendedLayout: SlideLayoutType;
  cardTypes: CardComponentType[];
}

export function planPedagogicalSequence(slideCount: number, _subject?: string): SlideSequencePlanItem[] {
  const count = Math.max(3, Math.min(15, slideCount));

  if (count === 3) {
    return [
      { slideNumber: 1, role: 'Title & Objectives', recommendedLayout: 'title-hero', cardTypes: ['basic-info', 'key-takeaway'] },
      { slideNumber: 2, role: 'Core Concept & Breakdown', recommendedLayout: 'two-column-split', cardTypes: ['definition', 'problem-solution'] },
      { slideNumber: 3, role: 'Summary & Knowledge Check', recommendedLayout: 'summary-quiz', cardTypes: ['summary', 'question-answer'] },
    ];
  }

  if (count === 4) {
    return [
      { slideNumber: 1, role: 'Title & Introduction', recommendedLayout: 'title-hero', cardTypes: ['basic-info', 'key-takeaway'] },
      { slideNumber: 2, role: 'Fundamental Concepts & Terms', recommendedLayout: 'definition-formula', cardTypes: ['definition', 'basic-info'] },
      { slideNumber: 3, role: 'Worked Example & Application', recommendedLayout: 'problem-solution', cardTypes: ['problem-solution', 'numbered-steps'] },
      { slideNumber: 4, role: 'Recap & Quick Quiz', recommendedLayout: 'summary-quiz', cardTypes: ['summary', 'question-answer'] },
    ];
  }

  // 5 slides (Standard default)
  if (count === 5) {
    return [
      { slideNumber: 1, role: 'Title & Learning Objectives', recommendedLayout: 'title-hero', cardTypes: ['basic-info', 'key-takeaway'] },
      { slideNumber: 2, role: 'Core Foundation & Terminology', recommendedLayout: 'definition-formula', cardTypes: ['definition', 'metric-highlight'] },
      { slideNumber: 3, role: 'Step-by-Step Mechanism / Worked Problem', recommendedLayout: 'problem-solution', cardTypes: ['problem-solution', 'numbered-steps'] },
      { slideNumber: 4, role: 'Real-World Applications & Misconceptions', recommendedLayout: 'two-column-split', cardTypes: ['multi-column-feature', 'warning-note'] },
      { slideNumber: 5, role: 'Lesson Summary & Knowledge Check', recommendedLayout: 'summary-quiz', cardTypes: ['summary', 'question-answer'] },
    ];
  }

  // 6 or more slides
  const items: SlideSequencePlanItem[] = [
    { slideNumber: 1, role: 'Title & Lesson Goals', recommendedLayout: 'title-hero', cardTypes: ['basic-info', 'key-takeaway'] },
    { slideNumber: 2, role: 'Prerequisite Knowledge & Hook', recommendedLayout: 'concept-overview', cardTypes: ['basic-info', 'quote'] },
    { slideNumber: 3, role: 'Core Concept & Formal Definitions', recommendedLayout: 'definition-formula', cardTypes: ['definition', 'metric-highlight'] },
    { slideNumber: 4, role: 'Detailed Mechanism / Step-by-Step', recommendedLayout: 'three-card-grid', cardTypes: ['numbered-steps', 'multi-column-feature'] },
  ];

  if (count >= 7) {
    items.push({
      slideNumber: 5,
      role: 'Comparative Analysis / Contrasting Cases',
      recommendedLayout: 'two-column-split',
      cardTypes: ['comparison', 'problem-solution'],
    });
  }

  if (count >= 8) {
    items.push({
      slideNumber: items.length + 1,
      role: 'Real-World Applications & Industry Impact',
      recommendedLayout: 'four-card-grid',
      cardTypes: ['multi-column-feature', 'timeline'],
    });
  }

  if (count >= 9) {
    items.push({
      slideNumber: items.length + 1,
      role: 'Common Misconceptions & Exam Traps',
      recommendedLayout: 'two-column-split',
      cardTypes: ['warning-note', 'basic-info'],
    });
  }

  // Fill intermediate slides up to count - 1
  while (items.length < count - 1) {
    items.push({
      slideNumber: items.length + 1,
      role: `Deep Dive / Practical Case ${items.length - 3}`,
      recommendedLayout: 'two-column-split',
      cardTypes: ['problem-solution', 'basic-info'],
    });
  }

  // Final summary slide
  items.push({
    slideNumber: count,
    role: 'Lesson Review & Check-for-Understanding Quiz',
    recommendedLayout: 'summary-quiz',
    cardTypes: ['summary', 'question-answer'],
  });

  return items;
}

// ─── Prompt Engineering & Prompt Builders ────────────────────────────────────

export function buildTeachingPresentationPrompt(rawInput: TeacherPromptInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const input = normalizeTeacherInput(rawInput);
  const sequence = planPedagogicalSequence(input.numberOfSlides, input.subject);

  const sequenceInstructions =
    input.slideOutline && input.slideOutline.length > 0
      ? input.slideOutline
          .map(
            (s) =>
              `- Slide ${s.slideNumber}: Title: "${s.title}" (Recommended layout: "${s.layoutArchetype || 'concept-explanation'}"${s.objective ? `, Action/Goal: "${s.objective}"` : ''})`
          )
          .join('\n')
      : sequence
          .map(
            (s) =>
              `- Slide ${s.slideNumber}: "${s.role}" (Recommended layout: "${s.recommendedLayout}", Card types: ${s.cardTypes.join(', ')})`
          )
          .join('\n');

  const outlineInstructions =
    input.slideOutline && input.slideOutline.length > 0
      ? `\nTEACHER CUSTOM SLIDE OUTLINE:\nThe teacher has provided an explicit outline of slide titles. You MUST generate exactly ${input.slideOutline.length} slides with the following titles and actions:\n` +
        input.slideOutline
          .map((o) => `  * Slide ${o.slideNumber}: Title: "${o.title}" ${o.objective ? `(Goal: ${o.objective})` : ''}`)
          .join('\n') +
        `\nFor each slide title, understand its pedagogical role and generate rich, complete definitions, equations, derivations, or worked problems.`
      : '';

  const objectivesText =
    input.learningObjectives.length > 0
      ? `Specific Learning Objectives:\n${input.learningObjectives.map((o) => `  * ${o}`).join('\n')}`
      : 'Generate 2-3 clear Bloom’s taxonomy learning goals appropriate for this topic.';

  const systemPrompt = `You are a distinguished master teacher and curriculum instructional designer.
Your task is to generate a comprehensive, highly engaging, pedagogically rigorous classroom slide presentation on the requested topic: "${input.topic}".

TEACHING SPECIFICATIONS:
- Topic: ${input.topic}
- Subject: ${input.subject}
- Grade / Education Level: ${input.gradeLevel}
- Difficulty Level: ${input.difficulty}
- Teaching Style: ${input.teachingStyle}
- Language: ${input.language}
- Total Slides: exactly ${input.numberOfSlides}
- Target Duration: ~${input.durationMinutes} minutes
- Learning Goals: ${objectivesText}

PEDAGOGICAL EXCELLENCE RULES:
1. SUBSTANTIVE CONTENT: Do NOT produce slides with only empty headings, generic bullet points, or placeholder text. Every slide must contain accurate, rich, age-appropriate educational explanations, concrete definitions, exact formulas, and step-by-step reasoning. Empty slides or slides with fewer than 20-30 words will be rejected by our curriculum validator.
2. FORMULA & MATHEMATICAL NOTATION: All formulas and scientific equations must use valid standard LaTeX syntax (KaTeX compatible). Delimit equations with $$...$$ (e.g. $$ax^2 + bx + c = 0$$, $$\\Delta = b^2 - 4ac$$, $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$). Never use ASCII approximations like x^2, (-b +/- sqrt(D))/2a, or plain-text slashes.
3. WORKED NUMERICAL EXAMPLES: When introducing a solving method (such as factoring, substitution, or formula solving), include a concrete worked numerical problem with clear step-by-step algebraic manipulation, intermediate steps, and final verified solution.
4. TOPIC-SPECIFIC PEDAGOGICAL DEPTH: If the lesson is "Quadratic Equations":
   - Standard Form: Define quadratic polynomials, canonical form $$ax^2 + bx + c = 0$$, invariant condition $$a \\ne 0$$, role of coefficients a, b, c, and a worked example (e.g. $$3x^2 - 5x + 2 = 0 \\implies a=3, b=-5, c=2$$).
   - Roots & Zeroes: Define roots as algebraic solutions where $$f(x)=0$$ and geometric x-intercepts of the parabola.
   - Discriminant: Define invariant $$\\Delta = b^2 - 4ac$$, describe the 3 regimes ($$\\Delta > 0$$, $$\\Delta = 0$$, $$\\Delta < 0$$), and highlight common calculation traps with negative signs.
   - Solving by Factorisation: Step-by-step worked example solving $$x^2 - 5x + 6 = 0 \\implies (x-2)(x-3)=0 \\implies x=2,3$$ with verification.
   - Quadratic Formula: Universal formula $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ and explanation/derivation.
5. GRADE-LEVEL TUNING: Tailor technical terms and vocabulary to ${input.gradeLevel}. Introduce key vocabulary clearly with pronunciation/etymology where helpful.
6. SEPARATION OF CONCERNS: Separate content from visual styling. Never write CSS, colors, or pixel coordinates in your output. You specify the semantic content, card types, badges, problem statements, and speaker notes; the graphics engine handles visual layout.
7. VARIETY OF SLIDE ARCHETYPES: Use diverse layouts across the deck. Do not make every slide a bullet list. Use:
   - "title-hero": Welcome, subject, grade level, and lesson agenda.
   - "concept-overview": Foundational principle with deep explanatory text.
   - "two-column-split": Left/right comparisons or concept vs example.
   - "definition-formula": Exact formal definitions, pronunciation, and LaTeX equations.
   - "problem-solution": Concrete problem statement with step-by-step worked answer.
   - "summary-quiz": Lesson review checklist and classroom check-for-understanding quiz question.
8. SPEAKER NOTES: Provide 2-3 sentences of lecture talking points, discussion prompts, or questions to ask students during class.

RECOMMENDED PEDAGOGICAL SLIDE SEQUENCE:
${sequenceInstructions}

JSON FORMAT REQUIREMENTS:
You must respond strictly with valid JSON conforming to the PresentationDeckSpec schema.
No markdown backticks (like \`\`\`json), no introductory text, no pleasantries. Pure JSON only.`;

  const userPrompt = `Generate a ${input.numberOfSlides}-slide educational presentation on:
TOPIC: "${input.topic}"
SUBJECT: ${input.subject}
GRADE LEVEL: ${input.gradeLevel}
DIFFICULTY: ${input.difficulty}
${objectivesText}
${input.additionalInstructions ? `ADDITIONAL TEACHER INSTRUCTIONS: ${input.additionalInstructions}` : ''}
${outlineInstructions}

Respond with pure JSON conforming to this schema:
{
  "topic": "${input.topic}",
  "subject": "${input.subject}",
  "gradeLevel": "${input.gradeLevel}",
  "themeId": "${input.themeId}",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "subtitle": "Optional Subtitle Pill",
      "layout": "title-hero",
      "notes": "Teacher talking points for this slide...",
      "cards": [
        {
          "cardType": "basic-info",
          "title": "Card Title",
          "badge": "Key Concept",
          "body": "Clear pedagogical paragraph...",
          "bulletPoints": ["Key point 1", "Key point 2"]
        }
      ]
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}

// ─── Strict Schema Validation & Repair Engine ─────────────────────────────────

export interface ValidationResult<T> {
  isValid: boolean;
  deck: T;
  errors: string[];
  repaired: boolean;
  warnings?: string[];
  slideReports?: SlideValidationReport[];
  status?: 'success' | 'partial' | 'failed';
  overallScore?: number;
}

/**
 * Count total words in a string safely.
 */
export function countWords(text?: string | null): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Extracts all math formulas from a slide (both properties and embedded math delimiters).
 */
export function extractSlideFormulas(slide: SlideContentSpec): string[] {
  const formulas: string[] = [];
  if (slide.formula && slide.formula.trim()) {
    formulas.push(slide.formula.trim());
  }
  if (Array.isArray(slide.cards)) {
    slide.cards.forEach((c) => {
      if (c.formula && c.formula.trim()) {
        formulas.push(c.formula.trim());
      }
      if (c.problem?.formula && c.problem.formula.trim()) {
        formulas.push(c.problem.formula.trim());
      }
      if (c.solution?.formula && c.solution.formula.trim()) {
        formulas.push(c.solution.formula.trim());
      }
      const textToScan = [
        typeof c.body === 'string' ? c.body : Array.isArray(c.body) ? c.body.join(' ') : '',
        c.formalDefinition || '',
        ...(c.bulletPoints || []),
      ].join(' ');

      const matches = textToScan.match(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g);
      if (matches) {
        formulas.push(...matches);
      }
    });
  }
  return formulas;
}

/**
 * Validates and auto-heals LaTeX formulas with KaTeX syntax checks.
 */
export function validateAndHealFormula(formula: string): {
  isValid: boolean;
  healedFormula: string;
  error?: string;
} {
  if (!formula || !formula.trim()) {
    return { isValid: false, healedFormula: '', error: 'Empty formula expression' };
  }

  let healed = autoFormatLatexFractions(formula.trim());
  healed = autoFormatMathOperators(healed);

  const clean = cleanLatexDelimiters(healed);
  const res = renderLatexHtml(clean, true);

  if (res.success) {
    return { isValid: true, healedFormula: healed };
  }

  // Attempt common syntax repair: e.g. balance unclosed braces
  const openBraces = (healed.match(/\{/g) || []).length;
  const closeBraces = (healed.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    const fixed = healed + '}'.repeat(openBraces - closeBraces);
    if (renderLatexHtml(cleanLatexDelimiters(fixed), true).success) {
      return { isValid: true, healedFormula: fixed };
    }
  }

  return { isValid: false, healedFormula: formula, error: res.error || 'KaTeX parsing error' };
}

/**
 * Validates an individual slide's educational content quality, LaTeX syntax,
 * content density, and mandatory pedagogical elements.
 */
export function validateSlideContent(
  rawSlide: unknown,
  context: {
    topic: string;
    subject?: string;
    gradeLevel?: string;
    slideIndex: number;
    totalSlides?: number;
    outlineItem?: SlideOutlineItem;
    normInput?: NormalizedTeacherInput;
  }
): {
  report: SlideValidationReport;
  repairedSlide: SlideContentSpec;
  slideErrors: string[];
  isRepaired: boolean;
} {
  const slideNum = (rawSlide as any)?.slideNumber || context.slideIndex + 1;
  const slideErrors: string[] = [];
  const issues: string[] = [];
  let isRepaired = false;

  const norm =
    context.normInput ||
    normalizeTeacherInput({
      topic: context.topic,
      subject: context.subject,
      gradeLevel: context.gradeLevel,
      numberOfSlides: context.totalSlides || 5,
    });

  if (!rawSlide || typeof rawSlide !== 'object') {
    slideErrors.push(`Slide ${slideNum} is malformed; replaced with fallback slide.`);
    const fallback = generateOutlineDrivenSlides(
      [{ slideNumber: slideNum, title: context.outlineItem?.title || `Section ${slideNum}: ${context.topic}` }],
      norm
    )[0];
    return {
      report: {
        slideNumber: slideNum,
        title: fallback.title,
        status: 'failed',
        score: 0,
        issues: ['Slide is malformed or not an object.'],
        hasFormulas: Boolean(fallback.formula || fallback.cards?.some((c) => c.formula)),
        validLatex: true,
        wordCount: 50,
        hasExplanationOrExample: true,
      },
      repairedSlide: fallback,
      slideErrors,
      isRepaired: true,
    };
  }

  const s = rawSlide as Record<string, unknown>;

  // 1. Title validation
  let title = typeof s.title === 'string' ? s.title.trim() : '';
  if (!title) {
    title = `Part ${slideNum}: ${context.topic}`;
    slideErrors.push(`Slide ${slideNum} missing title; generated "${title}".`);
    isRepaired = true;
  }

  // 2. Subtitle & Layout
  const subtitle = typeof s.subtitle === 'string' && s.subtitle.trim() ? s.subtitle.trim() : undefined;
  let layout: SlideLayoutType = 'concept-overview';
  if (typeof s.layout === 'string' && ALLOWED_LAYOUT_TYPES.includes(s.layout as SlideLayoutType)) {
    layout = s.layout as SlideLayoutType;
  } else {
    slideErrors.push(`Slide ${slideNum} had unknown layout "${s.layout}"; defaulted to "${layout}".`);
    isRepaired = true;
  }

  // 3. Notes & Visuals
  const notes = typeof s.notes === 'string' && s.notes.trim() ? s.notes.trim() : `Discuss ${title} with the class.`;
  const diagram = s.diagram && typeof s.diagram === 'object' ? (s.diagram as any) : undefined;
  const illustrationKeyword =
    typeof s.illustrationKeyword === 'string' && s.illustrationKeyword.trim() ? s.illustrationKeyword.trim() : undefined;

  // 4. Validate cards
  let rawCards = Array.isArray(s.cards) ? s.cards : [];
  if (rawCards.length === 0) {
    slideErrors.push(`Slide ${slideNum} had no cards; generated standard content card.`);
    isRepaired = true;
    rawCards = [
      {
        cardType: 'basic-info',
        title: title,
        body: `Key instructional notes for ${title}.`,
        bulletPoints: ['Important discussion point 1', 'Important discussion point 2'],
      },
    ];
  }

  const validatedCards: HtmlCardSpec[] = [];

  rawCards.forEach((rawCard, cIdx) => {
    if (!rawCard || typeof rawCard !== 'object') return;
    const c = rawCard as Record<string, unknown>;

    let cardType: CardComponentType = 'basic-info';
    if (typeof c.cardType === 'string' && ALLOWED_CARD_TYPES.includes(c.cardType as CardComponentType)) {
      cardType = c.cardType as CardComponentType;
    }

    const cardTitle = typeof c.title === 'string' && c.title.trim() ? c.title.trim() : undefined;
    const badge = typeof c.badge === 'string' && c.badge.trim() ? c.badge.trim() : undefined;
    const sub = typeof c.subtitle === 'string' && c.subtitle.trim() ? c.subtitle.trim() : undefined;

    let body: string | undefined;
    if (typeof c.body === 'string' && c.body.trim()) {
      body = c.body.trim();
    } else if (Array.isArray(c.body)) {
      body = c.body.map(String).join('\n\n');
    }

    let bulletPoints: string[] | undefined;
    if (Array.isArray(c.bulletPoints)) {
      bulletPoints = c.bulletPoints.map((bp) => String(bp).trim()).filter(Boolean);
    }

    const hasSpecializedContent = Boolean(
      c.definition ||
      c.problemSolution ||
      c.steps ||
      c.features ||
      c.timelineEvents ||
      c.metric ||
      c.quote ||
      c.qa ||
      c.term ||
      c.formalDefinition ||
      c.metricValue ||
      c.quoteText ||
      c.question ||
      c.answer ||
      c.takeaways ||
      c.formula
    );

    if (!body && (!bulletPoints || bulletPoints.length === 0) && !hasSpecializedContent) {
      body = `Key concept for ${cardTitle || title}.`;
      isRepaired = true;
    }

    const validatedCard: HtmlCardSpec = {
      id: `card-${slideNum}-${cIdx + 1}`,
      cardType,
      title: cardTitle,
      subtitle: sub,
      badge,
      body,
      bulletPoints,
    };

    if (c.definition && typeof c.definition === 'object') validatedCard.definition = c.definition as any;
    if (c.problemSolution && typeof c.problemSolution === 'object') validatedCard.problemSolution = c.problemSolution as any;
    if (c.metric && typeof c.metric === 'object') validatedCard.metric = c.metric as any;
    if (c.quote && typeof c.quote === 'object') validatedCard.quote = c.quote as any;
    if (c.qa && typeof c.qa === 'object') validatedCard.qa = c.qa as any;
    if (Array.isArray(c.steps)) validatedCard.steps = c.steps as any;
    if (Array.isArray(c.features)) validatedCard.features = c.features as any;
    if (Array.isArray(c.timelineEvents)) validatedCard.timelineEvents = c.timelineEvents as any;

    if (c.term) validatedCard.term = String(c.term);
    if (c.formalDefinition) validatedCard.formalDefinition = String(c.formalDefinition);
    if (c.pronunciation) validatedCard.pronunciation = String(c.pronunciation);
    if (c.partOfSpeech) validatedCard.partOfSpeech = String(c.partOfSpeech);
    if (c.example) validatedCard.example = String(c.example);
    if (c.metricValue) validatedCard.metricValue = String(c.metricValue);
    if (c.metricLabel) validatedCard.metricLabel = String(c.metricLabel);
    if (c.metricSubtext) validatedCard.metricSubtext = String(c.metricSubtext);
    if (c.quoteText) validatedCard.quoteText = String(c.quoteText);
    if (c.quoteAuthor) validatedCard.quoteAuthor = String(c.quoteAuthor);
    if (c.quoteSource) validatedCard.quoteSource = String(c.quoteSource);
    if (c.question) validatedCard.question = String(c.question);
    if (c.answer) validatedCard.answer = String(c.answer);
    if (c.explanation) validatedCard.explanation = String(c.explanation);
    if (c.revealPrompt) validatedCard.revealPrompt = String(c.revealPrompt);
    if (Array.isArray(c.takeaways)) validatedCard.takeaways = c.takeaways.map(String);
    if (c.recapNote) validatedCard.recapNote = String(c.recapNote);
    if (c.formula) validatedCard.formula = String(c.formula);

    validatedCards.push(validatedCard);
  });

  // Calculate total word count across cards
  let totalWordCount = 0;
  validatedCards.forEach((c) => {
    if (c.body) totalWordCount += countWords(typeof c.body === 'string' ? c.body : c.body.join(' '));
    if (c.bulletPoints) c.bulletPoints.forEach((bp) => (totalWordCount += countWords(bp)));
    if (c.formalDefinition) totalWordCount += countWords(c.formalDefinition);
    if (c.example) totalWordCount += countWords(c.example);
    if (c.problemSolution) {
      totalWordCount += countWords(c.problemSolution.problemText) + countWords(c.problemSolution.solutionText);
    }
    if (c.steps) {
      c.steps.forEach((st: any) => {
        totalWordCount += countWords(st.title) + countWords(st.description || st.content);
      });
    }
    if (c.features) {
      c.features.forEach((f: any) => {
        totalWordCount += countWords(f.title) + countWords(f.description);
      });
    }
  });

  // 5. Formula validation
  let slideFormula = typeof s.formula === 'string' && s.formula.trim() ? s.formula.trim() : undefined;
  let validLatex = true;
  const allFormulas: string[] = [];
  if (slideFormula) allFormulas.push(slideFormula);
  validatedCards.forEach((c) => {
    if (c.formula) allFormulas.push(c.formula);
  });

  allFormulas.forEach((f) => {
    const valRes = validateAndHealFormula(f);
    if (!valRes.isValid) {
      validLatex = false;
      issues.push(`Invalid LaTeX syntax in formula: "${f}" (${valRes.error})`);
    } else {
      if (slideFormula === f) slideFormula = valRes.healedFormula;
      validatedCards.forEach((c) => {
        if (c.formula === f) c.formula = valRes.healedFormula;
      });
    }
  });

  const hasFormulas = allFormulas.length > 0;

  // 6. Pedagogical Element & Content Density Checks
  const lowerTitle = title.toLowerCase();
  const isMathOrStem = /math|algebra|geometry|calculus|quadratic|equation|physics|force|motion/i.test(
    context.topic + ' ' + (context.subject || '')
  );

  if (
    isMathOrStem &&
    (lowerTitle.includes('standard form') ||
      lowerTitle.includes('formula') ||
      lowerTitle.includes('equation') ||
      lowerTitle.includes('discriminant') ||
      lowerTitle.includes('derivation') ||
      lowerTitle.includes('theorem'))
  ) {
    if (!hasFormulas) {
      issues.push('Mathematical slide topic recommends at least one LaTeX formula expression.');
    }
  }

  if (
    lowerTitle.includes('factor') ||
    lowerTitle.includes('solve') ||
    lowerTitle.includes('example') ||
    lowerTitle.includes('worked') ||
    lowerTitle.includes('step') ||
    lowerTitle.includes('solution')
  ) {
    const hasWorked = Boolean(
      (s as any).workedExample ||
        validatedCards.some((c) => c.problemSolution || (c as any).problem || c.steps)
    );
    if (!hasWorked) {
      issues.push('Method/practice slide topic recommends a concrete worked problem or step-by-step example.');
    }
  }

  if (totalWordCount < 15 && validatedCards.every((c) => !c.formula && !c.definition && !c.problemSolution)) {
    issues.push(`Slide lacks substantive teaching content (only ${totalWordCount} words).`);
  }

  const hasExplanationOrExample = Boolean(
    validatedCards.some((c) => c.body || c.example || c.problemSolution || c.steps || c.definition || c.formalDefinition)
  );

  // 7. Quality Score calculation
  let score = 100;
  if (totalWordCount < 10) score -= 25;
  else if (totalWordCount < 20) score -= 10;
  if (!validLatex) score -= 20;
  if (issues.length > 0) score -= Math.min(25, issues.length * 5);
  score = Math.max(0, Math.min(100, score));

  const rawStatus: 'success' | 'partial' | 'failed' = score >= 80 ? 'success' : score >= 50 ? 'partial' : 'failed';

  let finalSlide: SlideContentSpec = {
    slideNumber: slideNum,
    title,
    subtitle,
    layout,
    formula: slideFormula,
    workedExample: (s as any).workedExample,
    cards: validatedCards,
    notes,
    diagram,
    illustrationKeyword,
  };

  return {
    report: {
      slideNumber: slideNum,
      title: finalSlide.title,
      status: rawStatus,
      score,
      issues,
      hasFormulas: Boolean(finalSlide.formula || finalSlide.cards?.some((c) => c.formula)),
      validLatex,
      wordCount: totalWordCount,
      hasExplanationOrExample,
    },
    repairedSlide: finalSlide,
    slideErrors,
    isRepaired,
  };
}

export function validateDeckContent(
  rawDeck: unknown,
  requestedInput?: TeacherPromptInput
): DeckValidationResult & ValidationResult<PresentationDeckSpec> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let repaired = false;

  const normInput = requestedInput ? normalizeTeacherInput(requestedInput) : undefined;

  if (!rawDeck || typeof rawDeck !== 'object') {
    errors.push('Raw presentation output is not an object.');
    const fallback = generateCurriculumTemplateFallback(requestedInput || { topic: 'Untitled Presentation' });
    return {
      isValid: false,
      deck: fallback,
      errors,
      warnings,
      repaired: true,
      slideReports: [],
      status: 'failed',
      overallScore: 0,
    };
  }

  const obj = rawDeck as Record<string, unknown>;

  // 1. Topic
  let topic = typeof obj.topic === 'string' ? obj.topic.trim() : '';
  if (!topic) {
    topic = requestedInput?.topic ? requestedInput.topic.trim() : 'Classroom Presentation';
    errors.push('Missing presentation topic; applied fallback topic.');
    repaired = true;
  }

  // 2. Subject & Grade
  const subject =
    typeof obj.subject === 'string' && obj.subject.trim()
      ? obj.subject.trim()
      : requestedInput?.subject || detectSubjectFromTopic(topic);

  const gradeLevel =
    typeof obj.gradeLevel === 'string' && obj.gradeLevel.trim()
      ? obj.gradeLevel.trim()
      : requestedInput?.gradeLevel || DEFAULT_GRADE_LEVEL;

  const themeId = (
    typeof obj.themeId === 'string' && obj.themeId.trim()
      ? obj.themeId.trim()
      : requestedInput?.themeId || 'modern-academic'
  ) as PresentationThemeId;

  // 3. Slides array
  let rawSlides = Array.isArray(obj.slides) ? obj.slides : [];
  if (rawSlides.length === 0) {
    errors.push('Presentation deck contains zero slides; generating structured slide outline.');
    const fallback = generateCurriculumTemplateFallback({
      topic,
      subject,
      gradeLevel,
      numberOfSlides: requestedInput?.numberOfSlides || DEFAULT_SLIDE_COUNT,
    });
    return {
      isValid: false,
      deck: fallback,
      errors,
      warnings,
      repaired: true,
      slideReports: [],
      status: 'failed',
      overallScore: 0,
    };
  }

  // Clamp excessive slides to 20 maximum
  if (rawSlides.length > 20) {
    rawSlides = rawSlides.slice(0, 20);
    errors.push('Deck exceeded 20 slides; truncated to 20 slides.');
    repaired = true;
  }

  const validatedSlides: SlideContentSpec[] = [];
  const slideReports: SlideValidationReport[] = [];

  rawSlides.forEach((rawSlide, idx) => {
    const { report, repairedSlide, slideErrors, isRepaired } = validateSlideContent(rawSlide, {
      topic,
      subject,
      gradeLevel,
      slideIndex: idx,
      totalSlides: rawSlides.length,
      outlineItem: normInput?.slideOutline?.[idx],
      normInput,
    });

    slideReports.push(report);

    if (slideErrors.length > 0) {
      errors.push(...slideErrors);
    }
    if (isRepaired) {
      repaired = true;
    }
    if (report.issues.length > 0 && slideErrors.length === 0) {
      warnings.push(`Slide ${report.slideNumber} ("${report.title}"): ${report.issues.join('; ')}`);
    }

    validatedSlides.push(repairedSlide);
  });

  const overallScore = Math.round(
    slideReports.reduce((sum, r) => sum + r.score, 0) / Math.max(1, slideReports.length)
  );
  const deckStatus: 'success' | 'partial' | 'failed' =
    overallScore >= 80 ? 'success' : overallScore >= 50 ? 'partial' : 'failed';

  const finalDeck: PresentationDeckSpec = {
    topic,
    subject,
    gradeLevel,
    themeId,
    slides: validatedSlides,
    source: (obj.source as 'ai' | 'curriculum-template') || 'ai',
  };

  return {
    isValid: errors.length === 0,
    deck: finalDeck,
    errors,
    warnings,
    repaired,
    slideReports,
    status: deckStatus,
    overallScore,
  };
}

// ─── Outline-Driven Fallback Generation ───────────────────────────────────────

/**
 * Generates tailored, substantive educational slides driven directly by the teacher's
 * custom slide outline titles and objectives.
 */
export function generateOutlineDrivenSlides(
  outlineOrTopic: SlideOutlineItem[] | string,
  normOrOutline?: NormalizedTeacherInput | SlideOutlineItem[],
  gradeLevel = 'Grade 10',
  difficulty: TeachingDifficulty = 'intermediate'
): SlideContentSpec[] {
  let outline: SlideOutlineItem[];
  let norm: NormalizedTeacherInput;

  if (Array.isArray(outlineOrTopic)) {
    outline = outlineOrTopic;
    const inferredTopic =
      outline.find((o) => /quadratic/i.test(o?.title || ''))
        ? 'Quadratic Equations'
        : outline.find((o) => /place value/i.test(o?.title || ''))
        ? 'Place Value System'
        : outline.find((o) => /python/i.test(o?.title || ''))
        ? 'Python Programming'
        : 'Classroom Lesson';
    norm =
      (normOrOutline as NormalizedTeacherInput) ||
      normalizeTeacherInput({ topic: inferredTopic, gradeLevel, difficulty });
  } else {
    outline = Array.isArray(normOrOutline) ? normOrOutline : [];
    norm = normalizeTeacherInput({
      topic: outlineOrTopic,
      gradeLevel,
      difficulty,
    });
  }

  return outline.map((item, idx) => {
    const slideNum = item.slideNumber || idx + 1;
    const title = item.title;
    let subtitle = `${norm.subject} • ${norm.gradeLevel}`;
    const layout =
      item.layoutArchetype ||
      selectContentAwareLayout({
        title,
        contentText: item.objective || '',
        slideIndex: idx,
        totalSlides: outline.length,
      });

    let cards: HtmlCardSpec[] = [];
    let notes = item.teachingNotesHint || `Guide students through ${title}.`;
    const lowerTitle = title.toLowerCase();

    const isPythonTopic =
      /python|variable|data type|programming|coding|algorithm|syntax|identifier/i.test(norm.topic) ||
      (/computer science|information technology|coding/i.test(norm.subject) && !/place value|fraction|arithmetic|math/i.test(norm.topic)) ||
      (/python|variable|data type|type\(\)|pep 8|snake_case|casting/i.test(title) && !/place value|fraction|math/i.test(norm.topic));
    const isPython = isPythonTopic;

    const isPlaceValueTopic =
      /place value|place-value|number system|base 10|base-10|digit value/i.test(norm.topic) ||
      ((/place value|expanded form|face value|periods/i.test(title) || (lowerTitle.includes('place') && lowerTitle.includes('value'))) &&
        (/place value|number/i.test(norm.topic) || norm.subject === 'Mathematics') &&
        !/quadratic|parabola/i.test(norm.topic));

    const isTopicActuallyQuadratic =
      /quadratic|parabola/i.test(norm.topic) || outline.some((o) => /quadratic/i.test(o?.title || ''));
    const isQuadraticTopic =
      (isTopicActuallyQuadratic && !isPlaceValueTopic && !isPythonTopic) ||
      (!isPlaceValueTopic &&
        !isPythonTopic &&
        /quadratic/i.test(title) &&
        !/place value|fraction|decimal|number system|arithmetic/i.test(norm.topic)) ||
      (!isPlaceValueTopic &&
        !isPythonTopic &&
        norm.subject === 'Mathematics' &&
        /quadratic|discriminant|factori[sz]|parabola/i.test(title) &&
        !/place value|fraction|decimal|number system|arithmetic/i.test(norm.topic));

    // ─── 1. Dedicated Branch: Computer Science / Python ──────────────────────
    if (isPythonTopic) {
      if (
        lowerTitle.includes('intro') ||
        lowerTitle.includes('overview') ||
        lowerTitle.includes('memory') ||
        (lowerTitle.includes('variable') && !lowerTitle.includes('name') && !lowerTitle.includes('type') && !lowerTitle.includes('cast')) ||
        (slideNum === 1 && !lowerTitle.includes('type') && !lowerTitle.includes('name'))
      ) {
        subtitle = 'Dynamic Memory References & Runtime Assignment';
        cards = [
          {
            cardType: 'basic-info',
            title: 'Variables as Named References',
            badge: 'Core Memory Model',
            body: 'In Python, a variable is not an empty box holding data; it is a named symbolic reference pointing to an object stored in memory. When you assign a value using the assignment operator (=), Python allocates the object in memory and binds the identifier label to that memory location.',
            bulletPoints: [
              'Assignment syntax: variable_name = value',
              'Dynamic typing: Types belong to values and memory objects, not to variable names',
              'Memory inspection: Every object has a unique identity accessible via id()',
            ],
          },
          {
            cardType: 'definition',
            title: 'Definition of a Variable',
            badge: 'Formal Definition',
            term: 'Variable (Python)',
            formalDefinition: 'A reserved memory location or identifier that stores a reference to an object. Created automatically the first time a value is assigned.',
            example: 'student_name = "Maya"\nage = 16\nis_enrolled = True\nprint(f"{student_name} is {age} years old.")',
          },
          {
            cardType: 'key-takeaway',
            title: 'The Assignment Mental Model',
            badge: 'Mental Model',
            body: 'The = symbol in Python denotes assignment, NOT mathematical equality. Python computes the right-hand expression first, instantiates the resulting value, and then points the left-hand name to that object.',
          },
        ];
        notes = 'Introduce variables by having students trace assignment. Emphasize that variables do not hold values directly, but rather point to objects in memory.';
      } else if (
        lowerTitle.includes('data type') ||
        lowerTitle.includes('core data') ||
        lowerTitle.includes('type') ||
        lowerTitle.includes('int') ||
        lowerTitle.includes('primitive')
      ) {
        subtitle = 'Primitive Data Taxonomy & type() Inspection';
        cards = [
          {
            cardType: 'multi-column-feature',
            title: 'Four Core Built-in Data Types',
            badge: 'Type Taxonomy',
            features: [
              { title: 'int (Integer)', description: 'Whole numbers of arbitrary precision (positive, negative, or zero):\ncount = 42\ntemperature = -5' },
              { title: 'float (Floating Point)', description: 'Real numbers containing a decimal point or exponent notation:\ngpa = 3.85\npi = 3.14159' },
              { title: 'str (String)', description: 'Ordered sequence of Unicode characters in single or double quotes:\nname = "Alice"\nmsg = \'Hello World\'' },
              { title: 'bool (Boolean)', description: 'Logical binary truth values representing truth states:\nis_active = True\nhas_passed = False' },
            ],
          },
          {
            cardType: 'problem-solution',
            title: 'Dynamic Type Inspection with type()',
            badge: 'Inspection Tool',
            problem: {
              title: 'Inspecting Object Types',
              text: 'How does Python determine and display what type of data an object represents at runtime?',
            },
            solution: {
              title: 'Using the Built-in type() Function',
              text: 'print(type(42))      # <class \'int\'>\nprint(type(3.14))    # <class \'float\'>\nprint(type("Maya"))  # <class \'str\'>\nprint(type(True))    # <class \'bool\'>',
            },
          },
          {
            cardType: 'warning-note',
            title: 'String vs Numeric Type Trap',
            badge: 'Exam Alert',
            body: '"100" is a string (str), whereas 100 is an integer (int). Evaluating "100" + "20" produces "10020" (concatenation), not 120!',
          },
        ];
        notes = 'Demonstrate type() in the Python interactive shell. Show how quotes fundamentally change integers into text strings.';
      } else if (
        lowerTitle.includes('naming') ||
        lowerTitle.includes('rule') ||
        lowerTitle.includes('pep 8') ||
        lowerTitle.includes('pep8') ||
        lowerTitle.includes('convention') ||
        lowerTitle.includes('identifier')
      ) {
        subtitle = 'Syntax Rules vs Professional Clean Code Conventions';
        cards = [
          {
            cardType: 'numbered-steps',
            title: 'Syntactic Naming Rules (Enforced by Python)',
            badge: 'Syntax Constraints',
            steps: [
              { stepNumber: 1, title: 'Allowed Characters', description: 'Identifiers may only contain letters (a-z, A-Z), digits (0-9), and underscores (_).' },
              { stepNumber: 2, title: 'Never Start with a Digit', description: 'score1 is valid; 1score triggers an immediate SyntaxError at parse time.' },
              { stepNumber: 3, title: 'Strict Case Sensitivity', description: 'total, Total, and TOTAL are treated as three separate variables in memory.' },
              { stepNumber: 4, title: 'No Reserved Keywords', description: 'Cannot use reserved keywords like for, if, def, class, while, import, or return.' },
            ],
          },
          {
            cardType: 'multi-column-feature',
            title: 'PEP 8 Style Recommendations',
            badge: 'Industry Best Practice',
            features: [
              { title: 'snake_case for Variables', description: 'Use lowercase letters separated by underscores: student_age, total_marks.' },
              { title: 'Descriptive & Intention-Revealing', description: 'Use elapsed_time_seconds instead of ambiguous single letters like s or t.' },
              { title: 'UPPER_CASE for Constants', description: 'Values intended to remain constant: PI = 3.14159, MAX_STUDENTS = 30.' },
            ],
          },
          {
            cardType: 'warning-note',
            title: 'Avoid Overwriting Built-ins',
            badge: 'Clean Code Tip',
            body: 'Never use built-in function names like print, str, list, or type as your variable names, as this shadows the built-in function.',
          },
        ];
        notes = 'Guide students through identifying valid vs invalid identifiers on the whiteboard.';
      } else if (
        lowerTitle.includes('conversion') ||
        lowerTitle.includes('cast') ||
        lowerTitle.includes('operation') ||
        lowerTitle.includes('coercion')
      ) {
        subtitle = 'Explicit Type Transformation & Operator Behavior';
        cards = [
          {
            cardType: 'multi-column-feature',
            title: 'Explicit Casting Functions',
            badge: 'Built-in Converters',
            features: [
              { title: 'int()', description: 'Converts numeric strings or floats to integers: int("42") → 42, int(9.99) → 9 (truncates toward zero).' },
              { title: 'float()', description: 'Converts integers or numeric strings to floats: float(10) → 10.0, float("3.14") → 3.14.' },
              { title: 'str()', description: 'Converts any data value to its string representation: str(100) → "100", str(True) → "True".' },
              { title: 'bool()', description: 'Truthiness check: 0, 0.0, "", None evaluate to False; non-empty values evaluate to True.' },
            ],
          },
          {
            cardType: 'problem-solution',
            title: 'Fixing the Common input() Type Bug',
            badge: 'Debugging Scenario',
            problem: {
              title: 'User Input Type Mismatch',
              text: 'In Python, input() always returns a string (str). If a student writes age = input() + 1, Python crashes with TypeError: can only concatenate str to str.',
            },
            solution: {
              title: 'Explicit Integer Conversion',
              text: 'user_text = "16"  # value entered by user\nage = int(user_text)  # convert string to integer\nnext_year = age + 1\nprint(f"Next year you will be {next_year} years old.")  # 17',
            },
          },
          {
            cardType: 'key-takeaway',
            title: 'Implicit vs Explicit Conversion',
            badge: 'Core Rule',
            body: 'Python performs implicit conversion safely (e.g. 5 + 2.5 becomes float 7.5), but strictly requires explicit casting between strings and numbers.',
          },
        ];
        notes = 'Emphasize that Python will not automatically guess that a string should be treated as a number — casting must be explicit.';
      } else if (
        lowerTitle.includes('walkthrough') ||
        lowerTitle.includes('predict') ||
        lowerTitle.includes('challenge') ||
        lowerTitle.includes('code') ||
        lowerTitle.includes('drill')
      ) {
        subtitle = 'Step-by-Step Execution Tracing & State Analysis';
        cards = [
          {
            cardType: 'problem-solution',
            title: 'Console Output Prediction Challenge',
            badge: 'Code Trace',
            problem: {
              title: 'Trace Program Execution',
              text: 'Trace each line of this Python program and predict the exact console output:\n\na = 10\nb = 4.5\nc = "25"\n\nx = a + int(b)          # Line 1\ny = str(a) + c          # Line 2\nz = (x > 12) and (a == 10)  # Line 3\n\nprint("x =", x)\nprint("y =", y)\nprint("z =", z)',
            },
            solution: {
              title: 'Step-by-Step Execution Analysis',
              text: '• Line 1: int(4.5) truncates to 4. 10 + 4 = 14 (int). Result: x = 14\n• Line 2: str(10) becomes "10". Concatenation "10" + "25" = "1025". Result: y = 1025\n• Line 3: (14 > 12) is True, and (10 == 10) is True. True and True is True. Result: z = True',
            },
          },
          {
            cardType: 'numbered-steps',
            title: 'Mental Tracing Protocol',
            badge: 'Debugging Skill',
            steps: [
              { stepNumber: 1, title: 'Track Variables in a Table', description: 'Record variable names, current values, and their active types at each line.' },
              { stepNumber: 2, title: 'Check Operator Semantics', description: '+ performs addition on numbers, but concatenation on strings.' },
              { stepNumber: 3, title: 'Evaluate Boolean Logic', description: 'Break down compound expressions into left and right sub-evaluations.' },
            ],
          },
        ];
        notes = 'Give students 2 minutes to calculate x, y, and z independently before showing the verified solution.';
      } else if (
        lowerTitle.includes('summary') ||
        lowerTitle.includes('review') ||
        lowerTitle.includes('quiz') ||
        lowerTitle.includes('exit ticket') ||
        lowerTitle.includes('check') ||
        lowerTitle.includes('mastery')
      ) {
        subtitle = 'Summary Checklist & Formative Assessment';
        cards = [
          {
            cardType: 'summary',
            title: 'Core Concept Summary',
            badge: 'Unit Takeaways',
            takeaways: [
              'Variables in Python are dynamically typed references to objects in memory created with =.',
              'The 4 core primitive types are int, float, str, and bool.',
              'Use type() to verify variable types and int(), float(), str() for explicit type conversion.',
              'Always follow PEP 8 snake_case naming conventions and descriptive variable names.',
            ],
            recapNote: 'Descriptive variable names and conscious type handling prevent the majority of beginner logic errors.',
          },
          {
            cardType: 'question-answer',
            title: 'Formative Exit Ticket Challenge',
            badge: 'Exit Ticket',
            question: 'What is the output of print(type(10 / 2)) and print(type(10 // 2)) in Python 3?',
            answer: '<class \'float\'> and <class \'int\'>',
            explanation: 'True division (/) always returns a float in Python 3 (5.0), whereas floor division (//) truncates to the nearest integer (5).',
          },
        ];
        notes = 'Collect answers from each student as their exit ticket before leaving class.';
      } else {
        // Fallback for general CS outline item
        subtitle = `${norm.subject} • ${norm.gradeLevel}`;
        cards = [
          {
            cardType: 'basic-info',
            title: title,
            badge: 'Computer Science',
            body: `Core principles and practical implementation of ${title} in Python.`,
            bulletPoints: [
              `Syntax and operational behavior of ${title}`,
              `Integration with standard Python language conventions`,
              `Sample code implementation and console verification`,
            ],
          },
          {
            cardType: 'key-takeaway',
            title: 'Key Programming Principle',
            badge: 'Best Practice',
            body: `Understanding ${title} is fundamental for writing robust, readable, and maintainable software in ${norm.subject}.`,
          },
        ];
      }
    } else if (isPlaceValueTopic) {
      // ─── 2. Dedicated Branch: Elementary & Foundational Math / Place Value ────
      if (
        lowerTitle.includes('intro') ||
        lowerTitle.includes('base') ||
        lowerTitle.includes('system') ||
        (slideNum === 1 && !lowerTitle.includes('chart') && !lowerTitle.includes('expand'))
      ) {
        subtitle = 'Decimal Positional System & Powers of Ten';
        cards = [
          {
            cardType: 'basic-info',
            title: 'The Power of Positional Value',
            badge: 'Base-10 System',
            body: 'In our base-10 decimal system, the value of each digit is determined entirely by its position (place) within a number. We write numbers using only ten fundamental symbols (0 through 9). Each step to the left increases a digit\'s worth by a factor of 10.',
            bulletPoints: [
              'Every position represents an increasing power of ten: 10⁰ (ones), 10¹ (tens), 10² (hundreds), 10³ (thousands)',
              'The position of a digit relative to the decimal point determines its total quantitative value',
              'Zero serves as an essential placeholder holding empty columns so other digits retain their correct value',
            ],
          },
          {
            cardType: 'definition',
            title: 'Definition of Place Value',
            badge: 'Mathematical Law',
            term: 'Place Value',
            formula: '$$\\text{Place Value} = \\text{Digit} \\times 10^n$$',
            formalDefinition: 'The numerical value a digit represents by virtue of its position in a number, calculated as the digit multiplied by the value of its assigned place column.',
            example: 'In the number 4,528, the digit 5 sits in the hundreds column (10²), giving it a place value of 5 × 100 = 500.',
          },
          {
            cardType: 'key-takeaway',
            title: 'The 10× Growth Principle',
            badge: 'Core Concept',
            body: 'Moving one place to the left multiplies the place value by 10 (10×). Conversely, moving one place to the right divides the place value by 10 (1/10).',
          },
        ];
        notes = 'Demonstrate the 10× rule on the board. Show students that 5, 50, 500, and 5000 all use the digit 5, but position dictates its actual magnitude.';
      } else if (
        lowerTitle.includes('chart') ||
        lowerTitle.includes('period') ||
        lowerTitle.includes('table') ||
        lowerTitle.includes('column')
      ) {
        subtitle = 'Periods, Groups & Column Place Organization';
        cards = [
          {
            cardType: 'multi-column-feature',
            title: 'The 3 Core Periods in the Place Value Chart',
            badge: 'Period Taxonomy',
            features: [
              { title: 'Ones Period (Units)', description: '• Ones (10⁰ = 1)\n• Tens (10¹ = 10)\n• Hundreds (10² = 100)' },
              { title: 'Thousands Period', description: '• Thousands (10³ = 1,000)\n• Ten Thousands (10⁴ = 10,000)\n• Hundred Thousands (10⁵ = 100,000)' },
              { title: 'Millions Period', description: '• Millions (10⁶ = 1,000,000)\n• Ten Millions (10⁷ = 10,000,000)\n• Hundred Millions (10⁸ = 100,000,000)' },
              { title: 'Comma Convention', description: 'Commas partition every 3-digit period from right to left (e.g. 14,825,390).' },
            ],
          },
          {
            cardType: 'basic-info',
            title: 'How to Read & Articulate Large Numbers',
            badge: 'Reading Protocol',
            body: 'To read large numbers accurately, read the three-digit number inside each period family, state the period name, and then proceed to the next period to the right.',
            bulletPoints: [
              'Example: 3,428,519 is read as "Three million, four hundred twenty-eight thousand, five hundred nineteen"',
              'The ones period is never named aloud at the end of the number',
              'A comma always marks the boundary between adjacent periods',
            ],
          },
          {
            cardType: 'key-takeaway',
            title: 'The Triplet Period Rule',
            badge: 'Structure Rule',
            body: 'In the international number system, each period consists of exactly three sub-place columns: ones, tens, and hundreds of that specific period.',
          },
        ];
        notes = 'Draw a 3-period chart on the board. Have students come up and write multi-digit numbers into the correct period columns.';
      } else if (
        lowerTitle.includes('expand') ||
        lowerTitle.includes('form') ||
        lowerTitle.includes('standard') ||
        lowerTitle.includes('word')
      ) {
        subtitle = 'Standard Form, Expanded Form & Word Form';
        cards = [
          {
            cardType: 'comparison',
            title: 'Standard & Word Form vs. Expanded Form',
            badge: 'Representation Forms',
            leftColumn: {
              title: 'Standard & Word Form',
              badge: 'Conventional',
              items: [
                'Standard Form: 8,462 (written with period commas)',
                'Word Form: Eight thousand, four hundred sixty-two',
                'Read smoothly across 3-digit period families',
              ],
            },
            rightColumn: {
              title: 'Expanded Form',
              badge: 'Decomposition',
              items: [
                'Expanded: (8 × 1,000) + (4 × 100) + (6 × 10) + (2 × 1)',
                'Reveals the explicit additive power-of-10 structure',
                'Zero columns must never be omitted in standard notation',
              ],
            },
          },
          {
            cardType: 'problem-solution',
            title: 'Decomposing Numbers with Zero Digits',
            badge: 'Step-by-Step Drill',
            problem: {
              title: 'Express 60,405 in Expanded Form',
              text: 'Decompose 60,405 into its expanded form and explain how to handle the zeros.',
            },
            solution: {
              title: 'Analytical Solution',
              text: '60,405 = 60,000 + 400 + 5 = (6 × 10,000) + (4 × 100) + (5 × 1).\nThe zeros in the thousands and tens places act as essential placeholders so the 6 and 4 remain in their correct columns.',
            },
          },
          {
            cardType: 'warning-note',
            title: 'The Zero Placeholder Trap',
            badge: 'Common Student Error',
            body: 'Never omit zeros in standard form! Writing 645 instead of 60,405 drops two place columns and changes the magnitude by nearly 100×.',
          },
        ];
        notes = 'Give students numbers with consecutive zeros (e.g. 40,008) and have them write the expanded notation on their whiteboards.';
      } else if (
        lowerTitle.includes('face') ||
        lowerTitle.includes('value vs') ||
        lowerTitle.includes('difference')
      ) {
        subtitle = 'Place Value vs. Face Value Disambiguation';
        cards = [
          {
            cardType: 'comparison',
            title: 'Contrasting Face Value and Place Value',
            badge: 'Conceptual Contrast',
            leftColumn: {
              title: 'Face Value',
              badge: 'Intrinsic',
              items: [
                'The immutable value of the digit symbol itself',
                'Completely independent of column position',
                'Example: In 85,340, face value of 5 is simply 5',
              ],
            },
            rightColumn: {
              title: 'Place Value',
              badge: 'Positional',
              items: [
                'Value calculated from column location (Digit × 10ⁿ)',
                'Increases tenfold with each leftward position shift',
                'Example: In 85,340, place value of 5 is 5 × 1,000 = 5,000',
              ],
            },
          },
          {
            cardType: 'problem-solution',
            title: 'Difference Calculation Challenge',
            badge: 'Worked Problem',
            problem: {
              title: 'Calculate the Positional Difference',
              text: 'In the number 85,340, calculate the difference between the place value and face value of the digit 5.',
            },
            solution: {
              title: 'Step-by-Step Solution',
              text: '1. Identify the digit: 5 is in the thousands place\n2. Place value of 5 = 5 × 1,000 = 5,000\n3. Face value of 5 = 5\n4. Difference = 5,000 - 5 = 4,995.',
            },
          },
          {
            cardType: 'key-takeaway',
            title: 'Memory Mnemonic',
            badge: 'Classroom Tip',
            body: 'Face value is what you see (the face of the number); place value is where it sits and what it is worth in that specific spot.',
          },
        ];
        notes = 'Ask students: "Can the face value and place value of a digit ever be identical?" (Yes, in the ones place, and always for 0).';
      } else if (
        lowerTitle.includes('example') ||
        lowerTitle.includes('compar') ||
        lowerTitle.includes('order') ||
        lowerTitle.includes('solve') ||
        lowerTitle.includes('step')
      ) {
        subtitle = 'Step-by-Step Positional Comparison Strategy';
        cards = [
          {
            cardType: 'numbered-steps',
            title: 'Protocol for Comparing Multi-Digit Numbers',
            badge: 'Comparison Algorithm',
            steps: [
              { stepNumber: 1, title: 'Count Total Digits', description: 'If one number has more digits than the other, it is automatically greater (e.g. 10,240 > 9,875).' },
              { stepNumber: 2, title: 'Compare Left-to-Right', description: 'Line up numbers by place value and compare digits starting from the highest place column on the left.' },
              { stepNumber: 3, title: 'Locate First Difference', description: 'At the first column where digits differ, the number with the larger digit is the greater number.' },
            ],
          },
          {
            cardType: 'problem-solution',
            title: 'Worked Problem: Compare 748,210 and 745,999',
            badge: 'Step-by-Step Drill',
            problem: {
              title: 'Determine the Greater Number',
              text: 'Compare 748,210 and 745,999 and explain your reasoning using place value concepts.',
            },
            solution: {
              title: 'Positional Comparison Analysis',
              text: '• Both numbers contain 6 digits.\n• Hundred-thousands place: 7 = 7\n• Ten-thousands place: 4 = 4\n• Thousands place: 8 > 5\nSince 8 thousands exceeds 5 thousands, 748,210 > 745,999.',
            },
          },
          {
            cardType: 'key-takeaway',
            title: 'Dominance of the Highest Place Value',
            badge: 'Key Insight',
            body: 'A single higher digit in a superior place column always overpowers any combination of digits in inferior place columns.',
          },
        ];
        notes = 'Have students practice comparing numbers that are close in value to reinforce looking at the leftmost differing column.';
      } else {
        subtitle = 'Summary Key Takeaways & Formative Concept Quiz';
        cards = [
          {
            cardType: 'summary',
            title: 'Place Value System Mastery Summary',
            badge: 'Unit Takeaways',
            takeaways: [
              'Place value is the value of a digit determined by its column position ($10^n$).',
              'The 10× rule means shifting one place to the left multiplies value by 10; shifting right divides by 10.',
              'Numbers are grouped into 3-digit periods: Ones, Thousands, Millions, separated by commas.',
              'Zero serves as an indispensable placeholder keeping digits in their proper columns.',
              'Face value is the digit itself; place value is digit multiplied by column weight.',
            ],
            recapNote: 'Mastery of place value provides the foundational mechanics for arithmetic algorithms, estimation, and decimals.',
          },
          {
            cardType: 'question-answer',
            title: 'Exit Ticket Challenge',
            badge: 'Formative Assessment',
            question: 'How many times greater is the 4 in 4,000 than the 4 in 40?',
            answer: '100 times greater (4,000 ÷ 40 = 100, or two column shifts = 10²).',
            explanation: 'Moving from the tens place to the thousands place is two column shifts to the left. Each shift multiplies by 10, so 10 × 10 = 100×.',
          },
        ];
        notes = 'Collect student answers to the exit ticket question to check for conceptual mastery of column shifts.';
      }
    } else if (isQuadraticTopic) {
      // ─── 2. Dedicated Branch: Mathematics / Quadratic Equations ──────────────
      if (lowerTitle.includes('intro') || lowerTitle.includes('overview') || (slideNum === 1 && !lowerTitle.includes('standard') && !lowerTitle.includes('root'))) {
        subtitle = 'Foundational Concepts & Curriculum Roadmap';
        cards = [
          {
            cardType: 'basic-info',
            title: 'Lesson Overview & Pedagogical Objectives',
            badge: 'Unit Introduction',
            body: `Welcome to this instructional session on ${title}. Today we explore fundamental mechanisms, mathematical relationships, and practical applications.`,
            bulletPoints: [
              `Understand the core definitions and principles of ${norm.topic}`,
              `Analyze step-by-step methods and worked problems`,
              `Evaluate real-world applications and avoid common conceptual traps`,
            ],
          },
          {
            cardType: 'definition',
            title: 'Canonical Definition',
            badge: 'Formal Definition',
            term: norm.topic,
            body: `A second-order polynomial equation in a single variable x with non-zero leading coefficient: ax² + bx + c = 0 where a, b, c ∈ ℝ and a ≠ 0.`,
            formalDefinition: `A second-order polynomial equation in a single variable x with non-zero leading coefficient: ax² + bx + c = 0 where a, b, c ∈ ℝ and a ≠ 0.`,
            example: 'In 2x² - 4x - 6 = 0, the coefficients are a = 2, b = -4, and c = -6.',
          },
          {
            cardType: 'key-takeaway',
            title: 'Essential Inquiry',
            badge: 'Guiding Inquiry',
            body: `How do the principles of ${norm.topic} govern observable patterns and curves in ${norm.subject}?`,
          },
        ];
        notes = `Introduce the lesson topic and ask students what they already know about ${title}.`;
      } else if (lowerTitle.includes('standard form') || lowerTitle.includes('general form') || lowerTitle.includes('coefficient')) {
        subtitle = 'Algebraic Anatomy of Second-Degree Polynomials';
        cards = [
          {
            cardType: 'definition',
            title: 'Canonical Standard Form',
            badge: 'Standard Equation',
            formula: '$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$',
            body: 'Every quadratic equation can be rearranged into canonical standard form by collecting all terms on one side equal to zero.',
            formalDefinition: 'Every quadratic equation can be rearranged into canonical standard form by collecting all terms on one side equal to zero.',
            example: 'In 3x² - 5x + 2 = 0, a = 3, b = -5, and c = 2.',
          },
          {
            cardType: 'multi-column-feature',
            title: 'Coefficient Functional Roles',
            badge: 'Core Principles',
            features: [
              { title: 'Leading Coefficient a', description: 'Determines concavity (opens upward if a > 0, downward if a < 0) and vertical dilation.' },
              { title: 'Linear Coefficient b', description: 'Controls horizontal translation; places the axis of symmetry at x = -b / (2a).' },
              { title: 'Constant Term c', description: 'Determines the exact vertical y-axis intercept coordinate (0, c).' },
            ],
          },
          {
            cardType: 'metric-highlight',
            title: 'Polynomial Invariant',
            badge: 'Fundamental Theorem',
            metricValue: 'Degree 2',
            metricLabel: 'Exactly Two Roots',
            metricSubtext: 'Every quadratic equation possesses exactly two roots in the complex number system.',
          },
        ];
        notes = 'Emphasize that the leading coefficient a must never equal 0, otherwise the x² term vanishes and the equation reduces to linear.';
      } else if (lowerTitle.includes('discriminant')) {
        subtitle = 'Predicting Root Topologies without Full Solving';
        cards = [
          {
            cardType: 'definition',
            title: 'The Discriminant Invariant',
            badge: 'Analytical Invariant',
            formula: '$$\\Delta = b^2 - 4ac$$',
            body: 'The radicand under the square root in the quadratic formula that dictates the number and nature of roots without solving the entire equation.',
            formalDefinition: 'The radicand under the square root in the quadratic formula that dictates the number and nature of roots without solving the entire equation.',
          },
          {
            cardType: 'numbered-steps',
            title: 'Three Interpretive Regimes',
            badge: 'Case Analysis',
            steps: [
              { stepNumber: 1, title: 'Δ > 0 (Positive Discriminant)', description: 'Two distinct, real roots. The parabola intersects the horizontal x-axis at two points.' },
              { stepNumber: 2, title: 'Δ = 0 (Zero Discriminant)', description: 'Exactly one repeated real root. The vertex of the parabola is tangent to the x-axis.' },
              { stepNumber: 3, title: 'Δ < 0 (Negative Discriminant)', description: 'Two complex conjugate roots. The parabola does not intersect the real x-axis.' },
            ],
          },
          {
            cardType: 'warning-note',
            title: 'Common Calculation Trap',
            badge: 'Exam Alert',
            body: 'Remember that (-b)² is always positive. When b = -4, (-4)² = +16, not -16. A negative sign error here causes incorrect root classifications.',
          },
        ];
        notes = 'Have students practice calculating the discriminant for three quick equations on their whiteboards.';
      } else if (lowerTitle.includes('completing the square') || lowerTitle.includes('square')) {
        subtitle = 'Transforming Quadratics into Perfect Squares';
        cards = [
          {
            cardType: 'definition',
            title: 'Completing the Square Identity',
            badge: 'Algebraic Technique',
            formula: '$$x^2 + bx + \\left(\\frac{b}{2}\\right)^2 = \\left(x + \\frac{b}{2}\\right)^2$$',
            body: 'An algebraic technique to rewrite a quadratic expression of the form x² + bx into a perfect square binomial by adding (b/2)² to both sides.',
            formalDefinition: 'An algebraic technique to rewrite a quadratic expression of the form x² + bx into a perfect square binomial by adding (b/2)² to both sides.',
            example: 'For x² + 6x, b = 6, so (6/2)² = 9. Adding 9 gives x² + 6x + 9 = (x + 3)².',
          },
          {
            cardType: 'numbered-steps',
            title: 'Step-by-Step Completing the Square Protocol',
            badge: 'Algorithm',
            steps: [
              { stepNumber: 1, title: 'Ensure a = 1', description: 'Divide entire equation by leading coefficient a if a ≠ 1.' },
              { stepNumber: 2, title: 'Isolate Variable Terms', description: 'Move constant term c to right side: x² + (b/a)x = -c/a.' },
              { stepNumber: 3, title: 'Add (b / 2a)²', description: 'Add (b / 2a)² to both sides to complete the square on the left.' },
              { stepNumber: 4, title: 'Factor and Extract Roots', description: 'Write left side as (x + b/2a)² and extract square roots of both sides.' },
            ],
          },
          {
            cardType: 'problem-solution',
            title: 'Worked Example: x² - 6x - 7 = 0',
            badge: 'Worked Problem',
            problem: {
              title: 'Solve by Completing the Square',
              text: 'Solve x² - 6x - 7 = 0 using the completing the square method.',
            },
            solution: {
              title: 'Algorithmic Solution',
              text: '1. Move constant: x² - 6x = 7\n2. Half of -6 is -3; (-3)² = 9. Add 9 to both sides: x² - 6x + 9 = 7 + 9 = 16\n3. Factor LHS: (x - 3)² = 16\n4. Extract square root: x - 3 = ±4\n5. Roots: x₁ = 3 + 4 = 7, x₂ = 3 - 4 = -1',
            },
          },
        ];
        notes = 'Walk students through why adding (b/2)² completes the square geometrically.';
      } else if (lowerTitle.includes('root') || lowerTitle.includes('zero') || lowerTitle.includes('solution')) {
        subtitle = 'Geometric x-Intercepts & Algebraic Solutions';
        cards = [
          {
            cardType: 'definition',
            title: 'Definition of Roots & Zeroes',
            badge: 'Formal Concept',
            term: 'Roots of Quadratic Equation',
            formalDefinition: 'The numerical values of variable x that satisfy ax² + bx + c = 0. Geometrically, roots correspond to coordinates where the parabola intersects the horizontal x-axis.',
            example: 'If f(r) = 0, then r is a root and (r, 0) is an x-intercept.',
          },
          {
            cardType: 'problem-solution',
            title: 'Graphical Root Example',
            badge: 'Demonstration',
            problem: {
              title: 'Geometric Zeroes of y = x² - 4',
              text: 'Determine the coordinates where the parabola y = x² - 4 intersects the horizontal x-axis.',
            },
            solution: {
              title: 'Algebraic Resolution',
              text: 'Set y = 0:\nx² - 4 = 0 ⟹ (x - 2)(x + 2) = 0 ⟹ x₁ = 2, x₂ = -2.\nThe parabola intersects the x-axis at (2, 0) and (-2, 0).',
            },
          },
          {
            cardType: 'key-takeaway',
            title: 'Three Geometric Scenarios',
            badge: 'Root Topology',
            body: '• Two distinct real roots: Parabola crosses x-axis twice.\n• One repeated root: Parabola vertex is tangent to x-axis.\n• Zero real roots: Parabola floats entirely above or below x-axis (complex roots).',
          },
        ];
        notes = 'Show students how roots on the graph directly correspond to algebraic zeroes of the equation.';
      } else if (lowerTitle.includes('factor') || lowerTitle.includes('factorisation') || lowerTitle.includes('factoring')) {
        subtitle = 'Step-by-Step Factoring Method & Verification';
        cards = [
          {
            cardType: 'problem-solution',
            title: 'Classroom Worked Problem: Factoring',
            badge: 'Step-by-Step Method',
            problem: {
              title: 'Problem Statement',
              text: 'Solve x² - 5x + 6 = 0 for all real values of x by factorisation.',
            },
            solution: {
              title: 'Factoring Protocol',
              text: '1. Find two integers m, n such that m · n = 6 and m + n = -5 ⟹ m = -2, n = -3.\n2. Write in factored form: (x - 2)(x - 3) = 0.\n3. Apply Zero Product Property: x - 2 = 0 ⟹ x = 2; or x - 3 = 0 ⟹ x = 3.\n4. Roots are x₁ = 2 and x₂ = 3.',
            },
          },
          {
            cardType: 'numbered-steps',
            title: 'Proof & Verification Protocol',
            badge: 'Sanity Verification',
            steps: [
              { stepNumber: 1, title: 'Substitute x = 2', description: '(2)² - 5(2) + 6 = 4 - 10 + 6 = 0 (Verified!)' },
              { stepNumber: 2, title: 'Substitute x = 3', description: '(3)² - 5(3) + 6 = 9 - 15 + 6 = 0 (Verified!)' },
              { stepNumber: 3, title: 'Expansion Check', description: '(x - 2)(x - 3) = x² - 3x - 2x + 6 = x² - 5x + 6 (Identical!)' },
            ],
          },
        ];
        notes = 'Emphasize why factoring requires setting the entire equation equal to zero before finding binomial factors.';
      } else if (lowerTitle.includes('quadratic formula') || lowerTitle.includes('formula') || lowerTitle.includes('derivation')) {
        subtitle = 'Universal Analytical Solution & Completing the Square Proof';
        cards = [
          {
            cardType: 'definition',
            title: 'Universal Quadratic Formula',
            badge: 'Governing Formula',
            formula: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
            body: 'The universal analytical solution for roots of any quadratic equation ax² + bx + c = 0 with a ≠ 0.',
            formalDefinition: 'The universal analytical solution for roots of any quadratic equation ax² + bx + c = 0 with a ≠ 0.',
            example: 'Works universally for all equations, including those that cannot be factored over integers.',
          },
          {
            cardType: 'problem-solution',
            title: 'Step-by-Step Derivation Protocol',
            badge: 'Analytical Proof',
            problem: {
              title: 'Theoretical Premise',
              text: 'Starting from canonical standard form ax² + bx + c = 0 (a ≠ 0), algebraically isolate variable x.',
            },
            solution: {
              title: 'Analytical Proof Protocol',
              text: '1. Divide by leading coefficient a: x² + (b/a)x = -c/a\n2. Complete square by adding (b / 2a)² to both sides: x² + (b/a)x + (b/2a)² = (b² - 4ac) / (4a²)\n3. Factor LHS into binomial square: (x + b/(2a))² = (b² - 4ac) / (4a²)\n4. Extract square root of both sides: x + b/(2a) = ±√(b² - 4ac) / (2a)\n5. Isolate variable x: x = (-b ± √(b² - 4ac)) / (2a)',
            },
          },
          {
            cardType: 'key-takeaway',
            title: 'Universal Applicability',
            badge: 'Key Principle',
            body: 'Unlike factoring, the quadratic formula works universally for every quadratic equation, including non-integers, irrational roots, and complex numbers.',
          },
        ];
        notes = 'Walk students through each line of the completing-the-square derivation on the board.';
      } else {
        cards = [
          {
            cardType: 'basic-info',
            title: title,
            badge: 'Core Curriculum',
            body: `Detailed instruction and classroom analysis for ${title}. Calibrated for ${norm.gradeLevel} students.`,
            bulletPoints: [
              `Key conceptual principle of ${title}`,
              `Interactions with related ${norm.subject} concepts`,
              `Practical classroom observation and worked application`,
            ],
          },
          {
            cardType: 'key-takeaway',
            title: 'Essential Takeaway',
            badge: 'Key Point',
            body: `Mastering ${title} is essential for problem-solving proficiency across ${norm.subject}.`,
          },
        ];
      }
    } else {
      // ─── 3. General Academic Topics (Science, Humanities, etc.) ──────────────
      if (lowerTitle.includes('intro') || lowerTitle.includes('overview') || (slideNum === 1)) {
        subtitle = 'Foundational Concepts & Curriculum Roadmap';
        cards = [
          {
            cardType: 'basic-info',
            title: 'Lesson Overview & Pedagogical Objectives',
            badge: 'Unit Introduction',
            body: `Welcome to this instructional session on ${title}. Today we explore fundamental mechanisms, core relationships, and practical applications.`,
            bulletPoints: [
              `Understand the core definitions and principles of ${norm.topic}`,
              `Analyze step-by-step methods and evidence-based analysis`,
              `Evaluate real-world applications and avoid common conceptual traps`,
            ],
          },
          {
            cardType: 'definition',
            title: 'Canonical Definition',
            badge: 'Formal Definition',
            term: norm.topic,
            body: `A foundational concept in ${norm.subject} governing system behavior, quantitative interactions, and empirical observation.`,
            formalDefinition: `A foundational concept in ${norm.subject} governing system behavior, quantitative interactions, and empirical observation.`,
            example: `Applied across classroom exercises and standard ${norm.subject} curricula.`,
          },
          {
            cardType: 'key-takeaway',
            title: 'Essential Inquiry',
            badge: 'Guiding Inquiry',
            body: `How do the principles of ${norm.topic} govern observable patterns and structures in ${norm.subject}?`,
          },
        ];
        notes = `Introduce the lesson topic and ask students what they already know about ${title}.`;
      } else {
        cards = [
          {
            cardType: 'basic-info',
            title: title,
            badge: 'Core Curriculum',
            body: `Detailed instruction and classroom analysis for ${title}. Calibrated for ${norm.gradeLevel} students.`,
            bulletPoints: [
              `Key conceptual principle of ${title}`,
              `Interactions with related ${norm.subject} concepts`,
              `Practical classroom observation and worked application`,
            ],
          },
          {
            cardType: 'key-takeaway',
            title: 'Essential Takeaway',
            badge: 'Key Point',
            body: `Mastering ${title} is essential for problem-solving proficiency across ${norm.subject}.`,
          },
        ];
      }
    }

    let slideFormula: string | undefined;
    const formulaCard = cards.find((c) => c.formula);
    if (formulaCard?.formula) {
      slideFormula = formulaCard.formula;
    }

    let workedExample: any | undefined;
    const lowerTitleStr = (title || '').toLowerCase();
    if (isPython && (lowerTitleStr.includes('walkthrough') || lowerTitleStr.includes('example') || lowerTitleStr.includes('code') || lowerTitleStr.includes('cast'))) {
      workedExample = {
        title: 'Step-by-Step Code Execution Example',
        problemStatement: 'Trace and predict output: age_str = "15"; age = int(age_str) + 1; print(age)',
        steps: [
          'Step 1: age_str is assigned string "15"',
          'Step 2: int(age_str) converts "15" into numeric integer 15',
          'Step 3: 15 + 1 evaluates to integer 16',
          'Step 4: print(age) outputs 16 to console',
        ],
        finalAnswer: '16',
      };
    } else if (lowerTitleStr.includes('factoris') || lowerTitleStr.includes('factor') || lowerTitleStr.includes('example')) {
      workedExample = {
        title: 'Step-by-Step Factoring Example',
        problemStatement: 'Solve for x: x² - 5x + 6 = 0',
        steps: [
          'Find two numbers that multiply to 6 and add to -5: -2 and -3',
          'Rewrite as factored binomials: (x - 2)(x - 3) = 0',
          'Apply Zero Product Property: x - 2 = 0 or x - 3 = 0',
          'Conclusion: The roots are x = 2 and x = 3',
        ],
        finalAnswer: 'x = 2, 3',
      };
    }

    return {
      slideNumber: slideNum,
      title,
      subtitle,
      layout,
      formula: slideFormula,
      workedExample,
      cards,
      notes,
    };
  });
}

// ─── Rule-Based Curriculum-Template Fallback ──────────────────────────────────

/**
 * Creates high-quality, pedagogically structured presentation decks when no AI provider
 * is available or when offline. Explicitly marked as source: 'curriculum-template'.
 * 
 * Guaranteed to generate substantive, classroom-ready content (definitions, formulas,
 * derivations, worked problems, real-world applications, and quizzes) so that slides
 * are NEVER blank.
 */
export function generateCurriculumTemplateFallback(input: TeacherPromptInput): PresentationDeckSpec {
  const norm = normalizeTeacherInput(input);

  // If user provided an explicit outline, generate slides matching the exact outline!
  if (norm.slideOutline && norm.slideOutline.length > 0) {
    const outlineSlides = generateOutlineDrivenSlides(norm.slideOutline, norm);
    return {
      topic: norm.topic,
      subject: norm.subject,
      gradeLevel: norm.gradeLevel,
      themeId: norm.themeId,
      slides: outlineSlides,
      language: norm.language,
      estimatedDurationMinutes: norm.durationMinutes,
      learningObjectives: norm.learningObjectives,
      source: 'curriculum-template',
      isTemplateFallback: true,
    };
  }

  const sequence = planPedagogicalSequence(norm.numberOfSlides, norm.subject);
  const isQuadratic = /quadratic/i.test(norm.topic);
  const isPython =
    /python|variable|data type|programming|coding|algorithm|syntax|identifier/i.test(norm.topic) ||
    /computer science|information technology|coding/i.test(norm.subject);
  const isMath = norm.subject === 'Mathematics' || /equation|algebra|geometry|calculus|formula|pythagor/i.test(norm.topic);

  const slides: SlideContentSpec[] = sequence.map((seq) => {
    const slideNum = seq.slideNumber;
    let title = `${norm.topic}: ${seq.role}`;
    let subtitle: string | undefined = `${norm.subject} • ${norm.gradeLevel}`;
    const layout = seq.recommendedLayout;
    let cards: HtmlCardSpec[] = [];
    let notes = `Guide students through ${seq.role.toLowerCase()} for ${norm.topic}.`;

    // ── Dedicated High-Yield Branch: Quadratic Equations ──
    if (isQuadratic) {
      if (slideNum === 1 || layout === 'title-hero') {
        title = 'Quadratic Equations';
        subtitle = 'Algebra & Polynomial Functions • High School';
        cards = [
          {
            cardType: 'basic-info',
            title: 'Lesson Overview & Pedagogical Objectives',
            badge: 'Unit Introduction',
            body: `Welcome to this instructional session on Quadratic Equations. Today we explore canonical standard forms, algebraic derivations, discriminant behavior, and graphical parabolic properties.`,
            bulletPoints: [
              'Identify quadratic equations in standard form: ax² + bx + c = 0 (a ≠ 0)',
              'Derive the universal quadratic formula by completing the square',
              'Analyze the nature and number of roots via discriminant Δ = b² - 4ac',
              'Model real-world projectile trajectories and parabolic curves',
            ],
          },
          {
            cardType: 'key-takeaway',
            title: 'Essential Guiding Inquiry',
            badge: 'Guiding Inquiry',
            body: 'How does the algebraic discriminant Δ = b² - 4ac determine the geometric number and nature of x-intercepts of a parabola?',
          },
        ];
        notes = 'Introduce the lesson by asking students where they encounter curves or parabolic shapes in everyday life (bridges, water fountains, basketball arcs).';
      } else if (slideNum === 2) {
        title = 'Standard Form & Geometric Foundations';
        subtitle = 'Algebraic Anatomy of Second-Degree Polynomials';
        cards = [
          {
            cardType: 'definition',
            title: 'Canonical Definition',
            badge: 'Formal Definition',
            term: 'Quadratic Equation',
            formula: '$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$',
            formalDefinition: 'A second-order polynomial equation in a single variable x with non-zero leading coefficient: ax² + bx + c = 0 where a, b, c ∈ ℝ and a ≠ 0.',
            example: 'In 2x² - 4x - 6 = 0, the coefficients are a = 2, b = -4, and c = -6.',
          },
          {
            cardType: 'metric-highlight',
            title: 'Polynomial Invariant',
            badge: 'Fundamental Theorem of Algebra',
            metricValue: 'Degree 2',
            metricLabel: 'Exactly Two Roots',
            metricSubtext: 'Every quadratic equation possesses exactly two roots in the complex number system.',
          },
          {
            cardType: 'basic-info',
            title: 'Coefficient Anatomy & Functional Roles',
            badge: 'Core Principles',
            body: 'Each coefficient in standard form governs specific geometric behavior of the parabola:',
            bulletPoints: [
              'Leading coefficient a: Determines concavity (opens upward if a > 0, downward if a < 0) and vertical dilation.',
              'Linear coefficient b: Controls horizontal translation; places the axis of symmetry at x = -b / (2a).',
              'Constant term c: Governs vertical shift, giving the exact y-axis intercept at (0, c).',
            ],
          },
        ];
        notes = 'Emphasize that a must never equal 0, otherwise the x² term vanishes and the equation reduces to a linear equation.';
      } else if (slideNum === 3) {
        title = 'The Quadratic Formula & Derivation';
        subtitle = 'Universal Analytical Solution by Completing the Square';
        cards = [
          {
            cardType: 'definition',
            title: 'Universal Quadratic Formula',
            badge: 'Governing Formula',
            term: 'The Quadratic Formula',
            formalDefinition: 'For any quadratic equation ax² + bx + c = 0 with a ≠ 0, the exact roots are given by:',
            formula: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
            example: 'Works universally for all equations, including those that cannot be factored over integers.',
          },
          {
            cardType: 'problem-solution',
            title: 'Step-by-Step Algebraic Derivation',
            badge: 'Completing the Square',
            problem: {
              title: 'Theoretical Premise',
              text: 'Given ax² + bx + c = 0 with a ≠ 0, algebraically isolate variable x.',
            },
            solution: {
              title: 'Analytical Proof Protocol',
              text: '1. Divide by leading coefficient a: x² + (b/a)x = -c/a\n2. Complete square by adding (b / 2a)² to both sides: x² + (b/a)x + (b/2a)² = (b² - 4ac) / (4a²)\n3. Factor LHS into binomial square: (x + b/(2a))² = (b² - 4ac) / (4a²)\n4. Extract square root of both sides: x + b/(2a) = ±√(b² - 4ac) / (2a)\n5. Isolate variable x: x = (-b ± √(b² - 4ac)) / (2a)',
            },
          },
          {
            cardType: 'key-takeaway',
            title: 'Discriminant Invariant Analysis (Δ)',
            badge: 'Root Topology',
            formula: '$$\\Delta = b^2 - 4ac$$',
            body: 'The radicand Δ = b² - 4ac dictates root characteristics without full evaluation:\n• Δ > 0: Two distinct real roots (parabola crosses x-axis twice)\n• Δ = 0: Exactly one repeated real root (parabola vertex touches x-axis)\n• Δ < 0: Two complex conjugate roots (parabola never crosses x-axis)',
          },
        ];
        notes = 'Walk students through each line of the completing-the-square derivation on the board. Point out how (b / 2a)² balances both sides.';
      } else if (slideNum === 4) {
        title = 'Worked Example: Step-by-Step Resolution';
        subtitle = 'Solving 2x² - 4x - 6 = 0 Using the Quadratic Formula';
        cards = [
          {
            cardType: 'problem-solution',
            title: 'Classroom Worked Problem',
            badge: 'Worked Example',
            problem: {
              title: 'Problem Statement',
              text: 'Solve 2x² - 4x - 6 = 0 for all real roots. Verify solutions through direct substitution.',
            },
            solution: {
              title: 'Algorithmic Resolution',
              text: '1. Identify coefficients: a = 2, b = -4, c = -6\n2. Compute discriminant: Δ = (-4)² - 4(2)(-6) = 16 + 48 = 64\n3. Take square root: √64 = 8 (since Δ > 0, two real roots exist)\n4. Substitute into formula: x = (-(-4) ± 8) / (2 · 2) = (4 ± 8) / 4\n5. Calculate root 1: x₁ = (4 + 8) / 4 = 12 / 4 = 3\n6. Calculate root 2: x₂ = (4 - 8) / 4 = -4 / 4 = -1',
            },
          },
          {
            cardType: 'numbered-steps',
            title: 'Proof & Verification Protocol',
            badge: 'Sanity Checks',
            steps: [
              { stepNumber: 1, title: 'Substitute x = 3', description: '2(3)² - 4(3) - 6 = 2(9) - 12 - 6 = 18 - 18 = 0 (Matches!)' },
              { stepNumber: 2, title: 'Substitute x = -1', description: '2(-1)² - 4(-1) - 6 = 2(1) + 4 - 6 = 6 - 6 = 0 (Matches!)' },
              { stepNumber: 3, title: 'Factored Check', description: '2(x - 3)(x + 1) = 2(x² - 2x - 3) = 2x² - 4x - 6 (Identical!)' },
            ],
          },
        ];
        notes = 'Give students 2 minutes to calculate the discriminant independently before revealing the rest of the solution.';
      } else if (slideNum === 5) {
        title = 'Physical Applications & Common Pitfalls';
        subtitle = 'Kinematic Trajectories vs Common Student Errors';
        cards = [
          {
            cardType: 'multi-column-feature',
            title: 'Real-World Applications',
            badge: 'Physics & Industry',
            features: [
              { title: 'Projectile Motion', description: 'Objects thrown in gravity follow h(t) = -½gt² + v₀t + h₀. Solving h(t) = 0 computes total flight hang time.' },
              { title: 'Economic Optimization', description: 'Quadratic revenue curves R(p) = -ap² + bp reach maximum vertex profit at price p = -b / (2a).' },
              { title: 'Parabolic Reflectors', description: 'Satellite dishes and solar concentrators use parabolic curvature to focus incoming parallel rays.' },
            ],
          },
          {
            cardType: 'warning-note',
            title: 'Common Student Exam Pitfalls',
            badge: 'Exam Alert',
            body: '⚠️ Avoid these 3 frequent mistakes:\n1. Negating Negative b: If b = -4, then -b is -(-4) = +4. Do NOT write -4.\n2. Incomplete Fraction Bar: The denominator 2a divides the ENTIRE numerator (-b ± √Δ), not just the radical.\n3. Zero Leading Coefficient: If a = 0, the equation reduces to linear bx + c = 0, so the quadratic formula cannot be applied.',
          },
        ];
        notes = 'Highlight the common exam mistakes on the right. These account for over 70% of lost marks on standard algebra assessments.';
      } else {
        // Last slide / Review
        title = 'Unit Review & Mastery Exit Ticket';
        subtitle = 'Solution Method Selection Matrix & Concept Check';
        cards = [
          {
            cardType: 'summary',
            title: 'Solution Method Selection Matrix',
            badge: 'Strategic Toolkit',
            takeaways: [
              'Factoring: Fastest method when factors of ac sum to b (e.g. x² - 5x + 6 = 0 → (x-2)(x-3) = 0).',
              'Completing the Square: Best when leading coefficient a = 1 and b is an even integer.',
              'Quadratic Formula: Universal method that always works for any quadratic equation, real or complex.',
            ],
            recapNote: 'Memorize the quadratic formula and practice identifying a, b, c with their correct signs.',
          },
          {
            cardType: 'question-answer',
            title: 'Check for Understanding',
            badge: 'Exit Ticket',
            question: 'Calculate the discriminant for x² - 6x + 9 = 0. How many real roots exist, and what does the graph look like?',
            answer: 'Δ = (-6)² - 4(1)(9) = 36 - 36 = 0. Exactly ONE repeated real root exists at x = 3.',
            explanation: 'Because Δ = 0, the parabola’s vertex (3, 0) touches the x-axis tangentially at a single point without crossing below it.',
          },
        ];
        notes = 'Have every student write down their answer to the exit ticket question before leaving class.';
      }
    } else if (isPython) {
      // ── Dedicated High-Yield Branch: Computer Science / Python ──
      if (slideNum === 1 || layout === 'title-hero') {
        title = 'Python Variables & Data Types';
        subtitle = `${norm.subject} • ${norm.gradeLevel}`;
        cards = [
          {
            cardType: 'basic-info',
            title: 'Lesson Overview & Pedagogical Objectives',
            badge: 'Unit Introduction',
            body: 'Welcome to this instructional session on Python Variables and Data Types. Today we explore dynamic memory references, standard primitive types, PEP 8 identifiers, and explicit type conversion.',
            bulletPoints: [
              'Understand variables as dynamic references to memory objects (id() and assignment =)',
              'Master the 4 core primitive data types: int, float, str, and bool',
              'Apply syntactically valid naming rules and PEP 8 snake_case conventions',
              'Execute explicit type casting with int(), float(), str() and predict console outputs',
            ],
          },
          {
            cardType: 'key-takeaway',
            title: 'The Assignment Mental Model',
            badge: 'Core Concept',
            body: 'In Python, the = operator represents assignment, not equality. Python first evaluates the expression on the right, creates the resulting object in memory, and attaches the label on the left.',
          },
        ];
        notes = 'Introduce variables by contrasting static type declarations in C++/Java with Python dynamic typing.';
      } else if (slideNum === 2) {
        title = 'Core Primitive Data Types: int, float, str, bool';
        subtitle = 'Taxonomy of Python Built-in Types & type() Inspection';
        cards = [
          {
            cardType: 'multi-column-feature',
            title: 'Four Core Built-in Data Types',
            badge: 'Data Type Taxonomy',
            features: [
              { title: 'int (Integer)', description: 'Whole numbers of arbitrary size: count = 42, score = -5, year = 2026' },
              { title: 'float (Floating Point)', description: 'Real numbers with fractional parts: gpa = 3.85, pi = 3.14159, rate = 0.05' },
              { title: 'str (String)', description: 'Ordered sequence of Unicode characters: name = "Alice", msg = \'Hello World\'' },
              { title: 'bool (Boolean)', description: 'Logical binary truth values: is_active = True, has_passed = False' },
            ],
          },
          {
            cardType: 'problem-solution',
            title: 'Runtime Type Inspection with type()',
            badge: 'Inspection Tool',
            problem: {
              title: 'Inspecting Object Types',
              text: 'How does a programmer inspect what data type Python has inferred for an object?',
            },
            solution: {
              title: 'Using type() at the Console',
              text: 'print(type(42))      # <class \'int\'>\nprint(type(3.14))    # <class \'float\'>\nprint(type("Maya"))  # <class \'str\'>\nprint(type(True))    # <class \'bool\'>',
            },
          },
          {
            cardType: 'warning-note',
            title: 'String vs Numeric Type Trap',
            badge: 'Exam Alert',
            body: '"100" is a string (str), whereas 100 is an integer (int). Evaluating "100" + "20" produces "10020" (text concatenation), not 120!',
          },
        ];
        notes = 'Have students predict what type("42") vs type(42) will print before demonstrating in the REPL.';
      } else if (slideNum === 3) {
        title = 'Variable Naming Rules & PEP 8 Standards';
        subtitle = 'Syntax Rules vs Professional Clean Code Conventions';
        cards = [
          {
            cardType: 'numbered-steps',
            title: 'Syntactic Naming Rules (Enforced by Python)',
            badge: 'Syntax Constraints',
            steps: [
              { stepNumber: 1, title: 'Allowed Characters', description: 'Identifiers may only contain letters (a-z, A-Z), digits (0-9), and underscores (_).' },
              { stepNumber: 2, title: 'Never Start with a Digit', description: 'score1 is valid; 1score triggers a SyntaxError at parse time.' },
              { stepNumber: 3, title: 'Strict Case Sensitivity', description: 'total, Total, and TOTAL are treated as three separate variables in memory.' },
              { stepNumber: 4, title: 'No Reserved Keywords', description: 'Cannot use reserved keywords like for, if, def, class, while, import, or return.' },
            ],
          },
          {
            cardType: 'multi-column-feature',
            title: 'PEP 8 Style Recommendations',
            badge: 'Industry Best Practice',
            features: [
              { title: 'snake_case for Variables', description: 'Use lowercase letters separated by underscores: student_age, total_marks.' },
              { title: 'Descriptive & Intention-Revealing', description: 'Use elapsed_time_seconds instead of ambiguous single letters like s or t.' },
              { title: 'UPPER_CASE for Constants', description: 'Values intended to remain constant: PI = 3.14159, MAX_STUDENTS = 30.' },
            ],
          },
        ];
        notes = 'Ask students why adhering to PEP 8 is critical when working on large collaborative software projects.';
      } else if (slideNum === 4) {
        title = 'Type Conversion (Casting) & Operations';
        subtitle = 'Explicit Type Transformation & Operator Behavior';
        cards = [
          {
            cardType: 'multi-column-feature',
            title: 'Explicit Casting Functions',
            badge: 'Built-in Converters',
            features: [
              { title: 'int()', description: 'Converts numeric strings or floats to integers: int("42") → 42, int(9.99) → 9 (truncates toward zero).' },
              { title: 'float()', description: 'Converts integers or numeric strings to floats: float(10) → 10.0, float("3.14") → 3.14.' },
              { title: 'str()', description: 'Converts any data value to its string representation: str(100) → "100", str(True) → "True".' },
              { title: 'bool()', description: 'Truthiness check: 0, 0.0, "", None evaluate to False; non-empty values evaluate to True.' },
            ],
          },
          {
            cardType: 'problem-solution',
            title: 'Fixing the Common input() Type Bug',
            badge: 'Debugging Scenario',
            problem: {
              title: 'User Input Type Mismatch',
              text: 'In Python, input() always returns a string (str). If a student writes age = input() + 1, Python crashes with TypeError: can only concatenate str to str.',
            },
            solution: {
              title: 'Explicit Integer Conversion',
              text: 'user_text = "16"  # value entered by user\nage = int(user_text)  # convert string to integer\nnext_year = age + 1\nprint(f"Next year you will be {next_year} years old.")  # 17',
            },
          },
        ];
        notes = 'Emphasize that Python will not automatically guess that a string should be treated as a number — casting must be explicit.';
      } else if (slideNum === 5) {
        title = 'Hands-on Code Walkthrough & Output Prediction';
        subtitle = 'Step-by-Step Execution Tracing & State Analysis';
        cards = [
          {
            cardType: 'problem-solution',
            title: 'Console Output Prediction Challenge',
            badge: 'Code Trace',
            problem: {
              title: 'Trace Program Execution',
              text: 'Trace each line of this Python program and predict the exact console output:\n\na = 10\nb = 4.5\nc = "25"\n\nx = a + int(b)          # Line 1\ny = str(a) + c          # Line 2\nz = (x > 12) and (a == 10)  # Line 3\n\nprint("x =", x)\nprint("y =", y)\nprint("z =", z)',
            },
            solution: {
              title: 'Step-by-Step Execution Analysis',
              text: '• Line 1: int(4.5) truncates to 4. 10 + 4 = 14 (int). Result: x = 14\n• Line 2: str(10) becomes "10". Concatenation "10" + "25" = "1025". Result: y = 1025\n• Line 3: (14 > 12) is True, and (10 == 10) is True. True and True is True. Result: z = True',
            },
          },
          {
            cardType: 'numbered-steps',
            title: 'Mental Tracing Protocol',
            badge: 'Debugging Skill',
            steps: [
              { stepNumber: 1, title: 'Track Variables in a Table', description: 'Record variable names, current values, and their active types at each line.' },
              { stepNumber: 2, title: 'Check Operator Semantics', description: '+ performs addition on numbers, but concatenation on strings.' },
              { stepNumber: 3, title: 'Evaluate Boolean Logic', description: 'Break down compound expressions into left and right sub-evaluations.' },
            ],
          },
        ];
        notes = 'Give students 2 minutes to calculate x, y, and z independently before showing the verified solution.';
      } else {
        // Last slide / Review
        title = 'Unit Review & Concept Mastery Exit Ticket';
        subtitle = 'Summary Checklist & Formative Assessment';
        cards = [
          {
            cardType: 'summary',
            title: 'Core Concept Summary',
            badge: 'Unit Takeaways',
            takeaways: [
              'Variables in Python are dynamically typed references to objects in memory created with =.',
              'The 4 core primitive types are int, float, str, and bool.',
              'Use type() to verify variable types and int(), float(), str() for explicit type conversion.',
              'Always follow PEP 8 snake_case naming conventions and descriptive variable names.',
            ],
            recapNote: 'Descriptive variable names and conscious type handling prevent the majority of beginner logic errors.',
          },
          {
            cardType: 'question-answer',
            title: 'Formative Exit Ticket Challenge',
            badge: 'Exit Ticket',
            question: 'What is the output of print(type(10 / 2)) and print(type(10 // 2)) in Python 3?',
            answer: '<class \'float\'> and <class \'int\'>',
            explanation: 'True division (/) always returns a float in Python 3 (5.0), whereas floor division (//) truncates to the nearest integer (5).',
          },
        ];
        notes = 'Collect answers from each student as their exit ticket before leaving class.';
      }
    } else if (seq.recommendedLayout === 'title-hero') {
      title = norm.topic;
      subtitle = `${norm.subject} — Curriculum Lesson Guide`;
      cards = [
        {
          cardType: 'basic-info',
          title: 'Lesson Overview & Learning Goals',
          badge: 'Unit Introduction',
          body: `Welcome to this instructional session on ${norm.topic}. Today we will explore fundamental mechanisms, mathematical relationships, and practical applications.`,
          bulletPoints:
            norm.learningObjectives.length > 0
              ? norm.learningObjectives
              : [
                  `Understand the core definitions and principles of ${norm.topic}`,
                  `Analyze step-by-step methods and worked problems`,
                  `Evaluate real-world applications and avoid common conceptual traps`,
                ],
        },
        {
          cardType: 'key-takeaway',
          title: 'Essential Question',
          badge: 'Guiding Inquiry',
          body: `How do the principles of ${norm.topic} govern observable patterns in ${norm.subject}?`,
        },
      ];
      notes = `Introduce the unit topic and ask students what they already know about ${norm.topic}.`;
    } else if (seq.recommendedLayout === 'concept-explanation' || seq.recommendedLayout === 'definition-formula') {
      title = `${norm.topic}: Core Terminology & Principles`;
      subtitle = `Foundations of ${norm.subject}`;
      cards = [
        {
          cardType: 'definition',
          title: 'Key Terminology',
          badge: 'Formal Definition',
          term: norm.topic,
          formalDefinition: `The foundational concept in ${norm.subject} governing system behavior, quantitative interactions, and empirical observation.`,
          example: `Observed whenever theoretical principles meet experimental classroom measurements.`,
        },
        {
          cardType: 'metric-highlight',
          title: 'Standard Reference',
          badge: 'SI / Metric Scale',
          metricValue: '100%',
          metricLabel: 'Conservation & Invariance',
          metricSubtext: `Universal property applied in standard ${norm.subject} curricula.`,
        },
        {
          cardType: 'basic-info',
          title: 'Underlying Mechanism',
          badge: 'Core Principles',
          body: `Understanding how ${norm.topic} operates requires decomposing its primary governing laws:`,
          bulletPoints: [
            `Primary governing law and initial state conditions`,
            `Dynamic equilibrium or operational progression`,
            `Observable output variables and measurable impact`,
          ],
        },
      ];
      notes = `Have students copy this formal definition into their notes. Clarify any unfamiliar terminology.`;
    } else if (seq.recommendedLayout === 'mathematical-explanation') {
      title = `${norm.topic}: Analytical Derivation`;
      subtitle = `Mathematical Framework & Step-by-Step Proof`;
      cards = [
        {
          cardType: 'definition',
          title: 'Governing Formulation',
          badge: 'Governing Formula',
          term: norm.topic,
          formalDefinition: `The quantitative relationship governing ${norm.topic} across system boundaries:`,
          formula: isMath ? 'f(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x) - f(x)}{\\Delta x}' : 'E = mc^2',
          example: `Standard canonical form utilized in analytical problem solving.`,
        },
        {
          cardType: 'problem-solution',
          title: 'Step-by-Step Derivation',
          badge: 'Derivation Protocol',
          problem: {
            title: 'Theoretical Premise',
            text: `Formulate the general expression for ${norm.topic} starting from first principles.`,
          },
          solution: {
            title: 'Derivation Steps',
            text: `1. Define system parameters and conserved quantities.\n2. State boundary conditions and differential limits.\n3. Integrate across domain to obtain closed-form expression.`,
          },
        },
        {
          cardType: 'key-takeaway',
          title: 'Physical Invariance',
          badge: 'Invariant Property',
          body: `The derived expression remains valid regardless of coordinate transformations, confirming underlying conservation principles.`,
        },
      ];
      notes = `Walk through the derivation line by line. Highlight the mathematical transition between steps 2 and 3.`;
    } else if (seq.recommendedLayout === 'comparison') {
      title = `${norm.topic}: Comparative Analysis`;
      subtitle = `Evaluating Contrasting Systems & Trade-offs`;
      cards = [
        {
          cardType: 'comparison',
          title: 'Contrasting Paradigms',
          badge: 'Comparative Matrix',
          leftColumn: {
            title: 'Classical Framework',
            items: [
              'Deterministic predictability across all state variables',
              'Direct linear proportionality to applied forces',
              'Continuous energy state transitions',
            ],
          },
          rightColumn: {
            title: 'Modern / Advanced Framework',
            items: [
              'Probabilistic density distributions and wave packets',
              'Non-linear feedback loops and coupled dynamics',
              'Discrete quantized energy state transitions',
            ],
          },
        },
        {
          cardType: 'summary',
          title: 'Synthesis & Decision Rule',
          badge: 'Takeaway',
          takeaways: [
            'Use the classical framework for macroscopic, low-velocity regimes.',
            'Transition to the modern framework when scale approaches atomic dimensions.',
          ],
        },
      ];
      notes = `Ask students which framework they would select for designing a bridge versus an electron microscope.`;
    } else if (seq.recommendedLayout === 'diagram-explanation') {
      title = `${norm.topic}: Structural Mechanism`;
      subtitle = `Schematic Anatomy & Flow Dynamics`;
      cards = [
        {
          cardType: 'basic-info',
          title: 'System Component Breakdown',
          badge: 'Schematic Anatomy',
          body: `Detailed operational layout showing interactions between input, processing, and output stages for ${norm.topic}:`,
          bulletPoints: [
            'Primary Input Inflow: Regulated intake with feedback threshold controls',
            'Central Transform Engine: Core reaction or computation zone',
            'Stabilized Output: Desired steady-state energy or information stream',
          ],
        },
        {
          cardType: 'numbered-steps',
          title: 'Stage Progression',
          badge: 'Cycle Sequence',
          steps: [
            { stepNumber: 1, title: 'Initiation', description: 'Threshold excitation triggers active state.' },
            { stepNumber: 2, title: 'Transformation', description: 'Catalytic or energetic conversion takes place.' },
            { stepNumber: 3, title: 'Relaxation & Reset', description: 'System returns to baseline equilibrium.' },
          ],
        },
      ];
      notes = `Guide students’ eyes through the system diagram from left to right, tracing the flow of matter or information.`;
    } else if (seq.recommendedLayout === 'step-process') {
      title = `${norm.topic}: Execution Protocol`;
      subtitle = `Standard Operating Procedure`;
      cards = [
        {
          cardType: 'numbered-steps',
          title: 'Sequential Procedure',
          badge: 'Standard Protocol',
          steps: [
            { stepNumber: 1, title: 'Formulate Parameters', description: 'Identify given parameters, boundary constraints, and target unknowns.' },
            { stepNumber: 2, title: 'Standardize Units', description: 'Convert all quantities to standard SI units before applying formulas.' },
            { stepNumber: 3, title: 'Execute Calculation', description: 'Apply governing relationship and simplify algebraically.' },
            { stepNumber: 4, title: 'Verify & Check Limits', description: 'Evaluate extreme limits and dimensional consistency.' },
          ],
        },
        {
          cardType: 'warning-note',
          title: 'Execution Quality Gates',
          badge: 'Verification Gate',
          body: 'Never proceed past step 2 without explicit dimensional checks. Over 80% of procedural errors stem from unstandardized units.',
        },
      ];
      notes = `Emphasize why step 4 (verifying limits) separates novice problem-solvers from expert practitioners.`;
    } else if (seq.recommendedLayout === 'problem-solution') {
      title = `${norm.topic}: Worked Example & Analysis`;
      subtitle = `Classroom Problem-Solving Demonstration`;
      cards = [
        {
          cardType: 'problem-solution',
          title: 'Classroom Challenge Problem',
          badge: 'Worked Example',
          problem: {
            title: 'Problem Statement',
            text: `Given an initial system state involving ${norm.topic}, determine the resultant equilibrium or output state under standard operating conditions.`,
          },
          solution: {
            title: 'Step-by-Step Resolution',
            text: `1. Identify known and unknown variables.\n2. Apply the governing principle for ${norm.subject}.\n3. Solve quantitatively and verify boundary limits.`,
          },
        },
        {
          cardType: 'numbered-steps',
          title: 'Problem-Solving Protocol',
          badge: 'Strategy',
          steps: [
            { stepNumber: 1, title: 'State Given Values', description: 'Extract all parameters from the problem text.' },
            { stepNumber: 2, title: 'Select Principle', description: `Apply the fundamental rule of ${norm.topic}.` },
            { stepNumber: 3, title: 'Evaluate & Check Units', description: 'Verify physical dimensions and reasonable scale.' },
          ],
        },
      ];
      notes = `Work through step 1 with the whole class, then give students 2 minutes to attempt step 2 independently.`;
    } else if (seq.recommendedLayout === 'two-column-split') {
      title = `${norm.topic}: Applications & Pitfalls`;
      subtitle = `Practical Realities & Conceptual Pitfalls`;
      cards = [
        {
          cardType: 'multi-column-feature',
          title: 'Real-World Applications',
          badge: 'Technology & Nature',
          features: [
            { title: 'Engineering Systems', description: `Directly harnessed to design resilient modern systems.` },
            { title: 'Scientific Research', description: `Used in laboratories to predict and verify experimental outcomes.` },
          ],
        },
        {
          cardType: 'warning-note',
          title: 'Common Misconceptions',
          badge: 'Exam Tip',
          body: `Students frequently confuse primary drivers with secondary effects. Always identify the root cause before drawing conclusions.`,
        },
      ];
      notes = `Highlight the common misconception on the right; emphasize that this is a frequent pitfall on standardized exams.`;
    } else if (seq.recommendedLayout === 'summary-quiz' || seq.recommendedLayout === 'summary-takeaway') {
      title = `${norm.topic}: Review & Exit Ticket`;
      subtitle = `Key Takeaways & Formative Assessment`;
      cards = [
        {
          cardType: 'summary',
          title: 'Summary Checklist',
          badge: 'Key Takeaways',
          takeaways: [
            `${norm.topic} provides the foundational framework for analyzing ${norm.subject} phenomena.`,
            `Key variables must be verified with correct dimensional units.`,
            `Always test edge cases and boundary limits during problem analysis.`,
          ],
          recapNote: `Review textbook section for homework practice questions.`,
        },
        {
          cardType: 'question-answer',
          title: 'Check for Understanding',
          badge: 'Exit Ticket',
          question: `In your own words, what is the primary role of ${norm.topic} in ${norm.subject}?`,
          answer: `It establishes the fundamental balance, relationship, and predictive rules governing the system.`,
          explanation: `Students should be able to articulate this without consulting their notes.`,
        },
      ];
      notes = `Give students 3 minutes to write their exit ticket answer before dismissing class.`;
    } else {
      // General concept overview
      title = `${norm.topic}: ${seq.role}`;
      subtitle = `${norm.subject} • ${norm.gradeLevel}`;
      cards = [
        {
          cardType: 'basic-info',
          title: 'Core Discussion Points',
          badge: 'Curriculum Focus',
          body: `Detailed exploration of ${norm.topic} calibrated for ${norm.gradeLevel} students.`,
          bulletPoints: [
            `First key characteristic of ${norm.topic}`,
            `Interactions with related ${norm.subject} concepts`,
            `Practical classroom observation and measurement`,
          ],
        },
      ];
    }

    let slideFormula: string | undefined;
    const formulaCard = cards.find((c) => c.formula);
    if (formulaCard?.formula) {
      slideFormula = formulaCard.formula;
    }

    let workedExample: any | undefined;
    const lowerTitleStr = (title || '').toLowerCase();
    if (isPython && (lowerTitleStr.includes('walkthrough') || lowerTitleStr.includes('example') || lowerTitleStr.includes('code') || lowerTitleStr.includes('cast'))) {
      workedExample = {
        title: 'Step-by-Step Code Execution Example',
        problemStatement: 'Trace and predict output: age_str = "15"; age = int(age_str) + 1; print(age)',
        steps: [
          'Step 1: age_str is assigned string "15"',
          'Step 2: int(age_str) converts "15" into numeric integer 15',
          'Step 3: 15 + 1 evaluates to integer 16',
          'Step 4: print(age) outputs 16 to console',
        ],
        finalAnswer: '16',
      };
    } else if (lowerTitleStr.includes('factoris') || lowerTitleStr.includes('factor') || lowerTitleStr.includes('example')) {
      workedExample = {
        title: 'Step-by-Step Factoring Example',
        problemStatement: 'Solve for x: x² - 5x + 6 = 0',
        steps: [
          'Find two numbers that multiply to 6 and add to -5: -2 and -3',
          'Rewrite as factored binomials: (x - 2)(x - 3) = 0',
          'Apply Zero Product Property: x - 2 = 0 or x - 3 = 0',
          'Conclusion: The roots are x = 2 and x = 3',
        ],
        finalAnswer: 'x = 2, 3',
      };
    }

    return {
      slideNumber: slideNum,
      title,
      subtitle,
      layout,
      formula: slideFormula,
      workedExample,
      cards,
      notes,
    };
  });

  return {
    topic: norm.topic,
    subject: norm.subject,
    gradeLevel: norm.gradeLevel,
    themeId: norm.themeId,
    slides,
    language: norm.language,
    estimatedDurationMinutes: norm.durationMinutes,
    learningObjectives: norm.learningObjectives,
    source: 'curriculum-template',
    isTemplateFallback: true,
  };
}

// ─── Main Content Generation Orchestrator ─────────────────────────────────────

export interface ContentGenerationOptions {
  providerManager?: AIProviderManager;
  provider?: AIProviderType;
  model?: string;
  signal?: AbortSignal;
  forceTemplateFallback?: boolean;
}

export async function generateTeachingContent(
  input: TeacherPromptInput,
  options?: ContentGenerationOptions
): Promise<ContentGenerationResult> {
  const manager = options?.providerManager || aiProviderManager;
  const normInput = normalizeTeacherInput(input);

  // If template fallback forced or no topic provided
  if (options?.forceTemplateFallback || !normInput.topic) {
    const templateDeck = generateCurriculumTemplateFallback(normInput);
    return {
      success: true,
      deck: templateDeck,
      source: 'curriculum-template',
    };
  }

  // Check if active provider is configured and available
  const activeProvider = options?.provider || manager.getActiveProvider();
  let isProviderReady = false;

  try {
    if (activeProvider === 'ollama') {
      const status = await manager.checkOllamaStatus();
      isProviderReady = status.available && (status.status === 'ready' || status.installedModels.length > 0);
    } else {
      isProviderReady = await manager.hasApiKey(activeProvider);
    }
  } catch {
    isProviderReady = false;
  }

  // If no AI provider configured, generate rich curriculum template fallback
  if (!isProviderReady) {
    const fallbackDeck = generateCurriculumTemplateFallback(normInput);
    return {
      success: true,
      deck: fallbackDeck,
      source: 'curriculum-template',
      warnings: [
        `No active AI provider configured for "${activeProvider}". Generated offline curriculum-template presentation.`,
      ],
    };
  }

  // Provider is ready: build prompts and request structured generation
  const { systemPrompt, userPrompt } = buildTeachingPresentationPrompt(normInput);
  const selectedModel = options?.model || manager.getSelectedModel(activeProvider);

  try {
    const response = await manager.generateStructuredJson<PresentationDeckSpec>({
      provider: activeProvider,
      model: selectedModel,
      systemPrompt,
      prompt: userPrompt,
      signal: options?.signal,
      timeoutMs: manager.getTimeoutMs(),
    });

    let rawData: PresentationDeckSpec | null = null;
    if (response.success && response.data) {
      rawData = response.data;
    } else if (response.rawText) {
      const extracted = extractJsonFromResponse<PresentationDeckSpec>(response.rawText);
      if (extracted.data) {
        rawData = extracted.data;
      }
    }

    if (rawData) {
      let validated = validateDeckContent(rawData, normInput);

      // Targeted Retry Pipeline: If generated slides have failed validation (missing formulas, empty content, etc.)
      if (
        (validated.status === 'failed' || validated.slideReports?.some((r) => r.status === 'failed')) &&
        !options?.signal?.aborted
      ) {
        const failedSlides = (validated.slideReports || []).filter((r) => r.status === 'failed');
        const critiquePrompt =
          `CRITICAL PEDAGOGICAL CORRECTION REQUIRED:\n` +
          `The generated presentation on "${normInput.topic}" contained ${failedSlides.length} slide(s) that failed automated educational quality validation:\n` +
          failedSlides
            .map(
              (s) =>
                `- Slide ${s.slideNumber} ("${s.title}"): ${s.issues.join('; ')} (current word count: ${s.wordCount})`
            )
            .join('\n') +
          `\nREQUIREMENTS FOR RETRY:\n` +
          `1. Every slide must contain complete educational explanations (at least 30-60 words per slide across its cards).\n` +
          `2. Mathematical and scientific formulas MUST be written in valid LaTeX syntax delimited by $$...$$ (e.g., $$ax^2 + bx + c = 0$$, $$\\Delta = b^2 - 4ac$$, $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).\n` +
          `3. Method/solving slides MUST include a concrete numerical problem statement and step-by-step worked solution.\n` +
          `4. No blank slides or titles with only empty bullet points.\n\n` +
          `Please regenerate the entire presentation JSON with these corrections. Return pure JSON matching PresentationDeckSpec schema.`;

        try {
          const retryResponse = await manager.generateStructuredJson<PresentationDeckSpec>({
            provider: activeProvider,
            model: selectedModel,
            systemPrompt,
            prompt: critiquePrompt,
            signal: options?.signal,
            timeoutMs: manager.getTimeoutMs(),
          });

          let retryData: PresentationDeckSpec | null = null;
          if (retryResponse.success && retryResponse.data) {
            retryData = retryResponse.data;
          } else if (retryResponse.rawText) {
            const ext = extractJsonFromResponse<PresentationDeckSpec>(retryResponse.rawText);
            if (ext.data) retryData = ext.data;
          }

          if (retryData) {
            const retryVal = validateDeckContent(retryData, normInput);
            if ((retryVal.overallScore || 0) >= (validated.overallScore || 0)) {
              validated = retryVal;
            }
          }
        } catch {
          // Retry failed or timed out; fail soft and continue with validated (auto-repaired) deck
        }
      }

      return {
        success: true,
        deck: validated.deck,
        source: 'ai',
        modelUsed: response.model || selectedModel,
        warnings: validated.errors.length > 0 ? validated.errors : undefined,
      };
    }

    // Model produced unparseable output — fall back safely to curriculum template
    const fallbackDeck = generateCurriculumTemplateFallback(normInput);
    return {
      success: true,
      deck: fallbackDeck,
      source: 'curriculum-template',
      warnings: [
        `AI model returned malformed output (${response.error || 'unparseable JSON'}). Generated structured curriculum template fallback.`,
      ],
    };
  } catch (err: any) {
    const fallbackDeck = generateCurriculumTemplateFallback(normInput);
    return {
      success: true,
      deck: fallbackDeck,
      source: 'curriculum-template',
      warnings: [
        `AI generation failed (${err?.message || 'network timeout'}). Generated structured curriculum template fallback.`,
      ],
    };
  }
}
