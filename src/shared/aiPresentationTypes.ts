/**
 * aiPresentationTypes.ts — Shared Types for AI Teaching Presentation Generator
 * Milestone 5: Professional 16:9 Educational Presentation Subsystem
 */

import { BoundingBox, CanvasObject, ImageObject, Page, ShapeType, TextPreset } from './types';

export type { BoundingBox };

// ─── Slide Dimensions & Margins ───────────────────────────────────────────────

export const DEFAULT_SLIDE_WIDTH = 1920;
export const DEFAULT_SLIDE_HEIGHT = 1080;

export interface SlideMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const DEFAULT_SLIDE_MARGINS: SlideMargins = {
  top: 70,
  bottom: 70,
  left: 80,
  right: 80,
};

// ─── Grid System ──────────────────────────────────────────────────────────────

export const DEFAULT_GRID_COLUMNS = 12;
export const DEFAULT_GRID_GUTTER = 24;

export interface SlideGridConfig {
  columns: number;
  gutter: number;
  rowGutter?: number;
}

export interface GridBoundsOptions {
  colStart: number; // 1-indexed (1 to 12)
  colSpan: number;  // 1 to 12
  top: number;
  height: number;
  containerBounds?: BoundingBox;
  gridConfig?: SlideGridConfig;
}

// ─── Alignment Types ──────────────────────────────────────────────────────────

export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

// ─── Slide Region System ──────────────────────────────────────────────────────

export interface SlideRegions {
  contentBounds: BoundingBox;  // Total usable canvas bounds within margins
  headerBounds: BoundingBox;   // Header zone (title + subtitle)
  titleBounds: BoundingBox;    // Primary slide title
  subtitleBounds?: BoundingBox;// Optional category/subtitle pill
  bodyBounds: BoundingBox;     // Main educational content area
  footerBounds?: BoundingBox;  // Bottom metadata (page number, topic tag)
}

export interface SlideRegionOptions {
  margins?: SlideMargins;
  hasSubtitle?: boolean;
  hasFooter?: boolean;
  headerHeight?: number;
  footerHeight?: number;
  slideWidth?: number;
  slideHeight?: number;
}

// ─── Column Layouts ───────────────────────────────────────────────────────────

export type ColumnSplitType =
  | 'single'
  | 'two-equal'         // 50% / 50% (6 / 6 cols)
  | 'two-concept-demo'  // 60% / 40% (7 / 5 cols)
  | 'two-sidebar-main'  // 30% / 70% (4 / 8 cols)
  | 'two-main-sidebar'  // 70% / 30% (8 / 4 cols)
  | 'three-equal'       // 33.3% x 3 (4 / 4 / 4 cols)
  | 'four-equal';       // 25% x 4 (3 / 3 / 3 / 3 cols)

export interface ColumnLayoutOptions {
  containerBounds: BoundingBox;
  splitType?: ColumnSplitType;
  customRatios?: number[]; // e.g. [2, 1] or [1, 2, 1]
  gutter?: number;
}

// ─── Multi-Card Layouts ───────────────────────────────────────────────────────

export interface MultiCardLayoutOptions {
  containerBounds: BoundingBox;
  cardCount: number;
  columns?: number;
  rows?: number;
  gapX?: number;
  gapY?: number;
}

export interface CardBoundsResult {
  cards: BoundingBox[];
  cardPadding: number;
  innerBounds: BoundingBox[];
  columns: number;
  rows: number;
}

// ─── Text Measurement & Overflow ──────────────────────────────────────────────

export interface TextMeasureOptions {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  lineHeightMultiplier?: number;
  maxWidth: number;
  maxHeight?: number;
  maxLines?: number;
  minFontSize?: number;
  maxFontSize?: number;
  allowShrink?: boolean;
}

export interface TextOverflowDetails {
  isOverflow: boolean;
  requiredHeight: number;
  availableHeight: number;
  requiredWidth: number;
  availableWidth: number;
  hiddenLineCount: number;
  warningMessage?: string;
}

export interface TextMeasureResult {
  lines: string[];
  lineHeight: number;
  totalWidth: number;
  totalHeight: number;
  actualFontSize: number;
  isOverflow: boolean;
  overflowDetails?: TextOverflowDetails;
}

// ─── Slide Layout & Template Archetypes ────────────────────────────────────────

export type SlideLayoutType =
  | 'title-hero'               // Title + Subtitle + Subject/Teacher metadata
  | 'concept-overview'         // Header + 1 large card with key concept
  | 'concept-explanation'      // Template A: Definition + Main Concept + Key Points + Example
  | 'two-column-split'         // 50/50 Concept vs Example / Theory vs Application
  | 'three-card-grid'          // 3 pillars / steps / principles
  | 'four-card-grid'           // 2x2 or 1x4 concept matrix
  | 'problem-solution'         // Template E: Left: Challenge/Question, Right: Worked Solution
  | 'definition-formula'       // Template B: Definition + Formula Card + Classroom Notes
  | 'mathematical-explanation' // Template B: Formal Premise + LaTeX Formula + Step Derivation + Example
  | 'comparison'               // Template C: Comparison Table + Key Differences + Conclusion
  | 'diagram-explanation'      // Template D: Diagram/Figure + Annotations + Explanation + Takeaway
  | 'timeline-milestones'      // Horizontal progression of 3-5 stages
  | 'step-process'             // Stepwise protocol with numbered milestones
  | 'summary-quiz'             // Key takeaways + Check for Understanding Q&A
  | 'summary-takeaway';        // Template F: Core Concepts + Formula Summary + Takeaways + Exit Question

export type SlideTemplateCategory =
  | 'intro'
  | 'concept'
  | 'math'
  | 'comparison'
  | 'diagram'
  | 'problem-solving'
  | 'process'
  | 'summary'
  | 'activity';

export type PlaceholderContentType =
  | 'title'
  | 'subtitle'
  | 'text'
  | 'bullet-list'
  | 'latex-formula'
  | 'formula'
  | 'definition'
  | 'problem-statement'
  | 'step-sequence'
  | 'comparison-table'
  | 'diagram'
  | 'diagram-viewport'
  | 'callout-takeaway'
  | 'metric-highlight'
  | 'table'
  | 'interactive-activity';

export interface PlaceholderFormatting {
  fontSize?: number;
  fontWeight?: number | string;
  fontFamilyKey?: 'heading' | 'body' | 'code';
  textAlign?: 'left' | 'center' | 'right';
  colorRole?: 'primary' | 'secondary' | 'accent' | 'muted' | 'highlight';
  backgroundColorRole?: 'card' | 'surface' | 'accentMuted' | 'transparent';
  borderRole?: 'cardBorder' | 'accent' | 'none';
  borderRadius?: number;
  padding?: number;
}

export interface SlidePlaceholderDefinition {
  id: string;
  role: string;
  contentType: PlaceholderContentType;
  label: string;
  bounds: BoundingBox;
  isRequired: boolean;
  defaultPlaceholderText?: string;
  defaultFormula?: string;
  defaultBulletPoints?: string[];
  defaultBadge?: string;
  defaultTable?: { headers: string[]; rows: string[][] };
  defaultSteps?: { stepNumber: number; title: string; content: string }[];
  formatting?: PlaceholderFormatting;
  overflowBehavior?: 'wrap' | 'fit-font' | 'truncate';
  minItems?: number;
  maxItems?: number;
}

export interface SlideTemplateDefinition {
  id: SlideLayoutType;
  name: string;
  category: SlideTemplateCategory;
  description: string;
  recommendedFor: string[];
  aspectRatio: '16:9';
  width: number;
  height: number;
  decorations?: {
    hasHeaderDivider?: boolean;
    hasAccentBar?: boolean;
    hasFooterNumbering?: boolean;
    backgroundPattern?: 'none' | 'dots' | 'grid' | 'gradient';
  };
  placeholders: SlidePlaceholderDefinition[];
}

export interface SlideFilledContent {
  title?: string;
  subtitle?: string;
  cards?: HtmlCardSpec[];
  notes?: string;
  values?: Record<string, string | string[] | Record<string, unknown>>;
}

// ─── Custom Slide Master & Outline Models (Milestone 5 / Phase 2) ─────────────

export interface CustomMasterDecorationShape {
  id: string;
  shapeType: 'rect' | 'circle' | 'line' | 'pill' | 'badge';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  label?: string;
}

export interface CustomMasterDecorationConfig {
  hasHeaderDivider: boolean;
  headerDividerColor?: string;
  hasAccentBar: boolean;
  accentBarPosition?: 'top' | 'left' | 'card-accent';
  accentBarColor?: string;
  hasFooter: boolean;
  footerText?: string;
  showSlideNumber: boolean;
  hasBrandingLogo: boolean;
  brandingText?: string;
  brandingSubtext?: string;
  customShapes?: CustomMasterDecorationShape[];
}

export interface CustomSlideMasterTheme {
  id?: string;
  name?: string;
  backgroundColor: string;
  surfaceColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
  fontFamilyHeading: string;
  fontFamilyBody: string;
}

export interface CustomSlideMaster {
  id: string;
  name: string;
  description?: string;
  isBuiltIn?: boolean;
  isPreset?: boolean;
  brandingText?: string;
  createdAt: number;
  updatedAt: number;
  aspectRatio: '16:9';
  width: number;
  height: number;
  theme: CustomSlideMasterTheme;
  decorations: CustomMasterDecorationConfig;
  placeholders: SlidePlaceholderDefinition[];
}

export interface SlideOutlineItem {
  id?: string;
  slideNumber?: number;
  title: string;
  objective?: string;
  actionGoal?: string;
  teachingNotesHint?: string;
  layoutArchetype?: SlideLayoutType;
  selected?: boolean;
  changeStatus?: 'added' | 'modified' | 'removed' | 'unchanged';
}

export interface OutlineChatMessage {
  id: string;
  sender: 'teacher' | 'assistant';
  text: string;
  timestamp: number;
  changes?: {
    added?: string[];
    modified?: string[];
    removed?: string[];
    reordered?: boolean;
  };
}

export interface OutlineRefinementResult {
  explanation: string;
  updatedOutline: SlideOutlineItem[];
  changes: {
    added: string[];
    modified: string[];
    removed: string[];
    reordered: boolean;
  };
  appliedInstructions?: string;
}

// ─── Live Generation Types (Phase 6: Gamma-Style Progressive Workspace) ────────

export type SlideGenerationState =
  | 'waiting'
  | 'generating-content'
  | 'selecting-layout'
  | 'rendering'
  | 'completed'
  | 'failed';

export interface LiveSlideItem {
  id: string;
  slideNumber: number;
  title: string;
  actionGoal?: string;
  layoutArchetype?: SlideLayoutType;
  status: SlideGenerationState;
  contentSpec?: SlideContentSpec;
  page?: Page;
  error?: string;
  progressMessage?: string;
  editedByUser?: boolean;
}

export interface LiveGenerationOptions {
  topic: string;
  subject?: string;
  gradeLevel?: string;
  language?: string;
  difficulty?: TeachingDifficulty;
  teachingStyle?: TeachingStyle;
  themeId?: PresentationThemeId;
  customMasterId?: string;
  customMaster?: CustomSlideMaster;
  provider?: AIProviderType;
  model?: string;
  signal?: AbortSignal;
  onSlideUpdate?: (updatedSlide: LiveSlideItem, allSlides: LiveSlideItem[]) => void;
  onSlideCompleted?: (completedSlide: LiveSlideItem, allSlides: LiveSlideItem[]) => void;
  onProgress?: (completedCount: number, totalCount: number, currentSlideTitle: string) => void;
}

// ─── Educational Themes & Palettes ────────────────────────────────────────────

export type PresentationThemeId =
  | 'modern-academic'      // Clean white background with professional sapphire blue accents
  | 'dark-technology'      // Dark navy background with electric cyan and violet accents
  | 'minimal-classroom'    // Soft light background, simple typography, subtle cards
  | 'science-engineering'  // Technical slate background, blueprint cards, structured diagram palette
  | 'colorful-education'   // Cheerful, high-contrast classroom-oriented palette
  | 'editorial'            // Typography-focused, warm cream background with serif headings
  | 'nature-geography'     // Earth-inspired sage and terracotta colors with natural hierarchy
  | 'chalkboard-classic'   // Traditional deep green chalkboard with golden and white chalk markings
  | 'ocean-breeze'         // Deep maritime ocean with seafoam mint and sky blue
  // Legacy aliases
  | 'modern-dark'
  | 'clean-minimal'
  | 'stem-cyber'
  | 'warm-academic';

export interface ThemeTypography {
  fontFamilyHeading: string;
  fontFamilyBody: string;
  fontFamilyCode: string;
  headingWeight: number | string;
  bodyWeight: number | string;
  titleSize: number;       // e.g. 48-52
  subtitleSize: number;    // e.g. 22-26
  headingSize: number;     // e.g. 26-30
  bodySize: number;        // e.g. 18-20
  captionSize: number;     // e.g. 13-14
}

export interface ThemeBorderRadius {
  sm: number;   // 4-6
  md: number;   // 8-10
  lg: number;   // 14-18
  card: number; // 12-16
}

export interface ThemeSpacing {
  xs: number;   // 6
  sm: number;   // 12
  md: number;   // 20
  lg: number;   // 32
  xl: number;   // 48
}

export interface ThemeSemanticColors {
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface PresentationTheme {
  id: PresentationThemeId;
  name: string;
  description: string;
  isDark: boolean;
  backgroundColor: string;
  surfaceColor: string;
  cardBackground: string;
  cardBorder: string;
  cardRadius: number;
  cardShadow?: string;
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  accentColor: string;
  accentMuted: string;
  highlightColor: string;
  codeBackground: string;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  spacing: ThemeSpacing;
  chartPalette: string[];
  semantic: ThemeSemanticColors;

  // Flattened convenience accessors
  fontFamilyHeading: string;
  fontFamilyBody: string;
}

// ─── AI Provider Configuration ────────────────────────────────────────────────

export type AIProviderType = 'openai' | 'gemini' | 'ollama' | 'custom-openai';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey?: string;        // Stored encrypted via Electron safeStorage
  endpoint?: string;      // e.g. http://localhost:11434 for Ollama, or custom OpenAI endpoint
  selectedModel: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProviderType;
  isLocal: boolean;
  contextLength?: number;
  sizeBytes?: number;
  sizeFormatted?: string;
  family?: string;
  parameterSize?: string;
  quantizationLevel?: string;
  modifiedAt?: string;
}

export type OllamaStatus =
  | 'unavailable'       // Server not reachable / not running
  | 'no-models'         // Server reachable, but 0 models installed
  | 'ready'             // Server reachable and models available
  | 'loading-model'     // Model currently loading into VRAM/RAM
  | 'generating'        // Active generation in progress
  | 'completed'         // Generation complete
  | 'error';            // Generation or server error

export interface OllamaStatusInfo {
  status: OllamaStatus;
  available: boolean;
  message: string;
  installedModels: AIModelInfo[];
  selectedModelAvailable: boolean;
  version?: string;
}

export interface AIConnectionTestResult {
  success: boolean;
  provider: AIProviderType;
  latencyMs?: number;
  models?: string[];
  error?: string;
  warning?: string;
}

export interface AITokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AITextGenerationRequest {
  provider?: AIProviderType;
  prompt: string;
  systemPrompt?: string;
  model?: string;
  apiKey?: string;
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onChunk?: (token: string, accumulated: string) => void;
  enableWebSearch?: boolean;
}

export interface AITextGenerationResponse {
  success: boolean;
  text: string;
  model: string;
  provider: AIProviderType;
  finishReason?: string;
  usage?: AITokenUsage;
  groundingSources?: Array<{ title: string; url: string }>;
  error?: string;
}

export interface AIStructuredGenerationRequest extends AITextGenerationRequest {
  schema?: Record<string, unknown>;
  schemaName?: string;
}

export interface AIStructuredGenerationResponse<T = unknown> {
  success: boolean;
  data: T | null;
  rawText: string;
  model: string;
  provider: AIProviderType;
  error?: string;
}

// ─── Structured Presentation Content Specification ───────────────────────────

export type CardComponentType =
  | 'basic-info'            // Heading + badge + paragraphs/bullets
  | 'key-takeaway'          // Highlighted takeaway with emphasis badge & accent border
  | 'definition'            // Term + pronunciation/category + formal definition + example
  | 'problem-solution'      // Side-by-side or stacked problem statement vs worked solution/answer
  | 'metric-highlight'      // Massive statistic/number + descriptive label + trend/subtext
  | 'quote'                 // Quotation text + author citation + source/title
  | 'comparison'            // Side-by-side two-column comparison (e.g. Concept A vs Concept B)
  | 'multi-column-feature'  // 2-4 sub-features with mini-titles and descriptions inside the card
  | 'numbered-steps'        // Ordered sequence 1, 2, 3... with step badges, titles, descriptions
  | 'timeline'              // Chronological events with dates/eras, titles, and descriptions
  | 'warning-note'          // High-visibility cautionary or important exam tip/alert
  | 'question-answer'       // Classroom quiz/discussion: question prompt + answer/reveal block
  | 'interactive-activity'  // Interactive educational activity (MCQ, matching, ordering, reveal)
  | 'summary';              // Bulleted summary with checkmarks/badges and recap takeaway

export interface CardStepItem {
  stepNumber?: number | string;
  title: string;
  description: string;
  badge?: string;
}

export interface TimelineEventItem {
  dateOrEra: string;
  title: string;
  description?: string;
  badge?: string;
}

export interface ComparisonColumnSpec {
  title: string;
  badge?: string;
  items: string[];
  accentColor?: string;
}

export interface ProblemSolutionSpec {
  problemTitle?: string;
  problemText: string;
  problemFormula?: string;
  solutionTitle?: string;
  solutionText: string;
  solutionFormula?: string;
}

export interface WorkedExampleSpec {
  title: string;
  problemStatement: string;
  steps: string[];
  finalAnswer?: string;
}

export interface FeatureItemSpec {
  title: string;
  description: string;
  icon?: string;
  badge?: string;
}

export interface MetricHighlightSpec {
  value: string;
  label: string;
  subtext?: string;
  trend?: string;
}

export interface QuoteSpec {
  text: string;
  author?: string;
  source?: string;
}

export interface DefinitionSpec {
  term: string;
  pronunciation?: string;
  partOfSpeech?: string;
  formalDefinition: string;
  example?: string;
}

export interface QuestionAnswerSpec {
  question: string;
  answer: string;
  explanation?: string;
  revealPrompt?: string;
}

export interface HtmlCardSpec {
  id?: string;
  cardType?: CardComponentType;
  title?: string;
  subtitle?: string;
  badge?: string;
  icon?: string;          // Emoji, SVG name, or STEM icon
  accentColor?: string;

  // Basic content
  body?: string | string[];
  bulletPoints?: string[];
  formula?: string;       // LaTeX formula string

  // Specialized payload models (supporting both nested objects and flat fields)
  metric?: MetricHighlightSpec;
  metricValue?: string;
  metricLabel?: string;
  metricSubtext?: string;

  quote?: QuoteSpec;
  quoteText?: string;
  quoteAuthor?: string;
  quoteSource?: string;

  definition?: DefinitionSpec;
  term?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  formalDefinition?: string;
  example?: string;

  problemSolution?: ProblemSolutionSpec;
  problem?: { title?: string; text: string; formula?: string };
  solution?: { title?: string; text: string; formula?: string };

  comparison?: {
    leftColumn: ComparisonColumnSpec;
    rightColumn: ComparisonColumnSpec;
  };
  leftColumn?: ComparisonColumnSpec;
  rightColumn?: ComparisonColumnSpec;

  steps?: CardStepItem[];
  timelineEvents?: TimelineEventItem[];
  features?: FeatureItemSpec[];

  qa?: QuestionAnswerSpec;
  question?: string;
  answer?: string;
  explanation?: string;
  revealPrompt?: string;

  takeaways?: string[];
  recapNote?: string;
  diagram?: EducationalDiagramSpec;
  activity?: EducationalActivity;

  // Visual card overrides
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
}

/** Legacy alias for backward compatibility */
export type SlideCardSpec = HtmlCardSpec;

export interface CompileCardOptions {
  cardIndex?: number;
  totalCards?: number;
  defaultLayerId?: string;
  createGroup?: boolean;
}

export interface CompileSlideOptions {
  theme?: PresentationTheme;
  themeId?: PresentationThemeId;
  slideIndex?: number;
  totalSlides?: number;
  topic?: string;
  includeBackground?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
  defaultLayerId?: string;
}

export type TeachingStyle =
  | 'interactive'
  | 'lecture'
  | 'socratic'
  | 'inquiry-based'
  | 'storytelling'
  | 'exam-prep';

export type TeachingDifficulty = 'introductory' | 'intermediate' | 'advanced';

export interface TeacherPromptInput {
  topic: string;
  subject?: string;
  gradeLevel?: string;
  language?: string;
  difficulty?: TeachingDifficulty;
  learningObjectives?: string[] | string;
  numberOfSlides?: number;
  durationMinutes?: number;
  teachingStyle?: TeachingStyle;
  additionalInstructions?: string;
  themeId?: PresentationThemeId;
  customMasterId?: string;
  customMaster?: CustomSlideMaster;
  slideOutline?: SlideOutlineItem[];
}

export interface SlideContentSpec {
  slideNumber: number;
  title: string;
  subtitle?: string;
  layout: SlideLayoutType;
  formula?: string;
  formulaName?: string;
  workedExample?: WorkedExampleSpec;
  cards?: HtmlCardSpec[];
  notes?: string;         // Teacher lecture script / presentation notes
  illustrationKeyword?: string;
  diagram?: EducationalDiagramSpec;
  activity?: EducationalActivity;
}

export interface PresentationDeckSpec {
  topic: string;
  gradeLevel: string;
  subject: string;
  themeId: PresentationThemeId;
  slides: SlideContentSpec[];
  language?: string;
  estimatedDurationMinutes?: number;
  learningObjectives?: string[];
  activities?: EducationalActivity[];
  source?: 'ai' | 'curriculum-template';
  isTemplateFallback?: boolean;
}

export interface ContentGenerationResult {
  success: boolean;
  deck: PresentationDeckSpec;
  source: 'ai' | 'curriculum-template';
  modelUsed?: string;
  warnings?: string[];
  error?: string;
}

export interface SlideValidationReport {
  slideNumber: number;
  title: string;
  status: 'success' | 'partial' | 'failed';
  score: number;
  issues: string[];
  hasFormulas: boolean;
  validLatex: boolean;
  wordCount: number;
  hasExplanationOrExample: boolean;
}

export interface DeckValidationResult {
  isValid: boolean;
  deck: PresentationDeckSpec;
  errors: string[];
  warnings?: string[];
  repaired: boolean;
  slideReports?: SlideValidationReport[];
  status?: 'success' | 'partial' | 'failed';
  overallScore?: number;
}

// ─── Asset Resolution & Educational Diagram Specifications ───────────────────

export type PlaceholderCategory =
  | 'anatomy'
  | 'history'
  | 'geography'
  | 'science'
  | 'technology'
  | 'mathematics'
  | 'general';

export interface PlaceholderSpec {
  category: PlaceholderCategory;
  title: string;
  description?: string;
  instructions?: string;
  theme?: PresentationTheme;
  customIcon?: string;
}

export type EducationalDiagramType =
  | 'flowchart'
  | 'process'
  | 'timeline'
  | 'concept-map'
  | 'scientific'
  | 'mathematical'
  | 'computer-science'
  | 'logic-gate';

export interface DiagramNodeSpec {
  id: string;
  label: string;
  shape?: 'rect' | 'roundedRect' | 'circle' | 'diamond';
  color?: string;
}

export interface DiagramConnectionSpec {
  fromId: string;
  toId: string;
  label?: string;
}

export interface EducationalDiagramSpec {
  type: EducationalDiagramType;
  title?: string;
  subtitle?: string;
  svgContent?: string;
  nodes?: DiagramNodeSpec[];
  connections?: DiagramConnectionSpec[];
  gateType?: 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR';
  scienceType?: 'circuit' | 'atom' | 'periodic' | 'apparatus';
  mathType?: 'axes' | 'function' | 'numberLine' | 'geometry3D';
  params?: Record<string, any>;
}

export interface AssetResolutionOptions {
  fitMode?: 'contain' | 'cover' | 'fill' | 'stretch';
  maxWidth?: number;
  maxHeight?: number;
  defaultLayerId?: string;
  theme?: PresentationTheme;
  placeholderOnFailure?: boolean;
  fallbackCategory?: PlaceholderCategory;
  fallbackTitle?: string;
}

export interface ResolvedAssetResult {
  object: ImageObject | CanvasObject;
  additionalObjects?: CanvasObject[];
  isSanitized: boolean;
  naturalWidth: number;
  naturalHeight: number;
  bounds: BoundingBox;
  isValid: boolean;
  assetType: 'svg' | 'raster' | 'placeholder' | 'native-diagram';
  mimeType?: string;
  errorMessage?: string;
}

// ─── Presentation Generation Pipeline Types (TASK-108) ─────────────────────────

export type GenerationStage =
  | 'provider-connection'
  | 'content-generation'
  | 'content-validation'
  | 'layout-processing'
  | 'asset-resolution'
  | 'slide-compilation'
  | 'final-validation'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PresentationGenerationProgress {
  stage: GenerationStage;
  progressPercent: number; // 0 to 100
  message: string;
  currentSlide?: number;
  totalSlides?: number;
}

export interface GeneratePresentationOptions extends TeacherPromptInput {
  provider?: AIProviderType;
  model?: string;
  forceTemplateFallback?: boolean;
  onProgress?: (progress: PresentationGenerationProgress) => void;
  signal?: AbortSignal;
}

export interface PresentationGenerationResult {
  success: boolean;
  pages: Page[];
  deckSpec?: PresentationDeckSpec;
  source: 'ai' | 'curriculum-template';
  modelUsed?: string;
  providerUsed?: AIProviderType;
  themeUsed: PresentationTheme;
  durationMs: number;
  warnings: string[];
  error?: string;
  cancelled?: boolean;
}

// ─── Educational Interactive Activities (TASK-112) ────────────────────────────

export type EducationalActivityType =
  | 'mcq'              // Multiple Choice Question (single choice, 3-5 options)
  | 'true-false'        // Binary statement verification with misconception correction
  | 'fill-in-blanks'    // Sentence / paragraph with blanks and bank / direct entry
  | 'matching'          // Two-column relational matching (terms vs definitions)
  | 'ordering'          // Chronological, algorithmic, or logical sequence ordering
  | 'qa-reveal'         // Classroom discussion prompt with expandable answer/notes
  | 'flashcard'         // Double-sided study card with flip animation
  | 'step-reveal'       // Progressive step-by-step solution / derivation
  | 'formula-reveal'    // Mathematical or scientific formula with variable definitions
  | 'poll';             // Classroom opinion / voting with live vote tallies

export interface ActivityOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  feedback?: string;
  badge?: string;
  votes?: number;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface StepRevealItem {
  stepNumber: number;
  title: string;
  content: string;
  formula?: string;
  isRevealed?: boolean;
}

export interface FormulaVariableItem {
  symbol: string;
  meaning: string;
  unit?: string;
}

export interface ActivityScoringConfig {
  pointsPerQuestion?: number;
  penaltyPerWrongAttempt?: number;
  maxAttempts?: number;
  showScoreImmediately?: boolean;
  passScorePercent?: number;
}

export interface EducationalActivity {
  id: string;
  type: EducationalActivityType;
  title: string;
  question: string;
  instructions?: string;
  options?: ActivityOption[];
  matchingPairs?: MatchingPair[];
  orderedItems?: string[];
  blanksAnswer?: string | string[];
  correctAnswer: string | string[] | number | Record<string, string> | boolean;
  explanation: string;
  hints?: string[];
  difficulty?: 'easy' | 'intermediate' | 'advanced';
  topic?: string;
  subject?: string;
  formula?: string;
  formulaName?: string;
  variableBreakdown?: FormulaVariableItem[];
  steps?: StepRevealItem[];
  flashcardBack?: string;
  pollOptions?: { id: string; text: string; votes?: number }[];
  scoring?: ActivityScoringConfig;
  diagram?: EducationalDiagramSpec;
  source?: 'ai' | 'curriculum-template';
  meta?: Record<string, unknown>;
}

export interface ActivityInteractionState {
  activityId: string;
  selectedOptionId?: string;
  selectedOptions?: string[];
  matchingAnswers?: Record<string, string>; // leftId -> rightId
  currentOrder?: string[];
  blanksInput?: string[];
  isSubmitted: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  revealedStepIndex: number;
  isFlashcardFlipped: boolean;
  hintsRevealedCount: number;
  attemptsCount: number;
  score: number;
  earnedPoints: number;
  feedbackMessage?: string;
  pollVotedOptionId?: string;
}

export interface ActivityEvaluationResult {
  isCorrect: boolean;
  feedback: string;
  scoreEarned: number;
  maxScore: number;
  details?: Record<string, unknown>;
}

export interface GenerateActivityOptions {
  topic: string;
  subject?: string;
  gradeLevel?: string;
  types?: EducationalActivityType[];
  count?: number;
  difficulty?: 'easy' | 'intermediate' | 'advanced';
  provider?: AIProviderType;
  model?: string;
  apiKey?: string;
  endpoint?: string;
  signal?: AbortSignal;
}



