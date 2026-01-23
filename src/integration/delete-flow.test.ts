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

describe('Delete flow', () => {
  // @specs/INTERACTION.md § 3.5
  it('shows confirm dialog when delete clicked', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());
    document.body.appendChild(app.element);

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/del.gif', tag: '😂' } });
    const gifId = store.getState().library.gifs[0].id;

    // Trigger delete confirmation
    store.dispatch({ type: 'SHOW_CONFIRM_DELETE', payload: gifId });

    const overlay = app.element.querySelector('.confirm-overlay') as HTMLElement;
    expect(overlay.style.display).toBe('flex');

    document.body.removeChild(app.element);
    app.destroy();
  });

  it('removes GIF on confirm', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());
    document.body.appendChild(app.element);

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/del.gif', tag: '😂' } });
    const gifId = store.getState().library.gifs[0].id;

    // Confirm delete
    store.dispatch({ type: 'REMOVE_GIF', payload: gifId });
    store.dispatch({ type: 'SHOW_TOAST', payload: 'removed' });

    expect(store.getState().library.gifs).toHaveLength(0);

    const cards = app.element.querySelectorAll('.gif-card');
    expect(cards).toHaveLength(0);

    document.body.removeChild(app.element);
    app.destroy();
  });

  it('hides dialog on cancel', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());
    document.body.appendChild(app.element);

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/del.gif', tag: '😂' } });
    const gifId = store.getState().library.gifs[0].id;

    // Show then cancel
    store.dispatch({ type: 'SHOW_CONFIRM_DELETE', payload: gifId });
    store.dispatch({ type: 'SHOW_CONFIRM_DELETE', payload: null });

    const overlay = app.element.querySelector('.confirm-overlay') as HTMLElement;
    expect(overlay.style.display).toBe('none');

    // GIF still exists
    expect(store.getState().library.gifs).toHaveLength(1);

    document.body.removeChild(app.element);
    app.destroy();
  });
});
