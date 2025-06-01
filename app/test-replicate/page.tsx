'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  Sparkles,
  Zap,
  Image,
  Palette,
  Camera,
  Wand2,
  Star,
  Eye,
  History,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ImageGallery } from './components/ImageGallery'
import { saveGenerationToGallery } from './utils/galleryStorage'

interface GenerationResult {
  success: boolean
  result?: {
    id: string
    status: string
    imageUrl: string
    provider: string
    model: string
    generationTime: number
  }
  cost?: number
  error?: string
}

interface ConnectionStatus {
  connected: boolean
  models: Record<string, string>
  rateLimit: {
    requestsPerMinute: number
    concurrent: number
  }
}

interface ModelProgress {
  status:
    | 'idle'
    | 'queued'
    | 'starting'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'timeout-warning'
  progress: number
  startTime?: number
  estimatedCompletion?: number
  statusMessage: string
  elapsedTime: number
}

type ModelKey =
  | 'flux1'
  | 'flux-kontext-pro'
  | 'imagen-4'
  | 'minimax-image-01'
  | 'flux-1.1-pro-ultra'

interface ModelResults {
  [key: string]: GenerationResult | null
}

const modelInfo: Record<
  ModelKey,
  {
    name: string
    description: string
    icon: React.ReactNode
    color: string
    timeout: number
  }
> = {
  flux1: {
    name: 'FLUX.1 Schnell',
    description: 'Fast, high-quality generation (30s timeout)',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-yellow-500',
    timeout: 30,
  },
  'flux-kontext-pro': {
    name: 'FLUX Kontext Pro',
    description: 'Text-based image editing (60s timeout)',
    icon: <Palette className="h-5 w-5" />,
    color: 'text-purple-500',
    timeout: 60,
  },
  'imagen-4': {
    name: 'Google Imagen 4',
    description: 'Premium Google model (90s timeout)',
    icon: <Star className="h-5 w-5" />,
    color: 'text-green-500',
    timeout: 90,
  },
  'minimax-image-01': {
    name: 'MiniMax Image-01',
    description: 'Character reference support (120s timeout)',
    icon: <Camera className="h-5 w-5" />,
    color: 'text-pink-500',
    timeout: 120,
  },
  'flux-1.1-pro-ultra': {
    name: 'FLUX 1.1 Pro Ultra',
    description: 'Ultra high-resolution (90s timeout)',
    icon: <Star className="h-5 w-5" />,
    color: 'text-orange-500',
    timeout: 90,
  },
}

export default function TestReplicatePage() {
  const [prompt, setPrompt] = useState(
    'A magical forest with glowing mushrooms and fairy lights, watercolor style'
  )
  const [style, setStyle] = useState('')
  const [negativePrompt, setNegativePrompt] = useState(
    'blurry, low quality, distorted'
  )
  const [selectedModels, setSelectedModels] = useState<Set<ModelKey>>(
    new Set(['flux1'] as ModelKey[])
  )
  const [loading, setLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  )
  const [modelProgress, setModelProgress] = useState<
    Record<string, ModelProgress>
  >({})
  const [results, setResults] = useState<ModelResults>({})
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [completedModels, setCompletedModels] = useState(0)
  const [totalModels, setTotalModels] = useState(0)

  const progressIntervals = useRef<Record<string, NodeJS.Timeout>>({})
  const timeoutWarnings = useRef<Record<string, NodeJS.Timeout>>({})

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(progressIntervals.current).forEach(clearInterval)
      Object.values(timeoutWarnings.current).forEach(clearTimeout)
    }
  }, [])

  const initializeModelProgress = (model: string) => {
    const timeout = modelInfo[model as ModelKey]?.timeout || 60

    setModelProgress(prev => ({
      ...prev,
      [model]: {
        status: 'queued',
        progress: 0,
        startTime: Date.now(),
        estimatedCompletion: Date.now() + timeout * 1000,
        statusMessage: 'Queued for generation...',
        elapsedTime: 0,
      },
    }))

    // Set up timeout warning (at 80% of expected time)
    const warningTime = timeout * 0.8 * 1000
    timeoutWarnings.current[model] = setTimeout(() => {
      const modelName = modelInfo[model as ModelKey]?.name || model

      setModelProgress(prev => ({
        ...prev,
        [model]: {
          ...prev[model],
          status: 'timeout-warning',
          statusMessage: 'Taking longer than expected...',
        },
      }))

      // Show timeout warning notification
      toast.warning(`${modelName} is taking longer than expected`, {
        description: `Expected ~${formatTime(timeout)}, but still processing...`,
        duration: 4000,
      })
    }, warningTime)

    // Start progress simulation
    startProgressSimulation(model, timeout)
  }

  const startProgressSimulation = (model: string, timeoutSeconds: number) => {
    const startTime = Date.now()

    progressIntervals.current[model] = setInterval(() => {
      const elapsed = Date.now() - startTime
      const elapsedSeconds = elapsed / 1000

      // Simulate realistic progress curve (slower at start, faster in middle, slower at end)
      let progress = 0
      if (elapsedSeconds < timeoutSeconds * 0.1) {
        // First 10% of time: 0-15% progress
        progress = (elapsedSeconds / (timeoutSeconds * 0.1)) * 15
      } else if (elapsedSeconds < timeoutSeconds * 0.8) {
        // Next 70% of time: 15-85% progress
        const midProgress =
          (elapsedSeconds - timeoutSeconds * 0.1) / (timeoutSeconds * 0.7)
        progress = 15 + midProgress * 70
      } else {
        // Last 20% of time: 85-95% progress (don't go to 100% until actually complete)
        const endProgress =
          (elapsedSeconds - timeoutSeconds * 0.8) / (timeoutSeconds * 0.2)
        progress = 85 + endProgress * 10
      }

      progress = Math.min(progress, 95) // Cap at 95% until actually complete

      setModelProgress(prev => {
        const current = prev[model]
        if (
          !current ||
          current.status === 'completed' ||
          current.status === 'failed'
        ) {
          return prev
        }

        let statusMessage = current.statusMessage
        let status = current.status

        if (elapsedSeconds < 2) {
          statusMessage = 'Initializing generation...'
          status = 'starting'
        } else if (elapsedSeconds < 5) {
          statusMessage = 'Processing prompt...'
          status = 'processing'
        } else if (elapsedSeconds < timeoutSeconds * 0.3) {
          statusMessage = 'Generating image...'
          status = 'processing'
        } else if (elapsedSeconds < timeoutSeconds * 0.7) {
          statusMessage = 'Refining details...'
          status = 'processing'
        } else if (elapsedSeconds < timeoutSeconds * 0.9) {
          statusMessage = 'Finalizing image...'
          status = 'processing'
        } else {
          statusMessage = 'Almost complete...'
          status =
            current.status === 'timeout-warning'
              ? 'timeout-warning'
              : 'processing'
        }

        return {
          ...prev,
          [model]: {
            ...current,
            progress,
            elapsedTime: elapsedSeconds,
            statusMessage,
            status,
          },
        }
      })
    }, 500) // Update every 500ms for smooth progress
  }

  const completeModelProgress = (
    model: string,
    success: boolean,
    errorMessage?: string
  ) => {
    // Clear intervals and timeouts
    if (progressIntervals.current[model]) {
      clearInterval(progressIntervals.current[model])
      delete progressIntervals.current[model]
    }
    if (timeoutWarnings.current[model]) {
      clearTimeout(timeoutWarnings.current[model])
      delete timeoutWarnings.current[model]
    }

    const modelName = modelInfo[model as ModelKey]?.name || model

    setModelProgress(prev => ({
      ...prev,
      [model]: {
        ...prev[model],
        status: success ? 'completed' : 'failed',
        progress: success ? 100 : prev[model]?.progress || 0,
        statusMessage: success
          ? 'Generation complete!'
          : errorMessage || 'Generation failed',
      },
    }))

    setCompletedModels(prev => {
      const newCount = prev + 1

      // Show toast notifications
      if (success) {
        toast.success(`${modelName} completed successfully!`, {
          description: 'Image generated and ready for download',
          duration: 3000,
        })
      } else {
        toast.error(`${modelName} failed`, {
          description: errorMessage || 'Generation failed',
          duration: 5000,
        })
      }

      return newCount
    })
  }

  const testConnection = async () => {
    setTestingConnection(true)

    // Show loading toast
    const loadingToast = toast.loading('Testing API connection...', {
      description: 'Checking Replicate API status',
    })

    try {
      console.log('🔍 Testing connection to /api/images/generate...')
      const response = await fetch('/api/images/generate')
      console.log('📡 Response status:', response.status, response.statusText)

      const data = await response.json()
      console.log('📦 Response data:', data)

      setConnectionStatus(data)

      // Update toast based on result
      if (data.connected) {
        toast.success('API connection successful!', {
          id: loadingToast,
          description: `${Object.keys(data.models).length} models available`,
          duration: 3000,
        })
      } else {
        toast.error('API connection failed', {
          id: loadingToast,
          description: 'Check your API key configuration',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      setConnectionStatus({
        connected: false,
        models: {},
        rateLimit: { requestsPerMinute: 0, concurrent: 0 },
      })

      toast.error('Connection test failed', {
        id: loadingToast,
        description: 'Network error or invalid configuration',
        duration: 5000,
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleModelToggle = (model: ModelKey, checked: boolean) => {
    const newSelectedModels = new Set(selectedModels)
    if (checked) {
      newSelectedModels.add(model)
    } else {
      newSelectedModels.delete(model)
    }
    setSelectedModels(newSelectedModels)
  }

  const selectAllModels = () => {
    const allModelKeys = Object.keys(modelInfo) as ModelKey[]
    setSelectedModels(new Set(allModelKeys))
  }

  const clearAllModels = () => {
    setSelectedModels(new Set())
  }

  const generateWithModel = async (
    model: ModelKey
  ): Promise<GenerationResult> => {
    const response = await fetch('/api/images/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        style: style || undefined,
        negativePrompt: negativePrompt || undefined,
        width: 1024,
        height: 1024,
      }),
    })

    return await response.json()
  }

  const generateImages = async () => {
    if (selectedModels.size === 0) return

    setLoading(true)
    const modelsToTest = Array.from(selectedModels)
    setTotalModels(modelsToTest.length)
    setCompletedModels(0)
    setOverallProgress(0)

    // Show start notification
    toast.info(
      `Starting generation with ${modelsToTest.length} model${modelsToTest.length !== 1 ? 's' : ''}`,
      {
        description: `Models: ${modelsToTest.map(m => modelInfo[m].name).join(', ')}`,
        duration: 3000,
      }
    )

    const newLoadingStates = { ...loadingStates }
    modelsToTest.forEach(model => {
      newLoadingStates[model] = true
      initializeModelProgress(model)
    })
    setLoadingStates(newLoadingStates)

    try {
      // Generate images for all selected models simultaneously
      const promises = modelsToTest.map(async model => {
        try {
          const result = await generateWithModel(model)
          completeModelProgress(model, result.success, result.error)
          return result
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          completeModelProgress(model, false, errorMessage)
          return {
            success: false,
            error: errorMessage,
          }
        }
      })

      const promiseResults = await Promise.allSettled(promises)

      // Update results
      const newResults: ModelResults = { ...results }
      modelsToTest.forEach((model, index) => {
        const result = promiseResults[index]
        newResults[model] =
          result.status === 'fulfilled'
            ? result.value
            : {
                success: false,
                error:
                  result.status === 'rejected'
                    ? result.reason.message
                    : 'Unknown error',
              }
      })

      setResults(newResults)

      // Calculate summary for final notification
      const successful = Object.values(newResults).filter(
        r => r?.success
      ).length
      const failed = Object.values(newResults).filter(r => r?.error).length
      const totalCost = Object.values(newResults).reduce(
        (sum, result) => sum + (result?.cost || 0),
        0
      )

      // Show completion notification
      if (successful > 0 && failed === 0) {
        toast.success('All generations completed successfully!', {
          description: `${successful} image${successful !== 1 ? 's' : ''} generated • Total cost: $${totalCost.toFixed(4)}`,
          duration: 5000,
        })
      } else if (successful > 0 && failed > 0) {
        toast.warning('Generation completed with mixed results', {
          description: `${successful} successful, ${failed} failed • Total cost: $${totalCost.toFixed(4)}`,
          duration: 5000,
        })
      } else {
        toast.error('All generations failed', {
          description: 'Check your API configuration and try again',
          duration: 5000,
        })
      }

      // Save to gallery if we have any results
      if (Object.keys(newResults).length > 0) {
        saveGenerationToGallery(prompt, newResults)
      }
    } catch (error) {
      console.error('Generation failed:', error)
      const errorResults: ModelResults = { ...results }
      modelsToTest.forEach(model => {
        errorResults[model] = {
          success: false,
          error: 'Network error occurred',
        }
        completeModelProgress(model, false, 'Network error occurred')
      })
      setResults(errorResults)

      toast.error('Generation process failed', {
        description: 'Network error occurred during generation',
        duration: 5000,
      })

      // Save error results to gallery too
      if (Object.keys(errorResults).length > 0) {
        saveGenerationToGallery(prompt, errorResults)
      }
    } finally {
      setLoading(false)
      const finalLoadingStates = { ...loadingStates }
      modelsToTest.forEach(model => {
        finalLoadingStates[model] = false
      })
      setLoadingStates(finalLoadingStates)
    }
  }

  // Update overall progress based on completed models
  useEffect(() => {
    if (totalModels > 0) {
      const progress = (completedModels / totalModels) * 100
      setOverallProgress(progress)

      // Show final completion notification when all models are done
      if (completedModels === totalModels && loading) {
        // This will be handled in the generateImages function instead
        // to avoid duplicate notifications
      }
    }
  }, [completedModels, totalModels, loading])

  const downloadImage = async (imageUrl: string, model: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${model}-generated-image-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Show success notification
      const modelName = modelInfo[model as ModelKey]?.name || model
      toast.success('Image downloaded successfully!', {
        description: `${modelName} image saved to your downloads`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed', {
        description: 'Unable to download the image. Please try again.',
        duration: 4000,
      })
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const getProgressBarColor = (status: ModelProgress['status']): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      case 'timeout-warning':
        return 'bg-yellow-500'
      case 'processing':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (
    model: ModelKey,
    result: GenerationResult | null,
    progress?: ModelProgress
  ) => {
    if (result?.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (result?.error) {
      return <XCircle className="h-5 w-5 text-red-500" />
    } else if (progress?.status === 'timeout-warning') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    } else if (loadingStates[model]) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    }
    return null
  }

  const ModelResultCard = ({
    model,
    result,
  }: {
    model: ModelKey
    result: GenerationResult | null
  }) => {
    const info = modelInfo[model]
    const progress = modelProgress[model]
    const isLoading = loadingStates[model]

    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={info.color}>{info.icon}</span>
            {info.name}
            {getStatusIcon(model, result, progress)}
          </CardTitle>
          <CardDescription>{info.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && progress && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progress.statusMessage}</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(progress.elapsedTime)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress.progress)}%</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${getProgressBarColor(progress.status)}`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              {progress.status === 'timeout-warning' && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm bg-yellow-50 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Taking longer than usual - please wait...</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Expected completion: ~{formatTime(info.timeout)}
              </div>
            </div>
          )}

          {result?.success && result.result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Time:</strong> {result.result.generationTime}s
                </div>
                <div>
                  <strong>Cost:</strong> ${result.cost?.toFixed(4)}
                </div>
              </div>

              <div className="relative">
                <img
                  src={result.result.imageUrl}
                  alt={`Generated image with ${info.name}`}
                  className="w-full rounded-lg shadow-lg"
                />
                <Button
                  onClick={() => downloadImage(result.result!.imageUrl, model)}
                  className="absolute top-2 right-2"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <strong>ID:</strong> {result.result.id}
              </div>
            </div>
          ) : result?.error ? (
            <div className="text-red-500 py-4">
              <strong>Error:</strong> {result.error}
            </div>
          ) : !isLoading ? (
            <div className="text-muted-foreground py-8 text-center">
              Select this model and click "Generate" to start
            </div>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          Replicate API Test - Multi-Model Generation
        </h1>
        <p className="text-muted-foreground">
          Test your Replicate API key with any combination of available image
          generation models.
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Generate Images
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                API Connection Status
                {connectionStatus?.connected === true && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {connectionStatus?.connected === false && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
              <CardDescription>
                Test your Replicate API connection and view available models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testConnection}
                disabled={testingConnection}
                className="mb-4"
              >
                {testingConnection && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Test Connection
              </Button>

              {connectionStatus && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        connectionStatus.connected ? 'default' : 'destructive'
                      }
                    >
                      {connectionStatus.connected
                        ? 'Connected'
                        : 'Disconnected'}
                    </Badge>
                  </div>

                  {connectionStatus.connected && (
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Rate Limit:{' '}
                        {connectionStatus.rateLimit.requestsPerMinute}{' '}
                        requests/min, {connectionStatus.rateLimit.concurrent}{' '}
                        concurrent
                      </p>
                      <p>
                        Available Models:{' '}
                        {Object.keys(connectionStatus.models).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Generation Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generate Images</CardTitle>
              <CardDescription>
                Select any combination of models to test simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setPrompt(e.target.value)
                  }
                  placeholder="Describe the image you want to generate..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="style">Style (Optional)</Label>
                  <Input
                    id="style"
                    value={style}
                    onChange={e => setStyle(e.target.value)}
                    placeholder="e.g., watercolor, oil painting"
                  />
                </div>

                <div>
                  <Label htmlFor="negative">Negative Prompt (Optional)</Label>
                  <Input
                    id="negative"
                    value={negativePrompt}
                    onChange={e => setNegativePrompt(e.target.value)}
                    placeholder="What to avoid..."
                  />
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Select Models to Test</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllModels}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllModels}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(modelInfo).map(([key, info]) => (
                    <div
                      key={key}
                      className="flex items-center space-x-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        id={key}
                        checked={selectedModels.has(key as ModelKey)}
                        onCheckedChange={checked =>
                          handleModelToggle(key as ModelKey, checked as boolean)
                        }
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className={info.color}>{info.icon}</span>
                        <div>
                          <label
                            htmlFor={key}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {info.name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-sm text-muted-foreground">
                  {selectedModels.size} model
                  {selectedModels.size !== 1 ? 's' : ''} selected
                </div>
              </div>

              <Button
                onClick={generateImages}
                disabled={
                  loading || !prompt.trim() || selectedModels.size === 0
                }
                className="w-full"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate with {selectedModels.size} Model
                {selectedModels.size !== 1 ? 's' : ''}
                {selectedModels.size > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    (
                    {Array.from(selectedModels)
                      .map(m => modelInfo[m].name)
                      .join(', ')}
                    )
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Overall Progress Indicator */}
          {loading && totalModels > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Images
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Processing {totalModels} model{totalModels !== 1 ? 's' : ''}{' '}
                  simultaneously
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">
                      {completedModels} of {totalModels} completed
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(overallProgress)}% complete
                  </div>
                </div>

                {/* Active Models Status */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-blue-700">
                    Active Models:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Array.from(selectedModels).map(model => {
                      const progress = modelProgress[model]
                      const info = modelInfo[model]
                      if (!progress || progress.status === 'idle') return null

                      return (
                        <div
                          key={model}
                          className="flex items-center gap-2 p-2 bg-white rounded border"
                        >
                          <span className={`${info.color} flex-shrink-0`}>
                            {info.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {info.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {progress.statusMessage}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {progress.status === 'timeout-warning' && (
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            )}
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(progress.elapsedTime)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Estimated completion times */}
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Expected completion times:</span>
                    {Array.from(selectedModels).map(model => {
                      const info = modelInfo[model]
                      return (
                        <span key={model} className="flex items-center gap-1">
                          <span className={info.color}>{info.icon}</span>~
                          {formatTime(info.timeout)}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(results).map(([model, result]) => (
              <ModelResultCard
                key={model}
                model={model as ModelKey}
                result={result}
              />
            ))}
          </div>

          {/* Summary */}
          {Object.keys(results).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Generation Summary
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {!loading &&
                    completedModels === totalModels &&
                    totalModels > 0 && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                </CardTitle>
                <CardDescription>
                  {loading
                    ? 'Generation in progress...'
                    : 'Generation completed'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <strong>Total Cost:</strong> $
                    {Object.values(results)
                      .reduce((sum, result) => sum + (result?.cost || 0), 0)
                      .toFixed(4)}
                  </div>
                  <div>
                    <strong>Successful:</strong>{' '}
                    {Object.values(results).filter(r => r?.success).length}
                  </div>
                  <div>
                    <strong>Failed:</strong>{' '}
                    {Object.values(results).filter(r => r?.error).length}
                  </div>
                  <div>
                    <strong>Models Tested:</strong>{' '}
                    {Object.keys(results).length}
                  </div>
                </div>

                {/* Detailed timing information */}
                {!loading && Object.keys(results).length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      Model Performance:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(results).map(([model, result]) => {
                        const info = modelInfo[model as ModelKey]
                        const progress = modelProgress[model]

                        return (
                          <div
                            key={model}
                            className="flex items-center gap-2 p-3 border rounded-lg"
                          >
                            <span className={info.color}>{info.icon}</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {info.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {result?.success ? (
                                  <span className="text-green-600">
                                    ✓ {result.result?.generationTime}s • $
                                    {result.cost?.toFixed(4)}
                                  </span>
                                ) : (
                                  <span className="text-red-600">
                                    ✗ Failed
                                    {progress?.elapsedTime
                                      ? ` after ${formatTime(progress.elapsedTime)}`
                                      : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <ImageGallery />
        </TabsContent>
      </Tabs>
    </div>
  )
}
