import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushDataLayerEvent, trackGtmGenerateLead, trackGtmWhatsAppClick } from './googleTagManager';

describe('Google Tag Manager dataLayer tracking', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.dataLayer;
    vi.restoreAllMocks();
  });

  it('pushes musliman_generate_lead once for a successful Free Trial submission', () => {
    window.dataLayer = [];

    trackGtmGenerateLead('free_trial');

    expect(window.dataLayer).toEqual([
      {
        event: 'musliman_generate_lead',
        lead_type: 'free_trial',
      },
    ]);
  });

  it('does not push musliman_generate_lead for Teacher Training submissions', () => {
    window.dataLayer = [];

    trackGtmGenerateLead('teacher_training');

    expect(window.dataLayer).toEqual([]);
  });

  it('pushes musliman_whatsapp_click for WhatsApp tracking', () => {
    window.dataLayer = [];

    trackGtmWhatsAppClick();

    expect(window.dataLayer).toEqual([
      {
        event: 'musliman_whatsapp_click',
        contact_method: 'whatsapp',
      },
    ]);
  });

  it('does not throw when dataLayer is missing or the browser environment is unavailable', () => {
    expect(() => trackGtmGenerateLead('free_trial')).not.toThrow();
    expect(() => trackGtmWhatsAppClick()).not.toThrow();

    vi.stubGlobal('window', undefined);

    expect(() => trackGtmGenerateLead('free_trial')).not.toThrow();
    expect(() => trackGtmWhatsAppClick()).not.toThrow();
  });

  it('does not throw when dataLayer push fails', () => {
    window.dataLayer = [];
    vi.spyOn(window.dataLayer, 'push').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => pushDataLayerEvent({
      event: 'musliman_whatsapp_click',
      contact_method: 'whatsapp',
    })).not.toThrow();
  });
});
