/**
 * Complete Periodic Table Database (All 118 Elements)
 * Comprehensive elemental metrics: Z, Symbol, Name, Atomic Mass, Group, Period, Category,
 * Electron Configuration, and Electrons per Shell (K, L, M, N, O, P, Q).
 */

export type ElementCategory =
  | 'nonmetal'
  | 'nobleGas'
  | 'alkali'
  | 'alkalineEarth'
  | 'metalloid'
  | 'halogen'
  | 'transitionMetal'
  | 'postTransition'
  | 'lanthanide'
  | 'actinide';

export interface ChemicalElement {
  number: number;
  symbol: string;
  name: string;
  mass: number;
  group: number;
  period: number;
  category: ElementCategory;
  electronConfig: string;
  electronsPerShell: number[]; // e.g. [2, 4] for Carbon
}

export const PERIODIC_ELEMENTS: ChemicalElement[] = [
  // Period 1
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, group: 1, period: 1, category: 'nonmetal', electronConfig: '1s¹', electronsPerShell: [1] },
  { number: 2, symbol: 'He', name: 'Helium', mass: 4.0026, group: 18, period: 1, category: 'nobleGas', electronConfig: '1s²', electronsPerShell: [2] },

  // Period 2
  { number: 3, symbol: 'Li', name: 'Lithium', mass: 6.94, group: 1, period: 2, category: 'alkali', electronConfig: '[He] 2s¹', electronsPerShell: [2, 1] },
  { number: 4, symbol: 'Be', name: 'Beryllium', mass: 9.0122, group: 2, period: 2, category: 'alkalineEarth', electronConfig: '[He] 2s²', electronsPerShell: [2, 2] },
  { number: 5, symbol: 'B', name: 'Boron', mass: 10.81, group: 13, period: 2, category: 'metalloid', electronConfig: '[He] 2s² 2p¹', electronsPerShell: [2, 3] },
  { number: 6, symbol: 'C', name: 'Carbon', mass: 12.011, group: 14, period: 2, category: 'nonmetal', electronConfig: '[He] 2s² 2p²', electronsPerShell: [2, 4] },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007, group: 15, period: 2, category: 'nonmetal', electronConfig: '[He] 2s² 2p³', electronsPerShell: [2, 5] },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: 15.999, group: 16, period: 2, category: 'nonmetal', electronConfig: '[He] 2s² 2p⁴', electronsPerShell: [2, 6] },
  { number: 9, symbol: 'F', name: 'Fluorine', mass: 18.998, group: 17, period: 2, category: 'halogen', electronConfig: '[He] 2s² 2p⁵', electronsPerShell: [2, 7] },
  { number: 10, symbol: 'Ne', name: 'Neon', mass: 20.180, group: 18, period: 2, category: 'nobleGas', electronConfig: '[He] 2s² 2p⁶', electronsPerShell: [2, 8] },

  // Period 3
  { number: 11, symbol: 'Na', name: 'Sodium', mass: 22.990, group: 1, period: 3, category: 'alkali', electronConfig: '[Ne] 3s¹', electronsPerShell: [2, 8, 1] },
  { number: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.305, group: 2, period: 3, category: 'alkalineEarth', electronConfig: '[Ne] 3s²', electronsPerShell: [2, 8, 2] },
  { number: 13, symbol: 'Al', name: 'Aluminum', mass: 26.982, group: 13, period: 3, category: 'postTransition', electronConfig: '[Ne] 3s² 3p¹', electronsPerShell: [2, 8, 3] },
  { number: 14, symbol: 'Si', name: 'Silicon', mass: 28.085, group: 14, period: 3, category: 'metalloid', electronConfig: '[Ne] 3s² 3p²', electronsPerShell: [2, 8, 4] },
  { number: 15, symbol: 'P', name: 'Phosphorus', mass: 30.974, group: 15, period: 3, category: 'nonmetal', electronConfig: '[Ne] 3s² 3p³', electronsPerShell: [2, 8, 5] },
  { number: 16, symbol: 'S', name: 'Sulfur', mass: 32.06, group: 16, period: 3, category: 'nonmetal', electronConfig: '[Ne] 3s² 3p⁴', electronsPerShell: [2, 8, 6] },
  { number: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45, group: 17, period: 3, category: 'halogen', electronConfig: '[Ne] 3s² 3p⁵', electronsPerShell: [2, 8, 7] },
  { number: 18, symbol: 'Ar', name: 'Argon', mass: 39.948, group: 18, period: 3, category: 'nobleGas', electronConfig: '[Ne] 3s² 3p⁶', electronsPerShell: [2, 8, 8] },

  // Period 4
  { number: 19, symbol: 'K', name: 'Potassium', mass: 39.098, group: 1, period: 4, category: 'alkali', electronConfig: '[Ar] 4s¹', electronsPerShell: [2, 8, 8, 1] },
  { number: 20, symbol: 'Ca', name: 'Calcium', mass: 40.078, group: 2, period: 4, category: 'alkalineEarth', electronConfig: '[Ar] 4s²', electronsPerShell: [2, 8, 8, 2] },
  { number: 21, symbol: 'Sc', name: 'Scandium', mass: 44.956, group: 3, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d¹ 4s²', electronsPerShell: [2, 8, 9, 2] },
  { number: 22, symbol: 'Ti', name: 'Titanium', mass: 47.867, group: 4, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d² 4s²', electronsPerShell: [2, 8, 10, 2] },
  { number: 23, symbol: 'V', name: 'Vanadium', mass: 50.942, group: 5, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d³ 4s²', electronsPerShell: [2, 8, 11, 2] },
  { number: 24, symbol: 'Cr', name: 'Chromium', mass: 51.996, group: 6, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d⁵ 4s¹', electronsPerShell: [2, 8, 13, 1] },
  { number: 25, symbol: 'Mn', name: 'Manganese', mass: 54.938, group: 7, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d⁵ 4s²', electronsPerShell: [2, 8, 13, 2] },
  { number: 26, symbol: 'Fe', name: 'Iron', mass: 55.845, group: 8, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d⁶ 4s²', electronsPerShell: [2, 8, 14, 2] },
  { number: 27, symbol: 'Co', name: 'Cobalt', mass: 58.933, group: 9, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d⁷ 4s²', electronsPerShell: [2, 8, 15, 2] },
  { number: 28, symbol: 'Ni', name: 'Nickel', mass: 58.693, group: 10, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d⁸ 4s²', electronsPerShell: [2, 8, 16, 2] },
  { number: 29, symbol: 'Cu', name: 'Copper', mass: 63.546, group: 11, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d¹⁰ 4s¹', electronsPerShell: [2, 8, 18, 1] },
  { number: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38, group: 12, period: 4, category: 'transitionMetal', electronConfig: '[Ar] 3d¹⁰ 4s²', electronsPerShell: [2, 8, 18, 2] },
  { number: 31, symbol: 'Ga', name: 'Gallium', mass: 69.723, group: 13, period: 4, category: 'postTransition', electronConfig: '[Ar] 3d¹⁰ 4s² 4p¹,', electronsPerShell: [2, 8, 18, 3] },
  { number: 32, symbol: 'Ge', name: 'Germanium', mass: 72.630, group: 14, period: 4, category: 'metalloid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p²', electronsPerShell: [2, 8, 18, 4] },
  { number: 33, symbol: 'As', name: 'Arsenic', mass: 74.922, group: 15, period: 4, category: 'metalloid', electronConfig: '[Ar] 3d¹⁰ 4s² 4p³', electronsPerShell: [2, 8, 18, 5] },
  { number: 34, symbol: 'Se', name: 'Selenium', mass: 78.971, group: 16, period: 4, category: 'nonmetal', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁴', electronsPerShell: [2, 8, 18, 6] },
  { number: 35, symbol: 'Br', name: 'Bromine', mass: 79.904, group: 17, period: 4, category: 'halogen', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵', electronsPerShell: [2, 8, 18, 7] },
  { number: 36, symbol: 'Kr', name: 'Krypton', mass: 83.798, group: 18, period: 4, category: 'nobleGas', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁶', electronsPerShell: [2, 8, 18, 8] },

  // Period 5
  { number: 37, symbol: 'Rb', name: 'Rubidium', mass: 85.468, group: 1, period: 5, category: 'alkali', electronConfig: '[Kr] 5s¹', electronsPerShell: [2, 8, 18, 8, 1] },
  { number: 38, symbol: 'Sr', name: 'Strontium', mass: 87.62, group: 2, period: 5, category: 'alkalineEarth', electronConfig: '[Kr] 5s²', electronsPerShell: [2, 8, 18, 8, 2] },
  { number: 39, symbol: 'Y', name: 'Yttrium', mass: 88.906, group: 3, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d¹ 5s²', electronsPerShell: [2, 8, 18, 9, 2] },
  { number: 40, symbol: 'Zr', name: 'Zirconium', mass: 91.224, group: 4, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d² 5s²', electronsPerShell: [2, 8, 18, 10, 2] },
  { number: 41, symbol: 'Nb', name: 'Niobium', mass: 92.906, group: 5, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d⁴ 5s¹', electronsPerShell: [2, 8, 18, 12, 1] },
  { number: 42, symbol: 'Mo', name: 'Molybdenum', mass: 95.95, group: 6, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d⁵ 5s¹', electronsPerShell: [2, 8, 18, 13, 1] },
  { number: 43, symbol: 'Tc', name: 'Technetium', mass: 98, group: 7, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d⁵ 5s²', electronsPerShell: [2, 8, 18, 13, 2] },
  { number: 44, symbol: 'Ru', name: 'Ruthenium', mass: 101.07, group: 8, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d⁷ 5s¹', electronsPerShell: [2, 8, 18, 15, 1] },
  { number: 45, symbol: 'Rh', name: 'Rhodium', mass: 102.91, group: 9, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d⁸ 5s¹', electronsPerShell: [2, 8, 18, 16, 1] },
  { number: 46, symbol: 'Pd', name: 'Palladium', mass: 106.42, group: 10, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d¹⁰', electronsPerShell: [2, 8, 18, 18] },
  { number: 47, symbol: 'Ag', name: 'Silver', mass: 107.87, group: 11, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d¹⁰ 5s¹', electronsPerShell: [2, 8, 18, 18, 1] },
  { number: 48, symbol: 'Cd', name: 'Cadmium', mass: 112.41, group: 12, period: 5, category: 'transitionMetal', electronConfig: '[Kr] 4d¹⁰ 5s²', electronsPerShell: [2, 8, 18, 18, 2] },
  { number: 49, symbol: 'In', name: 'Indium', mass: 114.82, group: 13, period: 5, category: 'postTransition', electronConfig: '[Kr] 4d¹⁰ 5s² 5p¹', electronsPerShell: [2, 8, 18, 18, 3] },
  { number: 50, symbol: 'Sn', name: 'Tin', mass: 118.71, group: 14, period: 5, category: 'postTransition', electronConfig: '[Kr] 4d¹⁰ 5s² 5p²', electronsPerShell: [2, 8, 18, 18, 4] },
  { number: 51, symbol: 'Sb', name: 'Antimony', mass: 121.76, group: 15, period: 5, category: 'metalloid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p³', electronsPerShell: [2, 8, 18, 18, 5] },
  { number: 52, symbol: 'Te', name: 'Tellurium', mass: 127.60, group: 16, period: 5, category: 'metalloid', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁴', electronsPerShell: [2, 8, 18, 18, 6] },
  { number: 53, symbol: 'I', name: 'Iodine', mass: 126.90, group: 17, period: 5, category: 'halogen', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵', electronsPerShell: [2, 8, 18, 18, 7] },
  { number: 54, symbol: 'Xe', name: 'Xenon', mass: 131.29, group: 18, period: 5, category: 'nobleGas', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁶', electronsPerShell: [2, 8, 18, 18, 8] },

  // Period 6 (including Lanthanides 57-71)
  { number: 55, symbol: 'Cs', name: 'Cesium', mass: 132.91, group: 1, period: 6, category: 'alkali', electronConfig: '[Xe] 6s¹', electronsPerShell: [2, 8, 18, 18, 8, 1] },
  { number: 56, symbol: 'Ba', name: 'Barium', mass: 137.33, group: 2, period: 6, category: 'alkalineEarth', electronConfig: '[Xe] 6s²', electronsPerShell: [2, 8, 18, 18, 8, 2] },
  { number: 57, symbol: 'La', name: 'Lanthanum', mass: 138.91, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 5d¹ 6s²', electronsPerShell: [2, 8, 18, 18, 9, 2] },
  { number: 58, symbol: 'Ce', name: 'Cerium', mass: 140.12, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f¹ 5d¹ 6s²', electronsPerShell: [2, 8, 18, 19, 9, 2] },
  { number: 59, symbol: 'Pr', name: 'Praseodymium', mass: 140.91, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f³ 6s²', electronsPerShell: [2, 8, 18, 21, 8, 2] },
  { number: 60, symbol: 'Nd', name: 'Neodymium', mass: 144.24, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f⁴ 6s²', electronsPerShell: [2, 8, 18, 22, 8, 2] },
  { number: 61, symbol: 'Pm', name: 'Promethium', mass: 145, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f⁵ 6s²', electronsPerShell: [2, 8, 18, 23, 8, 2] },
  { number: 62, symbol: 'Sm', name: 'Samarium', mass: 150.36, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f⁶ 6s²', electronsPerShell: [2, 8, 18, 24, 8, 2] },
  { number: 63, symbol: 'Eu', name: 'Europium', mass: 151.96, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f⁷ 6s²', electronsPerShell: [2, 8, 18, 25, 8, 2] },
  { number: 64, symbol: 'Gd', name: 'Gadolinium', mass: 157.25, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f⁷ 5d¹ 6s²', electronsPerShell: [2, 8, 18, 25, 9, 2] },
  { number: 65, symbol: 'Tb', name: 'Terbium', mass: 158.93, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f⁹ 6s²', electronsPerShell: [2, 8, 18, 27, 8, 2] },
  { number: 66, symbol: 'Dy', name: 'Dysprosium', mass: 162.50, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f¹⁰ 6s²', electronsPerShell: [2, 8, 18, 28, 8, 2] },
  { number: 67, symbol: 'Ho', name: 'Holmium', mass: 164.93, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f¹¹ 6s²', electronsPerShell: [2, 8, 18, 29, 8, 2] },
  { number: 68, symbol: 'Er', name: 'Erbium', mass: 167.26, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f¹² 6s²', electronsPerShell: [2, 8, 18, 30, 8, 2] },
  { number: 69, symbol: 'Tm', name: 'Thulium', mass: 168.93, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f¹³ 6s²', electronsPerShell: [2, 8, 18, 31, 8, 2] },
  { number: 70, symbol: 'Yb', name: 'Ytterbium', mass: 173.05, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f¹⁴ 6s²', electronsPerShell: [2, 8, 18, 32, 8, 2] },
  { number: 71, symbol: 'Lu', name: 'Lutetium', mass: 174.97, group: 3, period: 6, category: 'lanthanide', electronConfig: '[Xe] 4f¹⁴ 5d¹ 6s²', electronsPerShell: [2, 8, 18, 32, 9, 2] },
  { number: 72, symbol: 'Hf', name: 'Hafnium', mass: 178.49, group: 4, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d² 6s²', electronsPerShell: [2, 8, 18, 32, 10, 2] },
  { number: 73, symbol: 'Ta', name: 'Tantalum', mass: 180.95, group: 5, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d³ 6s²', electronsPerShell: [2, 8, 18, 32, 11, 2] },
  { number: 74, symbol: 'W', name: 'Tungsten', mass: 183.84, group: 6, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d⁴ 6s²', electronsPerShell: [2, 8, 18, 32, 12, 2] },
  { number: 75, symbol: 'Re', name: 'Rhenium', mass: 186.21, group: 7, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d⁵ 6s²', electronsPerShell: [2, 8, 18, 32, 13, 2] },
  { number: 76, symbol: 'Os', name: 'Osmium', mass: 190.23, group: 8, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d⁶ 6s²', electronsPerShell: [2, 8, 18, 32, 14, 2] },
  { number: 77, symbol: 'Ir', name: 'Iridium', mass: 192.22, group: 9, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d⁷ 6s²', electronsPerShell: [2, 8, 18, 32, 15, 2] },
  { number: 78, symbol: 'Pt', name: 'Platinum', mass: 195.08, group: 10, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d⁹ 6s¹', electronsPerShell: [2, 8, 18, 32, 17, 1] },
  { number: 79, symbol: 'Au', name: 'Gold', mass: 196.97, group: 11, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronsPerShell: [2, 8, 18, 32, 18, 1] },
  { number: 80, symbol: 'Hg', name: 'Mercury', mass: 200.59, group: 12, period: 6, category: 'transitionMetal', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', electronsPerShell: [2, 8, 18, 32, 18, 2] },
  { number: 81, symbol: 'Tl', name: 'Thallium', mass: 204.38, group: 13, period: 6, category: 'postTransition', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', electronsPerShell: [2, 8, 18, 32, 18, 3] },
  { number: 82, symbol: 'Pb', name: 'Lead', mass: 207.2, group: 14, period: 6, category: 'postTransition', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', electronsPerShell: [2, 8, 18, 32, 18, 4] },
  { number: 83, symbol: 'Bi', name: 'Bismuth', mass: 208.98, group: 15, period: 6, category: 'postTransition', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', electronsPerShell: [2, 8, 18, 32, 18, 5] },
  { number: 84, symbol: 'Po', name: 'Polonium', mass: 209, group: 16, period: 6, category: 'postTransition', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', electronsPerShell: [2, 8, 18, 32, 18, 6] },
  { number: 85, symbol: 'At', name: 'Astatine', mass: 210, group: 17, period: 6, category: 'halogen', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', electronsPerShell: [2, 8, 18, 32, 18, 7] },
  { number: 86, symbol: 'Rn', name: 'Radon', mass: 222, group: 18, period: 6, category: 'nobleGas', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', electronsPerShell: [2, 8, 18, 32, 18, 8] },

  // Period 7 (including Actinides 89-103)
  { number: 87, symbol: 'Fr', name: 'Francium', mass: 223, group: 1, period: 7, category: 'alkali', electronConfig: '[Rn] 7s¹', electronsPerShell: [2, 8, 18, 32, 18, 8, 1] },
  { number: 88, symbol: 'Ra', name: 'Radium', mass: 226, group: 2, period: 7, category: 'alkalineEarth', electronConfig: '[Rn] 7s²', electronsPerShell: [2, 8, 18, 32, 18, 8, 2] },
  { number: 89, symbol: 'Ac', name: 'Actinium', mass: 227, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 6d¹ 7s²', electronsPerShell: [2, 8, 18, 32, 18, 9, 2] },
  { number: 90, symbol: 'Th', name: 'Thorium', mass: 232.04, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 6d² 7s²', electronsPerShell: [2, 8, 18, 32, 18, 10, 2] },
  { number: 91, symbol: 'Pa', name: 'Protactinium', mass: 231.04, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f² 6d¹ 7s²', electronsPerShell: [2, 8, 18, 32, 20, 9, 2] },
  { number: 92, symbol: 'U', name: 'Uranium', mass: 238.03, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f³ 6d¹ 7s²', electronsPerShell: [2, 8, 18, 32, 21, 9, 2] },
  { number: 93, symbol: 'Np', name: 'Neptunium', mass: 237, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f⁴ 6d¹ 7s²', electronsPerShell: [2, 8, 18, 32, 22, 9, 2] },
  { number: 94, symbol: 'Pu', name: 'Plutonium', mass: 244, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f⁶ 7s²', electronsPerShell: [2, 8, 18, 32, 24, 8, 2] },
  { number: 95, symbol: 'Am', name: 'Americium', mass: 243, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f⁷ 7s²', electronsPerShell: [2, 8, 18, 32, 25, 8, 2] },
  { number: 96, symbol: 'Cm', name: 'Curium', mass: 247, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f⁷ 6d¹ 7s²', electronsPerShell: [2, 8, 18, 32, 25, 9, 2] },
  { number: 97, symbol: 'Bk', name: 'Berkelium', mass: 247, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f⁹ 7s²', electronsPerShell: [2, 8, 18, 32, 27, 8, 2] },
  { number: 98, symbol: 'Cf', name: 'Californium', mass: 251, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f¹⁰ 7s²', electronsPerShell: [2, 8, 18, 32, 28, 8, 2] },
  { number: 99, symbol: 'Es', name: 'Einsteinium', mass: 252, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f¹¹ 7s²', electronsPerShell: [2, 8, 18, 32, 29, 8, 2] },
  { number: 100, symbol: 'Fm', name: 'Fermium', mass: 257, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f¹² 7s²', electronsPerShell: [2, 8, 18, 32, 30, 8, 2] },
  { number: 101, symbol: 'Md', name: 'Mendelevium', mass: 258, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f¹³ 7s²', electronsPerShell: [2, 8, 18, 32, 31, 8, 2] },
  { number: 102, symbol: 'No', name: 'Nobelium', mass: 259, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f¹⁴ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 8, 2] },
  { number: 103, symbol: 'Lr', name: 'Lawrencium', mass: 266, group: 3, period: 7, category: 'actinide', electronConfig: '[Rn] 5f¹⁴ 7s² 7p¹', electronsPerShell: [2, 8, 18, 32, 32, 8, 3] },
  { number: 104, symbol: 'Rf', name: 'Rutherfordium', mass: 267, group: 4, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d² 7s²', electronsPerShell: [2, 8, 18, 32, 32, 10, 2] },
  { number: 105, symbol: 'Db', name: 'Dubnium', mass: 268, group: 5, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d³ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 11, 2] },
  { number: 106, symbol: 'Sg', name: 'Seaborgium', mass: 269, group: 6, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d⁴ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 12, 2] },
  { number: 107, symbol: 'Bh', name: 'Bohrium', mass: 270, group: 7, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d⁵ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 13, 2] },
  { number: 108, symbol: 'Hs', name: 'Hassium', mass: 269, group: 8, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d⁶ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 14, 2] },
  { number: 109, symbol: 'Mt', name: 'Meitnerium', mass: 278, group: 9, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d⁷ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 15, 2] },
  { number: 110, symbol: 'Ds', name: 'Darmstadtium', mass: 281, group: 10, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d⁸ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 16, 2] },
  { number: 111, symbol: 'Rg', name: 'Roentgenium', mass: 282, group: 11, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d⁹ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 17, 2] },
  { number: 112, symbol: 'Cn', name: 'Copernicium', mass: 285, group: 12, period: 7, category: 'transitionMetal', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', electronsPerShell: [2, 8, 18, 32, 32, 18, 2] },
  { number: 113, symbol: 'Nh', name: 'Nihonium', mass: 286, group: 13, period: 7, category: 'postTransition', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', electronsPerShell: [2, 8, 18, 32, 32, 18, 3] },
  { number: 114, symbol: 'Fl', name: 'Flerovium', mass: 289, group: 14, period: 7, category: 'postTransition', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', electronsPerShell: [2, 8, 18, 32, 32, 18, 4] },
  { number: 115, symbol: 'Mc', name: 'Moscovium', mass: 290, group: 15, period: 7, category: 'postTransition', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', electronsPerShell: [2, 8, 18, 32, 32, 18, 5] },
  { number: 116, symbol: 'Lv', name: 'Livermorium', mass: 293, group: 16, period: 7, category: 'postTransition', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', electronsPerShell: [2, 8, 18, 32, 32, 18, 6] },
  { number: 117, symbol: 'Ts', name: 'Tennessine', mass: 294, group: 17, period: 7, category: 'halogen', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', electronsPerShell: [2, 8, 18, 32, 32, 18, 7] },
  { number: 118, symbol: 'Og', name: 'Oganesson', mass: 294, group: 18, period: 7, category: 'nobleGas', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', electronsPerShell: [2, 8, 18, 32, 32, 18, 8] },
];

export function getElementBySymbolOrNumber(query: string | number): ChemicalElement | undefined {
  if (typeof query === 'number') {
    return PERIODIC_ELEMENTS.find((e) => e.number === query);
  }
  const q = String(query).trim().toLowerCase();
  return PERIODIC_ELEMENTS.find(
    (e) => e.symbol.toLowerCase() === q || e.name.toLowerCase() === q || String(e.number) === q
  );
}
