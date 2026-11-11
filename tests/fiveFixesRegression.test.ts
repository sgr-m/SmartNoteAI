import { describe, it, expect } from 'vitest';
import {
  isGreetingOrChitchat,
  stripLeadingWelcomeBoilerplate,
  extractImageSearchTags,
  deriveWebImageQueryFromPrompt,
  parseMessageSegments,
} from '../src/renderer/components/aiChat/AIChatSidePanel';
import {
  stripFixedFontSizesFromHtml,
  cleanMarkdownInHtml,
  normalizeGeneratedHtml,
} from '../src/renderer/services/htmlRenderService';
import {
  detectDiagramType,
  isSupportedDiagramCode,
  sanitizeMermaidCode,
  renderMathGraphSvg,
  renderGeometrySvg,
  renderCircuitSvg,
  renderChartSvg,
  renderTikzSvg,
  renderDiagramToSvg,
} from '../src/renderer/services/vectorDiagramService';
import {
  enhanceIndividualTextWithAI,
  enhanceSlideContent,
} from '../src/renderer/services/boardEnhanceService';
import type { Page, TextObject } from '../src/shared/types';

function makeTextObj(overrides: Partial<TextObject> = {}): TextObject {
  return {
    id: 'txt-1',
    type: 'text',
    x: 60,
    y: 120,
    width: 600,
    height: 120,
    content: 'The **investment multiplier** ($k$) increases income -- greater than initial injection.',
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: '#ffffff',
    backgroundColor: 'transparent',
    opacity: 1,
    rotation: 0,
    preset: 'body',
    locked: false,
    layerId: 'layer-1',
    ...overrides,
  };
}

describe('Fix 1: Direct content on first prompt without greeting/welcome boilerplate', () => {
  it('distinguishes standalone greetings from real educational prompts starting with help/hi', () => {
    expect(isGreetingOrChitchat('hi')).toBe(true);
    expect(isGreetingOrChitchat('Hello!')).toBe(true);
    expect(isGreetingOrChitchat('Good morning')).toBe(true);
    expect(isGreetingOrChitchat('who are you?')).toBe(true);

    expect(isGreetingOrChitchat('help me derive the quadratic formula')).toBe(false);
    expect(isGreetingOrChitchat('hi explain photosynthesis')).toBe(false);
    expect(isGreetingOrChitchat('help solve 2x + 5 = 11')).toBe(false);
    expect(isGreetingOrChitchat('photosynthesis')).toBe(false);
  });

  it('strips unwanted Welcome to SmartBoard / SmartNoteAI preambles from educational responses', () => {
    const raw1 = `### Welcome to SmartBoard!\n\nHello! Welcome to SmartNoteAI Teaching Assistant.\n\n### Photosynthesis\nPlants convert light energy into chemical energy.`;
    const stripped1 = stripLeadingWelcomeBoilerplate(raw1);
    expect(stripped1.startsWith('### Photosynthesis')).toBe(true);
    expect(stripped1).not.toMatch(/welcome to smartboard/i);

    const raw2 = `Welcome to SmartBoard! Here is how mitosis works:`;
    const stripped2 = stripLeadingWelcomeBoilerplate(raw2);
    expect(stripped2).toBe('Here is how mitosis works:');
  });
});

describe('Fix 2: Vector diagram parsing, sanitization, and multi-format SVG rendering', () => {
  it('detects all SmartNoteAI diagram formats including chart, tikz, timeline, journey', () => {
    expect(detectDiagramType('{ "type": "chart", "labels": ["A","B"], "values": [10,20] }')).toBe('chart');
    expect(detectDiagramType('\\begin{tikzpicture}\n\\draw (0,0) -- (2,2);\n\\end{tikzpicture}')).toBe('tikz');
    expect(detectDiagramType('timeline\n  title Revolutions\n  1789 : French Revolution')).toBe('mermaid');
    expect(detectDiagramType('journey\n  title Student Day')).toBe('mermaid');

    expect(isSupportedDiagramCode('flowchart TD\nA-->B')).toBe(true);
    expect(isSupportedDiagramCode('{ "type": "chart", "labels": ["Q1"], "values": [5] }')).toBe(true);
    expect(isSupportedDiagramCode('plain explanation text')).toBe(false);
  });

  it('sanitizes multiple Mermaid nodes on a single line without greedy regex collapse', () => {
    const raw = `flowchart LR A[Sea Level (1013.25 mb)] → B(Troposphere (0-12 km)) --> C{Pressure > 500?}`;
    const sanitized = sanitizeMermaidCode(raw);
    expect(sanitized).toContain('A["Sea Level (1013.25 mb)"]');
    expect(sanitized).toContain('B("Troposphere (0-12 km)")');
    expect(sanitized).toContain('C{"Pressure > 500?"}');
    expect(sanitized).not.toContain('→');
    expect(sanitized).toContain('-->');
  });

  it('renders math graphs accurately including right-associative powers and coefficients', () => {
    const svg = renderMathGraphSvg({
      type: 'graph',
      title: 'Parabola',
      expressions: ['2x^2 - 3x + 1', '(x-1)^2'],
      xRange: [-4, 4],
      yRange: [-4, 12],
      axes: true,
      grid: true,
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
  });

  it('renders geometry polygons/vectors/angles, logic circuits (NAND/XOR/NOT), bar/pie charts, and TikZ', () => {
    const geomSvg = renderGeometrySvg({
      type: 'geometry',
      title: 'Polygon & Angle',
      shapes: [
        { kind: 'polygon', points: [[0, 0], [4, 0], [4, 3], [0, 3]], label: 'ABCD' },
        { kind: 'vector', points: [[0, 0], [3, 2]], label: 'v' },
        { kind: 'angle', points: [[4, 0], [0, 0], [0, 3]], label: '90°' },
      ],
    });
    expect(geomSvg).toContain('<polygon');
    expect(geomSvg).toContain('<line');

    const circuitSvg = renderCircuitSvg({
      type: 'circuit',
      title: 'Logic Gates',
      gates: [
        { type: 'NOT', x: 140, y: 90, label: 'INV' },
        { type: 'NAND', x: 280, y: 90, label: 'N1' },
        { type: 'XOR', x: 280, y: 170, label: 'X1' },
      ],
    });
    expect(circuitSvg).toContain('INV');
    expect(circuitSvg).toContain('<circle');

    const barSvg = renderChartSvg({
      type: 'chart',
      chartType: 'bar',
      title: 'Sales',
      labels: ['Q1', 'Q2', 'Q3'],
      values: [12, 24, 18],
    });
    expect(barSvg).toContain('<rect');
    expect(barSvg).toContain('Sales');

    const pieSvg = renderChartSvg({
      type: 'chart',
      chartType: 'pie',
      title: 'Composition',
      labels: ['N2', 'O2', 'Other'],
      values: [78, 21, 1],
    });
    expect(pieSvg).toContain('<path');
    expect(pieSvg).toContain('N2');

    const tikzSvg = renderTikzSvg(`\\begin{tikzpicture}\n\\draw[->] (0,0) -- (3,2);\n\\node at (3,2) {Peak};\n\\end{tikzpicture}`);
    expect(tikzSvg).toContain('<svg');
    expect(tikzSvg).toContain('Peak');
  });

  it('never returns a Mermaid bomb syntax error SVG when fallback runs in Node/Canvas', async () => {
    const result = await renderDiagramToSvg(`flowchart LR\nA[Sea Level (1013.25 mb)] -> B(Troposphere)\nB -> C[Stratosphere]`);
    expect(result.svg).toContain('<svg');
    expect(result.svg).not.toMatch(/Syntax error in text/i);
    expect(result.svg).toContain('Sea Level');
  });
});

describe('Fix 3 & Fix 4: Strip fixed HTML font-size and convert Markdown tokens in HTML', () => {
  it('removes CSS font-size from inline styles, style blocks, and font tags while keeping SVG & typography styles', () => {
    const dirty = `
      <style>.card { font-size: 24px; color: #f8fafc; } .sub { font-size: 1.2rem !important; }</style>
      <div style="font-size: 25px; color: #38bdf8; font-weight: 700; padding: 8px 12px;">
        <font size="5" color="#ffffff">Title</font>
        <svg viewBox="0 0 10 10"><text font-size="10">X</text></svg>
      </div>
    `;
    const cleaned = stripFixedFontSizesFromHtml(dirty);
    expect(cleaned).not.toMatch(/font-size\s*:\s*24px/i);
    expect(cleaned).not.toMatch(/font-size\s*:\s*1\.2rem/i);
    expect(cleaned).not.toMatch(/font-size\s*:\s*25px/i);
    expect(cleaned).not.toMatch(/<font[^>]*size=/i);
    expect(cleaned).toContain('color: #38bdf8');
    expect(cleaned).toContain('font-weight: 700');
    // SVG internal text attributes stay preserved
    expect(cleaned).toContain('<svg viewBox="0 0 10 10"><text font-size="10">X</text></svg>');
  });

  it('converts Markdown tokens (**, *, `, #, -, --) inside HTML while protecting LaTeX $...$ math', () => {
    const dirty = `<div>
### Concept Overview
The **investment multiplier** ($k = \\frac{1}{1 - MPC}$) is *greater* -- not smaller -- when \`MPC\` rises.
- First item
- Second item
</div>`;
    const cleanedMd = cleanMarkdownInHtml(dirty);
    const html = normalizeGeneratedHtml(dirty);
    expect(cleanedMd).toBe(html);
    expect(html).not.toContain('###');
    expect(html).toContain('Concept Overview');
    expect(html).toContain('<strong>investment multiplier</strong>');
    expect(html).toContain('<em>greater</em>');
    expect(html).toContain('>MPC</code>');
    expect(html).toContain('• First item');
    expect(html).toContain('— not smaller —');
    // Double/triple asterisks and raw markdown dashes are gone from visible text
    expect(html).not.toContain('**');
    expect(html).not.toContain('*greater*');
    expect(html).not.toContain(' -- ');
    // LaTeX formula remains intact
    expect(html).toContain('$k = \\frac{1}{1 - MPC}$');
  });

  it('ensures boardEnhanceService individual and slide enhancement emit font-size-free clean HTML', async () => {
    const textObj = makeTextObj({
      preset: 'title',
      fontSize: 42,
      content: 'Investment Multiplier',
    });

    const mockProvider = {
      getActiveProvider: () => 'gemini',
      getSelectedModel: () => 'gemini-2.5-flash',
      generateStructuredJson: async () => ({
        success: true,
        data: {
          format: 'html',
          isHtml: true,
          fontSize: 42,
          color: '#f8fafc',
          content: `<div style="font-size: 36px; border-bottom: 3px solid #38bdf8; color: #f8fafc;">### **Investment Multiplier** -- Key Concept</div>`,
        },
        model: 'mock',
        provider: 'gemini',
      }),
    } as any;

    const result = await enhanceIndividualTextWithAI({
      textObj,
      backgroundColor: '#1b3b2b',
      providerManager: mockProvider,
    });

    expect(result.enhancedObject.isHtml).toBe(true);
    expect(result.enhancedObject.fontSize).toBe(42);
    expect(result.enhancedObject.content).not.toMatch(/font-size\s*:/i);
    expect(result.enhancedObject.content).toContain('<strong>Investment Multiplier</strong>');
    expect(result.enhancedObject.content).not.toContain('**');

    const page: Page = {
      id: 'page-1',
      name: 'Slide 1',
      objects: [
        makeTextObj({ id: 'h1', preset: 'title', y: 40, fontSize: 40, content: 'Newton Laws' }),
        makeTextObj({ id: 'b1', preset: 'body', y: 150, fontSize: 22, content: 'Object **stays** at rest.' }),
      ],
      strokes: [],
      backgroundColor: '#1b3b2b',
    };
    const slideEnhanced = enhanceSlideContent(page);
    const titleOut = slideEnhanced.enhancedObjects.find((o) => o.id === 'h1') as TextObject;
    expect(titleOut.isHtml).toBe(true);
    expect(titleOut.content).not.toMatch(/font-size\s*:/i);
  });
});

describe('Fix 5: Educational web image search query extraction and image segment parsing', () => {
  it('extracts [IMAGE_SEARCH: ...] tags and derives web search queries for visual topics', () => {
    const raw = `### Photosynthesis\nPlants convert sunlight.\n\n[IMAGE_SEARCH: photosynthesis chloroplast diagram]`;
    const { cleanedText, queries } = extractImageSearchTags(raw);
    expect(queries).toEqual(['photosynthesis chloroplast diagram']);
    expect(cleanedText).not.toContain('[IMAGE_SEARCH:');

    expect(deriveWebImageQueryFromPrompt('photosynthesis', false)).toBe('photosynthesis');
    expect(deriveWebImageQueryFromPrompt('show me an image of plant cell', false)).toBe('plant cell');
    expect(deriveWebImageQueryFromPrompt('hi', true)).toBeNull();
    expect(deriveWebImageQueryFromPrompt('solve x^2 - 5x + 6 = 0', false)).toBeNull();
  });

  it('parses Markdown image links, direct image URLs, timeline & chart segments in parseMessageSegments', () => {
    const md = [
      '### Chloroplast Structure',
      '---',
      '![Chloroplast Diagram](https://upload.wikimedia.org/wikipedia/commons/a/ab/Chloroplast.svg)',
      '---',
      'https://example.org/assets/leaf-cross-section.png',
      '---',
      '```chart\n{ "type": "chart", "chartType": "bar", "labels": ["O2"], "values": [21] }\n```',
    ].join('\n');

    const segs = parseMessageSegments(md);
    const images = segs.filter((s) => s.type === 'image');
    expect(images.length).toBe(2);
    expect(images[0].imageUrl).toBe('https://upload.wikimedia.org/wikipedia/commons/a/ab/Chloroplast.svg');
    expect(images[0].displayTitle).toBe('Chloroplast Diagram');
    expect(images[1].imageUrl).toBe('https://example.org/assets/leaf-cross-section.png');

    const charts = segs.filter((s) => s.type === 'diagram');
    expect(charts.length).toBe(1);
    expect(charts[0].diagramType).toBe('chart');
  });
});

