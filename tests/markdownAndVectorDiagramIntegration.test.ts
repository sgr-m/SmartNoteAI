import { describe, it, expect } from 'vitest';
import {
  isMarkdownSyntax,
  markdownToHtml,
  measureMarkdownSize,
} from '../src/renderer/services/markdownRenderService';
import {
  detectDiagramType,
  renderDiagramToSvg,
  diagramSvgToDataUrl,
} from '../src/renderer/services/vectorDiagramService';
import { parseMessageSegments } from '../src/renderer/components/aiChat/AIChatSidePanel';

describe('Markdown & KaTeX Integration Service', () => {
  it('correctly detects mixed markdown and inline/display LaTeX syntax', () => {
    expect(isMarkdownSyntax('### Quadratic Equations')).toBe(true);
    expect(isMarkdownSyntax('Vector $B$, calculated as $\\sum_{i=1}^n A_i B_i$')).toBe(true);
    expect(isMarkdownSyntax('**$||A||:$** The Euclidean length $\\sqrt{\\sum_{i=1}^n A_i^2}$')).toBe(true);
    expect(isMarkdownSyntax('$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$')).toBe(true);
    expect(isMarkdownSyntax('1. First item\n2. Second item')).toBe(true);
    expect(isMarkdownSyntax('---')).toBe(true);
    expect(isMarkdownSyntax('plain simple text without symbols')).toBe(false);
  });

  it('renders mixed Markdown + KaTeX without unparsed raw LaTeX tokens', () => {
    const raw = 'Vector $B$, calculated as $\\sum_{i=1}^n A_i B_i$. - **$||A||:$** The Euclidean magnitude $\\sqrt{\\sum_{i=1}^n A_i^2}$.';
    const html = markdownToHtml(raw);

    // KaTeX spans must be rendered (not raw unrendered \sum or \sqrt)
    expect(html).toContain('katex');
    expect(html).toContain('strong');
    expect(html).not.toContain('$\\sum');
    expect(html).not.toContain('$\\sqrt');
  });

  it('measures markdown size accurately with default font size 36', () => {
    const content = '# Main Topic\n\n* First key observation\n* Second key observation';
    const size = measureMarkdownSize(content, 36, 'Inter, sans-serif', 800);
    expect(size.width).toBeGreaterThanOrEqual(200);
    expect(size.height).toBeGreaterThanOrEqual(60);
  });
});

describe('Code-to-Vector Diagram Engine', () => {
  it('accurately auto-detects all required diagram formats', () => {
    // 1. Mermaid Flowchart
    expect(detectDiagramType('graph TD\n  A --> B')).toBe('mermaid');
    // 2. Mathematical Graph (Example A parabola)
    expect(
      detectDiagramType(
        '{\n  "type": "graph",\n  "expressions": ["y = x^2 - 4"],\n  "xRange": [-5, 5],\n  "yRange": [-5, 10]\n}'
      )
    ).toBe('graph');
    // 3. 2D Geometry
    expect(
      detectDiagramType(
        '{\n  "type": "geometry",\n  "shapes": [{ "kind": "triangle", "points": [[0,0],[3,0],[3,4]] }]\n}'
      )
    ).toBe('geometry');
    // 4. Digital Logic Circuit
    expect(
      detectDiagramType(
        '{\n  "type": "circuit",\n  "gates": [{ "type": "AND", "label": "AND1", "x": 100, "y": 100 }]\n}'
      )
    ).toBe('circuit');
    // 5. Timing Diagram
    expect(
      detectDiagramType(
        '{\n  "signal": [{ "name": "clk", "wave": "p..." }]\n}'
      )
    ).toBe('timing');
    // 6. TikZ illustration
    expect(
      detectDiagramType(
        '\\begin{tikzpicture}\n  \\draw (0,0) -- (1,1);\n\\end{tikzpicture}'
      )
    ).toBe('tikz');
  });

  it('renders quadratic parabola graph (Example A) to clean SVG with labeled axes and curves', async () => {
    const code = JSON.stringify({
      type: 'graph',
      expressions: ['y = x^2 - 4'],
      xRange: [-5, 5],
      yRange: [-5, 10],
      axes: true,
      grid: true,
    });

    const res = await renderDiagramToSvg(code, 'graph');
    expect(res.svg).toContain('<svg');
    expect(res.svg).toContain('</svg>');
    expect(res.svg).toContain('<path'); // Curve path
    expect(res.svg).toContain('class="axis"');
    expect(res.svg).toContain('class="grid"');

    const dataUrl = diagramSvgToDataUrl(res.svg);
    expect(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
  });

  it('renders 2D geometry triangle with right angle marker to SVG', async () => {
    const code = JSON.stringify({
      type: 'geometry',
      shapes: [
        {
          kind: 'triangle',
          points: [[-3, -2], [3, -2], [3, 2.5]],
          label: 'Triangle ABC',
          rightAngle: true,
          color: '#38bdf8',
        },
      ],
    });

    const res = await renderDiagramToSvg(code, 'geometry');
    expect(res.svg).toContain('<svg');
    expect(res.svg).toContain('<polygon');
    expect(res.svg).toContain('Triangle ABC');
  });

  it('renders digital logic circuits with gates and connection pins to SVG', async () => {
    const code = JSON.stringify({
      type: 'circuit',
      gates: [
        { type: 'AND', label: 'AND1', x: 200, y: 100 },
        { type: 'OR', label: 'OR1', x: 200, y: 220 },
      ],
      inputs: [{ label: 'A', x: 60, y: 100 }],
      outputs: [{ label: 'Out', x: 340, y: 100 }],
    });

    const res = await renderDiagramToSvg(code, 'circuit');
    expect(res.svg).toContain('<svg');
    expect(res.svg).toContain('class="gate-body"');
    expect(res.svg).toContain('class="wire"');
    expect(res.svg).toContain('class="pin-label"');
  });

  it('renders WaveDrom timing clock waveforms to SVG', async () => {
    const code = JSON.stringify({
      signal: [
        { name: 'CLK', wave: 'p.......' },
        { name: 'DATA', wave: '0.1.0.1.' },
      ],
    });

    const res = await renderDiagramToSvg(code, 'timing');
    expect(res.svg).toContain('<svg');
    expect(res.svg).toContain('CLK');
    expect(res.svg).toContain('DATA');
    expect(res.svg).toContain('class="wave-clk"');
    expect(res.svg).toContain('class="wave-line"');
  });

  it('renders diagrams with transparent backgrounds (never black background)', async () => {
    const graphCode = JSON.stringify({ type: 'graph', expressions: ['y = x^2'] });
    const graphRes = await renderDiagramToSvg(graphCode, 'graph');
    expect(graphRes.svg).not.toContain('fill="#0b1120"');
    expect(graphRes.svg).not.toContain('fill="#0f172a"');

    const geomCode = JSON.stringify({
      type: 'geometry',
      shapes: [{ kind: 'triangle', points: [[-2, -1], [2, -1], [0, 2]] }],
    });
    const geomRes = await renderDiagramToSvg(geomCode, 'geometry');
    expect(geomRes.svg).not.toContain('fill="#0b1120"');
    expect(geomRes.svg).not.toContain('fill="#0f172a"');
  });

  it('customizes diagram color when customColor is provided', async () => {
    const graphCode = JSON.stringify({ type: 'graph', expressions: ['y = x^2'] });
    const res = await renderDiagramToSvg(graphCode, 'graph', '#facc15');
    expect(res.svg).toContain('#facc15');
  });

  it('handles relaxed JSON syntax and missing shapes safely without crashing', async () => {
    // Relaxed unquoted keys or single quotes
    const relaxed = "{ type: 'geometry', title: 'Triangle Demo' }";
    const res = await renderDiagramToSvg(relaxed, 'geometry');
    expect(res.svg).toContain('<svg');
    expect(res.svg).toContain('polygon'); // Auto-fallback default shape
  });
});

describe('AI Teaching Assistant Segmentation & Diagram Detection', () => {
  it('parses diagram code blocks into distinct diagram segments with metadata', () => {
    const response =
      '### Parabola Analysis\n\nHere is the function graph:\n\n---\n\n```graph\n{\n  "type": "graph",\n  "expressions": ["y = x^2 - 4"],\n  "xRange": [-5, 5],\n  "yRange": [-5, 10]\n}\n```\n\n---\n\n* Vertex is at $(0, -4)$\n* Roots at $x = -2, 2$';

    const segments = parseMessageSegments(response);
    const diagramSeg = segments.find((s) => s.type === 'diagram');
    expect(diagramSeg).toBeDefined();
    expect(diagramSeg?.diagramType).toBe('graph');
    expect(diagramSeg?.rawText).toContain('"type": "graph"');

    const formulaOrBullets = segments.filter((s) => s.type === 'bullets' || s.type === 'heading');
    expect(formulaOrBullets.length).toBeGreaterThanOrEqual(1);
  });
});
