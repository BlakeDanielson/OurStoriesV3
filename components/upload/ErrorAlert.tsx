'use client'

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  UploadError,
  ErrorRecoveryAction,
  getErrorSeverityColor,
  getErrorCategoryIcon,
} from '@/lib/utils/error-handling'

interface ErrorAlertProps {
  error: UploadError
  onRetry?: (errorId: string) => void
  onDismiss?: (errorId: string) => void
  onAction?: (action: ErrorRecoveryAction) => void
  recoveryActions?: ErrorRecoveryAction[]
  showTechnicalDetails?: boolean
  showSuggestions?: boolean
  showRetryButton?: boolean
  showDismissButton?: boolean
  compact?: boolean
  className?: string
  isRetrying?: boolean
  onlineStatus?: boolean
}

export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  onAction,
  recoveryActions = [],
  showTechnicalDetails = false,
  showSuggestions = true,
  showRetryButton = true,
  showDismissButton = true,
  compact = false,
  className,
  isRetrying = false,
  onlineStatus = true,
}: ErrorAlertProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Info className="h-4 w-4" />
      case 'medium':
        return <AlertCircle className="h-4 w-4" />
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'critical':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getVariant = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'default'
      case 'medium':
        return 'default'
      case 'high':
        return 'destructive'
      case 'critical':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const canRetry =
    error.retryStrategy !== 'none' &&
    error.retryCount < error.maxRetries &&
    error.isTemporary

  const isNetworkError = error.category === 'network'
  const canRetryNow = canRetry && (!isNetworkError || onlineStatus)

  if (compact) {
    return (
      <Alert variant={getVariant(error.severity)} className={cn('', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getSeverityIcon(error.severity)}
            <div className="flex-1 min-w-0">
              <AlertDescription className="truncate">
                {error.userMessage}
              </AlertDescription>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {getErrorCategoryIcon(error.category)} {error.category}
              </Badge>
              {error.retryCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Retry {error.retryCount}/{error.maxRetries}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {showRetryButton && canRetryNow && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRetry?.(error.id)}
                disabled={isRetrying}
                className="h-6 px-2"
              >
                <RefreshCw
                  className={cn('h-3 w-3', isRetrying && 'animate-spin')}
                />
              </Button>
            )}
            {showDismissButton && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss?.(error.id)}
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </Alert>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={cn(
                  'p-2 rounded-full',
                  getErrorSeverityColor(error.severity)
                )}
              >
                {getSeverityIcon(error.severity)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{error.userMessage}</h4>
                  <Badge variant="outline" className="text-xs">
                    {getErrorCategoryIcon(error.category)} {error.category}
                  </Badge>
                </div>
                {error.fileName && (
                  <p className="text-xs text-gray-600">
                    File: {error.fileName}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{new Date(error.timestamp).toLocaleTimeString()}</span>
                  {error.retryCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Retry {error.retryCount}/{error.maxRetries}
                    </Badge>
                  )}
                  {isNetworkError && (
                    <div className="flex items-center gap-1">
                      {onlineStatus ? (
                        <Wifi className="h-3 w-3 text-green-500" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-red-500" />
                      )}
                      <span>{onlineStatus ? 'Online' : 'Offline'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {showDismissButton && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss?.(error.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && error.suggestions.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-700">
                Suggestions:
              </h5>
              <ul className="text-xs text-gray-600 space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {showRetryButton && canRetryNow && (
              <Button
                size="sm"
                onClick={() => onRetry?.(error.id)}
                disabled={isRetrying}
                className="h-7"
              >
                <RefreshCw
                  className={cn('h-3 w-3 mr-1', isRetrying && 'animate-spin')}
                />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}

            {!canRetryNow && error.retryStrategy === 'manual' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                Manual retry required
              </div>
            )}

            {!onlineStatus && isNetworkError && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <WifiOff className="h-3 w-3" />
                Will retry when online
              </div>
            )}

            {recoveryActions.map(action => (
              <Button
                key={action.id}
                size="sm"
                variant={action.isPrimary ? 'default' : 'outline'}
                onClick={() => onAction?.(action)}
                className="h-7"
              >
                {action.label}
              </Button>
            ))}
          </div>

          {/* Technical Details (Collapsible) */}
          {showTechnicalDetails &&
            (error.technicalDetails || error.message !== error.userMessage) && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 p-0 text-xs text-gray-500"
                  >
                    <span>Technical Details</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
                    <div>
                      <strong>Error Code:</strong> {error.code}
                    </div>
                    <div>
                      <strong>Error ID:</strong> {error.id}
                    </div>
                    {error.message !== error.userMessage && (
                      <div>
                        <strong>Technical Message:</strong> {error.message}
                      </div>
                    )}
                    {error.technicalDetails && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                          {error.technicalDetails}
                        </pre>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
