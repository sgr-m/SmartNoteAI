/**
 * Computer Science Teaching Module (Section 16.4)
 * Code blocks, pseudocode, flowchart builder, trace tables, stack, memory,
 * linked lists, trees, graphs, sorting/searching, ER diagrams, SQL, CPU architecture, network topologies.
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, createTextCard, executeAddObject, executeAddMultipleObjects } from './commonHelpers';
import { ShapeObject, TextObject } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export interface CodeBlockOptions {
  language: 'python' | 'javascript' | 'java' | 'cpp' | 'sql' | 'pseudocode';
  code: string;
  theme?: 'dark' | 'light';
  fontSize?: number;
}

export interface TraceTableRow {
  step: number;
  line: number;
  variables: Record<string, any>;
  condition?: string;
  output?: string;
}

export interface MemorySegment {
  address: string;
  variable: string;
  type: string;
  value: string;
}

export interface LinkedListNodeDef {
  data: string | number;
  address?: string;
  nextAddress?: string | null;
}

export interface TreeNodeDef {
  id: string;
  val: string | number;
  left?: TreeNodeDef;
  right?: TreeNodeDef;
}

// ─── Computer Science Tools ───────────────────────────────────────────────────

const csTools: SubjectTool[] = [
  // 1. Syntax-Highlighted Code Block
  {
    id: 'cs-code-block',
    subjectId: 'computerScience',
    name: 'Syntax-Highlighted Code Block',
    category: 'Code & Pseudocode',
    icon: '💻',
    description: 'Formatted code block with line numbering and syntax tokens for Python, JS, C++, Java, SQL',
    badge: 'Code Block',
    tags: ['code', 'syntax', 'python', 'javascript', 'sql', 'highlighter'],
    interactiveModal: 'codeEditor',
    execute: (context, options) => {
      const language = options?.language || 'python';
      const code = options?.code || 'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1';

      const codeObj = createShape('csDiagram', 200, 160, 500, 320, {
        params: {
          diagramType: 'codeBlock',
          language,
          code,
          fontSize: 14,
        },
        fillColor: 'rgba(15, 23, 42, 0.96)',
        strokeColor: '#38bdf8',
        label: `${language.toUpperCase()} Code Block`,
      });
      executeAddObject(context, codeObj, `Insert ${language.toUpperCase()} Code Block`);
    },
  },

  // 2. Editable Pseudocode
  {
    id: 'cs-pseudocode',
    subjectId: 'computerScience',
    name: 'Standardized Pseudocode',
    category: 'Code & Pseudocode',
    icon: '📝',
    description: 'Classroom pseudocode format with keywords (PROCEDURE, FOR, WHILE, IF/ELSE, RETURN)',
    badge: 'Pseudocode',
    tags: ['pseudocode', 'algorithm', 'keywords', 'logic'],
    execute: (context) => {
      const pseudocode = `PROCEDURE LinearSearch(A, target)\n  FOR i ← 0 TO LENGTH(A) - 1 DO\n    IF A[i] = target THEN\n      RETURN i\n    END IF\n  END FOR\n  RETURN -1\nEND PROCEDURE`;
      const pseudoObj = createShape('csDiagram', 220, 160, 480, 280, {
        params: {
          diagramType: 'pseudocode',
          code: pseudocode,
        },
        fillColor: 'rgba(15, 23, 42, 0.95)',
        strokeColor: '#a855f7',
        label: 'Pseudocode: LinearSearch',
      });
      executeAddObject(context, pseudoObj, 'Insert Pseudocode Block');
    },
  },

  // 3. Flowchart Builder
  {
    id: 'cs-flowchart-builder',
    subjectId: 'computerScience',
    name: 'Flowchart Builder',
    category: 'Flowcharts',
    icon: '🔀',
    description: 'Construct full flowcharts with Terminator, Decision diamond, Process rectangle, and connectors',
    badge: 'Flowchart',
    tags: ['flowchart', 'decision', 'process', 'terminator', 'arrows'],
    interactiveModal: 'flowchartBuilder',
    execute: (context) => {
      const flowchart = createShape('csDiagram', 200, 140, 520, 420, {
        params: {
          diagramType: 'flowchart',
          nodes: [
            { id: '1', type: 'terminator', label: 'Start', x: 260, y: 160 },
            { id: '2', type: 'input', label: 'Read N', x: 260, y: 220 },
            { id: '3', type: 'decision', label: 'N > 0 ?', x: 260, y: 300 },
            { id: '4', type: 'process', label: 'Print Positive', x: 400, y: 300 },
            { id: '5', type: 'terminator', label: 'End', x: 260, y: 400 },
          ],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Algorithm Flowchart',
      });
      executeAddObject(context, flowchart, 'Insert Algorithm Flowchart');
    },
  },

  // 4. Algorithm Trace Table
  {
    id: 'cs-trace-table',
    subjectId: 'computerScience',
    name: 'Algorithm Trace Table',
    category: 'Execution & Tracing',
    icon: '📊',
    description: 'Execution trace table tracking iteration step, code line, variables, condition, and output',
    badge: 'Trace Table',
    tags: ['trace table', 'dry run', 'variables', 'iteration'],
    execute: (context) => {
      const trace = createShape('csDiagram', 200, 160, 540, 320, {
        params: {
          diagramType: 'traceTable',
          columns: ['Step', 'Line', 'i', 'sum', 'i < 5 ?', 'Output'],
          rows: [
            ['Init', '1-2', '0', '0', 'True', '-'],
            ['1', '3-4', '1', '1', 'True', '-'],
            ['2', '3-4', '2', '3', 'True', '-'],
            ['3', '3-4', '3', '6', 'True', '-'],
            ['4', '3-4', '4', '10', 'False', '10'],
          ],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Algorithm Trace Table',
      });
      executeAddObject(context, trace, 'Insert Algorithm Trace Table');
    },
  },

  // 5. Call-Stack Diagram
  {
    id: 'cs-call-stack',
    subjectId: 'computerScience',
    name: 'Call Stack Diagram',
    category: 'Memory & Execution',
    icon: '📚',
    description: 'LIFO execution stack frames with function activation records, parameters, and return addresses',
    badge: 'Stack',
    tags: ['call stack', 'stack frames', 'recursion', 'lifo', 'activation record'],
    execute: (context) => {
      const stack = createShape('csDiagram', 240, 160, 360, 380, {
        params: {
          diagramType: 'callStack',
          frames: [
            { func: 'factorial(n=1)', vars: 'n=1, return 1', isTop: true },
            { func: 'factorial(n=2)', vars: 'n=2, waiting on factorial(1)' },
            { func: 'factorial(n=3)', vars: 'n=3, waiting on factorial(2)' },
            { func: 'main()', vars: 'result = factorial(3)' },
          ],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Call Stack (Recursion Frames)',
      });
      executeAddObject(context, stack, 'Insert Call Stack Diagram');
    },
  },

  // 6. Memory Layout & Pointer Diagram
  {
    id: 'cs-memory-pointer',
    subjectId: 'computerScience',
    name: 'Memory Layout & Pointers',
    category: 'Memory & Execution',
    icon: '🧠',
    description: 'Hex address grid with variable names, values, and memory pointer arrows (0x7ffe...)',
    badge: 'Memory',
    tags: ['memory', 'pointer', 'addresses', 'heap', 'stack', 'hex'],
    execute: (context) => {
      const mem = createShape('csDiagram', 200, 160, 520, 320, {
        params: {
          diagramType: 'memoryLayout',
          cells: [
            { address: '0x1000', name: 'ptr', type: 'int*', value: '0x1008', pointsTo: '0x1008' },
            { address: '0x1004', name: 'count', type: 'int', value: '42' },
            { address: '0x1008', name: '*ptr', type: 'int', value: '99' },
            { address: '0x100C', name: 'flag', type: 'bool', value: 'true' },
          ],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Memory Layout & Pointers',
      });
      executeAddObject(context, mem, 'Insert Memory Layout & Pointer Diagram');
    },
  },

  // 7. Linked-List Diagram
  {
    id: 'cs-linked-list',
    subjectId: 'computerScience',
    name: 'Linked List Diagram',
    category: 'Data Structures',
    icon: '🔗',
    description: 'Singly or doubly linked list with head pointer, node data, next pointers, and NULL terminator',
    badge: 'Data Structure',
    tags: ['linked list', 'nodes', 'pointers', 'head', 'null'],
    execute: (context) => {
      const list = createShape('csDiagram', 180, 200, 600, 140, {
        params: {
          diagramType: 'linkedList',
          nodes: ['12', '99', '37', '5'],
          isDoubly: false,
        },
        fillColor: 'rgba(15, 23, 42, 0.92)',
        strokeColor: '#38bdf8',
        label: 'Singly Linked List (HEAD ➔ 12 ➔ 99 ➔ 37 ➔ 5 ➔ NULL)',
      });
      executeAddObject(context, list, 'Insert Linked List Diagram');
    },
  },

  // 8. Tree & Graph Diagram
  {
    id: 'cs-tree-graph',
    subjectId: 'computerScience',
    name: 'Binary Search Tree & Graph',
    category: 'Data Structures',
    icon: '🌳',
    description: 'Hierarchical tree structure with root node, left/right subtrees, edge labels, and leaf nodes',
    badge: 'Tree',
    tags: ['tree', 'bst', 'graph', 'root', 'binary tree', 'edges'],
    execute: (context) => {
      const tree = createShape('csDiagram', 220, 140, 480, 360, {
        params: {
          diagramType: 'binaryTree',
          rootVal: '50',
          leftVal: '30',
          rightVal: '70',
          leftLeftVal: '20',
          leftRightVal: '40',
          rightLeftVal: '60',
          rightRightVal: '80',
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Binary Search Tree (BST)',
      });
      executeAddObject(context, tree, 'Insert Binary Tree Diagram');
    },
  },

  // 9. Sorting & Searching Demonstration
  {
    id: 'cs-sorting-demo',
    subjectId: 'computerScience',
    name: 'Sorting / Searching Demonstration',
    category: 'Algorithms',
    icon: '📶',
    description: 'Bar array comparison showing indexed elements, active pointers (low, mid, high), and swap states',
    badge: 'Algorithm',
    tags: ['sorting', 'bubble sort', 'binary search', 'array', 'pointers'],
    execute: (context) => {
      const sortDemo = createShape('csDiagram', 200, 160, 520, 320, {
        params: {
          diagramType: 'sortingArray',
          array: [14, 33, 27, 10, 35, 19, 42, 44],
          activeIndices: [2, 3], // Comparing 27 and 10
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Sorting Array Demonstration (Bubble Sort Step)',
      });
      executeAddObject(context, sortDemo, 'Insert Sorting Array Demonstration');
    },
  },

  // 10. Database ER & Schema Designer
  {
    id: 'cs-er-database',
    subjectId: 'computerScience',
    name: 'Database Table & ER Diagram',
    category: 'Databases & SQL',
    icon: '🗄️',
    description: 'Relational table schema with Primary Keys (PK), Foreign Keys (FK), and field data types',
    badge: 'Database',
    tags: ['database', 'table', 'sql', 'er diagram', 'pk', 'fk', 'schema'],
    execute: (context) => {
      const table = createShape('csDiagram', 220, 160, 460, 340, {
        params: {
          diagramType: 'databaseTable',
          tableName: 'Students',
          columns: [
            { name: 'id', type: 'INT', isPK: true },
            { name: 'name', type: 'VARCHAR(100)', isPK: false },
            { name: 'email', type: 'VARCHAR(255)', isPK: false },
            { name: 'course_id', type: 'INT', isFK: true },
            { name: 'created_at', type: 'TIMESTAMP', isPK: false },
          ],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Relational Database Table: Students',
      });
      executeAddObject(context, table, 'Insert Database Table Schema');
    },
  },

  // 11. CPU & Von Neumann Architecture Diagram
  {
    id: 'cs-cpu-architecture',
    subjectId: 'computerScience',
    name: 'CPU & Von Neumann Architecture',
    category: 'Computer Architecture',
    icon: '🖥️',
    description: 'System bus, Control Unit, ALU, Registers (PC, MAR, MDR, ACC), and RAM Memory block',
    badge: 'Architecture',
    tags: ['cpu', 'alu', 'registers', 'ram', 'bus', 'von neumann', 'architecture'],
    execute: (context) => {
      const cpu = createShape('csDiagram', 180, 140, 560, 400, {
        params: {
          diagramType: 'cpuArchitecture',
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'CPU & Von Neumann Architecture',
      });
      executeAddObject(context, cpu, 'Insert CPU Architecture Diagram');
    },
  },

  // 12. Instruction Cycle Diagram (Fetch-Decode-Execute)
  {
    id: 'cs-instruction-cycle',
    subjectId: 'computerScience',
    name: 'Instruction Cycle (F-D-E)',
    category: 'Computer Architecture',
    icon: '🔁',
    description: 'State machine cycle: Fetch ➔ Decode ➔ Execute ➔ Store ➔ Interrupt Check',
    badge: 'Cycle',
    tags: ['instruction cycle', 'fetch', 'decode', 'execute', 'cpu state'],
    execute: (context) => {
      const cycle = createShape('csDiagram', 200, 160, 500, 340, {
        params: {
          diagramType: 'instructionCycle',
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'CPU Instruction Cycle (Fetch-Decode-Execute)',
      });
      executeAddObject(context, cycle, 'Insert Instruction Cycle Diagram');
    },
  },

  // 13. Network Topology Diagram
  {
    id: 'cs-network-topology',
    subjectId: 'computerScience',
    name: 'Network Topology Diagram',
    category: 'Networking',
    icon: '🌐',
    description: 'Computer network topology layouts: Star, Mesh, Bus, Ring, Client-Server',
    badge: 'Network',
    tags: ['network', 'topology', 'star', 'mesh', 'bus', 'router', 'client'],
    execute: (context, options) => {
      const topoType = options?.topology || 'star';
      const net = createShape('csDiagram', 200, 160, 500, 360, {
        params: {
          diagramType: 'networkTopology',
          topology: topoType,
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: `${topoType.toUpperCase()} Network Topology`,
      });
      executeAddObject(context, net, `Insert ${topoType} Network Topology`);
    },
  },
];

/**
 * Templates for Computer Science
 */
const csTemplates: SubjectTemplate[] = [
  {
    id: 'cs-tmpl-binary-search',
    subjectId: 'computerScience',
    name: 'Binary Search Algorithm Board',
    category: 'Lesson Templates',
    icon: '🔍',
    description: 'Complete lesson board with code block, sorted array with low/mid/high markers, and trace table',
    createObjects: (origin) => {
      const code = createShape('csDiagram', origin.x, origin.y, 440, 280, {
        params: {
          diagramType: 'codeBlock',
          language: 'python',
          code: 'def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1',
        },
      });
      const arrayDemo = createShape('csDiagram', origin.x + 470, origin.y, 420, 200, {
        params: {
          diagramType: 'sortingArray',
          array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
          activeIndices: [4],
        },
      });
      return [code, arrayDemo];
    },
  },
  {
    id: 'cs-tmpl-recursion-stack',
    subjectId: 'computerScience',
    name: 'Recursion & Call Stack Lesson',
    category: 'Lesson Templates',
    icon: '🥞',
    description: 'Recursive factorial function code and visual memory activation records on call stack',
    createObjects: (origin) => {
      const code = createShape('csDiagram', origin.x, origin.y, 420, 240, {
        params: {
          diagramType: 'codeBlock',
          language: 'python',
          code: 'def factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n - 1)',
        },
      });
      const stack = createShape('csDiagram', origin.x + 450, origin.y, 360, 360, {
        params: {
          diagramType: 'callStack',
          frames: [
            { func: 'factorial(1)', vars: 'return 1' },
            { func: 'factorial(2)', vars: '2 * factorial(1)' },
            { func: 'factorial(3)', vars: '3 * factorial(2)' },
            { func: 'main()', vars: 'print(factorial(3))' },
          ],
        },
      });
      return [code, stack];
    },
  },
];

export const ComputerScienceModule: SubjectModule = {
  id: 'computerScience',
  name: 'Computer Science',
  icon: '💻',
  description: 'Code blocks, pseudocode, flowcharts, trace tables, stack, memory, trees, DB schemas, CPU, networks',
  tools: csTools,
  templates: csTemplates,
};
