'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { ImageUploader } from '@/components/upload/ImageUploader'
import { ValidatedImageUploader } from '@/components/upload/ValidatedImageUploader'
import { CompressedImageUploader } from '@/components/upload/CompressedImageUploader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { type CompressionResult } from '@/lib/utils/image-compression'
import { FileText, Upload, Zap, Database, Eye } from 'lucide-react'
import { UploadedFilesList } from '@/components/upload/UploadedFilesList'
import { EnhancedImageUploader } from '@/components/upload/EnhancedImageUploader'
import { ImagePreview } from '@/components/upload/ImagePreview'
import { DragDropImageUpload } from '@/components/upload/DragDropImageUpload'
import { Button } from '@/components/ui/button'
import { PhotoUploadInterface } from '@/components/upload/PhotoUploadInterface'

export default function TestUploadPage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('database')
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [previewFiles, setPreviewFiles] = useState<File[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [compressionResults, setCompressionResults] = useState<
    CompressionResult[]
  >([])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            You must be signed in to test file uploads. Please sign in first.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleUploadComplete = (files: any[]) => {
    console.log('Upload completed:', files)
    setUploadedFiles(prev => [...prev, ...files])
    setValidationErrors([]) // Clear any previous validation errors
  }

  const handleValidationError = (errors: string[]) => {
    console.log('Validation errors:', errors)
    setValidationErrors(errors)
  }

  const handleCompressionComplete = (results: CompressionResult[]) => {
    console.log('Compression completed:', results)
    setCompressionResults(results)
  }

  const handleUpload = (urls: string[]) => {
    console.log('Uploaded photo URLs:', urls)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Photo Upload Test</h1>
          <p className="text-muted-foreground">
            Test the photo upload interface with drag-and-drop functionality,
            face detection validation, and upload guidelines.
          </p>
        </div>

        <div className="flex justify-center">
          <PhotoUploadInterface
            maxFiles={5}
            maxFileSize={4}
            onUpload={handleUpload}
          />
        </div>
      </div>
    </div>
  )
}
