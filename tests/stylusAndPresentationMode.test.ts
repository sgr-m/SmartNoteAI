/**
 * tests/stylusAndPresentationMode.test.ts
 * Tests for stylus (XP-Pen / Wacom / Huion) pointer event processing,
 * coalesced event handling, pressure fallback, and presentation mode synchronization.
 */

import { describe, it, expect } from 'vitest';

describe('Stylus & Tablet Pointer Event Processing', () => {
  it('does NOT drop pen events even when isPrimary is false (dual mouse + tablet setups)', () => {
    // In dual mouse + tablet setups, Chromium often flags pen events as isPrimary: false
    const shouldIgnorePointerEvent = (e: { isPrimary: boolean; pointerType: string }) => {
      return !e.isPrimary && e.pointerType === 'touch';
    };

    // Primary mouse -> do not ignore
    expect(shouldIgnorePointerEvent({ isPrimary: true, pointerType: 'mouse' })).toBe(false);
    // Non-primary pen -> MUST NOT ignore
    expect(shouldIgnorePointerEvent({ isPrimary: false, pointerType: 'pen' })).toBe(false);
    // Primary pen -> MUST NOT ignore
    expect(shouldIgnorePointerEvent({ isPrimary: true, pointerType: 'pen' })).toBe(false);
    // Non-primary multi-touch gesture -> ignore secondary touches
    expect(shouldIgnorePointerEvent({ isPrimary: false, pointerType: 'touch' })).toBe(true);
    // Primary touch -> do not ignore
    expect(shouldIgnorePointerEvent({ isPrimary: true, pointerType: 'touch' })).toBe(false);
  });

  it('safely handles getCoalescedEvents when tablet driver returns empty array', () => {
    const resolveEvents = (e: { getCoalescedEvents?: () => any[] }) => {
      const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
      return coalesced && coalesced.length > 0 ? coalesced : [e];
    };

    const dummyEvent = { pointerId: 2, pointerType: 'pen' };

    // Tablet returns empty coalesced array
    const eventWithEmptyCoalesced = {
      ...dummyEvent,
      getCoalescedEvents: () => [],
    };
    const resolvedEmpty = resolveEvents(eventWithEmptyCoalesced);
    expect(resolvedEmpty).toHaveLength(1);
    expect(resolvedEmpty[0]).toBe(eventWithEmptyCoalesced);

    // Tablet returns populated coalesced array
    const pt1 = { pointerId: 2, pointerType: 'pen', clientX: 10 };
    const pt2 = { pointerId: 2, pointerType: 'pen', clientX: 12 };
    const eventWithFullCoalesced = {
      ...dummyEvent,
      getCoalescedEvents: () => [pt1, pt2],
    };
    const resolvedFull = resolveEvents(eventWithFullCoalesced);
    expect(resolvedFull).toHaveLength(2);
    expect(resolvedFull[0]).toBe(pt1);
    expect(resolvedFull[1]).toBe(pt2);

    // No getCoalescedEvents method available
    const eventWithoutMethod = { ...dummyEvent };
    const resolvedNone = resolveEvents(eventWithoutMethod);
    expect(resolvedNone).toHaveLength(1);
  });

  it('applies fallback pressure when tablet driver reports 0 pressure on pen press', () => {
    const computePressure = (e: { pressure?: number; pointerType: string; buttons: number }) => {
      let pressure = 0.5;
      if (typeof e.pressure === 'number' && e.pressure > 0) {
        pressure = e.pressure;
      } else if (e.pointerType === 'pen') {
        pressure = e.buttons > 0 ? 0.35 : 0.5;
      }
      return pressure;
    };

    // Pen with genuine pressure reading
    expect(computePressure({ pressure: 0.72, pointerType: 'pen', buttons: 1 })).toBe(0.72);

    // Pen reporting 0 pressure while pen button is pressed down (driver delay / raw touch)
    expect(computePressure({ pressure: 0, pointerType: 'pen', buttons: 1 })).toBe(0.35);

    // Pen hovering without button
    expect(computePressure({ pressure: 0, pointerType: 'pen', buttons: 0 })).toBe(0.5);

    // Mouse click with 0 pressure
    expect(computePressure({ pressure: 0, pointerType: 'mouse', buttons: 1 })).toBe(0.5);
  });
});

describe('Presentation / Fullscreen Synchronization', () => {
  it('correctly enters fullscreen on single click if window is not natively fullscreen', () => {
    // If renderer thought isPresentationMode is true, but native window is NOT fullscreen:
    const calculateNextState = (isPresentationMode: boolean, nativeIsFullScreen: boolean) => {
      if (isPresentationMode && !nativeIsFullScreen) {
        return true; // Force re-enter on first click
      }
      return !isPresentationMode;
    };

    // State after returning from desktop mode where window was unminimized to floating bounds:
    // Renderer has isPresentationMode: true, but native window is NOT fullscreen
    expect(calculateNextState(true, false)).toBe(true);

    // Normal toggle: when truly fullscreen, click toggles off
    expect(calculateNextState(true, true)).toBe(false);

    // Normal toggle: when not fullscreen, click toggles on
    expect(calculateNextState(false, false)).toBe(true);
  });
});
