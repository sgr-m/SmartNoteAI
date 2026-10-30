/**
 * Flowcharts Module (Section 16.4 & 16.5)
 * Flowchart symbols, decision diamonds, process blocks, input/output parallelograms, connectors, step numbering
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, executeAddObject, executeAddMultipleObjects } from './commonHelpers';

export type FlowchartNodeType =
  | 'terminator'
  | 'process'
  | 'decision'
  | 'inputOutput'
  | 'predefinedProcess'
  | 'connector'
  | 'loop';

const flowchartTools: SubjectTool[] = [
  // 1. Terminator (Start / End)
  {
    id: 'flow-terminator',
    subjectId: 'flowcharts',
    name: 'Terminator (Start / End)',
    category: 'Flowchart Symbols',
    icon: '⬭',
    description: 'Rounded pill shape representing starting or ending points of an algorithm',
    badge: 'Symbol',
    tags: ['flowchart', 'terminator', 'start', 'end', 'stop'],
    execute: (context, options) => {
      const label = options?.label || 'Start';
      const term = createShape('flowchartNode', 250, 200, 180, 70, {
        params: { nodeType: 'terminator', label },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label,
      });
      executeAddObject(context, term, `Insert Flowchart Terminator (${label})`);
    },
  },

  // 2. Process (Rectangle)
  {
    id: 'flow-process',
    subjectId: 'flowcharts',
    name: 'Process (Action Block)',
    category: 'Flowchart Symbols',
    icon: '▭',
    description: 'Rectangular action step for operations, assignments, and calculations',
    badge: 'Symbol',
    tags: ['flowchart', 'process', 'action', 'assignment'],
    execute: (context, options) => {
      const label = options?.label || 'Calculate Result';
      const proc = createShape('flowchartNode', 240, 200, 200, 80, {
        params: { nodeType: 'process', label },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label,
      });
      executeAddObject(context, proc, `Insert Flowchart Process (${label})`);
    },
  },

  // 3. Decision (Diamond)
  {
    id: 'flow-decision',
    subjectId: 'flowcharts',
    name: 'Decision (Diamond)',
    category: 'Flowchart Symbols',
    icon: '◇',
    description: 'Diamond shape for conditional branching (Yes/No, True/False)',
    badge: 'Symbol',
    tags: ['flowchart', 'decision', 'branch', 'diamond', 'condition'],
    execute: (context, options) => {
      const label = options?.label || 'Is Valid ?';
      const dec = createShape('flowchartNode', 240, 180, 180, 120, {
        params: { nodeType: 'decision', label },
        strokeColor: '#f59e0b',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label,
      });
      executeAddObject(context, dec, `Insert Decision Diamond (${label})`);
    },
  },

  // 4. Input / Output (Parallelogram)
  {
    id: 'flow-io',
    subjectId: 'flowcharts',
    name: 'Input / Output (Parallelogram)',
    category: 'Flowchart Symbols',
    icon: '▱',
    description: 'Slanted parallelogram for user input, data reading, and printing output',
    badge: 'Symbol',
    tags: ['flowchart', 'input', 'output', 'io', 'read', 'print'],
    execute: (context, options) => {
      const label = options?.label || 'Read Input';
      const io = createShape('flowchartNode', 240, 200, 200, 80, {
        params: { nodeType: 'inputOutput', label },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label,
      });
      executeAddObject(context, io, `Insert Input/Output Block (${label})`);
    },
  },

  // 5. Predefined Subroutine / Function Call
  {
    id: 'flow-subroutine',
    subjectId: 'flowcharts',
    name: 'Predefined Process / Subroutine',
    category: 'Flowchart Symbols',
    icon: '◫',
    description: 'Rectangle with double vertical bars indicating an external function or procedure',
    badge: 'Symbol',
    tags: ['flowchart', 'subroutine', 'function', 'procedure'],
    execute: (context) => {
      const sub = createShape('flowchartNode', 240, 200, 210, 80, {
        params: { nodeType: 'predefinedProcess', label: 'Call SortAlgorithm()' },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'Subroutine: SortAlgorithm()',
      });
      executeAddObject(context, sub, 'Insert Subroutine Block');
    },
  },

  // 6. Loop / Preparation Symbol (Hexagon)
  {
    id: 'flow-loop',
    subjectId: 'flowcharts',
    name: 'Loop / Preparation (Hexagon)',
    category: 'Flowchart Symbols',
    icon: '⬡',
    description: 'Hexagon loop initialization symbol for FOR / WHILE iteration bounds',
    badge: 'Symbol',
    tags: ['flowchart', 'loop', 'iteration', 'for loop', 'hexagon'],
    execute: (context) => {
      const loop = createShape('flowchartNode', 240, 200, 200, 80, {
        params: { nodeType: 'loop', label: 'i = 0 to N-1' },
        strokeColor: '#10b981',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.92)',
        label: 'Loop Header (i = 0 to N-1)',
      });
      executeAddObject(context, loop, 'Insert Loop Symbol');
    },
  },
];

const flowchartTemplates: SubjectTemplate[] = [
  {
    id: 'flow-tmpl-linear-pipeline',
    subjectId: 'flowcharts',
    name: 'Standard Decision Pipeline',
    category: 'Flowchart Templates',
    icon: '🔀',
    description: 'Complete pipeline with Start, Input, Decision, Process, and End terminator',
    createObjects: (origin) => {
      const term1 = createShape('flowchartNode', origin.x + 80, origin.y, 160, 60, {
        params: { nodeType: 'terminator', label: 'Start' },
      });
      const input = createShape('flowchartNode', origin.x + 60, origin.y + 100, 200, 70, {
        params: { nodeType: 'inputOutput', label: 'Read Age' },
      });
      const decision = createShape('flowchartNode', origin.x + 70, origin.y + 210, 180, 110, {
        params: { nodeType: 'decision', label: 'Age >= 18 ?' },
        strokeColor: '#f59e0b',
      });
      const proc = createShape('flowchartNode', origin.x + 310, origin.y + 225, 180, 75, {
        params: { nodeType: 'process', label: 'Allow Voting' },
      });
      const term2 = createShape('flowchartNode', origin.x + 80, origin.y + 360, 160, 60, {
        params: { nodeType: 'terminator', label: 'End' },
      });
      return [term1, input, decision, proc, term2];
    },
  },
];

export const FlowchartModule: SubjectModule = {
  id: 'flowcharts',
  name: 'Flowcharts',
  icon: '🔀',
  description: 'Flowchart builder, decision diamonds, process blocks, I/O parallelograms, loop symbols',
  tools: flowchartTools,
  templates: flowchartTemplates,
};
