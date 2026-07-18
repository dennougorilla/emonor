import type { AppState, Action, Store, Subscriber, StorageService, Library } from '../core/types';
import { DEFAULT_TAGS } from '../core/constants';
import { addGif, removeGif, updateTag, setGifDimensions } from '../core/gif-operations';
import { addCustomTag, removeCustomTag } from '../core/tag-operations';
import { replaceImport } from '../core/import-export';

let toastCounter = 0;
const DIMENSION_SAVE_DELAY_MS = 250;

function createDefaultLibrary(): Library {
  return { version: '1.0', tags: [...DEFAULT_TAGS], gifs: [] };
}

export function createInitialState(storage: StorageService): AppState {
  const library = storage.load() ?? createDefaultLibrary();
  return {
    library,
    activeTag: null,
    draftUrl: '',
    inputExpanded: false,
    draftPreviewStatus: 'idle' as const,
    editMode: false,
    selectedGifIds: [],
    confirmDeleteId: null,
    toast: null,
    lastAddDuplicate: false,
    dataModalOpen: false,
    dataModalTab: 'edit' as const,
    importPreview: null,
    aboutMode: false,
  };
}

export function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_GIF': {
      const result = addGif(state.library, action.payload.url, action.payload.tag);
      return { ...state, library: result.library, draftUrl: '', inputExpanded: false, draftPreviewStatus: 'idle', lastAddDuplicate: !result.added };
    }
    case 'REMOVE_GIF': {
      const library = removeGif(state.library, action.payload);
      return { ...state, library, confirmDeleteId: null };
    }
    case 'UPDATE_TAG': {
      const library = updateTag(state.library, action.payload.id, action.payload.tag);
      return { ...state, library };
    }
    case 'SET_GIF_DIMENSIONS': {
      const library = setGifDimensions(
        state.library,
        action.payload.id,
        action.payload.width,
        action.payload.height,
      );
      return { ...state, library };
    }
    case 'SET_ACTIVE_TAG': {
      const activeTag = state.activeTag === action.payload ? null : action.payload;
      return { ...state, activeTag };
    }
    case 'SET_DRAFT_URL':
      return { ...state, draftUrl: action.payload, draftPreviewStatus: 'idle' };
    case 'SET_INPUT_EXPANDED':
      return action.payload
        ? { ...state, inputExpanded: true }
        : { ...state, inputExpanded: false, draftPreviewStatus: 'idle' };
    case 'SET_DRAFT_PREVIEW_STATUS':
      return { ...state, draftPreviewStatus: action.payload };
    case 'TOGGLE_EDIT_MODE':
      return { ...state, editMode: !state.editMode, selectedGifIds: [] };
    case 'ENTER_EDIT_MODE':
      return { ...state, editMode: true, selectedGifIds: [action.payload] };
    case 'SELECT_GIF': {
      const id = action.payload;
      const selected = state.selectedGifIds.includes(id)
        ? state.selectedGifIds.filter(gid => gid !== id)
        : [...state.selectedGifIds, id];
      return { ...state, selectedGifIds: selected };
    }
    case 'ASSIGN_TAG': {
      const tag = action.payload;
      const selectedSet = new Set(state.selectedGifIds);
      const gifs = state.library.gifs.map(g =>
        selectedSet.has(g.id) ? { ...g, tag } : g
      );
      return {
        ...state,
        library: { ...state.library, gifs },
        selectedGifIds: [],
        editMode: false,
      };
    }
    case 'SHOW_CONFIRM_DELETE':
      return { ...state, confirmDeleteId: action.payload };
    case 'SHOW_TOAST': {
      const p = action.payload;
      const text = typeof p === 'string' ? p : p.text;
      const variant = typeof p === 'string' ? 'default' as const : (p.variant ?? 'default' as const);
      return { ...state, toast: { text, id: ++toastCounter, variant } };
    }
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    case 'IMPORT_LIBRARY': {
      const library = replaceImport(action.payload);
      const activeTag = state.activeTag && library.tags.some(tag => tag.emoji === state.activeTag)
        ? state.activeTag
        : null;
      return { ...state, library, activeTag, dataModalOpen: false, importPreview: null };
    }
    case 'APPLY_LIBRARY': {
      const library = replaceImport(action.payload);
      const activeTag = state.activeTag && library.tags.some(tag => tag.emoji === state.activeTag)
        ? state.activeTag
        : null;
      return { ...state, library, activeTag };
    }
    case 'SHOW_DATA_MODAL':
      return { ...state, dataModalOpen: action.payload, importPreview: action.payload ? state.importPreview : null };
    case 'SET_DATA_MODAL_TAB':
      return { ...state, dataModalTab: action.payload, importPreview: null };
    case 'SET_IMPORT_PREVIEW':
      return { ...state, importPreview: action.payload };
    case 'ADD_CUSTOM_TAG': {
      const library = addCustomTag(state.library, action.payload.emoji, action.payload.label);
      return { ...state, library };
    }
    case 'REMOVE_CUSTOM_TAG': {
      const library = removeCustomTag(state.library, action.payload);
      return { ...state, library };
    }
    case 'TOGGLE_ABOUT':
      return {
        ...state,
        aboutMode: !state.aboutMode,
        editMode: false,
        selectedGifIds: [],
        inputExpanded: false,
        draftUrl: '',
        draftPreviewStatus: 'idle',
        confirmDeleteId: null,
      };
  }
}

export function createStore(storage: StorageService): Store {
  let state = createInitialState(storage);
  let lastPersistedLibrary = state.library;
  let dimensionSaveTimer: ReturnType<typeof setTimeout> | null = null;
  const subscribers = new Set<Subscriber>();

  function notify(): void {
    subscribers.forEach(fn => fn(state));
  }

  function persist(library: Library): boolean {
    try {
      return storage.save(library) !== false;
    } catch {
      return false;
    }
  }

  function withPersistenceError(baseState: AppState): AppState {
    return {
      ...baseState,
      library: lastPersistedLibrary,
      toast: {
        text: 'storage unavailable — changes not saved',
        id: ++toastCounter,
        variant: 'warning',
      },
    };
  }

  function cancelDimensionSave(): void {
    if (dimensionSaveTimer) {
      clearTimeout(dimensionSaveTimer);
      dimensionSaveTimer = null;
    }
  }

  function scheduleDimensionSave(): void {
    cancelDimensionSave();
    dimensionSaveTimer = setTimeout(() => {
      dimensionSaveTimer = null;
      if (persist(state.library)) {
        lastPersistedLibrary = state.library;
        return;
      }
      state = withPersistenceError(state);
      notify();
    }, DIMENSION_SAVE_DELAY_MS);
  }

  return {
    getState: () => state,
    dispatch: (action: Action) => {
      const previousState = state;
      const previousLibrary = previousState.library;
      const nextState = reduce(previousState, action);
      const libraryChanged = nextState.library !== previousLibrary;

      if (libraryChanged && action.type === 'SET_GIF_DIMENSIONS') {
        state = nextState;
        scheduleDimensionSave();
        notify();
        return true;
      }

      if (libraryChanged) {
        cancelDimensionSave();
        if (!persist(nextState.library)) {
          state = withPersistenceError(previousState);
          notify();
          return false;
        }
        lastPersistedLibrary = nextState.library;
      }

      state = nextState;
      notify();
      return true;
    },
    subscribe: (fn: Subscriber) => {
      subscribers.add(fn);
      return () => { subscribers.delete(fn); };
    },
  };
}
