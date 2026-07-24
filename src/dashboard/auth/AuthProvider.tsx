import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

export type AuthRole =
  | 'super_admin'
  | 'admin'
  | 'admissions'
  | 'academic_manager'
  | 'teacher'
  | 'student'
  | 'finance'
  | 'viewer';

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: AuthRole;
  status: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

type SignInResult = {
  user: User;
  profile: UserProfile | null;
  role: AuthRole | null;
  redirectTo: string;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  role: AuthRole | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const adminAreaRoles: AuthRole[] = [
  'super_admin',
  'admin',
  'admissions',
  'academic_manager',
  'finance',
  'viewer',
];

export const accountsRoles: AuthRole[] = ['super_admin', 'admin'];
export const teacherRoles: AuthRole[] = ['teacher'];
export const studentRoles: AuthRole[] = ['student'];

export function getDashboardPath(role: AuthRole | null | undefined) {
  if (role === 'teacher') {
    return '/dashboard/teacher';
  }

  if (role === 'student') {
    return '/dashboard/student';
  }

  if (role === 'finance') {
    return '/dashboard/admin/payments';
  }

  if (role === 'super_admin' || role === 'admin' || role === 'admissions' || role === 'academic_manager' || role === 'viewer') {
    return '/dashboard/admin';
  }

  return '/dashboard/login';
}

export function getDashboardLayoutRole(role: AuthRole | null | undefined) {
  if (role === 'teacher') {
    return 'teacher';
  }

  if (role === 'student') {
    return 'student';
  }

  return 'admin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (activeUser: User | null) => {
    if (!activeUser || !supabase) {
      setProfile(null);
      setRole(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', activeUser.id)
      .maybeSingle<UserProfile>();

    if (error) {
      setProfile(null);
      setRole(null);
      throw error;
    }

    setProfile(data);
    setRole(data?.role || null);
    return data;
  }, []);

  const refreshProfile = useCallback(async () => loadProfile(user), [loadProfile, user]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (!supabase) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error || !data.session?.user) {
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(data.session.user);

      try {
        await loadProfile(data.session.user);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      setUser(nextUser);
      setLoading(true);

      loadProfile(nextUser)
        .catch(() => {
          setProfile(null);
          setRole(null);
        })
        .finally(() => setLoading(false));
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured for this environment.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Sign in succeeded but no user was returned.');
    }

    setUser(data.user);
    const nextProfile = await loadProfile(data.user);
    const nextRole = nextProfile?.role || null;

    return {
      user: data.user,
      profile: nextProfile,
      role: nextRole,
      redirectTo: getDashboardPath(nextRole),
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      setProfile(null);
      setRole(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    role,
    loading,
    isConfigured: isSupabaseConfigured,
    signIn,
    signOut,
    refreshProfile,
  }), [loading, profile, refreshProfile, role, signIn, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
