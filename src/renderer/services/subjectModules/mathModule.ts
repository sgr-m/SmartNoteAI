/**
 * Mathematics Teaching Module (Section 16.1)
 * Instruments, formulas, coordinate axes, function plotter, geometry, number lines
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, createFormula, executeAddObject, executeAddMultipleObjects } from './commonHelpers';
import { CanvasObject, ShapeObject } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { compileMathFunction, evaluateMathFunction, type CompiledMathFunction } from './mathFunctionParser';

export { compileMathFunction, evaluateMathFunction, type CompiledMathFunction };

/**
 * Built-in Mathematics formula collection
 */
export const MATH_FORMULAS = [
  { name: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', desc: 'Standard roots solver' },
  { name: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2', desc: 'Right triangle relationship' },
  { name: 'Circle Area & Circumference', latex: 'A = \\pi r^2 \\quad , \\quad C = 2\\pi r', desc: 'Area and circumference' },
  { name: 'Trigonometric Pythagorean Identity', latex: '\\sin^2\\theta + \\cos^2\\theta = 1', desc: 'Fundamental trig identity' },
  { name: 'Calculus Derivative Power Rule', latex: '\\frac{d}{dx}\\left(x^n\\right) = n x^{n-1}', desc: 'Basic derivative rule' },
  { name: 'Calculus Integral Fundamental Theorem', latex: '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)', desc: 'FTC Part 2' },
  { name: "Euler's Identity", latex: 'e^{i\\pi} + 1 = 0', desc: 'Most beautiful equation in math' },
  { name: 'Binomial Theorem', latex: '(x+y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k', desc: 'Polynomial expansion' },
  { name: 'Standard Normal Distribution', latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}', desc: 'Gaussian probability curve' },
  { name: 'Taylor Series Expansion', latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x - a)^n', desc: 'Infinite series expansion' },
];

/**
 * Tools in Mathematics Module
 */
const mathTools: SubjectTool[] = [
  // 1. Scientific Calculator
  {
    id: 'math-scientific-calc',
    subjectId: 'mathematics',
    name: 'Scientific Calculator',
    category: 'Calculators',
    icon: '🧮',
    description: 'Full-featured scientific calculator with trig, powers, logs, and canvas export',
    badge: 'Interactive',
    tags: ['calc', 'scientific', 'trig', 'math', 'evaluate'],
    interactiveModal: 'calculator',
    execute: (context) => {
      // Trigger modal or default quick insertion
      const formula = createFormula('3.14159', 300, 250);
      executeAddObject(context, formula, 'Insert Scientific Calculator Result');
    },
  },

  // 2. Calibrated Smart Ruler
  {
    id: 'math-ruler',
    subjectId: 'mathematics',
    name: 'Calibrated Ruler (cm / mm)',
    category: 'Instruments',
    icon: '📏',
    description: 'Precision classroom ruler with millimeter ticks and snapping edge',
    badge: 'Instrument',
    tags: ['ruler', 'measure', 'length', 'metric'],
    execute: (context, options) => {
      const length = options?.width || 480;
      const ruler = createShape('ruler', 200, 220, length, 76, {
        fillColor: 'rgba(248, 250, 252, 0.90)',
        fillOpacity: 0.9,
        strokeColor: '#0284c7',
        strokeWidth: 1.5,
      });
      executeAddObject(context, ruler, 'Insert Calibrated Classroom Ruler');
    },
  },

  // 3. 180° Protractor
  {
    id: 'math-protractor',
    subjectId: 'mathematics',
    name: '180° Protractor',
    category: 'Instruments',
    icon: '🧭',
    description: 'Classroom protractor with dual 0°-180° scale and center crosshairs',
    badge: 'Instrument',
    tags: ['protractor', 'angle', 'degrees', 'geometry'],
    execute: (context) => {
      const protractor = createShape('protractor', 240, 180, 440, 230, {
        fillColor: 'rgba(224, 242, 254, 0.75)',
        strokeColor: '#0284c7',
        strokeWidth: 2,
      });
      executeAddObject(context, protractor, 'Insert 180° Protractor');
    },
  },

  // 4. Geometric Compass
  {
    id: 'math-compass',
    subjectId: 'mathematics',
    name: 'Geometric Compass',
    category: 'Instruments',
    icon: '📍',
    description: 'Precision dual-leg compass with needle pivot, pencil clamp & arc guide',
    badge: 'Instrument',
    tags: ['compass', 'circle', 'arc', 'radius'],
    execute: (context) => {
      const compass = createShape('compass', 260, 160, 360, 280, {
        strokeColor: '#0284c7',
        strokeWidth: 2,
      });
      executeAddObject(context, compass, 'Insert Geometric Compass');
    },
  },

  // 5. 45°-45°-90° Set Square
  {
    id: 'math-set-square-45',
    subjectId: 'mathematics',
    name: '45° Set Square',
    category: 'Instruments',
    icon: '📐',
    description: 'Isosceles right triangle set square with angle markers and centimeter scale',
    badge: 'Instrument',
    tags: ['set square', 'triangle', '45 degree', 'geometry'],
    execute: (context) => {
      const setSquare = createShape('setSquare45', 220, 180, 340, 340, {
        fillColor: 'rgba(240, 249, 255, 0.82)',
        strokeColor: '#0284c7',
        strokeWidth: 2,
        label: '45°-45°-90° Set Square',
      });
      executeAddObject(context, setSquare, 'Insert 45° Set Square');
    },
  },

  // 6. 30°-60°-90° Set Square
  {
    id: 'math-set-square-30',
    subjectId: 'mathematics',
    name: '30°-60° Set Square',
    category: 'Instruments',
    icon: '📐',
    description: 'Standard 30°-60°-90° drafting set square with metric graduations',
    badge: 'Instrument',
    tags: ['set square', 'triangle', '30 60 90', 'drafting'],
    execute: (context) => {
      const setSquare = createShape('setSquare30', 220, 160, 260, 420, {
        fillColor: 'rgba(240, 249, 255, 0.82)',
        strokeColor: '#0284c7',
        strokeWidth: 2,
        label: '30°-60°-90° Set Square',
      });
      executeAddObject(context, setSquare, 'Insert 30°-60° Set Square');
    },
  },

  // 7. Angle Measurement & Construction
  {
    id: 'math-angle-construction',
    subjectId: 'mathematics',
    name: 'Angle Construction',
    category: 'Geometry',
    icon: '∡',
    description: 'Construct custom angle with vertex, ray arms, degree arc, and θ annotation',
    badge: 'Interactive',
    tags: ['angle', 'degrees', 'arc', 'vertex', 'theta'],
    interactiveModal: 'angleConstruction',
    execute: (context, options) => {
      const degrees = options?.angle || 60;
      const angleObj = createShape('angleMeasurement', 240, 200, 320, 240, {
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        params: { angle: degrees, label: `${degrees}°` },
      });
      executeAddObject(context, angleObj, `Insert ${degrees}° Angle Construction`);
    },
  },

  // 8. Cartesian Coordinate Plane
  {
    id: 'math-cartesian-axes',
    subjectId: 'mathematics',
    name: 'Cartesian Coordinate Axes (X-Y)',
    category: 'Graphing',
    icon: '📈',
    description: 'Configurable axes with numbered ticks (-5 to +5), arrows, and origin (0,0)',
    badge: 'Graphing',
    tags: ['cartesian', 'axes', 'grid', 'coordinates', 'origin'],
    interactiveModal: 'cartesianPlane',
    execute: (context, options) => {
      const axes = createShape('cartesianAxes', 220, 120, 520, 520, {
        fillColor: 'rgba(15, 23, 42, 0.92)',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        params: {
          xMin: options?.xMin ?? -5,
          xMax: options?.xMax ?? 5,
          yMin: options?.yMin ?? -5,
          yMax: options?.yMax ?? 5,
          step: options?.step ?? 1,
          showGrid: options?.showGrid ?? true,
        },
      });
      executeAddObject(context, axes, 'Insert Cartesian Coordinate Axes');
    },
  },

  // 9. Function Plotter
  {
    id: 'math-function-plotter',
    subjectId: 'mathematics',
    name: 'Function Plotter',
    category: 'Graphing',
    icon: '📉',
    description: 'Plot continuous mathematical curves: sin(x), cos(x), x^2, polynomial, exponential',
    badge: 'Graphing',
    tags: ['function', 'plot', 'curve', 'graph', 'sin', 'polynomial'],
    interactiveModal: 'functionPlotter',
    execute: (context, options) => {
      const expression = options?.expression || 'sin(x)';
      const plotObj = createShape('functionPlot', 220, 120, 520, 400, {
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        params: {
          expression,
          xMin: options?.xMin ?? -10,
          xMax: options?.xMax ?? 10,
          yMin: options?.yMin ?? -2,
          yMax: options?.yMax ?? 2,
        },
        label: `y = ${expression}`,
      });
      executeAddObject(context, plotObj, `Plot Function y = ${expression}`);
    },
  },

  // 10. Number Line
  {
    id: 'math-number-line',
    subjectId: 'mathematics',
    name: 'Calibrated Number Line',
    category: 'Instruments',
    icon: '↔️',
    description: 'Horizontal number line with configurable range, ticks, arrows, and highlight points',
    badge: 'Instrument',
    tags: ['number line', 'integers', 'interval', 'fractions'],
    interactiveModal: 'numberLine',
    execute: (context, options) => {
      const min = options?.min ?? -5;
      const max = options?.max ?? 5;
      const step = options?.step ?? 1;
      const numberLine = createShape('numberLine', 180, 240, 600, 100, {
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        params: { min, max, step, highlight: options?.highlight ?? [0] },
      });
      executeAddObject(context, numberLine, `Insert Number Line [${min}..${max}]`);
    },
  },

  // 11. 3D Geometric Solid: Cube
  {
    id: 'math-3d-cube',
    subjectId: 'mathematics',
    name: '3D Geometry: Cube',
    category: '3D Geometry',
    icon: '🧊',
    description: '3D wireframe cube with X-Y-Z rotation, 3D translation, axes, and vertex labels',
    badge: '3D Solid',
    tags: ['cube', '3d', 'solid', 'isometric', 'volume', 'axis', 'rotation'],
    interactiveModal: 'geometry3D',
    execute: (context) => {
      const cube = createShape('geometry3D', 260, 180, 320, 320, {
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(56, 189, 248, 0.15)',
        params: {
          solidType: 'cube',
          rotX: 25,
          rotY: 35,
          rotZ: 0,
          posX: 0,
          posY: 0,
          posZ: 0,
          showAxes: true,
          showVertexLabels: false,
          label: 'Cube (s³)',
        },
      });
      executeAddObject(context, cube, 'Insert 3D Cube');
    },
  },

  // 12. 3D Geometric Solid: Square Pyramid
  {
    id: 'math-3d-pyramid',
    subjectId: 'mathematics',
    name: '3D Geometry: Pyramid',
    category: '3D Geometry',
    icon: '🔺',
    description: '3D square pyramid with apex vertex, X-Y-Z rotation, axes, and vertex markings',
    badge: '3D Solid',
    tags: ['pyramid', '3d', 'solid', 'apex', 'volume', 'axis', 'rotation'],
    interactiveModal: 'geometry3D',
    execute: (context) => {
      const pyramid = createShape('geometry3D', 260, 180, 320, 320, {
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(56, 189, 248, 0.15)',
        params: {
          solidType: 'pyramid',
          rotX: 25,
          rotY: 35,
          rotZ: 0,
          posX: 0,
          posY: 0,
          posZ: 0,
          showAxes: true,
          showVertexLabels: false,
          label: 'Square Pyramid',
        },
      });
      executeAddObject(context, pyramid, 'Insert 3D Pyramid');
    },
  },

  // 13. 3D Geometric Solid: Cylinder
  {
    id: 'math-3d-cylinder',
    subjectId: 'mathematics',
    name: '3D Geometry: Cylinder',
    category: '3D Geometry',
    icon: '🛢️',
    description: '3D cylinder with circular bases, X-Y-Z rotation, 3D axes, and depth projection',
    badge: '3D Solid',
    tags: ['cylinder', '3d', 'volume', 'radius', 'height', 'axis'],
    interactiveModal: 'geometry3D',
    execute: (context) => {
      const cylinder = createShape('geometry3D', 270, 170, 320, 320, {
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(56, 189, 248, 0.15)',
        params: {
          solidType: 'cylinder',
          rotX: 25,
          rotY: 35,
          rotZ: 0,
          posX: 0,
          posY: 0,
          posZ: 0,
          showAxes: true,
          showVertexLabels: false,
          label: 'Cylinder (V = πr²h)',
        },
      });
      executeAddObject(context, cylinder, 'Insert 3D Cylinder');
    },
  },

  // 14. 3D Geometric Solid: Sphere
  {
    id: 'math-3d-sphere',
    subjectId: 'mathematics',
    name: '3D Geometry: Sphere',
    category: '3D Geometry',
    icon: '🔮',
    description: '3D sphere with latitude and meridian rings, X-Y-Z rotation, and 3D coordinate axes',
    badge: '3D Solid',
    tags: ['sphere', '3d', 'volume', 'radius', 'axis'],
    interactiveModal: 'geometry3D',
    execute: (context) => {
      const sphere = createShape('geometry3D', 270, 170, 320, 320, {
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(56, 189, 248, 0.15)',
        params: {
          solidType: 'sphere',
          rotX: 25,
          rotY: 35,
          rotZ: 0,
          posX: 0,
          posY: 0,
          posZ: 0,
          showAxes: true,
          showVertexLabels: false,
          label: 'Sphere (V = 4/3 πr³)',
        },
      });
      executeAddObject(context, sphere, 'Insert 3D Sphere');
    },
  },

  // 15. 3D Geometric Solid: Cone
  {
    id: 'math-3d-cone',
    subjectId: 'mathematics',
    name: '3D Geometry: Cone',
    category: '3D Geometry',
    icon: '▲',
    description: 'Right circular cone with apex, base ellipse, X-Y-Z axis rotation, and 3D axes',
    badge: '3D Solid',
    tags: ['cone', '3d', 'apex', 'slant height', 'axis'],
    interactiveModal: 'geometry3D',
    execute: (context) => {
      const cone = createShape('geometry3D', 270, 170, 320, 320, {
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(56, 189, 248, 0.15)',
        params: {
          solidType: 'cone',
          rotX: 25,
          rotY: 35,
          rotZ: 0,
          posX: 0,
          posY: 0,
          posZ: 0,
          showAxes: true,
          showVertexLabels: false,
          label: 'Cone (V = 1/3 πr²h)',
        },
      });
      executeAddObject(context, cone, 'Insert 3D Cone');
    },
  },

  // 15. Formula Editor & KaTeX Insertion
  {
    id: 'math-formula-editor',
    subjectId: 'mathematics',
    name: 'Formula & Equation Editor',
    category: 'Formulas',
    icon: '∑',
    description: 'Interactive LaTeX formula editor with instant math palette preview',
    badge: 'Formula',
    tags: ['formula', 'latex', 'equation', 'symbols', 'palette'],
    interactiveModal: 'formulaEditor',
    execute: (context, options) => {
      const latex = options?.latex || 'f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi) e^{2\\pi i \\xi x} d\\xi';
      const formulaObj = createFormula(latex, 260, 220);
      executeAddObject(context, formulaObj, 'Insert LaTeX Equation');
    },
  },
];

/**
 * Templates for Mathematics
 */
const mathTemplates: SubjectTemplate[] = [
  {
    id: 'math-tmpl-analytic-geom',
    subjectId: 'mathematics',
    name: 'Analytic Geometry Board',
    category: 'Lesson Templates',
    icon: '📐',
    description: 'Complete board with Cartesian plane, linear equation formula, and reference triangle',
    createObjects: (origin) => {
      const axes = createShape('cartesianAxes', origin.x, origin.y, 480, 480);
      const formula = createFormula('y = mx + c', origin.x + 510, origin.y + 40);
      const formula2 = createFormula('m = \\frac{y_2 - y_1}{x_2 - x_1}', origin.x + 510, origin.y + 120);
      return [axes, formula, formula2];
    },
  },
  {
    id: 'math-tmpl-trig-unit-circle',
    subjectId: 'mathematics',
    name: 'Trigonometry & Unit Circle',
    category: 'Lesson Templates',
    icon: '⭕',
    description: 'Unit circle with primary angles (30°, 45°, 60°), sin/cos coordinates and formulas',
    createObjects: (origin) => {
      const axes = createShape('cartesianAxes', origin.x, origin.y, 460, 460);
      const circle = createShape('circle', origin.x + 70, origin.y + 70, 320, 320, {
        strokeColor: '#f59e0b',
        strokeWidth: 2,
      });
      const formula = createFormula('\\cos^2\\theta + \\sin^2\\theta = 1', origin.x + 490, origin.y + 60);
      return [axes, circle, formula];
    },
  },
];

export const MathematicsModule: SubjectModule = {
  id: 'mathematics',
  name: 'Mathematics',
  icon: '📐',
  description: 'Scientific calculator, instruments, axes, function plotting, 2D/3D geometry',
  tools: mathTools,
  templates: mathTemplates,
};
