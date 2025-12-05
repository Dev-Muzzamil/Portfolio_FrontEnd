/**
 * FileUploadProgress - Enhanced file upload component with better UX
 * Provides visual feedback, progress tracking, and error handling
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon,
  File,
  Trash2,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const FileUploadProgress = ({
  onFileSelect,
  onFileRemove,
  onFilePreview,
  files = [],
  maxFiles = 5,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  className = '',
  title = 'Upload Files',
  description = 'Drag and drop files here or click to browse'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  /**
   * Get file icon based on type
   */
  const getFileIcon = useCallback((file) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (file.type.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  }, []);

  /**
   * Format file size
   */
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  /**
   * Validate file
   */
  const validateFile = useCallback((file) => {
    // Check file size
    if (file.size > maxSize) {
      toast.error(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`);
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast.error(`File ${file.name} is not supported. Accepted types: ${acceptedTypes.join(', ')}`);
      return false;
    }

    return true;
  }, [maxSize, acceptedTypes, formatFileSize]);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (selectedFiles) => {
    if (disabled) return;

    const fileArray = Array.from(selectedFiles);
    
    // Check if adding these files would exceed max limit
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validFiles = fileArray.filter(validateFile);
    if (validFiles.length === 0) return;

    setUploading(true);
    
    try {
      // Simulate upload progress for each file
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
        
        // Call the actual upload handler
        await onFileSelect(file);
        
        // Mark as completed
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }
      
      toast.success(`${validFiles.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [disabled, files.length, maxFiles, validateFile, onFileSelect]);

  /**
   * Handle drag and drop
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [disabled, handleFileSelect]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  /**
   * Handle file removal
   */
  const handleFileRemove = useCallback((file) => {
    if (onFileRemove) {
      onFileRemove(file);
    }
  }, [onFileRemove]);

  /**
   * Handle file preview
   */
  const handleFilePreview = useCallback((file) => {
    if (onFilePreview) {
      onFilePreview(file);
    }
  }, [onFilePreview]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className={`w-8 h-8 mx-auto ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <div className="text-xs text-gray-400">
            Max {maxFiles} files • {formatFileSize(maxSize)} max per file
          </div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-gray-900">Selected Files</h4>
            <div className="space-y-2">
              {files.map((file, index) => (
                <motion.div
                  key={file.name || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {uploading && uploadProgress[file.name] !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadProgress[file.name]}% uploaded
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {onFilePreview && (
                      <button
                        type="button"
                        onClick={() => handleFilePreview(file)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Preview file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => handleFileRemove(file)}
                      disabled={uploading}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Status */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 text-sm text-blue-600"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          <span>Uploading files...</span>
        </motion.div>
      )}
    </div>
  );
};

export default FileUploadProgress;
