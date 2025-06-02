'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Zap, Settings, BarChart3 } from 'lucide-react'

interface TestScenario {
  id: string
  name: string
  prompt: string
  description: string
  expectedConsistency: number
}

interface GeneratedImage {
  id: string
  url: string
  scenario: TestScenario
  model: string
  settings: {
    faceWeight: number
    consistencyLevel: number
  }
  metadata: {
    generationTime: number
    cost: number
  }
  consistencyScore?: number
}

interface CharacterReference {
  id: string
  url: string
  faceRegion?: {
    x: number
    y: number
    width: number
    height: number
    confidence: number
  }
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'park_playing',
    name: 'Playing in Park',
    prompt:
      'A child playing happily in a sunny park with green grass and trees in the background',
    description: 'Tests character consistency in outdoor, active scene',
    expectedConsistency: 85,
  },
  {
    id: 'reading_book',
    name: 'Reading a Book',
    prompt:
      'A child sitting comfortably reading a colorful storybook, focused and engaged',
    description: 'Tests character consistency in calm, indoor scene',
    expectedConsistency: 90,
  },
  {
    id: 'birthday_party',
    name: 'Birthday Party',
    prompt:
      'A child at a birthday party with balloons and cake, smiling and celebrating',
    description: 'Tests character consistency in festive, social scene',
    expectedConsistency: 80,
  },
  {
    id: 'beach_adventure',
    name: 'Beach Adventure',
    prompt:
      'A child building sandcastles on a beautiful beach with waves in the background',
    description: 'Tests character consistency in bright, outdoor scene',
    expectedConsistency: 85,
  },
  {
    id: 'forest_explorer',
    name: 'Forest Explorer',
    prompt:
      'A child exploring a magical forest with tall trees and dappled sunlight',
    description: 'Tests character consistency in fantasy, adventure scene',
    expectedConsistency: 80,
  },
  {
    id: 'art_class',
    name: 'Art Class',
    prompt:
      'A child painting at an easel in an art studio, concentrating on their artwork',
    description: 'Tests character consistency in creative, focused scene',
    expectedConsistency: 88,
  },
]

const availableModels = [
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    provider: 'Replicate',
    description: 'Fast, high-quality generation',
    type: 'fast',
  },
  {
    id: 'flux-schnell',
    name: 'FLUX Schnell',
    provider: 'Replicate',
    description: 'Ultra-fast generation',
    type: 'fast',
  },
  {
    id: 'flux-1.1-pro',
    name: 'FLUX 1.1 Pro',
    provider: 'Replicate',
    description: 'Professional quality',
    type: 'pro',
  },
  {
    id: 'flux-kontext-pro',
    name: 'FLUX Kontext Pro',
    provider: 'Replicate',
    description: 'Text-based image editing',
    type: 'pro',
  },
  {
    id: 'imagen-4',
    name: 'Google Imagen 4',
    provider: 'Replicate',
    description: 'Premium Google model',
    type: 'premium',
  },
  {
    id: 'minimax-image-01',
    name: 'MiniMax Image-01',
    provider: 'Replicate',
    description: 'Character reference support',
    type: 'character',
  },
  {
    id: 'flux-1.1-pro-ultra',
    name: 'FLUX 1.1 Pro Ultra',
    provider: 'Replicate',
    description: 'Ultra high-resolution',
    type: 'ultra',
  },
  {
    id: 'gpt-image-1',
    name: 'GPT Image-1',
    provider: 'OpenAI',
    description: 'Latest OpenAI image model',
    type: 'premium',
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    description: 'High-quality creative images',
    type: 'pro',
  },
  {
    id: 'dall-e-2',
    name: 'DALL-E 2',
    provider: 'OpenAI',
    description: 'Classic OpenAI model',
    type: 'fast',
  },
]

const getModelTypeBadge = (type: string) => {
  const badges: Record<
    string,
    {
      label: string
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
    }
  > = {
    fast: { label: 'Fast', variant: 'secondary' },
    pro: { label: 'Pro', variant: 'default' },
    premium: { label: 'Premium', variant: 'destructive' },
    character: { label: 'Character', variant: 'outline' },
    ultra: { label: 'Ultra', variant: 'secondary' },
  }
  return badges[type] || { label: 'Standard', variant: 'outline' }
}

export default function CharacterConsistencyTestPage() {
  // Force recompile - fixed unique key issue - timestamp: 2025-01-02-22:40
  // Character reference state
  const [characterReference, setCharacterReference] =
    useState<CharacterReference | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Generation settings
  const [selectedModel, setSelectedModel] = useState('flux-dev')
  const [faceWeight, setFaceWeight] = useState([0.8])
  const [consistencyLevel, setConsistencyLevel] = useState([0.9])
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'park_playing',
    'reading_book',
    'birthday_party',
  ])
  const [useRealAPI, setUseRealAPI] = useState(true)
  const [useImageEdit, setUseImageEdit] = useState(true)

  // Generation state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Analysis state
  const [consistencyAnalysis, setConsistencyAnalysis] = useState<any>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Model mapping for API calls
  const getAPIModelName = (uiModelId: string): string => {
    const modelMap: Record<string, string> = {
      'flux-dev': 'flux1', // FLUX Dev maps to flux1 in API
      'flux-schnell': 'flux1', // FLUX Schnell also maps to flux1 (same model, different name)
      'flux-1.1-pro': 'flux-1.1-pro',
      'flux-kontext-pro': 'flux-kontext-pro',
      'imagen-4': 'imagen-4',
      'minimax-image-01': 'minimax-image-01',
      'flux-1.1-pro-ultra': 'flux-1.1-pro-ultra',
      'gpt-image-1': 'gpt-image-1',
      'dall-e-3': 'dall-e-3',
      'dall-e-2': 'dall-e-2',
    }
    return modelMap[uiModelId] || uiModelId
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      // Upload to child photos API
      const response = await fetch('/api/child-photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childProfileId: 'test-character-consistency',
          fileName: file.name,
          photoData: base64,
          isPrimary: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()

      setCharacterReference({
        id: result.result.photoId,
        url: result.result.optimizedUrl || result.result.photoUrl,
        faceRegion: result.result.faceRegion,
      })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload character reference')
    } finally {
      setIsUploading(false)
    }
  }

  const generateConsistencyTest = async () => {
    if (!characterReference) {
      alert('Please upload a character reference first')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setGeneratedImages([])

    const scenariosToTest = TEST_SCENARIOS.filter(s =>
      selectedScenarios.includes(s.id)
    )
    const totalImages = scenariosToTest.length

    try {
      for (let i = 0; i < scenariosToTest.length; i++) {
        const scenario = scenariosToTest[i]

        setGenerationProgress(((i + 1) / totalImages) * 100)

        const apiUrl = useRealAPI
          ? '/api/images/generate-with-character?forceRealAPI=true'
          : '/api/images/generate-with-character'

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: scenario.prompt,
            childProfileId: 'test-character-consistency',
            useCharacterReference: true,
            characterName: 'Test Character',
            characterRole: 'main character',
            model: getAPIModelName(selectedModel),
            width: 1024,
            height: 1024,
            style: 'watercolor',
            faceWeight: faceWeight[0],
            characterConsistency: consistencyLevel[0],
            preserveFacialFeatures: true,
            userId: 'test-consistency',
            useImageEdit:
              useImageEdit &&
              (selectedModel.startsWith('gpt-') ||
                selectedModel.startsWith('dall-e-')),
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to generate image for ${scenario.name}`)
        }

        const result = await response.json()

        const generatedImage: GeneratedImage = {
          id: `${scenario.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: result.result.imageUrl,
          scenario,
          model: selectedModel,
          settings: {
            faceWeight: faceWeight[0],
            consistencyLevel: consistencyLevel[0],
          },
          metadata: {
            generationTime: result.result.metadata?.processingTimeMs || 0,
            cost: result.result.metadata?.estimatedCost || 0,
          },
        }

        setGeneratedImages(prev => [...prev, generatedImage])
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate consistency test images')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const calculateManualConsistencyScore = (imageId: string, score: number) => {
    setGeneratedImages(prev =>
      prev.map(img =>
        img.id === imageId ? { ...img, consistencyScore: score } : img
      )
    )
  }

  const generateAnalysisReport = () => {
    const scoredImages = generatedImages.filter(
      img => img.consistencyScore !== undefined
    )

    if (scoredImages.length === 0) {
      alert('Please score at least one image first')
      return
    }

    const averageScore =
      scoredImages.reduce((sum, img) => sum + (img.consistencyScore || 0), 0) /
      scoredImages.length
    const totalCost = generatedImages.reduce(
      (sum, img) => sum + img.metadata.cost,
      0
    )
    const averageTime =
      generatedImages.reduce(
        (sum, img) => sum + img.metadata.generationTime,
        0
      ) / generatedImages.length

    const analysis = {
      averageConsistencyScore: averageScore,
      totalImagesGenerated: generatedImages.length,
      imagesScored: scoredImages.length,
      totalCost,
      averageGenerationTime: averageTime,
      modelUsed: selectedModel,
      settings: {
        faceWeight: faceWeight[0],
        consistencyLevel: consistencyLevel[0],
      },
      scenarioPerformance: scoredImages.map(img => ({
        scenario: img.scenario.name,
        score: img.consistencyScore,
        expected: img.scenario.expectedConsistency,
        difference:
          (img.consistencyScore || 0) - img.scenario.expectedConsistency,
      })),
    }

    setConsistencyAnalysis(analysis)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Character Consistency Testing
        </h1>
        <p className="text-muted-foreground">
          Test and validate character consistency across different scenes and
          scenarios
        </p>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Generate & Results
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Character Reference Upload</CardTitle>
              <CardDescription>
                Upload a clear photo of the child to use as character reference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedFile && (
                  <span className="text-sm text-muted-foreground">
                    {uploadedFile.name}
                  </span>
                )}
              </div>

              {characterReference && (
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <img
                    src={characterReference.url}
                    alt="Character Reference"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="space-y-2">
                    <Badge variant="secondary">Reference Uploaded</Badge>
                    {characterReference.faceRegion && (
                      <div className="text-sm text-muted-foreground">
                        Face detected with{' '}
                        {Math.round(
                          characterReference.faceRegion.confidence * 100
                        )}
                        % confidence
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
              <CardDescription>
                Configure the AI model and character consistency parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => {
                      const badge = getModelTypeBadge(model.type)
                      return (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span>{model.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.description}
                              </span>
                            </div>
                            <Badge
                              variant={badge.variant}
                              className="ml-2 text-xs"
                            >
                              {badge.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose from 7 different AI models including FLUX variants,
                  Google Imagen 4, and MiniMax for comprehensive character
                  consistency testing
                </p>
              </div>

              <div className="space-y-2">
                <Label>Face Weight: {faceWeight[0]}</Label>
                <Slider
                  value={faceWeight}
                  onValueChange={setFaceWeight}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  How strongly to emphasize facial features from the reference
                </p>
              </div>

              <div className="space-y-2">
                <Label>Character Consistency: {consistencyLevel[0]}</Label>
                <Slider
                  value={consistencyLevel}
                  onValueChange={setConsistencyLevel}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  How consistent the character should appear across images
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Use Real API</Label>
                  <p className="text-sm text-muted-foreground">
                    {useRealAPI
                      ? 'Generate real images using Replicate API (costs money)'
                      : 'Use placeholder images for testing (free)'}
                  </p>
                </div>
                <Switch checked={useRealAPI} onCheckedChange={setUseRealAPI} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Use Image Edit (OpenAI only)</Label>
                  <p className="text-sm text-muted-foreground">
                    {useImageEdit
                      ? 'Use character reference as base image for editing (better consistency)'
                      : 'Use standard generation with prompt-based character description'}
                  </p>
                </div>
                <Switch
                  checked={useImageEdit}
                  onCheckedChange={setUseImageEdit}
                  disabled={
                    !selectedModel.startsWith('gpt-') &&
                    !selectedModel.startsWith('dall-e-')
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Scenarios</CardTitle>
              <CardDescription>
                Select scenarios to test character consistency across different
                contexts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEST_SCENARIOS.map(scenario => (
                  <div
                    key={scenario.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedScenarios.includes(scenario.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedScenarios(prev =>
                        prev.includes(scenario.id)
                          ? prev.filter(id => id !== scenario.id)
                          : [...prev, scenario.id]
                      )
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{scenario.name}</h3>
                      <Badge variant="outline">
                        {scenario.expectedConsistency}% target
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {scenario.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      "{scenario.prompt}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedScenarios.length} scenarios selected
                </div>
                <Button
                  onClick={generateConsistencyTest}
                  disabled={
                    !characterReference ||
                    selectedScenarios.length === 0 ||
                    isGenerating
                  }
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Generate Test Images'}
                </Button>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generation Progress</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {(generatedImages.length > 0 || isGenerating) && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Images</CardTitle>
                <CardDescription>
                  Review and score the consistency of generated images
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 && isGenerating ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Generating images...
                    </div>
                    <p className="text-sm">
                      Images will appear here as they're generated
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedImages.map(image => (
                      <div
                        key={image.id}
                        className="space-y-4 p-4 border rounded-lg"
                      >
                        <img
                          src={image.url}
                          alt={image.scenario.name}
                          className="w-full aspect-square object-cover rounded-lg"
                        />

                        <div className="space-y-2">
                          <h3 className="font-medium">{image.scenario.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{image.model}</Badge>
                            <Badge variant="secondary">
                              Target: {image.scenario.expectedConsistency}%
                            </Badge>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            Face Weight: {image.settings.faceWeight} |
                            Consistency: {image.settings.consistencyLevel}
                          </div>

                          <div className="space-y-2">
                            <Label>Manual Consistency Score (1-100)</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[image.consistencyScore || 50]}
                                onValueChange={(values: number[]) =>
                                  calculateManualConsistencyScore(
                                    image.id,
                                    values[0]
                                  )
                                }
                                min={1}
                                max={100}
                                step={1}
                                className="flex-1"
                              />
                              <span className="w-12 text-sm">
                                {image.consistencyScore || 50}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consistency Analysis</CardTitle>
              <CardDescription>
                Generate detailed analysis of character consistency performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateAnalysisReport}
                disabled={generatedImages.length === 0}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Generate Analysis Report
              </Button>

              {consistencyAnalysis && (
                <div className="space-y-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {Math.round(
                            consistencyAnalysis.averageConsistencyScore
                          )}
                          %
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Average Consistency Score
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {consistencyAnalysis.totalImagesGenerated}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Images Generated
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          ${consistencyAnalysis.totalCost.toFixed(3)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total Cost
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Scenario Performance
                    </h3>
                    <div className="space-y-2">
                      {consistencyAnalysis.scenarioPerformance.map(
                        (perf: any) => (
                          <div
                            key={perf.scenario}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <div className="font-medium">{perf.scenario}</div>
                              <div className="text-sm text-muted-foreground">
                                Target: {perf.expected}% | Actual: {perf.score}%
                              </div>
                            </div>
                            <Badge
                              variant={
                                perf.difference >= 0 ? 'default' : 'destructive'
                              }
                            >
                              {perf.difference >= 0 ? '+' : ''}
                              {perf.difference}%
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Settings Used</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Model: {consistencyAnalysis.modelUsed}</div>
                      <div>
                        Face Weight: {consistencyAnalysis.settings.faceWeight}
                      </div>
                      <div>
                        Consistency Level:{' '}
                        {consistencyAnalysis.settings.consistencyLevel}
                      </div>
                      <div>
                        Avg Generation Time:{' '}
                        {Math.round(consistencyAnalysis.averageGenerationTime)}
                        ms
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
