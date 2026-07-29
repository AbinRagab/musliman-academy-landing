import { supabase } from '../../lib/supabaseClient';
import { resolveCurrentStudentProfile, type StudentMessage } from './studentService';

export type StudentMessageCategory = 'All' | StudentMessage['senderRole'];

export async function fetchStudentMessagesData() {
  if (!supabase) {
    return { messages: [] as StudentMessage[] };
  }

  try {
    const profile = await resolveCurrentStudentProfile();
    const { data: sessionData } = await supabase.auth.getSession();
    const profileId = profile.profileId || sessionData.session?.user.id;

    if (!profileId) {
      return { messages: [] as StudentMessage[] };
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', profileId)
      .order('created_at', { ascending: false });

    if (error || !data?.length) {
      return { messages: [] as StudentMessage[] };
    }

    const messages = data.map((notification): StudentMessage => ({
      id: notification.id,
      sender: notification.sender_name || 'Musliman Academy',
      senderRole: mapNotificationType(notification.type),
      subject: notification.title || 'Academy notification',
      preview: notification.message || '',
      body: notification.message || '',
      dateTime: formatDateTime(notification.created_at),
      unread: notification.is_read === false,
      relatedClass: notification.related_entity_type === 'class' ? notification.related_entity_id : undefined,
      program: notification.program_name || undefined,
    }));

    return { messages };
  } catch {
    return { messages: [] as StudentMessage[] };
  }
}

function mapNotificationType(type?: string | null): StudentMessage['senderRole'] {
  if (type === 'payment') {
    return 'Payments';
  }

  if (type === 'homework') {
    return 'Homework';
  }

  if (type === 'class') {
    return 'Class Updates';
  }

  if (type === 'teacher') {
    return 'Teacher';
  }

  return 'Admin';
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Date pending';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function sendStudentMessage(payload: { to: string; subject: string; message: string }) {
  if (!supabase) {
    return { success: false, payload };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from('messages').insert({
    sender_id: sessionData.session?.user.id || null,
    recipient_role: payload.to.toLowerCase().includes('teacher') ? 'teacher' : 'admin',
    subject: payload.subject,
    body: payload.message,
    status: 'unread',
  });

  return { success: !error, payload, error };
}
