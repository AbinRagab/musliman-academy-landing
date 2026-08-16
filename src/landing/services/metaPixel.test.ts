import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMetaLeadTrackingData, trackMetaEvent, trackWhatsAppContact } from './metaPixel';

describe('trackMetaEvent', () => {
  afterEach(() => {
    delete window.fbq;
    document.cookie = '_fbp=; Max-Age=0; path=/';
    document.cookie = '_fbc=; Max-Age=0; path=/';
    vi.restoreAllMocks();
  });

  it('tracks a standard Meta event without parameters', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    trackMetaEvent('Lead');

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith('track', 'Lead');
  });

  it('tracks a Meta event with an event ID for browser/server deduplication', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    trackMetaEvent('Lead', undefined, { eventID: 'test-event-123' });

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith('track', 'Lead', {}, { eventID: 'test-event-123' });
  });

  it('tracks WhatsApp contact clicks as a standard Contact event', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    trackWhatsAppContact();

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith('track', 'Contact');
  });

  it('captures Meta browser identifiers when cookies are available', () => {
    document.cookie = '_fbp=fb.1.1234567890.1111111111; path=/';
    document.cookie = '_fbc=fb.1.1234567890.test-click-id; path=/';

    expect(getMetaLeadTrackingData()).toMatchObject({
      fbp: 'fb.1.1234567890.1111111111',
      fbc: 'fb.1.1234567890.test-click-id',
      event_source_url: window.location.href,
    });
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
