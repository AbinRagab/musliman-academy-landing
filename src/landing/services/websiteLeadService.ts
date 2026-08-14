import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

export type WebsiteLeadPayload = {
  full_name: string;
  whatsapp: string;
  country: string;
  student_age?: string;
  program_id?: string;
  program?: string;
  preferred_time?: string;
  message?: string;
  source?: string;
  form_type?: string;
  lead_type?: 'student' | 'teacher_training';
};

async function getFunctionErrorMessage(error: unknown) {
  const fallback = error instanceof Error ? error.message : 'Website lead submission failed.';
  const maybeContext = (error as { context?: Response } | null)?.context;

  if (!maybeContext) {
    return fallback;
  }

  try {
    const body = await maybeContext.clone().json();
    return body?.message || body?.error || fallback;
  } catch {
    return fallback;
  }
}

export async function submitWebsiteLeadToCrm(payload: WebsiteLeadPayload) {
  if (!isSupabaseConfigured || !supabase) {
    if (import.meta.env.DEV) {
      console.error('Missing Supabase environment variables.');
    }

    throw new Error('Missing Supabase environment variables.');
  }

  const { data, error } = await supabase.functions.invoke('submit-lead', {
    body: payload,
  });

  if (error) {
    const message = await getFunctionErrorMessage(error);

    if (import.meta.env.DEV) {
      if (/failed to fetch|fetch failed|network/i.test(error.message)) {
        console.error('submit-lead Edge Function is not reachable. Make sure it is deployed.');
      }

      console.error('submit-lead Edge Function error:', error);
      console.error('submit-lead Edge Function message:', message);
    }

    throw new Error(message);
  }

  if (!data?.success) {
    const message = data?.message || 'Website lead submission failed.';

    if (import.meta.env.DEV) {
      console.error('submit-lead Edge Function returned an unsuccessful response:', data);
    }

    throw new Error(message);
  }

  return data;
}
