import { describe, it, expect } from 'vitest';
import {
  parseMessageSegments,
  ContentSegment,
  isGreetingOrChitchat,
} from '../src/renderer/components/aiChat/AIChatSidePanel';

describe('SmartNoteAI Modular Segment Parser & LaTeX Drag-and-Drop', () => {
  it('parses modular segments separated by --- dividers', () => {
    const rawAiResponse = `### 1. Concept: Quadratic Equations
A quadratic equation is a second-order polynomial equation in a single variable $x$.

---

### 2. Standard Form
$$ax^2 + bx + c = 0 \\quad (a \\ne 0)$$

---

### 3. Quadratic Formula Derivation
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

---

### 4. Classroom Practice Questions
* **Question 1:** Solve $x^2 - 5x + 6 = 0$.
* **Question 2:** Find the discriminant of $2x^2 + 4x + 2 = 0$.`;

    const segments = parseMessageSegments(rawAiResponse);
    expect(segments.length).toBeGreaterThanOrEqual(4);

    // Verify formula segment exists and has isFormula: true
    const formulaSegments = segments.filter((s) => s.isFormula);
    expect(formulaSegments.length).toBe(2);
    expect(formulaSegments[0].rawText).toContain('ax^2 + bx + c = 0');
    expect(formulaSegments[1].rawText).toContain('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');

    // Verify questions segment
    const bulletSegments = segments.filter((s) => s.type === 'bullets');
    expect(bulletSegments.length).toBeGreaterThanOrEqual(1);
    expect(bulletSegments[0].rawText).toContain('Question 1:');
  });

  it('isolates display formulas embedded inside an un-divided paragraph', () => {
    const textWithEmbeddedFormula = `Here is the famous equation for energy-mass equivalence:
$$E = mc^2$$
where $E$ represents energy, $m$ is mass, and $c$ is the speed of light in vacuum.`;

    const segments = parseMessageSegments(textWithEmbeddedFormula);
    const formulaSeg = segments.find((s) => s.isFormula);
    expect(formulaSeg).toBeDefined();
    expect(formulaSeg?.rawText).toBe('$$E = mc^2$$');
    expect(formulaSeg?.type).toBe('formula');
  });

  it('detects and classifies code blocks and comparison tables', () => {
    const codeAndTable = `\`\`\`python
def quadratic_roots(a, b, c):
    d = (b**2 - 4*a*c) ** 0.5
    return (-b + d) / (2*a), (-b - d) / (2*a)
\`\`\`

---

| Feature | Linear | Quadratic |
|---|---|---|
| Degree | 1 | 2 |
| Graph | Line | Parabola |`;

    const segments = parseMessageSegments(codeAndTable);
    const codeSeg = segments.find((s) => s.type === 'code');
    const tableSeg = segments.find((s) => s.type === 'table');

    expect(codeSeg).toBeDefined();
    expect(codeSeg?.rawText).toContain('def quadratic_roots');
    expect(tableSeg).toBeDefined();
    expect(tableSeg?.rawText).toContain('| Feature | Linear | Quadratic |');
  });

  it('handles fallback single-paragraph text cleanly without errors', () => {
    const plainText = 'Photosynthesis is the biological process by which green plants convert light energy into chemical energy.';
    const segments = parseMessageSegments(plainText);
    expect(segments.length).toBe(1);
    expect(segments[0].type).toBe('paragraph');
    expect(segments[0].isFormula).toBe(false);
  });

  it('correctly splits headings and following explanation into distinct cards without duplicate titles', () => {
    const headingBlock = `### Step-by-Step Methods to Solve Quadratic Equations
Here are the two primary methods prescribed for Class 10th:
1. Factorization
2. Quadratic Formula`;

    const segments = parseMessageSegments(headingBlock);
    expect(segments.length).toBe(2);

    const headingSeg = segments[0];
    expect(headingSeg.type).toBe('heading');
    expect(headingSeg.rawText).toBe('### Step-by-Step Methods to Solve Quadratic Equations');
    expect(headingSeg.displayTitle).toBe('Step-by-Step Methods to Solve Qu');

    const contentSeg = segments[1];
    expect(contentSeg.rawText).toContain('Here are the two primary methods');
    expect(contentSeg.rawText).not.toContain('### Step-by-Step Methods');
  });

  it('correctly detects greetings and introductory queries to prevent hallucinated lessons', () => {
    expect(isGreetingOrChitchat('hi')).toBe(true);
    expect(isGreetingOrChitchat('HI')).toBe(true);
    expect(isGreetingOrChitchat('hello')).toBe(true);
    expect(isGreetingOrChitchat('hey there')).toBe(true);
    expect(isGreetingOrChitchat('Good morning')).toBe(true);
    expect(isGreetingOrChitchat('who are you')).toBe(true);
    expect(isGreetingOrChitchat('what can you do')).toBe(true);

    // Real curriculum queries must NOT be classified as greetings
    expect(isGreetingOrChitchat('explain quadratic equation')).toBe(false);
    expect(isGreetingOrChitchat('what is atmospheric pressure')).toBe(false);
    expect(isGreetingOrChitchat('derive pythagorean theorem')).toBe(false);
    expect(isGreetingOrChitchat('history of indian independence')).toBe(false);
  });
});

