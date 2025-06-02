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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Plus,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  Eye,
  Settings,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { RealtimeDashboard } from '@/components/realtime/RealtimeDashboard'
import type { Book } from '@/lib/types/database/stories'
import type { ChildProfile } from '@/lib/types/database/profiles'

interface BookWithChild extends Book {
  child_profiles: {
    id: string
    name: string
    parent_id: string
  }
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [books, setBooks] = useState<BookWithChild[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [booksData, childrenData] = await Promise.all([
        getUserBooks(),
        getUserChildren(),
      ])

      setBooks(booksData as BookWithChild[])
      setChildren(childrenData)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      )
    } finally {
      setLoading(false)
    }
  }

  const getBookStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'generating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getBookStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'secondary'
      case 'generating':
        return 'default'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getRecentBooks = () => books.slice(0, 6)
  const getCompletedBooks = () =>
    books.filter(book => book.status === 'completed')
  const getGeneratingBooks = () =>
    books.filter(book => book.status === 'generating')

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to access your dashboard.{' '}
            <Link href="/auth/signin" className="underline">
              Sign in here
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}{' '}
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={loadDashboardData}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Manage your personalized storybooks and children's profiles
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/stories/create">
              <Plus className="h-4 w-4 mr-2" />
              Create New Story
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Books
                </p>
                <p className="text-2xl font-bold">{books.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold">
                  {getCompletedBooks().length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Generating
                </p>
                <p className="text-2xl font-bold">
                  {getGeneratingBooks().length}
                </p>
              </div>
              <Loader2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Children
                </p>
                <p className="text-2xl font-bold">{children.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="books">My Books</TabsTrigger>
          <TabsTrigger value="children">Children</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Books */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Recent Books
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="#books">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {getRecentBooks().length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No books yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first personalized storybook
                    </p>
                    <Button asChild>
                      <Link href="/stories/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Story
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getRecentBooks().map(book => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getBookStatusIcon(book.status || 'draft')}
                            <h4 className="font-medium truncate">
                              {book.title}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            For {book.child_profiles.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getBookStatusColor(book.status || 'draft')}
                          >
                            {book.status}
                          </Badge>
                          {book.status === 'completed' && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/books/${book.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Children Profiles */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Children's Profiles
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile?tab=children">Manage</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No children added yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first child's profile to start creating stories
                    </p>
                    <Button asChild>
                      <Link href="/profile?tab=children">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Child
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.slice(0, 4).map(child => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium">{child.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Age {child.age} •{' '}
                              {child.reading_level || 'Beginner'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {
                              books.filter(b => b.child_profile_id === child.id)
                                .length
                            }{' '}
                            books
                          </p>
                        </div>
                      </div>
                    ))}
                    {children.length > 4 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/profile?tab=children">
                            View all {children.length} children
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get you started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4" asChild>
                  <Link href="/stories/create">
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-medium">Create New Story</div>
                      <div className="text-sm text-muted-foreground">
                        Start a personalized book
                      </div>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" className="h-auto p-4" asChild>
                  <Link href="/profile?tab=children">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-medium">Add Child Profile</div>
                      <div className="text-sm text-muted-foreground">
                        Set up reading preferences
                      </div>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" className="h-auto p-4" asChild>
                  <Link href="/settings">
                    <div className="text-center">
                      <Settings className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-medium">Account Settings</div>
                      <div className="text-sm text-muted-foreground">
                        Manage your account
                      </div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Books Tab */}
        <TabsContent value="books" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">My Books</h2>
              <p className="text-muted-foreground">
                All your personalized storybooks
              </p>
            </div>
            <Button asChild>
              <Link href="/stories/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New Story
              </Link>
            </Button>
          </div>

          {books.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  No books created yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first personalized storybook to get started
                </p>
                <Button asChild>
                  <Link href="/stories/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Story
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map(book => (
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
                        variant={getBookStatusColor(book.status || 'draft')}
                      >
                        {book.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold line-clamp-2">
                        {book.title}
                      </h3>
                      {getBookStatusIcon(book.status || 'draft')}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      For {book.child_profiles.name}
                    </p>
                    {book.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {book.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {book.total_pages
                          ? `${book.total_pages} pages`
                          : 'Draft'}
                      </div>
                      {book.status === 'completed' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/books/${book.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Children Tab */}
        <TabsContent value="children" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Children's Profiles</h2>
              <p className="text-muted-foreground">
                Manage reading preferences and interests
              </p>
            </div>
            <Button asChild>
              <Link href="/profile?tab=children">
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </Link>
            </Button>
          </div>

          {children.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  No children added yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Add your first child's profile to start creating personalized
                  stories
                </p>
                <Button asChild>
                  <Link href="/profile?tab=children">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Child
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map(child => {
                const childBooks = books.filter(
                  b => b.child_profile_id === child.id
                )
                const completedBooks = childBooks.filter(
                  b => b.status === 'completed'
                )

                return (
                  <Card key={child.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {child.name}
                          </h3>
                          <p className="text-muted-foreground">
                            Age {child.age} •{' '}
                            {child.reading_level || 'Beginner'}
                          </p>
                        </div>
                      </div>

                      {child.interests && child.interests.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Interests:</p>
                          <div className="flex flex-wrap gap-1">
                            {child.interests.slice(0, 3).map(interest => (
                              <Badge
                                key={interest}
                                variant="secondary"
                                className="text-xs"
                              >
                                {interest}
                              </Badge>
                            ))}
                            {child.interests.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{child.interests.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {childBooks.length}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total Books
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {completedBooks.length}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Completed
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/stories/create?child=${child.id}`}>
                            <Plus className="h-4 w-4 mr-1" />
                            New Story
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/profile?tab=children&edit=${child.id}`}>
                            <Settings className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Real-time Activity</h2>
            <p className="text-muted-foreground">
              Live updates on book generation and reading progress
            </p>
          </div>

          <RealtimeDashboard>
            {/* Additional activity content can go here */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {books.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No recent activity. Create your first book to see updates
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {books.slice(0, 5).map(book => (
                      <div
                        key={book.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        {getBookStatusIcon(book.status || 'draft')}
                        <div className="flex-1">
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {book.status === 'completed' && book.completed_at
                              ? `Completed ${new Date(book.completed_at).toLocaleDateString()}`
                              : book.created_at
                                ? `Created ${new Date(book.created_at).toLocaleDateString()}`
                                : 'Recently updated'}
                          </p>
                        </div>
                        <Badge
                          variant={getBookStatusColor(book.status || 'draft')}
                        >
                          {book.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </RealtimeDashboard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
