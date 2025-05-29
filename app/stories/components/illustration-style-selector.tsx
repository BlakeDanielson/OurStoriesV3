'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Palette, Brush, Sparkles, Image as ImageIcon } from 'lucide-react'

interface ArtStyleProps {
  id: string
  title: string
  description: string
  image: string
  icon: React.ElementType
}

const artStyles: ArtStyleProps[] = [
  {
    id: 'cartoon',
    title: 'Cartoon',
    description:
      'Colorful and fun cartoon style with exaggerated features perfect for younger children.',
    image:
      'https://images.unsplash.com/photo-1569317002804-ab77bcf1bce4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: Palette,
  },
  {
    id: 'anime',
    title: 'Anime',
    description:
      'Japanese-inspired animation style with distinctive characters and vibrant scenes.',
    image:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: Brush,
  },
  {
    id: 'realistic',
    title: 'Realistic',
    description:
      'Detailed and lifelike illustrations that capture the real world with accuracy.',
    image:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: ImageIcon,
  },
  {
    id: 'watercolor',
    title: 'Watercolor',
    description:
      'Soft, dreamy watercolor illustrations with gentle colors and flowing textures.',
    image:
      'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    icon: Sparkles,
  },
]

interface ArtStyleCardProps {
  style: ArtStyleProps
  isSelected: boolean
  onClick: () => void
}

const ArtStyleCard: React.FC<ArtStyleCardProps> = ({
  style,
  isSelected,
  onClick,
}) => {
  const Icon = style.icon

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 cursor-pointer group',
        'border-2',
        isSelected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 to-transparent opacity-70" />

      <div className="absolute top-3 right-3 z-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: isSelected ? 1 : 0 }}
          className="bg-primary text-primary-foreground rounded-full p-1"
        >
          <Icon className="h-4 w-4" />
        </motion.div>
      </div>

      <div className="relative h-40 overflow-hidden">
        <img
          src={style.image}
          alt={style.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <CardContent className="relative z-20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-lg">{style.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{style.description}</p>
      </CardContent>

      <motion.div
        className="absolute inset-0 border-4 border-primary rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSelected ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        className="absolute -bottom-1 left-0 right-0 h-1 bg-primary"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isSelected ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </Card>
  )
}

interface ArtStyleSelectorProps {
  onStyleSelect?: (style: ArtStyleProps) => void
}

const ArtStyleSelector: React.FC<ArtStyleSelectorProps> = ({
  onStyleSelect,
}) => {
  const [selectedStyle, setSelectedStyle] = React.useState<string | null>(null)

  const handleStyleSelect = (style: ArtStyleProps) => {
    setSelectedStyle(style.id)
    if (onStyleSelect) {
      onStyleSelect(style)
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
          Choose Your Story Style
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Select the perfect illustration style for your children's story. Each
          style creates a unique visual experience!
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <AnimatePresence>
          {artStyles.map((style, index) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <ArtStyleCard
                style={style}
                isSelected={selectedStyle === style.id}
                onClick={() => handleStyleSelect(style)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {selectedStyle && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-lg font-medium text-primary">
            You selected: {artStyles.find(s => s.id === selectedStyle)?.title}
          </p>
          <p className="text-muted-foreground">
            Your story will be illustrated in this beautiful style!
          </p>
        </motion.div>
      )}
    </div>
  )
}

export { ArtStyleSelector, type ArtStyleProps }
