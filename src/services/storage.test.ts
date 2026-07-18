import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageService } from './storage';
import type { Library } from '../core/types';
import { DEFAULT_TAGS, STORAGE_KEY } from '../core/constants';

function createLibrary(): Library {
  return { version: '1.0', tags: [...DEFAULT_TAGS], gifs: [] };
}

describe('createStorageService', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
    });
  });

  describe('load', () => {
    it('returns null when no data in storage', () => {
      const service = createStorageService();
      expect(service.load()).toBeNull();
    });

    it('returns parsed library when data exists', () => {
      const library = createLibrary();
      mockStorage[STORAGE_KEY] = JSON.stringify(library);

      const service = createStorageService();
      const result = service.load();

      expect(result).not.toBeNull();
      expect(result!.version).toBe('1.0');
    });

    it('returns null for invalid JSON', () => {
      mockStorage[STORAGE_KEY] = 'not valid json';

      const service = createStorageService();
      expect(service.load()).toBeNull();
    });

    it('returns null for data missing required fields', () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({ foo: 'bar' });

      const service = createStorageService();
      expect(service.load()).toBeNull();
    });

    it('returns null for structurally invalid library members', () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({
        version: '1.0',
        tags: [null],
        gifs: [],
      });

      const service = createStorageService();
      expect(service.load()).toBeNull();
    });

    it('returns null for an unsupported library version', () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({ version: '2.0', tags: [], gifs: [] });

      const service = createStorageService();
      expect(service.load()).toBeNull();
    });
  });

  describe('save', () => {
    it('serializes library to localStorage', () => {
      const service = createStorageService();
      const library = createLibrary();

      const saved = service.save(library);

      expect(saved).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(library)
      );
    });

    it('handles QuotaExceededError gracefully', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(() => {
          const error = new DOMException('quota exceeded', 'QuotaExceededError');
          throw error;
        }),
      });

      const service = createStorageService();
      const library = createLibrary();

      expect(service.save(library)).toBe(false);
    });
  });
});
