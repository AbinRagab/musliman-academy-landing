import { supabase } from '../../lib/supabaseClient';
import { resolveCurrentStudentProfile, type StudentPayment } from './studentService';
import { getSignedFileUrl, PAYMENT_DOCUMENTS_BUCKET } from './storageService';

type PaymentPackageRow = {
  name?: string | null;
  sessions_count?: number | null;
};

type StudentPaymentRow = {
  id: string;
  program_id?: string | null;
  currency?: string | null;
  amount?: number | string | null;
  payment_method?: string | null;
  payment_date?: string | null;
  next_due_date?: string | null;
  status?: string | null;
  sessions_included?: number | null;
  sessions_remaining?: number | null;
  receipt_url?: string | null;
  receipt_file_path?: string | null;
  invoice_url?: string | null;
  invoice_file_path?: string | null;
  notes?: string | null;
  created_at?: string | null;
  payment_packages?: PaymentPackageRow | PaymentPackageRow[] | null;
};

export async function fetchStudentPaymentsData() {
  if (!supabase) {
    return { payments: [] as StudentPayment[] };
  }

  const profile = await resolveCurrentStudentProfile();

  if (!profile.id) {
    return { payments: [] as StudentPayment[] };
  }

  const { data, error } = await supabase
    .from('payments')
    .select('id, program_id, currency, amount, payment_method, payment_date, next_due_date, status, sessions_included, sessions_remaining, receipt_url, receipt_file_path, invoice_url, invoice_file_path, notes, created_at, payment_packages:package_id(name, sessions_count)')
    .eq('student_id', profile.id)
    .order('next_due_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const programIds = Array.from(new Set((data || []).map((payment) => payment.program_id).filter(Boolean))) as string[];
  const programResult = programIds.length
    ? await supabase.from('programs').select('id, name').in('id', programIds)
    : { data: [] };
  const programById = new Map((programResult.data || []).map((program) => [program.id, program.name]));

  return {
    payments: (data || []).map((payment) => mapStudentPayment(payment as StudentPaymentRow, programById)),
  };
}

export function mapStudentPayment(payment: StudentPaymentRow, programById = new Map<string, string>()): StudentPayment {
  const packageRecord = Array.isArray(payment.payment_packages) ? payment.payment_packages[0] : payment.payment_packages;
  const amount = Number(payment.amount);
  const hasAmount = Number.isFinite(amount);
  const currency = payment.currency || 'USD';
  const isPaid = payment.status === 'paid';
  const paid = isPaid && hasAmount ? amount : 0;
  const due = !isPaid && hasAmount ? amount : 0;

  return {
    id: payment.id,
    packageName: packageRecord?.name || (payment.program_id ? programById.get(payment.program_id) : null) || payment.notes || 'Not provided',
    sessions: payment.sessions_included ?? packageRecord?.sessions_count ?? 0,
    remainingSessions: payment.sessions_remaining ?? 0,
    startDate: formatDate(payment.payment_date || payment.created_at),
    validUntil: formatDate(payment.next_due_date),
    status: payment.status || 'Not provided',
    paidAmount: hasAmount ? formatMoney(paid, currency) : 'Not provided',
    dueAmount: hasAmount ? formatMoney(due, currency) : 'Not provided',
    nextDueDate: formatDate(payment.next_due_date),
    currency,
    method: payment.payment_method || 'Not provided',
    paymentDate: formatDate(payment.payment_date),
    invoiceUrl: payment.invoice_url || null,
    receiptUrl: payment.receipt_url || null,
    receiptFilePath: payment.receipt_file_path || null,
  };
}

export async function getStudentPaymentReceiptUrl(payment: StudentPayment) {
  if (payment.receiptFilePath) {
    return getSignedFileUrl(PAYMENT_DOCUMENTS_BUCKET, payment.receiptFilePath);
  }

  if (payment.receiptUrl) {
    return payment.receiptUrl;
  }

  throw new Error('No receipt is attached to this payment.');
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
    return 'Not provided';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
