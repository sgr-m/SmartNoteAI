/**
 * Digital Logic Module (Section 16.4 Digital Logic)
 * Logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR), truth tables, boolean expressions,
 * Karnaugh maps, MUX/DEMUX, adders, encoders/decoders, flip-flops, registers, counters.
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, createFormula, executeAddObject, executeAddMultipleObjects } from './commonHelpers';
import { ShapeObject } from '../../../shared/types';

export type LogicGateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

/**
 * Verified Boolean logic evaluator for all standard gates
 */
export function evaluateLogicGate(gateType: LogicGateType, a: boolean, b?: boolean): boolean {
  switch (gateType) {
    case 'AND':
      return a && (b ?? false);
    case 'OR':
      return a || (b ?? false);
    case 'NOT':
      return !a;
    case 'NAND':
      return !(a && (b ?? false));
    case 'NOR':
      return !(a || (b ?? false));
    case 'XOR':
      return a !== (b ?? false);
    case 'XNOR':
      return a === (b ?? false);
    default:
      return false;
  }
}

/**
 * Generates all 2^n binary input combinations in straight binary order
 */
export function generateNBitCombinations(n: number): number[][] {
  const count = Math.max(1, Math.min(6, n));
  const total = 1 << count; // 2^count
  const combinations: number[][] = [];
  for (let i = 0; i < total; i++) {
    const row: number[] = [];
    for (let bit = count - 1; bit >= 0; bit--) {
      row.push((i >> bit) & 1);
    }
    combinations.push(row);
  }
  return combinations;
}

/**
 * Computes authentic standard textbook minterm/maxterm decimal index for K-Map cells
 */
export function getKMapMintermIndex(variables: number, row: number, col: number): number {
  if (variables === 2) {
    // 2x2 grid: row in {0, 1}, col in {0, 1}
    return ((row & 1) << 1) | (col & 1);
  }
  if (variables === 3) {
    // 2x4 grid: row in {0, 1}, col Gray in {00:0, 01:1, 11:3, 10:2}
    const colGrayToBin = [0, 1, 3, 2];
    return ((row & 1) << 2) | colGrayToBin[col % 4];
  }
  if (variables === 4) {
    // 4x4 grid: row Gray in {00:0, 01:1, 11:3, 10:2}, col Gray in {00:0, 01:1, 11:3, 10:2}
    const grayToBin = [0, 1, 3, 2];
    return (grayToBin[row % 4] << 2) | grayToBin[col % 4];
  }
  if (variables === 5) {
    // 4x8 grid: col 0-3 is submap V0=0, col 4-7 is submap V0=1
    const submap = col >= 4 ? 1 : 0;
    const subCol = col % 4;
    const grayToBin = [0, 1, 3, 2];
    const base4Var = (grayToBin[row % 4] << 2) | grayToBin[subCol];
    return (submap << 4) | base4Var;
  }
  return 0;
}

/**
 * Generates initial K-Map grid for 2, 3, 4, or 5 variables in Blank, SOP, or POS mode
 */
export function createKMapGrid(
  variables: number,
  form: 'blank' | 'sop' | 'pos' = 'blank',
  mintermList: number[] = [],
  maxtermList: number[] = [],
  dontCareList: number[] = [],
  unselectedBlank = false
): string[][] {
  const numRows = variables === 2 ? 2 : variables === 3 ? 2 : 4;
  const numCols = variables === 2 ? 2 : variables === 5 ? 8 : 4;
  const grid: string[][] = [];

  const minSet = new Set(mintermList);
  const maxSet = new Set(maxtermList);
  const dcSet = new Set(dontCareList);

  for (let r = 0; r < numRows; r++) {
    const row: string[] = [];
    for (let c = 0; c < numCols; c++) {
      const idx = getKMapMintermIndex(variables, r, c);
      if (form === 'sop') {
        if (dcSet.has(idx)) {
          row.push('X');
        } else if (minSet.has(idx)) {
          row.push('1');
        } else {
          row.push(unselectedBlank ? '' : '0');
        }
      } else if (form === 'pos') {
        if (dcSet.has(idx)) {
          row.push('X');
        } else if (maxSet.has(idx)) {
          row.push('0');
        } else {
          row.push(unselectedBlank ? '' : '1');
        }
      } else {
        // Blank mode (for exercises / when no SOP/POS is given)
        row.push('');
      }
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Returns default variable names for N-variable K-Map
 */
export function getDefaultKMapVariableNames(variables: number): string[] {
  const defaults = ['A', 'B', 'C', 'D', 'E'];
  return defaults.slice(0, Math.max(2, Math.min(5, variables)));
}

/**
 * Evaluates N:1 Multiplexer (2:1, 4:1, 8:1, 16:1) output based on select lines
 */
export function evaluateMux(
  n: number,
  inputValues: number[] = [],
  channelIndex?: number
): { selectedChannel: number; outputValue: number } {
  const validN = [2, 4, 8, 16].includes(n) ? n : 4;
  const channel = typeof channelIndex === 'number'
    ? Math.max(0, Math.min(validN - 1, channelIndex))
    : 0;
  const output = inputValues[channel] ?? 0;
  return { selectedChannel: channel, outputValue: output };
}

/**
 * Evaluates Arithmetic Adder (Half Adder or Full Adder) outputs
 */
export function evaluateAdder(
  isFull: boolean,
  a: number,
  b: number,
  cin: number = 0
): { sum: number; cout: number; formulaStr: string } {
  const bitA = a & 1;
  const bitB = b & 1;
  const bitCin = cin & 1;

  if (isFull) {
    const sum = (bitA ^ bitB ^ bitCin) & 1;
    const cout = ((bitA & bitB) | (bitB & bitCin) | (bitA & bitCin)) & 1;
    const formulaStr = `${bitA} + ${bitB} + ${bitCin} = ${bitA + bitB + bitCin} → Sum=${sum}, Cout=${cout}`;
    return { sum, cout, formulaStr };
  } else {
    const sum = (bitA ^ bitB) & 1;
    const cout = (bitA & bitB) & 1;
    const formulaStr = `${bitA} + ${bitB} = ${bitA + bitB} → Sum=${sum}, Carry=${cout}`;
    return { sum, cout, formulaStr };
  }
}

/**
 * Evaluates Flip-Flop (D, JK, T, SR) next state Q(t+1) on active clock pulse
 */
export function evaluateFlipFlopNextState(
  ffType: 'D' | 'JK' | 'T' | 'SR',
  curQ: number,
  inputs: { d?: number; j?: number; k?: number; t?: number; s?: number; r?: number } = {}
): { nextQ: number; mode: string } {
  const q = curQ & 1;
  switch (ffType) {
    case 'D': {
      const d = (inputs.d ?? 0) & 1;
      return { nextQ: d, mode: d === 1 ? 'SET (Q=1)' : 'RESET (Q=0)' };
    }
    case 'JK': {
      const j = (inputs.j ?? 0) & 1;
      const k = (inputs.k ?? 0) & 1;
      if (j === 0 && k === 0) return { nextQ: q, mode: 'HOLD (No Change)' };
      if (j === 0 && k === 1) return { nextQ: 0, mode: 'RESET (Q=0)' };
      if (j === 1 && k === 0) return { nextQ: 1, mode: 'SET (Q=1)' };
      return { nextQ: 1 - q, mode: 'TOGGLE (Q=Q̅)' };
    }
    case 'T': {
      const t = (inputs.t ?? 1) & 1;
      if (t === 1) return { nextQ: 1 - q, mode: 'TOGGLE (Q=Q̅)' };
      return { nextQ: q, mode: 'HOLD (No Change)' };
    }
    case 'SR': {
      const s = (inputs.s ?? 0) & 1;
      const r = (inputs.r ?? 0) & 1;
      if (s === 0 && r === 0) return { nextQ: q, mode: 'HOLD (No Change)' };
      if (s === 0 && r === 1) return { nextQ: 0, mode: 'RESET (Q=0)' };
      if (s === 1 && r === 0) return { nextQ: 1, mode: 'SET (Q=1)' };
      return { nextQ: q, mode: 'INVALID (S=R=1 Forbidden)' };
    }
    default:
      return { nextQ: q, mode: 'HOLD' };
  }
}

/**
 * Evaluates 4-Bit Binary Counter state transition
 */
export function evaluateCounter(
  curVal: number,
  action: 'inc' | 'dec' | 'reset',
  maxVal = 15
): number {
  if (action === 'reset') return 0;
  if (action === 'inc') return (curVal + 1) % (maxVal + 1);
  if (action === 'dec') return (curVal - 1 + maxVal + 1) % (maxVal + 1);
  return curVal;
}

/**
 * Generates Truth Table for standard arithmetic circuits like Half Adder and Full Adder
 */
export function generateCircuitTruthTable(circuit: 'HalfAdder' | 'FullAdder'): {
  headers: string[];
  inputCount: number;
  rows: (number | string)[][];
} {
  if (circuit === 'HalfAdder') {
    return {
      headers: ['A', 'B', 'Sum (S)', 'Carry (C)'],
      inputCount: 2,
      rows: [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [1, 0, 1, 0],
        [1, 1, 0, 1],
      ],
    };
  } else {
    // Full Adder (A, B, Cin -> Sum, Cout)
    const combinations = generateNBitCombinations(3);
    const rows = combinations.map(([a, b, cin]) => {
      const sum = a ^ b ^ cin;
      const cout = (a & b) | (b & cin) | (a & cin);
      return [a, b, cin, sum, cout];
    });
    return {
      headers: ['A', 'B', 'Cin', 'Sum (S)', 'Cout'],
      inputCount: 3,
      rows,
    };
  }
}

/**
 * Dynamically computes authentic 2-input (or 1-input for NOT) Truth Table
 */
export function generateTruthTableData(gateType: LogicGateType): {
  headers: string[];
  inputCount: number;
  rows: number[][];
} {
  if (gateType === 'NOT') {
    return {
      headers: ['A', 'Y = NOT A'],
      inputCount: 1,
      rows: [
        [0, 1],
        [1, 0],
      ],
    };
  }

  const combinations = generateNBitCombinations(2);

  const rows = combinations.map(([a, b]) => {
    const out = evaluateLogicGate(gateType, a === 1, b === 1) ? 1 : 0;
    return [a, b, out];
  });

  return {
    headers: ['A', 'B', `Y = ${gateType}`],
    inputCount: 2,
    rows,
  };
}

// ─── Digital Logic Tools ──────────────────────────────────────────────────────

const digitalLogicTools: SubjectTool[] = [
  // 1. Logic Gates: AND, OR, NOT, NAND, NOR, XOR, XNOR
  {
    id: 'logic-gate-and',
    subjectId: 'digitalLogic',
    name: 'AND Gate',
    category: 'Logic Gates',
    icon: '⊓',
    description: '2-input AND gate with flat input face and rounded output curve (Y = A · B)',
    badge: 'Gate',
    tags: ['and gate', 'logic', 'boolean', 'conjunction'],
    interactiveModal: 'logicGate',
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 170, 95, {
        params: { gateType: 'AND', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y', fontSize: 14 },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'AND Gate (Y = A·B)',
      });
      executeAddObject(context, gate, 'Insert AND Gate');
    },
  },
  {
    id: 'logic-gate-or',
    subjectId: 'digitalLogic',
    name: 'OR Gate',
    category: 'Logic Gates',
    icon: '⊔',
    description: '2-input OR gate with curved input back and pointed output tip (Y = A + B)',
    badge: 'Gate',
    tags: ['or gate', 'logic', 'boolean', 'disjunction'],
    interactiveModal: 'logicGate',
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 170, 95, {
        params: { gateType: 'OR', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y', fontSize: 14 },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'OR Gate (Y = A+B)',
      });
      executeAddObject(context, gate, 'Insert OR Gate');
    },
  },
  {
    id: 'logic-gate-not',
    subjectId: 'digitalLogic',
    name: 'NOT Gate (Inverter)',
    category: 'Logic Gates',
    icon: '▷',
    description: 'Single-input NOT inverter gate with triangle body and inversion bubble (Y = ¬A)',
    badge: 'Gate',
    tags: ['not gate', 'inverter', 'bubble', 'negation'],
    interactiveModal: 'logicGate',
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 160, 85, {
        params: { gateType: 'NOT', inputs: 1, labelA: 'A', labelY: 'Y', fontSize: 14 },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'NOT Gate (Y = A̅)',
      });
      executeAddObject(context, gate, 'Insert NOT Inverter Gate');
    },
  },
  {
    id: 'logic-gate-nand',
    subjectId: 'digitalLogic',
    name: 'NAND Gate',
    category: 'Logic Gates',
    icon: '⊼',
    description: 'Universal NAND gate (AND shape with inversion circle at output tip)',
    badge: 'Gate',
    tags: ['nand gate', 'universal gate', 'bubble'],
    interactiveModal: 'logicGate',
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 180, 95, {
        params: { gateType: 'NAND', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y', fontSize: 14 },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'NAND Gate (Y = (A·B)̅)',
      });
      executeAddObject(context, gate, 'Insert NAND Gate');
    },
  },
  {
    id: 'logic-gate-nor',
    subjectId: 'digitalLogic',
    name: 'NOR Gate',
    category: 'Logic Gates',
    icon: '⊽',
    description: 'Universal NOR gate (OR shape with inversion circle at output tip)',
    badge: 'Gate',
    tags: ['nor gate', 'universal gate', 'bubble'],
    interactiveModal: 'logicGate',
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 180, 95, {
        params: { gateType: 'NOR', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y', fontSize: 14 },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'NOR Gate (Y = (A+B)̅)',
      });
      executeAddObject(context, gate, 'Insert NOR Gate');
    },
  },
  {
    id: 'logic-gate-xor',
    subjectId: 'digitalLogic',
    name: 'XOR Gate',
    category: 'Logic Gates',
    icon: '⊕',
    description: 'Exclusive-OR gate with dual curved input back (Y = A ⊕ B)',
    badge: 'Gate',
    tags: ['xor gate', 'exclusive or', 'parity'],
    interactiveModal: 'logicGate',
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 180, 95, {
        params: { gateType: 'XOR', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y', fontSize: 14 },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'XOR Gate (Y = A⊕B)',
      });
      executeAddObject(context, gate, 'Insert XOR Gate');
    },
  },
  {
    id: 'logic-gate-xnor',
    subjectId: 'digitalLogic',
    name: 'XNOR Gate',
    category: 'Logic Gates',
    icon: '⊙',
    description: 'Exclusive-NOR equivalence gate (XOR shape with inversion circle at output)',
    badge: 'Gate',
    tags: ['xnor gate', 'equivalence', 'bubble'],
    interactiveModal: 'logicGate',
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 185, 95, {
        params: { gateType: 'XNOR', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y', fontSize: 14 },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'XNOR Gate (Y = (A⊕B)̅)',
      });
      executeAddObject(context, gate, 'Insert XNOR Gate');
    },
  },

  // 2. Dynamic Truth Table Generator
  {
    id: 'logic-truth-table',
    subjectId: 'digitalLogic',
    name: 'Truth Table Generator',
    category: 'Truth Tables & K-Maps',
    icon: '📋',
    description: 'Interactive N-bit truth table generator with configurable output columns and blank exercise rows',
    badge: 'Generator',
    tags: ['truth table', 'boolean', 'inputs', 'outputs', '0 and 1', 'n bits', 'half adder'],
    interactiveModal: 'truthTable',
    execute: (context, options) => {
      const gateType = (options?.gateType as LogicGateType) || 'XOR';
      const data = generateTruthTableData(gateType);
      const table = createShape('truthTable', 220, 160, 440, 280, {
        params: {
          gateType,
          inputCount: data.inputCount,
          headers: data.headers,
          rows: data.rows,
          fontSize: 14,
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: `${gateType} Truth Table`,
      });
      executeAddObject(context, table, `Insert ${gateType} Truth Table`);
    },
  },

  // 3. Karnaugh Map (K-Map)
  {
    id: 'logic-karnaugh-map',
    subjectId: 'digitalLogic',
    name: 'Karnaugh Map (K-Map)',
    category: 'Truth Tables & K-Maps',
    icon: '🔲',
    description: '2, 3, 4, or 5-variable Karnaugh Map with textbook Gray code, decimal cell indices, and SOP/POS canonical support',
    badge: 'K-Map',
    tags: ['karnaugh map', 'k-map', 'simplification', 'sop', 'pos', 'gray code', 'canonical', '5 variable'],
    interactiveModal: 'karnaughMap',
    execute: (context, options) => {
      const vars = options?.variables || 3;
      const varNames = options?.varNames || getDefaultKMapVariableNames(vars);
      const grid = createKMapGrid(vars, 'blank');
      const width = vars === 5 ? 740 : vars === 4 ? 460 : vars === 2 ? 340 : 440;
      const height = vars === 4 || vars === 5 ? 420 : 300;
      const kmap = createShape('karnaughMap', 200, 150, width, height, {
        params: {
          variables: vars,
          varNames,
          form: 'blank',
          grid,
          fontSize: 14,
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: `${vars}-Variable Karnaugh Map`,
      });
      executeAddObject(context, kmap, `Insert ${vars}-Variable Karnaugh Map`);
    },
  },

  // 4. Multiplexer (MUX) & Demultiplexer (DEMUX)
  {
    id: 'logic-mux-demux',
    subjectId: 'digitalLogic',
    name: 'Multiplexer (N:1 MUX)',
    category: 'Combinational Blocks',
    icon: '🔀',
    description: 'Customizable N:1 Multiplexer (2:1, 4:1, 8:1, 16:1) with live input routing and select line controls',
    badge: 'Combinational',
    tags: ['mux', 'multiplexer', 'selector', 'demux', '2:1', '4:1', '8:1', '16:1', 'n:1'],
    interactiveModal: 'digitalCircuit',
    execute: (context, options) => {
      const size = options?.muxSize || 4;
      const inputs = Array.from({ length: size }, (_, i) => `D${i}`);
      const selectCount = Math.ceil(Math.log2(size));
      const selects = Array.from({ length: selectCount }, (_, i) => `S${i}`);
      const inputValues = Array.from({ length: size }, (_, i) => (i % 2 === 1 ? 1 : 0));

      const mux = createShape('logicGate', 240, 160, 260, size === 8 ? 340 : size === 16 ? 480 : 260, {
        params: {
          blockType: 'MUX',
          muxSize: size,
          inputs,
          selects,
          inputValues,
          selectedChannel: 1,
          output: 'Y',
          fontSize: 14,
          showLabels: true,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: `${size}:1 Multiplexer (MUX)`,
      });
      executeAddObject(context, mux, `Insert ${size}:1 Multiplexer`);
    },
  },

  // 5. Half Adder & Full Adder
  {
    id: 'logic-adders',
    subjectId: 'digitalLogic',
    name: 'Arithmetic Adders (Half / Full)',
    category: 'Combinational Blocks',
    icon: '➕',
    description: 'Interactive Half Adder and Full Adder with live bit inputs and Sum/Cout arithmetic computation',
    badge: 'Combinational',
    tags: ['adder', 'half adder', 'full adder', 'sum', 'carry', 'cout'],
    interactiveModal: 'digitalCircuit',
    execute: (context, options) => {
      const isFull = options?.full ?? true;
      const adder = createShape('logicGate', 240, 170, 260, 220, {
        params: {
          blockType: isFull ? 'FullAdder' : 'HalfAdder',
          inputA: 1,
          inputB: 0,
          cin: isFull ? 1 : 0,
          inputs: isFull ? ['A', 'B', 'Cin'] : ['A', 'B'],
          outputs: ['Sum (S)', isFull ? 'Cout' : 'Carry (C)'],
          fontSize: 14,
          showLabels: true,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: isFull ? 'Full Adder (FA)' : 'Half Adder (HA)',
      });
      executeAddObject(context, adder, `Insert ${isFull ? 'Full' : 'Half'} Adder`);
    },
  },

  // 6. Flip-Flops & Registers
  {
    id: 'logic-flip-flops',
    subjectId: 'digitalLogic',
    name: 'Flip-Flops (D / JK / SR / T)',
    category: 'Sequential Blocks',
    icon: '⏱️',
    description: 'Interactive clocked flip-flop (D, JK, T, SR) with active inputs and live clock state transitions',
    badge: 'Sequential',
    tags: ['flip-flop', 'd flip flop', 'jk', 't flip flop', 'sr flip flop', 'clock', 'sequential'],
    interactiveModal: 'digitalCircuit',
    execute: (context, options) => {
      const type = (options?.type || 'D') as 'D' | 'JK' | 'T' | 'SR';
      const ff = createShape('logicGate', 240, 170, 220, 240, {
        params: {
          blockType: 'FlipFlop',
          ffType: type,
          inputD: 1,
          inputJ: 1,
          inputK: 0,
          inputT: 1,
          inputS: 1,
          inputR: 0,
          stateQ: 0,
          fontSize: 14,
          showLabels: true,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: `${type} Flip-Flop`,
      });
      executeAddObject(context, ff, `Insert ${type} Flip-Flop`);
    },
  },

  // 7. Binary Counter & Register
  {
    id: 'logic-counter-register',
    subjectId: 'digitalLogic',
    name: '4-Bit Binary Counter',
    category: 'Sequential Blocks',
    icon: '🔢',
    description: 'Interactive 4-bit synchronous binary counter with live LED readout, clock pulse, and reset',
    badge: 'Sequential',
    tags: ['counter', 'binary counter', 'register', 'ripple', '4-bit', '74ls161'],
    interactiveModal: 'digitalCircuit',
    execute: (context) => {
      const counter = createShape('logicGate', 220, 170, 280, 230, {
        params: {
          blockType: 'Counter4',
          countValue: 0,
          fontSize: 14,
          showLabels: true,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: '4-Bit Binary Counter',
      });
      executeAddObject(context, counter, 'Insert 4-Bit Binary Counter');
    },
  },
];

/**
 * Templates for Digital Logic
 */
const digitalLogicTemplates: SubjectTemplate[] = [
  {
    id: 'logic-tmpl-half-adder',
    subjectId: 'digitalLogic',
    name: 'Half Adder Circuit Architecture',
    category: 'Lesson Templates',
    icon: '➕',
    description: 'Half Adder constructed using an XOR gate (Sum) and an AND gate (Carry)',
    createObjects: (origin) => {
      const xorGate = createShape('logicGate', origin.x + 100, origin.y + 40, 180, 95, {
        params: { gateType: 'XOR', labelA: 'A', labelB: 'B', labelY: 'Sum = A⊕B', fontSize: 14 },
      });
      const andGate = createShape('logicGate', origin.x + 100, origin.y + 160, 180, 95, {
        params: { gateType: 'AND', labelA: 'A', labelB: 'B', labelY: 'Carry = A·B', fontSize: 14 },
      });
      const tableData = generateCircuitTruthTable('HalfAdder');
      const table = createShape('truthTable', origin.x + 380, origin.y + 40, 420, 240, {
        params: {
          headers: tableData.headers,
          inputCount: tableData.inputCount,
          rows: tableData.rows,
          fontSize: 14,
        },
      });
      return [xorGate, andGate, table];
    },
  },
];

export const DigitalLogicModule: SubjectModule = {
  id: 'digitalLogic',
  name: 'Digital Logic',
  icon: '⚡',
  description: 'Logic gates, truth tables, boolean expressions, Karnaugh maps, MUX/DEMUX, adders, flip-flops',
  tools: digitalLogicTools,
  templates: digitalLogicTemplates,
};
