import { create } from 'zustand';
import { api } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isInitialized: false,

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        set({ user: response.data, token, isInitialized: true });
      } catch (error) {
        localStorage.removeItem('token');
        set({ user: null, token: null, isInitialized: true });
      }
    } else {
      set({ isInitialized: true });
    }
  },

  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    set({ user, token });
    return user;
  },

  register: async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    set({ user, token });
    return user;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

// Initialize auth on app load
useAuthStore.getState().initialize();
