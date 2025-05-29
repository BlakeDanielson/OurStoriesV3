/**
 * AI Prompt Templates for Children's Story Generation
 *
 * This module provides structured prompt templates for generating personalized
 * children's stories using LLM services like OpenAI GPT-4o-mini and Google Gemini.
 *
 * Features:
 * - Age-appropriate content generation
 * - Personalization with child details
 * - Multiple story themes and arcs
 * - Content safety guidelines
 * - Template versioning for A/B testing
 */

import { z } from 'zod'

// Types for prompt template system
export interface ChildProfile {
  name: string
  age?: number
  ageRange?: 'toddler' | 'preschool' | 'early-elementary' | 'elementary'
  personalityTraits: string[]
  hobbies: string[]
  interests: string[]
  favoriteThings?: string[]
  readingLevel?: 'beginner' | 'intermediate' | 'advanced'
}

export interface StoryConfiguration {
  theme: string
  storyArc: string
  illustrationStyle: string
  storyLength: 'short' | 'medium' | 'long'
  educationalFocus?: string
  moralLesson?: string
}

export interface PromptContext {
  child: ChildProfile
  story: StoryConfiguration
  customInstructions?: string
  safetyLevel: 'strict' | 'moderate' | 'relaxed'
}

// Validation schemas
export const ChildProfileSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().min(1).max(12).optional(),
  ageRange: z
    .enum(['toddler', 'preschool', 'early-elementary', 'elementary'])
    .optional(),
  personalityTraits: z.array(z.string()).min(1).max(10),
  hobbies: z.array(z.string()).min(1).max(10),
  interests: z.array(z.string()).min(1).max(10),
  favoriteThings: z.array(z.string()).max(5).optional(),
  readingLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

export const StoryConfigurationSchema = z.object({
  theme: z.string().min(1),
  storyArc: z.string().min(1),
  illustrationStyle: z.string().min(1),
  storyLength: z.enum(['short', 'medium', 'long']),
  educationalFocus: z.string().optional(),
  moralLesson: z.string().optional(),
})

// Template versioning for A/B testing
export interface TemplateVersion {
  id: string
  version: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Base prompt template interface
export interface PromptTemplate {
  id: string
  version: TemplateVersion
  systemPrompt: string
  userPromptTemplate: string
  fewShotExamples?: FewShotExample[]
  safetyGuidelines: string[]
  outputFormat: string
}

export interface FewShotExample {
  input: PromptContext
  output: string
  description: string
}

// Age-appropriate vocabulary and complexity guidelines
const AGE_GUIDELINES = {
  toddler: {
    ageRange: '1-3 years',
    vocabulary: 'Very simple words (1-2 syllables), basic concepts',
    sentenceLength: '3-5 words per sentence',
    concepts: 'Colors, shapes, animals, family, basic emotions',
    complexity: 'Extremely simple cause-and-effect, repetitive patterns',
  },
  preschool: {
    ageRange: '3-5 years',
    vocabulary: 'Simple words, some descriptive language',
    sentenceLength: '5-8 words per sentence',
    concepts: 'Friendship, sharing, basic problem-solving, emotions',
    complexity: 'Simple storylines, clear beginning-middle-end',
  },
  'early-elementary': {
    ageRange: '5-7 years',
    vocabulary: 'Expanding vocabulary, some complex words with context',
    sentenceLength: '8-12 words per sentence',
    concepts: 'School, community, more complex emotions, basic morals',
    complexity: 'Multi-step problems, character development',
  },
  elementary: {
    ageRange: '7-12 years',
    vocabulary: 'Rich vocabulary, descriptive language, some advanced concepts',
    sentenceLength: '10-15 words per sentence',
    concepts:
      'Complex relationships, abstract thinking, detailed problem-solving',
    complexity: 'Sophisticated plots, multiple characters, deeper themes',
  },
} as const

// Story length specifications
const STORY_LENGTH_SPECS = {
  short: {
    pages: '8-12 pages',
    wordCount: '300-500 words',
    readingTime: '3-5 minutes',
    structure: 'Simple 3-act structure',
  },
  medium: {
    pages: '16-20 pages',
    wordCount: '600-1000 words',
    readingTime: '5-8 minutes',
    structure: 'Extended 3-act with character development',
  },
  long: {
    pages: '24-32 pages',
    wordCount: '1000-1500 words',
    readingTime: '8-12 minutes',
    structure: 'Complex multi-act with subplots',
  },
} as const

// Core system prompt for story generation
const CORE_SYSTEM_PROMPT = `You are an expert children's book author and educational content creator specializing in personalized, age-appropriate storytelling. Your mission is to create magical, engaging stories that make children feel seen, celebrated, and inspired.

## Core Principles:
1. **Child-Centered**: The child is always the protagonist and hero of their story
2. **Positive Messaging**: Stories promote confidence, kindness, curiosity, and growth
3. **Age-Appropriate**: Content matches the child's developmental stage and reading level
4. **Inclusive**: Stories are culturally sensitive and celebrate diversity
5. **Educational**: Subtly incorporate learning opportunities and life lessons
6. **Safe**: Absolutely no inappropriate content, violence, or scary elements

## Content Safety Guidelines:
- NO violence, conflict, or scary situations
- NO inappropriate themes or adult content
- NO stereotypes or biased representations
- NO negative character traits for the main character (child)
- YES to positive role models and healthy relationships
- YES to problem-solving through creativity and kindness
- YES to celebrating uniqueness and differences

## Personalization Requirements:
- Meaningfully integrate the child's name throughout the story
- Weave personality traits into character actions and dialogue
- Incorporate hobbies and interests as central story elements
- Reflect the child's unique qualities in plot development
- Use age-appropriate language and concepts
- Match the specified story length and structure

## Story Structure:
- Clear beginning, middle, and end
- Engaging opening that introduces the child character
- Problem or adventure that showcases the child's strengths
- Resolution that reinforces positive messages
- Satisfying conclusion that celebrates the child

Remember: You are creating a treasured keepsake that will be read many times. Make it special, personal, and magical.`

// Template for generating story outlines
export const STORY_OUTLINE_TEMPLATE: PromptTemplate = {
  id: 'story-outline-v1',
  version: {
    id: 'outline-001',
    version: '1.0.0',
    name: 'Story Outline Generator',
    description:
      'Generates detailed story outlines before full text generation',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  systemPrompt: CORE_SYSTEM_PROMPT,
  userPromptTemplate: `Create a detailed story outline for a personalized children's book with the following specifications:

**Child Details:**
- Name: {childName}
- Age/Stage: {ageRange} ({ageGuidelines})
- Personality Traits: {personalityTraits}
- Hobbies & Interests: {hobbies}
- Reading Level: {readingLevel}

**Story Configuration:**
- Theme: {theme}
- Story Arc: {storyArc}
- Length: {storyLength} ({lengthSpecs})
- Educational Focus: {educationalFocus}
- Moral Lesson: {moralLesson}

**Requirements:**
- Create a {storyLength} story ({lengthSpecs})
- Use {ageRange} appropriate language and concepts
- Meaningfully integrate ALL personality traits and hobbies
- Follow the "{storyArc}" narrative structure
- Include the "{theme}" theme throughout
- Incorporate educational elements about {educationalFocus}
- Reinforce the moral lesson: {moralLesson}

Please provide a detailed outline including:
1. Story title
2. Main character description (based on child)
3. Setting and world-building
4. Chapter/page breakdown with key events
5. How personality traits influence the plot
6. Integration points for hobbies and interests
7. Educational moments and learning opportunities
8. Character growth and resolution`,
  safetyGuidelines: [
    'Ensure all content is age-appropriate and positive',
    'No scary, violent, or inappropriate elements',
    'Promote positive values and character development',
    "Celebrate the child's unique qualities",
    'Include diverse and inclusive representations',
  ],
  outputFormat: 'Detailed story outline in structured format',
}

// Template for generating full story text
export const STORY_GENERATION_TEMPLATE: PromptTemplate = {
  id: 'story-generation-v1',
  version: {
    id: 'generation-001',
    version: '1.0.0',
    name: 'Full Story Generator',
    description: 'Generates complete story text from outline',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  systemPrompt: CORE_SYSTEM_PROMPT,
  userPromptTemplate: `Write a complete personalized children's story based on this outline and specifications:

**Child Details:**
- Name: {childName}
- Age/Stage: {ageRange} ({ageGuidelines})
- Personality Traits: {personalityTraits}
- Hobbies & Interests: {hobbies}
- Reading Level: {readingLevel}

**Story Outline:**
{storyOutline}

**Writing Guidelines:**
- Target length: {storyLength} ({lengthSpecs})
- Use vocabulary appropriate for {ageRange}: {vocabularyGuidelines}
- Sentence length: {sentenceGuidelines}
- Include concepts: {conceptGuidelines}
- Story complexity: {complexityGuidelines}

**Personalization Requirements:**
- Use {childName}'s name frequently and naturally
- Show {childName} demonstrating these traits: {personalityTraits}
- Feature these hobbies prominently: {hobbies}
- Include these interests: {interests}
- Make {childName} the hero who solves problems and grows

**Format Requirements:**
- Write in engaging, narrative prose
- Include dialogue that sounds natural for children
- Create vivid, child-friendly descriptions
- End each potential "page" with a natural break
- Include [PAGE BREAK] markers for illustration points
- Ensure the story flows smoothly and maintains engagement

Write the complete story now, making {childName} feel like the amazing, unique child they are!`,
  safetyGuidelines: [
    'Use only positive, uplifting language',
    'Ensure age-appropriate vocabulary and concepts',
    'No frightening or inappropriate content',
    'Promote positive character traits',
    'Include educational value',
  ],
  outputFormat: 'Complete story text with page break markers',
}

// Template for story revision and improvement
export const STORY_REVISION_TEMPLATE: PromptTemplate = {
  id: 'story-revision-v1',
  version: {
    id: 'revision-001',
    version: '1.0.0',
    name: 'Story Revision Assistant',
    description: 'Revises and improves existing story content',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  systemPrompt: CORE_SYSTEM_PROMPT,
  userPromptTemplate: `Please revise and improve this children's story based on the feedback and requirements:

**Original Story:**
{originalStory}

**Child Details:**
- Name: {childName}
- Age/Stage: {ageRange}
- Personality Traits: {personalityTraits}
- Hobbies & Interests: {hobbies}

**Revision Instructions:**
{revisionInstructions}

**Specific Areas to Improve:**
{improvementAreas}

**Requirements:**
- Maintain the core story structure and positive message
- Ensure all changes are age-appropriate
- Keep the child as the central hero
- Preserve the personalization elements
- Improve readability and engagement
- Address all feedback points

Please provide the revised story that addresses these concerns while maintaining the magical, personalized quality.`,
  safetyGuidelines: [
    'Maintain age-appropriate content in all revisions',
    'Preserve positive messaging and character development',
    'Ensure personalization remains strong',
    'Keep safety and inclusivity standards',
  ],
  outputFormat: 'Revised complete story text',
}

// Few-shot examples for better prompt performance
const STORY_EXAMPLES: FewShotExample[] = [
  {
    input: {
      child: {
        name: 'Emma',
        ageRange: 'preschool',
        personalityTraits: ['curious', 'kind', 'creative'],
        hobbies: ['painting', 'gardening'],
        interests: ['butterflies', 'colors'],
        readingLevel: 'beginner',
      },
      story: {
        theme: 'friendship',
        storyArc: 'discovery-journey',
        illustrationStyle: 'watercolor',
        storyLength: 'short',
        educationalFocus: 'colors and nature',
        moralLesson: 'helping others brings joy',
      },
      safetyLevel: 'strict',
    },
    output: `Emma's Butterfly Garden Adventure

Emma loved two things more than anything: painting beautiful pictures and helping her mom in the garden. One sunny morning, Emma was painting outside when she noticed something wonderful.

"Look, Mom!" Emma called out, pointing her paintbrush toward the flower bed. "The flowers need more colors!"

Emma had a creative idea. She would paint special signs for each flower to help the butterflies find them. She painted a bright yellow sign for the sunflowers and a pretty purple one for the lavender.

As Emma worked on her colorful signs, a small butterfly landed right on her paintbrush! "Hello, little friend," Emma said kindly. "Are you looking for the perfect flower?"

The butterfly seemed to nod, and Emma gently guided it to the purple lavender. Soon, more butterflies came to visit Emma's garden, each finding their favorite colored flowers.

"Emma," said her mom, "your kind heart and creative paintings helped make our garden a home for butterflies!"

Emma smiled, knowing that when you help others with kindness and creativity, you make the world more beautiful.

[THE END]`,
    description:
      'Example of preschool-level story with personalization and educational content',
  },
]

// Template utility functions
export class PromptTemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map()

  constructor() {
    // Register default templates
    this.registerTemplate(STORY_OUTLINE_TEMPLATE)
    this.registerTemplate(STORY_GENERATION_TEMPLATE)
    this.registerTemplate(STORY_REVISION_TEMPLATE)
  }

  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template)
  }

  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId)
  }

  generatePrompt(templateId: string, context: PromptContext): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    // Validate input context
    ChildProfileSchema.parse(context.child)
    StoryConfigurationSchema.parse(context.story)

    // Get age-appropriate guidelines
    const ageRange =
      context.child.ageRange || this.inferAgeRange(context.child.age)
    const guidelines = AGE_GUIDELINES[ageRange]
    const lengthSpecs = STORY_LENGTH_SPECS[context.story.storyLength]

    // Build replacement variables
    const variables = {
      childName: context.child.name,
      ageRange: ageRange,
      ageGuidelines: `${guidelines.ageRange} - ${guidelines.vocabulary}`,
      personalityTraits: context.child.personalityTraits.join(', '),
      hobbies: context.child.hobbies.join(', '),
      interests: context.child.interests.join(', '),
      readingLevel: context.child.readingLevel || 'beginner',
      theme: context.story.theme,
      storyArc: context.story.storyArc,
      storyLength: context.story.storyLength,
      lengthSpecs: `${lengthSpecs.pages}, ${lengthSpecs.wordCount}, ${lengthSpecs.readingTime}`,
      educationalFocus: context.story.educationalFocus || 'general learning',
      moralLesson: context.story.moralLesson || 'being kind and brave',
      vocabularyGuidelines: guidelines.vocabulary,
      sentenceGuidelines: guidelines.sentenceLength,
      conceptGuidelines: guidelines.concepts,
      complexityGuidelines: guidelines.complexity,
      customInstructions: context.customInstructions || '',
    }

    // Replace template variables
    let prompt = template.userPromptTemplate
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value)
    })

    return prompt
  }

  private inferAgeRange(age?: number): keyof typeof AGE_GUIDELINES {
    if (!age) return 'preschool'
    if (age <= 3) return 'toddler'
    if (age <= 5) return 'preschool'
    if (age <= 7) return 'early-elementary'
    return 'elementary'
  }

  generateSystemPrompt(
    templateId: string,
    safetyLevel: 'strict' | 'moderate' | 'relaxed' = 'strict'
  ): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    let systemPrompt = template.systemPrompt

    // Add safety level specific guidelines
    if (safetyLevel === 'strict') {
      systemPrompt +=
        '\n\n## STRICT SAFETY MODE:\n- Extra vigilance for age-appropriate content\n- Conservative approach to any potentially sensitive topics\n- Prioritize educational value and positive messaging'
    }

    return systemPrompt
  }

  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  getActiveTemplates(): PromptTemplate[] {
    return this.listTemplates().filter(template => template.version.isActive)
  }
}

// Export singleton instance
export const promptTemplateEngine = new PromptTemplateEngine()

// Utility functions for common operations
export function createStoryPrompt(context: PromptContext): {
  systemPrompt: string
  userPrompt: string
} {
  return {
    systemPrompt: promptTemplateEngine.generateSystemPrompt(
      'story-generation-v1',
      context.safetyLevel
    ),
    userPrompt: promptTemplateEngine.generatePrompt(
      'story-generation-v1',
      context
    ),
  }
}

export function createOutlinePrompt(context: PromptContext): {
  systemPrompt: string
  userPrompt: string
} {
  return {
    systemPrompt: promptTemplateEngine.generateSystemPrompt(
      'story-outline-v1',
      context.safetyLevel
    ),
    userPrompt: promptTemplateEngine.generatePrompt(
      'story-outline-v1',
      context
    ),
  }
}

export function createRevisionPrompt(
  context: PromptContext,
  originalStory: string,
  revisionInstructions: string,
  improvementAreas: string[]
): {
  systemPrompt: string
  userPrompt: string
} {
  const extendedContext = {
    ...context,
    customInstructions: `Original Story: ${originalStory}\n\nRevision Instructions: ${revisionInstructions}\n\nImprovement Areas: ${improvementAreas.join(', ')}`,
  }

  return {
    systemPrompt: promptTemplateEngine.generateSystemPrompt(
      'story-revision-v1',
      context.safetyLevel
    ),
    userPrompt: promptTemplateEngine.generatePrompt(
      'story-revision-v1',
      extendedContext
    ),
  }
}
