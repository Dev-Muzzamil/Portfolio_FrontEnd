/**
 * useFormManagement - Custom hook for form management
 * Provides unified form operations with validation and state management
 * Follows React hooks patterns and SOLID principles
 */

import { useState, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { apiService } from '../services/ApiService';
import toast from 'react-hot-toast';

export const useFormManagement = (config = {}) => {
  const {
    defaultValues = {},
    validationSchema = null,
    apiEndpoint = null,
    onSuccess = null,
    onError = null,
    showToast = true
  } = config;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // React Hook Form setup
  const form = useForm({
    defaultValues,
    mode: 'onChange',
    ...(validationSchema && { resolver: validationSchema })
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, trigger, control } = form;

  /**
   * Submit form data
   * @param {Object} data - Form data
   * @param {Object} options - Submit options
   * @returns {Promise<Object>} Submit result
   */
  const submitForm = useCallback(async (data, options = {}) => {
    const {
      method = 'POST',
      endpoint = apiEndpoint,
      transformData = (data) => data,
      onSuccess: customOnSuccess = null,
      onError: customOnError = null
    } = options;

    if (!endpoint) {
      const error = 'No API endpoint provided';
      setError(error);
      if (showToast) toast.error(error);
      return { success: false, error };
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const transformedData = transformData(data);
      const result = await apiService.call({
        method,
        url: endpoint,
        data: transformedData
      }, { showToast });

      if (result.success) {
        setSuccess(true);
        if (showToast) toast.success('Form submitted successfully!');
        
        // Call success callbacks
        if (customOnSuccess) customOnSuccess(result.data);
        if (onSuccess) onSuccess(result.data);
        
        return result;
      } else {
        setError(result.error);
        if (showToast) toast.error(result.error);
        
        // Call error callbacks
        if (customOnError) customOnError(result.error);
        if (onError) onError(result.error);
        
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Submission failed';
      setError(errorMessage);
      if (showToast) toast.error(errorMessage);
      
      // Call error callbacks
      if (customOnError) customOnError(errorMessage);
      if (onError) onError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [apiEndpoint, onSuccess, onError, showToast]);

  /**
   * Load form data
   * @param {string} id - Resource ID
   * @param {Object} options - Load options
   * @returns {Promise<Object>} Load result
   */
  const loadFormData = useCallback(async (id, options = {}) => {
    const {
      endpoint = apiEndpoint,
      transformData = (data) => data
    } = options;

    if (!endpoint) {
      const error = 'No API endpoint provided';
      setError(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiService.get(`${endpoint}/${id}`);
      
      if (result.success) {
        const transformedData = transformData(result.data);
        reset(transformedData);
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
      setIsLoading(false);
    }
  }, [apiEndpoint, reset]);

  /**
   * Update form data
   * @param {string} id - Resource ID
   * @param {Object} data - Form data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  const updateFormData = useCallback(async (id, data, options = {}) => {
    const {
      endpoint = apiEndpoint,
      transformData = (data) => data
    } = options;

    if (!endpoint) {
      const error = 'No API endpoint provided';
      setError(error);
      return { success: false, error };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const transformedData = transformData(data);
      const result = await apiService.put(`${endpoint}/${id}`, transformedData);
      
      if (result.success) {
        if (showToast) toast.success('Form updated successfully!');
        return result;
      } else {
        setError(result.error);
        if (showToast) toast.error(result.error);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Update failed';
      setError(errorMessage);
      if (showToast) toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [apiEndpoint, showToast]);

  /**
   * Delete resource
   * @param {string} id - Resource ID
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Delete result
   */
  const deleteResource = useCallback(async (id, options = {}) => {
    const {
      endpoint = apiEndpoint,
      confirmMessage = 'Are you sure you want to delete this item?'
    } = options;

    if (!endpoint) {
      const error = 'No API endpoint provided';
      setError(error);
      return { success: false, error };
    }

    if (!window.confirm(confirmMessage)) {
      return { success: false, error: 'Operation cancelled' };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await apiService.delete(`${endpoint}/${id}`);
      
      if (result.success) {
        if (showToast) toast.success('Item deleted successfully!');
        return result;
      } else {
        setError(result.error);
        if (showToast) toast.error(result.error);
        return result;
      }
    } catch (error) {
      const errorMessage = error.message || 'Delete failed';
      setError(errorMessage);
      if (showToast) toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [apiEndpoint, showToast]);

  /**
   * Reset form to default values
   * @param {Object} newValues - New default values (optional)
   */
  const resetForm = useCallback((newValues = null) => {
    reset(newValues || defaultValues);
    setError(null);
    setSuccess(false);
  }, [reset, defaultValues]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear success state
   */
  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  /**
   * Validate specific field
   * @param {string} fieldName - Field name to validate
   * @returns {Promise<boolean>} Validation result
   */
  const validateField = useCallback(async (fieldName) => {
    return await trigger(fieldName);
  }, [trigger]);

  /**
   * Validate all fields
   * @returns {Promise<boolean>} Validation result
   */
  const validateAll = useCallback(async () => {
    return await trigger();
  }, [trigger]);

  /**
   * Set field value programmatically
   * @param {string} fieldName - Field name
   * @param {any} value - Field value
   * @param {Object} options - Set value options
   */
  const setFieldValue = useCallback((fieldName, value, options = {}) => {
    setValue(fieldName, value, options);
  }, [setValue]);

  /**
   * Watch field value
   * @param {string} fieldName - Field name to watch
   * @returns {any} Field value
   */
  const watchField = useCallback((fieldName) => {
    return watch(fieldName);
  }, [watch]);

  /**
   * Get form values
   * @returns {Object} Form values
   */
  const getFormValues = useCallback(() => {
    return watch();
  }, [watch]);

  /**
   * Check if form is valid
   * @returns {boolean} Form validity
   */
  const isFormValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Get field error
   * @param {string} fieldName - Field name
   * @returns {string|null} Field error message
   */
  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName]?.message || null;
  }, [errors]);

  return {
    // Form instance
    form,
    register,
    handleSubmit,
    errors,
    reset: resetForm,
    watch: watchField,
    setValue: setFieldValue,
    trigger: validateField,
    control,

    // State
    isSubmitting,
    isLoading,
    error,
    success,

    // Actions
    submitForm,
    loadFormData,
    updateFormData,
    deleteResource,
    validateField,
    validateAll,
    clearError,
    clearSuccess,

    // Utilities
    getFormValues,
    isFormValid,
    getFieldError
  };
};

export default useFormManagement;
