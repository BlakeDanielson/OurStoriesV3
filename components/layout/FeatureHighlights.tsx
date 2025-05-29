'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Book, Palette, Sparkles, Heart, Lightbulb, Star } from 'lucide-react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

const FeatureCard = ({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) => {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-2 border-border transition-all duration-300 hover:border-primary/50 hover:shadow-md focus-within:border-primary/50 focus-within:shadow-md',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div
          className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <AnimatedSparkles />
    </Card>
  )
}

const AnimatedSparkles = () => (
  <div
    className="absolute -right-4 -top-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
    aria-hidden="true"
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-24 w-24"
    >
      <Sparkles />
    </motion.div>
  </div>
)

const SparklesAnimation = () => {
  const randomMove = () => Math.random() * 2 - 1
  const randomOpacity = () => Math.random()
  const random = () => Math.random()

  return (
    <div className="absolute inset-0 motion-reduce:hidden" aria-hidden="true">
      {[...Array(8)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 2 + 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            borderRadius: '50%',
            zIndex: 1,
          }}
          className="inline-block bg-primary"
        />
      ))}
    </div>
  )
}

interface FeatureHighlightsProps {
  title?: string
  description?: string
  className?: string
}

export const FeatureHighlights = ({
  title = 'Create Magical Stories for Your Little Ones',
  description = 'Our AI-powered platform helps parents create personalized storybooks that make your child the hero of their own adventure.',
  className,
}: FeatureHighlightsProps) => {
  const features: FeatureCardProps[] = [
    {
      icon: <Star className="h-6 w-6" />,
      title: 'Your Child as the Hero',
      description:
        'Make your child the star of their own adventure with personalized stories featuring their name, appearance, and favorite things.',
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: 'Beautiful Custom Illustrations',
      description:
        "Our AI creates charming, child-friendly illustrations that bring your child's story to life with vibrant colors and engaging scenes.",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Easy 3-Step Process',
      description:
        'Create a magical storybook in minutes with our simple process: customize your character, choose a theme, and preview your story.',
    },
    {
      icon: <Book className="h-6 w-6" />,
      title: 'High-Quality Print Books',
      description:
        'Receive beautifully printed hardcover books delivered to your door, made with premium materials to last for generations.',
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: 'Educational & Fun',
      description:
        'Stories that entertain while teaching important values, building vocabulary, and fostering a lifelong love of reading.',
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Treasured Family Memories',
      description:
        'Create special bonding moments during storytime and preserve precious memories in a keepsake your family will cherish forever.',
    },
  ]

  return (
    <section
      className={cn('bg-background py-16 md:py-24', className)}
      aria-labelledby="features-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2
            id="features-heading"
            className="mb-4 text-3xl font-bold text-foreground md:text-4xl"
          >
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                reduce: { duration: 0.1, delay: 0 },
              }}
              viewport={{ once: true }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                className="h-full"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
