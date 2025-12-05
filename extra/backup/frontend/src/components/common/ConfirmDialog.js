// Reusable confirmation dialog component to reduce redundancy

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { getConfirmationConfig } from '../../utils/uiHelpers';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'delete',
  title,
  message,
  confirmText,
  cancelText,
  confirmColor,
  cancelColor,
  isLoading = false,
  icon: CustomIcon
}) => {
  const config = getConfirmationConfig(type, {
    title,
    message,
    confirmText,
    cancelText,
    confirmColor,
    cancelColor
  });

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {CustomIcon ? (
                  <CustomIcon className="w-6 h-6 text-orange-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {config.title}
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 leading-relaxed">
                {config.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${config.cancelColor}`}
              >
                {config.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${config.confirmColor}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{config.confirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
