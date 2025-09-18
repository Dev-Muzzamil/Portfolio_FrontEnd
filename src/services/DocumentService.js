/**
 * DocumentService - Unified document management service
 * Handles all document operations for resumes, reports, and other documents
 * Follows SOLID principles with single responsibility
 */

import axios from '../utils/axiosConfig';
import { FileProcessingService } from './FileProcessingService';
import toast from 'react-hot-toast';

class DocumentService {
  constructor() {
    this.fileProcessor = new FileProcessingService();
  }

  /**
   * Upload a document with metadata
   * @param {string} type - Document type (resume, report, certificate, etc.)
   * @param {File} file - File to upload
   * @param {Object} metadata - Additional metadata
   * @param {string} entityId - ID of the entity (project, certificate, etc.)
   * @returns {Promise<Object>} Upload result
   */
  async uploadDocument(type, file, metadata = {}, entityId = null) {
    try {
      // Validate file
      const validation = this.validateFile(file, type);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Process file if needed
      const processedFile = await this.fileProcessor.processFile(file, type);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', processedFile);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      // Determine upload endpoint based on type
      const endpoint = this.getUploadEndpoint(type, entityId);
      
      // Upload file
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
        message: `${type} uploaded successfully!`
      };

    } catch (error) {
      console.error(`Document upload error (${type}):`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Upload failed',
        message: `Failed to upload ${type}`
      };
    }
  }

  /**
   * Delete a document
   * @param {string} type - Document type
   * @param {string} documentId - Document ID
   * @param {string} entityId - Entity ID (optional)
   * @returns {Promise<Object>} Delete result
   */
  async deleteDocument(type, documentId, entityId = null) {
    try {
      const endpoint = this.getDeleteEndpoint(type, documentId, entityId);
      await axios.delete(endpoint);

      return {
        success: true,
        message: `${type} deleted successfully!`
      };

    } catch (error) {
      console.error(`Document delete error (${type}):`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Delete failed',
        message: `Failed to delete ${type}`
      };
    }
  }

  /**
   * Update document metadata
   * @param {string} type - Document type
   * @param {string} documentId - Document ID
   * @param {Object} data - Update data
   * @param {string} entityId - Entity ID (optional)
   * @returns {Promise<Object>} Update result
   */
  async updateDocument(type, documentId, data, entityId = null) {
    try {
      const endpoint = this.getUpdateEndpoint(type, documentId, entityId);
      const response = await axios.put(endpoint, data);

      return {
        success: true,
        data: response.data,
        message: `${type} updated successfully!`
      };

    } catch (error) {
      console.error(`Document update error (${type}):`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Update failed',
        message: `Failed to update ${type}`
      };
    }
  }

  /**
   * Get documents by type and filters
   * @param {string} type - Document type
   * @param {Object} filters - Filter options
   * @param {string} entityId - Entity ID (optional)
   * @returns {Promise<Object>} Documents result
   */
  async getDocuments(type, filters = {}, entityId = null) {
    try {
      const endpoint = this.getListEndpoint(type, entityId);
      const response = await axios.get(endpoint, { params: filters });

      return {
        success: true,
        data: response.data,
        message: `${type}s fetched successfully!`
      };

    } catch (error) {
      console.error(`Document fetch error (${type}):`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Fetch failed',
        message: `Failed to fetch ${type}s`
      };
    }
  }

  /**
   * Toggle document visibility
   * @param {string} type - Document type
   * @param {string} documentId - Document ID
   * @param {boolean} visible - Visibility state
   * @param {string} entityId - Entity ID (optional)
   * @returns {Promise<Object>} Toggle result
   */
  async toggleVisibility(type, documentId, visible, entityId = null) {
    try {
      const endpoint = this.getVisibilityEndpoint(type, documentId, entityId);
      const response = await axios.patch(endpoint, { visible });

      return {
        success: true,
        data: response.data,
        message: `${type} ${visible ? 'shown' : 'hidden'} successfully!`
      };

    } catch (error) {
      console.error(`Document visibility toggle error (${type}):`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Toggle failed',
        message: `Failed to toggle ${type} visibility`
      };
    }
  }

  /**
   * Validate file based on type
   * @param {File} file - File to validate
   * @param {string} type - Document type
   * @returns {Object} Validation result
   */
  validateFile(file, type) {
    const config = this.getFileConfig(type);
    
    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.size > config.maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(config.maxSize / 1024 / 1024)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Get file configuration for type
   * @param {string} type - Document type
   * @returns {Object} File configuration
   */
  getFileConfig(type) {
    const configs = {
      resume: {
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.oasis.opendocument.text',
          'text/plain'
        ],
        maxSize: 10 * 1024 * 1024, // 10MB
        folder: 'resumes'
      },
      report: {
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.oasis.opendocument.text',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ],
        maxSize: 10 * 1024 * 1024, // 10MB
        folder: 'reports'
      },
      certificate: {
        allowedTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp'
        ],
        maxSize: 5 * 1024 * 1024, // 5MB
        folder: 'certificates'
      }
    };

    return configs[type] || configs.report;
  }

  /**
   * Get upload endpoint based on type
   * @param {string} type - Document type
   * @param {string} entityId - Entity ID
   * @returns {string} Upload endpoint
   */
  getUploadEndpoint(type, entityId) {
    const endpoints = {
      resume: '/api/about/upload-resume',
      report: entityId ? `/api/projects/${entityId}/reports/upload` : '/api/reports/upload',
      certificate: entityId ? `/api/certificates/${entityId}/files/upload` : '/api/certificates/upload'
    };

    return endpoints[type] || '/api/upload';
  }

  /**
   * Get delete endpoint based on type
   * @param {string} type - Document type
   * @param {string} documentId - Document ID
   * @param {string} entityId - Entity ID
   * @returns {string} Delete endpoint
   */
  getDeleteEndpoint(type, documentId, entityId) {
    const endpoints = {
      resume: `/api/about/resumes/${documentId}`,
      report: entityId ? `/api/projects/${entityId}/reports/${documentId}` : `/api/reports/${documentId}`,
      certificate: entityId ? `/api/certificates/${entityId}/files/${documentId}` : `/api/certificates/${documentId}`
    };

    return endpoints[type] || `/api/${type}s/${documentId}`;
  }

  /**
   * Get update endpoint based on type
   * @param {string} type - Document type
   * @param {string} documentId - Document ID
   * @param {string} entityId - Entity ID
   * @returns {string} Update endpoint
   */
  getUpdateEndpoint(type, documentId, entityId) {
    const endpoints = {
      resume: `/api/about/resumes/${documentId}`,
      report: entityId ? `/api/projects/${entityId}/reports/${documentId}` : `/api/reports/${documentId}`,
      certificate: entityId ? `/api/certificates/${entityId}/files/${documentId}` : `/api/certificates/${documentId}`
    };

    return endpoints[type] || `/api/${type}s/${documentId}`;
  }

  /**
   * Get list endpoint based on type
   * @param {string} type - Document type
   * @param {string} entityId - Entity ID
   * @returns {string} List endpoint
   */
  getListEndpoint(type, entityId) {
    const endpoints = {
      resume: '/api/about/resumes',
      report: entityId ? `/api/projects/${entityId}/reports` : '/api/reports',
      certificate: entityId ? `/api/certificates/${entityId}/files` : '/api/certificates'
    };

    return endpoints[type] || `/api/${type}s`;
  }

  /**
   * Get visibility toggle endpoint based on type
   * @param {string} type - Document type
   * @param {string} documentId - Document ID
   * @param {string} entityId - Entity ID
   * @returns {string} Visibility endpoint
   */
  getVisibilityEndpoint(type, documentId, entityId) {
    const endpoints = {
      resume: `/api/about/resumes/${documentId}/visibility`,
      report: entityId ? `/api/projects/${entityId}/reports/${documentId}/visibility` : `/api/reports/${documentId}/visibility`,
      certificate: entityId ? `/api/certificates/${entityId}/files/${documentId}/visibility` : `/api/certificates/${documentId}/visibility`
    };

    return endpoints[type] || `/api/${type}s/${documentId}/visibility`;
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;
