'use client'

import { useState } from 'react'
import { BookGenerationStatus } from '@/components/realtime/BookGenerationStatus'
import { RealtimeDashboard } from '@/components/realtime/RealtimeDashboard'
import { RealtimeNotifications } from '@/components/realtime/RealtimeNotifications'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function RealtimeDemoPage() {
  const [demoBookId, setDemoBookId] = useState('demo-book-123')
  const [demoBookTitle, setDemoBookTitle] = useState('My Adventure Story')

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Real-time Subscriptions Demo</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience live updates for book generation, status changes, and
          reading progress. This demo shows how real-time subscriptions work in
          the ourStories app.
        </p>
        <Badge variant="outline" className="text-sm">
          🚀 Powered by Supabase Real-time
        </Badge>
      </div>

      {/* Real-time Notifications (Global) */}
      <RealtimeNotifications
        position="top-right"
        maxNotifications={3}
        autoHideDuration={8000}
      />

      <RealtimeDashboard>
        <Tabs defaultValue="generation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generation">Book Generation</TabsTrigger>
            <TabsTrigger value="progress">Reading Progress</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="generation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book Generation Demo</CardTitle>
                <CardDescription>
                  Watch real-time updates as books are generated. Change the
                  book ID below to test different scenarios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookId">Book ID</Label>
                    <Input
                      id="bookId"
                      value={demoBookId}
                      onChange={e => setDemoBookId(e.target.value)}
                      placeholder="Enter book ID to monitor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookTitle">Book Title</Label>
                    <Input
                      id="bookTitle"
                      value={demoBookTitle}
                      onChange={e => setDemoBookTitle(e.target.value)}
                      placeholder="Enter book title"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <BookGenerationStatus
              bookId={demoBookId}
              bookTitle={demoBookTitle}
              expectedPages={12}
              onComplete={() => {
                console.log('Book generation completed!')
              }}
            />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reading Progress Updates</CardTitle>
                <CardDescription>
                  Real-time updates when users provide feedback or complete
                  reading milestones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Features:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Live feedback updates from child readers</li>
                      <li>• Reading progress tracking</li>
                      <li>• Parent notifications for milestones</li>
                      <li>• Real-time engagement metrics</li>
                    </ul>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Reading progress updates will appear
                    here when users interact with stories in real-time.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Implementation Examples</CardTitle>
                <CardDescription>
                  Code examples showing how to use the real-time subscription
                  system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      1. Basic Book Status Subscription
                    </h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {`import { useBookStatus } from '@/lib/hooks/useRealtime'

function MyComponent() {
  const { isConnected, lastUpdate } = useBookStatus((update) => {
    console.log('Book status changed:', update)
  })
  
  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
      {lastUpdate && <p>Last update: {lastUpdate.status}</p>}
    </div>
  )
}`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">
                      2. Book Generation with Pages
                    </h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {`import { useBookGeneration } from '@/lib/hooks/useRealtime'

function BookGenerator({ bookId }) {
  const { generationState, isConnected } = useBookGeneration(
    bookId,
    (statusUpdate) => console.log('Status:', statusUpdate),
    (pageUpdate) => console.log('New page:', pageUpdate)
  )
  
  return (
    <div>
      <p>Status: {generationState.status?.status}</p>
      <p>Pages: {generationState.pages.length}</p>
      <p>Generating: {generationState.isGenerating}</p>
    </div>
  )
}`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">
                      3. Reading Progress Tracking
                    </h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {`import { useReadingProgress } from '@/lib/hooks/useRealtime'

function ProgressTracker({ bookId }) {
  const { progress, lastProgressUpdate } = useReadingProgress(
    bookId,
    (update) => {
      // Handle real-time progress updates
      console.log('Progress update:', update)
    }
  )
  
  return (
    <div>
      {progress && (
        <p>Current progress: {progress.feedback_text}</p>
      )}
    </div>
  )
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Hooks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Core Hooks</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>
                        <code>useBookStatus()</code> - Book status changes
                      </li>
                      <li>
                        <code>useBookPages()</code> - New pages added
                      </li>
                      <li>
                        <code>useReadingProgress()</code> - Progress updates
                      </li>
                      <li>
                        <code>useUserBooks()</code> - All user book updates
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Utility Hooks</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>
                        <code>useBookGeneration()</code> - Combined status +
                        pages
                      </li>
                      <li>
                        <code>useRealtimeConnection()</code> - Connection
                        management
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </RealtimeDashboard>
    </div>
  )
}
