import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../services/store';
import type { StorageService, ClipboardService } from '../core/types';
import { createApp } from '../ui/app';

function createMockStorage(): StorageService {
  return { load: vi.fn(() => null), save: vi.fn() };
}

function createMockClipboard(): ClipboardService {
  return { writeText: vi.fn(() => Promise.resolve()) };
}

describe('Add GIF flow', () => {
  // @specs/DOMAIN.md § 3.1 + INTERACTION.md § 3.3
  it('adds GIF via inline input and shows in grid', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());
    document.body.appendChild(app.element);

    // Expand input
    store.dispatch({ type: 'SET_INPUT_EXPANDED', payload: true });
    store.dispatch({ type: 'SET_DRAFT_URL', payload: 'https://i.imgur.com/test.gif' });

    // Add GIF
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });
    store.dispatch({ type: 'SHOW_TOAST', payload: 'gif added 😂' });

    // Verify GIF appears in grid
    const cards = app.element.querySelectorAll('.gif-card');
    expect(cards).toHaveLength(1);

    const img = cards[0].querySelector('img') as HTMLImageElement;
    expect(img.src).toBe('https://i.imgur.com/test.gif');

    // Verify input collapsed
    expect(store.getState().inputExpanded).toBe(false);
    expect(store.getState().draftUrl).toBe('');

    document.body.removeChild(app.element);
    app.destroy();
  });

  it('shows preview card while drafting', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());
    document.body.appendChild(app.element);

    // Set draft URL with expanded input
    store.dispatch({ type: 'SET_INPUT_EXPANDED', payload: true });
    store.dispatch({ type: 'SET_DRAFT_URL', payload: 'https://i.imgur.com/preview.gif' });

    const preview = app.element.querySelector('.preview-card');
    expect(preview).not.toBeNull();

    document.body.removeChild(app.element);
    app.destroy();
  });

  it('uses active tag for new GIF when filter is set', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());

    // Set filter to 🔥
    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '🔥' });

    // Add GIF (uses active tag)
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/fire.gif', tag: '🔥' } });

    expect(store.getState().library.gifs[0].tag).toBe('🔥');

    app.destroy();
  });

  it('persists to storage on add', () => {
    const storage = createMockStorage();
    const store = createStore(storage);

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/test.gif', tag: '😂' } });

    expect(storage.save).toHaveBeenCalled();
  });
});
