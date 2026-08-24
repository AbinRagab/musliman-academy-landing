import { supabase } from '../../lib/supabaseClient';

export type TeacherProfileData = {
  profileId: string;
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  languages: string[];
  bio: string;
  availability: string;
  availabilityJson: Record<string, unknown>;
  status: string;
  timezone: string;
  language: string;
  notificationPreferences: Record<string, boolean>;
  assignedStudents: number;
  classesCount: number;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }
  return supabase;
}

export async function fetchTeacherProfileData(): Promise<TeacherProfileData> {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user?.id) throw new Error('You must be signed in to view your profile.');
  const profileId = userData.user.id;

  const [{ data: profile, error: profileError }, { data: teacher, error: teacherError }] = await Promise.all([
    client.from('profiles').select('id, full_name, email, phone, status, timezone, preferred_language, notification_preferences').eq('id', profileId).single(),
    client.from('teachers').select('id, profile_id, full_name, specialization, languages, bio, availability, availability_json, status').eq('profile_id', profileId).single(),
  ]);

  if (profileError) throw profileError;
  if (teacherError) throw teacherError;

  const [{ count: studentCount }, { count: classCount }] = await Promise.all([
    client.from('students').select('id', { count: 'exact', head: true }).eq('assigned_teacher_id', teacher.id),
    client.from('classes').select('id', { count: 'exact', head: true }).eq('teacher_id', teacher.id),
  ]);

  return {
    profileId,
    teacherId: teacher.id,
    name: profile.full_name || teacher.full_name || 'Teacher',
    email: profile.email || '',
    phone: profile.phone || '',
    specialization: teacher.specialization || '',
    languages: teacher.languages || [],
    bio: teacher.bio || '',
    availability: teacher.availability || '',
    availabilityJson: teacher.availability_json || {},
    status: teacher.status || profile.status || 'active',
    timezone: profile.timezone || 'Africa/Cairo',
    language: profile.preferred_language || 'English',
    notificationPreferences: {
      classReminders: true,
      trialReminders: true,
      evaluationReminders: true,
      whatsapp: true,
      email: true,
      ...(profile.notification_preferences || {}),
    },
    assignedStudents: studentCount || 0,
    classesCount: classCount || 0,
  };
}

export async function saveTeacherProfileUpdate(payload: {
  bio: string;
  languages: string[];
  specialization: string;
}) {
  const profile = await fetchTeacherProfileData();
  const client = requireSupabase();
  const { data, error } = await client
    .from('teachers')
    .update({
      bio: payload.bio,
      languages: payload.languages,
      specialization: payload.specialization,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.teacherId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function saveTeacherSettings(payload: {
  timezone: string;
  language: string;
  notificationPreferences: Record<string, boolean>;
}) {
  const profile = await fetchTeacherProfileData();
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .update({
      timezone: payload.timezone,
      preferred_language: payload.language,
      notification_preferences: payload.notificationPreferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.profileId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function requestTeacherPasswordReset() {
  const client = requireSupabase();
  const profile = await fetchTeacherProfileData();
  if (!profile.email) throw new Error('Your account does not have an email address.');
  const { error } = await client.auth.resetPasswordForEmail(profile.email);
  if (error) throw error;
}

export async function requestAvailabilityUpdate(message: string) {
  const client = requireSupabase();
  const profile = await fetchTeacherProfileData();
  const { data: admin, error: adminError } = await client
    .from('profiles')
    .select('id')
    .in('role', ['super_admin', 'admin', 'academic_manager'])
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (adminError) throw adminError;
  if (!admin?.id) throw new Error('No active admin recipient is configured.');
  const { error } = await client.from('messages').insert({
    sender_id: profile.profileId,
    receiver_id: admin.id,
    subject: 'Availability update request',
    body: message,
    category: 'availability_update_request',
  });
  if (error) throw error;
}
