import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageGallery } from '../image-gallery'

// Mock the RegenerateButton component
jest.mock('../regenerate-button', () => ({
  RegenerateButton: ({
    onRegenerate,
    className,
    showText,
    variant,
    size,
    ...props
  }: any) => {
    // Filter out non-DOM props
    const { ...domProps } = props
    return (
      <button
        onClick={onRegenerate}
        className={className}
        data-testid="regenerate-button"
        {...domProps}
      >
        Regenerate
      </button>
    )
  },
}))

const mockImages = [
  {
    requestId: '1',
    index: 0,
    status: 'completed' as const,
    response: {
      imageUrl: 'https://example.com/image1.jpg',
      prompt: 'A magical forest',
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
    status: 'failed' as const,
    error: 'Content policy violation',
    cost: 0.0,
    duration: 1000,
    provider: 'replicate',
  },
  {
    requestId: '3',
    index: 2,
    status: 'processing' as const,
  },
]

describe('ImageGallery', () => {
  const mockOnRegenerate = jest.fn()

  beforeEach(() => {
    mockOnRegenerate.mockClear()
  })

  it('renders images without regeneration buttons when onRegenerateImage is not provided', () => {
    render(<ImageGallery images={mockImages} />)

    expect(screen.getByText('Generated Images')).toBeInTheDocument()
    expect(screen.queryByTestId('regenerate-button')).not.toBeInTheDocument()
  })

  it('renders regeneration buttons when onRegenerateImage is provided', () => {
    render(
      <ImageGallery images={mockImages} onRegenerateImage={mockOnRegenerate} />
    )

    // Should have regeneration buttons for completed and failed images
    const regenerateButtons = screen.getAllByTestId('regenerate-button')
    expect(regenerateButtons).toHaveLength(2) // One for completed, one for failed
  })

  it('shows regeneration button on hover for completed images', () => {
    render(
      <ImageGallery images={mockImages} onRegenerateImage={mockOnRegenerate} />
    )

    const completedImage = screen.getByAltText('Generated image 1')
    expect(completedImage).toBeInTheDocument()

    // The regeneration button should be present but hidden initially
    const regenerateButtons = screen.getAllByTestId('regenerate-button')
    expect(regenerateButtons.length).toBeGreaterThan(0)
  })

  it('shows retry button immediately for failed images', () => {
    render(
      <ImageGallery images={mockImages} onRegenerateImage={mockOnRegenerate} />
    )

    expect(screen.getByText('Content policy violation')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()

    // Failed image should have a regenerate button visible
    const regenerateButtons = screen.getAllByTestId('regenerate-button')
    expect(regenerateButtons.length).toBeGreaterThan(0)
  })

  it('calls onRegenerateImage when regeneration button is clicked', () => {
    render(
      <ImageGallery images={mockImages} onRegenerateImage={mockOnRegenerate} />
    )

    const regenerateButtons = screen.getAllByTestId('regenerate-button')
    fireEvent.click(regenerateButtons[0])

    expect(mockOnRegenerate).toHaveBeenCalledTimes(1)
    expect(mockOnRegenerate).toHaveBeenCalledWith(mockImages[0], 0)
  })

  it('does not show regeneration buttons for processing images', () => {
    const processingOnlyImages = [mockImages[2]] // Only the processing image
    render(
      <ImageGallery
        images={processingOnlyImages}
        onRegenerateImage={mockOnRegenerate}
      />
    )

    expect(screen.getByText('Processing')).toBeInTheDocument()
    expect(screen.queryByTestId('regenerate-button')).not.toBeInTheDocument()
  })

  it('displays correct image count in header', () => {
    render(<ImageGallery images={mockImages} />)

    expect(
      screen.getByText('1 completed, 1 failed, 1 processing')
    ).toBeInTheDocument()
  })

  it('shows empty state when no images provided', () => {
    render(<ImageGallery images={[]} />)

    expect(
      screen.getByText(
        'No images to display yet. Generate a batch to see results here.'
      )
    ).toBeInTheDocument()
  })

  it('opens modal when image is clicked', () => {
    render(
      <ImageGallery images={mockImages} onRegenerateImage={mockOnRegenerate} />
    )

    const completedImage = screen.getByAltText('Generated image 1')
    fireEvent.click(completedImage)

    // Modal should open with image details - be more specific about text matching
    expect(screen.getByText(/Image 1/)).toBeInTheDocument()
    expect(screen.getByText('Prompt:')).toBeInTheDocument()
    // Use getAllByText for text that appears multiple times
    const forestTexts = screen.getAllByText('A magical forest')
    expect(forestTexts.length).toBeGreaterThan(0)
  })

  it('shows regeneration button in modal', () => {
    render(
      <ImageGallery images={mockImages} onRegenerateImage={mockOnRegenerate} />
    )

    const completedImage = screen.getByAltText('Generated image 1')
    fireEvent.click(completedImage)

    // Modal should have a regeneration button
    const modalRegenerateButtons = screen.getAllByTestId('regenerate-button')
    expect(modalRegenerateButtons.length).toBeGreaterThan(0)
  })

  it('displays story mode correctly', () => {
    render(
      <ImageGallery
        images={mockImages}
        storyMode={true}
        onRegenerateImage={mockOnRegenerate}
      />
    )

    expect(screen.getByText("Luna's Magical Adventure")).toBeInTheDocument()
    expect(
      screen.getByText('Click any image to view the full story sequence')
    ).toBeInTheDocument()
    expect(screen.getByText('Scene 1')).toBeInTheDocument()
  })

  it('shows download all button when there are completed images', () => {
    render(<ImageGallery images={mockImages} />)

    expect(screen.getByText('Download All')).toBeInTheDocument()
  })

  it('displays image metadata when showMetadata is true', () => {
    render(<ImageGallery images={mockImages} showMetadata={true} />)

    expect(screen.getByText('flux-1.1-pro')).toBeInTheDocument()
    expect(screen.getByText('$0.025')).toBeInTheDocument()
    expect(screen.getByText('4s')).toBeInTheDocument() // 3500ms rounded
  })

  it('hides image metadata when showMetadata is false', () => {
    render(<ImageGallery images={mockImages} showMetadata={false} />)

    expect(screen.queryByText('flux-1.1-pro')).not.toBeInTheDocument()
    expect(screen.queryByText('$0.025')).not.toBeInTheDocument()
  })

  it('handles modal navigation between images', () => {
    const multipleCompletedImages = [
      mockImages[0],
      {
        ...mockImages[0],
        requestId: '4',
        index: 3,
        response: {
          ...mockImages[0].response!,
          prompt: 'A second magical forest',
        },
      },
    ]

    render(
      <ImageGallery
        images={multipleCompletedImages}
        onRegenerateImage={mockOnRegenerate}
      />
    )

    // Open modal
    const firstImage = screen.getByAltText('Generated image 1')
    fireEvent.click(firstImage)

    expect(screen.getByText(/Image 1 of 2/)).toBeInTheDocument()
    // Use more specific text matching for the first prompt
    expect(screen.getByText('A magical forest')).toBeInTheDocument()

    // Navigate to next image
    const nextButton = screen.getByRole('button', { name: /chevronright/i })
    fireEvent.click(nextButton)

    expect(screen.getByText(/Image 2 of 2/)).toBeInTheDocument()
    expect(screen.getByText('A second magical forest')).toBeInTheDocument()
  })
})
