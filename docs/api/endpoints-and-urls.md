# 📋 Complete List of Endpoints and URLs - ourStories

This document provides a comprehensive overview of all available routes, endpoints, and URLs in the ourStories application.

## 🌐 **Frontend Pages (Public Routes)**

### **Main Pages**

| URL | Description              | Authentication Required |
| --- | ------------------------ | ----------------------- |
| `/` | Home page (landing page) | ❌ No                   |

### **Authentication Pages**

| URL                     | Description             | Authentication Required |
| ----------------------- | ----------------------- | ----------------------- |
| `/auth/signin`          | Sign in page            | ❌ No                   |
| `/auth/signup`          | Sign up page            | ❌ No                   |
| `/auth/callback`        | OAuth callback handler  | ❌ No                   |
| `/auth/reset-password`  | Password reset page     | ❌ No                   |
| `/auth/update-password` | Update password page    | ❌ No                   |
| `/auth/verify-email`    | Email verification page | ❌ No                   |

### **Legal Pages**

| URL              | Description      | Authentication Required |
| ---------------- | ---------------- | ----------------------- |
| `/legal/privacy` | Privacy policy   | ❌ No                   |
| `/legal/terms`   | Terms of service | ❌ No                   |

---

## 🔒 **Protected Pages (Require Authentication)**

### **User Profile**

| URL        | Description       | Authentication Required |
| ---------- | ----------------- | ----------------------- |
| `/profile` | User profile page | ✅ Yes                  |

### **Demo & Testing Pages**

| URL                  | Description                     | Authentication Required |
| -------------------- | ------------------------------- | ----------------------- |
| `/photo-upload-demo` | Photo upload demonstration      | ✅ Yes                  |
| `/realtime-demo`     | Real-time features demo         | ✅ Yes                  |
| `/rls-test`          | Row Level Security testing page | ✅ Yes                  |
| `/test-upload`       | Upload testing page             | ✅ Yes                  |

### **Story Customization Pages** ✨ **(Task 8 - Recently Added)**

| URL                                | Description                             | Authentication Required |
| ---------------------------------- | --------------------------------------- | ----------------------- |
| `/stories/illustration-style-demo` | Art style selector demo                 | ✅ Yes                  |
| `/stories/story-length-demo`       | Story length selector demo              | ✅ Yes                  |
| `/stories/theme-demo`              | Theme selector demo                     | ✅ Yes                  |
| `/stories/story-arc-demo`          | Story arc selector demo                 | ✅ Yes                  |
| `/stories/customization-demo`      | **Complete story customization wizard** | ✅ Yes                  |

---

## 🔌 **API Endpoints**

### **File Upload & Management**

#### **GET /api/uploaded-files**

- **Description**: Get uploaded files for current user
- **Authentication**: Required
- **Query Parameters**:
  - `upload_type` - Filter by upload type
  - `validation_type` - Filter by validation type
  - `associated_entity_type` - Filter by entity type
  - `associated_entity_id` - Filter by entity ID
  - `is_active` - Filter by active status (true/false)
  - `created_after` - Filter by creation date (after)
  - `created_before` - Filter by creation date (before)
  - `include_associations` - Include associations (true/false)
  - `statistics` - Return statistics instead of files (true/false)
- **Response**: JSON array of uploaded files or statistics

#### **PATCH /api/uploaded-files**

- **Description**: Update uploaded file metadata
- **Authentication**: Required
- **Body**: JSON object with `id` and update fields
- **Response**: Updated file object

#### **DELETE /api/uploaded-files**

- **Description**: Delete uploaded file
- **Authentication**: Required
- **Query Parameters**:
  - `id` - File ID to delete (required)
- **Response**: Success message

### **Image Processing**

#### **POST /api/images/upload**

- **Description**: Single image upload with processing
- **Authentication**: Required
- **Body**: FormData with image file
- **Response**: Upload result with processed image info

#### **GET /api/images/upload**

- **Description**: Get upload status/info
- **Authentication**: Required
- **Response**: Upload status information

#### **POST /api/images/batch-upload**

- **Description**: Batch image upload
- **Authentication**: Required
- **Body**: FormData with multiple image files
- **Response**: Batch upload results

#### **GET /api/images/batch-upload**

- **Description**: Get batch upload status
- **Authentication**: Required
- **Response**: Batch upload status information

### **UploadThing Integration**

#### **GET /api/uploadthing**

- **Description**: UploadThing file upload handler
- **Authentication**: Required
- **Response**: UploadThing configuration

#### **POST /api/uploadthing**

- **Description**: UploadThing file upload handler
- **Authentication**: Required
- **Body**: File upload data
- **Response**: Upload result

### **Placeholder API Directories** (Structured but Empty)

| Endpoint           | Description                     | Status     |
| ------------------ | ------------------------------- | ---------- |
| `/api/auth/`       | Authentication API endpoints    | 🚧 Planned |
| `/api/stories/`    | Story-related API endpoints     | 🚧 Planned |
| `/api/users/`      | User management API endpoints   | 🚧 Planned |
| `/api/components/` | Component-related API endpoints | 🚧 Planned |
| `/api/types/`      | Type definitions API endpoints  | 🚧 Planned |

---

## 🛡️ **Route Protection Rules**

### **Public Routes** (No authentication required)

The following routes are accessible without authentication:

- `/`
- `/auth/signin`
- `/auth/signup`
- `/auth/callback`
- `/auth/error`
- `/auth/reset-password`
- `/auth/update-password`
- `/auth/verify-email`
- `/api/auth/*`

### **Protected Routes** (Authentication required)

- All routes not listed as public require authentication
- Unauthenticated users are redirected to `/auth/signin`
- Authenticated users accessing auth pages are redirected to `/dashboard`

### **Middleware Features**

- **HTTPS Enforcement**: Automatic redirect to HTTPS in production
- **Security Headers**: Applied to all routes for enhanced security
- **Session Management**: Automatic user session handling
- **Smart Redirects**: Context-aware redirects based on authentication status

---

## 📁 **Directory Structure**

```
app/
├── page.tsx                    # Home page (/)
├── auth/                       # Authentication pages (/auth/*)
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   ├── callback/page.tsx
│   ├── reset-password/page.tsx
│   ├── update-password/page.tsx
│   └── verify-email/page.tsx
├── legal/                      # Legal pages (/legal/*)
│   ├── privacy/page.tsx
│   └── terms/page.tsx
├── profile/page.tsx            # Profile page (/profile)
├── stories/                    # Story customization (/stories/*)
│   ├── illustration-style-demo/page.tsx
│   ├── story-length-demo/page.tsx
│   ├── theme-demo/page.tsx
│   ├── story-arc-demo/page.tsx
│   ├── customization-demo/page.tsx
│   └── components/             # Story customization components
├── photo-upload-demo/page.tsx  # Demo pages
├── realtime-demo/page.tsx
├── rls-test/page.tsx
├── test-upload/page.tsx
├── dashboard/                  # Dashboard components (no pages yet)
├── settings/                   # Settings components (no pages yet)
└── api/                        # API endpoints (/api/*)
    ├── uploaded-files/route.ts # File management
    ├── images/                 # Image processing
    │   ├── upload/route.ts
    │   └── batch-upload/route.ts
    ├── uploadthing/route.ts    # File upload service
    └── [empty directories]     # Structured but not implemented
```

---

## 🎯 **Key Features Overview**

### **Authentication System**

- Complete sign-in/sign-up flow
- Email verification
- Password reset functionality
- OAuth callback handling
- Session management with automatic redirects

### **File Management**

- Single and batch image upload
- File metadata management
- Upload progress tracking
- File validation and processing
- Integration with UploadThing service

### **Story Customization** ✨

- Illustration style selection (Cartoon, Anime, Realistic, Watercolor)
- Story length options (Short, Medium, Long)
- Theme selection (Adventure, Fantasy, Mystery, Educational, Friendship, Animals)
- Story arc selection (6 educational narrative structures)
- Complete wizard interface with persistence and validation

### **Security & Performance**

- Route-level authentication protection
- HTTPS enforcement
- Security headers
- Row Level Security (RLS) testing
- Real-time capabilities

### **Development & Testing**

- Multiple demo pages for feature testing
- Upload testing interfaces
- Real-time feature demonstrations
- Comprehensive error handling

---

## 🚀 **Future Planned Endpoints**

Based on the directory structure, the following API endpoints are planned for future implementation:

- **Authentication API** (`/api/auth/`): User authentication, session management
- **Stories API** (`/api/stories/`): Story creation, management, and generation
- **Users API** (`/api/users/`): User profile management, preferences
- **Components API** (`/api/components/`): Dynamic component loading, customization
- **Types API** (`/api/types/`): Type definitions, schema validation

---

## 📝 **Notes**

- All protected routes require valid authentication
- API endpoints return JSON responses
- File uploads support multiple formats with validation
- Story customization system is fully functional and production-ready
- Middleware handles security, authentication, and redirects automatically
- Demo pages are available for testing all major features

---

_Last updated: Task 8 completion - Story Customization Selection Interface_
