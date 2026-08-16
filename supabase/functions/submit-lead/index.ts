import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

type SubmitLeadPayload = {
  full_name?: string;
  name?: string;
  whatsapp?: string;
  country?: string;
  student_age?: string;
  studentAge?: string;
  program_id?: string;
  programId?: string;
  program?: string;
  preferred_time?: string;
  preferredTime?: string;
  message?: string;
  source?: string;
  form_type?: string;
  lead_type?: string;
  requestType?: string;
  meta_event_id?: string;
  event_source_url?: string;
  fbp?: string;
  fbc?: string;
};

type MetaUserData = {
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
};

type MetaCapiEvent = {
  event_name: 'Lead';
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source: 'website';
  user_data: MetaUserData;
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

function sanitizeOptionalString(value?: string) {
  const trimmed = (value || '').trim();
  return trimmed || undefined;
}

function isHeaderIpCandidate(value: string) {
  return /^[a-f0-9:.\s]+$/i.test(value) && (value.includes('.') || value.includes(':'));
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for');

  if (forwardedFor) {
    const forwardedIp = forwardedFor.split(',').map((value) => value.trim()).find(isHeaderIpCandidate);

    if (forwardedIp) {
      return forwardedIp;
    }
  }

  const cloudflareIp = (req.headers.get('cf-connecting-ip') || '').trim();

  return cloudflareIp && isHeaderIpCandidate(cloudflareIp) ? cloudflareIp : undefined;
}

function buildMetaUserData(req: Request, payload: SubmitLeadPayload): MetaUserData {
  return {
    client_ip_address: getClientIp(req),
    client_user_agent: sanitizeOptionalString(req.headers.get('user-agent') || undefined),
    fbp: sanitizeOptionalString(payload.fbp),
    fbc: sanitizeOptionalString(payload.fbc),
  };
}

async function sendMetaLeadEvent(req: Request, payload: SubmitLeadPayload, eventId: string) {
  const metaPixelId = Deno.env.get('META_PIXEL_ID');
  const metaAccessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN');

  if (!metaPixelId || !metaAccessToken) {
    console.error('Meta CAPI Lead skipped: missing Meta Edge Function configuration.');
    return;
  }

  const event: MetaCapiEvent = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: sanitizeOptionalString(payload.event_source_url),
    action_source: 'website',
    user_data: buildMetaUserData(req, payload),
  };
  const testEventCode = sanitizeOptionalString(Deno.env.get('META_TEST_EVENT_CODE') || undefined);
  const body: { data: MetaCapiEvent[]; test_event_code?: string } = { data: [event] };

  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v25.0/${encodeURIComponent(metaPixelId)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${metaAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let metaError = `HTTP ${response.status}`;

      try {
        const responseBody = await response.json();
        metaError = String(responseBody?.error?.message || metaError);
      } catch {
        // Keep the sanitized status-only fallback.
      }

      console.error('Meta CAPI Lead request failed:', {
        event_id: eventId,
        status: response.status,
        error: metaError,
      });
    }
  } catch (error) {
    console.error('Meta CAPI Lead request failed:', {
      event_id: eventId,
      error: error instanceof Error ? error.message : 'Unknown Meta CAPI error',
    });
  }
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
    return errorResponse('Lead submission function is missing required Supabase Edge Function environment variables.', 500);
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

  const requestedProgramId = (payload.program_id || payload.programId || '').trim();

  if (requestedProgramId) {
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('id', requestedProgramId)
      .maybeSingle();

    if (programError) {
      console.error('Program id lookup failed:', programError);
    }

    programId = program?.id || null;
  }

  if (!programId && programInput) {
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

  const metaEventId = sanitizeOptionalString(payload.meta_event_id);

  if (formType === 'free_trial' && metaEventId) {
    await sendMetaLeadEvent(req, payload, metaEventId);
  }

  return jsonResponse({ success: true, lead });
});
