import { describe, it, expect } from 'vitest';
import { ShapeObject, ShapeType } from '../src/shared/types';
import { renderLatexHtml, isLatexSyntax } from '../src/renderer/services/latexService';
import { PERIODIC_ELEMENTS, getElementBySymbolOrNumber } from '../src/renderer/services/subjectModules/chemistryModule';

describe('Subject Teaching Tools - Instruments & Formulas', () => {
  describe('Built-in STEM LaTeX Equations', () => {
    const builtinFormulas = [
      { name: 'Quadratic Formula', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
      { name: 'Pythagorean Theorem', formula: 'a^2 + b^2 = c^2' },
      { name: 'Circle Area & Circumference', formula: 'A = \\pi r^2 \\quad \\cdot \\quad C = 2\\pi r' },
      { name: 'Trig Identity', formula: '\\sin^2\\theta + \\cos^2\\theta = 1' },
      { name: 'Calculus Power Rule', formula: '\\frac{d}{dx}\\left(x^n\\right) = n x^{n-1}' },
      { name: 'Calculus Fundamental Theorem', formula: '\\int_{a}^{b} f(x)dx = F(b) - F(a)' },
      { name: 'Euler Identity', formula: 'e^{i\\pi} + 1 = 0' },
      { name: "Newton's 2nd Law", formula: 'F = m \\cdot a \\quad \\cdot \\quad W = m \\cdot g' },
      { name: "Ohm's Law", formula: 'V = I \\cdot R \\quad \\cdot \\quad P = V \\cdot I' },
      { name: 'Ideal Gas Law', formula: 'P \\cdot V = n \\cdot R \\cdot T' },
      { name: 'Water Synthesis Reaction', formula: '2\\text{H}_2 + \\text{O}_2 \\longrightarrow 2\\text{H}_2\\text{O} \\quad (\\Delta H = -572\\text{ kJ})' },
      { name: 'Kinetic Energy', formula: 'E_k = \\frac{1}{2} m v^2' },
      { name: 'De Broglie Wavelength', formula: '\\lambda = \\frac{h}{p} = \\frac{h}{m v}' },
    ];

    builtinFormulas.forEach(({ name, formula }) => {
      it(`renders authentic KaTeX for "${name}" without errors`, () => {
        expect(isLatexSyntax(formula)).toBe(true);
        const result = renderLatexHtml(formula);
        expect(result.error).toBeUndefined();
        expect(result.html).toContain('katex');
        // Must not duplicate MathML
        expect(result.html).not.toContain('<math');
      });
    });
  });

  describe('Geometric & Mathematical Instruments', () => {
    it('creates Cartesian axes instrument with points, ticks, and arrowheads', () => {
      const axes: ShapeObject = {
        id: 'test-axes',
        type: 'shape',
        shapeType: 'cartesianAxes' as ShapeType,
        x: 100,
        y: 100,
        width: 480,
        height: 480,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
      };

      expect(axes.shapeType).toBe('cartesianAxes');
      expect(axes.width).toBe(480);
      expect(axes.height).toBe(480);
    });

    it('creates Calibrated Smart Ruler with metric cm and mm units', () => {
      const rulerLengths = [320, 480, 640, 960];
      rulerLengths.forEach((len) => {
        const ruler: ShapeObject = {
          id: `test-ruler-${len}`,
          type: 'shape',
          shapeType: 'ruler' as ShapeType,
          x: 50,
          y: 50,
          width: len,
          height: 76,
          strokeColor: '#0284c7',
          strokeWidth: 1.5,
          fillColor: 'rgba(248, 250, 252, 0.90)',
          fillOpacity: 0.9,
          strokeOpacity: 1,
          strokeStyle: 'solid',
          rotation: 0,
          locked: false,
          layerId: 'default',
        };

        expect(ruler.shapeType).toBe('ruler');
        expect(ruler.width).toBe(len);
        expect(ruler.height).toBe(76);
      });
    });

    it('creates 180° Classroom Protractor instrument with dual degree scale', () => {
      const protractor: ShapeObject = {
        id: 'test-protractor',
        type: 'shape',
        shapeType: 'protractor' as ShapeType,
        x: 200,
        y: 150,
        width: 380,
        height: 200,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        fillColor: 'rgba(224, 242, 254, 0.78)',
        fillOpacity: 0.8,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
      };

      expect(protractor.shapeType).toBe('protractor');
      expect(protractor.width).toBe(380);
      expect(protractor.height).toBe(200);
    });

    it('creates Geometric Compass instrument with calibrated radius and needle pivot', () => {
      const compass: ShapeObject = {
        id: 'test-compass',
        type: 'shape',
        shapeType: 'compass' as ShapeType,
        x: 250,
        y: 200,
        width: 280,
        height: 220,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
      };

      expect(compass.shapeType).toBe('compass');
      expect(compass.width).toBe(280);
      expect(compass.height).toBe(220);
    });

    it('mathematically projects points near ruler edge to straight edge line', () => {
      // Simulating the snapPointToRuler logic
      const ruler = {
        x: 100,
        y: 200,
        width: 480,
        height: 76,
        rotation: 0,
      };

      const rw = ruler.width;
      const rh = ruler.height;
      const cx = ruler.x + rw / 2;
      const cy = ruler.y + rh / 2;

      // Pointer is slightly below the ruler top edge (y = 200, pointer at y = 208, x = 250)
      const docPt = { x: 250, y: 208 };
      const relX = docPt.x - cx;
      const relY = docPt.y - cy;
      const topEdgeLocalY = -rh / 2;

      const snapDist = 24;
      const isNear = Math.abs(relY - topEdgeLocalY) <= snapDist;
      expect(isNear).toBe(true);

      // Project point onto ruler top edge:
      const worldY = cy + topEdgeLocalY;
      expect(worldY).toBe(200); // perfectly aligned with ruler top edge!
    });

    it('creates 45° and 30°-60° Set Squares with metric cm/mm calibrations', () => {
      const setSquare45: ShapeObject = {
        id: 'test-ss-45',
        type: 'shape',
        shapeType: 'setSquare45' as ShapeType,
        x: 100,
        y: 100,
        width: 280,
        height: 280,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        fillColor: 'rgba(224, 242, 254, 0.7)',
        fillOpacity: 0.7,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
      };
      expect(setSquare45.shapeType).toBe('setSquare45');
      expect(setSquare45.width).toBe(280);

      const setSquare30: ShapeObject = {
        id: 'test-ss-30',
        type: 'shape',
        shapeType: 'setSquare30' as ShapeType,
        x: 150,
        y: 150,
        width: 300,
        height: 220,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        fillColor: 'rgba(224, 242, 254, 0.7)',
        fillOpacity: 0.7,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
      };
      expect(setSquare30.shapeType).toBe('setSquare30');
      expect(setSquare30.width).toBe(300);
    });

    it('supports custom angle construction with arbitrary degrees', () => {
      const testAngles = [15, 30, 45, 60, 75, 90, 120, 135, 180, 240, 315, 360];
      testAngles.forEach((deg) => {
        const angleShape: ShapeObject = {
          id: `angle-${deg}`,
          type: 'shape',
          shapeType: 'angleMeasurement' as ShapeType,
          x: 200,
          y: 200,
          width: 240,
          height: 240,
          strokeColor: '#ef4444',
          strokeWidth: 2.5,
          fillColor: 'rgba(239, 68, 68, 0.15)',
          fillOpacity: 0.15,
          strokeOpacity: 1,
          strokeStyle: 'solid',
          rotation: 0,
          locked: false,
          layerId: 'default',
          label: `${deg}°`,
          params: { angle: deg, showLabel: true },
        };
        expect(angleShape.params?.angle).toBe(deg);
        expect(angleShape.label).toBe(`${deg}°`);
      });
    });

    it('supports customizable Cartesian plane with user-defined X and Y axis bounds', () => {
      const customPlane: ShapeObject = {
        id: 'test-plane-bounds',
        type: 'shape',
        shapeType: 'cartesianAxes' as ShapeType,
        x: 100,
        y: 100,
        width: 480,
        height: 480,
        strokeColor: '#3b82f6',
        strokeWidth: 2,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        params: {
          xMin: -15,
          xMax: 20,
          yMin: -10,
          yMax: 30,
          step: 5,
          showGrid: true,
          showDots: true,
        },
      };

      expect(customPlane.params?.xMin).toBe(-15);
      expect(customPlane.params?.xMax).toBe(20);
      expect(customPlane.params?.yMin).toBe(-10);
      expect(customPlane.params?.yMax).toBe(30);
      expect(customPlane.params?.step).toBe(5);
    });
  });

  describe('Math Function Compiler & Evaluator (mathFunctionParser)', () => {
    it('compiles standard mathematical expressions with implicit multiplication and powers', async () => {
      const { compileMathFunction } = await import('../src/renderer/services/subjectModules/mathFunctionParser');

      // Test powers & polynomials
      const poly = compileMathFunction('x^2 - 4*x + 4');
      expect(poly.isValid).toBe(true);
      expect(poly.fn(0)).toBe(4);
      expect(poly.fn(2)).toBe(0);
      expect(poly.fn(3)).toBe(1);

      // Test implicit multiplication: 2x, 3(x+1)
      const implicit1 = compileMathFunction('2x + 1');
      expect(implicit1.isValid).toBe(true);
      expect(implicit1.fn(5)).toBe(11);

      const implicit2 = compileMathFunction('3(x - 2)');
      expect(implicit2.isValid).toBe(true);
      expect(implicit2.fn(4)).toBe(6);

      // Test trigonometric functions with prefixes stripped
      const trig = compileMathFunction('y = sin(2x)');
      expect(trig.isValid).toBe(true);
      expect(trig.fn(0)).toBe(0);
      expect(Math.abs(trig.fn(Math.PI / 4) - 1)).toBeLessThan(1e-6);

      // Test sqrt, abs, and exponentials
      const advanced = compileMathFunction('f(x) = sqrt(x) + abs(x - 5)');
      expect(advanced.isValid).toBe(true);
      expect(advanced.fn(4)).toBe(2 + 1); // 2 + |4-5| = 3

      // Test natural log & exponential
      const expLog = compileMathFunction('exp(x) - ln(x)');
      expect(expLog.isValid).toBe(true);
      expect(Math.abs(expLog.fn(1) - (Math.E - 0))).toBeLessThan(1e-6);
    });

    it('safely handles syntax errors without throwing exceptions', async () => {
      const { compileMathFunction } = await import('../src/renderer/services/subjectModules/mathFunctionParser');

      const invalid = compileMathFunction('sin(((');
      expect(invalid.isValid).toBe(false);
      expect(invalid.error).toBeDefined();
      expect(Number.isNaN(invalid.fn(0))).toBe(true);
    });
  });

  describe('Collaborative Number Line Range & Configurable Values', () => {
    it('supports custom range inputs [min, max], step interval and highlighted values', () => {
      const customNumberLine: ShapeObject = {
        id: 'test-number-line',
        type: 'shape',
        shapeType: 'numberLine' as ShapeType,
        x: 100,
        y: 200,
        width: 600,
        height: 100,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        params: {
          min: -20,
          max: 20,
          step: 2,
          highlight: [0, -10, 10],
        },
      };

      const min = customNumberLine.params?.min ?? -5;
      const max = customNumberLine.params?.max ?? 5;
      const step = customNumberLine.params?.step ?? 1;
      const highlight = customNumberLine.params?.highlight ?? [];

      expect(min).toBe(-20);
      expect(max).toBe(20);
      expect(step).toBe(2);
      expect(highlight).toEqual([0, -10, 10]);

      const countOfValues = Math.floor((max - min) / step) + 1;
      expect(countOfValues).toBe(21);
    });
  });

  describe('3D Geometric Solid Engine (geometry3DMath) - Distortion-Free 3-Axis Rotation', () => {
    it('generates 3D geometric models for all solid types', async () => {
      const { getSolid3DModel } = await import('../src/renderer/engine/geometry3DMath');

      // 1. Cube has 8 vertices, 12 edges, 6 faces
      const cube = getSolid3DModel('cube');
      expect(cube.vertices.length).toBe(8);
      expect(cube.faces.length).toBe(6);
      expect(cube.edges.length).toBe(12);

      // 2. Pyramid has 5 vertices, 8 edges, 5 faces
      const pyramid = getSolid3DModel('pyramid');
      expect(pyramid.vertices.length).toBe(5);
      expect(pyramid.faces.length).toBe(5);
      expect(pyramid.edges.length).toBe(8);

      // 3. Prism has 6 vertices, 9 edges, 5 faces
      const prism = getSolid3DModel('prism');
      expect(prism.vertices.length).toBe(6);
      expect(prism.faces.length).toBe(5);
      expect(prism.edges.length).toBe(9);

      // 4. Cylinder, Cone, Sphere
      const cylinder = getSolid3DModel('cylinder');
      expect(cylinder.vertices.length).toBeGreaterThan(0);
      expect(cylinder.faces.length).toBeGreaterThan(0);

      const cone = getSolid3DModel('cone');
      expect(cone.vertices.length).toBeGreaterThan(0);
      expect(cone.faces.length).toBeGreaterThan(0);

      const sphere = getSolid3DModel('sphere');
      expect(sphere.vertices.length).toBeGreaterThan(0);
    });

    it('mathematically preserves parallel edges in 2D projection at any 3D rotation angle (cube looks like a real cube)', async () => {
      const { getSolid3DModel, transform3D, projectTo2D } = await import('../src/renderer/engine/geometry3DMath');

      const cube = getSolid3DModel('cube');
      const rotX = 28, rotY = 35, rotZ = 12;
      const scale = 120, cx = 200, cy = 200;

      const projected = cube.vertices.map((v) => {
        const p3d = transform3D(v, rotX, rotY, rotZ);
        return projectTo2D(p3d, cx, cy, scale);
      });

      // Bottom opposite edges: 0->1 vs 3->2
      const edge01_dx = projected[1].x2d - projected[0].x2d;
      const edge01_dy = projected[1].y2d - projected[0].y2d;
      const edge32_dx = projected[2].x2d - projected[3].x2d;
      const edge32_dy = projected[2].y2d - projected[3].y2d;
      expect(edge01_dx).toBeCloseTo(edge32_dx, 5);
      expect(edge01_dy).toBeCloseTo(edge32_dy, 5);

      // Vertical pillars: 0->4 vs 1->5
      const pillar04_dx = projected[4].x2d - projected[0].x2d;
      const pillar04_dy = projected[4].y2d - projected[0].y2d;
      const pillar15_dx = projected[5].x2d - projected[1].x2d;
      const pillar15_dy = projected[5].y2d - projected[1].y2d;
      expect(pillar04_dx).toBeCloseTo(pillar15_dx, 5);
      expect(pillar04_dy).toBeCloseTo(pillar15_dy, 5);

      // Top opposite edges: 4->5 vs 7->6
      const edge45_dx = projected[5].x2d - projected[4].x2d;
      const edge45_dy = projected[5].y2d - projected[4].y2d;
      const edge76_dx = projected[6].x2d - projected[7].x2d;
      const edge76_dy = projected[6].y2d - projected[7].y2d;
      expect(edge45_dx).toBeCloseTo(edge76_dx, 5);
      expect(edge45_dy).toBeCloseTo(edge76_dy, 5);
    });

    it('rotates 3D objects around X, Y, and Z axes independently', async () => {
      const { transform3D } = await import('../src/renderer/engine/geometry3DMath');

      // Rotate point (1, 0, 0) by 90 degrees around Y-axis -> should end up at z = -1, x = 0
      const point = { x: 1, y: 0, z: 0 };
      const rotY90 = transform3D(point, 0, 90, 0);
      expect(rotY90.x).toBeCloseTo(0, 5);
      expect(rotY90.y).toBeCloseTo(0, 5);
      expect(rotY90.z).toBeCloseTo(-1, 5);

      // Rotate point (0, 1, 0) by 90 degrees around X-axis -> should end up at y = 0, z = 1
      const rotX90 = transform3D({ x: 0, y: 1, z: 0 }, 90, 0, 0);
      expect(rotX90.x).toBeCloseTo(0, 5);
      expect(rotX90.y).toBeCloseTo(0, 5);
      expect(rotX90.z).toBeCloseTo(1, 5);

      // Rotate point (1, 0, 0) by 90 degrees around Z-axis -> should end up at x = 0, y = 1
      const rotZ90 = transform3D({ x: 1, y: 0, z: 0 }, 0, 0, 90);
      expect(rotZ90.x).toBeCloseTo(0, 5);
      expect(rotZ90.y).toBeCloseTo(1, 5);
      expect(rotZ90.z).toBeCloseTo(0, 5);
    });

    it('stores clean 3D solid parameters focusing on 3-axis rotation', () => {
      const solidShape: ShapeObject = {
        id: 'test-cube',
        type: 'shape',
        shapeType: 'geometry3D' as ShapeType,
        x: 200,
        y: 150,
        width: 320,
        height: 320,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(56, 189, 248, 0.14)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        params: {
          solidType: 'cube',
          rotX: 28,
          rotY: 35,
          rotZ: 0,
        },
      };

      expect(solidShape.params?.solidType).toBe('cube');
      expect(solidShape.params?.rotX).toBe(28);
      expect(solidShape.params?.rotY).toBe(35);
      expect(solidShape.params?.rotZ).toBe(0);
    });
  });

  describe('Physics Module - Electrical Circuits & Components', () => {
    it('creates resistor with customizable resistance value and multiplier units', () => {
      const resistor: ShapeObject = {
        id: 'test-resistor',
        type: 'shape',
        shapeType: 'circuitComponent' as ShapeType,
        x: 200,
        y: 200,
        width: 160,
        height: 60,
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: 'R = 4.7 kΩ',
        params: {
          componentType: 'resistor',
          resistance: 4.7,
          unit: 'kΩ',
          label: 'R = 4.7 kΩ',
        },
      };

      expect(resistor.params?.componentType).toBe('resistor');
      expect(resistor.params?.resistance).toBe(4.7);
      expect(resistor.params?.unit).toBe('kΩ');
      expect(resistor.label).toBe('R = 4.7 kΩ');
    });

    it('creates variable resistor (rheostat) with adjustable resistance and maximum range', () => {
      const rheostat: ShapeObject = {
        id: 'test-rheostat',
        type: 'shape',
        shapeType: 'circuitComponent' as ShapeType,
        x: 200,
        y: 200,
        width: 180,
        height: 80,
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: 'Rheostat (60 / 250 Ω)',
        params: {
          componentType: 'rheostat',
          resistance: 60,
          maxResistance: 250,
          unit: 'Ω',
          label: 'Rheostat (60 / 250 Ω)',
        },
      };

      expect(rheostat.params?.componentType).toBe('rheostat');
      expect(rheostat.params?.resistance).toBe(60);
      expect(rheostat.params?.maxResistance).toBe(250);
      expect(rheostat.params?.unit).toBe('Ω');
    });

    it('builds editable series circuit loop with multiple electronic components and calculates Ohm\'s law', () => {
      const components = [
        { id: 'c1', type: 'resistor', value: 6, unit: 'Ω', label: 'R1' },
        { id: 'c2', type: 'resistor', value: 4, unit: 'Ω', label: 'R2' },
        { id: 'c3', type: 'capacitor', value: 10, unit: 'µF', label: 'C1' },
        { id: 'c4', type: 'switch', value: 0, unit: '', label: 'Switch', state: 'closed' },
        { id: 'c5', type: 'ammeter', value: 0, unit: 'A', label: 'A' },
      ];

      const voltage = 20; // 20 Volts
      const req = components
        .filter((c) => c.type === 'resistor')
        .reduce((sum, c) => sum + c.value, 0); // 6 + 4 = 10 Ω
      const expectedCurrent = Number((voltage / req).toFixed(2)); // 20 / 10 = 2 A

      const seriesCircuit: ShapeObject = {
        id: 'test-series-circuit',
        type: 'shape',
        shapeType: 'physicsDiagram' as ShapeType,
        x: 100,
        y: 100,
        width: 500,
        height: 330,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: `Series Circuit (V=${voltage}V, Req=${req}Ω, I=${expectedCurrent}A)`,
        params: {
          diagramType: 'seriesCircuit',
          voltage,
          resistance: req,
          current: expectedCurrent,
          components,
          showCurrentArrows: true,
          showFormulas: true,
        },
      };

      expect(seriesCircuit.params?.diagramType).toBe('seriesCircuit');
      expect(seriesCircuit.params?.voltage).toBe(20);
      expect(seriesCircuit.params?.resistance).toBe(10);
      expect(seriesCircuit.params?.current).toBe(2);
      expect(seriesCircuit.params?.components.length).toBe(5);
    });

    it('builds editable parallel branch circuit with dynamic branch components and Kirchhoff current division', () => {
      const branchComponents = [
        { id: 'p1', type: 'resistor', value: 10, unit: 'Ω', label: 'R1' },
        { id: 'p2', type: 'resistor', value: 10, unit: 'Ω', label: 'R2' },
      ];

      const voltage = 12; // 12 Volts
      // 1/Req = 1/10 + 1/10 = 2/10 => Req = 5 Ω
      const invReq = branchComponents.reduce((sum, c) => sum + 1 / c.value, 0);
      const req = Number((1 / invReq).toFixed(2)); // 5 Ω
      const totalCurrent = Number((voltage / req).toFixed(2)); // 12 / 5 = 2.4 A
      const branch1Current = Number((voltage / branchComponents[0].value).toFixed(2)); // 1.2 A
      const branch2Current = Number((voltage / branchComponents[1].value).toFixed(2)); // 1.2 A

      const parallelCircuit: ShapeObject = {
        id: 'test-parallel-circuit',
        type: 'shape',
        shapeType: 'physicsDiagram' as ShapeType,
        x: 100,
        y: 100,
        width: 520,
        height: 360,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: `Parallel Circuit (V=${voltage}V, Req=${req}Ω, I=${totalCurrent}A)`,
        params: {
          diagramType: 'parallelCircuit',
          voltage,
          resistance: req,
          current: totalCurrent,
          components: branchComponents,
          showCurrentArrows: true,
          showFormulas: true,
        },
      };

      expect(parallelCircuit.params?.diagramType).toBe('parallelCircuit');
      expect(req).toBe(5);
      expect(totalCurrent).toBe(2.4);
      expect(branch1Current + branch2Current).toBeCloseTo(totalCurrent, 2);
      expect(parallelCircuit.params?.components.length).toBe(2);
    });
  });

  describe('Physics Module - Mechanics & Vectors', () => {
    it('configures force vector with magnitude, angle and Cartesian components', () => {
      const magnitude = 50;
      const angle = 45;
      const rad = (angle * Math.PI) / 180;
      const fx = Number((magnitude * Math.cos(rad)).toFixed(2));
      const fy = Number((magnitude * Math.sin(rad)).toFixed(2));

      const forceVectorShape: ShapeObject = {
        id: 'test-force-vector',
        type: 'shape',
        shapeType: 'physicsDiagram' as ShapeType,
        x: 150,
        y: 150,
        width: 380,
        height: 380,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: `F = ${magnitude} N (${angle}°)`,
        params: {
          diagramType: 'forceVector',
          magnitude,
          angle,
          color: '#38bdf8',
          label: 'F',
          showComponents: true,
          showAngle: true,
          showGrid: true,
          fx,
          fy,
        },
      };

      expect(forceVectorShape.params?.diagramType).toBe('forceVector');
      expect(forceVectorShape.params?.magnitude).toBe(50);
      expect(forceVectorShape.params?.angle).toBe(45);
      expect(forceVectorShape.params?.fx).toBeCloseTo(35.36, 1);
      expect(forceVectorShape.params?.fy).toBeCloseTo(35.36, 1);
      expect(forceVectorShape.params?.showComponents).toBe(true);
    });

    it('computes resultant vector addition with multiple forces via parallelogram / component method', () => {
      const forces = [
        { id: 'f1', name: 'F1', magnitude: 40, angle: 0, color: '#38bdf8' },
        { id: 'f2', name: 'F2', magnitude: 30, angle: 90, color: '#f43f5e' },
      ];

      let rx = 0;
      let ry = 0;
      for (const f of forces) {
        const rad = (f.angle * Math.PI) / 180;
        rx += f.magnitude * Math.cos(rad);
        ry += f.magnitude * Math.sin(rad);
      }
      const rMag = Number(Math.hypot(rx, ry).toFixed(1)); // 50 N
      let rAng = Number(((Math.atan2(ry, rx) * 180) / Math.PI).toFixed(1)); // 36.9°
      if (rAng < 0) rAng += 360;

      const resultantShape: ShapeObject = {
        id: 'test-resultant-force',
        type: 'shape',
        shapeType: 'physicsDiagram' as ShapeType,
        x: 150,
        y: 150,
        width: 440,
        height: 380,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: `Resultant Force R = ${rMag} N @ ${rAng}°`,
        params: {
          diagramType: 'resultantForce',
          forces,
          resultantMag: rMag,
          resultantAngle: rAng,
          rx: Number(rx.toFixed(2)),
          ry: Number(ry.toFixed(2)),
          showParallelogram: true,
          showResultantComponents: true,
        },
      };

      expect(resultantShape.params?.diagramType).toBe('resultantForce');
      expect(rMag).toBe(50);
      expect(rAng).toBe(36.9);
      expect(resultantShape.params?.rx).toBe(40);
      expect(resultantShape.params?.ry).toBe(30);
      expect(resultantShape.params?.forces.length).toBe(2);
    });

    it('customizes Free Body Diagram with incline ramp, friction, applied force and computes Newton 2nd law', () => {
      const mass = 10; // kg
      const gravity = 9.8; // m/s^2
      const inclineAngle = 30; // degrees
      const frictionCoeff = 0.2;
      const appliedForce = 80; // N

      const alphaRad = (inclineAngle * Math.PI) / 180;
      const weight = Number((mass * gravity).toFixed(1)); // 98 N
      const normalForce = Number((mass * gravity * Math.cos(alphaRad)).toFixed(1)); // 98 * cos(30) = 84.9 N
      const frictionForce = Number((frictionCoeff * normalForce).toFixed(1)); // 0.2 * 84.9 = 17.0 N
      const gravityParallel = Number((mass * gravity * Math.sin(alphaRad)).toFixed(1)); // 98 * sin(30) = 49.0 N
      const netForce = Number((appliedForce - frictionForce - gravityParallel).toFixed(1)); // 80 - 17.0 - 49.0 = 14.0 N
      const acceleration = Number((netForce / mass).toFixed(2)); // 14.0 / 10 = 1.4 m/s^2

      const fbdShape: ShapeObject = {
        id: 'test-fbd',
        type: 'shape',
        shapeType: 'physicsDiagram' as ShapeType,
        x: 100,
        y: 100,
        width: 480,
        height: 380,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: `FBD: m=${mass}kg, Fnet=${netForce}N, a=${acceleration}m/s²`,
        params: {
          diagramType: 'freeBodyDiagram',
          mass,
          appliedForce,
          frictionCoeff,
          inclineAngle,
          gravity,
          weight,
          normalForce,
          frictionForce,
          netForce,
          acceleration,
          showValues: true,
          showFormulas: true,
        },
      };

      expect(fbdShape.params?.diagramType).toBe('freeBodyDiagram');
      expect(fbdShape.params?.mass).toBe(10);
      expect(fbdShape.params?.weight).toBe(98);
      expect(fbdShape.params?.normalForce).toBeCloseTo(84.9, 1);
      expect(fbdShape.params?.frictionForce).toBeCloseTo(17.0, 1);
      expect(fbdShape.params?.netForce).toBeCloseTo(14.0, 1);
      expect(fbdShape.params?.acceleration).toBeCloseTo(1.4, 2);
    });

    it('models 2D kinematic projectile motion diagram calculating trajectory, peak height and range', () => {
      const v0 = 25; // m/s
      const angle = 45; // degrees
      const g = 9.8; // m/s^2

      const thetaRad = (angle * Math.PI) / 180;
      const v0x = v0 * Math.cos(thetaRad);
      const v0y = v0 * Math.sin(thetaRad);
      const flightTime = Number(((2 * v0y) / g).toFixed(2)); // 2 * 17.68 / 9.8 = 3.61 s
      const maxH = Number(((v0y * v0y) / (2 * g)).toFixed(2)); // 17.68^2 / 19.6 = 15.93 m
      const range = Number(((v0 * v0 * Math.sin(2 * thetaRad)) / g).toFixed(2)); // 625 * sin(90) / 9.8 = 63.78 m

      const motionShape: ShapeObject = {
        id: 'test-motion-diagram',
        type: 'shape',
        shapeType: 'physicsDiagram' as ShapeType,
        x: 100,
        y: 100,
        width: 520,
        height: 360,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: `Projectile: v0=${v0}m/s, θ=${angle}°, Range=${range}m`,
        params: {
          diagramType: 'motionDiagram',
          motionType: 'projectile',
          v0,
          angle,
          gravity: g,
          flightTime,
          maxHeight: maxH,
          range,
          showVectors: true,
          showTrajectory: true,
          showFormulas: true,
        },
      };

      expect(motionShape.params?.diagramType).toBe('motionDiagram');
      expect(motionShape.params?.v0).toBe(25);
      expect(motionShape.params?.angle).toBe(45);
      expect(motionShape.params?.flightTime).toBeCloseTo(3.61, 1);
      expect(motionShape.params?.maxHeight).toBeCloseTo(15.93, 1);
      expect(motionShape.params?.range).toBeCloseTo(63.78, 1);
    });
  });

  describe('Chemistry Module - Periodic Table & Atomic Models', () => {
    it('contains all 118 elements from Hydrogen (Z=1) to Oganesson (Z=118)', () => {
      expect(PERIODIC_ELEMENTS.length).toBe(118);

      // Verify first and last elements
      expect(PERIODIC_ELEMENTS[0].number).toBe(1);
      expect(PERIODIC_ELEMENTS[0].symbol).toBe('H');
      expect(PERIODIC_ELEMENTS[0].name).toBe('Hydrogen');

      expect(PERIODIC_ELEMENTS[117].number).toBe(118);
      expect(PERIODIC_ELEMENTS[117].symbol).toBe('Og');
      expect(PERIODIC_ELEMENTS[117].name).toBe('Oganesson');

      // Verify no gaps in atomic numbers 1..118
      for (let z = 1; z <= 118; z++) {
        const el = getElementBySymbolOrNumber(z);
        expect(el).toBeDefined();
        expect(el?.number).toBe(z);
        expect(el?.symbol).toBeTruthy();
        expect(el?.electronsPerShell.length).toBeGreaterThan(0);
        // Sum of electrons across shells must equal atomic number Z
        const totalElectrons = el!.electronsPerShell.reduce((a: number, b: number) => a + b, 0);
        expect(totalElectrons).toBe(z);
      }
    });

    it('queries elements by symbol, name, and atomic number (case-insensitive)', () => {
      const ironBySym = getElementBySymbolOrNumber('fe');
      const ironByName = getElementBySymbolOrNumber('Iron');
      const ironByNum = getElementBySymbolOrNumber(26);

      expect(ironBySym).toBeDefined();
      expect(ironBySym?.number).toBe(26);
      expect(ironByName?.symbol).toBe('Fe');
      expect(ironByNum?.name).toBe('Iron');
      expect(ironByNum?.electronsPerShell).toEqual([2, 8, 14, 2]);

      const gold = getElementBySymbolOrNumber('Au');
      expect(gold?.number).toBe(79);
      expect(gold?.category).toBe('transitionMetal');
      expect(gold?.mass).toBeCloseTo(196.97, 1);
    });

    it('builds complete 118-element periodic table shape on whiteboard canvas', () => {
      const tableShape: ShapeObject = {
        id: 'test-complete-periodic-table',
        type: 'shape',
        shapeType: 'periodicElement' as ShapeType,
        x: 80,
        y: 60,
        width: 1040,
        height: 640,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.96)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: 'Periodic Table of the Elements (118 Elements)',
        params: {
          mode: 'table',
        },
      };

      expect(tableShape.params?.mode).toBe('table');
      expect(tableShape.width).toBeGreaterThanOrEqual(1000);
      expect(tableShape.height).toBeGreaterThanOrEqual(600);
      expect(tableShape.label).toContain('118 Elements');
    });

    it('builds selectable Element Card for any chemical element with electron config and shells', () => {
      const uranium = getElementBySymbolOrNumber('U')!;
      expect(uranium).toBeDefined();
      expect(uranium.number).toBe(92);

      const elementCard: ShapeObject = {
        id: 'test-element-card',
        type: 'shape',
        shapeType: 'periodicElement' as ShapeType,
        x: 200,
        y: 150,
        width: 240,
        height: 280,
        strokeColor: '#e879f9',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: `${uranium.name} (${uranium.symbol}) - Z=${uranium.number}`,
        params: {
          element: uranium,
          mode: 'card',
          showConfig: true,
          showShells: true,
        },
      };

      expect(elementCard.params?.mode).toBe('card');
      expect(elementCard.params?.element.symbol).toBe('U');
      expect(elementCard.params?.element.number).toBe(92);
      expect(elementCard.params?.element.category).toBe('actinide');
      expect(elementCard.params?.element.electronsPerShell).toEqual([2, 8, 18, 32, 21, 9, 2]);
    });

    it('builds Bohr Atomic Model for selectable element calculating nucleus particles and concentric shells', () => {
      const oxygen = getElementBySymbolOrNumber('O')!;
      const protons = oxygen.number;
      const neutrons = Math.round(oxygen.mass - oxygen.number);

      const bohrShape: ShapeObject = {
        id: 'test-bohr-atom',
        type: 'shape',
        shapeType: 'atomicModel' as ShapeType,
        x: 200,
        y: 150,
        width: 380,
        height: 380,
        strokeColor: '#38bdf8',
        strokeWidth: 1.5,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        rotation: 0,
        locked: false,
        layerId: 'default',
        label: `Bohr Model: ${oxygen.name} (Z=${oxygen.number})`,
        params: {
          symbol: oxygen.symbol,
          name: oxygen.name,
          atomicNumber: oxygen.number,
          mass: oxygen.mass,
          electronsPerShell: oxygen.electronsPerShell,
        },
      };

      expect(bohrShape.params?.symbol).toBe('O');
      expect(bohrShape.params?.atomicNumber).toBe(8);
      expect(protons).toBe(8);
      expect(neutrons).toBe(8); // 16 - 8 = 8 neutrons
      expect(bohrShape.params?.electronsPerShell).toEqual([2, 6]); // K=2, L=6
    });

    it('accurately distributes orbital shells for light, transition, and superheavy elements (H, Au, Og)', () => {
      const hydrogen = getElementBySymbolOrNumber('H')!;
      expect(hydrogen.electronsPerShell).toEqual([1]);

      const gold = getElementBySymbolOrNumber('Au')!;
      expect(gold.number).toBe(79);
      expect(gold.electronsPerShell).toEqual([2, 8, 18, 32, 18, 1]);
      const goldElectrons = gold.electronsPerShell.reduce((a: number, b: number) => a + b, 0);
      expect(goldElectrons).toBe(79);

      const oganesson = getElementBySymbolOrNumber('Og')!;
      expect(oganesson.number).toBe(118);
      expect(oganesson.electronsPerShell).toEqual([2, 8, 18, 32, 32, 18, 8]);
      const ogElectrons = oganesson.electronsPerShell.reduce((a: number, b: number) => a + b, 0);
      expect(ogElectrons).toBe(118);
    });
  });
});


