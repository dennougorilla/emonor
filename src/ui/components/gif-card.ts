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
  const initialEditMode = store.getState().editMode;
  el.setAttribute('aria-label', initialEditMode ? 'Select GIF' : 'Copy GIF URL');
  if (initialEditMode) {
    el.setAttribute('aria-pressed', String(selected));
  }

  const img = document.createElement('img');
  img.className = 'gif-card__image';
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  if (gif.width && gif.height) {
    img.style.aspectRatio = `${gif.width} / ${gif.height}`;
  } else {
    img.addEventListener('load', () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && h > 0) {
        img.style.aspectRatio = `${w} / ${h}`;
        store.dispatch({ type: 'SET_GIF_DIMENSIONS', payload: { id: gif.id, width: w, height: h } });
      }
    }, { once: true });
  }
  img.src = gif.url;
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

  function activateCard(): void {
    const state = store.getState();
    if (state.editMode) {
      store.dispatch({ type: 'SELECT_GIF', payload: gif.id });
      return;
    }

    void clipboard.writeText(gif.url)
      .then(() => {
        store.dispatch({ type: 'SHOW_TOAST', payload: 'copied to clipboard' });
      })
      .catch(() => {
        store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'copy failed', variant: 'warning' } });
      });
  }

  // Card activation: edit mode = select, normal mode = copy URL
  el.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-copy]')) return;
    activateCard();
  });

  el.addEventListener('keydown', (e) => {
    if (e.target !== el || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    activateCard();
  });

  return { element: el, destroy: () => {} };
}
