'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { validationRules } from '@/lib/auth/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, User, Mail } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  created_at: string | null
  updated_at: string | null
}

interface UserProfileFormProps {
  userProfile: UserProfile | null
  onUpdate: () => Promise<void>
}

interface FormData {
  full_name: string
  email: string
}

interface FormErrors {
  full_name?: string
  email?: string
}

export function UserProfileForm({
  userProfile,
  onUpdate,
}: UserProfileFormProps) {
  const [formData, setFormData] = useState<FormData>({
    full_name: userProfile?.full_name || '',
    email: userProfile?.email || '',
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validate form fields
  const validateField = (
    name: keyof FormData,
    value: string
  ): string | undefined => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required'
        if (!validationRules.email.pattern.test(value)) {
          return validationRules.email.message
        }
        break
      case 'full_name':
        if (!value) return 'Full name is required'
        if (value.length < validationRules.name.minLength) {
          return `Name must be at least ${validationRules.name.minLength} characters`
        }
        if (value.length > validationRules.name.maxLength) {
          return `Name must be no more than ${validationRules.name.maxLength} characters`
        }
        if (!validationRules.name.pattern.test(value)) {
          return validationRules.name.message
        }
        break
    }
    return undefined
  }

  // Validate entire form
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof FormData
      const error = validateField(fieldName, formData[fieldName])
      if (error) {
        errors[fieldName] = error
      }
    })

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const fieldName = name as keyof FormData

    setFormData(prev => ({ ...prev, [fieldName]: value }))

    // Clear field error when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: undefined }))
    }

    // Clear global error and success
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!userProfile) {
      setError('User profile not found')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createBrowserSupabaseClient()

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          email: formData.email,
        })
        .eq('id', userProfile.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Update auth user email if it changed
      if (formData.email !== userProfile.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email,
        })

        if (authError) {
          throw new Error(`Failed to update email: ${authError.message}`)
        }
      }

      setSuccess(true)
      await onUpdate() // Refresh parent data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Profile update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if form has changes
  const hasChanges =
    formData.full_name !== (userProfile?.full_name || '') ||
    formData.email !== (userProfile?.email || '')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert>
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={handleInputChange}
            className={`pl-10 ${formErrors.full_name ? 'border-red-500' : ''}`}
            disabled={isSubmitting}
            autoComplete="name"
          />
        </div>
        {formErrors.full_name && (
          <p className="text-sm text-red-500">{formErrors.full_name}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
            disabled={isSubmitting}
            autoComplete="email"
          />
        </div>
        {formErrors.email && (
          <p className="text-sm text-red-500">{formErrors.email}</p>
        )}
        {formData.email !== userProfile?.email && (
          <p className="text-sm text-amber-600">
            Changing your email will require verification
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !hasChanges}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating profile...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>

      {!hasChanges && (
        <p className="text-sm text-muted-foreground text-center">
          Make changes to enable the save button
        </p>
      )}
    </form>
  )
}
