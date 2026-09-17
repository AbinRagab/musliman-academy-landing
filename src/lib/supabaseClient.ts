import { createClient } from '@supabase/supabase-js';

const nextPublicSupabaseUrl =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
const nextPublicSupabaseAnonKey =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? nextPublicSupabaseUrl;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? nextPublicSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigMessage =
  'Missing Supabase environment variables. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for Vite, or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for Next.js.';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
