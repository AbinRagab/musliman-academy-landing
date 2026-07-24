export type StudentPaymentPayload = {
  studentId: string;
  packageName?: string;
  currency?: string;
  amount?: string;
  paymentStatus?: string;
  paymentDate?: string;
  nextDueDate?: string;
  teacherCost?: string;
  netRevenue?: string;
  invoiceNotes?: string;
};

export async function updateStudentPayment(payload: StudentPaymentPayload) {
  return { success: true, payload };
}
