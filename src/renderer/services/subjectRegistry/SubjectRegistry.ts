/**
 * SubjectRegistry — Central tool and template registry for subject-specific teaching modules
 */

import { SubjectId, SubjectModule, SubjectTool, SubjectTemplate } from './types';

export class SubjectRegistryService {
  private modules = new Map<SubjectId, SubjectModule>();
  private tools = new Map<string, SubjectTool>();
  private templates = new Map<string, SubjectTemplate>();

  /**
   * Register a complete subject module
   */
  public registerModule(module: SubjectModule): void {
    this.modules.set(module.id, module);
    for (const tool of module.tools) {
      this.registerTool(tool);
    }
    for (const tmpl of module.templates) {
      this.registerTemplate(tmpl);
    }
  }

  /**
   * Register an individual tool
   */
  public registerTool(tool: SubjectTool): void {
    this.tools.set(tool.id, tool);
  }

  /**
   * Register an individual template
   */
  public registerTemplate(template: SubjectTemplate): void {
    this.templates.set(template.id, template);
  }

  public getModule(id: SubjectId): SubjectModule | undefined {
    return this.modules.get(id);
  }

  public getAllModules(): SubjectModule[] {
    return Array.from(this.modules.values());
  }

  public getAllTools(): SubjectTool[] {
    return Array.from(this.tools.values());
  }

  public getToolsBySubject(subjectId: SubjectId): SubjectTool[] {
    return Array.from(this.tools.values()).filter((t) => t.subjectId === subjectId);
  }

  public getTool(id: string): SubjectTool | undefined {
    return this.tools.get(id);
  }

  public getAllTemplates(): SubjectTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplatesBySubject(subjectId: SubjectId): SubjectTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.subjectId === subjectId);
  }

  public getTemplate(id: string): SubjectTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Search across all registered tools by query string
   */
  public searchTools(query: string): SubjectTool[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAllTools();

    return this.getAllTools().filter((tool) => {
      if (tool.name.toLowerCase().includes(q)) return true;
      if (tool.description.toLowerCase().includes(q)) return true;
      if (tool.category.toLowerCase().includes(q)) return true;
      if (tool.tags?.some((tag) => tag.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  /**
   * Reset registry (useful for testing)
   */
  public clear(): void {
    this.modules.clear();
    this.tools.clear();
    this.templates.clear();
  }
}

// Global singleton instance
export const SubjectRegistry = new SubjectRegistryService();
