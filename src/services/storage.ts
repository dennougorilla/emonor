import type { Library, StorageService } from '../core/types';
import { STORAGE_KEY } from '../core/constants';

// @specs/DOMAIN.md § 5.2 - localStorage read/write + QuotaExceeded handling
export function createStorageService(): StorageService {
  return {
    load(): Library | null {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return null;
        if (!('version' in data) || !('tags' in data) || !('gifs' in data)) return null;

        return data as Library;
      } catch {
        return null;
      }
    },

    save(library: Library): void {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          // Storage full — could notify user in future
        }
      }
    },
  };
}
