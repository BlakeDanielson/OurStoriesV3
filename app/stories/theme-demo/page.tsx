import ThemeDemo from '../components/theme-demo'

export default function ThemeDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Theme Selection Demo
        </h1>
        <ThemeDemo />
      </div>
    </div>
  )
}
