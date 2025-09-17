import axios from './axiosConfig';

// File upload utility with progress tracking and error handling
export const uploadFile = async (file, endpoint, onProgress = null, onError = null, resetInactivityCallback = null) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes timeout for heavy operations
      onUploadProgress: (progressEvent) => {
        // Reset inactivity timer during upload progress
        if (resetInactivityCallback) {
          resetInactivityCallback();
        }
        
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('File upload error:', error);
    
    if (onError) {
      onError(error);
    }

    // Handle different types of errors without auto-logout
    if (error.response?.status === 401) {
      // Don't auto-logout, just return error for component to handle
      return { 
        success: false, 
        message: 'Authentication expired. Please refresh the page and try again.',
        error: 'AUTH_EXPIRED'
      };
    } else if (error.code === 'ECONNABORTED') {
      return { 
        success: false, 
        message: 'Upload timed out. Please try again with a smaller file.',
        error: 'TIMEOUT'
      };
    } else if (error.response?.status === 413) {
      return { 
        success: false, 
        message: 'File too large. Please choose a smaller file.',
        error: 'FILE_TOO_LARGE'
      };
    } else if (error.response?.status === 429) {
      return { 
        success: false, 
        message: 'Too many requests. Please wait a moment and try again.',
        error: 'RATE_LIMITED'
      };
    } else if (error.message?.includes('Network Error')) {
      return { 
        success: false, 
        message: 'Network error. Please check your connection and try again.',
        error: 'NETWORK_ERROR'
      };
    } else {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Upload failed. Please try again.',
        error: 'UPLOAD_FAILED'
      };
    }
  }
};

// Multiple file upload utility
export const uploadMultipleFiles = async (files, endpoint, onProgress = null, onError = null, resetInactivityCallback = null) => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append(`files`, file);
  });

  try {
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes timeout for heavy operations
      onUploadProgress: (progressEvent) => {
        // Reset inactivity timer during upload progress
        if (resetInactivityCallback) {
          resetInactivityCallback();
        }
        
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Multiple file upload error:', error);
    
    if (onError) {
      onError(error);
    }

    // Handle different types of errors without auto-logout
    if (error.response?.status === 401) {
      // Don't auto-logout, just return error for component to handle
      return { 
        success: false, 
        message: 'Authentication expired. Please refresh the page and try again.',
        error: 'AUTH_EXPIRED'
      };
    } else if (error.code === 'ECONNABORTED') {
      return { 
        success: false, 
        message: 'Upload timed out. Please try again with smaller files.',
        error: 'TIMEOUT'
      };
    } else if (error.response?.status === 413) {
      return { 
        success: false, 
        message: 'Files too large. Please choose smaller files.',
        error: 'FILES_TOO_LARGE'
      };
    } else if (error.response?.status === 429) {
      return { 
        success: false, 
        message: 'Too many requests. Please wait a moment and try again.',
        error: 'RATE_LIMITED'
      };
    } else if (error.message?.includes('Network Error')) {
      return { 
        success: false, 
        message: 'Network error. Please check your connection and try again.',
        error: 'NETWORK_ERROR'
      };
    } else {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Upload failed. Please try again.',
        error: 'UPLOAD_FAILED'
      };
    }
  }
};

// Retry utility for failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};
