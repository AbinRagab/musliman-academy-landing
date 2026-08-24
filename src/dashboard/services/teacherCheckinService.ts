import { supabase } from '../../lib/supabaseClient';
import { getCurrentTeacherContext } from './teacherOperationsService';

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
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  if (!uuidPattern.test(payload.classId)) {
    throw new Error('A valid class record is required before class check-in.');
  }

  const context = payload.teacherId ? null : await getCurrentTeacherContext();
  const teacherId = payload.teacherId || context?.teacherId;

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

  const { data, error } = await supabase.rpc('update_teacher_class_lifecycle', {
    p_class_id: payload.classId,
    p_action: payload.action,
    p_notes: payload.notes || null,
    p_scheduled_start_at: payload.scheduledStartAt || null,
  });

  if (error) {
    throw error;
  }

  return { success: true, fallback: false, result: data, updateByAction: updateByAction[payload.action], teacherId };
}
