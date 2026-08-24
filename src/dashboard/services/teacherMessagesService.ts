import { supabase } from '../../lib/supabaseClient';

export type TeacherMessage = {
  id: string;
  senderId: string | null;
  receiverId: string | null;
  from: string;
  to: string;
  subject: string;
  body: string;
  preview: string;
  student: string;
  relatedClass: string;
  relatedStudentId: string | null;
  relatedClassId: string | null;
  category: string;
  unread: boolean;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

export async function fetchTeacherMessages(): Promise<TeacherMessage[]> {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user?.id) throw new Error('You must be signed in to view messages.');
  const userId = userData.user.id;

  const { data, error } = await client
    .from('messages')
    .select(`
      id, sender_id, receiver_id, subject, body, read_at, created_at, related_student_id,
      related_class_id, category,
      sender:sender_id(id, full_name, email, role),
      receiver:receiver_id(id, full_name, email, role),
      students:related_student_id(id, student_name),
      classes:related_class_id(id, class_date, start_time, lesson_title)
    `)
    .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => {
    const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
    const receiver = Array.isArray(row.receiver) ? row.receiver[0] : row.receiver;
    const student = Array.isArray(row.students) ? row.students[0] : row.students;
    const classRow = Array.isArray(row.classes) ? row.classes[0] : row.classes;
    const direction = row.sender_id === userId ? 'outgoing' : 'incoming';

    return {
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      from: sender?.full_name || sender?.email || 'Academy',
      to: receiver?.full_name || receiver?.email || 'Academy',
      subject: row.subject || '(No subject)',
      body: row.body || '',
      preview: String(row.body || '').slice(0, 160),
      student: student?.student_name || 'No related student',
      relatedClass: classRow ? `${classRow.class_date || ''} ${String(classRow.start_time || '').slice(0, 5)} ${classRow.lesson_title || ''}`.trim() : 'No related class',
      relatedStudentId: row.related_student_id || null,
      relatedClassId: row.related_class_id || null,
      category: row.category || 'message',
      unread: direction === 'incoming' && !row.read_at,
      direction,
      createdAt: row.created_at || '',
    };
  });
}

export async function markTeacherMessageRead(messageId: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc('mark_message_read', { p_message_id: messageId });
  if (error) throw error;
  return data;
}

export async function sendTeacherMessage(payload: {
  receiverId?: string | null;
  subject: string;
  body: string;
  relatedStudentId?: string | null;
  relatedClassId?: string | null;
  category?: string;
}) {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user?.id) throw new Error('You must be signed in before sending a message.');

  const receiverId = payload.receiverId || await resolveAdminRecipient();
  const { data, error } = await client.from('messages').insert({
    sender_id: userData.user.id,
    receiver_id: receiverId,
    subject: payload.subject,
    body: payload.body,
    related_student_id: payload.relatedStudentId || null,
    related_class_id: payload.relatedClassId || null,
    category: payload.category || 'teacher_message',
  }).select('*').single();

  if (error) throw error;
  return data;
}

async function resolveAdminRecipient() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .in('role', ['super_admin', 'admin', 'academic_manager'])
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error('No active admin recipient is configured.');
  return data.id;
}
