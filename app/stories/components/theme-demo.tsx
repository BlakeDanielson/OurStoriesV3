'use client'

import { ThemeSelector, type ThemeProps } from './theme-selector'

export default function ThemeDemo() {
  const handleThemeSelect = (theme: ThemeProps) => {
    console.log('Selected theme:', theme)
  }

  return <ThemeSelector onThemeSelect={handleThemeSelect} />
}
