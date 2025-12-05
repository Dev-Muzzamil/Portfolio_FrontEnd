import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Crop, Save } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const PhotoEditor = ({ imageUrl, onSave, onClose }) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onCropComplete = (crop) => {
    console.log('Crop completed:', crop);
    setCompletedCrop(crop);
  };

  const getCroppedImg = (image, crop, fileName = 'cropped-image.jpg') => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    if (!image || !crop || !crop.width || !crop.height) {
      throw new Error('Invalid image or crop data');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate actual pixel dimensions
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Clear the canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the cropped image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return new Promise((resolve, reject) => {
      // Check if canvas is tainted
      try {
        canvas.getContext('2d').getImageData(0, 0, 1, 1);
      } catch (e) {
        console.error('Canvas is tainted, trying alternative method:', e);
        // If canvas is tainted, try to create a new image element
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';
        newImg.onload = () => {
          try {
            const newCanvas = document.createElement('canvas');
            const newCtx = newCanvas.getContext('2d');
            newCanvas.width = cropWidth;
            newCanvas.height = cropHeight;
            
            newCtx.drawImage(
              newImg,
              cropX,
              cropY,
              cropWidth,
              cropHeight,
              0,
              0,
              cropWidth,
              cropHeight
            );
            
            newCanvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob from canvas'));
                return;
              }
              blob.name = fileName;
              resolve(blob);
            }, 'image/jpeg', 0.95);
          } catch (error) {
            reject(error);
          }
        };
        newImg.onerror = () => reject(new Error('Failed to load image for cropping'));
        newImg.src = image.src;
        return;
      }

      // If canvas is not tainted, proceed normally
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          reject(new Error('Canvas is empty'));
          return;
        }
        blob.name = fileName;
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCrop = async () => {
    if (imgRef.current && completedCrop && completedCrop.width && completedCrop.height) {
      setIsProcessing(true);
      try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
        setCroppedImageUrl(croppedImageUrl);
        console.log('✅ Crop applied successfully');
        
        // Auto-close the editor after successful crop
        setTimeout(() => {
          onClose();
        }, 500); // Small delay to show success
      } catch (error) {
        console.error('Error cropping image:', error);
        // If cropping fails, try a simpler approach without canvas
        try {
          const img = imgRef.current;
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to crop size
          canvas.width = completedCrop.width;
          canvas.height = completedCrop.height;
          
          // Draw the cropped portion
          ctx.drawImage(
            img,
            completedCrop.x,
            completedCrop.y,
            completedCrop.width,
            completedCrop.height,
            0,
            0,
            completedCrop.width,
            completedCrop.height
          );
          
          // Convert to blob
          const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.95);
          });
          
          if (blob) {
            const croppedImageUrl = URL.createObjectURL(blob);
            setCroppedImageUrl(croppedImageUrl);
            console.log('✅ Crop applied successfully (fallback method)');
            
            // Auto-close the editor after successful fallback crop
            setTimeout(() => {
              onClose();
            }, 500); // Small delay to show success
          }
        } catch (fallbackError) {
          console.error('Fallback cropping also failed:', fallbackError);
          alert('Unable to crop image. Please try a different image or refresh the page.');
          setIsProcessing(false);
        }
      }
    } else {
      console.warn('No valid crop area selected');
    }
  };

  const handleSave = async () => {
    if (croppedImageUrl) {
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-profile.jpg', { type: 'image/jpeg' });
      onSave(file);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile Photo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Editor Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Editor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Crop & Edit</h3>
              <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
                <ReactCrop
                  crop={crop}
                  onChange={onCropChange}
                  onComplete={onCropComplete}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Crop me"
                    onLoad={onImageLoad}
                    crossOrigin="anonymous"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      objectFit: 'contain'
                    }}
                  />
                </ReactCrop>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCrop}
                  disabled={!completedCrop || !completedCrop.width || !completedCrop.height || isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Crop className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing...' : 'Apply Crop'}</span>
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {croppedImageUrl ? (
                    <img
                      src={croppedImageUrl}
                      alt="Cropped preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Crop className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {croppedImageUrl 
                  ? "This is how your profile photo will appear" 
                  : "Select a crop area and click 'Apply Crop' to see preview"
                }
              </p>
              
              {/* Save Button in Preview Section */}
              {croppedImageUrl && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save This Photo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {croppedImageUrl ? "✅ Photo ready to save" : "⚠️ Please crop your photo first"}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!croppedImageUrl}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default PhotoEditor;
