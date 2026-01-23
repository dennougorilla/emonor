import { describe, it, expect, vi } from 'vitest';
import { createStore, reduce, createInitialState } from './store';
import type { AppState, Library, StorageService } from '../core/types';
import { DEFAULT_TAGS } from '../core/constants';

function createLibrary(overrides: Partial<Library> = {}): Library {
  return { version: '1.0', tags: [...DEFAULT_TAGS], gifs: [], ...overrides };
}

function createMockStorage(): StorageService {
  return { load: vi.fn(() => null), save: vi.fn() };
}

describe('createInitialState', () => {
  it('creates state with empty library when storage returns null', () => {
    const storage = createMockStorage();
    const state = createInitialState(storage);

    expect(state.library.gifs).toHaveLength(0);
    expect(state.library.tags).toEqual(DEFAULT_TAGS);
    expect(state.activeTag).toBeNull();
    expect(state.draftUrl).toBe('');
    expect(state.inputExpanded).toBe(false);
  });

  it('loads library from storage if available', () => {
    const saved = createLibrary({
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' }],
    });
    const storage: StorageService = { load: vi.fn(() => saved), save: vi.fn() };

    const state = createInitialState(storage);

    expect(state.library.gifs).toHaveLength(1);
  });
});

describe('reduce', () => {
  const baseState: AppState = {
    library: createLibrary(),
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

  it('ADD_GIF prepends gif to library', () => {
    const next = reduce(baseState, {
      type: 'ADD_GIF',
      payload: { url: 'https://i.imgur.com/new.gif', tag: '🔥' },
    });

    expect(next.library.gifs).toHaveLength(1);
    expect(next.library.gifs[0].tag).toBe('🔥');
    expect(next.draftUrl).toBe('');
    expect(next.inputExpanded).toBe(false);
    expect(next.lastAddDuplicate).toBe(false);
  });

  it('ADD_GIF sets lastAddDuplicate true for duplicate URLs', () => {
    const stateWithGif: AppState = {
      ...baseState,
      library: createLibrary({
        gifs: [{ id: 'x', url: 'https://i.imgur.com/exists.gif', tag: '😂' }],
      }),
    };

    const next = reduce(stateWithGif, {
      type: 'ADD_GIF',
      payload: { url: 'https://i.imgur.com/exists.gif', tag: '🔥' },
    });

    expect(next.lastAddDuplicate).toBe(true);
    expect(next.library.gifs).toHaveLength(1);
    expect(next.library.gifs[0].tag).toBe('😂');
  });

  it('ADD_GIF resets lastAddDuplicate after successful add', () => {
    const stateWithDup: AppState = { ...baseState, lastAddDuplicate: true };

    const next = reduce(stateWithDup, {
      type: 'ADD_GIF',
      payload: { url: 'https://i.imgur.com/fresh.gif', tag: '🔥' },
    });

    expect(next.lastAddDuplicate).toBe(false);
  });

  it('REMOVE_GIF removes gif by id', () => {
    const stateWithGif: AppState = {
      ...baseState,
      library: createLibrary({
        gifs: [{ id: 'x', url: 'https://i.imgur.com/x.gif', tag: '😂' }],
      }),
    };

    const next = reduce(stateWithGif, { type: 'REMOVE_GIF', payload: 'x' });

    expect(next.library.gifs).toHaveLength(0);
    expect(next.confirmDeleteId).toBeNull();
  });

  it('UPDATE_TAG changes gif tag', () => {
    const stateWithGif: AppState = {
      ...baseState,
      library: createLibrary({
        gifs: [{ id: 'x', url: 'https://i.imgur.com/x.gif', tag: '😂' }],
      }),
    };

    const next = reduce(stateWithGif, {
      type: 'UPDATE_TAG',
      payload: { id: 'x', tag: '🔥' },
    });

    expect(next.library.gifs[0].tag).toBe('🔥');
    expect(next.popoverGifId).toBeNull();
  });

  it('SET_ACTIVE_TAG toggles filter', () => {
    const next = reduce(baseState, { type: 'SET_ACTIVE_TAG', payload: '😂' });
    expect(next.activeTag).toBe('😂');

    const toggled = reduce(next, { type: 'SET_ACTIVE_TAG', payload: '😂' });
    expect(toggled.activeTag).toBeNull();
  });

  it('SET_ACTIVE_TAG switches to different tag', () => {
    const with_tag = reduce(baseState, { type: 'SET_ACTIVE_TAG', payload: '😂' });
    const switched = reduce(with_tag, { type: 'SET_ACTIVE_TAG', payload: '🔥' });
    expect(switched.activeTag).toBe('🔥');
  });

  it('SET_DRAFT_URL updates draft and resets preview status', () => {
    const loadingState: AppState = { ...baseState, draftPreviewStatus: 'loaded' };
    const next = reduce(loadingState, { type: 'SET_DRAFT_URL', payload: 'https://test.com' });
    expect(next.draftUrl).toBe('https://test.com');
    expect(next.draftPreviewStatus).toBe('idle');
  });

  it('SET_INPUT_EXPANDED true does not reset preview status', () => {
    const loadingState: AppState = { ...baseState, draftPreviewStatus: 'loading' };
    const next = reduce(loadingState, { type: 'SET_INPUT_EXPANDED', payload: true });
    expect(next.inputExpanded).toBe(true);
    expect(next.draftPreviewStatus).toBe('loading');
  });

  it('SET_INPUT_EXPANDED false resets preview status', () => {
    const loadingState: AppState = { ...baseState, inputExpanded: true, draftPreviewStatus: 'loaded' };
    const next = reduce(loadingState, { type: 'SET_INPUT_EXPANDED', payload: false });
    expect(next.inputExpanded).toBe(false);
    expect(next.draftPreviewStatus).toBe('idle');
  });

  it('SET_DRAFT_PREVIEW_STATUS updates status', () => {
    const next = reduce(baseState, { type: 'SET_DRAFT_PREVIEW_STATUS', payload: 'loading' });
    expect(next.draftPreviewStatus).toBe('loading');

    const loaded = reduce(next, { type: 'SET_DRAFT_PREVIEW_STATUS', payload: 'loaded' });
    expect(loaded.draftPreviewStatus).toBe('loaded');

    const error = reduce(baseState, { type: 'SET_DRAFT_PREVIEW_STATUS', payload: 'error' });
    expect(error.draftPreviewStatus).toBe('error');
  });

  it('ADD_GIF resets draftPreviewStatus to idle', () => {
    const loadedState: AppState = { ...baseState, draftPreviewStatus: 'loaded' };
    const next = reduce(loadedState, {
      type: 'ADD_GIF',
      payload: { url: 'https://i.imgur.com/new.gif', tag: '🔥' },
    });
    expect(next.draftPreviewStatus).toBe('idle');
  });

  it('SHOW_POPOVER sets popover gif id', () => {
    const next = reduce(baseState, { type: 'SHOW_POPOVER', payload: 'gif-1' });
    expect(next.popoverGifId).toBe('gif-1');
  });

  it('SHOW_CONFIRM_DELETE sets confirm delete id', () => {
    const next = reduce(baseState, { type: 'SHOW_CONFIRM_DELETE', payload: 'gif-1' });
    expect(next.confirmDeleteId).toBe('gif-1');
  });

  it('SHOW_TOAST with string payload sets variant to default', () => {
    const next = reduce(baseState, { type: 'SHOW_TOAST', payload: 'copied' });
    expect(next.toast).not.toBeNull();
    expect(next.toast!.text).toBe('copied');
    expect(next.toast!.variant).toBe('default');
  });

  it('SHOW_TOAST with object payload sets variant', () => {
    const next = reduce(baseState, { type: 'SHOW_TOAST', payload: { text: 'already saved 😂', variant: 'warning' } });
    expect(next.toast!.text).toBe('already saved 😂');
    expect(next.toast!.variant).toBe('warning');
  });

  it('SHOW_TOAST with object payload defaults variant to default', () => {
    const next = reduce(baseState, { type: 'SHOW_TOAST', payload: { text: 'hello' } });
    expect(next.toast!.variant).toBe('default');
  });

  it('HIDE_TOAST clears toast', () => {
    const withToast: AppState = { ...baseState, toast: { text: 'hi', id: 1, variant: 'default' } };
    const next = reduce(withToast, { type: 'HIDE_TOAST' });
    expect(next.toast).toBeNull();
  });

  it('IMPORT_LIBRARY merges imported library', () => {
    const imported = createLibrary({
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' }],
    });
    const next = reduce(baseState, { type: 'IMPORT_LIBRARY', payload: imported });
    expect(next.library.gifs).toHaveLength(1);
  });

  it('ADD_CUSTOM_TAG adds tag to library', () => {
    const next = reduce(baseState, {
      type: 'ADD_CUSTOM_TAG',
      payload: { emoji: '🎮', label: 'Gaming' },
    });
    expect(next.library.tags.find(t => t.emoji === '🎮')).toBeDefined();
  });

  it('REMOVE_CUSTOM_TAG removes tag from library', () => {
    const stateWithTag: AppState = {
      ...baseState,
      library: createLibrary({
        tags: [...DEFAULT_TAGS, { emoji: '🎮', label: 'Gaming' }],
      }),
    };
    const next = reduce(stateWithTag, { type: 'REMOVE_CUSTOM_TAG', payload: '🎮' });
    expect(next.library.tags.find(t => t.emoji === '🎮')).toBeUndefined();
  });

  it('APPLY_LIBRARY replaces entire library', () => {
    const newLibrary = createLibrary({
      gifs: [{ id: 'x', url: 'https://i.imgur.com/x.gif', tag: '🔥' }],
    });
    const next = reduce(baseState, { type: 'APPLY_LIBRARY', payload: newLibrary });
    expect(next.library).toBe(newLibrary);
  });

  it('SHOW_DATA_MODAL opens modal', () => {
    const next = reduce(baseState, { type: 'SHOW_DATA_MODAL', payload: true });
    expect(next.dataModalOpen).toBe(true);
  });

  it('SHOW_DATA_MODAL closing resets importPreview', () => {
    const withPreview: AppState = {
      ...baseState,
      dataModalOpen: true,
      importPreview: { importedGifsCount: 1, importedTagsCount: 7, currentGifsCount: 0, currentTagsCount: 7, parsedLibrary: createLibrary() },
    };
    const next = reduce(withPreview, { type: 'SHOW_DATA_MODAL', payload: false });
    expect(next.dataModalOpen).toBe(false);
    expect(next.importPreview).toBeNull();
  });

  it('SET_DATA_MODAL_TAB switches tab and clears importPreview', () => {
    const withPreview: AppState = {
      ...baseState,
      dataModalTab: 'import',
      importPreview: { importedGifsCount: 1, importedTagsCount: 7, currentGifsCount: 0, currentTagsCount: 7, parsedLibrary: createLibrary() },
    };
    const next = reduce(withPreview, { type: 'SET_DATA_MODAL_TAB', payload: 'edit' });
    expect(next.dataModalTab).toBe('edit');
    expect(next.importPreview).toBeNull();
  });

  it('SET_IMPORT_PREVIEW sets preview', () => {
    const preview = { importedGifsCount: 5, importedTagsCount: 8, currentGifsCount: 0, currentTagsCount: 7, parsedLibrary: createLibrary() };
    const next = reduce(baseState, { type: 'SET_IMPORT_PREVIEW', payload: preview });
    expect(next.importPreview).toBe(preview);
  });

  it('IMPORT_LIBRARY closes modal and clears preview', () => {
    const stateWithModal: AppState = {
      ...baseState,
      dataModalOpen: true,
      importPreview: { importedGifsCount: 1, importedTagsCount: 7, currentGifsCount: 0, currentTagsCount: 7, parsedLibrary: createLibrary() },
    };
    const imported = createLibrary({
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' }],
    });
    const next = reduce(stateWithModal, { type: 'IMPORT_LIBRARY', payload: imported });
    expect(next.dataModalOpen).toBe(false);
    expect(next.importPreview).toBeNull();
  });

  it('TOGGLE_ABOUT toggles aboutMode', () => {
    const next = reduce(baseState, { type: 'TOGGLE_ABOUT' });
    expect(next.aboutMode).toBe(true);

    const toggled = reduce(next, { type: 'TOGGLE_ABOUT' });
    expect(toggled.aboutMode).toBe(false);
  });

  it('TOGGLE_ABOUT closes open UI elements and resets preview status', () => {
    const openState: AppState = {
      ...baseState,
      popoverGifId: 'gif-1',
      inputExpanded: true,
      draftUrl: 'https://test.com',
      draftPreviewStatus: 'loaded',
      confirmDeleteId: 'gif-2',
    };

    const next = reduce(openState, { type: 'TOGGLE_ABOUT' });
    expect(next.popoverGifId).toBeNull();
    expect(next.inputExpanded).toBe(false);
    expect(next.draftUrl).toBe('');
    expect(next.draftPreviewStatus).toBe('idle');
    expect(next.confirmDeleteId).toBeNull();
  });

  it('does not mutate previous state', () => {
    const prev = { ...baseState };
    reduce(baseState, { type: 'SET_ACTIVE_TAG', payload: '😂' });
    expect(baseState.activeTag).toBeNull();
    expect(prev).toEqual(baseState);
  });
});

describe('createStore', () => {
  it('getState returns current state', () => {
    const storage = createMockStorage();
    const store = createStore(storage);

    expect(store.getState().library.gifs).toHaveLength(0);
  });

  it('dispatch updates state', () => {
    const storage = createMockStorage();
    const store = createStore(storage);

    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '😂' });

    expect(store.getState().activeTag).toBe('😂');
  });

  it('subscribe notifies on state change', () => {
    const storage = createMockStorage();
    const store = createStore(storage);
    const listener = vi.fn();

    store.subscribe(listener);
    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '😂' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ activeTag: '😂' }));
  });

  it('unsubscribe stops notifications', () => {
    const storage = createMockStorage();
    const store = createStore(storage);
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '😂' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('persists library changes to storage', () => {
    const storage = createMockStorage();
    const store = createStore(storage);

    store.dispatch({
      type: 'ADD_GIF',
      payload: { url: 'https://i.imgur.com/new.gif', tag: '😂' },
    });

    expect(storage.save).toHaveBeenCalled();
  });

  it('does not persist non-library changes to storage', () => {
    const storage = createMockStorage();
    const store = createStore(storage);

    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '😂' });

    expect(storage.save).not.toHaveBeenCalled();
  });
});
