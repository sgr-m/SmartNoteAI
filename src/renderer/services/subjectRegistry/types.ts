/**
 * Subject Tool Registry Types
 * Shared registry interfaces for independent subject modules
 */

import { CanvasObject } from '../../../shared/types';
import { CommandSystem } from '../../engine/CommandSystem';

export type SubjectId =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'computerScience'
  | 'digitalLogic'
  | 'flowcharts'
  | 'generalTeaching';

export interface ToolExecutionContext {
  pageIndex: number;
  dispatch: (action: any) => void;
  commandSystem: CommandSystem;
  viewportCenter?: { x: number; y: number };
}

export interface SubjectTool {
  id: string;
  subjectId: SubjectId;
  name: string;
  category: string;
  icon: string;
  description: string;
  badge?: string;
  tags?: string[];
  execute: (context: ToolExecutionContext, options?: any) => void;
  interactiveModal?: string;
}

export interface SubjectTemplate {
  id: string;
  subjectId: SubjectId;
  name: string;
  category: string;
  icon: string;
  description: string;
  createObjects: (origin: { x: number; y: number }) => CanvasObject[];
}

export interface SubjectModule {
  id: SubjectId;
  name: string;
  icon: string;
  description: string;
  tools: SubjectTool[];
  templates: SubjectTemplate[];
}
