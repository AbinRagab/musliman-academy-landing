import { supabase } from '../../lib/supabaseClient';

export type ComplianceCheckinRow = {
  id: string;
  classId: string | null;
  className: string;
  teacher: string;
  student: string;
  scheduledTime: string;
  teacherReady: string;
  joined: string;
  started: string;
  ended: string;
  attendanceSubmitted: string;
  reportSubmitted: string;
  status: string;
};

export type TeacherWarningRow = {
  id: string;
  teacher: string;
  warningType: string;
  className: string;
  reason: string;
  date: string;
  status: string;
  severity: string;
};

export type ComplianceRuleRow = {
  id: string;
  ruleName: string;
  lateGraceMinutes: number;
  noShowAfterMinutes: number;
  maxWarnings: number;
  periodDays: number;
  actionAfterLimit: string;
  isActive: boolean;
};

export type NotificationTemplateRow = {
  id: string;
  templateKey: string;
  channel: string;
  title: string;
  body: string;
  whatsappTemplateName?: string | null;
  isActive: boolean;
};

export type NotificationLogRow = {
  id: string;
  recipient: string;
  channel: string;
  templateKey: string;
  provider: string;
  status: string;
  errorMessage: string;
  sentAt: string;
};

export type ComplianceDashboardData = {
  checkins: ComplianceCheckinRow[];
  warnings: TeacherWarningRow[];
  rules: ComplianceRuleRow[];
  templates: NotificationTemplateRow[];
  logs: NotificationLogRow[];
  providerStatus: {
    emailConfigured: boolean;
    whatsappConfigured: boolean;
  };
};

export async function fetchComplianceDashboardData(): Promise<ComplianceDashboardData> {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

    const [checkinsResult, warningsResult, rulesResult, templatesResult, logsResult, providerResult] = await Promise.all([
      supabase.from('teacher_session_checkins').select(`
        id, class_id, teacher_id, scheduled_start_at, ready_at, joined_at, started_at, ended_at, status,
        classes:class_id(id, class_date, start_time, lesson_title, lesson_covered, homework, next_lesson_plan, status, student_id, teacher_id,
          students:student_id(id, student_name),
          teachers:teacher_id(id, full_name, profiles:profile_id(full_name, email)),
          attendance:attendance(id, status)
        )
      `).order('scheduled_start_at', { ascending: false }).limit(25),
      supabase.from('teacher_warnings').select('id, teacher_id, class_id, warning_type, severity, reason, status, created_at').order('created_at', { ascending: false }).limit(25),
      supabase.from('teacher_compliance_rules').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('notification_templates').select('*').order('template_key', { ascending: true }).limit(50),
      supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.functions.invoke('notification-provider-status', { body: {} }).catch((error) => ({ data: null, error })),
    ]);

    if (checkinsResult.error || warningsResult.error || rulesResult.error || templatesResult.error || logsResult.error) {
      throw checkinsResult.error || warningsResult.error || rulesResult.error || templatesResult.error || logsResult.error;
    }

    return {
      checkins: (checkinsResult.data || []).map((row: any) => {
        const classRow = Array.isArray(row.classes) ? row.classes[0] : row.classes;
        const teacher = Array.isArray(classRow?.teachers) ? classRow.teachers[0] : classRow?.teachers;
        const student = Array.isArray(classRow?.students) ? classRow.students[0] : classRow?.students;
        const attendance = Array.isArray(classRow?.attendance) ? classRow.attendance[0] : classRow?.attendance;
        const reportSubmitted = Boolean(classRow?.lesson_covered || classRow?.homework || classRow?.next_lesson_plan);
        return {
        id: row.id,
        classId: row.class_id,
        className: classRow?.lesson_title || `${classRow?.class_date || 'Class'} ${classRow?.start_time || ''}`.trim(),
        teacher: teacher?.profiles?.full_name || teacher?.full_name || String(row.teacher_id || 'Teacher'),
        student: student?.student_name || 'Student not linked',
        scheduledTime: formatDateTime(row.scheduled_start_at),
        teacherReady: row.ready_at ? formatDateTime(row.ready_at) : 'pending',
        joined: row.joined_at ? formatDateTime(row.joined_at) : 'pending',
        started: row.started_at ? formatDateTime(row.started_at) : 'pending',
        ended: row.ended_at ? formatDateTime(row.ended_at) : 'pending',
        attendanceSubmitted: attendance ? attendance.status : 'pending',
        reportSubmitted: reportSubmitted ? 'submitted' : 'pending',
        status: row.status || 'scheduled',
      };
      }),
      warnings: (warningsResult.data || []).map((row) => ({
        id: row.id,
        teacher: String(row.teacher_id || 'Teacher'),
        warningType: row.warning_type,
        className: String(row.class_id || '-'),
        reason: row.reason,
        date: formatDateTime(row.created_at),
        status: row.status,
        severity: row.severity,
      })),
      rules: (rulesResult.data || []).map((row) => ({
        id: row.id,
        ruleName: row.rule_name,
        lateGraceMinutes: row.late_grace_minutes,
        noShowAfterMinutes: row.no_show_after_minutes,
        maxWarnings: row.max_warnings,
        periodDays: row.period_days,
        actionAfterLimit: row.action_after_limit,
        isActive: row.is_active,
      })),
      templates: (templatesResult.data || []).map((row) => ({
        id: row.id,
        templateKey: row.template_key,
        channel: row.channel,
        title: row.title || row.template_key,
        body: row.body,
        whatsappTemplateName: row.whatsapp_template_name,
        isActive: row.is_active,
      })),
      logs: (logsResult.data || []).map((row) => ({
        id: row.id,
        recipient: String(row.recipient_id || row.recipient_role || '-'),
        channel: row.channel || '-',
        templateKey: row.template_key || '-',
        provider: row.provider || '-',
        status: row.status,
        errorMessage: row.error_message || '-',
        sentAt: formatDateTime(row.sent_at || row.created_at),
      })),
      providerStatus: {
        emailConfigured: Boolean(providerResult.data?.emailConfigured),
        whatsappConfigured: Boolean(providerResult.data?.whatsappConfigured),
      },
    };
}

export async function saveComplianceRule(rule: ComplianceRuleRow) {
  if (!supabase) {
    return { success: false };
  }

  const { error } = await supabase.from('teacher_compliance_rules').update({
    rule_name: rule.ruleName,
    late_grace_minutes: rule.lateGraceMinutes,
    no_show_after_minutes: rule.noShowAfterMinutes,
    max_warnings: rule.maxWarnings,
    period_days: rule.periodDays,
    action_after_limit: rule.actionAfterLimit,
    is_active: rule.isActive,
  }).eq('id', rule.id);

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function saveNotificationTemplate(template: NotificationTemplateRow) {
  if (!supabase) {
    return { success: false };
  }

  const { error } = await supabase.from('notification_templates').update({
    title: template.title,
    body: template.body,
    whatsapp_template_name: template.whatsappTemplateName,
    is_active: template.isActive,
  }).eq('id', template.id);

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function runTeacherComplianceCheck() {
  if (!supabase) {
    return { success: false };
  }

  const { data, error } = await supabase.functions.invoke('teacher-compliance-check', { body: {} });

  if (error) {
    throw error;
  }

  return data;
}

export async function sendTestNotification(channel: 'in_app' | 'email' | 'whatsapp') {
  if (!supabase) {
    return { success: false };
  }

  const { data, error } = await supabase.functions.invoke('send-test-notification', {
    body: { channel, template_key: channel === 'whatsapp' ? 'teacher_class_reminder_10_min' : 'teacher_class_reminder_10_min' },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateWarningStatus(warningId: string, status: string, resolutionNote?: string) {
  if (!supabase) {
    return { success: false };
  }

  const { error } = await supabase.from('teacher_warnings').update({
    status,
    resolved_at: ['cancelled', 'excused', 'resolved'].includes(status) ? new Date().toISOString() : null,
    resolution_note: resolutionNote,
  }).eq('id', warningId);

  if (error) {
    throw error;
  }

  return { success: true };
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}
