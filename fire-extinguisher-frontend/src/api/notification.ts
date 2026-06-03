import api from './axios';
import { Notification } from '../mock/mockData';

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificationApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<NotificationListResponse> => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
};
