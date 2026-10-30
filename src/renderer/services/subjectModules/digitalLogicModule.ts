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
 * Dynamically computes authentic 2-input (or 1-input for NOT) Truth Table
 */
export function generateTruthTableData(gateType: LogicGateType): {
  headers: string[];
  rows: number[][];
} {
  if (gateType === 'NOT') {
    return {
      headers: ['A', 'Y = NOT A'],
      rows: [
        [0, 1],
        [1, 0],
      ],
    };
  }

  const combinations = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];

  const rows = combinations.map(([a, b]) => {
    const out = evaluateLogicGate(gateType, a === 1, b === 1) ? 1 : 0;
    return [a, b, out];
  });

  return {
    headers: ['A', 'B', `Y = ${gateType}`],
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
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 160, 90, {
        params: { gateType: 'AND', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y' },
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
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 160, 90, {
        params: { gateType: 'OR', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y' },
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
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 150, 80, {
        params: { gateType: 'NOT', inputs: 1, labelA: 'A', labelY: 'Y' },
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
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 170, 90, {
        params: { gateType: 'NAND', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y' },
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
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 170, 90, {
        params: { gateType: 'NOR', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y' },
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
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 170, 90, {
        params: { gateType: 'XOR', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y' },
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
    execute: (context) => {
      const gate = createShape('logicGate', 250, 200, 175, 90, {
        params: { gateType: 'XNOR', inputs: 2, labelA: 'A', labelB: 'B', labelY: 'Y' },
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
    description: 'Interactive truth table generator for any gate or custom boolean expression',
    badge: 'Generator',
    tags: ['truth table', 'boolean', 'inputs', 'outputs', '0 and 1'],
    interactiveModal: 'truthTable',
    execute: (context, options) => {
      const gateType = (options?.gateType as LogicGateType) || 'XOR';
      const data = generateTruthTableData(gateType);
      const table = createShape('truthTable', 220, 160, 420, 280, {
        params: {
          gateType,
          headers: data.headers,
          rows: data.rows,
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
    description: '2, 3, or 4-variable Karnaugh Map with Gray-code column/row headers (00, 01, 11, 10)',
    badge: 'K-Map',
    tags: ['karnaugh map', 'k-map', 'simplification', 'sop', 'pos', 'gray code'],
    execute: (context, options) => {
      const vars = options?.variables || 3;
      const kmap = createShape('karnaughMap', 220, 160, 460, 320, {
        params: {
          variables: vars,
          rowVar: 'A',
          colVars: 'BC',
          grid: [
            ['0', '1', '1', '0'],
            ['1', '1', '0', '0'],
          ],
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
    name: 'Multiplexer (4:1 MUX)',
    category: 'Combinational Blocks',
    icon: '🔀',
    description: 'Trapezoidal 4-to-1 data selector with input lines D0-D3, select lines S0-S1, and output Y',
    badge: 'Combinational',
    tags: ['mux', 'multiplexer', 'selector', 'demux', '4:1'],
    execute: (context) => {
      const mux = createShape('logicGate', 240, 180, 200, 260, {
        params: {
          blockType: 'MUX4',
          inputs: ['D0', 'D1', 'D2', 'D3'],
          selects: ['S0', 'S1'],
          output: 'Y',
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: '4:1 Multiplexer (MUX)',
      });
      executeAddObject(context, mux, 'Insert 4:1 Multiplexer');
    },
  },

  // 5. Half Adder & Full Adder
  {
    id: 'logic-adders',
    subjectId: 'digitalLogic',
    name: 'Arithmetic Adders (Half / Full)',
    category: 'Combinational Blocks',
    icon: '➕',
    description: 'Full adder combinational block with inputs A, B, Cin and outputs Sum (S) and Carry (Cout)',
    badge: 'Combinational',
    tags: ['adder', 'half adder', 'full adder', 'sum', 'carry'],
    execute: (context, options) => {
      const isFull = options?.full ?? true;
      const adder = createShape('logicGate', 240, 180, 220, 200, {
        params: {
          blockType: isFull ? 'FullAdder' : 'HalfAdder',
          inputs: isFull ? ['A', 'B', 'Cin'] : ['A', 'B'],
          outputs: ['Sum (S)', 'Cout'],
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
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
    description: 'Clocked bistable multivibrator with D/CLK inputs and Q/Q̅ complementary outputs',
    badge: 'Sequential',
    tags: ['flip-flop', 'd flip flop', 'jk', 'clock', 'sequential', 'register'],
    execute: (context, options) => {
      const type = options?.type || 'D';
      const ff = createShape('logicGate', 240, 180, 180, 220, {
        params: {
          blockType: 'FlipFlop',
          ffType: type,
          inputs: [type, 'CLK'],
          outputs: ['Q', 'Q̅'],
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
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
    description: '4-bit synchronous binary ripple counter with CLK, Reset, and Q0-Q3 outputs',
    badge: 'Sequential',
    tags: ['counter', 'binary counter', 'register', 'ripple', '4-bit'],
    execute: (context) => {
      const counter = createShape('logicGate', 220, 180, 260, 200, {
        params: {
          blockType: 'Counter4',
          inputs: ['CLK', 'RST'],
          outputs: ['Q0', 'Q1', 'Q2', 'Q3'],
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
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
      const xorGate = createShape('logicGate', origin.x + 100, origin.y + 40, 160, 80, {
        params: { gateType: 'XOR', labelA: 'A', labelB: 'B', labelY: 'Sum = A⊕B' },
      });
      const andGate = createShape('logicGate', origin.x + 100, origin.y + 160, 160, 80, {
        params: { gateType: 'AND', labelA: 'A', labelB: 'B', labelY: 'Carry = A·B' },
      });
      const tableData = generateTruthTableData('XOR');
      const table = createShape('truthTable', origin.x + 360, origin.y + 40, 360, 220, {
        params: {
          headers: ['A', 'B', 'Sum', 'Carry'],
          rows: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 0, 1, 0],
            [1, 1, 0, 1],
          ],
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
