# Upload Components

This directory contains various upload components for handling file uploads in the ourStories application.

## Components

### UploadedFilesList

A comprehensive component for displaying and managing uploaded files stored in the database.

**Features:**

- Display uploaded files with metadata (name, size, type, upload date)
- Filter by upload type (general, child_photo, avatar)
- Upload statistics dashboard
- File preview for images
- Delete functionality (soft delete)
- Responsive design with proper loading and error states

**Usage:**

```tsx
import { UploadedFilesList } from '@/components/upload/UploadedFilesList';

// Basic usage
<UploadedFilesList />

// With specific upload type filter
<UploadedFilesList uploadType="child_photo" />

// Without statistics
<UploadedFilesList showStatistics={false} />
```

### Other Upload Components

- `ImageUploader` - Basic UploadThing integration
- `ValidatedImageUploader` - Client-side validation before upload
- `CompressedImageUploader` - Image compression + validation + upload

## Database Schema

The `uploaded_files` table has been created with the following structure:

```sql
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    upload_type TEXT NOT NULL CHECK (upload_type IN ('general', 'child_photo', 'avatar')),
    validation_type TEXT NOT NULL,
    uploadthing_key TEXT,
    uploadthing_file_id TEXT,
    metadata JSONB DEFAULT '{}',
    associated_entity_type TEXT CHECK (associated_entity_type IN ('user', 'child_profile', 'book', 'book_page')),
    associated_entity_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Features:**

- Row Level Security (RLS) enabled
- Proper indexes for performance
- Foreign key relationship to users table
- Soft delete capability via `is_active` flag
- Flexible entity associations via `associated_entity_type` and `associated_entity_id`

## API Endpoints

### GET /api/uploaded-files

Retrieve uploaded files for the current user.

**Query Parameters:**

- `upload_type` - Filter by upload type
- `validation_type` - Filter by validation type
- `associated_entity_type` - Filter by associated entity type
- `associated_entity_id` - Filter by associated entity ID
- `is_active` - Filter by active status (default: true)
- `created_after` - Filter by creation date (after)
- `created_before` - Filter by creation date (before)
- `include_associations` - Include user data (default: false)
- `statistics` - Return statistics instead of files (default: false)

### PATCH /api/uploaded-files

Update an uploaded file record.

### DELETE /api/uploaded-files

Soft delete an uploaded file (sets `is_active` to false).

## Testing

Visit `/test-upload` to test all upload functionality including the new database file management features.

## Type Safety

All components and services are fully typed with TypeScript, using generated Supabase types for database operations.
