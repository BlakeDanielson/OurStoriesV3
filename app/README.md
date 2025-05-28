# App Directory

This directory contains the Next.js 14 App Router structure with pages, layouts, and API routes.

## Structure

- **`api/`** - API routes for backend functionality
  - `auth/` - Authentication endpoints
  - `stories/` - Story management endpoints
  - `users/` - User management endpoints
  - `images/` - Image generation and management endpoints
- **`auth/`** - Authentication pages and components
- **`dashboard/`** - User dashboard pages
- **`stories/`** - Story creation and viewing pages
- **`profile/`** - User profile pages
- **`settings/`** - Application settings pages

## Route Organization

Each feature directory contains:

- `page.tsx` - The main page component
- `layout.tsx` - Feature-specific layout (optional)
- `loading.tsx` - Loading UI (optional)
- `error.tsx` - Error UI (optional)
- `components/` - Page-specific components
- `types/` - Page-specific types

## API Routes

API routes follow RESTful conventions:

- `GET /api/stories` - List stories
- `POST /api/stories` - Create story
- `GET /api/stories/[id]` - Get specific story
- `PUT /api/stories/[id]` - Update story
- `DELETE /api/stories/[id]` - Delete story
