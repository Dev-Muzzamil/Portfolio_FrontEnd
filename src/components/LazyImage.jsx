import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { optimizeCloudinaryImage, getBlurPlaceholder } from '../utils/imageOptimization';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  imgClassName = '',
  width = 'auto', 
  height = 'auto',
  priority = false,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  // Generate optimized URLs
  const optimizedSrc = optimizeCloudinaryImage(src, { width, quality: 'auto', format: 'auto' });
  const placeholderSrc = getBlurPlaceholder(src);

  useEffect(() => {
    if (!src) return;

    // If priority is true, load the high-res image immediately
    if (priority) {
      const img = new Image();
      img.src = optimizedSrc;
      img.onload = () => {
        setCurrentSrc(optimizedSrc);
        setIsLoaded(true);
      };
    } else {
      // Otherwise start with placeholder
      setCurrentSrc(placeholderSrc);
      
      // And lazy load the high-res
      const img = new Image();
      img.src = optimizedSrc;
      img.onload = () => {
        setCurrentSrc(optimizedSrc);
        setIsLoaded(true);
      };
    }
  }, [src, optimizedSrc, placeholderSrc, priority]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: width !== 'auto' ? width : undefined, height: height !== 'auto' ? height : undefined }}>
      {/* Placeholder (blurred) */}
      {!isLoaded && !priority && src && (
        <img
          src={placeholderSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 transition-opacity duration-500 ${imgClassName}`}
        />
      )}
      
      {/* Main Image */}
      <motion.img
        src={currentSrc || optimizedSrc}
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
