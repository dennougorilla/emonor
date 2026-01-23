import type { Library } from './types';
import { MAX_TAGS, SYSTEM_TAG_EMOJI } from './constants';

// @specs/DOMAIN.md § 2.3 - Add custom tag
export function addCustomTag(library: Library, emoji: string, label: string): Library {
  if (label === '') return library;
  if (library.tags.length >= MAX_TAGS) return library;
  if (library.tags.some(t => t.emoji === emoji)) return library;

  // Insert before 📂 (Other) which is always last
  const otherIndex = library.tags.findIndex(t => t.emoji === SYSTEM_TAG_EMOJI);
  const insertIndex = otherIndex === -1 ? library.tags.length : otherIndex;

  const newTags = [
    ...library.tags.slice(0, insertIndex),
    { emoji, label },
    ...library.tags.slice(insertIndex),
  ];

  return { ...library, tags: newTags };
}

// @specs/DOMAIN.md § 3.6 - Remove custom tag
// GIFs using removed tag are reassigned to 📂
export function removeCustomTag(library: Library, emoji: string): Library {
  if (emoji === SYSTEM_TAG_EMOJI) return library;
  if (!library.tags.some(t => t.emoji === emoji)) return library;

  const newTags = library.tags.filter(t => t.emoji !== emoji);
  const newGifs = library.gifs.map(g =>
    g.tag === emoji ? { ...g, tag: SYSTEM_TAG_EMOJI } : g
  );

  return { ...library, tags: newTags, gifs: newGifs };
}
