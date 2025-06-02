'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { RegenerateButton } from '@/components/ui/regenerate-button'
import { RegenerationDialog } from '@/components/ui/regeneration-dialog'

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

interface ImageGalleryProps {
  images: ImageResult[]
  title?: string
  showMetadata?: boolean
  storyMode?: boolean
  onRegenerateImage?: (
    image: ImageResult,
    modificationPrompt?: string
  ) => Promise<void>
}

export function ImageGallery({
  images,
  title = 'Generated Images',
  showMetadata = true,
  storyMode = false,
  onRegenerateImage,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [regenerationDialogOpen, setRegenerationDialogOpen] = useState(false)
  const [imageToRegenerate, setImageToRegenerate] =
    useState<ImageResult | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const completedImages = images.filter(
    img => img.status === 'completed' && img.response?.imageUrl
  )
  const failedImages = images.filter(img => img.status === 'failed')

  const openModal = (image: ImageResult, index: number) => {
    setSelectedImage(image)
    setCurrentIndex(index)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'prev'
        ? (currentIndex - 1 + completedImages.length) % completedImages.length
        : (currentIndex + 1) % completedImages.length

    setCurrentIndex(newIndex)
    setSelectedImage(completedImages[newIndex])
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const downloadAll = async () => {
    for (let i = 0; i < completedImages.length; i++) {
      const image = completedImages[i]
      if (image.response?.imageUrl) {
        const filename = storyMode
          ? `luna-story-scene-${i + 1}.png`
          : `generated-image-${i + 1}.png`
        await downloadImage(image.response.imageUrl, filename)
        // Add delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  const handleOpenRegenerationDialog = (image: ImageResult) => {
    setImageToRegenerate(image)
    setRegenerationDialogOpen(true)
  }

  const handleRegenerateImage = async (
    image: ImageResult,
    modificationPrompt?: string
  ) => {
    if (!onRegenerateImage) return

    setIsRegenerating(true)
    try {
      await onRegenerateImage(image, modificationPrompt)
    } finally {
      setIsRegenerating(false)
    }
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">
            No images to display yet. Generate a batch to see results here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">
            {completedImages.length} completed, {failedImages.length} failed,{' '}
            {images.length - completedImages.length - failedImages.length}{' '}
            processing
          </p>
        </div>
        {completedImages.length > 0 && (
          <Button onClick={downloadAll} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        )}
      </div>

      {/* Story Mode Header */}
      {storyMode && completedImages.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900">
            Luna's Magical Adventure
          </h4>
          <p className="text-sm text-blue-700">
            Click any image to view the full story sequence
          </p>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <Card key={image.requestId} className="overflow-hidden">
            <CardContent className="p-0">
              {image.status === 'completed' && image.response?.imageUrl ? (
                <div className="relative group">
                  <img
                    src={image.response.imageUrl}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-48 object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() =>
                      openModal(
                        image,
                        completedImages.findIndex(
                          img => img.requestId === image.requestId
                        )
                      )
                    }
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => {
                          e.stopPropagation()
                          openModal(
                            image,
                            completedImages.findIndex(
                              img => img.requestId === image.requestId
                            )
                          )
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      {onRegenerateImage && (
                        <RegenerateButton
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                          useDialog={true}
                          onOpenDialog={() =>
                            handleOpenRegenerationDialog(image)
                          }
                          onRegenerate={() => {}} // Legacy fallback
                        />
                      )}
                    </div>
                  </div>

                  {/* Metadata overlay */}
                  {showMetadata && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <div className="flex justify-between items-end">
                        <div className="text-white text-xs">
                          <p className="font-medium">
                            {image.response.model || 'Unknown'}
                          </p>
                          <p className="opacity-80">
                            {image.response.width}×{image.response.height}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {image.cost ? `$${image.cost.toFixed(3)}` : 'Free'}
                          </Badge>
                          {image.duration && (
                            <Badge
                              variant="outline"
                              className="text-xs text-white border-white/30"
                            >
                              {(image.duration / 1000).toFixed(1)}s
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : image.status === 'failed' ? (
                <div className="h-48 bg-red-50 border-2 border-red-200 border-dashed flex flex-col items-center justify-center p-4">
                  <div className="text-red-600 text-center">
                    <X className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Generation Failed</p>
                    <p className="text-xs opacity-80 mt-1">
                      {image.error || 'Unknown error'}
                    </p>
                  </div>
                  {onRegenerateImage && (
                    <RegenerateButton
                      variant="outline"
                      size="sm"
                      className="mt-3 border-red-300 text-red-600 hover:bg-red-50"
                      showText={false}
                      useDialog={true}
                      onOpenDialog={() => handleOpenRegenerationDialog(image)}
                      onRegenerate={() => {}} // Legacy fallback
                    />
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Generating...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && selectedImage.response?.imageUrl && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>
                  {storyMode ? "Luna's Adventure" : 'Generated Image'} (
                  {currentIndex + 1} of {completedImages.length})
                </span>
                <div className="flex gap-2">
                  {onRegenerateImage && (
                    <RegenerateButton
                      variant="outline"
                      size="sm"
                      useDialog={true}
                      onOpenDialog={() =>
                        handleOpenRegenerationDialog(selectedImage)
                      }
                      onRegenerate={() => {}} // Legacy fallback
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedImage.response?.imageUrl) {
                        const filename = storyMode
                          ? `luna-story-scene-${currentIndex + 1}.png`
                          : `generated-image-${currentIndex + 1}.png`
                        downloadImage(selectedImage.response.imageUrl, filename)
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="relative">
              <img
                src={selectedImage.response.imageUrl}
                alt={`Generated image ${currentIndex + 1}`}
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />

              {/* Navigation */}
              {completedImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                    onClick={() => navigateImage('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                    onClick={() => navigateImage('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Image Details */}
            {showMetadata && (
              <div className="space-y-3 max-h-32 overflow-y-auto">
                <div>
                  <h4 className="font-medium text-sm mb-1">Prompt</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedImage.response.prompt}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Model:</span>
                    <p className="text-gray-600">
                      {selectedImage.response.model}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>
                    <p className="text-gray-600">
                      {selectedImage.response.width}×
                      {selectedImage.response.height}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Cost:</span>
                    <p className="text-gray-600">
                      {selectedImage.cost
                        ? `$${selectedImage.cost.toFixed(3)}`
                        : 'Free'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p className="text-gray-600">
                      {selectedImage.duration
                        ? `${(selectedImage.duration / 1000).toFixed(1)}s`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Regeneration Dialog */}
      <RegenerationDialog
        open={regenerationDialogOpen}
        onOpenChange={setRegenerationDialogOpen}
        image={imageToRegenerate}
        onRegenerate={handleRegenerateImage}
        isLoading={isRegenerating}
      />
    </div>
  )
}
