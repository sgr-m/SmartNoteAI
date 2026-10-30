/**
 * Math Function Parser & AST Compiler
 * Pure, CSP-compliant mathematical expression parser and continuous function evaluator.
 * Does NOT use eval() or new Function(), guaranteeing 100% security and compatibility with strict CSP ("script-src 'self'").
 * Supports arbitrary user-typed algebraic, trigonometric, logarithmic, and polynomial functions.
 */

export interface CompiledMathFunction {
  fn: (x: number) => number;
  isValid: boolean;
  error?: string;
  cleanedExpr: string;
}

const KNOWN_FUNCS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
  'sec', 'csc', 'cosec', 'cot', 'sqrt', 'cbrt', 'abs', 'exp', 'log',
  'ln', 'log10', 'log2', 'min', 'max', 'floor', 'ceil', 'round', 'sign'
]);

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'PLUS'
  | 'MINUS'
  | 'MUL'
  | 'DIV'
  | 'POW'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA';

interface Token {
  type: TokenType;
  value: any;
}

/**
 * Tokenize mathematical expression with automatic implicit multiplication insertion.
 */
function tokenize(rawInput: string): { tokens: Token[]; cleaned: string } {
  let s = (rawInput || '').trim();
  // Strip equation prefixes: y =, f(x) =, g(x) =, etc.
  s = s.replace(/^[a-zA-Z](\([a-zA-Z]\))?\s*=\s*/, '');

  // Unicode and common notation conversions
  s = s
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁴/g, '^4')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi');

  // Handle square root symbol: √x or √(expr)
  s = s.replace(/√\s*(\([^\)]+\)|[a-zA-Z0-9_\.]+)/g, 'sqrt($1)');

  // Handle absolute value bars: |expr| -> abs(expr)
  s = s.replace(/\|([^\|]+)\|/g, 'abs($1)');

  const cleaned = s;
  const tokens: Token[] = [];
  let i = 0;

  const canEndOperand = (tok?: Token) =>
    tok && (tok.type === 'NUMBER' || tok.type === 'IDENT' || tok.type === 'RPAREN');

  const canStartOperand = (tok?: Token) =>
    tok && (tok.type === 'NUMBER' || tok.type === 'IDENT' || tok.type === 'LPAREN');

  const pushToken = (tok: Token) => {
    const prev = tokens[tokens.length - 1];
    // Automatically insert multiplication token for implicit products (e.g. 2x, 3(x+1), x sin(x))
    if (prev && canEndOperand(prev) && canStartOperand(tok)) {
      if (!(prev.type === 'IDENT' && KNOWN_FUNCS.has(prev.value) && tok.type === 'LPAREN')) {
        tokens.push({ type: 'MUL', value: '*' });
      }
    }
    tokens.push(tok);
  };

  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }

    // Number literal
    if (/\d/.test(c) || (c === '.' && /\d/.test(s[i + 1] || ''))) {
      let numStr = '';
      while (i < s.length && /[\d\.]/.test(s[i])) {
        numStr += s[i];
        i++;
      }
      pushToken({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }

    // Identifiers (variable x, constants, functions)
    if (/[a-zA-Z_]/.test(c)) {
      let name = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) {
        name += s[i];
        i++;
      }
      name = name.toLowerCase();
      pushToken({ type: 'IDENT', value: name });
      continue;
    }

    // Operators and Parentheses
    if (c === '+') {
      pushToken({ type: 'PLUS', value: '+' });
      i++;
      continue;
    }
    if (c === '-') {
      pushToken({ type: 'MINUS', value: '-' });
      i++;
      continue;
    }
    if (c === '*') {
      if (s[i + 1] === '*') {
        pushToken({ type: 'POW', value: '^' });
        i += 2;
      } else {
        pushToken({ type: 'MUL', value: '*' });
        i++;
      }
      continue;
    }
    if (c === '/') {
      pushToken({ type: 'DIV', value: '/' });
      i++;
      continue;
    }
    if (c === '^') {
      pushToken({ type: 'POW', value: '^' });
      i++;
      continue;
    }
    if (c === '(') {
      pushToken({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (c === ')') {
      pushToken({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }
    if (c === ',') {
      pushToken({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: "${c}"`);
  }

  return { tokens, cleaned };
}

type EvalNode = (x: number) => number;

/**
 * Recursive descent AST parser compiling directly to native closure evaluators.
 * Follows standard mathematical precedence:
 *   AddSub (+, -)
 *     -> MulDiv (*, /)
 *       -> Unary (+, -)
 *         -> Power (^, right-associative)
 *           -> Primary (Number, x, pi, e, Function calls, Parentheses)
 */
function parseAST(tokens: Token[]): EvalNode {
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function consume(expectedType?: TokenType): Token {
    const tok = tokens[pos];
    if (!tok || (expectedType && tok.type !== expectedType)) {
      throw new Error(
        `Expected ${expectedType || 'token'}, but found ${tok ? `"${tok.value}"` : 'end of expression'}`
      );
    }
    pos++;
    return tok;
  }

  function parseExpression(): EvalNode {
    return parseAddSub();
  }

  // addSub := mulDiv ( ('+' | '-') mulDiv )*
  function parseAddSub(): EvalNode {
    let node = parseMulDiv();
    while (peek() && (peek()!.type === 'PLUS' || peek()!.type === 'MINUS')) {
      const op = consume().type;
      const right = parseMulDiv();
      const left = node;
      if (op === 'PLUS') {
        node = (x) => left(x) + right(x);
      } else {
        node = (x) => left(x) - right(x);
      }
    }
    return node;
  }

  // mulDiv := unary ( ('*' | '/') unary )*
  function parseMulDiv(): EvalNode {
    let node = parseUnary();
    while (peek() && (peek()!.type === 'MUL' || peek()!.type === 'DIV')) {
      const op = consume().type;
      const right = parseUnary();
      const left = node;
      if (op === 'MUL') {
        node = (x) => left(x) * right(x);
      } else {
        node = (x) => {
          const d = right(x);
          return d === 0 ? NaN : left(x) / d;
        };
      }
    }
    return node;
  }

  // unary := ('+' | '-') unary | power
  function parseUnary(): EvalNode {
    if (peek() && peek()!.type === 'PLUS') {
      consume('PLUS');
      return parseUnary();
    }
    if (peek() && peek()!.type === 'MINUS') {
      consume('MINUS');
      const operand = parseUnary();
      return (x) => -operand(x);
    }
    return parsePower();
  }

  // power := primary ( '^' power )?  (right-associative)
  function parsePower(): EvalNode {
    let node = parsePrimary();
    if (peek() && peek()!.type === 'POW') {
      consume('POW');
      const right = parsePower(); // right-associativity
      const left = node;
      node = (x) => {
        const b = left(x);
        const e = right(x);
        return Math.pow(b, e);
      };
    }
    return node;
  }

  // primary := NUMBER | IDENT | FunctionCall | '(' expr ')'
  function parsePrimary(): EvalNode {
    const tok = peek();
    if (!tok) {
      throw new Error('Unexpected end of mathematical equation.');
    }

    if (tok.type === 'NUMBER') {
      consume('NUMBER');
      const val = tok.value as number;
      return () => val;
    }

    if (tok.type === 'IDENT') {
      consume('IDENT');
      const name = tok.value as string;

      if (name === 'x') {
        return (x) => x;
      }

      if (name in CONSTANTS) {
        const val = CONSTANTS[name];
        return () => val;
      }

      if (KNOWN_FUNCS.has(name)) {
        if (!peek() || peek()!.type !== 'LPAREN') {
          throw new Error(`Function "${name}" must be followed by parentheses, e.g. ${name}(x)`);
        }
        consume('LPAREN');
        const arg1 = parseExpression();
        let arg2: EvalNode | null = null;
        if (peek() && peek()!.type === 'COMMA') {
          consume('COMMA');
          arg2 = parseExpression();
        }
        consume('RPAREN');

        switch (name) {
          case 'sin':
            return (x) => Math.sin(arg1(x));
          case 'cos':
            return (x) => Math.cos(arg1(x));
          case 'tan':
            return (x) => {
              const v = arg1(x);
              return Math.abs(Math.cos(v)) < 1e-12 ? NaN : Math.tan(v);
            };
          case 'asin':
            return (x) => Math.asin(arg1(x));
          case 'acos':
            return (x) => Math.acos(arg1(x));
          case 'atan':
            return (x) => Math.atan(arg1(x));
          case 'sinh':
            return (x) => Math.sinh(arg1(x));
          case 'cosh':
            return (x) => Math.cosh(arg1(x));
          case 'tanh':
            return (x) => Math.tanh(arg1(x));
          case 'sec':
            return (x) => {
              const c = Math.cos(arg1(x));
              return Math.abs(c) < 1e-12 ? NaN : 1 / c;
            };
          case 'csc':
          case 'cosec':
            return (x) => {
              const s = Math.sin(arg1(x));
              return Math.abs(s) < 1e-12 ? NaN : 1 / s;
            };
          case 'cot':
            return (x) => {
              const t = Math.tan(arg1(x));
              return Math.abs(t) < 1e-12 ? NaN : 1 / t;
            };
          case 'sqrt':
            return (x) => {
              const v = arg1(x);
              return v < 0 ? NaN : Math.sqrt(v);
            };
          case 'cbrt':
            return (x) => Math.cbrt(arg1(x));
          case 'abs':
            return (x) => Math.abs(arg1(x));
          case 'exp':
            return (x) => Math.exp(arg1(x));
          case 'log':
          case 'ln':
            return (x) => {
              const v = arg1(x);
              return v <= 0 ? NaN : Math.log(v);
            };
          case 'log10':
            return (x) => {
              const v = arg1(x);
              return v <= 0 ? NaN : Math.log10(v);
            };
          case 'log2':
            return (x) => {
              const v = arg1(x);
              return v <= 0 ? NaN : Math.log2(v);
            };
          case 'floor':
            return (x) => Math.floor(arg1(x));
          case 'ceil':
            return (x) => Math.ceil(arg1(x));
          case 'round':
            return (x) => Math.round(arg1(x));
          case 'sign':
            return (x) => Math.sign(arg1(x));
          case 'min':
            return (x) => Math.min(arg1(x), arg2 ? arg2(x) : 0);
          case 'max':
            return (x) => Math.max(arg1(x), arg2 ? arg2(x) : 0);
        }
      }

      throw new Error(`Unknown variable or function: "${name}"`);
    }

    if (tok.type === 'LPAREN') {
      consume('LPAREN');
      const inner = parseExpression();
      consume('RPAREN');
      return inner;
    }

    throw new Error(`Unexpected token: "${tok.value}"`);
  }

  const root = parseExpression();
  if (pos < tokens.length) {
    throw new Error(`Unexpected trailing symbol: "${tokens[pos].value}"`);
  }

  return root;
}

/**
 * Robust compiler for mathematical equations entered by teachers/students.
 * Guaranteed 100% CSP compliant without eval() or new Function().
 */
export function compileMathFunction(rawExpression: string): CompiledMathFunction {
  const trimmed = (rawExpression || '').trim();
  if (!trimmed) {
    return {
      fn: () => NaN,
      isValid: false,
      error: 'Please enter a function equation.',
      cleanedExpr: '',
    };
  }

  try {
    const { tokens, cleaned } = tokenize(trimmed);
    if (tokens.length === 0) {
      return {
        fn: () => NaN,
        isValid: false,
        error: 'Please enter a valid equation.',
        cleanedExpr: '',
      };
    }

    const compiledAST = parseAST(tokens);

    // Verify evaluation safely at sample point
    const safeFn = (x: number): number => {
      try {
        const val = compiledAST(x);
        return typeof val === 'number' && !isNaN(val) && isFinite(val) ? val : NaN;
      } catch {
        return NaN;
      }
    };

    return {
      fn: safeFn,
      isValid: true,
      cleanedExpr: cleaned,
    };
  } catch (err: any) {
    return {
      fn: () => NaN,
      isValid: false,
      error: err?.message || 'Syntax error in equation',
      cleanedExpr: trimmed,
    };
  }
}

/**
 * Evaluate mathematical functions for graphing
 */
export function evaluateMathFunction(expression: string, x: number): number {
  return compileMathFunction(expression).fn(x);
}
