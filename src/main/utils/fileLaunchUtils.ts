import fs from 'fs';
import path from 'path';

function defaultIsExistingFile(candidatePath: string): boolean {
  try {
    return fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile();
  } catch {
    return false;
  }
}

export function isSblFilePath(candidate: string): boolean {
  return typeof candidate === 'string' && /\.sbl$/i.test(candidate.trim());
}

/**
 * Normalize a CLI argument or file:// URI into a clean local file path if it points to a .sbl file.
 */
export function normalizeSblCandidate(
  rawArg: string,
  workingDirectory?: string
): string | null {
  if (typeof rawArg !== 'string') return null;

  let trimmed = rawArg.trim().replace(/^"(.*)"$/, '$1').trim();
  if (!trimmed || trimmed.startsWith('-')) return null;

  if (/^file:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      let pathname = decodeURIComponent(parsed.pathname);
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(pathname)) {
        pathname = pathname.slice(1);
      }
      trimmed = pathname;
    } catch {
      return null;
    }
  }

  if (!isSblFilePath(trimmed)) return null;

  if (path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }
  return path.resolve(workingDirectory || process.cwd(), trimmed);
}

/**
 * Extract the first existing .sbl lesson file path passed via process.argv or Electron second-instance commandLine.
 */
export function extractSblFilePathFromArgv(
  argv: readonly string[],
  fileExists: (candidatePath: string) => boolean = defaultIsExistingFile,
  workingDirectory?: string
): string | null {
  if (!Array.isArray(argv) || argv.length === 0) return null;

  for (let i = 1; i < argv.length; i++) {
    const resolved = normalizeSblCandidate(argv[i], workingDirectory);
    if (!resolved) continue;
    if (fileExists(resolved)) {
      return resolved;
    }
  }

  return null;
}

