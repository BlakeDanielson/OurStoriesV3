'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  FileImage,
  Download,
  Trash2,
  Calendar,
  HardDrive,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import type { UploadedFile } from '@/lib/types/uploaded-files'

interface UploadedFilesListProps {
  uploadType?: 'general' | 'child_photo' | 'avatar'
  showStatistics?: boolean
  className?: string
}

interface UploadStatistics {
  totalFiles: number
  totalSize: number
  filesByType: Record<string, number>
  recentUploads: number
}

export function UploadedFilesList({
  uploadType,
  showStatistics = true,
  className = '',
}: UploadedFilesListProps) {
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [statistics, setStatistics] = useState<UploadStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (uploadType) {
        params.append('upload_type', uploadType)
      }

      const response = await fetch(`/api/uploaded-files?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch uploaded files')
      }

      const result = await response.json()
      setFiles(result.data || [])
    } catch (err) {
      console.error('Error fetching files:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    if (!user || !showStatistics) return

    try {
      const response = await fetch('/api/uploaded-files?statistics=true')

      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const result = await response.json()
      setStatistics(result.data)
    } catch (err) {
      console.error('Error fetching statistics:', err)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/uploaded-files?id=${fileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      // Refresh the files list
      await fetchFiles()
      if (showStatistics) {
        await fetchStatistics()
      }
    } catch (err) {
      console.error('Error deleting file:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  useEffect(() => {
    if (user) {
      fetchFiles()
      if (showStatistics) {
        fetchStatistics()
      }
    }
  }, [user, uploadType, showStatistics])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getUploadTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'avatar':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'child_photo':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'general':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please sign in to view your uploaded files.
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading uploaded files...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics */}
      {showStatistics && statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Upload Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {statistics.totalFiles}
                </div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatFileSize(statistics.totalSize)}
                </div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {statistics.recentUploads}
                </div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Object.keys(statistics.filesByType).length}
                </div>
                <div className="text-sm text-muted-foreground">File Types</div>
              </div>
            </div>

            {Object.keys(statistics.filesByType).length > 0 && (
              <div className="mt-4">
                <Separator className="mb-3" />
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statistics.filesByType).map(
                    ([type, count]) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={getUploadTypeBadgeColor(type)}
                      >
                        {type.replace('_', ' ')}: {count}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Uploaded Files
              {uploadType && (
                <Badge
                  variant="outline"
                  className={getUploadTypeBadgeColor(uploadType)}
                >
                  {uploadType.replace('_', ' ')}
                </Badge>
              )}
            </span>
            <Button variant="outline" size="sm" onClick={fetchFiles}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            {files.length === 0
              ? 'No uploaded files found'
              : `${files.length} file${files.length === 1 ? '' : 's'} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload some files to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map(file => (
                <div key={file.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">
                          {file.file_name}
                        </h4>
                        <Badge
                          variant="outline"
                          className={getUploadTypeBadgeColor(file.upload_type)}
                        >
                          {file.upload_type.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {file.file_size
                            ? formatFileSize(file.file_size)
                            : 'Unknown size'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {file.created_at
                            ? formatDate(file.created_at)
                            : 'Unknown date'}
                        </div>
                        <div className="col-span-2">
                          Type: {file.file_type || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File preview for images */}
                  {file.file_type?.startsWith('image/') && (
                    <div className="mt-3">
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="max-w-full h-32 object-cover rounded border"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
