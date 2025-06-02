'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { getUserChildren } from '@/lib/auth/rls-helpers'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Users,
  Palette,
  Wand2,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { ChildProfile } from '@/lib/types/database/profiles'

interface StoryFormData {
  childProfileId: string
  title: string
  description: string
  theme: string
  storyArc: string
  illustrationStyle: string
  storyLength: 'short' | 'medium' | 'long'
  customPrompt: string
}

const THEMES = [
  {
    value: 'adventure',
    label: 'Adventure',
    description: 'Exciting journeys and exploration',
  },
  {
    value: 'friendship',
    label: 'Friendship',
    description: 'Stories about making friends and teamwork',
  },
  {
    value: 'family',
    label: 'Family',
    description: 'Heartwarming family moments and bonds',
  },
  {
    value: 'animals',
    label: 'Animals',
    description: 'Fun adventures with animal friends',
  },
  {
    value: 'magic',
    label: 'Magic',
    description: 'Enchanting tales of wonder and spells',
  },
  {
    value: 'science',
    label: 'Science',
    description: 'Discovery and learning through exploration',
  },
  {
    value: 'space',
    label: 'Space',
    description: 'Cosmic adventures among the stars',
  },
  {
    value: 'underwater',
    label: 'Underwater',
    description: 'Ocean depths and sea creatures',
  },
]

const STORY_ARCS = [
  {
    value: 'hero-journey',
    label: "Hero's Journey",
    description: 'Classic adventure with challenges to overcome',
  },
  {
    value: 'problem-solution',
    label: 'Problem & Solution',
    description: 'Identifying and solving a challenge',
  },
  {
    value: 'discovery',
    label: 'Discovery',
    description: 'Finding something new and wonderful',
  },
  {
    value: 'transformation',
    label: 'Transformation',
    description: 'Growing and changing through experience',
  },
  {
    value: 'friendship',
    label: 'Making Friends',
    description: 'Building new relationships and connections',
  },
]

const ILLUSTRATION_STYLES = [
  {
    value: 'cartoon',
    label: 'Cartoon',
    description: 'Fun, colorful, and playful illustrations',
  },
  {
    value: 'watercolor',
    label: 'Watercolor',
    description: 'Soft, dreamy, artistic paintings',
  },
  {
    value: 'digital_art',
    label: 'Digital Art',
    description: 'Modern, vibrant digital illustrations',
  },
  {
    value: 'realistic',
    label: 'Realistic',
    description: 'Lifelike and detailed artwork',
  },
  {
    value: 'anime',
    label: 'Anime',
    description: 'Japanese-inspired character style',
  },
  {
    value: 'storybook',
    label: 'Classic Storybook',
    description: "Traditional children's book style",
  },
]

const STORY_LENGTHS = [
  {
    value: 'short',
    label: 'Short Story',
    description: '3-5 pages • 5-10 minutes',
    pages: '3-5',
  },
  {
    value: 'medium',
    label: 'Medium Story',
    description: '6-10 pages • 10-15 minutes',
    pages: '6-10',
  },
  {
    value: 'long',
    label: 'Long Story',
    description: '11-15 pages • 15-20 minutes',
    pages: '11-15',
  },
]

export default function CreateStoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<StoryFormData>({
    childProfileId: '',
    title: '',
    description: '',
    theme: '',
    storyArc: '',
    illustrationStyle: '',
    storyLength: 'medium',
    customPrompt: '',
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  useEffect(() => {
    if (user) {
      loadChildren()
    }
  }, [user])

  useEffect(() => {
    // Pre-select child if provided in URL
    const childId = searchParams.get('child')
    if (childId && children.length > 0) {
      setFormData(prev => ({ ...prev, childProfileId: childId }))
    }
  }, [searchParams, children])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const childrenData = await getUserChildren()
      setChildren(childrenData)
    } catch (err) {
      console.error('Failed to load children:', err)
      setError('Failed to load children profiles')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof StoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.childProfileId !== ''
      case 2:
        return formData.title.trim() !== ''
      case 3:
        return formData.theme !== ''
      case 4:
        return formData.storyArc !== '' && formData.illustrationStyle !== ''
      case 5:
        return true // Review step
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleCreateStory = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/books/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create story')
      }

      const book = await response.json()

      toast.success('Story creation started!', {
        description:
          'Your personalized book is being generated. You can track progress in your dashboard.',
      })

      // Redirect to dashboard or book page
      router.push(`/dashboard?tab=books`)
    } catch (err) {
      console.error('Failed to create story:', err)
      setError(err instanceof Error ? err.message : 'Failed to create story')
      toast.error('Failed to create story', {
        description:
          'Please try again or contact support if the problem persists.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading story creation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to create stories.{' '}
            <Link href="/auth/signin" className="underline">
              Sign in here
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              No children profiles found
            </h3>
            <p className="text-muted-foreground mb-6">
              You need to add at least one child profile before creating stories
            </p>
            <Button asChild>
              <Link href="/profile?tab=children">
                <Users className="h-4 w-4 mr-2" />
                Add Child Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedChild = children.find(
    child => child.id === formData.childProfileId
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Create Your Story</h1>
          <p className="text-muted-foreground">
            Let's create a magical, personalized storybook
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card className="mb-8">
        <CardContent className="p-8">
          {/* Step 1: Select Child */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h2 className="text-2xl font-semibold mb-2">
                  Choose Your Child
                </h2>
                <p className="text-muted-foreground">
                  Select which child this story will be personalized for
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map(child => (
                  <Card
                    key={child.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.childProfileId === child.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : ''
                    }`}
                    onClick={() =>
                      handleInputChange('childProfileId', child.id)
                    }
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {child.name}
                          </h3>
                          <p className="text-muted-foreground">
                            Age {child.age} •{' '}
                            {child.reading_level || 'Beginner'}
                          </p>
                          {child.interests && child.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {child.interests.slice(0, 3).map(interest => (
                                <Badge
                                  key={interest}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {interest}
                                </Badge>
                              ))}
                              {child.interests.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{child.interests.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {formData.childProfileId === child.id && (
                          <CheckCircle className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Story Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-semibold mb-2">Story Details</h2>
                <p className="text-muted-foreground">
                  Give your story a title and description
                </p>
              </div>

              {selectedChild && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-700">
                    Creating story for <strong>{selectedChild.name}</strong>
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Story Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    placeholder={`${selectedChild?.name}'s Amazing Adventure`}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Story Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="A brief description of what this story will be about..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="storyLength">Story Length</Label>
                  <Select
                    value={formData.storyLength}
                    onValueChange={value =>
                      handleInputChange('storyLength', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORY_LENGTHS.map(length => (
                        <SelectItem key={length.value} value={length.value}>
                          <div>
                            <div className="font-medium">{length.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {length.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Theme Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h2 className="text-2xl font-semibold mb-2">Choose a Theme</h2>
                <p className="text-muted-foreground">
                  What kind of adventure should {selectedChild?.name} go on?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {THEMES.map(theme => (
                  <Card
                    key={theme.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.theme === theme.value
                        ? 'ring-2 ring-purple-500 bg-purple-50'
                        : ''
                    }`}
                    onClick={() => handleInputChange('theme', theme.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{theme.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {theme.description}
                          </p>
                        </div>
                        {formData.theme === theme.value && (
                          <CheckCircle className="h-5 w-5 text-purple-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Style & Structure */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <Palette className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h2 className="text-2xl font-semibold mb-2">
                  Style & Structure
                </h2>
                <p className="text-muted-foreground">
                  Choose how your story should look and flow
                </p>
              </div>

              {/* Story Arc */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Story Structure</h3>
                <div className="grid grid-cols-1 gap-3">
                  {STORY_ARCS.map(arc => (
                    <Card
                      key={arc.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        formData.storyArc === arc.value
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : ''
                      }`}
                      onClick={() => handleInputChange('storyArc', arc.value)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{arc.label}</h4>
                            <p className="text-sm text-muted-foreground">
                              {arc.description}
                            </p>
                          </div>
                          {formData.storyArc === arc.value && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Illustration Style */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Illustration Style
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ILLUSTRATION_STYLES.map(style => (
                    <Card
                      key={style.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        formData.illustrationStyle === style.value
                          ? 'ring-2 ring-orange-500 bg-orange-50'
                          : ''
                      }`}
                      onClick={() =>
                        handleInputChange('illustrationStyle', style.value)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{style.label}</h4>
                            <p className="text-sm text-muted-foreground">
                              {style.description}
                            </p>
                          </div>
                          {formData.illustrationStyle === style.value && (
                            <CheckCircle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Create */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-pink-500" />
                <h2 className="text-2xl font-semibold mb-2">Review & Create</h2>
                <p className="text-muted-foreground">
                  Review your story details and add any final touches
                </p>
              </div>

              {/* Review Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Story Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Child:
                      </span>
                      <p className="font-medium">{selectedChild?.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Title:
                      </span>
                      <p className="font-medium">{formData.title}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Length:
                      </span>
                      <p className="font-medium">
                        {
                          STORY_LENGTHS.find(
                            l => l.value === formData.storyLength
                          )?.label
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Style & Theme</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Theme:
                      </span>
                      <p className="font-medium">
                        {THEMES.find(t => t.value === formData.theme)?.label}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Story Arc:
                      </span>
                      <p className="font-medium">
                        {
                          STORY_ARCS.find(a => a.value === formData.storyArc)
                            ?.label
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Art Style:
                      </span>
                      <p className="font-medium">
                        {
                          ILLUSTRATION_STYLES.find(
                            s => s.value === formData.illustrationStyle
                          )?.label
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Custom Prompt */}
              <div>
                <Label htmlFor="customPrompt">
                  Additional Instructions (Optional)
                </Label>
                <Textarea
                  id="customPrompt"
                  value={formData.customPrompt}
                  onChange={e =>
                    handleInputChange('customPrompt', e.target.value)
                  }
                  placeholder="Any specific elements, characters, or details you'd like included in the story..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Create Button */}
              <div className="text-center pt-4">
                <Button
                  size="lg"
                  onClick={handleCreateStory}
                  disabled={isGenerating}
                  className="px-8"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Your Story...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Create My Story
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This usually takes 2-5 minutes to complete
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isGenerating}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNextStep() || isGenerating}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div /> // Empty div to maintain layout
        )}
      </div>
    </div>
  )
}
