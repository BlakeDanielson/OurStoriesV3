'use client'

import { useState } from 'react'
import { UploadButton, UploadDropzone } from '@/lib/uploadthing-client'

interface ImageUploaderProps {
  endpoint: 'imageUploader' | 'childPhotoUploader' | 'avatarUploader'
  onUploadComplete?: (files: { url: string; uploadedBy: string }[]) => void
  className?: string
  variant?: 'button' | 'dropzone'
}

export function ImageUploader({
  endpoint,
  onUploadComplete,
  className = '',
  variant = 'dropzone',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')

  const handleUploadComplete = (res: any[]) => {
    setIsUploading(false)
    console.log('Files uploaded:', res)
    setUploadStatus(`✅ ${res.length} file(s) uploaded successfully!`)

    if (onUploadComplete) {
      onUploadComplete(res)
    }

    // Clear status after 3 seconds
    setTimeout(() => setUploadStatus(''), 3000)
  }

  const handleUploadError = (error: Error) => {
    setIsUploading(false)
    console.error('Upload error:', error)
    setUploadStatus(`❌ Upload failed: ${error.message}`)

    // Clear status after 5 seconds
    setTimeout(() => setUploadStatus(''), 5000)
  }

  const handleUploadBegin = () => {
    setIsUploading(true)
    setUploadStatus('📤 Uploading...')
  }

  if (variant === 'button') {
    return (
      <div className={className}>
        <UploadButton
          endpoint={endpoint}
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onUploadBegin={handleUploadBegin}
          appearance={{
            button: 'bg-primary text-primary-foreground hover:bg-primary/90',
            allowedContent: 'text-muted-foreground text-sm',
          }}
        />
        {uploadStatus && <p className="text-sm mt-2">{uploadStatus}</p>}
      </div>
    )
  }

  return (
    <div className={className}>
      <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        onUploadBegin={handleUploadBegin}
        appearance={{
          container:
            'border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50',
          uploadIcon: 'text-muted-foreground',
          label: 'text-foreground',
          allowedContent: 'text-muted-foreground',
        }}
      />
      {uploadStatus && (
        <p className="text-sm mt-2 text-center">{uploadStatus}</p>
      )}
    </div>
  )
}
