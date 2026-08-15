type MetaEventParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (action: 'track', eventName: string, params?: MetaEventParams) => void;
  }
}

export function trackMetaEvent(eventName: string, params?: MetaEventParams) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return;
  }

  try {
    if (params) {
      window.fbq('track', eventName, params);
      return;
    }

    window.fbq('track', eventName);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Meta Pixel event tracking failed:', error);
    }
  }
}

export function trackWhatsAppContact() {
  trackMetaEvent('Contact');
}
