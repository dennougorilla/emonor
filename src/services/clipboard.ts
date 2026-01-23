import type { ClipboardService } from '../core/types';

// @specs/DOMAIN.md § 3.2 - GIF copy (most frequent operation)
export function createClipboardService(): ClipboardService {
  return {
    async writeText(text: string): Promise<void> {
      await navigator.clipboard.writeText(text);
    },
  };
}
