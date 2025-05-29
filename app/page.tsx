import {
  Hero,
  FeatureHighlights,
  BookPreviews,
  TestimonialsSection,
  PricingSection,
} from '@/components/layout'

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen" role="main">
      <Hero />
      <FeatureHighlights />
      <BookPreviews />
      <TestimonialsSection />
      <PricingSection />
    </main>
  )
}
