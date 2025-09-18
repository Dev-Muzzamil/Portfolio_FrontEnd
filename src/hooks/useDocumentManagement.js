/**
 * useDocumentManagement - Custom hook for document management
 * Provides unified document operations with state management
 * Follows React hooks patterns and SOLID principles
 */

import { useState, useCallback, useRef } from 'react';
import { documentService } from '../services/DocumentService';
import fileProcessingService from '../services/FileProcessingService';
import toast from 'react-hot-toast';

export const useDocumentManagement = (type, entityId = null) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Upload a single document
   * @param {File} file - File to upload
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result
   */
  const uploadDocument = useCallback(async (file, metadata = {}) => {
    setUploading(true);
    setError(null);

    try {
      const result = await documentService.uploadDocument(type, file, metadata, entityId);
      
      if (result.success) {
        // Add to local state
        setDocuments(prev => [...prev, result.data]);
        toast.success(result.message);
        return result;
      } else {
        setError(result.error);
        toast.error(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Upload failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, [type, entityId]);

  /**
   * Upload multiple documents
   * @param {FileList} files - Files to upload
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Array>} Upload results
   */
  const uploadDocuments = useCallback(async (files, metadata = {}) => {
    setUploading(true);
    setError(null);

    try {
      const fileArray = Array.from(files);
      const results = [];

      for (const file of fileArray) {
        const result = await uploadDocument(file, metadata);
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        toast.success(`All ${totalCount} documents uploaded successfully!`);
      } else if (successCount > 0) {
        toast.success(`${successCount} of ${totalCount} documents uploaded successfully!`);
      } else {
        toast.error('Failed to upload documents');
      }

      return results;
    } catch (error) {
      const errorMessage = error.message || 'Upload failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return [{ success: false, error: errorMessage }];
    } finally {
      setUploading(false);
    }
  }, [uploadDocument]);

  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Delete result
   */
  const deleteDocument = useCallback(async (documentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await documentService.deleteDocument(type, documentId, entityId);
      
      if (result.success) {
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        toast.success(result.message);
        return result;
      } else {
        setError(result.error);
        toast.error(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Delete failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [type, entityId]);

  /**
   * Update document metadata
   * @param {string} documentId - Document ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Update result
   */
  const updateDocument = useCallback(async (documentId, data) => {
    setLoading(true);
    setError(null);

    try {
      const result = await documentService.updateDocument(type, documentId, data, entityId);
      
      if (result.success) {
        // Update local state
        setDocuments(prev => prev.map(doc => 
          doc._id === documentId ? { ...doc, ...result.data } : doc
        ));
        toast.success(result.message);
        return result;
      } else {
        setError(result.error);
        toast.error(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Update failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [type, entityId]);

  /**
   * Toggle document visibility
   * @param {string} documentId - Document ID
   * @param {boolean} visible - Visibility state
   * @returns {Promise<Object>} Toggle result
   */
  const toggleVisibility = useCallback(async (documentId, visible) => {
    setLoading(true);
    setError(null);

    try {
      const result = await documentService.toggleVisibility(type, documentId, visible, entityId);
      
      if (result.success) {
        // Update local state
        setDocuments(prev => prev.map(doc => 
          doc._id === documentId ? { ...doc, visible } : doc
        ));
        toast.success(result.message);
        return result;
      } else {
        setError(result.error);
        toast.error(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Toggle failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [type, entityId]);

  /**
   * Load documents
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Load result
   */
  const loadDocuments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await documentService.getDocuments(type, filters, entityId);
      
      if (result.success) {
        setDocuments(result.data);
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Load failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [type, entityId]);

  /**
   * Generate thumbnail for file
   * @param {File} file - File to generate thumbnail for
   * @param {Object} options - Thumbnail options
   * @returns {Promise<string>} Thumbnail data URL
   */
  const generateThumbnail = useCallback(async (file, options = {}) => {
    try {
      return await fileProcessingService.generateThumbnail(file, options);
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return fileProcessingService.getDefaultFileIcon(file.type);
    }
  }, []);

  /**
   * Get file icon
   * @param {string} mimeType - File MIME type
   * @returns {string} File icon
   */
  const getFileIcon = useCallback((mimeType) => {
    return fileProcessingService.getFileIcon(mimeType);
  }, []);

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  const formatFileSize = useCallback((bytes) => {
    return fileProcessingService.formatFileSize(bytes);
  }, []);

  /**
   * Open file input dialog
   */
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  /**
   * Handle file input change
   * @param {Event} event - File input change event
   * @param {Object} metadata - Additional metadata
   */
  const handleFileInputChange = useCallback(async (event, metadata = {}) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        await uploadDocument(files[0], metadata);
      } else {
        await uploadDocuments(files, metadata);
      }
      // Reset input
      event.target.value = '';
    }
  }, [uploadDocument, uploadDocuments]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setDocuments([]);
    setLoading(false);
    setUploading(false);
    setError(null);
  }, []);

  return {
    // State
    documents,
    loading,
    uploading,
    error,
    fileInputRef,

    // Actions
    uploadDocument,
    uploadDocuments,
    deleteDocument,
    updateDocument,
    toggleVisibility,
    loadDocuments,
    openFileDialog,
    handleFileInputChange,

    // Utilities
    generateThumbnail,
    getFileIcon,
    formatFileSize,
    clearError,
    reset
  };
};

export default useDocumentManagement;
