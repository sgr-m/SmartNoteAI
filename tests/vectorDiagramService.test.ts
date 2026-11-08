/**
 * tests/vectorDiagramService.test.ts
 * Verifies code auto-detection and SVG generation for:
 * - Mathematical graphs (Example A: Quadratic equation y = x^2 - 4)
 * - Flowcharts & UML via Mermaid
 * - 2D Geometry
 * - Digital logic circuits
 * - Timing diagrams
 */

import { describe, it, expect } from 'vitest';
import {
  detectDiagramType,
  renderMathGraphSvg,
  renderCircuitSvg,
  renderGeometrySvg,
  renderTimingSvg,
  diagramSvgToDataUrl,
} from '../src/renderer/services/vectorDiagramService';

describe('Vector Diagram Subsystem', () => {
  it('auto-detects mathematical graph JSON correctly (Example A)', () => {
    const quadCode = `{
  "type": "graph",
  "expressions": ["y = x^2 - 4"],
  "xRange": [-5, 5],
  "yRange": [-5, 10],
  "axes": true,
  "grid": true
}`;
    expect(detectDiagramType(quadCode)).toBe('graph');
  });

  it('renders quadratic equation parabola SVG with axes and grid (Example A)', () => {
    const spec = {
      type: 'graph' as const,
      title: 'Parabola y = x^2 - 4',
      expressions: ['y = x^2 - 4'],
      xRange: [-5, 5] as [number, number],
      yRange: [-5, 10] as [number, number],
      axes: true,
      grid: true,
    };
    const svg = renderMathGraphSvg(spec);
    expect(svg).toContain('<svg');
    expect(svg).toContain('y = x^2 - 4');
    expect(svg).toContain('<path'); // the plotted curve
    expect(svg).toContain('class="axis"'); // axes
    expect(svg).toContain('class="grid"'); // grid
  });

  it('auto-detects and renders Mermaid flowcharts', () => {
    const mermaidCode = `flowchart TD
    A[Start] --> B{Is even?}
    B -->|Yes| C[Print Even]
    B -->|No| D[Print Odd]`;
    expect(detectDiagramType(mermaidCode)).toBe('mermaid');
  });

  it('auto-detects and renders Digital Logic Circuits', () => {
    const circuitCode = `{
  "type": "circuit",
  "title": "AND Gate",
  "gates": [{ "type": "AND", "x": 200, "y": 100, "inputs": ["A", "B"], "output": "Y" }]
}`;
    expect(detectDiagramType(circuitCode)).toBe('circuit');
    const svg = renderCircuitSvg(JSON.parse(circuitCode));
    expect(svg).toContain('<svg');
    expect(svg).toContain('class="gate-body"');
    expect(svg).toContain('class="wire"');
  });

  it('auto-detects and renders 2D Geometry', () => {
    const geoCode = `{
  "type": "geometry",
  "title": "Right Triangle",
  "shapes": [{ "kind": "triangle", "points": [[0,0], [4,0], [0,3]], "rightAngle": true }]
}`;
    expect(detectDiagramType(geoCode)).toBe('geometry');
    const svg = renderGeometrySvg(JSON.parse(geoCode));
    expect(svg).toContain('<svg');
    expect(svg).toContain('<polygon');
  });

  it('auto-detects and renders Timing Diagrams (WaveDrom)', () => {
    const timingCode = `{
  "signal": [
    { "name": "clk", "wave": "p........" },
    { "name": "data", "wave": "0.1..0..." }
  ]
}`;
    expect(detectDiagramType(timingCode)).toBe('timing');
    const svg = renderTimingSvg(JSON.parse(timingCode));
    expect(svg).toContain('<svg');
    expect(svg).toContain('class="wave-clk"');
  });

  it('converts SVG to data URL cleanly for whiteboard image placement', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" /></svg>';
    const dataUrl = diagramSvgToDataUrl(svg);
    expect(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(dataUrl).toContain('circle');
  });
});

