import type { Store, ClipboardService, GIF } from '../../core/types';
import type { Component } from './toast';
import { filterByTag } from '../../core/gif-operations';
import { isValidGifUrl } from '../../core/validators';
import { ABOUT_CARDS } from '../../core/constants';
import { createGifCard } from './gif-card';
import { createAboutCard } from './about-card';
import { createEmptyState } from './empty-state';
import { createPreviewCard } from './preview-card';

function clearElement(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

// @specs/INTERACTION.md § 1.3 - Masonry grid
export function createGifGrid(store: Store, clipboard: ClipboardService): Component {
  const el = document.createElement('div');
  el.className = 'gif-grid';

  const INITIAL = Symbol('initial');
  let prevGifs: readonly GIF[] = [];
  let prevActiveTag: string | null | symbol = INITIAL;
  let prevDraftUrl = '';
  let prevAboutMode = false;
  let prevEditMode = false;
  let prevSelectedGifIds: readonly string[] = [];
  let childDestroys: (() => void)[] = [];

  function rebuild(): void {
    childDestroys.forEach(fn => fn());
    childDestroys = [];
    clearElement(el);

    const state = store.getState();

    // About mode: show about cards instead of GIFs
    if (state.aboutMode) {
      for (const card of ABOUT_CARDS) {
        const aboutCard = createAboutCard(card);
        el.appendChild(aboutCard.element);
        childDestroys.push(aboutCard.destroy);
      }
      return;
    }

    // Preview card (if drafting with valid URL)
    if (state.draftUrl && state.inputExpanded && isValidGifUrl(state.draftUrl)) {
      const tag = state.activeTag ?? '📂';
      const preview = createPreviewCard(state.draftUrl, tag, store);
      el.appendChild(preview.element);
      childDestroys.push(preview.destroy);
    }

    // Filtered GIFs
    const visible = filterByTag(state.library.gifs, state.activeTag);

    if (visible.length === 0 && !state.draftUrl) {
      const empty = createEmptyState({ isFiltered: state.activeTag !== null });
      el.appendChild(empty.element);
      return;
    }

    const selectedSet = new Set(state.selectedGifIds);
    for (const gif of visible) {
      const card = createGifCard(gif, store, clipboard, selectedSet.has(gif.id));
      el.appendChild(card.element);
      childDestroys.push(card.destroy);
    }
  }

  // Lightweight selection update — toggles CSS classes without rebuilding DOM
  function updateSelection(newIds: readonly string[], oldIds: readonly string[]): void {
    const newSet = new Set(newIds);
    const oldSet = new Set(oldIds);

    // Remove selection from cards no longer selected
    for (const id of oldIds) {
      if (!newSet.has(id)) {
        const card = el.querySelector(`[data-gif-id="${id}"]`);
        card?.classList.remove('gif-card--selected');
      }
    }

    // Add selection to newly selected cards
    for (const id of newIds) {
      if (!oldSet.has(id)) {
        const card = el.querySelector(`[data-gif-id="${id}"]`);
        card?.classList.add('gif-card--selected');
      }
    }
  }

  const unsubscribe = store.subscribe((state) => {
    const gifsChanged = state.library.gifs !== prevGifs;
    const tagChanged = state.activeTag !== prevActiveTag;
    const draftChanged = state.draftUrl !== prevDraftUrl;
    const aboutChanged = state.aboutMode !== prevAboutMode;
    const editModeChanged = state.editMode !== prevEditMode;
    const selectionChanged = state.selectedGifIds !== prevSelectedGifIds;

    if (gifsChanged || tagChanged || draftChanged || aboutChanged || editModeChanged) {
      prevGifs = state.library.gifs;
      prevActiveTag = state.activeTag;
      prevDraftUrl = state.draftUrl;
      prevAboutMode = state.aboutMode;
      prevEditMode = state.editMode;
      prevSelectedGifIds = state.selectedGifIds;
      rebuild();
    } else if (selectionChanged) {
      updateSelection(state.selectedGifIds, prevSelectedGifIds);
      prevSelectedGifIds = state.selectedGifIds;
    }
  });

  rebuild();

  return {
    element: el,
    destroy: () => {
      unsubscribe();
      childDestroys.forEach(fn => fn());
    },
  };
}
