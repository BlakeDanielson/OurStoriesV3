import { z } from 'zod'

// Step 1: Basic Information
export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  age: z
    .number()
    .min(0, 'Age must be 0 or greater')
    .max(18, 'Age must be 18 or less')
    .int('Age must be a whole number'),
})

// Step 2: Personality Traits
export const personalityTraitsSchema = z.object({
  traits: z
    .array(z.string())
    .min(1, 'Please select at least one personality trait')
    .max(10, 'Please select no more than 10 traits'),
  customTraits: z.array(z.string()).default([]),
})

// Step 3: Hobbies and Interests
export const hobbiesInterestsSchema = z.object({
  interests: z
    .array(z.string())
    .min(1, 'Please select at least one interest')
    .max(15, 'Please select no more than 15 interests'),
  customInterests: z.array(z.string()).default([]),
})

// Step 4: Optional Details
export const optionalDetailsSchema = z.object({
  favoriteColor: z.string().optional(),
  favoriteFoods: z.array(z.string()).default([]),
  petName: z.string().optional(),
  specialMoments: z.string().optional(),
  favoriteCharacters: z.array(z.string()).default([]),
  readingLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  additionalNotes: z.string().optional(),
})

// Combined schema for the complete form
export const childProfileFormSchema = z.object({
  // Basic Info
  name: basicInfoSchema.shape.name,
  age: basicInfoSchema.shape.age,

  // Personality Traits
  traits: personalityTraitsSchema.shape.traits,
  customTraits: personalityTraitsSchema.shape.customTraits,

  // Hobbies and Interests
  interests: hobbiesInterestsSchema.shape.interests,
  customInterests: hobbiesInterestsSchema.shape.customInterests,

  // Optional Details
  favoriteColor: optionalDetailsSchema.shape.favoriteColor,
  favoriteFoods: optionalDetailsSchema.shape.favoriteFoods,
  petName: optionalDetailsSchema.shape.petName,
  specialMoments: optionalDetailsSchema.shape.specialMoments,
  favoriteCharacters: optionalDetailsSchema.shape.favoriteCharacters,
  readingLevel: optionalDetailsSchema.shape.readingLevel,
  additionalNotes: optionalDetailsSchema.shape.additionalNotes,
})

// Type inference
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>
export type PersonalityTraitsFormData = z.infer<typeof personalityTraitsSchema>
export type HobbiesInterestsFormData = z.infer<typeof hobbiesInterestsSchema>
export type OptionalDetailsFormData = z.infer<typeof optionalDetailsSchema>
export type ChildProfileFormData = z.infer<typeof childProfileFormSchema>

// Predefined options
export const PERSONALITY_TRAITS = [
  'Creative',
  'Outgoing',
  'Shy',
  'Adventurous',
  'Analytical',
  'Empathetic',
  'Energetic',
  'Calm',
  'Curious',
  'Independent',
  'Helpful',
  'Funny',
  'Thoughtful',
  'Brave',
  'Gentle',
] as const

export const INTEREST_CATEGORIES = {
  sports: [
    'Soccer',
    'Basketball',
    'Swimming',
    'Tennis',
    'Baseball',
    'Gymnastics',
    'Dance',
    'Martial Arts',
    'Running',
    'Cycling',
  ],
  arts: [
    'Drawing',
    'Painting',
    'Music',
    'Singing',
    'Theater',
    'Crafts',
    'Photography',
    'Writing',
    'Poetry',
    'Sculpture',
  ],
  science: [
    'Animals',
    'Space',
    'Dinosaurs',
    'Nature',
    'Experiments',
    'Robots',
    'Computers',
    'Math',
    'Building',
    'Inventions',
  ],
  reading: [
    'Fantasy',
    'Adventure',
    'Mystery',
    'Science Fiction',
    'Comics',
    'Poetry',
    'History',
    'Biography',
    'Fairy Tales',
    'Educational Books',
  ],
  games: [
    'Board Games',
    'Video Games',
    'Puzzles',
    'Card Games',
    'Outdoor Games',
    'Strategy Games',
    'Word Games',
    'Memory Games',
    'Building Games',
    'Role Playing',
  ],
  other: [
    'Cooking',
    'Gardening',
    'Collecting',
    'Travel',
    'Languages',
    'Volunteering',
    'Fashion',
    'Technology',
    'Movies',
    'Friendship',
  ],
} as const

export const READING_LEVELS = [
  { value: 'beginner', label: 'Beginner (Ages 3-6)' },
  { value: 'intermediate', label: 'Intermediate (Ages 7-10)' },
  { value: 'advanced', label: 'Advanced (Ages 11+)' },
] as const
