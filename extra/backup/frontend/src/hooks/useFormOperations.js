// Custom hook for common form operations to reduce redundancy

import { useState, useCallback } from 'react';
import { createFormSubmitHandler, createDeleteHandler, createToggleVisibilityHandler } from '../utils/formHelpers';
import toast from 'react-hot-toast';

/**
 * Custom hook for handling common form operations
 */
export const useFormOperations = (operations, options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const {
    showToasts = true,
    successMessages = {},
    errorMessages = {}
  } = options;

  // Create submit handler
  const handleSubmit = useCallback(
    createFormSubmitHandler(
      operations.submit,
      {
        successMessage: successMessages.submit || 'Operation completed successfully!',
        errorMessage: errorMessages.submit || 'Operation failed',
        onSuccess: (result) => {
          if (showToasts) {
            toast.success(successMessages.submit || 'Operation completed successfully!');
          }
          setIsCreating(false);
          setIsEditing(false);
          setEditingItem(null);
        },
        onError: (result) => {
          if (showToasts) {
            toast.error(result.message || errorMessages.submit || 'Operation failed');
          }
        }
      }
    ),
    [operations.submit, successMessages, errorMessages, showToasts]
  );

  // Create delete handler
  const handleDelete = useCallback(
    createDeleteHandler(
      operations.delete,
      {
        confirmMessage: 'Are you sure you want to delete this item?',
        successMessage: successMessages.delete || 'Item deleted successfully!',
        errorMessage: errorMessages.delete || 'Failed to delete item'
      }
    ),
    [operations.delete, successMessages, errorMessages]
  );

  // Create toggle visibility handler
  const handleToggleVisibility = useCallback(
    createToggleVisibilityHandler(operations.toggleVisibility),
    [operations.toggleVisibility]
  );

  // Edit item handler
  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setIsEditing(true);
    setIsCreating(true);
  }, []);

  // Cancel edit handler
  const handleCancelEdit = useCallback(() => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingItem(null);
  }, []);

  // Start creating handler
  const handleStartCreating = useCallback(() => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingItem(null);
  }, []);

  return {
    // State
    isLoading,
    isCreating,
    isEditing,
    editingItem,
    
    // Actions
    handleSubmit,
    handleDelete,
    handleToggleVisibility,
    handleEdit,
    handleCancelEdit,
    handleStartCreating,
    
    // Setters
    setIsLoading,
    setIsCreating,
    setIsEditing,
    setEditingItem
  };
};

/**
 * Custom hook for handling file upload operations
 */
export const useFileUpload = (options = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/*'],
    showToasts = true
  } = options;

  const validateFile = useCallback((file) => {
    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      const errorMsg = `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
      if (showToasts) toast.error(errorMsg);
      return { valid: false, error: errorMsg };
    }

    // Check file size
    if (file.size > maxFileSize) {
      const errorMsg = `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`;
      if (showToasts) toast.error(errorMsg);
      return { valid: false, error: errorMsg };
    }

    return { valid: true };
  }, [allowedTypes, maxFileSize, showToasts]);

  const handleFileUpload = useCallback(async (files, uploadFn) => {
    const fileArray = Array.isArray(files) ? files : [files];
    
    // Validate all files first
    for (const file of fileArray) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadFn(fileArray, (progress) => {
        setUploadProgress(progress);
      });

      if (result.success) {
        setUploadedFiles(prev => [...prev, ...result.files]);
        if (showToasts) {
          toast.success(`Successfully uploaded ${fileArray.length} file(s)`);
        }
      } else {
        if (showToasts) {
          toast.error(result.message || 'Upload failed');
        }
      }

      return result;
    } catch (error) {
      if (showToasts) {
        toast.error(error.message || 'Upload failed');
      }
      return { success: false, error: error.message };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [validateFile, showToasts]);

  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadedFiles,
    handleFileUpload,
    clearUploadedFiles,
    setUploadedFiles
  };
};

/**
 * Custom hook for handling modal operations
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen
  };
};
