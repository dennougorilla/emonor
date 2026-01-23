import type { Library, ImportPreview } from './types';
import { SYSTEM_TAG_EMOJI } from './constants';

// @specs/DOMAIN.md § 5.3 - Import replace logic
export function replaceImport(imported: Library): Library {
  if (imported.version !== '1.0') {
    throw new Error('Unsupported version');
  }

  const hasSystemTag = imported.tags.some(t => t.emoji === SYSTEM_TAG_EMOJI);
  const tags = hasSystemTag
    ? imported.tags
    : [...imported.tags, { emoji: SYSTEM_TAG_EMOJI, label: 'Other' }];

  const validEmojis = new Set(tags.map(t => t.emoji));
  const gifs = imported.gifs.map(g =>
    validEmojis.has(g.tag) ? g : { ...g, tag: SYSTEM_TAG_EMOJI }
  );

  return { version: '1.0', tags: [...tags], gifs };
}

// @specs/DOMAIN.md § 3.7 - Export
export function serializeLibrary(library: Library): string {
  return JSON.stringify(library, null, 2);
}

// Compute preview stats for an import replacement
export function computeImportPreview(existing: Library, imported: Library): ImportPreview {
  return {
    importedGifsCount: imported.gifs.length,
    importedTagsCount: imported.tags.length,
    currentGifsCount: existing.gifs.length,
    currentTagsCount: existing.tags.length,
    parsedLibrary: imported,
  };
}

// @specs/DOMAIN.md § 3.7 - Import (parse + validate structure)
export function parseImport(json: string): Library {
  const data = JSON.parse(json);

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data');
  }
  if (!('version' in data) || typeof data.version !== 'string') {
    throw new Error('Missing or invalid version field');
  }
  if (!('tags' in data) || !Array.isArray(data.tags)) {
    throw new Error('Missing or invalid tags field');
  }
  if (!('gifs' in data) || !Array.isArray(data.gifs)) {
    throw new Error('Missing or invalid gifs field');
  }

  return data as Library;
}
