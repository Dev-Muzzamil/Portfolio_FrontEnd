// Form helper utilities to reduce redundancy across components

/**
 * Creates a standardized form submit handler with loading states and toast notifications
 */
export const createFormSubmitHandler = (submitFn, options = {}) => {
  const {
    successMessage = 'Operation completed successfully!',
    errorMessage = 'Operation failed',
    onSuccess = () => {},
    onError = () => {},
    resetForm = false,
    resetFn = null
  } = options;

  return async (data, setLoading, reset) => {
    setLoading(true);
    try {
      const result = await submitFn(data);
      if (result.success) {
        if (resetForm && resetFn) {
          resetFn();
        }
        onSuccess(result);
        return result;
      } else {
        onError(result);
        return result;
      }
    } catch (error) {
      const errorResult = { success: false, message: error.message || errorMessage };
      onError(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  };
};

/**
 * Creates a standardized delete handler with confirmation
 */
export const createDeleteHandler = (deleteFn, options = {}) => {
  const {
    confirmMessage = 'Are you sure you want to delete this item?',
    successMessage = 'Item deleted successfully!',
    errorMessage = 'Failed to delete item'
  } = options;

  return async (itemId, showToast = true) => {
    if (!window.confirm(confirmMessage)) {
      return { success: false, message: 'Operation cancelled' };
    }

    try {
      const result = await deleteFn(itemId);
      if (result.success && showToast) {
        // Toast will be handled by the calling component
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message || errorMessage };
    }
  };
};

/**
 * Creates a standardized toggle visibility handler
 */
export const createToggleVisibilityHandler = (toggleFn) => {
  return async (itemId, currentVisibility) => {
    try {
      const result = await toggleFn(itemId, !currentVisibility);
      return result;
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update visibility' };
    }
  };
};

/**
 * Helper for processing technology/skill strings
 */
export const processStringArray = (string, delimiter = ',') => {
  if (!string) return [];
  return string.split(delimiter).map(item => item.trim()).filter(item => item.length > 0);
};

/**
 * Helper for converting array to string
 */
export const arrayToString = (array, delimiter = ', ') => {
  if (!Array.isArray(array)) return '';
  return array.join(delimiter);
};

/**
 * Helper for creating array manipulation functions
 */
export const createArrayHelpers = (watch, reset, fieldName) => {
  const addItem = (newItem) => {
    const currentArray = watch(fieldName) || [];
    reset({
      ...watch(),
      [fieldName]: [...currentArray, newItem]
    });
  };

  const removeItem = (index) => {
    const currentArray = watch(fieldName) || [];
    reset({
      ...watch(),
      [fieldName]: currentArray.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, updatedItem) => {
    const currentArray = watch(fieldName) || [];
    reset({
      ...watch(),
      [fieldName]: currentArray.map((item, i) => i === index ? updatedItem : item)
    });
  };

  return { addItem, removeItem, updateItem };
};

/**
 * Standard form reset values for different entity types
 */
export const getDefaultFormValues = (type) => {
  const defaults = {
    project: {
      title: '',
      description: '',
      technologies: '',
      liveUrls: [],
      githubUrls: [],
      visible: 'true',
      linkedCertificates: [],
      completedAtInstitution: ''
    },
    certificate: {
      title: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
      category: 'course',
      visible: 'true',
      description: '',
      skills: '',
      linkedProjects: [],
      completedAtInstitution: ''
    },
    skill: {
      name: '',
      category: 'frontend',
      group: 'technical',
      level: '',
      description: '',
      visible: 'true'
    },
    about: {
      name: '',
      title: '',
      bio: '',
      email: '',
      phone: '',
      location: '',
      experience: [],
      education: []
    }
  };

  return defaults[type] || {};
};
