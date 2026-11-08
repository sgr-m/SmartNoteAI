/**
 * liveGenerationWorkspace.test.ts — Unit Tests for Live Generation Workspace UI
 * Phase 6: Testing Gamma-Style Live Workspace Rendering, Toolbar, and Sidebar
 */

import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../src/renderer/context/AppContext', () => ({
  useAppContext: () => ({
    docState: {
      currentPageIndex: 0,
      lesson: {
        pages: [{ id: 'p1', width: 1920, height: 1080, objects: [] }],
      },
    },
    docDispatch: vi.fn(),
    commandSystem: { execute: vi.fn() },
    setToastMessage: vi.fn(),
  }),
}));

import { LiveGenerationWorkspace } from '../src/renderer/components/aiPresentation/LiveGenerationWorkspace';

describe('Phase 6: LiveGenerationWorkspace UI Component', () => {
  const sampleOutline = [
    {
      id: 's1',
      slideNumber: 1,
      title: 'Introduction to Photosynthesis',
      actionGoal: 'Core definition and overview',
      selected: true,
    },
    {
      id: 's2',
      slideNumber: 2,
      title: 'Light-Dependent Reactions',
      actionGoal: 'Chloroplast anatomy and thylakoid membrane',
      selected: true,
    },
  ];

  it('1. Returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(LiveGenerationWorkspace, {
        isOpen: false,
        topic: 'Photosynthesis',
        outline: sampleOutline,
        onClose: vi.fn(),
      })
    );

    expect(html).toBe('');
  });

  it('2. Renders live workspace container, header, topic, and badges when isOpen is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(LiveGenerationWorkspace, {
        isOpen: true,
        topic: 'Photosynthesis & Cellular Energy',
        subject: 'Biology',
        gradeLevel: 'Grade 11',
        outline: sampleOutline,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('live-workspace-overlay');
    expect(html).toContain('live-workspace-container');
    expect(html).toContain('Photosynthesis &amp; Cellular Energy');
    expect(html).toContain('Biology');
    expect(html).toContain('Grade 11');
    expect(html).toContain('live-workspace-progress-track');
  });

  it('3. Renders sidebar with presentation slides count and add button', () => {
    const html = renderToStaticMarkup(
      React.createElement(LiveGenerationWorkspace, {
        isOpen: true,
        topic: 'Photosynthesis',
        outline: sampleOutline,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('live-workspace-sidebar');
    expect(html).toContain('Presentation Slides');
    expect(html).toContain('+ Add Slide');
  });

  it('4. Renders toolbar with layout options and slide navigation', () => {
    const html = renderToStaticMarkup(
      React.createElement(LiveGenerationWorkspace, {
        isOpen: true,
        topic: 'Photosynthesis',
        outline: sampleOutline,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('live-workspace-toolbar');
    expect(html).toContain('Previous');
    expect(html).toContain('Next');
    expect(html).toContain('Concept Explanation (Template A)');
    expect(html).toContain('Problem &amp; Worked Solution (Template E)');
  });
});
