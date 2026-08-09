import { supabase } from '../../lib/supabaseClient';

export type TeacherOption = {
  id: string;
  profileId: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  languages?: string[] | null;
  availability?: string | null;
  assignedStudents: number;
  activeTrialLoad: number;
};

export type AdminTeacherRow = {
  id: string;
  profileId: string | null;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  students: number;
  trials: number;
  upcomingClasses: number;
  availability: string;
  status: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

export async function fetchActiveTeacherOptions(): Promise<TeacherOption[]> {
  const client = requireSupabase();
  const [{ data: teachers, error: teachersError }, { data: students }, { data: trials }] = await Promise.all([
    client
      .from('teachers')
      .select('id, profile_id, full_name, specialization, languages, availability, status')
      .eq('status', 'active')
      .order('full_name', { ascending: true }),
    client.from('students').select('assigned_teacher_id').eq('status', 'active'),
    client.from('free_trials').select('teacher_id').eq('status', 'scheduled'),
  ]);

  if (teachersError) {
    throw teachersError;
  }

  const profileIds = Array.from(new Set((teachers || []).map((teacher) => teacher.profile_id).filter(Boolean))) as string[];
  const { data: profiles, error: profilesError } = profileIds.length
    ? await client.from('profiles').select('id, full_name, email, phone, role, status').in('id', profileIds)
    : { data: [], error: null };

  if (profilesError) {
    throw profilesError;
  }

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return (teachers || [])
    .map((teacher) => {
      const profile = teacher.profile_id ? profileById.get(teacher.profile_id) : null;
      return {
        id: teacher.id,
        profileId: teacher.profile_id,
        full_name: profile?.full_name || teacher.full_name || 'Teacher',
        email: profile?.email || null,
        phone: profile?.phone || null,
        specialization: teacher.specialization || null,
        languages: teacher.languages || [],
        availability: teacher.availability || null,
        assignedStudents: (students || []).filter((student) => student.assigned_teacher_id === teacher.id).length,
        activeTrialLoad: (trials || []).filter((trial) => trial.teacher_id === teacher.id).length,
      };
    })
    .filter((teacher) => {
      const profile = teacher.profileId ? profileById.get(teacher.profileId) : null;
      return !profile || (profile.role === 'teacher' && profile.status === 'active');
    });
}

export async function fetchAdminTeacherRows(): Promise<AdminTeacherRow[]> {
  const client = requireSupabase();
  const { data: teachers, error } = await client
    .from('teachers')
    .select('id, profile_id, full_name, specialization, languages, availability, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const teacherIds = Array.from(new Set((teachers || []).map((teacher) => teacher.id).filter(Boolean))) as string[];
  const profileIds = Array.from(new Set((teachers || []).map((teacher) => teacher.profile_id).filter(Boolean))) as string[];
  const today = new Date().toISOString().slice(0, 10);
  const [profileResult, studentResult, classResult, trialResult] = await Promise.all([
    profileIds.length ? client.from('profiles').select('id, full_name, email, phone, status').in('id', profileIds) : Promise.resolve({ data: [] }),
    teacherIds.length ? client.from('students').select('assigned_teacher_id').in('assigned_teacher_id', teacherIds) : Promise.resolve({ data: [] }),
    teacherIds.length ? client.from('classes').select('teacher_id, class_date, status').in('teacher_id', teacherIds).gte('class_date', today) : Promise.resolve({ data: [] }),
    teacherIds.length ? client.from('free_trials').select('teacher_id, status').in('teacher_id', teacherIds) : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profileResult.data || []).map((profile) => [profile.id, profile]));

  return (teachers || []).map((teacher) => {
    const profile = teacher.profile_id ? profileById.get(teacher.profile_id) : null;
    const status = teacher.status || profile?.status || 'active';

    return {
      id: teacher.id,
      profileId: teacher.profile_id,
      name: profile?.full_name || teacher.full_name || 'Teacher',
      email: profile?.email || 'Email not set',
      phone: profile?.phone || 'Phone not set',
      specialization: teacher.specialization || 'Specialization not set',
      students: (studentResult.data || []).filter((student) => student.assigned_teacher_id === teacher.id).length,
      trials: (trialResult.data || []).filter((trial) => trial.teacher_id === teacher.id && trial.status === 'scheduled').length,
      upcomingClasses: (classResult.data || []).filter((classRow) => classRow.teacher_id === teacher.id).length,
      availability: teacher.availability || 'Availability not set',
      status,
    };
  });
}

export async function resolveTeacherNamesById(teacherIds: string[]) {
  const client = requireSupabase();
  const ids = Array.from(new Set(teacherIds.filter(Boolean)));

  if (!ids.length) {
    return new Map<string, string>();
  }

  const { data: teachers, error } = await client
    .from('teachers')
    .select('id, profile_id, full_name')
    .in('id', ids);

  if (error) {
    throw error;
  }

  const profileIds = Array.from(new Set((teachers || []).map((teacher) => teacher.profile_id).filter(Boolean))) as string[];
  const { data: profiles } = profileIds.length
    ? await client.from('profiles').select('id, full_name').in('id', profileIds)
    : { data: [] };

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile.full_name]));
  return new Map((teachers || []).map((teacher) => [
    teacher.id,
    (teacher.profile_id ? profileById.get(teacher.profile_id) : null) || teacher.full_name || 'Teacher',
  ]));
}

export async function resolveTeacherProfileId(teacherId: string | null | undefined) {
  const client = requireSupabase();

  if (!teacherId) {
    return null;
  }

  const { data, error } = await client
    .from('teachers')
    .select('profile_id')
    .eq('id', teacherId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.profile_id || null;
}
