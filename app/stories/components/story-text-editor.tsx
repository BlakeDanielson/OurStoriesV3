'use client'

import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Save, Clock } from 'lucide-react'

interface StoryTextEditorProps {
  initialContent?: string
  onContentChange?: (content: string) => void
  onSave?: (content: string) => Promise<void>
  placeholder?: string
  title?: string
  className?: string
  maxLength?: number
}

const StoryTextEditor: React.FC<StoryTextEditorProps> = ({
  initialContent = '',
  onContentChange,
  onSave,
  placeholder = 'Start writing your story...',
  title = 'Story Content',
  className,
  maxLength = 10000, // Reasonable limit for children's stories
}) => {
  const [content, setContent] = React.useState(initialContent)
  const [saveStatus, setSaveStatus] = React.useState<
    'saved' | 'saving' | 'unsaved'
  >('saved')
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout>()

  // Character and word count calculations
  const characterCount = content.length
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setSaveStatus('unsaved')

    // Notify parent component
    if (onContentChange) {
      onContentChange(newContent)
    }

    // Clear existing auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new auto-save timeout (30 seconds)
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave(newContent)
    }, 30000)
  }

  // Auto-save functionality
  const handleAutoSave = async (contentToSave: string) => {
    if (!onSave || saveStatus === 'saving') return

    try {
      setSaveStatus('saving')
      await onSave(contentToSave)
      setSaveStatus('saved')
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('unsaved')
    }
  }

  // Manual save
  const handleManualSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    handleAutoSave(content)
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Update content when initialContent changes
  React.useEffect(() => {
    setContent(initialContent)
    setSaveStatus('saved')
  }, [initialContent])

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saved':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'saving':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'unsaved':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return lastSaved
          ? `Saved at ${lastSaved.toLocaleTimeString()}`
          : 'Saved'
      case 'saving':
        return 'Saving...'
      case 'unsaved':
        return 'Unsaved changes'
      default:
        return 'Ready'
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-xs', getSaveStatusColor())}
            >
              {saveStatus === 'saving' ? (
                <Clock className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              {getSaveStatusText()}
            </Badge>
            {saveStatus === 'unsaved' && onSave && (
              <button
                onClick={handleManualSave}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Save now
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder={placeholder}
          className="min-h-[300px] resize-y"
          maxLength={maxLength}
        />

        {/* Character and Word Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Words: {wordCount.toLocaleString()}</span>
            <span>Characters: {characterCount.toLocaleString()}</span>
            {maxLength && (
              <span
                className={cn(
                  characterCount > maxLength * 0.9 ? 'text-orange-600' : '',
                  characterCount >= maxLength ? 'text-red-600 font-medium' : ''
                )}
              >
                {characterCount}/{maxLength}
              </span>
            )}
          </div>
          <div className="text-xs">Auto-saves every 30 seconds</div>
        </div>
      </CardContent>
    </Card>
  )
}

export { StoryTextEditor, type StoryTextEditorProps }
