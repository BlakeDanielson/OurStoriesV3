#!/usr/bin/env node

/**
 * Generate TypeScript types from Supabase schema
 *
 * This script regenerates TypeScript types when the database schema changes.
 * It should be run after any database migrations or schema updates.
 *
 * Usage:
 *   node scripts/generate-types.js
 *   npm run generate-types
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const TYPES_FILE = path.join(__dirname, '../lib/types/database.ts')
const BACKUP_FILE = path.join(__dirname, '../lib/types/database.backup.ts')

console.log('🔄 Generating TypeScript types from Supabase schema...')

try {
  // Create backup of existing types
  if (fs.existsSync(TYPES_FILE)) {
    console.log('📦 Creating backup of existing types...')
    fs.copyFileSync(TYPES_FILE, BACKUP_FILE)
  }

  // Generate new types using Supabase CLI
  console.log('🏗️  Generating types with Supabase CLI...')
  execSync(
    'npx supabase gen types typescript --project-id dpwkarpiiprdjwsxkodv > lib/types/database.ts',
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    }
  )

  // Read the generated file and add convenience exports
  console.log('✨ Adding convenience type exports...')
  let typesContent = fs.readFileSync(TYPES_FILE, 'utf8')

  // Add convenience exports at the end
  const convenientExports = `
// Convenience type exports
export type User = Tables<'users'>
export type ChildProfile = Tables<'child_profiles'>
export type Book = Tables<'books'>
export type BookPage = Tables<'book_pages'>
export type UserFeedback = Tables<'user_feedback'>

export type BookStatus = Database['public']['Enums']['book_status']
export type ReadingStatus = Database['public']['Enums']['reading_status']
export type UserRole = Database['public']['Enums']['user_role']`

  // Check if convenience exports already exist
  if (!typesContent.includes('// Convenience type exports')) {
    typesContent += convenientExports
    fs.writeFileSync(TYPES_FILE, typesContent)
  }

  console.log('✅ TypeScript types generated successfully!')
  console.log(`📁 Types saved to: ${TYPES_FILE}`)

  // Clean up backup if generation was successful
  if (fs.existsSync(BACKUP_FILE)) {
    fs.unlinkSync(BACKUP_FILE)
    console.log('🗑️  Backup file cleaned up')
  }
} catch (error) {
  console.error('❌ Error generating types:', error.message)

  // Restore backup if it exists
  if (fs.existsSync(BACKUP_FILE)) {
    console.log('🔄 Restoring backup...')
    fs.copyFileSync(BACKUP_FILE, TYPES_FILE)
    fs.unlinkSync(BACKUP_FILE)
    console.log('✅ Backup restored')
  }

  process.exit(1)
}

console.log('\n🎉 Type generation complete!')
console.log('\n📝 Next steps:')
console.log('   1. Review the generated types in lib/types/database.ts')
console.log('   2. Update any database operation helpers if needed')
console.log('   3. Run TypeScript check: npm run type-check')
console.log('   4. Test database operations with new types')
