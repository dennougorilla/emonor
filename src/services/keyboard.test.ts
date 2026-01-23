import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupKeyboard } from './keyboard';
import type { Store, AppState } from '../core/types';
import { DEFAULT_TAGS } from '../core/constants';

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
    getState: vi.fn(() => state),
    dispatch: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  };
}

function pressKey(key: string, target?: HTMLElement): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  (target ?? document).dispatchEvent(event);
}

describe('setupKeyboard', () => {
  let cleanup: () => void;

  afterEach(() => {
    cleanup?.();
  });

  // @specs/INTERACTION.md § 4 - N focuses input
  it('N key calls onNewGif', () => {
    const store = createMockStore();
    const onNewGif = vi.fn();
    cleanup = setupKeyboard(store, { onNewGif });

    pressKey('n');

    expect(onNewGif).toHaveBeenCalledTimes(1);
  });

  it('N key (uppercase) calls onNewGif', () => {
    const store = createMockStore();
    const onNewGif = vi.fn();
    cleanup = setupKeyboard(store, { onNewGif });

    pressKey('N');

    expect(onNewGif).toHaveBeenCalledTimes(1);
  });

  // @specs/INTERACTION.md § 4 - 1-7 filters by tag
  it('number keys 1-7 set active tag', () => {
    const store = createMockStore();
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('1');

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SET_ACTIVE_TAG',
      payload: '😂',
    });
  });

  it('key 3 sets third tag', () => {
    const store = createMockStore();
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('3');

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SET_ACTIVE_TAG',
      payload: '❤️',
    });
  });

  // @specs/INTERACTION.md § 4 - 0 resets filter
  it('0 key resets filter', () => {
    const store = createMockStore();
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('0');

    expect(store.dispatch).toHaveBeenCalledWith({
      type: 'SET_ACTIVE_TAG',
      payload: null,
    });
  });

  // @specs/INTERACTION.md § 4 - Escape closes modals
  it('Escape closes data modal and confirm dialog', () => {
    const store = createMockStore();
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('Escape');

    expect(store.dispatch).toHaveBeenCalledWith({ type: 'SHOW_DATA_MODAL', payload: false });
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'SHOW_CONFIRM_DELETE', payload: null });
  });

  it('Escape exits edit mode', () => {
    const store = createMockStore({ editMode: true });
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('Escape');

    expect(store.dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_EDIT_MODE' });
    expect(store.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SHOW_CONFIRM_DELETE' })
    );
  });

  it('does not trigger shortcuts when typing in input', () => {
    const store = createMockStore();
    const onNewGif = vi.fn();
    cleanup = setupKeyboard(store, { onNewGif });

    const input = document.createElement('input');
    document.body.appendChild(input);
    pressKey('n', input);
    document.body.removeChild(input);

    expect(onNewGif).not.toHaveBeenCalled();
  });

  it('Escape in input collapses and blurs', () => {
    const store = createMockStore();
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    pressKey('Escape', input);
    document.body.removeChild(input);

    expect(store.dispatch).toHaveBeenCalledWith({ type: 'SET_INPUT_EXPANDED', payload: false });
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'SET_DRAFT_URL', payload: '' });
  });

  it('? key dispatches TOGGLE_ABOUT', () => {
    const store = createMockStore();
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('?');

    expect(store.dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_ABOUT' });
  });

  it('N key is disabled in aboutMode', () => {
    const store = createMockStore({ aboutMode: true });
    const onNewGif = vi.fn();
    cleanup = setupKeyboard(store, { onNewGif });

    pressKey('n');

    expect(onNewGif).not.toHaveBeenCalled();
  });

  it('number keys are disabled in aboutMode', () => {
    const store = createMockStore({ aboutMode: true });
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('1');

    expect(store.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ACTIVE_TAG' })
    );
  });

  it('0 key is disabled in aboutMode', () => {
    const store = createMockStore({ aboutMode: true });
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('0');

    expect(store.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ACTIVE_TAG' })
    );
  });

  it('Escape in aboutMode dispatches TOGGLE_ABOUT instead of closing overlays', () => {
    const store = createMockStore({ aboutMode: true });
    cleanup = setupKeyboard(store, { onNewGif: vi.fn() });

    pressKey('Escape');

    expect(store.dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_ABOUT' });
    expect(store.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SHOW_CONFIRM_DELETE' })
    );
  });

  it('cleanup removes event listener', () => {
    const store = createMockStore();
    const onNewGif = vi.fn();
    cleanup = setupKeyboard(store, { onNewGif });
    cleanup();

    pressKey('n');

    expect(onNewGif).not.toHaveBeenCalled();
  });
});
