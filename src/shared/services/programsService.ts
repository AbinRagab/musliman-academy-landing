import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export type ProgramRecord = {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
  description: string | null;
};

let cachedPrograms: ProgramRecord[] | null = null;
let inflightPrograms: Promise<ProgramRecord[]> | null = null;

function normalizeProgram(row: Record<string, unknown>): ProgramRecord {
  return {
    id: String(row.id),
    name: String(row.name || row.title || row.program_name || 'Untitled program'),
    slug: row.slug ? String(row.slug) : null,
    status: row.status ? String(row.status) : null,
    description: row.description ? String(row.description) : null,
  };
}

export async function fetchPrograms({ activeOnly = true, force = false }: { activeOnly?: boolean; force?: boolean } = {}) {
  if (!force && cachedPrograms) {
    return cachedPrograms;
  }

  if (!force && inflightPrograms) {
    return inflightPrograms;
  }

  if (!supabase) {
    if (import.meta.env.DEV) {
      console.warn('Programs fetch skipped: Supabase is not configured.');
    }
    cachedPrograms = [];
    return cachedPrograms;
  }

  inflightPrograms = (async () => {
    let query = supabase
      .from('programs')
      .select('id, name, slug, status')
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      if (import.meta.env.DEV) {
        console.warn('Programs fetch failed. Check public.programs RLS/read policy:', error);
      }
      throw error;
    }

    const programs = (data || []).map((row) => normalizeProgram(row as Record<string, unknown>));

    if (programs.length === 0 && import.meta.env.DEV) {
      console.warn('public.programs returned 0 active records for Set Program dropdown.', { activeOnly, rowCount: data?.length || 0 });
    }

    cachedPrograms = programs;
    return programs;
  })();

  try {
    return await inflightPrograms;
  } finally {
    inflightPrograms = null;
  }
}

export function usePrograms() {
  const [programs, setPrograms] = useState<ProgramRecord[]>(cachedPrograms || []);
  const [loading, setLoading] = useState(!cachedPrograms);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await fetchPrograms({ force: true });
      setPrograms(rows);
      return rows;
    } catch {
      setError('Unable to load programs');
      setPrograms([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (cachedPrograms) {
      return undefined;
    }

    setLoading(true);
    fetchPrograms()
      .then((rows) => {
        if (!cancelled) {
          setPrograms(rows);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrograms([]);
          setError('Unable to load programs');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, error, programs, refetch };
}
