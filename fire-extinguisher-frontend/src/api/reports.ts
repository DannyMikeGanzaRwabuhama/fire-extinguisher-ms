import api from './axios';

export const reportsApi = {
  getStockReport: async (params?: {
    format?: 'json' | 'pdf' | 'csv';
    period?: 'daily' | 'monthly' | 'yearly';
    date?: string;
    page?: number;
    limit?: number;
  }) => {
    const isBlob = params?.format && params.format !== 'json';
    const res = await api.get('/reports/extinguishers/stock', {
      params,
      ...(isBlob ? { responseType: 'blob' } : {}),
    });
    return res.data;
  },

  getExpiredReport: async (params?: {
    format?: 'json' | 'pdf' | 'csv';
    page?: number;
    limit?: number;
  }) => {
    const isBlob = params?.format && params.format !== 'json';
    const res = await api.get('/reports/extinguishers/expired', {
      params,
      ...(isBlob ? { responseType: 'blob' } : {}),
    });
    return res.data;
  },

  getInspectionStatusReport: async (params?: {
    format?: 'json' | 'pdf' | 'csv';
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    const isBlob = params?.format && params.format !== 'json';
    const res = await api.get('/reports/inspections/status', {
      params,
      ...(isBlob ? { responseType: 'blob' } : {}),
    });
    return res.data;
  },

  getMaintenanceHistoryReport: async (params?: {
    format?: 'json' | 'pdf' | 'csv';
    extinguisherId?: number;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    const isBlob = params?.format && params.format !== 'json';
    const res = await api.get('/reports/maintenance/history', {
      params,
      ...(isBlob ? { responseType: 'blob' } : {}),
    });
    return res.data;
  },

  getComplianceReport: async (params?: {
    format?: 'json' | 'pdf' | 'csv';
    page?: number;
    limit?: number;
  }) => {
    const isBlob = params?.format && params.format !== 'json';
    const res = await api.get('/reports/compliance', {
      params,
      ...(isBlob ? { responseType: 'blob' } : {}),
    });
    return res.data;
  },
};
