import api from './axios';
import type { Extinguisher } from '../mock/mockData';

export interface ExtinguisherListResponse {
  data: Extinguisher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const extinguisherApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<ExtinguisherListResponse> => {
    const res = await api.get('/extinguishers', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Extinguisher> => {
    const res = await api.get(`/extinguishers/${id}`);
    return res.data;
  },

  create: async (data: Omit<Extinguisher, 'id'>): Promise<Extinguisher> => {
    const res = await api.post('/extinguishers', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Omit<Extinguisher, 'id'>>): Promise<Extinguisher> => {
    const res = await api.put(`/extinguishers/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<{ status: number; message: string }> => {
    const res = await api.delete(`/extinguishers/${id}`);
    return res.data;
  },
};
