import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

// Utility to convert a crop area to a blob (canvas)


const ImageEditorWrapper = ({ imageSrc, onEditComplete, onCancel, className = '' }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [aspect, setAspect] = useState(16 / 9)

  const aspectOptions = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:2', value: 3 / 2 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 }
  ]

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Helpers to create rotated & cropped image from source
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.setAttribute('crossOrigin', 'anonymous')
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = url
    })

  const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180

  const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation)
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height)
    }
  }

  const getCroppedImgRotated = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc)
    const rotRad = getRadianAngle(rotation)

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation)

    // create canvas to draw the rotated image
    const canvas = document.createElement('canvas')
    canvas.width = bBoxWidth
    canvas.height = bBoxHeight
    const ctx = canvas.getContext('2d')

    // translate canvas to center and rotate
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.drawImage(image, -image.width / 2, -image.height / 2)

    // now we have the rotated image in the large canvas; extract the crop area
    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height)

    // create a second canvas for the final cropped image
    const croppedCanvas = document.createElement('canvas')
    croppedCanvas.width = pixelCrop.width
    croppedCanvas.height = pixelCrop.height
    const croppedCtx = croppedCanvas.getContext('2d')
    croppedCtx.putImageData(data, 0, 0)

    const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9)
    const blob = await (await fetch(dataUrl)).blob()
    return { blob, dataUrl }
  }

  const handleApply = async () => {
    try {
      if (!croppedAreaPixels) return
      // croppedAreaPixels returned by react-easy-crop are relative to the rotated image already
      const result = await getCroppedImgRotated(imageSrc, croppedAreaPixels, rotation)
      if (onEditComplete) onEditComplete(result.blob, result.dataUrl)
    } catch (err) {
      console.error('apply crop err', err)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-2 flex-wrap">
          {aspectOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => setAspect(opt.value)}
              className={`px-3 py-1 rounded-md border ${aspect === opt.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="text-sm">Zoom</label>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </div>
      </div>

      <div className="relative w-full h-[60vh] bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          // only pass aspect when a numeric aspect is selected; null => freeform
          {...(aspect ? { aspect } : {})}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex items-center gap-3 mt-3">
        <label className="text-sm">Rotate</label>
        <input type="range" min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
      </div>

      <div className="flex justify-end gap-3 mt-3">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">Cancel</button>
        <button onClick={handleApply} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">Apply</button>
      </div>
    </div>
  )
}

export default ImageEditorWrapper
