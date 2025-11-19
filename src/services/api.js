import axios from 'axios'

// Base URL configuration
// Default to '/api/v1' to match backend mount; can be overridden via VITE_API_BASE_URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// Public API instance - No authentication required
const publicApi = axios.create({
  baseURL: BASE_URL,
})

// Authenticated API instance - Requires authentication token
const authApi = axios.create({
  baseURL: BASE_URL,
})

// Request interceptor for authenticated API only
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for authenticated API to handle auth errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/admin'
    }
    return Promise.reject(error)
  }
)

// Default export is public API for backward compatibility
export const api = publicApi

// Named exports for specific use cases
export { publicApi, authApi }