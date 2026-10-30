/**
 * Chemistry Teaching Module (Section 16.3)
 * Periodic table, atomic structure (Bohr model), chemical equation balancer, apparatus illustrations
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, createFormula, executeAddObject, executeAddMultipleObjects } from './commonHelpers';
import { ShapeObject } from '../../../shared/types';

// ─── 1. Periodic Table Element Database ──────────────────────────────────────

export type {
  ChemicalElement,
  ElementCategory,
} from './periodicTableData';

export {
  PERIODIC_ELEMENTS,
  getElementBySymbolOrNumber,
} from './periodicTableData';

import type {
  ChemicalElement,
} from './periodicTableData';

import {
  PERIODIC_ELEMENTS,
  getElementBySymbolOrNumber,
} from './periodicTableData';



// ─── 2. Verified Chemical Equation Balancer Logic ─────────────────────────────

/**
 * Parses chemical formula (e.g. H2O, Fe2O3, Ca(OH)2) into element counts
 */
export function parseChemicalFormula(formula: string): Record<string, number> {
  const result: Record<string, number> = {};
  // Expand parentheses if present e.g. Ca(OH)2 -> Ca(O2H2)
  let expanded = formula;
  const parenRegex = /\(([A-Za-z0-9]+)\)(\d+)/g;
  let match;
  while ((match = parenRegex.exec(expanded)) !== null) {
    const inner = match[1];
    const multiplier = parseInt(match[2], 10);
    const innerExpanded = inner.replace(/([A-Z][a-z]*)(\d*)/g, (_, elem, count) => {
      const c = count ? parseInt(count, 10) : 1;
      return elem + (c * multiplier);
    });
    expanded = expanded.replace(match[0], innerExpanded);
    parenRegex.lastIndex = 0;
  }

  const elemRegex = /([A-Z][a-z]*)(\d*)/g;
  let elemMatch;
  while ((elemMatch = elemRegex.exec(expanded)) !== null) {
    if (!elemMatch[1]) continue;
    const elem = elemMatch[1];
    const count = elemMatch[2] ? parseInt(elemMatch[2], 10) : 1;
    result[elem] = (result[elem] || 0) + count;
  }
  return result;
}

export interface BalancedEquationResult {
  isBalanced: boolean;
  reactants: { formula: string; coefficient: number }[];
  products: { formula: string; coefficient: number }[];
  balancedString: string;
  latex: string;
}

/**
 * Built-in verified chemical equation library & solver
 */
const KNOWN_BALANCED_REACTIONS: Record<string, { r: number[]; p: number[] }> = {
  'H2 + O2 -> H2O': { r: [2, 1], p: [2] },
  'CH4 + O2 -> CO2 + H2O': { r: [1, 2], p: [1, 2] },
  'Fe + O2 -> Fe2O3': { r: [4, 3], p: [2] },
  'Al + HCl -> AlCl3 + H2': { r: [2, 6], p: [2, 3] },
  'N2 + H2 -> NH3': { r: [1, 3], p: [2] },
  'Na + H2O -> NaOH + H2': { r: [2, 2], p: [2, 1] },
  'CaCO3 -> CaO + CO2': { r: [1], p: [1, 1] },
  'KClO3 -> KCl + O2': { r: [2], p: [2, 3] },
  'C2H5OH + O2 -> CO2 + H2O': { r: [1, 3], p: [2, 3] },
  'C6H12O6 + O2 -> CO2 + H2O': { r: [1, 6], p: [6, 6] },
  'CO2 + H2O -> C6H12O6 + O2': { r: [6, 6], p: [1, 6] },
  'HCl + NaOH -> NaCl + H2O': { r: [1, 1], p: [1, 1] },
  'H2SO4 + NaOH -> Na2SO4 + H2O': { r: [1, 2], p: [1, 2] },
  'AgNO3 + NaCl -> AgCl + NaNO3': { r: [1, 1], p: [1, 1] },
  'Zn + HCl -> ZnCl2 + H2': { r: [1, 2], p: [1, 1] },
  'Mg + O2 -> MgO': { r: [2, 1], p: [2] },
};

/**
 * Converts a raw chemical formula string (e.g. "CH4", "Fe2O3", "Ca(OH)2", "KMnO4")
 * into mathematically valid, KaTeX-renderable Roman LaTeX syntax (\mathrm{...}_{...}).
 * Ensures subscripts are never placed inside \text{...} which causes KaTeX parse errors.
 */
export function formatChemicalFormulaToLatex(formula: string): string {
  if (!formula) return '';
  const clean = formula.trim();

  // If already contains LaTeX commands, sanitize any broken \text{X_{n}}
  if (clean.includes('\\')) {
    return clean
      .replace(/\\text\{([A-Za-z]+)_\{?([0-9]+)\}?\}/g, '\\mathrm{$1}_{$2}')
      .replace(/\\text\{([^{}]+)\}/g, (m, inner) => {
        if (inner.includes('_')) {
          return inner.replace(/([A-Za-z]+)_\{?([0-9]+)\}?/g, '\\mathrm{$1}_{$2}');
        }
        return `\\mathrm{${inner}}`;
      });
  }

  // Tokenize elemental symbols, numerical subscripts, and parentheses
  // e.g. "CH4" -> "\mathrm{CH}_{4}", "Fe2O3" -> "\mathrm{Fe}_{2}\mathrm{O}_{3}"
  return clean.replace(/([A-Za-z]+)|([0-9]+)|([()[\]]+)/g, (match, letters, numbers, parens) => {
    if (letters) return `\\mathrm{${letters}}`;
    if (numbers) return `_{${numbers}}`;
    if (parens) return parens;
    return match;
  });
}

export function balanceChemicalEquation(equationStr: string): BalancedEquationResult {
  const normalized = equationStr.replace(/→|⟶/g, '->').trim();
  const [lhs, rhs] = normalized.split('->').map((s) => s.trim());
  if (!lhs || !rhs) {
    const safeLatex = formatChemicalFormulaToLatex(equationStr);
    return {
      isBalanced: false,
      reactants: [],
      products: [],
      balancedString: equationStr,
      latex: safeLatex,
    };
  }

  const rawReactants = lhs.split('+').map((s) => s.trim()).filter(Boolean);
  const rawProducts = rhs.split('+').map((s) => s.trim()).filter(Boolean);

  // Check known reactions first
  const key = `${rawReactants.join(' + ')} -> ${rawProducts.join(' + ')}`;
  const known = KNOWN_BALANCED_REACTIONS[key];

  let rCoeffs = rawReactants.map(() => 1);
  let pCoeffs = rawProducts.map(() => 1);
  let isBalanced = false;

  if (known) {
    rCoeffs = known.r;
    pCoeffs = known.p;
    isBalanced = true;
  } else {
    // Brute-force small integer search (coefficients 1..6)
    let found = false;
    for (let c1 = 1; c1 <= 6 && !found; c1++) {
      for (let c2 = 1; c2 <= 6 && !found; c2++) {
        for (let c3 = 1; c3 <= 6 && !found; c3++) {
          for (let c4 = 1; c4 <= 6 && !found; c4++) {
            const testR = [c1, c2].slice(0, rawReactants.length);
            const testP = [c3, c4].slice(0, rawProducts.length);

            const rCounts: Record<string, number> = {};
            rawReactants.forEach((r, idx) => {
              const parsed = parseChemicalFormula(r);
              for (const [elem, count] of Object.entries(parsed)) {
                rCounts[elem] = (rCounts[elem] || 0) + count * (testR[idx] ?? 1);
              }
            });

            const pCounts: Record<string, number> = {};
            rawProducts.forEach((p, idx) => {
              const parsed = parseChemicalFormula(p);
              for (const [elem, count] of Object.entries(parsed)) {
                pCounts[elem] = (pCounts[elem] || 0) + count * (testP[idx] ?? 1);
              }
            });

            const allElements = Array.from(new Set([...Object.keys(rCounts), ...Object.keys(pCounts)]));
            const match = allElements.length > 0 && allElements.every((elem) => rCounts[elem] === pCounts[elem]);
            if (match) {
              rCoeffs = testR;
              pCoeffs = testP;
              found = true;
              isBalanced = true;
            }
          }
        }
      }
    }
  }

  const reactants = rawReactants.map((f, i) => ({ formula: f, coefficient: rCoeffs[i] ?? 1 }));
  const products = rawProducts.map((f, i) => ({ formula: f, coefficient: pCoeffs[i] ?? 1 }));

  const formatSide = (items: { formula: string; coefficient: number }[]) =>
    items.map((it) => (it.coefficient > 1 ? `${it.coefficient}${it.formula}` : it.formula)).join(' + ');

  const formatLatexSide = (items: { formula: string; coefficient: number }[]) =>
    items
      .map((it) => {
        const coef = it.coefficient > 1 ? `${it.coefficient} ` : '';
        return `${coef}${formatChemicalFormulaToLatex(it.formula)}`;
      })
      .join(' + ');

  const balancedString = `${formatSide(reactants)} ⟶ ${formatSide(products)}`;
  const latex = `${formatLatexSide(reactants)} \\longrightarrow ${formatLatexSide(products)}`;

  return {
    isBalanced,
    reactants,
    products,
    balancedString,
    latex,
  };
}

// ─── 3. Tools in Chemistry Module ─────────────────────────────────────────────

const chemistryTools: SubjectTool[] = [
  // 1. Interactive Periodic Table
  {
    id: 'chem-periodic-table',
    subjectId: 'chemistry',
    name: 'Interactive Periodic Table',
    category: 'Elements',
    icon: '🧪',
    description: 'Full periodic table with 118 elements, elemental info, atomic masses, electron shells, and complete table insertion',
    badge: 'Interactive',
    tags: ['periodic table', 'elements', 'atoms', 'chemistry', 'mendeleev'],
    interactiveModal: 'periodicTable',
    execute: (context) => {
      // Inserts a complete periodic table overview board consisting of all 118 elements
      const tableObj = createShape('periodicElement', 100, 80, 1040, 640, {
        params: { mode: 'table' },
        strokeColor: '#38bdf8',
        fillColor: 'rgba(15, 23, 42, 0.96)',
        label: 'Periodic Table of the Elements (118 Elements)',
      });
      executeAddObject(context, tableObj, 'Insert Complete Periodic Table');
    },
  },

  // 2. Element Information Card
  {
    id: 'chem-element-card',
    subjectId: 'chemistry',
    name: 'Element Card (Bohr / Info)',
    category: 'Elements',
    icon: '📇',
    description: 'Detailed elemental placard with atomic number, symbol, name, atomic weight, electron shells, and selectable element',
    badge: 'Interactive',
    tags: ['element card', 'atomic weight', 'electron config', 'periodic table'],
    interactiveModal: 'elementCard',
    execute: (context, options) => {
      const symbol = options?.symbol || 'C';
      const element = getElementBySymbolOrNumber(symbol) || PERIODIC_ELEMENTS[5]; // Carbon
      const card = createShape('periodicElement', 240, 180, 240, 280, {
        params: { element, mode: 'card' },
        strokeColor: '#38bdf8',
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: `${element.name} (${element.symbol}) - Z=${element.number}`,
      });
      executeAddObject(context, card, `Insert Element Card: ${element.name}`);
    },
  },

  // 3. Atomic Structure (Bohr Model Generator)
  {
    id: 'chem-bohr-atom',
    subjectId: 'chemistry',
    name: 'Bohr Atomic Model',
    category: 'Atomic Structure',
    icon: '⚛️',
    description: 'Bohr electron shell model with selectable element, nucleus (p+, n0), and orbital electrons in K..Q shells',
    badge: 'Interactive',
    tags: ['bohr', 'atom', 'electrons', 'nucleus', 'orbitals'],
    interactiveModal: 'bohrModel',
    execute: (context, options) => {
      const symbol = options?.symbol || 'O'; // Oxygen default (Z=8, shells [2, 6])
      const element = getElementBySymbolOrNumber(symbol) || PERIODIC_ELEMENTS[7];
      const bohr = createShape('atomicModel', 240, 160, 360, 360, {
        params: {
          symbol: element.symbol,
          name: element.name,
          atomicNumber: element.number,
          mass: element.mass,
          electronsPerShell: element.electronsPerShell,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 1.5,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: `Bohr Model: ${element.name} (Z=${element.number})`,
      });
      executeAddObject(context, bohr, `Insert Bohr Model: ${element.name}`);
    },
  },

  // 4. Chemical Equation Balancer
  {
    id: 'chem-equation-balancer',
    subjectId: 'chemistry',
    name: 'Chemical Equation Balancer',
    category: 'Reactions',
    icon: '⚖️',
    description: 'Stoichiometric equation balancer computing balanced coefficients and reaction formulas',
    badge: 'Calculator',
    tags: ['equation balancer', 'reactions', 'stoichiometry', 'coefficients'],
    interactiveModal: 'equationBalancer',
    execute: (context, options) => {
      const eq = options?.equation || 'CH4 + O2 -> CO2 + H2O';
      const balanced = balanceChemicalEquation(eq);
      const formula = createFormula(balanced.latex, 240, 220);
      executeAddObject(context, formula, `Insert Balanced Reaction: ${balanced.balancedString}`);
    },
  },

  // 5. Laboratory Apparatus: Beaker
  {
    id: 'chem-apparatus-beaker',
    subjectId: 'chemistry',
    name: 'Laboratory Beaker',
    category: 'Laboratory',
    icon: '🧪',
    description: 'Graduated glass beaker with gravity-responsive fluid leveling, volume markings, and pouring stream',
    badge: 'Interactive',
    tags: ['beaker', 'liquid', 'glassware', 'lab', 'gravity'],
    interactiveModal: 'labApparatus',
    execute: (context, options) => {
      const beaker = createShape('labApparatus', 250, 180, 200, 260, {
        params: {
          apparatusType: 'beaker',
          liquidLevel: options?.liquidLevel ?? 0.65,
          liquidColor: options?.liquidColor || 'rgba(56, 189, 248, 0.55)',
          solutionName: options?.solutionName || 'Glass Beaker (250 mL)',
        },
        strokeColor: '#94a3b8',
        strokeWidth: 2,
        label: 'Glass Beaker (250 mL)',
      });
      executeAddObject(context, beaker, 'Insert Laboratory Beaker');
    },
  },

  // 6. Laboratory Apparatus: Erlenmeyer Flask
  {
    id: 'chem-apparatus-flask',
    subjectId: 'chemistry',
    name: 'Erlenmeyer Flask',
    category: 'Laboratory',
    icon: '⚗️',
    description: 'Conical titration flask with gravity fluid leveling, rubber stopper, active effervescence, and magnetic stirrer',
    badge: 'Interactive',
    tags: ['flask', 'erlenmeyer', 'conical', 'titration', 'stopper', 'bubbles'],
    interactiveModal: 'labApparatus',
    execute: (context, options) => {
      const flask = createShape('labApparatus', 250, 180, 210, 280, {
        params: {
          apparatusType: 'flask',
          liquidLevel: options?.liquidLevel ?? 0.55,
          liquidColor: options?.liquidColor || 'rgba(168, 85, 247, 0.65)',
          solutionName: options?.solutionName || 'Erlenmeyer Flask (250 mL)',
          hasStopper: options?.hasStopper ?? false,
          isBubbling: options?.isBubbling ?? true,
          hasStirrer: options?.hasStirrer ?? false,
        },
        strokeColor: '#94a3b8',
        strokeWidth: 2,
        label: 'Erlenmeyer Flask (250 mL)',
      });
      executeAddObject(context, flask, 'Insert Erlenmeyer Flask');
    },
  },

  // 7. Laboratory Apparatus: Bunsen Burner
  {
    id: 'chem-apparatus-burner',
    subjectId: 'chemistry',
    name: 'Bunsen Burner',
    category: 'Laboratory',
    icon: '🔥',
    description: 'Bunsen burner with cast metal base, gas inlet tube, air collar, and 3 flame stages (Safety, Gentle, Roaring 1400°C)',
    badge: 'Interactive',
    tags: ['bunsen burner', 'flame', 'heat', 'lab', 'combustion'],
    interactiveModal: 'labApparatus',
    execute: (context, options) => {
      const burner = createShape('labApparatus', 260, 180, 170, 290, {
        params: {
          apparatusType: 'bunsenBurner',
          hasFlame: options?.hasFlame ?? true,
          flameType: options?.flameType || 'roaring',
        },
        strokeColor: '#94a3b8',
        strokeWidth: 2,
        label: 'Bunsen Burner (Roaring Blue Flame)',
      });
      executeAddObject(context, burner, 'Insert Bunsen Burner');
    },
  },

  // 8. Laboratory Apparatus: Test Tube & Rack
  {
    id: 'chem-apparatus-testtube',
    subjectId: 'chemistry',
    name: 'Test Tube Rack',
    category: 'Laboratory',
    icon: '🧪',
    description: 'Classroom wooden/acrylic rack holding 3-6 borosilicate test tubes with authentic chemical solution colors and stoppers',
    badge: 'Interactive',
    tags: ['test tube', 'rack', 'liquids', 'reactions', 'solutions'],
    interactiveModal: 'labApparatus',
    execute: (context, options) => {
      const count = options?.count ?? 4;
      const testTube = createShape('labApparatus', 220, 180, 340, 240, {
        params: {
          apparatusType: 'testTubeRack',
          count,
          bubbles: true,
          stoppers: Array(count).fill(false),
        },
        strokeColor: '#94a3b8',
        strokeWidth: 2,
        label: `Classroom Test Tube Rack (${count} Tubes)`,
      });
      executeAddObject(context, testTube, 'Insert Test Tube Rack');
    },
  },
];

/**
 * Templates for Chemistry
 */
const chemistryTemplates: SubjectTemplate[] = [
  {
    id: 'chem-tmpl-combustion-reaction',
    subjectId: 'chemistry',
    name: 'Hydrocarbon Combustion Workspace',
    category: 'Lesson Templates',
    icon: '🔥',
    description: 'Complete reaction board with methane combustion, stoichiometric coefficients, and energy delta',
    createObjects: (origin) => {
      const formula1 = createFormula('\\text{CH}_4 + 2\\text{O}_2 \\longrightarrow \\text{CO}_2 + 2\\text{H}_2\\text{O}', origin.x + 20, origin.y + 40);
      const formula2 = createFormula('\\Delta H = -891\\text{ kJ/mol}', origin.x + 20, origin.y + 120);
      const burner = createShape('labApparatus', origin.x + 480, origin.y + 20, 140, 240, {
        params: { apparatusType: 'bunsenBurner', hasFlame: true },
        strokeColor: '#94a3b8',
      });
      return [formula1, formula2, burner];
    },
  },
  {
    id: 'chem-tmpl-acid-base-titration',
    subjectId: 'chemistry',
    name: 'Acid-Base Titration Setup',
    category: 'Lesson Templates',
    icon: '⚗️',
    description: 'Titration setup with Erlenmeyer flask, neutralization reaction HCl + NaOH -> NaCl + H2O',
    createObjects: (origin) => {
      const flask = createShape('labApparatus', origin.x + 40, origin.y + 30, 180, 240, {
        params: { apparatusType: 'flask', liquidLevel: 0.6, liquidColor: '#ec4899' },
        strokeColor: '#94a3b8',
      });
      const formula = createFormula('\\text{HCl} + \\text{NaOH} \\longrightarrow \\text{NaCl} + \\text{H}_2\\text{O}', origin.x + 260, origin.y + 80);
      return [flask, formula];
    },
  },
];

export const ChemistryModule: SubjectModule = {
  id: 'chemistry',
  name: 'Chemistry',
  icon: '🧪',
  description: 'Interactive periodic table, Bohr models, reaction balancer, apparatus illustrations',
  tools: chemistryTools,
  templates: chemistryTemplates,
};
