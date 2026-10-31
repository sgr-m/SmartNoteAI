/**
 * Digital Logic Interactive Tools & Shape Renderer Test Suite
 * Tests:
 * 1. N-bit straight binary combinations generator (1-bit, 2-bit, 3-bit: 000 to 111, etc.)
 * 2. Arithmetic circuit truth tables (Half Adder with 2 outputs: Sum, Carry; Full Adder)
 * 3. Authentic IEEE Logic Gate symbols (AND, OR, NOT, NAND, NOR, XOR, XNOR)
 * 4. Input labeling (A, B, C) and 2-input vs 3-input gate configurations
 * 5. Truth table rendering with visible dim row dividers and blank quiz mode
 * 6. Proportional corner drag scaling for all digital logic tools
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SubjectRegistry, initializeSubjectModules } from '../src/renderer/services/subjectModules';
import {
  generateNBitCombinations,
  generateCircuitTruthTable,
  generateTruthTableData,
  evaluateLogicGate,
  getKMapMintermIndex,
  createKMapGrid,
  getDefaultKMapVariableNames,
  evaluateMux,
  evaluateAdder,
  evaluateFlipFlopNextState,
  evaluateCounter,
} from '../src/renderer/services/subjectModules/digitalLogicModule';
import { isSubjectShape, renderSubjectShape } from '../src/renderer/engine/subjectShapeRenderer';
import { ShapeObject } from '../src/shared/types';

describe('Digital Logic Teaching Platform Tests', () => {
  beforeEach(() => {
    initializeSubjectModules();
  });

  describe('N-Bit Straight Binary Generation & Circuit Presets', () => {
    it('generates all 2^n combinations in straight binary order for 1, 2, and 3 bits', () => {
      // 1 bit
      const bits1 = generateNBitCombinations(1);
      expect(bits1).toEqual([[0], [1]]);

      // 2 bits: 00, 01, 10, 11
      const bits2 = generateNBitCombinations(2);
      expect(bits2).toEqual([
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ]);

      // 3 bits: 000, 001, 010, 011, 100, 101, 110, 111
      const bits3 = generateNBitCombinations(3);
      expect(bits3.length).toBe(8);
      expect(bits3).toEqual([
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
        [0, 1, 1],
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 0],
        [1, 1, 1],
      ]);
    });

    it('generates Half Adder truth table with two output columns: Sum and Carry', () => {
      const ha = generateCircuitTruthTable('HalfAdder');
      expect(ha.headers).toEqual(['A', 'B', 'Sum (S)', 'Carry (C)']);
      expect(ha.inputCount).toBe(2);
      expect(ha.rows).toEqual([
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [1, 0, 1, 0],
        [1, 1, 0, 1],
      ]);
    });

    it('generates Full Adder truth table with three inputs and two outputs', () => {
      const fa = generateCircuitTruthTable('FullAdder');
      expect(fa.headers).toEqual(['A', 'B', 'Cin', 'Sum (S)', 'Cout']);
      expect(fa.inputCount).toBe(3);
      expect(fa.rows.length).toBe(8);
      // Row 7 (A=1, B=1, Cin=1 => Sum=1, Cout=1)
      expect(fa.rows[7]).toEqual([1, 1, 1, 1, 1]);
      // Row 3 (A=0, B=1, Cin=1 => Sum=0, Cout=1)
      expect(fa.rows[3]).toEqual([0, 1, 1, 0, 1]);
    });
  });

  describe('IEEE Logic Gate Symbols & Input Labels', () => {
    it('verifies all digital logic tools have interactiveModal assigned', () => {
      const tools = SubjectRegistry.getToolsBySubject('digitalLogic');
      const toolMap = new Map(tools.map((t) => [t.id, t]));

      expect(toolMap.get('logic-gate-and')?.interactiveModal).toBe('logicGate');
      expect(toolMap.get('logic-gate-or')?.interactiveModal).toBe('logicGate');
      expect(toolMap.get('logic-gate-not')?.interactiveModal).toBe('logicGate');
      expect(toolMap.get('logic-gate-nand')?.interactiveModal).toBe('logicGate');
      expect(toolMap.get('logic-gate-nor')?.interactiveModal).toBe('logicGate');
      expect(toolMap.get('logic-gate-xor')?.interactiveModal).toBe('logicGate');
      expect(toolMap.get('logic-gate-xnor')?.interactiveModal).toBe('logicGate');
      expect(toolMap.get('logic-truth-table')?.interactiveModal).toBe('truthTable');
    });

    it('renders authentic XOR and XNOR gates without throwing', () => {
      const xorShape: ShapeObject = {
        id: 'xor-1',
        type: 'shape',
        shapeType: 'logicGate',
        x: 100,
        y: 100,
        width: 180,
        height: 95,
        params: {
          gateType: 'XOR',
          inputs: 2,
          labelA: 'A',
          labelB: 'B',
          labelY: 'Y',
          fontSize: 14,
        },
      };

      const xnorShape: ShapeObject = {
        id: 'xnor-1',
        type: 'shape',
        shapeType: 'logicGate',
        x: 100,
        y: 100,
        width: 185,
        height: 95,
        params: {
          gateType: 'XNOR',
          inputs: 2,
          labelA: 'X',
          labelB: 'Y',
          labelY: 'Z',
          fontSize: 14,
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
        quadraticCurveTo: () => {},
        bezierCurveTo: () => {},
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(isSubjectShape(xorShape.shapeType)).toBe(true);
      expect(() => renderSubjectShape(ctxMock, xorShape, 1)).not.toThrow();
      expect(() => renderSubjectShape(ctxMock, xnorShape, 1)).not.toThrow();
    });

    it('renders 3-input logic gates with custom labels A, B, C', () => {
      const gate3In: ShapeObject = {
        id: 'gate-3in',
        type: 'shape',
        shapeType: 'logicGate',
        x: 100,
        y: 100,
        width: 190,
        height: 110,
        params: {
          gateType: 'AND',
          inputs: 3,
          inputLabels: ['In1', 'In2', 'In3'],
          labelY: 'Out',
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
        quadraticCurveTo: () => {},
        bezierCurveTo: () => {},
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(() => renderSubjectShape(ctxMock, gate3In, 1)).not.toThrow();
    });

    it('proportioned corner resize scaling scales logic gate fonts and dimensions', () => {
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
        quadraticCurveTo: () => {},
        bezierCurveTo: () => {},
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
        set font(val: string) {
          renderedFonts.push(val);
        },
      } as unknown as CanvasRenderingContext2D;

      const smallGate: ShapeObject = {
        id: 'gate-sm',
        type: 'shape',
        shapeType: 'logicGate',
        x: 50,
        y: 50,
        width: 170,
        height: 95,
        params: {
          gateType: 'XOR',
          inputs: 2,
          labelA: 'A',
          labelB: 'B',
          labelY: 'Y',
          fontSize: 14,
        },
      };

      renderSubjectShape(ctxMock, smallGate, 1);
      const smallFonts = [...renderedFonts];
      renderedFonts.length = 0;

      // Double the dimensions from corner dragging
      const largeGate: ShapeObject = {
        ...smallGate,
        width: 340,
        height: 190,
      };

      renderSubjectShape(ctxMock, largeGate, 1);
      const largeFonts = [...renderedFonts];

      const extractPx = (f: string) => {
        const match = f.match(/(\d+)px/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const maxSmall = Math.max(...smallFonts.map(extractPx));
      const maxLarge = Math.max(...largeFonts.map(extractPx));

      expect(maxLarge).toBeGreaterThan(maxSmall);
    });
  });

  describe('Truth Table Visible Rows & Blank Quiz Mode', () => {
    it('renders N-bit truth table with visible dim rows and multiple outputs', () => {
      const nBitTable: ShapeObject = {
        id: 'tt-nbit',
        type: 'shape',
        shapeType: 'truthTable',
        x: 100,
        y: 100,
        width: 460,
        height: 320,
        params: {
          headers: ['A', 'B', 'Cin', 'Sum', 'Cout'],
          inputCount: 3,
          rows: [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 1, 0, 1],
            [1, 0, 0, 1, 0],
            [1, 0, 1, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 1, 1, 1, 1],
          ],
          fontSize: 14,
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
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(isSubjectShape(nBitTable.shapeType)).toBe(true);
      expect(() => renderSubjectShape(ctxMock, nBitTable, 1)).not.toThrow();
    });

    it('renders blank output mode with placeholder dash "-" for classroom tests', () => {
      const blankTable: ShapeObject = {
        id: 'tt-blank',
        type: 'shape',
        shapeType: 'truthTable',
        x: 100,
        y: 100,
        width: 440,
        height: 280,
        params: {
          headers: ['A', 'B', 'Sum', 'Carry'],
          inputCount: 2,
          rows: [
            [0, 0, '-', '-'],
            [0, 1, '-', '-'],
            [1, 0, '-', '-'],
            [1, 1, '-', '-'],
          ],
          isBlankOutputs: true,
          fontSize: 14,
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
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(() => renderSubjectShape(ctxMock, blankTable, 1)).not.toThrow();
    });

    it('proportioned corner resize scaling scales truth table fonts and row dimensions', () => {
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
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
        set font(val: string) {
          renderedFonts.push(val);
        },
      } as unknown as CanvasRenderingContext2D;

      const smallTable: ShapeObject = {
        id: 'tt-sm',
        type: 'shape',
        shapeType: 'truthTable',
        x: 100,
        y: 100,
        width: 420,
        height: 260,
        params: {
          headers: ['A', 'B', 'Y'],
          inputCount: 2,
          rows: [
            [0, 0, 0],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0],
          ],
          fontSize: 13,
        },
      };

      renderSubjectShape(ctxMock, smallTable, 1);
      const smallFonts = [...renderedFonts];
      renderedFonts.length = 0;

      // Double table width and height from corner drag
      const largeTable: ShapeObject = {
        ...smallTable,
        width: 840,
        height: 520,
      };

      renderSubjectShape(ctxMock, largeTable, 1);
      const largeFonts = [...renderedFonts];

      const extractPx = (f: string) => {
        const match = f.match(/(\d+)px/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const maxSmall = Math.max(...smallFonts.map(extractPx));
      const maxLarge = Math.max(...largeFonts.map(extractPx));

      expect(maxLarge).toBeGreaterThan(maxSmall);
    });

    it('renders Karnaugh map with Gray code coordinates without throwing', () => {
      const kmap: ShapeObject = {
        id: 'kmap-1',
        type: 'shape',
        shapeType: 'karnaughMap',
        x: 100,
        y: 100,
        width: 460,
        height: 320,
        params: {
          variables: 3,
          fontSize: 14,
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
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(isSubjectShape(kmap.shapeType)).toBe(true);
      expect(() => renderSubjectShape(ctxMock, kmap, 1)).not.toThrow();
    });

    it('correctly maps minterm decimal indices for 2, 3, 4, and 5-variable K-maps', () => {
      // 2-Variable: 2x2
      expect(getKMapMintermIndex(2, 0, 0)).toBe(0);
      expect(getKMapMintermIndex(2, 0, 1)).toBe(1);
      expect(getKMapMintermIndex(2, 1, 0)).toBe(2);
      expect(getKMapMintermIndex(2, 1, 1)).toBe(3);

      // 3-Variable: 2x4 (Row A: 0, 1; Col BC: 00, 01, 11, 10)
      expect([0, 1, 2, 3].map((c) => getKMapMintermIndex(3, 0, c))).toEqual([0, 1, 3, 2]);
      expect([0, 1, 2, 3].map((c) => getKMapMintermIndex(3, 1, c))).toEqual([4, 5, 7, 6]);

      // 4-Variable: 4x4 (Row AB: 00, 01, 11, 10; Col CD: 00, 01, 11, 10)
      expect([0, 1, 2, 3].map((c) => getKMapMintermIndex(4, 0, c))).toEqual([0, 1, 3, 2]);
      expect([0, 1, 2, 3].map((c) => getKMapMintermIndex(4, 1, c))).toEqual([4, 5, 7, 6]);
      expect([0, 1, 2, 3].map((c) => getKMapMintermIndex(4, 2, c))).toEqual([12, 13, 15, 14]);
      expect([0, 1, 2, 3].map((c) => getKMapMintermIndex(4, 3, c))).toEqual([8, 9, 11, 10]);

      // 5-Variable: 4x8 (Cols 0-3 for V0=0, Cols 4-7 for V0=1)
      // V0=0: m0-m15
      expect([0, 1, 2, 3].map((c) => getKMapMintermIndex(5, 0, c))).toEqual([0, 1, 3, 2]);
      // V0=1: m16-m31
      expect([4, 5, 6, 7].map((c) => getKMapMintermIndex(5, 0, c))).toEqual([16, 17, 19, 18]);
      expect([4, 5, 6, 7].map((c) => getKMapMintermIndex(5, 2, c))).toEqual([28, 29, 31, 30]);
    });

    it('generates blank K-Map grids with empty cells', () => {
      const blank3 = createKMapGrid(3, 'blank');
      expect(blank3.length).toBe(2);
      expect(blank3[0]).toEqual(['', '', '', '']);
      expect(blank3[1]).toEqual(['', '', '', '']);

      const blank5 = createKMapGrid(5, 'blank');
      expect(blank5.length).toBe(4);
      expect(blank5[0].length).toBe(8);
      blank5.forEach((row) => row.forEach((cell) => expect(cell).toBe('')));
    });

    it('generates Canonical SOP and POS K-Map grids with don\'t cares', () => {
      // SOP: F(A,B,C) = ∑m(1, 5) + d(7)
      const sopGrid = createKMapGrid(3, 'sop', [1, 5], [], [7]);
      // Row 0: m0=0, m1=1, m3=0, m2=0
      expect(sopGrid[0]).toEqual(['0', '1', '0', '0']);
      // Row 1: m4=0, m5=1, m7=X, m6=0
      expect(sopGrid[1]).toEqual(['0', '1', 'X', '0']);

      // POS: F(A,B,C) = ∏M(0, 4) + d(2)
      const posGrid = createKMapGrid(3, 'pos', [], [0, 4], [2]);
      // Row 0: m0=0, m1=1, m3=1, m2=X
      expect(posGrid[0]).toEqual(['0', '1', '1', 'X']);
      // Row 1: m4=0, m5=1, m7=1, m6=1
      expect(posGrid[1]).toEqual(['0', '1', '1', '1']);
    });

    it('supports hiding pin labels on logic gates via showLabels: false', () => {
      const renderedTexts: string[] = [];
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
        quadraticCurveTo: () => {},
        fillText: (t: string) => {
          renderedTexts.push(t);
        },
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      const gateWithLabels: ShapeObject = {
        id: 'gate-lbl',
        type: 'shape',
        shapeType: 'logicGate',
        x: 100,
        y: 100,
        width: 170,
        height: 95,
        params: {
          gateType: 'AND',
          inputs: 2,
          labelA: 'PinA',
          labelB: 'PinB',
          labelY: 'PinY',
          showLabels: true,
          fontSize: 14,
        },
      };

      renderSubjectShape(ctxMock, gateWithLabels, 1);
      expect(renderedTexts).toContain('PinA');
      expect(renderedTexts).toContain('PinB');
      expect(renderedTexts).toContain('PinY');

      renderedTexts.length = 0;
      const gateNoLabels: ShapeObject = {
        ...gateWithLabels,
        params: {
          ...gateWithLabels.params,
          showLabels: false,
        },
      };

      renderSubjectShape(ctxMock, gateNoLabels, 1);
      expect(renderedTexts).not.toContain('PinA');
      expect(renderedTexts).not.toContain('PinB');
      expect(renderedTexts).not.toContain('PinY');
    });

    it('renders 5-variable dual Karnaugh map with custom variable names without throwing', () => {
      const kmap5: ShapeObject = {
        id: 'kmap-5var',
        type: 'shape',
        shapeType: 'karnaughMap',
        x: 100,
        y: 100,
        width: 780,
        height: 440,
        params: {
          variables: 5,
          varNames: ['V', 'W', 'X', 'Y', 'Z'],
          form: 'sop',
          canonicalExpr: 'F = ∑m(0, 15, 16, 31)',
          grid: createKMapGrid(5, 'sop', [0, 15, 16, 31]),
          fontSize: 14,
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
        fillText: () => {},
        measureText: () => ({ width: 40 }),
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(() => renderSubjectShape(ctxMock, kmap5, 1)).not.toThrow();
    });
  });

  describe('Digital Circuit Interactive Blocks: N:1 MUX, Adders, Flip-Flops, 4-Bit Counter', () => {
    it('evaluates N:1 Multiplexers correctly for 2:1, 4:1, 8:1, and 16:1 with input channels', () => {
      // 2:1 MUX
      const mux2 = evaluateMux(2, [0, 1], 1);
      expect(mux2.selectedChannel).toBe(1);
      expect(mux2.outputValue).toBe(1);

      // 4:1 MUX routing channel 2
      const mux4 = evaluateMux(4, [1, 0, 1, 0], 2);
      expect(mux4.selectedChannel).toBe(2);
      expect(mux4.outputValue).toBe(1);

      // 8:1 MUX clamping out-of-range channel
      const mux8 = evaluateMux(8, [0, 0, 0, 0, 0, 1, 0, 0], 5);
      expect(mux8.selectedChannel).toBe(5);
      expect(mux8.outputValue).toBe(1);

      const muxClamped = evaluateMux(8, [1, 1, 1, 1], 99);
      expect(muxClamped.selectedChannel).toBe(7);
      expect(muxClamped.outputValue).toBe(0);

      // 16:1 MUX
      const inputs16 = Array.from({ length: 16 }, (_, i) => (i === 12 ? 1 : 0));
      const mux16 = evaluateMux(16, inputs16, 12);
      expect(mux16.selectedChannel).toBe(12);
      expect(mux16.outputValue).toBe(1);
    });

    it('evaluates Half Adder and Full Adder arithmetic correctly', () => {
      // Half Adder
      expect(evaluateAdder(false, 0, 0)).toEqual({ sum: 0, cout: 0, formulaStr: '0 + 0 = 0 → Sum=0, Carry=0' });
      expect(evaluateAdder(false, 0, 1)).toEqual({ sum: 1, cout: 0, formulaStr: '0 + 1 = 1 → Sum=1, Carry=0' });
      expect(evaluateAdder(false, 1, 0)).toEqual({ sum: 1, cout: 0, formulaStr: '1 + 0 = 1 → Sum=1, Carry=0' });
      expect(evaluateAdder(false, 1, 1)).toEqual({ sum: 0, cout: 1, formulaStr: '1 + 1 = 2 → Sum=0, Carry=1' });

      // Full Adder
      expect(evaluateAdder(true, 0, 0, 0)).toEqual({ sum: 0, cout: 0, formulaStr: '0 + 0 + 0 = 0 → Sum=0, Cout=0' });
      expect(evaluateAdder(true, 1, 0, 1)).toEqual({ sum: 0, cout: 1, formulaStr: '1 + 0 + 1 = 2 → Sum=0, Cout=1' });
      expect(evaluateAdder(true, 1, 1, 1)).toEqual({ sum: 1, cout: 1, formulaStr: '1 + 1 + 1 = 3 → Sum=1, Cout=1' });
    });

    it('evaluates Flip-Flop next-state transitions for D, JK, T, and SR flip-flops', () => {
      // D Flip-Flop
      expect(evaluateFlipFlopNextState('D', 0, { d: 1 })).toEqual({ nextQ: 1, mode: 'SET (Q=1)' });
      expect(evaluateFlipFlopNextState('D', 1, { d: 0 })).toEqual({ nextQ: 0, mode: 'RESET (Q=0)' });

      // JK Flip-Flop
      expect(evaluateFlipFlopNextState('JK', 1, { j: 0, k: 0 })).toEqual({ nextQ: 1, mode: 'HOLD (No Change)' });
      expect(evaluateFlipFlopNextState('JK', 1, { j: 0, k: 1 })).toEqual({ nextQ: 0, mode: 'RESET (Q=0)' });
      expect(evaluateFlipFlopNextState('JK', 0, { j: 1, k: 0 })).toEqual({ nextQ: 1, mode: 'SET (Q=1)' });
      expect(evaluateFlipFlopNextState('JK', 1, { j: 1, k: 1 })).toEqual({ nextQ: 0, mode: 'TOGGLE (Q=Q̅)' });
      expect(evaluateFlipFlopNextState('JK', 0, { j: 1, k: 1 })).toEqual({ nextQ: 1, mode: 'TOGGLE (Q=Q̅)' });

      // T Flip-Flop
      expect(evaluateFlipFlopNextState('T', 0, { t: 1 })).toEqual({ nextQ: 1, mode: 'TOGGLE (Q=Q̅)' });
      expect(evaluateFlipFlopNextState('T', 1, { t: 1 })).toEqual({ nextQ: 0, mode: 'TOGGLE (Q=Q̅)' });
      expect(evaluateFlipFlopNextState('T', 1, { t: 0 })).toEqual({ nextQ: 1, mode: 'HOLD (No Change)' });

      // SR Flip-Flop
      expect(evaluateFlipFlopNextState('SR', 0, { s: 1, r: 0 })).toEqual({ nextQ: 1, mode: 'SET (Q=1)' });
      expect(evaluateFlipFlopNextState('SR', 1, { s: 0, r: 1 })).toEqual({ nextQ: 0, mode: 'RESET (Q=0)' });
      expect(evaluateFlipFlopNextState('SR', 1, { s: 0, r: 0 })).toEqual({ nextQ: 1, mode: 'HOLD (No Change)' });
      expect(evaluateFlipFlopNextState('SR', 1, { s: 1, r: 1 })).toEqual({ nextQ: 1, mode: 'INVALID (S=R=1 Forbidden)' });
    });

    it('evaluates 4-Bit Binary Counter increment, decrement, reset, and modulo arithmetic', () => {
      expect(evaluateCounter(0, 'inc', 15)).toBe(1);
      expect(evaluateCounter(14, 'inc', 15)).toBe(15);
      expect(evaluateCounter(15, 'inc', 15)).toBe(0); // overflow wraps to 0
      expect(evaluateCounter(0, 'dec', 15)).toBe(15); // underflow wraps to 15
      expect(evaluateCounter(5, 'dec', 15)).toBe(4);
      expect(evaluateCounter(12, 'reset', 15)).toBe(0);
    });

    it('renders MUX, HalfAdder, FullAdder, FlipFlops, and Counter4 shapes cleanly without throwing', () => {
      const renderedTexts: string[] = [];
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
        fillText: (text: string) => {
          renderedTexts.push(text);
        },
        measureText: (text: string) => ({ width: text.length * 8 }),
        setLineDash: () => {},
      } as unknown as CanvasRenderingContext2D;

      // 1. 8:1 MUX
      const muxShape: ShapeObject = {
        id: 'test-mux',
        type: 'shape',
        shapeType: 'logicGate',
        x: 100,
        y: 100,
        width: 260,
        height: 220,
        params: {
          blockType: 'MUX',
          muxSize: 8,
          inputValues: [0, 1, 0, 1, 1, 0, 0, 1],
          selectedChannel: 3,
          showLabels: true,
          fontSize: 14,
        },
      };
      expect(() => renderSubjectShape(ctxMock, muxShape, 1)).not.toThrow();
      expect(renderedTexts.some((t) => t.includes('8:1 MUX'))).toBe(true);

      // 2. Full Adder
      const faShape: ShapeObject = {
        id: 'test-fa',
        type: 'shape',
        shapeType: 'logicGate',
        x: 100,
        y: 100,
        width: 240,
        height: 180,
        params: {
          blockType: 'FullAdder',
          inputA: 1,
          inputB: 1,
          inputCin: 1,
          showLabels: true,
          fontSize: 14,
        },
      };
      expect(() => renderSubjectShape(ctxMock, faShape, 1)).not.toThrow();
      expect(renderedTexts.some((t) => t.includes('Full Adder') || t.includes('FA'))).toBe(true);

      // 3. JK Flip-Flop
      const jkShape: ShapeObject = {
        id: 'test-jk',
        type: 'shape',
        shapeType: 'logicGate',
        x: 100,
        y: 100,
        width: 220,
        height: 190,
        params: {
          blockType: 'FlipFlop',
          ffType: 'JK',
          inputJ: 1,
          inputK: 1,
          stateQ: 1,
          stateQbar: 0,
          showLabels: true,
          fontSize: 14,
        },
      };
      expect(() => renderSubjectShape(ctxMock, jkShape, 1)).not.toThrow();
      expect(renderedTexts.some((t) => t.toUpperCase().includes('JK FLIP-FLOP'))).toBe(true);

      // 4. 4-Bit Binary Counter
      const counterShape: ShapeObject = {
        id: 'test-counter',
        type: 'shape',
        shapeType: 'logicGate',
        x: 100,
        y: 100,
        width: 280,
        height: 230,
        params: {
          blockType: 'Counter4',
          countValue: 9,
          showLabels: true,
          fontSize: 14,
        },
      };
      expect(() => renderSubjectShape(ctxMock, counterShape, 1)).not.toThrow();
      expect(renderedTexts.some((t) => t.toUpperCase().includes('4-BIT BINARY COUNTER'))).toBe(true);
      expect(renderedTexts.some((t) => t.includes('DECIMAL: 9 / 15'))).toBe(true);
    });
  });
});

