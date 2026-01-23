import type { Store, ToastMessage } from '../../core/types';
import { TOAST_DURATION_MS } from '../../core/constants';

export interface Component {
  element: HTMLElement;
  destroy: () => void;
}

// @specs/INTERACTION.md § 2.6 - Toast notification
export function createToast(store: Store): Component {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');

  let prev: ToastMessage | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = store.subscribe((state) => {
    if (state.toast === prev) return;
    prev = state.toast;

    if (state.toast) {
      el.textContent = `> ${state.toast.text}`;
      el.classList.add('toast--visible');
      el.classList.toggle('toast--warning', state.toast.variant === 'warning');

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        store.dispatch({ type: 'HIDE_TOAST' });
      }, TOAST_DURATION_MS);
    } else {
      el.classList.remove('toast--visible', 'toast--warning');
      el.textContent = '';
    }
  });

  return {
    element: el,
    destroy: () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    },
  };
}
