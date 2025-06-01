'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check, Star, Sparkles, Book, Users, Crown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface PayPerBookOption {
  name: string
  price: string
  description: string
  features: string[]
  buttonText: string
  isPopular?: boolean
}

interface PricingProps {
  payPerBookOptions?: PayPerBookOption[]
  title?: string
  description?: string
}

export const PricingSection = ({
  payPerBookOptions = [
    {
      name: 'Digital Book',
      price: '$1.99',
      description: 'Perfect for trying out our service',
      features: [
        'One personalized digital book',
        'High-quality AI illustrations',
        'PDF download for reading',
        'Mobile-friendly format',
        'Basic customization options',
      ],
      buttonText: 'Create Digital Book',
    },
    {
      name: 'Printable PDF',
      price: '$4.99',
      description: 'Print at home on your own printer',
      features: [
        'One personalized printable book',
        'High-resolution PDF (300 DPI)',
        'Optimized for home printing',
        'Digital copy included',
        'Print unlimited copies',
      ],
      buttonText: 'Get Printable PDF',
      isPopular: true,
    },
    {
      name: 'Professional Print',
      price: '$49.99',
      description: 'Beautiful hardcover book delivered to your door',
      features: [
        'One personalized hardcover book',
        'Premium paper quality',
        'Professional binding & finish',
        'Free shipping included',
        'Digital + printable PDF included',
      ],
      buttonText: 'Order Print Book',
    },
  ],
  title = 'Simple, Transparent Pricing',
  description = 'Create magical personalized books for your children - pay per book or subscribe for unlimited creativity',
}: PricingProps) => {
  const [isMonthly, setIsMonthly] = useState(true)

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked)
  }

  return (
    <section
      className="py-16 md:py-24 bg-background"
      aria-labelledby="pricing-heading"
    >
      <div className="container px-4 md:px-6">
        <header className="text-center space-y-6 mb-12">
          <motion.h2
            id="pricing-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              reduce: { duration: 0.1 },
            }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
          >
            {title}
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
            className="text-muted-foreground text-xl max-w-3xl mx-auto"
          >
            {description}
          </motion.p>
        </header>

        {/* Pay Per Book Options - Primary */}
        <div className="space-y-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Pay Per Book</h3>
            <p className="text-muted-foreground">
              Perfect for occasional storytelling
            </p>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            role="region"
            aria-label="Pay per book options"
          >
            {payPerBookOptions.map((option, index) => (
              <motion.article
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: 'easeOut',
                  reduce: { duration: 0.1, delay: 0 },
                }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.02,
                  boxShadow:
                    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  transition: { duration: 0.2 },
                }}
                className="flex motion-reduce:transform-none"
              >
                <Card
                  className={cn(
                    'relative flex flex-col overflow-hidden rounded-2xl border-2 w-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    option.isPopular
                      ? 'border-green-500 shadow-lg'
                      : 'border-border'
                  )}
                >
                  {option.isPopular && (
                    <div
                      className="absolute top-0 right-0 bg-green-500 py-1 px-3 rounded-bl-xl rounded-tr-xl flex items-center"
                      role="img"
                      aria-label="Most popular option"
                    >
                      <Crown
                        className="text-white h-4 w-4 mr-1 fill-current"
                        aria-hidden="true"
                      />
                      <span className="text-white text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h4
                        className="text-xl font-bold"
                        id={`option-${index}-title`}
                      >
                        {option.name}
                      </h4>
                      <span className="text-3xl font-bold text-primary">
                        {option.price}
                      </span>
                    </div>

                    <p className="text-muted-foreground mb-6 flex-1">
                      {option.description}
                    </p>

                    <ul
                      className="space-y-3 mb-8"
                      role="list"
                      aria-labelledby={`option-${index}-title`}
                    >
                      {option.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check
                            className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={cn(
                        'w-full mt-auto focus:outline-none focus:ring-2 focus:ring-ring focus-ring-offset-2',
                        option.isPopular
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-primary hover:bg-primary/90'
                      )}
                      size="lg"
                    >
                      {option.buttonText}
                    </Button>
                  </div>
                </Card>
              </motion.article>
            ))}
          </div>
        </div>

        {/* Pro Subscription - Secondary */}
        <div className="mt-20 space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">
              For Frequent Storytellers
            </h3>
            <p className="text-muted-foreground">
              Unlimited books with premium features
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <motion.article
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
                reduce: { duration: 0.1 },
              }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.02,
                boxShadow:
                  '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                transition: { duration: 0.2 },
              }}
              className="flex motion-reduce:transform-none"
            >
              <Card className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-purple-500 shadow-lg w-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div
                  className="absolute inset-0 opacity-5 bg-gradient-to-r from-purple-500 to-indigo-600"
                  aria-hidden="true"
                />

                <div
                  className="absolute top-0 right-0 bg-purple-500 py-1 px-3 rounded-bl-xl rounded-tr-xl flex items-center"
                  role="img"
                  aria-label="Pro subscription plan"
                >
                  <Zap
                    className="text-white h-4 w-4 mr-1 fill-current"
                    aria-hidden="true"
                  />
                  <span className="text-white text-sm font-semibold">
                    Pro Plan
                  </span>
                </div>

                <div className="p-8 flex-1 flex flex-col z-10">
                  <div className="flex items-center mb-6">
                    <div
                      className="w-12 h-12 rounded-full mr-4 flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600"
                      aria-hidden="true"
                    >
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold">Pro Subscription</h4>
                      <p className="text-muted-foreground">
                        Unlimited creativity
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">$10.00</span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Cancel anytime • No long-term commitment
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Perfect for families who love creating stories regularly
                    with premium AI and unlimited books.
                  </p>

                  <ul className="space-y-3 mb-8" role="list">
                    <li className="flex items-start">
                      <Check
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">
                        <strong>Unlimited digital books</strong>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">
                        <strong>Unlimited printable PDFs</strong>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">
                        Professional print books at cost ($49.99 each)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">
                        Premium AI models (GPT-4, Claude)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">
                        Advanced story prompts & templates
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">Up to 5 child profiles</span>
                    </li>
                    <li className="flex items-start">
                      <Check
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">Priority support</span>
                    </li>
                    <li className="flex items-start">
                      <Check
                        className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-sm">
                        Early access to new features
                      </span>
                    </li>
                  </ul>

                  <Button
                    className="w-full mt-auto bg-purple-600 hover:bg-purple-700 text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    size="lg"
                  >
                    Start Pro Subscription
                  </Button>
                </div>
              </Card>
            </motion.article>
          </div>
        </div>

        {/* Value Comparison */}
        <div className="mt-16 text-center p-6 bg-muted/30 rounded-xl">
          <h4 className="text-lg font-semibold mb-4">
            Which option is right for you?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-sm">
            <div className="p-4 bg-background rounded-lg border">
              <h5 className="font-semibold text-foreground mb-2">
                Pay Per Book
              </h5>
              <p className="text-muted-foreground">
                Perfect if you create 1-2 books per month. Try our service
                risk-free starting at just $1.99.
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg border">
              <h5 className="font-semibold text-foreground mb-2">
                Pro Subscription
              </h5>
              <p className="text-muted-foreground">
                Best value if you create 3+ books per month. Unlimited digital
                books and premium features for serious storytellers.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline" size="sm">
              Still have questions? Contact us
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
