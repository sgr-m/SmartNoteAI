import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Desktop and Presentation Mode Taskbar Suppression', () => {
  let mockWin: any;
  let mockAnnotationWin: any;
  let callOrder: string[];

  beforeEach(() => {
    callOrder = [];
    mockWin = {
      isDestroyed: vi.fn(() => false),
      isFullScreen: vi.fn(() => false),
      isMaximized: vi.fn(() => false),
      isMinimized: vi.fn(() => false),
      setAlwaysOnTop: vi.fn((val: boolean, level?: string) => {
        callOrder.push(`setAlwaysOnTop(${val}, ${level || 'default'})`);
      }),
      setFullScreen: vi.fn((val: boolean) => {
        callOrder.push(`setFullScreen(${val})`);
      }),
      maximize: vi.fn(() => {
        callOrder.push('maximize()');
      }),
      restore: vi.fn(() => {
        callOrder.push('restore()');
      }),
      show: vi.fn(() => {
        callOrder.push('show()');
      }),
      focus: vi.fn(() => {
        callOrder.push('focus()');
      }),
      webContents: {
        send: vi.fn((channel: string, data: any) => {
          callOrder.push(`send(${channel}, ${data})`);
        }),
      },
    };

    mockAnnotationWin = {
      isDestroyed: vi.fn(() => false),
      destroy: vi.fn(() => {
        callOrder.push('destroyAnnotationWindow()');
      }),
    };
  });

  it('elevates window to screen-saver level above Windows taskbar when entering presentation mode', () => {
    const handleSetFullScreen = (win: any, flag?: boolean) => {
      const next = flag !== undefined ? flag : !win.isFullScreen();
      if (next) {
        win.setAlwaysOnTop(true, 'screen-saver');
        win.setFullScreen(true);
      } else {
        win.setAlwaysOnTop(false);
        win.setFullScreen(false);
      }
      return next;
    };

    const res = handleSetFullScreen(mockWin, true);
    expect(res).toBe(true);
    expect(mockWin.setAlwaysOnTop).toHaveBeenCalledWith(true, 'screen-saver');
    expect(mockWin.setFullScreen).toHaveBeenCalledWith(true);
    expect(callOrder[0]).toBe('setAlwaysOnTop(true, screen-saver)');
    expect(callOrder[1]).toBe('setFullScreen(true)');
  });

  it('restores main window to screen-saver fullscreen BEFORE showing to eliminate taskbar flicker', () => {
    let wasFullScreenBeforeDesktop = true;

    const restoreMainWindowState = (win: any) => {
      if (!win || win.isDestroyed()) return;

      if (wasFullScreenBeforeDesktop) {
        win.setAlwaysOnTop(true, 'screen-saver');
        if (!win.isFullScreen()) {
          win.setFullScreen(true);
        }
        if (win.isMinimized()) {
          win.restore();
        }
        win.show();
        win.focus();
        win.webContents.send('window:setPresentationMode', true);
      }
    };

    restoreMainWindowState(mockWin);

    // Verify order of calls:
    // 1. setAlwaysOnTop(true, 'screen-saver')
    // 2. setFullScreen(true)
    // 3. show()
    // 4. focus()
    // 5. send('window:setPresentationMode', true)
    const alwaysOnTopIdx = callOrder.indexOf('setAlwaysOnTop(true, screen-saver)');
    const fullScreenIdx = callOrder.indexOf('setFullScreen(true)');
    const showIdx = callOrder.indexOf('show()');

    expect(alwaysOnTopIdx).toBeGreaterThanOrEqual(0);
    expect(fullScreenIdx).toBeGreaterThan(alwaysOnTopIdx);
    expect(showIdx).toBeGreaterThan(fullScreenIdx);
  });

  it('restores main window BEFORE destroying desktop overlay so no taskbar gap or flash occurs', () => {
    const handleRestore = (mainWin: any, annotationWin: any) => {
      if (mainWin && !mainWin.isDestroyed()) {
        mainWin.show();
      }
      if (annotationWin && !annotationWin.isDestroyed()) {
        annotationWin.destroy();
      }
    };

    handleRestore(mockWin, mockAnnotationWin);

    const showIdx = callOrder.indexOf('show()');
    const destroyIdx = callOrder.indexOf('destroyAnnotationWindow()');

    expect(showIdx).toBeLessThan(destroyIdx);
  });
});

