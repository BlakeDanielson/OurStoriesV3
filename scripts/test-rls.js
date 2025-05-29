#!/usr/bin/env node

/**
 * Test Row Level Security (RLS) Policies
 *
 * This script tests all RLS policies to ensure proper data isolation
 * and security enforcement across all database tables.
 *
 * Usage:
 *   node scripts/test-rls.js
 *   npm run test:rls
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔒 Testing Row Level Security (RLS) Policies...')
console.log('='.repeat(50))

try {
  // Check if environment variables are set
  const envPath = path.join(__dirname, '../.env')
  if (!fs.existsSync(envPath)) {
    console.error(
      '❌ .env file not found. Please create it with Supabase credentials.'
    )
    process.exit(1)
  }

  // Load environment variables
  require('dotenv').config({ path: envPath })

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error('❌ Missing Supabase environment variables.')
    console.error(
      '   Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
    process.exit(1)
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY.')
    console.error('   This is required for admin operations during testing.')
    process.exit(1)
  }

  console.log('✅ Environment variables loaded')
  console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('')

  // Run TypeScript compilation for the test file
  console.log('🔨 Compiling TypeScript...')
  execSync(
    'npx tsc lib/rls-testing.ts --outDir .temp --target es2020 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck',
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    }
  )

  // Import and run the tests
  console.log('🧪 Running RLS policy tests...')
  const {
    runRLSTests,
    formatRLSTestResults,
  } = require('../.temp/lib/rls-testing.js')

  runRLSTests()
    .then(({ suites, summary }) => {
      // Display results
      console.log(formatRLSTestResults(suites))

      // Summary
      console.log('📊 Test Summary')
      console.log('-'.repeat(30))
      console.log(`Total Tests: ${summary.totalTests}`)
      console.log(`Passed: ${summary.totalPassed}`)
      console.log(`Failed: ${summary.totalFailed}`)
      console.log(`Pass Rate: ${summary.passRate.toFixed(1)}%`)

      // Generate report file
      const reportPath = path.join(__dirname, '../.temp/rls-test-report.json')
      fs.writeFileSync(reportPath, JSON.stringify({ suites, summary }, null, 2))
      console.log(`\n📄 Detailed report saved to: ${reportPath}`)

      // Clean up compiled files
      fs.rmSync(path.join(__dirname, '../.temp'), {
        recursive: true,
        force: true,
      })

      // Exit with appropriate code
      if (summary.totalFailed > 0) {
        console.log('\n❌ Some RLS policy tests failed!')
        console.log('   Please review the failed tests and fix the policies.')
        process.exit(1)
      } else {
        console.log('\n✅ All RLS policy tests passed!')
        console.log('   Your database security policies are working correctly.')
        process.exit(0)
      }
    })
    .catch(error => {
      console.error('\n❌ Error running RLS tests:', error.message)
      console.error(error.stack)

      // Clean up compiled files
      fs.rmSync(path.join(__dirname, '../.temp'), {
        recursive: true,
        force: true,
      })
      process.exit(1)
    })
} catch (error) {
  console.error('❌ Error setting up RLS tests:', error.message)
  process.exit(1)
}
