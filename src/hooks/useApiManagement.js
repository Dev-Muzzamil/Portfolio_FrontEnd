/**
 * useApiManagement - Custom hook for API management
 * Provides unified API operations with loading states and error handling
 * Follows React hooks patterns and SOLID principles
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../services/ApiService';
import toast from 'react-hot-toast';

export const useApiManagement = (config = {}) => {
  const {
    baseEndpoint = '',
    showToast = true,
    cache = false,
    retry = true
  } = config;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const abortControllerRef = useRef(null);
  const cacheKeyRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Generic API call with state management
   * @param {Object} apiConfig - API configuration
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API result
   */
  const callApi = useCallback(async (apiConfig, options = {}) => {
    const {
      showLoading = true,
      showError = showToast,
      showSuccess = false,
      successMessage = 'Operation completed successfully!',
      cacheKey = null,
      abortPrevious = true
    } = options;

    // Abort previous request if needed
    if (abortPrevious && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Set loading state
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    // Set cache key
    if (cacheKey) {
      cacheKeyRef.current = cacheKey;
    }

    try {
      const result = await apiService.call({
        ...apiConfig,
        signal: abortControllerRef.current.signal
      }, {
        showToast: showError,
        cache: cache && cacheKey,
        cacheKey: cacheKey
      });

      if (result.success) {
        setData(result.data);
        setLastFetch(new Date());
        
        if (showSuccess && showToast) {
          toast.success(successMessage);
        }
        
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request cancelled' };
      }
      
      const errorMessage = error.message || 'API call failed';
      setError(errorMessage);
      
      if (showError && showToast) {
        toast.error(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [showToast, cache]);

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API result
   */
  const get = useCallback(async (endpoint, params = {}, options = {}) => {
    const fullEndpoint = baseEndpoint ? `${baseEndpoint}${endpoint}` : endpoint;
    return callApi({
      method: 'GET',
      url: fullEndpoint,
      params
    }, options);
  }, [baseEndpoint, callApi]);

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API result
   */
  const post = useCallback(async (endpoint, data = {}, options = {}) => {
    const fullEndpoint = baseEndpoint ? `${baseEndpoint}${endpoint}` : endpoint;
    return callApi({
      method: 'POST',
      url: fullEndpoint,
      data
    }, options);
  }, [baseEndpoint, callApi]);

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API result
   */
  const put = useCallback(async (endpoint, data = {}, options = {}) => {
    const fullEndpoint = baseEndpoint ? `${baseEndpoint}${endpoint}` : endpoint;
    return callApi({
      method: 'PUT',
      url: fullEndpoint,
      data
    }, options);
  }, [baseEndpoint, callApi]);

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API result
   */
  const patch = useCallback(async (endpoint, data = {}, options = {}) => {
    const fullEndpoint = baseEndpoint ? `${baseEndpoint}${endpoint}` : endpoint;
    return callApi({
      method: 'PATCH',
      url: fullEndpoint,
      data
    }, options);
  }, [baseEndpoint, callApi]);

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API result
   */
  const del = useCallback(async (endpoint, options = {}) => {
    const fullEndpoint = baseEndpoint ? `${baseEndpoint}${endpoint}` : endpoint;
    return callApi({
      method: 'DELETE',
      url: fullEndpoint
    }, options);
  }, [baseEndpoint, callApi]);

  /**
   * Upload file with progress tracking
   * @param {string} endpoint - Upload endpoint
   * @param {FormData} formData - Form data
   * @param {Function} onProgress - Progress callback
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Upload result
   */
  const upload = useCallback(async (endpoint, formData, onProgress = null, options = {}) => {
    const fullEndpoint = baseEndpoint ? `${baseEndpoint}${endpoint}` : endpoint;
    return callApi({
      method: 'POST',
      url: fullEndpoint,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      } : undefined
    }, options);
  }, [baseEndpoint, callApi]);

  /**
   * Batch API calls
   * @param {Array} requests - Array of request configs
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of results
   */
  const batch = useCallback(async (requests, options = {}) => {
    const { showLoading = true, showError = showToast } = options;

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const results = await apiService.batch(requests, { showToast: showError });
      return results;
    } catch (error) {
      const errorMessage = error.message || 'Batch request failed';
      setError(errorMessage);
      
      if (showError && showToast) {
        toast.error(errorMessage);
      }
      
      return requests.map(() => ({ success: false, error: errorMessage }));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [showToast]);

  /**
   * Refresh data
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API result
   */
  const refresh = useCallback(async (endpoint, params = {}, options = {}) => {
    const { cacheKey = cacheKeyRef.current } = options;
    
    if (cacheKey) {
      // Clear cache for this key
      apiService.clearCache(cacheKey);
    }
    
    return get(endpoint, params, options);
  }, [get]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear data state
   */
  const clearData = useCallback(() => {
    setData(null);
    setLastFetch(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    setLastFetch(null);
  }, []);

  /**
   * Abort current request
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Check if data is stale
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {boolean} Is stale
   */
  const isStale = useCallback((maxAge = 5 * 60 * 1000) => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch.getTime() > maxAge;
  }, [lastFetch]);

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  const getCacheStats = useCallback(() => {
    return apiService.getCacheStats();
  }, []);

  /**
   * Clear cache
   * @param {string} pattern - Cache key pattern (optional)
   */
  const clearCache = useCallback((pattern = null) => {
    apiService.clearCache(pattern);
  }, []);

  return {
    // State
    loading,
    error,
    data,
    lastFetch,

    // Actions
    get,
    post,
    put,
    patch,
    delete: del,
    upload,
    batch,
    refresh,
    callApi,

    // Utilities
    clearError,
    clearData,
    reset,
    abort,
    isStale,
    getCacheStats,
    clearCache
  };
};

export default useApiManagement;
