'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  X,
  Star,
  Palette,
  Utensils,
  Heart,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import {
  READING_LEVELS,
  type ChildProfileFormData,
} from '@/lib/validations/child-profile'

export function OptionalDetailsStep() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ChildProfileFormData>()

  const [favoriteFoodInput, setFavoriteFoodInput] = useState('')
  const [favoriteCharacterInput, setFavoriteCharacterInput] = useState('')

  const favoriteFoods = watch('favoriteFoods') || []
  const favoriteCharacters = watch('favoriteCharacters') || []
  const favoriteColor = watch('favoriteColor')
  const petName = watch('petName')
  const specialMoments = watch('specialMoments')
  const readingLevel = watch('readingLevel')
  const additionalNotes = watch('additionalNotes')

  const addFavoriteFood = () => {
    const trimmedFood = favoriteFoodInput.trim()
    if (trimmedFood && !favoriteFoods.includes(trimmedFood)) {
      setValue('favoriteFoods', [...favoriteFoods, trimmedFood])
      setFavoriteFoodInput('')
    }
  }

  const removeFavoriteFood = (food: string) => {
    setValue(
      'favoriteFoods',
      favoriteFoods.filter(f => f !== food)
    )
  }

  const addFavoriteCharacter = () => {
    const trimmedCharacter = favoriteCharacterInput.trim()
    if (trimmedCharacter && !favoriteCharacters.includes(trimmedCharacter)) {
      setValue('favoriteCharacters', [...favoriteCharacters, trimmedCharacter])
      setFavoriteCharacterInput('')
    }
  }

  const removeFavoriteCharacter = (character: string) => {
    setValue(
      'favoriteCharacters',
      favoriteCharacters.filter(c => c !== character)
    )
  }

  const handleFoodKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFavoriteFood()
    }
  }

  const handleCharacterKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFavoriteCharacter()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Tell us more about your child</h3>
        <p className="text-muted-foreground">
          These details are optional but help us create even more personalized
          stories. Skip any you prefer not to share.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl mx-auto">
        {/* Favorite Color */}
        <div className="space-y-2">
          <Label
            htmlFor="favoriteColor"
            className="flex items-center space-x-2"
          >
            <Palette className="h-4 w-4" />
            <span>Favorite Color</span>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </Label>
          <Input
            id="favoriteColor"
            type="text"
            placeholder="e.g., Blue, Rainbow, Purple..."
            {...register('favoriteColor')}
          />
          {favoriteColor && (
            <p className="text-sm text-muted-foreground">
              Great! We'll incorporate {favoriteColor.toLowerCase()} into the
              story illustrations.
            </p>
          )}
        </div>

        {/* Reading Level */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Reading Level</span>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </Label>
          <Select
            value={readingLevel || ''}
            onValueChange={value => setValue('readingLevel', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select reading level..." />
            </SelectTrigger>
            <SelectContent>
              {READING_LEVELS.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {readingLevel && (
            <p className="text-sm text-muted-foreground">
              Perfect! We'll tailor the story complexity for a {readingLevel}{' '}
              reader.
            </p>
          )}
        </div>

        {/* Favorite Foods */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Utensils className="h-4 w-4" />
            <span>Favorite Foods</span>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </Label>
          <div className="flex space-x-2">
            <Input
              placeholder="Add a favorite food..."
              value={favoriteFoodInput}
              onChange={e => setFavoriteFoodInput(e.target.value)}
              onKeyPress={handleFoodKeyPress}
            />
            <Button
              type="button"
              onClick={addFavoriteFood}
              disabled={!favoriteFoodInput.trim()}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {favoriteFoods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {favoriteFoods.map(food => (
                <Badge
                  key={food}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{food}</span>
                  <button
                    type="button"
                    onClick={() => removeFavoriteFood(food)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Pet Name */}
        <div className="space-y-2">
          <Label htmlFor="petName" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Pet Name or Favorite Stuffed Animal</span>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </Label>
          <Input
            id="petName"
            type="text"
            placeholder="e.g., Fluffy, Mr. Bear, Sparkles..."
            {...register('petName')}
          />
          {petName && (
            <p className="text-sm text-muted-foreground">
              Wonderful! {petName} might make an appearance in the stories.
            </p>
          )}
        </div>

        {/* Favorite Characters */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>Favorite Characters</span>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </Label>
          <div className="flex space-x-2">
            <Input
              placeholder="Add a favorite character..."
              value={favoriteCharacterInput}
              onChange={e => setFavoriteCharacterInput(e.target.value)}
              onKeyPress={handleCharacterKeyPress}
            />
            <Button
              type="button"
              onClick={addFavoriteCharacter}
              disabled={!favoriteCharacterInput.trim()}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {favoriteCharacters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {favoriteCharacters.map(character => (
                <Badge
                  key={character}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{character}</span>
                  <button
                    type="button"
                    onClick={() => removeFavoriteCharacter(character)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Special Moments */}
        <div className="space-y-2">
          <Label
            htmlFor="specialMoments"
            className="flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Special Moments or Memories</span>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </Label>
          <Input
            id="specialMoments"
            type="text"
            placeholder="e.g., First day of school, family vacation, learning to ride a bike..."
            {...register('specialMoments')}
          />
          {specialMoments && (
            <p className="text-sm text-muted-foreground">
              These special memories can inspire unique story adventures.
            </p>
          )}
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label
            htmlFor="additionalNotes"
            className="flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Additional Notes</span>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </Label>
          <textarea
            id="additionalNotes"
            placeholder="Any other details you'd like us to know about your child..."
            {...register('additionalNotes')}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={3}
          />
          {additionalNotes && (
            <p className="text-sm text-muted-foreground">
              Thank you for sharing these details. They'll help us create more
              meaningful stories.
            </p>
          )}
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          All fields on this page are optional. Share as much or as little as
          you're comfortable with.
        </p>
      </div>
    </div>
  )
}
