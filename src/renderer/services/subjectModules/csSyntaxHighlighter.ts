/**
 * Computer Science Syntax Highlighter & Pseudocode-to-Flowchart Parser
 * Supports tokenization for Python, JavaScript, Java, C++, SQL, Pseudocode,
 * and algorithm analysis to convert pseudocode into interactive flowchart graphs.
 */

export type TokenType =
  | 'keyword'
  | 'control'
  | 'declaration'
  | 'type'
  | 'string'
  | 'number'
  | 'comment'
  | 'function'
  | 'operator'
  | 'plain';

export interface CodeToken {
  text: string;
  type: TokenType;
}

export interface FlowchartGraphNode {
  id: string;
  type: 'terminator' | 'process' | 'decision' | 'inputOutput' | 'connector' | 'subroutine';
  label: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface FlowchartGraphEdge {
  from: string;
  to: string;
  label?: string; // e.g. "Yes", "No", "True", "False"
}

export interface FlowchartGraph {
  title: string;
  nodes: FlowchartGraphNode[];
  edges: FlowchartGraphEdge[];
}

// ─── Language Keywords ────────────────────────────────────────────────────────

const KEYWORDS_BY_LANG: Record<string, string[]> = {
  python: [
    'def', 'class', 'return', 'if', 'elif', 'else', 'while', 'for', 'in', 'import',
    'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield',
    'pass', 'break', 'continue', 'and', 'or', 'not', 'is', 'None', 'True', 'False',
    'async', 'await', 'global', 'nonlocal', 'assert'
  ],
  javascript: [
    'function', 'const', 'let', 'var', 'return', 'if', 'else', 'while', 'for', 'of',
    'in', 'import', 'export', 'default', 'from', 'as', 'try', 'catch', 'finally',
    'throw', 'new', 'class', 'extends', 'super', 'this', 'async', 'await', 'yield',
    'break', 'continue', 'switch', 'case', 'typeof', 'instanceof', 'true', 'false', 'null', 'undefined'
  ],
  typescript: [
    'function', 'const', 'let', 'var', 'return', 'if', 'else', 'while', 'for', 'of',
    'in', 'import', 'export', 'default', 'from', 'as', 'try', 'catch', 'finally',
    'throw', 'new', 'class', 'extends', 'super', 'this', 'async', 'await', 'yield',
    'break', 'continue', 'switch', 'case', 'typeof', 'instanceof', 'true', 'false',
    'null', 'undefined', 'interface', 'type', 'enum', 'implements', 'declare', 'abstract',
    'private', 'protected', 'public', 'readonly', 'as', 'keyof'
  ],
  cpp: [
    'int', 'float', 'double', 'char', 'void', 'bool', 'auto', 'long', 'short',
    'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default', 'break', 'continue',
    'return', 'class', 'struct', 'public', 'private', 'protected', 'virtual', 'override',
    'new', 'delete', 'namespace', 'using', 'std', 'include', 'template', 'typename',
    'const', 'static', 'nullptr', 'true', 'false', 'sizeof'
  ],
  java: [
    'public', 'private', 'protected', 'class', 'interface', 'enum', 'extends', 'implements',
    'static', 'final', 'void', 'int', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'long',
    'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default', 'break', 'continue',
    'return', 'new', 'this', 'super', 'try', 'catch', 'finally', 'throw', 'throws',
    'import', 'package', 'true', 'false', 'null'
  ],
  sql: [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'JOIN', 'LEFT',
    'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT',
    'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'AND', 'OR', 'NOT',
    'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'CREATE', 'TABLE', 'DROP', 'ALTER',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'VALUES', 'UNION', 'ALL'
  ],
  pseudocode: [
    'START', 'BEGIN', 'END', 'STOP', 'PROCEDURE', 'ENDPROCEDURE', 'END PROCEDURE',
    'FUNCTION', 'ENDFUNCTION', 'END FUNCTION', 'RETURNS', 'RETURN', 'CALL',
    'DECLARE', 'CONSTANT', 'INPUT', 'OUTPUT', 'PRINT', 'READ', 'WRITE',
    'IF', 'THEN', 'ELSE', 'ENDIF', 'END IF', 'CASE', 'OF', 'OTHERWISE', 'ENDCASE', 'END CASE',
    'FOR', 'TO', 'STEP', 'NEXT', 'ENDFOR', 'END FOR',
    'WHILE', 'DO', 'ENDWHILE', 'END WHILE', 'REPEAT', 'UNTIL',
    'INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN', 'ARRAY', 'TRUE', 'FALSE', 'AND', 'OR', 'NOT', 'MOD', 'DIV'
  ]
};

// ─── Tokenizer ────────────────────────────────────────────────────────────────

export function tokenizeCodeLine(line: string, language: string = 'python'): CodeToken[] {
  const tokens: CodeToken[] = [];
  const langKey = language.toLowerCase();
  const keywords = new Set(
    (KEYWORDS_BY_LANG[langKey] || KEYWORDS_BY_LANG.python).map((k) =>
      langKey === 'sql' || langKey === 'pseudocode' ? k.toUpperCase() : k
    )
  );

  let i = 0;
  const len = line.length;

  while (i < len) {
    const char = line[i];

    // 1. Whitespace (preserve exact indentation)
    if (char === ' ' || char === '\t') {
      let space = '';
      while (i < len && (line[i] === ' ' || line[i] === '\t')) {
        space += line[i];
        i++;
      }
      tokens.push({ text: space, type: 'plain' });
      continue;
    }

    // 2. Comments
    if (
      (char === '#' && (langKey === 'python' || langKey === 'sql')) ||
      (char === '/' && line[i + 1] === '/') ||
      (char === '-' && line[i + 1] === '-' && langKey === 'sql')
    ) {
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }

    // 3. String literals (single, double, or backtick)
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let str = quote;
      i++;
      while (i < len) {
        if (line[i] === '\\' && i + 1 < len) {
          str += line[i] + line[i + 1];
          i += 2;
          continue;
        }
        str += line[i];
        if (line[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ text: str, type: 'string' });
      continue;
    }

    // 4. Numbers
    if (/\d/.test(char)) {
      let num = '';
      while (i < len && /[\d._a-fA-Fx]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push({ text: num, type: 'number' });
      continue;
    }

    // 5. Pseudocode Assignment arrow (←, <-, :=)
    if (char === '←' || (char === '<' && line[i + 1] === '-') || (char === ':' && line[i + 1] === '=')) {
      const arrow = char === '←' ? '←' : line.slice(i, i + 2);
      tokens.push({ text: arrow, type: 'operator' });
      i += arrow.length;
      continue;
    }

    // 6. Words / Identifiers
    if (/[a-zA-Z_$]/.test(char)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(line[i])) {
        word += line[i];
        i++;
      }

      // Check if keyword
      const checkWord = langKey === 'sql' || langKey === 'pseudocode' ? word.toUpperCase() : word;
      if (keywords.has(checkWord)) {
        // Special categorization for pseudocode
        if (langKey === 'pseudocode') {
          if (['IF', 'THEN', 'ELSE', 'ENDIF', 'END IF', 'CASE', 'OF', 'OTHERWISE', 'ENDCASE', 'FOR', 'TO', 'STEP', 'NEXT', 'WHILE', 'DO', 'ENDWHILE', 'REPEAT', 'UNTIL'].includes(checkWord)) {
            tokens.push({ text: word, type: 'control' });
          } else if (['INPUT', 'OUTPUT', 'PRINT', 'READ', 'WRITE'].includes(checkWord)) {
            tokens.push({ text: word, type: 'keyword' });
          } else if (['DECLARE', 'CONSTANT', 'INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN', 'ARRAY'].includes(checkWord)) {
            tokens.push({ text: word, type: 'declaration' });
          } else if (['PROCEDURE', 'FUNCTION', 'RETURNS', 'RETURN', 'CALL', 'START', 'BEGIN', 'END', 'STOP'].includes(checkWord)) {
            tokens.push({ text: word, type: 'function' });
          } else {
            tokens.push({ text: word, type: 'keyword' });
          }
        } else {
          // Check if followed by open parenthesis -> function
          let nextIdx = i;
          while (nextIdx < len && (line[nextIdx] === ' ' || line[nextIdx] === '\t')) nextIdx++;
          if (['def', 'function', 'class'].includes(word)) {
            tokens.push({ text: word, type: 'declaration' });
          } else {
            tokens.push({ text: word, type: 'keyword' });
          }
        }
      } else {
        // Check if function call
        let nextIdx = i;
        while (nextIdx < len && (line[nextIdx] === ' ' || line[nextIdx] === '\t')) nextIdx++;
        if (line[nextIdx] === '(') {
          tokens.push({ text: word, type: 'function' });
        } else {
          tokens.push({ text: word, type: 'plain' });
        }
      }
      continue;
    }

    // 7. Operators and punctuation
    tokens.push({ text: char, type: 'operator' });
    i++;
  }

  return tokens;
}

export function getTokenColor(type: TokenType, theme: 'dark' | 'light' = 'dark'): string {
  if (theme === 'light') {
    switch (type) {
      case 'keyword':
      case 'control':
        return '#7c3aed'; // Purple
      case 'declaration':
      case 'type':
        return '#0284c7'; // Deep Cyan
      case 'string':
        return '#059669'; // Forest Green
      case 'number':
        return '#d97706'; // Dark Amber
      case 'comment':
        return '#64748b'; // Muted Slate
      case 'function':
        return '#2563eb'; // Royal Blue
      case 'operator':
        return '#e11d48'; // Rose
      case 'plain':
      default:
        return '#1e293b'; // Charcoal
    }
  }

  // Dark Theme (VS Code Modern Dark)
  switch (type) {
    case 'keyword':
      return '#38bdf8'; // Sky blue
    case 'control':
      return '#c084fc'; // Purple / Violet
    case 'declaration':
      return '#38bdf8'; // Cyan
    case 'type':
      return '#facc15'; // Yellow
    case 'string':
      return '#34d399'; // Emerald
    case 'number':
      return '#fbbf24'; // Amber
    case 'comment':
      return '#64748b'; // Dim slate
    case 'function':
      return '#60a5fa'; // Light blue
    case 'operator':
      return '#f43f5e'; // Rose
    case 'plain':
    default:
      return '#f8fafc'; // Crisp off-white
  }
}

// ─── Pseudocode-to-Flowchart Converter ────────────────────────────────────────

/**
 * Intelligent algorithm converter that translates pseudocode statements into
 * standard flowchart nodes (Terminator, Input/Output, Process, Decision)
 * and connects them with logical directional arrows.
 */
export function convertPseudocodeToFlowchart(
  pseudocode: string,
  title: string = 'Algorithm Flowchart'
): FlowchartGraph {
  const lines = pseudocode
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

  const nodes: FlowchartGraphNode[] = [];
  const edges: FlowchartGraphEdge[] = [];

  let nodeIdCounter = 1;
  const getNextId = () => String(nodeIdCounter++);

  // Start Node
  const startId = getNextId();
  let startLabel = 'Start';
  let firstIdx = 0;

  if (lines.length > 0 && /^(START|BEGIN|PROCEDURE|FUNCTION)\b/i.test(lines[0])) {
    const match = lines[0].match(/^(?:PROCEDURE|FUNCTION)\s+([A-Za-z0-9_]+)/i);
    startLabel = match ? `Start: ${match[1]}` : 'Start';
    firstIdx = 1;
  }

  nodes.push({ id: startId, type: 'terminator', label: startLabel });
  let previousNodeId = startId;

  // Process lines sequentially
  for (let i = firstIdx; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    // End / Stop
    if (
      upper === 'END' ||
      upper === 'STOP' ||
      upper === 'END PROCEDURE' ||
      upper === 'ENDPROCEDURE' ||
      upper === 'END FUNCTION' ||
      upper === 'ENDFUNCTION'
    ) {
      const endId = getNextId();
      nodes.push({ id: endId, type: 'terminator', label: 'End' });
      edges.push({ from: previousNodeId, to: endId });
      previousNodeId = endId;
      break;
    }

    // Input / Output statements
    if (/^(INPUT|READ|GET|PROMPT)\b/i.test(line)) {
      const clean = line.replace(/^(INPUT|READ|GET|PROMPT)\s*/i, '').trim();
      const ioId = getNextId();
      nodes.push({ id: ioId, type: 'inputOutput', label: `Read ${clean || 'Input'}` });
      edges.push({ from: previousNodeId, to: ioId });
      previousNodeId = ioId;
      continue;
    }

    if (/^(OUTPUT|PRINT|DISPLAY|WRITE)\b/i.test(line)) {
      const clean = line.replace(/^(OUTPUT|PRINT|DISPLAY|WRITE)\s*/i, '').trim();
      const ioId = getNextId();
      nodes.push({ id: ioId, type: 'inputOutput', label: `Print ${clean || 'Output'}` });
      edges.push({ from: previousNodeId, to: ioId });
      previousNodeId = ioId;
      continue;
    }

    // Conditional statements: IF ... THEN ... [ELSE] ... ENDIF
    if (/^IF\b/i.test(line)) {
      const condMatch = line.match(/^IF\s+(.+?)\s+THEN\b/i);
      const condition = condMatch ? condMatch[1].trim() : line.replace(/^IF\s*/i, '').trim();

      const decisionId = getNextId();
      nodes.push({ id: decisionId, type: 'decision', label: `${condition} ?` });
      edges.push({ from: previousNodeId, to: decisionId });

      // Lookahead for then-block and optional else-block
      let thenStatement = 'Execute Action';
      let elseStatement: string | null = null;
      let j = i + 1;

      while (j < lines.length && !/^END\s*IF\b/i.test(lines[j]) && !/^ENDIF\b/i.test(lines[j])) {
        if (/^ELSE\b/i.test(lines[j])) {
          j++;
          if (j < lines.length && !/^END\s*IF\b/i.test(lines[j]) && !/^ENDIF\b/i.test(lines[j])) {
            elseStatement = lines[j];
          }
        } else if (!elseStatement) {
          thenStatement = lines[j];
        }
        j++;
      }

      // Add Yes branch process node
      const yesId = getNextId();
      nodes.push({ id: yesId, type: 'process', label: cleanStatement(thenStatement) });
      edges.push({ from: decisionId, to: yesId, label: 'Yes' });

      // Optional No branch
      let noTargetId = yesId;
      if (elseStatement) {
        const noId = getNextId();
        nodes.push({ id: noId, type: 'process', label: cleanStatement(elseStatement) });
        edges.push({ from: decisionId, to: noId, label: 'No' });
        noTargetId = noId;
      }

      // Join connector
      const joinId = getNextId();
      nodes.push({ id: joinId, type: 'connector', label: '•' });
      edges.push({ from: yesId, to: joinId });
      if (elseStatement) {
        edges.push({ from: noTargetId, to: joinId });
      } else {
        edges.push({ from: decisionId, to: joinId, label: 'No' });
      }

      previousNodeId = joinId;
      i = j; // Advance past END IF
      continue;
    }

    // Loops: WHILE ... DO ... ENDWHILE
    if (/^WHILE\b/i.test(line)) {
      const condMatch = line.match(/^WHILE\s+(.+?)\s+DO\b/i);
      const condition = condMatch ? condMatch[1].trim() : line.replace(/^WHILE\s*/i, '').trim();

      const decisionId = getNextId();
      nodes.push({ id: decisionId, type: 'decision', label: `${condition} ?` });
      edges.push({ from: previousNodeId, to: decisionId });

      // Lookahead for loop body
      let bodyStatement = 'Loop Step';
      let j = i + 1;
      while (j < lines.length && !/^END\s*WHILE\b/i.test(lines[j]) && !/^ENDWHILE\b/i.test(lines[j])) {
        bodyStatement = lines[j];
        j++;
      }

      const bodyId = getNextId();
      nodes.push({ id: bodyId, type: 'process', label: cleanStatement(bodyStatement) });
      edges.push({ from: decisionId, to: bodyId, label: 'True' });
      edges.push({ from: bodyId, to: decisionId }); // Loopback arrow!

      // After loop
      const exitId = getNextId();
      nodes.push({ id: exitId, type: 'connector', label: '•' });
      edges.push({ from: decisionId, to: exitId, label: 'False' });

      previousNodeId = exitId;
      i = j;
      continue;
    }

    // Loops: FOR i ← 1 TO N ... NEXT
    if (/^FOR\b/i.test(line)) {
      const forId = getNextId();
      nodes.push({ id: forId, type: 'process', label: cleanStatement(line) });
      edges.push({ from: previousNodeId, to: forId });

      let bodyStatement = 'Process Item';
      let j = i + 1;
      while (j < lines.length && !/^NEXT\b/i.test(lines[j]) && !/^END\s*FOR\b/i.test(lines[j])) {
        bodyStatement = lines[j];
        j++;
      }

      const bodyId = getNextId();
      nodes.push({ id: bodyId, type: 'process', label: cleanStatement(bodyStatement) });
      edges.push({ from: forId, to: bodyId, label: 'Each' });
      edges.push({ from: bodyId, to: forId }); // Loopback arrow

      const exitId = getNextId();
      nodes.push({ id: exitId, type: 'connector', label: '•' });
      edges.push({ from: forId, to: exitId, label: 'Done' });

      previousNodeId = exitId;
      i = j;
      continue;
    }

    // Declarations & standard process / assignments
    if (/^(DECLARE|CONSTANT)\b/i.test(line)) {
      const declId = getNextId();
      nodes.push({ id: declId, type: 'process', label: cleanStatement(line) });
      edges.push({ from: previousNodeId, to: declId });
      previousNodeId = declId;
      continue;
    }

    // Return statement
    if (/^RETURN\b/i.test(line)) {
      const retId = getNextId();
      nodes.push({ id: retId, type: 'terminator', label: line });
      edges.push({ from: previousNodeId, to: retId });
      previousNodeId = retId;
      continue;
    }

    // Default: General process / assignment
    const procId = getNextId();
    nodes.push({ id: procId, type: 'process', label: cleanStatement(line) });
    edges.push({ from: previousNodeId, to: procId });
    previousNodeId = procId;
  }

  // Ensure last node has an End terminator if not already terminated
  const lastNode = nodes[nodes.length - 1];
  if (lastNode && lastNode.type !== 'terminator') {
    const endId = getNextId();
    nodes.push({ id: endId, type: 'terminator', label: 'End' });
    edges.push({ from: previousNodeId, to: endId });
  }

  // Calculate coordinates for neat vertical flowchart layout
  layoutFlowchartGraph(nodes, edges);

  return { title, nodes, edges };
}

function cleanStatement(stmt: string): string {
  return stmt
    .replace(/^PROCEDURE\s+/i, '')
    .replace(/^FUNCTION\s+/i, '')
    .replace(/^DECLARE\s+/i, 'Decl: ')
    .trim()
    .slice(0, 32);
}

/**
 * Calculates responsive (x, y) coordinates for flowchart graph nodes
 */
export function layoutFlowchartGraph(nodes: FlowchartGraphNode[], edges: FlowchartGraphEdge[]) {
  const startX = 260;
  let curY = 50;
  const vGap = 80;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.width = node.type === 'decision' ? 160 : node.type === 'terminator' ? 140 : node.type === 'connector' ? 36 : 180;
    node.height = node.type === 'decision' ? 90 : node.type === 'terminator' ? 50 : node.type === 'connector' ? 36 : 65;

    // Center on X
    node.x = startX - (node.width / 2);
    node.y = curY;

    curY += node.height + vGap;
  }
}

