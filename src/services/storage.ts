import type { Library, StorageService } from '../core/types';
import { STORAGE_KEY } from '../core/constants';
import { validateLibrary } from '../core/import-export';

// @specs/DOMAIN.md § 5.2 - localStorage read/write + QuotaExceeded handling
export function createStorageService(): StorageService {
  return {
    load(): Library | null {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        return validateLibrary(JSON.parse(raw));
      } catch {
        return null;
      }
    },

    save(library: Library): boolean {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
        return true;
      } catch {
        return false;
      }
    },
  };
}
