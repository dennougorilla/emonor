import type { Store, ClipboardService } from '../../core/types';
import { serializeLibrary, parseImport } from '../../core/import-export';
import { downloadJson } from '../../services/file-download';

export interface ExportComponent {
  readonly element: HTMLElement;
  refresh(): void;
  destroy(): void;
}

export function createDataModalExport(store: Store, clipboard: ClipboardService): ExportComponent {
  const el = document.createElement('div');

  const textarea = document.createElement('textarea');
  textarea.className = 'data-modal__textarea';
  textarea.setAttribute('aria-label', 'Library JSON data');
  textarea.spellcheck = false;

  const stats = document.createElement('div');
  stats.className = 'data-modal__stats';

  const error = document.createElement('div');
  error.className = 'data-modal__error';

  const actions = document.createElement('div');
  actions.className = 'data-modal__actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'data-modal__btn';
  copyBtn.textContent = 'COPY';

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'data-modal__btn';
  downloadBtn.textContent = 'DOWNLOAD';

  const applyBtn = document.createElement('button');
  applyBtn.className = 'data-modal__btn data-modal__btn--disabled';
  applyBtn.textContent = 'APPLY';

  actions.appendChild(copyBtn);
  actions.appendChild(downloadBtn);
  actions.appendChild(applyBtn);

  el.appendChild(textarea);
  el.appendChild(stats);
  el.appendChild(error);
  el.appendChild(actions);

  let originalJson = '';

  function refresh(): void {
    const lib = store.getState().library;
    originalJson = serializeLibrary(lib);
    textarea.value = originalJson;
    stats.textContent = `> ${lib.gifs.length} gifs \u00b7 ${lib.tags.length} tags`;
    error.textContent = '';
    applyBtn.classList.add('data-modal__btn--disabled');
    applyBtn.classList.remove('data-modal__btn--accent');
    textarea.classList.remove('data-modal__textarea--modified');
  }

  function updateDirtyState(): void {
    const isDirty = textarea.value !== originalJson;
    if (isDirty) {
      applyBtn.classList.remove('data-modal__btn--disabled');
      applyBtn.classList.add('data-modal__btn--accent');
      textarea.classList.add('data-modal__textarea--modified');
    } else {
      applyBtn.classList.add('data-modal__btn--disabled');
      applyBtn.classList.remove('data-modal__btn--accent');
      textarea.classList.remove('data-modal__textarea--modified');
    }
  }

  textarea.addEventListener('input', () => {
    error.textContent = '';
    updateDirtyState();
  });

  copyBtn.addEventListener('click', () => {
    clipboard.writeText(textarea.value)
      .then(() => store.dispatch({ type: 'SHOW_TOAST', payload: 'copied' }))
      .catch(() => store.dispatch({ type: 'SHOW_TOAST', payload: { text: 'copy failed', variant: 'warning' } }));
  });

  downloadBtn.addEventListener('click', () => {
    downloadJson(textarea.value, 'emonor-backup.json');
    store.dispatch({ type: 'SHOW_TOAST', payload: 'exported' });
  });

  applyBtn.addEventListener('click', () => {
    if (textarea.value === originalJson) return;
    try {
      const parsed = parseImport(textarea.value);
      const persisted = store.dispatch({ type: 'APPLY_LIBRARY', payload: parsed });
      if (persisted === false) return;
      store.dispatch({ type: 'SHOW_TOAST', payload: 'applied' });
      refresh();
    } catch (e) {
      error.textContent = `> ${e instanceof Error ? e.message : 'invalid json'}`;
    }
  });

  refresh();

  return {
    element: el,
    refresh,
    destroy: () => {},
  };
}
