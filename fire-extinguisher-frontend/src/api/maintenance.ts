import api from './axios';
import type { Maintenance } from '../mock/mockData';

export interface MaintenanceListResponse {
  data: Maintenance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const maintenanceApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<MaintenanceListResponse> => {
    const res = await api.get('/maintenance', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Maintenance> => {
    const res = await api.get(`/maintenance/${id}`);
    return res.data;
  },

  create: async (data: {
    inspectionId: number;
    actions: string;
    conditionsNoted: string;
    maintenanceDate?: string;
  }): Promise<Maintenance> => {
    const res = await api.post('/maintenance', data);
    return res.data;
  },

  update: async (
    id: number,
    data: {
      actions?: string;
      conditionsNoted?: string;
      maintenanceDate?: string;
    }
  ): Promise<Maintenance> => {
    const res = await api.put(`/maintenance/${id}`, data);
    return res.data;
  },
};
