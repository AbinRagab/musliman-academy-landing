import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

type TestPayload = {
  channel?: 'in_app' | 'email' | 'whatsapp';
  recipient_id?: string;
  template_key?: string;
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing required Supabase Edge Function environment variables.' }, 500);
  }

  const authorization = req.headers.get('Authorization') || '';
  const token = authorization.replace('Bearer ', '').trim();

  if (!token) {
    return jsonResponse({ error: 'Missing authorization token.' }, 401);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);

  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'Invalid or expired authorization token.' }, 401);
  }

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, role, status')
    .eq('id', callerData.user.id)
    .maybeSingle();

  if (!callerProfile || !['super_admin', 'admin', 'academic_manager'].includes(callerProfile.role) || callerProfile.status !== 'active') {
    return jsonResponse({ error: 'Only active admin accounts can send test notifications.' }, 403);
  }

  let payload: TestPayload;

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
  }

  const channel = payload.channel || 'in_app';
  const recipientId = payload.recipient_id || callerProfile.id;
  const templateKey = payload.template_key || 'teacher_class_reminder_10_min';
  const providerStatus = {
    email_configured: Boolean(Deno.env.get('EMAIL_API_KEY') && Deno.env.get('EMAIL_FROM')),
    whatsapp_configured: Boolean(Deno.env.get('WHATSAPP_ACCESS_TOKEN') && Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')),
  };

  const { data: event, error: eventError } = await supabaseAdmin
    .from('notification_events')
    .insert({
      event_type: 'test_notification',
      related_entity_type: 'settings',
      recipient_id: recipientId,
      recipient_role: 'admin',
      channel,
      template_key: templateKey,
      payload: {
        teacher_name: 'Test Teacher',
        student_name: 'Test Student',
        program_name: 'Quran Reading',
        class_time: new Date().toISOString(),
        class_name: 'Test Class',
        reason: 'Admin test notification',
      },
      scheduled_for: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (eventError || !event) {
    return jsonResponse({ error: eventError?.message || 'Could not create test event.' }, 500);
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_id: event.id }),
  });

  const result = await response.json().catch(() => ({}));

  return jsonResponse({
    success: response.ok,
    event_id: event.id,
    provider_status: providerStatus,
    result,
  }, response.ok ? 200 : 500);
});
