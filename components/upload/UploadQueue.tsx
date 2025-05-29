'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  RotateCcw,
  X,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  FileImage,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  UploadProgressData,
  BatchUploadProgress,
  formatFileSize,
  formatUploadSpeed,
  formatDuration,
  getStatusColor,
} from '@/lib/utils/upload-progress'

interface UploadQueueProps {
  fileProgress: UploadProgressData[]
  batchProgress: BatchUploadProgress
  onRetryFile?: (fileId: string) => void
  onCancelFile?: (fileId: string) => void
  onRemoveFile?: (fileId: string) => void
  onRetryAll?: () => void
  onCancelAll?: () => void
  onClearCompleted?: () => void
  onPauseUpload?: () => void
  onResumeUpload?: () => void
  maxHeight?: string
  showActions?: boolean
  className?: string
}

export function UploadQueue({
  fileProgress,
  batchProgress,
  onRetryFile,
  onCancelFile,
  onRemoveFile,
  onRetryAll,
  onCancelAll,
  onClearCompleted,
  onPauseUpload,
  onResumeUpload,
  maxHeight = '400px',
  showActions = true,
  className,
}: UploadQueueProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  if (fileProgress.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No files in upload queue</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalFiles, completedFiles, failedFiles, status } = batchProgress
  const pendingFiles = totalFiles - completedFiles - failedFiles
  const hasFailedFiles = failedFiles > 0
  const hasCompletedFiles = completedFiles > 0
  const isUploading = status === 'uploading'

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId)
    } else {
      newSelection.add(fileId)
    }
    setSelectedFiles(newSelection)
  }

  const selectAll = () => {
    setSelectedFiles(new Set(fileProgress.map(f => f.fileId)))
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  const getStatusBadge = (status: UploadProgressData['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'uploading':
        return (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-200"
          >
            <Upload className="h-3 w-3 mr-1" />
            Uploading
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-200">
            <X className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return null
    }
  }

  const renderFileItem = (file: UploadProgressData) => {
    const { fileId, fileName, fileSize, progress, status, speed, eta, error } =
      file
    const isSelected = selectedFiles.has(fileId)
    const statusColor = getStatusColor(status)

    return (
      <div
        key={fileId}
        className={cn(
          'flex items-center gap-3 p-3 border rounded-lg transition-colors',
          isSelected && 'bg-blue-50 border-blue-200',
          status === 'failed' && 'border-red-200 bg-red-50',
          status === 'completed' && 'border-green-200 bg-green-50'
        )}
      >
        {/* File Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleFileSelection(fileId)}
          className="rounded border-gray-300"
        />

        {/* File Icon */}
        <FileImage className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium truncate">{fileName}</span>
            {getStatusBadge(status)}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatFileSize(fileSize)}</span>
            {status === 'uploading' && speed && (
              <>
                <span>•</span>
                <span>{formatUploadSpeed(speed)}</span>
                {eta && isFinite(eta) && eta > 0 && (
                  <>
                    <span>•</span>
                    <span>ETA: {formatDuration(eta)}</span>
                  </>
                )}
              </>
            )}
            {status === 'uploading' && (
              <>
                <span>•</span>
                <span>{progress}%</span>
              </>
            )}
          </div>

          {/* Error Message */}
          {status === 'failed' && error && (
            <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
        </div>

        {/* File Actions */}
        <div className="flex items-center gap-1">
          {status === 'failed' && onRetryFile && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRetryFile(fileId)}
              className="h-7 px-2"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}

          {(status === 'pending' || status === 'uploading') && onCancelFile && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancelFile(fileId)}
              className="h-7 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          {(status === 'completed' ||
            status === 'failed' ||
            status === 'cancelled') &&
            onRemoveFile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemoveFile(fileId)}
                className="h-7 px-2"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === 'failed' && onRetryFile && (
                <DropdownMenuItem onClick={() => onRetryFile(fileId)}>
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Retry Upload
                </DropdownMenuItem>
              )}
              {(status === 'pending' || status === 'uploading') &&
                onCancelFile && (
                  <DropdownMenuItem onClick={() => onCancelFile(fileId)}>
                    <X className="h-3 w-3 mr-2" />
                    Cancel Upload
                  </DropdownMenuItem>
                )}
              {onRemoveFile && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onRemoveFile(fileId)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Remove from Queue
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Queue ({totalFiles} files)
          </span>

          {showActions && (
            <div className="flex items-center gap-2">
              {/* Selection Actions */}
              {selectedFiles.size > 0 && (
                <div className="flex items-center gap-1 mr-2">
                  <span className="text-xs text-muted-foreground">
                    {selectedFiles.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* Batch Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={selectAll}>
                    Select All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearSelection}>
                    Clear Selection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {isUploading && onPauseUpload && (
                    <DropdownMenuItem onClick={onPauseUpload}>
                      <Pause className="h-3 w-3 mr-2" />
                      Pause All
                    </DropdownMenuItem>
                  )}

                  {status === 'paused' && onResumeUpload && (
                    <DropdownMenuItem onClick={onResumeUpload}>
                      <Play className="h-3 w-3 mr-2" />
                      Resume All
                    </DropdownMenuItem>
                  )}

                  {hasFailedFiles && onRetryAll && (
                    <DropdownMenuItem onClick={onRetryAll}>
                      <RotateCcw className="h-3 w-3 mr-2" />
                      Retry Failed
                    </DropdownMenuItem>
                  )}

                  {pendingFiles > 0 && onCancelAll && (
                    <DropdownMenuItem onClick={onCancelAll}>
                      <X className="h-3 w-3 mr-2" />
                      Cancel Pending
                    </DropdownMenuItem>
                  )}

                  {hasCompletedFiles && onClearCompleted && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onClearCompleted}>
                        <Trash2 className="h-3 w-3 mr-2" />
                        Clear Completed
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }} className="px-6 pb-6">
          <div className="space-y-2">{fileProgress.map(renderFileItem)}</div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
