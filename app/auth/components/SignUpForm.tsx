'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { validationRules, coppaConfig } from '@/lib/auth/config'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Github,
  Calendar,
} from 'lucide-react'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  age: string
  agreeToTerms: boolean
  agreeToPrivacy: boolean
  parentalConsent: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  age?: string
  agreeToTerms?: string
  agreeToPrivacy?: string
  parentalConsent?: string
}

export function SignUpForm() {
  const router = useRouter()
  const { signUp, signInWithOAuth, loading, error, clearError } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    age: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    parentalConsent: false,
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isUnderAge = parseInt(formData.age) < coppaConfig.minimumAge
  const requiresParentalConsent =
    isUnderAge && coppaConfig.requireParentalConsent

  // Validate form fields
  const validateField = (
    name: keyof FormData,
    value: string | boolean
  ): string | undefined => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required'
        if (!validationRules.email.pattern.test(value as string)) {
          return validationRules.email.message
        }
        break
      case 'password':
        if (!value) return 'Password is required'
        if ((value as string).length < validationRules.password.minLength) {
          return `Password must be at least ${validationRules.password.minLength} characters`
        }
        if (!validationRules.password.pattern.test(value as string)) {
          return validationRules.password.message
        }
        break
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== formData.password) {
          return 'Passwords do not match'
        }
        break
      case 'firstName':
        if (!value) return 'First name is required'
        if ((value as string).length < validationRules.name.minLength) {
          return `First name must be at least ${validationRules.name.minLength} characters`
        }
        if (!validationRules.name.pattern.test(value as string)) {
          return validationRules.name.message
        }
        break
      case 'lastName':
        if (!value) return 'Last name is required'
        if ((value as string).length < validationRules.name.minLength) {
          return `Last name must be at least ${validationRules.name.minLength} characters`
        }
        if (!validationRules.name.pattern.test(value as string)) {
          return validationRules.name.message
        }
        break
      case 'age':
        if (!value) return 'Age is required'
        const age = parseInt(value as string)
        if (
          isNaN(age) ||
          age < validationRules.age.min ||
          age > validationRules.age.max
        ) {
          return validationRules.age.message
        }
        break
      case 'agreeToTerms':
        if (!value) return 'You must agree to the Terms of Service'
        break
      case 'agreeToPrivacy':
        if (!value) return 'You must agree to the Privacy Policy'
        break
      case 'parentalConsent':
        if (requiresParentalConsent && !value) {
          return 'Parental consent is required for users under 13'
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
    const { name, value, type, checked } = e.target
    const fieldName = name as keyof FormData
    const fieldValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }))

    // Clear field error when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: undefined }))
    }

    // Clear global error
    if (error) {
      clearError()
    }
  }

  // Handle checkbox changes
  const handleCheckboxChange = (name: keyof FormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))

    // Clear field error when user checks
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }

    // Clear global error
    if (error) {
      clearError()
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const metadata = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        age: parseInt(formData.age),
        requires_parental_consent: requiresParentalConsent,
        parental_consent_given: formData.parentalConsent,
      }

      const result = await signUp(formData.email, formData.password, metadata)

      if (result.success) {
        router.push('/auth/verify-email')
      }
    } catch (err) {
      console.error('Sign up error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle OAuth sign up
  const handleOAuthSignUp = async (
    provider: 'google' | 'github' | 'facebook'
  ) => {
    try {
      const result = await signInWithOAuth(provider)
      if (result.success) {
        // OAuth will redirect, so we don't need to do anything here
      }
    } catch (err) {
      console.error('OAuth sign up error:', err)
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create account
        </CardTitle>
        <CardDescription className="text-center">
          Join ourStories and start creating magical stories
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Global Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* COPPA Notice */}
        {requiresParentalConsent && (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Users under 13 require parental consent to create an account.
            </AlertDescription>
          </Alert>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignUp('google')}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignUp('facebook')}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            Continue with Facebook
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthSignUp('github')}
            disabled={isLoading}
          >
            <Github className="w-4 h-4 mr-2" />
            Continue with GitHub
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`pl-10 ${formErrors.firstName ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="given-name"
                />
              </div>
              {formErrors.firstName && (
                <p className="text-sm text-red-500">{formErrors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`pl-10 ${formErrors.lastName ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="family-name"
                />
              </div>
              {formErrors.lastName && (
                <p className="text-sm text-red-500">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Age Field */}
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="Your age"
                value={formData.age}
                onChange={handleInputChange}
                className={`pl-10 ${formErrors.age ? 'border-red-500' : ''}`}
                disabled={isLoading}
                min="1"
                max="120"
              />
            </div>
            {formErrors.age && (
              <p className="text-sm text-red-500">{formErrors.age}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {formErrors.email && (
              <p className="text-sm text-red-500">{formErrors.email}</p>
            )}
          </div>

          {/* Password Fields */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                className={`pl-10 pr-10 ${formErrors.password ? 'border-red-500' : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {formErrors.password && (
              <p className="text-sm text-red-500">{formErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`pl-10 pr-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {formErrors.confirmPassword && (
              <p className="text-sm text-red-500">
                {formErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Agreements */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={checked =>
                  handleCheckboxChange('agreeToTerms', checked as boolean)
                }
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="agreeToTerms"
                  className="text-sm font-normal cursor-pointer"
                >
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                </Label>
                {formErrors.agreeToTerms && (
                  <p className="text-sm text-red-500">
                    {formErrors.agreeToTerms}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToPrivacy"
                checked={formData.agreeToPrivacy}
                onCheckedChange={checked =>
                  handleCheckboxChange('agreeToPrivacy', checked as boolean)
                }
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="agreeToPrivacy"
                  className="text-sm font-normal cursor-pointer"
                >
                  I agree to the{' '}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
                {formErrors.agreeToPrivacy && (
                  <p className="text-sm text-red-500">
                    {formErrors.agreeToPrivacy}
                  </p>
                )}
              </div>
            </div>

            {requiresParentalConsent && (
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="parentalConsent"
                  checked={formData.parentalConsent}
                  onCheckedChange={checked =>
                    handleCheckboxChange('parentalConsent', checked as boolean)
                  }
                  disabled={isLoading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="parentalConsent"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I have parental consent to create this account
                  </Label>
                  {formErrors.parentalConsent && (
                    <p className="text-sm text-red-500">
                      {formErrors.parentalConsent}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
