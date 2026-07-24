import { supabase } from '../../lib/supabaseClient';
import type { AuthRole, UserProfile } from '../auth/AuthProvider';

export type AccountStatus = 'active' | 'pending' | 'inactive' | 'suspended';
export type CreateAccountPayload = {
  full_name: string;
  email: string;
  password: string;
  role: Exclude<AuthRole, 'super_admin'>;
  phone?: string;
  status: 'active' | 'pending';
};

export type ProfileRow = UserProfile & {
  phone?: string | null;
  created_at?: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

function getRawErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '';
}

function isDuplicateEmailMessage(message: string) {
  return /already|duplicate|23505|registered|exists/i.test(message);
}

async function getFunctionErrorMessage(error: unknown) {
  if (import.meta.env.DEV) {
    console.error('create-user Edge Function error:', error);
  }

  const context = (error as { context?: Response })?.context;
  const status = context?.status;
  let bodyMessage = '';

  if (context?.json) {
    try {
      const body = await context.clone().json();

      if (typeof body?.error === 'string') {
        bodyMessage = body.error;
      }
    } catch {
      // Fall back to the SDK error message below.
    }
  }

  const rawMessage = bodyMessage || getRawErrorMessage(error);

  if (status === 401 || status === 403) {
    return 'You do not have permission to create accounts.';
  }

  if (status === 409 || isDuplicateEmailMessage(rawMessage)) {
    return 'An account with this email already exists.';
  }

  if (status === 404 || /failed to send a request|fetch|network|edge function/i.test(rawMessage)) {
    return 'Could not reach the create-user Edge Function. Please make sure it is deployed and configured.';
  }

  return rawMessage || 'Unable to complete create-user request.';
}

export async function fetchProfiles() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, phone, role, status, avatar_url, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as ProfileRow[];
}

export async function createUserAccount(payload: CreateAccountPayload) {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error('Your session expired. Please sign in again.');
  }

  const { data, error } = await client.functions.invoke('create-user', {
    body: payload,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.profile as ProfileRow;
}

export async function updateUserRole(profileId: string, role: AuthRole) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .select('id, full_name, email, phone, role, status, avatar_url, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileRow;
}

export async function updateUserStatus(profileId: string, status: AccountStatus) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .update({ status })
    .eq('id', profileId)
    .select('id, full_name, email, phone, role, status, avatar_url, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileRow;
}
