// Composition Root - wires all layers together
import './styles/tokens.css';
import './styles/base.css';
import './styles/header.css';
import './styles/tag-bar.css';
import './styles/gif-card.css';
import './styles/grid.css';
import './styles/popover.css';
import './styles/toast.css';
import './styles/dialog.css';
import './styles/empty.css';
import './styles/preview.css';
import './styles/data-modal.css';

import type { Library } from './core/types';
import { createStore } from './services/store';
import { createStorageService } from './services/storage';
import { createClipboardService } from './services/clipboard';
import { setupKeyboard } from './services/keyboard';
import { createApp } from './ui/app';
import { DEFAULT_ACCENT_COLOR, DEFAULT_FILTER_SIZE, FILTER_SIZE_VALUES } from './core/config-types';

// Convert hex color to RGB for CSS rgba() usage
function hexToRgb(hex: string): string {
  const shorthand = /^#([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthand, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return '52, 211, 153'; // fallback to default green
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// Apply configuration from Library to CSS variables
function applyLibraryConfig(library: Library): void {
  const root = document.documentElement;
  const accentColor = library.accentColor ?? DEFAULT_ACCENT_COLOR;
  const filterSize = library.filterSize ?? DEFAULT_FILTER_SIZE;

  // Apply accent color
  const rgb = hexToRgb(accentColor);
  root.style.setProperty('--accent', accentColor);
  root.style.setProperty('--accent-dim', `rgba(${rgb}, 0.1)`);
  root.style.setProperty('--accent-subtle', `rgba(${rgb}, 0.05)`);
  root.style.setProperty('--border-accent', accentColor);

  // Apply filter size
  const sizeValues = FILTER_SIZE_VALUES[filterSize];
  root.style.setProperty('--filter-height', `${sizeValues.height}px`);
  root.style.setProperty('--filter-emoji-size', `${sizeValues.emojiSize}px`);
  root.style.setProperty('--filter-padding-x', `${sizeValues.paddingX}px`);
}

// Initialize services
const storage = createStorageService();
const clipboard = createClipboardService();
const store = createStore(storage);

// Apply initial configuration from library
applyLibraryConfig(store.getState().library);

// Subscribe to library changes to re-apply config
let prevLibrary = store.getState().library;
store.subscribe((state) => {
  if (state.library !== prevLibrary) {
    prevLibrary = state.library;
    applyLibraryConfig(state.library);
  }
});

// Create UI
const app = createApp(store, clipboard);

// Mount to DOM
const root = document.getElementById('app');
if (root) {
  root.appendChild(app.element);
}

// Setup keyboard shortcuts
setupKeyboard(store, {
  onNewGif: () => app.focusInput(),
});
