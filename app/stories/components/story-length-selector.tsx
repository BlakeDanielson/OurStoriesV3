'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BookOpen, Clock, FileText } from 'lucide-react'

interface StoryLengthProps {
  id: string
  title: string
  description: string
  pages: number
  readingTime: string
  icon: React.ElementType
  color: string
}

const storyLengths: StoryLengthProps[] = [
  {
    id: 'short',
    title: 'Short Story',
    description: 'Perfect for bedtime reading or quick story time sessions.',
    pages: 10,
    readingTime: '5-8 minutes',
    icon: FileText,
    color: 'from-green-400 to-green-600',
  },
  {
    id: 'medium',
    title: 'Medium Story',
    description: 'Great for engaging story sessions with more adventure.',
    pages: 20,
    readingTime: '10-15 minutes',
    icon: BookOpen,
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'long',
    title: 'Long Story',
    description: 'Extended adventures for dedicated reading time.',
    pages: 30,
    readingTime: '15-25 minutes',
    icon: Clock,
    color: 'from-purple-400 to-purple-600',
  },
]

interface StoryLengthCardProps {
  length: StoryLengthProps
  isSelected: boolean
  onClick: () => void
}

const StoryLengthCard: React.FC<StoryLengthCardProps> = ({
  length,
  isSelected,
  onClick,
}) => {
  const Icon = length.icon

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
          length.color
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
            className={cn('p-3 rounded-full bg-gradient-to-br', length.color)}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl">{length.title}</h3>
            <p className="text-sm text-muted-foreground">
              ~{length.pages} pages
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6 flex-grow">
          {length.description}
        </p>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pages:</span>
            <span className="font-semibold">{length.pages}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reading time:</span>
            <span className="font-semibold">{length.readingTime}</span>
          </div>
        </div>

        {/* Progress bar visual */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Story length</span>
            <span>{length.pages} pages</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className={cn('h-2 rounded-full bg-gradient-to-r', length.color)}
              initial={{ width: 0 }}
              animate={{ width: `${(length.pages / 30) * 100}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
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
          length.color
        )}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isSelected ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </Card>
  )
}

interface StoryLengthSelectorProps {
  onLengthSelect?: (length: StoryLengthProps) => void
}

const StoryLengthSelector: React.FC<StoryLengthSelectorProps> = ({
  onLengthSelect,
}) => {
  const [selectedLength, setSelectedLength] = React.useState<string | null>(
    null
  )

  const handleLengthSelect = (length: StoryLengthProps) => {
    setSelectedLength(length.id)
    if (onLengthSelect) {
      onLengthSelect(length)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <motion.h2
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Choose Story Length
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Select the perfect length for your story. Consider your child's
          attention span and available reading time.
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AnimatePresence>
          {storyLengths.map((length, index) => (
            <motion.div
              key={length.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <StoryLengthCard
                length={length}
                isSelected={selectedLength === length.id}
                onClick={() => handleLengthSelect(length)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {selectedLength && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-lg font-medium text-primary">
            You selected:{' '}
            {storyLengths.find(l => l.id === selectedLength)?.title}
          </p>
          <p className="text-muted-foreground">
            Perfect for{' '}
            {storyLengths.find(l => l.id === selectedLength)?.readingTime} of
            reading time!
          </p>
        </motion.div>
      )}
    </div>
  )
}

export { StoryLengthSelector, type StoryLengthProps }
