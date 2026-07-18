import type { EmojiTag, GIF, Library, ImportPreview } from './types';
import { MAX_TAGS, SYSTEM_TAG_EMOJI } from './constants';
import { isValidHexColor, isValidFilterSize } from './config-validators';
import { isValidEmoji, isValidGifUrl } from './validators';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTag(value: unknown, index: number): EmojiTag {
  if (!isRecord(value)) {
    throw new Error(`Invalid tag at index ${index}`);
  }

  const emoji = value.emoji;
  const label = value.label;
  if (typeof emoji !== 'string' || !isValidEmoji(emoji)) {
    throw new Error(`Invalid tag emoji at index ${index}`);
  }
  if (typeof label !== 'string' || label.trim() === '') {
    throw new Error(`Invalid tag label at index ${index}`);
  }

  return { emoji, label: label.trim() };
}

function parseGif(value: unknown, index: number): GIF {
  if (!isRecord(value)) {
    throw new Error(`Invalid GIF at index ${index}`);
  }

  const id = value.id;
  const url = value.url;
  const tag = value.tag;
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error(`Invalid GIF id at index ${index}`);
  }
  if (typeof url !== 'string' || !isValidGifUrl(url.trim())) {
    throw new Error(`Invalid GIF URL at index ${index}`);
  }
  if (typeof tag !== 'string' || tag === '') {
    throw new Error(`Invalid GIF tag at index ${index}`);
  }

  const hasWidth = value.width !== undefined;
  const hasHeight = value.height !== undefined;
  if (hasWidth !== hasHeight) {
    throw new Error(`Incomplete GIF dimensions at index ${index}`);
  }

  let dimensions: Pick<GIF, 'width' | 'height'> = {};
  if (hasWidth && hasHeight) {
    const width = value.width;
    const height = value.height;
    if (
      !Number.isInteger(width) || !Number.isInteger(height) ||
      (width as number) <= 0 || (height as number) <= 0 ||
      (width as number) >= 100000 || (height as number) >= 100000
    ) {
      throw new Error(`Invalid GIF dimensions at index ${index}`);
    }
    dimensions = { width: width as number, height: height as number };
  }

  return { id: id.trim(), url: url.trim(), tag, ...dimensions };
}

/**
 * Validate and normalize data crossing a persistence boundary.
 * This is intentionally shared by import, raw editing, and localStorage loading.
 */
export function validateLibrary(data: unknown): Library {
  if (!isRecord(data)) {
    throw new Error('Invalid import data');
  }
  if (data.version !== '1.0') {
    throw new Error('Unsupported version');
  }
  if (!Array.isArray(data.tags)) {
    throw new Error('Missing or invalid tags field');
  }
  if (!Array.isArray(data.gifs)) {
    throw new Error('Missing or invalid gifs field');
  }
  if (data.tags.length > MAX_TAGS) {
    throw new Error(`Too many tags (maximum ${MAX_TAGS})`);
  }

  const tags = data.tags.map(parseTag);
  const tagEmojis = new Set<string>();
  for (const tag of tags) {
    if (tagEmojis.has(tag.emoji)) {
      throw new Error(`Duplicate tag: ${tag.emoji}`);
    }
    tagEmojis.add(tag.emoji);
  }

  if (!tagEmojis.has(SYSTEM_TAG_EMOJI)) {
    if (tags.length >= MAX_TAGS) {
      throw new Error(`Too many tags (maximum ${MAX_TAGS}, including ${SYSTEM_TAG_EMOJI})`);
    }
    tags.push({ emoji: SYSTEM_TAG_EMOJI, label: 'Other' });
    tagEmojis.add(SYSTEM_TAG_EMOJI);
  }

  const parsedGifs = data.gifs.map(parseGif);
  const gifIds = new Set<string>();
  const gifUrls = new Set<string>();
  const gifs = parsedGifs.map((gif) => {
    if (gifIds.has(gif.id)) {
      throw new Error(`Duplicate GIF id: ${gif.id}`);
    }
    if (gifUrls.has(gif.url)) {
      throw new Error(`Duplicate GIF URL: ${gif.url}`);
    }
    gifIds.add(gif.id);
    gifUrls.add(gif.url);
    return tagEmojis.has(gif.tag) ? gif : { ...gif, tag: SYSTEM_TAG_EMOJI };
  });

  if (data.accentColor !== undefined && !isValidHexColor(data.accentColor)) {
    throw new Error('Invalid accentColor (use #RGB or #RRGGBB)');
  }
  if (data.filterSize !== undefined && !isValidFilterSize(data.filterSize)) {
    throw new Error('Invalid filterSize (use small/medium/large)');
  }

  return {
    version: '1.0',
    tags,
    gifs,
    ...(data.accentColor !== undefined && { accentColor: data.accentColor }),
    ...(data.filterSize !== undefined && { filterSize: data.filterSize }),
  };
}

// @specs/DOMAIN.md § 5.3 - Import replace logic
export function replaceImport(imported: Library): Library {
  return validateLibrary(imported);
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

// @specs/DOMAIN.md § 3.7 - Import (parse + full runtime validation)
export function parseImport(json: string): Library {
  return validateLibrary(JSON.parse(json));
}
