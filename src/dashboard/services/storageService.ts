import { supabase } from '../../lib/supabaseClient';
import { resolveCurrentStudentProfile } from './studentService';

export const HOMEWORK_BUCKET = 'homework-submissions';
export const CLASS_MATERIALS_BUCKET = 'class-materials';
export const PAYMENT_DOCUMENTS_BUCKET = 'payment-documents';
export const HOMEWORK_MAX_FILE_SIZE = 20 * 1024 * 1024;

const allowedHomeworkMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'audio/mpeg',
  'audio/mp3',
  'video/mp4',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const allowedHomeworkExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png', 'mp3', 'mp4', 'doc', 'docx']);

export type HomeworkSubmissionFile = {
  id: string;
  student_id: string;
  class_id: string;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  notes: string | null;
  status: string;
  teacher_feedback: string | null;
  created_at: string;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. File uploads require an authenticated Supabase session.');
  }

  return supabase;
}

function sanitizeFileName(fileName: string) {
  const cleanedName = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-');

  return cleanedName || 'homework-file';
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function validateHomeworkFile(file: File) {
  const extension = getFileExtension(file.name);

  if (!allowedHomeworkExtensions.has(extension)) {
    throw new Error('Allowed homework file types are PDF, JPG, PNG, MP3, MP4, DOC, and DOCX.');
  }

  if (file.type && !allowedHomeworkMimeTypes.has(file.type)) {
    throw new Error('This file type is not allowed for homework uploads.');
  }

  if (file.size > HOMEWORK_MAX_FILE_SIZE) {
    throw new Error('Homework files must be 20MB or smaller.');
  }
}

function stripBucketPrefix(bucket: string, filePath: string) {
  return filePath.startsWith(`${bucket}/`) ? filePath.slice(bucket.length + 1) : filePath;
}

export async function uploadHomeworkFile(studentId: string, classId: string, file: File, notes: string) {
  const client = requireSupabase();
  validateHomeworkFile(file);

  const safeFileName = sanitizeFileName(file.name);
  const objectPath = `${studentId}/${classId}/${Date.now()}-${safeFileName}`;
  const fullPath = `${HOMEWORK_BUCKET}/${objectPath}`;

  const { error: uploadError } = await client.storage
    .from(HOMEWORK_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error: insertError } = await client
    .from('homework_submissions')
    .insert({
      student_id: studentId,
      class_id: classId,
      file_path: fullPath,
      file_name: file.name,
      file_type: file.type || getFileExtension(file.name),
      file_size: file.size,
      notes,
      status: 'submitted',
    })
    .select('*')
    .single<HomeworkSubmissionFile>();

  if (insertError) {
    await client.storage.from(HOMEWORK_BUCKET).remove([objectPath]);
    throw insertError;
  }

  return data;
}

export async function uploadClassMaterialFile(classId: string, file: File) {
  const client = requireSupabase();
  const safeFileName = sanitizeFileName(file.name);
  const objectPath = `${classId}/${Date.now()}-${safeFileName}`;
  const fullPath = `${CLASS_MATERIALS_BUCKET}/${objectPath}`;

  const { error } = await client.storage
    .from(CLASS_MATERIALS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw error;
  }

  return {
    bucket: CLASS_MATERIALS_BUCKET,
    filePath: fullPath,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  };
}

export async function uploadPaymentDocument(studentId: string, paymentId: string, file: File) {
  const client = requireSupabase();
  const safeFileName = sanitizeFileName(file.name);
  const objectPath = `${studentId}/${paymentId}/${Date.now()}-${safeFileName}`;
  const fullPath = `${PAYMENT_DOCUMENTS_BUCKET}/${objectPath}`;

  const { error } = await client.storage
    .from(PAYMENT_DOCUMENTS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw error;
  }

  return {
    bucket: PAYMENT_DOCUMENTS_BUCKET,
    filePath: fullPath,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  };
}

export async function getSignedFileUrl(bucket: string, filePath: string) {
  const client = requireSupabase();
  const objectPath = stripBucketPrefix(bucket, filePath);
  const { data, error } = await client.storage.from(bucket).createSignedUrl(objectPath, 60 * 10);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function listStudentHomeworkFiles(studentId?: string) {
  const client = requireSupabase();
  const resolvedStudentId = studentId || (await resolveCurrentStudentProfile()).id;

  const { data, error } = await client
    .from('homework_submissions')
    .select('id, student_id, class_id, file_path, file_name, file_type, file_size, notes, status, teacher_feedback, created_at')
    .eq('student_id', resolvedStudentId)
    .order('created_at', { ascending: false })
    .returns<HomeworkSubmissionFile[]>();

  if (error) {
    throw error;
  }

  return data || [];
}

export async function deleteHomeworkFile(filePath: string) {
  const client = requireSupabase();
  const objectPath = stripBucketPrefix(HOMEWORK_BUCKET, filePath);
  const { error } = await client.storage.from(HOMEWORK_BUCKET).remove([objectPath]);

  if (error) {
    throw error;
  }

  const { error: deleteError } = await client
    .from('homework_submissions')
    .delete()
    .eq('file_path', filePath);

  if (deleteError) {
    throw deleteError;
  }

  return { success: true };
}
