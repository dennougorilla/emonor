import type { Store, ClipboardService } from '../core/types';
import type { Component } from './components/toast';
import { createHeader } from './components/header';
import { createTagBar } from './components/tag-bar';
import { createGifGrid } from './components/gif-grid';
import { createToast } from './components/toast';
import { createConfirmDialog } from './components/confirm-dialog';
import { createDataModal } from './components/data-modal';

export interface AppComponent extends Component {
  focusInput: () => void;
}

// Root orchestrator - composes all UI components
export function createApp(store: Store, clipboard: ClipboardService): AppComponent {
  const el = document.createElement('div');

  const header = createHeader(store);
  const tagBar = createTagBar(store);
  const grid = createGifGrid(store, clipboard);
  const toast = createToast(store);
  const dialog = createConfirmDialog(store);
  const dataModal = createDataModal(store, clipboard);

  // Assemble structure
  (header.element as HTMLElement).appendChild(tagBar.element);
  el.appendChild(header.element);
  el.appendChild(grid.element);
  el.appendChild(toast.element);
  el.appendChild(dialog.element);
  el.appendChild(dataModal.element);

  return {
    element: el,
    focusInput: () => (header as ReturnType<typeof createHeader> & { focusInput: () => void }).focusInput(),
    destroy: () => {
      header.destroy();
      tagBar.destroy();
      grid.destroy();
      toast.destroy();
      dialog.destroy();
      dataModal.destroy();
    },
  };
}
