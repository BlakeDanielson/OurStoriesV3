'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestimonialData {
  id: string
  name: string
  role: string
  avatar: string
  rating: number
  testimonial: string
}

interface TestimonialsSectionProps {
  heading?: string
  subheading?: string
  testimonials?: TestimonialData[]
}

const TestimonialCard = ({ testimonial }: { testimonial: TestimonialData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        reduce: { duration: 0.1 },
      }}
      viewport={{ once: true }}
      whileHover={{
        y: -8,
        transition: { duration: 0.2 },
      }}
      className="h-full motion-reduce:transform-none"
    >
      <Card className="h-full bg-card border border-border hover:shadow-lg transition-all duration-300 hover:border-primary/20 focus-within:border-primary/50 focus-within:shadow-lg">
        <CardContent className="p-6">
          {/* Star Rating */}
          <div
            className="flex items-center mb-4"
            role="img"
            aria-label={`${testimonial.rating} out of 5 stars rating`}
          >
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < testimonial.rating
                    ? 'text-amber-400 fill-current'
                    : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Testimonial Text */}
          <blockquote className="text-foreground/90 mb-6 leading-relaxed">
            "{testimonial.testimonial}"
          </blockquote>

          {/* Author Info */}
          <div className="flex items-center">
            <img
              src={testimonial.avatar}
              alt={`${testimonial.name}, ${testimonial.role}`}
              className="w-12 h-12 rounded-full object-cover mr-4"
              loading="lazy"
            />
            <div>
              <div className="font-semibold text-foreground">
                {testimonial.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {testimonial.role}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const TrustBadge = ({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className?: string
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        reduce: { duration: 0.1 },
      }}
      viewport={{ once: true }}
      className={cn(
        'text-center p-6 border border-border rounded-lg bg-card/50 motion-reduce:transform-none',
        className
      )}
    >
      <div
        className="text-3xl font-bold text-foreground mb-2"
        aria-label={`${value} ${label}`}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  )
}

export const TestimonialsSection = ({
  heading = 'Families Love Our Stories',
  subheading = 'See how our personalized bedtime stories are creating magical moments for families everywhere',
  testimonials = [
    {
      id: '1',
      name: 'Emily Johnson',
      role: 'Mother of two',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3',
      rating: 5,
      testimonial:
        "My children can't wait for bedtime now! They love being the heroes in their own personalized adventures. It's created such special bonding moments for our family.",
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      role: 'Father of three',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3',
      rating: 5,
      testimonial:
        'These stories have transformed our bedtime routine from a struggle to the highlight of our day. My kids are learning important values while having fun!',
    },
    {
      id: '3',
      name: 'Sarah Thompson',
      role: 'Mother of one',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3',
      rating: 5,
      testimonial:
        'My daughter lights up when she hears her name in the stories. The quality of the writing and illustrations is exceptional - worth every penny!',
    },
    {
      id: '4',
      name: 'David Chen',
      role: 'Father of twins',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3',
      rating: 5,
      testimonial:
        'As a busy parent, I appreciate how easy it is to create personalized stories. My twins ask for them every night and the shared experience has brought us closer.',
    },
    {
      id: '5',
      name: 'Lisa Williams',
      role: 'Mother of three',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3',
      rating: 5,
      testimonial:
        'The stories are not only entertaining but educational too. My children are developing a love for reading that I know will benefit them for life.',
    },
    {
      id: '6',
      name: 'Robert Taylor',
      role: 'Grandfather',
      avatar:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3',
      rating: 5,
      testimonial:
        "Even though I live far away, I can send personalized stories to my grandchildren. They tell me it's like I'm right there reading to them. Absolutely magical!",
    },
  ],
}: TestimonialsSectionProps) => {
  return (
    <section
      className="py-16 md:py-24 bg-muted/30"
      aria-labelledby="testimonials-heading"
    >
      <div className="container px-4 md:px-6">
        {/* Header */}
        <header className="text-center mb-16">
          <motion.h2
            id="testimonials-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              reduce: { duration: 0.1 },
            }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl mb-4"
          >
            {heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              reduce: { duration: 0.1, delay: 0 },
            }}
            viewport={{ once: true }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            {subheading}
          </motion.p>
        </header>

        {/* Trust Badges */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto"
          role="region"
          aria-label="Trust indicators and statistics"
        >
          <TrustBadge value="10,000+" label="Happy Families" />
          <TrustBadge value="4.9/5" label="Stars" />
          <TrustBadge value="Parents Magazine" label="Featured In" />
        </div>

        {/* Testimonials Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="region"
          aria-label="Customer testimonials"
        >
          {testimonials.map(testimonial => (
            <article key={testimonial.id}>
              <TestimonialCard testimonial={testimonial} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
