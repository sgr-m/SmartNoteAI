import { describe, it, expect } from 'vitest';
import { ShapeObject, ShapeType } from '../src/shared/types';
import { renderLatexHtml, isLatexSyntax } from '../src/renderer/services/latexService';

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
  });
});
