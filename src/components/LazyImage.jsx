import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { optimizeCloudinaryImage, getBlurPlaceholder, generateSrcSet } from '../utils/imageOptimization';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  imgClassName = '',
  width = 'auto', 
  height = 'auto',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  // Generate optimized URLs
  // If width is specific (not auto), use it. Otherwise use 'auto' which might need client hints or just default.
  // But crucially, we now generate a srcset.
  const optimizedSrc = optimizeCloudinaryImage(src, { width, quality: 'auto', format: 'auto' });
  const srcSet = generateSrcSet(src);
  const placeholderSrc = getBlurPlaceholder(src);

  // If priority is true, we bypass the lazy loading logic to ensure LCP optimization
  if (priority) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ width: width !== 'auto' ? width : undefined, height: height !== 'auto' ? height : undefined }}>
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`w-full h-full object-cover ${imgClassName}`}
          loading="eager"
          fetchPriority="high"
          {...props}
        />
      </div>
    );
  }

  useEffect(() => {
    if (!src) return;

    // Start with placeholder
    setCurrentSrc(placeholderSrc);
    
    // And lazy load the high-res
    const img = new Image();
    img.src = optimizedSrc;
    img.srcset = srcSet;
    img.sizes = sizes;
    img.onload = () => {
      setCurrentSrc(optimizedSrc);
      setIsLoaded(true);
    };
  }, [src, optimizedSrc, placeholderSrc, srcSet, sizes]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: width !== 'auto' ? width : undefined, height: height !== 'auto' ? height : undefined }}>
      {/* Placeholder (blurred) */}
      {!isLoaded && src && (
        <img
          src={placeholderSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 transition-opacity duration-500 ${imgClassName}`}
        />
      )}
      
      {/* Main Image */}
      <motion.img
        src={currentSrc || optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        {...props}
      />
    </div>
  );
};

export default LazyImage;
