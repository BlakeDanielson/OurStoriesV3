'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createBrowserSupabaseClient()

        // Get the auth code from URL parameters
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        const type = searchParams.get('type')

        if (error) {
          setStatus('error')
          setMessage(errorDescription || 'Authentication failed')
          return
        }

        if (code) {
          // Exchange the code for a session
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            setStatus('error')
            setMessage(exchangeError.message)
            return
          }

          if (data.session) {
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')

            // Redirect based on the type of auth flow
            setTimeout(() => {
              if (type === 'recovery') {
                router.push('/auth/update-password')
              } else if (type === 'email_change') {
                router.push('/profile?message=email_updated')
              } else {
                router.push('/dashboard')
              }
            }, 2000)
          }
        } else {
          // Handle other auth flows (email confirmation, password recovery, etc.)
          const { error: sessionError } = await supabase.auth.getSession()

          if (sessionError) {
            setStatus('error')
            setMessage(sessionError.message)
            return
          }

          setStatus('success')
          setMessage('Authentication successful! Redirecting...')

          setTimeout(() => {
            if (type === 'signup') {
              router.push('/dashboard?welcome=true')
            } else if (type === 'recovery') {
              router.push('/auth/update-password')
            } else if (type === 'email_change') {
              router.push('/profile?message=email_updated')
            } else {
              router.push('/dashboard')
            }
          }, 2000)
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred during authentication')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Completing authentication...'
      case 'success':
        return 'Authentication successful!'
      case 'error':
        return 'Authentication failed'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{getIcon()}</div>
          <CardTitle className="text-xl">{getTitle()}</CardTitle>
          <CardDescription>
            {status === 'loading' &&
              'Please wait while we complete your authentication...'}
            {status === 'success' && 'You will be redirected shortly.'}
            {status === 'error' &&
              'There was a problem with your authentication.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {message && (
            <Alert variant={status === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <div className="mt-4 text-center">
              <a
                href="/auth/signin"
                className="text-sm text-primary hover:underline"
              >
                Return to sign in
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
          <CardTitle className="text-xl">Loading...</CardTitle>
          <CardDescription>Preparing authentication...</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
