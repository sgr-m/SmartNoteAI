/**
 * Computer Science Interactive Tools & Shape Renderer Test Suite
 * Tests the 6 interactive CS tools: Trace Table, Call Stack, Memory Layout,
 * Linked List, Binary Tree & Graph, and Sorting/Searching Demonstration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SubjectRegistry, initializeSubjectModules } from '../src/renderer/services/subjectModules';
import { isSubjectShape, renderSubjectShape } from '../src/renderer/engine/subjectShapeRenderer';
import { ShapeObject } from '../src/shared/types';

describe('Computer Science Interactive Tools', () => {
  beforeEach(() => {
    initializeSubjectModules();
  });

  it('verifies all 6 CS tools have interactiveModal assigned', () => {
    const csTools = SubjectRegistry.getToolsBySubject('computerScience');
    const toolMap = new Map(csTools.map((t) => [t.id, t]));

    expect(toolMap.get('cs-trace-table')?.interactiveModal).toBe('traceTable');
    expect(toolMap.get('cs-call-stack')?.interactiveModal).toBe('callStack');
    expect(toolMap.get('cs-memory-pointer')?.interactiveModal).toBe('memoryLayout');
    expect(toolMap.get('cs-linked-list')?.interactiveModal).toBe('linkedList');
    expect(toolMap.get('cs-tree-graph')?.interactiveModal).toBe('treeGraph');
    expect(toolMap.get('cs-sorting-demo')?.interactiveModal).toBe('sortingSearching');
    expect(toolMap.get('cs-er-database')?.interactiveModal).toBe('databaseTable');
    expect(toolMap.get('cs-cpu-architecture')?.interactiveModal).toBe('cpuArchitecture');
    expect(toolMap.get('cs-instruction-cycle')?.interactiveModal).toBe('instructionCycle');
    expect(toolMap.get('cs-network-topology')?.interactiveModal).toBe('networkTopology');
  });

  it('renders traceTable diagram without throwing on HTML5 canvas mock', () => {
    const shape: ShapeObject = {
      id: 'trace-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 500,
      height: 300,
      params: {
        diagramType: 'traceTable',
        columns: ['Step', 'Line', 'i', 'sum', 'Condition', 'Output'],
        rows: [
          ['Init', '1-2', '0', '0', 'True', '-'],
          ['1', '3-4', '1', '1', 'True', '-'],
          ['2', '3-4', '2', '3', 'True', '-'],
          ['3', '3-4', '3', '6', 'False', '6'],
        ],
      },
    };

    expect(isSubjectShape(shape.shapeType)).toBe(true);

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, shape, 1)).not.toThrow();
  });

  it('renders callStack diagram without throwing on HTML5 canvas mock', () => {
    const shape: ShapeObject = {
      id: 'stack-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      params: {
        diagramType: 'callStack',
        title: 'Call Stack (factorial)',
        frames: [
          { func: 'factorial(n=1)', vars: 'return 1', isTop: true },
          { func: 'factorial(n=2)', vars: 'waiting on factorial(1)' },
          { func: 'main()', vars: 'factorial(2)' },
        ],
      },
    };

    expect(isSubjectShape(shape.shapeType)).toBe(true);

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, shape, 1)).not.toThrow();
  });

  it('renders memoryLayout diagram with pointers without throwing', () => {
    const shape: ShapeObject = {
      id: 'mem-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 550,
      height: 350,
      params: {
        diagramType: 'memoryLayout',
        cells: [
          { address: '0x1000', name: 'ptr', type: 'int*', value: '0x1004', pointsTo: '0x1004' },
          { address: '0x1004', name: 'val', type: 'int', value: '42' },
        ],
      },
    };

    expect(isSubjectShape(shape.shapeType)).toBe(true);

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, shape, 1)).not.toThrow();
  });

  it('renders linkedList diagram with singly, doubly, and circular modes without throwing', () => {
    const singlyShape: ShapeObject = {
      id: 'll-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 600,
      height: 160,
      params: {
        diagramType: 'linkedList',
        nodes: ['10', '20', '30'],
        isDoubly: false,
        activeNodeIndex: 1,
        showAddresses: true,
      },
    };

    const circularShape: ShapeObject = {
      id: 'll-2',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 600,
      height: 180,
      params: {
        diagramType: 'linkedList',
        nodes: ['A', 'B', 'C'],
        isDoubly: true,
        isCircular: true,
      },
    };

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, singlyShape, 1)).not.toThrow();
    expect(() => renderSubjectShape(ctxMock, circularShape, 1)).not.toThrow();
  });

  it('renders both binaryTree and graph network diagrams without throwing', () => {
    const treeShape: ShapeObject = {
      id: 'tree-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 500,
      height: 360,
      params: {
        diagramType: 'binaryTree',
        graphMode: 'tree',
        rootVal: '50',
        leftVal: '30',
        rightVal: '70',
      },
    };

    const graphShape: ShapeObject = {
      id: 'graph-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 520,
      height: 380,
      params: {
        diagramType: 'graph',
        graphMode: 'graph',
        isDirected: true,
        graphNodes: [
          { id: 'A', label: 'A' },
          { id: 'B', label: 'B' },
          { id: 'C', label: 'C' },
        ],
        graphEdges: [
          { from: 'A', to: 'B', weight: '5' },
          { from: 'B', to: 'C', weight: '2' },
        ],
      },
    };

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, treeShape, 1)).not.toThrow();
    expect(() => renderSubjectShape(ctxMock, graphShape, 1)).not.toThrow();
  });

  it('renders sortingArray demonstration with active pointers without throwing', () => {
    const sortShape: ShapeObject = {
      id: 'sort-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 560,
      height: 340,
      params: {
        diagramType: 'sortingArray',
        array: [10, 30, 20, 50, 40],
        activeIndices: [1, 2],
        sortedIndices: [4],
        pointers: [{ label: 'mid', index: 2 }],
        statusText: 'Bubble Sort comparing arr[1] and arr[2]',
      },
    };

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, sortShape, 1)).not.toThrow();
  });

  it('renders databaseTable diagram with custom font size without throwing', () => {
    const dbShape: ShapeObject = {
      id: 'db-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 480,
      height: 360,
      params: {
        diagramType: 'databaseTable',
        tableName: 'Students',
        fontSize: 16,
        columns: [
          { name: 'id', type: 'INT', isPK: true },
          { name: 'name', type: 'VARCHAR(100)', isPK: false },
          { name: 'email', type: 'VARCHAR(255)', isPK: false },
          { name: 'course_id', type: 'INT', isFK: true },
        ],
      },
    };

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, dbShape, 1)).not.toThrow();
  });

  it('renders cpuArchitecture diagram with custom font size without throwing', () => {
    const cpuShape: ShapeObject = {
      id: 'cpu-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 580,
      height: 420,
      params: {
        diagramType: 'cpuArchitecture',
        title: 'Von Neumann Architecture',
        fontSize: 18,
        busWidth: '64-bit',
        registers: ['PC', 'MAR', 'MDR', 'ACC', 'CIR'],
        showIO: true,
      },
    };

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, cpuShape, 1)).not.toThrow();
  });

  it('renders instructionCycle diagram with stages without throwing', () => {
    const cycleShape: ShapeObject = {
      id: 'cycle-1',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 540,
      height: 400,
      params: {
        diagramType: 'instructionCycle',
        title: 'CPU Instruction Cycle (Fetch-Decode-Execute)',
        fontSize: 16,
      },
    };

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => renderSubjectShape(ctxMock, cycleShape, 1)).not.toThrow();
  });

  it('renders networkTopology diagrams for Star, Bus, Mesh, Ring, and Tree without throwing', () => {
    const topologies = ['star', 'bus', 'mesh', 'ring', 'tree'] as const;

    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
    } as unknown as CanvasRenderingContext2D;

    for (const topo of topologies) {
      const netShape: ShapeObject = {
        id: `net-${topo}`,
        type: 'shape',
        shapeType: 'csDiagram',
        x: 100,
        y: 100,
        width: 560,
        height: 400,
        params: {
          diagramType: 'networkTopology',
          topology: topo,
          title: `Network Topology (${topo.toUpperCase()})`,
          fontSize: 16,
          nodes: [
            { id: 'SW', name: 'Switch (Core)', type: 'switch', ip: '192.168.1.1' },
            { id: 'PC1', name: 'PC 1 (Lab)', type: 'pc', ip: '192.168.1.10' },
            { id: 'PC2', name: 'PC 2 (Lab)', type: 'pc', ip: '192.168.1.11' },
            { id: 'PRN', name: 'Printer', type: 'printer', ip: '192.168.1.20' },
          ],
        },
      };

      expect(() => renderSubjectShape(ctxMock, netShape, 1)).not.toThrow();
    }
  });

  it('proportioned corner resize scaling scales fonts and diagram elements when width and height increase', () => {
    const renderedFonts: string[] = [];
    const ctxMock = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      roundRect: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      bezierCurveTo: () => {},
      fillText: () => {},
      measureText: () => ({ width: 40 }),
      setLineDash: () => {},
      set font(val: string) {
        renderedFonts.push(val);
      },
    } as unknown as CanvasRenderingContext2D;

    // Small dimensions
    const smallShape: ShapeObject = {
      id: 'db-small',
      type: 'shape',
      shapeType: 'csDiagram',
      x: 100,
      y: 100,
      width: 480,
      height: 360,
      params: {
        diagramType: 'databaseTable',
        tableName: 'Students',
        fontSize: 14,
      },
    };

    renderSubjectShape(ctxMock, smallShape, 1);
    const smallFonts = [...renderedFonts];
    renderedFonts.length = 0;

    // Enlarge diagram by dragging corners (double the width and height)
    const largeShape: ShapeObject = {
      ...smallShape,
      id: 'db-large',
      width: 960,
      height: 720,
    };

    renderSubjectShape(ctxMock, largeShape, 1);
    const largeFonts = [...renderedFonts];

    expect(smallFonts.length).toBeGreaterThan(0);
    expect(largeFonts.length).toBeGreaterThan(0);

    // Extract pixel size numbers from font declarations (e.g., "bold 12px Inter" -> 12)
    const extractPx = (f: string) => {
      const match = f.match(/(\d+)px/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const maxSmallPx = Math.max(...smallFonts.map(extractPx));
    const maxLargePx = Math.max(...largeFonts.map(extractPx));

    // When corner is dragged from 480 to 960 width, fonts must scale proportionally larger
    expect(maxLargePx).toBeGreaterThan(maxSmallPx);
  });
});
