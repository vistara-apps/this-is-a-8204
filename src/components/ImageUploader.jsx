import React, { useCallback, useState } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'

const ImageUploader = ({ onImageUpload }) => {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState(null)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
        onImageUpload(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">
              Upload your product image
            </h3>
            <p className="text-gray-600 mb-6">
              Drag and drop your image here, or click to browse
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="btn-primary cursor-pointer inline-block">
              Choose File
            </label>
          </div>
        ) : (
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Uploaded product"
                className="max-w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-full">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-green-600 font-semibold mt-4">
              Image uploaded successfully!
            </p>
            <button
              onClick={() => {
                setPreview(null)
                onImageUpload(null)
              }}
              className="btn-secondary mt-4"
            >
              Upload Different Image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageUploader