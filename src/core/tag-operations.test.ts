import { describe, it, expect } from 'vitest';
import { addCustomTag, removeCustomTag } from './tag-operations';
import type { Library } from './types';
import { DEFAULT_TAGS } from './constants';

function createLibrary(overrides: Partial<Library> = {}): Library {
  return {
    version: '1.0',
    tags: [...DEFAULT_TAGS],
    gifs: [],
    ...overrides,
  };
}

describe('addCustomTag', () => {
  // @specs/DOMAIN.md § 2.3 - Custom tag functionality
  it('appends new tag before 📂 (Other)', () => {
    const library = createLibrary();
    const result = addCustomTag(library, '🎮', 'Gaming');

    const otherIndex = result.tags.findIndex(t => t.emoji === '📂');
    const newIndex = result.tags.findIndex(t => t.emoji === '🎮');
    expect(newIndex).toBeLessThan(otherIndex);
  });

  // @specs/DOMAIN.md § 2.3 - Duplicate emoji not allowed
  it('rejects duplicate emoji', () => {
    const library = createLibrary();
    const result = addCustomTag(library, '😂', 'Duplicate');

    expect(result.tags).toEqual(library.tags);
  });

  // @specs/DOMAIN.md § 2.3 - Empty label not allowed
  it('rejects empty label', () => {
    const library = createLibrary();
    const result = addCustomTag(library, '🎮', '');

    expect(result.tags).toEqual(library.tags);
  });

  // @specs/DOMAIN.md § 2.3 - Max tags (12)
  it('rejects when max tags reached', () => {
    const manyTags = Array.from({ length: 12 }, (_, i) => ({
      emoji: String.fromCodePoint(0x1F600 + i),
      label: `Tag ${i}`,
    }));
    const library = createLibrary({ tags: manyTags });
    const result = addCustomTag(library, '🎮', 'Gaming');

    expect(result.tags).toHaveLength(12);
  });

  it('does not mutate the original library', () => {
    const library = createLibrary();
    const originalTags = library.tags;

    addCustomTag(library, '🎮', 'Gaming');

    expect(library.tags).toBe(originalTags);
  });
});

describe('removeCustomTag', () => {
  // @specs/DOMAIN.md § 2.3 - 📂 (Other) is undeletable
  it('cannot remove 📂 (Other) tag', () => {
    const library = createLibrary();
    const result = removeCustomTag(library, '📂');

    expect(result.tags.find(t => t.emoji === '📂')).toBeDefined();
  });

  // @specs/DOMAIN.md § 3.6 - GIFs using removed tag move to 📂
  it('moves GIFs using removed tag to 📂', () => {
    const library = createLibrary({
      tags: [...DEFAULT_TAGS, { emoji: '🎮', label: 'Gaming' }],
      gifs: [
        { id: '1', url: 'https://i.imgur.com/1.gif', tag: '🎮' },
        { id: '2', url: 'https://i.imgur.com/2.gif', tag: '😂' },
      ],
    });

    const result = removeCustomTag(library, '🎮');

    expect(result.gifs[0].tag).toBe('📂');
    expect(result.gifs[1].tag).toBe('😂');
  });

  it('removes tag from tag list', () => {
    const library = createLibrary({
      tags: [...DEFAULT_TAGS, { emoji: '🎮', label: 'Gaming' }],
    });

    const result = removeCustomTag(library, '🎮');

    expect(result.tags.find(t => t.emoji === '🎮')).toBeUndefined();
  });

  it('returns unchanged library if tag not found', () => {
    const library = createLibrary();
    const result = removeCustomTag(library, '🎮');

    expect(result).toEqual(library);
  });

  it('does not mutate the original library', () => {
    const library = createLibrary({
      tags: [...DEFAULT_TAGS, { emoji: '🎮', label: 'Gaming' }],
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '🎮' }],
    });
    const originalGifs = library.gifs;

    removeCustomTag(library, '🎮');

    expect(library.gifs).toBe(originalGifs);
  });
});
