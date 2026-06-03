import api from './axios';

export interface InspectorInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Inspection {
  id: number;
  userId: number;
  extinguisherId: number;
  inspectorId: number | null;
  inspectionDate: string;
  inspectionTime: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  inspector?: InspectorInfo;
  extinguisher?: {
    id: number;
    serialNumber: string;
    location: string;
    type: string;
    size: string;
  };
}

export interface InspectionListResponse {
  data: Inspection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const inspectionApi = {
  getAll: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InspectionListResponse> => {
    const res = await api.get('/inspections', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Inspection> => {
    const res = await api.get(`/inspections/${id}`);
    return res.data;
  },

  create: async (data: {
    extinguisherId: number;
    inspectorId?: number | null;
    inspectionDate: string;
    inspectionTime: string;
    status?: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  }): Promise<Inspection> => {
    const res = await api.post('/inspections', data);
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<Inspection> => {
    const res = await api.put(`/inspections/${id}`, { status });
    return res.data;
  },
};
