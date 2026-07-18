import type { Store } from '../../core/types';
import type { Component } from './toast';

// @specs/DESIGN.md § 3.7 - Preview card with loading states
export function createPreviewCard(url: string, tag: string, store: Store): Component {
  const el = document.createElement('div');
  el.className = 'preview-card';

  // Loading placeholder
  const loading = document.createElement('div');
  loading.className = 'preview-card__loading';
  el.appendChild(loading);

  // Error message
  const errorEl = document.createElement('div');
  errorEl.className = 'preview-card__error';
  errorEl.textContent = '> failed to load';
  errorEl.style.display = 'none';
  el.appendChild(errorEl);

  // Image (hidden until loaded)
  const img = document.createElement('img');
  img.className = 'preview-card__image';
  img.alt = 'GIF preview';
  img.style.display = 'none';

  let destroyed = false;
  const isCurrentDraft = (): boolean => !destroyed && store.getState().draftUrl === url;

  function handleLoad(): void {
    if (!isCurrentDraft()) return;
    loading.style.display = 'none';
    errorEl.style.display = 'none';
    img.style.display = 'block';
    store.dispatch({ type: 'SET_DRAFT_PREVIEW_STATUS', payload: 'loaded' });
  }

  function handleError(): void {
    if (!isCurrentDraft()) return;
    loading.style.display = 'none';
    img.style.display = 'none';
    errorEl.style.display = 'flex';
    store.dispatch({ type: 'SET_DRAFT_PREVIEW_STATUS', payload: 'error' });
  }

  img.addEventListener('load', handleLoad);
  img.addEventListener('error', handleError);

  img.src = url;
  el.appendChild(img);

  // Dispatch loading status
  store.dispatch({ type: 'SET_DRAFT_PREVIEW_STATUS', payload: 'loading' });

  // Bottom bar
  const bar = document.createElement('div');
  bar.className = 'preview-card__bar';

  const tagLabel = document.createElement('span');
  tagLabel.className = 'preview-card__tag';
  tagLabel.textContent = `> add ${tag}`;
  bar.appendChild(tagLabel);

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'preview-card__confirm';
  confirmBtn.textContent = 'ADD';
  confirmBtn.disabled = true;

  // Enable button only when loaded
  const unsubscribe = store.subscribe((state) => {
    confirmBtn.disabled = state.draftUrl !== url || state.draftPreviewStatus !== 'loaded';
  });

  confirmBtn.addEventListener('click', () => {
    const state = store.getState();
    if (state.draftUrl !== url || state.draftPreviewStatus !== 'loaded') return;
    const persisted = store.dispatch({ type: 'ADD_GIF', payload: { url, tag } });
    if (persisted === false) return;
    const afterState = store.getState();
    if (afterState.lastAddDuplicate) {
      const existing = afterState.library.gifs.find(g => g.url === url);
      const existingTag = existing?.tag ?? '📂';
      store.dispatch({ type: 'SHOW_TOAST', payload: { text: `already saved ${existingTag}`, variant: 'warning' } });
      if (afterState.activeTag !== existingTag) {
        store.dispatch({ type: 'SET_ACTIVE_TAG', payload: existingTag });
      }
    } else {
      store.dispatch({ type: 'SHOW_TOAST', payload: `gif added ${tag}` });
    }
  });
  bar.appendChild(confirmBtn);

  el.appendChild(bar);

  return {
    element: el,
    destroy: () => {
      destroyed = true;
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      img.removeAttribute('src');
      unsubscribe();
    },
  };
}
