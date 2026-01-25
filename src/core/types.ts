// @specs/DOMAIN.md § 2.1 - GIF entity
export interface GIF {
  readonly id: string;
  readonly url: string;
  readonly tag: string;
}

// @specs/DOMAIN.md § 2.1 - EmojiTag entity
export interface EmojiTag {
  readonly emoji: string;
  readonly label: string;
}

// Result of addGif operation (explicit success/duplicate signal)
export interface AddGifResult {
  readonly library: Library;
  readonly added: boolean;
}

// Import preview stats for data modal
export interface ImportPreview {
  readonly importedGifsCount: number;
  readonly importedTagsCount: number;
  readonly currentGifsCount: number;
  readonly currentTagsCount: number;
  readonly parsedLibrary: Library;
}

// Filter size options for tag bar
export type FilterSize = 'small' | 'medium' | 'large';

// @specs/DOMAIN.md § 5.1 - Persistence format (includes optional config fields)
export interface Library {
  readonly version: '1.0';
  readonly tags: readonly EmojiTag[];
  readonly gifs: readonly GIF[];
  readonly accentColor?: string;      // Optional: #RGB or #RRGGBB
  readonly filterSize?: FilterSize;   // Optional: small/medium/large
}

// @specs/INTERACTION.md § 2.6 - Toast notification
export interface ToastMessage {
  readonly text: string;
  readonly id: number;
  readonly variant: 'default' | 'warning';
}

// Preview load state machine: idle → loading → loaded | error
export type DraftPreviewStatus = 'idle' | 'loading' | 'loaded' | 'error';

// Application state (transient + persistent)
export interface AppState {
  readonly library: Library;
  readonly activeTag: string | null;
  readonly draftUrl: string;
  readonly inputExpanded: boolean;
  readonly draftPreviewStatus: DraftPreviewStatus;
  readonly editMode: boolean;
  readonly selectedGifIds: readonly string[];
  readonly confirmDeleteId: string | null;
  readonly toast: ToastMessage | null;
  readonly lastAddDuplicate: boolean;
  readonly dataModalOpen: boolean;
  readonly dataModalTab: 'edit' | 'import';
  readonly importPreview: ImportPreview | null;
  readonly aboutMode: boolean;
}

// Reducer actions
export type Action =
  | { readonly type: 'ADD_GIF'; readonly payload: { url: string; tag: string } }
  | { readonly type: 'REMOVE_GIF'; readonly payload: string }
  | { readonly type: 'UPDATE_TAG'; readonly payload: { id: string; tag: string } }
  | { readonly type: 'SET_ACTIVE_TAG'; readonly payload: string | null }
  | { readonly type: 'SET_DRAFT_URL'; readonly payload: string }
  | { readonly type: 'SET_INPUT_EXPANDED'; readonly payload: boolean }
  | { readonly type: 'TOGGLE_EDIT_MODE' }
  | { readonly type: 'ENTER_EDIT_MODE'; readonly payload: string }
  | { readonly type: 'SELECT_GIF'; readonly payload: string }
  | { readonly type: 'ASSIGN_TAG'; readonly payload: string }
  | { readonly type: 'SHOW_CONFIRM_DELETE'; readonly payload: string | null }
  | { readonly type: 'SHOW_TOAST'; readonly payload: string | { text: string; variant?: 'warning' } }
  | { readonly type: 'HIDE_TOAST' }
  | { readonly type: 'IMPORT_LIBRARY'; readonly payload: Library }
  | { readonly type: 'APPLY_LIBRARY'; readonly payload: Library }
  | { readonly type: 'SHOW_DATA_MODAL'; readonly payload: boolean }
  | { readonly type: 'SET_DATA_MODAL_TAB'; readonly payload: 'edit' | 'import' }
  | { readonly type: 'SET_IMPORT_PREVIEW'; readonly payload: ImportPreview | null }
  | { readonly type: 'SET_DRAFT_PREVIEW_STATUS'; readonly payload: DraftPreviewStatus }
  | { readonly type: 'ADD_CUSTOM_TAG'; readonly payload: EmojiTag }
  | { readonly type: 'REMOVE_CUSTOM_TAG'; readonly payload: string }
  | { readonly type: 'TOGGLE_ABOUT' };

// Store interface (DI-friendly)
export type Subscriber = (state: AppState) => void;

export interface Store {
  getState(): AppState;
  dispatch(action: Action): void;
  subscribe(fn: Subscriber): () => void;
}

// Service interfaces (DI)
export interface ClipboardService {
  writeText(text: string): Promise<void>;
}

export interface StorageService {
  load(): Library | null;
  save(library: Library): void;
}
