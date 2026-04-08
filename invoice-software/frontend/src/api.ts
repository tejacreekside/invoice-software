import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  signup: (email: string, password: string, name: string) => api.post('/auth/signup', { email, password, name }),
};

export const customerApi = {
  list: () => api.get('/customers'),
  create: (data: { name: string; email?: string; phone?: string; city?: string; state?: string; country?: string }) => api.post('/customers', data),
};

export const productApi = {
  list: () => api.get('/products'),
  create: (data: { name: string; description?: string; unitPrice: number; quantity?: number; sku?: string }) => api.post('/products', data),
};

export const profileApi = {
  getProfile: () => api.get('/profile'),
  uploadAvatar: (formData: FormData) => api.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAvatar: () => api.delete('/profile/avatar'),
};

export const invoiceApi = {
  list: () => api.get('/invoices'),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: string, status: string) => api.post(`/invoices/${id}/status`, { status }),
  addPayment: (id: string, amount: number) => api.post(`/invoices/${id}/payment`, { amountPaid: amount }),
};

export const picturedInvoicesApi = {
  upload: (formData: FormData) => api.post('/pictured-invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: () => api.get('/pictured-invoices'),
  get: (id: string) => api.get(`/pictured-invoices/${id}`),
  delete: (id: string) => api.delete(`/pictured-invoices/${id}`),
};

export type { AxiosError } from 'axios';
