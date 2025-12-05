import React from 'react';
import { motion } from 'framer-motion';
import { Save, X } from 'lucide-react';
import Button from './Button';
import AnimatedSection from './AnimatedSection';

const FormSection = ({
  title,
  description,
  children,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
  showActions = true,
  className = '',
  ...props
}) => {
  return (
    <AnimatedSection
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 ${className}`}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              icon={X}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {isEditing ? 'Cancel' : 'Close'}
            </Button>
            
            {onSubmit && (
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                onClick={onSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </AnimatedSection>
  );
};

export default FormSection;
