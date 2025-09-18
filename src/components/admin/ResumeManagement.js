import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Trash2, 
  Star, 
  StarOff, 
  Plus, 
  Eye,
  FileEdit
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuillEditor from './QuillEditor';
import ImprovedPDFViewer from './ImprovedPDFViewer';
import { useDocumentManagement } from '../../hooks/useDocumentManagement';
import { useFormManagement } from '../../hooks/useFormManagement';
import { useApiManagement } from '../../hooks/useApiManagement';

const ResumeManagement = ({ about, onUpdate }) => {
  const [resumes, setResumes] = useState(about?.resumes || []);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [showWordEditor, setShowWordEditor] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [loadingStates, setLoadingStates] = useState({});
  const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);

  // Use new optimized hooks
  const documentManagement = useDocumentManagement();
  const formManagement = useFormManagement();
  const apiManagement = useApiManagement();

  useEffect(() => {
    setResumes(about?.resumes || []);
  }, [about]);

  // Filter resumes based on document type
  const getFilteredResumes = () => {
    if (!about?.documentType || about.documentType === 'both') {
      return resumes;
    }
    return resumes.filter(resume => resume.documentType === about.documentType);
  };

  const filteredResumes = getFilteredResumes();

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', 'text/plain'];
    const isImage = file.type.startsWith('image/');
    
    if (!allowedTypes.includes(file.type) && !isImage) {
      toast.error('Please select a PDF, Word document, or image file');
      return;
    }

    // Validate file size (10MB limit for resume)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // If document type is 'both', show modal to select document type
    if (about?.documentType === 'both') {
      setPendingFile(file);
      setShowDocumentTypeModal(true);
      return;
    }

    // Proceed with upload using the current document type
    await uploadResume(file, about?.documentType || 'resume');
  };

  const uploadResume = async (file, documentType) => {
    setUploadingResume(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('title', file.name.split('.')[0]);
      formData.append('documentType', documentType);

      const response = await fetch('/api/about/upload-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.about) {
        const docType = documentType === 'cv' ? 'CV' : 'Resume';
        toast.success(`${docType} uploaded successfully!`);
        setResumes(data.about.resumes);
        onUpdate && onUpdate(data.about);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      if (error.message.includes('HTTP error')) {
        toast.error('Server error occurred while uploading. Please try again.');
      } else if (error.message.includes('Invalid response')) {
        toast.error('Invalid response from server. Please try again.');
      } else {
        toast.error('Failed to upload resume. Please check your connection and try again.');
      }
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      const response = await fetch(`/api/about/resume/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.about) {
        const docType = about?.documentType === 'cv' ? 'CV' : 
                       about?.documentType === 'both' ? 'Document' : 'Resume';
        toast.success(`${docType} deleted successfully!`);
        setResumes(data.about.resumes);
        onUpdate && onUpdate(data.about);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Resume delete error:', error);
      if (error.message.includes('HTTP error')) {
        toast.error('Server error occurred while deleting. Please try again.');
      } else {
        toast.error('Failed to delete resume. Please try again.');
      }
    }
  };

  const handleSetActiveResume = async (resumeId) => {
    setLoadingStates(prev => ({ ...prev, [resumeId]: true }));
    try {
      const response = await fetch(`/api/about/resume/${resumeId}/active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.about) {
        toast.success('Active resume updated successfully!');
        setResumes(data.about.resumes);
        onUpdate && onUpdate(data.about);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Set active resume error:', error);
      if (error.message.includes('HTTP error')) {
        toast.error('Server error occurred while updating. Please try again.');
      } else {
        toast.error('Failed to set active resume. Please try again.');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [resumeId]: false }));
    }
  };

  const handleUpdateTitle = async (resumeId, newTitle) => {
    if (!newTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/about/resume/${resumeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.about) {
        const docType = about?.documentType === 'cv' ? 'CV' : 
                       about?.documentType === 'both' ? 'Document' : 'Resume';
        toast.success(`${docType} title updated successfully!`);
        setResumes(data.about.resumes);
        onUpdate && onUpdate(data.about);
        setEditingTitle(null);
        setNewTitle('');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Update title error:', error);
      if (error.message.includes('HTTP error')) {
        toast.error('Server error occurred while updating title. Please try again.');
      } else {
        toast.error('Failed to update title. Please try again.');
      }
    }
  };

  const handleEditResume = (resume) => {
    setSelectedResume(resume);
    setShowWordEditor(true);
  };

  const handleViewResume = (resume) => {
    if (resume.mimeType === 'application/pdf') {
      // Use the improved PDF viewer for PDFs
      setSelectedResume(resume);
      setShowPDFViewer(true);
    } else {
      // For other files, try to open in new tab
      window.open(resume.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadResume = async (resume) => {
    try {
      // Create a proper filename
      const fileExtension = resume.originalName.split('.').pop() || 'file';
      const fileName = `${resume.title}.${fileExtension}`;
      
      // For Cloudinary URLs, try direct download first, then fallback to proxy
      if (resume.url.includes('cloudinary.com')) {
        // First try direct download with fl_attachment
        try {
          // Create Cloudinary URL with fl_attachment for forced download
          const cloudinaryUrl = resume.url.replace('/upload/', '/upload/fl_attachment/');
          const link = document.createElement('a');
          link.href = cloudinaryUrl;
          link.download = fileName;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          
          // Add to DOM, click, and remove
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Download started!');
        } catch (directError) {
          // If direct download fails, try through our API proxy
          console.log('Direct download failed, trying API proxy...');
          try {
            const response = await fetch(`/api/about/download-resume/${resume._id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success('File downloaded successfully!');
            } else {
              throw new Error('API download failed');
            }
          } catch (proxyError) {
            // Final fallback: open in new tab
            window.open(resume.url, '_blank', 'noopener,noreferrer');
            toast.error('Direct download failed. File opened in new tab.');
          }
        }
      } else {
        // For other URLs, use fetch approach
        const response = await fetch(resume.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('File downloaded successfully!');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file. Please try opening the file directly.');
      
      // Fallback: open in new tab
      window.open(resume.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('text/')) return '📄';
    if (mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('spreadsheet')) return '📈';
    return '📄';
  };

  const getFileTypeDisplay = (mimeType) => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word Document';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.includes('text/')) return 'Text Document';
    if (mimeType.includes('presentation')) return 'Presentation';
    if (mimeType.includes('spreadsheet')) return 'Spreadsheet';
    return 'Document';
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleDocumentTypeSelection = async (selectedType) => {
    if (pendingFile) {
      await uploadResume(pendingFile, selectedType);
      setPendingFile(null);
      setShowDocumentTypeModal(false);
    }
  };

  const cancelDocumentTypeSelection = () => {
    setPendingFile(null);
    setShowDocumentTypeModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CV & Resume Management</h2>
          <p className="text-gray-600">Manage multiple CVs and resumes, choose which one to display</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Document Type:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  about?.documentType === 'resume' || !about?.documentType
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={async () => {
                  try {
                    const updatedAbout = { ...about, documentType: 'resume' };
                    const result = await onUpdate(updatedAbout);
                    if (result?.success !== false) {
                      toast.success('Document type set to Resume');
                    }
                  } catch (error) {
                    console.error('Failed to update document type:', error);
                    toast.error('Failed to update document type');
                  }
                }}
              >
                Resume
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  about?.documentType === 'cv'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={async () => {
                  try {
                    const updatedAbout = { ...about, documentType: 'cv' };
                    const result = await onUpdate(updatedAbout);
                    if (result?.success !== false) {
                      toast.success('Document type set to CV');
                    }
                  } catch (error) {
                    console.error('Failed to update document type:', error);
                    toast.error('Failed to update document type');
                  }
                }}
              >
                CV
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  about?.documentType === 'both'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={async () => {
                  try {
                    const updatedAbout = { ...about, documentType: 'both' };
                    const result = await onUpdate(updatedAbout);
                    if (result?.success !== false) {
                      toast.success('Document type set to Resume and CV');
                    }
                  } catch (error) {
                    console.error('Failed to update document type:', error);
                    toast.error('Failed to update document type');
                  }
                }}
              >
                Both
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Currently managing: <span className="font-medium text-gray-700">
            {about?.documentType === 'cv' ? 'CV' : 
             about?.documentType === 'both' ? 'Resume and CV' : 'Resume'} documents
          </span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingResume}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadingResume ? (
            <>
              <div className="loading-spinner w-4 h-4"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Upload {about?.documentType === 'cv' ? 'CV' : 
                     about?.documentType === 'both' ? 'Document' : 'Resume'}</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.odt,.txt,image/*"
        onChange={handleResumeUpload}
        className="hidden"
      />

      {/* Resumes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredResumes.map((resume, index) => (
            <motion.div
              key={resume._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 ${
                resume.isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              {/* Resume Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getFileIcon(resume.mimeType)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {editingTitle === resume._id ? (
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateTitle(resume._id, newTitle);
                            } else if (e.key === 'Escape') {
                              setEditingTitle(null);
                              setNewTitle('');
                            }
                          }}
                          onBlur={() => {
                            if (newTitle.trim() && newTitle !== resume.title) {
                              handleUpdateTitle(resume._id, newTitle);
                            } else {
                              setEditingTitle(null);
                              setNewTitle('');
                            }
                          }}
                          className="text-sm font-semibold bg-transparent border-b border-gray-300 focus:border-primary-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="cursor-pointer hover:text-primary-600"
                          onClick={() => {
                            setEditingTitle(resume._id);
                            setNewTitle(resume.title);
                          }}
                        >
                          {resume.title}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{resume.originalName}</p>
                  </div>
                </div>
                
                {resume.isActive && (
                  <div className="flex items-center space-x-1 text-primary-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                )}
              </div>

              {/* Resume Info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Size:</span>
                  <span>{formatFileSize(resume.size)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Type:</span>
                  <span>{getFileTypeDisplay(resume.mimeType)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploaded:</span>
                  <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSetActiveResume(resume._id)}
                  className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    resume.isActive
                      ? 'bg-primary-100 text-primary-700 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700'
                  }`}
                  disabled={resume.isActive || loadingStates[resume._id]}
                >
                  {resume.isActive ? (
                    <>
                      <Star className="w-4 h-4 fill-current" />
                      <span>Active</span>
                    </>
                  ) : loadingStates[resume._id] ? (
                    <>
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Setting...</span>
                    </>
                  ) : (
                    <>
                      <StarOff className="w-4 h-4" />
                      <span>Set Active</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleViewResume(resume)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>

                <button
                  onClick={() => handleDownloadResume(resume)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                {(resume.mimeType.includes('word') || resume.mimeType.includes('document')) && (
                  <button
                    onClick={() => handleEditResume(resume)}
                    className="flex items-center justify-center space-x-1 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FileEdit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteResume(resume._id)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredResumes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {about?.documentType === 'cv' ? 'CVs' : 
                 about?.documentType === 'both' ? 'documents' : 'resumes'} uploaded
          </h3>
          <p className="text-gray-500 mb-6">
            Upload your first {about?.documentType === 'cv' ? 'CV' : 
                              about?.documentType === 'both' ? 'document' : 'resume'} to get started
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Upload {about?.documentType === 'cv' ? 'CV' : 
                         about?.documentType === 'both' ? 'Document' : 'Resume'}</span>
          </button>
        </motion.div>
      )}

      {/* Quill Editor Modal */}
      {showWordEditor && selectedResume && (
        <QuillEditor
          resume={selectedResume}
          onClose={() => {
            setShowWordEditor(false);
            setSelectedResume(null);
          }}
          onSave={(updatedResume) => {
            // Handle resume update
            setResumes(prev => prev.map(r => r._id === selectedResume._id ? updatedResume : r));
            onUpdate && onUpdate({ ...about, resumes: resumes.map(r => r._id === selectedResume._id ? updatedResume : r) });
          }}
        />
      )}

      {/* Improved PDF Viewer Modal */}
      {showPDFViewer && selectedResume && (
        <ImprovedPDFViewer
          pdfUrl={selectedResume.url}
          fileName={selectedResume.title}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedResume(null);
          }}
        />
      )}

      {/* Document Type Selection Modal */}
      {showDocumentTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Document Type
            </h3>
            <p className="text-gray-600 mb-6">
              What type of document is "{pendingFile?.name}"?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDocumentTypeSelection('resume')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={() => handleDocumentTypeSelection('cv')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                CV
              </button>
            </div>
            <button
              onClick={cancelDocumentTypeSelection}
              className="w-full mt-3 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeManagement;
