'use client'

import { useEffect, useState } from 'react'
import { useUserBooks } from '@/lib/hooks/useRealtime'
import { BookStatusUpdate } from '@/lib/realtime'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'

interface Notification {
  id: string
  update: BookStatusUpdate
  timestamp: Date
  dismissed: boolean
}

interface RealtimeNotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  maxNotifications?: number
  autoHideDuration?: number
}

export function RealtimeNotifications({
  position = 'top-right',
  maxNotifications = 3,
  autoHideDuration = 5000,
}: RealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useUserBooks(update => {
    // Create new notification
    const notification: Notification = {
      id: `${update.bookId}-${Date.now()}`,
      update,
      timestamp: new Date(),
      dismissed: false,
    }

    setNotifications(prev => {
      // Remove old notifications if we exceed max
      const filtered = prev
        .filter(n => !n.dismissed)
        .slice(0, maxNotifications - 1)
      return [notification, ...filtered]
    })
  })

  // Auto-hide notifications
  useEffect(() => {
    if (autoHideDuration <= 0) return

    const timer = setInterval(() => {
      setNotifications(prev =>
        prev.map(notification => {
          const age = Date.now() - notification.timestamp.getTime()
          if (age > autoHideDuration && !notification.dismissed) {
            return { ...notification, dismissed: true }
          }
          return notification
        })
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [autoHideDuration])

  // Remove dismissed notifications after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => !n.dismissed))
    }, 300) // Wait for animation

    return () => clearTimeout(timer)
  }, [notifications])

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-4 right-4'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'generating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusMessage = (update: BookStatusUpdate) => {
    switch (update.status) {
      case 'generating':
        return `Story generation started`
      case 'completed':
        return `Story completed! ${update.totalPages ? `${update.totalPages} pages` : ''}`
      case 'failed':
        return `Story generation failed`
      case 'draft':
        return `Story saved as draft`
      default:
        return `Status updated to ${update.status}`
    }
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, dismissed: true } : n))
    )
  }

  if (notifications.length === 0) return null

  return (
    <div className={`fixed z-50 ${getPositionClasses()} space-y-2 w-80`}>
      {notifications
        .filter(n => !n.dismissed)
        .map(notification => (
          <Card
            key={notification.id}
            className={`
              p-4 shadow-lg border-l-4 transition-all duration-300 ease-in-out
              ${
                notification.update.status === 'completed'
                  ? 'border-l-green-500 bg-green-50'
                  : notification.update.status === 'generating'
                    ? 'border-l-blue-500 bg-blue-50'
                    : notification.update.status === 'failed'
                      ? 'border-l-red-500 bg-red-50'
                      : 'border-l-gray-500 bg-gray-50'
              }
              ${notification.dismissed ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(notification.update.status)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">
                    {getStatusMessage(notification.update)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Book ID: {notification.update.bookId}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    notification.update.status === 'completed'
                      ? 'success'
                      : notification.update.status === 'generating'
                        ? 'default'
                        : notification.update.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                  }
                  className="text-xs"
                >
                  {notification.update.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
    </div>
  )
}
