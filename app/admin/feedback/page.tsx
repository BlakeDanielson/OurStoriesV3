'use client'

import React, { useState, useEffect } from 'react'
import {
  ThumbsUp,
  ThumbsDown,
  Filter,
  Calendar,
  User,
  Book,
  FileText,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FeedbackItem {
  id: string
  content_type: 'book' | 'page'
  content_id: string
  book_id: string
  page_number?: number
  feedback_type: 'thumbs_up' | 'thumbs_down'
  comment?: string
  created_at: string
  users: {
    email: string
    full_name?: string
  }
  books: {
    title: string
  }
}

interface FeedbackStats {
  total_feedback: number
  thumbs_up_count: number
  thumbs_down_count: number
  positive_percentage: number
  book_feedback_count: number
  page_feedback_count: number
}

interface FeedbackResponse {
  feedback: FeedbackItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: FeedbackStats
}

export default function AdminFeedbackPage() {
  const [data, setData] = useState<FeedbackResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [feedbackType, setFeedbackType] = useState<string>('')
  const [contentType, setContentType] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [page, setPage] = useState(1)

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (feedbackType) params.append('feedback_type', feedbackType)
      if (contentType) params.append('content_type', contentType)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const response = await fetch(`/api/admin/feedback?${params}`)

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required')
        }
        throw new Error('Failed to fetch feedback data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [page, feedbackType, contentType, startDate, endDate])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const clearFilters = () => {
    setFeedbackType('')
    setContentType('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback Management</h1>
          <p className="text-gray-600">
            Monitor user feedback across books and pages
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Feedback
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.total_feedback}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Positive Rate
              </CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.stats.positive_percentage}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data.stats.thumbs_up_count} of {data.stats.total_feedback}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Book Feedback
              </CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.book_feedback_count}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Page Feedback
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.page_feedback_count}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Feedback Type
              </label>
              <Select value={feedbackType} onValueChange={setFeedbackType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="thumbs_up">Thumbs Up</SelectItem>
                  <SelectItem value="thumbs_down">Thumbs Down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Content Type
              </label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue placeholder="All content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All content</SelectItem>
                  <SelectItem value="book">Books</SelectItem>
                  <SelectItem value="page">Pages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Data</CardTitle>
          <CardDescription>
            {data?.pagination && (
              <>
                Showing {(data.pagination.page - 1) * data.pagination.limit + 1}{' '}
                to{' '}
                {Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total
                )}{' '}
                of {data.pagination.total} entries
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.feedback && data.feedback.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Content</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Feedback</th>
                      <th className="text-left p-2">Comment</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.feedback.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {item.users.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.users.email}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {item.books.title}
                            </div>
                            {item.content_type === 'page' &&
                              item.page_number && (
                                <div className="text-sm text-gray-500">
                                  Page {item.page_number}
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              item.content_type === 'book'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {item.content_type}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {item.feedback_type === 'thumbs_up' ? (
                              <ThumbsUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-red-600" />
                            )}
                            <span
                              className={
                                item.feedback_type === 'thumbs_up'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {item.feedback_type === 'thumbs_up'
                                ? 'Positive'
                                : 'Negative'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 max-w-xs">
                          {item.comment ? (
                            <div
                              className="text-sm truncate"
                              title={item.comment}
                            >
                              {item.comment}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No comment
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-sm text-gray-500">
                          {formatDate(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No feedback data found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
