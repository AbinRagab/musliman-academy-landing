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
  lead_type?: string;
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

function errorResponse(message: string, status = 400, details?: unknown) {
  return jsonResponse({ success: false, message, details }, status);
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeFormType(payload: SubmitLeadPayload) {
  const raw = (payload.form_type || payload.requestType || '').trim().toLowerCase();

  if (raw === 'teacher_training' || raw === 'teacher training' || /training/i.test(raw)) {
    return 'teacher_training';
  }

  if (raw === 'free_trial' || raw === 'free trial' || raw === 'trial') {
    return 'free_trial';
  }

  return '';
}

function normalizeLeadType(formType: string) {
  return formType === 'teacher_training' ? 'teacher_training' : 'student';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse('Lead submission function is missing required Supabase secrets.', 500);
  }

  let payload: SubmitLeadPayload;

  try {
    payload = await req.json();
  } catch {
    return errorResponse('Invalid JSON request body.', 400);
  }

  const fullName = (payload.full_name || payload.name || '').trim();
  const whatsapp = (payload.whatsapp || '').trim();
  const country = (payload.country || '').trim();
  const formType = normalizeFormType(payload);
  const leadType = normalizeLeadType(formType);
  const requestedLeadType = (payload.lead_type || '').trim();

  if (!fullName || !whatsapp || !country || !payload.form_type || !payload.lead_type) {
    return errorResponse('Full name, WhatsApp, country, form type, and lead type are required.', 400);
  }

  if (!formType) {
    return errorResponse('Form type must be free_trial or teacher_training.', 400);
  }

  if (!['student', 'teacher_training'].includes(requestedLeadType)) {
    return errorResponse('Lead type must be student or teacher_training.', 400);
  }

  const programInput = formType === 'teacher_training'
    ? 'Teacher Training'
    : (payload.program || '').trim();

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let programId: string | null = null;

  if (programInput) {
    const slug = normalizeSlug(programInput);
    const { data: programs, error: programsError } = await supabaseAdmin
      .from('programs')
      .select('id, name, slug');

    if (programsError) {
      console.error('Program lookup failed:', programsError);
    } else {
      const program = (programs || []).find((item) => (
        item.slug === slug || item.name.toLowerCase() === programInput.toLowerCase()
      ));
      programId = program?.id || null;
    }
  }

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .insert({
      full_name: fullName,
      whatsapp,
      country,
      student_age: payload.student_age || payload.studentAge || null,
      program_id: programId,
      program_name: programInput || null,
      preferred_time: payload.preferred_time || payload.preferredTime || null,
      message: payload.message || null,
      source: payload.source || 'website',
      form_type: formType,
      lead_type: leadType,
      status: 'new',
      lead_priority: 'normal',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Lead insert failed:', error);
    return errorResponse('Could not create CRM lead.', 500, error.message);
  }

  const { error: activityError } = await supabaseAdmin
    .from('lead_activity_logs')
    .insert({
      lead_id: lead.id,
      action_type: 'created',
      description: formType === 'teacher_training'
        ? 'Teacher training application submitted from public website form.'
        : 'Free trial lead submitted from public website form.',
      new_value: 'new',
    });

  if (activityError) {
    console.error('Lead activity insert failed:', activityError);
  }

  return jsonResponse({ success: true, lead });
});
