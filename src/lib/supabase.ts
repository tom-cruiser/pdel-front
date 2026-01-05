// Type definitions for the application

export interface GalleryImage {
  id: string;
  _id?: string;
  title?: string;
  description?: string;
  image_url: string;
  imagekit_file_id?: string;
  uploaded_by: string;
  created_at: string;
  updated_at?: string;
}

export interface Court {
  id: string;
  name: string;
  description?: string;
  price_per_hour: number;
  is_available: boolean;
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Coach {
  id: string;
  name: string;
  bio?: string;
  specialization?: string;
  hourly_rate?: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  coach_id?: string;
  coach_name?: string;
  membership_status: 'member' | 'non_member';
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
  updated_at?: string;
}
