import { supabase } from '../../lib/supabaseClient';

export type StudentManagementRow = {
  id: string;
  name: string;
  program: string;
  teacher: string;
  level: string;
  attendance: string;
  status: string;
  nextClass: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

export async function fetchStudentManagementRows() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('students')
    .select('id, student_name, program_id, assigned_teacher_id, level, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const programIds = Array.from(new Set((data || []).map((student) => student.program_id).filter(Boolean))) as string[];
  const teacherIds = Array.from(new Set((data || []).map((student) => student.assigned_teacher_id).filter(Boolean))) as string[];
  const [{ data: programs }, { data: teachers }] = await Promise.all([
    programIds.length ? client.from('programs').select('id, name').in('id', programIds) : Promise.resolve({ data: [] }),
    teacherIds.length ? client.from('profiles').select('id, full_name').in('id', teacherIds) : Promise.resolve({ data: [] }),
  ]);

  const programById = new Map((programs || []).map((program) => [program.id, program.name]));
  const teacherById = new Map((teachers || []).map((teacher) => [teacher.id, teacher.full_name]));

  return (data || []).map((student) => ({
    id: student.id,
    name: student.student_name,
    program: student.program_id ? programById.get(student.program_id) || 'Program not assigned' : 'Program not assigned',
    teacher: student.assigned_teacher_id ? teacherById.get(student.assigned_teacher_id) || 'Assigned teacher' : 'Unassigned',
    level: student.level || 'Placement pending',
    attendance: 'New',
    status: student.status || 'active',
    nextClass: 'Schedule pending',
  })) satisfies StudentManagementRow[];
}
