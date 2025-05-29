'use client'

import { useState } from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSessionExpiry } from '@/lib/auth/use-session'

interface SessionExpiryWarningProps {
  warningThreshold?: number // milliseconds before expiry to show warning
  className?: string
}

export function SessionExpiryWarning({
  warningThreshold = 10 * 60 * 1000, // 10 minutes default
  className = '',
}: SessionExpiryWarningProps) {
  const { isExpiringSoon, timeUntilExpiry, refreshSession } =
    useSessionExpiry(warningThreshold)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Don't show if not expiring soon or dismissed
  if (!isExpiringSoon || isDismissed) {
    return null
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const success = await refreshSession()
      if (success) {
        setIsDismissed(true) // Auto-dismiss on successful refresh
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  const formatTimeRemaining = (ms: number | null): string => {
    if (!ms || ms <= 0) return 'Expired'

    const minutes = Math.floor(ms / (60 * 1000))
    const seconds = Math.floor((ms % (60 * 1000)) / 1000)

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  return (
    <Card className={`border-amber-200 bg-amber-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800 text-sm">
              Session Expiring Soon
            </CardTitle>
            <Badge
              variant="outline"
              className="text-amber-700 border-amber-300"
            >
              {formatTimeRemaining(timeUntilExpiry)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-amber-700">
          Your session will expire soon. Refresh to continue working.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex space-x-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Extend Session
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Fixed position session warning that appears at the top of the screen
 */
export function FixedSessionExpiryWarning(props: SessionExpiryWarningProps) {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <SessionExpiryWarning {...props} />
    </div>
  )
}

/**
 * Inline session warning for use within page content
 */
export function InlineSessionExpiryWarning(props: SessionExpiryWarningProps) {
  return (
    <div className="mb-4">
      <SessionExpiryWarning {...props} />
    </div>
  )
}
