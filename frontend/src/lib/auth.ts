import Cookies from 'js-cookie';
import api from './api';

export interface Admin {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin: Admin;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.data.token) {
      Cookies.set('admin_token', response.data.data.token, { expires: 7 });
    }
    return response.data;
  },

  logout: () => {
    Cookies.remove('admin_token');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  getToken: (): string | undefined => {
    return Cookies.get('admin_token');
  },

  isAuthenticated: (): boolean => {
    return !!Cookies.get('admin_token');
  },

  getCurrentAdmin: async (): Promise<Admin | null> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error) {
      return null;
    }
  },
};
