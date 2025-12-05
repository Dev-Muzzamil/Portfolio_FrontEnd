/**
 * LoadingStates - Enhanced loading components with better UX
 * Provides various loading states and skeleton components
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Upload, Save, Trash2, Edit, Plus } from 'lucide-react';

/**
 * Spinner Component
 */
export const Spinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
    />
  );
};

/**
 * Button Loading State
 */
export const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Loading...',
  icon: Icon,
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        ${props.className || ''}
        ${loading ? 'opacity-75 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-center justify-center space-x-2">
        {loading ? (
          <>
            <Spinner size="sm" color="white" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {Icon && <Icon className="w-4 h-4" />}
            <span>{children}</span>
          </>
        )}
      </div>
    </button>
  );
};

/**
 * Card Skeleton
 */
export const CardSkeleton = ({ 
  lines = 3, 
  showImage = true, 
  className = '' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {showImage && (
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
        )}
        
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          {lines > 2 && (
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * List Skeleton
 */
export const ListSkeleton = ({ 
  items = 5, 
  className = '' 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Form Skeleton
 */
export const FormSkeleton = ({ 
  fields = 5, 
  className = '' 
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Upload Progress
 */
export const UploadProgress = ({ 
  progress = 0, 
  fileName = '', 
  onCancel,
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}
    >
      <div className="flex items-center space-x-3">
        <Upload className="w-5 h-5 text-blue-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progress)}% uploaded
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Action Loading State
 */
export const ActionLoading = ({ 
  action = 'saving', 
  className = '' 
}) => {
  const actionIcons = {
    saving: Save,
    uploading: Upload,
    deleting: Trash2,
    editing: Edit,
    creating: Plus
  };

  const actionTexts = {
    saving: 'Saving...',
    uploading: 'Uploading...',
    deleting: 'Deleting...',
    editing: 'Editing...',
    creating: 'Creating...'
  };

  const Icon = actionIcons[action] || Save;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}
    >
      <Spinner size="sm" color="gray" />
      <Icon className="w-4 h-4" />
      <span>{actionTexts[action] || 'Processing...'}</span>
    </motion.div>
  );
};

/**
 * Empty State with Loading
 */
export const EmptyStateLoading = ({ 
  title = 'Loading...', 
  description = 'Please wait while we load your data',
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 mx-auto mb-4"
      >
        <Spinner size="xl" color="blue" />
      </motion.div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

/**
 * Inline Loading
 */
export const InlineLoading = ({ 
  text = 'Loading...', 
  className = '' 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Spinner size="sm" color="blue" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

/**
 * Page Loading
 */
export const PageLoading = ({ 
  title = 'Loading Page...', 
  description = 'Please wait while we load the page',
  className = '' 
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-6"
        >
          <Spinner size="xl" color="blue" />
        </motion.div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default {
  Spinner,
  LoadingButton,
  CardSkeleton,
  ListSkeleton,
  FormSkeleton,
  UploadProgress,
  ActionLoading,
  EmptyStateLoading,
  InlineLoading,
  PageLoading
};
