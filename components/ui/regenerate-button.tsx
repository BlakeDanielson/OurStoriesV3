'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface RegenerateButtonProps {
  onRegenerate: () => void
  isLoading?: boolean
  disabled?: boolean
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  showText?: boolean
  useDialog?: boolean
  onOpenDialog?: () => void
}

export function RegenerateButton({
  onRegenerate,
  isLoading = false,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className = '',
  showText = true,
  useDialog = false,
  onOpenDialog,
}: RegenerateButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleClick = async () => {
    if (disabled || isLoading || isRegenerating) return

    if (useDialog && onOpenDialog) {
      onOpenDialog()
      return
    }

    setIsRegenerating(true)
    try {
      await onRegenerate()
    } finally {
      setIsRegenerating(false)
    }
  }

  const loading = isLoading || isRegenerating

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      <RefreshCw
        className={`w-4 h-4 ${showText ? 'mr-2' : ''} ${loading ? 'animate-spin' : ''}`}
        data-testid="refresh-icon"
      />
      {showText && (loading ? 'Regenerating...' : 'Regenerate')}
    </Button>
  )
}
