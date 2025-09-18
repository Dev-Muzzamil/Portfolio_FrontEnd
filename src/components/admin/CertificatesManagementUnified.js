import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Upload, Download, FileText, Image, X, Star } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFormOperations } from '../../hooks/useFormOperations';
import { useFileUpload } from '../../hooks/useFormOperations';
import { useModal } from '../../hooks/useFormOperations';
import { processStringArray, arrayToString, getDefaultFormValues } from '../../utils/formHelpers';
import { uploadMultipleFiles } from '../../utils/fileUpload';
import axios from '../../utils/axiosConfig';
import UnifiedList from '../UnifiedList';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import InstitutionSelector from '../common/InstitutionSelector';
import CertificateReportsManager from './CertificateReportsManager';
import FileUploadProgress from '../common/FileUploadProgress';
import { ValidatedInput, ValidatedTextarea } from '../common/FormValidation';
import { LoadingButton, UploadProgress, ActionLoading } from '../common/LoadingStates';
import toast from 'react-hot-toast';

const CertificatesManagementUnified = () => {
  const { certificates, projects, about, createCertificate, updateCertificate, deleteCertificate, addCertificate, loading, refreshData } = useData();
  const { resetInactivityForUpload, startUploadSession, endUploadSession } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, trigger } = useForm();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use custom hooks for form operations and file upload
  const {
    isCreating,
    isEditing,
    editingItem,
    handleSubmit: handleFormSubmit,
    handleDelete,
    handleEdit,
    handleCancelEdit,
    handleStartCreating
  } = useFormOperations(
    {
      submit: async (data) => {
        const certificateData = {
          ...data,
          skills: processStringArray(data.skills),
          issueDate: data.issueDate,
          expiryDate: data.expiryDate || null,
          visible: data.visible === 'true'
        };

        if (editingItem) {
          const updateData = {
            ...certificateData,
            issueDate: new Date(certificateData.issueDate),
            expiryDate: certificateData.expiryDate ? new Date(certificateData.expiryDate) : null
          };
          return await updateCertificate(editingItem._id, updateData);
        } else {
          // Handle file upload for new certificates
          if (fileUpload.uploadedFiles.length > 0) {
            return await createCertificateWithFiles(certificateData, fileUpload.uploadedFiles);
          } else {
            return await createCertificate(certificateData);
          }
        }
      },
      delete: deleteCertificate,
      toggleVisibility: async (certificateId, visible) => {
        return await updateCertificate(certificateId, { visible });
      }
    },
    {
      successMessages: {
        submit: 'Certificate saved successfully!',
        delete: 'Certificate deleted successfully!'
      },
      errorMessages: {
        submit: 'Failed to save certificate',
        delete: 'Failed to delete certificate'
      }
    }
  );

  // Use file upload hook
  const fileUpload = useFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB for PDFs
    allowedTypes: ['application/pdf', 'image/*'],
    showToasts: true
  });

  // Use modal hooks
  const confirmDialog = useModal();
  const [uploadSessionStarted, setUploadSessionStarted] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [expandedCertificates, setExpandedCertificates] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Keep some state variables for backward compatibility
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Helper function for creating certificates with files
  const createCertificateWithFiles = async (certificateData, files) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      
      Object.keys(certificateData).forEach(key => {
        if (certificateData[key] !== null && certificateData[key] !== undefined) {
          let value = certificateData[key];
          
          if (key === 'issueDate' && value) {
            value = new Date(value).toISOString();
          } else if (key === 'expiryDate' && value) {
            value = new Date(value).toISOString();
          } else if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          
          formData.append(key, value);
        }
      });
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post('/api/certificates/with-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create certificate with files error:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to create certificate' };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Cleanup upload session on unmount
  useEffect(() => {
    return () => {
      if (uploadSessionStarted) {
        endUploadSession();
        setUploadSessionStarted(false);
      }
    };
  }, [uploadSessionStarted, endUploadSession]);

  // Development helper to clear rate limits
  const clearRateLimit = async () => {
    try {
      await axios.post('/api/dev/clear-rate-limit');
      toast.success('Rate limit cleared for development');
    } catch (error) {
      console.log('Rate limit clear not available (production mode)');
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await handleFormSubmit(data, () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        // Clear form and files on success
        reset(getDefaultFormValues('certificate'));
        fileUpload.clearUploadedFiles();
        setPreviewFile(null);
        setPreviewLoading(false);
      }, reset);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Old onSubmit function removed - using new hook-based approach

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    if (!editingItem) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => [...prev, ...fileArray]);
      toast.success(`${fileArray.length} file(s) selected for upload`);
      
      const firstFile = fileArray[0];
      if (firstFile && (firstFile.type.startsWith('image/') || firstFile.type === 'application/pdf')) {
        await handleExtractDetails(firstFile);
      }
      
      setIsUploading(false);
      return;
    }

    try {
      const result = await uploadMultipleFiles(
        Array.from(files),
        `/api/certificates/${editingItem._id}/upload-files`,
        (progress) => {
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          toast.error('Upload failed. Please try again.');
        }
      );

      if (result.success) {
        toast.success(result.data.message);
        
        const firstFile = Array.from(files)[0];
        if (firstFile && (firstFile.type.startsWith('image/') || firstFile.type === 'application/pdf')) {
          await handleExtractDetails(firstFile);
        }
      } else {
        if (result.error === 'AUTH_EXPIRED') {
          toast.error('Session expired. Please refresh the page and login again.');
        } else if (result.error === 'TIMEOUT') {
          toast.error('Upload timed out. Please try with smaller files or check your connection.');
        } else if (result.error === 'FILES_TOO_LARGE') {
          toast.error('Files are too large. Please choose smaller files.');
        } else if (result.error === 'RATE_LIMITED') {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else if (result.error === 'NETWORK_ERROR') {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(result.message || 'Failed to upload files. Please try again.');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/certificates/${editingItem._id}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('File deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete file error:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleSetPrimaryFile = async (fileId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/certificates/${editingItem._id}/files/${fileId}/primary`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Primary file updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to set primary file');
      }
    } catch (error) {
      console.error('Set primary file error:', error);
      toast.error('Failed to set primary file');
    }
  };

  const handleExtractDetails = async (file) => {
    if (!file) {
      toast.error('Please select a certificate file');
      return;
    }

    setIsExtracting(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/certificates/extract-details', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        const hasData = result.extractedData && (
          (result.extractedData.title && result.extractedData.title.trim().length > 0) || 
          (result.extractedData.issuer && result.extractedData.issuer.trim().length > 0) || 
          (result.extractedData.issueDate && result.extractedData.issueDate.trim().length > 0) ||
          (result.extractedData.credentialId && result.extractedData.credentialId.trim().length > 0) ||
          (result.extractedData.credentialUrl && result.extractedData.credentialUrl.trim().length > 0) ||
          (result.extractedData.skills && result.extractedData.skills.length > 0)
        );
        
        if (hasData) {
          const formData = {
            title: result.extractedData.title || '',
            issuer: result.extractedData.issuer || '',
            issueDate: result.extractedData.issueDate || '',
            expiryDate: result.extractedData.expiryDate || '',
            credentialId: result.extractedData.credentialId || '',
            credentialUrl: result.extractedData.credentialUrl || '',
            description: result.extractedData.description || '',
            skills: result.extractedData.skills ? result.extractedData.skills.join(', ') : '',
            category: result.extractedData.category || 'certification',
            visible: 'true'
          };
          
          reset(formData);
          toast.success('Certificate details extracted and form auto-filled!');
        } else {
          toast.warning('No details could be extracted from the file. You may need to enter details manually.');
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to extract certificate details');
      }
    } catch (error) {
      console.error('Extract details error:', error);
      toast.error('Failed to extract certificate details. Please try again or enter details manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleLinkProjects = async (certificateId, projectIds) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/certificates/${certificateId}/link-projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projectIds })
      });

      if (response.ok) {
        toast.success('Projects linked successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to link projects');
      }
    } catch (error) {
      console.error('Link projects error:', error);
      toast.error('Failed to link projects');
    }
  };

  const handleEditCertificate = (certificateId) => {
    const certificate = certificates.find(c => c._id === certificateId);
    if (certificate) {
      reset({
        ...certificate,
        skills: arrayToString(certificate.skills),
        issueDate: certificate.issueDate ? new Date(certificate.issueDate).toISOString().split('T')[0] : '',
        expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split('T')[0] : '',
        visible: certificate.visible.toString(),
        completedAtInstitution: certificate.completedAtInstitution || ''
      });
      handleEdit(certificate);
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    const result = await handleDelete(certificateId);
    if (result.success) {
      confirmDialog.closeModal();
    }
  };

  const handleToggleVisibility = async (certificateId, visible) => {
    const result = await updateCertificate(certificateId, { visible });
    if (result.success) {
      toast.success(visible ? 'Certificate is now visible' : 'Certificate is now hidden');
    } else {
      toast.error(result.message);
    }
  };

  const handleExpand = (certificateId) => {
    // Not used in admin mode
  };

  const handleLink = (certificateId, linkedIds) => {
    handleLinkProjects(certificateId, linkedIds);
  };

  const handleAddCertificate = () => {
    reset(getDefaultFormValues('certificate'));
    fileUpload.clearUploadedFiles();
    setPreviewFile(null);
    setPreviewLoading(false);
    handleStartCreating();
  };

  const handleCancel = () => {
    handleCancelEdit();
    reset(getDefaultFormValues('certificate'));
    fileUpload.clearUploadedFiles();
    setPreviewFile(null);
    setPreviewLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Certificate saved successfully!</span>
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingItem ? 'Edit Certificate' : 'Add New Certificate'}
          </h2>
          
          <form 
            key={editingItem ? `edit-${editingItem._id}` : 'create-new'}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Title *
                </label>
                <ValidatedInput
                  {...register('title', { required: 'Title is required' })}
                  placeholder="e.g., Machine Learning Specialization"
                  rules={{ required: true, minLength: 3 }}
                  showValidation={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issuing Organization *
                </label>
                <ValidatedInput
                  {...register('issuer', { required: 'Issuer is required' })}
                  placeholder="e.g., Coursera, Google, Microsoft"
                  rules={{ required: true, minLength: 2 }}
                  showValidation={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completed at Institution
                </label>
                <input
                  {...register('completedAtInstitution')}
                  type="hidden"
                />
                <InstitutionSelector
                  value={watch('completedAtInstitution') || ''}
                  onChange={async (value) => {
                    setValue('completedAtInstitution', value);
                    await trigger('completedAtInstitution');
                  }}
                  placeholder="Select or enter institution..."
                  disabled={!isEditing}
                  educationData={about?.education || []}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Institution where this certificate was earned
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date *
                </label>
                <input
                  {...register('issueDate', { required: 'Issue date is required' })}
                  type="date"
                  className="input-field"
                />
                {errors.issueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  {...register('expiryDate')}
                  type="date"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credential ID
                </label>
                <input
                  {...register('credentialId')}
                  className="input-field"
                  placeholder="e.g., ML-SPEC-2023"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification URL (Optional)
                </label>
                <input
                  {...register('credentialUrl')}
                  type="url"
                  className="input-field"
                  placeholder="https://coursera.org/verify/certificate..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Link to verify this certificate online (optional reference)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  {...register('category')}
                  className="input-field"
                >
                  <option value="course">Course</option>
                  <option value="workshop">Workshop</option>
                  <option value="certification">Certification</option>
                  <option value="award">Award</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  {...register('visible')}
                  className="input-field"
                >
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field"
                placeholder="Describe what this certificate represents..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills Covered
              </label>
              <input
                {...register('skills')}
                className="input-field"
                placeholder="Machine Learning, Python, TensorFlow (comma separated)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate multiple skills with commas
              </p>
            </div>

            {/* Reports Section - Only show when editing existing certificate */}
            {editingItem && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Certificate Reports</h3>
                <p className="text-sm text-gray-600">
                  Upload certificate reports, documentation, or add links to external resources
                </p>
                
                <CertificateReportsManager 
                  certificateId={editingItem._id}
                  reports={editingItem.reports || []}
                  onUpdate={async () => {
                    // Refresh the certificate data from the server
                    try {
                      await refreshData();
                      // Re-edit the certificate to show updated data
                      setTimeout(() => {
                        handleEditCertificate(editingItem._id);
                      }, 500);
                    } catch (error) {
                      console.error('Failed to refresh certificate data:', error);
                    }
                  }}
                />
              </div>
            )}

            {/* File Upload Section */}
            {(editingItem || isCreating) && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Certificate Files</h3>
                
                {/* Existing Files (when editing) */}
                {editingItem && editingItem.files && editingItem.files.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Current Files:</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {editingItem.files.map((file, index) => (
                        <div key={file._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {file.mimeType?.startsWith('image/') ? (
                              <Image className="w-5 h-5 text-blue-600" />
                            ) : (
                              <FileText className="w-5 h-5 text-gray-600" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                              <p className="text-xs text-gray-500">{file.mimeType}</p>
                            </div>
                            {file.isPrimary && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-xs text-yellow-600 font-medium">Primary</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                              title="View/Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            {!file.isPrimary && (
                              <button
                                onClick={() => handleSetPrimaryFile(file._id)}
                                className="text-yellow-600 hover:text-yellow-700"
                                title="Set as Primary"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFile(file._id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete File"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Files (when creating new certificate) */}
                {!editingItem && uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {file.type?.startsWith('image/') ? (
                              <Image className="w-5 h-5 text-blue-600" />
                            ) : (
                              <FileText className="w-5 h-5 text-gray-600" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{file.type} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700"
                            title="Remove File"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Files */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Upload Certificate Files:</h4>
                  
                  <FileUploadProgress
                    onFileSelect={async (file) => {
                      // Handle single file upload
                      const files = [file];
                      await handleFileUpload(files);
                    }}
                    onFileRemove={(file) => {
                      setUploadedFiles(prev => prev.filter(f => f !== file));
                    }}
                    files={uploadedFiles}
                    maxFiles={5}
                    acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.odt', '.txt']}
                    maxSize={20 * 1024 * 1024} // 20MB
                    disabled={isUploading || isExtracting}
                    title="Upload Certificate Files"
                    description="Drag and drop files here or click to browse"
                  />
                  
                  {/* Upload Status */}
                  {isUploading && (
                    <ActionLoading action="uploading" />
                  )}
                  
                  {isExtracting && (
                    <ActionLoading action="saving" />
                  )}
                </div>
              </div>
            )}

            {/* Project Linking Section - Only show when editing existing certificate */}
            {editingItem && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Linked Projects</h3>
                <p className="text-sm text-gray-600">
                  Link this certificate to relevant projects to show how the knowledge was applied
                </p>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Projects to Link:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {projects.map((project) => (
                      <label key={project._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={editingItem.linkedProjects?.some(linked => 
                            typeof linked === 'string' ? linked === project._id : linked._id === project._id
                          ) || false}
                          onChange={(e) => {
                            const currentLinked = editingItem.linkedProjects || [];
                            const newLinked = e.target.checked
                              ? [...currentLinked, project._id]
                              : currentLinked.filter(linked => 
                                  typeof linked === 'string' ? linked !== project._id : linked._id !== project._id
                                );
                            
                            handleLinkProjects(editingItem._id, newLinked);
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{project.title}</div>
                          <div className="text-xs text-gray-500">{project.category} • {project.status}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {projects.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No projects available. Add projects first to link them to certificates.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <LoadingButton
                type="submit"
                loading={isLoading || isUploading}
                loadingText={isUploading ? 'Uploading...' : 'Saving...'}
                disabled={isLoading || isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingItem ? 'Save Certificate' : 'Add Certificate'}
              </LoadingButton>
            </div>
          </form>
        </motion.div>
      )}

      {/* Certificates List using UnifiedList */}
      {certificates.length === 0 ? (
        <EmptyState
          type="certificate"
          onAction={handleAddCertificate}
          className="bg-white rounded-lg border border-gray-200"
        />
      ) : (
        <UnifiedList
          items={certificates}
          type="certificate"
          mode="admin"
          loading={loading}
          onEdit={handleEditCertificate}
          onDelete={(certificate) => {
            confirmDialog.setIsOpen(true);
            confirmDialog.certificateToDelete = certificate._id;
          }}
          onToggleVisibility={handleToggleVisibility}
          onExpand={handleExpand}
          onLink={handleLink}
          onAdd={handleAddCertificate}
          linkedItems={projects}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.closeModal}
        onConfirm={() => handleDeleteCertificate(confirmDialog.certificateToDelete)}
        type="delete"
        title="Delete Certificate"
        message="Are you sure you want to delete this certificate? This action cannot be undone."
      />
    </div>
  );
};

export default CertificatesManagementUnified;
