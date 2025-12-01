import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';
import { apiGet, apiPut } from '../lib/api';

// Allow forcing the app to use the backend local auth flow in development.
const forceLocalAuth = import.meta.env.DEV && import.meta.env.VITE_FORCE_LOCAL_AUTH === 'true';
const hasSupabase = !forceLocalAuth && Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<string | void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferLocalLogin, setPreferLocalLogin] = useState(false);

  useEffect(() => {
    // In development, ask the backend which DB mode it's running in and use that
    // to decide whether to initialize Supabase or fall back to local-login.
    (async () => {
      try {
        let backendMode: string | null = null;
        if (import.meta.env.DEV) {
          const m = await fetch('/api/auth/mode').then((r) => r.json()).catch(() => null);
          if (m && m.data && m.data.db) backendMode = m.data.db;
          if (backendMode === 'mongo') {
            setPreferLocalLogin(true);
          }
        }

        const effectiveHasSupabase = Boolean(!preferLocalLogin && hasSupabase && backendMode !== 'mongo');

        if (effectiveHasSupabase) {
          // Initialize Supabase session-based auth
          supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
              fetchProfile(session.user.id);
            } else {
              setLoading(false);
            }
          });

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            (() => {
              setUser(session?.user ?? null);
              if (session?.user) {
                fetchProfile(session.user.id);
              } else {
                setProfile(null);
                setLoading(false);
              }
            })();
          });

          return () => subscription.unsubscribe();
        }

        // Otherwise use dev token flow / backend local-login
        const dev = localStorage.getItem('dev_token');
        if (dev && dev.startsWith('dev:')) {
          const res = await apiGet('/profiles/me');
          if (res.ok) {
            const body = await res.json();
            setUser({ id: body.data.id } as unknown as User);
            setProfile(body.data as Profile);
          }
        }
      } catch (err) {
        console.error('Dev auth failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Prefer backend as source-of-truth for profiles.
      const res = await apiGet('/profiles/me');
      if (res.ok) {
        const body = await res.json();
        setProfile(body.data);
      } else {
        // fallback to Supabase client if backend call fails
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Prevent race: if Supabase is configured but backend mode may prefer local-login,
    // check backend mode now (only in dev) before calling Supabase.
    if (hasSupabase && import.meta.env.DEV && !preferLocalLogin) {
      try {
        const m = await fetch('/api/auth/mode').then((r) => r.json()).catch(() => null);
        if (m && m.data && m.data.db === 'mongo') {
          setPreferLocalLogin(true);
        }
      } catch (e) {
        // ignore and proceed with Supabase if mode check fails
      }
    }

    // Prefer Supabase only when available and not overridden by preferLocalLogin
    if (hasSupabase && !preferLocalLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // refresh profile from backend after sign in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Prefer backend profile as source of truth; check email confirmation
        const me = await apiGet('/profiles/me');
        if (me.ok) {
          const mb = await me.json().catch(() => ({}));
          if (mb.data && mb.data.email_confirmed === false) {
            // sign out from supabase since email is not confirmed
            await supabase.auth.signOut();
            throw new Error('Email not confirmed');
          }
          if (mb.data) setProfile(mb.data);
        } else {
          await fetchProfile(session.user.id);
        }
      }
      return;
    }

    // Local dev fallback: call backend local-login endpoint which returns a dev token
    const res = await fetch('/api/auth/local-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message || body?.error || 'Local login failed');
    }
    const body = await res.json();
    const token = body.data?.token;
    const profileBody = body.data?.profile || null;
    if (!token) throw new Error('Local login failed');
    // store dev token and update client state
    localStorage.setItem('dev_token', token);
    localStorage.setItem('force_dev_auth', 'true');
    // set user/profile immediately
    if (profileBody) {
      setUser({ id: profileBody._id || profileBody.id } as unknown as any);
      setProfile(profileBody as any);
    } else {
      // fallback: fetch profile from backend
      const me = await apiGet('/profiles/me');
      if (me.ok) {
        const mb = await me.json().catch(() => ({}));
        if (mb.data) {
          setUser({ id: mb.data._id || mb.data.id } as unknown as any);
          setProfile(mb.data as any);
        }
      }
    }
    setLoading(false);
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    // If backend-only/local mode is active, register via backend
    if ((import.meta.env.DEV && preferLocalLogin) || !hasSupabase) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName, phone }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || 'Registration failed');
        }
        const body = await res.json();
        const token = body.data?.token;
        const profileBody = body.data?.profile || null;
        // If backend returned a token (legacy), behave as before
        if (token) {
          localStorage.setItem('dev_token', token);
          localStorage.setItem('force_dev_auth', 'true');
          if (profileBody) {
            setUser({ id: profileBody._1d || profileBody._id || profileBody.id } as unknown as any);
            setProfile(profileBody as any);
          } else {
            const me = await apiGet('/profiles/me');
            if (me.ok) {
              const mb = await me.json().catch(() => ({}));
              if (mb.data) {
                setUser({ id: mb.data._id || mb.data.id } as unknown as any);
                setProfile(mb.data as any);
              }
            }
          }
          setLoading(false);
          return;
        }

        // Otherwise registration requires email confirmation — return helpful message
        const msg = body?.message || 'Registration successful. Please check your email to confirm your account.';
        return msg;
      } catch (err: any) {
        throw new Error(err?.message || 'Registration failed');
      }
    }

    // Otherwise fallback to Supabase sign-up flow
    try {
      const res = await supabase.auth.signUp({ email, password });
      if (res.error) {
        throw new Error(res.error.message || JSON.stringify(res.error));
      }

      const data = res.data || {};

      if (data.user) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await apiPut('/profiles/me', { full_name: fullName, phone: phone || null });
            await fetchProfile(session.user.id);
          }
        } catch (e) {
          console.debug('Backend profile sync skipped:', e);
        }
      }
    } catch (err: any) {
      throw new Error(err?.message || 'Signup failed');
    }
  };

  const signOut = async () => {
    // If using dev/local backend auth, clear dev token and profile
    const dev = localStorage.getItem('dev_token');
    if (dev) {
      localStorage.removeItem('dev_token');
      localStorage.removeItem('force_dev_auth');
      setUser(null);
      setProfile(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
