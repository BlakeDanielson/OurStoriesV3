'use client'

import { useState } from 'react'
import { createChildProfile, updateChildProfile } from '@/lib/auth/rls-helpers'
import { coppaConfig } from '@/lib/auth/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Save,
  X,
  Plus,
  User,
  Calendar,
  BookOpen,
  Heart,
} from 'lucide-react'

interface ChildProfile {
  id: string
  name: string
  age: number | null
  reading_level: string | null
  interests: string[] | null
  parent_id: string
  created_at: string | null
  updated_at: string | null
}

interface ChildProfileFormProps {
  childProfile?: ChildProfile | null
  onSave: () => Promise<void>
  onCancel: () => void
}

interface FormData {
  name: string
  age: string
  reading_level: string
  interests: string[]
}

interface FormErrors {
  name?: string
  age?: string
  reading_level?: string
}

const READING_LEVELS = [
  { value: 'beginner', label: 'Beginner (Ages 3-5)' },
  { value: 'early', label: 'Early Reader (Ages 5-7)' },
  { value: 'developing', label: 'Developing Reader (Ages 7-9)' },
  { value: 'fluent', label: 'Fluent Reader (Ages 9-12)' },
  { value: 'advanced', label: 'Advanced Reader (Ages 12+)' },
]

const COMMON_INTERESTS = [
  'Animals',
  'Adventure',
  'Fantasy',
  'Science',
  'Sports',
  'Music',
  'Art',
  'Space',
  'Dinosaurs',
  'Princesses',
  'Superheroes',
  'Nature',
  'Cars',
  'Cooking',
  'Magic',
  'Friendship',
  'Family',
  'School',
]

export function ChildProfileForm({
  childProfile,
  onSave,
  onCancel,
}: ChildProfileFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: childProfile?.name || '',
    age: childProfile?.age?.toString() || '',
    reading_level: childProfile?.reading_level || '',
    interests: childProfile?.interests || [],
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newInterest, setNewInterest] = useState('')

  const isEditing = !!childProfile

  // Validate form fields
  const validateField = (
    name: keyof FormData,
    value: string | string[]
  ): string | undefined => {
    switch (name) {
      case 'name':
        if (
          !value ||
          (typeof value === 'string' && value.trim().length === 0)
        ) {
          return 'Child name is required'
        }
        if (typeof value === 'string' && value.length < 2) {
          return 'Name must be at least 2 characters'
        }
        if (typeof value === 'string' && value.length > 50) {
          return 'Name must be no more than 50 characters'
        }
        break
      case 'age':
        if (
          !value ||
          (typeof value === 'string' && value.trim().length === 0)
        ) {
          return 'Age is required'
        }
        const age = parseInt(value as string)
        if (isNaN(age) || age < 1 || age > 18) {
          return 'Age must be between 1 and 18'
        }
        break
      case 'reading_level':
        if (
          !value ||
          (typeof value === 'string' && value.trim().length === 0)
        ) {
          return 'Reading level is required'
        }
        break
    }
    return undefined
  }

  // Validate entire form
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    const nameError = validateField('name', formData.name)
    const ageError = validateField('age', formData.age)
    const readingLevelError = validateField(
      'reading_level',
      formData.reading_level
    )

    if (nameError) errors.name = nameError
    if (ageError) errors.age = ageError
    if (readingLevelError) errors.reading_level = readingLevelError

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const fieldName = name as keyof FormData

    setFormData(prev => ({ ...prev, [fieldName]: value }))

    // Clear field error when user starts typing (only for fields that exist in FormErrors)
    if (
      fieldName !== 'interests' &&
      formErrors[fieldName as keyof FormErrors]
    ) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName as keyof FormErrors]: undefined,
      }))
    }

    // Clear global error
    if (error) setError(null)
  }

  // Handle select changes
  const handleSelectChange = (name: keyof FormErrors, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear field error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }

    // Clear global error
    if (error) setError(null)
  }

  // Handle adding interest
  const handleAddInterest = (interest: string) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest],
      }))
    }
    setNewInterest('')
  }

  // Handle removing interest
  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest),
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const childData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        reading_level: formData.reading_level,
        interests: formData.interests,
        // Add required fields with default values
        avatar_url: null,
        favorite_characters: null,
        preferences: {},
      }

      if (isEditing && childProfile) {
        await updateChildProfile(childProfile.id, childData)
      } else {
        await createChildProfile(childData)
      }

      await onSave()
    } catch (err) {
      console.error('Child profile save error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to save child profile'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const childAge = parseInt(formData.age)
  const requiresParentalConsent =
    !isNaN(childAge) && childAge < coppaConfig.minimumAge

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            Children under {coppaConfig.minimumAge} require special privacy
            protections under COPPA.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Child's Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter child's name"
              value={formData.name}
              onChange={handleInputChange}
              className={`pl-10 ${formErrors.name ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
              autoComplete="given-name"
            />
          </div>
          {formErrors.name && (
            <p className="text-sm text-red-500">{formErrors.name}</p>
          )}
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
              placeholder="Enter age"
              value={formData.age}
              onChange={handleInputChange}
              className={`pl-10 ${formErrors.age ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
              min="1"
              max="18"
            />
          </div>
          {formErrors.age && (
            <p className="text-sm text-red-500">{formErrors.age}</p>
          )}
        </div>
      </div>

      {/* Reading Level Field */}
      <div className="space-y-2">
        <Label htmlFor="reading_level">Reading Level</Label>
        <select
          value={formData.reading_level}
          onChange={e => handleSelectChange('reading_level', e.target.value)}
          disabled={isSubmitting}
          className={formErrors.reading_level ? 'border-red-500' : ''}
        >
          <option value="">Select reading level</option>
          {READING_LEVELS.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
        {formErrors.reading_level && (
          <p className="text-sm text-red-500">{formErrors.reading_level}</p>
        )}
      </div>

      {/* Interests Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-muted-foreground" />
          <Label>Interests (Optional)</Label>
        </div>

        {/* Current Interests */}
        {formData.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-1 hover:text-red-500"
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add Interest */}
        <div className="flex gap-2">
          <Input
            placeholder="Add an interest..."
            value={newInterest}
            onChange={e => setNewInterest(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddInterest(newInterest)
              }
            }}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddInterest(newInterest)}
            disabled={isSubmitting || !newInterest.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Common Interests */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Or choose from common interests:
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_INTERESTS.filter(
              interest => !formData.interests.includes(interest)
            ).map(interest => (
              <Button
                key={interest}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddInterest(interest)}
                disabled={isSubmitting}
                className="text-xs"
              >
                {interest}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Profile' : 'Create Profile'}
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
