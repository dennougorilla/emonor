import { describe, it, expect } from 'vitest';
import { replaceImport, serializeLibrary, parseImport, computeImportPreview } from './import-export';
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

describe('replaceImport', () => {
  // @specs/DOMAIN.md § 5.3 - Import replace logic

  it('rejects unsupported version', () => {
    const imported = { ...createLibrary(), version: '2.0' } as unknown as Library;

    expect(() => replaceImport(imported)).toThrow('Unsupported version');
  });

  it('ensures 📂 tag exists even if not in imported data', () => {
    const imported = createLibrary({
      tags: [{ emoji: '😂', label: 'Funny' }],
    });

    const result = replaceImport(imported);

    expect(result.tags.find(t => t.emoji === '📂')).toBeDefined();
  });

  it('does not duplicate 📂 if already present', () => {
    const imported = createLibrary();

    const result = replaceImport(imported);

    const systemTags = result.tags.filter(t => t.emoji === '📂');
    expect(systemTags).toHaveLength(1);
  });

  it('reassigns GIFs with unknown tags to 📂', () => {
    const imported = createLibrary({
      tags: [{ emoji: '😂', label: 'Funny' }, { emoji: '📂', label: 'Other' }],
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '🎮' }],
    });

    const result = replaceImport(imported);

    expect(result.gifs[0].tag).toBe('📂');
  });

  it('returns imported data as-is when all tags are valid', () => {
    const imported = createLibrary({
      gifs: [
        { id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' },
        { id: '2', url: 'https://i.imgur.com/2.gif', tag: '🔥' },
      ],
    });

    const result = replaceImport(imported);

    expect(result.gifs).toHaveLength(2);
    expect(result.gifs[0].tag).toBe('😂');
    expect(result.gifs[1].tag).toBe('🔥');
  });

  it('does not reference or merge with any existing library', () => {
    const imported = createLibrary({
      tags: [{ emoji: '🎮', label: 'Gaming' }, { emoji: '📂', label: 'Other' }],
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '🎮' }],
    });

    const result = replaceImport(imported);

    expect(result.tags).toHaveLength(2);
    expect(result.gifs).toHaveLength(1);
    expect(result.gifs[0].tag).toBe('🎮');
  });
});

describe('serializeLibrary', () => {
  it('converts library to JSON string', () => {
    const library = createLibrary({
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' }],
    });

    const json = serializeLibrary(library);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe('1.0');
    expect(parsed.gifs).toHaveLength(1);
    expect(parsed.tags).toHaveLength(DEFAULT_TAGS.length);
  });
});

describe('parseImport', () => {
  it('parses valid JSON string to Library', () => {
    const library = createLibrary({
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' }],
    });
    const json = JSON.stringify(library);

    const result = parseImport(json);

    expect(result.version).toBe('1.0');
    expect(result.gifs).toHaveLength(1);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseImport('not json')).toThrow();
  });

  it('throws on missing version field', () => {
    const invalid = JSON.stringify({ tags: [], gifs: [] });
    expect(() => parseImport(invalid)).toThrow();
  });

  it('throws on missing tags field', () => {
    const invalid = JSON.stringify({ version: '1.0', gifs: [] });
    expect(() => parseImport(invalid)).toThrow();
  });

  it('throws on missing gifs field', () => {
    const invalid = JSON.stringify({ version: '1.0', tags: [] });
    expect(() => parseImport(invalid)).toThrow();
  });
});

describe('computeImportPreview', () => {
  it('reports imported gifs and tags counts', () => {
    const existing = createLibrary({
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' }],
    });
    const imported = createLibrary({
      gifs: [
        { id: '2', url: 'https://i.imgur.com/2.gif', tag: '🔥' },
        { id: '3', url: 'https://i.imgur.com/3.gif', tag: '❤️' },
      ],
    });

    const preview = computeImportPreview(existing, imported);

    expect(preview.importedGifsCount).toBe(2);
    expect(preview.importedTagsCount).toBe(DEFAULT_TAGS.length);
  });

  it('reports current library counts', () => {
    const existing = createLibrary({
      gifs: [
        { id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' },
        { id: '2', url: 'https://i.imgur.com/2.gif', tag: '🔥' },
      ],
    });
    const imported = createLibrary({
      gifs: [{ id: '3', url: 'https://i.imgur.com/3.gif', tag: '❤️' }],
    });

    const preview = computeImportPreview(existing, imported);

    expect(preview.currentGifsCount).toBe(2);
    expect(preview.currentTagsCount).toBe(DEFAULT_TAGS.length);
  });

  it('includes parsedLibrary reference', () => {
    const existing = createLibrary();
    const imported = createLibrary({
      gifs: [{ id: '1', url: 'https://i.imgur.com/1.gif', tag: '😂' }],
    });

    const preview = computeImportPreview(existing, imported);

    expect(preview.parsedLibrary).toBe(imported);
  });
});
