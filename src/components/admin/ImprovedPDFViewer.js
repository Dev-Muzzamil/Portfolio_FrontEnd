import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ImprovedPDFViewer = ({ pdfUrl, fileName, onClose, hideDownload = false }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef(null);

  useEffect(() => {
    loadPDF();
  }, [pdfUrl]);

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

  const loadPDF = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      console.log('Loading PDF from URL:', pdfUrl);
      
      // Check if URL is valid
      if (!pdfUrl || !pdfUrl.startsWith('http')) {
        throw new Error('Invalid PDF URL');
      }
      
      // Use the direct URL for checking
      const directUrl = getPDFUrl();
      console.log('Using direct URL for check:', directUrl);
      
      // First, try to fetch the PDF to check if it's accessible
      const response = await fetch(directUrl, {
        method: 'HEAD',
        mode: 'cors',
        headers: {
          'Accept': 'application/pdf, */*'
        }
      });
      
      console.log('PDF response status:', response.status);
      console.log('PDF response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check if it's actually a PDF
      const contentType = response.headers.get('content-type');
      console.log('Content type:', contentType);
      
      // For Cloudinary, sometimes the content type might not be set correctly
      if (contentType && !contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
        console.warn('Content type is not PDF:', contentType);
        // Still try to load it, might be a valid PDF with wrong MIME type
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('PDF loading error:', error);
      setHasError(true);
      setIsLoading(false);
      toast.error(`Failed to load PDF: ${error.message}`);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadPDF();
  };

  const handleDownload = async () => {
    try {
      // Use the direct URL for download
      const downloadUrl = getPDFUrl();
      console.log('Downloading from URL:', downloadUrl);
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/pdf, */*'
        }
      });
      
      console.log('Download response status:', response.status);
      console.log('Download response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Downloaded blob type:', blob.type);
      console.log('Downloaded blob size:', blob.size);
      
      // Check if the blob is actually a PDF
      if (blob.type && !blob.type.includes('pdf')) {
        console.warn('Blob type is not PDF:', blob.type);
        // Still try to download it, might be a valid PDF with wrong MIME type
      }
      
      // Create proper filename based on the actual file type
      let fileExtension = 'pdf';
      if (downloadUrl.includes('.docx')) {
        fileExtension = 'docx';
      } else if (downloadUrl.includes('.doc')) {
        fileExtension = 'doc';
      } else if (downloadUrl.includes('.txt')) {
        fileExtension = 'txt';
      } else if (fileName && fileName.includes('.')) {
        fileExtension = fileName.split('.').pop();
      }
      
      const downloadFileName = fileName || `document_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = downloadFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download PDF: ${error.message}`);
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

  const getPDFUrl = () => {
    console.log('Original PDF URL:', pdfUrl);
    
    // For Cloudinary URLs, ensure we get the direct, publicly accessible URL
    let directUrl = pdfUrl;
    
    if (pdfUrl.includes('cloudinary.com')) {
      // Extract the public ID and format from the URL
      const urlParts = pdfUrl.split('/upload/');
      if (urlParts.length === 2) {
        const baseUrl = urlParts[0] + '/upload/';
        const pathPart = urlParts[1];
        
        // Split by version and get the actual file path
        const versionMatch = pathPart.match(/^v\d+\/(.+)$/);
        if (versionMatch) {
          const filePath = versionMatch[1];
          // Create direct URL without any transformations
          directUrl = `${baseUrl}${filePath}`;
        } else {
          // Fallback: use the original URL
          directUrl = pdfUrl;
        }
      }
      console.log('Direct Cloudinary URL:', directUrl);
    }
    
    return directUrl;
  };

  const getViewerUrl = () => {
    const directUrl = getPDFUrl();
    
    // For PDFs, try PDF.js viewer first, then direct URL
    if (directUrl.includes('.pdf') || directUrl.includes('pdf')) {
      // Try PDF.js viewer first
      return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(directUrl)}`;
    }
    
    // For Word documents, use Microsoft Office viewer
    if (directUrl.includes('.docx') || directUrl.includes('.doc')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(directUrl)}`;
    }
    
    // For other document types, use Google Docs viewer
    return `https://docs.google.com/gview?url=${encodeURIComponent(directUrl)}&embedded=true`;
  };

  const getDirectUrl = () => {
    return getPDFUrl();
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
            <h2 className="text-xl font-bold text-gray-900">PDF Viewer</h2>
            <span className="text-sm text-gray-500">{fileName}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              PDF Document
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
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
            
            {!hideDownload && (
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="text-center">
                <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
              <div className="text-center max-w-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load PDF</h3>
                <p className="text-gray-600 mb-4">
                  The PDF could not be loaded. This might be due to:
                </p>
                <ul className="text-sm text-gray-500 text-left mb-6">
                  <li>• File encryption or password protection</li>
                  <li>• CORS restrictions</li>
                  <li>• Network connectivity issues</li>
                  <li>• Invalid file format</li>
                </ul>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={handleRetry}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry ({retryCount}/3)</span>
                  </button>
                  {!hideDownload && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Instead</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {!hasError && (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <iframe
                ref={iframeRef}
                src={getViewerUrl()}
                className="w-full h-full border-0"
                title="PDF Viewer"
                onLoad={() => {
                  console.log('PDF iframe loaded successfully');
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={(e) => {
                  console.error('PDF iframe error:', e);
                  console.log('Trying direct URL fallback...');
                  
                  // Try direct URL as fallback
                  const iframe = iframeRef.current;
                  if (iframe && !iframe.src.includes(getDirectUrl())) {
                    iframe.src = getDirectUrl();
                    return;
                  }
                  
                  setIsLoading(false);
                  setHasError(true);
                  toast.error('Failed to load PDF in viewer');
                }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
                allow="fullscreen"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Use mouse wheel to scroll • +/- to zoom • R to rotate • F for fullscreen
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

export default ImprovedPDFViewer;
