import type { Store, GIF, ClipboardService } from '../../core/types';
import type { Component } from './toast';

// @specs/INTERACTION.md § 2.2 - GIF Card (mode-aware click)
export function createGifCard(
  gif: GIF,
  store: Store,
  clipboard: ClipboardService,
  selected: boolean,
): Component {
  const el = document.createElement('div');
  el.className = 'gif-card';
  el.dataset.gifId = gif.id;
  if (selected) {
    el.classList.add('gif-card--selected');
  }
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', 'Copy GIF URL');

  const img = document.createElement('img');
  img.className = 'gif-card__image';
  img.src = gif.url;
  img.alt = '';
  img.loading = 'lazy';
  el.appendChild(img);

  // Tag badge (click to enter edit mode for this GIF)
  const badge = document.createElement('button');
  badge.className = 'gif-card__badge';
  badge.setAttribute('data-no-copy', 'true');
  badge.setAttribute('aria-label', 'Edit tag');
  badge.textContent = gif.tag;
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    const state = store.getState();
    if (state.editMode) {
      store.dispatch({ type: 'SELECT_GIF', payload: gif.id });
    } else {
      store.dispatch({ type: 'ENTER_EDIT_MODE', payload: gif.id });
    }
  });
  el.appendChild(badge);

  // Delete button (data-no-copy prevents copy on click)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'gif-card__delete';
  deleteBtn.setAttribute('data-no-copy', 'true');
  deleteBtn.setAttribute('aria-label', 'Delete GIF');
  deleteBtn.textContent = '❌';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    store.dispatch({ type: 'SHOW_CONFIRM_DELETE', payload: gif.id });
  });
  el.appendChild(deleteBtn);

  // Card click: edit mode = select, normal mode = copy URL
  el.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-copy]')) return;
    const state = store.getState();
    if (state.editMode) {
      store.dispatch({ type: 'SELECT_GIF', payload: gif.id });
    } else {
      clipboard.writeText(gif.url);
      store.dispatch({ type: 'SHOW_TOAST', payload: 'copied to clipboard' });
    }
  });

  return { element: el, destroy: () => {} };
}
