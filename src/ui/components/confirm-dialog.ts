import type { Store } from '../../core/types';
import type { Component } from './toast';

// @specs/INTERACTION.md § 2.5 - Confirm dialog (delete)
export function createConfirmDialog(store: Store): Component {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.style.display = 'none';
  overlay.setAttribute('role', 'alertdialog');

  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';

  const message = document.createElement('div');
  message.className = 'confirm-dialog__message';
  message.textContent = '> confirm delete?';
  dialog.appendChild(message);

  const actions = document.createElement('div');
  actions.className = 'confirm-dialog__actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'confirm-dialog__cancel';
  cancelBtn.textContent = 'CANCEL';
  cancelBtn.addEventListener('click', () => {
    store.dispatch({ type: 'SHOW_CONFIRM_DELETE', payload: null });
  });
  actions.appendChild(cancelBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'confirm-dialog__delete';
  deleteBtn.textContent = 'DELETE';
  deleteBtn.addEventListener('click', () => {
    const gifId = deleteBtn.dataset.gifId;
    if (gifId) {
      const persisted = store.dispatch({ type: 'REMOVE_GIF', payload: gifId });
      if (persisted === false) return;
      store.dispatch({ type: 'SHOW_TOAST', payload: 'removed' });
    }
  });
  actions.appendChild(deleteBtn);

  dialog.appendChild(actions);
  overlay.appendChild(dialog);

  // Overlay click = cancel
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      store.dispatch({ type: 'SHOW_CONFIRM_DELETE', payload: null });
    }
  });

  let prevId: string | null = null;

  const unsubscribe = store.subscribe((state) => {
    if (state.confirmDeleteId === prevId) return;
    prevId = state.confirmDeleteId;

    if (state.confirmDeleteId) {
      overlay.style.display = 'flex';
      deleteBtn.dataset.gifId = state.confirmDeleteId;
    } else {
      overlay.style.display = 'none';
      delete deleteBtn.dataset.gifId;
    }
  });

  return { element: overlay, destroy: unsubscribe };
}
