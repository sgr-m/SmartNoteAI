import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, PageBackground, CanvasObject, ShapeObject, TextObject } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import './PageTemplatesModal.css';

interface PageTemplatesModalProps {
  onClose: () => void;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'General' | 'Writing & Math' | 'Structured Notes' | 'Science & Diagramming';
  description: string;
  icon: string;
  background: PageBackground;
  createObjects: (width: number, height: number) => CanvasObject[];
}

export const PAGE_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    category: 'General',
    description: 'Clean dark chalkboard canvas without lines or guides.',
    icon: '⬛',
    background: { type: 'blank', color: '#1a1a2e' },
    createObjects: () => [],
  },
  {
    id: 'ruled',
    name: 'Ruled Notebook',
    category: 'Writing & Math',
    description: 'College-ruled lines with a classic red left margin for handwriting and cursive practice.',
    icon: '📝',
    background: {
      type: 'ruled',
      color: '#1a1a2e',
      gridSize: 36,
      lineColor: 'rgba(108, 99, 255, 0.18)',
    },
    createObjects: () => [],
  },
  {
    id: 'grid',
    name: 'Coordinate Grid Paper',
    category: 'Writing & Math',
    description: 'Math graph grid with subtle coordinate grid lines for geometry, plotting, and functions.',
    icon: '📐',
    background: {
      type: 'grid',
      color: '#0f172a',
      gridSize: 32,
      lineColor: 'rgba(56, 189, 248, 0.18)',
    },
    createObjects: (w, h) => {
      const midX = Math.round(w / 2);
      const midY = Math.round(h / 2);
      const xAxis: ShapeObject = {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'arrow',
        x: 80,
        y: midY,
        width: w - 160,
        height: 0,
        rotation: 0,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 0.6,
        strokeStyle: 'solid',
        fillColor: '#38bdf8',
        fillOpacity: 0.6,
        locked: true,
        layerId: 'objects',
      };
      const yAxis: ShapeObject = {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'arrow',
        x: midX,
        y: h - 80,
        width: 0,
        height: -(h - 160),
        rotation: 0,
        strokeColor: '#38bdf8',
        strokeWidth: 2,
        strokeOpacity: 0.6,
        strokeStyle: 'solid',
        fillColor: '#38bdf8',
        fillOpacity: 0.6,
        locked: true,
        layerId: 'objects',
      };
      return [xAxis, yAxis];
    },
  },
  {
    id: 'dotted',
    name: 'Dotted Paper',
    category: 'Writing & Math',
    description: 'Minimalist dot matrix for bullet journaling, freehand sketching, and diagrams.',
    icon: '⠇',
    background: {
      type: 'dotted',
      color: '#1a1a2e',
      gridSize: 30,
      lineColor: 'rgba(165, 180, 252, 0.3)',
    },
    createObjects: () => [],
  },
  {
    id: 'cornell',
    name: 'Cornell Notes',
    category: 'Structured Notes',
    description: 'Standard educational format with Cue Column, Main Notes area, and bottom Summary box.',
    icon: '📑',
    background: { type: 'blank', color: '#16192b' },
    createObjects: (w, h) => {
      const headerH = 100;
      const summaryH = 180;
      const cueW = Math.round(w * 0.28);

      const headerLine: ShapeObject = {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'line',
        x: 60,
        y: headerH,
        width: w - 120,
        height: 0,
        rotation: 0,
        strokeColor: '#6c63ff',
        strokeWidth: 2,
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
        fillColor: '#6c63ff',
        fillOpacity: 0.8,
        locked: true,
        layerId: 'objects',
      };

      const titleText: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: 70,
        y: 40,
        width: 600,
        height: 40,
        content: 'Topic / Lesson Title:',
        fontFamily: 'Inter, sans-serif',
        fontSize: 26,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#ffffff',
        textAlign: 'left',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'title',
        locked: true,
        layerId: 'objects',
      };

      const dividerLine: ShapeObject = {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'line',
        x: cueW,
        y: headerH,
        width: 0,
        height: h - headerH - summaryH - 40,
        rotation: 0,
        strokeColor: '#6c63ff',
        strokeWidth: 2,
        strokeOpacity: 0.5,
        strokeStyle: 'solid',
        fillColor: '#6c63ff',
        fillOpacity: 0.5,
        locked: true,
        layerId: 'objects',
      };

      const cueLabel: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: 70,
        y: headerH + 20,
        width: cueW - 100,
        height: 30,
        content: 'CUES & QUESTIONS',
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#a5b4fc',
        textAlign: 'left',
        backgroundColor: 'transparent',
        opacity: 0.8,
        rotation: 0,
        preset: 'heading',
        locked: true,
        layerId: 'objects',
      };

      const notesLabel: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: cueW + 30,
        y: headerH + 20,
        width: 300,
        height: 30,
        content: 'CLASS NOTES',
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#a5b4fc',
        textAlign: 'left',
        backgroundColor: 'transparent',
        opacity: 0.8,
        rotation: 0,
        preset: 'heading',
        locked: true,
        layerId: 'objects',
      };

      const summaryLine: ShapeObject = {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'line',
        x: 60,
        y: h - summaryH - 40,
        width: w - 120,
        height: 0,
        rotation: 0,
        strokeColor: '#6c63ff',
        strokeWidth: 2,
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
        fillColor: '#6c63ff',
        fillOpacity: 0.8,
        locked: true,
        layerId: 'objects',
      };

      const summaryLabel: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: 70,
        y: h - summaryH - 20,
        width: 200,
        height: 30,
        content: 'SUMMARY:',
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#a5b4fc',
        textAlign: 'left',
        backgroundColor: 'transparent',
        opacity: 0.8,
        rotation: 0,
        preset: 'heading',
        locked: true,
        layerId: 'objects',
      };

      return [headerLine, titleText, dividerLine, cueLabel, notesLabel, summaryLine, summaryLabel];
    },
  },
  {
    id: 'two-column',
    name: 'Two-Column Comparison',
    category: 'Structured Notes',
    description: 'Side-by-side comparison workspace with headers for Comparing Concepts, Pros & Cons, or Before & After.',
    icon: '⚖️',
    background: { type: 'blank', color: '#16192b' },
    createObjects: (w, h) => {
      const midX = Math.round(w / 2);
      const splitLine: ShapeObject = {
        id: uuidv4(),
        type: 'shape',
        shapeType: 'line',
        x: midX,
        y: 80,
        width: 0,
        height: h - 160,
        rotation: 0,
        strokeColor: '#6c63ff',
        strokeWidth: 2,
        strokeOpacity: 0.6,
        strokeStyle: 'dashed',
        fillColor: '#6c63ff',
        fillOpacity: 0.6,
        locked: true,
        layerId: 'objects',
      };

      const leftHeading: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: 100,
        y: 60,
        width: 400,
        height: 40,
        content: 'Concept A / Pros',
        fontFamily: 'Inter, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#22c55e',
        textAlign: 'left',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'heading',
        locked: true,
        layerId: 'objects',
      };

      const rightHeading: TextObject = {
        id: uuidv4(),
        type: 'text',
        x: midX + 50,
        y: 60,
        width: 400,
        height: 40,
        content: 'Concept B / Cons',
        fontFamily: 'Inter, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#f43f5e',
        textAlign: 'left',
        backgroundColor: 'transparent',
        opacity: 1,
        rotation: 0,
        preset: 'heading',
        locked: true,
        layerId: 'objects',
      };

      return [splitLine, leftHeading, rightHeading];
    },
  },
  {
    id: 'science-lab',
    name: 'Science Lab Experiment',
    category: 'Science & Diagramming',
    description: 'Structured scientific method boxes for Aim, Hypothesis, Diagram, Observations, and Conclusion.',
    icon: '🔬',
    background: { type: 'blank', color: '#141e2e' },
    createObjects: (w, h) => {
      const cardWidth = Math.round((w - 180) / 2);
      const cardHeight = Math.round((h - 220) / 2);

      const makeBox = (x: number, y: number, title: string, color: string): CanvasObject[] => {
        const box: ShapeObject = {
          id: uuidv4(),
          type: 'shape',
          shapeType: 'roundedRect',
          x,
          y,
          width: cardWidth,
          height: cardHeight,
          rotation: 0,
          strokeColor: color,
          strokeWidth: 1.5,
          strokeOpacity: 0.4,
          strokeStyle: 'solid',
          fillColor: color,
          fillOpacity: 0.05,
          locked: true,
          layerId: 'objects',
        };
        const text: TextObject = {
          id: uuidv4(),
          type: 'text',
          x: x + 16,
          y: y + 16,
          width: 300,
          height: 30,
          content: title,
          fontFamily: 'Inter, sans-serif',
          fontSize: 18,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: color,
          textAlign: 'left',
          backgroundColor: 'transparent',
          opacity: 0.9,
          rotation: 0,
          preset: 'heading',
          locked: true,
          layerId: 'objects',
        };
        return [box, text];
      };

      return [
        ...makeBox(60, 60, '1. Aim & Hypothesis', '#38bdf8'),
        ...makeBox(80 + cardWidth, 60, '2. Apparatus & Diagram', '#a855f7'),
        ...makeBox(60, 100 + cardHeight, '3. Observations & Data', '#10b981'),
        ...makeBox(80 + cardWidth, 100 + cardHeight, '4. Analysis & Conclusion', '#f59e0b'),
      ];
    },
  },
  {
    id: 'storyboard',
    name: '4-Panel Storyboard',
    category: 'Science & Diagramming',
    description: '4 sequential visual panels for story arcs, step-by-step algorithms, or chronological history.',
    icon: '🎬',
    background: { type: 'blank', color: '#181b2a' },
    createObjects: (w, h) => {
      const boxW = Math.round((w - 180) / 2);
      const boxH = Math.round((h - 200) / 2);
      const objects: CanvasObject[] = [];

      const panels = [
        { x: 60, y: 70, num: 'Step 1' },
        { x: 80 + boxW, y: 70, num: 'Step 2' },
        { x: 60, y: 100 + boxH, num: 'Step 3' },
        { x: 80 + boxW, y: 100 + boxH, num: 'Step 4' },
      ];

      for (const p of panels) {
        const frame: ShapeObject = {
          id: uuidv4(),
          type: 'shape',
          shapeType: 'roundedRect',
          x: p.x,
          y: p.y,
          width: boxW,
          height: boxH,
          rotation: 0,
          strokeColor: '#6c63ff',
          strokeWidth: 2,
          strokeOpacity: 0.5,
          strokeStyle: 'solid',
          fillColor: '#6c63ff',
          fillOpacity: 0.04,
          locked: true,
          layerId: 'objects',
        };
        const title: TextObject = {
          id: uuidv4(),
          type: 'text',
          x: p.x + 14,
          y: p.y + 14,
          width: 200,
          height: 24,
          content: p.num,
          fontFamily: 'Inter, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#c7d2fe',
          textAlign: 'left',
          backgroundColor: 'transparent',
          opacity: 0.85,
          rotation: 0,
          preset: 'heading',
          locked: true,
          layerId: 'objects',
        };
        objects.push(frame, title);
      }
      return objects;
    },
  },
];

export function PageTemplatesModal({ onClose }: PageTemplatesModalProps): React.ReactElement {
  const { docState, docDispatch, setToastMessage } = useAppContext();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const categories = ['All', 'Writing & Math', 'Structured Notes', 'Science & Diagramming', 'General'];

  const filteredTemplates = selectedCategory === 'All'
    ? PAGE_TEMPLATES
    : PAGE_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleApplyTemplate = (template: TemplateDefinition) => {
    const curIdx = docState.currentPageIndex;
    const curPage = docState.lesson.pages[curIdx];
    const width = curPage?.width || 1920;
    const height = curPage?.height || 1080;

    const newPage: Page = {
      id: uuidv4(),
      title: `${template.name} (P${docState.lesson.pages.length + 1})`,
      width,
      height,
      background: { ...template.background },
      layers: curPage?.layers ? JSON.parse(JSON.stringify(curPage.layers)) : [],
      objects: template.createObjects(width, height),
    };

    docDispatch({
      type: 'ADD_PAGE',
      after: curIdx,
    });

    // Replace the default created page with the template initialized page
    setTimeout(() => {
      docDispatch({
        type: 'SET_PAGE_BACKGROUND',
        pageIndex: curIdx + 1,
        background: newPage.background,
      });
      if (newPage.objects.length > 0) {
        docDispatch({
          type: 'ADD_OBJECTS',
          pageIndex: curIdx + 1,
          objects: newPage.objects,
        });
      }
      docDispatch({
        type: 'RENAME_PAGE',
        pageIndex: curIdx + 1,
        title: newPage.title,
      });
      setToastMessage?.(`Added "${template.name}" slide`);
    }, 20);

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="templates-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Page Templates">
        <div className="templates-modal-header">
          <div className="templates-title-group">
            <span className="templates-title-icon">📚</span>
            <h3>Insert Page from Template</h3>
          </div>
          <button className="templates-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="templates-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`templates-category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="templates-grid">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleApplyTemplate(template)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleApplyTemplate(template);
              }}
            >
              <div className="template-preview-box" style={{ background: template.background.color || '#1a1a2e' }}>
                <span className="template-icon-large">{template.icon}</span>
                <span className="template-category-tag">{template.category}</span>
              </div>
              <div className="template-details">
                <span className="template-name">{template.name}</span>
                <span className="template-desc">{template.description}</span>
              </div>
              <button className="template-select-btn">Use Template</button>
            </div>
          ))}
        </div>

        <div className="templates-modal-footer">
          <button className="templates-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
