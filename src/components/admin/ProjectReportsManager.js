import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Link, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus,
  X,
  ExternalLink,
  Eye as ViewIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReportViewer from './ReportViewer';

const ProjectReportsManager = ({ projectId, reports = [], onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [linkData, setLinkData] = useState({
    title: '',
    url: '',
    platform: 'other',
    description: ''
  });
  const fileInputRef = useRef(null);

  // Debug logging
  console.log('ProjectReportsManager - projectId:', projectId);
  console.log('ProjectReportsManager - reports:', reports);
  console.log('ProjectReportsManager - reports.length:', reports?.length);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error('Please select valid document files (PDF, Word, Excel, PowerPoint, etc.)');
      return;
    }

    // Check file sizes (10MB limit per file)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('File size must be less than 10MB per file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('title', 'Project Report');
      formData.append('description', 'Project documentation and reports');

      const response = await fetch(`/api/projects/${projectId}/reports/upload`, {
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
      toast.success(`${files.length} report file(s) uploaded successfully!`);
      
      // Refresh the project data
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Report upload error:', error);
      toast.error('Failed to upload report files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddLink = async () => {
    if (!linkData.title || !linkData.url) {
      toast.error('Please fill in title and URL');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/reports/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(linkData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      toast.success('Report link added successfully!');
      
      // Reset form
      setLinkData({
        title: '',
        url: '',
        platform: 'other',
        description: ''
      });
      setShowAddLink(false);
      
      // Refresh the project data
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Report link error:', error);
      toast.error('Failed to add report link');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success('Report deleted successfully!');
      
      // Refresh the project data
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Report delete error:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleToggleVisibility = async (reportId, visible) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/reports/${reportId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ visible })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(`Report ${visible ? 'shown' : 'hidden'} successfully!`);
      
      // Refresh the project data
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Report visibility toggle error:', error);
      toast.error('Failed to toggle report visibility');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    return '📄';
  };

  return (
    <div className="space-y-4">
      {/* Upload Controls */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          disabled={uploading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
        </button>
        
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowAddLink(!showAddLink);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Link className="w-4 h-4" />
          <span>Add Link</span>
        </button>

        {reports.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowReportViewer(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ViewIcon className="w-4 h-4" />
            <span>View Reports ({reports.length})</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.odt"
        onChange={handleFileUpload}
        onClick={(e) => e.stopPropagation()}
        className="hidden"
      />

      {/* Add Link Form */}
      {showAddLink && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 rounded-lg p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Add Report Link</h4>
            <button
              onClick={() => setShowAddLink(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={linkData.title}
                onChange={(e) => setLinkData({ ...linkData, title: e.target.value })}
                className="input-field"
                placeholder="Report title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={linkData.url}
                onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                className="input-field"
                placeholder="https://example.com/report"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={linkData.platform}
                onChange={(e) => setLinkData({ ...linkData, platform: e.target.value })}
                className="input-field"
              >
                <option value="other">Other</option>
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="medium">Medium</option>
                <option value="google-drive">Google Drive</option>
                <option value="dropbox">Dropbox</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={linkData.description}
                onChange={(e) => setLinkData({ ...linkData, description: e.target.value })}
                className="input-field"
                placeholder="Brief description"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddLink(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddLink();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Link
            </button>
          </div>
        </motion.div>
      )}

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {report.type === 'file' ? (
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{getFileIcon(report.file.mimeType)}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Link className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {report.title}
                    </h4>
                    {report.description && (
                      <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {report.type === 'file' ? (
                        <>
                          <span>{formatFileSize(report.file.size)}</span>
                          <span>{report.file.originalName}</span>
                        </>
                      ) : (
                        <span className="capitalize">{report.link.platform}</span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.visible 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleVisibility(report._id, !report.visible);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title={report.visible ? 'Hide report' : 'Show report'}
                  >
                    {report.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  {report.type === 'file' && (
                    <a
                      href={report.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  
                  {report.type === 'link' && (
                    <a
                      href={report.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-green-600 hover:text-green-700 transition-colors"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteReport(report._id);
                    }}
                    className="p-2 text-red-600 hover:text-red-700 transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No reports uploaded yet</p>
          <p className="text-sm">Upload files or add links to get started</p>
        </div>
      )}

      {/* Report Viewer Modal */}
      <ReportViewer
        isOpen={showReportViewer}
        onClose={() => setShowReportViewer(false)}
        reports={reports}
        onDelete={handleDeleteReport}
        onToggleVisibility={handleToggleVisibility}
        onUpdate={onUpdate}
        title="Project Reports"
      />
    </div>
  );
};

export default ProjectReportsManager;
