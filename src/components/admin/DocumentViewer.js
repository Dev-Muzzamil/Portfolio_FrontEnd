import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, FileText, Eye } from 'lucide-react';
import mammoth from 'mammoth';
import toast from 'react-hot-toast';

const DocumentViewer = ({ documentUrl, fileName, mimeType, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'html'
  const iframeRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    loadDocument();
  }, [documentUrl, mimeType]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handleZoomIn();
      } else if (event.key === '-') {
        event.preventDefault();
        handleZoomOut();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        handleRotate();
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadDocument = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      if (mimeType === 'application/pdf') {
        // For PDFs, we'll use iframe
        setViewMode('preview');
        setIsLoading(false);
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        // For Word documents, convert to HTML
        const response = await fetch(documentUrl);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
        setViewMode('html');
        setIsLoading(false);
      } else if (mimeType.startsWith('text/')) {
        // For text files
        const response = await fetch(documentUrl);
        const text = await response.text();
        setContent(`<pre style="white-space: pre-wrap; font-family: monospace; padding: 20px;">${text}</pre>`);
        setViewMode('html');
        setIsLoading(false);
      } else {
        // For other files, try to open in new tab
        window.open(documentUrl, '_blank', 'noopener,noreferrer');
        onClose();
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setHasError(true);
      setIsLoading(false);
      toast.error('Failed to load document');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName || 'document';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success('Document downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'preview' ? 'html' : 'preview');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-white rounded-2xl shadow-2xl flex flex-col ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-[95vw] h-[95vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">Document Viewer</h2>
            <span className="text-sm text-gray-500">{fileName}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {mimeType === 'application/pdf' ? 'PDF' : 
               mimeType.includes('word') ? 'Word Document' : 
               mimeType.startsWith('text/') ? 'Text' : 'Document'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle for Word docs */}
            {mimeType.includes('word') && (
              <button
                onClick={toggleViewMode}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                {viewMode === 'preview' ? <FileText className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{viewMode === 'preview' ? 'HTML View' : 'Preview'}</span>
              </button>
            )}
            
            {/* Controls */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="text-center">
                <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <p className="text-gray-600 mb-4">Failed to load document</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Download Instead
                </button>
              </div>
            </div>
          )}
          
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            {mimeType === 'application/pdf' ? (
              <iframe
                ref={iframeRef}
                src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0"
                title="PDF Viewer"
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                  toast.error('Failed to load PDF. Please try downloading instead.');
                }}
              />
            ) : (
              <div
                ref={contentRef}
                className="w-full h-full overflow-auto bg-white p-8"
                dangerouslySetInnerHTML={{ __html: content }}
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {mimeType === 'application/pdf' 
                ? 'Use mouse wheel to scroll • +/- to zoom • R to rotate • F for fullscreen'
                : 'Use mouse wheel to scroll • +/- to zoom • R to rotate • F for fullscreen • Toggle view modes for Word docs'
              }
            </div>
            <div>
              Press ESC to close
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DocumentViewer;
