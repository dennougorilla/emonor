import type { Store } from '../../core/types';
import { parseImport, computeImportPreview } from '../../core/import-export';

export interface ImportComponent {
  readonly element: HTMLElement;
  reset(): void;
  destroy(): void;
}

export function createDataModalImport(store: Store): ImportComponent {
  const el = document.createElement('div');

  const hint = document.createElement('div');
  hint.className = 'data-modal__drop-hint';
  hint.textContent = '> paste json or drop file';

  const textarea = document.createElement('textarea');
  textarea.className = 'data-modal__textarea';
  textarea.setAttribute('aria-label', 'Import JSON data');
  textarea.placeholder = 'paste json here...';
  textarea.spellcheck = false;

  const fileBtn = document.createElement('button');
  fileBtn.className = 'data-modal__file-btn';
  fileBtn.textContent = 'select file';
  fileBtn.type = 'button';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';

  const preview = document.createElement('div');
  preview.className = 'data-modal__preview';
  preview.setAttribute('aria-live', 'polite');

  const error = document.createElement('div');
  error.className = 'data-modal__error';

  const actions = document.createElement('div');
  actions.className = 'data-modal__actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'data-modal__btn';
  cancelBtn.textContent = 'CANCEL';

  const importBtn = document.createElement('button');
  importBtn.className = 'data-modal__btn data-modal__btn--disabled';
  importBtn.textContent = 'IMPORT';

  actions.appendChild(cancelBtn);
  actions.appendChild(importBtn);

  el.appendChild(hint);
  el.appendChild(textarea);
  el.appendChild(fileInput);
  el.appendChild(fileBtn);
  el.appendChild(error);
  el.appendChild(preview);
  el.appendChild(actions);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function processInput(json: string): void {
    error.textContent = '';
    preview.textContent = '';
    store.dispatch({ type: 'SET_IMPORT_PREVIEW', payload: null });
    importBtn.classList.add('data-modal__btn--disabled');
    importBtn.classList.remove('data-modal__btn--accent');

    if (!json.trim()) return;

    try {
      const parsed = parseImport(json);
      const existing = store.getState().library;
      const prev = computeImportPreview(existing, parsed);
      store.dispatch({ type: 'SET_IMPORT_PREVIEW', payload: prev });

      preview.textContent = `> replace: ${prev.importedGifsCount} gifs \u00b7 ${prev.importedTagsCount} tags (current: ${prev.currentGifsCount} gifs \u00b7 ${prev.currentTagsCount} tags)`;

      importBtn.classList.remove('data-modal__btn--disabled');
      importBtn.classList.add('data-modal__btn--accent');
    } catch (e) {
      error.textContent = `> ${e instanceof Error ? e.message : 'invalid json'}`;
    }
  }

  textarea.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => processInput(textarea.value), 300);
  });

  fileBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    file.text()
      .then(text => {
        textarea.value = text;
        processInput(text);
      })
      .catch(() => {
        error.textContent = '> could not read file';
      });
    fileInput.value = '';
  });

  // Drag and drop
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  el.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    file.text()
      .then(text => {
        textarea.value = text;
        processInput(text);
      })
      .catch(() => {
        error.textContent = '> could not read file';
      });
  });

  cancelBtn.addEventListener('click', () => {
    store.dispatch({ type: 'SHOW_DATA_MODAL', payload: false });
  });

  importBtn.addEventListener('click', () => {
    const prev = store.getState().importPreview;
    if (!prev) return;
    store.dispatch({ type: 'IMPORT_LIBRARY', payload: prev.parsedLibrary });
    store.dispatch({ type: 'SHOW_TOAST', payload: `imported ${prev.importedGifsCount} gifs` });
  });

  function reset(): void {
    textarea.value = '';
    error.textContent = '';
    preview.textContent = '';
    importBtn.classList.add('data-modal__btn--disabled');
    importBtn.classList.remove('data-modal__btn--accent');
    store.dispatch({ type: 'SET_IMPORT_PREVIEW', payload: null });
  }

  return {
    element: el,
    reset,
    destroy: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    },
  };
}
