/**
 * Common Resources Module
 * Universal pedagogical tools for teachers across all STEM and Humanities disciplines:
 * 1. Custom Hierarchy Chart (organograms, taxonomy trees, system architectures)
 * 2. Interactive Mindmap (collapsible/expandable brainstorm trees, concept networks)
 * 3. Animated Timeline (historical/process chronological milestones with image cards)
 * 4. Customizable Process Chart (chevrons, numbered cards, circular cycles, pipelines)
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, executeAddObject, executeAddMultipleObjects } from './commonHelpers';

// ─── 1. Hierarchy Chart Types & Presets ──────────────────────────────────────

export interface HierarchyNode {
  id: string;
  label: string;
  role?: string;
  color?: string;
  children?: HierarchyNode[];
}

export type HierarchyTheme = 'ocean' | 'emerald' | 'sunset' | 'purple' | 'monochrome';
export type HierarchyStyle = 'rounded' | 'sharp' | 'pill' | 'flat';

export const DEFAULT_HIERARCHY_TREE: HierarchyNode = {
  id: 'node-root',
  label: 'Academic Faculty / Central Topic',
  role: 'Core Category',
  color: '#38bdf8',
  children: [
    {
      id: 'node-sub1',
      label: 'Department A',
      role: 'Division 1',
      color: '#0ea5e9',
      children: [
        { id: 'node-sub1-1', label: 'Unit Alpha', role: 'Lab 1' },
        { id: 'node-sub1-2', label: 'Unit Beta', role: 'Lab 2' },
      ],
    },
    {
      id: 'node-sub2',
      label: 'Department B',
      role: 'Division 2',
      color: '#10b981',
      children: [
        { id: 'node-sub2-1', label: 'Research Wing', role: 'Team 1' },
        { id: 'node-sub2-2', label: 'Development Wing', role: 'Team 2' },
      ],
    },
    {
      id: 'node-sub3',
      label: 'Department C',
      role: 'Division 3',
      color: '#f59e0b',
      children: [
        { id: 'node-sub3-1', label: 'Operations', role: 'Admin' },
      ],
    },
  ],
};

// ─── 2. Mindmap Types & Presets ──────────────────────────────────────────────

export interface MindmapNode {
  id: string;
  text: string;
  color?: string;
  icon?: string;
  collapsed?: boolean;
  children?: MindmapNode[];
}

export const DEFAULT_MINDMAP: MindmapNode = {
  id: 'mm-root',
  text: 'Central Research Topic',
  color: '#6366f1',
  icon: '💡',
  children: [
    {
      id: 'mm-b1',
      text: 'Key Concepts & Theory',
      color: '#38bdf8',
      icon: '📚',
      children: [
        { id: 'mm-b1-1', text: 'Definitions & Axioms' },
        { id: 'mm-b1-2', text: 'Fundamental Laws' },
        { id: 'mm-b1-3', text: 'Core Formulas' },
      ],
    },
    {
      id: 'mm-b2',
      text: 'Methodology & Tools',
      color: '#10b981',
      icon: '🔬',
      children: [
        { id: 'mm-b2-1', text: 'Experimental Setup' },
        { id: 'mm-b2-2', text: 'Data Acquisition' },
      ],
    },
    {
      id: 'mm-b3',
      text: 'Practical Applications',
      color: '#f59e0b',
      icon: '🚀',
      children: [
        { id: 'mm-b3-1', text: 'Industry Solutions' },
        { id: 'mm-b3-2', text: 'Case Studies' },
      ],
    },
    {
      id: 'mm-b4',
      text: 'Future Frontiers',
      color: '#ec4899',
      icon: '✨',
      children: [
        { id: 'mm-b4-1', text: 'Open Questions' },
        { id: 'mm-b4-2', text: 'Next-Gen Research' },
      ],
    },
  ],
};

// ─── 3. Timeline Types & Presets ─────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  dateOrEra: string;
  title: string;
  description: string;
  imageDataUrl?: string;
  color?: string;
  category?: string;
}

export const DEFAULT_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-1',
    dateOrEra: '1969',
    title: 'Apollo 11 Moon Landing',
    description: 'Neil Armstrong and Buzz Aldrin become the first humans to land on the lunar surface.',
    color: '#38bdf8',
    category: 'Space Exploration',
  },
  {
    id: 'evt-2',
    dateOrEra: '1977',
    title: 'Voyager Interstellar Mission',
    description: 'Voyager 1 and 2 launched to explore Jupiter, Saturn, Uranus, Neptune and interstellar space.',
    color: '#06b6d4',
    category: 'Space Exploration',
  },
  {
    id: 'evt-3',
    dateOrEra: '1990',
    title: 'Hubble Space Telescope',
    description: 'Deployment of the first major optical space observatory in low Earth orbit.',
    color: '#10b981',
    category: 'Astronomy',
  },
  {
    id: 'evt-4',
    dateOrEra: '1998',
    title: 'International Space Station',
    description: 'First modules of the modular international orbital laboratory launched.',
    color: '#f59e0b',
    category: 'Global Science',
  },
  {
    id: 'evt-5',
    dateOrEra: '2021',
    title: 'James Webb Space Telescope',
    description: 'Deep infrared observatory observing the earliest galaxies of the universe.',
    color: '#a855f7',
    category: 'Modern Astrophysics',
  },
];

// ─── 4. Process Chart Types & Presets ────────────────────────────────────────

export interface ProcessStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

export type ProcessChartStyle = 'chevron' | 'cards' | 'cycle' | 'pipeline';

export const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: 'Ask Question / Problem Statement',
    description: 'Identify the phenomenon or scientific problem to investigate.',
    icon: '❓',
    color: '#38bdf8',
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: 'Background Research & Hypothesis',
    description: 'Gather existing literature and formulate a testable hypothesis.',
    icon: '🔍',
    color: '#0ea5e9',
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: 'Design Experiment & Testing',
    description: 'Run controlled experiments and record quantitative observations.',
    icon: '🧪',
    color: '#10b981',
  },
  {
    id: 'step-4',
    stepNumber: 4,
    title: 'Data Analysis & Conclusion',
    description: 'Process measurements, draw graphs, and determine hypothesis validity.',
    icon: '📊',
    color: '#f59e0b',
  },
  {
    id: 'step-5',
    stepNumber: 5,
    title: 'Communicate & Publish Results',
    description: 'Present findings, peer review, and iterate on future discoveries.',
    icon: '📢',
    color: '#8b5cf6',
  },
];

// ─── Subject Tools Registry Entries ──────────────────────────────────────────

const commonResourceTools: SubjectTool[] = [
  // 1. Hierarchy Chart (Custom)
  {
    id: 'common-hierarchy-chart',
    subjectId: 'commonResources',
    name: 'Hierarchy Chart (Custom)',
    category: 'Organizational & Taxonomy',
    icon: '🏛️',
    description: 'Customizable hierarchy tree with dynamic text box sizing, themes, fonts, and live on-board node editing',
    badge: 'Interactive',
    tags: ['hierarchy', 'chart', 'tree', 'organization', 'taxonomy', 'structure', 'organogram'],
    interactiveModal: 'hierarchyChart',
    execute: (context, options) => {
      const tree = options?.tree || JSON.parse(JSON.stringify(DEFAULT_HIERARCHY_TREE));
      const theme = options?.theme || 'ocean';
      const style = options?.style || 'rounded';
      const fontSize = options?.fontSize || 14;

      const shape = createShape('hierarchyChart', 200, 140, 680, 420, {
        params: {
          tree,
          theme,
          style,
          fontSize,
          selectedNodeId: 'node-root',
        },
        label: 'Hierarchy Chart',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
      });

      executeAddObject(context, shape, 'Insert Custom Hierarchy Chart');
    },
  },

  // 2. Mindmap
  {
    id: 'common-mindmap',
    subjectId: 'commonResources',
    name: 'Interactive Mindmap',
    category: 'Concept & Brainstorming',
    icon: '🧠',
    description: 'Dynamic brainstorming tree that reacts when clicking nodes to expand/collapse branches and highlight ideas live',
    badge: 'Interactive',
    tags: ['mindmap', 'brainstorming', 'ideas', 'nodes', 'branches', 'concept', 'interactive'],
    interactiveModal: 'mindmap',
    execute: (context, options) => {
      const root = options?.root || JSON.parse(JSON.stringify(DEFAULT_MINDMAP));
      const theme = options?.theme || 'indigo';

      const shape = createShape('mindmap', 220, 140, 720, 460, {
        params: {
          root,
          theme,
          selectedNodeId: 'mm-root',
        },
        label: 'Interactive Mindmap',
        strokeColor: '#818cf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
      });

      executeAddObject(context, shape, 'Insert Interactive Mindmap');
    },
  },

  // 3. Timeline
  {
    id: 'common-timeline',
    subjectId: 'commonResources',
    name: 'Animated Timeline',
    category: 'Chronological & History',
    icon: '⏳',
    description: 'Custom vertical and horizontal timeline with animated event navigation and image cards from clipboard or computer',
    badge: 'Interactive',
    tags: ['timeline', 'chronology', 'history', 'events', 'milestones', 'animated', 'images'],
    interactiveModal: 'timeline',
    execute: (context, options) => {
      const events = options?.events || JSON.parse(JSON.stringify(DEFAULT_TIMELINE_EVENTS));
      const orientation = options?.orientation || 'horizontal';

      const shape = createShape('timeline', 180, 150, orientation === 'horizontal' ? 760 : 480, orientation === 'horizontal' ? 360 : 540, {
        params: {
          events,
          orientation,
          activeEventIndex: 0,
        },
        label: 'Timeline: Historical Milestones',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
      });

      executeAddObject(context, shape, 'Insert Animated Timeline');
    },
  },

  // 4. Process Chart
  {
    id: 'common-process-chart',
    subjectId: 'commonResources',
    name: 'Process Flow Chart',
    category: 'Workflows & Procedures',
    icon: '🔄',
    description: 'Editable multi-step process chart supporting Chevrons, Milestone Cards, Circular Cycles, and Staged Pipelines',
    badge: 'Interactive',
    tags: ['process', 'workflow', 'steps', 'procedure', 'cycle', 'chevron', 'pipeline'],
    interactiveModal: 'processChart',
    execute: (context, options) => {
      const steps = options?.steps || JSON.parse(JSON.stringify(DEFAULT_PROCESS_STEPS));
      const style = options?.style || 'chevron';

      const shape = createShape('processChart', 190, 160, 740, style === 'cycle' ? 440 : 260, {
        params: {
          steps,
          style,
          activeStepIndex: 0,
        },
        label: 'Scientific Method Process',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
      });

      executeAddObject(context, shape, 'Insert Process Flow Chart');
    },
  },
];

// ─── Templates Registry Entries ──────────────────────────────────────────────

const commonResourceTemplates: SubjectTemplate[] = [
  {
    id: 'tmpl-org-chart',
    subjectId: 'commonResources',
    name: 'Academic Department Hierarchy',
    category: 'Organizational Templates',
    icon: '🏛️',
    description: 'Full 3-tier departmental hierarchy ready for teaching administration or corporate structures',
    createObjects: (origin) => [
      createShape('hierarchyChart', origin.x, origin.y, 700, 420, {
        params: {
          tree: DEFAULT_HIERARCHY_TREE,
          theme: 'ocean',
          style: 'rounded',
          fontSize: 14,
          selectedNodeId: 'node-root',
        },
        label: 'Department Hierarchy',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
      }),
    ],
  },
  {
    id: 'tmpl-science-mindmap',
    subjectId: 'commonResources',
    name: 'Scientific Research Mindmap',
    category: 'Concept Templates',
    icon: '🧠',
    description: '4-branch concept map for hypothesis formulation, methods, applications, and conclusions',
    createObjects: (origin) => [
      createShape('mindmap', origin.x, origin.y, 720, 460, {
        params: {
          root: DEFAULT_MINDMAP,
          theme: 'indigo',
          selectedNodeId: 'mm-root',
        },
        label: 'Scientific Research Mindmap',
        strokeColor: '#818cf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
      }),
    ],
  },
  {
    id: 'tmpl-horizontal-timeline',
    subjectId: 'commonResources',
    name: 'Science & Technology Milestones Timeline',
    category: 'Timeline Templates',
    icon: '⏳',
    description: 'Interactive chronological sequence with 5 historical milestones',
    createObjects: (origin) => [
      createShape('timeline', origin.x, origin.y, 780, 360, {
        params: {
          events: DEFAULT_TIMELINE_EVENTS,
          orientation: 'horizontal',
          activeEventIndex: 0,
        },
        label: 'Science Milestones Timeline',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
      }),
    ],
  },
  {
    id: 'tmpl-scientific-method-process',
    subjectId: 'commonResources',
    name: '5-Step Scientific Method Process',
    category: 'Process Templates',
    icon: '🔄',
    description: 'Chevron sequential flow for laboratory investigations and engineering methodologies',
    createObjects: (origin) => [
      createShape('processChart', origin.x, origin.y, 760, 260, {
        params: {
          steps: DEFAULT_PROCESS_STEPS,
          style: 'chevron',
          activeStepIndex: 0,
        },
        label: 'Scientific Method Process',
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        fillColor: 'rgba(15, 23, 42, 0.94)',
      }),
    ],
  },
];

export const CommonResourcesModule: SubjectModule = {
  id: 'commonResources',
  name: 'Common Resources',
  icon: '🧰',
  description: 'Interactive hierarchy charts, mindmaps, animated timelines, and process flows for curriculum lectures',
  tools: commonResourceTools,
  templates: commonResourceTemplates,
};

