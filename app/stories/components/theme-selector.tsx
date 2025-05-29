'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Compass,
  Sparkles,
  Search,
  GraduationCap,
  Heart,
  PawPrint,
} from 'lucide-react'

interface ThemeProps {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
}

const storyThemes: ThemeProps[] = [
  {
    id: 'adventure',
    title: 'Adventure',
    description:
      'Exciting journeys and daring quests filled with exploration and discovery.',
    icon: Compass,
    color: 'from-orange-400 to-orange-600',
  },
  {
    id: 'fantasy',
    title: 'Fantasy',
    description:
      'Magical worlds with enchanted creatures, spells, and mystical adventures.',
    icon: Sparkles,
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 'mystery',
    title: 'Mystery',
    description:
      'Puzzling stories with clues to solve, secrets to uncover, and mysteries to explore.',
    icon: Search,
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'educational',
    title: 'Educational',
    description:
      'Fun learning adventures that teach valuable lessons and important skills.',
    icon: GraduationCap,
    color: 'from-green-400 to-green-600',
  },
  {
    id: 'friendship',
    title: 'Friendship',
    description:
      'Heartwarming tales about making friends, kindness, and working together.',
    icon: Heart,
    color: 'from-pink-400 to-pink-600',
  },
  {
    id: 'animals',
    title: 'Animals',
    description:
      'Stories featuring adorable animal characters and their exciting adventures.',
    icon: PawPrint,
    color: 'from-amber-400 to-amber-600',
  },
]

interface ThemeCardProps {
  theme: ThemeProps
  isSelected: boolean
  onClick: () => void
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isSelected,
  onClick,
}) => {
  const Icon = theme.icon

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 cursor-pointer group',
        'border-2 h-full',
        isSelected
          ? 'border-primary ring-2 ring-primary/30 shadow-lg'
          : 'border-border hover:border-primary/50 hover:shadow-md'
      )}
      onClick={onClick}
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-10',
          theme.color
        )}
      />

      {/* Selection indicator */}
      <div className="absolute top-3 right-3 z-20">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: isSelected ? 1 : 0,
            rotate: isSelected ? 0 : -180,
          }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          className="bg-primary text-primary-foreground rounded-full p-2"
        >
          <Icon className="h-4 w-4" />
        </motion.div>
      </div>

      <CardContent className="relative z-10 p-6 h-full flex flex-col">
        {/* Icon and title */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn('p-3 rounded-full bg-gradient-to-br', theme.color)}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl">{theme.title}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 flex-grow">
          {theme.description}
        </p>

        {/* Theme indicator */}
        <div className="mt-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Theme:</span>
            <span className="font-semibold">{theme.title}</span>
          </div>

          {/* Visual accent */}
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className={cn('h-2 rounded-full bg-gradient-to-r', theme.color)}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Selection border animation */}
      <motion.div
        className="absolute inset-0 border-4 border-primary rounded-lg pointer-events-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: isSelected ? 1 : 0,
          scale: isSelected ? 1 : 0.95,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Bottom accent line */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r',
          theme.color
        )}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isSelected ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </Card>
  )
}

interface ThemeSelectorProps {
  onThemeSelect?: (theme: ThemeProps) => void
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onThemeSelect }) => {
  const [selectedTheme, setSelectedTheme] = React.useState<string | null>(null)

  const handleThemeSelect = (theme: ThemeProps) => {
    setSelectedTheme(theme.id)
    if (onThemeSelect) {
      onThemeSelect(theme)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <motion.h2
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Choose Your Story Theme
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Select the perfect theme for your children's story. Each theme creates
          a unique adventure and learning experience!
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AnimatePresence>
          {storyThemes.map((theme, index) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <ThemeCard
                theme={theme}
                isSelected={selectedTheme === theme.id}
                onClick={() => handleThemeSelect(theme)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {selectedTheme && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-lg font-medium text-primary">
            You selected: {storyThemes.find(t => t.id === selectedTheme)?.title}
          </p>
          <p className="text-muted-foreground">
            Your story will be filled with{' '}
            {storyThemes.find(t => t.id === selectedTheme)?.title.toLowerCase()}{' '}
            elements!
          </p>
        </motion.div>
      )}
    </div>
  )
}

export { ThemeSelector, type ThemeProps }
