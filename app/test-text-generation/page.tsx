'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
  Sparkles,
  User,
  Settings,
  AlertTriangle,
  Star,
} from 'lucide-react'

interface TextGenerationResult {
  success: boolean
  result?: {
    content: string
    contentType: string
    qualityScore?: number
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
      estimatedCost: number
    }
    metadata: {
      provider: string
      model: string
      generatedAt: string
      processingTimeMs: number
      safetyCheckPassed: boolean
      attemptCount: number
      fallbackUsed: boolean
      contentId?: string
    }
    qualityValidation?: {
      passesThreshold: boolean
      overallScore: number
      feedback: string[]
      recommendations: string[]
    }
  }
  error?: string
  details?: string
}

export default function TestTextGenerationPage() {
  const [prompt, setPrompt] = useState(
    'Create a magical adventure story where the child discovers a hidden garden with talking animals.'
  )
  const [contentType, setContentType] = useState<
    'story_outline' | 'story_content' | 'story_revision' | 'page_content'
  >('story_content')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TextGenerationResult | null>(null)
  const [error, setError] = useState('')

  // Child profile settings
  const [childName, setChildName] = useState('Emma')
  const [childAge, setChildAge] = useState(7)
  const [interests, setInterests] = useState('animals, magic, adventure')
  const [readingLevel, setReadingLevel] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('intermediate')
  const [personalityTraits, setPersonalityTraits] = useState(
    'curious, brave, kind'
  )
  const [hobbies, setHobbies] = useState('reading, drawing, exploring')

  // Story configuration
  const [theme, setTheme] = useState('magical-adventure')
  const [storyArc, setStoryArc] = useState('hero-journey')
  const [illustrationStyle, setIllustrationStyle] = useState('watercolor')
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>(
    'short'
  )
  const [educationalFocus, setEducationalFocus] = useState(
    'friendship and problem-solving'
  )

  // Generation options
  const [includeUsageStats, setIncludeUsageStats] = useState(true)
  const [skipQualityValidation, setSkipQualityValidation] = useState(true)
  const [qualityThreshold, setQualityThreshold] = useState(7.0)

  // For revisions
  const [originalContent, setOriginalContent] = useState('')
  const [revisionInstructions, setRevisionInstructions] = useState('')

  const generateText = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const requestBody = {
        prompt,
        contentType,
        childProfile: {
          id: 'test-child-001',
          name: childName,
          age: childAge,
          interests: interests.split(',').map(i => i.trim()),
          readingLevel,
          personalityTraits: personalityTraits.split(',').map(t => t.trim()),
          hobbies: hobbies.split(',').map(h => h.trim()),
        },
        storyConfig: {
          theme,
          storyArc,
          illustrationStyle,
          storyLength,
          educationalFocus,
        },
        options: {
          includeUsageStats,
          skipQualityValidation,
          qualityThreshold,
          userId: 'test-user-001',
          bookId: 'test-book-001',
        },
        ...(contentType === 'story_revision' && {
          originalContent,
          revisionInstructions,
          improvementAreas: ['character development', 'plot pacing'],
        }),
      }

      const response = await fetch('/api/text/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      setResult(data)

      if (!data.success) {
        setError(data.error || 'Generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const testHealthCheck = async () => {
    try {
      const response = await fetch('/api/text/generate')
      const data = await response.json()
      console.log('Health check result:', data)
      alert(`Service status: ${data.status}`)
    } catch (err) {
      console.error('Health check failed:', err)
      alert('Health check failed')
    }
  }

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-5 w-5 animate-spin" />
    if (result?.success)
      return <CheckCircle className="h-5 w-5 text-green-500" />
    if (error) return <XCircle className="h-5 w-5 text-red-500" />
    return <BookOpen className="h-5 w-5" />
  }

  const getQualityBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Text Generation API Test</h1>
        <p className="text-gray-600">
          Test the OpenAI-powered text generation service with quality
          validation
        </p>
        <Button variant="outline" onClick={testHealthCheck}>
          Test Health Check
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="child">Child</TabsTrigger>
              <TabsTrigger value="story">Story</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Content Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select
                      value={contentType}
                      onValueChange={(value: any) => setContentType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="story_outline">
                          Story Outline
                        </SelectItem>
                        <SelectItem value="story_content">
                          Story Content
                        </SelectItem>
                        <SelectItem value="page_content">
                          Page Content
                        </SelectItem>
                        <SelectItem value="story_revision">
                          Story Revision
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      rows={4}
                      placeholder="Describe what you want to generate..."
                    />
                  </div>

                  {contentType === 'story_revision' && (
                    <>
                      <div>
                        <Label htmlFor="originalContent">
                          Original Content
                        </Label>
                        <Textarea
                          id="originalContent"
                          value={originalContent}
                          onChange={e => setOriginalContent(e.target.value)}
                          rows={3}
                          placeholder="Paste the original story content here..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="revisionInstructions">
                          Revision Instructions
                        </Label>
                        <Textarea
                          id="revisionInstructions"
                          value={revisionInstructions}
                          onChange={e =>
                            setRevisionInstructions(e.target.value)
                          }
                          rows={2}
                          placeholder="Describe what changes you want..."
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="child" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Child Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="childName">Name</Label>
                      <Input
                        id="childName"
                        value={childName}
                        onChange={e => setChildName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="childAge">Age</Label>
                      <Input
                        id="childAge"
                        type="number"
                        min="3"
                        max="12"
                        value={childAge}
                        onChange={e => setChildAge(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="readingLevel">Reading Level</Label>
                    <Select
                      value={readingLevel}
                      onValueChange={(value: any) => setReadingLevel(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="interests">
                      Interests (comma-separated)
                    </Label>
                    <Input
                      id="interests"
                      value={interests}
                      onChange={e => setInterests(e.target.value)}
                      placeholder="animals, magic, adventure"
                    />
                  </div>

                  <div>
                    <Label htmlFor="personalityTraits">
                      Personality Traits (comma-separated)
                    </Label>
                    <Input
                      id="personalityTraits"
                      value={personalityTraits}
                      onChange={e => setPersonalityTraits(e.target.value)}
                      placeholder="curious, brave, kind"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hobbies">Hobbies (comma-separated)</Label>
                    <Input
                      id="hobbies"
                      value={hobbies}
                      onChange={e => setHobbies(e.target.value)}
                      placeholder="reading, drawing, exploring"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="story" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Story Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Input
                      id="theme"
                      value={theme}
                      onChange={e => setTheme(e.target.value)}
                      placeholder="magical-adventure"
                    />
                  </div>

                  <div>
                    <Label htmlFor="storyArc">Story Arc</Label>
                    <Input
                      id="storyArc"
                      value={storyArc}
                      onChange={e => setStoryArc(e.target.value)}
                      placeholder="hero-journey"
                    />
                  </div>

                  <div>
                    <Label htmlFor="illustrationStyle">
                      Illustration Style
                    </Label>
                    <Input
                      id="illustrationStyle"
                      value={illustrationStyle}
                      onChange={e => setIllustrationStyle(e.target.value)}
                      placeholder="watercolor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="storyLength">Story Length</Label>
                    <Select
                      value={storyLength}
                      onValueChange={(value: any) => setStoryLength(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">
                          Short (8-12 pages)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium (16-20 pages)
                        </SelectItem>
                        <SelectItem value="long">Long (24-32 pages)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="educationalFocus">Educational Focus</Label>
                    <Input
                      id="educationalFocus"
                      value={educationalFocus}
                      onChange={e => setEducationalFocus(e.target.value)}
                      placeholder="friendship and problem-solving"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="options" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Generation Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeUsageStats"
                      checked={includeUsageStats}
                      onCheckedChange={checked =>
                        setIncludeUsageStats(checked as boolean)
                      }
                    />
                    <Label htmlFor="includeUsageStats">
                      Include Usage Statistics
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipQualityValidation"
                      checked={skipQualityValidation}
                      onCheckedChange={checked =>
                        setSkipQualityValidation(checked as boolean)
                      }
                    />
                    <Label htmlFor="skipQualityValidation">
                      Skip Quality Validation
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="qualityThreshold">Quality Threshold</Label>
                    <Input
                      id="qualityThreshold"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={qualityThreshold}
                      onChange={e =>
                        setQualityThreshold(parseFloat(e.target.value))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button
            onClick={generateText}
            disabled={loading || !prompt}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Text
              </>
            )}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Generation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Generating content...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Error
                  </div>
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {result?.success && result.result && (
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Provider:</span>{' '}
                      {result.result.metadata.provider}
                    </div>
                    <div>
                      <span className="font-medium">Model:</span>{' '}
                      {result.result.metadata.model}
                    </div>
                    <div>
                      <span className="font-medium">Processing Time:</span>{' '}
                      {result.result.metadata.processingTimeMs}ms
                    </div>
                    <div>
                      <span className="font-medium">Attempts:</span>{' '}
                      {result.result.metadata.attemptCount}
                    </div>
                  </div>

                  {/* Quality Validation */}
                  {result.result.qualityValidation && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4" />
                        <span className="font-medium">Quality Validation</span>
                        <Badge
                          className={getQualityBadgeColor(
                            result.result.qualityValidation.overallScore
                          )}
                        >
                          Score:{' '}
                          {result.result.qualityValidation.overallScore.toFixed(
                            1
                          )}
                        </Badge>
                        <Badge
                          variant={
                            result.result.qualityValidation.passesThreshold
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {result.result.qualityValidation.passesThreshold
                            ? 'Passed'
                            : 'Failed'}
                        </Badge>
                      </div>

                      {result.result.qualityValidation.feedback.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium mb-1">Feedback:</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {result.result.qualityValidation.feedback.map(
                              (item, index) => (
                                <li key={index}>{item}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {result.result.qualityValidation.recommendations.length >
                        0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">
                            Recommendations:
                          </p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {result.result.qualityValidation.recommendations.map(
                              (item, index) => (
                                <li key={index}>{item}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Usage Stats */}
                  {result.result.usage && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Usage Statistics</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          Prompt Tokens: {result.result.usage.promptTokens}
                        </div>
                        <div>
                          Completion Tokens:{' '}
                          {result.result.usage.completionTokens}
                        </div>
                        <div>
                          Total Tokens: {result.result.usage.totalTokens}
                        </div>
                        <div>
                          Estimated Cost: $
                          {result.result.usage.estimatedCost.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generated Content */}
                  <div>
                    <h4 className="font-medium mb-2">Generated Content</h4>
                    <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">
                        {result.result.content}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !result && !error && (
                <div className="text-center py-8 text-gray-500">
                  Configure your settings and click "Generate Text" to test the
                  API
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
