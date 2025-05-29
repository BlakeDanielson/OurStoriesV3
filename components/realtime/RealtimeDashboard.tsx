'use client'

import { useUserBooks, useRealtimeConnection } from '@/lib/hooks/useRealtime'
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
import { Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

interface RealtimeDashboardProps {
  children?: React.ReactNode
}

export function RealtimeDashboard({ children }: RealtimeDashboardProps) {
  const [notifications, setNotifications] = useState<string[]>([])
  const { isConnected, refreshAuth, disconnect } = useRealtimeConnection()

  const { lastUpdate, bookUpdates, clearUpdates } = useUserBooks(update => {
    // Add notification for book status changes
    const message = `"${update.bookId}" status changed to ${update.status}`
    setNotifications(prev => [message, ...prev.slice(0, 4)]) // Keep last 5 notifications
  })

  const handleClearNotifications = () => {
    setNotifications([])
    clearUpdates()
  }

  const handleRefreshConnection = async () => {
    await refreshAuth()
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <CardTitle className="text-lg">Real-time Dashboard</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'success' : 'destructive'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshConnection}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            Live updates for your stories and reading progress
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Connection Warning */}
      {!isConnected && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Real-time updates are currently unavailable. Some features may not
            work as expected.
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={handleRefreshConnection}
            >
              Try reconnecting
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Live Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <CardTitle className="text-base">Live Updates</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearNotifications}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`
                    p-2 rounded-md text-sm border-l-4 
                    ${
                      index === 0
                        ? 'bg-blue-50 border-blue-400 text-blue-800'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    }
                  `}
                >
                  {notification}
                  {index === 0 && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      New
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Book Updates */}
      {bookUpdates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Book Updates</CardTitle>
            <CardDescription>
              Latest status changes across all your stories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookUpdates.map((update, index) => (
                <div
                  key={`${update.bookId}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Book ID: {update.bookId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {update.totalPages && `${update.totalPages} pages`}
                      {update.completedAt &&
                        ` • Completed ${new Date(update.completedAt).toLocaleString()}`}
                    </div>
                  </div>
                  <Badge
                    variant={
                      update.status === 'completed'
                        ? 'success'
                        : update.status === 'generating'
                          ? 'default'
                          : update.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                    }
                  >
                    {update.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {children}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>
              Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div>
              Last Update: {lastUpdate ? JSON.stringify(lastUpdate) : 'None'}
            </div>
            <div>Total Updates: {bookUpdates.length}</div>
            <div>Notifications: {notifications.length}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
