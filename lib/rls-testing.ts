import {
  createBrowserSupabaseClient,
  createAdminSupabaseClient,
} from './supabase'
import { Database } from './types/database'

type Tables = Database['public']['Tables']
type User = Database['public']['Tables']['users']['Row']
type ChildProfile = Database['public']['Tables']['child_profiles']['Row']
type Book = Database['public']['Tables']['books']['Row']

/**
 * RLS Testing Utilities
 *
 * These utilities help test Row Level Security policies to ensure
 * data access is properly restricted based on user permissions.
 */

export class RLSTestSuite {
  private userClient: ReturnType<typeof createBrowserSupabaseClient>
  private adminClient: ReturnType<typeof createAdminSupabaseClient>

  constructor() {
    this.userClient = createBrowserSupabaseClient()
    this.adminClient = createAdminSupabaseClient()
  }

  /**
   * Test user profile access policies
   */
  async testUserProfileAccess(userId: string) {
    console.log('🧪 Testing User Profile RLS Policies...')

    try {
      // Test: User can view their own profile
      const { data: ownProfile, error: ownError } = await this.userClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (ownError) {
        console.error('❌ User cannot access own profile:', ownError)
        return false
      }

      console.log('✅ User can access own profile')

      // Test: User cannot view other users' profiles (should return empty)
      const { data: otherProfiles, error: otherError } = await this.userClient
        .from('users')
        .select('*')
        .neq('id', userId)

      if (otherError) {
        console.error('❌ Error testing other profiles access:', otherError)
        return false
      }

      if (otherProfiles && otherProfiles.length > 0) {
        console.error(
          "❌ User can access other users' profiles (RLS violation)"
        )
        return false
      }

      console.log("✅ User cannot access other users' profiles")
      return true
    } catch (error) {
      console.error('❌ User profile RLS test failed:', error)
      return false
    }
  }

  /**
   * Test child profile access policies
   */
  async testChildProfileAccess(parentId: string, childId: string) {
    console.log('🧪 Testing Child Profile RLS Policies...')

    try {
      // Test: Parent can view their children's profiles
      const { data: ownChildren, error: ownError } = await this.userClient
        .from('child_profiles')
        .select('*')
        .eq('parent_id', parentId)

      if (ownError) {
        console.error('❌ Parent cannot access own children:', ownError)
        return false
      }

      console.log('✅ Parent can access own children profiles')

      // Test: Parent cannot view other parents' children
      const { data: otherChildren, error: otherError } = await this.userClient
        .from('child_profiles')
        .select('*')
        .neq('parent_id', parentId)

      if (otherError) {
        console.error('❌ Error testing other children access:', otherError)
        return false
      }

      if (otherChildren && otherChildren.length > 0) {
        console.error(
          "❌ Parent can access other parents' children (RLS violation)"
        )
        return false
      }

      console.log("✅ Parent cannot access other parents' children")
      return true
    } catch (error) {
      console.error('❌ Child profile RLS test failed:', error)
      return false
    }
  }

  /**
   * Test book access policies
   */
  async testBookAccess(parentId: string, childId: string) {
    console.log('🧪 Testing Book RLS Policies...')

    try {
      // Test: Parent can view books for their children
      const { data: ownBooks, error: ownError } = await this.userClient
        .from('books')
        .select(
          `
          *,
          child_profiles!inner (
            id,
            parent_id
          )
        `
        )
        .eq('child_profiles.parent_id', parentId)

      if (ownError) {
        console.error("❌ Parent cannot access own children's books:", ownError)
        return false
      }

      console.log("✅ Parent can access own children's books")

      // Test: Parent cannot view books for other children
      const { data: otherBooks, error: otherError } = await this.userClient
        .from('books')
        .select(
          `
          *,
          child_profiles!inner (
            id,
            parent_id
          )
        `
        )
        .neq('child_profiles.parent_id', parentId)

      if (otherError) {
        console.error('❌ Error testing other books access:', otherError)
        return false
      }

      if (otherBooks && otherBooks.length > 0) {
        console.error(
          "❌ Parent can access other parents' books (RLS violation)"
        )
        return false
      }

      console.log("✅ Parent cannot access other parents' books")
      return true
    } catch (error) {
      console.error('❌ Book RLS test failed:', error)
      return false
    }
  }

  /**
   * Test user feedback access policies
   */
  async testUserFeedbackAccess(userId: string) {
    console.log('🧪 Testing User Feedback RLS Policies...')

    try {
      // Test: User can view their own feedback
      const { data: ownFeedback, error: ownError } = await this.userClient
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)

      if (ownError) {
        console.error('❌ User cannot access own feedback:', ownError)
        return false
      }

      console.log('✅ User can access own feedback')

      // Test: User cannot view other users' feedback
      const { data: otherFeedback, error: otherError } = await this.userClient
        .from('user_feedback')
        .select('*')
        .neq('user_id', userId)

      if (otherError) {
        console.error('❌ Error testing other feedback access:', otherError)
        return false
      }

      if (otherFeedback && otherFeedback.length > 0) {
        console.error(
          "❌ User can access other users' feedback (RLS violation)"
        )
        return false
      }

      console.log("✅ User cannot access other users' feedback")
      return true
    } catch (error) {
      console.error('❌ User feedback RLS test failed:', error)
      return false
    }
  }

  /**
   * Test admin access policies
   */
  async testAdminAccess() {
    console.log('🧪 Testing Admin RLS Policies...')

    try {
      // Test: Admin can view all users
      const { data: allUsers, error: usersError } = await this.adminClient
        .from('users')
        .select('*')

      if (usersError) {
        console.error('❌ Admin cannot access all users:', usersError)
        return false
      }

      console.log('✅ Admin can access all users')

      // Test: Admin can view all child profiles
      const { data: allChildren, error: childrenError } = await this.adminClient
        .from('child_profiles')
        .select('*')

      if (childrenError) {
        console.error(
          '❌ Admin cannot access all child profiles:',
          childrenError
        )
        return false
      }

      console.log('✅ Admin can access all child profiles')

      // Test: Admin can view all books
      const { data: allBooks, error: booksError } = await this.adminClient
        .from('books')
        .select('*')

      if (booksError) {
        console.error('❌ Admin cannot access all books:', booksError)
        return false
      }

      console.log('✅ Admin can access all books')
      return true
    } catch (error) {
      console.error('❌ Admin RLS test failed:', error)
      return false
    }
  }

  /**
   * Run comprehensive RLS test suite
   */
  async runFullTestSuite(userId: string, childId?: string) {
    console.log('🚀 Starting Comprehensive RLS Test Suite...')

    const results = {
      userProfile: await this.testUserProfileAccess(userId),
      childProfile: childId
        ? await this.testChildProfileAccess(userId, childId)
        : true,
      books: childId ? await this.testBookAccess(userId, childId) : true,
      userFeedback: await this.testUserFeedbackAccess(userId),
      admin: await this.testAdminAccess(),
    }

    const allPassed = Object.values(results).every(result => result === true)

    console.log('\n📊 RLS Test Results:')
    console.log('User Profile Access:', results.userProfile ? '✅' : '❌')
    console.log('Child Profile Access:', results.childProfile ? '✅' : '❌')
    console.log('Book Access:', results.books ? '✅' : '❌')
    console.log('User Feedback Access:', results.userFeedback ? '✅' : '❌')
    console.log('Admin Access:', results.admin ? '✅' : '❌')
    console.log(
      '\n🎯 Overall Result:',
      allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'
    )

    return { results, allPassed }
  }
}

/**
 * Helper function to quickly test RLS for a specific user
 */
export const testRLSForUser = async (userId: string, childId?: string) => {
  const testSuite = new RLSTestSuite()
  return await testSuite.runFullTestSuite(userId, childId)
}

/**
 * Helper function to verify user has proper access to their data
 */
export const verifyUserDataAccess = async (userId: string) => {
  const testSuite = new RLSTestSuite()

  const userProfileTest = await testSuite.testUserProfileAccess(userId)
  const userFeedbackTest = await testSuite.testUserFeedbackAccess(userId)

  return userProfileTest && userFeedbackTest
}

/**
 * Helper function to verify parent has proper access to child data
 */
export const verifyParentChildAccess = async (
  parentId: string,
  childId: string
) => {
  const testSuite = new RLSTestSuite()

  const childProfileTest = await testSuite.testChildProfileAccess(
    parentId,
    childId
  )
  const bookTest = await testSuite.testBookAccess(parentId, childId)

  return childProfileTest && bookTest
}
