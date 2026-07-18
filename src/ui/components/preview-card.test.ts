import { describe, expect, it, vi } from 'vitest';
import type { Action, AppState, Store, Subscriber } from '../../core/types';
import { DEFAULT_TAGS } from '../../core/constants';
import { reduce } from '../../services/store';
import { createPreviewCard } from './preview-card';

const URL_A = 'https://i.imgur.com/a.gif';
const URL_B = 'https://i.imgur.com/b.gif';

function createTestStore(draftUrl = URL_A): Store {
  let state: AppState = {
    library: { version: '1.0', tags: [...DEFAULT_TAGS], gifs: [] },
    activeTag: null,
    draftUrl,
    inputExpanded: true,
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
  };
  const subscribers = new Set<Subscriber>();
  const dispatch = vi.fn((action: Action) => {
    state = reduce(state, action);
    subscribers.forEach(fn => fn(state));
    return true;
  });
  return {
    getState: () => state,
    dispatch,
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}

describe('createPreviewCard', () => {
  it('marks only the current draft as loaded and enables ADD', () => {
    const store = createTestStore();
    const preview = createPreviewCard(URL_A, '📂', store);
    const img = preview.element.querySelector('img') as HTMLImageElement;
    const button = preview.element.querySelector('button') as HTMLButtonElement;

    expect(store.getState().draftPreviewStatus).toBe('loading');
    expect(button.disabled).toBe(true);

    img.dispatchEvent(new Event('load'));

    expect(store.getState().draftPreviewStatus).toBe('loaded');
    expect(button.disabled).toBe(false);
  });

  it('ignores a stale load event after the draft URL changes', () => {
    const store = createTestStore();
    const preview = createPreviewCard(URL_A, '📂', store);
    const img = preview.element.querySelector('img') as HTMLImageElement;

    store.dispatch({ type: 'SET_DRAFT_URL', payload: URL_B });
    img.dispatchEvent(new Event('load'));

    expect(store.getState().draftUrl).toBe(URL_B);
    expect(store.getState().draftPreviewStatus).toBe('idle');
  });

  it('ignores load and error events after destroy', () => {
    const store = createTestStore();
    const preview = createPreviewCard(URL_A, '📂', store);
    const img = preview.element.querySelector('img') as HTMLImageElement;

    preview.destroy();
    const status = store.getState().draftPreviewStatus;
    img.dispatchEvent(new Event('load'));
    img.dispatchEvent(new Event('error'));

    expect(store.getState().draftPreviewStatus).toBe(status);
    expect(img.hasAttribute('src')).toBe(false);
  });

  it('shows an error only for the current draft', () => {
    const store = createTestStore();
    const preview = createPreviewCard(URL_A, '📂', store);
    const img = preview.element.querySelector('img') as HTMLImageElement;
    const error = preview.element.querySelector('.preview-card__error') as HTMLElement;

    img.dispatchEvent(new Event('error'));

    expect(store.getState().draftPreviewStatus).toBe('error');
    expect(error.style.display).toBe('flex');
  });
});
