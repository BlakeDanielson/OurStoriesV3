'use client'

import { PhotoUploadInterface } from '@/components/upload/PhotoUploadInterface'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export default function PhotoUploadDemoPage() {
  const [enableOptimization, setEnableOptimization] = useState(true)

  const handleUpload = (urls: string[]) => {
    console.log('Uploaded photo URLs:', urls)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Photo Upload Interface Demo
          </h1>
          <p className="text-muted-foreground">
            Test the photo upload interface with drag-and-drop functionality,
            face detection validation, image optimization, upload guidelines,
            and example photos gallery.
          </p>
        </div>

        {/* Controls */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="optimization"
              checked={enableOptimization}
              onCheckedChange={setEnableOptimization}
            />
            <Label htmlFor="optimization">
              Enable Image Optimization (compression, resizing, format
              optimization)
            </Label>
          </div>
        </Card>

        <div className="flex justify-center">
          <PhotoUploadInterface
            maxFiles={5}
            maxFileSize={4}
            onUpload={handleUpload}
            enableOptimization={enableOptimization}
          />
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Features Demonstrated:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-medium mb-2">Core Upload Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Drag and drop photo upload with visual feedback</li>
                <li>File validation (type, size, count limits)</li>
                <li>Photo preview with progress indicators</li>
                <li>Photo management (remove/replace functionality)</li>
                <li>Responsive grid layout for photo previews</li>
              </ul>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-2">Advanced Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Simulated face detection validation</li>
                <li>Client-side image optimization and compression</li>
                <li>Upload guidelines and help tooltips</li>
                <li>Visual status indicators for processing states</li>
                <li>Optimization statistics display</li>
                <li>Interactive example photos gallery</li>
              </ul>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="font-medium mb-2">Example Photos Gallery</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Click "View Examples" in the guidelines section to see:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Interactive good vs. bad photo comparisons</li>
                <li>
                  Categorized examples: Face Visibility, Lighting, Background,
                  Quality
                </li>
                <li>Toggle between good and bad examples with explanations</li>
                <li>Quick tips for taking great face photos</li>
                <li>Visual guidelines with icons and color coding</li>
              </ul>
              <p className="mt-2">
                <strong>Note:</strong> The gallery uses placeholder
                illustrations but demonstrates the interaction patterns and
                educational content structure.
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-2">Image Optimization Pipeline</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>When enabled, the optimization pipeline:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Resizes images to maximum 1920x1080 while maintaining aspect
                  ratio
                </li>
                <li>Compresses images with 80% quality (JPEG format)</li>
                <li>Targets maximum file size of 500KB</li>
                <li>Shows compression statistics (percentage reduction)</li>
                <li>Provides visual feedback during optimization process</li>
              </ul>
              <p className="mt-2">
                <strong>Note:</strong> This is a client-side implementation
                using HTML5 Canvas. In production, you might want to use a more
                robust solution or server-side processing.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
