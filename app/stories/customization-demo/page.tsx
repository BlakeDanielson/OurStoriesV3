import { StoryCustomizationWizard } from '../components/story-customization-wizard'

export default function CustomizationDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Story Customization Wizard Demo
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This is a demonstration of the complete Story Customization
            interface with step-by-step wizard, validation, persistence, and all
            selection components integrated.
          </p>
        </div>

        <StoryCustomizationWizard
          onComplete={config => {
            console.log('Story configuration completed:', config)
            alert('Story configuration completed! Check console for details.')
          }}
          onSave={config => {
            console.log('Story configuration saved:', config)
            return Promise.resolve()
          }}
        />
      </div>
    </div>
  )
}
