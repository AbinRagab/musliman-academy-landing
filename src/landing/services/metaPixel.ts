type MetaEventParams = Record<string, unknown>;
type MetaEventOptions = {
  eventID?: string;
};

export type MetaLeadTrackingData = {
  meta_event_id: string;
  event_source_url?: string;
  fbp?: string;
  fbc?: string;
};

declare global {
  interface Window {
    fbq?: (action: 'track', eventName: string, params?: MetaEventParams, options?: MetaEventOptions) => void;
  }
}

function getCookie(name: string) {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookies = document.cookie ? document.cookie.split('; ') : [];
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = cookies.find((item) => item.startsWith(prefix));

  if (!cookie) {
    return undefined;
  }

  const value = cookie.slice(prefix.length);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function createMetaEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `meta-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getMetaLeadTrackingData(): MetaLeadTrackingData {
  return {
    meta_event_id: createMetaEventId(),
    event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc'),
  };
}

export function trackMetaEvent(eventName: string, params?: MetaEventParams, options?: MetaEventOptions) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return;
  }

  try {
    if (options) {
      window.fbq('track', eventName, params || {}, options);
      return;
    }

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
