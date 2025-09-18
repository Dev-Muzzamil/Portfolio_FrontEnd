/**
 * FormValidation - Enhanced form validation with better UX
 * Provides real-time validation feedback and error handling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const FormValidation = ({
  field,
  value,
  rules = {},
  showValidation = true,
  className = ''
}) => {
  const [errors, setErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);
  const [isTouched, setIsTouched] = useState(false);

  /**
   * Validation rules
   */
  const validationRules = {
    required: (value) => value ? null : 'This field is required',
    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Please enter a valid email address';
    },
    minLength: (value, min) => {
      return value && value.length >= min 
        ? null 
        : `Must be at least ${min} characters long`;
    },
    maxLength: (value, max) => {
      return value && value.length <= max 
        ? null 
        : `Must be no more than ${max} characters long`;
    },
    url: (value) => {
      const urlRegex = /^https?:\/\/.+/;
      return urlRegex.test(value) ? null : 'Please enter a valid URL';
    },
    phone: (value) => {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Please enter a valid phone number';
    },
    date: (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) ? null : 'Please enter a valid date';
    },
    custom: (value, validator) => {
      return validator(value);
    }
  };

  /**
   * Validate field value
   */
  const validateField = useCallback((val) => {
    const fieldErrors = [];
    
    Object.entries(rules).forEach(([rule, ruleValue]) => {
      if (rule === 'required' && ruleValue) {
        const error = validationRules.required(val);
        if (error) fieldErrors.push(error);
      } else if (rule === 'email' && ruleValue && val) {
        const error = validationRules.email(val);
        if (error) fieldErrors.push(error);
      } else if (rule === 'minLength' && val) {
        const error = validationRules.minLength(val, ruleValue);
        if (error) fieldErrors.push(error);
      } else if (rule === 'maxLength' && val) {
        const error = validationRules.maxLength(val, ruleValue);
        if (error) fieldErrors.push(error);
      } else if (rule === 'url' && ruleValue && val) {
        const error = validationRules.url(val);
        if (error) fieldErrors.push(error);
      } else if (rule === 'phone' && ruleValue && val) {
        const error = validationRules.phone(val);
        if (error) fieldErrors.push(error);
      } else if (rule === 'date' && ruleValue && val) {
        const error = validationRules.date(val);
        if (error) fieldErrors.push(error);
      } else if (rule === 'custom' && ruleValue) {
        const error = validationRules.custom(val, ruleValue);
        if (error) fieldErrors.push(error);
      }
    });

    setErrors(fieldErrors);
    setIsValid(fieldErrors.length === 0);
    
    return fieldErrors.length === 0;
  }, [rules]);

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(() => {
    setIsTouched(true);
    validateField(value);
  }, [value, validateField]);

  /**
   * Handle field change
   */
  const handleChange = useCallback((val) => {
    if (isTouched) {
      validateField(val);
    }
  }, [isTouched, validateField]);

  // Validate on mount and when value changes
  useEffect(() => {
    if (isTouched) {
      validateField(value);
    }
  }, [value, isTouched, validateField]);

  if (!showValidation) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Error Messages */}
      <AnimatePresence>
        {isTouched && errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {errors.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center space-x-1 text-sm text-red-600"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {isTouched && isValid && value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center space-x-1 text-sm text-green-600"
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Looks good!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Enhanced Input Component with validation
 */
export const ValidatedInput = ({
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  rules = {},
  showValidation = true,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const handleBlur = useCallback((e) => {
    setIsTouched(true);
    if (onBlur) onBlur(e);
  }, [onBlur]);

  const handleChange = useCallback((e) => {
    if (onChange) onChange(e);
  }, [onChange]);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${isTouched && rules.required && !value ? 'border-red-300' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      <FormValidation
        field={name}
        value={value}
        rules={rules}
        showValidation={showValidation && isTouched}
      />
    </div>
  );
};

/**
 * Enhanced Textarea Component with validation
 */
export const ValidatedTextarea = ({
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  rules = {},
  showValidation = true,
  className = '',
  ...props
}) => {
  const [isTouched, setIsTouched] = useState(false);

  const handleBlur = useCallback((e) => {
    setIsTouched(true);
    if (onBlur) onBlur(e);
  }, [onBlur]);

  const handleChange = useCallback((e) => {
    if (onChange) onChange(e);
  }, [onChange]);

  return (
    <div className="space-y-1">
      <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isTouched && rules.required && !value ? 'border-red-300' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      
      <FormValidation
        field={name}
        value={value}
        rules={rules}
        showValidation={showValidation && isTouched}
      />
    </div>
  );
};

export default FormValidation;
