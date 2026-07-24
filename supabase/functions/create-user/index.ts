import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

type CreateUserPayload = {
  full_name?: string;
  email?: string;
  password?: string;
  role?: string;
  phone?: string;
  status?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const allowedCreatorRoles = new Set(['super_admin', 'admin']);
const allowedCreatedRoles = new Set([
  'admin',
  'admissions',
  'academic_manager',
  'teacher',
  'student',
  'finance',
  'viewer',
]);
const allowedStatuses = new Set(['active', 'pending']);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isDuplicateEmailError(message = '') {
  return /already|duplicate|registered|exists|23505/i.test(message);
}

function normalizePayload(payload: CreateUserPayload) {
  return {
    full_name: payload.full_name?.trim() || '',
    email: payload.email?.trim().toLowerCase() || '',
    password: payload.password || '',
    role: payload.role?.trim() || '',
    phone: payload.phone?.trim() || null,
    status: payload.status?.trim() || 'active',
  };
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
    return jsonResponse({ error: 'Create user function is missing required Supabase Edge Function environment variables.', code: 'missing_edge_env' }, 500);
  }

  const authorization = req.headers.get('Authorization') || '';
  const token = authorization.replace('Bearer ', '').trim();

  if (!token) {
    return jsonResponse({ error: 'Missing authorization token.', code: 'not_authenticated' }, 401);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);

  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'Invalid or expired authorization token.', code: 'not_authenticated' }, 401);
  }

  const { data: callerProfile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, status')
    .eq('id', callerData.user.id)
    .maybeSingle();

  if (profileError) {
    return jsonResponse({ error: profileError.message, code: 'profile_lookup_failed' }, 500);
  }

  if (!callerProfile || !allowedCreatorRoles.has(callerProfile.role) || callerProfile.status !== 'active') {
    return jsonResponse({ error: 'Only active Super Admin and Admin accounts can create users.', code: 'not_allowed' }, 403);
  }

  let payload: CreateUserPayload;

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON request body.', code: 'invalid_json' }, 400);
  }

  const account = normalizePayload(payload);

  if (!account.full_name || !account.email || !account.password || !account.role) {
    return jsonResponse({ error: 'Full name, email, password, and role are required.', code: 'validation_error' }, 400);
  }

  if (!isValidEmail(account.email)) {
    return jsonResponse({ error: 'Enter a valid email address.', code: 'validation_error' }, 400);
  }

  if (account.password.length < 8) {
    return jsonResponse({ error: 'Temporary password must be at least 8 characters.', code: 'validation_error' }, 400);
  }

  if (!allowedCreatedRoles.has(account.role)) {
    return jsonResponse({ error: 'Selected role cannot be created from this dashboard.', code: 'validation_error' }, 400);
  }

  if (!allowedStatuses.has(account.status)) {
    return jsonResponse({ error: 'Status must be active or pending.', code: 'validation_error' }, 400);
  }

  const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', account.email)
    .maybeSingle();

  if (existingProfileError) {
    return jsonResponse({ error: existingProfileError.message, code: 'profile_lookup_failed' }, 500);
  }

  if (existingProfile) {
    return jsonResponse({ error: 'An account with this email already exists.', code: 'duplicate_email' }, 409);
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      full_name: account.full_name,
      role: account.role,
    },
  });

  if (authError || !authData.user) {
    const errorMessage = authError?.message || 'Unable to create auth user.';
    const status = isDuplicateEmailError(errorMessage) ? 409 : 400;
    const message = status === 409 ? 'An account with this email already exists.' : errorMessage;
    return jsonResponse({ error: message, code: status === 409 ? 'duplicate_email' : 'auth_create_failed' }, status);
  }

  const createdUserId = authData.user.id;
  const profilePayload = {
    id: createdUserId,
    full_name: account.full_name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    status: account.status,
  };

  const { data: profile, error: insertProfileError } = await supabaseAdmin
    .from('profiles')
    .insert(profilePayload)
    .select('id, full_name, email, phone, role, status, avatar_url, created_at, updated_at')
    .single();

  if (insertProfileError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    const status = isDuplicateEmailError(insertProfileError.message) ? 409 : 400;
    const message = status === 409 ? 'An account with this email already exists.' : insertProfileError.message;
    return jsonResponse({ error: message, code: status === 409 ? 'duplicate_email' : 'profile_insert_failed' }, status);
  }

  if (account.role === 'teacher') {
    const { error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert({
        profile_id: createdUserId,
        full_name: account.full_name,
        status: account.status,
      });

    if (teacherError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      return jsonResponse({ error: teacherError.message, code: 'teacher_insert_failed' }, 400);
    }
  }

  if (account.role === 'student') {
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        profile_id: createdUserId,
        student_name: account.full_name,
        whatsapp: account.phone,
        status: account.status,
      });

    if (studentError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      return jsonResponse({ error: studentError.message, code: 'student_insert_failed' }, 400);
    }
  }

  return jsonResponse({
    success: true,
    profile,
  });
});
