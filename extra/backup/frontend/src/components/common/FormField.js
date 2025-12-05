import React from 'react';
import { motion } from 'framer-motion';

const FormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  register,
  errors,
  required = false,
  className = '',
  options = [],
  rows = 4,
  disabled = false,
  validation = {},
  ...props
}) => {
  const fieldId = `field-${name}`;
  const error = errors?.[name];
  const isRequired = required || validation.required;

  const renderField = () => {
    const commonProps = {
      id: fieldId,
      name,
      placeholder,
      disabled,
      className: `input-field ${error ? 'border-red-500' : ''} ${className}`,
      ...register(name, validation),
      ...props
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            className={`${commonProps.className} resize-none`}
          />
        );
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              {...commonProps}
              type="checkbox"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor={fieldId} className="text-sm text-gray-700">
              {label}
            </label>
          </div>
        );
      
      default:
        return <input {...commonProps} type={type} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      {type !== 'checkbox' && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error.message}
        </motion.p>
      )}
    </motion.div>
  );
};

export default FormField;
