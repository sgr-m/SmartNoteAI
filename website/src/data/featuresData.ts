export interface FeatureItem {
  id: string;
  kicker: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  highlights: string[];
  reverse?: boolean;
}

export const primaryFeatures: FeatureItem[] = [
  {
    id: 'stylus-inking',
    kicker: 'Hardware Integration',
    title: 'Precision Stylus Digitizers & Real-Time Inking',
    description:
      'Engineered specifically for digitizer tablets including XP-Pen Deco Mini 7, Wacom One/Intuos, Huion Inspiroy, and Windows Ink displays. Experience dynamic pressure sensitivity that responds naturally to your hand with palm rejection for touch displays.',
    image: './images/hero-whiteboard.png',
    imageAlt: 'SmartNoteAI canvas showing handwritten mathematical derivations and diagrams',
    highlights: [
      'Native Chromium DirectManipulationStylus API integration',
      'Continuous pressure sensitivity smoothly modulating stroke width',
      'Dual mouse and stylus concurrent handling without pointer lock',
      'Multi-touch finger gesture rejection while writing',
    ],
    reverse: false,
  },
  {
    id: 'desktop-annotation',
    kicker: 'Live Teaching Workflow',
    title: 'Live Desktop Overlay & Rectangular Screen Snip',
    description:
      'Instantly toggle to Desktop Mode to annotate directly over active code in VS Code, PowerPoint slides, browser simulations, or video lessons with a floating dock. Capture any screen area with the Snip Tool and paste it directly onto your whiteboard.',
    image: './images/focus-tool.png',
    imageAlt: 'SmartNoteAI desktop spotlight focus and annotation mode over Windows applications',
    highlights: [
      'Draw over live Windows applications without interrupting lecture flow',
      'Area Screen Snip: crop any diagram or equation directly onto canvas',
      'Floating presentation toolbar with quick tool flyouts',
      'Instant toggle back to full whiteboard with saved annotations',
    ],
    reverse: true,
  },
  {
    id: 'stem-latex',
    kicker: 'Mathematical Typography',
    title: 'Native Offline LaTeX Engine & Math Formulas',
    description:
      'Write complex mathematical formulas, physics equations, and computer science logic circuits effortlessly. Featuring a bundled offline KaTeX engine with complete mathematical fonts, your symbols render crisply at any zoom level without internet access.',
    image: './images/notes-latex.png',
    imageAlt: 'Full Adder logic concept, truth table, and LaTeX formula editor in SmartNoteAI',
    highlights: [
      '100% offline bundled KaTeX engine with SIL OFL vector math fonts',
      'Mix handwritten proofs, truth tables, and formatted formulas on one board',
      'Vector scaling maintains pristine formula clarity at any zoom',
      'Real-time formula preview with intuitive math syntax assistance',
    ],
    reverse: false,
  },
];

export interface SecondaryFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const secondaryFeatures: SecondaryFeature[] = [
  {
    id: 'shape-recognition',
    title: 'Intelligent Shape Recognition',
    description:
      'Rough hand-drawn lines, triangles, polygons, circles, ellipses, and rectangles automatically snap into mathematically accurate geometric figures.',
    icon: 'shapes',
  },
  {
    id: 'subject-instruments',
    title: 'STEM Subject Instruments',
    description:
      'Interactive 30 cm metric ruler, 180° protractor, 30-60-90° set square, and coordinate axes calibrated for precise classroom demonstrations.',
    icon: 'ruler',
  },
  {
    id: 'presentation-focus',
    title: 'Spotlight & Presentation Mode',
    description:
      'Direct student attention with the Spotlight Focus tool, dimming background clutter while highlighting critical derivations.',
    icon: 'spotlight',
  },
  {
    id: 'pdf-workflows',
    title: 'PDF Import & Multi-Format Export',
    description:
      'Import textbooks, exam papers, or assignment slides directly onto canvas pages with local PDF.js. Export lessons to high-res PDF, PNG, SVG, or editable .sbl files.',
    icon: 'pdf',
  },
  {
    id: 'resource-library',
    title: 'Teaching Resource Library',
    description:
      'Organize and reuse curated educational diagrams, STEM icons, formulas, and custom lesson assets with drag-and-drop convenience.',
    icon: 'library',
  },
  {
    id: 'offline-privacy',
    title: '100% Offline & Private',
    description:
      'No cloud logins, no mandatory subscription, no internet tracking, and zero latency. Everything runs locally and securely on your PC.',
    icon: 'shield',
  },
];
