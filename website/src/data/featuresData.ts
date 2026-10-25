import heroWhiteboard from '../assets/images/hero-whiteboard.png';
import desktopAnnotation from '../assets/images/desktop-annotation.png';
import notesLatex from '../assets/images/notes-latex.png';

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
    image: heroWhiteboard,
    imageAlt: 'SmartNoteAI whiteboard showing handwritten advanced math formulas, geometry tools, and logic diagrams',
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
    title: 'Live Desktop Overlay & Code Annotation',
    description:
      'Instantly toggle to Desktop Mode to annotate directly over active code in VS Code, Jupyter notebooks, PowerPoint slides, browser simulations, or video lessons with a floating dock. Capture any screen area with the Snip Tool and paste it directly onto your whiteboard.',
    image: desktopAnnotation,
    imageAlt: 'SmartNoteAI desktop annotation over VS Code Jupyter notebook and matplotlib graph',
    highlights: [
      'Draw and highlight directly over live code, IDEs, and browser simulations',
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
    image: notesLatex,
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
      'Interactive metric ruler, 180° protractor, compass radius arc, and coordinate axes calibrated for classroom demonstrations.',
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
