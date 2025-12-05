import axios from 'axios';

// Set axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Create axios instance
const axiosInstance = axios.create({
  timeout: 300000, // 5 minutes timeout for heavy operations
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Only handle 401 errors for token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/v1/auth/refresh', { 
            refreshToken: refreshToken 
          });
          
          const { token } = response.data;
          localStorage.setItem('token', token);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          
          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete axiosInstance.defaults.headers.common['Authorization'];
        
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
