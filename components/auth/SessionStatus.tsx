'use client'

import { useState } from 'react'
import {
  Clock,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/context'
import { useSession } from '@/lib/auth/use-session'

interface SessionStatusProps {
  showDetails?: boolean
  className?: string
}

export function SessionStatus({
  showDetails = true,
  className = '',
}: SessionStatusProps) {
  const { refreshSession, validateSession, getSessionExpiry } = useAuth()
  const session = useSession()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
    } catch (error) {
      console.error('Error refreshing session:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      await validateSession()
    } catch (error) {
      console.error('Error validating session:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (60 * 60 * 1000))
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const expiryInfo = getSessionExpiry()

  if (!session.isAuthenticated) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800 text-sm">
              Not Authenticated
            </CardTitle>
          </div>
          <CardDescription className="text-red-700">
            No active session found.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800 text-sm">
              Session Active
            </CardTitle>
            <Badge
              variant="outline"
              className="text-green-700 border-green-300"
            >
              {expiryInfo.isExpiringSoon ? 'Expiring Soon' : 'Valid'}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={isValidating}
              className="h-8"
            >
              {isValidating ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8"
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription className="text-green-700">
          Authenticated as {session.user?.email}
        </CardDescription>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Session Timing */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Last Refresh:</span>
              </div>
              <span className="font-mono text-gray-800">
                {formatDate(session.lastRefresh)}
              </span>
            </div>

            {expiryInfo.expiresAt && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Expires At:</span>
                  <span className="font-mono text-gray-800">
                    {formatDate(expiryInfo.expiresAt)}
                  </span>
                </div>

                {expiryInfo.expiresIn && expiryInfo.expiresIn > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Time Remaining:</span>
                    <span
                      className={`font-mono ${expiryInfo.isExpiringSoon ? 'text-amber-600' : 'text-gray-800'}`}
                    >
                      {formatDuration(expiryInfo.expiresIn)}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="border-t border-gray-200"></div>

            {/* User Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-xs text-gray-800">
                  {session.user?.id?.slice(0, 8)}...
                </span>
              </div>

              {session.user?.user_metadata?.full_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Name:</span>
                  <span className="text-gray-800">
                    {session.user.user_metadata.full_name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Provider:</span>
                <span className="text-gray-800 capitalize">
                  {session.user?.app_metadata?.provider || 'email'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200"></div>
            <div className="flex space-x-2">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Session
                  </>
                )}
              </Button>
              <Button
                onClick={handleValidate}
                disabled={isValidating}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                {isValidating ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

/**
 * Compact session status for use in headers/navbars
 */
export function CompactSessionStatus() {
  const session = useSession()
  const expiryInfo = session.getExpiryInfo()

  if (!session.isAuthenticated) {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Not Authenticated
      </Badge>
    )
  }

  return (
    <Badge
      variant={expiryInfo.isExpiringSoon ? 'destructive' : 'default'}
      className="text-xs"
    >
      <Shield className="h-3 w-3 mr-1" />
      {expiryInfo.isExpiringSoon ? 'Expiring Soon' : 'Active'}
    </Badge>
  )
}
