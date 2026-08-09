type DisplayNameRecord = {
  full_name?: string | null;
  name?: string | null;
  student_name?: string | null;
};

function cleanName(value?: string | null) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

export function getStudentDisplayName(student?: DisplayNameRecord | null) {
  return cleanName(student?.full_name)
    || cleanName(student?.name)
    || cleanName(student?.student_name)
    || 'Unnamed student';
}

export function getTeacherDisplayName(teacher?: DisplayNameRecord | null) {
  return cleanName(teacher?.full_name)
    || cleanName(teacher?.name)
    || 'Teacher';
}
