# Lib

This directory contains shared utilities, hooks, types, and other reusable code.

## Structure

- **`utils/`** - Utility functions and helpers
- **`hooks/`** - Custom React hooks
- **`types/`** - TypeScript type definitions
- **`constants/`** - Application constants and configuration
- **`validations/`** - Schema validation using Zod or similar

## Usage

Import utilities using the barrel exports:

```typescript
import { cn, formatDate } from '@/lib/utils'
import { useAuth, useLocalStorage } from '@/lib/hooks'
import type { User, Story } from '@/lib/types'
import { API_ENDPOINTS } from '@/lib/constants'
import { userSchema } from '@/lib/validations'
```

## Guidelines

- Keep utilities pure and testable
- Use TypeScript for all code
- Document complex functions with JSDoc
- Add tests for utility functions in `__tests__/lib/`
- Follow functional programming principles where possible
