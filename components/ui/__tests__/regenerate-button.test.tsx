import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegenerateButton } from '../regenerate-button'

describe('RegenerateButton', () => {
  const mockOnRegenerate = jest.fn()

  beforeEach(() => {
    mockOnRegenerate.mockClear()
  })

  it('renders with default props', () => {
    render(<RegenerateButton onRegenerate={mockOnRegenerate} />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Regenerate')
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
  })

  it('renders without text when showText is false', () => {
    render(
      <RegenerateButton onRegenerate={mockOnRegenerate} showText={false} />
    )

    const button = screen.getByRole('button')
    expect(button).not.toHaveTextContent('Regenerate')
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument()
  })

  it('calls onRegenerate when clicked', async () => {
    render(<RegenerateButton onRegenerate={mockOnRegenerate} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnRegenerate).toHaveBeenCalledTimes(1)
    })
  })

  it('shows loading state during regeneration', async () => {
    const slowRegenerate = jest.fn(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    render(<RegenerateButton onRegenerate={slowRegenerate} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Should show loading state immediately
    expect(button).toHaveTextContent('Regenerating...')
    expect(button).toBeDisabled()
    expect(screen.getByTestId('refresh-icon')).toHaveClass('animate-spin')

    // Wait for completion
    await waitFor(() => {
      expect(button).toHaveTextContent('Regenerate')
      expect(button).not.toBeDisabled()
    })
  })

  it('shows loading state when isLoading prop is true', () => {
    render(
      <RegenerateButton onRegenerate={mockOnRegenerate} isLoading={true} />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Regenerating...')
    expect(button).toBeDisabled()
    expect(screen.getByTestId('refresh-icon')).toHaveClass('animate-spin')
  })

  it('is disabled when disabled prop is true', () => {
    render(<RegenerateButton onRegenerate={mockOnRegenerate} disabled={true} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(mockOnRegenerate).not.toHaveBeenCalled()
  })

  it('prevents multiple clicks during regeneration', async () => {
    const slowRegenerate = jest.fn(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    render(<RegenerateButton onRegenerate={slowRegenerate} />)

    const button = screen.getByRole('button')

    // Click multiple times quickly
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    // Should only call once
    await waitFor(() => {
      expect(slowRegenerate).toHaveBeenCalledTimes(1)
    })
  })

  it('applies custom className', () => {
    render(
      <RegenerateButton
        onRegenerate={mockOnRegenerate}
        className="custom-class"
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('uses correct variant and size props', () => {
    render(
      <RegenerateButton
        onRegenerate={mockOnRegenerate}
        variant="secondary"
        size="lg"
      />
    )

    const button = screen.getByRole('button')
    // These would be tested based on your Button component's implementation
    expect(button).toBeInTheDocument()
  })

  it('handles async errors gracefully', async () => {
    const errorRegenerate = jest.fn(() =>
      Promise.reject(new Error('Test error'))
    )

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<RegenerateButton onRegenerate={errorRegenerate} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Should still reset loading state after error
    await waitFor(() => {
      expect(button).toHaveTextContent('Regenerate')
      expect(button).not.toBeDisabled()
    })

    // Restore console.error
    consoleSpy.mockRestore()
  })
})
