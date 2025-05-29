'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

export function EmailVerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuth()

  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [canResend, setCanResend] = useState(true)

  // Get email from URL params or user context
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else if (user?.email) {
      setEmail(user.email)
    }
  }, [searchParams, user])

  // Handle resend cooldown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Check if user is already verified
  useEffect(() => {
    if (user?.email_confirmed_at) {
      router.push('/dashboard?verified=true')
    }
  }, [user, router])

  const handleResendVerification = async () => {
    if (!email || !canResend) return

    setIsResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      // Import supabase client
      const { createBrowserSupabaseClient } = await import('@/lib/supabase')
      const supabase = createBrowserSupabaseClient()

      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      })

      if (error) {
        setResendError(error.message)
      } else {
        setResendSuccess(true)
        setCanResend(false)
        setTimeLeft(60) // 60 second cooldown

        // Reset success message after 5 seconds
        setTimeout(() => {
          setResendSuccess(false)
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error)
      setResendError('Failed to resend verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setResendError('')
    setResendSuccess(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Check your email
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            We've sent a verification link to your email address
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email Display */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
            className="w-full"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Check your email inbox for a message from ourStories</li>
                <li>Click the "Confirm Email Address" button in the email</li>
                <li>
                  You'll be automatically signed in and redirected to your
                  dashboard
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {resendSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Verification email sent successfully! Check your inbox.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {resendError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {resendError}
            </AlertDescription>
          </Alert>
        )}

        {/* Resend Section */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive the email? Check your spam folder or resend it.
            </p>

            <Button
              onClick={handleResendVerification}
              disabled={isResending || !canResend || !email}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : !canResend ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Resend in {formatTime(timeLeft)}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend verification email
                </>
              )}
            </Button>
          </div>

          {/* Email Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Email not arriving?</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure {email} is correct</li>
                  <li>Add noreply@ourStories.com to your contacts</li>
                  <li>Wait a few minutes - emails can take time to arrive</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Continue to Dashboard
          </Button>

          <div className="flex space-x-3">
            <Button onClick={handleSignOut} variant="ghost" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sign out
            </Button>

            <Button asChild variant="ghost" className="flex-1">
              <Link href="/auth/signin">Back to Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-gray-500">
            Having trouble? Contact our{' '}
            <Link
              href="/support"
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              support team
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
