'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertTriangle,
  RefreshCw,
  X,
  Filter,
  MoreVertical,
  Trash2,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  UploadError,
  ErrorCategory,
  ErrorSeverity,
  getErrorCategoryIcon,
  isRetryable,
} from '@/lib/utils/error-handling'
import { ErrorAlert } from './ErrorAlert'

interface ErrorListProps {
  errors: UploadError[]
  onRetryError?: (errorId: string) => void
  onRetryAllErrors?: () => void
  onDismissError?: (errorId: string) => void
  onClearAllErrors?: () => void
  onExportErrors?: () => void
  showTechnicalDetails?: boolean
  maxHeight?: string
  className?: string
  isRetrying?: boolean
  onlineStatus?: boolean
  enableFiltering?: boolean
  enableBatchOperations?: boolean
  compact?: boolean
}

type SortOption = 'timestamp' | 'severity' | 'category' | 'fileName'
type SortDirection = 'asc' | 'desc'

export function ErrorList({
  errors,
  onRetryError,
  onRetryAllErrors,
  onDismissError,
  onClearAllErrors,
  onExportErrors,
  showTechnicalDetails = false,
  maxHeight = '400px',
  className,
  isRetrying = false,
  onlineStatus = true,
  enableFiltering = true,
  enableBatchOperations = true,
  compact = false,
}: ErrorListProps) {
  const [categoryFilter, setCategoryFilter] = useState<ErrorCategory | 'all'>(
    'all'
  )
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | 'all'>(
    'all'
  )
  const [sortBy, setSortBy] = useState<SortOption>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showDetails, setShowDetails] = useState(showTechnicalDetails)

  // Filter and sort errors
  const filteredAndSortedErrors = useMemo(() => {
    let filtered = errors

    // Apply filters
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(error => error.category === categoryFilter)
    }
    if (severityFilter !== 'all') {
      filtered = filtered.filter(error => error.severity === severityFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp
          break
        case 'severity':
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
          comparison = severityOrder[a.severity] - severityOrder[b.severity]
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'fileName':
          comparison = (a.fileName || '').localeCompare(b.fileName || '')
          break
      }

      return sortDirection === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [errors, categoryFilter, severityFilter, sortBy, sortDirection])

  // Statistics
  const stats = useMemo(() => {
    const total = errors.length
    const retryable = errors.filter(isRetryable).length
    const byCategory = errors.reduce(
      (acc, error) => {
        acc[error.category] = (acc[error.category] || 0) + 1
        return acc
      },
      {} as Record<ErrorCategory, number>
    )
    const bySeverity = errors.reduce(
      (acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1
        return acc
      },
      {} as Record<ErrorSeverity, number>
    )

    return { total, retryable, byCategory, bySeverity }
  }, [errors])

  const handleExportErrors = () => {
    const errorData = errors.map(error => ({
      id: error.id,
      timestamp: new Date(error.timestamp).toISOString(),
      category: error.category,
      severity: error.severity,
      code: error.code,
      userMessage: error.userMessage,
      technicalMessage: error.message,
      fileName: error.fileName,
      retryCount: error.retryCount,
      suggestions: error.suggestions,
    }))

    const blob = new Blob([JSON.stringify(errorData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `upload-errors-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    onExportErrors?.()
  }

  if (errors.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6 text-center text-gray-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No errors to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Upload Errors ({filteredAndSortedErrors.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            {enableBatchOperations && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {stats.retryable > 0 && (
                    <DropdownMenuItem
                      onClick={onRetryAllErrors}
                      disabled={isRetrying}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry All ({stats.retryable})
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onClearAllErrors}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportErrors}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Errors
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {showDetails ? 'Hide' : 'Show'} Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">Total: {stats.total}</Badge>
          {stats.retryable > 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Retryable: {stats.retryable}
            </Badge>
          )}
          {Object.entries(stats.bySeverity).map(([severity, count]) => (
            <Badge
              key={severity}
              variant="outline"
              className={cn(
                severity === 'critical' && 'text-red-600 border-red-200',
                severity === 'high' && 'text-orange-600 border-orange-200',
                severity === 'medium' && 'text-yellow-600 border-yellow-200',
                severity === 'low' && 'text-green-600 border-green-200'
              )}
            >
              {severity}: {count}
            </Badge>
          ))}
        </div>

        {/* Filters */}
        {enableFiltering && (
          <div className="flex flex-wrap gap-2">
            <Select
              value={categoryFilter}
              onValueChange={value =>
                setCategoryFilter(value as ErrorCategory | 'all')
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <SelectItem key={category} value={category}>
                    {getErrorCategoryIcon(category as ErrorCategory)} {category}{' '}
                    ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={value =>
                setSeverityFilter(value as ErrorSeverity | 'all')
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${sortBy}-${sortDirection}`}
              onValueChange={value => {
                const [newSortBy, newDirection] = value.split('-') as [
                  SortOption,
                  SortDirection,
                ]
                setSortBy(newSortBy)
                setSortDirection(newDirection)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp-desc">Newest First</SelectItem>
                <SelectItem value="timestamp-asc">Oldest First</SelectItem>
                <SelectItem value="severity-desc">
                  Severity (High to Low)
                </SelectItem>
                <SelectItem value="severity-asc">
                  Severity (Low to High)
                </SelectItem>
                <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                <SelectItem value="fileName-asc">File Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="p-4 space-y-3">
            {filteredAndSortedErrors.map((error, index) => (
              <div key={error.id}>
                <ErrorAlert
                  error={error}
                  onRetry={onRetryError}
                  onDismiss={onDismissError}
                  showTechnicalDetails={showDetails}
                  compact={compact}
                  isRetrying={isRetrying}
                  onlineStatus={onlineStatus}
                />
                {index < filteredAndSortedErrors.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
