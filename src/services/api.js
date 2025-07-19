import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7011/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
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

// Auth API - Fix the endpoint URLs to lowercase 'auth'
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData), // Changed from '/Auth/register'
  login: (credentials) => api.post('/auth/login', credentials)  // Changed from '/Auth/login'
};

// Task API - Update to match your backend controller
export const taskAPI = {
  getAllTasks: () => api.get('/TodoTask/Get'),
  getTaskById: (id) => api.get(`/TodoTask/Get/${id}`),
  createTask: (taskData) => api.post('/TodoTask/Create', taskData),
  updateTask: (id, taskData) => api.put(`/TodoTask/Update/${id}`, taskData),
  deleteTask: (id) => api.delete(`/TodoTask/Delete/${id}`)
};

export default api;
