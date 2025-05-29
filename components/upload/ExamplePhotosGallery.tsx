'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Eye,
  Sun,
  User,
  Camera,
} from 'lucide-react'

interface PhotoExampleProps {
  title: string
  goodDescription: string
  badDescription: string
  className?: string
}

const PhotoExample = ({
  title,
  goodDescription,
  badDescription,
  className,
}: PhotoExampleProps) => {
  const [showGood, setShowGood] = useState(true)

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>

        {/* Toggle buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowGood(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              showGood
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <CheckCircle className="h-4 w-4" />
            Good Example
          </button>
          <button
            onClick={() => setShowGood(false)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              !showGood
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <X className="h-4 w-4" />
            Bad Example
          </button>
        </div>

        {/* Example illustration */}
        <div className="relative aspect-square w-full max-w-sm mx-auto mb-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <div
              className={cn(
                'w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center',
                showGood
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              )}
            >
              <User className="h-8 w-8" />
            </div>
            <p className="text-sm text-gray-600">
              {showGood ? '✓ Good Photo' : '✗ Poor Photo'}
            </p>
          </div>
        </div>

        {/* Description */}
        <div
          className={cn(
            'p-4 rounded-lg border',
            showGood
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          )}
        >
          <div className="flex items-start">
            {showGood ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-sm">
              {showGood ? goodDescription : badDescription}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface ExamplePhotosGalleryProps {
  className?: string
}

export function ExamplePhotosGallery({ className }: ExamplePhotosGalleryProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="text-center mb-8">
        <Badge className="mb-2">Photo Guidelines</Badge>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Face Photo Examples
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Learn what makes a great face photo by comparing good and bad examples
          across different categories.
        </p>
      </div>

      <Tabs defaultValue="visibility" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="visibility" className="text-xs">
              <Eye className="h-4 w-4 mr-1" />
              Visibility
            </TabsTrigger>
            <TabsTrigger value="lighting" className="text-xs">
              <Sun className="h-4 w-4 mr-1" />
              Lighting
            </TabsTrigger>
            <TabsTrigger value="background" className="text-xs">
              <Camera className="h-4 w-4 mr-1" />
              Background
            </TabsTrigger>
            <TabsTrigger value="quality" className="text-xs">
              <User className="h-4 w-4 mr-1" />
              Quality
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visibility" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <PhotoExample
              title="Face Visibility"
              goodDescription="Face is clearly visible, centered in frame, with eyes, nose, and mouth all clearly distinguishable. No obstructions blocking facial features."
              badDescription="Face is partially hidden by hands, hair, or other objects. Facial features are not clearly visible or identifiable."
            />
            <PhotoExample
              title="Eye Contact & Angle"
              goodDescription="Looking directly at camera with a natural, straight-on angle. Face is not tilted or turned away from the camera."
              badDescription="Looking away from camera, face turned to the side, or head tilted at an extreme angle that makes identification difficult."
            />
          </div>
        </TabsContent>

        <TabsContent value="lighting" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <PhotoExample
              title="Natural Lighting"
              goodDescription="Even, natural lighting that illuminates the entire face without harsh shadows. Soft, diffused light creates a clear, well-lit photo."
              badDescription="Too dark, too bright, or harsh shadows that obscure facial features. Backlighting that creates silhouettes."
            />
            <PhotoExample
              title="No Flash Glare"
              goodDescription="No harsh flash reflections or glare. Skin tones appear natural and true to life with proper color balance."
              badDescription="Harsh flash creating overexposed areas, red-eye effect, or unnatural skin tones that distort appearance."
            />
          </div>
        </TabsContent>

        <TabsContent value="background" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <PhotoExample
              title="Clean Background"
              goodDescription="Simple, neutral background that doesn't distract from the face. Plain wall, sky, or uncluttered environment."
              badDescription="Busy, cluttered background with distracting elements, patterns, or other people that compete for attention."
            />
            <PhotoExample
              title="Appropriate Setting"
              goodDescription="Professional or neutral setting appropriate for identification purposes. Indoor or outdoor with good contrast."
              badDescription="Inappropriate settings like parties, bars, or overly casual environments that detract from the photo's purpose."
            />
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <PhotoExample
              title="Image Sharpness"
              goodDescription="Sharp, clear image with good focus on facial features. High enough resolution to see details clearly."
              badDescription="Blurry, pixelated, or out-of-focus image that makes facial features difficult to distinguish."
            />
            <PhotoExample
              title="No Accessories"
              goodDescription="No sunglasses, hats, or other accessories that obscure facial features. Natural appearance without heavy makeup or filters."
              badDescription="Sunglasses, hats, masks, or heavy filters that significantly alter or hide natural facial features."
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-6 bg-muted rounded-lg border">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium mb-2">
              Quick Tips for Great Face Photos
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Use natural lighting whenever possible - near a window works
                  great
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Keep your face centered and fill about 60-70% of the frame
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Maintain a neutral expression with a slight smile</span>
              </li>
              <li className="flex items-start">
                <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Avoid group photos - only one person should be in the frame
                </span>
              </li>
              <li className="flex items-start">
                <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Don't use heavily filtered or edited photos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
