'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Save,
  RotateCcw,
} from 'lucide-react'

// Import all selector components
import {
  ArtStyleSelector,
  type ArtStyleProps,
} from './illustration-style-selector'
import {
  StoryLengthSelector,
  type StoryLengthProps,
} from './story-length-selector'
import { ThemeSelector, type ThemeProps } from './theme-selector'
import { StoryArcSelector, type StoryArcProps } from './story-arc-selector'

// Define the complete story configuration interface
interface StoryConfiguration {
  artStyle: ArtStyleProps | null
  storyLength: StoryLengthProps | null
  theme: ThemeProps | null
  storyArc: StoryArcProps | null
}

// Define validation rules
interface ValidationRule {
  field: keyof StoryConfiguration
  required: boolean
  message: string
}

const validationRules: ValidationRule[] = [
  {
    field: 'artStyle',
    required: true,
    message: 'Please select an illustration style',
  },
  {
    field: 'storyLength',
    required: true,
    message: 'Please choose a story length',
  },
  { field: 'theme', required: true, message: 'Please pick a story theme' },
  { field: 'storyArc', required: true, message: 'Please select a story arc' },
]

// Define wizard steps
interface WizardStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<any>
  field: keyof StoryConfiguration
}

const wizardSteps: WizardStep[] = [
  {
    id: 'art-style',
    title: 'Illustration Style',
    description: 'Choose the visual style for your story',
    component: ArtStyleSelector,
    field: 'artStyle',
  },
  {
    id: 'story-length',
    title: 'Story Length',
    description: 'Select how long your story should be',
    component: StoryLengthSelector,
    field: 'storyLength',
  },
  {
    id: 'theme',
    title: 'Story Theme',
    description: 'Pick the main theme for your adventure',
    component: ThemeSelector,
    field: 'theme',
  },
  {
    id: 'story-arc',
    title: 'Story Arc',
    description: 'Choose the narrative structure',
    component: StoryArcSelector,
    field: 'storyArc',
  },
]

// Local storage key for persistence
const STORAGE_KEY = 'story-customization-config'

interface StoryCustomizationWizardProps {
  onComplete?: (config: StoryConfiguration) => void
  onSave?: (config: StoryConfiguration) => void
  initialConfig?: Partial<StoryConfiguration>
}

const StoryCustomizationWizard: React.FC<StoryCustomizationWizardProps> = ({
  onComplete,
  onSave,
  initialConfig = {},
}) => {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [configuration, setConfiguration] = React.useState<StoryConfiguration>({
    artStyle: null,
    storyLength: null,
    theme: null,
    storyArc: null,
    ...initialConfig,
  })
  const [validationErrors, setValidationErrors] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Load configuration from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedConfig = JSON.parse(saved)
        setConfiguration(prev => ({ ...prev, ...parsedConfig }))
      }
    } catch (error) {
      console.error('Failed to load saved configuration:', error)
    }
  }, [])

  // Save configuration to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configuration))
    } catch (error) {
      console.error('Failed to save configuration:', error)
    }
  }, [configuration])

  // Validate current configuration
  const validateConfiguration = (): string[] => {
    const errors: string[] = []

    validationRules.forEach(rule => {
      if (rule.required && !configuration[rule.field]) {
        errors.push(rule.message)
      }
    })

    return errors
  }

  // Check if current step is valid
  const isCurrentStepValid = (): boolean => {
    const currentStepConfig = wizardSteps[currentStep]
    return configuration[currentStepConfig.field] !== null
  }

  // Calculate progress percentage
  const getProgress = (): number => {
    const completedSteps = wizardSteps.filter(
      step => configuration[step.field] !== null
    ).length
    return (completedSteps / wizardSteps.length) * 100
  }

  // Handle selection updates
  const handleSelectionUpdate = (
    field: keyof StoryConfiguration,
    value: any
  ) => {
    setConfiguration(prev => ({
      ...prev,
      [field]: value,
    }))

    // Clear validation errors when user makes a selection
    setValidationErrors([])
  }

  // Handle navigation
  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Handle save
  const handleSave = async () => {
    setIsLoading(true)
    try {
      if (onSave) {
        await onSave(configuration)
      }
      // Show success feedback
      setTimeout(() => setIsLoading(false), 500)
    } catch (error) {
      console.error('Failed to save configuration:', error)
      setIsLoading(false)
    }
  }

  // Handle completion
  const handleComplete = () => {
    const errors = validateConfiguration()

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    if (onComplete) {
      onComplete(configuration)
    }
  }

  // Handle reset
  const handleReset = () => {
    setConfiguration({
      artStyle: null,
      storyLength: null,
      theme: null,
      storyArc: null,
    })
    setCurrentStep(0)
    setValidationErrors([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const currentStepConfig = wizardSteps[currentStep]
  const CurrentStepComponent = currentStepConfig.component
  const progress = getProgress()
  const isComplete = progress === 100

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1
          className="text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Create Your Perfect Story
        </motion.h1>
        <motion.p
          className="text-muted-foreground max-w-2xl mx-auto mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Customize every aspect of your children's story to create a unique and
          engaging experience.
        </motion.p>

        {/* Progress */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {wizardSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <motion.button
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  'whitespace-nowrap',
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : configuration[step.field]
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                onClick={() => setCurrentStep(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {configuration[step.field] ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-current" />
                )}
                {step.title}
              </motion.button>
              {index < wizardSteps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentStepConfig.title}
                {configuration[currentStepConfig.field] && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {currentStepConfig.description}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {wizardSteps.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                onStyleSelect={(value: any) =>
                  handleSelectionUpdate('artStyle', value)
                }
                onLengthSelect={(value: any) =>
                  handleSelectionUpdate('storyLength', value)
                }
                onThemeSelect={(value: any) =>
                  handleSelectionUpdate('theme', value)
                }
                onArcSelect={(value: any) =>
                  handleSelectionUpdate('storyArc', value)
                }
              />
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive mb-2">
                      Please complete all required selections:
                    </h4>
                    <ul className="space-y-1">
                      {validationErrors.map((error, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground"
                        >
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button
            variant="outline"
            onClick={handleReset}
            className="text-destructive hover:text-destructive"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isLoading || progress === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Progress'}
          </Button>

          {currentStep < wizardSteps.length - 1 ? (
            <Button onClick={handleNext} disabled={!isCurrentStepValid()}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Create Story
            </Button>
          )}
        </div>
      </div>

      {/* Configuration Summary */}
      {progress > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Story Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {wizardSteps.map(step => {
                  const value = configuration[step.field]
                  return (
                    <div key={step.id} className="text-center">
                      <h4 className="font-semibold text-sm mb-2">
                        {step.title}
                      </h4>
                      {value ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          {value.title}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not selected</Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export { StoryCustomizationWizard, type StoryConfiguration }
