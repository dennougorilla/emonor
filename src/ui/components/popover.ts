import type { Store, GIF } from '../../core/types';
import type { Component } from './toast';

// @specs/INTERACTION.md § 2.4 - Popover (tag change)
export function createPopover(gif: GIF, store: Store): Component {
  const el = document.createElement('div');
  el.className = 'popover';
  el.setAttribute('role', 'listbox');
  el.setAttribute('aria-label', 'Select tag');

  const state = store.getState();

  for (const tag of state.library.tags) {
    const chip = document.createElement('button');
    chip.className = 'popover__chip';
    chip.setAttribute('role', 'option');
    chip.setAttribute('aria-selected', String(tag.emoji === gif.tag));
    chip.textContent = tag.emoji;

    if (tag.emoji === gif.tag) {
      chip.classList.add('popover__chip--active');
    }

    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      store.dispatch({ type: 'UPDATE_TAG', payload: { id: gif.id, tag: tag.emoji } });
    });

    el.appendChild(chip);
  }

  return { element: el, destroy: () => {} };
}
