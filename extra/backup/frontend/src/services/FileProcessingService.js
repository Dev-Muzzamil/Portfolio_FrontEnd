/**
 * FileProcessingService - Handles file processing operations
 * PDF to image conversion, image optimization, thumbnail generation
 * Follows SOLID principles with single responsibility
 */

class FileProcessingService {
  constructor() {
    this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    this.supportedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'text/plain'
    ];
  }

  /**
   * Process file based on type and requirements
   * @param {File} file - File to process
   * @param {string} type - Document type
   * @param {Object} options - Processing options
   * @returns {Promise<File>} Processed file
   */
  async processFile(file, type, options = {}) {
    try {
      // If it's an image, optimize it
      if (this.isImage(file)) {
        return await this.optimizeImage(file, options);
      }

      // If it's a document, check if conversion is needed
      if (this.isDocument(file)) {
        return await this.processDocument(file, type, options);
      }

      // Return file as-is if no processing needed
      return file;

    } catch (error) {
      console.error('File processing error:', error);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  /**
   * Convert PDF to image
   * @param {File} pdfFile - PDF file
   * @param {Object} options - Conversion options
   * @returns {Promise<File>} Image file
   */
  async convertPdfToImage(pdfFile, options = {}) {
    try {
      const { 
        page = 1, 
        scale = 2, 
        format = 'jpeg',
        quality = 0.8 
      } = options;

      // Dynamic import of PDF.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

      // Read file as array buffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      // Get the specified page
      const pageObj = await pdf.getPage(page);
      
      // Set up canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Calculate dimensions
      const viewport = pageObj.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await pageObj.render(renderContext).promise;
      
      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const imageFile = new File([blob], `${pdfFile.name.split('.')[0]}.${format}`, {
            type: `image/${format}`,
            lastModified: Date.now()
          });
          resolve(imageFile);
        }, `image/${format}`, quality);
      });

    } catch (error) {
      console.error('PDF to image conversion error:', error);
      throw new Error('Failed to convert PDF to image');
    }
  }

  /**
   * Optimize image file
   * @param {File} imageFile - Image file
   * @param {Object} options - Optimization options
   * @returns {Promise<File>} Optimized image file
   */
  async optimizeImage(imageFile, options = {}) {
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        format = 'jpeg'
      } = options;

      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const optimizedFile = new File([blob], imageFile.name, {
              type: `image/${format}`,
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          }, `image/${format}`, quality);
        };

        img.onerror = () => {
          console.error('Image optimization failed');
          resolve(imageFile); // Return original if optimization fails
        };

        img.src = URL.createObjectURL(imageFile);
      });

    } catch (error) {
      console.error('Image optimization error:', error);
      return imageFile; // Return original if optimization fails
    }
  }

  /**
   * Generate thumbnail for file
   * @param {File} file - File to generate thumbnail for
   * @param {Object} options - Thumbnail options
   * @returns {Promise<string>} Thumbnail data URL
   */
  async generateThumbnail(file, options = {}) {
    try {
      const {
        width = 200,
        height = 200,
        quality = 0.7
      } = options;

      if (this.isImage(file)) {
        return await this.generateImageThumbnail(file, width, height, quality);
      }

      if (this.isPdf(file)) {
        return await this.generatePdfThumbnail(file, width, height, quality);
      }

      // Return default icon for other file types
      return this.getDefaultFileIcon(file.type);

    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return this.getDefaultFileIcon(file.type);
    }
  }

  /**
   * Generate thumbnail for image file
   * @param {File} imageFile - Image file
   * @param {number} width - Thumbnail width
   * @param {number} height - Thumbnail height
   * @param {number} quality - Thumbnail quality
   * @returns {Promise<string>} Thumbnail data URL
   */
  async generateImageThumbnail(imageFile, width, height, quality) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = width;
      canvas.height = height;

      img.onload = () => {
        // Calculate scaling to fit within dimensions while maintaining aspect ratio
        const scale = Math.min(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the image
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;

        // Draw image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = () => {
        resolve(this.getDefaultFileIcon(imageFile.type));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Generate thumbnail for PDF file
   * @param {File} pdfFile - PDF file
   * @param {number} width - Thumbnail width
   * @param {number} height - Thumbnail height
   * @param {number} quality - Thumbnail quality
   * @returns {Promise<string>} Thumbnail data URL
   */
  async generatePdfThumbnail(pdfFile, width, height, quality) {
    try {
      // Convert PDF to image first
      const imageFile = await this.convertPdfToImage(pdfFile, {
        page: 1,
        scale: 1,
        format: 'jpeg',
        quality: quality
      });

      // Generate thumbnail from the image
      return await this.generateImageThumbnail(imageFile, width, height, quality);

    } catch (error) {
      console.error('PDF thumbnail generation error:', error);
      return this.getDefaultFileIcon(pdfFile.type);
    }
  }

  /**
   * Process document file
   * @param {File} file - Document file
   * @param {string} type - Document type
   * @param {Object} options - Processing options
   * @returns {Promise<File>} Processed file
   */
  async processDocument(file, type, options = {}) {
    // For now, return file as-is
    // Future: Add text extraction, metadata extraction, etc.
    return file;
  }

  /**
   * Check if file is an image
   * @param {File} file - File to check
   * @returns {boolean} Is image
   */
  isImage(file) {
    return this.supportedImageTypes.includes(file.type);
  }

  /**
   * Check if file is a document
   * @param {File} file - File to check
   * @returns {boolean} Is document
   */
  isDocument(file) {
    return this.supportedDocumentTypes.includes(file.type);
  }

  /**
   * Check if file is PDF
   * @param {File} file - File to check
   * @returns {boolean} Is PDF
   */
  isPdf(file) {
    return file.type === 'application/pdf';
  }

  /**
   * Get default file icon based on type
   * @param {string} mimeType - File MIME type
   * @returns {string} Default icon data URL
   */
  getDefaultFileIcon(mimeType) {
    // Return a simple data URL for a default file icon
    // This is a placeholder - in production, you'd want actual icons
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 64;
    canvas.height = 64;
    
    // Draw a simple file icon
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(8, 8, 48, 56);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(12, 12, 40, 48);
    
    return canvas.toDataURL();
  }

  /**
   * Get file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Human readable size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on MIME type
   * @param {string} mimeType - File MIME type
   * @returns {string} Icon emoji or character
   */
  getFileIcon(mimeType) {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('text')) return '📄';
    return '📄';
  }
}

export { FileProcessingService };
export default new FileProcessingService();
