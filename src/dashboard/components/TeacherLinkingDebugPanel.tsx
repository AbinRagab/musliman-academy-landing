import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type DebugState = {
  loading: boolean;
  authUser: {
    id: string | null;
    email: string | null;
  };
  profile: Record<string, unknown> | null;
  teacher: Record<string, unknown> | null;
  students: {
    filter: string;
    assignedTeacherProfileId: string | null;
    count: number;
    error: string | null;
  };
  classes: {
    filter: string;
    teacherId: string | null;
    count: number;
    error: string | null;
  };
  error: string | null;
};

const emptyDebugState: DebugState = {
  loading: true,
  authUser: { id: null, email: null },
  profile: null,
  teacher: null,
  students: {
    filter: 'students.assigned_teacher_id = <teacher.profile_id>',
    assignedTeacherProfileId: null,
    count: 0,
    error: null,
  },
  classes: {
    filter: 'classes.teacher_id = <teacher.id>',
    teacherId: null,
    count: 0,
    error: null,
  },
  error: null,
};

function valueOf(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function DebugLine({ label, value }: { label: string; value: unknown }) {
  return (
    <span>
      {label}
      <strong>{value === null || value === undefined || value === '' ? '-' : String(value)}</strong>
    </span>
  );
}

export default function TeacherLinkingDebugPanel({ route }: { route: string }) {
  const [debugState, setDebugState] = useState<DebugState>(emptyDebugState);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    let cancelled = false;

    async function loadDebugState() {
      if (!supabase) {
        setDebugState({
          ...emptyDebugState,
          loading: false,
          error: 'Supabase is not configured.',
        });
        return;
      }

      const nextState: DebugState = {
        ...emptyDebugState,
        loading: true,
      };

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        const authUser = userData.user;
        nextState.authUser = {
          id: authUser?.id || null,
          email: authUser?.email || null,
        };

        if (!authUser?.id) {
          nextState.loading = false;
          nextState.error = 'No authenticated user is available.';
          if (!cancelled) setDebugState(nextState);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, status')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        nextState.profile = profile || null;

        if (!profile?.id) {
          nextState.loading = false;
          nextState.error = 'No profile record found for this auth user.';
          if (!cancelled) setDebugState(nextState);
          return;
        }

        const { data: teacher, error: teacherError } = await supabase
          .from('teachers')
          .select('id, profile_id, status, specialization')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (teacherError) {
          throw teacherError;
        }

        nextState.teacher = teacher || null;

        if (!teacher?.id) {
          nextState.loading = false;
          nextState.error = 'Teacher record missing for this profile. Admin must create/link a teacher record.';
          if (!cancelled) setDebugState(nextState);
          return;
        }

        const currentTeacherProfileId = teacher.profile_id || profile.id;
        nextState.students.assignedTeacherProfileId = currentTeacherProfileId;
        nextState.students.filter = `students.assigned_teacher_id = ${currentTeacherProfileId}`;
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id')
          .eq('assigned_teacher_id', currentTeacherProfileId);
        nextState.students.count = students?.length || 0;
        nextState.students.error = studentsError?.message || null;

        nextState.classes.teacherId = teacher.id;
        nextState.classes.filter = `classes.teacher_id = ${teacher.id}`;
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', teacher.id);
        nextState.classes.count = classes?.length || 0;
        nextState.classes.error = classesError?.message || null;
        nextState.loading = false;

        if (!cancelled) {
          setDebugState(nextState);
        }
      } catch (error) {
        if (!cancelled) {
          setDebugState({
            ...nextState,
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load teacher linking debug data.',
          });
        }
      }
    }

    loadDebugState();

    return () => {
      cancelled = true;
    };
  }, [route]);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <section className="teacher-link-debug-panel" aria-label="Teacher linking debug panel">
      <div className="teacher-link-debug-panel__header">
        <div>
          <span className="dashboard-eyebrow">DEV ONLY</span>
          <h2>Teacher Linking Debug</h2>
          <p>{route}</p>
        </div>
        {debugState.loading && <strong>Loading...</strong>}
      </div>

      {debugState.error && <p className="teacher-link-debug-panel__warning">{debugState.error}</p>}

      <div className="teacher-link-debug-panel__grid">
        <article>
          <h3>Current Auth User</h3>
          <DebugLine label="auth user id" value={debugState.authUser.id} />
          <DebugLine label="auth email" value={debugState.authUser.email} />
        </article>

        <article>
          <h3>Current Profile</h3>
          <DebugLine label="profile id" value={valueOf(debugState.profile, 'id')} />
          <DebugLine label="full_name" value={valueOf(debugState.profile, 'full_name')} />
          <DebugLine label="email" value={valueOf(debugState.profile, 'email')} />
          <DebugLine label="role" value={valueOf(debugState.profile, 'role')} />
          <DebugLine label="status" value={valueOf(debugState.profile, 'status')} />
        </article>

        <article>
          <h3>Current Teacher Record</h3>
          <DebugLine label="teacher id" value={valueOf(debugState.teacher, 'id')} />
          <DebugLine label="teacher profile_id" value={valueOf(debugState.teacher, 'profile_id')} />
          <DebugLine label="teacher status" value={valueOf(debugState.teacher, 'status')} />
          <DebugLine label="specialization" value={valueOf(debugState.teacher, 'specialization')} />
        </article>

        <article>
          <h3>Assigned Students Query</h3>
          <DebugLine label="query filter used" value={debugState.students.filter} />
          <DebugLine label="assigned_teacher_id value used" value={debugState.students.assignedTeacherProfileId} />
          <DebugLine label="students returned" value={debugState.students.count} />
          <DebugLine label="Supabase error" value={debugState.students.error} />
        </article>

        <article>
          <h3>Classes Query</h3>
          <DebugLine label="teacher_id value used" value={debugState.classes.teacherId} />
          <DebugLine label="classes returned" value={debugState.classes.count} />
          <DebugLine label="Supabase error" value={debugState.classes.error} />
        </article>
      </div>
    </section>
  );
}
