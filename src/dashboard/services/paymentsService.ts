import { supabase } from '../../lib/supabaseClient';

export type StudentPaymentPayload = {
  id?: string;
  studentId: string;
  programId?: string | null;
  packageId?: string | null;
  packageName?: string;
  currency?: string;
  amount?: string | number;
  paymentStatus?: string;
  status?: string;
  paymentMethod?: string;
  paymentDate?: string;
  nextDueDate?: string;
  sessionsIncluded?: number | null;
  sessionsRemaining?: number | null;
  receiptUrl?: string | null;
  receiptFilePath?: string | null;
  teacherCost?: string | number;
  netRevenue?: string | number;
  invoiceNotes?: string;
};

export async function updateStudentPayment(payload: StudentPaymentPayload) {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  if (!payload.studentId) {
    throw new Error('A student record is required before saving a payment.');
  }

  const paymentPayload = {
    student_id: payload.studentId,
    program_id: payload.programId || null,
    package_id: payload.packageId || null,
    currency: payload.currency || null,
    amount: payload.amount ?? null,
    status: payload.paymentStatus || payload.status || 'pending',
    payment_method: payload.paymentMethod || null,
    payment_date: payload.paymentDate || null,
    next_due_date: payload.nextDueDate || null,
    sessions_included: payload.sessionsIncluded ?? null,
    sessions_remaining: payload.sessionsRemaining ?? null,
    receipt_url: payload.receiptUrl || null,
    receipt_file_path: payload.receiptFilePath || null,
    teacher_cost: payload.teacherCost ?? null,
    net_revenue: payload.netRevenue ?? null,
    notes: payload.invoiceNotes || payload.packageName || null,
  };

  const query = payload.id
    ? supabase.from('payments').update(paymentPayload).eq('id', payload.id).select('*').single()
    : supabase.from('payments').insert(paymentPayload).select('*').single();

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
