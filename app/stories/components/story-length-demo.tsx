'use client'

import {
  StoryLengthSelector,
  type StoryLengthProps,
} from './story-length-selector'

export default function StoryLengthDemo() {
  const handleLengthSelect = (length: StoryLengthProps) => {
    console.log('Selected length:', length)
    // Here you would typically save the selection to state or send to an API
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <StoryLengthSelector onLengthSelect={handleLengthSelect} />
    </div>
  )
}
