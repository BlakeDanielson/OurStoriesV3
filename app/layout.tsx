import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth/context'
import { Navigation } from '@/components/layout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "ourStories - AI-Powered Personalized Children's Books",
  description:
    'Create magical, one-of-a-kind storybooks where your child is the main character, featuring their unique appearance, personality traits, and hobbies woven into original narratives and illustrations.',
  keywords: [
    'AI',
    'children',
    'books',
    'personalization',
    'stories',
    'illustrations',
  ],
  authors: [{ name: 'ourStories Team' }],
  openGraph: {
    title: "ourStories - AI-Powered Personalized Children's Books",
    description: 'Create magical, personalized storybooks for your child',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Navigation />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
