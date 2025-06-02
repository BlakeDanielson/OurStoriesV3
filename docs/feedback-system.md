# User Feedback and Rating System

## Overview

The feedback system allows users to provide thumbs up/down ratings and optional text comments for books and individual pages. This MVP implementation focuses on simple data collection with a basic admin interface for monitoring feedback.

## Features

### User Features

- **Thumbs Up/Down Rating**: Simple binary feedback for books and pages
- **Optional Text Comments**: Users can provide additional feedback (500 character limit)
- **Real-time Updates**: Feedback is saved automatically and updates immediately
- **Visual Feedback**: Clear indication of current user rating with hover states

### Admin Features

- **Comprehensive Dashboard**: View all feedback with statistics
- **Filtering**: Filter by feedback type, content type, and date range
- **Pagination**: Handle large amounts of feedback data efficiently
- **Statistics**: Overall positive rate, total feedback counts, and breakdowns

## Implementation

### Database Schema

The system uses a `content_feedback` table with the following structure:

```sql
CREATE TABLE content_feedback (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    content_type content_type NOT NULL, -- 'book' or 'page'
    content_id uuid NOT NULL,
    book_id uuid NOT NULL,
    page_number integer, -- null for book feedback
    feedback_type feedback_type NOT NULL, -- 'thumbs_up' or 'thumbs_down'
    comment text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### Components

#### FeedbackRating

Basic thumbs up/down buttons with accessibility features and visual feedback states.

```tsx
<FeedbackRating
  currentFeedback={userFeedback?.feedback_type}
  onFeedbackChange={handleFeedbackChange}
  showCounts={true}
  thumbsUpCount={summary?.thumbs_up_count || 0}
  thumbsDownCount={summary?.thumbs_down_count || 0}
/>
```

#### FeedbackForm

Complete form combining rating buttons with optional text field and auto-submit functionality.

```tsx
<FeedbackForm
  contentType="book"
  contentId="book-123"
  bookId="book-123"
  currentFeedback={userFeedback?.feedback_type}
  currentComment={userFeedback?.comment}
  onSubmit={handleSubmit}
  showCounts={true}
/>
```

#### FeedbackWidget

High-level widget that combines form with data fetching and state management.

```tsx
<FeedbackWidget
  contentType="page"
  contentId="page-456"
  bookId="book-123"
  pageNumber={5}
  showCounts={true}
  title="Rate this page"
/>
```

### API Endpoints

#### POST /api/feedback

Create or update user feedback.

```json
{
  "content_type": "book",
  "content_id": "uuid",
  "book_id": "uuid",
  "page_number": 5,
  "feedback_type": "thumbs_up",
  "comment": "Great story!"
}
```

#### GET /api/feedback

Fetch user feedback and summary statistics.

Query parameters:

- `content_type`: 'book' or 'page'
- `content_id`: UUID of the content
- `book_id`: UUID of the book (required for summary)
- `page_number`: Page number (required for page feedback)

#### DELETE /api/feedback

Delete user feedback by ID.

#### GET /api/admin/feedback

Admin endpoint to fetch all feedback with filtering and pagination.

Query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `feedback_type`: Filter by 'thumbs_up' or 'thumbs_down'
- `content_type`: Filter by 'book' or 'page'
- `start_date`: Filter from date
- `end_date`: Filter to date

### Custom Hook

The `useFeedback` hook provides a clean interface for managing feedback state:

```tsx
const {
  userFeedback,
  summary,
  isLoading,
  error,
  submitFeedback,
  deleteFeedback,
} = useFeedback({
  contentType: 'book',
  contentId: 'book-123',
  bookId: 'book-123',
})
```

## Usage Examples

### Book Reading Interface

```tsx
// Book-level feedback
<FeedbackWidget
  contentType="book"
  contentId={book.id}
  bookId={book.id}
  showCounts={true}
  title="Rate this book"
/>

// Page-level feedback
<FeedbackWidget
  contentType="page"
  contentId={`${book.id}-page-${pageNumber}`}
  bookId={book.id}
  pageNumber={pageNumber}
  showCounts={true}
  title={`Rate page ${pageNumber}`}
/>
```

### Admin Dashboard

Access the admin feedback dashboard at `/admin/feedback` (requires admin role).

Features:

- Statistics cards showing total feedback, positive rate, and content type breakdown
- Filtering controls for feedback type, content type, and date range
- Paginated table with user information, content details, and feedback data
- Responsive design with loading states

## Security

- **Row Level Security (RLS)**: Users can only view/modify their own feedback
- **Admin Access Control**: Admin endpoints check for admin role
- **Input Validation**: All inputs are validated on both client and server
- **Rate Limiting**: Built-in protection against spam (future enhancement)

## Database Functions

The system includes several PostgreSQL functions for efficient data retrieval:

- `get_book_feedback_summary(book_id)`: Get aggregated feedback stats for a book
- `get_page_feedback_summary(book_id, page_number)`: Get stats for a specific page
- `get_user_content_feedback(user_id, content_type, content_id)`: Get user's feedback
- `get_feedback_admin_stats()`: Get overall system statistics

## Future Enhancements

- Advanced analytics and reporting
- Sentiment analysis of text comments
- Feedback trends over time
- Integration with AI training pipeline
- Moderation tools for inappropriate content
- Bulk feedback operations
- Export functionality for admin users

## Testing

The system includes comprehensive test coverage for:

- API endpoints (create, read, update, delete)
- Database functions and constraints
- Component rendering and interactions
- Admin access controls
- Data validation and error handling

## Performance Considerations

- Indexed database columns for efficient querying
- Pagination for large datasets
- Optimistic UI updates for better user experience
- Caching of summary statistics
- Efficient SQL queries with proper joins
