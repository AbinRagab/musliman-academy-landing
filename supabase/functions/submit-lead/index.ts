import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

type SubmitLeadPayload = {
  full_name?: string;
  name?: string;
  whatsapp?: string;
  country?: string;
  student_age?: string;
  studentAge?: string;
  program?: string;
  preferred_time?: string;
  preferredTime?: string;
  message?: string;
  source?: string;
  form_type?: string;
  requestType?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeFormType(payload: SubmitLeadPayload) {
  const raw = payload.form_type || payload.requestType || '';

  if (/training/i.test(raw)) {
    return 'teacher_training';
  }

  return 'free_trial';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.', code: 'method_not_allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Lead submission function is missing required Supabase secrets.', code: 'missing_secrets' }, 500);
  }

  let payload: SubmitLeadPayload;

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.', code: 'invalid_json' }, 400);
  }

  const fullName = (payload.full_name || payload.name || '').trim();
  const whatsapp = (payload.whatsapp || '').trim();
  const country = (payload.country || '').trim();
  const programInput = (payload.program || '').trim();

  if (!fullName || !whatsapp || !country) {
    return jsonResponse({ error: 'Full name, WhatsApp, and country are required.', code: 'validation_error' }, 400);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let programId: string | null = null;

  if (programInput) {
    const slug = normalizeSlug(programInput);
    const { data: programs } = await supabaseAdmin
      .from('programs')
      .select('id, name, slug');

    const program = (programs || []).find((item) => item.slug === slug || item.name.toLowerCase() === programInput.toLowerCase());
    programId = program?.id || null;
  }

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .insert({
      full_name: fullName,
      whatsapp,
      country,
      student_age: payload.student_age || payload.studentAge || null,
      program_id: programId,
      preferred_time: payload.preferred_time || payload.preferredTime || null,
      message: payload.message || null,
      source: payload.source || 'website',
      form_type: normalizeFormType(payload),
      status: 'new',
      lead_priority: 'normal',
    })
    .select('*')
    .single();

  if (error) {
    return jsonResponse({ error: error.message, code: 'lead_insert_failed' }, 500);
  }

  await supabaseAdmin
    .from('lead_activity_logs')
    .insert({
      lead_id: lead.id,
      action_type: 'created',
      description: 'Lead submitted from public website form.',
      new_value: 'new',
    });

  return jsonResponse({ success: true, lead });
});
