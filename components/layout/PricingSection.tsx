'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check, Star, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface PricingPlan {
  name: string
  price: string
  yearlyPrice: string
  period: string
  features: string[]
  description: string
  buttonText: string
  color: string
  isPopular?: boolean
}

interface PricingProps {
  plans?: PricingPlan[]
  title?: string
  description?: string
}

export const PricingSection = ({
  plans = [
    {
      name: 'Basic',
      price: '$9.99',
      yearlyPrice: '$95.90',
      period: 'month',
      features: [
        '2 books per month',
        'Basic customization',
        'Mobile access',
        'Download for offline reading',
        'Email support',
      ],
      description: 'Perfect for beginners starting their reading journey',
      buttonText: 'Start Creating',
      color: 'purple',
      isPopular: false,
    },
    {
      name: 'Popular',
      price: '$19.99',
      yearlyPrice: '$191.90',
      period: 'month',
      features: [
        '5 books per month',
        'Advanced customization',
        'Mobile & tablet access',
        'Download for offline reading',
        'Priority email support',
        'Character personalization',
      ],
      description: 'Our most popular plan for growing readers',
      buttonText: 'Start Creating',
      color: 'blue',
      isPopular: true,
    },
    {
      name: 'Premium',
      price: '$29.99',
      yearlyPrice: '$287.90',
      period: 'month',
      features: [
        'Unlimited books',
        'Full customization',
        'Access on all devices',
        'Download for offline reading',
        '24/7 priority support',
        'Character personalization',
        'Audio narration',
      ],
      description: 'The ultimate experience for avid young readers',
      buttonText: 'Start Creating',
      color: 'green',
      isPopular: false,
    },
  ],
  title = 'Choose Your Adventure',
  description = 'Unlock magical stories for your little ones with our flexible pricing plans',
}: PricingProps) => {
  const [isMonthly, setIsMonthly] = useState(true)
  const switchRef = useRef<HTMLButtonElement>(null)

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked)
  }

  const gradients = {
    purple: 'bg-gradient-to-r from-purple-200 via-violet-400 to-indigo-600',
    blue: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    green: 'bg-gradient-to-r from-emerald-500 to-emerald-900',
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

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <fieldset className="flex items-center gap-4 p-2 rounded-full bg-background border shadow-sm">
            <legend className="sr-only">Choose billing frequency</legend>
            <span
              className={cn(
                'font-medium',
                isMonthly ? 'text-primary' : 'text-muted-foreground'
              )}
              id="monthly-label"
            >
              Monthly
            </span>
            <Label className="cursor-pointer" htmlFor="billing-toggle">
              <span className="sr-only">
                Switch to {isMonthly ? 'yearly' : 'monthly'} billing
              </span>
              <Switch
                id="billing-toggle"
                ref={switchRef as any}
                checked={!isMonthly}
                onCheckedChange={handleToggle}
                aria-describedby="billing-description"
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </Label>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium',
                  !isMonthly ? 'text-primary' : 'text-muted-foreground'
                )}
                id="yearly-label"
              >
                Yearly
              </span>
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-300"
                aria-label="Save 20% with yearly billing"
              >
                Save 20%
              </Badge>
            </div>
            <div id="billing-description" className="sr-only">
              {isMonthly
                ? 'Currently showing monthly prices'
                : 'Currently showing yearly prices with 20% savings'}
            </div>
          </fieldset>
        </div>

        {/* Pricing Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          role="region"
          aria-label="Pricing plans"
        >
          {plans.map((plan, index) => (
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
                scale: 1.03,
                boxShadow:
                  '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                transition: { duration: 0.2 },
              }}
              className="flex motion-reduce:transform-none"
            >
              <Card
                className={cn(
                  'relative flex flex-col overflow-hidden rounded-2xl border-2 w-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                  plan.isPopular ? 'border-primary' : 'border-border'
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 opacity-10',
                    gradients[plan.color as keyof typeof gradients]
                  )}
                  aria-hidden="true"
                />

                {plan.isPopular && (
                  <div
                    className="absolute top-0 right-0 bg-primary py-1 px-3 rounded-bl-xl rounded-tr-xl flex items-center"
                    role="img"
                    aria-label="Most popular plan"
                  >
                    <Star
                      className="text-primary-foreground h-4 w-4 mr-1 fill-current"
                      aria-hidden="true"
                    />
                    <span className="text-primary-foreground text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col z-10">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full mb-4 flex items-center justify-center',
                      gradients[plan.color as keyof typeof gradients]
                    )}
                    aria-hidden="true"
                  >
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>

                  <h3
                    className="text-xl font-bold mb-2"
                    id={`plan-${index}-title`}
                  >
                    {plan.name}
                  </h3>

                  <div className="mt-2 mb-6">
                    <div className="flex items-baseline">
                      <span
                        className="text-4xl font-bold"
                        aria-label={`${isMonthly ? plan.price : plan.yearlyPrice} per ${plan.period}`}
                      >
                        {isMonthly ? plan.price : plan.yearlyPrice}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        /{isMonthly ? plan.period : 'year'}
                      </span>
                    </div>
                    {!isMonthly && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Billed annually
                      </div>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-6 flex-1">
                    {plan.description}
                  </p>

                  <ul
                    className="space-y-3 mb-8"
                    role="list"
                    aria-labelledby={`plan-${index}-title`}
                  >
                    {plan.features.map((feature, featureIndex) => (
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
                      'w-full mt-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      plan.isPopular
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-secondary hover:bg-secondary/80'
                    )}
                    size="lg"
                    aria-describedby={`plan-${index}-description`}
                  >
                    {plan.buttonText}
                  </Button>

                  <div id={`plan-${index}-description`} className="sr-only">
                    {plan.name} plan: {plan.description}. Price:{' '}
                    {isMonthly ? plan.price : plan.yearlyPrice} per{' '}
                    {isMonthly ? plan.period : 'year'}. Features include:{' '}
                    {plan.features.join(', ')}.
                  </div>
                </div>
              </Card>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
