import type { Store, ClipboardService, GIF } from '../../core/types';
import type { Component } from './toast';
import { filterByTag } from '../../core/gif-operations';
import { isValidGifUrl } from '../../core/validators';
import { ABOUT_CARDS } from '../../core/constants';
import { createGifCard } from './gif-card';
import { createAboutCard } from './about-card';
import { createEmptyState } from './empty-state';
import { createPreviewCard } from './preview-card';
import { createPopover } from './popover';

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
  let prevPopoverGifId: string | null | symbol = INITIAL;
  let prevAboutMode = false;
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

    for (const gif of visible) {
      const card = createGifCard(gif, store, clipboard);
      el.appendChild(card.element);
      childDestroys.push(card.destroy);

      // Popover if active for this GIF (portal pattern to avoid CSS columns bug)
      if (state.popoverGifId === gif.id) {
        const popover = createPopover(gif, store);
        const badge = card.element.querySelector('.gif-card__badge') as HTMLElement;
        document.body.appendChild(popover.element);

        // Position above badge using fixed coordinates
        const badgeRect = badge.getBoundingClientRect();
        popover.element.style.left = `${badgeRect.left}px`;
        popover.element.style.top = `${badgeRect.top - popover.element.offsetHeight - 4}px`;

        childDestroys.push(() => {
          popover.destroy();
          popover.element.remove();
        });
      }
    }
  }

  const unsubscribe = store.subscribe((state) => {
    const gifsChanged = state.library.gifs !== prevGifs;
    const tagChanged = state.activeTag !== prevActiveTag;
    const draftChanged = state.draftUrl !== prevDraftUrl;
    const popoverChanged = state.popoverGifId !== prevPopoverGifId;
    const aboutChanged = state.aboutMode !== prevAboutMode;

    if (gifsChanged || tagChanged || draftChanged || popoverChanged || aboutChanged) {
      prevGifs = state.library.gifs;
      prevActiveTag = state.activeTag;
      prevDraftUrl = state.draftUrl;
      prevPopoverGifId = state.popoverGifId;
      prevAboutMode = state.aboutMode;
      rebuild();
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
