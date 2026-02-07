export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string;
  profile: UserProfile;
  preferences: UserPreferences;
}

export interface UserProfile {
  avatar: string | null;
  bio: string;
  timezone: string;
  date_of_birth: string | null;
  phone_number: string;
  theme: string;
  language: string;
  date_format: string;
  time_format: string;
  week_starts_on: number;
  default_view: string;
  enable_notifications: boolean;
  compact_mode: boolean;
}

export interface UserPreferences {
  theme: string;
  language: string;
  date_format: string;
  time_format: string;
  week_starts_on: number;
  default_view: string;
  enable_notifications: boolean;
  compact_mode: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  desktop_notifications: boolean;
  reminder_time: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
