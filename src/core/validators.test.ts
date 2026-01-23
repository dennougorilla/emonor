import { describe, it, expect } from 'vitest';
import { isValidGifUrl, isValidEmoji } from './validators';

describe('isValidGifUrl', () => {
  // @specs/DOMAIN.md § 5.4 - URL validation rules

  describe('valid URLs', () => {
    it('accepts .gif extension', () => {
      expect(isValidGifUrl('https://example.com/image.gif')).toBe(true);
    });

    it('accepts .webp extension', () => {
      expect(isValidGifUrl('https://example.com/image.webp')).toBe(true);
    });

    it('accepts .mp4 extension', () => {
      expect(isValidGifUrl('https://example.com/video.mp4')).toBe(true);
    });

    it('accepts extensions with query params', () => {
      expect(isValidGifUrl('https://example.com/image.gif?size=200')).toBe(true);
    });

    it('accepts media.giphy.com', () => {
      expect(isValidGifUrl('https://media.giphy.com/media/abc/giphy.gif')).toBe(true);
    });

    it('accepts giphy.com', () => {
      expect(isValidGifUrl('https://giphy.com/gifs/abc-123')).toBe(true);
    });

    it('accepts tenor.com', () => {
      expect(isValidGifUrl('https://tenor.com/view/abc-123')).toBe(true);
    });

    it('accepts media.tenor.com', () => {
      expect(isValidGifUrl('https://media.tenor.com/abc/mp4')).toBe(true);
    });

    it('accepts imgur.com', () => {
      expect(isValidGifUrl('https://imgur.com/abc')).toBe(true);
    });

    it('accepts i.imgur.com', () => {
      expect(isValidGifUrl('https://i.imgur.com/abc.gif')).toBe(true);
    });

    it('accepts gfycat.com', () => {
      expect(isValidGifUrl('https://gfycat.com/abc')).toBe(true);
    });

    it('accepts media.discordapp.net', () => {
      expect(isValidGifUrl('https://media.discordapp.net/attachments/abc.gif')).toBe(true);
    });

    it('accepts cdn.discordapp.com', () => {
      expect(isValidGifUrl('https://cdn.discordapp.com/attachments/abc.gif')).toBe(true);
    });

    it('accepts subdomains of known hosts', () => {
      expect(isValidGifUrl('https://sub.giphy.com/something')).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('rejects empty string', () => {
      expect(isValidGifUrl('')).toBe(false);
    });

    it('rejects non-URL strings', () => {
      expect(isValidGifUrl('not a url')).toBe(false);
    });

    it('rejects URLs without gif extension on unknown hosts', () => {
      expect(isValidGifUrl('https://example.com/page')).toBe(false);
    });

    it('rejects URLs with gif in path but not as extension', () => {
      expect(isValidGifUrl('https://example.com/gif/page')).toBe(false);
    });

    it('is case-insensitive for extensions', () => {
      expect(isValidGifUrl('https://example.com/image.GIF')).toBe(true);
    });

    it('is case-insensitive for hostnames', () => {
      expect(isValidGifUrl('https://MEDIA.GIPHY.COM/abc')).toBe(true);
    });
  });
});

describe('isValidEmoji', () => {
  describe('valid emojis', () => {
    it('accepts single emoji characters', () => {
      expect(isValidEmoji('😂')).toBe(true);
    });

    it('accepts heart emoji with variation selector', () => {
      expect(isValidEmoji('❤️')).toBe(true);
    });

    it('accepts fire emoji', () => {
      expect(isValidEmoji('🔥')).toBe(true);
    });

    it('accepts folder emoji', () => {
      expect(isValidEmoji('📂')).toBe(true);
    });
  });

  describe('invalid emojis', () => {
    it('rejects empty string', () => {
      expect(isValidEmoji('')).toBe(false);
    });

    it('rejects regular text', () => {
      expect(isValidEmoji('abc')).toBe(false);
    });

    it('rejects numbers', () => {
      expect(isValidEmoji('123')).toBe(false);
    });

    it('rejects multiple emojis', () => {
      expect(isValidEmoji('😂🔥')).toBe(false);
    });
  });
});
