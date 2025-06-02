'use client'

import { useState, useEffect, useRef } from 'react'
import { FlipBook } from '@/components/features'
import { FeedbackWidget } from '@/components/features/feedback-widget'

interface BookGenerationRequest {
  childProfileId: string
  title: string
  description?: string
  theme: string
  storyArc: string
  illustrationStyle: string
  storyLength: 'short' | 'medium' | 'long'
  customPrompt?: string
}

interface BookStatus {
  bookId: string
  status: string
  progress: number
  currentStage: string
  currentStepDescription: string
  estimatedTimeRemaining: string
  lastUpdated: string
  error?: string
  completedAt?: string
  totalPages?: number
}

interface ChildProfile {
  id: string
  name: string
  age: number
  interests: string[]
}

// Hardcoded test child profiles
const HARDCODED_CHILD_PROFILES: ChildProfile[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Emma',
    age: 7,
    interests: ['adventure', 'animals', 'magic'],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Liam',
    age: 9,
    interests: ['space', 'robots', 'science'],
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Sofia',
    age: 6,
    interests: ['princesses', 'unicorns', 'friendship'],
  },
]

// Book Viewer Component
interface BookViewerProps {
  pages: any[]
  title: string
}

function BookViewer({ pages, title }: BookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [viewMode, setViewMode] = useState<'single' | 'spread' | 'flipbook'>(
    'flipbook'
  )

  const totalPages = pages.length
  const canGoBack = currentPage > 0
  const canGoForward = currentPage < totalPages - 1

  const goToPage = (pageIndex: number) => {
    setCurrentPage(Math.max(0, Math.min(pageIndex, totalPages - 1)))
  }

  const nextPage = () => {
    if (canGoForward) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (canGoBack) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Keyboard navigation (only for non-flipbook modes)
  useEffect(() => {
    if (viewMode === 'flipbook') return // FlipBook handles its own keyboard navigation

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevPage()
      } else if (event.key === 'ArrowRight') {
        nextPage()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, totalPages, viewMode])

  const currentPageData = pages[currentPage]

  // Cycle through view modes
  const cycleViewMode = () => {
    if (viewMode === 'flipbook') {
      setViewMode('single')
    } else if (viewMode === 'single') {
      setViewMode('spread')
    } else {
      setViewMode('flipbook')
    }
  }

  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'flipbook':
        return 'FlipBook View'
      case 'single':
        return 'Single View'
      case 'spread':
        return 'Spread View'
      default:
        return 'FlipBook View'
    }
  }

  const getNextViewModeLabel = () => {
    switch (viewMode) {
      case 'flipbook':
        return 'Single View'
      case 'single':
        return 'Spread View'
      case 'spread':
        return 'FlipBook View'
      default:
        return 'Single View'
    }
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-lg">Book Preview</h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {getViewModeLabel()} • Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={cycleViewMode}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
          >
            Switch to {getNextViewModeLabel()}
          </button>
        </div>
      </div>

      {/* FlipBook View */}
      {viewMode === 'flipbook' && (
        <div className="space-y-4">
          <FlipBook
            pages={pages.map(page => ({
              id: page.id || `page-${page.page_number}`,
              page_number: page.page_number,
              content: page.content,
              image_url: page.image_url,
              ai_metadata: page.ai_metadata,
            }))}
            title={title}
            width={400}
            height={600}
            onPageChange={(pageIndex: number) => setCurrentPage(pageIndex)}
            className="mx-auto"
          />

          {/* Book-level feedback */}
          <div className="max-w-md mx-auto p-4 bg-gray-50 rounded-lg">
            <FeedbackWidget
              contentType="book"
              contentId="demo-book-id"
              bookId="demo-book-id"
              showCounts={true}
              title="Rate this book"
              className="mb-4"
            />

            {/* Current page feedback */}
            <FeedbackWidget
              contentType="page"
              contentId={`demo-page-${currentPage + 1}`}
              bookId="demo-book-id"
              pageNumber={currentPage + 1}
              showCounts={true}
              title={`Rate page ${currentPage + 1}`}
            />
          </div>
        </div>
      )}

      {/* Traditional Views */}
      {viewMode !== 'flipbook' && (
        <>
          {/* Book Display */}
          <div className="bg-gray-50 rounded-lg p-6 min-h-[600px]">
            {viewMode === 'single' ? (
              // Single Page View
              <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-[3/4] relative">
                  {currentPageData?.image_url ? (
                    <img
                      src={currentPageData.image_url}
                      alt={`Page ${currentPage + 1} illustration`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-2">📖</div>
                        <div className="text-sm">
                          {currentPageData?.ai_metadata?.imageError
                            ? 'Image generation failed'
                            : 'No image'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-semibold text-base text-gray-800">
                      Page {currentPage + 1}
                    </h5>
                    {currentPageData?.ai_metadata?.title && (
                      <span className="text-sm text-gray-500 italic">
                        {currentPageData.ai_metadata.title}
                      </span>
                    )}
                  </div>

                  <div className="text-base text-gray-700 leading-relaxed max-h-40 overflow-y-auto mb-4">
                    {currentPageData?.content || 'No content available'}
                  </div>

                  {/* Page feedback for single view */}
                  <FeedbackWidget
                    contentType="page"
                    contentId={`demo-page-${currentPage + 1}`}
                    bookId="demo-book-id"
                    pageNumber={currentPage + 1}
                    showCounts={true}
                    title="Rate this page"
                  />
                </div>
              </div>
            ) : (
              // Spread View (Two Pages)
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Page */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="aspect-[3/4] relative">
                      {currentPageData?.image_url ? (
                        <img
                          src={currentPageData.image_url}
                          alt={`Page ${currentPage + 1} illustration`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <div className="text-4xl mb-2">📖</div>
                            <div className="text-sm">No image</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-semibold text-sm text-gray-800">
                          Page {currentPage + 1}
                        </h5>
                        {currentPageData?.ai_metadata?.title && (
                          <span className="text-xs text-gray-500 italic">
                            {currentPageData.ai_metadata.title}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-700 leading-relaxed max-h-32 overflow-y-auto mb-3">
                        {currentPageData?.content || 'No content available'}
                      </div>

                      {/* Left page feedback */}
                      <FeedbackWidget
                        contentType="page"
                        contentId={`demo-page-${currentPage + 1}`}
                        bookId="demo-book-id"
                        pageNumber={currentPage + 1}
                        showCounts={false}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Right Page */}
                  {currentPage + 1 < totalPages && (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="aspect-[3/4] relative">
                        {pages[currentPage + 1]?.image_url ? (
                          <img
                            src={pages[currentPage + 1].image_url}
                            alt={`Page ${currentPage + 2} illustration`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-yellow-100 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <div className="text-4xl mb-2">📖</div>
                              <div className="text-sm">No image</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-sm text-gray-800">
                            Page {currentPage + 2}
                          </h5>
                          {pages[currentPage + 1]?.ai_metadata?.title && (
                            <span className="text-xs text-gray-500 italic">
                              {pages[currentPage + 1].ai_metadata.title}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-700 leading-relaxed max-h-32 overflow-y-auto mb-3">
                          {pages[currentPage + 1]?.content ||
                            'No content available'}
                        </div>

                        {/* Right page feedback */}
                        <FeedbackWidget
                          contentType="page"
                          contentId={`demo-page-${currentPage + 2}`}
                          bookId="demo-book-id"
                          pageNumber={currentPage + 2}
                          showCounts={false}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Book-level feedback for traditional views */}
          <div className="max-w-md mx-auto mt-4 p-4 bg-gray-50 rounded-lg">
            <FeedbackWidget
              contentType="book"
              contentId="demo-book-id"
              bookId="demo-book-id"
              showCounts={true}
              title="Rate this book"
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={prevPage}
              disabled={!canGoBack}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous Page
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </span>

            <button
              onClick={nextPage}
              disabled={!canGoForward}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next Page
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function TestBookPage() {
  const [childProfiles] = useState<ChildProfile[]>(HARDCODED_CHILD_PROFILES)
  const [formData, setFormData] = useState<BookGenerationRequest>({
    childProfileId: HARDCODED_CHILD_PROFILES[0].id,
    title: 'The Magical Adventure',
    description: 'A wonderful story about friendship and courage',
    theme: 'adventure',
    storyArc: 'hero-journey',
    illustrationStyle: 'cartoon',
    storyLength: 'medium',
    customPrompt: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [bookStatus, setBookStatus] = useState<BookStatus | null>(null)
  const [generatedBook, setGeneratedBook] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(
    null
  )
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) {
        console.log('🧹 Cleaning up polling interval on component unmount')
        clearInterval(statusIntervalRef.current)
        statusIntervalRef.current = null
      }
    }
  }, [])

  const handleInputChange = (
    field: keyof BookGenerationRequest,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const startBookGeneration = async () => {
    if (!formData.childProfileId) {
      setError('Please select a child profile')
      return
    }

    setIsGenerating(true)
    setError(null)
    setBookStatus(null)
    setGeneratedBook(null)

    try {
      const response = await fetch('/api/books/generate-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start book generation')
      }

      // Start polling for status
      const bookId = result.bookId

      // Ensure we don't have multiple polling intervals
      if (statusIntervalRef.current) {
        console.log(
          '🛑 Clearing existing polling interval before starting new one'
        )
        clearInterval(statusIntervalRef.current)
        statusIntervalRef.current = null
      }

      const interval = setInterval(() => {
        pollBookStatus(bookId)
      }, 2000) // Poll every 2 seconds

      console.log('📊 Started polling for book status:', bookId)
      setStatusInterval(interval)
      statusIntervalRef.current = interval
    } catch (err) {
      console.error('Book generation failed:', err)
      setError(err instanceof Error ? err.message : 'Book generation failed')
      setIsGenerating(false)
    }
  }

  const pollBookStatus = async (bookId: string) => {
    try {
      console.log('📊 Polling status for book:', bookId)
      const response = await fetch(`/api/books/generate-test/${bookId}/status`)
      const status = await response.json()

      if (!response.ok) {
        throw new Error(status.error || 'Failed to get book status')
      }

      setBookStatus(status)
      console.log(
        '📊 Book status update:',
        status.status,
        `${status.progress}%`
      )

      if (status.status === 'completed') {
        // Stop polling and load the completed book
        console.log('✅ Book generation completed, stopping polling')
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current)
          statusIntervalRef.current = null
          setStatusInterval(null)
        }
        setIsGenerating(false)
        await loadCompletedBook(bookId)
      } else if (status.status === 'failed') {
        // Stop polling on failure
        console.log('❌ Book generation failed, stopping polling')
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current)
          statusIntervalRef.current = null
          setStatusInterval(null)
        }
        setIsGenerating(false)
        setError(status.error || 'Book generation failed')
      }
    } catch (err) {
      console.error('Status polling failed:', err)
      // Stop polling on error
      if (statusIntervalRef.current) {
        console.log('🛑 Stopping polling due to error')
        clearInterval(statusIntervalRef.current)
        statusIntervalRef.current = null
        setStatusInterval(null)
      }
      setIsGenerating(false)
      setError(err instanceof Error ? err.message : 'Status polling failed')
    }
  }

  const loadCompletedBook = async (bookId: string) => {
    try {
      // Fetch the actual generated book data from the test API
      const response = await fetch(`/api/books/generate-test/${bookId}/status`)
      const bookStatus = await response.json()

      if (!response.ok) {
        throw new Error(bookStatus.error || 'Failed to load book data')
      }

      // Get the full book data from the test storage
      const bookResponse = await fetch(
        `/api/books/generate-test/${bookId}/data`
      )
      let bookData

      if (bookResponse.ok) {
        bookData = await bookResponse.json()
      } else {
        // Fallback: create a simplified book structure from status
        bookData = {
          id: bookId,
          title: formData.title,
          description: formData.description,
          status: 'completed',
          total_pages:
            formData.storyLength === 'short'
              ? 5
              : formData.storyLength === 'medium'
                ? 8
                : 12,
          genre: formData.theme,
          completed_at: new Date().toISOString(),
          book_pages: [], // Will be empty if we can't fetch the real data
        }
      }

      setGeneratedBook(bookData)
    } catch (err) {
      console.error('Failed to load completed book:', err)
      setError('Failed to load completed book')
    }
  }

  const resetTest = () => {
    console.log('🔄 Resetting test, stopping any active polling')
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
    if (statusInterval) {
      clearInterval(statusInterval)
      setStatusInterval(null)
    }
    setIsGenerating(false)
    setBookStatus(null)
    setGeneratedBook(null)
    setError(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Book Generation Test</h1>
        <div className="text-sm text-gray-600">
          Testing Mode - Hardcoded Profiles
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Generation Form */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Book Generation Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child Profile
                </label>
                <select
                  value={formData.childProfileId}
                  onChange={e =>
                    handleInputChange('childProfileId', e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isGenerating}
                >
                  {childProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} (Age {profile.age}) - Interests:{' '}
                      {profile.interests.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select
                    value={formData.theme}
                    onChange={e => handleInputChange('theme', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  >
                    <option value="adventure">Adventure</option>
                    <option value="friendship">Friendship</option>
                    <option value="family">Family</option>
                    <option value="animals">Animals</option>
                    <option value="magic">Magic</option>
                    <option value="science">Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Story Arc
                  </label>
                  <select
                    value={formData.storyArc}
                    onChange={e =>
                      handleInputChange('storyArc', e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  >
                    <option value="hero-journey">Hero's Journey</option>
                    <option value="problem-solution">Problem & Solution</option>
                    <option value="discovery">Discovery</option>
                    <option value="transformation">Transformation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Illustration Style
                  </label>
                  <select
                    value={formData.illustrationStyle}
                    onChange={e =>
                      handleInputChange('illustrationStyle', e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  >
                    <option value="cartoon">Cartoon</option>
                    <option value="watercolor">Watercolor</option>
                    <option value="digital_art">Digital Art</option>
                    <option value="realistic">Realistic</option>
                    <option value="anime">Anime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Story Length
                  </label>
                  <select
                    value={formData.storyLength}
                    onChange={e =>
                      handleInputChange(
                        'storyLength',
                        e.target.value as 'short' | 'medium' | 'long'
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  >
                    <option value="short">Short (3-5 pages)</option>
                    <option value="medium">Medium (6-10 pages)</option>
                    <option value="long">Long (11-15 pages)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Prompt (Optional)
                </label>
                <textarea
                  value={formData.customPrompt}
                  onChange={e =>
                    handleInputChange('customPrompt', e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any specific instructions or elements you want in the story..."
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={startBookGeneration}
                disabled={isGenerating || !formData.childProfileId}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Book'}
              </button>

              {(isGenerating || bookStatus || generatedBook) && (
                <button
                  onClick={resetTest}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Progress Status - moved to left column */}
          {bookStatus && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Generation Progress
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{bookStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${bookStatus.progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">
                    {bookStatus.currentStepDescription}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">
                    Estimated Time Remaining
                  </p>
                  <p className="font-medium">
                    {bookStatus.estimatedTimeRemaining}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">
                    {new Date(bookStatus.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generated Book Results - takes up 2/3 of the width */}
        <div className="xl:col-span-2">
          {generatedBook && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Generated Book</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{generatedBook.title}</h3>
                  <p className="text-gray-600">{generatedBook.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Pages:</span>{' '}
                    {generatedBook.total_pages}
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>{' '}
                    {generatedBook.status}
                  </div>
                  <div>
                    <span className="text-gray-600">Genre:</span>{' '}
                    {generatedBook.genre}
                  </div>
                  <div>
                    <span className="text-gray-600">Completed:</span>{' '}
                    {new Date(generatedBook.completed_at).toLocaleString()}
                  </div>
                </div>

                {generatedBook.book_pages &&
                  generatedBook.book_pages.length > 0 && (
                    <BookViewer
                      pages={generatedBook.book_pages}
                      title={generatedBook.title}
                    />
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
