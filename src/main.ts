// Composition Root - wires all layers together
import './styles/tokens.css';
import './styles/base.css';
import './styles/header.css';
import './styles/tag-bar.css';
import './styles/gif-card.css';
import './styles/grid.css';
import './styles/toast.css';
import './styles/dialog.css';
import './styles/empty.css';
import './styles/preview.css';
import './styles/data-modal.css';

import { createStore } from './services/store';
import { createStorageService } from './services/storage';
import { createClipboardService } from './services/clipboard';
import { setupKeyboard } from './services/keyboard';
import { createApp } from './ui/app';

// Initialize services
const storage = createStorageService();
const clipboard = createClipboardService();
const store = createStore(storage);

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
