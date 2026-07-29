import { supabase } from '../../lib/supabaseClient';

export type InAppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  related_url?: string | null;
  read_at?: string | null;
  created_at: string;
};

export async function fetchMyNotifications() {
  if (!supabase) {
    return [] satisfies InAppNotification[];
  }

  const { data, error } = await supabase
    .from('in_app_notifications')
    .select('id, title, message, type, related_url, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return [];
  }

  return (data || []) as InAppNotification[];
}

export async function markNotificationRead(notificationId: string) {
  if (!supabase) {
    return { success: true };
  }

  const { error } = await supabase
    .from('in_app_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function markAllNotificationsRead(notificationIds: string[]) {
  if (!supabase || notificationIds.length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from('in_app_notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', notificationIds);

  if (error) {
    throw error;
  }

  return { success: true };
}
