import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {
  renderTemplate,
  sendEmailNotification,
  sendInAppNotification,
  sendWhatsAppTemplate,
  type NotificationProfile,
} from '../_shared/providers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requireEnv() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required Supabase Edge Function environment variables.');
  }

  return { supabaseUrl, serviceRoleKey };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  let eventId = '';

  try {
    const payload = await req.json();
    eventId = String(payload.event_id || '');
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
  }

  if (!eventId) {
    return jsonResponse({ error: 'event_id is required.' }, 400);
  }

  const { supabaseUrl, serviceRoleKey } = requireEnv();
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: event, error: eventError } = await supabaseAdmin
    .from('notification_events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError || !event) {
    return jsonResponse({ error: eventError?.message || 'Notification event not found.' }, 404);
  }

  if (!['pending', 'processing'].includes(event.status)) {
    return jsonResponse({ success: true, skipped: true, status: event.status });
  }

  await supabaseAdmin.from('notification_events').update({ status: 'processing' }).eq('id', eventId);

  const { data: template, error: templateError } = await supabaseAdmin
    .from('notification_templates')
    .select('*')
    .eq('template_key', event.template_key)
    .eq('channel', event.channel)
    .eq('is_active', true)
    .maybeSingle();

  if (templateError || !template) {
    await markFailed(supabaseAdmin, event, 'Template not found or inactive.');
    return jsonResponse({ error: 'Template not found or inactive.' }, 400);
  }

  const { data: profile } = event.recipient_id
    ? await supabaseAdmin.from('profiles').select('id, full_name, email, phone, role').eq('id', event.recipient_id).maybeSingle<NotificationProfile>()
    : { data: null };

  const payload = (event.payload || {}) as Record<string, unknown>;
  const deliveryProfile = {
    ...(profile || {}),
    email: String(payload.recipient_email || profile?.email || ''),
    phone: String(payload.recipient_phone || profile?.phone || ''),
    full_name: String(payload.recipient_name || profile?.full_name || event.recipient_role || 'Recipient'),
  } as NotificationProfile;
  const message = renderTemplate(String(template.body || ''), payload);
  const subject = renderTemplate(String(template.title || event.event_type || 'Musliman Academy notification'), payload);

  try {
    const result = event.channel === 'in_app'
      ? await sendInAppNotification(supabaseAdmin, event, template, message)
      : event.channel === 'email'
        ? await sendEmailNotification(deliveryProfile, subject, message)
        : await sendWhatsAppTemplate(deliveryProfile, template.whatsapp_template_name, payload, message);

    await supabaseAdmin.from('notification_logs').insert({
      event_id: event.id,
      recipient_id: event.recipient_id,
      recipient_role: event.recipient_role,
      channel: event.channel,
      template_key: event.template_key,
      provider: result.provider,
      provider_message_id: result.providerMessageId,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    await supabaseAdmin
      .from('notification_events')
      .update({ status: 'sent', processed_at: new Date().toISOString() })
      .eq('id', event.id);

    return jsonResponse({ success: true, provider: result.provider, provider_message_id: result.providerMessageId });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Notification send failed.';
    await markFailed(supabaseAdmin, event, messageText);
    return jsonResponse({ error: messageText }, 500);
  }
});

async function markFailed(supabaseAdmin: ReturnType<typeof createClient>, event: Record<string, unknown>, errorMessage: string) {
  await supabaseAdmin.from('notification_events').update({
    status: 'failed',
    processed_at: new Date().toISOString(),
  }).eq('id', event.id);

  await supabaseAdmin.from('notification_logs').insert({
    event_id: event.id,
    recipient_id: event.recipient_id,
    recipient_role: event.recipient_role,
    channel: event.channel,
    template_key: event.template_key,
    provider: event.channel || 'unknown',
    status: 'failed',
    error_message: errorMessage,
  });
}
