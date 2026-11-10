/**
 * educationalVectorIconsService.ts
 * Curated library of 100+ high-resolution, thematic educational vector SVG icons & stickers
 * with rich semantic labeling for automatic AI placement and manual classroom whiteboard insertion.
 */

export interface VectorIconItem {
  id: string;
  name: string;
  category:
    | 'pedagogy'
    | 'thinking'
    | 'callouts'
    | 'math'
    | 'physics'
    | 'chemistry-biology'
    | 'tech-cs'
    | 'humanities'
    | 'business-charts';
  tags: string[];
  defaultColor?: string;
  svg: string;
}

export const VECTOR_ICONS_LIBRARY: VectorIconItem[] = [
  // ─── 1. PEDAGOGY & CLASSROOM (12 Icons) ────────────────────────────────────
  {
    id: 'teacher-presenting',
    name: 'Teacher Presenting',
    category: 'pedagogy',
    tags: ['teacher', 'instructor', 'teaching', 'lesson', 'lecture', 'professor', 'pedagogy', 'educator', 'presentation'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="18" r="8" fill="#38bdf8"/>
      <path d="M12 48c0-8 5.4-14 12-14s12 6 12 14v4H12v-4z" fill="#38bdf8"/>
      <path d="M36 28h20v18H36z" rx="2" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <line x1="40" y1="34" x2="52" y2="34" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="40" x2="48" y2="40" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
      <line x1="28" y1="28" x2="36" y2="24" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'teacher-chalkboard',
    name: 'Teacher with Pointer',
    category: 'pedagogy',
    tags: ['teacher', 'pointer', 'chalkboard', 'instruct', 'explain', 'blackboard', 'tutor'],
    defaultColor: '#60a5fa',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="18" r="7" fill="#60a5fa"/>
      <path d="M10 46c0-7 4.5-12 10-12s10 5 10 12v6H10v-6z" fill="#60a5fa"/>
      <rect x="26" y="12" width="32" height="26" rx="3" fill="#0f172a" stroke="#60a5fa" stroke-width="2"/>
      <path d="M22 28l18-12" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
      <circle cx="40" cy="16" r="2" fill="#ef4444"/>
    </svg>`,
  },
  {
    id: 'student-raising-hand',
    name: 'Student Raising Hand',
    category: 'pedagogy',
    tags: ['student', 'question', 'ask', 'participate', 'hand', 'curious', 'pupil', 'learn'],
    defaultColor: '#818cf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="22" r="8" fill="#818cf8"/>
      <path d="M20 52c0-8 5.4-14 12-14s12 6 12 14v4H20v-4z" fill="#818cf8"/>
      <path d="M42 34l8-16" stroke="#facc15" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="50" cy="18" r="3" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'student-reading',
    name: 'Student Reading Book',
    category: 'pedagogy',
    tags: ['student', 'reading', 'book', 'study', 'homework', 'learning', 'literature'],
    defaultColor: '#34d399',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="16" r="7" fill="#34d399"/>
      <path d="M20 48c0-7 5.4-12 12-12s12 5 12 12H20z" fill="#34d399"/>
      <path d="M16 46c5-3 11-3 16 0 5-3 11-3 16 0v10c-5-3-11-3-16 0-5-3-11-3-16 0V46z" fill="#f8fafc" stroke="#3b82f6" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'graduation-cap',
    name: 'Graduation Cap',
    category: 'pedagogy',
    tags: ['graduation', 'cap', 'mortarboard', 'degree', 'diploma', 'alumni', 'achievement', 'academic', 'college'],
    defaultColor: '#facc15',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 12l24 10-24 10L8 22l24-10z" fill="#facc15"/>
      <path d="M18 30v12c0 6 6.3 10 14 10s14-4 14-10V30l-14 6-14-6z" fill="#eab308"/>
      <path d="M52 24v16c0 2-2 3-3 3" stroke="#f8fafc" stroke-width="2"/>
      <circle cx="49" cy="45" r="2.5" fill="#f8fafc"/>
    </svg>`,
  },
  {
    id: 'blackboard-chalk',
    name: 'Classroom Chalkboard',
    category: 'pedagogy',
    tags: ['blackboard', 'chalkboard', 'chalk', 'classroom', 'board', 'lesson', 'formula'],
    defaultColor: '#22c55e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="48" height="34" rx="4" fill="#14532d" stroke="#854d0e" stroke-width="3"/>
      <line x1="16" y1="22" x2="36" y2="22" stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="30" x2="48" y2="30" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
      <rect x="22" y="44" width="8" height="3" rx="1" fill="#f8fafc"/>
      <line x1="18" y1="46" x2="14" y2="56" stroke="#854d0e" stroke-width="3" stroke-linecap="round"/>
      <line x1="46" y1="46" x2="50" y2="56" stroke="#854d0e" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'school-bell',
    name: 'School Bell',
    category: 'pedagogy',
    tags: ['bell', 'school', 'period', 'class', 'schedule', 'time', 'alert', 'session'],
    defaultColor: '#fbbf24',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10a14 14 0 00-14 14v10l-4 6h36l-4-6V24a14 14 0 00-14-14z" fill="#fbbf24"/>
      <circle cx="32" cy="48" r="4" fill="#d97706"/>
      <path d="M30 6h4v4h-4z" fill="#d97706"/>
    </svg>`,
  },
  {
    id: 'whiteboard-marker',
    name: 'Marker & Pen',
    category: 'pedagogy',
    tags: ['marker', 'pen', 'draw', 'write', 'annotation', 'smartboard', 'ink'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M42 10l12 12-24 24H18v-12L42 10z" fill="#38bdf8"/>
      <path d="M18 46l-6 6 6-6z" fill="#0284c7"/>
      <path d="M12 52l6-2-4-4-2 6z" fill="#0f172a"/>
    </svg>`,
  },
  {
    id: 'backpack',
    name: 'Student Backpack',
    category: 'pedagogy',
    tags: ['backpack', 'bag', 'school', 'supplies', 'student', 'stationery', 'education'],
    defaultColor: '#ec4899',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 18a12 12 0 0124 0v30a4 4 0 01-4 4H24a4 4 0 01-4-4V18z" fill="#ec4899"/>
      <rect x="22" y="32" width="20" height="14" rx="3" fill="#be185d"/>
      <path d="M26 12a6 6 0 0112 0" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'diploma-certificate',
    name: 'Diploma Certificate',
    category: 'pedagogy',
    tags: ['diploma', 'certificate', 'honor', 'award', 'graduate', 'verified', 'course', 'exam'],
    defaultColor: '#facc15',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="16" width="40" height="32" rx="3" fill="#fef08a" stroke="#ca8a04" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="6" fill="#ef4444"/>
      <path d="M28 36l-2 10 6-3 6 3-2-10" fill="#dc2626"/>
      <line x1="18" y1="24" x2="46" y2="24" stroke="#a16207" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'podium-lectern',
    name: 'Classroom Podium',
    category: 'pedagogy',
    tags: ['podium', 'lectern', 'speech', 'debate', 'presentation', 'conference'],
    defaultColor: '#a78bfa',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 18l36-4 4 10-44 4 4-10z" fill="#a78bfa"/>
      <path d="M24 28h16v24H24z" fill="#7c3aed"/>
      <rect x="18" y="52" width="28" height="6" rx="2" fill="#6d28d9"/>
      <circle cx="32" cy="12" r="3" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'classroom-desk',
    name: 'Study Desk',
    category: 'pedagogy',
    tags: ['desk', 'table', 'study', 'room', 'furniture', 'workbench', 'learn'],
    defaultColor: '#fb923c',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="24" width="48" height="8" rx="2" fill="#fb923c"/>
      <line x1="14" y1="32" x2="14" y2="54" stroke="#c2410c" stroke-width="4"/>
      <line x1="50" y1="32" x2="50" y2="54" stroke="#c2410c" stroke-width="4"/>
      <path d="M22 24l4-8h12l4 8" fill="#38bdf8"/>
    </svg>`,
  },

  // ─── 2. COGNITIVE & THINKING (12 Icons) ────────────────────────────────────
  {
    id: 'bulb-idea',
    name: 'Bright Idea / Lightbulb',
    category: 'thinking',
    tags: ['bulb', 'idea', 'concept', 'insight', 'smart', 'eureka', 'think', 'thought', 'innovation'],
    defaultColor: '#facc15',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10a16 16 0 00-11 28c3 3 5 7 5 11h12c0-4 2-8 5-11a16 16 0 00-11-28z" fill="#facc15"/>
      <rect x="27" y="49" width="10" height="3" rx="1.5" fill="#e2e8f0"/>
      <rect x="29" y="53" width="6" height="3" rx="1.5" fill="#cbd5e1"/>
      <line x1="32" y1="3" x2="32" y2="7" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="12" x2="17" y2="15" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
      <line x1="50" y1="12" x2="47" y2="15" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'bulb-spark',
    name: 'Inspiration Spark',
    category: 'thinking',
    tags: ['spark', 'flash', 'eureka', 'brilliant', 'glow', 'solution', 'discovery'],
    defaultColor: '#fbbf24',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8l4 18 18 4-18 4-4 18-4-18-18-4 18-4 4-18z" fill="#fbbf24"/>
      <circle cx="32" cy="30" r="4" fill="#ffffff"/>
    </svg>`,
  },
  {
    id: 'brain-synapse',
    name: 'Thinking Brain',
    category: 'thinking',
    tags: ['brain', 'mind', 'intellect', 'psychology', 'neuroscience', 'cognitive', 'thought', 'logic'],
    defaultColor: '#f43f5e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 20a8 8 0 00-8 8c0 4 3 8 7 8a9 9 0 000 8c4 0 7-3 8-7v-17z" fill="#fb7185"/>
      <path d="M42 20a8 8 0 018 8c0 4-3 8-7 8a9 9 0 010 8c-4 0-7-3-8-7v-17z" fill="#f43f5e"/>
      <circle cx="28" cy="28" r="2.5" fill="#ffffff"/>
      <circle cx="36" cy="28" r="2.5" fill="#ffffff"/>
    </svg>`,
  },
  {
    id: 'puzzle-piece',
    name: 'Puzzle Piece',
    category: 'thinking',
    tags: ['puzzle', 'piece', 'problem', 'solve', 'connection', 'fit', 'logic', 'matching'],
    defaultColor: '#06b6d4',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 18h8a5 5 0 0110 0h8v8a5 5 0 010 10v8h-8a5 5 0 01-10 0h-8v-8a5 5 0 000-10v-8z" fill="#06b6d4"/>
    </svg>`,
  },
  {
    id: 'gear-mechanism',
    name: 'Gears & Mechanism',
    category: 'thinking',
    tags: ['gear', 'settings', 'process', 'mechanism', 'engineering', 'operation', 'system'],
    defaultColor: '#94a3b8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="14" fill="#64748b"/>
      <circle cx="32" cy="32" r="6" fill="#0f172a"/>
      <path d="M30 14h4v6h-4zM30 44h4v6h-4zM14 30h6v4h-6zM44 30h6v4h-6z" fill="#94a3b8"/>
    </svg>`,
  },
  {
    id: 'target-bullseye',
    name: 'Target Bullseye',
    category: 'thinking',
    tags: ['target', 'goal', 'objective', 'aim', 'focus', 'accuracy', 'bullseye', 'outcome'],
    defaultColor: '#ef4444',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="#ef4444"/>
      <circle cx="32" cy="32" r="16" fill="#f8fafc"/>
      <circle cx="32" cy="32" r="10" fill="#ef4444"/>
      <circle cx="32" cy="32" r="4" fill="#f8fafc"/>
      <path d="M42 22l14-14m-14 0l14 14" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'rocket-launch',
    name: 'Rocket Launch',
    category: 'thinking',
    tags: ['rocket', 'launch', 'speed', 'fast', 'startup', 'innovation', 'boost', 'growth', 'progress'],
    defaultColor: '#f97316',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10c8 8 12 18 10 26l-10-6-10 6c-2-8 2-18 10-26z" fill="#f8fafc"/>
      <circle cx="32" cy="24" r="3.5" fill="#38bdf8"/>
      <path d="M22 36l-8 6 4-10 4 4zm20 0l8 6-4-10-4 4z" fill="#ef4444"/>
      <path d="M30 42l2 12 2-12z" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'trophy-champion',
    name: 'Golden Trophy',
    category: 'thinking',
    tags: ['trophy', 'winner', 'award', 'champion', 'success', 'first', 'gold', 'prize'],
    defaultColor: '#eab308',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 16h24v14a12 12 0 01-24 0V16z" fill="#eab308"/>
      <path d="M20 20H12a6 6 0 006 6h2v-6zm24 0h8a6 6 0 01-6 6h-2v-6z" fill="#ca8a04"/>
      <rect x="29" y="38" width="6" height="8" fill="#a16207"/>
      <rect x="22" y="46" width="20" height="6" rx="2" fill="#713f12"/>
    </svg>`,
  },
  {
    id: 'star-favorite',
    name: 'Golden Star',
    category: 'thinking',
    tags: ['star', 'favorite', 'rating', 'excellence', 'highlight', 'featured', 'important'],
    defaultColor: '#facc15',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,8 39,24 56,26 43,38 47,55 32,46 17,55 21,38 8,26 25,24" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'badge-verified',
    name: 'Quality Badge',
    category: 'thinking',
    tags: ['badge', 'verified', 'guaranteed', 'certified', 'seal', 'official', 'top'],
    defaultColor: '#3b82f6',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="28" r="16" fill="#3b82f6"/>
      <path d="M26 28l4 4 8-8" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 40l-4 14 12-6 12 6-4-14" fill="#1d4ed8"/>
    </svg>`,
  },
  {
    id: 'key-concept',
    name: 'Golden Key',
    category: 'thinking',
    tags: ['key', 'concept', 'unlock', 'solution', 'secret', 'access', 'core', 'vital'],
    defaultColor: '#fbbf24',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="26" r="10" stroke="#fbbf24" stroke-width="4" fill="none"/>
      <path d="M29 33l22 22 5-5-3-3 4-4-3-3" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'compass-strategy',
    name: 'Navigation Compass',
    category: 'thinking',
    tags: ['compass', 'direction', 'guidance', 'strategy', 'navigation', 'orientation', 'path'],
    defaultColor: '#6366f1',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" stroke="#6366f1" stroke-width="3" fill="none"/>
      <polygon points="32,16 38,32 32,28" fill="#ef4444"/>
      <polygon points="32,48 26,32 32,36" fill="#3b82f6"/>
      <circle cx="32" cy="32" r="3" fill="#ffffff"/>
    </svg>`,
  },

  // ─── 3. STATUS & CALLOUTS (12 Icons) ──────────────────────────────────────
  {
    id: 'check-circle',
    name: 'Checkmark Solution',
    category: 'callouts',
    tags: ['check', 'correct', 'solution', 'verified', 'done', 'answer', 'success', 'true', 'right'],
    defaultColor: '#10b981',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="#10b981"/>
      <path d="M22 32l7 7 14-14" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'check-double',
    name: 'Double Check Verified',
    category: 'callouts',
    tags: ['check', 'double', 'confirmed', 'validated', 'complete', 'approved'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 32l6 6 12-12" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M28 32l6 6 12-12" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'cross-error',
    name: 'Cross Error / Incorrect',
    category: 'callouts',
    tags: ['cross', 'wrong', 'error', 'false', 'incorrect', 'misconception', 'pitfall', 'stop'],
    defaultColor: '#ef4444',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="#ef4444"/>
      <line x1="22" y1="22" x2="42" y2="42" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="42" y1="22" x2="22" y2="42" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'warning-triangle',
    name: 'Warning / Caution Note',
    category: 'callouts',
    tags: ['warning', 'caution', 'alert', 'important', 'notice', 'remember', 'note', 'pitfall', 'attention'],
    defaultColor: '#f59e0b',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10L8 50h48L32 10z" fill="#f59e0b"/>
      <line x1="32" y1="24" x2="32" y2="36" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="43" r="2.5" fill="#0f172a"/>
    </svg>`,
  },
  {
    id: 'info-circle',
    name: 'Information Note',
    category: 'callouts',
    tags: ['info', 'information', 'details', 'note', 'tip', 'help', 'explanation', 'overview'],
    defaultColor: '#0ea5e9',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="#0ea5e9"/>
      <circle cx="32" cy="22" r="3" fill="#ffffff"/>
      <line x1="32" y1="29" x2="32" y2="43" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'question-circle',
    name: 'Question / Quiz Prompt',
    category: 'callouts',
    tags: ['question', 'quiz', 'ask', 'doubt', 'inquiry', 'problem', 'test', 'exam'],
    defaultColor: '#8b5cf6',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="#8b5cf6"/>
      <path d="M26 24a6 6 0 0111-2c0 3-3 4-4 6v3" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="43" r="2.5" fill="#ffffff"/>
    </svg>`,
  },
  {
    id: 'alert-octagon',
    name: 'Stop / Critical Rule',
    category: 'callouts',
    tags: ['stop', 'danger', 'critical', 'rule', 'exception', 'forbidden', 'limit'],
    defaultColor: '#dc2626',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,10 44,10 54,20 54,44 44,54 20,54 10,44 10,20" fill="#dc2626"/>
      <line x1="32" y1="22" x2="32" y2="34" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="2.5" fill="#ffffff"/>
    </svg>`,
  },
  {
    id: 'flag-milestone',
    name: 'Milestone Flag',
    category: 'callouts',
    tags: ['flag', 'milestone', 'step', 'stage', 'phase', 'checkpoint', 'goal'],
    defaultColor: '#ec4899',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="16" y1="12" x2="16" y2="54" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M16 14h28l-6 10 6 10H16z" fill="#ec4899"/>
    </svg>`,
  },
  {
    id: 'pin-push',
    name: 'Notice Pushpin',
    category: 'callouts',
    tags: ['pin', 'notice', 'announcement', 'bulletin', 'reminder', 'sticky'],
    defaultColor: '#f43f5e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 12h12l-2 14 6 4v4H16v-4l6-4-2-14z" fill="#f43f5e"/>
      <line x1="32" y1="34" x2="32" y2="52" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'bookmark-ribbon',
    name: 'Bookmark Ribbon',
    category: 'callouts',
    tags: ['bookmark', 'save', 'ribbon', 'reading', 'chapter', 'reference', 'page'],
    defaultColor: '#6366f1',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 12h24v38l-12-8-12 8V12z" fill="#6366f1"/>
    </svg>`,
  },
  {
    id: 'shield-security',
    name: 'Protection Shield',
    category: 'callouts',
    tags: ['shield', 'secure', 'safe', 'protection', 'defense', 'policy'],
    defaultColor: '#059669',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10l18 6v16c0 12-8 20-18 24-10-4-18-12-18-24V16l18-6z" fill="#059669"/>
      <path d="M32 20v26c6-3 10-8 10-14V23l-10-3z" fill="#34d399"/>
    </svg>`,
  },
  {
    id: 'thumbs-up',
    name: 'Approval / Well Done',
    category: 'callouts',
    tags: ['thumbsup', 'like', 'good', 'approved', 'correct', 'praise', 'positive'],
    defaultColor: '#3b82f6',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 26h6v22h-6z" fill="#1d4ed8"/>
      <path d="M22 48h18a6 6 0 006-6l2-10a4 4 0 00-4-4h-8l2-8a4 4 0 00-4-4l-8 14v18z" fill="#3b82f6"/>
    </svg>`,
  },

  // ─── 4. MATHEMATICS & GEOMETRY (12 Icons) ──────────────────────────────────
  {
    id: 'math-pi',
    name: 'Pi Constant (π)',
    category: 'math',
    tags: ['pi', 'math', 'mathematics', 'formula', 'geometry', 'circle', 'equation', 'constant'],
    defaultColor: '#f59e0b',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 20h36" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
      <path d="M24 20v24c0 2-2 4-4 4" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M40 20v26c0 2 1 3 3 3" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'math-integral',
    name: 'Calculus Integral (∫)',
    category: 'math',
    tags: ['integral', 'calculus', 'math', 'derivative', 'area', 'accumulation', 'function'],
    defaultColor: '#06b6d4',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 12c-6 0-8 6-8 12v16c0 6-2 12-8 12" stroke="#06b6d4" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'math-summation',
    name: 'Summation Sigma (∑)',
    category: 'math',
    tags: ['sigma', 'summation', 'sum', 'series', 'sequence', 'total', 'math', 'arithmetic'],
    defaultColor: '#3b82f6',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 16H20l12 16-12 16h24" stroke="#3b82f6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'math-sqrt',
    name: 'Square Root (√)',
    category: 'math',
    tags: ['sqrt', 'squareroot', 'radical', 'math', 'exponent', 'algebra', 'root'],
    defaultColor: '#10b981',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 36l6 6 10-26h24" stroke="#10b981" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="32" y="38" fill="#10b981" font-family="Inter, sans-serif" font-size="16" font-weight="bold">x</text>
    </svg>`,
  },
  {
    id: 'math-infinity',
    name: 'Infinity Symbol (∞)',
    category: 'math',
    tags: ['infinity', 'limit', 'limitless', 'calculus', 'boundless', 'loop', 'math'],
    defaultColor: '#a855f7',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 24c-6 0-10 4-10 8s4 8 10 8 10-8 10-8 4 8 10 8 10-4 10-8-4-8-10-8-10 8-10 8-4-8-10-8z" stroke="#a855f7" stroke-width="4.5" fill="none"/>
    </svg>`,
  },
  {
    id: 'geometry-triangle',
    name: 'Right Triangle',
    category: 'math',
    tags: ['triangle', 'pythagoras', 'hypotenuse', 'trigonometry', 'sine', 'cosine', 'angle', 'geometry'],
    defaultColor: '#f97316',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="14,50 50,50 14,14" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" stroke-width="3.5"/>
      <rect x="14" y="42" width="8" height="8" stroke="#f97316" stroke-width="2" fill="none"/>
    </svg>`,
  },
  {
    id: 'geometry-circle',
    name: 'Circle & Radius',
    category: 'math',
    tags: ['circle', 'radius', 'diameter', 'circumference', 'area', 'geometry', 'arc'],
    defaultColor: '#0ea5e9',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" stroke="#0ea5e9" stroke-width="3" fill="none"/>
      <line x1="32" y1="32" x2="48" y2="20" stroke="#ef4444" stroke-width="2.5"/>
      <circle cx="32" cy="32" r="3" fill="#ef4444"/>
      <text x="38" y="24" fill="#ef4444" font-size="11" font-weight="bold">r</text>
    </svg>`,
  },
  {
    id: 'geometry-cube',
    name: '3D Geometric Cube',
    category: 'math',
    tags: ['cube', '3d', 'volume', 'surface', 'geometry', 'spatial', 'solid'],
    defaultColor: '#8b5cf6',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,10 52,22 32,34 12,22" fill="#a78bfa"/>
      <polygon points="12,22 32,34 32,54 12,42" fill="#7c3aed"/>
      <polygon points="52,22 32,34 32,54 52,42" fill="#6d28d9"/>
    </svg>`,
  },
  {
    id: 'protractor-ruler',
    name: 'Protractor & Angle',
    category: 'math',
    tags: ['protractor', 'ruler', 'angle', 'degrees', 'measurement', 'geometry', 'drafting'],
    defaultColor: '#fbbf24',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 44a20 20 0 0140 0H12z" fill="rgba(251, 191, 36, 0.25)" stroke="#fbbf24" stroke-width="3"/>
      <line x1="32" y1="44" x2="32" y2="24" stroke="#fbbf24" stroke-width="2"/>
      <circle cx="32" cy="44" r="2.5" fill="#fbbf24"/>
    </svg>`,
  },
  {
    id: 'abacus',
    name: 'Arithmetic Abacus',
    category: 'math',
    tags: ['abacus', 'count', 'arithmetic', 'number', 'calculate', 'digits'],
    defaultColor: '#854d0e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="14" width="40" height="36" rx="3" stroke="#854d0e" stroke-width="3" fill="none"/>
      <line x1="12" y1="26" x2="52" y2="26" stroke="#854d0e" stroke-width="2"/>
      <circle cx="22" cy="20" r="3" fill="#ef4444"/>
      <circle cx="32" cy="20" r="3" fill="#facc15"/>
      <circle cx="42" cy="20" r="3" fill="#3b82f6"/>
      <circle cx="22" cy="38" r="3" fill="#10b981"/>
      <circle cx="32" cy="44" r="3" fill="#8b5cf6"/>
    </svg>`,
  },
  {
    id: 'math-plus-minus',
    name: 'Arithmetic Operations (±)',
    category: 'math',
    tags: ['plus', 'minus', 'math', 'operations', 'arithmetic', 'addition', 'subtraction'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="32" y1="14" x2="32" y2="34" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="22" y1="24" x2="42" y2="24" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="22" y1="46" x2="42" y2="46" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'geometry-pyramid',
    name: '3D Pyramid Solid',
    category: 'math',
    tags: ['pyramid', 'polyhedron', 'solid', 'geometry', 'apex', 'triangle'],
    defaultColor: '#f59e0b',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,10 12,48 38,52" fill="#d97706"/>
      <polygon points="32,10 38,52 52,44" fill="#b45309"/>
    </svg>`,
  },

  // ─── 5. SCIENCE & PHYSICS (12 Icons) ──────────────────────────────────────
  {
    id: 'atom-physics',
    name: 'Atomic Structure',
    category: 'physics',
    tags: ['atom', 'physics', 'quantum', 'nuclear', 'particle', 'bohr', 'electron', 'science', 'energy'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="32" rx="22" ry="8" stroke="#38bdf8" stroke-width="2.5" transform="rotate(30 32 32)"/>
      <ellipse cx="32" cy="32" rx="22" ry="8" stroke="#38bdf8" stroke-width="2.5" transform="rotate(-30 32 32)"/>
      <circle cx="32" cy="32" r="5" fill="#facc15"/>
      <circle cx="48" cy="24" r="2.5" fill="#38bdf8"/>
    </svg>`,
  },
  {
    id: 'magnet-horseshoe',
    name: 'Magnetic Poles',
    category: 'physics',
    tags: ['magnet', 'magnetic', 'poles', 'north', 'south', 'attraction', 'field', 'physics'],
    defaultColor: '#ef4444',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 14v18a16 16 0 0032 0V14h-10v18a6 6 0 01-12 0V14H16z" fill="#ef4444"/>
      <rect x="16" y="14" width="10" height="8" fill="#3b82f6"/>
      <rect x="38" y="14" width="10" height="8" fill="#ef4444"/>
      <text x="18" y="20" fill="#fff" font-size="7" font-weight="bold">S</text>
      <text x="40" y="20" fill="#fff" font-size="7" font-weight="bold">N</text>
    </svg>`,
  },
  {
    id: 'prism-optics',
    name: 'Optics Light Prism',
    category: 'physics',
    tags: ['prism', 'optics', 'light', 'spectrum', 'refraction', 'rainbow', 'wavelength', 'physics'],
    defaultColor: '#06b6d4',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,14 14,48 50,48" stroke="#06b6d4" stroke-width="2.5" fill="rgba(6,182,212,0.15)"/>
      <line x1="8" y1="36" x2="23" y2="33" stroke="#f8fafc" stroke-width="2"/>
      <line x1="38" y1="33" x2="56" y2="28" stroke="#ef4444" stroke-width="1.5"/>
      <line x1="38" y1="35" x2="56" y2="34" stroke="#facc15" stroke-width="1.5"/>
      <line x1="38" y1="37" x2="56" y2="40" stroke="#3b82f6" stroke-width="1.5"/>
    </svg>`,
  },
  {
    id: 'lightning-bolt',
    name: 'Electric Energy Bolt',
    category: 'physics',
    tags: ['lightning', 'electricity', 'energy', 'voltage', 'current', 'power', 'charge'],
    defaultColor: '#facc15',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="36,8 18,34 32,34 26,56 46,28 32,28" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'solar-system',
    name: 'Planetary Orbit',
    category: 'physics',
    tags: ['solar', 'planet', 'orbit', 'astronomy', 'gravity', 'sun', 'space'],
    defaultColor: '#f59e0b',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="10" fill="#f59e0b"/>
      <ellipse cx="32" cy="32" rx="22" ry="12" stroke="#64748b" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>
      <circle cx="50" cy="36" r="3.5" fill="#38bdf8"/>
    </svg>`,
  },
  {
    id: 'telescope',
    name: 'Astronomy Telescope',
    category: 'physics',
    tags: ['telescope', 'stars', 'astronomy', 'space', 'cosmos', 'observation'],
    defaultColor: '#6366f1',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 36l26-16 4 7-26 16z" fill="#6366f1"/>
      <line x1="32" y1="32" x2="22" y2="52" stroke="#94a3b8" stroke-width="3"/>
      <line x1="32" y1="32" x2="42" y2="52" stroke="#94a3b8" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'satellite-orbit',
    name: 'Space Satellite',
    category: 'physics',
    tags: ['satellite', 'space', 'telecom', 'orbit', 'signal', 'aerospace'],
    defaultColor: '#0ea5e9',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="28" y="28" width="10" height="10" rx="2" fill="#0ea5e9"/>
      <rect x="12" y="30" width="14" height="6" fill="#38bdf8"/>
      <rect x="40" y="30" width="14" height="6" fill="#38bdf8"/>
    </svg>`,
  },
  {
    id: 'thermometer-temp',
    name: 'Temperature Thermometer',
    category: 'physics',
    tags: ['thermometer', 'temperature', 'heat', 'thermal', 'celsius', 'kelvin', 'hot', 'cold'],
    defaultColor: '#ef4444',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="28" y="10" width="8" height="28" rx="4" fill="#e2e8f0"/>
      <circle cx="32" cy="44" r="10" fill="#ef4444"/>
      <rect x="30" y="20" width="4" height="18" fill="#ef4444"/>
    </svg>`,
  },
  {
    id: 'gauge-pressure',
    name: 'Pressure Gauge',
    category: 'physics',
    tags: ['gauge', 'pressure', 'meter', 'barometer', 'physics', 'psi', 'pascal'],
    defaultColor: '#10b981',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" stroke="#10b981" stroke-width="3" fill="none"/>
      <line x1="32" y1="32" x2="44" y2="24" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="3" fill="#10b981"/>
    </svg>`,
  },
  {
    id: 'pendulum-oscillation',
    name: 'Physics Pendulum',
    category: 'physics',
    tags: ['pendulum', 'oscillation', 'harmonic', 'motion', 'gravity', 'mechanics', 'period'],
    defaultColor: '#a855f7',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="32" y1="10" x2="44" y2="40" stroke="#a855f7" stroke-width="3"/>
      <circle cx="44" cy="40" r="7" fill="#a855f7"/>
      <circle cx="32" cy="10" r="3" fill="#64748b"/>
    </svg>`,
  },
  {
    id: 'wave-frequency',
    name: 'Sine Wave Frequency',
    category: 'physics',
    tags: ['wave', 'sine', 'frequency', 'sound', 'acoustic', 'amplitude', 'wavelength'],
    defaultColor: '#06b6d4',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 32c6-16 12-16 18 0s12 16 18 0 6-16 8-16" stroke="#06b6d4" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'radioactive-symbol',
    name: 'Nuclear Radiation',
    category: 'physics',
    tags: ['nuclear', 'radioactive', 'decay', 'alpha', 'beta', 'gamma', 'radiation', 'hazard'],
    defaultColor: '#facc15',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="#0f172a" stroke="#facc15" stroke-width="2"/>
      <circle cx="32" cy="32" r="5" fill="#facc15"/>
      <path d="M32 24l-6-10h12zM24 36l-10 6 6-10zM40 36l10 6-6-10z" fill="#facc15"/>
    </svg>`,
  },

  // ─── 6. CHEMISTRY & BIOLOGY (12 Icons) ────────────────────────────────────
  {
    id: 'beaker-potion',
    name: 'Chemistry Beaker',
    category: 'chemistry-biology',
    tags: ['chemistry', 'chemical', 'reaction', 'beaker', 'experiment', 'lab', 'solution', 'science', 'mixture'],
    defaultColor: '#10b981',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 14h24v8l-2 2v22a4 4 0 01-4 4H26a4 4 0 01-4-4V24l-2-2v-8z" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="3"/>
      <path d="M22 36h20v10a4 4 0 01-4 4H26a4 4 0 01-4-4V36z" fill="#10b981"/>
      <circle cx="28" cy="42" r="2" fill="#ffffff"/>
      <circle cx="36" cy="39" r="1.5" fill="#ffffff"/>
    </svg>`,
  },
  {
    id: 'flask-erlenmeyer',
    name: 'Erlenmeyer Flask',
    category: 'chemistry-biology',
    tags: ['flask', 'erlenmeyer', 'chemistry', 'titration', 'acid', 'base', 'lab', 'bubbles'],
    defaultColor: '#8b5cf6',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 12h8v12l14 22a4 4 0 01-3 6H17a4 4 0 01-3-6l14-22V12z" stroke="#8b5cf6" stroke-width="3" fill="rgba(139, 92, 246, 0.2)"/>
      <path d="M20 42l4-8h16l4 8H20z" fill="#8b5cf6"/>
    </svg>`,
  },
  {
    id: 'dna-double-helix',
    name: 'DNA Genetic Helix',
    category: 'chemistry-biology',
    tags: ['dna', 'biology', 'genetics', 'gene', 'chromosome', 'heredity', 'cell', 'evolution'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 12c14 10 14 30 28 40" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <path d="M46 12C32 22 32 42 18 52" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
      <line x1="22" y1="20" x2="42" y2="20" stroke="#facc15" stroke-width="2"/>
      <line x1="26" y1="32" x2="38" y2="32" stroke="#10b981" stroke-width="2"/>
      <line x1="22" y1="44" x2="42" y2="44" stroke="#a855f7" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'microscope-lab',
    name: 'Biology Microscope',
    category: 'chemistry-biology',
    tags: ['microscope', 'cells', 'biology', 'microbiology', 'laboratory', 'magnify', 'specimen'],
    defaultColor: '#0ea5e9',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 14l12 12-4 4-12-12z" fill="#0ea5e9"/>
      <circle cx="36" cy="36" r="10" stroke="#64748b" stroke-width="3" fill="none"/>
      <rect x="18" y="50" width="28" height="6" rx="2" fill="#334155"/>
      <line x1="32" y1="46" x2="32" y2="50" stroke="#334155" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'leaf-botany',
    name: 'Plant Leaf & Photosynthesis',
    category: 'chemistry-biology',
    tags: ['leaf', 'plant', 'photosynthesis', 'botany', 'nature', 'chlorophyll', 'biology', 'ecology'],
    defaultColor: '#22c55e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 50C14 26 38 14 50 14c0 12-12 36-36 36z" fill="#22c55e"/>
      <path d="M14 50c12-12 24-24 36-36" stroke="#ffffff" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'cell-nucleus',
    name: 'Biological Cell',
    category: 'chemistry-biology',
    tags: ['cell', 'nucleus', 'mitosis', 'membrane', 'cytoplasm', 'organelle', 'biology'],
    defaultColor: '#ec4899',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="rgba(236, 72, 153, 0.2)" stroke="#ec4899" stroke-width="3"/>
      <circle cx="32" cy="32" r="8" fill="#ec4899"/>
      <circle cx="24" cy="22" r="2" fill="#38bdf8"/>
      <circle cx="40" cy="38" r="2.5" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'heart-cardio',
    name: 'Human Heart Cardio',
    category: 'chemistry-biology',
    tags: ['heart', 'cardiology', 'anatomy', 'organ', 'health', 'pulse', 'circulation'],
    defaultColor: '#ef4444',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 52L14 34c-6-6-6-16 0-22s16-6 18 2c2-8 12-8 18-2s6 16 0 22L32 52z" fill="#ef4444"/>
    </svg>`,
  },
  {
    id: 'sprout-growth',
    name: 'Seedling Sprout',
    category: 'chemistry-biology',
    tags: ['sprout', 'seedling', 'grow', 'germination', 'biology', 'agriculture', 'young'],
    defaultColor: '#4ade80',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 52V30c0-8 6-14 14-14 0 8-6 14-14 14" stroke="#4ade80" stroke-width="3" stroke-linecap="round"/>
      <path d="M32 38c-6-6-14-6-14 0 6 6 14 0 14 0" fill="#22c55e"/>
    </svg>`,
  },
  {
    id: 'test-tubes',
    name: 'Test Tube Rack',
    category: 'chemistry-biology',
    tags: ['tubes', 'testtube', 'chemistry', 'samples', 'lab', 'liquids', 'assay'],
    defaultColor: '#06b6d4',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="14" width="8" height="34" rx="4" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
      <rect x="38" y="14" width="8" height="34" rx="4" fill="#f43f5e" stroke="#be123c" stroke-width="2"/>
      <rect x="10" y="48" width="44" height="6" rx="2" fill="#64748b"/>
    </svg>`,
  },
  {
    id: 'tree-ecology',
    name: 'Ecology Tree',
    category: 'chemistry-biology',
    tags: ['tree', 'ecology', 'forest', 'environment', 'oxygen', 'carbon', 'nature'],
    defaultColor: '#15803d',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="24" r="16" fill="#15803d"/>
      <rect x="29" y="38" width="6" height="18" fill="#78350f"/>
    </svg>`,
  },
  {
    id: 'eye-vision',
    name: 'Human Eye Vision',
    category: 'chemistry-biology',
    tags: ['eye', 'vision', 'optical', 'anatomy', 'sight', 'sensory', 'retina'],
    defaultColor: '#0284c7',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 32c8-14 36-14 44 0-8 14-36 14-44 0z" stroke="#0284c7" stroke-width="3" fill="none"/>
      <circle cx="32" cy="32" r="8" fill="#38bdf8"/>
      <circle cx="32" cy="32" r="3.5" fill="#0f172a"/>
    </svg>`,
  },
  {
    id: 'petri-dish',
    name: 'Culture Petri Dish',
    category: 'chemistry-biology',
    tags: ['petri', 'bacteria', 'culture', 'biology', 'agar', 'microorganism'],
    defaultColor: '#eab308',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" stroke="#64748b" stroke-width="3" fill="none"/>
      <circle cx="26" cy="26" r="3" fill="#eab308"/>
      <circle cx="38" cy="30" r="4" fill="#ef4444"/>
      <circle cx="30" cy="40" r="2.5" fill="#10b981"/>
    </svg>`,
  },

  // ─── 7. TECH & COMPUTER SCIENCE (12 Icons) ────────────────────────────────
  {
    id: 'laptop-code',
    name: 'Coding Laptop',
    category: 'tech-cs',
    tags: ['laptop', 'code', 'programming', 'developer', 'python', 'javascript', 'html', 'software'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="16" width="36" height="24" rx="2" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
      <path d="M22 28l-3-3 3-3m12 0l3 3-3 3" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <rect x="8" y="42" width="48" height="6" rx="2" fill="#475569"/>
    </svg>`,
  },
  {
    id: 'code-brackets',
    name: 'Code Brackets',
    category: 'tech-cs',
    tags: ['brackets', 'code', 'syntax', 'programming', 'script', 'development', 'tag'],
    defaultColor: '#10b981',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 18l-10 14 10 14m20-28l10 14-10 14" stroke="#10b981" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="35" y1="16" x2="29" y2="48" stroke="#facc15" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'database-sql',
    name: 'SQL Database Server',
    category: 'tech-cs',
    tags: ['database', 'sql', 'storage', 'data', 'tables', 'backend', 'server', 'record'],
    defaultColor: '#f59e0b',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="18" rx="18" ry="6" fill="#f59e0b"/>
      <path d="M14 18v12c0 3.3 8 6 18 6s18-2.7 18-6V18" stroke="#f59e0b" stroke-width="3" fill="none"/>
      <path d="M14 30v12c0 3.3 8 6 18 6s18-2.7 18-6V30" stroke="#f59e0b" stroke-width="3" fill="none"/>
    </svg>`,
  },
  {
    id: 'server-rack',
    name: 'Server Infrastructure',
    category: 'tech-cs',
    tags: ['server', 'cloud', 'rack', 'datacenter', 'host', 'network', 'computing'],
    defaultColor: '#6366f1',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="12" width="36" height="12" rx="2" fill="#1e293b" stroke="#6366f1" stroke-width="2"/>
      <rect x="14" y="26" width="36" height="12" rx="2" fill="#1e293b" stroke="#6366f1" stroke-width="2"/>
      <rect x="14" y="40" width="36" height="12" rx="2" fill="#1e293b" stroke="#6366f1" stroke-width="2"/>
      <circle cx="20" cy="18" r="1.5" fill="#10b981"/>
      <circle cx="20" cy="32" r="1.5" fill="#10b981"/>
      <circle cx="20" cy="46" r="1.5" fill="#10b981"/>
    </svg>`,
  },
  {
    id: 'cpu-microchip',
    name: 'CPU Microchip',
    category: 'tech-cs',
    tags: ['cpu', 'chip', 'processor', 'hardware', 'core', 'semiconductor', 'silicon'],
    defaultColor: '#06b6d4',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="18" width="28" height="28" rx="3" fill="#0f172a" stroke="#06b6d4" stroke-width="3"/>
      <rect x="25" y="25" width="14" height="14" fill="#06b6d4"/>
      <line x1="24" y1="12" x2="24" y2="18" stroke="#06b6d4" stroke-width="2"/>
      <line x1="32" y1="12" x2="32" y2="18" stroke="#06b6d4" stroke-width="2"/>
      <line x1="40" y1="12" x2="40" y2="18" stroke="#06b6d4" stroke-width="2"/>
      <line x1="24" y1="46" x2="24" y2="52" stroke="#06b6d4" stroke-width="2"/>
      <line x1="32" y1="46" x2="32" y2="52" stroke="#06b6d4" stroke-width="2"/>
      <line x1="40" y1="46" x2="40" y2="52" stroke="#06b6d4" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'network-nodes',
    name: 'Network Graph Nodes',
    category: 'tech-cs',
    tags: ['network', 'nodes', 'graph', 'tree', 'distributed', 'connections', 'topology'],
    defaultColor: '#a855f7',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="16" r="6" fill="#a855f7"/>
      <circle cx="16" cy="46" r="6" fill="#38bdf8"/>
      <circle cx="48" cy="46" r="6" fill="#10b981"/>
      <line x1="32" y1="16" x2="16" y2="46" stroke="#94a3b8" stroke-width="2.5"/>
      <line x1="32" y1="16" x2="48" y2="46" stroke="#94a3b8" stroke-width="2.5"/>
      <line x1="16" y1="46" x2="48" y2="46" stroke="#94a3b8" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'binary-code',
    name: 'Binary Bits 01',
    category: 'tech-cs',
    tags: ['binary', 'bits', 'bytes', 'digital', 'zero', 'one', 'logic', 'machine'],
    defaultColor: '#22c55e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="14" y="30" fill="#22c55e" font-family="monospace" font-size="20" font-weight="bold">01</text>
      <text x="24" y="50" fill="#22c55e" font-family="monospace" font-size="20" font-weight="bold">10</text>
    </svg>`,
  },
  {
    id: 'robot-ai',
    name: 'Artificial Intelligence Robot',
    category: 'tech-cs',
    tags: ['robot', 'ai', 'artificial', 'intelligence', 'automation', 'agent', 'bot', 'smart'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="20" width="28" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="26" cy="30" r="3" fill="#38bdf8"/>
      <circle cx="38" cy="30" r="3" fill="#38bdf8"/>
      <line x1="26" y1="38" x2="38" y2="38" stroke="#38bdf8" stroke-width="2"/>
      <line x1="32" y1="20" x2="32" y2="12" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="32" cy="10" r="2.5" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'cyber-padlock',
    name: 'Cyber Security Padlock',
    category: 'tech-cs',
    tags: ['lock', 'security', 'cyber', 'encryption', 'privacy', 'password', 'safe'],
    defaultColor: '#eab308',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="28" width="28" height="22" rx="4" fill="#eab308"/>
      <path d="M24 28V20a8 8 0 0116 0v8" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="39" r="3" fill="#713f12"/>
    </svg>`,
  },
  {
    id: 'terminal-cli',
    name: 'Command Terminal CLI',
    category: 'tech-cs',
    tags: ['terminal', 'cli', 'console', 'bash', 'powershell', 'command', 'prompt'],
    defaultColor: '#34d399',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="44" height="34" rx="4" fill="#0f172a" stroke="#34d399" stroke-width="2.5"/>
      <path d="M18 26l6 5-6 5" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="28" y1="36" x2="38" y2="36" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'wifi-signal',
    name: 'Wireless Wi-Fi Network',
    category: 'tech-cs',
    tags: ['wifi', 'wireless', 'internet', 'connection', 'radio', 'signal', 'online'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="46" r="3.5" fill="#38bdf8"/>
      <path d="M22 38a14 14 0 0120 0" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <path d="M15 30a24 24 0 0134 0" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'bug-debug',
    name: 'Bug Debugging',
    category: 'tech-cs',
    tags: ['bug', 'debug', 'fix', 'issue', 'troubleshoot', 'test', 'error'],
    defaultColor: '#ef4444',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="34" r="10" fill="#ef4444"/>
      <circle cx="32" cy="20" r="5" fill="#ef4444"/>
      <line x1="16" y1="28" x2="26" y2="32" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="48" y1="28" x2="38" y2="32" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="16" y1="40" x2="26" y2="36" stroke="#ef4444" stroke-width="2.5"/>
      <line x1="48" y1="40" x2="38" y2="36" stroke="#ef4444" stroke-width="2.5"/>
    </svg>`,
  },

  // ─── 8. HUMANITIES, HISTORY & GEOGRAPHY (12 Icons) ────────────────────────
  {
    id: 'globe-earth',
    name: 'Planet Earth Globe',
    category: 'humanities',
    tags: ['globe', 'earth', 'world', 'geography', 'planet', 'map', 'international', 'continents'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
      <path d="M22 24c4-2 10 2 12 6s6 6 8 4 6-8 6-8" stroke="#4ade80" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M16 38c6 2 12-4 18 2s8 8 12 6" stroke="#4ade80" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'map-folded',
    name: 'Folded Expedition Map',
    category: 'humanities',
    tags: ['map', 'geography', 'expedition', 'location', 'travel', 'border', 'region'],
    defaultColor: '#facc15',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,18 24,14 38,18 52,14 52,46 38,50 24,46 12,50" fill="#fef08a" stroke="#ca8a04" stroke-width="2.5"/>
      <line x1="24" y1="14" x2="24" y2="46" stroke="#ca8a04" stroke-width="2"/>
      <line x1="38" y1="18" x2="38" y2="50" stroke="#ca8a04" stroke-width="2"/>
      <circle cx="30" cy="30" r="3" fill="#ef4444"/>
    </svg>`,
  },
  {
    id: 'pyramid-ancient',
    name: 'Ancient Historical Pyramid',
    category: 'humanities',
    tags: ['pyramid', 'ancient', 'history', 'egypt', 'monument', 'civilization', 'archaeology'],
    defaultColor: '#d97706',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,14 10,48 40,50" fill="#f59e0b"/>
      <polygon points="32,14 40,50 54,46" fill="#b45309"/>
      <circle cx="48" cy="20" r="6" fill="#fef08a"/>
    </svg>`,
  },
  {
    id: 'scroll-parchment',
    name: 'Ancient Parchment Scroll',
    category: 'humanities',
    tags: ['scroll', 'parchment', 'history', 'charter', 'constitution', 'manuscript', 'treaty'],
    defaultColor: '#fde047',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="14" width="28" height="36" rx="2" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
      <path d="M14 14c4 0 4 6 0 6s-4-6 0-6zm36 28c4 0 4 6 0 6s-4-6 0-6z" fill="#ca8a04"/>
      <line x1="24" y1="24" x2="40" y2="24" stroke="#a16207" stroke-width="2"/>
      <line x1="24" y1="30" x2="40" y2="30" stroke="#a16207" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'hourglass-time',
    name: 'Historical Hourglass',
    category: 'humanities',
    tags: ['hourglass', 'time', 'chronology', 'era', 'period', 'century', 'history', 'timeline'],
    defaultColor: '#eab308',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 14h28l-14 18 14 18H18l14-18-14-18z" stroke="#a16207" stroke-width="3" fill="none"/>
      <polygon points="26,46 38,46 32,38" fill="#facc15"/>
    </svg>`,
  },
  {
    id: 'temple-pillars',
    name: 'Classical Greek Pillars',
    category: 'humanities',
    tags: ['temple', 'pillars', 'ancient', 'greece', 'rome', 'philosophy', 'architecture', 'democracy'],
    defaultColor: '#cbd5e1',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,12 10,24 54,24" fill="#cbd5e1"/>
      <rect x="16" y="24" width="6" height="24" fill="#94a3b8"/>
      <rect x="29" y="24" width="6" height="24" fill="#94a3b8"/>
      <rect x="42" y="24" width="6" height="24" fill="#94a3b8"/>
      <rect x="10" y="48" width="44" height="6" fill="#cbd5e1"/>
    </svg>`,
  },
  {
    id: 'quill-ink',
    name: 'Feather Quill & Ink',
    category: 'humanities',
    tags: ['quill', 'feather', 'write', 'author', 'poetry', 'literature', 'ink', 'document'],
    defaultColor: '#c084fc',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M48 10C36 14 26 26 22 42l-2 10 10-2c16-4 28-14 32-26-4 0-8 0-14-14z" fill="#c084fc"/>
    </svg>`,
  },
  {
    id: 'scales-justice',
    name: 'Scales of Justice & Law',
    category: 'humanities',
    tags: ['scales', 'justice', 'law', 'civics', 'rights', 'court', 'legal', 'fairness', 'ethics'],
    defaultColor: '#fbbf24',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="32" y1="12" x2="32" y2="52" stroke="#d97706" stroke-width="4"/>
      <line x1="14" y1="20" x2="50" y2="20" stroke="#d97706" stroke-width="3"/>
      <polygon points="14,20 8,34 20,34" stroke="#d97706" stroke-width="2" fill="none"/>
      <polygon points="50,20 44,34 56,34" stroke="#d97706" stroke-width="2" fill="none"/>
    </svg>`,
  },
  {
    id: 'stack-of-books',
    name: 'Stack of Books',
    category: 'humanities',
    tags: ['books', 'library', 'literature', 'reading', 'encyclopedia', 'knowledge', 'study'],
    defaultColor: '#3b82f6',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="42" width="36" height="8" rx="2" fill="#3b82f6"/>
      <rect x="18" y="32" width="32" height="8" rx="2" fill="#ef4444"/>
      <rect x="16" y="22" width="34" height="8" rx="2" fill="#10b981"/>
    </svg>`,
  },
  {
    id: 'open-book',
    name: 'Open Reading Book',
    category: 'humanities',
    tags: ['book', 'openbook', 'read', 'literature', 'chapter', 'novel', 'textbook'],
    defaultColor: '#60a5fa',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 24c6-4 14-4 20 0 6-4 14-4 20 0v24c-6-4-14-4-20 0-6-4-14-4-20 0V24z" fill="#f8fafc" stroke="#3b82f6" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'calendar-event',
    name: 'Historical Calendar Date',
    category: 'humanities',
    tags: ['calendar', 'date', 'timeline', 'year', 'century', 'schedule', 'anniversary'],
    defaultColor: '#f43f5e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="16" width="40" height="34" rx="4" fill="#ffffff" stroke="#f43f5e" stroke-width="3"/>
      <path d="M12 16h40v10H12z" fill="#f43f5e"/>
      <circle cx="22" cy="36" r="2.5" fill="#f43f5e"/>
    </svg>`,
  },
  {
    id: 'compass-rose',
    name: 'Compass Rose N-S-E-W',
    category: 'humanities',
    tags: ['compass', 'rose', 'north', 'south', 'east', 'west', 'geography', 'cardinal', 'bearing'],
    defaultColor: '#0ea5e9',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,10 36,28 32,24" fill="#ef4444"/>
      <polygon points="32,10 28,28 32,24" fill="#991b1b"/>
      <polygon points="32,54 36,36 32,40" fill="#38bdf8"/>
      <polygon points="32,54 28,36 32,40" fill="#0284c7"/>
      <polygon points="54,32 36,36 40,32" fill="#64748b"/>
      <polygon points="10,32 28,36 24,32" fill="#64748b"/>
    </svg>`,
  },

  // ─── 9. BUSINESS & ECONOMICS (10 Icons) ───────────────────────────────────
  {
    id: 'chart-bar-up',
    name: 'Ascending Bar Chart',
    category: 'business-charts',
    tags: ['chart', 'bar', 'statistics', 'graph', 'growth', 'data', 'metrics', 'economics'],
    defaultColor: '#10b981',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="50" x2="52" y2="50" stroke="#94a3b8" stroke-width="3"/>
      <rect x="16" y="34" width="6" height="16" fill="#38bdf8"/>
      <rect x="28" y="24" width="6" height="26" fill="#6366f1"/>
      <rect x="40" y="14" width="6" height="36" fill="#10b981"/>
    </svg>`,
  },
  {
    id: 'chart-pie-segments',
    name: 'Pie Chart Breakdown',
    category: 'business-charts',
    tags: ['pie', 'chart', 'percentage', 'share', 'distribution', 'statistics', 'budget'],
    defaultColor: '#f59e0b',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" fill="#3b82f6"/>
      <path d="M32 32L32 12A20 20 0 0152 32H32z" fill="#f59e0b"/>
      <path d="M32 32L52 32A20 20 0 0142 48L32 32z" fill="#10b981"/>
    </svg>`,
  },
  {
    id: 'chart-line-growth',
    name: 'Line Trend Growth',
    category: 'business-charts',
    tags: ['trend', 'line', 'graph', 'growth', 'increase', 'market', 'forecast'],
    defaultColor: '#22c55e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 44l12-16 12 8 16-22" stroke="#22c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="42,14 52,14 52,24" stroke="#22c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'coins-currency',
    name: 'Coins & Finance',
    category: 'business-charts',
    tags: ['coins', 'money', 'finance', 'cost', 'price', 'economy', 'wealth', 'gold'],
    defaultColor: '#facc15',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="26" cy="36" rx="12" ry="6" fill="#eab308"/>
      <ellipse cx="26" cy="42" rx="12" ry="6" fill="#ca8a04"/>
      <ellipse cx="38" cy="24" rx="12" ry="6" fill="#facc15"/>
      <ellipse cx="38" cy="30" rx="12" ry="6" fill="#eab308"/>
    </svg>`,
  },
  {
    id: 'bank-finance',
    name: 'Financial Institution Bank',
    category: 'business-charts',
    tags: ['bank', 'finance', 'institution', 'economy', 'treasury', 'monetary'],
    defaultColor: '#0ea5e9',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32,12 12,24 52,24" fill="#0ea5e9"/>
      <line x1="18" y1="24" x2="18" y2="46" stroke="#0284c7" stroke-width="4"/>
      <line x1="28" y1="24" x2="28" y2="46" stroke="#0284c7" stroke-width="4"/>
      <line x1="38" y1="24" x2="38" y2="46" stroke="#0284c7" stroke-width="4"/>
      <line x1="48" y1="24" x2="48" y2="46" stroke="#0284c7" stroke-width="4"/>
      <rect x="10" y="46" width="44" height="6" rx="1" fill="#0ea5e9"/>
    </svg>`,
  },
  {
    id: 'briefcase-work',
    name: 'Business Briefcase',
    category: 'business-charts',
    tags: ['briefcase', 'work', 'job', 'business', 'career', 'corporate', 'management'],
    defaultColor: '#854d0e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="22" width="40" height="26" rx="4" fill="#a16207"/>
      <path d="M24 22V16a4 4 0 014-4h8a4 4 0 014 4v6" stroke="#ca8a04" stroke-width="3"/>
      <circle cx="32" cy="35" r="3" fill="#fef08a"/>
    </svg>`,
  },
  {
    id: 'presentation-screen',
    name: 'Projector Presentation Screen',
    category: 'business-charts',
    tags: ['presentation', 'screen', 'projector', 'meeting', 'seminar', 'slides'],
    defaultColor: '#6366f1',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="44" height="28" rx="2" fill="#ffffff" stroke="#6366f1" stroke-width="3"/>
      <polyline points="18,32 26,24 34,28 44,18" stroke="#3b82f6" stroke-width="2.5" fill="none"/>
      <line x1="32" y1="42" x2="32" y2="52" stroke="#64748b" stroke-width="3"/>
      <line x1="22" y1="52" x2="42" y2="52" stroke="#64748b" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'handshake-deal',
    name: 'Partnership Handshake',
    category: 'business-charts',
    tags: ['handshake', 'deal', 'agreement', 'cooperation', 'partnership', 'trust'],
    defaultColor: '#38bdf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 28l10 8 8-4-6-6-12 2zm36 0l-10 8-8-4 6-6 12 2z" fill="#0284c7"/>
      <path d="M24 36l8 6 8-6-8-4-8 4z" fill="#38bdf8"/>
    </svg>`,
  },
  {
    id: 'speech-bubbles',
    name: 'Discussion Speech Bubbles',
    category: 'business-charts',
    tags: ['speech', 'dialogue', 'chat', 'discussion', 'communication', 'question', 'talk', 'debate'],
    defaultColor: '#818cf8',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 18h24a4 4 0 014 4v12a4 4 0 01-4 4H22l-6 6v-6h-4a4 4 0 01-4-4V22a4 4 0 014-4z" fill="#818cf8"/>
      <path d="M48 26h4a4 4 0 014 4v12a4 4 0 01-4 4h-4v4l-4-4h-8v-4h12V26z" fill="#a78bfa"/>
    </svg>`,
  },
  {
    id: 'megaphone-announce',
    name: 'Loudspeaker Announcement',
    category: 'business-charts',
    tags: ['megaphone', 'announcement', 'broadcast', 'loudspeaker', 'marketing', 'alert'],
    defaultColor: '#f43f5e',
    svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 26h8l16-10v32L24 38h-8a4 4 0 01-4-4v-4a4 4 0 014-4z" fill="#f43f5e"/>
      <path d="M22 38l2 12h-6l-2-12" fill="#be123c"/>
      <path d="M46 24a8 8 0 010 16" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were',
  'have', 'has', 'had', 'you', 'your', 'about', 'some', 'all', 'any', 'our'
]);

/**
 * Normalizes query string for fuzzy semantic matching
 */
function normalizeQuery(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Searches the icon library using semantic tags and keywords.
 * Returns best matches sorted by relevance score.
 */
export function searchVectorIcons(query: string, maxResults: number = 12): VectorIconItem[] {
  const words = normalizeQuery(query);
  if (words.length === 0) return VECTOR_ICONS_LIBRARY.slice(0, maxResults);

  const scored = VECTOR_ICONS_LIBRARY.map((icon) => {
    let score = 0;
    const nameLower = icon.name.toLowerCase();
    const idLower = icon.id.toLowerCase();

    for (const w of words) {
      if (idLower === w || nameLower === w) score += 30;
      else if (nameLower.includes(w)) score += 12;
      else if (idLower.includes(w)) score += 10;

      for (const t of icon.tags) {
        if (t === w) score += 25;
        else if (t.startsWith(w) || w.startsWith(t)) score += 10;
        else if (t.includes(w)) score += 5;
      }
    }
    return { icon, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.icon);
}

/**
 * Finds the single best matching vector icon for an educational text snippet or concept.
 * E.g. "Newton's Second Law" -> atom or magnet icon.
 * "Proof of Quadratic Formula" -> math-pi or math-sqrt icon.
 * "Important Examination Note" -> warning-triangle or alert icon.
 */
export function findBestMatchingIcon(text: string): VectorIconItem | null {
  const matches = searchVectorIcons(text, 1);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Retrieves icon SVG by ID with optional custom color override
 */
export function getVectorIconSvg(iconId: string, customColor?: string): string {
  const icon = VECTOR_ICONS_LIBRARY.find((i) => i.id === iconId);
  if (!icon) return '';
  if (!customColor) return icon.svg;

  // Replace default stroke or fill with custom theme color
  return icon.svg
    .replace(/stroke="#[0-9a-fA-F]{6}"/g, `stroke="${customColor}"`)
    .replace(/fill="#[0-9a-fA-F]{6}"/g, `fill="${customColor}"`);
}

/**
 * Converts raw SVG code into an encoded data URL for Canvas ImageObject
 */
export function vectorIconToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
