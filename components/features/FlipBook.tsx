'use client'

import React, { useRef, useState, useEffect, forwardRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface BookPage {
  id: string
  page_number: number
  content: string
  image_url?: string | null
  ai_metadata?: {
    title?: string
    imageError?: string
  }
}

interface FlipBookProps {
  pages: BookPage[]
  title: string
  width?: number
  height?: number
  className?: string
  onPageChange?: (pageIndex: number) => void
}

// Page component that needs forwardRef for react-pageflip
const Page = forwardRef<
  HTMLDivElement,
  {
    page: BookPage
    pageNumber: number
    isLoading?: boolean
  }
>(({ page, pageNumber, isLoading }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white shadow-lg overflow-hidden relative"
      style={{ width: '100%', height: '100%' }}
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-gray-500">Loading page...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Image Section */}
          <div className="h-3/5 relative overflow-hidden">
            {page.image_url ? (
              <img
                src={page.image_url}
                alt={`Page ${pageNumber} illustration`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📖</div>
                  <div className="text-sm">
                    {page.ai_metadata?.imageError
                      ? 'Image generation failed'
                      : 'No image'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="h-2/5 p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-400 font-medium">
                Page {pageNumber}
              </span>
              {page.ai_metadata?.title && (
                <span className="text-xs text-gray-500 italic truncate ml-2">
                  {page.ai_metadata.title}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-6">
                {page.content || 'No content available'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

Page.displayName = 'Page'

export function FlipBook({
  pages,
  title,
  width = 400,
  height = 600,
  className = '',
  onPageChange,
}: FlipBookProps) {
  const flipBookRef = useRef<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  )

  const totalPages = pages.length
  const canGoBack = currentPage > 0
  const canGoForward = currentPage < totalPages - 1

  // Handle page flip events
  const handleFlip = (e: any) => {
    const newPage = e.data
    setCurrentPage(newPage)
    onPageChange?.(newPage)
  }

  // Handle orientation change
  const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
    setOrientation(orientation)
  }

  // Navigation functions
  const goToNextPage = () => {
    if (flipBookRef.current && canGoForward) {
      flipBookRef.current.pageFlip().flipNext()
    }
  }

  const goToPrevPage = () => {
    if (flipBookRef.current && canGoBack) {
      flipBookRef.current.pageFlip().flipPrev()
    }
  }

  const goToPage = (pageIndex: number) => {
    if (flipBookRef.current && pageIndex >= 0 && pageIndex < totalPages) {
      flipBookRef.current.pageFlip().turnToPage(pageIndex)
    }
  }

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }

  const resetZoom = () => {
    setZoomLevel(1)
  }

  // Fullscreen functions
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Simple keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevPage()
      } else if (event.key === 'ArrowRight') {
        goToNextPage()
      } else if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, totalPages, isFullscreen])

  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    if (isFullscreen) {
      return {
        width: Math.min(window.innerWidth * 0.8, 800),
        height: Math.min(window.innerHeight * 0.8, 1000),
      }
    }
    return { width, height }
  }

  const dimensions = getResponsiveDimensions()

  return (
    <div className={`relative ${className}`}>
      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setIsFullscreen(false)
              }
            }}
          >
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Minimize2 className="w-5 h-5" />
              </Button>

              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
              >
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  size="stretch"
                  minWidth={300}
                  maxWidth={1000}
                  minHeight={400}
                  maxHeight={1200}
                  drawShadow={true}
                  flippingTime={600}
                  usePortrait={true}
                  startZIndex={0}
                  autoSize={false}
                  maxShadowOpacity={0.5}
                  showCover={false}
                  mobileScrollSupport={false}
                  swipeDistance={30}
                  clickEventForward={true}
                  useMouseEvents={true}
                  onFlip={handleFlip}
                  onChangeOrientation={handleOrientationChange}
                  className="shadow-2xl"
                  style={{}}
                  startPage={0}
                  showPageCorners={true}
                  disableFlipByClick={false}
                >
                  {pages.map((page, index) => (
                    <Page
                      key={page.id}
                      page={page}
                      pageNumber={index + 1}
                      isLoading={isLoading}
                    />
                  ))}
                </HTMLFlipBook>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FlipBook */}
      {!isFullscreen && (
        <Card className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
              <span className="text-xs text-gray-400">({orientation})</span>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
            >
              <HTMLFlipBook
                ref={flipBookRef}
                width={dimensions.width}
                height={dimensions.height}
                size="fixed"
                minWidth={dimensions.width}
                maxWidth={dimensions.width}
                minHeight={dimensions.height}
                maxHeight={dimensions.height}
                drawShadow={true}
                flippingTime={600}
                usePortrait={true}
                startZIndex={0}
                autoSize={false}
                maxShadowOpacity={0.5}
                showCover={false}
                mobileScrollSupport={false}
                swipeDistance={30}
                clickEventForward={true}
                useMouseEvents={true}
                onFlip={handleFlip}
                onChangeOrientation={handleOrientationChange}
                className="shadow-lg"
                style={{}}
                startPage={0}
                showPageCorners={true}
                disableFlipByClick={false}
              >
                {pages.map((page, index) => (
                  <Page
                    key={page.id}
                    page={page}
                    pageNumber={index + 1}
                    isLoading={isLoading}
                  />
                ))}
              </HTMLFlipBook>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={!canGoBack}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {/* Page Thumbnails */}
            <div className="flex gap-1 max-w-md overflow-x-auto">
              {pages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`w-8 h-10 text-xs rounded border-2 flex items-center justify-center transition-colors ${
                    index === currentPage
                      ? 'border-blue-500 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!canGoForward}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Control Bar */}
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={resetZoom}
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              disabled={zoomLevel >= 3}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="mx-2 h-4 w-px bg-gray-300" />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Simple Keyboard Navigation Hint */}
          <div className="text-center mt-2 text-xs text-gray-500">
            Use ← → arrow keys to navigate pages • ESC to exit fullscreen
          </div>
        </Card>
      )}
    </div>
  )
}
