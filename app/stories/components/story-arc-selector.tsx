'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Trophy,
  Users,
  Share2,
  Target,
  Lightbulb,
  ArrowRight,
} from 'lucide-react'

interface StoryArcProps {
  id: string
  title: string
  description: string
  structure: string
  icon: React.ElementType
  color: string
}

const storyArcs: StoryArcProps[] = [
  {
    id: 'overcoming-fear',
    title: 'Overcoming Fear',
    description:
      'A brave character faces their fears and discovers inner strength through courage and determination.',
    structure: 'Fear → Challenge → Growth → Triumph',
    icon: Trophy,
    color: 'from-red-400 to-red-600',
  },
  {
    id: 'making-friends',
    title: 'Making Friends',
    description:
      'A character learns the value of friendship through meeting new people and building connections.',
    structure: 'Loneliness → Meeting → Understanding → Friendship',
    icon: Users,
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'learning-to-share',
    title: 'Learning to Share',
    description:
      'A character discovers the joy and importance of sharing with others and being generous.',
    structure: 'Selfishness → Conflict → Realization → Sharing',
    icon: Share2,
    color: 'from-green-400 to-green-600',
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    description:
      'A character encounters a challenge and uses creativity and persistence to find a solution.',
    structure: 'Problem → Attempts → Learning → Solution',
    icon: Target,
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 'discovery-journey',
    title: 'Discovery Journey',
    description:
      'A character embarks on an adventure that leads to important discoveries about themselves or the world.',
    structure: 'Curiosity → Exploration → Discovery → Understanding',
    icon: Lightbulb,
    color: 'from-yellow-400 to-yellow-600',
  },
  {
    id: 'helping-others',
    title: 'Helping Others',
    description:
      'A character learns the importance of kindness and helping others in their community.',
    structure: 'Need → Empathy → Action → Impact',
    icon: ArrowRight,
    color: 'from-pink-400 to-pink-600',
  },
]

interface StoryArcCardProps {
  arc: StoryArcProps
  isSelected: boolean
  onClick: () => void
}

const StoryArcCard: React.FC<StoryArcCardProps> = ({
  arc,
  isSelected,
  onClick,
}) => {
  const Icon = arc.icon

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
          arc.color
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
          <div className={cn('p-3 rounded-full bg-gradient-to-br', arc.color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl">{arc.title}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 flex-grow">
          {arc.description}
        </p>

        {/* Story structure */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Story Structure:</h4>
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            {arc.structure}
          </div>
        </div>

        {/* Arc indicator */}
        <div className="mt-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Arc Type:</span>
            <span className="font-semibold">{arc.title}</span>
          </div>

          {/* Visual accent */}
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className={cn('h-2 rounded-full bg-gradient-to-r', arc.color)}
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
          arc.color
        )}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isSelected ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </Card>
  )
}

interface StoryArcSelectorProps {
  onArcSelect?: (arc: StoryArcProps) => void
}

const StoryArcSelector: React.FC<StoryArcSelectorProps> = ({ onArcSelect }) => {
  const [selectedArc, setSelectedArc] = React.useState<string | null>(null)

  const handleArcSelect = (arc: StoryArcProps) => {
    setSelectedArc(arc.id)
    if (onArcSelect) {
      onArcSelect(arc)
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
          Choose Your Story Arc
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Select the narrative structure that will guide your story. Each arc
          provides a meaningful journey with valuable lessons for children!
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AnimatePresence>
          {storyArcs.map((arc, index) => (
            <motion.div
              key={arc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <StoryArcCard
                arc={arc}
                isSelected={selectedArc === arc.id}
                onClick={() => handleArcSelect(arc)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {selectedArc && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-lg font-medium text-primary">
            You selected: {storyArcs.find(a => a.id === selectedArc)?.title}
          </p>
          <p className="text-muted-foreground">
            Your story will follow the{' '}
            {storyArcs.find(a => a.id === selectedArc)?.title.toLowerCase()}{' '}
            narrative structure!
          </p>
        </motion.div>
      )}
    </div>
  )
}

export { StoryArcSelector, type StoryArcProps }
