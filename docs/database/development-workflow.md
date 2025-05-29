# Database Development Workflow

This document outlines the development workflow for working with the Supabase database, TypeScript types, and schema changes in the ourStories project.

## Overview

The project uses Supabase as the backend with PostgreSQL database, and maintains type-safe database operations through automatically generated TypeScript types.

## Key Components

### 1. Database Schema

- **Location**: `supabase/migrations/`
- **Current Schema**: `20250528065522_remote_schema.sql`
- **Tables**: users, child_profiles, books, book_pages, user_feedback

### 2. TypeScript Types

- **Location**: `lib/types/database.ts`
- **Generated from**: Supabase schema using Supabase CLI
- **Includes**: Table types, function signatures, enum types

### 3. Database Operations

- **Location**: `lib/database.ts`
- **Purpose**: Type-safe CRUD operations and database function calls
- **Features**: Server/browser clients, real-time subscriptions, query builders

### 4. Supabase Clients

- **Location**: `lib/supabase.ts`
- **Types**: Browser, Server, Middleware, Admin clients
- **Integration**: Next.js App Router with SSR support

## Development Workflow

### When Schema Changes

1. **Make Database Changes**

   ```bash
   # Apply migrations to Supabase
   npx supabase db push
   ```

2. **Regenerate TypeScript Types**

   ```bash
   # Automatically regenerate types from schema
   npm run generate-types
   ```

3. **Update Database Operations**

   - Review `lib/database.ts` for any needed updates
   - Add new operation methods if new tables/functions were added
   - Update existing methods if column types changed

4. **Type Check**

   ```bash
   # Verify all types are correct
   npm run type-check
   ```

5. **Test Database Operations**
   ```bash
   # Run tests to ensure operations work
   npm test
   ```

### When Adding New Features

1. **Design Database Changes**

   - Plan new tables, columns, or functions needed
   - Consider relationships and constraints
   - Design RLS policies for security

2. **Create Migration**

   ```bash
   # Create new migration file
   npx supabase migration new feature_name
   ```

3. **Apply Migration**

   ```bash
   # Apply to local development
   npx supabase db reset

   # Apply to remote (staging/production)
   npx supabase db push
   ```

4. **Follow Schema Change Workflow** (steps above)

### Daily Development

1. **Start Development**

   ```bash
   # Start local Supabase (if using local development)
   npx supabase start

   # Start Next.js development server
   npm run dev
   ```

2. **Database Operations**

   ```typescript
   // Use type-safe database operations
   import { db } from '@/lib/database'

   // Server-side
   const dbOps = db.server()
   const books = await dbOps.getBooks()

   // Client-side
   const dbOps = db.browser()
   const user = await dbOps.getUser(userId)
   ```

3. **Real-time Features**

   ```typescript
   // Subscribe to real-time updates
   import { subscriptions } from '@/lib/database'

   const subscription = subscriptions.bookStatus(bookId, payload => {
     console.log('Book status updated:', payload)
   })
   ```

## Type Generation Script

### Features

- **Automatic Backup**: Creates backup before generating new types
- **Error Recovery**: Restores backup if generation fails
- **Convenience Exports**: Adds helpful type aliases
- **Validation**: Checks for successful generation

### Usage

```bash
# Generate types from current schema
npm run generate-types

# Manual generation with Supabase CLI
npx supabase gen types typescript --project-id dpwkarpiiprdjwsxkodv > lib/types/database.ts
```

### What It Does

1. Creates backup of existing types
2. Generates new types from Supabase schema
3. Adds convenience type exports
4. Validates generation success
5. Cleans up backup files

## Database Operation Patterns

### CRUD Operations

```typescript
// Create
const newBook = await dbOps.createBook({
  title: 'My Story',
  child_profile_id: childId,
  status: 'draft',
})

// Read
const book = await dbOps.getBook(bookId)
const books = await dbOps.getBooks(childId, 'completed')

// Update
const updatedBook = await dbOps.updateBook(bookId, {
  status: 'completed',
})

// Delete
await dbOps.deleteBook(bookId)
```

### Database Functions

```typescript
// Call stored procedures
const booksWithProgress = await dbOps.getBooksWithProgress(userId)
const statistics = await dbOps.getReadingStatistics(userId)
const searchResults = await dbOps.searchBooks(userId, 'adventure')
```

### Real-time Subscriptions

```typescript
// Subscribe to changes
const subscription = subscriptions.bookStatus(bookId, payload => {
  if (payload.eventType === 'UPDATE') {
    setBookStatus(payload.new.status)
  }
})

// Clean up subscription
subscription.unsubscribe()
```

## Best Practices

### Type Safety

- Always use generated types for database operations
- Regenerate types after any schema changes
- Use TypeScript strict mode for better type checking

### Error Handling

```typescript
const { data, error } = await dbOps.getBook(bookId)

if (error) {
  console.error('Database error:', error)
  // Handle error appropriately
  return
}

// data is now guaranteed to be non-null
console.log('Book title:', data.title)
```

### Performance

- Use appropriate indexes for query patterns
- Leverage database functions for complex operations
- Implement proper pagination for large datasets
- Use real-time subscriptions judiciously

### Security

- All operations respect Row Level Security (RLS) policies
- Use server-side operations for sensitive data
- Validate user permissions before database operations
- Never expose service role key to client-side code

## Troubleshooting

### Type Generation Issues

```bash
# Check Supabase CLI installation
npx supabase --version

# Verify project connection
npx supabase status

# Manual type generation
npx supabase gen types typescript --project-id dpwkarpiiprdjwsxkodv
```

### Database Connection Issues

- Verify environment variables in `.env`
- Check Supabase project status
- Validate API keys and URLs
- Review network connectivity

### RLS Policy Issues

- Test policies in Supabase dashboard
- Verify user authentication state
- Check policy conditions and filters
- Review auth.uid() usage

## Migration Management

### Local Development

```bash
# Reset local database to match remote
npx supabase db reset

# Pull latest schema from remote
npx supabase db pull

# Generate migration from schema diff
npx supabase db diff --use-migra
```

### Production Deployment

```bash
# Apply migrations to production
npx supabase db push --project-ref dpwkarpiiprdjwsxkodv

# Verify migration success
npx supabase db status
```

## Monitoring and Maintenance

### Regular Tasks

- Monitor database performance metrics
- Review and optimize slow queries
- Update indexes based on query patterns
- Backup and test restore procedures

### Schema Evolution

- Plan breaking changes carefully
- Use feature flags for gradual rollouts
- Maintain backward compatibility when possible
- Document all schema changes

This workflow ensures type safety, maintainability, and reliability of database operations throughout the development lifecycle.
