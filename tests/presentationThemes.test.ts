/**
 * presentationThemes.test.ts — Unit tests for Presentation Theme System
 * TASK-102 Verification
 */

import { describe, it, expect } from 'vitest';
import {
  PRESENTATION_THEMES,
  DEFAULT_PRESENTATION_THEME,
  MODERN_ACADEMIC_THEME,
  DARK_TECHNOLOGY_THEME,
  MINIMAL_CLASSROOM_THEME,
  SCIENCE_ENGINEERING_THEME,
  COLORFUL_EDUCATION_THEME,
  EDITORIAL_THEME,
  NATURE_GEOGRAPHY_THEME,
  CHALKBOARD_CLASSIC_THEME,
  OCEAN_BREEZE_THEME,
  getThemeById,
  getAllThemes,
  parseColor,
  calculateRelativeLuminance,
  computeContrastRatio,
  getReadableTextColor,
  validateThemeContrast,
} from '../src/renderer/services/aiPresentation/presentationThemes';

describe('TASK-102: Presentation Theme System', () => {
  describe('1. Theme Registry and Lookups', () => {
    it('registers all 9 curated classroom themes', () => {
      const themes = getAllThemes();
      expect(themes).toHaveLength(9);

      const ids = themes.map((t) => t.id);
      expect(ids).toContain('modern-academic');
      expect(ids).toContain('dark-technology');
      expect(ids).toContain('minimal-classroom');
      expect(ids).toContain('science-engineering');
      expect(ids).toContain('colorful-education');
      expect(ids).toContain('editorial');
      expect(ids).toContain('nature-geography');
      expect(ids).toContain('chalkboard-classic');
      expect(ids).toContain('ocean-breeze');
    });

    it('retrieves themes by exact ID', () => {
      expect(getThemeById('modern-academic').id).toBe('modern-academic');
      expect(getThemeById('dark-technology').id).toBe('dark-technology');
      expect(getThemeById('chalkboard-classic').id).toBe('chalkboard-classic');
    });

    it('retrieves themes case-insensitively and trims whitespace', () => {
      expect(getThemeById('  Modern-Academic  ').id).toBe('modern-academic');
      expect(getThemeById('DARK-TECHNOLOGY').id).toBe('dark-technology');
      expect(getThemeById('EDITORIAL').id).toBe('editorial');
    });

    it('resolves legacy aliases to their canonical counterparts', () => {
      expect(getThemeById('modern-dark').id).toBe('dark-technology');
      expect(getThemeById('clean-minimal').id).toBe('minimal-classroom');
      expect(getThemeById('stem-cyber').id).toBe('science-engineering');
      expect(getThemeById('warm-academic').id).toBe('editorial');
    });

    it('falls back safely to default theme when ID is missing or invalid', () => {
      expect(getThemeById(undefined)).toEqual(DEFAULT_PRESENTATION_THEME);
      expect(getThemeById('')).toEqual(DEFAULT_PRESENTATION_THEME);
      expect(getThemeById('non-existent-theme-xyz')).toEqual(DEFAULT_PRESENTATION_THEME);
      expect(getThemeById('invalid')).toBe(DEFAULT_PRESENTATION_THEME);
    });
  });

  describe('2. Color Parsing & Luminance Calculations', () => {
    it('parses 6-digit hex colors accurately', () => {
      expect(parseColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
      expect(parseColor('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
      expect(parseColor('#1d4ed8')).toEqual({ r: 29, g: 78, b: 216, a: 1 });
    });

    it('parses 3-digit shorthand hex colors', () => {
      expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
      expect(parseColor('#000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
      expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('parses rgb and rgba string formats', () => {
      expect(parseColor('rgb(29, 78, 216)')).toEqual({ r: 29, g: 78, b: 216, a: 1 });
      expect(parseColor('rgba(255, 255, 255, 0.5)')).toEqual({ r: 255, g: 255, b: 255, a: 0.5 });
    });

    it('calculates relative luminance according to WCAG specifications', () => {
      expect(calculateRelativeLuminance(255, 255, 255)).toBeCloseTo(1.0, 3);
      expect(calculateRelativeLuminance(0, 0, 0)).toBe(0);
      // Pure sRGB primaries
      const lRed = calculateRelativeLuminance(255, 0, 0);
      const lGreen = calculateRelativeLuminance(0, 255, 0);
      const lBlue = calculateRelativeLuminance(0, 0, 255);
      expect(lGreen).toBeGreaterThan(lRed);
      expect(lRed).toBeGreaterThan(lBlue);
    });
  });

  describe('3. WCAG Contrast Ratio Calculations', () => {
    it('computes exact 21:1 contrast for black on white', () => {
      const ratio = computeContrastRatio('#000000', '#ffffff');
      expect(ratio).toBe(21);
    });

    it('computes 1:1 contrast for identical colors', () => {
      expect(computeContrastRatio('#ffffff', '#ffffff')).toBe(1);
      expect(computeContrastRatio('#1d4ed8', '#1d4ed8')).toBe(1);
    });

    it('is order-independent (commutative)', () => {
      const r1 = computeContrastRatio('#1d4ed8', '#ffffff');
      const r2 = computeContrastRatio('#ffffff', '#1d4ed8');
      expect(r1).toBe(r2);
    });

    it('computes accurate readability recommendations via getReadableTextColor', () => {
      // Dark backgrounds should choose white text
      expect(getReadableTextColor('#000000')).toBe('#ffffff');
      expect(getReadableTextColor('#090d16')).toBe('#ffffff');
      expect(getReadableTextColor('#1b4332')).toBe('#ffffff');

      // Light backgrounds should choose dark text
      expect(getReadableTextColor('#ffffff')).toBe('#0f172a');
      expect(getReadableTextColor('#f8fafc')).toBe('#0f172a');
      expect(getReadableTextColor('#faf8f5')).toBe('#0f172a');
    });
  });

  describe('4. Theme Structure and WCAG AA Validation Across All Curated Themes', () => {
    it('ensures all 9 themes have required typography, borders, and semantic colors', () => {
      for (const theme of PRESENTATION_THEMES) {
        expect(theme.id).toBeTruthy();
        expect(theme.name).toBeTruthy();
        expect(theme.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.cardBackground).toBeTruthy();
        expect(theme.cardBorder).toBeTruthy();
        expect(theme.primaryText).toBeTruthy();
        expect(theme.secondaryText).toBeTruthy();
        expect(theme.accentColor).toBeTruthy();

        // Typography structure
        expect(theme.typography.fontFamilyHeading).toBeTruthy();
        expect(theme.typography.fontFamilyBody).toBeTruthy();
        expect(theme.typography.titleSize).toBeGreaterThanOrEqual(48);
        expect(theme.typography.bodySize).toBeGreaterThanOrEqual(16);

        // Scales
        expect(theme.borderRadius.card).toBeGreaterThanOrEqual(4);
        expect(theme.spacing.md).toBeGreaterThanOrEqual(16);

        // Chart palette
        expect(theme.chartPalette.length).toBeGreaterThanOrEqual(5);

        // Semantic colors
        expect(theme.semantic.success).toBeTruthy();
        expect(theme.semantic.warning).toBeTruthy();
        expect(theme.semantic.danger).toBeTruthy();
      }
    });

    it('validates that ALL 9 curated themes satisfy WCAG 2.1 AA contrast requirements', () => {
      for (const theme of PRESENTATION_THEMES) {
        const report = validateThemeContrast(theme);

        // Primary text on background must exceed 4.5:1
        expect(
          report.contrastRatios.primaryTextOnBackground,
          `Theme ${theme.name} primaryTextOnBackground failed WCAG AA`
        ).toBeGreaterThanOrEqual(4.5);

        // Primary text on card must exceed 4.5:1
        expect(
          report.contrastRatios.primaryTextOnCard,
          `Theme ${theme.name} primaryTextOnCard failed WCAG AA`
        ).toBeGreaterThanOrEqual(4.5);

        // Secondary text on card must exceed 3.0:1
        expect(
          report.contrastRatios.secondaryTextOnCard,
          `Theme ${theme.name} secondaryTextOnCard failed WCAG AA`
        ).toBeGreaterThanOrEqual(3.0);

        // Accent on background must exceed 3.0:1 for visual prominence
        expect(
          report.contrastRatios.accentOnBackground,
          `Theme ${theme.name} accentOnBackground failed WCAG AA`
        ).toBeGreaterThanOrEqual(3.0);

        expect(report.isValid, `Theme ${theme.name} had contrast issues: ${report.issues.join(', ')}`).toBe(true);
      }
    });

    it('flags issues when validating a deliberately degraded low-contrast theme', () => {
      const brokenTheme = {
        ...MODERN_ACADEMIC_THEME,
        primaryText: '#e2e8f0', // Light gray text on white background -> fail
      };
      const report = validateThemeContrast(brokenTheme);
      expect(report.isValid).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues[0]).toContain('WCAG AA');
    });
  });
});

