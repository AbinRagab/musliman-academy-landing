import { supabase } from '../../lib/supabaseClient';

export type TeacherCheckinAction = 'ready' | 'joined' | 'live' | 'completed';

export type TeacherCheckinPayload = {
  classId: string;
  teacherId?: string;
  scheduledStartAt: string;
  action: TeacherCheckinAction;
  notes?: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateTeacherSessionCheckin(payload: TeacherCheckinPayload) {
  if (!supabase || !uuidPattern.test(payload.classId)) {
    return { success: true, fallback: true };
  }

  const { data: userData } = await supabase.auth.getUser();
  const teacherId = payload.teacherId || userData.user?.id;

  if (!teacherId) {
    throw new Error('Teacher session is required before class check-in.');
  }

  const timestamp = new Date().toISOString();
  const updateByAction: Record<TeacherCheckinAction, Record<string, string>> = {
    ready: { ready_at: timestamp, status: 'ready' },
    joined: { joined_at: timestamp, status: 'joined' },
    live: { started_at: timestamp, status: 'live' },
    completed: { ended_at: timestamp, status: 'completed' },
  };

  const { error } = await supabase.from('teacher_session_checkins').upsert({
    class_id: payload.classId,
    teacher_id: teacherId,
    scheduled_start_at: payload.scheduledStartAt,
    notes: payload.notes,
    ...updateByAction[payload.action],
  }, { onConflict: 'class_id,teacher_id' });

  if (error) {
    throw error;
  }

  return { success: true, fallback: false };
}
