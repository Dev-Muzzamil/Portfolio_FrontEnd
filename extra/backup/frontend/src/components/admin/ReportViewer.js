import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  FileText, 
  Link as LinkIcon,
  Trash2,
  FileEdit
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuillEditor from './QuillEditor';

const ReportViewer = ({ 
  isOpen, 
  onClose, 
  reports = [], 
  onDelete, 
  onToggleVisibility,
  onUpdate,
  title = "Reports"
}) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [showWordEditor, setShowWordEditor] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await onDelete(reportId);
        toast.success('Report deleted successfully!');
        setSelectedReport(null);
      } catch (error) {
        toast.error('Failed to delete report');
      }
    }
  };

  const handleToggleVisibility = async (reportId, visible) => {
    try {
      await onToggleVisibility(reportId, visible);
      toast.success(`Report ${visible ? 'shown' : 'hidden'} successfully!`);
    } catch (error) {
      toast.error('Failed to toggle report visibility');
    }
  };

  const handleEditReport = (report) => {
    if (report.type === 'file' && isEditableFile(report.file.mimeType)) {
      setEditingReport(report);
      setShowWordEditor(true);
    } else {
      toast.error('This file type cannot be edited');
    }
  };

  const isEditableFile = (mimeType) => {
    const editableTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'text/plain'
    ];
    return editableTypes.some(type => mimeType.includes(type));
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports</h3>
                <p className="text-gray-500">No reports have been uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {report.type === 'file' ? (
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">{getFileIcon(report.file.mimeType)}</span>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <LinkIcon className="w-6 h-6 text-green-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {report.title}
                        </h4>
                        {report.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.visible 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {report.visible ? 'Visible' : 'Hidden'}
                          </span>
                          
                          {report.type === 'file' && (
                            <span className="text-xs text-gray-500">
                              {formatFileSize(report.file.size)}
                            </span>
                          )}

                          {report.type === 'file' && isEditableFile(report.file.mimeType) && (
                            <span className="text-xs text-blue-600 font-medium">
                              Editable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Report Detail Modal */}
          <AnimatePresence>
            {selectedReport && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
                onClick={() => setSelectedReport(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Detail Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedReport.title}
                    </h3>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Detail Content */}
                  <div className="p-4 space-y-4">
                    {selectedReport.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                        <p className="text-sm text-gray-600">{selectedReport.description}</p>
                      </div>
                    )}

                    {selectedReport.type === 'file' && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">File Details</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Name:</span> {selectedReport.file.originalName}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Size:</span> {formatFileSize(selectedReport.file.size)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Type:</span> {selectedReport.file.mimeType}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedReport.type === 'link' && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Link Details</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">URL:</span> 
                            <a 
                              href={selectedReport.link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 ml-1"
                            >
                              {selectedReport.link.url}
                            </a>
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Platform:</span> {selectedReport.link.platform}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedReport.visible 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedReport.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  {/* Detail Actions */}
                  <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleVisibility(selectedReport._id, !selectedReport.visible)}
                        className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {selectedReport.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{selectedReport.visible ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {selectedReport.type === 'file' && isEditableFile(selectedReport.file.mimeType) && (
                        <button
                          onClick={() => handleEditReport(selectedReport)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          <FileEdit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}

                      {selectedReport.type === 'file' && (
                        <a
                          href={selectedReport.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </a>
                      )}
                      
                      {selectedReport.type === 'link' && (
                        <a
                          href={selectedReport.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-3 py-2 text-sm text-green-600 hover:text-green-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Link</span>
                        </a>
                      )}
                      
                      <button
                        onClick={() => handleDelete(selectedReport._id)}
                        className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quill Editor Modal */}
          {showWordEditor && editingReport && (
            <QuillEditor
              resume={{
                _id: editingReport._id,
                title: editingReport.title,
                url: editingReport.file.url,
                mimeType: editingReport.file.mimeType
              }}
              onClose={() => {
                setShowWordEditor(false);
                setEditingReport(null);
              }}
              onSave={(updatedReport) => {
                // Handle report update
                if (onUpdate) {
                  onUpdate();
                }
                toast.success('Report updated successfully!');
                setShowWordEditor(false);
                setEditingReport(null);
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportViewer;
