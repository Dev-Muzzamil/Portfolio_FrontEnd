import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const getVariantClasses = () => {
    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white',
      ghost: 'text-primary-600 hover:bg-primary-50',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
      success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
      warning: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl',
      info: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
    };
    return variants[variant] || variants.primary;
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl'
    };
    return sizes[size] || sizes.md;
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${className}
  `.trim();

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="ml-2">Loading...</span>
        </>
      );
    }

    if (Icon) {
      return (
        <>
          {iconPosition === 'left' && <Icon className="w-4 h-4" />}
          <span className={iconPosition === 'left' ? 'ml-2' : 'mr-2'}>
            {children}
          </span>
          {iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      );
    }

    return children;
  };

  return (
    <motion.button
      type={type}
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...props}
    >
      {renderContent()}
    </motion.button>
  );
};

export default Button;
