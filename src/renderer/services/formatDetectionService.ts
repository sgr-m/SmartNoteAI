/**
 * formatDetectionService.ts
 * Automatic Format Mode Detection Subsystem (HTML, LaTeX Math, Markdown)
 * 
 * Automatically detects whether text content is:
 * 1. HTML / CSS: starts with or contains HTML elements (<div>, <span>, <p>, <h1>, <table>, <style>)
 * 2. LaTeX: pure mathematical formula, equation, or derivation ($$...$$, \[...\], \bar{x} = \frac{...}{...})
 * 3. Markdown: standard headings (#), lists (-), bold (**), tables (|), or plain text
 */

import { isPureLatexFormula, isLatexSyntax } from './latexService';
import { isMarkdownSyntax } from './markdownRenderService';

export type TextFormatMode = 'html' | 'latex' | 'markdown';

export interface FormatModeFlags {
  isHtml: boolean;
  isLatex: boolean;
  isMarkdown: boolean;
}

/**
 * Checks if a string contains HTML/CSS block tags or markup
 */
export function isHtmlSyntax(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  // Starts with common HTML opening tag
  if (/^<(!DOCTYPE|html|div|span|p|h[1-6]|table|section|article|header|footer|style|blockquote|pre|ul|ol|li)\b/i.test(trimmed)) {
    return true;
  }
  // Contains standard paired HTML markup tags e.g. <div ...>...</div>, <span>...</span>
  if (/<(div|span|p|h[1-6]|table|strong|em|mark|b|i|u|style|section|header|article)\b[^>]*>[\s\S]*<\/\1>/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Automatically determines the appropriate format mode (HTML, LaTeX, or Markdown)
 * based on text content and optional explicit flags.
 */
export function detectTextFormatMode(
  content: string,
  explicitFlags?: { isHtml?: boolean; isLatex?: boolean; isMarkdown?: boolean }
): FormatModeFlags {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    return {
      isHtml: Boolean(explicitFlags?.isHtml),
      isLatex: Boolean(explicitFlags?.isLatex),
      isMarkdown: Boolean(explicitFlags?.isMarkdown ?? (!explicitFlags?.isHtml && !explicitFlags?.isLatex)),
    };
  }

  // 1. High Priority: HTML / CSS Web Mode
  if (isHtmlSyntax(trimmed)) {
    return { isHtml: true, isLatex: false, isMarkdown: false };
  }

  // 2. High Priority: Pure LaTeX Math Mode (equations, fractions, derivations)
  if (isPureLatexFormula(trimmed)) {
    return { isHtml: false, isLatex: true, isMarkdown: false };
  }

  // 3. Honor explicit user flags if specified and content doesn't contradict
  if (explicitFlags?.isHtml) {
    return { isHtml: true, isLatex: false, isMarkdown: false };
  }
  if (explicitFlags?.isLatex && (isPureLatexFormula(trimmed) || isLatexSyntax(trimmed))) {
    return { isHtml: false, isLatex: true, isMarkdown: false };
  }
  if (explicitFlags?.isMarkdown) {
    return { isHtml: false, isLatex: false, isMarkdown: true };
  }

  // 4. Markdown Syntax (headings, lists, inline math $...$, tables)
  if (isMarkdownSyntax(trimmed)) {
    return { isHtml: false, isLatex: false, isMarkdown: true };
  }

  // 5. Default: Markdown format
  return { isHtml: false, isLatex: false, isMarkdown: true };
}

