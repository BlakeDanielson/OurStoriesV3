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
import { Download, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react'

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
}

export function ImageGallery({
  images,
  title = 'Generated Images',
  showMetadata = true,
  storyMode = false,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

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
                  </div>
                  {storyMode && (
                    <Badge className="absolute top-2 left-2 bg-blue-600">
                      Scene {index + 1}
                    </Badge>
                  )}
                  <Badge
                    className="absolute top-2 right-2"
                    variant={
                      image.status === 'completed' ? 'default' : 'destructive'
                    }
                  >
                    {image.status}
                  </Badge>
                </div>
              ) : image.status === 'failed' ? (
                <div className="h-48 bg-red-50 flex items-center justify-center">
                  <div className="text-center">
                    <Badge variant="destructive" className="mb-2">
                      Failed
                    </Badge>
                    <p className="text-sm text-red-600">
                      {image.error || 'Generation failed'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-2">
                      Processing
                    </Badge>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {showMetadata && image.response && (
                <div className="p-3 space-y-2">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {image.response.prompt}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{image.response.model}</span>
                    {image.cost && <span>${image.cost.toFixed(3)}</span>}
                  </div>
                  {image.duration && (
                    <div className="text-xs text-gray-500">
                      {Math.round(image.duration / 1000)}s
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal for full-size viewing */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {storyMode
                  ? `Scene ${currentIndex + 1}`
                  : `Image ${currentIndex + 1}`}
                {completedImages.length > 1 && ` of ${completedImages.length}`}
              </span>
              <div className="flex gap-2">
                {completedImages.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateImage('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateImage('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {selectedImage?.response?.imageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const filename = storyMode
                        ? `luna-story-scene-${currentIndex + 1}.png`
                        : `generated-image-${currentIndex + 1}.png`
                      downloadImage(selectedImage.response!.imageUrl, filename)
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedImage?.response?.imageUrl && (
            <div className="space-y-4">
              <img
                src={selectedImage.response.imageUrl}
                alt={`Generated image ${currentIndex + 1}`}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />

              <div className="space-y-2">
                <p className="text-sm font-medium">Prompt:</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedImage.response.prompt}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Model:</span>{' '}
                    {selectedImage.response.model}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>{' '}
                    {selectedImage.response.width}×
                    {selectedImage.response.height}
                  </div>
                  {selectedImage.cost && (
                    <div>
                      <span className="font-medium">Cost:</span> $
                      {selectedImage.cost.toFixed(3)}
                    </div>
                  )}
                  {selectedImage.duration && (
                    <div>
                      <span className="font-medium">Time:</span>{' '}
                      {Math.round(selectedImage.duration / 1000)}s
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
