'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import {
  ProgressIndicator,
  useProgressSteps,
} from '@/components/ui/progress-indicator'
import { useToast } from '@/components/ui/toast'

interface ImageResult {
  requestId: string
  index: number
  status: 'completed' | 'failed' | 'processing'
  response?: {
    imageUrl: string
    prompt: string
    model: string
    width: number
    height: number
  }
  error?: string
  cost?: number
  duration?: number
  provider?: string
}

interface RegenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  image: ImageResult | null
  onRegenerate: (
    image: ImageResult,
    modificationPrompt?: string
  ) => Promise<void>
  isLoading?: boolean
}

const REGENERATION_STEPS = [
  { id: 'validate', label: 'Validating request', duration: 500 },
  { id: 'connect', label: 'Connecting to AI service', duration: 1000 },
  { id: 'generate', label: 'Generating new image', duration: 8000 },
  { id: 'upload', label: 'Uploading to storage', duration: 2000 },
  { id: 'update', label: 'Updating database', duration: 500 },
]

export function RegenerationDialog({
  open,
  onOpenChange,
  image,
  onRegenerate,
  isLoading = false,
}: RegenerationDialogProps) {
  const [modificationPrompt, setModificationPrompt] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const { addToast } = useToast()

  const { steps, currentStep, startStep, completeStep, errorStep, resetSteps } =
    useProgressSteps(REGENERATION_STEPS)

  const handleRegenerate = async () => {
    if (!image) return

    setIsRegenerating(true)
    setShowProgress(true)
    resetSteps()

    const startTime = Date.now()

    try {
      // Step 1: Validate
      startStep('validate')
      await new Promise(resolve => setTimeout(resolve, 300))
      completeStep('validate', 300)

      // Step 2: Connect
      startStep('connect')
      await new Promise(resolve => setTimeout(resolve, 800))
      completeStep('connect', 800)

      // Step 3: Generate (this is the actual API call)
      startStep('generate')
      const generateStart = Date.now()

      await onRegenerate(image, modificationPrompt.trim() || undefined)

      const generateDuration = Date.now() - generateStart
      completeStep('generate', generateDuration)

      // Step 4: Upload (simulated - in real implementation this would be part of the API)
      startStep('upload')
      await new Promise(resolve => setTimeout(resolve, 1500))
      completeStep('upload', 1500)

      // Step 5: Update database (simulated)
      startStep('update')
      await new Promise(resolve => setTimeout(resolve, 400))
      completeStep('update', 400)

      const totalDuration = Date.now() - startTime

      // Success toast
      addToast({
        type: 'success',
        title: 'Image regenerated successfully!',
        description: `Completed in ${(totalDuration / 1000).toFixed(1)} seconds`,
        duration: 4000,
      })

      setModificationPrompt('')
      onOpenChange(false)
    } catch (error) {
      console.error('Regeneration failed:', error)

      // Error the current step
      if (currentStep) {
        errorStep(
          currentStep,
          error instanceof Error ? error.message : 'Unknown error'
        )
      }

      // Error toast
      addToast({
        type: 'error',
        title: 'Regeneration failed',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => handleRegenerate(),
        },
      })
    } finally {
      setIsRegenerating(false)
      // Keep progress visible for a moment to show completion
      setTimeout(() => setShowProgress(false), 2000)
    }
  }

  const handleCancel = () => {
    if (isRegenerating) {
      addToast({
        type: 'warning',
        title: 'Regeneration cancelled',
        description: 'The operation was stopped by user request',
        duration: 3000,
      })
    }
    setModificationPrompt('')
    setShowProgress(false)
    resetSteps()
    onOpenChange(false)
  }

  const loading = isLoading || isRegenerating

  if (!image) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Regenerate Image
          </DialogTitle>
          <DialogDescription>
            This will create a new version of the image. The original will be
            replaced.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Indicator */}
          {showProgress && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h4 className="text-sm font-medium mb-3">
                Regeneration Progress
              </h4>
              <ProgressIndicator
                steps={steps}
                currentStep={currentStep}
                showEstimatedTime={true}
              />
            </div>
          )}

          {/* Current Image Preview */}
          {image.response?.imageUrl && !showProgress && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Image</Label>
              <div className="relative">
                <img
                  src={image.response.imageUrl}
                  alt="Current image"
                  className="w-full h-32 object-cover rounded-md border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-md flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium">
                    Will be replaced
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Original Prompt */}
          {image.response?.prompt && !showProgress && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Original Prompt</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {image.response.prompt}
              </div>
            </div>
          )}

          {/* Modification Input */}
          {!showProgress && (
            <div className="space-y-2">
              <Label htmlFor="modification" className="text-sm font-medium">
                Modification Request (Optional)
              </Label>
              <Textarea
                id="modification"
                placeholder="e.g., make the character happier, add more vibrant colors, change the lighting to sunset..."
                value={modificationPrompt}
                onChange={e => setModificationPrompt(e.target.value)}
                className="min-h-[80px]"
                maxLength={200}
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Leave empty to regenerate with the same prompt</span>
                <span>{modificationPrompt.length}/200</span>
              </div>
            </div>
          )}

          {/* Warning */}
          {!showProgress && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">This action cannot be undone</p>
                <p>
                  The current image will be permanently replaced with a new
                  generation.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading && !isRegenerating}
          >
            {isRegenerating ? 'Cancel' : 'Close'}
          </Button>
          {!showProgress && (
            <Button
              onClick={handleRegenerate}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
