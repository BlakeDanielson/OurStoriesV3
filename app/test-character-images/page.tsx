'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Wand2,
  CheckCircle,
  XCircle,
  User,
  Camera,
  Eye,
  Star,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Settings,
  Clock,
  DollarSign,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ChildProfile {
  id: string
  name: string
  age: number
}

interface ChildPhoto {
  id: string
  child_profile_id: string
  original_url: string
  optimized_url: string
  file_name: string
  is_primary: boolean
  face_detected: boolean
  face_region?: {
    x: number
    y: number
    width: number
    height: number
  }
  face_confidence?: number
  created_at: string
}

interface GenerationResult {
  success: boolean
  result?: {
    imageId: string
    imageUrl: string
    prompt: string
    enhancedPrompt?: string
    characterUsed: boolean
    characterSimilarityScore?: number
    generationTime: number
    cost?: number
    metadata: {
      model: string
      width: number
      height: number
      style?: string
      seed?: number
      characterReference?: {
        photoId: string
        photoUrl: string
        characterName: string
        faceRegion?: {
          x: number
          y: number
          width: number
          height: number
        }
        influenceScore: number
      }
      generatedAt: string
    }
  }
  error?: string
  details?: string
}

export default function TestCharacterImagesPage() {
  const { user, loading: authLoading } = useAuth()

  // State
  const [generating, setGenerating] = useState(false)
  const [generationResult, setGenerationResult] =
    useState<GenerationResult | null>(null)
  const [error, setError] = useState('')
  const [childPhotos, setChildPhotos] = useState<ChildPhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  // Form data
  const [selectedChildId, setSelectedChildId] = useState('')
  const [prompt, setPrompt] = useState('')
  const [storyContext, setStoryContext] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [characterRole, setCharacterRole] = useState('main character')
  const [useCharacterReference, setUseCharacterReference] = useState(true)
  const [model, setModel] = useState('flux1')
  const [style, setStyle] = useState('watercolor')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [preserveFacialFeatures, setPreserveFacialFeatures] = useState(true)
  const [characterConsistency, setCharacterConsistency] = useState([0.8])
  const [faceWeight, setFaceWeight] = useState([0.7])
  const [seed, setSeed] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')

  // Mock child profiles (in real app, fetch from API)
  const mockChildProfiles: ChildProfile[] = [
    { id: 'child-001', name: 'Emma', age: 7 },
    { id: 'child-002', name: 'Liam', age: 5 },
    { id: 'child-003', name: 'Sofia', age: 9 },
  ]

  const loadChildPhotos = async (childId: string) => {
    setLoadingPhotos(true)
    try {
      const response = await fetch(
        `/api/child-photos/upload?childProfileId=${childId}`
      )
      const data = await response.json()

      if (data.success) {
        setChildPhotos(data.photos)
      } else {
        console.error('Failed to load photos:', data.error)
        setChildPhotos([])
      }
    } catch (err) {
      console.error('Error loading photos:', err)
      setChildPhotos([])
    } finally {
      setLoadingPhotos(false)
    }
  }

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId)
    const selectedChild = mockChildProfiles.find(c => c.id === childId)
    if (selectedChild) {
      setCharacterName(selectedChild.name)
    }
    if (childId) {
      loadChildPhotos(childId)
    } else {
      setChildPhotos([])
    }
  }

  const generateImage = async () => {
    if (!prompt || !selectedChildId) {
      setError('Please provide a prompt and select a child profile')
      return
    }

    setGenerating(true)
    setError('')
    setGenerationResult(null)

    try {
      const requestBody = {
        prompt,
        storyContext: storyContext || undefined,
        childProfileId: selectedChildId,
        useCharacterReference,
        characterName: characterName || undefined,
        characterRole,
        model,
        width,
        height,
        style,
        negativePrompt: negativePrompt || undefined,
        seed: seed ? parseInt(seed) : undefined,
        preserveFacialFeatures,
        characterConsistency: characterConsistency[0],
        faceWeight: faceWeight[0],
      }

      const response = await fetch('/api/images/generate-with-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      setGenerationResult(data)

      if (!data.success) {
        setError(data.error || 'Generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setGenerating(false)
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatCost = (cost?: number) => {
    if (!cost) return 'Free'
    return `$${cost.toFixed(4)}`
  }

  const getStatusIcon = () => {
    if (generating) return <Loader2 className="h-5 w-5 animate-spin" />
    if (generationResult?.success)
      return <CheckCircle className="h-5 w-5 text-green-500" />
    if (error) return <XCircle className="h-5 w-5 text-red-500" />
    return <Wand2 className="h-5 w-5" />
  }

  const primaryPhoto = childPhotos.find(p => p.is_primary)
  const hasPhotos = childPhotos.length > 0

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            You must be signed in to test character image generation. Please
            sign in first.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Character Image Generation Test</h1>
        <p className="text-gray-600">
          Generate personalized story illustrations using child photos as
          character references
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="character">Character</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Story & Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Child Selection */}
                  <div>
                    <Label htmlFor="childSelect">Select Child Profile</Label>
                    <Select
                      value={selectedChildId}
                      onValueChange={handleChildSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a child profile..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockChildProfiles.map(child => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name} (Age {child.age})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Main Prompt */}
                  <div>
                    <Label htmlFor="prompt">Image Prompt *</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="A child exploring a magical forest with talking animals..."
                      rows={3}
                    />
                  </div>

                  {/* Story Context */}
                  <div>
                    <Label htmlFor="storyContext">
                      Story Context (Optional)
                    </Label>
                    <Textarea
                      id="storyContext"
                      value={storyContext}
                      onChange={e => setStoryContext(e.target.value)}
                      placeholder="This is part of an adventure story where the main character discovers..."
                      rows={2}
                    />
                  </div>

                  {/* Model & Style */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="model">AI Model</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flux1">
                            FLUX.1 Schnell (Fast)
                          </SelectItem>
                          <SelectItem value="flux-1.1-pro">
                            FLUX 1.1 Pro
                          </SelectItem>
                          <SelectItem value="imagen-4">
                            Imagen 4 (Google)
                          </SelectItem>
                          <SelectItem value="minimax-image-01">
                            Minimax Image 01
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="style">Art Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="watercolor">Watercolor</SelectItem>
                          <SelectItem value="oil_painting">
                            Oil Painting
                          </SelectItem>
                          <SelectItem value="digital_art">
                            Digital Art
                          </SelectItem>
                          <SelectItem value="cartoon">Cartoon</SelectItem>
                          <SelectItem value="realistic">Realistic</SelectItem>
                          <SelectItem value="sketch">Sketch</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="character" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Character Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Character Reference Toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useCharacterReference"
                      checked={useCharacterReference}
                      onCheckedChange={checked =>
                        setUseCharacterReference(checked as boolean)
                      }
                    />
                    <Label htmlFor="useCharacterReference">
                      Use uploaded photo as character reference
                    </Label>
                  </div>

                  {/* Character Name & Role */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="characterName">Character Name</Label>
                      <Input
                        id="characterName"
                        value={characterName}
                        onChange={e => setCharacterName(e.target.value)}
                        placeholder="Emma"
                      />
                    </div>

                    <div>
                      <Label htmlFor="characterRole">Character Role</Label>
                      <Select
                        value={characterRole}
                        onValueChange={setCharacterRole}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main character">
                            Main Character
                          </SelectItem>
                          <SelectItem value="protagonist">
                            Protagonist
                          </SelectItem>
                          <SelectItem value="hero">Hero</SelectItem>
                          <SelectItem value="adventurer">Adventurer</SelectItem>
                          <SelectItem value="explorer">Explorer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Character Consistency Sliders */}
                  {useCharacterReference && (
                    <>
                      <div>
                        <Label>
                          Character Consistency:{' '}
                          {characterConsistency[0].toFixed(1)}
                        </Label>
                        <Slider
                          value={characterConsistency}
                          onValueChange={setCharacterConsistency}
                          max={1}
                          min={0.1}
                          step={0.1}
                          className="mt-2"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          How consistent the character should look across images
                        </p>
                      </div>

                      <div>
                        <Label>Face Weight: {faceWeight[0].toFixed(1)}</Label>
                        <Slider
                          value={faceWeight}
                          onValueChange={setFaceWeight}
                          max={1}
                          min={0.1}
                          step={0.1}
                          className="mt-2"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          How strongly facial features should influence the
                          generation
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="preserveFacialFeatures"
                          checked={preserveFacialFeatures}
                          onCheckedChange={checked =>
                            setPreserveFacialFeatures(checked as boolean)
                          }
                        />
                        <Label htmlFor="preserveFacialFeatures">
                          Preserve facial features from reference photo
                        </Label>
                      </div>
                    </>
                  )}

                  {/* Photo Preview */}
                  {selectedChildId && (
                    <div>
                      <Label>Reference Photos</Label>
                      {loadingPhotos ? (
                        <div className="flex items-center gap-2 py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Loading photos...</span>
                        </div>
                      ) : hasPhotos ? (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {childPhotos.slice(0, 6).map(photo => (
                            <div key={photo.id} className="relative">
                              <img
                                src={photo.optimized_url}
                                alt={photo.file_name}
                                className="w-full h-20 object-cover rounded border"
                              />
                              {photo.is_primary && (
                                <Badge className="absolute top-1 left-1 text-xs">
                                  <Star className="h-2 w-2 mr-1" />
                                  Primary
                                </Badge>
                              )}
                              {photo.face_detected && (
                                <Badge
                                  variant="secondary"
                                  className="absolute bottom-1 right-1 text-xs"
                                >
                                  Face ✓
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <Camera className="h-4 w-4" />
                          <AlertDescription>
                            No photos uploaded for this child. Upload photos
                            first to use character references.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width">Width</Label>
                      <Select
                        value={width.toString()}
                        onValueChange={value => setWidth(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="512">512px</SelectItem>
                          <SelectItem value="768">768px</SelectItem>
                          <SelectItem value="1024">1024px</SelectItem>
                          <SelectItem value="1536">1536px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="height">Height</Label>
                      <Select
                        value={height.toString()}
                        onValueChange={value => setHeight(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="512">512px</SelectItem>
                          <SelectItem value="768">768px</SelectItem>
                          <SelectItem value="1024">1024px</SelectItem>
                          <SelectItem value="1536">1536px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Seed */}
                  <div>
                    <Label htmlFor="seed">Seed (Optional)</Label>
                    <Input
                      id="seed"
                      value={seed}
                      onChange={e => setSeed(e.target.value)}
                      placeholder="Random number for reproducible results"
                      type="number"
                    />
                  </div>

                  {/* Negative Prompt */}
                  <div>
                    <Label htmlFor="negativePrompt">
                      Negative Prompt (Optional)
                    </Label>
                    <Textarea
                      id="negativePrompt"
                      value={negativePrompt}
                      onChange={e => setNegativePrompt(e.target.value)}
                      placeholder="Things to avoid in the image..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={generateImage}
                disabled={generating || !prompt || !selectedChildId}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Character Image
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Generation Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generationResult?.success && generationResult.result ? (
                <div className="space-y-4">
                  {/* Generated Image */}
                  <div>
                    <img
                      src={generationResult.result.imageUrl}
                      alt="Generated character image"
                      className="w-full rounded-lg border"
                    />
                  </div>

                  {/* Generation Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(generationResult.result.generationTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCost(generationResult.result.cost)}</span>
                    </div>
                  </div>

                  {/* Character Usage */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        generationResult.result.characterUsed
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {generationResult.result.characterUsed
                        ? 'Character Reference Used'
                        : 'No Character Reference'}
                    </Badge>
                    {generationResult.result.characterSimilarityScore && (
                      <Badge variant="outline">
                        Similarity:{' '}
                        {(
                          generationResult.result.characterSimilarityScore * 100
                        ).toFixed(0)}
                        %
                      </Badge>
                    )}
                  </div>

                  {/* Enhanced Prompt */}
                  {generationResult.result.enhancedPrompt && (
                    <div>
                      <Label className="text-sm font-medium">
                        Enhanced Prompt
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {generationResult.result.enhancedPrompt}
                      </p>
                    </div>
                  )}

                  {/* Character Reference Info */}
                  {generationResult.result.metadata.characterReference && (
                    <div>
                      <Label className="text-sm font-medium">
                        Character Reference
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <img
                          src={
                            generationResult.result.metadata.characterReference
                              .photoUrl
                          }
                          alt="Character reference"
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="text-sm">
                          <p className="font-medium">
                            {
                              generationResult.result.metadata
                                .characterReference.characterName
                            }
                          </p>
                          <p className="text-gray-500">
                            Influence:{' '}
                            {(
                              generationResult.result.metadata
                                .characterReference.influenceScore * 100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-sm font-medium">
                      Generation Details
                    </Label>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div>Model: {generationResult.result.metadata.model}</div>
                      <div>Style: {generationResult.result.metadata.style}</div>
                      <div>
                        Size: {generationResult.result.metadata.width}×
                        {generationResult.result.metadata.height}
                      </div>
                      <div>
                        Seed:{' '}
                        {generationResult.result.metadata.seed || 'Random'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : generationResult && !generationResult.success ? (
                <div className="text-red-600">
                  <p className="font-medium">Generation Failed</p>
                  <p className="text-sm">{generationResult.error}</p>
                  {generationResult.details && (
                    <p className="text-xs mt-1">{generationResult.details}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Generated image will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
