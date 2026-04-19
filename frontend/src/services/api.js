import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const transactionsAPI = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

export const dashboardAPI = {
  summary: (params) => api.get('/dashboard/summary', { params }),
  byCategory: (params) => api.get('/dashboard/by-category', { params }),
  monthlyTrend: () => api.get('/dashboard/monthly-trend'),
  recent: () => api.get('/dashboard/recent'),
};

export const categoriesAPI = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
};

export const budgetsAPI = {
  list: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const predictionsAPI = {
  monthly: () => api.get('/predictions/monthly'),
};

export const importAPI = {
  csv: (formData) => api.post('/import/csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default api;
