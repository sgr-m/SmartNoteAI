import heroWhiteboard from '../assets/images/hero-whiteboard.png';
import notesLatex from '../assets/images/notes-latex.png';
import subjectTools from '../assets/images/subject-tools.png';
import focusTool from '../assets/images/focus-tool.png';
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
    title: 'Interactive Whiteboard with Math Teaching Notes',
    category: 'Canvas & Stylus',
    description:
      'Live lecture canvas showing smooth handwritten notes, quadratic derivations, parabolic plots, and the bottom floating dock with quick tool flyouts.',
    src: heroWhiteboard,
    alt: 'SmartNoteAI whiteboard showing handwritten algebra notes, parabolic graph, and bottom dock',
    resolution: '1962 × 1080',
    fitMode: 'cover',
  },
  {
    id: 'latex-concept',
    title: 'STEM Lecture: Logic Circuits & LaTeX Math Editor',
    category: 'Mathematics & STEM',
    description:
      'Computer science demonstration with full adder digital logic diagrams, truth table, and native KaTeX equation formatting rendered locally.',
    src: notesLatex,
    alt: 'SmartNoteAI canvas displaying full adder logic circuit diagram, truth table, and LaTeX formula editor',
    resolution: '1920 × 1080',
    fitMode: 'cover',
  },
  {
    id: 'subject-tools',
    title: 'STEM Subject Teaching Tools',
    category: 'Classroom Instruments',
    description:
      'Interactive geometric drawing instruments including an authentic 180° protractor, 30 cm ruler, and set square triangle with degree markings.',
    src: subjectTools,
    alt: 'Interactive mathematical ruler and 180-degree protractor tools in SmartNoteAI',
    resolution: '990 × 967',
    fitMode: 'contain',
  },
  {
    id: 'focus-tool',
    title: 'Presentation Spotlight & Focus Tool',
    category: 'Presentation Mode',
    description:
      'Dynamic spotlight tool dimming the surrounding screen to focus student attention on a specific equation or diagram during presentations.',
    src: focusTool,
    alt: 'SmartNoteAI spotlight tool dimming background to focus on key whiteboard lecture content',
    resolution: '1920 × 1080',
    fitMode: 'cover',
  },
  {
    id: 'resource-library',
    title: 'Teaching Resource Library',
    category: 'Lesson Management',
    description:
      'Curated repository of reusable teaching assets, chemistry equipment, physics schematics, and custom stickers organized by subject.',
    src: resourceLibrary,
    alt: 'SmartNoteAI Teaching Resource Library panel displaying STEM diagrams and educational stickers',
    resolution: '1138 × 980',
    fitMode: 'contain',
  },
];
