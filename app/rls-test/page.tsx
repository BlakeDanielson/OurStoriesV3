'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  testRLSForUser,
  verifyUserDataAccess,
  verifyParentChildAccess,
} from '@/lib/rls-testing'
import { getCurrentUserProfile, getUserChildren } from '@/lib/auth/rls-helpers'
import { useAuth } from '@/lib/auth/context'

interface TestResult {
  userProfile: boolean
  childProfile: boolean
  books: boolean
  userFeedback: boolean
  admin: boolean
}

export default function RLSTestPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const runRLSTests = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get user profile and children first
      const profile = await getCurrentUserProfile()
      const userChildren = await getUserChildren()

      setUserProfile(profile)
      setChildren(userChildren)

      // Run comprehensive RLS tests
      const { results } = await testRLSForUser(
        user.id,
        userChildren.length > 0 ? userChildren[0].id : undefined
      )

      setTestResults(results)
    } catch (err) {
      console.error('RLS test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const runQuickDataAccessTest = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const hasAccess = await verifyUserDataAccess(user.id)
      console.log('User data access verified:', hasAccess)

      if (children.length > 0) {
        const hasChildAccess = await verifyParentChildAccess(
          user.id,
          children[0].id
        )
        console.log('Parent-child access verified:', hasChildAccess)
      }
    } catch (err) {
      console.error('Quick test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getResultBadge = (result: boolean) => {
    return (
      <Badge variant={result ? 'default' : 'destructive'}>
        {result ? '✅ PASS' : '❌ FAIL'}
      </Badge>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>RLS Testing</CardTitle>
            <CardDescription>
              Please sign in to test Row Level Security policies
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Row Level Security (RLS) Testing</CardTitle>
          <CardDescription>
            Test and verify that database security policies are working
            correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={runRLSTests}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Running Tests...' : 'Run Full RLS Test Suite'}
            </Button>
            <Button
              onClick={runQuickDataAccessTest}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? 'Testing...' : 'Quick Data Access Test'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Current User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Email:</p>
                <p className="text-gray-600">{userProfile.email}</p>
              </div>
              <div>
                <p className="font-medium">Full Name:</p>
                <p className="text-gray-600">
                  {userProfile.full_name || 'Not set'}
                </p>
              </div>
              <div>
                <p className="font-medium">Role:</p>
                <p className="text-gray-600">{userProfile.role}</p>
              </div>
              <div>
                <p className="font-medium">Children Count:</p>
                <p className="text-gray-600">{children.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Child Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {children.map(child => (
                <div key={child.id} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <p className="text-sm text-gray-600">Age: {child.age}</p>
                    </div>
                    <Badge variant="outline">{child.reading_level}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>RLS Test Results</CardTitle>
            <CardDescription>
              Results from the comprehensive Row Level Security test suite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">User Profile Access:</span>
                {getResultBadge(testResults.userProfile)}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Child Profile Access:</span>
                {getResultBadge(testResults.childProfile)}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Book Access:</span>
                {getResultBadge(testResults.books)}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">User Feedback Access:</span>
                {getResultBadge(testResults.userFeedback)}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Admin Access:</span>
                {getResultBadge(testResults.admin)}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Overall Result:</span>
                  <Badge
                    variant={
                      Object.values(testResults).every(r => r)
                        ? 'default'
                        : 'destructive'
                    }
                    className="text-lg px-4 py-2"
                  >
                    {Object.values(testResults).every(r => r)
                      ? '✅ ALL TESTS PASSED'
                      : '❌ SOME TESTS FAILED'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>What This Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>User Profile Access:</strong> Verifies users can only
              access their own profile data
            </p>
            <p>
              <strong>Child Profile Access:</strong> Verifies parents can only
              access their own children's profiles
            </p>
            <p>
              <strong>Book Access:</strong> Verifies parents can only access
              books belonging to their children
            </p>
            <p>
              <strong>User Feedback Access:</strong> Verifies users can only
              access their own feedback
            </p>
            <p>
              <strong>Admin Access:</strong> Verifies admin users can access all
              data (requires service role key)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
