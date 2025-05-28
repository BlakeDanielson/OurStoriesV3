# Project Structure

This document outlines the folder structure and organization of the ourStories project.

## Root Directory

```
ourStories/
├── app/                    # Next.js 14 App Router
├── components/             # Reusable React components
├── lib/                    # Shared utilities and helpers
├── public/                 # Static assets
├── styles/                 # CSS and styling files
├── __tests__/              # Test files
├── docs/                   # Project documentation
├── scripts/                # Build and utility scripts
├── tasks/                  # TaskMaster project management
└── ...config files
```

## App Directory (Next.js 14 App Router)

```
app/
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints
│   ├── stories/           # Story management
│   ├── users/             # User management
│   └── images/            # Image generation
├── auth/                  # Authentication pages
├── dashboard/             # User dashboard
├── stories/               # Story pages
├── profile/               # User profile
├── settings/              # App settings
├── layout.tsx             # Root layout
├── page.tsx               # Home page
└── globals.css            # Global styles
```

## Components Directory

```
components/
├── ui/                    # Basic UI components
├── layout/                # Layout components
├── forms/                 # Form components
├── features/              # Feature-specific components
└── index.ts               # Barrel exports
```

## Lib Directory

```
lib/
├── utils/                 # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
├── constants/             # App constants
├── validations/           # Schema validation
└── index.ts               # Barrel exports
```

## Public Directory

```
public/
├── images/                # Image assets
├── icons/                 # Icon files
└── fonts/                 # Font files
```

## Testing Structure

```
__tests__/
├── components/            # Component tests
├── lib/                   # Utility tests
└── app/                   # Page/API tests
```

## Documentation

```
docs/
├── api/                   # API documentation
├── deployment/            # Deployment guides
└── development/           # Development guides
```

## Import Conventions

Use path aliases for clean imports:

```typescript
// Components
import { Button } from '@/components/ui'
import { Header } from '@/components/layout'

// Utilities
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks'

// Types
import type { User } from '@/lib/types'
```

## Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types**: PascalCase (`UserProfile`)

## Best Practices

1. **Colocation**: Keep related files close together
2. **Barrel Exports**: Use index.ts files for clean imports
3. **Feature Folders**: Group by feature, not by file type
4. **Consistent Naming**: Follow established conventions
5. **Documentation**: Document complex structures and decisions
