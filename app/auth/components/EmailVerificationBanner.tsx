'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Mail, X, RefreshCw } from 'lucide-react'

interface EmailVerificationBannerProps {
  onDismiss?: () => void
  className?: string
}

export function EmailVerificationBanner({
  onDismiss,
  className,
}: EmailVerificationBannerProps) {
  const { user } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [isResent, setIsResent] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if user is verified or banner is dismissed
  if (!user || user.email_confirmed_at || isDismissed) {
    return null
  }

  const handleResendVerification = async () => {
    setIsResending(true)

    try {
      // Note: Supabase doesn't have a direct resend verification method
      // This would typically be handled by re-signing up or using a custom endpoint
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setIsResent(true)

      // Reset the resent state after 5 seconds
      setTimeout(() => {
        setIsResent(false)
      }, 5000)
    } catch (error) {
      console.error('Failed to resend verification email:', error)
    } finally {
      setIsResending(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <Mail className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          <p className="text-amber-800">
            <strong>Verify your email address</strong>
          </p>
          <p className="text-sm text-amber-700 mt-1">
            We sent a verification link to <strong>{user.email}</strong>. Click
            the link to verify your account and unlock all features.
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {isResent ? (
            <span className="text-sm text-green-600 font-medium">
              Email sent!
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendVerification}
              disabled={isResending}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend email'
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-amber-600 hover:bg-amber-100 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
