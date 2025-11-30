import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Policy API
export const policyAPI = {
  getAll: () => api.get('/policies'),
  getById: (id) => api.get(`/policies/${id}`),
  buy: (data) => api.post('/policies/buy', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/policies/${id}`),
};

// Claim API
export const claimAPI = {
  getAll: () => api.get('/claims'),
  getById: (id) => api.get(`/claims/${id}`),
  submit: (formData) => api.post('/claims/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/claims/${id}`),
  getMLReport: (id) => api.get(`/claims/${id}/ml-report`),
};

// Calculator API
export const calculatorAPI = {
  getPolicyTypes: () => api.get('/calculator/policy-types'),
  calculatePremium: (data) => api.post('/calculator/premium', data),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPolicyTypes: () => api.get('/admin/policy-types'),
  createPolicyType: (data) => api.post('/admin/policy-types', data),
  updatePolicyType: (id, data) => api.put(`/admin/policy-types/${id}`, data),
  deletePolicyType: (id) => api.delete(`/admin/policy-types/${id}`),
  getUsers: () => api.get('/admin/users'),
  getPolicies: () => api.get('/admin/policies'),
  getClaims: () => api.get('/admin/claims'),
  updateClaimStatus: (id, status) => api.put(`/admin/claims/${id}/status`, { status }),
};

export default api;

