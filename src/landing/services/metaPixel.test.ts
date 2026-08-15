import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackMetaEvent, trackWhatsAppContact } from './metaPixel';

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

  it('tracks WhatsApp contact clicks as a standard Contact event', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    trackWhatsAppContact();

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith('track', 'Contact');
  });

  it('does nothing when Meta Pixel is unavailable', () => {
    expect(() => trackMetaEvent('Lead')).not.toThrow();
    expect(() => trackWhatsAppContact()).not.toThrow();
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
