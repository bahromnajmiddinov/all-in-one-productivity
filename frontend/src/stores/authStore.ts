import { create } from 'zustand';
import type { User, LoginCredentials, RegisterData } from '../types';
import { authApi, isAuthenticated as checkIsAuthenticated } from '../lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: checkIsAuthenticated(),
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.email?.[0] || error.response?.data?.detail || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to fetch user',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  updateUser: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await authApi.updateProfile(data);
      set({
        user: { ...get().user, ...updatedUser } as User,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to update user',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  init: async () => {
    const isAuth = checkIsAuthenticated();
    if (isAuth) {
      try {
        await get().fetchUser();
      } catch (error) {
        // Token might be expired, clear auth state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
