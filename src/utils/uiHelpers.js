// UI helper utilities to reduce redundancy across components

/**
 * Standard button configurations for common actions
 */
export const getActionButtons = (actions = {}) => {
  const defaultButtons = {
    edit: {
      icon: 'Edit',
      className: 'text-blue-600 hover:text-blue-700',
      title: 'Edit'
    },
    delete: {
      icon: 'Trash2',
      className: 'text-red-600 hover:text-red-700',
      title: 'Delete'
    },
    visibility: {
      icon: 'Eye',
      className: 'text-green-600 hover:text-green-700',
      title: 'Toggle Visibility'
    },
    view: {
      icon: 'ExternalLink',
      className: 'text-gray-600 hover:text-gray-700',
      title: 'View'
    },
    download: {
      icon: 'Download',
      className: 'text-purple-600 hover:text-purple-700',
      title: 'Download'
    }
  };

  return { ...defaultButtons, ...actions };
};

/**
 * Standard loading states for different operations
 */
export const getLoadingStates = (operation = 'default') => {
  const states = {
    default: {
      text: 'Loading...',
      className: 'loading-spinner'
    },
    creating: {
      text: 'Creating...',
      className: 'loading-spinner'
    },
    updating: {
      text: 'Updating...',
      className: 'loading-spinner'
    },
    deleting: {
      text: 'Deleting...',
      className: 'loading-spinner'
    },
    uploading: {
      text: 'Uploading...',
      className: 'loading-spinner'
    },
    saving: {
      text: 'Saving...',
      className: 'loading-spinner'
    }
  };

  return states[operation] || states.default;
};

/**
 * Standard form field configurations
 */
export const getFormFieldConfig = (type, options = {}) => {
  const configs = {
    text: {
      type: 'text',
      className: 'input-field'
    },
    email: {
      type: 'email',
      className: 'input-field'
    },
    password: {
      type: 'password',
      className: 'input-field'
    },
    number: {
      type: 'number',
      className: 'input-field'
    },
    date: {
      type: 'date',
      className: 'input-field'
    },
    textarea: {
      component: 'textarea',
      className: 'input-field',
      rows: 4
    },
    select: {
      component: 'select',
      className: 'input-field'
    }
  };

  return { ...configs[type], ...options };
};

/**
 * Standard validation rules
 */
export const getValidationRules = (field, options = {}) => {
  const rules = {
    required: (message) => ({
      required: message || `${field} is required`
    }),
    email: (message) => ({
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: message || 'Invalid email address'
      }
    }),
    minLength: (length, message) => ({
      minLength: {
        value: length,
        message: message || `${field} must be at least ${length} characters`
      }
    }),
    maxLength: (length, message) => ({
      maxLength: {
        value: length,
        message: message || `${field} must be less than ${length} characters`
      }
    })
  };

  return { ...rules, ...options };
};

/**
 * Standard color schemes for different item types
 */
export const getItemColors = (type) => {
  const colors = {
    project: {
      primary: 'text-blue-600',
      bg: 'bg-blue-100',
      hover: 'hover:bg-blue-50',
      border: 'border-blue-200'
    },
    certificate: {
      primary: 'text-green-600',
      bg: 'bg-green-100',
      hover: 'hover:bg-green-50',
      border: 'border-green-200'
    },
    skill: {
      primary: 'text-purple-600',
      bg: 'bg-purple-100',
      hover: 'hover:bg-purple-50',
      border: 'border-purple-200'
    },
    about: {
      primary: 'text-gray-600',
      bg: 'bg-gray-100',
      hover: 'hover:bg-gray-50',
      border: 'border-gray-200'
    }
  };

  return colors[type] || colors.about;
};

/**
 * Standard animation configurations
 */
export const getAnimationConfig = (type = 'fadeIn') => {
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.5 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 }
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3 }
    }
  };

  return animations[type] || animations.fadeIn;
};

/**
 * Standard empty state configurations
 */
export const getEmptyStateConfig = (type, options = {}) => {
  const configs = {
    project: {
      icon: 'FolderOpen',
      title: 'No Projects Yet',
      description: 'Get started by creating your first project.',
      actionText: 'Create Project',
      color: 'text-blue-600'
    },
    certificate: {
      icon: 'Award',
      title: 'No Certificates Yet',
      description: 'Add your certificates to showcase your achievements.',
      actionText: 'Add Certificate',
      color: 'text-green-600'
    },
    skill: {
      icon: 'Wrench',
      title: 'No Skills Yet',
      description: 'Add your skills to highlight your expertise.',
      actionText: 'Add Skill',
      color: 'text-purple-600'
    },
    default: {
      icon: 'FileText',
      title: 'No Items Yet',
      description: 'Get started by adding your first item.',
      actionText: 'Add Item',
      color: 'text-gray-600'
    }
  };

  return { ...configs[type] || configs.default, ...options };
};

/**
 * Standard confirmation dialog configurations
 */
export const getConfirmationConfig = (action, options = {}) => {
  const configs = {
    delete: {
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      cancelColor: 'bg-gray-200 hover:bg-gray-300'
    },
    publish: {
      title: 'Confirm Publish',
      message: 'Are you sure you want to publish this item?',
      confirmText: 'Publish',
      cancelText: 'Cancel',
      confirmColor: 'bg-green-600 hover:bg-green-700',
      cancelColor: 'bg-gray-200 hover:bg-gray-300'
    },
    unpublish: {
      title: 'Confirm Unpublish',
      message: 'Are you sure you want to unpublish this item?',
      confirmText: 'Unpublish',
      cancelText: 'Cancel',
      confirmColor: 'bg-orange-600 hover:bg-orange-700',
      cancelColor: 'bg-gray-200 hover:bg-gray-300'
    }
  };

  return { ...configs[action] || configs.delete, ...options };
};
