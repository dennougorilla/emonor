import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadJson } from './file-download';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('downloadJson', () => {
  it('downloads a JSON blob and revokes its object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:emonor-test');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadJson('{"version":"1.0"}', 'backup.json');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.body.querySelector('a[download="backup.json"]')).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:emonor-test');
  });
});
