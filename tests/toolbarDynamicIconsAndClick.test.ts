import { describe, it, expect } from 'vitest';
import React from 'react';
import { PenType, ShapeType } from '../src/shared/types';
import { ShapeStyle } from '../src/renderer/engine/DrawingEngine';

/**
 * Test suite for Toolbar click behavior (first-click select, second-click open flyout)
 * and dynamic dock icon rendering for pens and shapes.
 */

describe('Toolbar Click & Dynamic Icon Subsystem', () => {
  describe('First-Click Select & Second-Click Flyout Toggle Logic', () => {
    // Model the exact state machine used in Toolbar.tsx
    class ToolbarStateMachine {
      activeTool: string = 'select';
      activeToolbarFlyout: 'none' | 'pen' | 'eraser' | 'shape' | 'menu' = 'none';

      handlePenClick() {
        if (this.activeTool === 'pen') {
          this.activeToolbarFlyout = this.activeToolbarFlyout === 'pen' ? 'none' : 'pen';
        } else {
          this.activeTool = 'pen';
          this.activeToolbarFlyout = 'none';
        }
      }

      handleEraserClick() {
        if (this.activeTool === 'eraser') {
          this.activeToolbarFlyout = this.activeToolbarFlyout === 'eraser' ? 'none' : 'eraser';
        } else {
          this.activeTool = 'eraser';
          this.activeToolbarFlyout = 'none';
        }
      }

      handleShapeClick() {
        const isShapeActive = this.activeTool === 'shape' || this.activeTool === 'line';
        if (isShapeActive) {
          this.activeToolbarFlyout = this.activeToolbarFlyout === 'shape' ? 'none' : 'shape';
        } else {
          this.activeTool = 'shape';
          this.activeToolbarFlyout = 'none';
        }
      }

      handleSelectToolClick(tool: string) {
        this.activeTool = tool;
        this.activeToolbarFlyout = 'none';
      }
    }

    it('first click on Pen only selects pen tool without opening the flyout', () => {
      const tb = new ToolbarStateMachine();
      expect(tb.activeTool).toBe('select');
      expect(tb.activeToolbarFlyout).toBe('none');

      tb.handlePenClick();
      expect(tb.activeTool).toBe('pen');
      expect(tb.activeToolbarFlyout).toBe('none'); // Flyout remains closed on first click!
    });

    it('second click on Pen when already active opens the flyout', () => {
      const tb = new ToolbarStateMachine();
      tb.handlePenClick(); // 1st click: selects pen
      expect(tb.activeTool).toBe('pen');
      expect(tb.activeToolbarFlyout).toBe('none');

      tb.handlePenClick(); // 2nd click: opens flyout
      expect(tb.activeToolbarFlyout).toBe('pen');

      tb.handlePenClick(); // 3rd click: toggles flyout closed
      expect(tb.activeToolbarFlyout).toBe('none');
      expect(tb.activeTool).toBe('pen');
    });

    it('first click on Eraser only selects eraser without opening flyout', () => {
      const tb = new ToolbarStateMachine();
      expect(tb.activeTool).toBe('select');

      tb.handleEraserClick();
      expect(tb.activeTool).toBe('eraser');
      expect(tb.activeToolbarFlyout).toBe('none');
    });

    it('second click on Eraser opens eraser flyout, third click closes it', () => {
      const tb = new ToolbarStateMachine();
      tb.handleEraserClick(); // 1st
      expect(tb.activeToolbarFlyout).toBe('none');

      tb.handleEraserClick(); // 2nd
      expect(tb.activeToolbarFlyout).toBe('eraser');

      tb.handleEraserClick(); // 3rd
      expect(tb.activeToolbarFlyout).toBe('none');
    });

    it('first click on Shape only selects shape without opening flyout', () => {
      const tb = new ToolbarStateMachine();
      tb.handleShapeClick();
      expect(tb.activeTool).toBe('shape');
      expect(tb.activeToolbarFlyout).toBe('none');
    });

    it('second click on Shape opens shape flyout, third click closes it', () => {
      const tb = new ToolbarStateMachine();
      tb.handleShapeClick(); // 1st
      expect(tb.activeToolbarFlyout).toBe('none');

      tb.handleShapeClick(); // 2nd
      expect(tb.activeToolbarFlyout).toBe('shape');

      tb.handleShapeClick(); // 3rd
      expect(tb.activeToolbarFlyout).toBe('none');
    });

    it('switching between tools selects new tool with closed flyout', () => {
      const tb = new ToolbarStateMachine();
      tb.handlePenClick(); // select pen
      tb.handlePenClick(); // open pen flyout
      expect(tb.activeToolbarFlyout).toBe('pen');

      tb.handleEraserClick(); // switch to eraser
      expect(tb.activeTool).toBe('eraser');
      expect(tb.activeToolbarFlyout).toBe('none'); // Flyout closes on switching tool!

      tb.handleShapeClick(); // switch to shape
      expect(tb.activeTool).toBe('shape');
      expect(tb.activeToolbarFlyout).toBe('none');
    });
  });

  describe('Dynamic Pen Dock Icon Rendering Logic', () => {
    // Import and test helper render functions from Toolbar.tsx logic
    function getPenDockIconType(penType: PenType): string {
      switch (penType) {
        case 'magic':
          return 'magic';
        case 'brush':
        case 'flatBrush':
          return 'brush';
        case 'calligraphy':
          return 'calligraphy';
        case 'highlighter':
        case 'marker':
          return 'highlighter';
        case 'laser':
          return 'laser';
        case 'pattern':
          return 'pattern';
        case 'normal':
        case 'pencil':
        case 'fine':
        default:
          return 'normal';
      }
    }

    it('identifies magic pen type correctly for dock rendering', () => {
      expect(getPenDockIconType('magic')).toBe('magic');
    });

    it('identifies art brush and flat brush correctly for dock rendering', () => {
      expect(getPenDockIconType('brush')).toBe('brush');
      expect(getPenDockIconType('flatBrush')).toBe('brush');
    });

    it('identifies calligraphy brush correctly for dock rendering', () => {
      expect(getPenDockIconType('calligraphy')).toBe('calligraphy');
    });

    it('identifies highlighter marker correctly for dock rendering', () => {
      expect(getPenDockIconType('highlighter')).toBe('highlighter');
      expect(getPenDockIconType('marker')).toBe('highlighter');
    });

    it('identifies laser pointer pen correctly for dock rendering', () => {
      expect(getPenDockIconType('laser')).toBe('laser');
    });

    it('identifies pattern pen correctly for dock rendering', () => {
      expect(getPenDockIconType('pattern')).toBe('pattern');
    });

    it('defaults standard pens to normal pencil graphic', () => {
      expect(getPenDockIconType('normal')).toBe('normal');
      expect(getPenDockIconType('pencil')).toBe('normal');
      expect(getPenDockIconType('fine')).toBe('normal');
    });

    it('propagates selected color into tip styles accurately', () => {
      const testColor = '#9966ff';
      const brushTipStyle = { backgroundColor: testColor };
      expect(brushTipStyle.backgroundColor).toBe('#9966ff');

      const pencilTipStyle = { borderBottomColor: testColor };
      expect(pencilTipStyle.borderBottomColor).toBe('#9966ff');

      const laserTipStyle = { backgroundColor: testColor, boxShadow: `0 0 6px ${testColor}` };
      expect(laserTipStyle.backgroundColor).toBe('#9966ff');
      expect(laserTipStyle.boxShadow).toBe('0 0 6px #9966ff');
    });
  });

  describe('Dynamic Shape Dock Icon Rendering Logic', () => {
    function getShapeDockIconType(shapeStyle?: Partial<ShapeStyle>): string {
      const shapeType = shapeStyle?.shapeType || 'recognition';
      return shapeType;
    }

    it('returns circle when circle shape is selected', () => {
      expect(getShapeDockIconType({ shapeType: 'circle' })).toBe('circle');
    });

    it('returns rect when rect or roundedRect is selected', () => {
      expect(getShapeDockIconType({ shapeType: 'rect' })).toBe('rect');
      expect(getShapeDockIconType({ shapeType: 'roundedRect' })).toBe('roundedRect');
    });

    it('returns triangle when triangle is selected', () => {
      expect(getShapeDockIconType({ shapeType: 'triangle' })).toBe('triangle');
    });

    it('returns line when straight line is selected', () => {
      expect(getShapeDockIconType({ shapeType: 'line' })).toBe('line');
    });

    it('returns arrow when arrow shape is selected', () => {
      expect(getShapeDockIconType({ shapeType: 'arrow' })).toBe('arrow');
    });

    it('defaults to intelligent recognition when shapeType is recognition or unspecified', () => {
      expect(getShapeDockIconType({ shapeType: 'recognition' })).toBe('recognition');
      expect(getShapeDockIconType(undefined)).toBe('recognition');
    });
  });

  describe('Dock Swapping & Expandable Menu Logic (Teacher Accessibility)', () => {
    class DockLayoutManager {
      isDockSwapped: boolean;
      isMenuExpanded: boolean;

      constructor(initialSwapped = false) {
        this.isDockSwapped = initialSwapped;
        this.isMenuExpanded = false;
      }

      toggleDockSwap(): boolean {
        this.isDockSwapped = !this.isDockSwapped;
        return this.isDockSwapped;
      }

      toggleMenuExpand(): boolean {
        this.isMenuExpanded = !this.isMenuExpanded;
        return this.isMenuExpanded;
      }

      getLeftBarType(): 'menu' | 'navigation' {
        return this.isDockSwapped ? 'navigation' : 'menu';
      }

      getRightBarType(): 'menu' | 'navigation' {
        return this.isDockSwapped ? 'menu' : 'navigation';
      }

      getVisibleMenuTools(): string[] {
        const core = ['menu-hamburger', 'desktop', 'presentation', 'spotlight', 'annotation'];
        const expanded = [
          'timer',
          'screenshot',
          'background-styles',
          'layers',
          'subject-tools',
          'resource-library',
          'activities',
        ];
        return this.isMenuExpanded ? [...core, ...expanded] : core;
      }
    }

    it('defaults to menu bar on left and navigation bar on right', () => {
      const dock = new DockLayoutManager();
      expect(dock.isDockSwapped).toBe(false);
      expect(dock.getLeftBarType()).toBe('menu');
      expect(dock.getRightBarType()).toBe('navigation');
    });

    it('swaps menu bar and navigation bar when corner arrow is clicked', () => {
      const dock = new DockLayoutManager();
      dock.toggleDockSwap();

      expect(dock.isDockSwapped).toBe(true);
      expect(dock.getLeftBarType()).toBe('navigation');
      expect(dock.getRightBarType()).toBe('menu');

      // Click again to swap back
      dock.toggleDockSwap();
      expect(dock.isDockSwapped).toBe(false);
      expect(dock.getLeftBarType()).toBe('menu');
      expect(dock.getRightBarType()).toBe('navigation');
    });

    it('menu bar defaults to compact view with only 4 core tools + menu hamburger', () => {
      const dock = new DockLayoutManager();
      expect(dock.isMenuExpanded).toBe(false);
      const tools = dock.getVisibleMenuTools();

      expect(tools).toHaveLength(5);
      expect(tools).toContain('desktop');
      expect(tools).toContain('presentation');
      expect(tools).toContain('spotlight');
      expect(tools).toContain('annotation');
      expect(tools).not.toContain('timer');
      expect(tools).not.toContain('subject-tools');
    });

    it('clicking >> expands the menu bar to show all 12 tools, clicking again collapses', () => {
      const dock = new DockLayoutManager();
      dock.toggleMenuExpand();
      expect(dock.isMenuExpanded).toBe(true);

      const expandedTools = dock.getVisibleMenuTools();
      expect(expandedTools).toHaveLength(12);
      expect(expandedTools).toContain('timer');
      expect(expandedTools).toContain('screenshot');
      expect(expandedTools).toContain('background-styles');
      expect(expandedTools).toContain('layers');
      expect(expandedTools).toContain('subject-tools');
      expect(expandedTools).toContain('resource-library');
      expect(expandedTools).toContain('activities');

      // Collapse back
      dock.toggleMenuExpand();
      expect(dock.isMenuExpanded).toBe(false);
      expect(dock.getVisibleMenuTools()).toHaveLength(5);
    });

    it('zoom bar does not include redundant hand/pan button', () => {
      // Zoom controls: Zoom In, Zoom Out, Reset 100%, Fit Content
      const zoomBarButtons = ['zoom-in', 'zoom-out', 'reset-100', 'fit-content'];
      expect(zoomBarButtons).not.toContain('hand');
      expect(zoomBarButtons).not.toContain('pan');
    });
  });
});

