import { supabase } from '../../lib/supabaseClient';
import { resolveCurrentStudentProfile, type StudentMessage } from './studentService';
import { resolveTeacherProfileId } from './teachersService';

export type StudentMessageCategory = 'All' | StudentMessage['senderRole'];

type ProfileName = {
  id: string;
  full_name?: string | null;
  role?: string | null;
};

export async function fetchStudentMessagesData() {
  if (!supabase) {
    return { messages: [] as StudentMessage[] };
  }

  const profile = await resolveCurrentStudentProfile();
  const { data: sessionData } = await supabase.auth.getSession();
  const profileId = profile.profileId || sessionData.session?.user.id;

  if (!profileId) {
    return { messages: [] as StudentMessage[] };
  }

  const [directResult, notificationResult] = await Promise.all([
    supabase
      .from('messages')
      .select('id, sender_id, receiver_id, subject, body, read_at, created_at')
      .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('in_app_notifications')
      .select('id, title, message, type, related_entity_type, related_entity_id, read_at, created_at')
      .eq('recipient_id', profileId)
      .order('created_at', { ascending: false }),
  ]);

  if (directResult.error) {
    throw directResult.error;
  }
  if (notificationResult.error) {
    throw notificationResult.error;
  }

  const profileIds = Array.from(new Set((directResult.data || [])
    .flatMap((message) => [message.sender_id, message.receiver_id])
    .filter(Boolean))) as string[];
  const profilesById = await fetchProfileNames(profileIds);

  const directMessages = (directResult.data || []).map((message): StudentMessage => {
    const sender = message.sender_id ? profilesById.get(message.sender_id) : null;
    const fromCurrentStudent = message.sender_id === profileId;

    return {
      id: message.id,
      sender: fromCurrentStudent ? 'You' : sender?.full_name || 'Academy message',
      senderRole: mapProfileRole(sender?.role),
      subject: message.subject || 'Academy message',
      preview: message.body || '',
      body: message.body || '',
      dateTime: formatDateTime(message.created_at),
      unread: Boolean(message.receiver_id === profileId && !message.read_at),
    };
  });

  const notifications = (notificationResult.data || []).map((notification): StudentMessage => ({
    id: `notification:${notification.id}`,
    sender: 'Musliman Academy',
    senderRole: mapNotificationType(notification.type),
    subject: notification.title || 'Academy notification',
    preview: notification.message || '',
    body: notification.message || '',
    dateTime: formatDateTime(notification.created_at),
    unread: !notification.read_at,
    relatedClass: notification.related_entity_type === 'class' ? notification.related_entity_id : undefined,
  }));

  return {
    messages: [...directMessages, ...notifications].sort((first, second) => (
      Date.parse(second.dateTime) - Date.parse(first.dateTime)
    )),
  };
}

async function fetchProfileNames(profileIds: string[]) {
  if (!supabase || !profileIds.length) {
    return new Map<string, ProfileName>();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', profileIds);

  if (error) {
    throw error;
  }

  return new Map((data || []).map((profile) => [profile.id, profile]));
}

function mapNotificationType(type?: string | null): StudentMessage['senderRole'] {
  if (type === 'payment') {
    return 'Payments';
  }

  if (type === 'homework') {
    return 'Homework';
  }

  if (type === 'class' || type === 'reminder') {
    return 'Class Updates';
  }

  return 'Admin';
}

function mapProfileRole(role?: string | null): StudentMessage['senderRole'] {
  if (role === 'teacher') {
    return 'Teacher';
  }

  if (role === 'finance') {
    return 'Payments';
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
    throw new Error('Supabase is not configured for this environment.');
  }

  const profile = await resolveCurrentStudentProfile();
  const { data: sessionData } = await supabase.auth.getSession();
  const senderId = profile.profileId || sessionData.session?.user.id;

  if (!senderId) {
    throw new Error('You must be signed in before sending a message.');
  }

  const receiverId = await resolveStudentMessageReceiver(payload.to, profile.teacherId);

  if (!receiverId) {
    throw new Error('No message recipient is configured for this request.');
  }

  const { data, error } = await supabase.from('messages').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    subject: payload.subject,
    body: payload.message,
  }).select('*').single();

  if (error) {
    throw error;
  }

  return data;
}

export async function markMessageRead(messageId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  if (messageId.startsWith('notification:')) {
    const notificationId = messageId.replace('notification:', '');
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  const { error } = await supabase.rpc('mark_message_read', {
    p_message_id: messageId,
  });

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function markAllMessagesRead() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  const { error } = await supabase.rpc('mark_all_messages_read');

  if (error) {
    throw error;
  }

  return { success: true };
}

async function resolveStudentMessageReceiver(to: string, teacherId?: string | null) {
  const normalized = to.toLowerCase();

  if (normalized.includes('teacher') && teacherId) {
    return resolveTeacherProfileId(teacherId);
  }

  const roles = normalized.includes('finance')
    ? ['finance', 'admin', 'super_admin']
    : ['admin', 'super_admin', 'academic_manager', 'admissions'];

  const { data, error } = await supabase!
    .from('profiles')
    .select('id')
    .in('role', roles)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id || null;
}
