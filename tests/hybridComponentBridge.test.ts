/**
 * hybridComponentBridge.test.ts — Unit tests for Hybrid Component Bridge
 * TASK-103 Verification
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeSvg,
  renderSvgDiagramToCanvasObject,
  validateCardSpec,
  createNativeShape,
  createNativeText,
  compileHtmlCardToNativeObjects,
  compileSlideHeaderToNativeObjects,
  compileSlideFooterToNativeObjects,
  compileDeckSlideToNativeObjects,
} from '../src/renderer/services/aiPresentation/hybridComponentBridge';
import {
  getThemeById,
  MODERN_ACADEMIC_THEME,
  DARK_TECHNOLOGY_THEME,
  CHALKBOARD_CLASSIC_THEME,
} from '../src/renderer/services/aiPresentation/presentationThemes';
import {
  BoundingBox,
  HtmlCardSpec,
  SlideContentSpec,
} from '../src/shared/aiPresentationTypes';
import { ShapeObject, TextObject, ImageObject, GroupObject } from '../src/shared/types';

describe('TASK-103: Hybrid Component Bridge', () => {
  const standardBounds: BoundingBox = { x: 100, y: 150, width: 800, height: 500 };
  const theme = MODERN_ACADEMIC_THEME;

  describe('1. Security & Input Sanitization', () => {
    it('sanitizes malicious HTML and script tags from text fields', () => {
      const malicious = '<script>alert("xss")</script><b>Photosynthesis</b>';
      const clean = sanitizeText(malicious);
      expect(clean).toBe('alert("xss")Photosynthesis');
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<b>');
    });

    it('handles non-string, null, and undefined values safely in sanitizeText', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText(42)).toBe('42');
      expect(sanitizeText(true)).toBe('true');
    });

    it('sanitizes SVGs by stripping scripts, foreignObjects, and inline event handlers', () => {
      const maliciousSvg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <script>alert('pwned')</script>
          <foreignObject width="100" height="50">
            <body xmlns="http://www.w3.org/1999/xhtml">
              <iframe src="evil.com"></iframe>
            </body>
          </foreignObject>
          <circle cx="50" cy="50" r="40" fill="red" onclick="alert(1)" onload="alert(2)" />
          <a href="javascript:alert(3)"><rect width="10" height="10"/></a>
        </svg>
      `;

      const sanitized = sanitizeSvg(maliciousSvg);
      expect(sanitized).toContain('<svg');
      expect(sanitized).toContain('</svg>');
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('<foreignObject');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('onclick=');
      expect(sanitized).not.toContain('onload=');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('<circle cx="50" cy="50" r="40" fill="red"');
    });

    it('rejects non-SVG content in sanitizeSvg', () => {
      expect(sanitizeSvg('<html><body>Not an SVG</body></html>')).toBe('');
      expect(sanitizeSvg('')).toBe('');
      expect(sanitizeSvg(null as any)).toBe('');
    });

    it('renders sanitized SVG into an ImageObject with Data URL', () => {
      const svg = `<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="blue"/></svg>`;
      const imgObj = renderSvgDiagramToCanvasObject(svg, { x: 50, y: 50, width: 200, height: 200 });

      expect(imgObj).not.toBeNull();
      expect(imgObj?.type).toBe('image');
      expect(imgObj?.dataUrl).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
      expect(imgObj?.width).toBe(200);
      expect(imgObj?.height).toBe(200);
    });

    it('validates raw card specs with fallback defaults', () => {
      const emptySpec = validateCardSpec(null);
      expect(emptySpec.cardType).toBe('basic-info');
      expect(emptySpec.id).toBeDefined();

      const invalidTypeSpec = validateCardSpec({ cardType: 'unsupported-mystery-type', title: 'Test' });
      expect(invalidTypeSpec.cardType).toBe('basic-info');
      expect(invalidTypeSpec.title).toBe('Test');
    });
  });

  describe('2. Native Object Constructors', () => {
    it('creates native ShapeObject with valid default properties', () => {
      const shape = createNativeShape({
        shapeType: 'roundedRect',
        x: 10,
        y: 20,
        width: 150,
        height: 80,
        fillColor: '#ffffff',
      });

      expect(shape.type).toBe('shape');
      expect(shape.shapeType).toBe('roundedRect');
      expect(shape.x).toBe(10);
      expect(shape.y).toBe(20);
      expect(shape.width).toBe(150);
      expect(shape.height).toBe(80);
      expect(shape.fillColor).toBe('#ffffff');
      expect(shape.fillOpacity).toBe(1);
      expect(shape.strokeColor).toBe('transparent');
      expect(shape.layerId).toBe('objects');
    });

    it('creates native TextObject with valid default properties', () => {
      const text = createNativeText({
        content: 'Newton\'s First Law',
        x: 15,
        y: 25,
        width: 300,
        height: 40,
        fontSize: 22,
        fontWeight: 700,
      });

      expect(text.type).toBe('text');
      expect(text.content).toBe('Newton\'s First Law');
      expect(text.fontSize).toBe(22);
      expect(text.fontWeight).toBe(700);
      expect(text.color).toBe('#ffffff');
      expect(text.layerId).toBe('objects');
    });
  });

  describe('3. Compilation of All 13 Component Types', () => {
    it('1. compiles basic-info card with badge, title, subtitle, bullets, and formula', () => {
      const spec: HtmlCardSpec = {
        cardType: 'basic-info',
        badge: 'Fundamental Principle',
        title: 'Conservation of Energy',
        subtitle: 'Thermodynamics Module',
        bulletPoints: [
          'Energy cannot be created or destroyed.',
          'It can only be transformed from one form to another.',
        ],
        formula: 'E_k + E_p = \\text{constant}',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);
      expect(objects.length).toBeGreaterThanOrEqual(6);

      // Card Container (roundedRect)
      const container = objects[0] as ShapeObject;
      expect(container.type).toBe('shape');
      expect(container.shapeType).toBe('roundedRect');
      expect(container.x).toBe(standardBounds.x);
      expect(container.y).toBe(standardBounds.y);
      expect(container.fillColor).toBe(theme.cardBackground);

      // Title TextObject
      const titleObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Conservation')) as TextObject;
      expect(titleObj).toBeDefined();
      expect(titleObj.fontWeight).toBe(700);

      // Formula TextObject
      const formulaObj = objects.find((o) => o.type === 'text' && (o as TextObject).isLatex) as TextObject;
      expect(formulaObj).toBeDefined();
      expect(formulaObj.content).toBe('E_k + E_p = \\text{constant}');
    });

    it('2. compiles key-takeaway card with left vertical accent stripe and border', () => {
      const spec: HtmlCardSpec = {
        cardType: 'key-takeaway',
        badge: 'CORE TAKEAWAY',
        title: 'Special Relativity Axiom',
        body: 'The speed of light in a vacuum is independent of the motion of all observers.',
        accentColor: '#38bdf8',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      // Outer container has accent border
      const container = objects[0] as ShapeObject;
      expect(container.strokeColor).toBe('#38bdf8');
      expect(container.strokeWidth).toBe(2);

      // Left vertical accent stripe
      const stripe = objects.find(
        (o) => o.type === 'shape' && (o as ShapeObject).width === 6 && (o as ShapeObject).fillColor === '#38bdf8'
      ) as ShapeObject;
      expect(stripe).toBeDefined();

      // Title & Body
      const titleObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Special Relativity')) as TextObject;
      expect(titleObj).toBeDefined();
    });

    it('3. compiles definition card with term, pronunciation, definition, and example', () => {
      const spec: HtmlCardSpec = {
        cardType: 'definition',
        term: 'Mitochondria',
        pronunciation: '/ˌmaɪ.t̬əˈkɑːn.dri.ə/ • noun',
        formalDefinition: 'Membrane-bound cell organelles that generate most of the chemical energy needed to power the cell.',
        example: 'Muscle cells contain thousands of mitochondria to sustain high ATP demand.',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      const termObj = objects.find((o) => o.type === 'text' && (o as TextObject).content === 'Mitochondria') as TextObject;
      expect(termObj).toBeDefined();
      expect(termObj.preset).toBe('title');

      const defObj = objects.find((o) => o.type === 'text' && (o as TextObject).preset === 'definition') as TextObject;
      expect(defObj).toBeDefined();
      expect(defObj.content).toContain('Membrane-bound');

      const exObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Example:')) as TextObject;
      expect(exObj).toBeDefined();
    });

    it('4. compiles problem-solution card in side-by-side mode when bounds are wide', () => {
      const spec: HtmlCardSpec = {
        cardType: 'problem-solution',
        title: 'Kinematics Practice',
        problem: {
          title: 'Challenge',
          text: 'A ball is dropped from a 45m cliff. Find the impact velocity.',
        },
        solution: {
          title: 'Worked Solution',
          text: 'Using v² = u² + 2as with u=0 and s=45m: v = √(2 * 9.8 * 45) ≈ 29.7 m/s.',
        },
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      // Contains two sub-card boxes
      const subBoxes = objects.filter(
        (o) => o.type === 'shape' && (o as ShapeObject).shapeType === 'roundedRect' && o !== objects[0]
      );
      expect(subBoxes.length).toBeGreaterThanOrEqual(2);

      const probText = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('cliff')) as TextObject;
      expect(probText).toBeDefined();

      const solText = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('29.7 m/s')) as TextObject;
      expect(solText).toBeDefined();
    });

    it('4b. compiles problem-solution card in stacked mode when bounds are narrow', () => {
      const narrowBounds: BoundingBox = { x: 50, y: 50, width: 380, height: 600 };
      const spec: HtmlCardSpec = {
        cardType: 'problem-solution',
        title: 'Compact Challenge',
        problem: { text: 'Narrow problem statement' },
        solution: { text: 'Narrow solution statement' },
      };

      const objects = compileHtmlCardToNativeObjects(spec, narrowBounds, theme);
      expect(objects.length).toBeGreaterThanOrEqual(4);
    });

    it('5. compiles metric-highlight card with giant value and descriptive label', () => {
      const spec: HtmlCardSpec = {
        cardType: 'metric-highlight',
        badge: 'PHYSICAL CONSTANT',
        metricValue: '299,792 km/s',
        metricLabel: 'Speed of Light in Vacuum (c)',
        metricSubtext: 'Fundamental cosmic speed limit according to Special Relativity.',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      const valObj = objects.find((o) => o.type === 'text' && (o as TextObject).content === '299,792 km/s') as TextObject;
      expect(valObj).toBeDefined();
      expect(valObj.fontSize).toBeGreaterThanOrEqual(36);
      expect(valObj.fontWeight).toBe(800);

      const labelObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Speed of Light')) as TextObject;
      expect(labelObj).toBeDefined();
    });

    it('6. compiles quote card with quotation mark, italic quote, and citation', () => {
      const spec: HtmlCardSpec = {
        cardType: 'quote',
        quoteText: 'Imagination is more important than knowledge. For knowledge is limited.',
        quoteAuthor: 'Albert Einstein',
        quoteSource: 'Cosmic Religion and Other Opinions, 1931',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      const quoteGlyph = objects.find((o) => o.type === 'text' && (o as TextObject).content === '“') as TextObject;
      expect(quoteGlyph).toBeDefined();

      const quoteText = objects.find((o) => o.type === 'text' && (o as TextObject).fontStyle === 'italic') as TextObject;
      expect(quoteText).toBeDefined();
      expect(quoteText.content).toContain('Imagination is more important');

      const authorObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Einstein')) as TextObject;
      expect(authorObj).toBeDefined();
    });

    it('7. compiles comparison card with two equal columns and central divider', () => {
      const spec: HtmlCardSpec = {
        cardType: 'comparison',
        title: 'Plant vs Animal Cells',
        leftColumn: {
          title: 'Plant Cells',
          items: ['Cellulose cell wall', 'Large central vacuole', 'Chloroplasts present'],
        },
        rightColumn: {
          title: 'Animal Cells',
          items: ['No cell wall', 'Small temporary vacuoles', 'No chloroplasts'],
        },
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      const plantTitle = objects.find((o) => o.type === 'text' && (o as TextObject).content === 'Plant Cells') as TextObject;
      expect(plantTitle).toBeDefined();

      const animalTitle = objects.find((o) => o.type === 'text' && (o as TextObject).content === 'Animal Cells') as TextObject;
      expect(animalTitle).toBeDefined();

      // Right column X position must be strictly greater than Left column X position
      expect(animalTitle.x).toBeGreaterThan(plantTitle.x);

      // Central vertical divider line
      const verticalLine = objects.find(
        (o) => o.type === 'shape' && (o as ShapeObject).shapeType === 'line' && (o as ShapeObject).height > 50
      ) as ShapeObject;
      expect(verticalLine).toBeDefined();
    });

    it('8. compiles multi-column-feature card with sub-tiles and icons', () => {
      const spec: HtmlCardSpec = {
        cardType: 'multi-column-feature',
        title: 'Core Pillars of Object-Oriented Programming',
        features: [
          { title: 'Encapsulation', description: 'Data hiding within classes', icon: '🔒' },
          { title: 'Inheritance', description: 'Reusing parent behavior', icon: '🧬' },
          { title: 'Polymorphism', description: 'Many forms of an interface', icon: '🎭' },
        ],
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      const encap = objects.find((o) => o.type === 'text' && (o as TextObject).content === 'Encapsulation');
      const inher = objects.find((o) => o.type === 'text' && (o as TextObject).content === 'Inheritance');
      const poly = objects.find((o) => o.type === 'text' && (o as TextObject).content === 'Polymorphism');

      expect(encap).toBeDefined();
      expect(inher).toBeDefined();
      expect(poly).toBeDefined();
    });

    it('9. compiles numbered-steps card with step badges and titles', () => {
      const spec: HtmlCardSpec = {
        cardType: 'numbered-steps',
        title: 'The Scientific Method',
        steps: [
          { stepNumber: 1, title: 'Observe', description: 'Notice a phenomenon' },
          { stepNumber: 2, title: 'Hypothesize', description: 'Formulate an explanation' },
          { stepNumber: 3, title: 'Experiment', description: 'Test the hypothesis' },
          { stepNumber: 4, title: 'Analyze', description: 'Draw conclusions' },
        ],
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      // Check number badge text objects
      const badge1 = objects.find((o) => o.type === 'text' && (o as TextObject).content === '1');
      const badge4 = objects.find((o) => o.type === 'text' && (o as TextObject).content === '4');

      expect(badge1).toBeDefined();
      expect(badge4).toBeDefined();

      const stepTitle = objects.find((o) => o.type === 'text' && (o as TextObject).content === 'Hypothesize');
      expect(stepTitle).toBeDefined();
    });

    it('10. compiles timeline card with milestones in horizontal and vertical modes', () => {
      const spec: HtmlCardSpec = {
        cardType: 'timeline',
        title: 'Evolution of Computing',
        timelineEvents: [
          { dateOrEra: '1837', title: 'Analytical Engine', description: 'Babbage design' },
          { dateOrEra: '1945', title: 'ENIAC', description: 'First electronic computer' },
          { dateOrEra: '1971', title: 'Microprocessor', description: 'Intel 4004' },
        ],
      };

      // Horizontal wide
      const horizObjects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);
      const eniac = horizObjects.find((o) => o.type === 'text' && (o as TextObject).content === 'ENIAC');
      expect(eniac).toBeDefined();

      // Vertical narrow
      const narrowBounds: BoundingBox = { x: 50, y: 50, width: 400, height: 600 };
      const vertObjects = compileHtmlCardToNativeObjects(spec, narrowBounds, theme);
      const babbage = vertObjects.find((o) => o.type === 'text' && (o as TextObject).content === 'Analytical Engine');
      expect(babbage).toBeDefined();
    });

    it('11. compiles warning-note card with warning accent stripe and banner', () => {
      const spec: HtmlCardSpec = {
        cardType: 'warning-note',
        title: 'Common Exam Misconception',
        body: 'Mass and weight are NOT identical. Mass is scalar (kg); weight is a gravitational force vector (N).',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      const container = objects[0] as ShapeObject;
      expect(container.strokeColor).toBe(theme.semantic.warning);

      const titleObj = objects.find((o) => o.type === 'text' && (o as TextObject).preset === 'warning') as TextObject;
      expect(titleObj).toBeDefined();
      expect(titleObj.color).toBe(theme.semantic.warning);
    });

    it('12. compiles question-answer card with question and answer blocks', () => {
      const spec: HtmlCardSpec = {
        cardType: 'question-answer',
        question: 'Why do planets orbit in ellipses rather than perfect circles?',
        answer: 'Kepler\'s First Law: Gravitational two-body solutions naturally trace conic sections depending on initial orbital energy.',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      const qObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Q: Why do planets')) as TextObject;
      expect(qObj).toBeDefined();

      const aObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('A: Kepler\'s')) as TextObject;
      expect(aObj).toBeDefined();
    });

    it('13. compiles summary card with checkmarks and memorable recap callout', () => {
      const spec: HtmlCardSpec = {
        cardType: 'summary',
        title: 'Key Takeaways from Today\'s Class',
        takeaways: [
          'Work equals force multiplied by displacement in direction of force.',
          'Power is the rate of doing work (Watts = Joules / second).',
          'Mechanical efficiency is always less than 100% due to friction.',
        ],
        recapNote: 'Remember: Friction converts useful mechanical work into thermal energy.',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);

      const checkItem = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('✓') && (o as TextObject).content.includes('Work equals')) as TextObject;
      expect(checkItem).toBeDefined();

      const recapObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Remember: Friction')) as TextObject;
      expect(recapObj).toBeDefined();
    });
  });

  describe('4. Theme Application & Visual Customization', () => {
    it('applies dark technology theme colors correctly', () => {
      const darkTheme = DARK_TECHNOLOGY_THEME;
      const spec: HtmlCardSpec = {
        cardType: 'basic-info',
        title: 'Quantum Entanglement',
        body: 'Particles remain connected even across vast interstellar distances.',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, darkTheme);
      const container = objects[0] as ShapeObject;
      expect(container.fillColor).toBe(darkTheme.cardBackground);
      expect(container.strokeColor).toBe(darkTheme.cardBorder);

      const titleObj = objects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Quantum')) as TextObject;
      expect(titleObj.color).toBe(darkTheme.primaryText);
    });

    it('applies chalkboard classic theme colors correctly', () => {
      const chalkTheme = CHALKBOARD_CLASSIC_THEME;
      const spec: HtmlCardSpec = {
        cardType: 'key-takeaway',
        title: 'Pythagorean Theorem',
        body: 'In any right triangle: a² + b² = c².',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, chalkTheme);
      const container = objects[0] as ShapeObject;
      expect(container.fillColor).toBe(chalkTheme.cardBackground);
    });

    it('respects user visual overrides in HtmlCardSpec', () => {
      const customSpec: HtmlCardSpec = {
        cardType: 'basic-info',
        title: 'Custom Colored Card',
        backgroundColor: '#112233',
        borderColor: '#ff0055',
        borderWidth: 4,
      };

      const objects = compileHtmlCardToNativeObjects(customSpec, standardBounds, theme);
      const container = objects[0] as ShapeObject;
      expect(container.fillColor).toBe('#112233');
      expect(container.strokeColor).toBe('#ff0055');
      expect(container.strokeWidth).toBe(4);
    });
  });

  describe('5. Grouping Option', () => {
    it('wraps compiled objects into a single GroupObject when createGroup is true', () => {
      const spec: HtmlCardSpec = {
        id: 'grouped-card-1',
        cardType: 'basic-info',
        title: 'Grouped Card',
        body: 'This card should be returned as a single GroupObject.',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme, {
        createGroup: true,
      });

      expect(objects).toHaveLength(1);
      const group = objects[0] as GroupObject;
      expect(group.type).toBe('group');
      expect(group.id).toBe('grouped-card-1');
      expect(group.objects.length).toBeGreaterThanOrEqual(2);
      expect(group.bbox.width).toBe(standardBounds.width);
      expect(group.bbox.height).toBe(standardBounds.height);
    });

    it('returns flat array of independently editable objects when createGroup is false', () => {
      const spec: HtmlCardSpec = {
        cardType: 'basic-info',
        title: 'Independent Card',
        body: 'Heading and body can be double-clicked individually.',
      };

      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme, {
        createGroup: false,
      });

      expect(objects.length).toBeGreaterThan(1);
      expect(objects.some((o) => o.type === 'shape')).toBe(true);
      expect(objects.some((o) => o.type === 'text')).toBe(true);
      expect(objects.some((o) => o.type === 'group')).toBe(false);
    });
  });

  describe('6. Full Slide Deck Compilers', () => {
    it('compiles slide header with title, subtitle, and accent bar', () => {
      const headerBounds: BoundingBox = { x: 80, y: 70, width: 1760, height: 120 };
      const headerObjs = compileSlideHeaderToNativeObjects(
        'Module 3: Cellular Biology',
        'Structure & Function of Eukaryotic Organelles',
        headerBounds,
        theme
      );

      expect(headerObjs.length).toBe(3); // Title + Subtitle + Accent line
      const titleObj = headerObjs[0] as TextObject;
      expect(titleObj.content).toBe('Module 3: Cellular Biology');
      expect(titleObj.fontSize).toBe(theme.typography.titleSize);
    });

    it('compiles slide footer with topic and slide counter', () => {
      const footerBounds: BoundingBox = { x: 80, y: 1020, width: 1760, height: 36 };
      const footerObjs = compileSlideFooterToNativeObjects(
        2,
        8,
        'AP Biology — Unit 1',
        footerBounds,
        theme
      );

      expect(footerObjs.length).toBe(3); // Separator line + topic label + slide counter
      const counterObj = footerObjs.find((o) => o.type === 'text' && (o as TextObject).content.includes('Slide 2 of 8'));
      expect(counterObj).toBeDefined();
    });

    it('compiles full deck slide with canvas background, header, partitioned cards, and footer', () => {
      const slideSpec: SlideContentSpec = {
        slideNumber: 1,
        title: 'Newtonian Dynamics',
        subtitle: 'The Three Laws of Motion',
        layout: 'three-card-grid',
        cards: [
          {
            cardType: 'basic-info',
            badge: 'LAW 1',
            title: 'Law of Inertia',
            body: 'An object at rest remains at rest unless acted upon by an external net force.',
          },
          {
            cardType: 'basic-info',
            badge: 'LAW 2',
            title: 'Fundamental Law',
            body: 'The rate of change of momentum is proportional to the applied force.',
            formula: 'F = ma',
          },
          {
            cardType: 'basic-info',
            badge: 'LAW 3',
            title: 'Action & Reaction',
            body: 'For every action in nature there is an equal and opposite reaction.',
          },
        ],
      };

      const fullObjects = compileDeckSlideToNativeObjects(slideSpec, theme, {
        slideIndex: 0,
        totalSlides: 5,
        topic: 'Classical Physics',
        includeBackground: true,
      });

      // Background rect at (0, 0, 1920, 1080) in layer 'background'
      const bg = fullObjects[0] as ShapeObject;
      expect(bg.type).toBe('shape');
      expect(bg.shapeType).toBe('rect');
      expect(bg.width).toBe(1920);
      expect(bg.height).toBe(1080);
      expect(bg.layerId).toBe('background');

      // Has slide title
      const titleObj = fullObjects.find((o) => o.type === 'text' && (o as TextObject).content === 'Newtonian Dynamics');
      expect(titleObj).toBeDefined();

      // Has 3 cards
      const law1 = fullObjects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Law of Inertia'));
      const law2 = fullObjects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Fundamental Law'));
      const law3 = fullObjects.find((o) => o.type === 'text' && (o as TextObject).content.includes('Action & Reaction'));

      expect(law1).toBeDefined();
      expect(law2).toBeDefined();
      expect(law3).toBeDefined();

      // Has footer counter
      const footerCounter = fullObjects.find((o) => o.type === 'text' && (o as TextObject).content === 'Slide 1 of 5');
      expect(footerCounter).toBeDefined();
    });
  });

  describe('7. Robustness & Edge Cases', () => {
    it('handles empty card content without throwing', () => {
      const emptySpec: HtmlCardSpec = {
        cardType: 'basic-info',
      };
      const objects = compileHtmlCardToNativeObjects(emptySpec, standardBounds, theme);
      expect(objects.length).toBeGreaterThanOrEqual(1); // At least container
    });

    it('handles zero or negative width/height gracefully', () => {
      const degenerateBounds: BoundingBox = { x: 0, y: 0, width: 0, height: 0 };
      const spec: HtmlCardSpec = {
        cardType: 'basic-info',
        title: 'Tiny Box',
        body: 'Content',
      };
      const objects = compileHtmlCardToNativeObjects(spec, degenerateBounds, theme);
      expect(objects.length).toBeGreaterThan(0);
      expect(objects[0].width).toBeGreaterThanOrEqual(1);
      expect(objects[0].height).toBeGreaterThanOrEqual(1);
    });

    it('handles massive body text without crashing', () => {
      const hugeText = 'Paragraph test line with many words. '.repeat(100);
      const spec: HtmlCardSpec = {
        cardType: 'basic-info',
        title: 'Massive Content Card',
        body: hugeText,
      };
      const objects = compileHtmlCardToNativeObjects(spec, standardBounds, theme);
      expect(objects.length).toBeGreaterThanOrEqual(2);
    });
  });
});
