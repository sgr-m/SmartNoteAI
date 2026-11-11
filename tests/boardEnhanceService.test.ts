import { describe, it, expect, vi } from 'vitest';
import {
  isDarkChalkboardTheme,
  enhanceSlideContent,
  enhanceSlideContentWithAI,
  enhanceIndividualTextWithAI,
  isTableContent,
  formatMarkdownTable,
} from '../src/renderer/services/boardEnhanceService';
import {
  VECTOR_ICONS_LIBRARY,
  findBestMatchingIcon,
  searchVectorIcons,
  vectorIconToDataUrl,
} from '../src/renderer/services/educationalVectorIconsService';
import { sanitizeMermaidCode } from '../src/renderer/services/vectorDiagramService';
import { Page, TextObject } from '../src/shared/types';

describe('AI 1-Click Board Enhancement & Vector Icon Library', () => {
  describe('educationalVectorIconsService', () => {
    it('contains over 100 high-quality vector icons across all educational domains', () => {
      expect(VECTOR_ICONS_LIBRARY.length).toBeGreaterThanOrEqual(100);
      const categories = new Set(VECTOR_ICONS_LIBRARY.map((i) => i.category));
      expect(categories.has('pedagogy')).toBe(true);
      expect(categories.has('thinking')).toBe(true);
      expect(categories.has('callouts')).toBe(true);
      expect(categories.has('math')).toBe(true);
      expect(categories.has('physics')).toBe(true);
      expect(categories.has('chemistry-biology')).toBe(true);
      expect(categories.has('tech-cs')).toBe(true);
      expect(categories.has('humanities')).toBe(true);
      expect(categories.has('business-charts')).toBe(true);
    });

    it('matches icons based on text content and pedagogical concepts', () => {
      const teacherMatch = findBestMatchingIcon('The teacher explains the core lesson today');
      expect(teacherMatch).toBeDefined();
      expect(['teacher-presenting', 'classroom-board', 'student-grad', 'speech-bubble']).toContain(teacherMatch?.id);

      const bulbMatch = findBestMatchingIcon('Here is a great idea or lightbulb moment for students');
      expect(bulbMatch).toBeDefined();
      expect(['bulb-idea', 'gear-brain', 'sparkle-star']).toContain(bulbMatch?.id);

      const checkMatch = findBestMatchingIcon('Correct answer: verified and checked');
      expect(checkMatch).toBeDefined();
      expect(['check-circle', 'trophy-cup', 'target-bullseye']).toContain(checkMatch?.id);

      const mathMatch = findBestMatchingIcon('Calculate the sum of angles using the pythagorean theorem');
      expect(mathMatch).toBeDefined();
      expect(['math-pythagoras', 'math-summation', 'math-formula', 'math-integral', 'geometry-compass', 'math-infinity', 'math-matrix']).toContain(mathMatch?.id);

      const csMatch = findBestMatchingIcon('Write a Python function to sort algorithm data');
      expect(csMatch).toBeDefined();
      expect(['code-brackets', 'algorithm-tree', 'binary-data', 'database-sql', 'terminal-prompt']).toContain(csMatch?.id);
    });

    it('searches icons by keyword across tags and labels', () => {
      const results = searchVectorIcons('atom', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tags).toContain('atom');

      const bulbResults = searchVectorIcons('bulb', 3);
      expect(bulbResults.length).toBeGreaterThan(0);
      expect(bulbResults[0].id).toBe('bulb-idea');
    });

    it('generates valid SVG data URLs for canvas ImageObject embedding', () => {
      const icon = VECTOR_ICONS_LIBRARY[0];
      const dataUrl = vectorIconToDataUrl(icon.svg);
      expect(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
      expect(decodeURIComponent(dataUrl)).toContain('<svg');
      expect(decodeURIComponent(dataUrl)).toContain('</svg>');
    });
  });

  describe('isDarkChalkboardTheme', () => {
    it('identifies dark chalkboard and slate backgrounds correctly', () => {
      expect(isDarkChalkboardTheme('#1b4332')).toBe(true); // Classic Dark Chalkboard Green
      expect(isDarkChalkboardTheme('#0f172a')).toBe(true); // Slate Dark
      expect(isDarkChalkboardTheme('#1e1b4b')).toBe(true); // Deep Indigo
      expect(isDarkChalkboardTheme(undefined)).toBe(true); // Default chalkboard
    });

    it('identifies light whiteboard backgrounds correctly', () => {
      expect(isDarkChalkboardTheme('#ffffff')).toBe(false); // Pure Whiteboard
      expect(isDarkChalkboardTheme('#f8fafc')).toBe(false); // Off-white
      expect(isDarkChalkboardTheme('white')).toBe(false);
      expect(isDarkChalkboardTheme('rgb(255, 255, 255)')).toBe(false);
    });
  });

  describe('enhanceSlideContent', () => {
    it('returns graceful message when page is empty', () => {
      const emptyPage: Page = {
        id: 'page-1',
        title: 'Empty Slide',
        width: 1920,
        height: 1080,
        background: { type: 'color', color: '#1b4332' },
        objects: [],
        layers: [],
      };
      const res = enhanceSlideContent(emptyPage);
      expect(res.success).toBe(false);
      expect(res.modifiedCount).toBe(0);
    });

    it('enhances typography, applies dark chalkboard contrast colors, adds title underlines and icons', () => {
      const darkPage: Page = {
        id: 'page-dark',
        title: 'Trigonometry Lesson',
        width: 1920,
        height: 1080,
        background: { type: 'color', color: '#1b4332' },
        layers: [{ id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 0 }],
        objects: [
          {
            id: 't1',
            type: 'text',
            content: '# Introduction to Right Triangles',
            x: 100,
            y: 80,
            width: 500,
            height: 60,
            fontFamily: 'Inter',
            fontSize: 36,
            fontWeight: 400,
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#ffffff',
            backgroundColor: 'transparent',
            opacity: 1,
            rotation: 0,
            preset: 'title',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
          {
            id: 't2',
            type: 'text',
            content: 'Important: The hypotenuse is always the longest side opposite to 90 degrees.',
            x: 100,
            y: 220,
            width: 600,
            height: 50,
            fontFamily: 'Inter',
            fontSize: 28,
            fontWeight: 400,
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#cccccc',
            backgroundColor: 'transparent',
            opacity: 1,
            rotation: 0,
            preset: 'warning',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
          {
            id: 't3',
            type: 'text',
            content: '1. Pythagorean Theorem: $$a^2 + b^2 = c^2$$',
            x: 100,
            y: 350,
            width: 550,
            height: 50,
            fontFamily: 'Inter',
            fontSize: 30,
            fontWeight: 400,
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#aaaaaa',
            backgroundColor: 'transparent',
            opacity: 1,
            rotation: 0,
            preset: 'formula',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
        ],
      };

      const result = enhanceSlideContent(darkPage);
      expect(result.success).toBe(true);
      expect(result.modifiedCount).toBe(3);
      expect(result.steps.length).toBeGreaterThanOrEqual(3);
      expect(result.newBackground).toBeDefined();

      // Verify title formatting
      const enhancedTitle = result.enhancedObjects.find((o) => o.id === 't1') as TextObject;
      expect(enhancedTitle).toBeDefined();
      expect(enhancedTitle.fontSize).toBeGreaterThanOrEqual(40);
      expect(enhancedTitle.color).toBe('#f8fafc'); // Crisp off-white on dark chalkboard
      expect(enhancedTitle.fontWeight).toBe(700);
      expect(enhancedTitle.width).toBeGreaterThanOrEqual(1000);

      // Verify decorative underline styling beneath title (canvas line shape or presentation CSS gradient line)
      const hasUnderline = result.enhancedObjects.some(
        (o) => (o.type === 'shape' && (o as any).shapeType === 'line') || (o.type === 'text' && (o as TextObject).content.includes('linear-gradient'))
      );
      expect(hasUnderline).toBe(true);

      // Verify warning styling
      const enhancedWarning = result.enhancedObjects.find((o) => o.id === 't2') as TextObject;
      expect(enhancedWarning).toBeDefined();
      expect(enhancedWarning.color).toBe('#f87171'); // Coral on chalkboard
      expect(enhancedWarning.fontWeight).toBe(600);

      // Verify bolding of leading keyword
      const enhancedFormula = result.enhancedObjects.find((o) => o.id === 't3') as TextObject;
      expect(enhancedFormula).toBeDefined();
      expect(enhancedFormula.content).toContain('**Pythagorean Theorem:**');

      // Verify ZERO OVERLAP: Each reflowed text element has strictly descending Y coordinate greater than previous Y + height
      const texts = result.enhancedObjects.filter((o): o is TextObject => o.type === 'text');
      for (let i = 1; i < texts.length; i++) {
        expect(texts[i].y).toBeGreaterThanOrEqual(texts[i - 1].y + (texts[i - 1].height || 40));
      }
    });

    it('detects and formats calculation frequency tables with KaTeX and Markdown alignment', () => {
      const rawTable = `Score (x_i) | Frequency (f_i) | Product (f_i * x_i)
60 | 2 | 60 * 2 = 120
70 | 5 | 70 * 5 = 350
80 | 10 | 80 * 10 = 800
90 | 3 | 90 * 3 = 270
Totals | \\sum f_i = 20 | \\sum (f_i * x_i) = 1540`;

      expect(isTableContent(rawTable)).toBe(true);
      const formatted = formatMarkdownTable(rawTable);
      expect(formatted).toContain(':---:');
      expect(formatted).toContain('Score ($x_i$)');
      expect(formatted).toContain('Frequency ($f_i$)');
      expect(formatted).toContain('$\\sum f_i = 20$');
      expect(formatted).toContain('**Totals**');
    });

    it('applies light whiteboard contrast colors when background is white', () => {
      const whitePage: Page = {
        id: 'page-white',
        title: 'Biology Lesson',
        width: 1920,
        height: 1080,
        background: { type: 'color', color: '#ffffff' },
        layers: [{ id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 0 }],
        objects: [
          {
            id: 't1',
            type: 'text',
            content: '# Photosynthesis in Plants',
            x: 100,
            y: 80,
            width: 500,
            height: 60,
            fontFamily: 'Inter',
            fontSize: 36,
            fontWeight: 400,
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#000000',
            backgroundColor: 'transparent',
            opacity: 1,
            rotation: 0,
            preset: 'title',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
        ],
      };

      const result = enhanceSlideContent(whitePage);
      expect(result.success).toBe(true);
      const enhancedTitle = result.enhancedObjects.find((o) => o.id === 't1') as TextObject;
      expect(enhancedTitle.color).toBe('#0f172a'); // Deep navy on light whiteboard
    });

    it('perfectly enhances Image 9 frequency table slide with gold title, KaTeX table, and strict zero-overlap', () => {
      const slidePage: Page = {
        id: 'frequency-slide',
        title: 'Grouped Frequency Example',
        width: 1920,
        height: 1080,
        background: { type: 'color', color: '#142d22' },
        layers: [{ id: 'objects', name: 'Objects', visible: true, locked: false, opacity: 1, order: 0 }],
        objects: [
          {
            id: 'item-heading',
            type: 'text',
            content: 'Step-by-Step Calculation Example',
            x: 80,
            y: 60,
            width: 700,
            height: 50,
            fontSize: 36,
            color: '#ffffff',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
          {
            id: 'item-subheading',
            type: 'text',
            content: "Let's apply this formula to a grouped frequency table where we want to find the average score of a test.",
            x: 80,
            y: 120,
            width: 900,
            height: 40,
            fontSize: 28,
            color: '#ffffff',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
          {
            id: 'item-table',
            type: 'text',
            content: `Score (x_i)    Frequency (f_i)    Product (f_i * x_i)
60    2    60 * 2 = 120
70    5    70 * 5 = 350
80    10    80 * 10 = 800
90    3    90 * 3 = 270
Totals    \\sum f_i = 20    \\sum (f_i * x_i) = 1540`,
            x: 80,
            y: 180,
            width: 800,
            height: 200,
            fontSize: 28,
            color: '#ffffff',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
        ],
      };

      const result = enhanceSlideContent(slidePage);
      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThanOrEqual(4);

      const heading = result.enhancedObjects.find((o) => o.id === 'item-heading') as TextObject;
      expect(heading).toBeDefined();
      expect(heading.color).toBe('#f8fafc'); // Crisp off-white title
      expect(heading.content).toContain('Step-by-Step Calculation Example');
      expect(heading.content).toContain('linear-gradient');

      const subheading = result.enhancedObjects.find((o) => o.id === 'item-subheading') as TextObject;
      expect(subheading).toBeDefined();
      expect(subheading.content).toContain("Let's apply this formula");

      const table = result.enhancedObjects.find((o) => o.id === 'item-table') as TextObject;
      expect(table).toBeDefined();
      expect(table.content).toContain('| Score ($x_i$) | Frequency ($f_i$) | Product ($f_i \\cdot x_i$) |');
      expect(table.content).toContain(':---:');
      expect(table.content).toContain('$\\sum f_i = 20$');
      expect(table.content).toContain('**Totals**');

      // Verify ZERO OVERLAP:
      // heading.y + heading.height must be STRICTLY LESS THAN subheading.y
      expect(subheading.y).toBeGreaterThan(heading.y + (heading.height || 40));
      // subheading.y + subheading.height must be STRICTLY LESS THAN table.y
      expect(table.y).toBeGreaterThan(subheading.y + (subheading.height || 40));
    });
  });

  describe('sanitizeMermaidCode', () => {
    it('fixes single-dash arrow -> to valid Mermaid arrow -->', () => {
      const code = 'graph LR\nA[Sea Level] -> B[Troposphere]';
      const sanitized = sanitizeMermaidCode(code);
      expect(sanitized).toContain('A[Sea Level] --> B[Troposphere]');
    });

    it('auto-quotes unquoted node labels with parentheses and units', () => {
      const code = 'graph LR\nA[Sea Level (1013.25 mb)] --> B[Troposphere (500 mb)]';
      const sanitized = sanitizeMermaidCode(code);
      expect(sanitized).toContain('A["Sea Level (1013.25 mb)"]');
      expect(sanitized).toContain('B["Troposphere (500 mb)"]');
    });

    it('preserves already quoted node labels', () => {
      const code = 'graph TD\nA["Already Quoted (text)"] --> B["Another One"]';
      const sanitized = sanitizeMermaidCode(code);
      expect(sanitized).toBe(code);
    });
  });

  describe('enhanceIndividualTextWithAI & Online Presentation Styles', () => {
    it('enhances heading with modern online presentation styling (category tag pill & gradient underline)', async () => {
      const headingObj: TextObject = {
        id: 'heading-1',
        type: 'text',
        content: 'Standard Deviation',
        x: 80,
        y: 60,
        width: 800,
        height: 50,
        fontSize: 36,
        color: '#ffffff',
        locked: false,
        visible: true,
        layerId: 'objects',
      };

      const result = await enhanceIndividualTextWithAI({
        textObj: headingObj,
        canvasWidth: 1920,
        canvasHeight: 1080,
        backgroundColor: '#142d22',
        slideTitle: 'Statistics',
      });

      expect(result.success).toBe(true);
      expect(result.enhancedObject).toBeDefined();
      expect(result.enhancedObject.isHtml).toBe(true);

      // Verify Online Presentation Heading Styling:
      // High-contrast clean typography and gradient accent line
      expect(result.enhancedObject.content).toContain('Standard Deviation');
      expect(result.enhancedObject.content).toContain('linear-gradient');
    });

    it('enhances table text directly preserving exact formulas and row counts', async () => {
      const tableObj: TextObject = {
        id: 'table-1',
        type: 'text',
        content: `Score (x_i)    Frequency (f_i)    Product (f_i * x_i)
60    2    60 * 2 = 120
70    5    70 * 5 = 350
Totals    \\sum f_i = 20    \\sum (f_i * x_i) = 1540`,
        x: 80,
        y: 200,
        width: 900,
        height: 250,
        fontSize: 28,
        color: '#ffffff',
        locked: false,
        visible: true,
        layerId: 'objects',
      };

      const result = await enhanceIndividualTextWithAI({
        textObj: tableObj,
        backgroundColor: '#142d22',
      });

      expect(result.success).toBe(true);
      expect(result.enhancedObject.content).toContain('| Score ($x_i$) | Frequency ($f_i$) | Product ($f_i \\cdot x_i$) |');
      expect(result.enhancedObject.content).toContain('| 60 | 2 | $60 \\cdot 2 = 120$ |');
      expect(result.enhancedObject.content).toContain('| **Totals** | $\\sum f_i = 20$ | $\\sum (f_i \\cdot x_i) = 1540$ |');
    });
  });

  describe('enhanceSlideContentWithAI (Parallel Multi-Element Processing)', () => {
    it('processes all text elements in parallel with progress updates and zero overlap', async () => {
      const slidePage: Page = {
        id: 'page-ai-test',
        title: 'Statistics Lesson',
        width: 1920,
        height: 1080,
        background: { type: 'color', color: '#142d22' },
        layers: [{ id: 'objects', name: 'Objects', visible: true, locked: false }],
        objects: [
          {
            id: 'h-1',
            type: 'text',
            content: 'Standard Deviation and Variance',
            x: 80,
            y: 50,
            fontSize: 36,
            color: '#ffffff',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
          {
            id: 'sub-1',
            type: 'text',
            content: 'Key formulas and step-by-step calculations for grouped data',
            x: 80,
            y: 120,
            fontSize: 28,
            color: '#ffffff',
            locked: false,
            visible: true,
            layerId: 'objects',
          } as TextObject,
        ],
      };

      const progressSteps: string[] = [];
      const result = await enhanceSlideContentWithAI({
        page: slidePage,
        onStepProgress: (step) => {
          progressSteps.push(step.statusText);
        },
      });

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(progressSteps.length).toBeGreaterThan(0);

      const enhancedHeading = result.enhancedObjects.find((o) => o.id === 'h-1') as TextObject;
      const enhancedSub = result.enhancedObjects.find((o) => o.id === 'sub-1') as TextObject;

      expect(enhancedHeading).toBeDefined();
      expect(enhancedSub).toBeDefined();

      // Zero overlap check
      expect(enhancedSub.y).toBeGreaterThan(enhancedHeading.y + (enhancedHeading.height || 40));
    });
  });
});
