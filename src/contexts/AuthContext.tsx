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
        console.debug('[Auth] Init: dev_token in localStorage:', dev ? `${dev.substring(0, 12)}...` : 'not found');
        if (dev && dev.startsWith('dev:')) {
          console.debug('[Auth] Init: fetching profile with token');
          const res = await apiGet('/profiles/me');
          if (res.ok) {
            const body = await res.json();
            setUser({ id: body.data.id, email: body.data.email });
            setProfile(body.data as Profile);
            console.debug('[Auth] Init: profile loaded successfully');
          } else {
            console.warn('[Auth] Init: failed to fetch profile, status:', res.status);
          }
        } else {
          console.debug('[Auth] Init: no valid dev_token found');
        }
      } catch (err) {
        console.error('[Auth] Init failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.debug('[Auth] signIn: attempting login for', email);
    const res = await apiPost('/auth/local-login', { email, password });
    console.debug('[Auth] signIn: login response status:', res.status);
    
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorMessage = body.message || body.error || 'Login failed';
      console.error('[Auth] signIn: login failed:', errorMessage);
      throw new Error(errorMessage);
    }

    const body = await res.json();
    
    if (body.data && body.data.token) {
      console.debug('[Auth] signIn: storing token:', `${body.data.token.substring(0, 12)}...`);
      localStorage.setItem('dev_token', body.data.token);
    } else {
      console.warn('[Auth] signIn: no token in response data');
    }
    
    console.debug('[Auth] signIn: fetching user profile');
    const meRes = await apiGet('/profiles/me');
    if (meRes.ok) {
      const meBody = await meRes.json();
      console.debug('[Auth] signIn: profile retrieved successfully');
      setUser({ id: meBody.data.id, email: meBody.data.email });
      setProfile(meBody.data);
    } else {
      console.error('[Auth] signIn: failed to fetch profile, status:', meRes.status);
      throw new Error('Failed to fetch user profile after login');
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    console.debug('[Auth] signUp: attempting registration for', email);
    const res = await apiPost('/auth/register', {
      email,
      password,
      full_name: fullName,
      phone: phone || undefined,
    });
    
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorMessage = body.message || body.error || 'Registration failed';
      console.error('[Auth] signUp: failed:', errorMessage);
      throw new Error(errorMessage);
    }

    const body = await res.json();
    const message = body.message || body?.data?.message || 'Registration successful';
    console.debug('[Auth] signUp: success:', message);
    return message;
  };

  const signOut = async () => {
    console.debug('[Auth] signOut: clearing token and user');
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
