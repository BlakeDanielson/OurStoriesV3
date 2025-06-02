'use client'

import { useState } from 'react'
import { ImageGallery } from '@/components/ui/image-gallery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'

// Mock image data for testing
const mockImages = [
  {
    requestId: '1',
    index: 0,
    status: 'completed' as const,
    response: {
      imageUrl: 'https://picsum.photos/400/300?random=1',
      prompt: 'A magical forest with glowing mushrooms and fairy lights',
      model: 'flux-1.1-pro',
      width: 400,
      height: 300,
    },
    cost: 0.025,
    duration: 3500,
    provider: 'replicate',
  },
  {
    requestId: '2',
    index: 1,
    status: 'completed' as const,
    response: {
      imageUrl: 'https://picsum.photos/400/300?random=2',
      prompt: 'A friendly dragon reading a book to forest animals',
      model: 'flux-1.1-pro',
      width: 400,
      height: 300,
    },
    cost: 0.025,
    duration: 4200,
    provider: 'replicate',
  },
  {
    requestId: '3',
    index: 2,
    status: 'failed' as const,
    error: 'Content policy violation',
    cost: 0.0,
    duration: 1000,
    provider: 'replicate',
  },
  {
    requestId: '4',
    index: 3,
    status: 'completed' as const,
    response: {
      imageUrl: 'https://picsum.photos/400/300?random=3',
      prompt: 'A cozy cottage with smoke coming from the chimney',
      model: 'flux-1.1-pro',
      width: 400,
      height: 300,
    },
    cost: 0.025,
    duration: 3800,
    provider: 'replicate',
  },
]

function TestRegenerationContent() {
  const [images, setImages] = useState(mockImages)
  const [regenerationLog, setRegenerationLog] = useState<string[]>([])

  const handleRegenerateImage = async (
    image: any,
    modificationPrompt?: string
  ) => {
    const logEntry = modificationPrompt
      ? `Regenerating image "${image.response?.prompt || 'Failed image'}" with modification: "${modificationPrompt}"`
      : `Regenerating image "${image.response?.prompt || 'Failed image'}" with original prompt`

    setRegenerationLog(prev => [...prev, logEntry])

    try {
      // Simulate API delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Call the regeneration API
      const response = await fetch('/api/images/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPrompt: image.response?.prompt || 'A beautiful scene',
          modificationPrompt: modificationPrompt,
          model: image.response?.model || 'flux1',
          width: image.response?.width || 1024,
          height: image.response?.height || 1024,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.result.imageUrl) {
        // Update the image in the gallery
        setImages(prevImages =>
          prevImages.map(img =>
            img.requestId === image.requestId
              ? {
                  ...img,
                  status: 'completed' as const,
                  response: {
                    imageUrl: result.result.imageUrl,
                    prompt: result.finalPrompt,
                    model:
                      result.result.model || img.response?.model || 'flux1',
                    width: result.result.width || img.response?.width || 1024,
                    height:
                      result.result.height || img.response?.height || 1024,
                  },
                  cost: result.cost || 0.025,
                  duration: result.result.generationTime || 3000,
                  error: undefined,
                }
              : img
          )
        )

        setRegenerationLog(prev => [
          ...prev,
          `✅ Successfully regenerated image with new URL: ${result.result.imageUrl}`,
        ])
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Regeneration failed:', error)
      setRegenerationLog(prev => [
        ...prev,
        `❌ Regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ])
      throw error // Re-throw to trigger error handling in the dialog
    }
  }

  const clearLog = () => {
    setRegenerationLog([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Regeneration System</h1>
        <p className="text-gray-600">
          Testing the complete regeneration system with progress indicators,
          toast notifications, and enhanced user feedback
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Gallery */}
        <div className="lg:col-span-2">
          <ImageGallery
            images={images}
            title="Story Images with Enhanced Regeneration"
            showMetadata={true}
            storyMode={true}
            onRegenerateImage={handleRegenerateImage}
          />
        </div>

        {/* Regeneration Log */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Regeneration Log
                <Button variant="outline" size="sm" onClick={clearLog}>
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {regenerationLog.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No regenerations yet. Click "Regenerate" on any image to
                    test the enhanced system.
                  </p>
                ) : (
                  regenerationLog.map((entry, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded border-l-2 ${
                        entry.startsWith('✅')
                          ? 'bg-green-50 border-green-200'
                          : entry.startsWith('❌')
                            ? 'bg-red-50 border-red-200'
                            : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Implementation Status */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Task 15 Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  15.1 Regeneration Button Interface ✅
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  15.2 Optional Modification Input ✅
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">15.3 Confirmation Dialog ✅</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">15.4 API Integration ✅</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">15.5 Image Replacement Logic ✅</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  15.6 Loading States & User Feedback ✅
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">
          Enhanced Features to Test:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Click "Regenerate" to see the new progress indicator with
            step-by-step feedback
          </li>
          <li>
            • Watch for toast notifications showing success, error, and warning
            messages
          </li>
          <li>
            • Try cancelling a regeneration in progress to see cancellation
            handling
          </li>
          <li>
            • Test with modification prompts to see enhanced prompt combination
          </li>
          <li>
            • Notice the improved loading states and visual feedback throughout
            the process
          </li>
          <li>
            • Error scenarios now show detailed progress and retry options
          </li>
        </ul>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">
          New UX Improvements:
        </h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Real-time progress tracking with estimated completion times</li>
          <li>
            • Toast notifications for all user actions and system responses
          </li>
          <li>• Enhanced error handling with retry functionality</li>
          <li>• Graceful cancellation with user feedback</li>
          <li>• Database integration with proper access control and cleanup</li>
          <li>• Comprehensive loading states across all components</li>
        </ul>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg">
        <h3 className="font-medium text-amber-900 mb-2">Note:</h3>
        <p className="text-sm text-amber-800">
          This test page demonstrates the complete regeneration workflow. In
          production, the API would connect to actual AI services and update
          real database records. All UI components and user feedback systems are
          fully functional.
        </p>
      </div>
    </div>
  )
}

export default function TestRegenerationPage() {
  return (
    <ToastProvider>
      <TestRegenerationContent />
    </ToastProvider>
  )
}
