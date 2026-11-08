/**
 * Keyboard Utilities — Input Focus & Modal Detection
 * Ensures single-key shortcuts and canvas manipulation hotkeys do not interfere
 * when the user is typing in forms, inputs, modals, or dialogs.
 */

export function isTypingOrInputFocused(e?: KeyboardEvent | React.KeyboardEvent): boolean {
  // 1. Inspect the target of the event if provided
  const target = (e?.target || null) as HTMLElement | null;
  if (target) {
    const tagName = target.tagName?.toUpperCase();
    if (
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      tagName === 'SELECT' ||
      target.isContentEditable ||
      target.getAttribute?.('contenteditable') === 'true'
    ) {
      return true;
    }

    if (typeof target.closest === 'function') {
      const isInsideEditableOrDialog = target.closest(
        'input, textarea, select, [contenteditable="true"], [role="dialog"]:not(.smartboard-pen-flyout):not(.smartboard-eraser-flyout):not(.smartboard-shape-flyout), .add-res-overlay, .res-lib-overlay, .modal-backdrop, .dialog-backdrop, .modal, .inline-text-editor-container, .text-modal-overlay, .ai-chat-side-panel, .ai-chat-input-wrapper, .model-settings-drawer, .model-settings-drawer-overlay, .ai-chat-history-drawer'
      );
      if (isInsideEditableOrDialog) {
        return true;
      }
    }
  }

  // 2. Inspect document activeElement
  if (typeof document !== 'undefined' && document.activeElement) {
    const active = document.activeElement as HTMLElement;
    const activeTag = active.tagName?.toUpperCase();
    if (
      activeTag === 'INPUT' ||
      activeTag === 'TEXTAREA' ||
      activeTag === 'SELECT' ||
      active.isContentEditable ||
      active.getAttribute?.('contenteditable') === 'true'
    ) {
      return true;
    }
    if (typeof active.closest === 'function') {
      const isInsideChatOrModal = active.closest(
        '.ai-chat-side-panel, .model-settings-drawer, .model-settings-drawer-overlay, .ai-chat-input-wrapper, .ai-chat-history-drawer'
      );
      if (isInsideChatOrModal) {
        return true;
      }
    }
  }

  // 3. Inspect if any modal overlay or dialog is currently mounted in document
  if (typeof document !== 'undefined' && document.querySelector) {
    const openModal = document.querySelector(
      '.add-res-overlay, .res-lib-overlay, .modal-backdrop, .modal, [role="dialog"]:not(.smartboard-pen-flyout):not(.smartboard-eraser-flyout):not(.smartboard-shape-flyout), .inline-text-editor-container, .text-modal-overlay, .model-settings-drawer-overlay'
    );
    if (openModal) {
      return true;
    }
  }

  return false;
}
