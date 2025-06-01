/**
 * Vocabulary Data for Age-Appropriate Language Controls
 *
 * Contains age-specific vocabulary databases and substitution rules
 */

import { AgeGroup, VocabularyRule } from './language-controls-types'

// ============================================================================
// Vocabulary Databases
// ============================================================================

export const AGE_APPROPRIATE_VOCABULARY = {
  toddler: {
    simple: [
      'big',
      'small',
      'happy',
      'sad',
      'good',
      'nice',
      'fun',
      'play',
      'love',
      'help',
    ],
    animals: [
      'cat',
      'dog',
      'bird',
      'fish',
      'bear',
      'bunny',
      'duck',
      'cow',
      'pig',
      'horse',
    ],
    colors: [
      'red',
      'blue',
      'green',
      'yellow',
      'pink',
      'purple',
      'orange',
      'black',
      'white',
    ],
    family: [
      'mom',
      'dad',
      'baby',
      'sister',
      'brother',
      'grandma',
      'grandpa',
      'family',
    ],
    actions: [
      'run',
      'jump',
      'walk',
      'eat',
      'sleep',
      'play',
      'laugh',
      'hug',
      'kiss',
      'dance',
    ],
  },
  preschool: {
    descriptive: [
      'beautiful',
      'wonderful',
      'amazing',
      'special',
      'gentle',
      'kind',
      'brave',
      'smart',
    ],
    emotions: [
      'excited',
      'surprised',
      'curious',
      'proud',
      'grateful',
      'peaceful',
      'joyful',
    ],
    learning: [
      'learn',
      'discover',
      'explore',
      'find',
      'create',
      'build',
      'make',
      'try',
    ],
    social: [
      'friend',
      'share',
      'help',
      'care',
      'listen',
      'talk',
      'play together',
      'be kind',
    ],
  },
  'early-elementary': {
    advanced: [
      'adventure',
      'journey',
      'challenge',
      'solution',
      'creative',
      'imagination',
      'cooperation',
    ],
    academic: [
      'science',
      'nature',
      'experiment',
      'observe',
      'question',
      'answer',
      'problem',
      'solve',
    ],
    character: [
      'responsible',
      'honest',
      'patient',
      'determined',
      'thoughtful',
      'respectful',
    ],
  },
  elementary: {
    complex: [
      'perseverance',
      'achievement',
      'consequence',
      'opportunity',
      'responsibility',
      'independence',
    ],
    educational: [
      'mathematics',
      'literature',
      'geography',
      'history',
      'technology',
      'environment',
    ],
    social: [
      'community',
      'citizenship',
      'diversity',
      'culture',
      'tradition',
      'cooperation',
      'leadership',
    ],
  },
} as const

// ============================================================================
// Complex word substitutions for age-appropriate alternatives
// ============================================================================

export const VOCABULARY_SUBSTITUTIONS: Record<AgeGroup, VocabularyRule[]> = {
  toddler: [
    {
      pattern: 'enormous',
      replacement: 'very big',
      ageGroups: ['toddler'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'magnificent',
      replacement: 'beautiful',
      ageGroups: ['toddler'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'terrified',
      replacement: 'scared',
      ageGroups: ['toddler'],
      reason: 'Less intense emotion',
      isRegex: false,
    },
    {
      pattern: 'astonished',
      replacement: 'surprised',
      ageGroups: ['toddler'],
      reason: 'Simpler emotion word',
      isRegex: false,
    },
    {
      pattern: 'exhausted',
      replacement: 'very tired',
      ageGroups: ['toddler'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'delicious',
      replacement: 'yummy',
      ageGroups: ['toddler'],
      reason: 'Child-friendly vocabulary',
      isRegex: false,
    },
  ],
  preschool: [
    {
      pattern: 'tremendous',
      replacement: 'really big',
      ageGroups: ['preschool'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'astonished',
      replacement: 'surprised',
      ageGroups: ['preschool'],
      reason: 'Simpler emotion word',
      isRegex: false,
    },
    {
      pattern: 'investigate',
      replacement: 'look for',
      ageGroups: ['preschool'],
      reason: 'Simpler action word',
      isRegex: false,
    },
    {
      pattern: 'accomplish',
      replacement: 'finish',
      ageGroups: ['preschool'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
  ],
  'early-elementary': [
    {
      pattern: 'extraordinary',
      replacement: 'amazing',
      ageGroups: ['early-elementary'],
      reason: 'Simpler but still rich vocabulary',
      isRegex: false,
    },
    {
      pattern: 'comprehend',
      replacement: 'understand',
      ageGroups: ['early-elementary'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'magnificent',
      replacement: 'wonderful',
      ageGroups: ['early-elementary'],
      reason: 'Age-appropriate vocabulary',
      isRegex: false,
    },
  ],
  elementary: [
    {
      pattern: 'incomprehensible',
      replacement: 'hard to understand',
      ageGroups: ['elementary'],
      reason: 'Clearer expression',
      isRegex: false,
    },
    {
      pattern: 'extraordinary',
      replacement: 'remarkable',
      ageGroups: ['elementary'],
      reason: 'Grade-appropriate vocabulary',
      isRegex: false,
    },
  ],
}

// ============================================================================
// Educational vocabulary by subject area
// ============================================================================

export const EDUCATIONAL_VOCABULARY = {
  science: {
    toddler: ['water', 'air', 'hot', 'cold', 'light', 'dark'],
    preschool: ['nature', 'plants', 'animals', 'weather', 'seasons'],
    'early-elementary': ['experiment', 'observe', 'discover', 'explore'],
    elementary: ['hypothesis', 'investigation', 'conclusion', 'evidence'],
  },
  math: {
    toddler: ['big', 'small', 'more', 'less', 'count'],
    preschool: ['numbers', 'shapes', 'patterns', 'measure'],
    'early-elementary': ['addition', 'subtraction', 'problem', 'solve'],
    elementary: ['multiplication', 'division', 'fraction', 'equation'],
  },
  social: {
    toddler: ['family', 'friends', 'share', 'help', 'kind'],
    preschool: ['community', 'neighbors', 'rules', 'fair'],
    'early-elementary': ['cooperation', 'respect', 'responsibility'],
    elementary: ['citizenship', 'democracy', 'culture', 'diversity'],
  },
} as const

// ============================================================================
// Utility functions for vocabulary management
// ============================================================================

export function getVocabularyForAge(ageGroup: AgeGroup): readonly string[] {
  const vocab = AGE_APPROPRIATE_VOCABULARY[ageGroup]
  return Object.values(vocab).flat()
}

export function getSubstitutionRules(ageGroup: AgeGroup): VocabularyRule[] {
  return VOCABULARY_SUBSTITUTIONS[ageGroup] || []
}

export function getAllSubstitutionRules(): VocabularyRule[] {
  return Object.values(VOCABULARY_SUBSTITUTIONS).flat()
}

export function getEducationalVocabulary(
  ageGroup: AgeGroup,
  subject?: keyof typeof EDUCATIONAL_VOCABULARY
): readonly string[] {
  if (subject) {
    return EDUCATIONAL_VOCABULARY[subject][ageGroup] || []
  }

  return Object.values(EDUCATIONAL_VOCABULARY)
    .map(subjectVocab => subjectVocab[ageGroup] || [])
    .flat()
}
