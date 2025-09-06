import React, { useState, useRef } from 'react'
import { Upload, X, File, Image, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
  multiple?: boolean
  label?: string
  helpText?: string
}

interface FileWithPreview extends File {
  id: string
  preview?: string
  error?: string | null
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
  maxFiles = 5,
  maxSize = 10, // 10MB
  className = '',
  disabled = false,
  multiple = true,
  label = 'Upload Files',
  helpText
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!isValidType) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`
    }

    return null
  }

  const processFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const processedFiles: FileWithPreview[] = []

    for (const file of fileArray) {
      const error = validateFile(file)
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: Math.random().toString(36).substr(2, 9),
        error
      })

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          fileWithPreview.preview = e.target?.result as string
          setFiles(prev => [...prev])
        }
        reader.readAsDataURL(file)
      }

      processedFiles.push(fileWithPreview)
    }

    const updatedFiles = [...files, ...processedFiles].slice(0, maxFiles)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles.filter(f => !f.error))
    setUploadError(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length + files.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`)
      return
    }

    processFiles(droppedFiles)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    if (selectedFiles.length + files.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`)
      return
    }

    processFiles(selectedFiles)
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles.filter(f => !f.error))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />
    }
    if (file.type === 'application/pdf') {
      return <FileText className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center">
          <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="mt-2">
            <p className={`text-sm ${dragActive ? 'text-blue-600' : 'text-gray-600'}`}>
              {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes.join(', ')} up to {maxSize}MB each
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-gray-500">
                Maximum {maxFiles} files
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Help Text */}
      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.filter(f => !f.error).length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg border
                  ${file.error 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-green-200 bg-green-50'
                  }
                `}
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  {file.error && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <p className="text-xs text-red-600">{file.error}</p>
                    </div>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {file.error ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
