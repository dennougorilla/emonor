import type { Store, ClipboardService } from '../../core/types';
import type { Component } from './toast';
import { createDataModalExport } from './data-modal-export';
import { createDataModalImport } from './data-modal-import';

export function createDataModal(store: Store, clipboard: ClipboardService): Component {
  const overlay = document.createElement('div');
  overlay.className = 'data-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'data-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'data-modal-title');

  // Header
  const header = document.createElement('div');
  header.className = 'data-modal__header';

  const title = document.createElement('div');
  title.className = 'data-modal__title';
  title.id = 'data-modal-title';
  title.textContent = '> data';

  const tabs = document.createElement('div');
  tabs.className = 'data-modal__tabs';
  tabs.setAttribute('role', 'tablist');

  const exportTab = document.createElement('button');
  exportTab.className = 'data-modal__tab data-modal__tab--active';
  exportTab.textContent = 'EDIT';
  exportTab.setAttribute('role', 'tab');
  exportTab.setAttribute('aria-selected', 'true');

  const importTab = document.createElement('button');
  importTab.className = 'data-modal__tab';
  importTab.textContent = 'IMPORT';
  importTab.setAttribute('role', 'tab');
  importTab.setAttribute('aria-selected', 'false');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'data-modal__close';
  closeBtn.textContent = '\u00d7';
  closeBtn.setAttribute('aria-label', 'Close modal');

  tabs.appendChild(exportTab);
  tabs.appendChild(importTab);
  header.appendChild(title);
  header.appendChild(tabs);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'data-modal__body';

  const exportComp = createDataModalExport(store, clipboard);
  const importComp = createDataModalImport(store);

  body.appendChild(exportComp.element);
  body.appendChild(importComp.element);
  importComp.element.style.display = 'none';

  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);

  // Tab switching
  function setTab(tab: 'edit' | 'import'): void {
    store.dispatch({ type: 'SET_DATA_MODAL_TAB', payload: tab });
  }

  exportTab.addEventListener('click', () => setTab('edit'));
  importTab.addEventListener('click', () => setTab('import'));

  // Close handlers
  closeBtn.addEventListener('click', () => {
    store.dispatch({ type: 'SHOW_DATA_MODAL', payload: false });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      store.dispatch({ type: 'SHOW_DATA_MODAL', payload: false });
    }
  });

  // Keyboard: Escape closes modal
  function handleKeydown(e: KeyboardEvent): void {
    if (!store.getState().dataModalOpen) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      store.dispatch({ type: 'SHOW_DATA_MODAL', payload: false });
    }
  }
  document.addEventListener('keydown', handleKeydown, true);

  // Focus trap
  function trapFocus(e: KeyboardEvent): void {
    if (e.key !== 'Tab' || !store.getState().dataModalOpen) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, textarea, input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  document.addEventListener('keydown', trapFocus);

  // Subscribe to state
  let prevOpen = false;
  let prevTab: 'edit' | 'import' = 'edit';

  const unsubscribe = store.subscribe((state) => {
    // Open/close
    if (state.dataModalOpen !== prevOpen) {
      prevOpen = state.dataModalOpen;
      if (state.dataModalOpen) {
        overlay.classList.add('data-modal-overlay--open');
        exportComp.refresh();
        closeBtn.focus();
      } else {
        overlay.classList.remove('data-modal-overlay--open');
      }
    }

    // Tab switch
    if (state.dataModalTab !== prevTab) {
      prevTab = state.dataModalTab;
      if (state.dataModalTab === 'edit') {
        exportComp.element.style.display = '';
        importComp.element.style.display = 'none';
        exportTab.classList.add('data-modal__tab--active');
        exportTab.setAttribute('aria-selected', 'true');
        importTab.classList.remove('data-modal__tab--active');
        importTab.setAttribute('aria-selected', 'false');
        exportComp.refresh();
      } else {
        exportComp.element.style.display = 'none';
        importComp.element.style.display = '';
        importTab.classList.add('data-modal__tab--active');
        importTab.setAttribute('aria-selected', 'true');
        exportTab.classList.remove('data-modal__tab--active');
        exportTab.setAttribute('aria-selected', 'false');
        importComp.reset();
      }
    }
  });

  return {
    element: overlay,
    destroy: () => {
      unsubscribe();
      exportComp.destroy();
      importComp.destroy();
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('keydown', trapFocus);
    },
  };
}
