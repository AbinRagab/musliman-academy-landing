import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export type WebsiteLeadPayload = {
  full_name: string;
  whatsapp: string;
  country: string;
  student_age?: string;
  program?: string;
  preferred_time?: string;
  message?: string;
  source?: string;
  form_type?: string;
};

export async function submitWebsiteLeadToCrm(payload: WebsiteLeadPayload) {
  if (!isSupabaseConfigured || !supabase) {
    if (import.meta.env.DEV) {
      console.warn('Supabase is not configured. Website lead was not sent to CRM.');
    }

    return { skipped: true };
  }

  const { data, error } = await supabase.functions.invoke('submit-lead', {
    body: payload,
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.error('submit-lead Edge Function error:', error);
    }

    throw error;
  }

  return data;
}
