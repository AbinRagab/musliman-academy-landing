import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackMetaEvent } from './metaPixel';

describe('trackMetaEvent', () => {
  afterEach(() => {
    delete window.fbq;
    vi.restoreAllMocks();
  });

  it('tracks a standard Meta event without parameters', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    trackMetaEvent('Lead');

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith('track', 'Lead');
  });

  it('does nothing when Meta Pixel is unavailable', () => {
    expect(() => trackMetaEvent('Lead')).not.toThrow();
  });

  it('does not throw when Meta Pixel tracking fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    window.fbq = vi.fn(() => {
      throw new Error('blocked');
    });

    expect(() => trackMetaEvent('Lead')).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
