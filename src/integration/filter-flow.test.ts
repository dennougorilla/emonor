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

describe('Filter flow', () => {
  // @specs/INTERACTION.md § 3.1
  it('filters GIFs by tag', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());
    document.body.appendChild(app.element);

    // Add GIFs with different tags
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/1.gif', tag: '😂' } });
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/2.gif', tag: '🔥' } });
    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/3.gif', tag: '😂' } });

    // All visible initially
    let cards = app.element.querySelectorAll('.gif-card');
    expect(cards).toHaveLength(3);

    // Filter by 😂
    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '😂' });
    cards = app.element.querySelectorAll('.gif-card');
    expect(cards).toHaveLength(2);

    // Clear filter
    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '😂' }); // toggle off
    cards = app.element.querySelectorAll('.gif-card');
    expect(cards).toHaveLength(3);

    document.body.removeChild(app.element);
    app.destroy();
  });

  it('shows empty state when no GIFs match filter', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());
    document.body.appendChild(app.element);

    store.dispatch({ type: 'ADD_GIF', payload: { url: 'https://i.imgur.com/1.gif', tag: '😂' } });

    // Filter by tag with no GIFs
    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '🔥' });

    const empty = app.element.querySelector('.empty-state');
    expect(empty).not.toBeNull();

    document.body.removeChild(app.element);
    app.destroy();
  });

  it('highlights active tag chip', () => {
    const store = createStore(createMockStorage());
    const app = createApp(store, createMockClipboard());
    document.body.appendChild(app.element);

    store.dispatch({ type: 'SET_ACTIVE_TAG', payload: '😂' });

    const activeChip = app.element.querySelector('.tag-chip--active');
    expect(activeChip).not.toBeNull();
    expect(activeChip?.textContent).toBe('😂');

    document.body.removeChild(app.element);
    app.destroy();
  });
});
