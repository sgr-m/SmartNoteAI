/**
 * customSlideMasterService.ts — Custom Slide Master Manager & Persistence Service
 * Milestone 5: TASK Phase 2 (Custom Slide Master)
 * 
 * Provides:
 * - Declarative Custom Slide Master schema & built-in educational presets
 * - Persistent CRUD via localStorage with export/import JSON support
 * - Dynamic conversion to native PresentationTheme & SlideTemplateDefinition
 * - Strict layout preservation: AI content fills placeholders without mutating master decorations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CustomSlideMaster,
  CustomMasterDecorationConfig,
  CustomSlideMasterTheme,
  PresentationTheme,
  SlidePlaceholderDefinition,
  SlideTemplateDefinition,
  SlideLayoutType,
} from '../../../shared/aiPresentationTypes';

const STORAGE_KEY = 'smartboard_custom_slide_masters_v1';

// ─── Default Master Themes ───────────────────────────────────────────────────

export const DEFAULT_MASTER_THEME_ACADEMIC: CustomSlideMasterTheme = {
  backgroundColor: '#ffffff',
  surfaceColor: '#f8fafc',
  cardBackgroundColor: '#f1f5f9',
  cardBorderColor: '#cbd5e1',
  primaryTextColor: '#0f172a',
  secondaryTextColor: '#475569',
  accentColor: '#2563eb',
  fontFamilyHeading: 'system-ui, -apple-system, sans-serif',
  fontFamilyBody: 'system-ui, -apple-system, sans-serif',
};

export const DEFAULT_MASTER_THEME_DARK: CustomSlideMasterTheme = {
  backgroundColor: '#0f172a',
  surfaceColor: '#1e293b',
  cardBackgroundColor: '#1e293b',
  cardBorderColor: '#334155',
  primaryTextColor: '#f8fafc',
  secondaryTextColor: '#94a3b8',
  accentColor: '#38bdf8',
  fontFamilyHeading: 'system-ui, -apple-system, sans-serif',
  fontFamilyBody: 'system-ui, -apple-system, sans-serif',
};

// ─── Built-in Preset Masters ─────────────────────────────────────────────────

export const PRESET_CLASSROOM_MASTER: CustomSlideMaster = {
  id: 'preset-standard-classroom',
  name: 'Standard Classroom Master',
  description: 'Balanced classroom layout with school branding pill, distinct left theoretical card, and right key points column.',
  isBuiltIn: true,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,
  theme: DEFAULT_MASTER_THEME_ACADEMIC,
  decorations: {
    hasHeaderDivider: true,
    headerDividerColor: '#e2e8f0',
    hasAccentBar: true,
    accentBarPosition: 'top',
    accentBarColor: '#2563eb',
    hasFooter: true,
    footerText: 'Classroom Lecture • SmartBoard Interactive Studio',
    showSlideNumber: true,
    hasBrandingLogo: true,
    brandingText: 'SmartBoard Academy',
    brandingSubtext: 'Department of Instruction',
    customShapes: [
      {
        id: 'brand-badge-pill',
        shapeType: 'pill',
        x: 1540,
        y: 40,
        width: 280,
        height: 38,
        fillColor: '#eff6ff',
        strokeColor: '#bfdbfe',
        strokeWidth: 1,
        label: 'SmartBoard Academy',
      },
    ],
  },
  placeholders: [
    {
      id: 'title',
      role: 'slide-title',
      contentType: 'title',
      label: 'Slide Title',
      bounds: { x: 100, y: 50, width: 1400, height: 70 },
      isRequired: true,
      defaultPlaceholderText: 'Slide Title / Lesson Focus',
      formatting: {
        fontSize: 42,
        fontWeight: 700,
        colorRole: 'primary',
        textAlign: 'left',
      },
    },
    {
      id: 'subtitle',
      role: 'slide-subtitle',
      contentType: 'subtitle',
      label: 'Subtitle / Unit Roadmap',
      bounds: { x: 100, y: 125, width: 1400, height: 35 },
      isRequired: false,
      defaultPlaceholderText: 'Core Curriculum • Instructional Unit Roadmap',
      formatting: {
        fontSize: 20,
        fontWeight: 500,
        colorRole: 'accent',
        textAlign: 'left',
      },
    },
    {
      id: 'main-content',
      role: 'concept-explanation',
      contentType: 'text',
      label: 'Main Content / Theory',
      bounds: { x: 100, y: 190, width: 840, height: 750 },
      isRequired: true,
      defaultBadge: 'Theoretical Foundation',
      defaultPlaceholderText: 'Detailed pedagogical explanation detailing foundational laws, core definitions, and mechanisms. Students understand underlying relationships and observed physical behaviors.',
      formatting: {
        backgroundColorRole: 'card',
        borderRole: 'cardBorder',
        borderRadius: 14,
        padding: 24,
        fontSize: 18,
        fontWeight: 400,
      },
    },
    {
      id: 'secondary-content',
      role: 'bullet-points',
      contentType: 'bullet-list',
      label: 'Key Principles & Bullet Points',
      bounds: { x: 980, y: 190, width: 840, height: 420 },
      isRequired: true,
      defaultBadge: 'Essential Principles',
      defaultBulletPoints: [
        'Fundamental Axiom: Systems adhere to standard boundary conditions.',
        'Dynamic Equilibrium: Variables maintain balanced quantitative conservation.',
        'Practical Verification: Measurements correspond to analytical predictions.',
      ],
      formatting: {
        backgroundColorRole: 'card',
        borderRole: 'cardBorder',
        borderRadius: 14,
        padding: 24,
        fontSize: 17,
        fontWeight: 400,
      },
    },
    {
      id: 'callout-takeaway',
      role: 'key-takeaways',
      contentType: 'callout-takeaway',
      label: 'Summary / Classroom Analogy',
      bounds: { x: 980, y: 640, width: 840, height: 300 },
      isRequired: false,
      defaultBadge: 'Classroom Analogy',
      defaultPlaceholderText: 'Think of this mechanism like a water valve: opening the aperture increases the volumetric rate of flow while keeping total pressure stable.',
      formatting: {
        backgroundColorRole: 'surface',
        borderRole: 'accent',
        borderRadius: 14,
        padding: 20,
        fontSize: 17,
        fontWeight: 500,
      },
    },
  ],
};

export const PRESET_STEM_PROOF_MASTER: CustomSlideMaster = {
  id: 'preset-stem-proof',
  name: 'Math & STEM Proof Master',
  description: 'Calibrated for algebraic proofs, physics laws, equations, derivations, and worked calculations.',
  isBuiltIn: true,
  createdAt: 1700000000001,
  updatedAt: 1700000000001,
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,
  theme: {
    ...DEFAULT_MASTER_THEME_DARK,
    accentColor: '#38bdf8',
  },
  decorations: {
    hasHeaderDivider: true,
    headerDividerColor: '#334155',
    hasAccentBar: true,
    accentBarPosition: 'top',
    accentBarColor: '#38bdf8',
    hasFooter: true,
    footerText: 'STEM Master Derivation • Mathematical Sciences',
    showSlideNumber: true,
    hasBrandingLogo: true,
    brandingText: 'STEM Laboratory',
    brandingSubtext: 'Analytical Sciences',
    customShapes: [
      {
        id: 'stem-badge-tag',
        shapeType: 'pill',
        x: 1600,
        y: 40,
        width: 220,
        height: 38,
        fillColor: '#0c4a6e',
        strokeColor: '#0284c7',
        strokeWidth: 1,
        label: 'π / Calculus',
      },
    ],
  },
  placeholders: [
    {
      id: 'title',
      role: 'slide-title',
      contentType: 'title',
      label: 'Formula / Theorem Title',
      bounds: { x: 100, y: 50, width: 1450, height: 70 },
      isRequired: true,
      defaultPlaceholderText: 'The Quadratic Formula & Proof Protocol',
      formatting: {
        fontSize: 42,
        fontWeight: 700,
        colorRole: 'primary',
      },
    },
    {
      id: 'subtitle',
      role: 'slide-subtitle',
      contentType: 'subtitle',
      label: 'Subtitle / Theorem Statement',
      bounds: { x: 100, y: 125, width: 1450, height: 35 },
      isRequired: false,
      defaultPlaceholderText: 'Analytical Proof by Completing the Square',
      formatting: {
        fontSize: 20,
        fontWeight: 500,
        colorRole: 'accent',
      },
    },
    {
      id: 'premise',
      role: 'formal-definition',
      contentType: 'definition',
      label: 'Theoretical Premise & Standard Form',
      bounds: { x: 100, y: 190, width: 840, height: 260 },
      isRequired: true,
      defaultBadge: 'Canonical Premise',
      defaultPlaceholderText: 'For any quadratic equation ax² + bx + c = 0 with real coefficients and a ≠ 0, isolating x yields the universal closed-form formula.',
      formatting: {
        backgroundColorRole: 'card',
        borderRole: 'cardBorder',
        borderRadius: 14,
        padding: 22,
        fontSize: 18,
      },
    },
    {
      id: 'formula-box',
      role: 'formula',
      contentType: 'formula',
      label: 'Governing Formula Box',
      bounds: { x: 100, y: 475, width: 840, height: 200 },
      isRequired: true,
      defaultBadge: 'Universal Solution',
      defaultFormula: 'x = (-b ± √(b² - 4ac)) / (2a)',
      defaultPlaceholderText: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
      formatting: {
        backgroundColorRole: 'surface',
        borderRole: 'accent',
        borderRadius: 14,
        padding: 24,
        fontSize: 28,
        fontWeight: 700,
        textAlign: 'center',
      },
    },
    {
      id: 'invariant',
      role: 'key-takeaways',
      contentType: 'callout-takeaway',
      label: 'Invariant Property / Discriminant',
      bounds: { x: 100, y: 700, width: 840, height: 240 },
      isRequired: false,
      defaultBadge: 'Discriminant Behavior',
      defaultPlaceholderText: 'Radicand Δ = b² - 4ac governs root topology: Δ > 0 (two real roots), Δ = 0 (one real repeated root), Δ < 0 (two complex conjugates).',
      formatting: {
        backgroundColorRole: 'card',
        borderRole: 'cardBorder',
        borderRadius: 14,
        padding: 20,
        fontSize: 17,
      },
    },
    {
      id: 'derivation',
      role: 'problem-solving',
      contentType: 'text',
      label: 'Step-by-Step Derivation Protocol',
      bounds: { x: 980, y: 190, width: 840, height: 750 },
      isRequired: true,
      defaultBadge: 'Step-by-Step Proof',
      defaultPlaceholderText: '1. Divide standard form by leading coefficient a: x² + (b/a)x = -c/a\n\n2. Complete square by adding (b / 2a)² to both sides: x² + (b/a)x + (b/2a)² = (b² - 4ac) / (4a²)\n\n3. Factor LHS into binomial square: (x + b/(2a))² = (b² - 4ac) / (4a²)\n\n4. Extract square root of both sides: x + b/(2a) = ±√(b² - 4ac) / (2a)\n\n5. Isolate variable x: x = (-b ± √(b² - 4ac)) / (2a)',
      formatting: {
        backgroundColorRole: 'card',
        borderRole: 'cardBorder',
        borderRadius: 14,
        padding: 26,
        fontSize: 18,
        fontFamilyKey: 'code',
      },
    },
  ],
};

export const PRESET_TWO_COLUMN_MASTER: CustomSlideMaster = {
  id: 'preset-two-column-split',
  name: 'Two-Column Comparison Master',
  description: 'Side-by-side equal columns with header badges, ideal for comparisons, case studies, or theory vs application.',
  isBuiltIn: true,
  createdAt: 1700000000002,
  updatedAt: 1700000000002,
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,
  theme: DEFAULT_MASTER_THEME_ACADEMIC,
  decorations: {
    hasHeaderDivider: true,
    headerDividerColor: '#e2e8f0',
    hasAccentBar: true,
    accentBarPosition: 'top',
    accentBarColor: '#059669',
    hasFooter: true,
    footerText: 'Comparative Analysis • Curriculum Overview',
    showSlideNumber: true,
    hasBrandingLogo: false,
  },
  placeholders: [
    {
      id: 'title',
      role: 'slide-title',
      contentType: 'title',
      label: 'Slide Title',
      bounds: { x: 100, y: 50, width: 1720, height: 70 },
      isRequired: true,
      defaultPlaceholderText: 'Comparative Analysis: Two Perspectives',
      formatting: {
        fontSize: 42,
        fontWeight: 700,
        colorRole: 'primary',
      },
    },
    {
      id: 'subtitle',
      role: 'slide-subtitle',
      contentType: 'subtitle',
      label: 'Subtitle / Focus',
      bounds: { x: 100, y: 125, width: 1720, height: 35 },
      isRequired: false,
      defaultPlaceholderText: 'Contrasting Theoretical Paradigms & Real-World Implementations',
      formatting: {
        fontSize: 20,
        fontWeight: 500,
        colorRole: 'accent',
      },
    },
    {
      id: 'left-column',
      role: 'concept-explanation',
      contentType: 'text',
      label: 'Left Column (Theory / Model A)',
      bounds: { x: 100, y: 190, width: 840, height: 750 },
      isRequired: true,
      defaultBadge: 'Framework Alpha',
      defaultPlaceholderText: 'Detailed breakdown of the primary concept, hypothesis, or theoretical architecture. Focuses on foundational assumptions and linear mechanisms.',
      formatting: {
        backgroundColorRole: 'card',
        borderRole: 'cardBorder',
        borderRadius: 14,
        padding: 24,
        fontSize: 18,
      },
    },
    {
      id: 'right-column',
      role: 'concept-explanation',
      contentType: 'text',
      label: 'Right Column (Application / Model B)',
      bounds: { x: 980, y: 190, width: 840, height: 750 },
      isRequired: true,
      defaultBadge: 'Framework Beta',
      defaultPlaceholderText: 'Contrasting implementation, practical industrial case study, or modern empirical framework. Highlights differences in scale, constraints, and operational outcomes.',
      formatting: {
        backgroundColorRole: 'card',
        borderRole: 'cardBorder',
        borderRadius: 14,
        padding: 24,
        fontSize: 18,
      },
    },
  ],
};

export const BUILT_IN_MASTERS: CustomSlideMaster[] = [
  PRESET_CLASSROOM_MASTER,
  PRESET_STEM_PROOF_MASTER,
  PRESET_TWO_COLUMN_MASTER,
];

// ─── CustomSlideMasterService ────────────────────────────────────────────────

export class CustomSlideMasterService {
  private customMasters: CustomSlideMaster[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Loads user custom masters from localStorage and merges with built-in presets.
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.customMasters = [];
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.customMasters = parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse custom slide masters from localStorage:', err);
      this.customMasters = [];
    }
  }

  /**
   * Persists user custom masters to localStorage.
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customMasters));
    } catch (err) {
      console.warn('Failed to save custom slide masters to localStorage:', err);
    }
  }

  /**
   * Returns all available masters (built-in presets + user custom masters).
   */
  public getAllMasters(): CustomSlideMaster[] {
    return [...BUILT_IN_MASTERS, ...this.customMasters];
  }

  /**
   * Gets a specific master by ID. Returns undefined if not found.
   */
  public getMasterById(id: string): CustomSlideMaster | undefined {
    const all = this.getAllMasters();
    return all.find((m) => m.id === id);
  }

  /**
   * Saves or updates a user-defined custom slide master.
   * Built-in masters are duplicated as custom masters if edited.
   */
  public saveMaster(master: CustomSlideMaster): CustomSlideMaster {
    const now = Date.now();
    const isBuiltIn = BUILT_IN_MASTERS.some((b) => b.id === master.id);

    const masterToSave: CustomSlideMaster = {
      ...master,
      id: isBuiltIn ? `user-master-${uuidv4().slice(0, 8)}` : master.id || `user-master-${uuidv4().slice(0, 8)}`,
      name: isBuiltIn ? `${master.name} (Custom Copy)` : master.name.trim() || 'Untitled Slide Master',
      isBuiltIn: false,
      updatedAt: now,
      createdAt: master.createdAt || now,
    };

    const existingIdx = this.customMasters.findIndex((m) => m.id === masterToSave.id);
    if (existingIdx >= 0) {
      this.customMasters[existingIdx] = masterToSave;
    } else {
      this.customMasters.push(masterToSave);
    }

    this.saveToStorage();
    return masterToSave;
  }

  /**
   * Deletes a user custom master by ID. Built-in presets cannot be deleted.
   */
  public deleteMaster(id: string): boolean {
    const isBuiltIn = BUILT_IN_MASTERS.some((b) => b.id === id);
    if (isBuiltIn) return false;

    const initialLen = this.customMasters.length;
    this.customMasters = this.customMasters.filter((m) => m.id !== id);
    if (this.customMasters.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Clones an existing master (built-in or user) into a new editable master.
   */
  public cloneMaster(id: string, newName?: string): CustomSlideMaster {
    const source = this.getMasterById(id) || PRESET_CLASSROOM_MASTER;
    const now = Date.now();
    const cloned: CustomSlideMaster = {
      ...JSON.parse(JSON.stringify(source)),
      id: `user-master-${uuidv4().slice(0, 8)}`,
      name: newName || `${source.name} (Copy)`,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };

    this.customMasters.push(cloned);
    this.saveToStorage();
    return cloned;
  }

  /**
   * Creates a blank default custom master ready for editing.
   */
  public createBlankMaster(name: string = 'My Classroom Master'): CustomSlideMaster {
    const now = Date.now();
    return {
      id: `user-master-${uuidv4().slice(0, 8)}`,
      name,
      description: 'Custom teacher slide master with dedicated placeholders and branding.',
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
      aspectRatio: '16:9',
      width: 1920,
      height: 1080,
      theme: DEFAULT_MASTER_THEME_ACADEMIC,
      decorations: {
        hasHeaderDivider: true,
        headerDividerColor: '#e2e8f0',
        hasAccentBar: true,
        accentBarPosition: 'top',
        accentBarColor: '#2563eb',
        hasFooter: true,
        footerText: 'Classroom Lecture Notes',
        showSlideNumber: true,
        hasBrandingLogo: true,
        brandingText: 'High School Mathematics',
      },
      placeholders: [
        {
          id: 'title',
          role: 'slide-title',
          contentType: 'title',
          label: 'Slide Title',
          bounds: { x: 100, y: 50, width: 1450, height: 70 },
          isRequired: true,
          defaultPlaceholderText: 'Slide Title',
          formatting: { fontSize: 42, fontWeight: 700, colorRole: 'primary' },
        },
        {
          id: 'subtitle',
          role: 'slide-subtitle',
          contentType: 'subtitle',
          label: 'Subtitle',
          bounds: { x: 100, y: 125, width: 1450, height: 35 },
          isRequired: false,
          defaultPlaceholderText: 'Unit Subtitle',
          formatting: { fontSize: 20, fontWeight: 500, colorRole: 'accent' },
        },
        {
          id: 'main-content',
          role: 'concept-explanation',
          contentType: 'text',
          label: 'Primary Content Card',
          bounds: { x: 100, y: 190, width: 1720, height: 750 },
          isRequired: true,
          defaultBadge: 'Core Concept',
          defaultPlaceholderText: 'Pedagogical content paragraph explaining the fundamental mechanism.',
          formatting: {
            backgroundColorRole: 'card',
            borderRole: 'cardBorder',
            borderRadius: 14,
            padding: 24,
            fontSize: 20,
          },
        },
      ],
    };
  }

  /**
   * Resets all custom slide masters to defaults.
   */
  public resetToDefaults(): void {
    this.customMasters = [];
    this.saveToStorage();
  }

  /**
   * Exports a slide master to formatted JSON.
   */
  public exportMasterJson(id: string): string {
    const master = this.getMasterById(id);
    if (!master) throw new Error(`Slide master not found: ${id}`);
    return JSON.stringify(master, null, 2);
  }

  /**
   * Imports a slide master from a JSON string.
   */
  public importMasterJson(jsonStr: string): CustomSlideMaster {
    const parsed = JSON.parse(jsonStr) as CustomSlideMaster;
    if (!parsed.placeholders || !Array.isArray(parsed.placeholders)) {
      throw new Error('Invalid slide master JSON: missing placeholders array.');
    }
    const imported: CustomSlideMaster = {
      ...parsed,
      id: `imported-${uuidv4().slice(0, 8)}`,
      name: `${parsed.name || 'Imported Master'} (Imported)`,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.customMasters.push(imported);
    this.saveToStorage();
    return imported;
  }

  /**
   * Converts a CustomSlideMaster into a standard PresentationTheme compatible with all renderers.
   */
  public masterToPresentationTheme(master: CustomSlideMaster): PresentationTheme {
    const t = master.theme;
    return {
      id: (master.id as any) || 'modern-academic',
      name: master.name,
      description: master.description || 'Custom Master Theme',
      isDark: t.backgroundColor.startsWith('#0') || t.backgroundColor.startsWith('#1'),
      backgroundColor: t.backgroundColor,
      surfaceColor: t.surfaceColor,
      cardBackground: t.cardBackgroundColor,
      cardBorder: `1px solid ${t.cardBorderColor}`,
      cardRadius: 14,
      primaryText: t.primaryTextColor,
      secondaryText: t.secondaryTextColor,
      mutedText: t.secondaryTextColor,
      accentColor: t.accentColor,
      accentMuted: `${t.accentColor}25`,
      highlightColor: '#f59e0b',
      codeBackground: t.surfaceColor,
      fontFamilyHeading: t.fontFamilyHeading,
      fontFamilyBody: t.fontFamilyBody,
      typography: {
        fontFamilyHeading: t.fontFamilyHeading,
        fontFamilyBody: t.fontFamilyBody,
        fontFamilyCode: 'monospace',
        titleSize: 42,
        subtitleSize: 22,
        headingSize: 24,
        headingWeight: 600,
        bodySize: 18,
        bodyWeight: 400,
        captionSize: 13,
      },
      borderRadius: {
        sm: 6,
        md: 10,
        lg: 14,
        card: 12,
      },
      spacing: {
        xs: 6,
        sm: 12,
        md: 20,
        lg: 32,
        xl: 48,
      },
      chartPalette: [t.accentColor, '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: t.accentColor,
      },
    };
  }

  /**
   * Converts a CustomSlideMaster into a SlideTemplateDefinition for native compilation.
   */
  public masterToSlideTemplate(master: CustomSlideMaster): SlideTemplateDefinition {
    return {
      id: (master.id as any) || 'concept-explanation',
      name: master.name,
      category: 'concept',
      description: master.description || 'Custom Slide Master Layout',
      recommendedFor: ['custom-master', 'classroom', 'lecture'],
      aspectRatio: '16:9',
      width: master.width || 1920,
      height: master.height || 1080,
      decorations: {
        hasAccentBar: master.decorations.hasAccentBar,
        hasHeaderDivider: master.decorations.hasHeaderDivider,
        hasFooterNumbering: master.decorations.showSlideNumber,
      },
      placeholders: master.placeholders,
    };
  }
}

export const customSlideMasterService = new CustomSlideMasterService();

export function masterToPresentationTheme(master: CustomSlideMaster): PresentationTheme {
  return customSlideMasterService.masterToPresentationTheme(master);
}

export function masterToSlideTemplate(master: CustomSlideMaster): SlideTemplateDefinition {
  return customSlideMasterService.masterToSlideTemplate(master);
}
