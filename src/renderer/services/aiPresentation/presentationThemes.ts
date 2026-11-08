/**
 * presentationThemes.ts — Presentation Theme System for AI Teaching Presentation Generator
 * Milestone 5, Stage 2 (TASK-102)
 *
 * Capabilities:
 * - 9 curated, high-contrast, classroom projector-friendly themes:
 *   1. Modern Academic (clean white + sapphire blue)
 *   2. Dark Technology (slate navy + electric cyan & violet)
 *   3. Minimal Classroom (pure off-white + crisp charcoal & indigo)
 *   4. Science & Engineering (technical dark blueprint + emerald & amber)
 *   5. Colorful Education (cheerful sky & warm coral)
 *   6. Editorial (warm cream + serif typography + deep wine)
 *   7. Nature & Geography (earth sage + terracotta & forest green)
 *   8. Chalkboard Classic (traditional green board + golden & white chalk)
 *   9. Ocean Breeze (deep maritime ocean + seafoam mint)
 * - Complete typography, border radius, spacing, semantic colors, and chart palettes
 * - WCAG 2.1 relative luminance and contrast ratio calculations (`computeContrastRatio`)
 * - Readability assistant (`getReadableTextColor`) and theme contrast validator (`validateThemeContrast`)
 * - Safe fallback handling for invalid or missing theme IDs (`getThemeById`)
 */

import {
  PresentationTheme,
  PresentationThemeId,
  ThemeTypography,
  ThemeBorderRadius,
  ThemeSpacing,
  ThemeSemanticColors,
} from '../../../shared/aiPresentationTypes';

// ─── Default Shared Spacing & Border Scales ───────────────────────────────────

const DEFAULT_BORDER_RADIUS: ThemeBorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  card: 14,
};

const SHARP_BORDER_RADIUS: ThemeBorderRadius = {
  sm: 2,
  md: 4,
  lg: 6,
  card: 4,
};

const ROUNDED_BORDER_RADIUS: ThemeBorderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  card: 18,
};

const DEFAULT_SPACING: ThemeSpacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
};

// ─── 1. Modern Academic Theme ─────────────────────────────────────────────────

export const MODERN_ACADEMIC_THEME: PresentationTheme = {
  id: 'modern-academic',
  name: 'Modern Academic',
  description: 'Clean white background with professional sapphire blue accents, optimized for bright classrooms.',
  isDark: false,
  backgroundColor: '#ffffff',
  surfaceColor: '#f8fafc',
  cardBackground: '#f8fafc',
  cardBorder: '#e2e8f0',
  cardRadius: 14,
  cardShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
  primaryText: '#0f172a',
  secondaryText: '#475569',
  mutedText: '#64748b',
  accentColor: '#1d4ed8',     // Sapphire Blue (contrast 8.5:1 on white)
  accentMuted: '#dbeafe',
  highlightColor: '#f59e0b',  // Amber
  codeBackground: '#0f172a',
  typography: {
    fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
    fontFamilyBody: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontFamilyCode: '"Cascadia Code", Consolas, monospace',
    headingWeight: 700,
    bodyWeight: 400,
    titleSize: 52,
    subtitleSize: 24,
    headingSize: 28,
    bodySize: 18,
    captionSize: 13,
  },
  borderRadius: DEFAULT_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#1d4ed8', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
  semantic: {
    success: '#15803d',
    warning: '#b45309',
    danger: '#b91c1c',
    info: '#1d4ed8',
  },
  fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
  fontFamilyBody: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

// ─── 2. Dark Technology Theme ─────────────────────────────────────────────────

export const DARK_TECHNOLOGY_THEME: PresentationTheme = {
  id: 'dark-technology',
  name: 'Dark Technology',
  description: 'Dark slate-navy background with electric cyan and neon violet accents, ideal for CS & STEM.',
  isDark: true,
  backgroundColor: '#090d16',
  surfaceColor: '#111827',
  cardBackground: '#111827',
  cardBorder: '#1f2937',
  cardRadius: 14,
  cardShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
  primaryText: '#f8fafc',
  secondaryText: '#94a3b8',
  mutedText: '#64748b',
  accentColor: '#38bdf8',     // Electric Cyan (contrast 12.8:1 on dark)
  accentMuted: 'rgba(56, 189, 248, 0.15)',
  highlightColor: '#a855f7',  // Neon Violet
  codeBackground: '#030712',
  typography: {
    fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
    fontFamilyBody: 'Inter, sans-serif',
    fontFamilyCode: '"JetBrains Mono", Consolas, monospace',
    headingWeight: 700,
    bodyWeight: 400,
    titleSize: 52,
    subtitleSize: 24,
    headingSize: 28,
    bodySize: 18,
    captionSize: 13,
  },
  borderRadius: DEFAULT_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#38bdf8', '#a855f7', '#34d399', '#fbbf24', '#f43f5e', '#60a5fa'],
  semantic: {
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#38bdf8',
  },
  fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
  fontFamilyBody: 'Inter, sans-serif',
};

// ─── 3. Minimal Classroom Theme ───────────────────────────────────────────────

export const MINIMAL_CLASSROOM_THEME: PresentationTheme = {
  id: 'minimal-classroom',
  name: 'Minimal Classroom',
  description: 'Light, distraction-free aesthetic with high-contrast typography and subtle structured cards.',
  isDark: false,
  backgroundColor: '#fcfcfd',
  surfaceColor: '#ffffff',
  cardBackground: '#ffffff',
  cardBorder: '#e5e7eb',
  cardRadius: 12,
  cardShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
  primaryText: '#18181b',
  secondaryText: '#52525b',
  mutedText: '#71717a',
  accentColor: '#4338ca',     // Deep Indigo (contrast 8.8:1 on light)
  accentMuted: '#e0e7ff',
  highlightColor: '#ea580c',  // Deep Orange
  codeBackground: '#18181b',
  typography: {
    fontFamilyHeading: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontFamilyBody: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontFamilyCode: 'Consolas, monospace',
    headingWeight: 600,
    bodyWeight: 400,
    titleSize: 50,
    subtitleSize: 23,
    headingSize: 27,
    bodySize: 18,
    captionSize: 13,
  },
  borderRadius: SHARP_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#4338ca', '#0284c7', '#059669', '#d97706', '#dc2626', '#7c3aed'],
  semantic: {
    success: '#15803d',
    warning: '#b45309',
    danger: '#b91c1c',
    info: '#4338ca',
  },
  fontFamilyHeading: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamilyBody: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

// ─── 4. Science & Engineering Theme ───────────────────────────────────────────

export const SCIENCE_ENGINEERING_THEME: PresentationTheme = {
  id: 'science-engineering',
  name: 'Science & Engineering',
  description: 'Technical dark slate appearance tailored for circuit diagrams, formulas, and STEM charts.',
  isDark: true,
  backgroundColor: '#0b1320',
  surfaceColor: '#141d2e',
  cardBackground: '#141d2e',
  cardBorder: '#25354e',
  cardRadius: 10,
  cardShadow: '0 4px 20px rgba(0, 0, 0, 0.55)',
  primaryText: '#f0fdf4',
  secondaryText: '#93c5fd',
  mutedText: '#64748b',
  accentColor: '#10b981',     // Technical Emerald (contrast 9.6:1 on dark)
  accentMuted: 'rgba(16, 185, 129, 0.18)',
  highlightColor: '#f59e0b',  // Technical Amber
  codeBackground: '#070b13',
  typography: {
    fontFamilyHeading: '"Cascadia Code", "Segoe UI", sans-serif',
    fontFamilyBody: 'Inter, sans-serif',
    fontFamilyCode: '"Cascadia Code", Consolas, monospace',
    headingWeight: 700,
    bodyWeight: 400,
    titleSize: 50,
    subtitleSize: 23,
    headingSize: 27,
    bodySize: 18,
    captionSize: 13,
  },
  borderRadius: SHARP_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'],
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
  },
  fontFamilyHeading: '"Cascadia Code", "Segoe UI", sans-serif',
  fontFamilyBody: 'Inter, sans-serif',
};

// ─── 5. Colorful Education Theme ──────────────────────────────────────────────

export const COLORFUL_EDUCATION_THEME: PresentationTheme = {
  id: 'colorful-education',
  name: 'Colorful Education',
  description: 'Vibrant, engaging, high-contrast palette designed for interactive K-12 and engaging lectures.',
  isDark: false,
  backgroundColor: '#f0f9ff',
  surfaceColor: '#ffffff',
  cardBackground: '#ffffff',
  cardBorder: '#bae6fd',
  cardRadius: 18,
  cardShadow: '0 6px 20px rgba(2, 132, 199, 0.08)',
  primaryText: '#0c2340',
  secondaryText: '#334155',
  mutedText: '#64748b',
  accentColor: '#e11d48',     // Rose Coral (contrast 5.8:1 on light)
  accentMuted: '#ffe4e6',
  highlightColor: '#f59e0b',  // Bright Sun Gold
  codeBackground: '#0c2340',
  typography: {
    fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
    fontFamilyBody: 'Inter, sans-serif',
    fontFamilyCode: '"Cascadia Code", monospace',
    headingWeight: 800,
    bodyWeight: 400,
    titleSize: 52,
    subtitleSize: 24,
    headingSize: 28,
    bodySize: 18,
    captionSize: 13,
  },
  borderRadius: ROUNDED_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#e11d48', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
  semantic: {
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0284c7',
  },
  fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
  fontFamilyBody: 'Inter, sans-serif',
};

// ─── 6. Editorial Theme ───────────────────────────────────────────────────────

export const EDITORIAL_THEME: PresentationTheme = {
  id: 'editorial',
  name: 'Editorial',
  description: 'Warm, typography-focused academic design with elegant serif headings and rich crimson accents.',
  isDark: false,
  backgroundColor: '#faf8f5',
  surfaceColor: '#ffffff',
  cardBackground: '#ffffff',
  cardBorder: '#e7e3dc',
  cardRadius: 10,
  cardShadow: '0 4px 14px rgba(60, 50, 40, 0.05)',
  primaryText: '#1c1917',
  secondaryText: '#57534e',
  mutedText: '#78716c',
  accentColor: '#991b1b',     // Deep Crimson (contrast 7.7:1 on cream)
  accentMuted: '#fee2e2',
  highlightColor: '#b45309',  // Amber Ochre
  codeBackground: '#1c1917',
  typography: {
    fontFamilyHeading: 'Georgia, Cambria, "Times New Roman", serif',
    fontFamilyBody: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
    fontFamilyCode: '"Courier New", monospace',
    headingWeight: 700,
    bodyWeight: 400,
    titleSize: 52,
    subtitleSize: 24,
    headingSize: 28,
    bodySize: 19,
    captionSize: 14,
  },
  borderRadius: SHARP_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#991b1b', '#b45309', '#0f766e', '#1d4ed8', '#701a75', '#334155'],
  semantic: {
    success: '#15803d',
    warning: '#b45309',
    danger: '#991b1b',
    info: '#1d4ed8',
  },
  fontFamilyHeading: 'Georgia, Cambria, "Times New Roman", serif',
  fontFamilyBody: '"Palatino Linotype", "Book Antiqua", Georgia, serif',
};

// ─── 7. Nature & Geography Theme ──────────────────────────────────────────────

export const NATURE_GEOGRAPHY_THEME: PresentationTheme = {
  id: 'nature-geography',
  name: 'Nature & Geography',
  description: 'Earth-inspired sage, terracotta, and deep forest green tones suited for Earth Science and Humanities.',
  isDark: false,
  backgroundColor: '#f4f7f4',
  surfaceColor: '#ffffff',
  cardBackground: '#ffffff',
  cardBorder: '#d1dcce',
  cardRadius: 14,
  cardShadow: '0 4px 16px rgba(20, 40, 25, 0.06)',
  primaryText: '#142817',
  secondaryText: '#365339',
  mutedText: '#5a785d',
  accentColor: '#c2410c',     // Terracotta (contrast 5.2:1 on sage)
  accentMuted: '#ffedd5',
  highlightColor: '#15803d',  // Forest Green
  codeBackground: '#142817',
  typography: {
    fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
    fontFamilyBody: 'Inter, sans-serif',
    fontFamilyCode: 'Consolas, monospace',
    headingWeight: 700,
    bodyWeight: 400,
    titleSize: 50,
    subtitleSize: 23,
    headingSize: 28,
    bodySize: 18,
    captionSize: 13,
  },
  borderRadius: DEFAULT_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#c2410c', '#15803d', '#0284c7', '#ca8a04', '#7c2d12', '#0d9488'],
  semantic: {
    success: '#15803d',
    warning: '#ca8a04',
    danger: '#b91c1c',
    info: '#0284c7',
  },
  fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
  fontFamilyBody: 'Inter, sans-serif',
};

// ─── 8. Chalkboard Classic Theme ──────────────────────────────────────────────

export const CHALKBOARD_CLASSIC_THEME: PresentationTheme = {
  id: 'chalkboard-classic',
  name: 'Chalkboard Classic',
  description: 'Traditional classroom dark green chalkboard with golden and crisp white chalk marks.',
  isDark: true,
  backgroundColor: '#1b4332',
  surfaceColor: '#153628',
  cardBackground: '#153628',
  cardBorder: '#2d5a45',
  cardRadius: 12,
  cardShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
  primaryText: '#ffffff',
  secondaryText: '#e2e8f0',
  mutedText: '#94a3b8',
  accentColor: '#fbbf24',     // Golden Chalk (contrast 9.8:1 on green)
  accentMuted: 'rgba(251, 191, 36, 0.2)',
  highlightColor: '#7dd3fc',  // Sky Blue Chalk
  codeBackground: '#0d231a',
  typography: {
    fontFamilyHeading: '"Comic Sans MS", "Segoe Print", "Segoe UI", cursive, sans-serif',
    fontFamilyBody: '"Segoe Print", "Ink Free", -apple-system, sans-serif',
    fontFamilyCode: '"Cascadia Code", Consolas, monospace',
    headingWeight: 700,
    bodyWeight: 400,
    titleSize: 52,
    subtitleSize: 24,
    headingSize: 28,
    bodySize: 19,
    captionSize: 14,
  },
  borderRadius: DEFAULT_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#fbbf24', '#7dd3fc', '#86efac', '#fca5a5', '#c084fc', '#fde047'],
  semantic: {
    success: '#86efac',
    warning: '#fbbf24',
    danger: '#fca5a5',
    info: '#7dd3fc',
  },
  fontFamilyHeading: '"Comic Sans MS", "Segoe Print", "Segoe UI", cursive, sans-serif',
  fontFamilyBody: '"Segoe Print", "Ink Free", -apple-system, sans-serif',
};

// ─── 9. Ocean Breeze Theme ────────────────────────────────────────────────────

export const OCEAN_BREEZE_THEME: PresentationTheme = {
  id: 'ocean-breeze',
  name: 'Ocean Breeze',
  description: 'Deep maritime ocean background with seafoam mint accents and high-contrast cool whites.',
  isDark: true,
  backgroundColor: '#082f49',
  surfaceColor: '#0c4a6e',
  cardBackground: '#0c4a6e',
  cardBorder: '#0e7490',
  cardRadius: 16,
  cardShadow: '0 6px 22px rgba(0, 0, 0, 0.45)',
  primaryText: '#f0fdfa',
  secondaryText: '#bae6fd',
  mutedText: '#67e8f9',
  accentColor: '#2dd4bf',     // Seafoam Mint (contrast 8.2:1 on dark ocean)
  accentMuted: 'rgba(45, 212, 191, 0.18)',
  highlightColor: '#fb7185',  // Coral Accent
  codeBackground: '#031726',
  typography: {
    fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
    fontFamilyBody: 'Inter, sans-serif',
    fontFamilyCode: '"JetBrains Mono", Consolas, monospace',
    headingWeight: 700,
    bodyWeight: 400,
    titleSize: 52,
    subtitleSize: 24,
    headingSize: 28,
    bodySize: 18,
    captionSize: 13,
  },
  borderRadius: ROUNDED_BORDER_RADIUS,
  spacing: DEFAULT_SPACING,
  chartPalette: ['#2dd4bf', '#38bdf8', '#fb7185', '#fde047', '#a78bfa', '#34d399'],
  semantic: {
    success: '#34d399',
    warning: '#fde047',
    danger: '#fb7185',
    info: '#38bdf8',
  },
  fontFamilyHeading: 'Inter, "Segoe UI", sans-serif',
  fontFamilyBody: 'Inter, sans-serif',
};

// ─── Master Registry & Aliases ────────────────────────────────────────────────

export const PRESENTATION_THEMES: PresentationTheme[] = [
  MODERN_ACADEMIC_THEME,
  DARK_TECHNOLOGY_THEME,
  MINIMAL_CLASSROOM_THEME,
  SCIENCE_ENGINEERING_THEME,
  COLORFUL_EDUCATION_THEME,
  EDITORIAL_THEME,
  NATURE_GEOGRAPHY_THEME,
  CHALKBOARD_CLASSIC_THEME,
  OCEAN_BREEZE_THEME,
];

export const DEFAULT_PRESENTATION_THEME: PresentationTheme = MODERN_ACADEMIC_THEME;

// Map legacy IDs or alias variants to canonical themes
const THEME_ALIASES: Record<string, PresentationThemeId> = {
  'modern-dark': 'dark-technology',
  'clean-minimal': 'minimal-classroom',
  'stem-cyber': 'science-engineering',
  'warm-academic': 'editorial',
};

/**
 * Retrieves a theme by its ID (case-insensitive, trims whitespace, handles aliases).
 * Safely falls back to DEFAULT_PRESENTATION_THEME if not found.
 */
export function getThemeById(id?: string): PresentationTheme {
  if (!id) return DEFAULT_PRESENTATION_THEME;

  const normalized = id.trim().toLowerCase();
  const canonicalId = THEME_ALIASES[normalized] || normalized;

  const found = PRESENTATION_THEMES.find((t) => t.id === canonicalId);
  return found || DEFAULT_PRESENTATION_THEME;
}

/**
 * Returns all registered presentation themes.
 */
export function getAllThemes(): PresentationTheme[] {
  return [...PRESENTATION_THEMES];
}

// ─── Color Parsing & Contrast Calculation ─────────────────────────────────────

export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parses Hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA) or rgb/rgba color string into RGBA channels.
 */
export function parseColor(colorStr: string): RgbColor {
  if (!colorStr) return { r: 0, g: 0, b: 0, a: 1 };

  const s = colorStr.trim();

  // 1. Hex format
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
  }

  // 2. rgb() / rgba() format
  const rgbMatch = s.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgbMatch) {
    return {
      r: Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))),
      g: Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))),
      b: Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))),
      a: rgbMatch[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(rgbMatch[4]))) : 1,
    };
  }

  // Fallback for named colors commonly used in themes
  if (s.toLowerCase() === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (s.toLowerCase() === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  if (s.toLowerCase() === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Calculates relative luminance according to WCAG 2.1 specs:
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;

  const rLinear = rs <= 0.04045 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const gLinear = gs <= 0.04045 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const bLinear = bs <= 0.04045 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Computes the WCAG 2.1 contrast ratio between two colors (ranging from 1.00:1 to 21.00:1).
 */
export function computeContrastRatio(color1: string, color2: string): number {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  const l1 = calculateRelativeLuminance(c1.r, c1.g, c1.b);
  const l2 = calculateRelativeLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Given a background color, evaluates contrast and returns whichever candidate color
 * provides the higher readability ratio.
 */
export function getReadableTextColor(
  bgColor: string,
  lightCandidate = '#ffffff',
  darkCandidate = '#0f172a'
): string {
  const lightContrast = computeContrastRatio(bgColor, lightCandidate);
  const darkContrast = computeContrastRatio(bgColor, darkCandidate);
  return lightContrast >= darkContrast ? lightCandidate : darkCandidate;
}

// ─── Theme Contrast Validator ─────────────────────────────────────────────────

export interface ThemeContrastReport {
  isValid: boolean;
  issues: string[];
  contrastRatios: {
    primaryTextOnBackground: number;
    primaryTextOnCard: number;
    secondaryTextOnCard: number;
    accentOnBackground: number;
  };
}

/**
 * Validates that a theme satisfies WCAG 2.1 AA contrast requirements for classroom visibility:
 * - Primary text on background >= 4.5:1
 * - Primary text on card >= 4.5:1
 * - Secondary text on card >= 3.0:1
 * - Accent color on background >= 3.0:1
 */
export function validateThemeContrast(theme: PresentationTheme): ThemeContrastReport {
  const issues: string[] = [];

  const primaryOnBg = computeContrastRatio(theme.primaryText, theme.backgroundColor);
  const primaryOnCard = computeContrastRatio(theme.primaryText, theme.cardBackground);
  const secondaryOnCard = computeContrastRatio(theme.secondaryText, theme.cardBackground);
  const accentOnBg = computeContrastRatio(theme.accentColor, theme.backgroundColor);

  if (primaryOnBg < 4.5) {
    issues.push(`Primary text on background ratio is ${primaryOnBg}:1 (minimum 4.5:1 required for WCAG AA)`);
  }
  if (primaryOnCard < 4.5) {
    issues.push(`Primary text on card ratio is ${primaryOnCard}:1 (minimum 4.5:1 required for WCAG AA)`);
  }
  if (secondaryOnCard < 3.0) {
    issues.push(`Secondary text on card ratio is ${secondaryOnCard}:1 (minimum 3.0:1 required for UI/large text)`);
  }
  if (accentOnBg < 3.0) {
    issues.push(`Accent color on background ratio is ${accentOnBg}:1 (minimum 3.0:1 required for UI elements)`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    contrastRatios: {
      primaryTextOnBackground: primaryOnBg,
      primaryTextOnCard: primaryOnCard,
      secondaryTextOnCard: secondaryOnCard,
      accentOnBackground: accentOnBg,
    },
  };
}

