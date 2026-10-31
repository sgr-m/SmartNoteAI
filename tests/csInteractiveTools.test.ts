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
});
