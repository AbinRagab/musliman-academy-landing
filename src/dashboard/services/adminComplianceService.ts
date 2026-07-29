import { supabase } from '../../lib/supabaseClient';

export type ComplianceCheckinRow = {
  id: string;
  className: string;
  teacher: string;
  student: string;
  scheduledTime: string;
  teacherReady: string;
  joined: string;
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

const fallbackData: ComplianceDashboardData = {
  checkins: [
    {
      id: 'fallback-checkin-1',
      className: 'Quran Reading - Level 3',
      teacher: 'Ust. Maryam Ali',
      student: 'Yusuf Ahmed',
      scheduledTime: 'Today 05:00 PM',
      teacherReady: 'ready',
      joined: 'joined',
      attendanceSubmitted: 'submitted',
      reportSubmitted: 'needs report',
      status: 'joined',
    },
    {
      id: 'fallback-checkin-2',
      className: 'Arabic Foundations',
      teacher: 'Sh. Omar Khaled',
      student: 'Lina Omar',
      scheduledTime: 'Today 06:30 PM',
      teacherReady: 'pending',
      joined: 'pending',
      attendanceSubmitted: 'pending',
      reportSubmitted: 'pending',
      status: 'scheduled',
    },
  ],
  warnings: [
    {
      id: 'fallback-warning-1',
      teacher: 'Ust. Aisha Noor',
      warningType: 'missing_class_report',
      className: 'Tajweed Practice',
      reason: 'Class report was not submitted before end-of-day review.',
      date: 'Jul 29, 2026',
      status: 'pending_review',
      severity: 'medium',
    },
  ],
  rules: [
    {
      id: 'fallback-rule-1',
      ruleName: 'Default Teacher Compliance',
      lateGraceMinutes: 5,
      noShowAfterMinutes: 10,
      maxWarnings: 3,
      periodDays: 30,
      actionAfterLimit: 'flag_for_review',
      isActive: true,
    },
  ],
  templates: [
    {
      id: 'fallback-template-1',
      templateKey: 'teacher_class_reminder_10_min',
      channel: 'in_app',
      title: 'Class reminder',
      body: 'Assalamu Alaikum {{teacher_name}}, you have a class at {{class_time}}.',
      whatsappTemplateName: 'teacher_class_reminder_10_min',
      isActive: true,
    },
  ],
  logs: [
    {
      id: 'fallback-log-1',
      recipient: 'Admin Team',
      channel: 'in_app',
      templateKey: 'admin_teacher_missing_alert',
      provider: 'in_app',
      status: 'sent',
      errorMessage: '-',
      sentAt: 'Today',
    },
  ],
  providerStatus: {
    emailConfigured: false,
    whatsappConfigured: false,
  },
};

export async function fetchComplianceDashboardData(): Promise<ComplianceDashboardData> {
  if (!supabase) {
    return fallbackData;
  }

  try {
    const [checkinsResult, warningsResult, rulesResult, templatesResult, logsResult] = await Promise.all([
      supabase.from('teacher_session_checkins').select('id, class_id, teacher_id, scheduled_start_at, ready_at, joined_at, status').order('scheduled_start_at', { ascending: false }).limit(25),
      supabase.from('teacher_warnings').select('id, teacher_id, class_id, warning_type, severity, reason, status, created_at').order('created_at', { ascending: false }).limit(25),
      supabase.from('teacher_compliance_rules').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('notification_templates').select('*').order('template_key', { ascending: true }).limit(50),
      supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (checkinsResult.error || warningsResult.error || rulesResult.error || templatesResult.error || logsResult.error) {
      return fallbackData;
    }

    return {
      checkins: (checkinsResult.data || []).map((row) => ({
        id: row.id,
        className: String(row.class_id || 'Class'),
        teacher: String(row.teacher_id || 'Teacher'),
        student: 'Assigned student',
        scheduledTime: formatDateTime(row.scheduled_start_at),
        teacherReady: row.ready_at ? 'ready' : 'pending',
        joined: row.joined_at ? 'joined' : 'pending',
        attendanceSubmitted: 'pending',
        reportSubmitted: 'pending',
        status: row.status || 'scheduled',
      })),
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
      providerStatus: fallbackData.providerStatus,
    };
  } catch {
    return fallbackData;
  }
}

export async function saveComplianceRule(rule: ComplianceRuleRow) {
  if (!supabase || rule.id.startsWith('fallback')) {
    return { success: true };
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
  if (!supabase || template.id.startsWith('fallback')) {
    return { success: true };
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
    return { success: true, fallback: true };
  }

  const { data, error } = await supabase.functions.invoke('teacher-compliance-check', { body: {} });

  if (error) {
    throw error;
  }

  return data;
}

export async function sendTestNotification(channel: 'in_app' | 'email' | 'whatsapp') {
  if (!supabase) {
    return { success: true, fallback: true };
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
  if (!supabase || warningId.startsWith('fallback')) {
    return { success: true };
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
