/**
 * Physics Teaching Module (Section 16.2)
 * Electrical circuits, components, mechanics vectors, resultant forces, motion diagrams
 * Distinguishes visual diagrams from simulations by implementing verified underlying equations.
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, createFormula, executeAddObject, executeAddMultipleObjects } from './commonHelpers';
import { ShapeObject } from '../../../shared/types';

// ─── 1. Verified Underlying Physics Equation Engines ──────────────────────────

export interface OhmsLawResult {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
}

/**
 * Solves Ohm's Law and electric power given any two of (V, I, R)
 */
export function solveOhmsLaw(params: { v?: number; i?: number; r?: number }): OhmsLawResult {
  let { v, i, r } = params;

  if (v !== undefined && i !== undefined) {
    r = i !== 0 ? v / i : 0;
  } else if (v !== undefined && r !== undefined) {
    i = r !== 0 ? v / r : 0;
  } else if (i !== undefined && r !== undefined) {
    v = i * r;
  } else {
    v = 12;
    r = 4;
    i = 3;
  }

  const power = (v || 0) * (i || 0);
  return {
    voltage: Number((v || 0).toFixed(3)),
    current: Number((i || 0).toFixed(3)),
    resistance: Number((r || 0).toFixed(3)),
    power: Number(power.toFixed(3)),
  };
}

/**
 * Calculates equivalent resistance for Series or Parallel resistor networks
 */
export function calculateEquivalentResistance(resistors: number[], isParallel = false): number {
  if (resistors.length === 0) return 0;
  if (!isParallel) {
    return resistors.reduce((acc, r) => acc + r, 0);
  }
  const sumReciprocal = resistors.reduce((acc, r) => acc + (r !== 0 ? 1 / r : 0), 0);
  return sumReciprocal !== 0 ? Number((1 / sumReciprocal).toFixed(4)) : 0;
}

export interface ForceVector {
  name: string;
  magnitude: number; // Newtons
  angleDegrees: number; // 0 = +X, 90 = +Y
}

export interface ResultantForceResult {
  rx: number;
  ry: number;
  magnitude: number;
  angleDegrees: number;
}

/**
 * Vector addition for resultant force calculation: R = ΣF
 */
export function calculateResultantForce(forces: ForceVector[]): ResultantForceResult {
  let rx = 0;
  let ry = 0;

  for (const f of forces) {
    const rad = (f.angleDegrees * Math.PI) / 180;
    rx += f.magnitude * Math.cos(rad);
    ry += f.magnitude * Math.sin(rad);
  }

  const magnitude = Math.sqrt(rx * rx + ry * ry);
  let angleDegrees = (Math.atan2(ry, rx) * 180) / Math.PI;
  if (angleDegrees < 0) angleDegrees += 360;

  return {
    rx: Number(rx.toFixed(3)),
    ry: Number(ry.toFixed(3)),
    magnitude: Number(magnitude.toFixed(3)),
    angleDegrees: Number(angleDegrees.toFixed(1)),
  };
}

export interface ProjectileResult {
  flightTime: number; // seconds
  maxHeight: number;  // meters
  range: number;      // meters
  trajectoryPoints: { x: number; y: number }[];
}

/**
 * Tested 2D Kinematic Projectile Motion Equations
 */
export function calculateProjectileMotion(
  initialVelocity: number,
  angleDegrees: number,
  g = 9.81
): ProjectileResult {
  const rad = (angleDegrees * Math.PI) / 180;
  const v0x = initialVelocity * Math.cos(rad);
  const v0y = initialVelocity * Math.sin(rad);

  const flightTime = (2 * v0y) / g;
  const maxHeight = (v0y * v0y) / (2 * g);
  const range = (initialVelocity * initialVelocity * Math.sin(2 * rad)) / g;

  const points: { x: number; y: number }[] = [];
  const steps = 30;
  for (let s = 0; s <= steps; s++) {
    const t = (flightTime * s) / steps;
    const x = v0x * t;
    const y = Math.max(0, v0y * t - 0.5 * g * t * t);
    points.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  }

  return {
    flightTime: Number(flightTime.toFixed(2)),
    maxHeight: Number(maxHeight.toFixed(2)),
    range: Number(range.toFixed(2)),
    trajectoryPoints: points,
  };
}

// ─── 2. Tools in Physics Module ───────────────────────────────────────────────

const physicsTools: SubjectTool[] = [
  // 1. Electrical Component: DC Battery
  {
    id: 'phys-battery',
    subjectId: 'physics',
    name: 'Battery / DC Power Supply',
    category: 'Circuits',
    icon: '🔋',
    description: 'Standard DC cell symbol with positive and negative plates and terminal leads',
    badge: 'Component',
    tags: ['battery', 'voltage', 'dc', 'circuit', 'power'],
    execute: (context, options) => {
      const voltage = options?.voltage ?? 12;
      const battery = createShape('circuitComponent', 240, 220, 160, 80, {
        params: { componentType: 'battery', voltage, label: `${voltage}V` },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
      });
      executeAddObject(context, battery, `Insert ${voltage}V Battery`);
    },
  },

  // 2. Electrical Component: Resistor
  {
    id: 'phys-resistor',
    subjectId: 'physics',
    name: 'Resistor (Fixed)',
    category: 'Circuits',
    icon: '⚡',
    description: 'Configurable resistance value (Ω, kΩ, MΩ), tolerance, and standard schematic symbol',
    badge: 'Component',
    interactiveModal: 'resistor',
    tags: ['resistor', 'ohms', 'circuit', 'resistance', 'e-series'],
    execute: (context, options) => {
      const resistance = options?.resistance ?? 100;
      const unit = options?.unit || 'Ω';
      const cleanLabel = `R = ${resistance} ${unit}`;
      const resistor = createShape('circuitComponent', 240, 220, 160, 60, {
        params: { componentType: 'resistor', resistance, unit, label: cleanLabel },
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        label: cleanLabel,
      });
      executeAddObject(context, resistor, `Insert ${cleanLabel} Resistor`);
    },
  },

  // 3. Electrical Component: Variable Rheostat
  {
    id: 'phys-rheostat',
    subjectId: 'physics',
    name: 'Rheostat (Variable Resistor)',
    category: 'Circuits',
    icon: '🎚️',
    description: 'Variable resistor with adjustable wiper arrow and configurable maximum resistance range',
    badge: 'Component',
    interactiveModal: 'resistor',
    tags: ['rheostat', 'potentiometer', 'variable resistor', 'wiper'],
    execute: (context, options) => {
      const resistance = options?.resistance ?? 50;
      const maxResistance = options?.maxResistance ?? 100;
      const unit = options?.unit || 'Ω';
      const cleanLabel = `Rheostat (${resistance} / ${maxResistance} ${unit})`;
      const rheostat = createShape('circuitComponent', 240, 220, 180, 80, {
        params: {
          componentType: 'rheostat',
          resistance,
          maxResistance,
          unit,
          label: cleanLabel,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        label: cleanLabel,
      });
      executeAddObject(context, rheostat, 'Insert Variable Rheostat');
    },
  },

  // 3b. Electrical Component: Capacitor
  {
    id: 'phys-capacitor',
    subjectId: 'physics',
    name: 'Capacitor',
    category: 'Circuits',
    icon: '🔋',
    description: 'Standard two parallel plate dielectric capacitor symbol with capacitance value in µF',
    badge: 'Component',
    tags: ['capacitor', 'farads', 'circuit', 'capacitance'],
    execute: (context, options) => {
      const value = options?.value ?? options?.capacitance ?? 10;
      const unit = options?.unit || 'µF';
      const cleanLabel = `C = ${value} ${unit}`;
      const cap = createShape('circuitComponent', 240, 220, 160, 60, {
        params: { componentType: 'capacitor', value, capacitance: value, unit, label: cleanLabel },
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        label: cleanLabel,
      });
      executeAddObject(context, cap, `Insert ${cleanLabel} Capacitor`);
    },
  },

  // 3c. Electrical Component: Inductor / Choke Coil
  {
    id: 'phys-inductor',
    subjectId: 'physics',
    name: 'Inductor / Choke Coil',
    category: 'Circuits',
    icon: '🌀',
    description: 'Coiled wire inductor symbol with inductance value in mH',
    badge: 'Component',
    tags: ['inductor', 'henry', 'circuit', 'coil'],
    execute: (context, options) => {
      const value = options?.value ?? options?.inductance ?? 5;
      const unit = options?.unit || 'mH';
      const cleanLabel = `L = ${value} ${unit}`;
      const ind = createShape('circuitComponent', 240, 220, 160, 60, {
        params: { componentType: 'inductor', value, inductance: value, unit, label: cleanLabel },
        strokeColor: '#38bdf8',
        strokeWidth: 2.5,
        label: cleanLabel,
      });
      executeAddObject(context, ind, `Insert ${cleanLabel} Inductor`);
    },
  },

  // 4. Electrical Component: Switch
  {
    id: 'phys-switch',
    subjectId: 'physics',
    name: 'Knife Switch',
    category: 'Circuits',
    icon: '🔌',
    description: 'Circuit knife switch with open and closed contact state',
    badge: 'Component',
    tags: ['switch', 'circuit', 'open', 'closed'],
    execute: (context, options) => {
      const state = options?.state || 'open';
      const sw = createShape('circuitComponent', 240, 220, 140, 60, {
        params: { componentType: 'switch', state, label: `Switch (${state})` },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
      });
      executeAddObject(context, sw, `Insert ${state} Switch`);
    },
  },

  // 5. Electrical Component: Lamp / Bulb
  {
    id: 'phys-lamp',
    subjectId: 'physics',
    name: 'Incandescent Lamp / Bulb',
    category: 'Circuits',
    icon: '💡',
    description: 'Circular lamp symbol with internal cross filament and glow effect',
    badge: 'Component',
    tags: ['lamp', 'bulb', 'light', 'circuit'],
    execute: (context) => {
      const lamp = createShape('circuitComponent', 240, 220, 100, 100, {
        params: { componentType: 'lamp', label: 'Lamp' },
        strokeColor: '#facc15',
        strokeWidth: 2,
      });
      executeAddObject(context, lamp, 'Insert Lamp Symbol');
    },
  },

  // 6. Meters: Ammeter, Voltmeter, Galvanometer
  {
    id: 'phys-meter',
    subjectId: 'physics',
    name: 'Meters (Ammeter / Voltmeter)',
    category: 'Circuits',
    icon: '⏲️',
    description: 'Calibrated measuring instrument circle symbol (Ammeter A, Voltmeter V, Galvanometer G)',
    badge: 'Component',
    tags: ['meter', 'ammeter', 'voltmeter', 'galvanometer', 'current', 'voltage'],
    execute: (context, options) => {
      const meterType = options?.meterType || 'A';
      const meter = createShape('circuitComponent', 240, 220, 100, 100, {
        params: { componentType: 'meter', meterType, label: `${meterType}-Meter` },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
      });
      executeAddObject(context, meter, `Insert ${meterType} Meter`);
    },
  },

  // 7. Complete Series Circuit Diagram
  {
    id: 'phys-circuit-series',
    subjectId: 'physics',
    name: 'Series Circuit Diagram',
    category: 'Circuits',
    icon: '🔄',
    description: 'Editable series loop with customizable components (resistors, capacitors, bulbs, switches), voltage & current',
    badge: 'Interactive',
    interactiveModal: 'circuitDiagram',
    tags: ['circuit', 'series', 'diagram', 'loop', 'ohm', 'components', 'voltage', 'ampere'],
    execute: (context, options) => {
      const voltage = options?.voltage ?? 12;
      const resistance = options?.resistance ?? 4;
      const current = options?.current ?? Number((voltage / resistance).toFixed(2));
      const components = options?.components || [
        { id: 'c1', type: 'resistor', value: resistance, unit: 'Ω', label: 'R1' },
        { id: 'c2', type: 'ammeter', value: current, unit: 'A', label: 'A' },
        { id: 'c3', type: 'switch', value: 0, unit: '', label: 'Switch', state: 'closed' },
      ];
      const circuit = createShape('physicsDiagram', 200, 160, 500, 330, {
        params: {
          diagramType: 'seriesCircuit',
          voltage,
          resistance,
          current,
          components,
          showCurrentArrows: true,
          showFormulas: true,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: `Series Circuit (V=${voltage}V, Req=${resistance}Ω, I=${current}A)`,
      });
      executeAddObject(context, circuit, 'Insert Series Circuit Diagram');
    },
  },

  // 8. Complete Parallel Circuit Diagram
  {
    id: 'phys-circuit-parallel',
    subjectId: 'physics',
    name: 'Parallel Circuit Diagram',
    category: 'Circuits',
    icon: '⏸️',
    description: 'Editable parallel branch circuit with dynamic components, Kirchhoff node dots, and branch currents',
    badge: 'Interactive',
    interactiveModal: 'circuitDiagram',
    tags: ['circuit', 'parallel', 'branches', 'kirchhoff', 'components', 'voltage', 'ampere'],
    execute: (context, options) => {
      const voltage = options?.voltage ?? 12;
      const components = options?.components || [
        { id: 'p1', type: 'resistor', value: 6, unit: 'Ω', label: 'R1' },
        { id: 'p2', type: 'resistor', value: 12, unit: 'Ω', label: 'R2' },
      ];
      let invReq = 0;
      for (const c of components) {
        if (c.value > 0) invReq += 1 / Number(c.value);
      }
      const req = invReq > 0 ? Number((1 / invReq).toFixed(2)) : 4;
      const current = options?.current ?? Number((voltage / req).toFixed(2));

      const circuit = createShape('physicsDiagram', 200, 160, 520, 360, {
        params: {
          diagramType: 'parallelCircuit',
          voltage,
          resistance: req,
          current,
          components,
          showCurrentArrows: true,
          showFormulas: true,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: `Parallel Circuit (V=${voltage}V, Req=${req}Ω, I=${current}A)`,
      });
      executeAddObject(context, circuit, 'Insert Parallel Circuit Diagram');
    },
  },

  // 9. Force & Vector Illustration
  {
    id: 'phys-vector',
    subjectId: 'physics',
    name: 'Force Vector',
    category: 'Mechanics',
    icon: '↗️',
    description: 'Directional force vector with origin point, Cartesian components (Fx, Fy), and angle',
    badge: 'Interactive',
    interactiveModal: 'forceVector',
    tags: ['vector', 'force', 'magnitude', 'angle', 'newtons', 'components'],
    execute: (context, options) => {
      const mag = options?.magnitude ?? 50;
      const angle = options?.angle ?? 45;
      const rad = (angle * Math.PI) / 180;
      const fx = Number((mag * Math.cos(rad)).toFixed(1));
      const fy = Number((mag * Math.sin(rad)).toFixed(1));
      const vector = createShape('physicsDiagram', 220, 180, 420, 360, {
        params: {
          diagramType: 'forceVector',
          magnitude: mag,
          angle,
          name: options?.name || 'F_app',
          fx,
          fy,
          showComponents: true,
        },
        strokeColor: '#f43f5e',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: `F = ${mag} N (${angle}°)`,
      });
      executeAddObject(context, vector, `Insert ${mag}N Force Vector`);
    },
  },

  // 10. Resultant Force Demonstration (Vector Addition)
  {
    id: 'phys-resultant-force',
    subjectId: 'physics',
    name: 'Resultant Force Demonstration',
    category: 'Mechanics',
    icon: '📐',
    description: 'Visual vector addition parallelogram showing F1, F2 and computed resultant R',
    badge: 'Interactive',
    interactiveModal: 'resultantForce',
    tags: ['resultant', 'vector addition', 'parallelogram', 'components'],
    execute: (context, options) => {
      const forces = options?.forces || [
        { name: 'F1', magnitude: 40, angleDegrees: 0, color: '#38bdf8' },
        { name: 'F2', magnitude: 30, angleDegrees: 90, color: '#10b981' },
      ];
      const calc = calculateResultantForce(forces);
      const resultant = createShape('physicsDiagram', 200, 160, 480, 400, {
        params: {
          diagramType: 'resultantForce',
          forces,
          f1: forces[0]?.magnitude ?? 40,
          f2: forces[1]?.magnitude ?? 30,
          rx: calc.rx,
          ry: calc.ry,
          r: calc.magnitude,
          theta: calc.angleDegrees,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: `Resultant Force R = ${calc.magnitude} N @ ${calc.angleDegrees}°`,
      });
      executeAddObject(context, resultant, 'Insert Resultant Force Demonstration');
    },
  },

  // 11. Free-Body Diagram (FBD)
  {
    id: 'phys-fbd',
    subjectId: 'physics',
    name: 'Free Body Diagram (FBD)',
    category: 'Mechanics',
    icon: '📦',
    description: 'Block on surface/incline with mass, normal force, gravity, friction, and net acceleration',
    badge: 'Interactive',
    interactiveModal: 'freeBodyDiagram',
    tags: ['fbd', 'free body', 'normal force', 'gravity', 'friction', 'incline', 'acceleration'],
    execute: (context, options) => {
      const mass = options?.mass ?? 5;
      const g = options?.gravity ?? 9.8;
      const incline = options?.inclineAngle ?? 0;
      const applied = options?.appliedForce ?? 30;
      const mu = options?.frictionCoeff ?? 0.3;
      const alphaRad = (incline * Math.PI) / 180;
      const weight = Number((mass * g).toFixed(1));
      const normal = Number((weight * Math.cos(alphaRad)).toFixed(1));
      const friction = Number((mu * normal).toFixed(1));
      const gravityParallel = Number((weight * Math.sin(alphaRad)).toFixed(1));
      const netForce = Number((applied - friction - gravityParallel).toFixed(1));
      const accel = mass > 0 ? Number((netForce / mass).toFixed(2)) : 0;

      const cleanLabel =
        incline > 0
          ? `FBD: m=${mass}kg @ ${incline}°, Fnet=${netForce}N, a=${accel}m/s²`
          : `Free Body Diagram: m=${mass}kg, Fnet=${netForce}N, a=${accel}m/s²`;

      const fbd = createShape('physicsDiagram', 200, 160, 480, 390, {
        params: {
          diagramType: 'freeBodyDiagram',
          mass,
          gravity: g,
          inclineAngle: incline,
          appliedForce: applied,
          frictionCoeff: mu,
          frictionForce: friction,
          normalForce: normal,
          weight,
          netForce,
          acceleration: accel,
          showComponents: true,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: cleanLabel,
      });
      executeAddObject(context, fbd, 'Insert Free Body Diagram');
    },
  },

  // 12. Motion Diagram & Kinematics Trajectory
  {
    id: 'phys-motion-diagram',
    subjectId: 'physics',
    name: 'Kinematic Motion Diagram',
    category: 'Mechanics',
    icon: '🎢',
    description: 'Parabolic projectile trajectory with velocity vectors and tested kinematic equations',
    badge: 'Interactive',
    interactiveModal: 'motionDiagram',
    tags: ['kinematics', 'projectile', 'trajectory', 'velocity', 'motion', 'range'],
    execute: (context, options) => {
      const v0 = options?.initialVelocity ?? 25;
      const angle = options?.angle ?? 45;
      const g = options?.gravity ?? 9.81;
      const result = calculateProjectileMotion(v0, angle, g);

      const motion = createShape('physicsDiagram', 200, 160, 520, 370, {
        params: {
          diagramType: 'motionDiagram',
          initialVelocity: v0,
          angle,
          gravity: g,
          flightTime: result.flightTime,
          maxHeight: result.maxHeight,
          range: result.range,
          trajectory: result.trajectoryPoints,
          showVelocityVectors: true,
        },
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
        label: `Projectile: v0=${v0}m/s, θ=${angle}°, Range=${result.range}m`,
      });
      executeAddObject(context, motion, 'Insert Projectile Motion Diagram');
    },
  },
];

/**
 * Templates for Physics
 */
const physicsTemplates: SubjectTemplate[] = [
  {
    id: 'phys-tmpl-circuits-lab',
    subjectId: 'physics',
    name: "Ohm's Law Circuit Board",
    category: 'Lesson Templates',
    icon: '⚡',
    description: "Complete workbench with DC series circuit, V=IR equation, and measurement table",
    createObjects: (origin) => {
      const circuit = createShape('physicsDiagram', origin.x, origin.y, 440, 300, {
        params: { diagramType: 'seriesCircuit', voltage: 12, resistance: 4 },
        strokeColor: '#38bdf8',
        fillColor: 'rgba(15, 23, 42, 0.92)',
      });
      const formula1 = createFormula('V = I \\cdot R', origin.x + 480, origin.y + 40);
      const formula2 = createFormula('P = V \\cdot I = I^2 R', origin.x + 480, origin.y + 120);
      return [circuit, formula1, formula2];
    },
  },
  {
    id: 'phys-tmpl-mechanics-fbd',
    subjectId: 'physics',
    name: "Newton's Laws & FBD Workspace",
    category: 'Lesson Templates',
    icon: '🚀',
    description: "Free Body Diagram with Newton's 2nd law F=ma and equilibrium conditions",
    createObjects: (origin) => {
      const fbd = createShape('physicsDiagram', origin.x, origin.y, 420, 340, {
        params: { diagramType: 'freeBodyDiagram' },
        strokeColor: '#38bdf8',
        fillColor: 'rgba(15, 23, 42, 0.92)',
      });
      const formula1 = createFormula('\\Sigma \\vec{F} = m \\vec{a}', origin.x + 460, origin.y + 50);
      const formula2 = createFormula('W = m \\cdot g \\quad (g = 9.81\\text{ m/s}^2)', origin.x + 460, origin.y + 130);
      return [fbd, formula1, formula2];
    },
  },
];

export const PhysicsModule: SubjectModule = {
  id: 'physics',
  name: 'Physics',
  icon: '⚡',
  description: 'Circuits, Ohm’s law, mechanics vectors, resultant forces, projectile kinematics',
  tools: physicsTools,
  templates: physicsTemplates,
};
