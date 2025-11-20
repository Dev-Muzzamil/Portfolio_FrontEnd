/**
 * Cloudinary Image Optimization Utility
 * Automatically transforms Cloudinary URLs to use:
 * - WebP format (smaller file size)
 * - Responsive sizing (serves correct dimensions)
 * - Quality optimization
 * - Lazy loading placeholders
 */

/**
 * Transform Cloudinary URL to optimized version
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options
 * @returns {string} - Optimized Cloudinary URL
 */
export const optimizeCloudinaryImage = (url, options = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;

  const {
    width = 'auto',
    quality = 'auto',
    format = 'auto',
    fetchFormat = 'auto',
    crop = 'scale',
    dpr = 'auto',
  } = options;

  // Extract the upload segment and everything after
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const baseUrl = url.substring(0, uploadIndex + 8); // Include '/upload/'
  const imagePath = url.substring(uploadIndex + 8);

  // Build transformation string
  const transformations = [
    `w_${width}`,
    `q_${quality}`,
    `f_${format}`,
    `c_${crop}`,
    `dpr_${dpr}`,
  ].join(',');

  return `${baseUrl}${transformations}/${imagePath}`;
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (url, widths = [400, 800, 1200, 1600]) => {
  if (!url || !url.includes('cloudinary.com')) return '';

  return widths
    .map(width => {
      const optimizedUrl = optimizeCloudinaryImage(url, { 
        width, 
        quality: 'auto',
        format: 'auto'
      });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
};

/**
 * Get blur placeholder for lazy loading
 */
export const getBlurPlaceholder = (url) => {
  if (!url || !url.includes('cloudinary.com')) return '';

  return optimizeCloudinaryImage(url, {
    width: 20,
    quality: 30,
    format: 'auto',
    effect: 'blur:1000',
  });
};

export default {
  optimizeCloudinaryImage,
  generateSrcSet,
  getBlurPlaceholder,
};
