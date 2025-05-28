# Components

This directory contains all React components organized by purpose and functionality.

## Structure

- **`ui/`** - Reusable UI components (buttons, inputs, modals, etc.)
- **`layout/`** - Layout components (header, footer, sidebar, navigation)
- **`forms/`** - Form components and form-related utilities
- **`features/`** - Feature-specific components (story generator, character creator, etc.)

## Usage

Import components using the barrel exports:

```typescript
import { Button, Modal } from '@/components/ui'
import { Header, Footer } from '@/components/layout'
import { LoginForm } from '@/components/forms'
import { StoryGenerator } from '@/components/features'
```

## Guidelines

- Keep components small and focused on a single responsibility
- Use TypeScript for all components
- Include proper prop types and documentation
- Follow the established naming conventions
- Add tests for complex components in `__tests__/components/`
