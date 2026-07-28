import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
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

type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AuthRole | null;
  loading: boolean;
  isAuthLoading: boolean;
  isProfileLoading: boolean;
  isReady: boolean;
  status: AuthStatus;
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [hasCompletedInitialCheck, setHasCompletedInitialCheck] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const currentUserIdRef = useRef<string | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  const profileUserIdRef = useRef<string | null>(null);
  const inFlightProfileRef = useRef<{ userId: string; promise: Promise<UserProfile | null> } | null>(null);

  const clearProfile = useCallback(() => {
    profileRef.current = null;
    profileUserIdRef.current = null;
    inFlightProfileRef.current = null;
    setProfile(null);
    setRole(null);
  }, []);

  const loadProfile = useCallback(async (activeUser: User | null, options?: { force?: boolean }) => {
    if (!activeUser || !supabase) {
      clearProfile();
      return null;
    }

    const force = options?.force ?? false;

    if (!force && profileRef.current && profileUserIdRef.current === activeUser.id) {
      return profileRef.current;
    }

    if (!force && inFlightProfileRef.current?.userId === activeUser.id) {
      return inFlightProfileRef.current.promise;
    }

    setIsProfileLoading(true);

    const profilePromise = (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle<UserProfile>();

      if (error) {
        throw error;
      }

      if (currentUserIdRef.current === activeUser.id) {
        profileRef.current = data;
        profileUserIdRef.current = data ? activeUser.id : null;
        setProfile(data);
        setRole(data?.role || null);
      }

      return data;
    })()
      .catch((error: unknown) => {
        if (currentUserIdRef.current === activeUser.id) {
          clearProfile();
          setStatus('error');
        }

        throw error;
      })
      .finally(() => {
        if (inFlightProfileRef.current?.promise === profilePromise) {
          inFlightProfileRef.current = null;
        }

        setIsProfileLoading(false);
      });

    inFlightProfileRef.current = { userId: activeUser.id, promise: profilePromise };

    return profilePromise;
  }, [clearProfile]);

  const refreshProfile = useCallback(async () => loadProfile(user, { force: true }), [loadProfile, user]);

  useEffect(() => {
    let mounted = true;
    let initialSessionHandled = false;

    function applySignedOutState() {
      currentUserIdRef.current = null;
      setSession(null);
      setUser(null);
      clearProfile();
      setStatus('unauthenticated');
    }

    async function applySession(nextSession: Session | null, options?: { forceProfile?: boolean }) {
      const nextUser = nextSession?.user || null;

      setSession(nextSession);
      setUser(nextUser);
      currentUserIdRef.current = nextUser?.id || null;

      if (!nextUser) {
        clearProfile();
        setStatus('unauthenticated');
        return;
      }

      const nextProfile = await loadProfile(nextUser, { force: options?.forceProfile });

      if (mounted && currentUserIdRef.current === nextUser.id) {
        setStatus(nextProfile ? 'authenticated' : 'error');
      }
    }

    async function initializeAuth() {
      if (!supabase) {
        if (mounted) {
          applySignedOutState();
          setIsAuthLoading(false);
          setHasCompletedInitialCheck(true);
        }
        return;
      }

      setIsAuthLoading(true);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          applySignedOutState();
          setStatus('error');
          return;
        }

        await applySession(data.session);
      } catch {
        if (mounted) {
          setStatus('error');
        }
      } finally {
        initialSessionHandled = true;

        if (mounted) {
          setIsAuthLoading(false);
          setHasCompletedInitialCheck(true);
        }
      }
    }

    initializeAuth();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) {
        return;
      }

      if (event === 'INITIAL_SESSION' && !initialSessionHandled) {
        return;
      }

      const nextUser = nextSession?.user || null;
      const isSameUser = currentUserIdRef.current === (nextUser?.id || null);

      setSession(nextSession);
      setUser(nextUser);
      currentUserIdRef.current = nextUser?.id || null;

      if (!nextUser) {
        clearProfile();
        setStatus('unauthenticated');
        setHasCompletedInitialCheck(true);
        return;
      }

      if (isSameUser && profileRef.current) {
        setStatus('authenticated');
        setHasCompletedInitialCheck(true);
        return;
      }

      if (!isSameUser) {
        clearProfile();
      }

      loadProfile(nextUser, { force: !isSameUser })
        .catch(() => {
          if (currentUserIdRef.current === nextUser.id) {
            clearProfile();
            setStatus('error');
          }
        })
        .finally(() => {
          if (currentUserIdRef.current === nextUser.id) {
            setHasCompletedInitialCheck(true);
          }
        });
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearProfile, loadProfile]);

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

    setSession(data.session);
    setUser(data.user);
    currentUserIdRef.current = data.user.id;
    const nextProfile = await loadProfile(data.user, { force: profileUserIdRef.current !== data.user.id });
    const nextRole = nextProfile?.role || null;
    setStatus(nextProfile ? 'authenticated' : 'error');
    setHasCompletedInitialCheck(true);

    return {
      user: data.user,
      profile: nextProfile,
      role: nextRole,
      redirectTo: getDashboardPath(nextRole),
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      setSession(null);
      setUser(null);
      currentUserIdRef.current = null;
      clearProfile();
      setStatus('unauthenticated');
      return;
    }

    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    currentUserIdRef.current = null;
    clearProfile();
    setStatus('unauthenticated');
    setHasCompletedInitialCheck(true);
  }, [clearProfile]);

  const isReady = hasCompletedInitialCheck;
  const loading = !isReady;

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    role,
    loading,
    isAuthLoading,
    isProfileLoading,
    isReady,
    status,
    isConfigured: isSupabaseConfigured,
    signIn,
    signOut,
    refreshProfile,
  }), [isAuthLoading, isProfileLoading, isReady, loading, profile, refreshProfile, role, session, signIn, signOut, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
