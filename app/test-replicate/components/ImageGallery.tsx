'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Trash2,
  Download,
  Eye,
  Calendar,
  Clock,
  DollarSign,
  Zap,
} from 'lucide-react'
import Image from 'next/image'

interface SavedGeneration {
  id: string
  timestamp: number
  prompt: string
  results: Array<{
    model: string
    modelName: string
    success: boolean
    imageUrl?: string
    error?: string
    cost?: number
    generationTime?: number
  }>
  totalCost: number
  successCount: number
  failCount: number
}

export function ImageGallery() {
  const [savedGenerations, setSavedGenerations] = useState<SavedGeneration[]>(
    []
  )
  const [selectedGeneration, setSelectedGeneration] =
    useState<SavedGeneration | null>(null)

  useEffect(() => {
    loadSavedGenerations()
  }, [])

  const loadSavedGenerations = () => {
    try {
      const saved = localStorage.getItem('imageGenerationHistory')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedGenerations(
          parsed.sort(
            (a: SavedGeneration, b: SavedGeneration) =>
              b.timestamp - a.timestamp
          )
        )
      }
    } catch (error) {
      console.error('Error loading saved generations:', error)
    }
  }

  const clearHistory = () => {
    localStorage.removeItem('imageGenerationHistory')
    setSavedGenerations([])
  }

  const deleteGeneration = (id: string) => {
    const updated = savedGenerations.filter(gen => gen.id !== id)
    setSavedGenerations(updated)
    localStorage.setItem('imageGenerationHistory', JSON.stringify(updated))
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  if (savedGenerations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Generation Gallery
          </CardTitle>
          <CardDescription>
            No saved generations yet. Generate some images to see them here!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Generation Gallery
              </CardTitle>
              <CardDescription>
                {savedGenerations.length} generation trial
                {savedGenerations.length !== 1 ? 's' : ''} saved
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedGenerations.map((generation, index) => (
          <Card key={generation.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  Trial #{savedGenerations.length - index}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGeneration(generation.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(generation.timestamp)}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCost(generation.totalCost)}
                  </span>
                  <span className="text-green-600">
                    ✓ {generation.successCount}
                  </span>
                  {generation.failCount > 0 && (
                    <span className="text-red-600">
                      ✗ {generation.failCount}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium mb-3 line-clamp-2">
                {generation.prompt}
              </p>

              {/* Preview images */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {generation.results
                  .filter(result => result.success && result.imageUrl)
                  .slice(0, 4)
                  .map((result, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-md overflow-hidden bg-muted"
                    >
                      <Image
                        src={result.imageUrl!}
                        alt={`${result.modelName} result`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                        {result.modelName}
                      </div>
                    </div>
                  ))}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedGeneration(generation)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Generation Trial #{savedGenerations.length - index}
                    </DialogTitle>
                  </DialogHeader>

                  {selectedGeneration && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Prompt</h4>
                        <p className="text-sm bg-muted p-3 rounded-md">
                          {selectedGeneration.prompt}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedGeneration.results.map((result, idx) => (
                          <Card key={idx}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">
                                  {result.modelName}
                                </h5>
                                <Badge
                                  variant={
                                    result.success ? 'default' : 'destructive'
                                  }
                                >
                                  {result.success ? 'Success' : 'Failed'}
                                </Badge>
                              </div>
                              {result.success && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {result.cost && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {formatCost(result.cost)}
                                    </span>
                                  )}
                                  {result.generationTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {(result.generationTime / 1000).toFixed(
                                        1
                                      )}
                                      s
                                    </span>
                                  )}
                                </div>
                              )}
                            </CardHeader>
                            <CardContent className="pt-0">
                              {result.success && result.imageUrl ? (
                                <div className="space-y-3">
                                  <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
                                    <Image
                                      src={result.imageUrl}
                                      alt={`${result.modelName} result`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() =>
                                      downloadImage(
                                        result.imageUrl!,
                                        `${result.model}-${Date.now()}.png`
                                      )
                                    }
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                  {result.error || 'Generation failed'}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
