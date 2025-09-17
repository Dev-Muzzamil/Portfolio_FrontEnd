import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Award, Calendar, Eye, EyeOff, Upload, Download, FileText, Image, X, Star, ChevronDown, ExternalLink, FileImage, File, Link } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { uploadMultipleFiles } from '../../utils/fileUpload';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';

const CertificatesManagement = () => {
  const { certificates, projects, createCertificate, updateCertificate, deleteCertificate, loading } = useData();
  const { resetInactivityForUpload } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [expandedCertificates, setExpandedCertificates] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    const certificateData = {
      ...data,
      skills: data.skills ? data.skills.split(',').map(skill => skill.trim()) : [],
      issueDate: data.issueDate, // Keep as string for FormData
      expiryDate: data.expiryDate || null, // Keep as string for FormData
      visible: data.visible === 'true'
    };

    if (editingCertificate) {
      // Update existing certificate - convert dates for regular API call
      const updateData = {
        ...certificateData,
        issueDate: new Date(certificateData.issueDate),
        expiryDate: certificateData.expiryDate ? new Date(certificateData.expiryDate) : null
      };
      const result = await updateCertificate(editingCertificate._id, updateData);
      if (result.success) {
        toast.success('Certificate updated successfully!');
        reset();
        setIsCreating(false);
        setEditingCertificate(null);
        setUploadedFiles([]);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } else {
      // Create new certificate with files
      if (uploadedFiles.length > 0) {
        // Create certificate with files using the /with-files endpoint
        try {
          setIsUploading(true);
          const formData = new FormData();
          
          // Add certificate data
          Object.keys(certificateData).forEach(key => {
            if (certificateData[key] !== null && certificateData[key] !== undefined) {
              let value = certificateData[key];
              
              // Convert dates to ISO8601 format for backend validation
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
          
          // Add files
          uploadedFiles.forEach(file => {
            formData.append('files', file);
          });

          // Debug: Log form data
          console.log('🔗 DEBUG: Certificate data being sent:', certificateData);
          console.log('🔗 DEBUG: FormData entries:');
          for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value);
          }

          // Reset inactivity timer before upload
          resetInactivityForUpload();

          const response = await axios.post('/api/certificates/with-files', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 600000, // 10 minutes timeout for large files
            onUploadProgress: (progressEvent) => {
              // Reset inactivity timer during upload progress
              resetInactivityForUpload();
              
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress(percentCompleted);
                console.log(`Certificate Upload Progress: ${percentCompleted}%`);
              }
            },
          });

          toast.success('Certificate added with files successfully!');
          
          // If extracted data is available, show it to the user
          if (response.data.extractedData) {
            toast.success('Details were extracted from the uploaded file and auto-filled!');
          }
          
          reset();
          setIsCreating(false);
          setEditingCertificate(null);
          setUploadedFiles([]);
          // Refresh the page to show the new certificate
          window.location.reload();
        } catch (error) {
          console.error('Add certificate with files error:', error);
          
          if (error.response?.status === 401) {
            toast.error('Authentication expired. Please refresh the page and try again.');
          } else {
            toast.error(error.response?.data?.message || 'Failed to add certificate with files');
          }
        } finally {
          setIsUploading(false);
        }
      } else {
        // Add certificate without files using the regular endpoint
        const result = await createCertificate(certificateData);
        if (result.success) {
          toast.success('Certificate added successfully!');
          reset();
          setIsCreating(false);
          setEditingCertificate(null);
          setUploadedFiles([]);
        } else {
          toast.error(result.message);
        }
      }
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    // If creating a new certificate, store files temporarily
    if (!editingCertificate) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => [...prev, ...fileArray]);
      toast.success(`${fileArray.length} file(s) selected for upload`);
      
      // Auto-extract details from the first uploaded file if it's an image or PDF
      const firstFile = fileArray[0];
      if (firstFile && (firstFile.type.startsWith('image/') || firstFile.type === 'application/pdf')) {
        await handleExtractDetails(firstFile);
      }
      
      setIsUploading(false);
      return;
    }

    // If editing existing certificate, upload immediately
    try {
      const result = await uploadMultipleFiles(
        Array.from(files),
        `/api/certificates/${editingCertificate._id}/upload-files`,
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
        
        // Auto-extract details from the first uploaded file if it's an image or PDF
        const firstFile = Array.from(files)[0];
        if (firstFile && (firstFile.type.startsWith('image/') || firstFile.type === 'application/pdf')) {
          await handleExtractDetails(firstFile);
        }
        
        // Refresh the certificate data
        window.location.reload(); // Simple refresh for now
      } else {
        // Handle different error types with specific messages
        if (result.error === 'AUTH_EXPIRED') {
          toast.error('Session expired. Please refresh the page and login again.');
          // Don't auto-redirect, let user handle it
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
      const response = await fetch(`/api/certificates/${editingCertificate._id}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('File deleted successfully');
        // Refresh the certificate data
        window.location.reload(); // Simple refresh for now
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
      const response = await fetch(`/api/certificates/${editingCertificate._id}/files/${fileId}/primary`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Primary file updated successfully');
        // Refresh the certificate data
        window.location.reload(); // Simple refresh for now
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to set primary file');
      }
    } catch (error) {
      console.error('Set primary file error:', error);
      toast.error('Failed to set primary file');
    }
  };

  const toggleCertificateExpansion = (certificateId) => {
    setExpandedCertificates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(certificateId)) {
        newSet.delete(certificateId);
      } else {
        newSet.add(certificateId);
      }
      return newSet;
    });
  };

  const handleFilePreview = (file) => {
    console.log('🔗 DEBUG: Previewing file:', file);
    setPreviewLoading(true);
    setPreviewFile(file);
    // Reset loading state after a short delay
    setTimeout(() => setPreviewLoading(false), 1000);
  };

  const closeFilePreview = () => {
    setPreviewFile(null);
    setPreviewLoading(false);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-4 h-4 text-blue-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const parseSkills = (skills) => {
    console.log('🔗 DEBUG: parseSkills called with:', skills, 'type:', typeof skills);
    
    if (!skills) {
      console.log('🔗 DEBUG: No skills provided');
      return [];
    }
    
    // If it's already an array, check if it contains JSON strings
    if (Array.isArray(skills)) {
      console.log('🔗 DEBUG: Skills is an array:', skills);
      
      // If array has only one element and it's a JSON string, parse it
      if (skills.length === 1 && typeof skills[0] === 'string' && skills[0].startsWith('[')) {
        console.log('🔗 DEBUG: Single JSON string in array, parsing...');
        try {
          const parsed = JSON.parse(skills[0]);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(skill => skill && skill.trim().length > 0);
            console.log('🔗 DEBUG: Parsed JSON from array:', filtered);
            return filtered;
          }
        } catch (e) {
          console.log('🔗 DEBUG: Failed to parse JSON from array:', e.message);
        }
      }
      
      // Otherwise, filter the array normally
      const filtered = skills.filter(skill => skill && skill.trim().length > 0);
      console.log('🔗 DEBUG: Filtered array skills:', filtered);
      return filtered;
    }
    
    // If it's a string, try to parse it
    if (typeof skills === 'string') {
      console.log('🔗 DEBUG: Skills is a string:', skills);
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(skills);
        console.log('🔗 DEBUG: JSON parsed successfully:', parsed);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(skill => skill && skill.trim().length > 0);
          console.log('🔗 DEBUG: Filtered skills:', filtered);
          return filtered;
        }
      } catch (e) {
        console.log('🔗 DEBUG: JSON parsing failed, trying comma split:', e.message);
        // If JSON parsing fails, split by comma
        const split = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        console.log('🔗 DEBUG: Comma split result:', split);
        return split;
      }
    }
    
    console.log('🔗 DEBUG: No valid skills format found');
    return [];
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
        console.log('🔗 DEBUG: Extraction result:', result);
        console.log('🔗 DEBUG: Extracted data:', result.extractedData);
        
        // Check if any meaningful data was extracted
        const hasData = result.extractedData && (
          (result.extractedData.title && result.extractedData.title.trim().length > 0) || 
          (result.extractedData.issuer && result.extractedData.issuer.trim().length > 0) || 
          (result.extractedData.issueDate && result.extractedData.issueDate.trim().length > 0) ||
          (result.extractedData.credentialId && result.extractedData.credentialId.trim().length > 0) ||
          (result.extractedData.credentialUrl && result.extractedData.credentialUrl.trim().length > 0) || // ✅ ADDED: credentialUrl check
          (result.extractedData.skills && result.extractedData.skills.length > 0)
        );
        
        console.log('🔗 DEBUG: hasData check result:', hasData);
        
        if (hasData) {
          // Auto-fill the form with extracted data
          const formData = {
            title: result.extractedData.title || '',
            issuer: result.extractedData.issuer || '',
            issueDate: result.extractedData.issueDate || '',
            expiryDate: result.extractedData.expiryDate || '',
            credentialId: result.extractedData.credentialId || '',
            credentialUrl: result.extractedData.credentialUrl || '', // ✅ ADDED: credentialUrl field
            description: result.extractedData.description || '',
            skills: result.extractedData.skills ? result.extractedData.skills.join(', ') : '',
            category: result.extractedData.category || 'certification',
            visible: 'true'
          };
          
          console.log('🔗 DEBUG: Form data being set:', formData);
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
    console.log('🔗 DEBUG: handleLinkProjects called');
    console.log('🔗 DEBUG: certificateId:', certificateId);
    console.log('🔗 DEBUG: projectIds:', projectIds);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔗 DEBUG: token exists:', !!token);
      
      const requestBody = { projectIds };
      console.log('🔗 DEBUG: request body:', requestBody);
      
      const response = await fetch(`/api/certificates/${certificateId}/link-projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔗 DEBUG: response status:', response.status);
      console.log('🔗 DEBUG: response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('🔗 DEBUG: success response:', result);
        toast.success('Projects linked successfully');
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        console.log('🔗 DEBUG: error response:', error);
        toast.error(error.message || 'Failed to link projects');
      }
    } catch (error) {
      console.error('🔗 DEBUG: Link projects error:', error);
      toast.error('Failed to link projects');
    }
  };

  const handleEdit = (certificate) => {
    console.log('🔗 DEBUG: handleEdit called with certificate:', certificate);
    console.log('🔗 DEBUG: certificate.linkedProjects:', certificate.linkedProjects);
    setEditingCertificate(certificate);
    setIsCreating(true);
    reset({
      ...certificate,
      skills: certificate.skills.join(', '),
      issueDate: certificate.issueDate ? new Date(certificate.issueDate).toISOString().split('T')[0] : '',
      expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split('T')[0] : '',
      visible: certificate.visible.toString()
    });
  };

  const handleDelete = async (certificateId) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      const result = await deleteCertificate(certificateId);
      if (result.success) {
        toast.success('Certificate deleted successfully!');
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCertificate(null);
    setUploadedFiles([]);
    reset();
  };

  const handleToggleVisibility = async (certificateId, visible) => {
    const result = await updateCertificate(certificateId, { visible });
    if (result.success) {
      toast.success(visible ? 'Certificate is now visible' : 'Certificate is now hidden');
    } else {
      toast.error(result.message);
    }
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your professional certificates and achievements
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certificate</span>
        </button>
      </motion.div>

      {/* Create/Edit Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingCertificate ? 'Edit Certificate' : 'Add New Certificate'}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="input-field"
                  placeholder="e.g., Machine Learning Specialization"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issuing Organization *
                </label>
                <input
                  {...register('issuer', { required: 'Issuer is required' })}
                  className="input-field"
                  placeholder="e.g., Coursera, Google, Microsoft"
                />
                {errors.issuer && (
                  <p className="mt-1 text-sm text-red-600">{errors.issuer.message}</p>
                )}
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

            {/* File Upload Section - Show for both creating and editing certificates */}
            {(editingCertificate || isCreating) && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Certificate Files</h3>
                
                {/* Existing Files (when editing) */}
                {editingCertificate && editingCertificate.files && editingCertificate.files.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Current Files:</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {editingCertificate.files.map((file, index) => (
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
                {!editingCertificate && uploadedFiles.length > 0 && (
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
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.odt,.txt"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isExtracting}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isUploading ? 'Uploading...' : 
                     isExtracting ? 'Analyzing...' : 
                     'Upload & Extract Details'}
                  </span>
                </button>
                
                {/* Upload Progress Bar */}
                {isUploading && uploadProgress > 0 && (
                  <div className="w-full">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <span className="text-sm text-gray-500">
                  PDF, Images, Word, Text files (max 20MB each) • Details extracted automatically
                </span>
              </div>
            </div>

              </div>
            )}

            {/* Project Linking Section - Only show when editing existing certificate */}
            {editingCertificate && (
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
                          checked={editingCertificate.linkedProjects?.some(linked => 
                            typeof linked === 'string' ? linked === project._id : linked._id === project._id
                          ) || false}
                          onChange={(e) => {
                            console.log('🔗 DEBUG: Project checkbox changed');
                            console.log('🔗 DEBUG: project._id:', project._id);
                            console.log('🔗 DEBUG: e.target.checked:', e.target.checked);
                            console.log('🔗 DEBUG: editingCertificate.linkedProjects:', editingCertificate.linkedProjects);
                            
                            const currentLinked = editingCertificate.linkedProjects || [];
                            console.log('🔗 DEBUG: currentLinked:', currentLinked);
                            
                            const newLinked = e.target.checked
                              ? [...currentLinked, project._id]
                              : currentLinked.filter(linked => 
                                  typeof linked === 'string' ? linked !== project._id : linked._id !== project._id
                                );
                            
                            console.log('🔗 DEBUG: newLinked:', newLinked);
                            console.log('🔗 DEBUG: editingCertificate._id:', editingCertificate._id);
                            
                            handleLinkProjects(editingCertificate._id, newLinked);
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
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="btn-primary"
              >
                {isUploading ? 'Saving...' : (editingCertificate ? 'Save Certificate' : 'Add Certificate')}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Certificates List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {certificates.map((certificate) => {
          const isExpanded = expandedCertificates.has(certificate._id);
          console.log('🔗 DEBUG: Certificate data:', certificate);
          console.log('🔗 DEBUG: Certificate skills:', certificate.skills, 'type:', typeof certificate.skills);
          return (
            <div key={certificate._id} className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 max-w-full overflow-hidden border border-gray-100 hover:border-primary-200">
              <div className="space-y-4 max-w-full p-6">
              <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 break-words group-hover:text-primary-700 transition-colors duration-200" title={certificate.title}>
                      {certificate.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-primary-600 font-semibold break-words" title={certificate.issuer}>
                        {certificate.issuer}
                      </p>
                      {certificate.visible && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                          Live
                        </span>
                      )}
                </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleCertificateExpansion(certificate._id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 group/btn"
                      title={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                  <button
                    onClick={() => handleToggleVisibility(certificate._id, !certificate.visible)}
                      className={`p-2 rounded-lg transition-all duration-200 group/btn ${
                        certificate.visible 
                          ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    title={certificate.visible ? 'Hide certificate' : 'Show certificate'}
                  >
                    {certificate.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(certificate)}
                      className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200 group/btn"
                      title="Edit certificate"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(certificate._id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group/btn"
                      title="Delete certificate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">
                    {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
                
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                  certificate.category === 'workshop' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : certificate.category === 'course'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : certificate.category === 'certification'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {certificate.category}
                </span>
                
                {certificate.expiryDate && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
                    <Award className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-700 font-medium">
                      Expires {new Date(certificate.expiryDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Collapsed view - only show basic info */}
              {!isExpanded && (
                <>
              {certificate.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 text-justify">
                  {certificate.description}
                </p>
              )}

                  {(() => {
                    const skillsArray = parseSkills(certificate.skills);
                    console.log('🔗 DEBUG: Parsed skills array:', skillsArray);
                    
                    // Fallback: if parsing fails, try to display the raw skills as a single tag
                    if (skillsArray.length === 0 && certificate.skills) {
                      console.log('🔗 DEBUG: Using fallback display for skills');
                      return (
                        <div className="flex flex-wrap gap-1 max-w-full">
                          <span
                            className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs whitespace-nowrap truncate max-w-[200px]"
                            title={`Raw skills data: ${certificate.skills}`}
                          >
                            Skills: {String(certificate.skills).substring(0, 50)}...
                          </span>
                        </div>
                      );
                    }
                    
                    return skillsArray.length > 0 && (
                      <div className="flex flex-wrap gap-2 max-w-full">
                        {skillsArray.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                            className="px-3 py-1.5 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 rounded-lg text-xs font-medium whitespace-nowrap truncate max-w-[140px] border border-primary-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                            title={skill}
                    >
                      {skill}
                    </span>
                  ))}
                        {skillsArray.length > 3 && (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium whitespace-nowrap border border-gray-200 hover:bg-gray-200 transition-colors duration-200">
                            +{skillsArray.length - 3} more
                    </span>
                  )}
                </div>
                    );
                  })()}

                  {(certificate.credentialId || certificate.credentialUrl) && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
              {certificate.credentialId && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            <span className="text-xs text-gray-600 font-mono">
                    ID: {certificate.credentialId}
                            </span>
                </div>
                        )}
                        {certificate.credentialUrl && (
                          <a
                            href={certificate.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                            title={certificate.credentialUrl}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View Certificate</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Expandable Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 pt-6 space-y-6 bg-gray-50 -mx-6 px-6 pb-6"
                  >
                    {/* Full Description */}
                    {certificate.description && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-500" />
                          Description
                        </h4>
                        <div className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg text-justify max-h-48 overflow-y-auto">
                          {certificate.description.split(' ').map((word, index) => {
                            // Check if word is a URL
                            if (word.match(/^https?:\/\/[^\s]+/)) {
                              return (
                                <a
                                  key={index}
                                  href={word}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:text-primary-700 underline break-all"
                                >
                                  {word}
                                </a>
                              );
                            }
                            return word + ' ';
                          })}
                        </div>
                      </div>
                    )}

                    {/* All Skills */}
                    {(() => {
                      const skillsArray = parseSkills(certificate.skills);
                      console.log('🔗 DEBUG: Expanded view - Parsed skills array:', skillsArray);
                      
                      // Fallback: if parsing fails, show raw data
                      if (skillsArray.length === 0 && certificate.skills) {
                        console.log('🔗 DEBUG: Expanded view - Using fallback display for skills');
                        return (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                              <Award className="w-4 h-4 mr-2 text-gray-500" />
                              Skills & Technologies (Raw Data)
                            </h4>
                            <div className="bg-red-50 p-3 rounded-lg">
                              <p className="text-sm text-red-700 mb-2">Raw skills data:</p>
                              <p className="text-xs text-red-600 break-all font-mono">
                                {String(certificate.skills)}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      return skillsArray.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <Award className="w-4 h-4 mr-2 text-gray-500" />
                            Skills & Technologies ({skillsArray.length})
                          </h4>
                          <div className="flex flex-wrap gap-2 max-w-full">
                            {skillsArray.map((skill, index) => (
                              <span
                                key={index}
                                className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 rounded-lg text-sm font-medium whitespace-nowrap truncate max-w-[180px] border border-primary-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                                title={skill}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Credential Details */}
                    {(certificate.credentialId || certificate.credentialUrl) && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <ExternalLink className="w-4 h-4 mr-2 text-gray-500" />
                          Credential Details
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          {certificate.credentialId && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-500">ID:</span>
                              <span className="text-sm font-mono text-gray-900">{certificate.credentialId}</span>
                            </div>
                          )}
              {certificate.credentialUrl && (
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs font-medium text-gray-500">URL:</span>
                <a
                  href={certificate.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:text-primary-700 break-all"
                                title={certificate.credentialUrl}
                              >
                                {certificate.credentialUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Files Section */}
                    {certificate.files && certificate.files.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <File className="w-4 h-4 mr-2 text-gray-500" />
                          Attached Files ({certificate.files.length})
                        </h4>
                        <div className="space-y-3">
                          {certificate.files.map((file, index) => (
                            <div
                              key={index}
                              className="group/file flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-primary-200 hover:shadow-md"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="p-2 bg-gray-100 rounded-lg group-hover/file:bg-primary-100 transition-colors duration-200">
                                  {getFileIcon(file.originalName)}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{file.originalName}</p>
                                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                    <span className="px-2 py-1 bg-gray-100 rounded-md">{formatFileSize(file.size)}</span>
                                    {file.isPrimary && (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-medium">
                                        ⭐ Primary
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleFilePreview(file)}
                                  className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-110"
                                  title="Preview file"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <a
                                  href={file.secureUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                                  title="Download file"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                {!file.isPrimary && (
                                  <button
                                    onClick={() => handleSetPrimaryFile(file._id)}
                                    className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-all duration-200 hover:scale-110"
                                    title="Set as primary"
                                  >
                                    <Star className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteFile(file._id)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                  title="Delete file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
            </div>
          </div>
        ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Projects */}
                    {certificate.linkedProjects && certificate.linkedProjects.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <Link className="w-4 h-4 mr-2 text-gray-500" />
                          Linked Projects ({certificate.linkedProjects.length})
                        </h4>
                        <div className="space-y-2">
                          {certificate.linkedProjects.map((project, index) => (
                            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                              <Link className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700 font-medium">{project.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          );
        })}
      </motion.div>

      {certificates.length === 0 && !isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No certificates yet</h3>
          <p className="text-gray-600 mb-6">
            Add your professional certificates and achievements
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Certificate</span>
          </button>
        </motion.div>
      )}

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeFilePreview}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {getFileIcon(previewFile.originalName)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{previewFile.originalName}</h3>
                    <p className="text-sm text-gray-500">{formatFileSize(previewFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={closeFilePreview}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 max-h-[70vh] overflow-auto">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-gray-600">Loading preview...</span>
                  </div>
                ) : previewFile.originalName.toLowerCase().includes('.pdf') ? (
                  <div className="w-full h-96">
                    <iframe
                      src={`${previewFile.secureUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-0 rounded"
                      title="PDF Preview"
                      onError={(e) => {
                        console.error('PDF preview error:', e);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-center py-12">
                      <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">PDF preview failed to load</p>
                      <a
                        href={previewFile.secureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open PDF in new tab</span>
                      </a>
                    </div>
                  </div>
                ) : previewFile.originalName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                  <div className="flex justify-center">
                    <img
                      src={previewFile.secureUrl}
                      alt={previewFile.originalName}
                      className="max-w-full max-h-96 object-contain rounded shadow-lg"
                      onError={(e) => {
                        console.error('Image preview error:', e);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-center py-12">
                      <Image className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Image preview failed to load</p>
                      <a
                        href={previewFile.secureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open image in new tab</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: PDF, JPG, PNG, GIF, WebP
                    </p>
                    <a
                      href={previewFile.secureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in new tab</span>
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
                <a
                  href={previewFile.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in new tab</span>
                </a>
                <a
                  href={previewFile.secureUrl}
                  download={previewFile.originalName}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertificatesManagement;


