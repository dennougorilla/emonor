import type { Component } from './toast';

interface EmptyStateOptions {
  readonly isFiltered: boolean;
}

// @specs/INTERACTION.md § 7 - Empty state
export function createEmptyState(options: EmptyStateOptions = { isFiltered: false }): Component {
  const el = document.createElement('div');
  el.className = 'empty-state';

  const titleRow = document.createElement('div');
  titleRow.className = 'empty-state__title';

  const prompt = document.createElement('span');
  prompt.className = 'empty-state__prompt';
  prompt.textContent = '>';
  prompt.setAttribute('aria-hidden', 'true');

  const titleText = document.createElement('span');
  titleText.textContent = options.isFiltered
    ? ' no gifs match this tag'
    : ' no gifs yet';

  const cursor = document.createElement('span');
  cursor.className = 'empty-state__cursor';
  cursor.setAttribute('aria-hidden', 'true');

  titleRow.appendChild(prompt);
  titleRow.appendChild(titleText);
  titleRow.appendChild(cursor);

  const hint = document.createElement('div');
  hint.className = 'empty-state__hint';
  hint.textContent = options.isFiltered
    ? 'try a different tag or add a new gif'
    : 'paste a url above to begin';

  el.appendChild(titleRow);
  el.appendChild(hint);

  return { element: el, destroy: () => {} };
}
