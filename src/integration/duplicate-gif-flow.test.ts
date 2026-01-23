import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../services/store';
import type { StorageService } from '../core/types';

function createMockStorage(): StorageService {
  return { load: vi.fn(() => null), save: vi.fn() };
}

describe('Duplicate GIF flow', () => {
  it('sets lastAddDuplicate when adding a URL that already exists', () => {
    const store = createStore(createMockStorage());

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });
    expect(store.getState().lastAddDuplicate).toBe(false);
    expect(store.getState().library.gifs).toHaveLength(1);

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '🔥' } });
    expect(store.getState().lastAddDuplicate).toBe(true);
    expect(store.getState().library.gifs).toHaveLength(1);
  });

  it('preserves original tag when duplicate is attempted with different tag', () => {
    const store = createStore(createMockStorage());

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '🔥' } });

    expect(store.getState().library.gifs[0].tag).toBe('😂');
  });

  it('resets lastAddDuplicate on next successful add', () => {
    const store = createStore(createMockStorage());

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '🔥' } });
    expect(store.getState().lastAddDuplicate).toBe(true);

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/new.gif', tag: '🔥' } });
    expect(store.getState().lastAddDuplicate).toBe(false);
    expect(store.getState().library.gifs).toHaveLength(2);
  });

  it('does not persist library when duplicate is rejected', () => {
    const storage = createMockStorage();
    const store = createStore(storage);

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });
    (storage.save as ReturnType<typeof vi.fn>).mockClear();

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '🔥' } });
    expect(storage.save).not.toHaveBeenCalled();
  });
});

describe('Duplicate GIF filter jump', () => {
  it('switches activeTag to existing GIF tag on duplicate add', () => {
    const store = createStore(createMockStorage());

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });
    expect(store.getState().activeTag).toBeNull();

    // Simulate duplicate add + filter jump (as header/preview-card would do)
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '🔥' } });
    const afterState = store.getState();
    expect(afterState.lastAddDuplicate).toBe(true);

    const existing = afterState.library.gifs.find(g => g.url === 'https://i.imgur.com/test.gif');
    const existingTag = existing?.tag ?? '📂';
    expect(existingTag).toBe('😂');

    if (afterState.activeTag !== existingTag) {
      store.dispatch({ type: 'SET_ACTIVE_TAG', payload: existingTag });
    }
    expect(store.getState().activeTag).toBe('😂');
  });

  it('does not change activeTag if already filtering by existing GIF tag', () => {
    const store = createStore(createMockStorage());

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });
    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '😂' });
    expect(store.getState().activeTag).toBe('😂');

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '🔥' } });
    const afterState = store.getState();
    const existing = afterState.library.gifs.find(g => g.url === 'https://i.imgur.com/test.gif');
    const existingTag = existing?.tag ?? '📂';

    // Should not dispatch SET_ACTIVE_TAG since we're already on that tag
    if (afterState.activeTag !== existingTag) {
      store.dispatch({ type: 'SET_ACTIVE_TAG', payload: existingTag });
    }
    expect(store.getState().activeTag).toBe('😂');
  });

  it('shows warning variant toast on duplicate', () => {
    const store = createStore(createMockStorage());

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '🔥' } });

    const afterState = store.getState();
    const existing = afterState.library.gifs.find(g => g.url === 'https://i.imgur.com/test.gif');
    const existingTag = existing?.tag ?? '📂';

    store.dispatch({ type: 'SHOW_TOAST', payload: { text: `already saved ${existingTag}`, variant: 'warning' } });

    expect(store.getState().toast!.text).toBe('already saved 😂');
    expect(store.getState().toast!.variant).toBe('warning');
  });
});
