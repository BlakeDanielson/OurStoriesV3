'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Upload,
  RotateCcw,
  X,
  Zap,
  FileImage,
  Pause,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  UploadProgressData,
  BatchUploadProgress,
  formatFileSize,
  formatUploadSpeed,
  formatDuration,
  getStatusColor,
  getStatusIcon,
} from '@/lib/utils/upload-progress'

interface UploadProgressIndicatorProps {
  fileProgress: UploadProgressData[]
  batchProgress: BatchUploadProgress
  onRetryFile?: (fileId: string) => void
  onCancelFile?: (fileId: string) => void
  onPauseUpload?: () => void
  onResumeUpload?: () => void
  showIndividualFiles?: boolean
  showBatchSummary?: boolean
  showSpeedAndETA?: boolean
  compact?: boolean
  className?: string
}

export function UploadProgressIndicator({
  fileProgress,
  batchProgress,
  onRetryFile,
  onCancelFile,
  onPauseUpload,
  onResumeUpload,
  showIndividualFiles = true,
  showBatchSummary = true,
  showSpeedAndETA = true,
  compact = false,
  className,
}: UploadProgressIndicatorProps) {
  if (fileProgress.length === 0) {
    return null
  }

  const renderBatchSummary = () => {
    if (!showBatchSummary) return null

    const {
      totalFiles,
      completedFiles,
      failedFiles,
      overallProgress,
      averageSpeed,
      eta,
      status,
    } = batchProgress
    const pendingFiles = totalFiles - completedFiles - failedFiles

    return (
      <Card className={cn('mb-4', compact && 'p-3')}>
        <CardHeader className={cn('pb-3', compact && 'pb-2')}>
          <CardTitle
            className={cn(
              'text-base flex items-center justify-between',
              compact && 'text-sm'
            )}
          >
            <span className="flex items-center gap-2">
              <Upload className={cn('h-4 w-4', compact && 'h-3 w-3')} />
              Upload Progress
            </span>
            <div className="flex items-center gap-2">
              {status === 'uploading' && onPauseUpload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPauseUpload}
                  className={cn('h-7', compact && 'h-6 text-xs')}
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              )}
              {status === 'paused' && onResumeUpload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onResumeUpload}
                  className={cn('h-7', compact && 'h-6 text-xs')}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={cn('space-y-3', compact && 'space-y-2')}>
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <Progress
              value={overallProgress}
              className={cn('h-3', compact && 'h-2')}
            />
          </div>

          {/* File Count Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {completedFiles > 0 && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {completedFiles} completed
                </Badge>
              )}
              {pendingFiles > 0 && (
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-200"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {pendingFiles} pending
                </Badge>
              )}
              {failedFiles > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {failedFiles} failed
                </Badge>
              )}
            </div>

            {showSpeedAndETA && status === 'uploading' && (
              <div className="text-sm text-muted-foreground">
                {averageSpeed > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {formatUploadSpeed(averageSpeed)}
                    {isFinite(eta) && eta > 0 && (
                      <span className="ml-2">• ETA: {formatDuration(eta)}</span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status Alert */}
          {status === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upload failed. Check individual files for details.
              </AlertDescription>
            </Alert>
          )}

          {status === 'completed' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All files uploaded successfully!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderFileProgress = (file: UploadProgressData) => {
    const {
      fileName,
      fileSize,
      uploadedBytes,
      progress,
      status,
      speed,
      eta,
      error,
    } = file
    const statusColor = getStatusColor(status)
    const statusIcon = getStatusIcon(status)

    return (
      <div
        key={file.fileId}
        className={cn(
          'border rounded-lg p-3 space-y-2',
          compact && 'p-2 space-y-1',
          status === 'failed' && 'border-red-200 bg-red-50',
          status === 'completed' && 'border-green-200 bg-green-50'
        )}
      >
        {/* File Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileImage
              className={cn('h-4 w-4 flex-shrink-0', compact && 'h-3 w-3')}
            />
            <span
              className={cn(
                'text-sm font-medium truncate',
                compact && 'text-xs'
              )}
            >
              {fileName}
            </span>
            <span className={cn('text-xs text-muted-foreground', statusColor)}>
              {statusIcon}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-xs', compact && 'text-[10px] px-1')}
            >
              {formatFileSize(fileSize)}
            </Badge>

            {status === 'failed' && onRetryFile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRetryFile(file.fileId)}
                className={cn('h-6 px-2', compact && 'h-5 px-1')}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}

            {(status === 'pending' || status === 'uploading') &&
              onCancelFile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancelFile(file.fileId)}
                  className={cn('h-6 px-2', compact && 'h-5 px-1')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
          </div>
        </div>

        {/* Progress Bar */}
        {(status === 'uploading' || status === 'completed') && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>
                {formatFileSize(uploadedBytes)} / {formatFileSize(fileSize)}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className={cn('h-2', compact && 'h-1')}
            />
          </div>
        )}

        {/* Speed and ETA */}
        {showSpeedAndETA && status === 'uploading' && speed && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {formatUploadSpeed(speed)}
            </span>
            {eta && isFinite(eta) && eta > 0 && (
              <span>ETA: {formatDuration(eta)}</span>
            )}
          </div>
        )}

        {/* Error Message */}
        {status === 'failed' && error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Messages */}
        {status === 'pending' && (
          <div className="text-xs text-muted-foreground">
            Waiting to upload...
          </div>
        )}

        {status === 'completed' && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Upload completed
          </div>
        )}

        {status === 'cancelled' && (
          <div className="text-xs text-orange-600">Upload cancelled</div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {renderBatchSummary()}

      {showIndividualFiles && fileProgress.length > 0 && (
        <div className="space-y-2">
          {!compact && (
            <h4 className="text-sm font-medium">Individual Files</h4>
          )}
          <div className={cn('space-y-2', compact && 'space-y-1')}>
            {fileProgress.map(renderFileProgress)}
          </div>
        </div>
      )}
    </div>
  )
}
