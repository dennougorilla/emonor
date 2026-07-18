import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClipboardService, GIF, Library, StorageService } from '../../core/types';
import { DEFAULT_TAGS } from '../../core/constants';
import { createStore } from '../../services/store';
import { createGifGrid, haveGifCardsChanged } from './gif-grid';

const baseGif: GIF = {
  id: 'gif-1',
  url: 'https://i.imgur.com/one.gif',
  tag: '😂',
};

function createStorage(gifs: readonly GIF[] = [baseGif]): StorageService {
  const library: Library = { version: '1.0', tags: [...DEFAULT_TAGS], gifs };
  return {
    load: vi.fn(() => library),
    save: vi.fn(() => true),
  };
}

const clipboard: ClipboardService = { writeText: vi.fn(() => Promise.resolve()) };

afterEach(() => {
  vi.useRealTimers();
});

describe('haveGifCardsChanged', () => {
  it('ignores dimension-only changes', () => {
    expect(haveGifCardsChanged([baseGif], [{ ...baseGif, width: 320, height: 240 }])).toBe(false);
  });

  it('detects structural and rendered-content changes', () => {
    expect(haveGifCardsChanged([baseGif], [])).toBe(true);
    expect(haveGifCardsChanged([baseGif], [{ ...baseGif, tag: '🔥' }])).toBe(true);
    expect(haveGifCardsChanged([baseGif], [{ ...baseGif, url: 'https://i.imgur.com/two.gif' }])).toBe(true);
  });
});

describe('createGifGrid', () => {
  it('keeps the existing card when dimensions are captured', () => {
    vi.useFakeTimers();
    const storage = createStorage();
    const store = createStore(storage);
    const grid = createGifGrid(store, clipboard);
    const originalCard = grid.element.querySelector('[data-gif-id="gif-1"]');

    store.dispatch({
      type: 'SET_GIF_DIMENSIONS',
      payload: { id: 'gif-1', width: 320, height: 240 },
    });

    expect(grid.element.querySelector('[data-gif-id="gif-1"]')).toBe(originalCard);
    expect(storage.save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(storage.save).toHaveBeenCalledTimes(1);
    grid.destroy();
  });

  it('updates selection styling and ARIA without replacing the card', () => {
    const store = createStore(createStorage());
    const grid = createGifGrid(store, clipboard);
    const card = grid.element.querySelector('[data-gif-id="gif-1"]') as HTMLElement;

    store.dispatch({ type: 'TOGGLE_EDIT_MODE' });
    const editCard = grid.element.querySelector('[data-gif-id="gif-1"]') as HTMLElement;
    store.dispatch({ type: 'SELECT_GIF', payload: 'gif-1' });

    expect(editCard).not.toBe(card);
    expect(grid.element.querySelector('[data-gif-id="gif-1"]')).toBe(editCard);
    expect(editCard.classList.contains('gif-card--selected')).toBe(true);
    expect(editCard.getAttribute('aria-pressed')).toBe('true');
    grid.destroy();
  });
});
