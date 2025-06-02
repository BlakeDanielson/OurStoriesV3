'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { getUserBooks, getUserChildren } from '@/lib/auth/rls-helpers'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BookOpen,
  Plus,
  Users,
  Sparkles,
  Palette,
  Wand2,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { Book } from '@/lib/types/database/stories'
import type { ChildProfile } from '@/lib/types/database/profiles'

interface BookWithChild extends Book {
  child_profiles: {
    id: string
    name: string
    parent_id: string
  }
}

const FEATURES = [
  {
    icon: Users,
    title: 'Personalized Characters',
    description:
      'Your child becomes the hero of their own adventure with AI-generated characters that look like them.',
  },
  {
    icon: Sparkles,
    title: 'Magical Themes',
    description:
      'Choose from adventure, friendship, magic, science, and more to create the perfect story.',
  },
  {
    icon: Palette,
    title: 'Beautiful Illustrations',
    description:
      'Professional-quality artwork in multiple styles from cartoon to watercolor.',
  },
  {
    icon: Wand2,
    title: 'AI-Powered Creation',
    description:
      "Advanced AI creates unique, engaging stories tailored to your child's interests.",
  },
]

const SAMPLE_THEMES = [
  { name: 'Adventure', color: 'bg-blue-100 text-blue-700' },
  { name: 'Magic', color: 'bg-purple-100 text-purple-700' },
  { name: 'Animals', color: 'bg-green-100 text-green-700' },
  { name: 'Space', color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Friendship', color: 'bg-pink-100 text-pink-700' },
  { name: 'Science', color: 'bg-orange-100 text-orange-700' },
]

export default function StoriesPage() {
  const { user, loading: authLoading } = useAuth()
  const [books, setBooks] = useState<BookWithChild[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const [booksData, childrenData] = await Promise.all([
        getUserBooks(),
        getUserChildren(),
      ])
      setBooks(booksData as BookWithChild[])
      setChildren(childrenData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load your stories')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading stories...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Personalized Stories
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Create Magical Stories
          <br />
          <span className="text-blue-600">Where Your Child is the Hero</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Transform your child into the main character of beautifully
          illustrated, personalized storybooks that spark imagination and create
          lasting memories.
        </p>

        {user ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/stories/create">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Story
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">
                <BookOpen className="h-5 w-5 mr-2" />
                View My Stories
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        )}
      </div>

      {/* User's Stories Section (if logged in) */}
      {user && (
        <div className="mb-16">
          {error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : books.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold">Your Stories</h2>
                  <p className="text-muted-foreground">
                    Continue reading or create new adventures
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard?tab=books">
                    View All Stories
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {books.slice(0, 3).map(book => (
                  <Card key={book.id} className="overflow-hidden">
                    <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 relative">
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={`Cover of ${book.title}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={
                            book.status === 'completed'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {book.status}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        For {book.child_profiles.name}
                      </p>
                      {book.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <Link href={`/books/${book.id}`}>Read Story</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : children.length > 0 ? (
            <Card className="text-center py-12 mb-8">
              <CardContent>
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  Ready to Create Your First Story?
                </h3>
                <p className="text-muted-foreground mb-6">
                  You have {children.length} child profile
                  {children.length !== 1 ? 's' : ''} set up. Let's create a
                  magical adventure!
                </p>
                <Button size="lg" asChild>
                  <Link href="/stories/create">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Story
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12 mb-8">
              <CardContent>
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  Add Your Child's Profile
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start by adding your child's profile to create personalized
                  stories
                </p>
                <Button size="lg" asChild>
                  <Link href="/profile?tab=children">
                    <Users className="h-5 w-5 mr-2" />
                    Add Child Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Features Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">
            Creating personalized stories is simple and magical
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Themes Preview */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Choose from Amazing Themes
          </h2>
          <p className="text-xl text-muted-foreground">
            Every story is unique and tailored to your child's interests
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {SAMPLE_THEMES.map((theme, index) => (
            <Badge key={index} className={`${theme.color} text-sm px-4 py-2`}>
              {theme.name}
            </Badge>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" asChild>
            <Link href={user ? '/stories/create' : '/auth/signup'}>
              <Wand2 className="h-5 w-5 mr-2" />
              {user ? 'Start Creating' : 'Get Started Today'}
            </Link>
          </Button>
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardContent className="text-center py-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Magic?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of families creating personalized stories that
            inspire, educate, and create lasting memories.
          </p>

          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/stories/create">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Story
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">
                  <BookOpen className="h-5 w-5 mr-2" />
                  My Dashboard
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
