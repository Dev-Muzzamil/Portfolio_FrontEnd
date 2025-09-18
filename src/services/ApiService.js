/**
 * ApiService - Centralized API management service
 * Handles all API calls with consistent error handling, retry logic, and caching
 * Follows SOLID principles with single responsibility
 */

import axios from '../utils/axiosConfig';
import toast from 'react-hot-toast';

class ApiService {
  constructor() {
    this.cache = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generic API call method with error handling and retry logic
   * @param {Object} config - Axios config
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async call(config, options = {}) {
    const {
      showToast = true,
      retry = true,
      cache = false,
      cacheKey = null,
      loadingMessage = null
    } = options;

    // Check cache first
    if (cache && cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Show loading message
    if (loadingMessage) {
      toast.loading(loadingMessage, { id: 'api-loading' });
    }

    let lastError;
    
    for (let attempt = 1; attempt <= (retry ? this.retryAttempts : 1); attempt++) {
      try {
        const response = await axios(config);
        
        // Cache successful response
        if (cache && cacheKey) {
          this.cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
          });
        }

        // Hide loading message
        if (loadingMessage) {
          toast.dismiss('api-loading');
        }

        return {
          success: true,
          data: response.data,
          status: response.status,
          headers: response.headers
        };

      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          break;
        }

        // Wait before retry
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    // Hide loading message
    if (loadingMessage) {
      toast.dismiss('api-loading');
    }

    // Handle error
    return this.handleError(lastError, showToast);
  }

  /**
   * GET request
   * @param {string} url - Request URL
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async get(url, params = {}, options = {}) {
    return this.call({
      method: 'GET',
      url,
      params
    }, options);
  }

  /**
   * POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async post(url, data = {}, options = {}) {
    return this.call({
      method: 'POST',
      url,
      data
    }, options);
  }

  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async put(url, data = {}, options = {}) {
    return this.call({
      method: 'PUT',
      url,
      data
    }, options);
  }

  /**
   * PATCH request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async patch(url, data = {}, options = {}) {
    return this.call({
      method: 'PATCH',
      url,
      data
    }, options);
  }

  /**
   * DELETE request
   * @param {string} url - Request URL
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async delete(url, options = {}) {
    return this.call({
      method: 'DELETE',
      url
    }, options);
  }

  /**
   * Upload file with progress tracking
   * @param {string} url - Upload URL
   * @param {FormData} formData - Form data
   * @param {Function} onProgress - Progress callback
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Upload response
   */
  async upload(url, formData, onProgress = null, options = {}) {
    return this.call({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      } : undefined
    }, options);
  }

  /**
   * Batch API calls
   * @param {Array} requests - Array of request configs
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of responses
   */
  async batch(requests, options = {}) {
    const { 
      showToast = true,
      failFast = false 
    } = options;

    try {
      const responses = await Promise.allSettled(
        requests.map(request => this.call(request, { showToast: false }))
      );

      const results = responses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            success: false,
            error: result.reason?.message || 'Request failed',
            index
          };
        }
      });

      // Check if any requests failed
      const failures = results.filter(result => !result.success);
      if (failures.length > 0 && showToast) {
        toast.error(`${failures.length} of ${requests.length} requests failed`);
      }

      return results;

    } catch (error) {
      if (showToast) {
        toast.error('Batch request failed');
      }
      return requests.map(() => ({
        success: false,
        error: error.message
      }));
    }
  }

  /**
   * Clear cache
   * @param {string} pattern - Cache key pattern (optional)
   */
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if error should not be retried
   * @param {Error} error - Error object
   * @returns {boolean} Should not retry
   */
  shouldNotRetry(error) {
    const status = error.response?.status;
    
    // Don't retry on client errors (4xx) except 408, 429
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return true;
    }

    // Don't retry on certain error types
    if (error.code === 'NETWORK_ERROR' || error.code === 'CANCELED') {
      return true;
    }

    return false;
  }

  /**
   * Handle API error
   * @param {Error} error - Error object
   * @param {boolean} showToast - Show toast notification
   * @returns {Object} Error response
   */
  handleError(error, showToast = true) {
    console.error('API Error:', error);

    let message = 'An unexpected error occurred';
    let status = 500;

    if (error.response) {
      // Server responded with error status
      status = error.response.status;
      message = error.response.data?.message || error.response.data?.error || message;
      
      // Handle specific status codes
      switch (status) {
        case 400:
          message = 'Bad request. Please check your input.';
          break;
        case 401:
          message = 'Authentication required. Please login again.';
          break;
        case 403:
          message = 'Access denied. You don\'t have permission to perform this action.';
          break;
        case 404:
          message = 'Resource not found.';
          break;
        case 409:
          message = 'Conflict. The resource already exists or is in use.';
          break;
        case 422:
          message = 'Validation error. Please check your input.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        case 503:
          message = 'Service unavailable. Please try again later.';
          break;
      }
    } else if (error.request) {
      // Network error
      message = 'Network error. Please check your connection.';
      status = 0;
    } else {
      // Other error
      message = error.message || message;
    }

    if (showToast) {
      toast.error(message);
    }

    return {
      success: false,
      error: message,
      status,
      data: error.response?.data || null
    };
  }

  /**
   * Delay utility
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create request config with common options
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} params - Query parameters
   * @returns {Object} Axios config
   */
  createConfig(method, url, data = null, params = null) {
    const config = {
      method: method.toUpperCase(),
      url
    };

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    return config;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
