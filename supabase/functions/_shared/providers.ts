import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

export type NotificationProfile = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
};

export type ProviderResult = {
  provider: string;
  providerMessageId?: string | null;
};

export function renderTemplate(template: string, payload: Record<string, unknown>) {
  return Object.entries(payload || {}).reduce((body, [key, value]) => (
    body.replaceAll(`{{${key}}}`, String(value ?? ''))
  ), template || '');
}

export async function sendInAppNotification(
  supabaseAdmin: SupabaseClient,
  event: Record<string, unknown>,
  template: Record<string, unknown>,
  message: string,
) {
  const recipientId = event.recipient_id ? String(event.recipient_id) : '';

  if (!recipientId) {
    throw new Error('In-app notification requires a recipient_id.');
  }

  const { error } = await supabaseAdmin.from('in_app_notifications').insert({
    event_id: event.id,
    recipient_id: recipientId,
    recipient_role: event.recipient_role,
    title: template.title || event.event_type || 'Notification',
    message,
    type: inferNotificationType(String(event.event_type || 'system')),
    related_entity_type: event.related_entity_type,
    related_entity_id: event.related_entity_id,
    related_url: relatedUrl(String(event.related_entity_type || ''), event.related_entity_id ? String(event.related_entity_id) : ''),
  });

  if (error) {
    throw error;
  }

  return { provider: 'in_app', providerMessageId: null } satisfies ProviderResult;
}

export async function sendEmailNotification(profile: NotificationProfile, subject: string, message: string) {
  const apiKey = Deno.env.get('EMAIL_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM');
  const providerUrl = Deno.env.get('EMAIL_PROVIDER_URL') || 'https://api.resend.com/emails';

  if (!apiKey || !emailFrom) {
    throw new Error('Email provider secrets are missing.');
  }

  if (!profile.email) {
    throw new Error('Recipient email is missing.');
  }

  const response = await fetch(providerUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [profile.email],
      subject,
      text: message,
      html: `<p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>`,
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(String(body.message || body.error || `Email provider failed with ${response.status}`));
  }

  return { provider: 'email', providerMessageId: String(body.id || '') } satisfies ProviderResult;
}

export async function sendWhatsAppTemplate(
  profile: NotificationProfile,
  templateName: string | null,
  payload: Record<string, unknown>,
  fallbackMessage: string,
) {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const providerUrl = Deno.env.get('WHATSAPP_PROVIDER_URL') || 'https://graph.facebook.com/v20.0';

  if (!accessToken || !phoneNumberId) {
    throw new Error('WhatsApp provider secrets are missing.');
  }

  if (!profile.phone) {
    throw new Error('Recipient WhatsApp phone is missing.');
  }

  const body = templateName
    ? {
      messaging_product: 'whatsapp',
      to: normalizePhone(profile.phone),
      type: 'template',
      template: {
        name: templateName,
        language: { code: String(payload.language_code || 'en') },
        components: buildTemplateComponents(payload),
      },
    }
    : {
      messaging_product: 'whatsapp',
      to: normalizePhone(profile.phone),
      type: 'text',
      text: { body: fallbackMessage },
    };

  const response = await fetch(`${providerUrl}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(String(responseBody.error?.message || `WhatsApp provider failed with ${response.status}`));
  }

  return {
    provider: 'whatsapp',
    providerMessageId: responseBody.messages?.[0]?.id ? String(responseBody.messages[0].id) : null,
  } satisfies ProviderResult;
}

function buildTemplateComponents(payload: Record<string, unknown>) {
  const variables = Object.entries(payload)
    .filter(([key]) => !['language_code'].includes(key))
    .map(([, value]) => ({ type: 'text', text: String(value ?? '') }));

  return variables.length ? [{ type: 'body', parameters: variables }] : undefined;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
}

function inferNotificationType(eventType: string) {
  if (/warning/i.test(eventType)) return 'warning';
  if (/missing|alert|no_checkin/i.test(eventType)) return 'alert';
  if (/reminder/i.test(eventType)) return 'reminder';
  if (/payment/i.test(eventType)) return 'payment';
  if (/homework/i.test(eventType)) return 'homework';
  if (/class/i.test(eventType)) return 'class';
  return 'system';
}

function relatedUrl(entityType: string, entityId: string) {
  if (!entityType || !entityId) return null;
  if (entityType === 'class') return '/dashboard/teacher/classes';
  if (entityType === 'teacher') return '/dashboard/admin/compliance';
  return null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
