import heroWhiteboard from '../assets/images/hero-whiteboard.png';
import desktopAnnotation from '../assets/images/desktop-annotation.png';
import notesLatex from '../assets/images/notes-latex.png';
import aiTeachingAssistant from '../assets/images/ai-teaching-assistant.jpg';
import educationalWebBrowser from '../assets/images/educational-web-browser.png';
import subjectMath from '../assets/images/subject-platform-mathematics.jpg';
import subjectPhysics from '../assets/images/subject-platform-physics.jpg';
import subjectCs from '../assets/images/subject-platform-cs.jpg';
import subjectGeography from '../assets/images/subject-platform-geography.jpg';
import geographyResourceCentre from '../assets/images/geography-resource-centre.jpg';

export interface FeatureItem {
  id: string;
  kicker: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  highlights: string[];
  reverse?: boolean;
  fitMode?: 'cover' | 'contain';
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
    id: 'integrated-browser',
    kicker: 'In-App Research & Capture',
    title: 'Integrated Multi-Tab Educational Web Browser',
    description:
      'Research concepts, run PhET physics/math simulations, browse Wikipedia, or find reference diagrams without leaving your whiteboard. Open multiple tabs seamlessly inside SmartNoteAI and capture either a full webpage or any dragged region straight onto the active slide.',
    image: educationalWebBrowser,
    imageAlt: 'SmartNoteAI Integrated Educational Web Browser with multi-tab support, search engines, PhET Sims, and Capture Area/Full controls',
    highlights: [
      'Multi-tab browsing (+ New Tab & right/middle-click "Open Link in New Tab")',
      '1-click portal buttons: Google, Google Images, DuckDuckGo, Bing, Wikipedia & PhET Sims',
      'Capture Area tool: drag-select any chart or diagram directly onto the canvas',
      'Capture Full tool: insert an entire reference page onto your slide to annotate over',
    ],
    reverse: false,
    fitMode: 'contain',
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
    reverse: true,
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
      'Interactive metric ruler, 180° protractor, compass radius arc, set squares, and Cartesian coordinate axes calibrated for classroom demonstrations.',
    icon: 'ruler',
  },
  {
    id: 'presentation-focus',
    title: 'Spotlight & Presentation Mode',
    description:
      'Direct student attention with the Spotlight Focus tool and Screen Veil, dimming background clutter while highlighting critical derivations.',
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
      'Organize and reuse curated educational diagrams, STEM icons, formulas, and custom lesson assets with Windows Explorer filesystem sync.',
    icon: 'library',
  },
  {
    id: 'offline-privacy',
    title: 'Offline-First Core & File Associations',
    description:
      'All drawing, KaTeX math, PDF imports, and synced maps run locally with zero mandatory cloud accounts. Native .sbl file association opens lessons directly from Windows Explorer.',
    icon: 'shield',
  },
];

export interface AICapabilityCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
}

export const aiShowcaseImage = aiTeachingAssistant;

export const aiCapabilities: AICapabilityCard[] = [
  {
    id: 'ai-generation',
    badge: 'AI Teaching Assistant',
    title: 'AI Lesson Notes & Deck Generation',
    description:
      'Generate structured topic explanations, worked math derivations, comparison tables, analogies, and full multi-slide lesson decks using 1-click quick prompts or natural chat.',
    highlights: [
      'Quick Prompts: Explain Simply, Vector Diagram, 3 Practice Questions, Step-by-Step Math',
      'Full AI Presentation Generator with auto-subject detection & outline refinement chat',
    ],
  },
  {
    id: 'ai-drag-drop',
    badge: 'Drag & Drop Workflow',
    title: 'Drag & Drop + 1-Click Card Insertion',
    description:
      'Every AI answer is automatically segmented into modular SECTION, EXPLANATION, FORMULA (KaTeX), PRACTICE / LIST, VECTOR DIAGRAM, and Web Image cards.',
    highlights: [
      'Grab the Drag handle on any card to drop directly onto your exact board spot',
      'Click + Insert for instant board placement with vector KaTeX equations & styled tables',
    ],
  },
  {
    id: 'ai-enhance',
    badge: '1-Click Design',
    title: 'AI Enhance (Full Slide & Textbox)',
    description:
      'Transform rough board notes into classroom-ready visual slides. AI Enhance applies presentation headings, callout borders, formatted symbol tables, and zero-overlap alignment.',
    highlights: [
      'Enhance the whole board from header toolbar or click Enhance on any single textbox',
      'Strict DOM height reflow & full Ctrl+Z undo safety via CommandSystem',
    ],
  },
  {
    id: 'ask-ai',
    badge: 'Canvas Context',
    title: 'Contextual Ask AI on Board Objects',
    description:
      'Select any existing text block on the whiteboard and click the floating Ask AI pill directly above it to explain, simplify, verify, or solve live during class.',
    highlights: [
      'Instant hand-off from canvas selection to the AI Teaching Assistant panel',
      'Contextual Slide AI Toolbar: Simplify, Expand, Grammar, Add Example & Quiz Check',
    ],
  },
  {
    id: 'ai-vector-diagrams',
    badge: 'Diagram Studio',
    title: 'AI Vector Diagram & Flowchart Studio',
    description:
      'Generate editable vector diagrams inline in chat with live Preview, Code view, and Edit in Studio across multiple scientific rendering engines.',
    highlights: [
      'Mermaid.js flowcharts, Function Plots, 2D Geometry, Digital Circuits, WaveDrom & TikZ',
      'Drag rendered SVG diagrams straight onto canvas slides without pixel blur',
    ],
  },
  {
    id: 'ai-web-search',
    badge: 'Web Grounding',
    title: 'Web AI Search & Live Web Image Cards',
    description:
      'Toggle Web mode inside AI Chat to retrieve grounded web sources and matching Web Images cards you can inspect in the built-in browser or drag onto the board.',
    highlights: [
      'Flexible Models: Google Gemini, OpenAI, DeepSeek, Groq, Kimi & Local Offline Ollama',
      'Auto-detects installed Ollama local models so AI works completely offline too',
    ],
  },
];

export interface SubjectSlide {
  id: string;
  subject: string;
  badge: string;
  headline: string;
  description: string;
  image: string;
  imageAlt: string;
  tools: string[];
}

export const subjectSlides: SubjectSlide[] = [
  {
    id: 'mathematics',
    subject: 'Mathematics',
    badge: '19 Interactive Modules & Instruments',
    headline: 'Precision Geometry, 2D/3D Graphing & Calculators',
    description:
      'Equip your board with interactive classroom drafting instruments, 2D/3D coordinate planes, live function curve plotting, and 3D solid geometry models.',
    image: subjectMath,
    imageAlt: 'SmartNoteAI Subject Teaching Platform showing Mathematics tab with Scientific Calculator, Ruler, Protractor, Compass, Set Squares, and 2D/3D Graph tools',
    tools: [
      'Scientific Calculator',
      'Calibrated Ruler (cm / mm)',
      '180° Protractor',
      'Geometric Compass',
      '45° & 30°-60° Set Squares',
      'Angle Construction',
      'Cartesian Coordinate Axes (X-Y)',
      '3D Coordinate Plane (X-Y-Z)',
      'Function Plotter',
      'Calibrated Number Line',
      '3D Solids (Cube, Pyramid, Cylinder, Sphere, Cone)',
      'Formula Editor & Unit Circle',
    ],
  },
  {
    id: 'physics',
    subject: 'Physics',
    badge: 'Circuits, Optics & Mechanics Lab',
    headline: 'Interactive Circuit Builders & Vector Mechanics',
    description:
      'Construct editable series and parallel electrical circuits from standard schematic symbols and demonstrate force vectors, resultants, Free Body Diagrams, and kinematics.',
    image: subjectPhysics,
    imageAlt: 'SmartNoteAI Subject Teaching Platform showing Physics tab with Battery, Resistor, Rheostat, Capacitor, Inductor, Meters, Series/Parallel Circuits, and Force Vectors',
    tools: [
      'Battery / DC Power Supply',
      'Fixed Resistor & Rheostat',
      'Capacitor & Inductor Coil',
      'Knife Switch & Incandescent Lamp',
      'Ammeter / Voltmeter Meters',
      'Series Circuit Diagram Builder',
      'Parallel Circuit Diagram Builder',
      'Force Vector Tool',
      'Resultant Force Demonstration',
      'Free Body Diagram (FBD)',
      'Kinematic Motion Diagram',
    ],
  },
  {
    id: 'computer-science',
    subject: 'Computer Science',
    badge: 'Algorithms, Data Structures & CPU Architecture',
    headline: 'Live Tracing, Memory Pointers, Trees & Von Neumann CPU',
    description:
      'Teach programming and computer architecture visually using syntax-highlighted code blocks, pseudocode, call stacks, linked lists, trees, sorting visualizers, and F-D-E cycle diagrams.',
    image: subjectCs,
    imageAlt: 'SmartNoteAI Subject Teaching Platform showing Computer Science tab with Syntax-Highlighted Code Block, Pseudocode, Flowchart Builder, Trace Table, Call Stack, Memory Layout, Linked List, BST, Sorting, ER Diagram, and CPU Architecture',
    tools: [
      'Syntax Code Block (Py, JS, C++, Java, SQL)',
      'Standardized Pseudocode',
      'Flowchart Builder',
      'Algorithm Trace Table',
      'Call Stack Diagram',
      'Memory Layout & Pointers',
      'Linked List Diagram',
      'Binary Search Tree & Graph',
      'Sorting / Searching Visualizer',
      'Database Table & ER Diagram',
      'CPU & Von Neumann Architecture',
      'Instruction Cycle (F-D-E) & Network Topology',
    ],
  },
  {
    id: 'geography',
    subject: 'Geography',
    badge: 'Official Survey of India Integration',
    headline: 'Cartographic Maps, 1:50,000 Toposheets & 3D Earth Lab',
    description:
      'Launch official Survey of India political, physical, and outline maps alongside an interactive 1:50,000 Toposheet viewer, conventional symbols legend, and 3D Solar Globe lab.',
    image: subjectGeography,
    imageAlt: 'SmartNoteAI Subject Teaching Platform showing Geography tab with Geography Resource Centre, Official Survey of India Map, Interactive Topographical Map Viewer, Conventional Signs & Symbols Panel, Interactive 3D Earth & Globe Lab, and India Outline Map',
    tools: [
      'Geography Resource Centre',
      'Official Survey of India Map',
      'Interactive Topographical Map Viewer (1:50,000)',
      'Conventional Signs & Symbols Panel',
      'Interactive 3D Earth & Globe Lab',
      'India Outline Map (Classroom Drawing)',
    ],
  },
];

export interface AdditionalSubjectSummary {
  id: string;
  subject: string;
  tagline: string;
  tools: string[];
}

export const additionalSubjects: AdditionalSubjectSummary[] = [
  {
    id: 'chemistry',
    subject: 'Chemistry Module',
    tagline: 'Periodic elements, atomic orbitals, reaction balancing & lab glassware',
    tools: [
      'Interactive Periodic Table',
      'Element Info Card',
      'Bohr Atomic Model',
      'Chemical Equation Balancer',
      'Beaker, Flask, Burner & Test Tube Rack',
      'Acid-Base Titration & Combustion Workspaces',
    ],
  },
  {
    id: 'digital-logic',
    subject: 'Digital Logic & Flowcharts',
    tagline: 'Boolean gates, minimization maps, sequential counters & ISO flowcharts',
    tools: [
      'AND, OR, NOT, NAND, NOR, XOR & XNOR Gates',
      'Truth Table Generator & Karnaugh Map (K-Map)',
      'Multiplexer (N:1 MUX) & Half/Full Adders',
      'Flip-Flops (D, JK, SR, T) & 4-Bit Binary Counter',
      'ISO Flowchart Blocks (Terminator, Process, Decision, Loop)',
    ],
  },
  {
    id: 'general-teaching',
    subject: 'Common & General Teaching',
    tagline: 'Cross-curriculum mind maps, comparisons & classroom facilitation',
    tools: [
      'Mind Map & Concept Map Builders',
      'Animated & Interactive Timelines',
      'Hierarchy & 5-Step Process Flow Charts',
      'Venn Diagram & Pros vs. Cons Comparison Board',
      'Interactive Q&A Card & Classroom Seating Diagram',
    ],
  },
];

export interface GeographyFeatureCard {
  id: string;
  tag: string;
  title: string;
  description: string;
  items: string[];
}

export const geographyShowcaseImage = geographyResourceCentre;

export const geographyFeatures: GeographyFeatureCard[] = [
  {
    id: 'india-official-maps',
    tag: '28 States & 8 UTs',
    title: 'Official Survey of India Political, State & District Maps',
    description:
      'Built around verified Survey of India territorial boundaries including complete Jammu & Kashmir and Ladakh specifications, updated for the 2026 Political Edition.',
    items: [
      'Official Political Map of India (Latest 2026 Edition)',
      'Dedicated State Maps of India directory tab (28 States & 8 UTs)',
      'India Administrative Districts Atlas covering 780+ districts',
      'Official Physical Map, Physiographic Divisions (GSI), CWC River Basins & Railways Map',
    ],
  },
  {
    id: 'toposheets',
    tag: '1:50,000 OSM Series',
    title: 'Interactive Topographical Maps & Symbols Lab',
    description:
      'Explore authentic Survey of India Open Series Toposheets with zoom, pan, contour overlays, National Grid demonstrators, and conventional signs reference panels.',
    items: [
      'Open Series Sheets (45D/7 Mount Abu, 45D/10, 45F/3, 53B/7, 53E/16, 63K/12, 64P/13, 56D/11)',
      '20m contour intervals & National Topographical Grid Reference (4-figure & 6-figure GR)',
      'Scale & Measurement Lab (RF 1:50,000, 2 cm = 1 km, bearings & area in km²/hectares)',
      'Interactive Conventional Signs & Symbols Panel for CBSE/ICSE curriculum prep',
    ],
  },
  {
    id: 'world-oceanography',
    tag: 'Global Reference',
    title: 'World Political Atlas, Major Rivers & Oceanography',
    description:
      'Teach global geography and hydrography with authoritative Survey of India World Political editions, global river systems, and oceanic circulation patterns.',
    items: [
      'World Political Map (Official Survey of India Edition)',
      'Survey of India World Map with Major Rivers (Amazon, Nile, Ganga, Yangtze & more)',
      'Oceanography layers: warm/cold currents, thermohaline circulation & 5 subtropical gyres',
      'Global Latitude, Longitude & 24 Time Zones highlighting IST (82.5° E)',
    ],
  },
  {
    id: 'globe-3d',
    tag: 'Orthographic 3D Engine',
    title: 'Interactive 3D Earth & Globe Lab',
    description:
      'Rotate an orthographic 3D spherical globe or unroll to a flat map projection to demonstrate Earth’s rotation, seasons, solstices, equinoxes, and solar illumination.',
    items: [
      'Accurate 23.44° (23.5°) axial tilt & live Solar Day/Night Terminator curve',
      'Diurnal rotation & seasonal revolution animation presets (Solstices & Equinoxes)',
      'Toggle Tropics of Cancer & Capricorn, Polar Circles, Prime Meridian & Graticule',
      'Direct insertion onto the SmartNoteAI whiteboard as persistent objects',
    ],
  },
  {
    id: 'gis-atlas',
    tag: 'Remote Sensing & GIS',
    title: 'GIS Thematic Lab & Geography Atlas Explorer',
    description:
      'Layer Indian and global satellite datasets, measure great-circle distances, and inspect exact coordinates in degrees-minutes-seconds directly inside the modal.',
    items: [
      'ISRO / NRSC Bhuvan satellite, LULC, CartoDEM elevation, WRIS drainage & NDEM layers',
      'Dual-Map Swipe & Side-by-Side Comparison modes with layer opacity sliders',
      'Atlas Explorer with Haversine geodesic distance calculator (km, miles & bearing)',
      'Click any resource to insert high-resolution map sheets onto lesson slides',
    ],
  },
  {
    id: 'outline-offline',
    tag: 'Offline Maps Ready',
    title: 'Classroom Outline Worksheets & One-Click Offline Sync',
    description:
      'Keep every official map cached for zero-internet classrooms and insert blank Survey of India outline maps for live map-pointing exercises and student quizzes.',
    items: [
      'Classroom Outline Maps: India Blank Outline, Major Rivers, State Boundaries & Capitals',
      'Update All Maps (One-Click) sync with verified government source references (surveyofindia.gov.in)',
      'Multi-facet filter by Class Level (Primary to Higher Ed), Category, Favorites & Recents',
      'Light & Dark map studio themes engineered for smartboards and projectors',
    ],
  },
];
