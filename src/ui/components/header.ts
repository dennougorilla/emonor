import type { AppState, Store } from '../../core/types';
import type { Component } from './toast';
import { isValidGifUrl } from '../../core/validators';

type ActionButtonMode = 'edit' | 'confirm' | 'clear' | 'add';

function getActionButtonMode(state: AppState): ActionButtonMode {
  if (state.editMode) return 'confirm';
  if (state.inputExpanded) {
    if (state.draftPreviewStatus === 'loaded' && state.draftUrl.trim()) return 'add';
    return 'clear';
  }
  return 'edit';
}

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

  // Edit mode hint (shown when editMode is active)
  const editHint = document.createElement('div');
  editHint.className = 'header__edit-hint';
  editHint.style.display = 'none';
  top.appendChild(editHint);

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

  // Context action button (right-aligned)
  const actionBtn = document.createElement('button');
  actionBtn.className = 'header__action-btn';
  actionBtn.textContent = '✏️';
  actionBtn.setAttribute('aria-label', 'Enter edit mode');
  top.appendChild(actionBtn);

  header.appendChild(top);

  function handleAddGif(): void {
    const url = field.value.trim();
    if (!url) return;

    if (!isValidGifUrl(url)) {
      store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'invalid url format', variant: 'warning' } });
      return;
    }

    const currentState = store.getState();
    if (currentState.draftPreviewStatus === 'error') {
      store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'failed to load', variant: 'warning' } });
      return;
    }
    if (currentState.draftPreviewStatus !== 'loaded') {
      store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'waiting for preview', variant: 'warning' } });
      return;
    }

    const tag = currentState.activeTag ?? '📂';
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

  actionBtn.addEventListener('click', () => {
    const currentState = store.getState();
    const mode = getActionButtonMode(currentState);
    switch (mode) {
      case 'edit':
      case 'confirm':
        store.dispatch({ type: 'TOGGLE_EDIT_MODE' });
        break;
      case 'clear':
        store.dispatch({ type: 'SET_INPUT_EXPANDED', payload: false });
        store.dispatch({ type: 'SET_DRAFT_URL', payload: '' });
        break;
      case 'add':
        handleAddGif();
        break;
    }
  });

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
      handleAddGif();
    }
    if (e.key === 'Escape') {
      store.dispatch({ type: 'SET_INPUT_EXPANDED', payload: false });
      store.dispatch({ type: 'SET_DRAFT_URL', payload: '' });
      field.blur();
    }
  });

  // Subscribe to expanded state, aboutMode, editMode, and action button
  let prevExpanded = false;
  let prevAboutMode = false;
  let prevEditMode = false;
  let prevActionMode: ActionButtonMode = 'edit';
  const unsubscribe = store.subscribe((state) => {
    // Logo active state for about mode
    if (state.aboutMode !== prevAboutMode) {
      prevAboutMode = state.aboutMode;
      logo.classList.toggle('header__logo--active', state.aboutMode);
      wrap.style.display = state.aboutMode ? 'none' : '';
      actionBtn.style.display = state.aboutMode ? 'none' : '';
    }

    // Edit mode: hint visibility + wrap toggle
    if (state.editMode !== prevEditMode) {
      prevEditMode = state.editMode;
      wrap.style.display = state.editMode ? 'none' : '';
      editHint.style.display = state.editMode ? '' : 'none';
    }

    if (state.editMode) {
      const n = state.selectedGifIds.length;
      editHint.textContent = n === 0
        ? '> select gifs'
        : `> ${n} selected \u00B7 tap tag to assign`;
    }

    // Action button state machine
    const actionMode = getActionButtonMode(state);
    if (actionMode !== prevActionMode) {
      prevActionMode = actionMode;
      switch (actionMode) {
        case 'edit':
          actionBtn.textContent = '✏️';
          actionBtn.className = 'header__action-btn';
          actionBtn.setAttribute('aria-label', 'Enter edit mode');
          break;
        case 'confirm':
          actionBtn.textContent = '✓';
          actionBtn.className = 'header__action-btn header__action-btn--confirm';
          actionBtn.setAttribute('aria-label', 'Exit edit mode');
          break;
        case 'clear':
          actionBtn.textContent = '×';
          actionBtn.className = 'header__action-btn header__action-btn--clear';
          actionBtn.setAttribute('aria-label', 'Clear input');
          break;
        case 'add':
          actionBtn.textContent = '+';
          actionBtn.className = 'header__action-btn header__action-btn--add';
          actionBtn.setAttribute('aria-label', 'Add GIF');
          break;
      }
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
