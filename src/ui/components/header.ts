import type { Store } from '../../core/types';
import type { Component } from './toast';
import { isValidGifUrl } from '../../core/validators';

// @specs/INTERACTION.md § 2.3 - Inline input (GIF add)
export function createHeader(store: Store): Component {
  const header = document.createElement('header');
  header.className = 'header';

  // Top row: logo + input
  const top = document.createElement('div');
  top.className = 'header__top';

  const logo = document.createElement('div');
  logo.className = 'header__logo';
  logo.textContent = 'EMONOR';
  logo.style.cursor = 'pointer';
  logo.setAttribute('aria-label', 'Toggle about info');
  logo.addEventListener('click', () => {
    store.dispatch({ type: 'TOGGLE_ABOUT' });
  });
  top.appendChild(logo);

  // Data modal button
  const dataBtn = document.createElement('button');
  dataBtn.className = 'header__data-btn';
  dataBtn.textContent = '{}';
  dataBtn.setAttribute('aria-label', 'Open data manager');
  dataBtn.addEventListener('click', () => {
    store.dispatch({ type: 'SHOW_DATA_MODAL', payload: true });
  });
  top.appendChild(dataBtn);

  // Input wrapper
  const wrap = document.createElement('div');
  wrap.className = 'input-wrap';

  const collapsed = document.createElement('div');
  collapsed.className = 'input-wrap__collapsed';
  collapsed.textContent = '> paste gif url...';

  const expandedContent = document.createElement('div');
  expandedContent.style.display = 'none';

  const prompt = document.createElement('div');
  prompt.className = 'input-wrap__prompt';
  prompt.textContent = '> add';

  const field = document.createElement('input');
  field.className = 'input-wrap__field';
  field.type = 'url';
  field.placeholder = 'paste gif url';
  field.setAttribute('aria-label', 'GIF URL input');

  const hint = document.createElement('div');
  hint.className = 'input-wrap__hint';
  hint.textContent = 'enter to add · esc to cancel';

  expandedContent.appendChild(prompt);
  expandedContent.appendChild(field);
  expandedContent.appendChild(hint);

  wrap.appendChild(collapsed);
  wrap.appendChild(expandedContent);
  top.appendChild(wrap);
  header.appendChild(top);

  // Expand on click
  wrap.addEventListener('click', () => {
    store.dispatch({ type: 'SET_INPUT_EXPANDED', payload: true });
  });

  // Input handling
  field.addEventListener('input', () => {
    store.dispatch({ type: 'SET_DRAFT_URL', payload: field.value });
  });

  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && field.value) {
      e.preventDefault();
      const url = field.value.trim();

      if (!isValidGifUrl(url)) {
        store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'invalid url format', variant: 'warning' } });
        return;
      }

      const state = store.getState();
      if (state.draftPreviewStatus === 'error') {
        store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'failed to load', variant: 'warning' } });
        return;
      }
      if (state.draftPreviewStatus !== 'loaded') {
        store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'waiting for preview', variant: 'warning' } });
        return;
      }

      const tag = state.activeTag ?? '📂';
      store.dispatch({ type: 'ADD_GIF', payload: { url, tag } });
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
    }
    if (e.key === 'Escape') {
      store.dispatch({ type: 'SET_INPUT_EXPANDED', payload: false });
      store.dispatch({ type: 'SET_DRAFT_URL', payload: '' });
      field.blur();
    }
  });

  // Subscribe to expanded state and aboutMode
  let prevExpanded = false;
  let prevAboutMode = false;
  const unsubscribe = store.subscribe((state) => {
    // Logo active state for about mode
    if (state.aboutMode !== prevAboutMode) {
      prevAboutMode = state.aboutMode;
      logo.classList.toggle('header__logo--active', state.aboutMode);
      wrap.style.display = state.aboutMode ? 'none' : '';
    }

    if (state.inputExpanded === prevExpanded) return;
    prevExpanded = state.inputExpanded;

    if (state.inputExpanded) {
      wrap.classList.add('input-wrap--expanded');
      collapsed.style.display = 'none';
      expandedContent.style.display = 'block';
      field.value = state.draftUrl;
      field.focus();
    } else {
      wrap.classList.remove('input-wrap--expanded');
      collapsed.style.display = 'block';
      expandedContent.style.display = 'none';
      field.value = '';
    }
  });

  return {
    element: header,
    destroy: unsubscribe,
    // Expose for keyboard shortcut
    focusInput: () => {
      store.dispatch({ type: 'SET_INPUT_EXPANDED', payload: true });
    },
  } as Component & { focusInput: () => void };
}
