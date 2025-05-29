'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  User,
  Heart,
  Gamepad2,
  Star,
  CheckCircle,
} from 'lucide-react'
import {
  childProfileFormSchema,
  type ChildProfileFormData,
  basicInfoSchema,
  personalityTraitsSchema,
  hobbiesInterestsSchema,
  optionalDetailsSchema,
} from '@/lib/validations/child-profile'
import { createChildProfile } from '@/lib/auth/rls-helpers'

// Step components
import { BasicInfoStep } from './child-profile-steps/basic-info-step'
import { PersonalityTraitsStep } from './child-profile-steps/personality-traits-step'
import { HobbiesInterestsStep } from './child-profile-steps/hobbies-interests-step'
import { OptionalDetailsStep } from './child-profile-steps/optional-details-step'
import { ReviewStep } from './child-profile-steps/review-step'

interface ChildProfileCreationFormProps {
  onSuccess?: (childProfile: any) => void
  onCancel?: () => void
}

const STEPS = [
  {
    id: 1,
    title: 'Basic Info',
    description: 'Name and age',
    icon: User,
    schema: basicInfoSchema,
  },
  {
    id: 2,
    title: 'Personality',
    description: 'Character traits',
    icon: Heart,
    schema: personalityTraitsSchema,
  },
  {
    id: 3,
    title: 'Interests',
    description: 'Hobbies and activities',
    icon: Gamepad2,
    schema: hobbiesInterestsSchema,
  },
  {
    id: 4,
    title: 'Details',
    description: 'Optional information',
    icon: Star,
    schema: optionalDetailsSchema,
  },
  {
    id: 5,
    title: 'Review',
    description: 'Confirm and submit',
    icon: CheckCircle,
    schema: childProfileFormSchema,
  },
]

const STORAGE_KEY = 'child-profile-form-data'

export function ChildProfileCreationForm({
  onSuccess,
  onCancel,
}: ChildProfileCreationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Initialize form with default values and localStorage data
  const form = useForm<ChildProfileFormData>({
    resolver: zodResolver(childProfileFormSchema),
    defaultValues: {
      name: '',
      age: 0,
      traits: [],
      customTraits: [],
      interests: [],
      customInterests: [],
      favoriteColor: '',
      favoriteFoods: [],
      petName: '',
      specialMoments: '',
      favoriteCharacters: [],
      readingLevel: undefined,
      additionalNotes: '',
    },
    mode: 'onChange',
  })

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        // Reset form with saved data
        form.reset(parsedData)
      } catch (error) {
        console.error('Failed to load saved form data:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [form])

  // Save form data to localStorage whenever form values change
  useEffect(() => {
    const subscription = form.watch(data => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save form data:', error)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const currentStepConfig = STEPS.find(step => step.id === currentStep)
  const progress = (currentStep / STEPS.length) * 100

  // Validate current step before allowing navigation
  const validateCurrentStep = async () => {
    const currentStepSchema = currentStepConfig?.schema
    if (!currentStepSchema) return true

    try {
      const formData = form.getValues()
      await currentStepSchema.parseAsync(formData)
      return true
    } catch (error) {
      // Trigger validation to show errors
      await form.trigger()
      return false
    }
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = async (stepId: number) => {
    // Only allow navigation to previous steps or if current step is valid
    if (stepId < currentStep) {
      setCurrentStep(stepId)
    } else if (stepId === currentStep + 1) {
      const isValid = await validateCurrentStep()
      if (isValid) {
        setCurrentStep(stepId)
      }
    }
  }

  const handleSubmit = async (data: ChildProfileFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Transform form data to match database schema
      const childProfileData = {
        name: data.name,
        age: data.age,
        interests: [...data.interests, ...data.customInterests],
        favorite_characters: data.favoriteCharacters,
        reading_level: data.readingLevel || null,
        avatar_url: null,
        preferences: {
          personality_traits: [...data.traits, ...data.customTraits],
          favorite_color: data.favoriteColor,
          favorite_foods: data.favoriteFoods,
          pet_name: data.petName,
          special_moments: data.specialMoments,
          additional_notes: data.additionalNotes,
        },
      }

      const newChildProfile = await createChildProfile(childProfileData)

      // Clear saved form data
      localStorage.removeItem(STORAGE_KEY)

      // Call success callback
      onSuccess?.(newChildProfile)
    } catch (error) {
      console.error('Failed to create child profile:', error)
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to create child profile'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep />
      case 2:
        return <PersonalityTraitsStep />
      case 3:
        return <HobbiesInterestsStep />
      case 4:
        return <OptionalDetailsStep />
      case 5:
        return <ReviewStep onSubmit={() => form.handleSubmit(handleSubmit)()} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Create Child Profile</CardTitle>
              <CardDescription>
                Step {currentStep} of {STEPS.length}:{' '}
                {currentStepConfig?.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep
              const isClickable =
                step.id <= currentStep || step.id === currentStep + 1

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isClickable}
                    className={`
                      flex flex-col items-center space-y-2 p-3 rounded-lg transition-colors
                      ${isActive ? 'bg-primary text-primary-foreground' : ''}
                      ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                      ${isClickable && !isActive && !isCompleted ? 'hover:bg-muted' : ''}
                      ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs opacity-75">
                        {step.description}
                      </div>
                    </div>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-px bg-border mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <FormProvider {...form}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStepConfig && (
                <currentStepConfig.icon className="h-5 w-5" />
              )}
              <span>{currentStepConfig?.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Error Display */}
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? onCancel : handlePrevious}
                disabled={isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </Button>

              <div className="flex items-center space-x-2">
                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit(handleSubmit)()}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Profile
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </FormProvider>
    </div>
  )
}
