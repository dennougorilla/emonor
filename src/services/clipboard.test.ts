import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClipboardService } from './clipboard';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createClipboardService', () => {
  it('delegates text writes to the browser clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await createClipboardService().writeText('https://example.com/a.gif');

    expect(writeText).toHaveBeenCalledWith('https://example.com/a.gif');
  });

  it('propagates clipboard permission failures', async () => {
    const error = new Error('permission denied');
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => Promise.reject(error)) },
    });

    await expect(createClipboardService().writeText('text')).rejects.toBe(error);
  });
});
