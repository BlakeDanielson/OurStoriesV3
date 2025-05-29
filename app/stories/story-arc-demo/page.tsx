import { StoryArcSelector } from '../components/story-arc-selector'

export default function StoryArcDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Story Arc Selector Demo</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This is a demonstration of the Story Arc Selection interface. Choose
            from different narrative structures that will guide your story's
            journey.
          </p>
        </div>

        <StoryArcSelector
          onArcSelect={arc => {
            console.log('Selected story arc:', arc)
          }}
        />
      </div>
    </div>
  )
}
