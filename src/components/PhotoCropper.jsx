import { useState, useRef, useCallback, useEffect } from 'react'
import { Crop, RotateCcw, ZoomIn, ZoomOut, RectangleHorizontal, RectangleVertical, X } from 'lucide-react'

const PhotoCropper = ({ imageSrc, onCropComplete, onCancel, aspectRatio: initialAspectRatio = 16/9, className = '' }) => {
  const [image, setImage] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 })
  const [zoom, setZoom] = useState(1)
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [activeHandle, setActiveHandle] = useState(null)

  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  // Only two modes: Landscape (default) or Portrait
  const aspectRatioOptions = [
    { label: 'Landscape', value: 16/9, icon: RectangleHorizontal },
    { label: 'Portrait', value: 9/16, icon: RectangleVertical }
  ]

  // Load image
  useEffect(() => {
    if (imageSrc) {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        // Initialize crop area in center
        const containerRect = containerRef.current?.getBoundingClientRect()
        if (containerRect) {
          // Fit crop box to image aspect to avoid very tall/short boxes
          const imgAspect = img.width / img.height || aspectRatio
          // compute max available area (60% of container)
          const maxW = containerRect.width * 0.9
          const maxH = containerRect.height * 0.9

          let width = Math.min(maxW, maxH * imgAspect)
          let height = width / imgAspect

          // fallback if width overflows
          if (height > maxH) {
            height = maxH
            width = height * imgAspect
          }

          setCrop({
            x: Math.max(8, (containerRect.width - width) / 2),
            y: Math.max(8, (containerRect.height - height) / 2),
            width: Math.max(50, width),
            height: Math.max(50, height)
          })
        }
      }
      img.src = imageSrc
      imageRef.current = img
    }
  }, [imageSrc, aspectRatio])

  // Handle aspect ratio change
  const handleAspectRatioChange = (newAspectRatio) => {
    setAspectRatio(newAspectRatio)
    if (newAspectRatio) {
      setCrop(prev => ({
        ...prev,
        height: prev.width / newAspectRatio
      }))
    }
  }

  // Handle mouse/touch events
  const handleMouseDown = useCallback((e, handle = null) => {
    e.preventDefault()
    // If a handle was clicked, stop the event from bubbling so the parent
    // crop area's onMouseDown doesn't also start a move operation.
    if (handle) {
      e.stopPropagation()
    } else {
      // If this was triggered on the parent crop element but the actual
      // target is a child (like a resize handle), ignore it here. This
      // prevents the crop window from starting a move when clicking handles.
      if (e.target !== e.currentTarget) return
    }

    setIsDragging(true)
    setActiveHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    if (activeHandle) {
      // Resize crop area
      setCrop(prev => {
        let newCrop = { ...prev }

        switch (activeHandle) {
          case 'nw':
            newCrop.x += deltaX
            newCrop.y += deltaY
            newCrop.width -= deltaX
            newCrop.height -= deltaY
            break
          case 'ne':
            newCrop.y += deltaY
            newCrop.width += deltaX
            newCrop.height -= deltaY
            break
          case 'sw':
            newCrop.x += deltaX
            newCrop.width -= deltaX
            newCrop.height += deltaY
            break
          case 'se':
            newCrop.width += deltaX
            newCrop.height += deltaY
            break
          case 'n':
            newCrop.y += deltaY
            newCrop.height -= deltaY
            break
          case 's':
            newCrop.height += deltaY
            break
          case 'w':
            newCrop.x += deltaX
            newCrop.width -= deltaX
            break
          case 'e':
            newCrop.width += deltaX
            break
        }

        // Maintain aspect ratio if set
        if (aspectRatio) {
          if (activeHandle === 'nw' || activeHandle === 'se') {
            newCrop.height = newCrop.width / aspectRatio
          } else if (activeHandle === 'ne' || activeHandle === 'sw') {
            newCrop.height = newCrop.width / aspectRatio
          }
        }

        // Constrain to container bounds
        newCrop.x = Math.max(0, Math.min(newCrop.x, rect.width - newCrop.width))
        newCrop.y = Math.max(0, Math.min(newCrop.y, rect.height - newCrop.height))
        newCrop.width = Math.max(50, Math.min(newCrop.width, rect.width - newCrop.x))
        newCrop.height = Math.max(50, Math.min(newCrop.height, rect.height - newCrop.y))

        return newCrop
      })
    } else {
      // Move crop area
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(prev.x + deltaX, rect.width - prev.width)),
        y: Math.max(0, Math.min(prev.y + deltaY, rect.height - prev.height))
      }))
    }

    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, dragStart, activeHandle, aspectRatio])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setActiveHandle(null)
  }, [])

  // Zoom controls
  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)))
  }

  // Apply crop
  const applyCrop = () => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Calculate actual image coordinates
    const containerRect = containerRef.current.getBoundingClientRect()
    const scaleX = image.width / containerRect.width
    const scaleY = image.height / containerRect.height

    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY
    const cropWidth = crop.width * scaleX
    const cropHeight = crop.height * scaleY

    // Set canvas size to cropped area
    canvas.width = cropWidth
    canvas.height = cropHeight

    // Draw cropped image
    ctx.drawImage(
      image,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    )

    // Convert to blob and call callback
    canvas.toBlob((blob) => {
      if (blob && onCropComplete) {
        onCropComplete(blob, canvas.toDataURL('image/jpeg', 0.9))
      }
    }, 'image/jpeg', 0.9)
  }

  if (!image) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Crop size={20} />
          Crop Image
        </h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          {/* Aspect Ratio */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio:</span>
            <div className="flex gap-1">
              {aspectRatioOptions.map((option) => {
                const Icon = option.icon
                const isActive = aspectRatio === option.value
                return (
                  <button
                    key={option.label}
                    onClick={() => handleAspectRatioChange(option.value)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                    title={option.label}
                  >
                    <Icon size={16} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Zoom:</span>
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={zoom <= 0.1}
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={zoom >= 3}
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Crop Area */}
      <div className="relative p-4">
        <div
          ref={containerRef}
          className="relative mx-auto border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden cursor-move"
          style={{
            width: '100%',
            maxWidth: '500px',
            height: '400px',
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Crop Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50">
            {/* Crop Window */}
            <div
              className="absolute border-2 border-white border-dashed bg-transparent cursor-move"
              style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.width,
                  height: crop.height,
                  borderRadius: aspectRatio === 1 && aspectRatioOptions.find(o => o.isCircle) ? '50%' : '0',
                  boxShadow: '0 0 0 2000px rgba(0,0,0,0.45) inset',
                  outline: '3px solid rgba(255,255,255,0.9)'
              }}
              onMouseDown={(e) => handleMouseDown(e)}
            >
              {/* Resize Handles */}
              <>
                  {/* Corner handles */}
                    <div
                      style={{ pointerEvents: 'auto' }}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-nw-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'nw')}
                    />
                  <div
                      style={{ pointerEvents: 'auto' }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-ne-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'ne')}
                    />
                  <div
                      style={{ pointerEvents: 'auto' }}
                      className="absolute -bottom-1 -left-1 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-sw-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'sw')}
                    />
                  <div
                      style={{ pointerEvents: 'auto' }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-se-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'se')}
                    />

                  {/* Edge handles */}
                    <div
                      style={{ pointerEvents: 'auto' }}
                      className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-3 h-8 bg-white border border-gray-400 rounded cursor-w-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'w')}
                    />
                    <div
                      style={{ pointerEvents: 'auto' }}
                      className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1 w-3 h-8 bg-white border border-gray-400 rounded cursor-e-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'e')}
                    />
                    <div
                      style={{ pointerEvents: 'auto' }}
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-8 h-3 bg-white border border-gray-400 rounded cursor-n-resize"
                      onMouseDown={(e) => handleMouseDown(e, 'n')}
                    />
                    <div
                      style={{ pointerEvents: 'auto' }}
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-8 h-3 bg-white border border-gray-400 rounded cursor-s-resize"
                      onMouseDown={(e) => handleMouseDown(e, 's')}
                    />
              </>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setCrop({ x: 0, y: 0, width: 200, height: 200 })}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RotateCcw size={16} />
          Reset
        </button>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={applyCrop}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Apply Crop
          </button>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default PhotoCropper