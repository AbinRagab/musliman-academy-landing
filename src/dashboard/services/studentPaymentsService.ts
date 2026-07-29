import { supabase } from '../../lib/supabaseClient';
import { resolveCurrentStudentProfile, type StudentPayment } from './studentService';

export async function fetchStudentPaymentsData() {
  if (!supabase) {
    return { payments: [] as StudentPayment[] };
  }

  try {
    const profile = await resolveCurrentStudentProfile();

    if (!profile.id) {
      return { payments: [] as StudentPayment[] };
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', profile.id)
      .order('due_date', { ascending: false });

    if (error || !data?.length) {
      return { payments: [] as StudentPayment[] };
    }

    const packageIds = Array.from(new Set(data.map((payment) => payment.package_id).filter(Boolean))) as string[];
    const packageResult = packageIds.length
      ? await supabase.from('packages').select('id, name, sessions_count, duration_days').in('id', packageIds)
      : { data: [] };

    const packageById = new Map((packageResult.data || []).map((packageRecord) => [packageRecord.id, packageRecord]));

    const payments = data.map((payment): StudentPayment => {
      const packageRecord = payment.package_id ? packageById.get(payment.package_id) : null;
      const amount = Number(payment.amount || 0);
      const paid = payment.status === 'paid' ? amount : 0;
      const due = payment.status === 'paid' ? 0 : amount;
      const currency = payment.currency || 'USD';

      return {
        id: payment.id,
        packageName: packageRecord?.name || payment.package_name || 'Package',
        sessions: Number(packageRecord?.sessions_count || payment.sessions_count || 0),
        remainingSessions: Number(payment.remaining_sessions || 0),
        startDate: formatDate(payment.start_date || payment.created_at),
        validUntil: formatDate(payment.end_date || payment.due_date),
        status: payment.status || 'pending',
        paidAmount: formatMoney(paid, currency),
        dueAmount: formatMoney(due, currency),
        nextDueDate: formatDate(payment.due_date),
        currency,
        method: payment.method || 'Not recorded',
        paymentDate: formatDate(payment.paid_at || payment.created_at),
        invoiceUrl: payment.invoice_url || null,
        receiptUrl: payment.receipt_url || payment.receipt_file_path || null,
      };
    });

    return { payments };
  } catch {
    return { payments: [] as StudentPayment[] };
  }
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not scheduled';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
