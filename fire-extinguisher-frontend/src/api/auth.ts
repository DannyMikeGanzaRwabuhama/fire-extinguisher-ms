import api from './axios';
import type { User } from '../context/AuthContext';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: 'ROLE_USER' | 'ROLE_INSPECTOR' | 'ROLE_ADMIN';
    phone?: string;
  }): Promise<{ message: string; email: string }> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  verifyEmail: async (email: string, otp: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/verify-email', { email, otp });
    return res.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string; email: string }> => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  updateProfile: async (data: {
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<User> => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ status: number; message: string }> => {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  },
};
