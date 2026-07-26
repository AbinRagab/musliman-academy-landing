import { studentPortalMock, type StudentMessage } from './studentService';

export type StudentMessageCategory = 'All' | StudentMessage['senderRole'];

export async function fetchStudentMessagesData() {
  return { messages: studentPortalMock.messages };
}

export async function sendStudentMessage(payload: { to: string; subject: string; message: string }) {
  return { success: true, payload };
}
