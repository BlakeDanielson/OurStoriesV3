# Database Schema Implementation

## Overview

The ourStories database schema has been successfully implemented in Supabase with a comprehensive structure designed for an AI-powered personalized children's book platform.

## Database Structure

### Core Tables

#### 1. Users Table

- **Purpose**: Extends Supabase auth.users with application-specific data
- **Key Features**:
  - Links to Supabase authentication
  - User roles (parent, child, admin)
  - Preferences stored as JSONB
  - Automatic profile creation on signup

#### 2. Child Profiles Table

- **Purpose**: Store information about children for personalized stories
- **Key Features**:
  - Linked to parent users
  - Age-based content filtering
  - Interests and favorite characters arrays
  - Reading level tracking
  - Avatar support

#### 3. Books Table

- **Purpose**: Store generated storybooks and metadata
- **Key Features**:
  - Status tracking (draft, generating, completed, failed)
  - AI generation settings and prompts
  - Genre and theme categorization
  - Reading time estimation
  - Cover image support

#### 4. Book Pages Table

- **Purpose**: Individual pages within books
- **Key Features**:
  - Sequential page numbering
  - Text content and image URLs
  - Audio narration support
  - AI generation metadata
  - Page type classification

#### 5. User Feedback Table

- **Purpose**: Track reading progress and user ratings
- **Key Features**:
  - Reading status tracking
  - 5-star rating system
  - Progress tracking with JSONB
  - Favorite pages marking
  - Comments and feedback

### Custom Types (Enums)

```sql
-- User roles for access control
CREATE TYPE user_role AS ENUM ('parent', 'child', 'admin');

-- Book generation and completion status
CREATE TYPE book_status AS ENUM ('draft', 'generating', 'completed', 'failed');

-- Reading progress tracking
CREATE TYPE reading_status AS ENUM ('not_started', 'in_progress', 'completed');
```

### Database Functions

#### 1. User Management

- `handle_new_user()`: Automatically creates user profile on signup
- Trigger: `on_auth_user_created` - Executes after auth.users insert

#### 2. Data Retrieval Functions

- `get_children_with_book_counts(parent_user_id)`: Children with book statistics
- `get_books_with_progress(user_id, child_profile_id)`: Books with reading progress
- `get_reading_statistics(user_id)`: Comprehensive reading analytics
- `search_books(user_id, search_term, filters)`: Advanced book search

#### 3. Book Management

- `update_book_status(book_id, new_status, total_pages_count)`: Status updates with authorization

### Row Level Security (RLS)

#### Security Model

- **Users**: Can only access their own profile
- **Child Profiles**: Parents can manage their children's profiles
- **Books**: Access restricted to books belonging to user's children
- **Book Pages**: Inherit access from parent book
- **User Feedback**: Users can only manage their own feedback
- **Admin Override**: Admin role can view all data

#### Policy Examples

```sql
-- Parents can view their children's profiles
CREATE POLICY "Parents can view their children's profiles" ON public.child_profiles
    FOR SELECT USING (auth.uid() = parent_id);

-- Users can view books for their children
CREATE POLICY "Users can view books for their children" ON public.books
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.child_profiles cp
            WHERE cp.id = books.child_profile_id
            AND cp.parent_id = auth.uid()
        )
    );
```

### Storage Configuration

#### Storage Buckets

1. **avatars**: User and child profile pictures (5MB limit, public)
2. **book-covers**: Book cover images (10MB limit, public)
3. **book-images**: Story page illustrations (10MB limit, public)
4. **book-audio**: Audio narration files (50MB limit, private)

#### Storage Policies

- **Folder-based organization**: Files organized by user/book ID
- **Access control**: Aligned with database RLS policies
- **File type restrictions**: MIME type validation
- **Size limits**: Appropriate for content type

### Indexes for Performance

#### Strategic Indexing

```sql
-- User lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Child profile queries
CREATE INDEX idx_child_profiles_parent_id ON public.child_profiles(parent_id);
CREATE INDEX idx_child_profiles_age ON public.child_profiles(age);

-- Book searches and filtering
CREATE INDEX idx_books_child_profile_id ON public.books(child_profile_id);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_genre ON public.books(genre);
CREATE INDEX idx_books_created_at ON public.books(created_at);

-- Page navigation
CREATE INDEX idx_book_pages_book_id ON public.book_pages(book_id);
CREATE INDEX idx_book_pages_page_number ON public.book_pages(page_number);

-- Feedback and analytics
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_book_id ON public.user_feedback(book_id);
CREATE INDEX idx_user_feedback_rating ON public.user_feedback(rating);
```

### Automatic Triggers

#### Updated At Timestamps

- All tables have `updated_at` columns
- Automatic trigger updates timestamp on row modification
- Consistent across all entities

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

## TypeScript Integration

### Generated Types

- Complete TypeScript definitions generated from schema
- Type-safe database operations
- Enum types for status values
- Convenience type exports

### Usage Example

```typescript
import { Database, User, Book, ChildProfile } from '@/lib/types/database'
import { createServerSupabaseClient } from '@/lib/supabase'

const supabase = createServerSupabaseClient()

// Type-safe queries
const { data: books } = await supabase
  .from('books')
  .select('*')
  .eq('status', 'completed')
```

## Migration History

1. **create_initial_schema**: Core tables, types, indexes, triggers
2. **setup_row_level_security**: RLS policies for all tables
3. **setup_storage_buckets**: Storage buckets and policies
4. **create_utility_functions_fixed**: Database functions and triggers

## Security Features

### Data Protection

- Row Level Security on all tables
- Storage bucket access control
- Function-level security with SECURITY DEFINER
- Admin role separation

### Access Patterns

- Parent-child relationship enforcement
- User isolation (no cross-user data access)
- Admin oversight capabilities
- Secure file storage with proper permissions

## Performance Considerations

### Optimizations

- Strategic indexing for common queries
- JSONB for flexible metadata storage
- Array types for lists (interests, themes)
- Efficient foreign key relationships

### Scalability

- UUID primary keys for distributed systems
- Partitioning-ready design
- Efficient query patterns
- Minimal N+1 query potential

## Next Steps

1. **Authentication Integration**: Implement NextAuth.js with Supabase
2. **API Layer**: Create type-safe API routes
3. **Real-time Features**: Set up Supabase real-time subscriptions
4. **Data Validation**: Implement Zod schemas matching database types
5. **Testing**: Create database test fixtures and utilities

## Monitoring and Maintenance

### Recommended Practices

- Regular backup verification
- Performance monitoring of slow queries
- RLS policy testing
- Storage usage monitoring
- Migration rollback procedures

### Analytics Queries

The schema supports rich analytics through the utility functions:

- Reading progress tracking
- Book popularity metrics
- User engagement statistics
- Content performance analysis
