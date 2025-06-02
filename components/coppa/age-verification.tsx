'use client'

import { useState } from 'react'
import { useCOPPA } from '@/lib/hooks/use-coppa'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, Shield, AlertTriangle } from 'lucide-react'

interface AgeVerificationProps {
  onVerificationComplete?: (isMinor: boolean) => void
  showTitle?: boolean
}

export function AgeVerification({
  onVerificationComplete,
  showTitle = true,
}: AgeVerificationProps) {
  const { updateDateOfBirth, loading, error, complianceStatus } = useCOPPA()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!dateOfBirth) {
      setLocalError('Please enter your date of birth')
      return
    }

    const birthDate = new Date(dateOfBirth)
    const today = new Date()

    // Validate date
    if (isNaN(birthDate.getTime())) {
      setLocalError('Please enter a valid date')
      return
    }

    if (birthDate > today) {
      setLocalError('Date of birth cannot be in the future')
      return
    }

    // Check if age is reasonable
    const age = today.getFullYear() - birthDate.getFullYear()
    if (age > 120) {
      setLocalError('Please enter a valid date of birth')
      return
    }

    const success = await updateDateOfBirth(dateOfBirth)

    if (success && onVerificationComplete) {
      // Calculate if user is a minor
      const isMinor = age < 13
      onVerificationComplete(isMinor)
    }
  }

  const currentError = localError || error

  return (
    <Card className="w-full max-w-md mx-auto">
      {showTitle && (
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Age Verification</CardTitle>
          <CardDescription>
            We need to verify your age to ensure compliance with privacy
            regulations
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {currentError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{currentError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !dateOfBirth}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Verify Age
              </>
            )}
          </Button>
        </form>

        <div className="text-xs text-gray-500 text-center">
          <p>
            Your date of birth is used to ensure compliance with the Children's
            Online Privacy Protection Act (COPPA). If you are under 13, parental
            consent will be required.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
