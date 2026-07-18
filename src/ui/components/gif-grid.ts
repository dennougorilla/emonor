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

/** Dimensions are metadata; they do not require replacing the rendered cards. */
export function haveGifCardsChanged(previous: readonly GIF[], next: readonly GIF[]): boolean {
  if (previous.length !== next.length) return true;
  return previous.some((gif, index) => {
    const candidate = next[index];
    return !candidate ||
      gif.id !== candidate.id ||
      gif.url !== candidate.url ||
      gif.tag !== candidate.tag;
  });
}

// @specs/INTERACTION.md § 1.3 - Masonry grid
export function createGifGrid(store: Store, clipboard: ClipboardService): Component {
  const el = document.createElement('div');
  el.className = 'gif-grid';

  let prevGifs: readonly GIF[] = [];
  let prevActiveTag: string | null = null;
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
    const findCard = (id: string): HTMLElement | undefined =>
      Array.from(el.querySelectorAll<HTMLElement>('[data-gif-id]'))
        .find(card => card.dataset.gifId === id);

    // Remove selection from cards no longer selected
    for (const id of oldIds) {
      if (!newSet.has(id)) {
        const card = findCard(id);
        card?.classList.remove('gif-card--selected');
        card?.setAttribute('aria-pressed', 'false');
      }
    }

    // Add selection to newly selected cards
    for (const id of newIds) {
      if (!oldSet.has(id)) {
        const card = findCard(id);
        card?.classList.add('gif-card--selected');
        card?.setAttribute('aria-pressed', 'true');
      }
    }
  }

  rebuild();
  const initialState = store.getState();
  prevGifs = initialState.library.gifs;
  prevActiveTag = initialState.activeTag;
  prevDraftUrl = initialState.draftUrl;
  prevAboutMode = initialState.aboutMode;
  prevEditMode = initialState.editMode;
  prevSelectedGifIds = initialState.selectedGifIds;

  const unsubscribe = store.subscribe((state) => {
    const gifsChanged = haveGifCardsChanged(prevGifs, state.library.gifs);
    const tagChanged = state.activeTag !== prevActiveTag;
    const draftChanged = state.draftUrl !== prevDraftUrl;
    const aboutChanged = state.aboutMode !== prevAboutMode;
    const editModeChanged = state.editMode !== prevEditMode;
    const selectionChanged = state.selectedGifIds !== prevSelectedGifIds;

    if (gifsChanged || tagChanged || draftChanged || aboutChanged || editModeChanged) {
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
    prevGifs = state.library.gifs;
  });

  return {
    element: el,
    destroy: () => {
      unsubscribe();
      childDestroys.forEach(fn => fn());
    },
  };
}
