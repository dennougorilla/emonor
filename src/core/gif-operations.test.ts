import { describe, it, expect } from 'vitest';
import { addGif, removeGif, updateTag, filterByTag } from './gif-operations';
import type { Library, GIF } from './types';
import { DEFAULT_TAGS } from './constants';

function createLibrary(gifs: GIF[] = []): Library {
  return { version: '1.0', tags: [...DEFAULT_TAGS], gifs };
}

function createGif(overrides: Partial<GIF> = {}): GIF {
  return {
    id: 'test-id-1',
    url: 'https://media.giphy.com/media/abc/giphy.gif',
    tag: '😂',
    ...overrides,
  };
}

describe('addGif', () => {
  // @specs/DOMAIN.md § 2.4 - GIFs displayed in add order (newest first)
  it('prepends new GIF to beginning of list', () => {
    const existing = createGif({ id: 'old', url: 'https://i.imgur.com/old.gif' });
    const library = createLibrary([existing]);

    const result = addGif(library, 'https://i.imgur.com/new.gif', '🔥');

    expect(result.added).toBe(true);
    expect(result.library.gifs).toHaveLength(2);
    expect(result.library.gifs[0].url).toBe('https://i.imgur.com/new.gif');
    expect(result.library.gifs[0].tag).toBe('🔥');
    expect(result.library.gifs[1].id).toBe('old');
  });

  // @specs/DOMAIN.md § 2.5 - addGIF(url, tag?) tag defaults to 📂
  it('defaults tag to 📂 when not specified', () => {
    const library = createLibrary();

    const result = addGif(library, 'https://i.imgur.com/new.gif');

    expect(result.added).toBe(true);
    expect(result.library.gifs[0].tag).toBe('📂');
  });

  // CLAUDE.md - Deduplication: addGif() rejects duplicate URLs
  it('returns added: false for duplicate URLs', () => {
    const existing = createGif({ url: 'https://i.imgur.com/dup.gif' });
    const library = createLibrary([existing]);

    const result = addGif(library, 'https://i.imgur.com/dup.gif', '🔥');

    expect(result.added).toBe(false);
    expect(result.library.gifs).toHaveLength(1);
    expect(result.library).toBe(library);
  });

  it('generates a UUID v4 id for new GIFs', () => {
    const library = createLibrary();
    const result = addGif(library, 'https://i.imgur.com/test.gif', '😂');

    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(result.library.gifs[0].id).toMatch(uuidV4Regex);
  });

  it('does not mutate the original library', () => {
    const library = createLibrary();
    const originalGifs = library.gifs;

    addGif(library, 'https://i.imgur.com/new.gif', '😂');

    expect(library.gifs).toBe(originalGifs);
  });
});

describe('removeGif', () => {
  // @specs/DOMAIN.md § 3.5 - GIF deletion
  it('removes GIF by id', () => {
    const gif1 = createGif({ id: 'keep' });
    const gif2 = createGif({ id: 'remove', url: 'https://i.imgur.com/other.gif' });
    const library = createLibrary([gif1, gif2]);

    const result = removeGif(library, 'remove');

    expect(result.gifs).toHaveLength(1);
    expect(result.gifs[0].id).toBe('keep');
  });

  it('returns unchanged library if id not found', () => {
    const library = createLibrary([createGif()]);

    const result = removeGif(library, 'nonexistent');

    expect(result.gifs).toEqual(library.gifs);
  });

  it('does not mutate the original library', () => {
    const gif = createGif();
    const library = createLibrary([gif]);
    const originalGifs = library.gifs;

    removeGif(library, gif.id);

    expect(library.gifs).toBe(originalGifs);
  });
});

describe('updateTag', () => {
  // @specs/DOMAIN.md § 3.4 - Tag change
  it('updates tag for specified GIF', () => {
    const gif = createGif({ id: 'target', tag: '😂' });
    const library = createLibrary([gif]);

    const result = updateTag(library, 'target', '🔥');

    expect(result.gifs[0].tag).toBe('🔥');
  });

  it('returns unchanged library if id not found', () => {
    const library = createLibrary([createGif()]);

    const result = updateTag(library, 'nonexistent', '🔥');

    expect(result.gifs).toEqual(library.gifs);
  });

  it('does not mutate the original library', () => {
    const gif = createGif({ id: 'target', tag: '😂' });
    const library = createLibrary([gif]);

    updateTag(library, 'target', '🔥');

    expect(library.gifs[0].tag).toBe('😂');
  });

  it('preserves other GIF properties', () => {
    const gif = createGif({ id: 'target', url: 'https://i.imgur.com/test.gif', tag: '😂' });
    const library = createLibrary([gif]);

    const result = updateTag(library, 'target', '🔥');

    expect(result.gifs[0].id).toBe('target');
    expect(result.gifs[0].url).toBe('https://i.imgur.com/test.gif');
  });
});

describe('filterByTag', () => {
  // @specs/DOMAIN.md § 3.3 - Filter by tag
  it('returns only GIFs matching the tag', () => {
    const gif1 = createGif({ id: '1', tag: '😂', url: 'https://i.imgur.com/1.gif' });
    const gif2 = createGif({ id: '2', tag: '🔥', url: 'https://i.imgur.com/2.gif' });
    const gif3 = createGif({ id: '3', tag: '😂', url: 'https://i.imgur.com/3.gif' });
    const library = createLibrary([gif1, gif2, gif3]);

    const result = filterByTag(library.gifs, '😂');

    expect(result).toHaveLength(2);
    expect(result.every(g => g.tag === '😂')).toBe(true);
  });

  it('returns all GIFs when tag is null', () => {
    const gif1 = createGif({ id: '1', tag: '😂', url: 'https://i.imgur.com/1.gif' });
    const gif2 = createGif({ id: '2', tag: '🔥', url: 'https://i.imgur.com/2.gif' });
    const library = createLibrary([gif1, gif2]);

    const result = filterByTag(library.gifs, null);

    expect(result).toHaveLength(2);
  });

  it('returns empty array when no GIFs match', () => {
    const gif = createGif({ tag: '😂' });
    const library = createLibrary([gif]);

    const result = filterByTag(library.gifs, '🔥');

    expect(result).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const gifs = [createGif({ tag: '😂' })];

    filterByTag(gifs, '😂');

    expect(gifs).toHaveLength(1);
  });
});
