import type { Store } from '../../core/types';
import type { Component } from './toast';

function clearElement(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

// @specs/INTERACTION.md § 2.1 - TagList (Filter mode)
export function createTagBar(store: Store): Component {
  const el = document.createElement('div');
  el.className = 'tag-bar';
  el.setAttribute('role', 'tablist');
  el.setAttribute('aria-label', 'Filter by tag');

  let prevActiveTag: string | null = null;
  let prevTags: readonly { emoji: string }[] = [];
  let prevAboutMode = false;
  let prevEditMode = false;

  function render(): void {
    const state = store.getState();

    // About mode: disable tag bar
    if (state.aboutMode !== prevAboutMode) {
      prevAboutMode = state.aboutMode;
      el.classList.toggle('tag-bar--disabled', state.aboutMode);
    }

    // Edit mode styling
    if (state.editMode !== prevEditMode) {
      prevEditMode = state.editMode;
      el.classList.toggle('tag-bar--edit-mode', state.editMode);
    }

    // Only rebuild chips when tags array changes
    if (state.library.tags !== prevTags) {
      prevTags = state.library.tags;
      clearElement(el);
      for (const tag of state.library.tags) {
        const chip = document.createElement('button');
        chip.className = 'tag-chip';
        chip.setAttribute('role', 'tab');
        chip.setAttribute('aria-label', tag.label);
        chip.textContent = tag.emoji;
        chip.addEventListener('click', () => {
          const currentState = store.getState();
          if (currentState.editMode) {
            if (currentState.selectedGifIds.length === 0) {
              store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'select GIFs first', variant: 'warning' } });
              return;
            }
            const count = currentState.selectedGifIds.length;
            store.dispatch({ type: 'ASSIGN_TAG', payload: tag.emoji });
            store.dispatch({ type: 'SHOW_TOAST', payload: `tagged ${count} GIFs ${tag.emoji}` });
          } else {
            store.dispatch({ type: 'SET_ACTIVE_TAG', payload: tag.emoji });
          }
        });
        el.appendChild(chip);
      }
    }

    // Update active state (only relevant in normal mode)
    if (state.activeTag !== prevActiveTag) {
      prevActiveTag = state.activeTag;
      const chips = el.querySelectorAll('.tag-chip');
      chips.forEach((chip, i) => {
        const tag = state.library.tags[i];
        const isActive = tag && tag.emoji === state.activeTag;
        chip.classList.toggle('tag-chip--active', isActive);
        chip.setAttribute('aria-selected', String(isActive));
      });
    }
  }

  const unsubscribe = store.subscribe(render);
  render();

  return { element: el, destroy: unsubscribe };
}
