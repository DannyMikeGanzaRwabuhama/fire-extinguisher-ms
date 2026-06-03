import api from './axios';
import type { InspectorInfo } from './inspection';

export interface Maintenance {
  id: number;
  inspectionId: number;
  inspectorId: number;
  actions: string;
  maintenanceDate: string;
  conditionsNoted: string;
  inspector?: InspectorInfo;
  inspection?: {
    id: number;
    inspectionDate: string;
    status: string;
    extinguisherId: number;
    serialNumber: string;
  };
}

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
