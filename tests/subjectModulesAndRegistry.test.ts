/**
 * Subject Modules and Registry Test Suite (Section 16)
 * Unit tests covering SubjectRegistry, Math, Physics, Chemistry, CS, Digital Logic,
 * Flowcharts, General Teaching, verified equation engines, and shape renderers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SubjectRegistry, initializeSubjectModules } from '../src/renderer/services/subjectModules';
import { evaluateMathFunction, MATH_FORMULAS } from '../src/renderer/services/subjectModules/mathModule';
import {
  solveOhmsLaw,
  calculateEquivalentResistance,
  calculateResultantForce,
  calculateProjectileMotion,
} from '../src/renderer/services/subjectModules/physicsModule';
import {
  parseChemicalFormula,
  balanceChemicalEquation,
  formatChemicalFormulaToLatex,
  getElementBySymbolOrNumber,
  PERIODIC_ELEMENTS,
} from '../src/renderer/services/subjectModules/chemistryModule';
import { renderLatexHtml } from '../src/renderer/services/latexService';
import {
  evaluateLogicGate,
  generateTruthTableData,
  LogicGateType,
} from '../src/renderer/services/subjectModules/digitalLogicModule';
import { isSubjectShape, renderSubjectShape } from '../src/renderer/engine/subjectShapeRenderer';
import { CommandSystem } from '../src/renderer/engine/CommandSystem';
import { ShapeObject } from '../src/shared/types';

describe('Subject Tool Registry System', () => {
  beforeEach(() => {
    initializeSubjectModules();
  });

  it('registers all 7 core curriculum modules', () => {
    const modules = SubjectRegistry.getAllModules();
    expect(modules.length).toBe(7);

    const ids = modules.map((m) => m.id);
    expect(ids).toContain('mathematics');
    expect(ids).toContain('physics');
    expect(ids).toContain('chemistry');
    expect(ids).toContain('computerScience');
    expect(ids).toContain('digitalLogic');
    expect(ids).toContain('flowcharts');
    expect(ids).toContain('generalTeaching');
  });

  it('provides tools for each subject module', () => {
    const mathTools = SubjectRegistry.getToolsBySubject('mathematics');
    const physTools = SubjectRegistry.getToolsBySubject('physics');
    const chemTools = SubjectRegistry.getToolsBySubject('chemistry');
    const csTools = SubjectRegistry.getToolsBySubject('computerScience');
    const logicTools = SubjectRegistry.getToolsBySubject('digitalLogic');
    const flowTools = SubjectRegistry.getToolsBySubject('flowcharts');
    const generalTools = SubjectRegistry.getToolsBySubject('generalTeaching');

    expect(mathTools.length).toBeGreaterThanOrEqual(10);
    expect(physTools.length).toBeGreaterThanOrEqual(8);
    expect(chemTools.length).toBeGreaterThanOrEqual(7);
    expect(csTools.length).toBeGreaterThanOrEqual(10);
    expect(logicTools.length).toBeGreaterThanOrEqual(7);
    expect(flowTools.length).toBeGreaterThanOrEqual(5);
    expect(generalTools.length).toBeGreaterThanOrEqual(6);
  });

  it('searches tools accurately across name, description, and tags', () => {
    const calcSearch = SubjectRegistry.searchTools('calculator');
    expect(calcSearch.length).toBeGreaterThanOrEqual(1);
    expect(calcSearch[0].id).toBe('math-scientific-calc');

    const circuitSearch = SubjectRegistry.searchTools('circuit');
    expect(circuitSearch.length).toBeGreaterThanOrEqual(3);

    const binarySearch = SubjectRegistry.searchTools('binary');
    expect(binarySearch.length).toBeGreaterThanOrEqual(1);

    const gateSearch = SubjectRegistry.searchTools('nand');
    expect(gateSearch.length).toBeGreaterThanOrEqual(1);
  });

  it('retrieves reusable subject lesson templates', () => {
    const templates = SubjectRegistry.getAllTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(7);

    const csTmpl = templates.find((t) => t.subjectId === 'computerScience');
    expect(csTmpl).toBeDefined();

    if (csTmpl) {
      const objects = csTmpl.createObjects({ x: 100, y: 100 });
      expect(objects.length).toBeGreaterThan(0);
      expect(objects[0].id).toBeDefined();
    }
  });
});

describe('16.1 Mathematics Module & Equation Engines', () => {
  it('accurately evaluates mathematical continuous functions for plotting', () => {
    expect(evaluateMathFunction('sin(x)', 0)).toBeCloseTo(0);
    expect(evaluateMathFunction('sin(x)', Math.PI / 2)).toBeCloseTo(1);
    expect(evaluateMathFunction('cos(x)', 0)).toBeCloseTo(1);
    expect(evaluateMathFunction('x^2', 3)).toBe(9);
    expect(evaluateMathFunction('x^3', 2)).toBe(8);
    expect(evaluateMathFunction('sqrt(x)', 16)).toBe(4);
    expect(evaluateMathFunction('2*x+1', 5)).toBe(11);
    expect(evaluateMathFunction('exp(x)', 0)).toBe(1);
    expect(evaluateMathFunction('ln(x)', Math.E)).toBeCloseTo(1);
  });

  it('provides verified mathematical formulas', () => {
    expect(MATH_FORMULAS.length).toBeGreaterThanOrEqual(8);
    const quadratic = MATH_FORMULAS.find((f) => f.name.includes('Quadratic'));
    expect(quadratic).toBeDefined();
    expect(quadratic?.latex).toContain('\\sqrt{b^2 - 4ac}');
  });

  it('executes mathematics tools and adds objects via CommandSystem', () => {
    const commandSystem = new CommandSystem();
    const addedObjects: any[] = [];
    const dispatch = (action: any) => {
      if (action.type === 'ADD_OBJECT') {
        addedObjects.push(action.object);
      }
    };

    const rulerTool = SubjectRegistry.getTool('math-ruler');
    expect(rulerTool).toBeDefined();

    rulerTool?.execute({
      pageIndex: 0,
      dispatch,
      commandSystem,
    });

    expect(addedObjects.length).toBe(1);
    expect(addedObjects[0].shapeType).toBe('ruler');
  });
});

describe('16.2 Physics Module & Verified Underlying Equation Engines', () => {
  it("solves Ohm's Law and electric power V = I * R and P = V * I", () => {
    // Given V=12, R=4 -> I=3, P=36
    const res1 = solveOhmsLaw({ v: 12, r: 4 });
    expect(res1.current).toBe(3);
    expect(res1.power).toBe(36);

    // Given I=2.5, R=10 -> V=25, P=62.5
    const res2 = solveOhmsLaw({ i: 2.5, r: 10 });
    expect(res2.voltage).toBe(25);
    expect(res2.power).toBe(62.5);

    // Given V=230, I=2 -> R=115, P=460
    const res3 = solveOhmsLaw({ v: 230, i: 2 });
    expect(res3.resistance).toBe(115);
    expect(res3.power).toBe(460);
  });

  it('calculates series and parallel equivalent resistances', () => {
    const series = calculateEquivalentResistance([10, 20, 30], false);
    expect(series).toBe(60);

    // 10 || 10 = 5
    const parallel2 = calculateEquivalentResistance([10, 10], true);
    expect(parallel2).toBe(5);

    // 100 || 100 || 100 = 33.3333
    const parallel3 = calculateEquivalentResistance([100, 100, 100], true);
    expect(parallel3).toBeCloseTo(33.3333, 2);
  });

  it('demonstrates resultant force vector addition R = ΣF', () => {
    // Two perpendicular forces: F1 = 40N @ 0°, F2 = 30N @ 90° -> R = 50N @ 36.9°
    const result = calculateResultantForce([
      { name: 'F1', magnitude: 40, angleDegrees: 0 },
      { name: 'F2', magnitude: 30, angleDegrees: 90 },
    ]);

    expect(result.rx).toBeCloseTo(40, 1);
    expect(result.ry).toBeCloseTo(30, 1);
    expect(result.magnitude).toBeCloseTo(50, 1);
    expect(result.angleDegrees).toBeCloseTo(36.9, 1);
  });

  it('calculates projectile kinematics trajectory points and parameters', () => {
    // v0 = 20 m/s @ 45 degrees, g = 9.81
    const motion = calculateProjectileMotion(20, 45, 9.81);
    expect(motion.flightTime).toBeGreaterThan(0);
    expect(motion.maxHeight).toBeGreaterThan(0);
    expect(motion.range).toBeGreaterThan(0);
    expect(motion.trajectoryPoints.length).toBe(31);
    // Initial launch point should be (0, 0)
    expect(motion.trajectoryPoints[0]).toEqual({ x: 0, y: 0 });
  });
});

describe('16.3 Chemistry Module & Stoichiometric Balancer', () => {
  it('parses chemical formulas into elemental counts', () => {
    expect(parseChemicalFormula('H2O')).toEqual({ H: 2, O: 1 });
    expect(parseChemicalFormula('Fe2O3')).toEqual({ Fe: 2, O: 3 });
    expect(parseChemicalFormula('CH4')).toEqual({ C: 1, H: 4 });
    expect(parseChemicalFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 });
  });

  it('balances chemical reactions with authentic stoichiometry', () => {
    // Methane combustion
    const ch4 = balanceChemicalEquation('CH4 + O2 -> CO2 + H2O');
    expect(ch4.isBalanced).toBe(true);
    expect(ch4.balancedString).toBe('CH4 + 2O2 ⟶ CO2 + 2H2O');

    // Water synthesis
    const h2o = balanceChemicalEquation('H2 + O2 -> H2O');
    expect(h2o.isBalanced).toBe(true);
    expect(h2o.balancedString).toBe('2H2 + O2 ⟶ 2H2O');

    // Rust formation
    const fe = balanceChemicalEquation('Fe + O2 -> Fe2O3');
    expect(fe.isBalanced).toBe(true);
    expect(fe.balancedString).toBe('4Fe + 3O2 ⟶ 2Fe2O3');

    // User's organic equation (CH3 + CH2 + O2 -> COOH)
    const organic = balanceChemicalEquation('CH3 + CH2 + O2 -> COOH');
    expect(organic.latex).toContain('\\mathrm{CH}_{3}');
    expect(organic.latex).toContain('\\mathrm{CH}_{2}');
    expect(organic.latex).toContain('\\mathrm{O}_{2}');
    expect(organic.latex).toContain('\\mathrm{COOH}');
    expect(organic.latex).not.toContain('\\text{CH_{3}}'); // Ensure broken nested underscore is never produced!

    // Verify all generated LaTeX compiles flawlessly in KaTeX without any syntax error
    [ch4.latex, h2o.latex, fe.latex, organic.latex].forEach((latex) => {
      const rendered = renderLatexHtml(latex);
      expect(rendered.success).toBe(true);
      expect(rendered.error).toBeUndefined();
      expect(rendered.html).not.toContain('Syntax incomplete');
    });

    // Test formatChemicalFormulaToLatex individually
    expect(formatChemicalFormulaToLatex('CH4')).toBe('\\mathrm{CH}_{4}');
    expect(formatChemicalFormulaToLatex('Ca(OH)2')).toBe('\\mathrm{Ca}(\\mathrm{OH})_{2}');
    expect(formatChemicalFormulaToLatex('KMnO4')).toBe('\\mathrm{KMnO}_{4}');
  });

  it('queries periodic table elements and electron shell distribution', () => {
    const carbon = getElementBySymbolOrNumber('C');
    expect(carbon).toBeDefined();
    expect(carbon?.name).toBe('Carbon');
    expect(carbon?.number).toBe(6);
    expect(carbon?.electronsPerShell).toEqual([2, 4]);

    const oxygen = getElementBySymbolOrNumber(8);
    expect(oxygen).toBeDefined();
    expect(oxygen?.symbol).toBe('O');
    expect(oxygen?.electronsPerShell).toEqual([2, 6]);

    const iron = getElementBySymbolOrNumber('Fe');
    expect(iron?.group).toBe(8);
    expect(iron?.period).toBe(4);
  });
});

describe('16.4 Digital Logic Module & Gate Evaluation', () => {
  it('verifies standard logic gate boolean functions', () => {
    // AND: 1 only when both are 1
    expect(evaluateLogicGate('AND', true, true)).toBe(true);
    expect(evaluateLogicGate('AND', true, false)).toBe(false);

    // OR: 1 when at least one is 1
    expect(evaluateLogicGate('OR', false, true)).toBe(true);
    expect(evaluateLogicGate('OR', false, false)).toBe(false);

    // NOT: inverts input
    expect(evaluateLogicGate('NOT', true)).toBe(false);
    expect(evaluateLogicGate('NOT', false)).toBe(true);

    // NAND: opposite of AND
    expect(evaluateLogicGate('NAND', true, true)).toBe(false);
    expect(evaluateLogicGate('NAND', true, false)).toBe(true);

    // NOR: opposite of OR
    expect(evaluateLogicGate('NOR', false, false)).toBe(true);
    expect(evaluateLogicGate('NOR', true, false)).toBe(false);

    // XOR: true when inputs differ
    expect(evaluateLogicGate('XOR', true, false)).toBe(true);
    expect(evaluateLogicGate('XOR', true, true)).toBe(false);

    // XNOR: true when inputs match
    expect(evaluateLogicGate('XNOR', true, true)).toBe(true);
    expect(evaluateLogicGate('XNOR', true, false)).toBe(false);
  });

  it('generates complete truth tables dynamically', () => {
    const xorTable = generateTruthTableData('XOR');
    expect(xorTable.headers).toEqual(['A', 'B', 'Y = XOR']);
    expect(xorTable.rows).toEqual([
      [0, 0, 0],
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ]);

    const notTable = generateTruthTableData('NOT');
    expect(notTable.rows).toEqual([
      [0, 1],
      [1, 0],
    ]);
  });
});

describe('Subject Shape Rendering & Export Parity', () => {
  it('identifies all subject-specific shapes with isSubjectShape', () => {
    expect(isSubjectShape('setSquare45')).toBe(true);
    expect(isSubjectShape('setSquare30')).toBe(true);
    expect(isSubjectShape('functionPlot')).toBe(true);
    expect(isSubjectShape('circuitComponent')).toBe(true);
    expect(isSubjectShape('physicsDiagram')).toBe(true);
    expect(isSubjectShape('periodicElement')).toBe(true);
    expect(isSubjectShape('atomicModel')).toBe(true);
    expect(isSubjectShape('labApparatus')).toBe(true);
    expect(isSubjectShape('csDiagram')).toBe(true);
    expect(isSubjectShape('flowchartNode')).toBe(true);
    expect(isSubjectShape('logicGate')).toBe(true);
    expect(isSubjectShape('truthTable')).toBe(true);
    expect(isSubjectShape('teachingTemplate')).toBe(true);

    // Standard shapes should return false
    expect(isSubjectShape('rect')).toBe(false);
    expect(isSubjectShape('circle')).toBe(false);
  });

  it('renders subject shapes onto HTML5 canvas context without throwing', () => {
    const mockCtx: any = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      rect: () => {},
      roundRect: () => {},
      ellipse: () => {},
      arc: () => {},
      arcTo: () => {},
      quadraticCurveTo: () => {},
      fillRect: () => {},
      fillText: () => {},
      setLineDash: () => {},
      clip: () => {},
      measureText: (text: string) => ({ width: (text || '').length * 8 }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      strokeStyle: '#ffffff',
      fillStyle: '#ffffff',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      globalAlpha: 1,
    };

    const testShapes: ShapeObject[] = [
      {
        id: 'test-1',
        type: 'shape',
        shapeType: 'setSquare45',
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeColor: '#0284c7',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
      },
      {
        id: 'test-2',
        type: 'shape',
        shapeType: 'functionPlot',
        x: 50,
        y: 50,
        width: 300,
        height: 200,
        rotation: 0,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        params: { expression: 'sin(x)', xMin: -5, xMax: 5, yMin: -1, yMax: 1 },
      },
      {
        id: 'test-3',
        type: 'shape',
        shapeType: 'logicGate',
        x: 50,
        y: 50,
        width: 160,
        height: 80,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        params: { gateType: 'AND' },
      },
      {
        id: 'test-4',
        type: 'shape',
        shapeType: 'atomicModel',
        x: 50,
        y: 50,
        width: 250,
        height: 250,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        params: { symbol: 'C', name: 'Carbon', atomicNumber: 6, electronsPerShell: [2, 4] },
      },
      // Laboratory Apparatus Shapes
      {
        id: 'test-beaker-level',
        type: 'shape',
        shapeType: 'labApparatus',
        x: 100,
        y: 100,
        width: 160,
        height: 200,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        params: {
          type: 'beaker',
          fillLevel: 65,
          liquidColor: '#38bdf8',
          liquidName: 'Water (H2O)',
          showGraduations: true,
          showLabel: true,
        },
      },
      {
        id: 'test-beaker-rotated',
        type: 'shape',
        shapeType: 'labApparatus',
        x: 150,
        y: 150,
        width: 160,
        height: 200,
        rotation: 45, // Tilted beaker to test gravity-responsive fluid leveling
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        params: {
          type: 'beaker',
          fillLevel: 80,
          liquidColor: '#0ea5e9',
          liquidName: 'CuSO4 Solution',
          showGraduations: true,
          showLabel: true,
        },
      },
      {
        id: 'test-flask',
        type: 'shape',
        shapeType: 'labApparatus',
        x: 200,
        y: 200,
        width: 180,
        height: 220,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        params: {
          type: 'flask',
          fillLevel: 50,
          liquidColor: '#a855f7',
          liquidName: 'KMnO4',
          hasStopper: true,
          hasEffervescence: true,
          hasStirBar: true,
          showGraduations: true,
          showLabel: true,
        },
      },
      {
        id: 'test-bunsen-burner',
        type: 'shape',
        shapeType: 'labApparatus',
        x: 250,
        y: 250,
        width: 140,
        height: 220,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeColor: '#94a3b8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        params: {
          type: 'bunsenBurner',
          flameOn: true,
          flameMode: 'roaring',
          hasStand: false,
        },
      },
      {
        id: 'test-testtube-rack',
        type: 'shape',
        shapeType: 'labApparatus',
        x: 300,
        y: 300,
        width: 280,
        height: 180,
        rotation: 0,
        fillColor: 'transparent',
        fillOpacity: 1,
        strokeColor: '#94a3b8',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        locked: false,
        layerId: 'objects',
        params: {
          type: 'testTubeRack',
          tubeCount: 5,
          tubes: [
            { fillLevel: 70, color: '#38bdf8', label: 'CuSO4', stopper: false, bubbles: false },
            { fillLevel: 50, color: '#a855f7', label: 'KMnO4', stopper: true, bubbles: true },
            { fillLevel: 60, color: '#f59e0b', label: 'FeCl3', stopper: false, bubbles: false },
            { fillLevel: 40, color: '#ec4899', label: 'Phenolphthalein', stopper: true, bubbles: false },
            { fillLevel: 65, color: '#10b981', label: 'NiSO4', stopper: false, bubbles: true },
          ],
        },
      },
    ];

    testShapes.forEach((shape) => {
      expect(() => {
        renderSubjectShape(mockCtx, shape, shape.x, shape.y, shape.width, shape.height, 1);
      }).not.toThrow();
    });
  });
});
