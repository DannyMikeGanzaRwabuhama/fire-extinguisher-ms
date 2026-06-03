import api from './axios';

export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ROLE_ADMIN' | 'ROLE_INSPECTOR' | 'ROLE_USER';
  phone: string | null;
}

export interface UserListResponse {
  data: UserInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const userApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<UserListResponse> => {
    const res = await api.get('/users', { params });
    return res.data;
  },
};
