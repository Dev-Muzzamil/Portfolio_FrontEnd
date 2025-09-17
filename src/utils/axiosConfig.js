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

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Only handle 401 errors for non-upload requests
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't auto-logout during file uploads - let the component handle it
      if (originalRequest.url?.includes('/upload') || 
          originalRequest.url?.includes('/certificates') ||
          originalRequest.url?.includes('/projects') ||
          originalRequest.url?.includes('/pdf/')) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      // Clear invalid token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
      return Promise.reject(error);
    }
    
    // For other errors, just reject
    return Promise.reject(error);
  }
);

export default axiosInstance;
