import type { Store } from '../core/types';

// @specs/INTERACTION.md § 4 - Keyboard operations
export interface KeyboardConfig {
  readonly onNewGif: () => void;
}

export function setupKeyboard(store: Store, config: KeyboardConfig): () => void {
  function handleKeydown(e: KeyboardEvent): void {
    // Skip if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Only handle Escape and Enter within inputs
      if (e.key === 'Escape') {
        store.dispatch({ type: 'SET_INPUT_EXPANDED', payload: false });
        store.dispatch({ type: 'SET_DRAFT_URL', payload: '' });
        (target as HTMLInputElement).blur();
        return;
      }
      return;
    }

    const state = store.getState();

    switch (e.key) {
      case '?':
        store.dispatch({ type: 'TOGGLE_ABOUT' });
        break;
      case 'n':
      case 'N':
        if (state.aboutMode) return;
        e.preventDefault();
        config.onNewGif();
        break;
      case '1': case '2': case '3': case '4': case '5': case '6': case '7': {
        if (state.aboutMode) return;
        const index = parseInt(e.key) - 1;
        const tag = state.library.tags[index];
        if (tag) {
          store.dispatch({ type: 'SET_ACTIVE_TAG', payload: tag.emoji });
        }
        break;
      }
      case '0':
        if (state.aboutMode) return;
        store.dispatch({ type: 'SET_ACTIVE_TAG', payload: null });
        break;
      case 'Escape':
        if (state.aboutMode) {
          store.dispatch({ type: 'TOGGLE_ABOUT' });
        } else {
          store.dispatch({ type: 'SHOW_DATA_MODAL', payload: false });
          store.dispatch({ type: 'SHOW_POPOVER', payload: null });
          store.dispatch({ type: 'SHOW_CONFIRM_DELETE', payload: null });
        }
        break;
    }
  }

  document.addEventListener('keydown', handleKeydown);
  return () => document.removeEventListener('keydown', handleKeydown);
}
