# Entity Relationship Diagram - ourStories Database

## Overview

This document defines the database schema for the ourStories AI-powered children's book platform using Supabase PostgreSQL with Prisma ORM integration.

## Core Entities

### 1. Users (Authentication & Profile)

**Purpose**: Store user account information and profile data
**Integration**: Extends Supabase auth.users table

| Column                  | Type         | Constraints                    | Description                        |
| ----------------------- | ------------ | ------------------------------ | ---------------------------------- |
| id                      | UUID         | PK, DEFAULT uuid_generate_v4() | Primary key, matches auth.users.id |
| email                   | VARCHAR(255) | UNIQUE, NOT NULL               | User email (from auth.users)       |
| full_name               | VARCHAR(255) |                                | User's full name                   |
| avatar_url              | TEXT         |                                | Profile picture URL                |
| subscription_tier       | ENUM         | DEFAULT 'free'                 | free, premium, family              |
| subscription_expires_at | TIMESTAMPTZ  |                                | Subscription expiration            |
| preferences             | JSONB        | DEFAULT '{}'                   | User preferences and settings      |
| created_at              | TIMESTAMPTZ  | DEFAULT NOW()                  | Account creation timestamp         |
| updated_at              | TIMESTAMPTZ  | DEFAULT NOW()                  | Last update timestamp              |

**Relationships**:

- One-to-Many with ChildProfiles
- One-to-Many with Books (as creator)
- One-to-Many with UserFeedback

### 2. ChildProfiles

**Purpose**: Store information about children for personalized story generation
**RLS**: Users can only access their own children's profiles

| Column              | Type         | Constraints                    | Description                        |
| ------------------- | ------------ | ------------------------------ | ---------------------------------- |
| id                  | UUID         | PK, DEFAULT uuid_generate_v4() | Primary key                        |
| user_id             | UUID         | FK → Users.id, NOT NULL        | Parent/guardian user               |
| name                | VARCHAR(100) | NOT NULL                       | Child's name                       |
| age                 | INTEGER      | CHECK (age >= 0 AND age <= 18) | Child's age                        |
| reading_level       | ENUM         | NOT NULL                       | beginner, intermediate, advanced   |
| interests           | TEXT[]       | DEFAULT '{}'                   | Array of interests/hobbies         |
| favorite_characters | TEXT[]       | DEFAULT '{}'                   | Preferred character types          |
| learning_goals      | TEXT[]       | DEFAULT '{}'                   | Educational objectives             |
| avatar_url          | TEXT         |                                | Child's avatar/photo URL           |
| personality_traits  | JSONB        | DEFAULT '{}'                   | Personality characteristics for AI |
| created_at          | TIMESTAMPTZ  | DEFAULT NOW()                  | Profile creation                   |
| updated_at          | TIMESTAMPTZ  | DEFAULT NOW()                  | Last update                        |

**Relationships**:

- Many-to-One with Users
- One-to-Many with Books (as target child)
- One-to-Many with UserFeedback

### 3. Books

**Purpose**: Store generated storybooks and their metadata
**RLS**: Users can only access books they created or books for their children

| Column              | Type         | Constraints                                        | Description                               |
| ------------------- | ------------ | -------------------------------------------------- | ----------------------------------------- |
| id                  | UUID         | PK, DEFAULT uuid_generate_v4()                     | Primary key                               |
| user_id             | UUID         | FK → Users.id, NOT NULL                            | Book creator                              |
| child_profile_id    | UUID         | FK → ChildProfiles.id                              | Target child (optional)                   |
| title               | VARCHAR(255) | NOT NULL                                           | Book title                                |
| description         | TEXT         |                                                    | Book description/summary                  |
| theme               | VARCHAR(100) |                                                    | Story theme (adventure, friendship, etc.) |
| reading_level       | ENUM         | NOT NULL                                           | beginner, intermediate, advanced          |
| generation_status   | ENUM         | DEFAULT 'pending'                                  | pending, generating, completed, failed    |
| generation_progress | INTEGER      | DEFAULT 0, CHECK (0 <= generation_progress <= 100) | Progress percentage                       |
| style_preferences   | JSONB        | DEFAULT '{}'                                       | Art style, colors, etc.                   |
| story_prompt        | TEXT         |                                                    | Original story prompt/request             |
| total_pages         | INTEGER      | DEFAULT 0                                          | Number of pages in book                   |
| estimated_read_time | INTEGER      |                                                    | Minutes to read                           |
| is_public           | BOOLEAN      | DEFAULT FALSE                                      | Whether book can be shared                |
| cover_image_url     | TEXT         |                                                    | Book cover image                          |
| created_at          | TIMESTAMPTZ  | DEFAULT NOW()                                      | Creation timestamp                        |
| updated_at          | TIMESTAMPTZ  | DEFAULT NOW()                                      | Last update                               |
| completed_at        | TIMESTAMPTZ  |                                                    | When generation completed                 |

**Relationships**:

- Many-to-One with Users
- Many-to-One with ChildProfiles (optional)
- One-to-Many with BookPages
- One-to-Many with UserFeedback

### 4. BookPages

**Purpose**: Store individual pages of generated books
**RLS**: Inherits access from parent Book

| Column            | Type        | Constraints                       | Description                            |
| ----------------- | ----------- | --------------------------------- | -------------------------------------- |
| id                | UUID        | PK, DEFAULT uuid_generate_v4()    | Primary key                            |
| book_id           | UUID        | FK → Books.id, NOT NULL           | Parent book                            |
| page_number       | INTEGER     | NOT NULL, CHECK (page_number > 0) | Page sequence                          |
| content           | TEXT        |                                   | Page text content                      |
| image_url         | TEXT        |                                   | Generated illustration URL             |
| image_prompt      | TEXT        |                                   | AI prompt used for image               |
| alt_text          | TEXT        |                                   | Accessibility description              |
| generation_status | ENUM        | DEFAULT 'pending'                 | pending, generating, completed, failed |
| created_at        | TIMESTAMPTZ | DEFAULT NOW()                     | Page creation                          |
| updated_at        | TIMESTAMPTZ | DEFAULT NOW()                     | Last update                            |

**Relationships**:

- Many-to-One with Books
  **Constraints**:
- UNIQUE(book_id, page_number) - No duplicate page numbers per book

### 5. UserFeedback

**Purpose**: Store user ratings, comments, and reading progress
**RLS**: Users can only access their own feedback

| Column                | Type        | Constraints                                     | Description                  |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------- |
| id                    | UUID        | PK, DEFAULT uuid_generate_v4()                  | Primary key                  |
| user_id               | UUID        | FK → Users.id, NOT NULL                         | Feedback author              |
| child_profile_id      | UUID        | FK → ChildProfiles.id                           | Child who read the book      |
| book_id               | UUID        | FK → Books.id, NOT NULL                         | Book being reviewed          |
| rating                | INTEGER     | CHECK (rating >= 1 AND rating <= 5)             | 1-5 star rating              |
| comment               | TEXT        |                                                 | Written feedback             |
| reading_progress      | INTEGER     | DEFAULT 0, CHECK (0 <= reading_progress <= 100) | Completion percentage        |
| read_duration_minutes | INTEGER     |                                                 | Time spent reading           |
| favorite_page         | INTEGER     |                                                 | Child's favorite page number |
| would_recommend       | BOOLEAN     |                                                 | Recommendation flag          |
| created_at            | TIMESTAMPTZ | DEFAULT NOW()                                   | Feedback timestamp           |
| updated_at            | TIMESTAMPTZ | DEFAULT NOW()                                   | Last update                  |

**Relationships**:

- Many-to-One with Users
- Many-to-One with ChildProfiles
- Many-to-One with Books

## Entity Relationships Summary

```
Users (1) ←→ (M) ChildProfiles
Users (1) ←→ (M) Books
Users (1) ←→ (M) UserFeedback

ChildProfiles (1) ←→ (M) Books (optional)
ChildProfiles (1) ←→ (M) UserFeedback

Books (1) ←→ (M) BookPages
Books (1) ←→ (M) UserFeedback
```

## Business Rules

### Data Integrity

1. **User Ownership**: All child profiles, books, and feedback must belong to a valid user
2. **Child Age Validation**: Children must be between 0-18 years old
3. **Reading Level Consistency**: Books should match or be appropriate for child's reading level
4. **Page Ordering**: Book pages must have sequential, positive page numbers
5. **Rating Bounds**: Feedback ratings must be between 1-5 stars
6. **Progress Tracking**: Reading progress and generation progress must be 0-100%

### Supabase-Specific Considerations

1. **Auth Integration**: User IDs must match Supabase auth.users.id
2. **RLS Policies**: All tables require Row Level Security for multi-tenant isolation
3. **Real-time**: Books table should support real-time subscriptions for generation status
4. **Storage Integration**: Image URLs reference Supabase Storage buckets
5. **Performance**: Indexes on user_id, book_id, child_profile_id for efficient queries

### Security Requirements

1. **Data Isolation**: Users can only access their own data and their children's data
2. **Content Moderation**: Generated content should be family-friendly
3. **Privacy Protection**: Child data requires special protection and consent
4. **Subscription Enforcement**: Premium features gated by subscription tier
5. **Rate Limiting**: API access should be rate-limited per user

## Indexes Strategy

### Primary Indexes (Automatic)

- All primary keys (UUID)
- Unique constraints (email, book_id+page_number)

### Performance Indexes

```sql
-- User data access
CREATE INDEX idx_child_profiles_user_id ON child_profiles(user_id);
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);

-- Book relationships
CREATE INDEX idx_books_child_profile_id ON books(child_profile_id);
CREATE INDEX idx_book_pages_book_id ON book_pages(book_id);
CREATE INDEX idx_user_feedback_book_id ON user_feedback(book_id);

-- Status and filtering
CREATE INDEX idx_books_generation_status ON books(generation_status);
CREATE INDEX idx_books_reading_level ON books(reading_level);
CREATE INDEX idx_books_created_at ON books(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_books_user_status ON books(user_id, generation_status);
CREATE INDEX idx_feedback_user_book ON user_feedback(user_id, book_id);
```

## Data Types and Enums

### Subscription Tiers

```sql
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'family');
```

### Reading Levels

```sql
CREATE TYPE reading_level AS ENUM ('beginner', 'intermediate', 'advanced');
```

### Generation Status

```sql
CREATE TYPE generation_status AS ENUM ('pending', 'generating', 'completed', 'failed');
```

## Next Steps

1. **Supabase Project Setup**: Create project and configure environment
2. **Schema Implementation**: Create tables using Prisma migrations
3. **RLS Policies**: Implement security policies for each table
4. **Storage Configuration**: Set up buckets for images
5. **Real-time Setup**: Enable subscriptions for book generation
6. **Testing**: Validate all relationships and constraints
