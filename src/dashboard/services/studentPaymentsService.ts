import { studentPortalMock } from './studentService';

export async function fetchStudentPaymentsData() {
  return { payments: studentPortalMock.payments };
}
