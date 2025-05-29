'use client'

import {
  ArtStyleSelector,
  type ArtStyleProps,
} from './illustration-style-selector'

export default function IllustrationStyleDemo() {
  const handleStyleSelect = (style: ArtStyleProps) => {
    console.log('Selected style:', style)
    // Here you would typically save the selection to state or send to an API
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <ArtStyleSelector onStyleSelect={handleStyleSelect} />
    </div>
  )
}
