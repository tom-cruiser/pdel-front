// This file intentionally avoids importing `@supabase/supabase-js` so the
// frontend can run without that dependency. The app uses the backend API
// (Mongo) for all runtime operations; this module provides a safe stub for
// code that previously imported `supabase`.

const supabase = {
  auth: {
    async getSession() {
      return { data: { session: null } };
    },
    onAuthStateChange() {
      return { unsubscribe: () => {} };
    },
    async signIn() {
      return { error: new Error('Supabase not configured') };
    },
    async signOut() {
      return { error: null };
    },
  },
  from: (_table: string) => {
    const c: any = {
      order: () => c,
      eq: () => c,
      select: async () => ({ data: [], error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
      insert: async () => ({ data: null, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
    };
    return c;
  },
  storage: { from: () => ({ upload: async () => ({ error: 'not configured' }) }) },
};

export { supabase };

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Court = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  courts?: Court;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type GalleryImage = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  uploaded_by: string | null;
  created_at: string;
};
