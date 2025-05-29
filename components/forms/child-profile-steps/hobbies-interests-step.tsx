'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  X,
  Gamepad2,
  Palette,
  Microscope,
  BookOpen,
  Puzzle,
  Sparkles,
} from 'lucide-react'
import {
  INTEREST_CATEGORIES,
  type ChildProfileFormData,
} from '@/lib/validations/child-profile'

const CATEGORY_ICONS = {
  sports: Gamepad2,
  arts: Palette,
  science: Microscope,
  reading: BookOpen,
  games: Puzzle,
  other: Sparkles,
}

export function HobbiesInterestsStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ChildProfileFormData>()

  const [customInterestInput, setCustomInterestInput] = useState('')
  const selectedInterests = watch('interests') || []
  const customInterests = watch('customInterests') || []

  const toggleInterest = (interest: string) => {
    const currentInterests = selectedInterests
    const isSelected = currentInterests.includes(interest)

    if (isSelected) {
      setValue(
        'interests',
        currentInterests.filter(i => i !== interest),
        { shouldValidate: true }
      )
    } else {
      if (currentInterests.length < 15) {
        setValue('interests', [...currentInterests, interest], {
          shouldValidate: true,
        })
      }
    }
  }

  const addCustomInterest = () => {
    const trimmedInterest = customInterestInput.trim()
    if (
      trimmedInterest &&
      !customInterests.includes(trimmedInterest) &&
      !selectedInterests.includes(trimmedInterest)
    ) {
      setValue('customInterests', [...customInterests, trimmedInterest], {
        shouldValidate: true,
      })
      setCustomInterestInput('')
    }
  }

  const removeCustomInterest = (interest: string) => {
    setValue(
      'customInterests',
      customInterests.filter(i => i !== interest),
      { shouldValidate: true }
    )
  }

  const handleCustomInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomInterest()
    }
  }

  const totalInterests = selectedInterests.length + customInterests.length

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          What does your child love to do?
        </h3>
        <p className="text-muted-foreground">
          Select hobbies and interests that your child enjoys. This helps us
          create engaging stories around their favorite activities.
        </p>
      </div>

      {/* Interest Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Interests & Hobbies</Label>
          <Badge variant="outline">{totalInterests}/15 selected</Badge>
        </div>

        <Tabs defaultValue="sports" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {Object.entries(CATEGORY_ICONS).map(([category, Icon]) => (
              <TabsTrigger
                key={category}
                value={category}
                className="flex items-center space-x-1"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline capitalize">{category}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interests.map(interest => {
                  const isSelected = selectedInterests.includes(interest)
                  const isDisabled = !isSelected && totalInterests >= 15

                  return (
                    <Button
                      key={interest}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleInterest(interest)}
                      disabled={isDisabled}
                      className={`justify-start ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {interest}
                    </Button>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Custom Interests */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Add Custom Interests</Label>
        <div className="flex space-x-2">
          <Input
            placeholder="Enter a custom interest..."
            value={customInterestInput}
            onChange={e => setCustomInterestInput(e.target.value)}
            onKeyPress={handleCustomInterestKeyPress}
            disabled={totalInterests >= 15}
          />
          <Button
            type="button"
            onClick={addCustomInterest}
            disabled={!customInterestInput.trim() || totalInterests >= 15}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {customInterests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customInterests.map(interest => (
              <Badge
                key={interest}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{interest}</span>
                <button
                  type="button"
                  onClick={() => removeCustomInterest(interest)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Validation Error */}
      {errors.interests && (
        <Alert variant="destructive">
          <AlertDescription>{errors.interests.message}</AlertDescription>
        </Alert>
      )}

      {/* Selected Interests Summary */}
      {totalInterests > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">
            Selected Interests ({totalInterests}):
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map(interest => (
              <Badge key={interest} variant="default">
                {interest}
              </Badge>
            ))}
            {customInterests.map(interest => (
              <Badge key={interest} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Select activities and interests your child enjoys. You can choose up
          to 15 interests total.
        </p>
      </div>
    </div>
  )
}
