import { supabase } from '../../lib/supabaseClient';
import { fetchLeads } from './leadsService';
import { applyTeacherIdFilter, getCurrentTeacherContext } from './teacherOperationsService';

export type TrialResult = 'recommended' | 'needs_follow_up' | 'not_suitable' | 'no_show';

export type TrialFeedbackPayload = {
  leadId?: string | null;
  recitationLevel: string;
  tajweedLevel: string;
  arabicLevel: string;
  engagement: string;
  recommendedLevel?: string;
  teacherFeedback?: string;
  recommendation: string;
  notes: string;
  result: TrialResult;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

async function getCurrentUserId() {
  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  return data.session?.user.id || null;
}

export async function fetchTrials(filters: { teacherId?: string; status?: string } = {}) {
  const client = requireSupabase();
  let query = client.from('free_trials').select('*').order('trial_date', { ascending: true });

  if (filters.teacherId) {
    query = query.eq('teacher_id', filters.teacherId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchTeacherTrials(teacherId?: string | null) {
  const context = teacherId ? null : await getCurrentTeacherContext();
  const resolvedTeacherId = teacherId || context?.teacherId || null;

  if (!resolvedTeacherId) {
    return [];
  }

  const client = requireSupabase();
  const query = client.from('free_trials').select('*').order('trial_date', { ascending: true });
  const { data: trials, error } = context
    ? await applyTeacherIdFilter(query, 'teacher_id', context)
    : await query.eq('teacher_id', resolvedTeacherId);

  if (error) {
    if (import.meta.env.DEV) {
      console.error('Teacher free trials query failed:', { teacherId: resolvedTeacherId, error });
    }
    throw error;
  }

  if (import.meta.env.DEV) {
    console.info('Teacher free trials query result:', {
      teacherId: resolvedTeacherId,
      lookupIds: context?.teacherLookupIds || [resolvedTeacherId],
      trials: trials?.length || 0,
    });
  }

  const leadIds = trials.map((trial) => trial.lead_id).filter(Boolean);
  const leads = leadIds.length ? await fetchLeads() : [];

  return trials.map((trial) => ({
    ...trial,
    lead: leads.find((lead) => lead.id === trial.lead_id),
  }));
}

export async function updateTrialStatus(trialId: string, status: string, leadId?: string | null) {
  const client = requireSupabase();
  const { data, error } = await client.from('free_trials').update({ status }).eq('id', trialId).select('*').single();

  if (error) {
    throw error;
  }

  if (leadId) {
    await client.from('lead_activity_logs').insert({
      lead_id: leadId,
      action_type: status === 'no_show' ? 'trial_no_show' : 'trial_status_changed',
      description: `Trial marked ${status}.`,
      new_value: status,
      created_by: await getCurrentUserId(),
    });
  }

  return data;
}

export async function submitTrialFeedback(trialId: string, payload: TrialFeedbackPayload) {
  const client = requireSupabase();
  const status = payload.result === 'no_show' ? 'no_show' : 'completed';
  const teacherFeedback = [
    `Recitation / reading level: ${payload.recitationLevel}`,
    `Tajweed level: ${payload.tajweedLevel}`,
    `Arabic level: ${payload.arabicLevel}`,
    `Engagement: ${payload.engagement}`,
    payload.recommendedLevel ? `Recommended level: ${payload.recommendedLevel}` : '',
    payload.teacherFeedback ? `Teacher feedback: ${payload.teacherFeedback}` : '',
    `Recommendation: ${payload.recommendation}`,
    `Notes: ${payload.notes}`,
  ].filter(Boolean).join('\n');

  const { data, error } = await client
    .from('free_trials')
    .update({
      status,
      result: payload.result,
      teacher_feedback: teacherFeedback,
    })
    .eq('id', trialId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  if (payload.leadId) {
    await client.from('leads').update({ status: status === 'completed' ? 'trial_completed' : 'no_response' }).eq('id', payload.leadId);
    await client.from('lead_activity_logs').insert({
      lead_id: payload.leadId,
      action_type: status === 'completed' ? 'trial_completed' : 'trial_no_show',
      description: `Teacher submitted trial feedback: ${payload.result}.`,
      new_value: payload.result,
      created_by: await getCurrentUserId(),
    });
  }

  return data;
}
