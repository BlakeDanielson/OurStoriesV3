'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Upload,
  CheckCircle,
  XCircle,
  User,
  Camera,
  Eye,
  Star,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ChildProfile {
  id: string
  name: string
  age: number
}

interface ChildPhoto {
  id: string
  child_profile_id: string
  original_url: string
  optimized_url: string
  file_name: string
  file_size: number
  optimized_size: number
  is_primary: boolean
  description?: string
  face_detected: boolean
  face_region?: {
    x: number
    y: number
    width: number
    height: number
  }
  face_confidence?: number
  dimensions: {
    width: number
    height: number
  }
  compression_ratio: number
  created_at: string
}

interface UploadResult {
  success: boolean
  result?: {
    photoId: string
    photoUrl: string
    optimizedUrl: string
    childProfileId: string
    isPrimary: boolean
    faceDetected: boolean
    faceRegion?: {
      x: number
      y: number
      width: number
      height: number
    }
    metadata: {
      originalSize: number
      optimizedSize: number
      compressionRatio: number
      dimensions: {
        width: number
        height: number
      }
      uploadedAt: string
    }
  }
  error?: string
  details?: string
}

export default function TestChildPhotosPage() {
  const { user, loading: authLoading } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState('')

  // Form data
  const [selectedChildId, setSelectedChildId] = useState('')
  const [description, setDescription] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)

  // Child photos state
  const [childPhotos, setChildPhotos] = useState<ChildPhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  // Mock child profiles (in real app, fetch from API)
  const mockChildProfiles: ChildProfile[] = [
    { id: 'child-001', name: 'Emma', age: 7 },
    { id: 'child-002', name: 'Liam', age: 5 },
    { id: 'child-003', name: 'Sofia', age: 9 },
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setError('')

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const uploadPhoto = async () => {
    if (!selectedFile || !selectedChildId) {
      setError('Please select a file and child profile')
      return
    }

    setUploading(true)
    setError('')
    setUploadResult(null)

    try {
      // Convert file to base64
      const base64Data = await convertFileToBase64(selectedFile)

      const requestBody = {
        childProfileId: selectedChildId,
        photoData: base64Data,
        fileName: selectedFile.name,
        isPrimary,
        description: description || undefined,
      }

      const response = await fetch('/api/child-photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      setUploadResult(data)

      if (data.success) {
        // Clear form
        setSelectedFile(null)
        setPreviewUrl('')
        setDescription('')
        setIsPrimary(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Refresh photos list
        if (selectedChildId) {
          loadChildPhotos(selectedChildId)
        }
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setUploading(false)
    }
  }

  const loadChildPhotos = async (childId: string) => {
    setLoadingPhotos(true)
    try {
      const response = await fetch(
        `/api/child-photos/upload?childProfileId=${childId}`
      )
      const data = await response.json()

      if (data.success) {
        setChildPhotos(data.photos)
      } else {
        console.error('Failed to load photos:', data.error)
      }
    } catch (err) {
      console.error('Error loading photos:', err)
    } finally {
      setLoadingPhotos(false)
    }
  }

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId)
    if (childId) {
      loadChildPhotos(childId)
    } else {
      setChildPhotos([])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = () => {
    if (uploading) return <Loader2 className="h-5 w-5 animate-spin" />
    if (uploadResult?.success)
      return <CheckCircle className="h-5 w-5 text-green-500" />
    if (error) return <XCircle className="h-5 w-5 text-red-500" />
    return <Camera className="h-5 w-5" />
  }

  if (authLoading) {
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
            You must be signed in to test child photo uploads. Please sign in
            first.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Child Photo Upload Test</h1>
        <p className="text-gray-600">
          Test uploading child photos with face detection and optimization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Photo Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Child Selection */}
              <div>
                <Label htmlFor="childSelect">Select Child Profile</Label>
                <Select
                  value={selectedChildId}
                  onValueChange={handleChildSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a child profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockChildProfiles.map(child => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name} (Age {child.age})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="fileInput">Photo File</Label>
                <Input
                  ref={fileInputRef}
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF. Max size: 10MB
                </p>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div>
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-48 mx-auto rounded"
                    />
                    {selectedFile && (
                      <div className="mt-2 text-sm text-gray-600 text-center">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)}
                        )
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the photo (e.g., 'Emma at the park')"
                  rows={2}
                />
              </div>

              {/* Primary Photo */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrimary"
                  checked={isPrimary}
                  onCheckedChange={checked => setIsPrimary(checked as boolean)}
                />
                <Label htmlFor="isPrimary">
                  Set as primary photo for this child
                </Label>
              </div>

              {/* Upload Button */}
              <Button
                onClick={uploadPhoto}
                disabled={uploading || !selectedFile || !selectedChildId}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Upload Result */}
          {uploadResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Upload Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploadResult.success && uploadResult.result ? (
                  <div className="space-y-4">
                    {/* Face Detection */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          uploadResult.result.faceDetected
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {uploadResult.result.faceDetected
                          ? 'Face Detected'
                          : 'No Face Detected'}
                      </Badge>
                      {uploadResult.result.isPrimary && (
                        <Badge variant="outline">
                          <Star className="h-3 w-3 mr-1" />
                          Primary Photo
                        </Badge>
                      )}
                    </div>

                    {/* Optimization Stats */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Optimization Results</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          Original Size:{' '}
                          {formatFileSize(
                            uploadResult.result.metadata.originalSize
                          )}
                        </div>
                        <div>
                          Optimized Size:{' '}
                          {formatFileSize(
                            uploadResult.result.metadata.optimizedSize
                          )}
                        </div>
                        <div>
                          Compression:{' '}
                          {uploadResult.result.metadata.compressionRatio.toFixed(
                            1
                          )}
                          x
                        </div>
                        <div>
                          Dimensions:{' '}
                          {uploadResult.result.metadata.dimensions.width}×
                          {uploadResult.result.metadata.dimensions.height}
                        </div>
                      </div>
                    </div>

                    {/* Preview Images */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Original</Label>
                        <img
                          src={uploadResult.result.photoUrl}
                          alt="Original"
                          className="w-full rounded border"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Optimized</Label>
                        <img
                          src={uploadResult.result.optimizedUrl}
                          alt="Optimized"
                          className="w-full rounded border"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <p className="font-medium">Upload Failed</p>
                    <p className="text-sm">{uploadResult.error}</p>
                    {uploadResult.details && (
                      <p className="text-xs mt-1">{uploadResult.details}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Child Photos List */}
          {selectedChildId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos for{' '}
                  {mockChildProfiles.find(c => c.id === selectedChildId)?.name}
                  {loadingPhotos && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {childPhotos.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No photos uploaded yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {childPhotos.map(photo => (
                      <div key={photo.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={photo.optimized_url}
                            alt={photo.file_name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {photo.file_name}
                              </span>
                              {photo.is_primary && (
                                <Badge variant="outline">
                                  <Star className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  photo.face_detected
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {photo.face_detected ? 'Face ✓' : 'No Face'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatFileSize(photo.file_size)} →{' '}
                              {formatFileSize(photo.optimized_size)}(
                              {photo.compression_ratio.toFixed(1)}x compression)
                            </div>
                            {photo.description && (
                              <p className="text-sm text-gray-700">
                                {photo.description}
                              </p>
                            )}
                            <div className="text-xs text-gray-500">
                              Uploaded:{' '}
                              {new Date(photo.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
