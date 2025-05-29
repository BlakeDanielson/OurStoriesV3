'use client'

import { useFormContext } from 'react-hook-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Calendar,
  Heart,
  Gamepad2,
  Star,
  Palette,
  Utensils,
  BookOpen,
  MessageSquare,
} from 'lucide-react'
import type { ChildProfileFormData } from '@/lib/validations/child-profile'

interface ReviewStepProps {
  onSubmit: () => void
}

export function ReviewStep({ onSubmit }: ReviewStepProps) {
  const { watch } = useFormContext<ChildProfileFormData>()

  const formData = watch()
  const {
    name,
    age,
    traits,
    customTraits,
    interests,
    customInterests,
    favoriteColor,
    favoriteFoods,
    petName,
    specialMoments,
    favoriteCharacters,
    readingLevel,
    additionalNotes,
  } = formData

  const allTraits = [...(traits || []), ...(customTraits || [])]
  const allInterests = [...(interests || []), ...(customInterests || [])]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Review Profile Information</h3>
        <p className="text-muted-foreground">
          Please review all the information below. You can go back to make
          changes or submit to create the profile.
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name</span>
                </div>
                <p className="text-lg">{name || 'Not provided'}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Age</span>
                </div>
                <p className="text-lg">
                  {age ? `${age} years old` : 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personality Traits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Personality Traits</span>
              <Badge variant="outline">{allTraits.length} selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allTraits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {traits?.map(trait => (
                  <Badge key={trait} variant="default">
                    {trait}
                  </Badge>
                ))}
                {customTraits?.map(trait => (
                  <Badge key={trait} variant="secondary">
                    {trait} (custom)
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No personality traits selected
              </p>
            )}
          </CardContent>
        </Card>

        {/* Interests & Hobbies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5" />
              <span>Interests & Hobbies</span>
              <Badge variant="outline">{allInterests.length} selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests?.map(interest => (
                  <Badge key={interest} variant="default">
                    {interest}
                  </Badge>
                ))}
                {customInterests?.map(interest => (
                  <Badge key={interest} variant="secondary">
                    {interest} (custom)
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No interests selected</p>
            )}
          </CardContent>
        </Card>

        {/* Optional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Additional Details</span>
            </CardTitle>
            <CardDescription>
              Optional information to personalize stories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Favorite Color */}
            {favoriteColor && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Favorite Color</span>
                </div>
                <p>{favoriteColor}</p>
              </div>
            )}

            {/* Reading Level */}
            {readingLevel && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Reading Level</span>
                </div>
                <p className="capitalize">{readingLevel}</p>
              </div>
            )}

            {/* Favorite Foods */}
            {favoriteFoods && favoriteFoods.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Favorite Foods</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoriteFoods.map(food => (
                    <Badge key={food} variant="outline">
                      {food}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pet Name */}
            {petName && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Pet/Stuffed Animal</span>
                </div>
                <p>{petName}</p>
              </div>
            )}

            {/* Favorite Characters */}
            {favoriteCharacters && favoriteCharacters.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Favorite Characters</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoriteCharacters.map(character => (
                    <Badge key={character} variant="outline">
                      {character}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Special Moments */}
            {specialMoments && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Special Moments</span>
                </div>
                <p>{specialMoments}</p>
              </div>
            )}

            {/* Additional Notes */}
            {additionalNotes && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Additional Notes</span>
                </div>
                <p className="whitespace-pre-wrap">{additionalNotes}</p>
              </div>
            )}

            {/* Show message if no optional details */}
            {!favoriteColor &&
              !readingLevel &&
              (!favoriteFoods || favoriteFoods.length === 0) &&
              !petName &&
              (!favoriteCharacters || favoriteCharacters.length === 0) &&
              !specialMoments &&
              !additionalNotes && (
                <p className="text-muted-foreground italic">
                  No additional details provided
                </p>
              )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>
              This profile will help us create personalized stories for{' '}
              {name || 'your child'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {allTraits.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Personality Traits
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {allInterests.length}
                </div>
                <div className="text-sm text-muted-foreground">Interests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {[
                    favoriteColor,
                    readingLevel,
                    petName,
                    specialMoments,
                    additionalNotes,
                  ].filter(Boolean).length +
                    (favoriteFoods?.length || 0) +
                    (favoriteCharacters?.length || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Additional Details
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {age ? `${age}` : '?'}
                </div>
                <div className="text-sm text-muted-foreground">Years Old</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Ready to create this profile? Click "Create Profile" below to save
          this information.
        </p>
      </div>
    </div>
  )
}
