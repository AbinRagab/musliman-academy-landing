import { supabase } from '../../lib/supabaseClient';
import type { AuthRole } from '../auth/AuthProvider';
import { fetchPrograms as fetchActivePrograms } from './programsService';
import { fetchActiveTeacherOptions, resolveTeacherNamesById } from './teachersService';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'no_response'
  | 'follow_up_later'
  | 'trial_scheduled'
  | 'trial_completed'
  | 'enrolled'
  | 'lost';

export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent';
export type LeadType = 'student' | 'teacher_training';

export type LeadRecord = {
  id: string;
  full_name: string;
  whatsapp: string | null;
  country: string | null;
  student_age: string | null;
  program_id: string | null;
  program_name: string | null;
  preferred_time: string | null;
  message: string | null;
  source: string | null;
  form_type: string | null;
  lead_type: LeadType | null;
  status: LeadStatus;
  assigned_to: string | null;
  assigned_teacher_id: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  lead_priority: LeadPriority | null;
  lost_reason: string | null;
  converted_student_id: string | null;
  created_at: string;
  updated_at: string;
  programName?: string;
  assignedOwnerName?: string;
  assignedTeacherName?: string;
};

export type LeadActivity = {
  id: string;
  lead_id: string;
  action_type: string;
  description: string | null;
  old_value: string | null;
  new_value: string | null;
  created_by: string | null;
  created_at: string;
  createdByName?: string;
};

export type TeacherOption = {
  id: string;
  full_name: string;
  email: string;
  specialization?: string | null;
  languages?: string[] | null;
  availability?: string | null;
  assignedStudents: number;
  activeTrialLoad: number;
};

export type LeadFilters = {
  search?: string;
  status?: LeadStatus | 'all';
  programId?: string | 'all';
  source?: string | 'all';
  assignedOwnerId?: string | 'all';
  assignedTeacherId?: string | 'all';
  followUpToday?: boolean;
};

export type CreateLeadPayload = {
  full_name: string;
  whatsapp?: string;
  country?: string;
  student_age?: string;
  program_id?: string;
  program_name?: string;
  preferred_time?: string;
  message?: string;
  source?: string;
  form_type?: string;
  lead_type?: LeadType;
};

export type UpdateLeadPayload = Partial<{
  full_name: string;
  whatsapp: string | null;
  country: string | null;
  student_age: string | null;
  program_id: string | null;
  program_name: string | null;
  preferred_time: string | null;
  message: string | null;
  source: string | null;
  form_type: string | null;
  lead_type: LeadType;
  status: LeadStatus;
  assigned_to: string | null;
  assigned_teacher_id: string | null;
  next_follow_up_at: string | null;
  lost_reason: string | null;
  notes: string | null;
}>;

export type ScheduleTrialPayload = {
  leadId: string;
  teacherId: string;
  programId?: string | null;
  trialDate: string;
  trialTime: string;
  meetingLink?: string;
  notes?: string;
};

export type ConvertLeadPayload = {
  student_name: string;
  parent_name?: string;
  whatsapp?: string;
  country?: string;
  age?: string;
  program_id?: string | null;
  level?: string;
  assigned_teacher_id?: string | null;
  schedule_notes?: string;
  start_date?: string;
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

async function addActivity(leadId: string, actionType: string, description: string, oldValue?: string | null, newValue?: string | null) {
  const client = requireSupabase();
  const currentUserId = await getCurrentUserId();

  await client.from('lead_activity_logs').insert({
    lead_id: leadId,
    action_type: actionType,
    description,
    old_value: oldValue || null,
    new_value: newValue || null,
    created_by: currentUserId,
  });
}

async function hydrateLeads(leads: LeadRecord[]) {
  const client = requireSupabase();
  const programIds = Array.from(new Set(leads.map((lead) => lead.program_id).filter(Boolean))) as string[];
  const ownerProfileIds = Array.from(new Set(leads.map((lead) => lead.assigned_to).filter(Boolean))) as string[];
  const teacherIds = Array.from(new Set(leads.map((lead) => lead.assigned_teacher_id).filter(Boolean))) as string[];

  const [{ data: programs }, { data: profiles }, teacherById] = await Promise.all([
    programIds.length
      ? client.from('programs').select('id, name').in('id', programIds)
      : Promise.resolve({ data: [] }),
    ownerProfileIds.length
      ? client.from('profiles').select('id, full_name').in('id', ownerProfileIds)
      : Promise.resolve({ data: [] }),
    resolveTeacherNamesById(teacherIds),
  ]);

  const programById = new Map((programs || []).map((program) => [program.id, program.name]));
  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile.full_name]));

  return leads.map((lead) => ({
    ...lead,
    programName: lead.program_id
      ? programById.get(lead.program_id) || lead.program_name || 'Program not assigned'
      : lead.program_name || 'Program not assigned',
    assignedOwnerName: lead.assigned_to ? profileById.get(lead.assigned_to) || 'Assigned owner' : 'Unassigned',
    assignedTeacherName: lead.assigned_teacher_id ? teacherById.get(lead.assigned_teacher_id) || 'Assigned teacher' : 'Unassigned',
  }));
}

export async function fetchLeads(filters: LeadFilters = {}) {
  const client = requireSupabase();
  let query = client
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.programId && filters.programId !== 'all') {
    query = query.eq('program_id', filters.programId);
  }

  if (filters.source && filters.source !== 'all') {
    query = query.eq('source', filters.source);
  }

  if (filters.assignedOwnerId && filters.assignedOwnerId !== 'all') {
    query = query.eq('assigned_to', filters.assignedOwnerId);
  }

  if (filters.assignedTeacherId && filters.assignedTeacherId !== 'all') {
    query = query.eq('assigned_teacher_id', filters.assignedTeacherId);
  }

  if (filters.followUpToday) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.gte('next_follow_up_at', `${today}T00:00:00`).lte('next_follow_up_at', `${today}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const hydrated = await hydrateLeads((data || []) as LeadRecord[]);
  const search = filters.search?.trim().toLowerCase();

  if (!search) {
    return hydrated;
  }

  return hydrated.filter((lead) => (
    lead.full_name.toLowerCase().includes(search)
    || (lead.whatsapp || '').toLowerCase().includes(search)
    || (lead.country || '').toLowerCase().includes(search)
    || (lead.programName || '').toLowerCase().includes(search)
  ));
}

export async function fetchLeadById(id: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('leads').select('*').eq('id', id).single();

  if (error) {
    throw error;
  }

  const [lead] = await hydrateLeads([data as LeadRecord]);
  return lead;
}

export async function createLead(payload: CreateLeadPayload) {
  const client = requireSupabase();
  const { data, error } = await client.from('leads').insert({ ...payload, status: 'new' }).select('*').single();

  if (error) {
    throw error;
  }

  await addActivity(data.id, 'created', 'Lead created from dashboard.', null, 'new');
  return data as LeadRecord;
}

export async function updateLeadStatus(leadId: string, status: LeadStatus, oldStatus?: string) {
  const client = requireSupabase();
  const payload: Partial<LeadRecord> = { status, updated_at: new Date().toISOString() };

  if (status === 'lost') {
    payload.lost_reason = 'Marked lost from CRM action.';
  }

  const { data, error } = await client.from('leads').update(payload).eq('id', leadId).select('*').single();

  if (error) {
    throw error;
  }

  try {
    await addActivity(leadId, status === 'lost' ? 'lost' : 'status_changed', `Lead moved from ${oldStatus || 'unknown'} to ${status}.`, oldStatus, status);
  } catch (activityError) {
    if (import.meta.env.DEV) {
      console.error('Lead status activity log failed:', activityError);
    }
  }

  return data as LeadRecord;
}

export async function updateLead(leadId: string, payload: UpdateLeadPayload) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('leads')
    .update(payload)
    .eq('id', leadId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await addActivity(leadId, 'updated', 'Lead details updated.');
  const [hydrated] = await hydrateLeads([data as LeadRecord]);
  return hydrated;
}

export async function assignLeadOwner(leadId: string, ownerId: string | null) {
  const client = requireSupabase();
  const { data, error } = await client.from('leads').update({ assigned_to: ownerId }).eq('id', leadId).select('*').single();

  if (error) {
    throw error;
  }

  await addActivity(leadId, 'assigned_owner', 'Admissions owner updated.', null, ownerId);
  return data as LeadRecord;
}

export async function assignLeadTeacher(leadId: string, teacherId: string | null) {
  const client = requireSupabase();
  const { data, error } = await client.from('leads').update({ assigned_teacher_id: teacherId }).eq('id', leadId).select('*').single();

  if (error) {
    throw error;
  }

  await client.from('free_trials').update({ teacher_id: teacherId }).eq('lead_id', leadId);
  if (data.converted_student_id) {
    await client.from('classes').update({ teacher_id: teacherId }).eq('student_id', data.converted_student_id).is('teacher_id', null);
  }
  await addActivity(leadId, 'assigned_teacher', 'Teacher assignment updated.', null, teacherId);
  return data as LeadRecord;
}

export async function scheduleFreeTrial(payload: ScheduleTrialPayload) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('free_trials')
    .insert({
      lead_id: payload.leadId,
      teacher_id: payload.teacherId,
      program_id: payload.programId || null,
      trial_date: payload.trialDate,
      trial_time: payload.trialTime,
      meeting_link: payload.meetingLink || null,
      teacher_feedback: payload.notes || null,
      status: 'scheduled',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  if (payload.trialDate && payload.trialTime) {
    const { error: classError } = await client.from('classes').insert({
      teacher_id: payload.teacherId,
      program_id: payload.programId || null,
      class_date: payload.trialDate,
      start_time: payload.trialTime,
      end_time: calculateEndTime(payload.trialTime, 30),
      duration_minutes: 30,
      meeting_link: payload.meetingLink || null,
      lesson_title: 'Free trial class',
      status: 'scheduled',
    });

    if (classError && import.meta.env.DEV) {
      console.error('Free trial class session creation failed:', classError);
    }
  }

  await client
    .from('leads')
    .update({ status: 'trial_scheduled', assigned_teacher_id: payload.teacherId })
    .eq('id', payload.leadId);

  await addActivity(payload.leadId, 'trial_scheduled', 'Free trial scheduled.', null, `${payload.trialDate} ${payload.trialTime}`);
  return data;
}

function calculateEndTime(startTime: string, durationMinutes: number) {
  const [hours = 0, minutes = 0] = startTime.split(':').map(Number);
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  start.setMinutes(start.getMinutes() + durationMinutes);
  return start.toTimeString().slice(0, 8);
}

export async function addLeadNote(leadId: string, note: string) {
  const lead = await fetchLeadById(leadId);
  const client = requireSupabase();
  const nextNotes = [lead.notes, note].filter(Boolean).join('\n\n');
  const { data, error } = await client.from('leads').update({ notes: nextNotes }).eq('id', leadId).select('*').single();

  if (error) {
    throw error;
  }

  await addActivity(leadId, 'note_added', note);
  return data as LeadRecord;
}

export async function addLeadFollowUp(leadId: string, nextFollowUpAt: string, note: string) {
  const client = requireSupabase();
  const currentUserId = await getCurrentUserId();
  const { data, error } = await client
    .from('leads')
    .update({
      next_follow_up_at: nextFollowUpAt,
      last_contact_at: new Date().toISOString(),
      status: 'follow_up_later',
    })
    .eq('id', leadId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await client.from('lead_activity_logs').insert({
    lead_id: leadId,
    action_type: 'follow_up_added',
    description: note || 'Follow-up scheduled.',
    new_value: nextFollowUpAt,
    created_by: currentUserId,
  });

  if (note) {
    await addLeadNote(leadId, note);
  }

  return data as LeadRecord;
}

export async function fetchLeadActivity(leadId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('lead_activity_logs')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as LeadActivity[];
}

export async function convertLeadToStudent(leadId: string, payload: ConvertLeadPayload) {
  const client = requireSupabase();
  const { data: student, error } = await client.from('students').insert(payload).select('*').single();

  if (error) {
    throw error;
  }

  await client.from('leads').update({ status: 'enrolled', converted_student_id: student.id }).eq('id', leadId);
  await addActivity(leadId, 'converted_to_student', 'Lead converted to student.', null, student.id);
  return student;
}

export async function fetchPrograms() {
  return fetchActivePrograms();
}

export async function fetchAssignableProfiles(roles: AuthRole[] = ['super_admin', 'admin', 'admissions', 'academic_manager']) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, status')
    .in('role', roles)
    .eq('status', 'active')
    .order('full_name');

  if (error) {
    throw error;
  }

  return data || [];
}

export async function fetchTeacherOptions() {
  return fetchActiveTeacherOptions() as Promise<TeacherOption[]>;
}
