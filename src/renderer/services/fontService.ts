/**
 * fontService.ts — Windows Font Library Service
 * Provides comprehensive, fast, zero-lag Windows system fonts and background font discovery.
 */

export interface FontOption {
  family: string;
  label: string;
  category: 'Teaching & Chalkboard' | 'Modern Sans' | 'Serif & Academic' | 'Math & Code' | 'Display & Header';
}

export const SYSTEM_WINDOWS_FONTS: FontOption[] = [
  // ─── Teaching & Chalkboard ───
  { family: '"Comic Sans MS", cursive, sans-serif', label: 'Comic Sans MS (Chalkboard)', category: 'Teaching & Chalkboard' },
  { family: '"Segoe Print", cursive, sans-serif', label: 'Segoe Print (Handwriting)', category: 'Teaching & Chalkboard' },
  { family: '"Segoe Script", cursive, sans-serif', label: 'Segoe Script (Cursive)', category: 'Teaching & Chalkboard' },
  { family: '"Ink Free", cursive, sans-serif', label: 'Ink Free (Casual Pen)', category: 'Teaching & Chalkboard' },
  { family: '"Bradley Hand ITC", cursive, sans-serif', label: 'Bradley Hand (Artistic)', category: 'Teaching & Chalkboard' },

  // ─── Modern Sans-Serif ───
  { family: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif', label: 'Segoe UI (Windows Default)', category: 'Modern Sans' },
  { family: 'Calibri, sans-serif', label: 'Calibri (Office Standard)', category: 'Modern Sans' },
  { family: 'Arial, sans-serif', label: 'Arial (Clean Standard)', category: 'Modern Sans' },
  { family: 'Inter, sans-serif', label: 'Inter (Modern Digital)', category: 'Modern Sans' },
  { family: 'Verdana, sans-serif', label: 'Verdana (High Legibility)', category: 'Modern Sans' },
  { family: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS', category: 'Modern Sans' },
  { family: 'Tahoma, sans-serif', label: 'Tahoma', category: 'Modern Sans' },
  { family: '"Century Gothic", sans-serif', label: 'Century Gothic (Geometric)', category: 'Modern Sans' },
  { family: '"Franklin Gothic Medium", sans-serif', label: 'Franklin Gothic', category: 'Modern Sans' },
  { family: 'Corbel, sans-serif', label: 'Corbel (Soft Sans)', category: 'Modern Sans' },
  { family: 'Candara, sans-serif', label: 'Candara', category: 'Modern Sans' },
  { family: 'Aptos, sans-serif', label: 'Aptos (New Microsoft Font)', category: 'Modern Sans' },

  // ─── Serif & Academic ───
  { family: 'Cambria, serif', label: 'Cambria (Academic Standard)', category: 'Serif & Academic' },
  { family: 'Georgia, serif', label: 'Georgia (Editorial Serif)', category: 'Serif & Academic' },
  { family: '"Times New Roman", serif', label: 'Times New Roman (Formal)', category: 'Serif & Academic' },
  { family: '"Palatino Linotype", serif', label: 'Palatino Linotype', category: 'Serif & Academic' },
  { family: 'Garamond, serif', label: 'Garamond (Classic Book)', category: 'Serif & Academic' },
  { family: '"Book Antiqua", serif', label: 'Book Antiqua', category: 'Serif & Academic' },
  { family: 'Constantia, serif', label: 'Constantia', category: 'Serif & Academic' },
  { family: '"Baskerville Old Face", serif', label: 'Baskerville', category: 'Serif & Academic' },

  // ─── Math & Code ───
  { family: '"Cascadia Code", Consolas, monospace', label: 'Cascadia Code (Windows Terminal)', category: 'Math & Code' },
  { family: 'Consolas, monospace', label: 'Consolas (Clean Code)', category: 'Math & Code' },
  { family: '"Courier New", monospace', label: 'Courier New (Typewriter)', category: 'Math & Code' },
  { family: '"JetBrains Mono", monospace', label: 'JetBrains Mono', category: 'Math & Code' },
  { family: '"Lucida Console", monospace', label: 'Lucida Console', category: 'Math & Code' },
  { family: '"Cambria Math", Cambria, serif', label: 'Cambria Math (Formulas)', category: 'Math & Code' },

  // ─── Display & Headings ───
  { family: 'Impact, sans-serif', label: 'Impact (Heavy Poster)', category: 'Display & Header' },
  { family: '"Copperplate Gothic", sans-serif', label: 'Copperplate Gothic', category: 'Display & Header' },
  { family: 'Broadway, cursive, sans-serif', label: 'Broadway (Art Deco)', category: 'Display & Header' },
  { family: 'Papyrus, fantasy', label: 'Papyrus (Ancient Callout)', category: 'Display & Header' },
];

let cachedAvailableFonts: FontOption[] = [...SYSTEM_WINDOWS_FONTS];
let fontDiscoveryInitiated = false;

/**
 * Get available fonts immediately (synchronous, 0ms lag)
 */
export function getAvailableFonts(): FontOption[] {
  if (!fontDiscoveryInitiated) {
    fontDiscoveryInitiated = true;
    discoverLocalFontsInBackground();
  }
  return cachedAvailableFonts;
}

/**
 * Asynchronously query local fonts via the Web API if supported,
 * merging newly discovered fonts into the cached list without blocking the UI thread.
 */
export async function discoverLocalFontsInBackground(): Promise<FontOption[]> {
  if (typeof window === 'undefined') return cachedAvailableFonts;

  try {
    if ('queryLocalFonts' in window) {
      const localFonts = await (window as unknown as { queryLocalFonts: () => Promise<Array<{ family: string }>> }).queryLocalFonts();
      const existingFamilies = new Set(cachedAvailableFonts.map((f) => f.family.replace(/['",]/g, '').toLowerCase()));
      const discovered: FontOption[] = [];

      for (const f of localFonts) {
        const clean = f.family.trim();
        const key = clean.toLowerCase();
        if (!existingFamilies.has(key) && clean.length > 0) {
          existingFamilies.add(key);
          discovered.push({
            family: `"${clean}", sans-serif`,
            label: clean,
            category: 'Modern Sans',
          });
        }
      }

      if (discovered.length > 0) {
        cachedAvailableFonts = [...SYSTEM_WINDOWS_FONTS, ...discovered.slice(0, 50)];
      }
    }
  } catch {
    // If permissions are not granted or API not available, static Windows library is always ready
  }
  return cachedAvailableFonts;
}

export const initializeWindowsFonts = discoverLocalFontsInBackground;
