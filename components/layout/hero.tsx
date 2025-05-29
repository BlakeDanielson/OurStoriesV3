'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Sparkles,
  Heart,
  Star,
  ArrowRight,
  Play,
  Users,
  Award,
  Zap,
} from 'lucide-react'

interface HeroProps {
  className?: string
}

export function Hero({ className = '' }: HeroProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const handleVideoPlay = () => {
    setIsVideoPlaying(true)
    // In a real implementation, this would trigger video playback
  }

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${className}`}
      aria-labelledby="hero-heading"
      role="banner"
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"
        aria-hidden="true"
      />

      {/* Floating Elements - Hidden from screen readers */}
      <div
        className="absolute top-20 left-10 animate-float motion-reduce:animate-none"
        aria-hidden="true"
      >
        <div className="w-16 h-16 bg-yellow-200 rounded-full opacity-20" />
      </div>
      <div
        className="absolute top-40 right-20 animate-float-delayed motion-reduce:animate-none"
        aria-hidden="true"
      >
        <div className="w-12 h-12 bg-pink-200 rounded-full opacity-20" />
      </div>
      <div
        className="absolute bottom-20 left-20 animate-float motion-reduce:animate-none"
        aria-hidden="true"
      >
        <div className="w-20 h-20 bg-blue-200 rounded-full opacity-20" />
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Trust Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 border-green-200 w-fit"
                role="img"
                aria-label="Trusted by 10,000+ families"
              >
                <Award className="w-3 h-3 mr-1" aria-hidden="true" />
                Trusted by 10,000+ families
              </Badge>
              <div
                className="flex items-center gap-1"
                role="img"
                aria-label="4.9 out of 5 stars rating"
              >
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    aria-hidden="true"
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">4.9/5</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1
                id="hero-heading"
                className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight"
              >
                Your Child is the
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {' '}
                  Hero{' '}
                </span>
                of Every Story
              </h1>

              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                Create magical, AI-powered storybooks where your child becomes
                the main character. Personalized adventures that spark
                imagination and build confidence.
              </p>
            </div>

            {/* Value Propositions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Zap
                  className="w-5 h-5 text-blue-500 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>AI-Generated in Minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Heart
                  className="w-5 h-5 text-red-500 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Uniquely Personalized</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <BookOpen
                  className="w-5 h-5 text-green-500 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Print & Digital Ready</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                asChild
              >
                <Link href="/auth/signup">
                  <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                  Create Your First Book
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                onClick={handleVideoPlay}
                aria-label="Watch demo video"
              >
                <Play className="w-5 h-5 mr-2" aria-hidden="true" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" aria-hidden="true" />
                <span className="text-sm text-gray-600">
                  Join 10,000+ happy families
                </span>
              </div>
              <div className="text-sm text-gray-500">
                No subscription required • Free first book
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Hero Image/Video Container */}
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              {!isVideoPlaying ? (
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
                  {/* Placeholder for hero image/video */}
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                      <BookOpen
                        className="w-12 h-12 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-gray-600 font-medium">
                      See Your Child's Story Come to Life
                    </p>
                  </div>

                  {/* Play Button Overlay */}
                  <button
                    onClick={handleVideoPlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Play demo video"
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play
                        className="w-8 h-8 text-blue-600 ml-1"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-900 flex items-center justify-center">
                  <p className="text-white">Video would play here</p>
                </div>
              )}
            </div>

            {/* Floating Feature Cards */}
            <Card
              className="absolute -top-4 -left-4 p-4 bg-white shadow-lg border-0 hidden lg:block"
              aria-hidden="true"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">AI-Powered</p>
                  <p className="text-xs text-gray-600">Smart personalization</p>
                </div>
              </div>
            </Card>

            <Card
              className="absolute -bottom-4 -right-4 p-4 bg-white shadow-lg border-0 hidden lg:block"
              aria-hidden="true"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Made with Love</p>
                  <p className="text-xs text-gray-600">For your little one</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
