import type { Library, GIF, AddGifResult } from './types';
import { SYSTEM_TAG_EMOJI } from './constants';

function generateId(): string {
  return crypto.randomUUID();
}

// @specs/DOMAIN.md § 2.5 - addGIF(url, tag?)
// @specs/DOMAIN.md § 2.4 - Prepend (newest first)
// Deduplication: rejects duplicate URLs
export function addGif(library: Library, url: string, tag?: string): AddGifResult {
  const isDuplicate = library.gifs.some(g => g.url === url);
  if (isDuplicate) {
    return { library, added: false };
  }

  const newGif: GIF = {
    id: generateId(),
    url,
    tag: tag ?? SYSTEM_TAG_EMOJI,
  };

  return {
    library: {
      ...library,
      gifs: [newGif, ...library.gifs],
    },
    added: true,
  };
}

// @specs/DOMAIN.md § 3.5 - GIF deletion
export function removeGif(library: Library, id: string): Library {
  const filtered = library.gifs.filter(g => g.id !== id);
  if (filtered.length === library.gifs.length) {
    return library;
  }
  return {
    ...library,
    gifs: filtered,
  };
}

// Stores naturalWidth/Height from <img> onload so cards can reserve aspect-ratio
// space on subsequent renders (eliminates initial-load layout shift).
export function setGifDimensions(
  library: Library,
  id: string,
  width: number,
  height: number,
): Library {
  if (
    !Number.isInteger(width) || !Number.isInteger(height) ||
    width <= 0 || height <= 0 ||
    width >= 100000 || height >= 100000
  ) {
    return library;
  }
  const index = library.gifs.findIndex(g => g.id === id);
  if (index === -1) {
    return library;
  }
  const existing = library.gifs[index];
  if (existing.width === width && existing.height === height) {
    return library;
  }
  return {
    ...library,
    gifs: library.gifs.map(g =>
      g.id === id ? { ...g, width, height } : g
    ),
  };
}

// @specs/DOMAIN.md § 3.4 - Tag change
export function updateTag(library: Library, id: string, newTag: string): Library {
  const index = library.gifs.findIndex(g => g.id === id);
  if (index === -1) {
    return library;
  }
  return {
    ...library,
    gifs: library.gifs.map(g =>
      g.id === id ? { ...g, tag: newTag } : g
    ),
  };
}

// @specs/DOMAIN.md § 3.3 - Filter by tag
export function filterByTag(gifs: readonly GIF[], tag: string | null): readonly GIF[] {
  if (tag === null) {
    return gifs;
  }
  return gifs.filter(g => g.tag === tag);
}
