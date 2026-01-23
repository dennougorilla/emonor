import { describe, it, expect, vi } from 'vitest';
import { createGifCard } from './gif-card';
import type { Store, GIF, ClipboardService, AppState } from '../../core/types';
import { DEFAULT_TAGS } from '../../core/constants';

function createMockStore(): Store {
  const state: AppState = {
    library: { version: '1.0', tags: [...DEFAULT_TAGS], gifs: [] },
    activeTag: null,
    draftUrl: '',
    inputExpanded: false,
    draftPreviewStatus: 'idle',
    popoverGifId: null,
    confirmDeleteId: null,
    toast: null,
    lastAddDuplicate: false,
    dataModalOpen: false,
    dataModalTab: 'edit',
    importPreview: null,
    aboutMode: false,
  };
  return {
    getState: () => state,
    dispatch: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  };
}

function createMockClipboard(): ClipboardService {
  return { writeText: vi.fn(() => Promise.resolve()) };
}

const testGif: GIF = { id: 'gif-1', url: 'https://i.imgur.com/test.gif', tag: '😂' };

describe('createGifCard', () => {
  // @specs/INTERACTION.md § 2.2 - GIF Card structure
  it('renders image with correct src', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard());
    const img = card.element.querySelector('img');
    expect(img?.src).toBe('https://i.imgur.com/test.gif');
  });

  it('renders tag badge with correct emoji', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard());
    const badge = card.element.querySelector('.gif-card__badge');
    expect(badge?.textContent).toBe('😂');
  });

  it('renders delete button', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard());
    const del = card.element.querySelector('.gif-card__delete');
    expect(del?.textContent).toBe('❌');
  });

  // @specs/INTERACTION.md § 2.2 - Card click = URL copy
  it('copies URL on card click (not on badge/delete)', () => {
    const store = createMockStore();
    const clipboard = createMockClipboard();
    const card = createGifCard(testGif, store, clipboard);

    card.element.click();

    expect(clipboard.writeText).toHaveBeenCalledWith('https://i.imgur.com/test.gif');
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SHOW_TOAST',
      payload: 'copied to clipboard',
    });
  });

  // @specs/INTERACTION.md § 2.2 - Badge click = popover
  it('dispatches SHOW_POPOVER on badge click', () => {
    const store = createMockStore();
    const card = createGifCard(testGif, store, createMockClipboard());
    const badge = card.element.querySelector('.gif-card__badge') as HTMLElement;

    badge.click();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SHOW_POPOVER',
      payload: 'gif-1',
    });
  });

  it('badge click does not trigger copy', () => {
    const clipboard = createMockClipboard();
    const card = createGifCard(testGif, createMockStore(), clipboard);
    const badge = card.element.querySelector('.gif-card__badge') as HTMLElement;

    badge.click();

    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  // @specs/INTERACTION.md § 2.2 - Delete click = confirm dialog
  it('dispatches SHOW_CONFIRM_DELETE on delete click', () => {
    const store = createMockStore();
    const card = createGifCard(testGif, store, createMockClipboard());
    const del = card.element.querySelector('.gif-card__delete') as HTMLElement;

    del.click();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SHOW_CONFIRM_DELETE',
      payload: 'gif-1',
    });
  });

  it('has correct ARIA attributes', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard());
    expect(card.element.getAttribute('role')).toBe('button');
    expect(card.element.getAttribute('tabindex')).toBe('0');
    expect(card.element.getAttribute('aria-label')).toBe('Copy GIF URL');
  });
});
