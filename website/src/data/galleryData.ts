import heroWhiteboard from '../assets/images/hero-whiteboard.png';
import desktopAnnotation from '../assets/images/desktop-annotation.png';
import subjectTools from '../assets/images/subject-tools.png';
import focusTool from '../assets/images/focus-tool.png';
import notesLatex from '../assets/images/notes-latex.png';
import resourceLibrary from '../assets/images/resource-library.png';
import aiTeachingAssistant from '../assets/images/ai-teaching-assistant.jpg';
import educationalWebBrowser from '../assets/images/educational-web-browser.png';
import subjectMath from '../assets/images/subject-platform-mathematics.jpg';
import subjectPhysics from '../assets/images/subject-platform-physics.jpg';
import subjectCs from '../assets/images/subject-platform-cs.jpg';
import subjectGeography from '../assets/images/subject-platform-geography.jpg';
import geographyResourceCentre from '../assets/images/geography-resource-centre.jpg';

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
    id: 'ai-teaching-assistant',
    title: 'AI Teaching Assistant: Drag & Drop Cards, KaTeX & Vector Diagrams',
    category: 'AI Studio',
    description:
      'Docked AI co-teacher generating Mermaid flowcharts, KaTeX equations, symbol tables, and Web Search results with Drag & + Insert buttons.',
    src: aiTeachingAssistant,
    alt: 'SmartNoteAI Teaching Assistant panel beside whiteboard canvas displaying photon formula and symbol table',
    resolution: '1024 × 579',
    fitMode: 'cover',
  },
  {
    id: 'educational-web-browser',
    title: 'Integrated Multi-Tab Educational Web Browser & Area Capture',
    category: 'In-App Browser',
    description:
      'Built-in multi-tab browser with 1-click Google, Google Images, DuckDuckGo, Bing, Wikipedia, PhET Sims, and Capture Area / Capture Full tools.',
    src: educationalWebBrowser,
    alt: 'SmartNoteAI Educational Web Browser modal showing quick search portals, tabs, Capture Area and Capture Full buttons',
    resolution: '1024 × 651',
    fitMode: 'contain',
  },
  {
    id: 'geography-resource-centre',
    title: 'Geography Resource Centre (Official Survey of India Standard)',
    category: 'Geography & Maps',
    description:
      'Official Survey of India 2026 India Political Map (28 States & 8 UTs), 780+ Districts Atlas, 1:50,000 Toposheets, 3D Globe, GIS Lab & Offline Sync.',
    src: geographyResourceCentre,
    alt: 'SmartNoteAI Geography Resource Centre displaying Survey of India standard Political Map of India, World Atlas, Topographical Maps, and 3D Globe',
    resolution: '1024 × 673',
    fitMode: 'contain',
  },
  {
    id: 'subject-platform-math',
    title: 'Subject Teaching Platform: Mathematics Instruments & Graphing',
    category: 'Mathematics',
    description:
      'Scientific Calculator, Calibrated Ruler, 180° Protractor, Geometric Compass, Set Squares, 2D/3D Coordinate Planes, Function Plotter & 3D Solids.',
    src: subjectMath,
    alt: 'SmartNoteAI Subject Teaching Platform Mathematics tab showing instruments and graphing modules',
    resolution: '962 × 1012',
    fitMode: 'contain',
  },
  {
    id: 'subject-platform-physics',
    title: 'Subject Teaching Platform: Physics Circuits & Force Vectors',
    category: 'Physics',
    description:
      'DC Power Supply, Resistors, Rheostat, Capacitor, Inductor, Switches, Meters, Series/Parallel Circuit Builders, Force Vectors & Resultants.',
    src: subjectPhysics,
    alt: 'SmartNoteAI Subject Teaching Platform Physics tab showing electrical components and mechanics diagrams',
    resolution: '977 × 1023',
    fitMode: 'contain',
  },
  {
    id: 'subject-platform-cs',
    title: 'Subject Teaching Platform: Computer Science & Architecture',
    category: 'Computer Science',
    description:
      'Syntax-Highlighted Code Blocks, Pseudocode, Flowcharts, Trace Tables, Call Stack, Memory Pointers, Linked Lists, BSTs, Sorting, ER Diagrams & CPU.',
    src: subjectCs,
    alt: 'SmartNoteAI Subject Teaching Platform Computer Science tab showing code, data structures, and architecture tools',
    resolution: '956 × 1015',
    fitMode: 'contain',
  },
  {
    id: 'subject-platform-geography',
    title: 'Subject Teaching Platform: Geography Maps, Toposheets & Globe',
    category: 'Geography',
    description:
      'One-click access to Survey of India Official Political Maps, 1:50,000 Topographical Viewer, Conventional Symbols Panel, 3D Earth Lab & Outline Maps.',
    src: subjectGeography,
    alt: 'SmartNoteAI Subject Teaching Platform Geography tab showing Survey of India resources and 3D globe tools',
    resolution: '949 × 1016',
    fitMode: 'contain',
  },
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
