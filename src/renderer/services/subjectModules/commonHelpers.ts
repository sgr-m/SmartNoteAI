/**
 * Common Helpers for Subject Modules
 * Standardized creation and insertion of canvas elements with undo/redo
 */

import { v4 as uuidv4 } from 'uuid';
import { ShapeObject, TextObject, GroupObject, CanvasObject, ShapeType } from '../../../shared/types';
import { ToolExecutionContext } from '../subjectRegistry/types';
import { measureLatexSize } from '../latexService';

export function executeAddObject(
  context: ToolExecutionContext,
  object: CanvasObject,
  description: string
): void {
  const { pageIndex, dispatch, commandSystem } = context;
  commandSystem.execute({
    id: uuidv4(),
    description,
    execute() {
      dispatch({ type: 'ADD_OBJECT', pageIndex, object });
    },
    undo() {
      dispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: object.id });
    },
  });
}

export function executeAddMultipleObjects(
  context: ToolExecutionContext,
  objects: CanvasObject[],
  description: string
): void {
  const { pageIndex, dispatch, commandSystem } = context;
  commandSystem.execute({
    id: uuidv4(),
    description,
    execute() {
      for (const obj of objects) {
        dispatch({ type: 'ADD_OBJECT', pageIndex, object: obj });
      }
    },
    undo() {
      for (const obj of objects) {
        dispatch({ type: 'REMOVE_OBJECT', pageIndex, objectId: obj.id });
      }
    },
  });
}

export function createShape(
  shapeType: ShapeType,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: Partial<ShapeObject>
): ShapeObject {
  return {
    id: uuidv4(),
    type: 'shape',
    shapeType,
    x,
    y,
    width,
    height,
    rotation: 0,
    fillColor: 'transparent',
    fillOpacity: 1,
    strokeColor: '#38bdf8',
    strokeWidth: 2,
    strokeOpacity: 1,
    strokeStyle: 'solid',
    locked: false,
    layerId: 'objects',
    ...options,
  };
}

export function createFormula(
  latex: string,
  x: number,
  y: number,
  fontSize = 28,
  color = '#ffffff'
): TextObject {
  const measured = measureLatexSize(latex, fontSize);
  return {
    id: uuidv4(),
    type: 'text',
    x,
    y,
    width: Math.max(120, measured.width),
    height: Math.max(48, measured.height),
    content: latex,
    fontFamily: "KaTeX_Main, 'Cambria Math', 'Times New Roman', serif",
    fontSize,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    color,
    backgroundColor: 'transparent',
    opacity: 1,
    rotation: 0,
    preset: 'formula',
    locked: false,
    layerId: 'objects',
    isLatex: true,
  };
}

export function createTextCard(
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  preset: TextObject['preset'] = 'body',
  options?: Partial<TextObject>
): TextObject {
  return {
    id: uuidv4(),
    type: 'text',
    x,
    y,
    width,
    height,
    content,
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: '#f8fafc',
    backgroundColor: 'transparent',
    opacity: 1,
    rotation: 0,
    preset,
    locked: false,
    layerId: 'objects',
    ...options,
  };
}
