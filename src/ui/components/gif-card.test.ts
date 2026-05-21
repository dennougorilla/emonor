import { describe, it, expect, vi } from 'vitest';
import { createGifCard } from './gif-card';
import type { Store, GIF, ClipboardService, AppState } from '../../core/types';
import { DEFAULT_TAGS } from '../../core/constants';

function createMockStore(overrides: Partial<AppState> = {}): Store {
  const state: AppState = {
    library: { version: '1.0', tags: [...DEFAULT_TAGS], gifs: [] },
    activeTag: null,
    draftUrl: '',
    inputExpanded: false,
    draftPreviewStatus: 'idle',
    editMode: false,
    selectedGifIds: [],
    confirmDeleteId: null,
    toast: null,
    lastAddDuplicate: false,
    dataModalOpen: false,
    dataModalTab: 'edit',
    importPreview: null,
    aboutMode: false,
    ...overrides,
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
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    const img = card.element.querySelector('img');
    expect(img?.src).toBe('https://i.imgur.com/test.gif');
  });

  it('renders tag badge with correct emoji', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    const badge = card.element.querySelector('.gif-card__badge');
    expect(badge?.textContent).toBe('😂');
  });

  it('renders delete button', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    const del = card.element.querySelector('.gif-card__delete');
    expect(del?.textContent).toBe('❌');
  });

  // Normal mode: Card click = URL copy
  it('copies URL on card click in normal mode', () => {
    const store = createMockStore();
    const clipboard = createMockClipboard();
    const card = createGifCard(testGif, store, clipboard, false);

    card.element.click();

    expect(clipboard.writeText).toHaveBeenCalledWith('https://i.imgur.com/test.gif');
    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SHOW_TOAST',
      payload: 'copied to clipboard',
    });
  });

  // Edit mode: Card click = select
  it('dispatches SELECT_GIF on card click in edit mode', () => {
    const store = createMockStore({ editMode: true });
    const clipboard = createMockClipboard();
    const card = createGifCard(testGif, store, clipboard, false);

    card.element.click();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SELECT_GIF',
      payload: 'gif-1',
    });
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  // Badge click behavior
  it('dispatches ENTER_EDIT_MODE on badge click in normal mode', () => {
    const store = createMockStore();
    const card = createGifCard(testGif, store, createMockClipboard(), false);
    const badge = card.element.querySelector('.gif-card__badge') as HTMLElement;

    badge.click();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'ENTER_EDIT_MODE',
      payload: 'gif-1',
    });
  });

  it('dispatches SELECT_GIF on badge click in edit mode', () => {
    const store = createMockStore({ editMode: true });
    const card = createGifCard(testGif, store, createMockClipboard(), false);
    const badge = card.element.querySelector('.gif-card__badge') as HTMLElement;

    badge.click();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SELECT_GIF',
      payload: 'gif-1',
    });
  });

  it('badge click does not trigger card click handler', () => {
    const store = createMockStore();
    const clipboard = createMockClipboard();
    const card = createGifCard(testGif, store, clipboard, false);
    const badge = card.element.querySelector('.gif-card__badge') as HTMLElement;

    badge.click();

    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('badge is a button element with aria-label', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    const badge = card.element.querySelector('.gif-card__badge');
    expect(badge?.tagName).toBe('BUTTON');
    expect(badge?.getAttribute('aria-label')).toBe('Edit tag');
  });

  it('adds selected class when selected param is true', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), true);
    expect(card.element.classList.contains('gif-card--selected')).toBe(true);
  });

  it('does not add selected class when selected param is false', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    expect(card.element.classList.contains('gif-card--selected')).toBe(false);
  });

  // @specs/INTERACTION.md § 2.2 - Delete click = confirm dialog
  it('dispatches SHOW_CONFIRM_DELETE on delete click', () => {
    const store = createMockStore();
    const card = createGifCard(testGif, store, createMockClipboard(), false);
    const del = card.element.querySelector('.gif-card__delete') as HTMLElement;

    del.click();

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SHOW_CONFIRM_DELETE',
      payload: 'gif-1',
    });
  });

  it('has correct ARIA attributes', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    expect(card.element.getAttribute('role')).toBe('button');
    expect(card.element.getAttribute('tabindex')).toBe('0');
    expect(card.element.getAttribute('aria-label')).toBe('Copy GIF URL');
  });

  it('sets data-gif-id attribute', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    expect(card.element.dataset.gifId).toBe('gif-1');
  });

  // Layout stability: reserve aspect-ratio space before image loads
  it('sets img.decoding to async', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    const img = card.element.querySelector('img') as HTMLImageElement;
    expect(img.decoding).toBe('async');
  });

  it('sets inline aspect-ratio when gif has stored dimensions', () => {
    const gifWithDims: GIF = { ...testGif, width: 320, height: 240 };
    const card = createGifCard(gifWithDims, createMockStore(), createMockClipboard(), false);
    const img = card.element.querySelector('img') as HTMLImageElement;
    expect(img.style.aspectRatio).toBe('320 / 240');
  });

  it('does not set inline aspect-ratio when dimensions are unknown', () => {
    const card = createGifCard(testGif, createMockStore(), createMockClipboard(), false);
    const img = card.element.querySelector('img') as HTMLImageElement;
    expect(img.style.aspectRatio).toBe('');
  });

  it('dispatches SET_GIF_DIMENSIONS on image load when dimensions unknown', () => {
    const store = createMockStore();
    const card = createGifCard(testGif, store, createMockClipboard(), false);
    const img = card.element.querySelector('img') as HTMLImageElement;

    Object.defineProperty(img, 'naturalWidth', { value: 480, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 270, configurable: true });
    img.dispatchEvent(new Event('load'));

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SET_GIF_DIMENSIONS',
      payload: { id: 'gif-1', width: 480, height: 270 },
    });
    expect(img.style.aspectRatio).toBe('480 / 270');
  });

  it('does not dispatch SET_GIF_DIMENSIONS on image load when natural size is 0', () => {
    const store = createMockStore();
    const card = createGifCard(testGif, store, createMockClipboard(), false);
    const img = card.element.querySelector('img') as HTMLImageElement;

    Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 0, configurable: true });
    img.dispatchEvent(new Event('load'));

    const calls = (store.dispatch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.some(([action]) => action.type === 'SET_GIF_DIMENSIONS')).toBe(false);
  });

  it('does not attach load listener when dimensions are already known', () => {
    const gifWithDims: GIF = { ...testGif, width: 320, height: 240 };
    const store = createMockStore();
    const card = createGifCard(gifWithDims, store, createMockClipboard(), false);
    const img = card.element.querySelector('img') as HTMLImageElement;

    Object.defineProperty(img, 'naturalWidth', { value: 999, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 999, configurable: true });
    img.dispatchEvent(new Event('load'));

    const calls = (store.dispatch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.some(([action]) => action.type === 'SET_GIF_DIMENSIONS')).toBe(false);
  });
});
