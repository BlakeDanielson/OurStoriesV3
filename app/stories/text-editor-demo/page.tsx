'use client'

import { StoryTextEditor } from '../components/story-text-editor'

export default function TextEditorDemoPage() {
  const handleContentChange = (content: string) => {
    console.log('Content changed:', content.length, 'characters')
  }

  const handleSave = async (content: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Saved content:', content)
    // In a real app, this would save to database
  }

  const sampleContent = `Once upon a time, in a magical forest filled with talking animals and sparkling streams, there lived a little rabbit named Luna.

Luna had the softest white fur and the brightest blue eyes you could imagine. Every morning, she would hop through the forest, greeting all her friends with a cheerful "Good morning!"

One day, Luna discovered something extraordinary...`

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Story Text Editor Demo</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This is a demonstration of the simple text editing interface for
            story content. Features include auto-save every 30 seconds,
            character/word count, and browser undo/redo support.
          </p>
        </div>

        <div className="space-y-8">
          {/* Main Editor */}
          <StoryTextEditor
            title="Edit Your Story"
            initialContent={sampleContent}
            onContentChange={handleContentChange}
            onSave={handleSave}
            placeholder="Start writing your magical story..."
            maxLength={5000}
          />

          {/* Additional Editor for Testing */}
          <StoryTextEditor
            title="Chapter 2"
            onContentChange={handleContentChange}
            onSave={handleSave}
            placeholder="Continue the adventure..."
            maxLength={3000}
          />
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Testing Instructions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • Type in the text areas to see real-time character and word
              counts
            </li>
            <li>
              • Changes auto-save every 30 seconds (watch the save status badge)
            </li>
            <li>• Click "Save now" to manually save unsaved changes</li>
            <li>
              • Use Ctrl+Z (Cmd+Z on Mac) to test browser undo functionality
            </li>
            <li>
              • Use Ctrl+Y (Cmd+Y on Mac) to test browser redo functionality
            </li>
            <li>• Character count changes color as you approach the limit</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
