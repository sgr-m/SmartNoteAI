import heroWhiteboard from '../assets/images/hero-whiteboard.png';
import desktopAnnotation from '../assets/images/desktop-annotation.png';
import subjectTools from '../assets/images/subject-tools.png';
import focusTool from '../assets/images/focus-tool.png';
import notesLatex from '../assets/images/notes-latex.png';
import resourceLibrary from '../assets/images/resource-library.png';

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  description: string;
  src: string;
  alt: string;
  resolution: string;
  fitMode?: 'cover' | 'contain';
}

export const galleryItems: GalleryItem[] = [
  {
    id: 'whiteboard-home',
    title: 'Interactive Whiteboard: Advanced STEM & Math Derivations',
    category: 'Canvas & Stylus',
    description:
      'Live lecture canvas showing Navier-Stokes, Gauss Divergence, Cauchy Integral, Riemann Zeta formulas, logic gates, and geometry instruments.',
    src: heroWhiteboard,
    alt: 'SmartNoteAI whiteboard showing handwritten advanced math formulas, binary search tree, and bottom dock',
    resolution: '1920 × 1080',
    fitMode: 'cover',
  },
  {
    id: 'desktop-annotation',
    title: 'Live Desktop Annotation: VS Code & Python Jupyter Notebook',
    category: 'Live Teaching Workflow',
    description:
      'Annotating directly over VS Code, Python code, and matplotlib data plots with handwritten notes, arrows, and the floating bottom dock.',
    src: desktopAnnotation,
    alt: 'SmartNoteAI desktop mode showing handwritten lecture annotations over VS Code and Python matplotlib plot',
    resolution: '1920 × 1080',
    fitMode: 'cover',
  },
  {
    id: 'subject-tools',
    title: 'STEM Subject Instruments: 50cm Ruler, 180° Protractor & Compass',
    category: 'Classroom Instruments',
    description:
      'Active mathematical instruments on canvas including a 50 cm metric ruler, 180° classroom protractor measuring 60° angles, and dynamic compass arc.',
    src: subjectTools,
    alt: 'Interactive mathematical ruler, 180-degree protractor, and compass tools in SmartNoteAI',
    resolution: '1920 × 1080',
    fitMode: 'cover',
  },
  {
    id: 'focus-tool',
    title: 'Presentation Spotlight: Logic Delay & Waveform Timing',
    category: 'Presentation Mode',
    description:
      'Circular spotlight beam dimming the background canvas to focus student attention on propagation delay and square wave pulse transitions.',
    src: focusTool,
    alt: 'SmartNoteAI spotlight tool highlighting propagation delay waveform transitions on dark canvas',
    resolution: '1920 × 1080',
    fitMode: 'cover',
  },
  {
    id: 'latex-concept',
    title: 'STEM Lecture: Logic Circuits & Native KaTeX Formula Editor',
    category: 'Mathematics & STEM',
    description:
      'Computer science demonstration with full adder digital logic diagrams, truth table, and native KaTeX equation formatting rendered locally.',
    src: notesLatex,
    alt: 'SmartNoteAI canvas displaying full adder logic circuit diagram, truth table, and LaTeX formula editor',
    resolution: '1920 × 1080',
    fitMode: 'cover',
  },
  {
    id: 'resource-library',
    title: 'Subject Teaching Tools & STEM Lesson Modules',
    category: 'Lesson Management',
    description:
      'Calibrated STEM formula modules, Cartesian axes, Pythagorean theorem, and calculus derivative rules ready for one-click insertion.',
    src: resourceLibrary,
    alt: 'SmartNoteAI Subject Teaching Tools dialog displaying STEM formulas and mathematical modules',
    resolution: '1920 × 1080',
    fitMode: 'cover',
  },
];
