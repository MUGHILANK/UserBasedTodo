import axios from 'axios';

const API_BASE_URL = 'https://localhost:7011/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // ✅ Added timeout
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📡 API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ✅ FIXED AUTH API ENDPOINTS (lowercase 'auth')
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('📡 Auth Login request:', credentials);
      const response = await apiClient.post('/auth/login', credentials); // ✅ Fixed: lowercase 'auth'
      console.log('📥 Auth Login response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Login API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      console.log('📡 Auth Register request:', userData);
      const response = await apiClient.post('/auth/register', userData); // ✅ Fixed: lowercase 'auth'
      console.log('📥 Auth Register response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Register API Error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// ✅ IMPROVED TASK API ENDPOINTS
export const taskAPI = {
  // GET: api/TodoTask/Get - Get all tasks
  getAllTasks: async () => {
    try {
      console.log('📡 Get all tasks request');
      const response = await apiClient.get('/TodoTask/Get');
      console.log('📥 Get all tasks response:', response.data);
      return response;
    } catch (error) {
      // Handle 404 as empty array instead of error
      if (error.response?.status === 404) {
        console.log('ℹ️ No tasks found (404), returning empty array');
        return { 
          data: [], 
          status: 200,
          statusText: 'OK' 
        };
      }
      console.error('❌ Get all tasks error:', error.response?.data || error.message);
      throw error;
    }
  },

  // GET: api/TodoTask/Get/{id} - Get single task
  getTaskById: async (taskId) => {
    try {
      if (!taskId) {
        throw new Error('Task ID is required');
      }
      
      console.log('📡 Get task by ID request:', taskId);
      const response = await apiClient.get(`/TodoTask/Get/${taskId}`);
      console.log('📥 Get task by ID response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Get task by ID error:', error.response?.data || error.message);
      throw error;
    }
  },

  // POST: api/TodoTask/Create - Create new task
  createTask: async (taskData) => {
    try {
      if (!taskData || !taskData.taskDetails) {
        throw new Error('Task details are required');
      }
      
      console.log('📡 Create task request:', taskData);
      const response = await apiClient.post('/TodoTask/Create', taskData);
      console.log('📥 Create task response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Create task error:', error.response?.data || error.message);
      throw error;
    }
  },

  // PUT: api/TodoTask/Update/{id} - Update existing task
  updateTask: async (taskId, taskData) => {
    try {
      if (!taskId) {
        throw new Error('Task ID is required');
      }
      if (!taskData) {
        throw new Error('Task data is required');
      }
      
      console.log('📡 Update task request:', { taskId, taskData });
      const response = await apiClient.put(`/TodoTask/Update/${taskId}`, taskData);
      console.log('📥 Update task response:', response.data);
      
      // ✅ Ensure response has ID for frontend consistency
      if (response.data && !response.data.id && !response.data.Id) {
        response.data.id = taskId; // Add the ID if missing
        console.log('🔧 Added missing ID to response:', response.data);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Update task error:', error.response?.data || error.message);
      throw error;
    }
  },

  // DELETE: api/TodoTask/Delete/{id} - Delete task
  deleteTask: async (taskId) => {
    try {
      if (!taskId) {
        throw new Error('Task ID is required');
      }
      
      console.log('📡 Delete task request:', taskId);
      const response = await apiClient.delete(`/TodoTask/Delete/${taskId}`);
      console.log('📥 Delete task response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Delete task error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// ✅ UTILITY FUNCTIONS
export const apiUtils = {
  // Check if API is accessible
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/health'); // Add this endpoint if available
      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ API health check failed:', error.message);
      return false;
    }
  },

  // Clear auth data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🔐 Auth data cleared');
  },

  // Get current auth status
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }
};

// Export default axios instance for any custom requests
export default apiClient;
