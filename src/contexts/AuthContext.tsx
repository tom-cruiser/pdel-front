import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiGet, apiPost } from '../lib/api';

export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
};

type User = {
  id: string;
  email?: string;
};

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

  useEffect(() => {
    (async () => {
      try {
        const dev = localStorage.getItem('dev_token');
        if (dev && dev.startsWith('dev:')) {
          const res = await apiGet('/profiles/me');
          if (res.ok) {
            const body = await res.json();
            setUser({ id: body.data.id, email: body.data.email });
            setProfile(body.data as Profile);
          }
        }
      } catch (err) {
        console.error('Auth initialization failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await apiPost('/auth/local-login', { email, password });
    
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || body.error || 'Login failed');
    }

    const body = await res.json();
    
    if (body.data && body.data.token) {
      localStorage.setItem('dev_token', body.data.token);
    }
    
    const meRes = await apiGet('/profiles/me');
    if (meRes.ok) {
      const meBody = await meRes.json();
      setUser({ id: meBody.data.id, email: meBody.data.email });
      setProfile(meBody.data);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const res = await apiPost('/auth/register', {
      email,
      password,
      full_name: fullName,
      phone: phone || undefined,
    });
    
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || body.error || 'Registration failed');
    }

    const body = await res.json();
    return body.message || 'Registration successful';
  };

  const signOut = async () => {
    localStorage.removeItem('dev_token');
    setUser(null);
    setProfile(null);
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
