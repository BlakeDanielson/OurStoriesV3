'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, Heart } from 'lucide-react'
import {
  PERSONALITY_TRAITS,
  type ChildProfileFormData,
} from '@/lib/validations/child-profile'

export function PersonalityTraitsStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ChildProfileFormData>()

  const [customTraitInput, setCustomTraitInput] = useState('')
  const selectedTraits = watch('traits') || []
  const customTraits = watch('customTraits') || []

  const toggleTrait = (trait: string) => {
    const currentTraits = selectedTraits
    const isSelected = currentTraits.includes(trait)

    if (isSelected) {
      setValue(
        'traits',
        currentTraits.filter(t => t !== trait),
        { shouldValidate: true }
      )
    } else {
      if (currentTraits.length < 10) {
        setValue('traits', [...currentTraits, trait], { shouldValidate: true })
      }
    }
  }

  const addCustomTrait = () => {
    const trimmedTrait = customTraitInput.trim()
    if (
      trimmedTrait &&
      !customTraits.includes(trimmedTrait) &&
      !selectedTraits.includes(trimmedTrait)
    ) {
      setValue('customTraits', [...customTraits, trimmedTrait], {
        shouldValidate: true,
      })
      setCustomTraitInput('')
    }
  }

  const removeCustomTrait = (trait: string) => {
    setValue(
      'customTraits',
      customTraits.filter(t => t !== trait),
      { shouldValidate: true }
    )
  }

  const handleCustomTraitKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTrait()
    }
  }

  const totalTraits = selectedTraits.length + customTraits.length

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">What's your child like?</h3>
        <p className="text-muted-foreground">
          Select personality traits that describe your child. This helps us
          create characters and stories that resonate with them.
        </p>
      </div>

      {/* Predefined Traits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Personality Traits</Label>
          <Badge variant="outline">{totalTraits}/10 selected</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PERSONALITY_TRAITS.map(trait => {
            const isSelected = selectedTraits.includes(trait)
            const isDisabled = !isSelected && totalTraits >= 10

            return (
              <Button
                key={trait}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTrait(trait)}
                disabled={isDisabled}
                className={`justify-start ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <Heart className="h-4 w-4 mr-2" />
                {trait}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Custom Traits */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Add Custom Traits</Label>
        <div className="flex space-x-2">
          <Input
            placeholder="Enter a custom trait..."
            value={customTraitInput}
            onChange={e => setCustomTraitInput(e.target.value)}
            onKeyPress={handleCustomTraitKeyPress}
            disabled={totalTraits >= 10}
          />
          <Button
            type="button"
            onClick={addCustomTrait}
            disabled={!customTraitInput.trim() || totalTraits >= 10}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {customTraits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customTraits.map(trait => (
              <Badge
                key={trait}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{trait}</span>
                <button
                  type="button"
                  onClick={() => removeCustomTrait(trait)}
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
      {errors.traits && (
        <Alert variant="destructive">
          <AlertDescription>{errors.traits.message}</AlertDescription>
        </Alert>
      )}

      {/* Selected Traits Summary */}
      {totalTraits > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Selected Traits ({totalTraits}):</h4>
          <div className="flex flex-wrap gap-2">
            {selectedTraits.map(trait => (
              <Badge key={trait} variant="default">
                {trait}
              </Badge>
            ))}
            {customTraits.map(trait => (
              <Badge key={trait} variant="secondary">
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Choose traits that best describe your child's personality. You can
          select up to 10 traits total.
        </p>
      </div>
    </div>
  )
}
