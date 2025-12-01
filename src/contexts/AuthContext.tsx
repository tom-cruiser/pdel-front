import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGet, apiPost, apiPut } from '../lib/api';
import { Profile } from '../lib/supabase';

// Minimal user shape used by the app when not using Supabase
type AppUser = { id?: string };

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
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferLocalLogin, setPreferLocalLogin] = useState(false);

  useEffect(() => {
    // In development, ask the backend which DB mode it's running in and
    // initialize backend-only auth flow (no Supabase).
    (async () => {
      try {
        // Use backend-only auth: prefer dev_token flow and backend profile.
        // (No Supabase initialization.)
        const dev = localStorage.getItem('dev_token');
        if (dev && dev.startsWith('dev:')) {
          const res = await apiGet('/profiles/me');
          if (res.ok) {
            const body = await res.json();
            setUser({ id: body.data.id } as AppUser);
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
        // no Supabase fallback; leave profile null on failure
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Backend-only flow: call local-login endpoint which returns a dev token

    const res = await apiPost('/auth/local-login', { email, password });
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
    if ((import.meta.env.DEV && preferLocalLogin) || true) {
      try {
        const res = await apiPost('/auth/register', { email, password, full_name: fullName, phone });
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
