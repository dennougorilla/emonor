import { describe, it, expect } from 'vitest';
import { DEFAULT_TAGS, SYSTEM_TAG_EMOJI, ABOUT_CARDS } from './constants';

describe('constants', () => {
  // @specs/DOMAIN.md § 2.1 - Default tag set has exactly 7 tags
  it('DEFAULT_TAGS has exactly 7 entries', () => {
    expect(DEFAULT_TAGS).toHaveLength(7);
  });

  // @specs/DOMAIN.md § 2.1 - System reserved tag is 📂 Other
  it('last tag is the system reserved 📂 Other', () => {
    const last = DEFAULT_TAGS[DEFAULT_TAGS.length - 1];
    expect(last.emoji).toBe('📂');
    expect(last.label).toBe('Other');
  });

  it('SYSTEM_TAG_EMOJI matches last default tag', () => {
    expect(SYSTEM_TAG_EMOJI).toBe('📂');
  });
});

describe('ABOUT_CARDS', () => {
  it('has exactly 3 cards', () => {
    expect(ABOUT_CARDS).toHaveLength(3);
  });

  it('each card has required fields', () => {
    for (const card of ABOUT_CARDS) {
      expect(card.id).toBeTruthy();
      expect(card.label).toBeTruthy();
      expect(card.emoji).toBeTruthy();
      expect(card.gifUrl).toMatch(/^https?:\/\//);
      expect(card.linkUrl).toMatch(/^https?:\/\//);
    }
  });

  it('has unique ids', () => {
    const ids = ABOUT_CARDS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains github, author, and support cards', () => {
    const ids = ABOUT_CARDS.map(c => c.id);
    expect(ids).toContain('about-github');
    expect(ids).toContain('about-author');
    expect(ids).toContain('about-support');
  });
});
