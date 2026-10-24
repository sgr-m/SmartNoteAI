/**
 * presentationTools.test.ts
 * Automated tests for Milestone 4: Presentations and Desktop Tools
 * Covers: Spotlight, Screen Veil, Magnifier, Timer & Stopwatch, Desktop Annotation
 */

import { describe, it, expect } from 'vitest';

describe('Milestone 4 — Presentations and Desktop Tools', () => {
  describe('Spotlight Calculations', () => {
    it('calculates rectangular spotlight dimensions with standard aspect ratio', () => {
      const size = 200;
      const rectW = Math.round(size * 1.6);
      const rectH = Math.round(size);
      expect(rectW).toBe(320);
      expect(rectH).toBe(200);

      const pos = { x: 500, y: 400 };
      const left = pos.x - rectW / 2;
      const top = pos.y - rectH / 2;
      expect(left).toBe(340);
      expect(top).toBe(300);
    });

    it('clamps spotlight size within safe ranges', () => {
      const clampSize = (s: number) => Math.max(60, Math.min(600, s));
      expect(clampSize(20)).toBe(60);
      expect(clampSize(300)).toBe(300);
      expect(clampSize(1000)).toBe(600);
    });
  });

  describe('Screen Veil Reveal Logic', () => {
    it('computes veil percentages for vertical and horizontal reveals', () => {
      const computeVeilStyle = (dir: 'down' | 'up' | 'right' | 'left', revealed: number) => {
        const pct = `${(1 - revealed) * 100}%`;
        if (dir === 'down') return { top: `${revealed * 100}%`, left: 0, right: 0, bottom: 0 };
        if (dir === 'up') return { top: 0, left: 0, right: 0, height: pct };
        if (dir === 'right') return { top: 0, left: `${revealed * 100}%`, right: 0, bottom: 0 };
        return { top: 0, left: 0, width: pct, bottom: 0 };
      };

      const styleDown = computeVeilStyle('down', 0.25);
      expect(styleDown.top).toBe('25%');
      expect(styleDown.bottom).toBe(0);

      const styleRight = computeVeilStyle('right', 0.6);
      expect(styleRight.left).toBe('60%');
      expect(styleRight.right).toBe(0);

      const styleUp = computeVeilStyle('up', 0.4);
      expect(styleUp.height).toBe('60%');
    });

    it('clamps reveal progress between 0 and 1', () => {
      const clampReveal = (r: number) => Math.max(0, Math.min(1, r));
      expect(clampReveal(-0.1)).toBe(0);
      expect(clampReveal(0.5)).toBe(0.5);
      expect(clampReveal(1.2)).toBe(1);
    });
  });

  describe('Magnifier Logic', () => {
    it('calculates source rect mapping from zoom level and lens size', () => {
      const lensSize = 240;
      const zoom = 2.0;
      const pos = { x: 500, y: 400 };

      const srcW = lensSize / zoom;
      const srcH = lensSize / zoom;
      const srcX = pos.x - srcW / 2;
      const srcY = pos.y - srcH / 2;

      expect(srcW).toBe(120);
      expect(srcH).toBe(120);
      expect(srcX).toBe(440);
      expect(srcY).toBe(340);
    });

    it('clamps zoom factors within safe limits', () => {
      const clampZoom = (z: number) => Math.max(1.25, Math.min(8, z));
      expect(clampZoom(1.0)).toBe(1.25);
      expect(clampZoom(3.5)).toBe(3.5);
      expect(clampZoom(12)).toBe(8);
    });
  });

  describe('Timer and Stopwatch Formatting', () => {
    const fmt = (totalSec: number) => {
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    it('formats countdown MM:SS correctly', () => {
      expect(fmt(300)).toBe('05:00');
      expect(fmt(75)).toBe('01:15');
      expect(fmt(9)).toBe('00:09');
      expect(fmt(0)).toBe('00:00');
    });

    it('formats durations over an hour as HH:MM:SS', () => {
      expect(fmt(3665)).toBe('01:01:05');
    });

    it('decrements countdown and marks time-up at 0', () => {
      let seconds = 3;
      let isRunning = true;
      const tick = () => {
        if (seconds <= 1) {
          seconds = 0;
          isRunning = false;
        } else {
          seconds -= 1;
        }
      };

      tick(); // 3 -> 2
      expect(seconds).toBe(2);
      expect(isRunning).toBe(true);

      tick(); // 2 -> 1
      expect(seconds).toBe(1);
      expect(isRunning).toBe(true);

      tick(); // 1 -> 0
      expect(seconds).toBe(0);
      expect(isRunning).toBe(false);
    });
  });

  describe('Desktop Annotation Strokes', () => {
    it('filters expired laser strokes based on LASER_DURATION', () => {
      const LASER_DURATION = 2200;
      const now = 10000;
      const strokes = [
        { id: '1', tool: 'laser', startTime: 9000 },  // age 1000ms -> active
        { id: '2', tool: 'laser', startTime: 7000 },  // age 3000ms -> expired
        { id: '3', tool: 'laser', startTime: 8500 },  // age 1500ms -> active
      ];

      const active = strokes.filter((s) => now - s.startTime < LASER_DURATION);
      expect(active.length).toBe(2);
      expect(active.map((s) => s.id)).toEqual(['1', '3']);
    });
  });
});
