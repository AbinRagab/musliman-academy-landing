type GoogleTagManagerEvent =
  | {
    event: 'musliman_generate_lead';
    lead_type: 'free_trial';
  }
  | {
    event: 'musliman_whatsapp_click';
    contact_method: 'whatsapp';
  };

declare global {
  interface Window {
    dataLayer?: GoogleTagManagerEvent[];
  }
}

export function pushDataLayerEvent(event: GoogleTagManagerEvent) {
  if (typeof window === 'undefined' || !Array.isArray(window.dataLayer)) {
    return;
  }

  try {
    window.dataLayer.push(event);
  } catch {
    // GTM tracking is best-effort and must not affect conversion flows.
  }
}

export function trackGtmGenerateLead(leadType: 'free_trial' | 'teacher_training') {
  if (leadType !== 'free_trial') {
    return;
  }

  pushDataLayerEvent({
    event: 'musliman_generate_lead',
    lead_type: 'free_trial',
  });
}

export function trackGtmWhatsAppClick() {
  pushDataLayerEvent({
    event: 'musliman_whatsapp_click',
    contact_method: 'whatsapp',
  });
}
