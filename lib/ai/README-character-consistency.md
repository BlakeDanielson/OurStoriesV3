# Character Consistency Service

A comprehensive TypeScript service for maintaining visual consistency of characters across multiple AI-generated images using prompt-based techniques and advanced similarity analysis.

## Overview

The Character Consistency Service provides a production-ready solution for ensuring character continuity in AI-generated stories and content. Instead of relying on complex LoRA training, it leverages modern AI model capabilities through sophisticated prompt engineering and computer vision analysis.

## Key Features

- **Character Profile Management**: Comprehensive character trait tracking and versioning
- **Prompt Template System**: Standardized character generation with consistency optimization
- **Advanced Similarity Analysis**: Face, color, and structural matching algorithms
- **Consistency Scoring**: Automated validation with >85% accuracy target
- **Batch Processing**: Efficient multi-character validation
- **Performance Metrics**: Real-time tracking and optimization insights
- **TypeScript Support**: Full type safety and IntelliSense support

## Installation

```typescript
import { CharacterConsistencyService } from '@/lib/ai/character-consistency'
import type {
  CharacterProfile,
  ConsistencyScore,
  CharacterPromptContext,
} from '@/lib/ai/types/character-consistency'
```

## Quick Start

```typescript
// Initialize the service
const consistencyService = new CharacterConsistencyService({
  consistencyThreshold: 0.85, // 85% consistency target
  maxProfileHistory: 10,
  enableMetrics: true,
})

// Create a character profile
const character = consistencyService.createCharacterProfile({
  name: 'Luna',
  age: 8,
  description: 'A brave young girl with magical abilities',
  physicalTraits: {
    hairColor: 'silver',
    hairStyle: 'long and wavy',
    eyeColor: 'bright blue',
    skinTone: 'fair',
    height: 'average for age',
    build: 'slim',
  },
  clothing: {
    style: 'magical girl outfit',
    colors: ['purple', 'silver'],
    accessories: ['star pendant', 'magical wand'],
  },
  personality: ['brave', 'kind', 'curious', 'determined'],
})

// Generate consistent prompts
const prompt = consistencyService.generateCharacterPrompt(character.id, {
  scene: 'magical forest',
  pose: 'standing confidently',
  emotion: 'determined',
  lighting: 'soft magical glow',
  artStyle: 'anime',
})

// Validate consistency across images
const images = [
  'data:image/jpeg;base64,reference_image',
  'data:image/jpeg;base64,test_image_1',
  'data:image/jpeg;base64,test_image_2',
]

const validation = await consistencyService.validateCharacterConsistency(
  character.id,
  images
)

console.log(`Consistency Score: ${validation.consistencyScore * 100}%`)
console.log(`Passes Threshold: ${validation.passesThreshold}`)
```

## API Reference

### CharacterConsistencyService

#### Constructor

```typescript
constructor(config?: Partial<CharacterConsistencyConfig>)
```

**Parameters:**

- `config` (optional): Configuration options
  - `consistencyThreshold`: Minimum consistency score (default: 0.85)
  - `maxProfileHistory`: Maximum profile versions to keep (default: 10)
  - `enableMetrics`: Enable performance tracking (default: true)
  - `defaultArtStyle`: Default art style for prompts (default: 'digital art')

#### Character Profile Management

##### createCharacterProfile()

```typescript
createCharacterProfile(input: CharacterProfileInput): CharacterProfile
```

Creates a new character profile with comprehensive trait tracking.

**Parameters:**

- `input.name`: Character name (required)
- `input.age`: Character age (required)
- `input.description`: Character description (required)
- `input.physicalTraits`: Physical appearance details
- `input.clothing`: Clothing and accessories
- `input.personality`: Personality traits array

**Returns:** Complete character profile with unique ID

##### getCharacterProfile()

```typescript
getCharacterProfile(id: string): CharacterProfile | null
```

Retrieves a character profile by ID.

##### updateCharacterProfile()

```typescript
updateCharacterProfile(id: string, updates: CharacterProfileUpdate): CharacterProfile
```

Updates character profile with version history tracking.

#### Prompt Generation

##### generateCharacterPrompt()

```typescript
generateCharacterPrompt(characterId: string, context: CharacterPromptContext): string
```

Generates a consistency-optimized prompt for character image generation.

**Parameters:**

- `characterId`: Character profile ID
- `context`: Scene and generation context
  - `scene`: Scene description
  - `pose`: Character pose
  - `emotion`: Emotional expression
  - `lighting`: Lighting conditions
  - `artStyle`: Art style preference
  - `additionalDetails`: Extra prompt elements

**Returns:** Optimized prompt string

##### createCharacterPromptTemplate()

```typescript
createCharacterPromptTemplate(input: CharacterPromptTemplateInput): CharacterPromptTemplate
```

Creates reusable prompt templates for consistent character generation.

#### Consistency Analysis

##### analyzeImageSimilarity()

```typescript
async analyzeImageSimilarity(referenceImage: string, testImage: string): Promise<SimilarityAnalysis>
```

Performs detailed similarity analysis between two images.

**Returns:**

- `similarityScore`: Overall similarity (0-1)
- `faceMatch`: Facial feature comparison
- `colorSimilarity`: Color palette analysis
- `structuralSimilarity`: Shape and composition analysis
- `confidence`: Analysis confidence level

##### calculateConsistencyScore()

```typescript
async calculateConsistencyScore(
  characterId: string,
  referenceImage: string,
  testImages: string[]
): Promise<ConsistencyScore>
```

Calculates comprehensive consistency score for character images.

**Returns:**

- `overallScore`: Weighted consistency score
- `faceConsistency`: Facial feature consistency
- `colorConsistency`: Color palette consistency
- `styleConsistency`: Art style consistency
- `meetsTarget`: Whether score meets threshold
- `breakdown`: Detailed analysis breakdown
- `recommendations`: Improvement suggestions

##### validateCharacterConsistency()

```typescript
async validateCharacterConsistency(
  characterId: string,
  images: string[]
): Promise<ConsistencyValidationResult>
```

Validates character consistency across multiple images.

**Returns:**

- `consistencyScore`: Overall consistency score
- `passesThreshold`: Validation result
- `inconsistentImages`: Flagged problematic images
- `recommendations`: Improvement suggestions

#### Batch Processing

##### batchValidateConsistency()

```typescript
async batchValidateConsistency(
  request: BatchConsistencyRequest
): Promise<BatchConsistencyResult>
```

Processes multiple character validations efficiently.

#### Performance Metrics

##### recordConsistencyMetric()

```typescript
recordConsistencyMetric(
  characterId: string,
  entry: Omit<ConsistencyScoreEntry, 'timestamp'>
): void
```

Records performance metrics for analysis.

##### getConsistencyMetrics()

```typescript
getConsistencyMetrics(characterId: string): ConsistencyMetrics
```

Retrieves performance statistics for a character.

## Usage Examples

### Basic Character Creation and Validation

```typescript
const service = new CharacterConsistencyService()

// Create character
const hero = service.createCharacterProfile({
  name: 'Alex',
  age: 12,
  description: 'Adventurous young explorer',
  physicalTraits: {
    hairColor: 'brown',
    hairStyle: 'messy',
    eyeColor: 'green',
    skinTone: 'medium',
    height: 'tall for age',
    build: 'athletic',
  },
  clothing: {
    style: 'adventure gear',
    colors: ['khaki', 'brown'],
    accessories: ['backpack', 'compass'],
  },
})

// Generate scene-specific prompts
const contexts = [
  { scene: 'mountain peak', pose: 'pointing ahead', emotion: 'excited' },
  { scene: 'forest clearing', pose: 'examining map', emotion: 'focused' },
  { scene: 'cave entrance', pose: 'holding torch', emotion: 'cautious' },
]

const prompts = contexts.map(context =>
  service.generateCharacterPrompt(hero.id, context)
)

// After generating images, validate consistency
const generatedImages = [
  'data:image/jpeg;base64,mountain_scene',
  'data:image/jpeg;base64,forest_scene',
  'data:image/jpeg;base64,cave_scene',
]

const validation = await service.validateCharacterConsistency(
  hero.id,
  generatedImages
)

if (validation.passesThreshold) {
  console.log('✅ Character consistency validated!')
} else {
  console.log('❌ Consistency issues detected:')
  validation.inconsistentImages.forEach(issue => {
    console.log(`Image ${issue.imageIndex}: ${issue.issues.join(', ')}`)
  })
}
```

### Advanced Template Usage

```typescript
// Create reusable template
const actionTemplate = service.createCharacterPromptTemplate({
  name: 'Action Scene Template',
  description: 'Template for dynamic action scenes',
  basePrompt:
    '{character_description}, {action_pose}, dynamic composition, motion blur effects',
  styleModifiers: ['cinematic lighting', 'high contrast', 'dramatic shadows'],
  qualityEnhancers: ['8k resolution', 'professional photography'],
  variableSlots: ['action_pose', 'environment', 'lighting_mood'],
  artStyle: 'realistic',
  targetAudience: 'children',
})

// Apply template to character
const actionPrompt = service.applyCharacterPromptTemplate(
  actionTemplate.id,
  hero.id,
  {
    action_pose: 'leaping across chasm',
    environment: 'ancient ruins',
    lighting_mood: 'golden hour',
  }
)
```

### Batch Processing Multiple Characters

```typescript
const characters = [
  service.createCharacterProfile({
    name: 'Luna',
    age: 8,
    description: 'Magical girl',
  }),
  service.createCharacterProfile({
    name: 'Max',
    age: 10,
    description: 'Tech genius',
  }),
  service.createCharacterProfile({
    name: 'Zara',
    age: 9,
    description: 'Nature lover',
  }),
]

const batchRequest = {
  validations: characters.map(char => ({
    characterId: char.id,
    images: [
      `data:image/jpeg;base64,${char.name.toLowerCase()}_ref`,
      `data:image/jpeg;base64,${char.name.toLowerCase()}_test1`,
      `data:image/jpeg;base64,${char.name.toLowerCase()}_test2`,
    ],
  })),
}

const batchResults = await service.batchValidateConsistency(batchRequest)

console.log(`Batch Summary:`)
console.log(`- Characters processed: ${batchResults.summary.totalCharacters}`)
console.log(
  `- Average consistency: ${(batchResults.summary.averageScore * 100).toFixed(1)}%`
)
console.log(`- Pass rate: ${(batchResults.summary.passRate * 100).toFixed(1)}%`)
console.log(`- Processing time: ${batchResults.summary.processingTime}ms`)
```

### Performance Monitoring

```typescript
// Record custom metrics
service.recordConsistencyMetric(hero.id, {
  score: 0.92,
  imageCount: 5,
  processingTime: 2500,
})

// Get performance insights
const metrics = service.getConsistencyMetrics(hero.id)

console.log(`Character Performance Report:`)
console.log(`- Average Score: ${(metrics.averageScore * 100).toFixed(1)}%`)
console.log(`- Total Validations: ${metrics.totalValidations}`)
console.log(`- Average Processing Time: ${metrics.averageProcessingTime}ms`)
console.log(`- Trend: ${metrics.trend}`)
```

## Configuration Options

### CharacterConsistencyConfig

```typescript
interface CharacterConsistencyConfig {
  consistencyThreshold: number // Minimum consistency score (0-1)
  maxProfileHistory: number // Profile version history limit
  enableMetrics: boolean // Enable performance tracking
  defaultArtStyle: string // Default art style for prompts
  similarityWeights: {
    // Similarity analysis weights
    face: number // Facial feature importance
    color: number // Color consistency importance
    structure: number // Structural similarity importance
  }
  promptOptimization: {
    // Prompt generation settings
    maxLength: number // Maximum prompt length
    includeNegativePrompts: boolean // Include negative prompts
    styleConsistency: boolean // Enforce style consistency
  }
}
```

### Default Configuration

```typescript
const defaultConfig: CharacterConsistencyConfig = {
  consistencyThreshold: 0.85,
  maxProfileHistory: 10,
  enableMetrics: true,
  defaultArtStyle: 'digital art',
  similarityWeights: {
    face: 0.5,
    color: 0.3,
    structure: 0.2,
  },
  promptOptimization: {
    maxLength: 500,
    includeNegativePrompts: false,
    styleConsistency: true,
  },
}
```

## Performance Characteristics

### Consistency Scoring

- **Target Accuracy**: >85% consistency score
- **Processing Time**: <30 seconds per validation
- **Batch Efficiency**: Multiple characters processed simultaneously
- **Memory Usage**: Optimized with map-based storage and cleanup

### Similarity Analysis

- **Face Detection**: Advanced facial landmark analysis
- **Color Matching**: Histogram and dominant color comparison
- **Structural Analysis**: Edge detection and shape matching
- **Confidence Scoring**: Reliability assessment for each analysis

### Prompt Generation

- **Template Caching**: Reusable templates for performance
- **Context Optimization**: Scene-aware prompt enhancement
- **Style Consistency**: Maintained across character variations
- **Length Optimization**: Balanced detail vs. token efficiency

## Error Handling

The service includes comprehensive error handling for common scenarios:

```typescript
try {
  const validation = await service.validateCharacterConsistency(
    characterId,
    images
  )
} catch (error) {
  if (error.message.includes('At least 2 images required')) {
    // Handle insufficient images
  } else if (error.message.includes('Character not found')) {
    // Handle missing character profile
  } else {
    // Handle other validation errors
  }
}
```

## Integration with Other Services

### Image Generation Service

```typescript
import { ImageGenerationService } from '@/lib/ai/image-generation';

const imageService = new ImageGenerationService();
const consistencyService = new CharacterConsistencyService();

// Generate character images with consistency
const character = consistencyService.createCharacterProfile({...});
const prompt = consistencyService.generateCharacterPrompt(character.id, context);

const generatedImage = await imageService.generateImage({
  prompt,
  model: 'flux-1-dev',
  width: 1024,
  height: 1024
});

// Validate consistency
const validation = await consistencyService.validateCharacterConsistency(
  character.id,
  [referenceImage, generatedImage.imageUrl]
);
```

### Prompt Engineering Service

```typescript
import { PromptEngineeringService } from '@/lib/ai/prompt-engineering'

const promptService = new PromptEngineeringService()
const consistencyService = new CharacterConsistencyService()

// Enhance character prompts with style optimization
const basePrompt = consistencyService.generateCharacterPrompt(
  characterId,
  context
)
const enhancedPrompt = await promptService.optimizePrompt(basePrompt, {
  style: 'anime',
  targetAudience: 'children',
  qualityLevel: 'high',
})
```

## Testing

The service includes comprehensive test coverage with 26 test cases covering:

- Character profile management (8 tests)
- Prompt template system (5 tests)
- Similarity analysis (5 tests)
- Consistency validation (5 tests)
- Performance and metrics (3 tests)

Run tests with:

```bash
npm test lib/ai/__tests__/character-consistency.test.ts
```

## Best Practices

### Character Profile Creation

1. **Detailed Descriptions**: Provide comprehensive physical traits and clothing details
2. **Consistent Naming**: Use clear, descriptive names for easy identification
3. **Age-Appropriate Content**: Ensure all character details are suitable for target audience
4. **Version Control**: Leverage profile history for iterative improvements

### Prompt Generation

1. **Context Specificity**: Provide detailed scene and emotion context
2. **Style Consistency**: Maintain consistent art style across character variations
3. **Template Reuse**: Create templates for common scene types
4. **Quality Enhancement**: Use appropriate quality modifiers for target output

### Consistency Validation

1. **Reference Quality**: Use high-quality reference images for best results
2. **Batch Processing**: Process multiple characters together for efficiency
3. **Threshold Tuning**: Adjust consistency thresholds based on use case requirements
4. **Iterative Improvement**: Use validation feedback to refine character profiles

### Performance Optimization

1. **Metric Tracking**: Monitor performance trends for optimization opportunities
2. **Caching**: Leverage template and profile caching for repeated operations
3. **Batch Operations**: Use batch processing for multiple character validations
4. **Resource Management**: Clean up unused profiles and metrics periodically

## Troubleshooting

### Common Issues

**Low Consistency Scores**

- Verify character profile completeness
- Check reference image quality
- Review prompt template effectiveness
- Adjust similarity analysis weights

**Slow Processing**

- Use batch processing for multiple validations
- Optimize image sizes before analysis
- Enable caching for repeated operations
- Monitor memory usage and cleanup

**Template Application Errors**

- Verify template variable slots match context
- Check character profile compatibility
- Validate template syntax and structure
- Review art style consistency

## License

This service is part of the ourStories project and follows the project's licensing terms.

## Contributing

When contributing to the Character Consistency Service:

1. Maintain comprehensive test coverage
2. Follow TypeScript best practices
3. Update documentation for API changes
4. Consider performance implications
5. Ensure age-appropriate content handling

For detailed contribution guidelines, see the project's main README.
