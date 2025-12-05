import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCw, ZoomIn, ZoomOut, Crop, Save } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const PhotoEditor = ({ imageUrl, onSave, onClose }) => {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const onImageLoad = (img) => {
    imgRef.current = img;
  };

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onCropComplete = (crop) => {
    setCompletedCrop(crop);
  };

  const getCroppedImg = (image, crop, fileName = 'cropped-image.jpg') => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        blob.name = fileName;
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCrop = async () => {
    if (imgRef.current && completedCrop) {
      try {
        const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
        setCroppedImageUrl(croppedImageUrl);
      } catch (error) {
        console.error('Error cropping image:', error);
      }
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

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
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
                    style={{
                      transform: `rotate(${rotation}deg) scale(${zoom})`,
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
                  onClick={handleRotate}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Rotate</span>
                </button>
                <button
                  onClick={handleZoomIn}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>Zoom In</span>
                </button>
                <button
                  onClick={handleZoomOut}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span>Zoom Out</span>
                </button>
                <button
                  onClick={handleCrop}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Crop className="w-4 h-4" />
                  <span>Apply Crop</span>
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
                This is how your profile photo will appear
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!croppedImageUrl}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
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
