/**
 * General Teaching Module (Section 16.5)
 * Mind maps, concept maps, timelines, tables, comparison charts, process diagrams,
 * number systems, image annotations, Q&A cards, classroom seating diagrams.
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, createTextCard, executeAddObject, executeAddMultipleObjects } from './commonHelpers';
import { ShapeObject } from '../../../shared/types';

const generalTeachingTools: SubjectTool[] = [
  // 1. Mind Map
  {
    id: 'teach-mind-map',
    subjectId: 'generalTeaching',
    name: 'Mind Map Diagram',
    category: 'Thinking Maps',
    icon: '🧠',
    description: 'Central concept topic bubble with radial colored subtopics and connecting branches',
    badge: 'Mind Map',
    tags: ['mind map', 'brainstorm', 'radial', 'branches', 'ideas'],
    execute: (context) => {
      const mindMap = createShape('teachingTemplate', 180, 140, 560, 420, {
        params: {
          templateType: 'mindMap',
          centralIdea: 'Main Concept',
          branches: ['Topic 1: Foundations', 'Topic 2: Mechanics', 'Topic 3: Applications', 'Topic 4: Review'],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Mind Map: Main Concept',
      });
      executeAddObject(context, mindMap, 'Insert Mind Map Diagram');
    },
  },

  // 2. Concept Map
  {
    id: 'teach-concept-map',
    subjectId: 'generalTeaching',
    name: 'Concept Map',
    category: 'Thinking Maps',
    icon: '💡',
    description: 'Relational knowledge map with linking phrases between concept nodes (e.g. "leads to", "is a")',
    badge: 'Concept Map',
    tags: ['concept map', 'relations', 'knowledge graph', 'linking phrases'],
    execute: (context) => {
      const conceptMap = createShape('teachingTemplate', 180, 140, 560, 400, {
        params: {
          templateType: 'conceptMap',
          nodes: ['Energy', 'Kinetic', 'Potential'],
          relations: ['transforms into', 'depends on position'],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Concept Map: Energy Transformations',
      });
      executeAddObject(context, conceptMap, 'Insert Concept Map');
    },
  },

  // 3. Chronological Timeline
  {
    id: 'teach-timeline',
    subjectId: 'generalTeaching',
    name: 'Interactive Timeline',
    category: 'Sequences & Timelines',
    icon: '⏳',
    description: 'Horizontal historical timeline with dates, milestone nodes, and descriptive callout flags',
    badge: 'Timeline',
    tags: ['timeline', 'chronology', 'history', 'milestones', 'dates'],
    execute: (context) => {
      const timeline = createShape('teachingTemplate', 160, 180, 640, 260, {
        params: {
          templateType: 'timeline',
          milestones: [
            { year: '1687', title: 'Principia', desc: "Newton's laws of motion" },
            { year: '1865', title: 'Electromagnetism', desc: "Maxwell's equations" },
            { year: '1905', title: 'Relativity', desc: 'Einstein special relativity' },
            { year: '1926', title: 'Quantum Mechanics', desc: 'Schrodinger equation' },
          ],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Scientific History Timeline',
      });
      executeAddObject(context, timeline, 'Insert Chronological Timeline');
    },
  },

  // 4. Comparison Chart: Venn Diagram (2-Circle & 3-Circle)
  {
    id: 'teach-venn-diagram',
    subjectId: 'generalTeaching',
    name: 'Venn Diagram (Comparison)',
    category: 'Comparison Charts',
    icon: '⭕',
    description: 'Overlapping circles showing common intersections and distinct set attributes',
    badge: 'Comparison',
    tags: ['venn diagram', 'sets', 'comparison', 'intersection', 'differences'],
    execute: (context, options) => {
      const circles = options?.circles ?? 2;
      const venn = createShape('teachingTemplate', 200, 160, 520, 360, {
        params: {
          templateType: 'vennDiagram',
          circles,
          labelA: 'Set A',
          labelB: 'Set B',
          intersectionLabel: 'Common (A ∩ B)',
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: `Venn Diagram (${circles} Sets)`,
      });
      executeAddObject(context, venn, 'Insert Venn Diagram Comparison');
    },
  },

  // 5. Pros vs Cons Comparison Balance Board
  {
    id: 'teach-pros-cons',
    subjectId: 'generalTeaching',
    name: 'Pros vs Cons Comparison Board',
    category: 'Comparison Charts',
    icon: '⚖️',
    description: 'Side-by-side comparative balance card with green Pros and red Cons columns',
    badge: 'Comparison',
    tags: ['pros cons', 'advantages', 'disadvantages', 'evaluation'],
    execute: (context) => {
      const prosCons = createShape('teachingTemplate', 200, 160, 520, 360, {
        params: {
          templateType: 'prosCons',
          topic: 'Proposed Solution',
          pros: ['High efficiency', 'Low operational cost', 'Easy to scale'],
          cons: ['High initial investment', 'Requires training'],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Pros vs Cons: Proposed Solution',
      });
      executeAddObject(context, prosCons, 'Insert Pros vs Cons Comparison');
    },
  },

  // 6. Process Chevron Flow Diagram
  {
    id: 'teach-process-chevrons',
    subjectId: 'generalTeaching',
    name: 'Process Flow (Chevrons)',
    category: 'Processes & Workflows',
    icon: '⏩',
    description: 'Multi-stage linear chevron pipeline (Step 1 ➔ Step 2 ➔ Step 3 ➔ Step 4)',
    badge: 'Process',
    tags: ['process', 'chevrons', 'pipeline', 'workflow', 'stages'],
    execute: (context) => {
      const process = createShape('teachingTemplate', 180, 180, 600, 200, {
        params: {
          templateType: 'processChevrons',
          steps: ['1. Discover', '2. Design', '3. Implement', '4. Evaluate'],
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: '4-Stage Process Pipeline',
      });
      executeAddObject(context, process, 'Insert Process Chevron Diagram');
    },
  },

  // 7. Number Systems Diagram
  {
    id: 'teach-number-systems',
    subjectId: 'generalTeaching',
    name: 'Number Systems Hierarchy',
    category: 'Mathematics & Sets',
    icon: '🔢',
    description: 'Nested Venn circles of mathematical number sets: Complex ⊃ Real ⊃ Rational ⊃ Integer ⊃ Natural (N ⊂ Z ⊂ Q ⊂ R ⊂ C)',
    badge: 'Sets',
    tags: ['number systems', 'natural', 'integers', 'rational', 'real', 'complex'],
    execute: (context) => {
      const numSys = createShape('teachingTemplate', 200, 150, 520, 420, {
        params: {
          templateType: 'numberSystems',
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Hierarchy of Number Systems (ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ)',
      });
      executeAddObject(context, numSys, 'Insert Number Systems Hierarchy');
    },
  },

  // 8. Question and Answer Cards (Q&A Flashcard)
  {
    id: 'teach-qa-card',
    subjectId: 'generalTeaching',
    name: 'Interactive Q&A Card',
    category: 'Classroom Activities',
    icon: '❓',
    description: 'Educational flashcard with question banner, answer reveal tab, and points badge',
    badge: 'Activity',
    tags: ['qa card', 'question', 'answer', 'quiz', 'flashcard'],
    execute: (context) => {
      const card = createShape('teachingTemplate', 240, 180, 420, 280, {
        params: {
          templateType: 'qaCard',
          question: 'What is the conservation law in elastic collisions?',
          answer: 'Both momentum and kinetic energy are conserved.',
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Classroom Q&A Card',
      });
      executeAddObject(context, card, 'Insert Classroom Q&A Card');
    },
  },

  // 9. Classroom Seating & Group Layout
  {
    id: 'teach-classroom-layout',
    subjectId: 'generalTeaching',
    name: 'Classroom Seating Diagram',
    category: 'Classroom Management',
    icon: '🪑',
    description: 'Interactive teacher layout with podium/smartboard and 4-student pod work stations',
    badge: 'Layout',
    tags: ['classroom layout', 'seating', 'pods', 'desks', 'smartboard'],
    execute: (context) => {
      const room = createShape('teachingTemplate', 200, 140, 540, 400, {
        params: {
          templateType: 'classroomLayout',
          pods: 4,
          seatsPerPod: 4,
        },
        fillColor: 'rgba(15, 23, 42, 0.94)',
        strokeColor: '#38bdf8',
        label: 'Classroom Seating Chart (4 Pods)',
      });
      executeAddObject(context, room, 'Insert Classroom Seating Diagram');
    },
  },
];

const generalTeachingTemplates: SubjectTemplate[] = [
  {
    id: 'teach-tmpl-scientific-method',
    subjectId: 'generalTeaching',
    name: 'Scientific Method Process Board',
    category: 'Teaching Templates',
    icon: '🔬',
    description: 'Complete 6-step scientific method flowchart board: Observation -> Hypothesis -> Experiment -> Analysis -> Conclusion',
    createObjects: (origin) => {
      const board = createShape('teachingTemplate', origin.x, origin.y, 620, 380, {
        params: {
          templateType: 'processChevrons',
          steps: ['Observation', 'Hypothesis', 'Experiment', 'Analysis', 'Conclusion', 'Report'],
        },
      });
      return [board];
    },
  },
];

export const GeneralTeachingModule: SubjectModule = {
  id: 'generalTeaching',
  name: 'General Teaching',
  icon: '🎓',
  description: 'Mind maps, concept maps, timelines, Venn diagrams, pros/cons, process chevrons, Q&A cards',
  tools: generalTeachingTools,
  templates: generalTeachingTemplates,
};
