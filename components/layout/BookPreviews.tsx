'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Star } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface BookData {
  id: string
  title: string
  excerpt: string
  coverImage: string
  author: string
  ageRange: string
  theme: 'space' | 'underwater' | 'fairytale' | 'dinosaur' | 'superhero'
}

interface BookPreviewSectionProps {
  heading?: string
  subheading?: string
  books?: BookData[]
}

export const BookPreviews = ({
  heading = 'Magical Adventures for Young Minds',
  subheading = 'AI-powered stories featuring diverse characters in exciting worlds',
  books = [
    {
      id: 'book-1',
      title: "Zara's Space Adventure",
      excerpt:
        'Join Zara as she discovers a mysterious spaceship in her backyard and embarks on an interstellar journey to save a distant planet.',
      coverImage:
        'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=1974&auto=format&fit=crop',
      author: 'Maya Johnson',
      ageRange: '4-6',
      theme: 'space',
    },
    {
      id: 'book-2',
      title: 'Amir Under the Sea',
      excerpt:
        'Dive into an underwater world with Amir as he befriends colorful sea creatures and helps clean up ocean pollution.',
      coverImage:
        'https://images.unsplash.com/photo-1527484885616-7f73af7fade2?q=80&w=1974&auto=format&fit=crop',
      author: 'David Chen',
      ageRange: '3-5',
      theme: 'underwater',
    },
    {
      id: 'book-3',
      title: "Princess Nia's Dragon Friend",
      excerpt:
        "Princess Nia isn't like other princesses. She'd rather explore the enchanted forest than attend royal balls, and that's how she meets her new dragon friend.",
      coverImage:
        'https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?q=80&w=1974&auto=format&fit=crop',
      author: 'Elena Rodriguez',
      ageRange: '5-8',
      theme: 'fairytale',
    },
    {
      id: 'book-4',
      title: 'Dinosaur Park Discovery',
      excerpt:
        "When Jamal finds a mysterious glowing rock at the museum, he's transported back in time to when dinosaurs roamed the Earth!",
      coverImage:
        'https://images.unsplash.com/photo-1516641051054-9df6a1aad654?q=80&w=1974&auto=format&fit=crop',
      author: 'Marcus Williams',
      ageRange: '4-7',
      theme: 'dinosaur',
    },
    {
      id: 'book-5',
      title: 'Super Leila Saves the Day',
      excerpt:
        'Leila discovers she has the power to talk to animals, and uses her new abilities to help her neighborhood friends solve problems.',
      coverImage:
        'https://images.unsplash.com/photo-1531251445707-1f000e1e87d0?q=80&w=1974&auto=format&fit=crop',
      author: 'Sophia Patel',
      ageRange: '3-6',
      theme: 'superhero',
    },
    {
      id: 'book-6',
      title: 'The Magical Science Fair',
      excerpt:
        "When Kai's science project comes to life, he and his friends must use their knowledge and creativity to save their school from magical chaos.",
      coverImage:
        'https://images.unsplash.com/photo-1629196914168-3a2652305f9f?q=80&w=1974&auto=format&fit=crop',
      author: 'James Wilson',
      ageRange: '6-8',
      theme: 'fairytale',
    },
  ],
}: BookPreviewSectionProps) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const updateScrollButtons = () => {
      setCanScrollPrev(carouselApi.canScrollPrev())
      setCanScrollNext(carouselApi.canScrollNext())
      setCurrentSlide(carouselApi.selectedScrollSnap())
    }

    updateScrollButtons()
    carouselApi.on('select', updateScrollButtons)

    return () => {
      carouselApi.off('select', updateScrollButtons)
    }
  }, [carouselApi])

  const getThemeColor = (theme: BookData['theme']) => {
    switch (theme) {
      case 'space':
        return 'bg-indigo-100 text-indigo-800'
      case 'underwater':
        return 'bg-blue-100 text-blue-800'
      case 'fairytale':
        return 'bg-purple-100 text-purple-800'
      case 'dinosaur':
        return 'bg-green-100 text-green-800'
      case 'superhero':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <section
      className="py-12 md:py-20 bg-background"
      aria-labelledby="book-previews-heading"
    >
      <div className="container px-4 md:px-6">
        <div className="mb-10 text-center">
          <h2
            id="book-previews-heading"
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
          >
            {heading}
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            {subheading}
          </p>
        </div>

        <div className="relative">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: 'start',
              loop: false,
            }}
            className="w-full"
            aria-label={`Book previews carousel, showing ${books.length} books. Currently showing slide ${currentSlide + 1} of ${books.length}`}
          >
            <CarouselContent className="-ml-4">
              {books.map((book, index) => (
                <CarouselItem
                  key={book.id}
                  className="pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      reduce: { duration: 0.1 },
                    }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-lg focus-within:border-primary focus-within:shadow-lg">
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                        <img
                          src={book.coverImage}
                          alt={`Book cover for "${book.title}" by ${book.author}, a ${book.theme} story for ages ${book.ageRange}`}
                          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                          loading={index < 3 ? 'eager' : 'lazy'}
                        />
                        <Badge
                          className={`absolute top-3 right-3 ${getThemeColor(book.theme)}`}
                          aria-label={`Recommended for ages ${book.ageRange}`}
                        >
                          Ages {book.ageRange}
                        </Badge>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold leading-tight text-foreground">
                            {book.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            By {book.author}
                          </p>
                          <p className="text-sm line-clamp-3 text-foreground/80 mt-2">
                            {book.excerpt}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-0 flex justify-between items-center">
                        <div
                          className="flex items-center text-amber-500"
                          role="img"
                          aria-label="4 out of 5 stars rating"
                        >
                          <Star
                            className="w-4 h-4 fill-current"
                            aria-hidden="true"
                          />
                          <Star
                            className="w-4 h-4 fill-current"
                            aria-hidden="true"
                          />
                          <Star
                            className="w-4 h-4 fill-current"
                            aria-hidden="true"
                          />
                          <Star
                            className="w-4 h-4 fill-current"
                            aria-hidden="true"
                          />
                          <Star className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <Button
                          className="rounded-full gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          aria-label={`Preview story: ${book.title}`}
                        >
                          <BookOpen className="w-4 h-4" aria-hidden="true" />
                          Preview Story
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="flex justify-center mt-8 gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={!canScrollPrev}
              onClick={() => carouselApi?.scrollPrev()}
              aria-label="Previous books"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={!canScrollNext}
              onClick={() => carouselApi?.scrollNext()}
              aria-label="Next books"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Slide indicators for screen readers */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Showing slide {currentSlide + 1} of {books.length}
          </div>
        </div>
      </div>
    </section>
  )
}
