import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals'
import { CharacterConsistencyService } from '../character-consistency'
import {
  CharacterProfile,
  CharacterTrait,
  ConsistencyScore,
  CharacterPromptTemplate,
  SimilarityAnalysis,
  ConsistencyValidationResult,
  CharacterReference,
  TraitCategory,
  ConsistencyMetrics,
  CharacterVariation,
} from '../types/character-consistency'

describe('CharacterConsistencyService', () => {
  let service: CharacterConsistencyService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new CharacterConsistencyService()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Character Profile Management', () => {
    describe('Character Profile Creation', () => {
      it('should create a comprehensive character profile', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A curious young girl with magical abilities',
          physicalTraits: {
            hair: 'long curly brown hair',
            eyes: 'bright green eyes',
            skin: 'fair skin with freckles',
            height: 'short for her age',
            build: 'petite',
          },
          clothing: {
            style: 'casual magical',
            colors: ['purple', 'silver'],
            accessories: ['star pendant', 'magical wand'],
          },
          personality: {
            traits: ['curious', 'brave', 'kind'],
            expressions: [
              'wide-eyed wonder',
              'determined smile',
              'thoughtful frown',
            ],
          },
        })

        expect(profile.id).toBeDefined()
        expect(profile.name).toBe('Luna')
        expect(profile.age).toBe(8)
        expect(profile.physicalTraits.hair).toBe('long curly brown hair')
        expect(profile.clothing.colors).toContain('purple')
        expect(profile.personality.traits).toContain('curious')
        expect(profile.consistencyScore).toBe(0) // Initial score
        expect(profile.createdAt).toBeInstanceOf(Date)
      })

      it('should validate required character profile fields', () => {
        expect(() =>
          service.createCharacterProfile({
            name: '',
            age: 8,
            description: 'A character',
          })
        ).toThrow('Character name is required')

        expect(() =>
          service.createCharacterProfile({
            name: 'Luna',
            age: -1,
            description: 'A character',
          })
        ).toThrow('Character age must be positive')

        expect(() =>
          service.createCharacterProfile({
            name: 'Luna',
            age: 8,
            description: '',
          })
        ).toThrow('Character description is required')
      })

      it('should generate unique character IDs', () => {
        const profile1 = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'First character',
        })

        const profile2 = service.createCharacterProfile({
          name: 'Max',
          age: 10,
          description: 'Second character',
        })

        expect(profile1.id).not.toBe(profile2.id)
        expect(profile1.id).toMatch(/^char_/)
        expect(profile2.id).toMatch(/^char_/)
      })
    })

    describe('Character Profile Retrieval', () => {
      it('should retrieve character profile by ID', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        const retrieved = service.getCharacterProfile(profile.id)
        expect(retrieved).toEqual(profile)
      })

      it('should return null for non-existent character ID', () => {
        const retrieved = service.getCharacterProfile('non-existent-id')
        expect(retrieved).toBeNull()
      })

      it('should list all character profiles', () => {
        const profile1 = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'First character',
        })

        const profile2 = service.createCharacterProfile({
          name: 'Max',
          age: 10,
          description: 'Second character',
        })

        const allProfiles = service.getAllCharacterProfiles()
        expect(allProfiles).toHaveLength(2)
        expect(allProfiles).toContainEqual(profile1)
        expect(allProfiles).toContainEqual(profile2)
      })
    })

    describe('Character Profile Updates', () => {
      it('should update character profile traits', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        const updated = service.updateCharacterProfile(profile.id, {
          physicalTraits: {
            hair: 'short blonde hair',
            eyes: 'blue eyes',
          },
        })

        expect(updated.physicalTraits.hair).toBe('short blonde hair')
        expect(updated.physicalTraits.eyes).toBe('blue eyes')
        expect(updated.updatedAt).toBeInstanceOf(Date)
        expect(updated.updatedAt.getTime()).toBeGreaterThan(
          updated.createdAt.getTime()
        )
      })

      it('should maintain character profile history', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        service.updateCharacterProfile(profile.id, {
          description: 'A powerful young wizard',
        })

        const history = service.getCharacterProfileHistory(profile.id)
        expect(history).toHaveLength(2) // Original + update
        expect(history[0].description).toBe('A magical girl')
        expect(history[1].description).toBe('A powerful young wizard')
      })
    })
  })

  describe('Prompt Template System', () => {
    describe('Character Prompt Generation', () => {
      it('should generate consistent character prompts', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A curious young girl',
          physicalTraits: {
            hair: 'long curly brown hair',
            eyes: 'bright green eyes',
            skin: 'fair skin with freckles',
          },
          clothing: {
            style: 'casual magical',
            colors: ['purple', 'silver'],
          },
        })

        const prompt = service.generateCharacterPrompt(profile.id, {
          scene: 'reading a book in a library',
          style: 'watercolor',
          mood: 'peaceful',
        })

        expect(prompt).toContain('Luna')
        expect(prompt).toContain('8 year old')
        expect(prompt).toContain('long curly brown hair')
        expect(prompt).toContain('bright green eyes')
        expect(prompt).toContain('fair skin with freckles')
        expect(prompt).toContain('reading a book in a library')
        expect(prompt).toContain('watercolor')
        expect(prompt).toContain('peaceful')
      })

      it('should create character prompt templates', () => {
        const template = service.createCharacterPromptTemplate({
          name: 'portrait_template',
          description: 'Standard character portrait template',
          structure: [
            '{character_description}',
            '{physical_traits}',
            '{clothing_description}',
            '{scene_context}',
            '{style_modifiers}',
            '{quality_enhancers}',
          ],
          requiredFields: ['character_description', 'physical_traits'],
          optionalFields: ['clothing_description', 'scene_context'],
        })

        expect(template.id).toBeDefined()
        expect(template.name).toBe('portrait_template')
        expect(template.structure).toHaveLength(6)
        expect(template.requiredFields).toContain('character_description')
      })

      it('should apply character prompt templates', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A curious young girl',
          physicalTraits: {
            hair: 'brown hair',
            eyes: 'green eyes',
          },
        })

        const template = service.createCharacterPromptTemplate({
          name: 'simple_template',
          structure: [
            '{character_description}',
            '{physical_traits}',
            '{scene_context}',
          ],
          requiredFields: ['character_description'],
        })

        const prompt = service.applyCharacterPromptTemplate(
          template.id,
          profile.id,
          {
            scene_context: 'playing in a garden',
          }
        )

        expect(prompt).toContain('Luna')
        expect(prompt).toContain('curious young girl')
        expect(prompt).toContain('brown hair')
        expect(prompt).toContain('green eyes')
        expect(prompt).toContain('playing in a garden')
      })
    })

    describe('Character Variations', () => {
      it('should generate character variations for different scenes', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        const variations = service.generateCharacterVariations(profile.id, [
          { scene: 'casting a spell', mood: 'focused' },
          { scene: 'laughing with friends', mood: 'joyful' },
          { scene: 'studying ancient books', mood: 'serious' },
        ])

        expect(variations).toHaveLength(3)
        expect(variations[0].prompt).toContain('casting a spell')
        expect(variations[0].prompt).toContain('focused')
        expect(variations[1].prompt).toContain('laughing with friends')
        expect(variations[1].prompt).toContain('joyful')
        expect(variations[2].prompt).toContain('studying ancient books')
        expect(variations[2].prompt).toContain('serious')
      })

      it('should maintain character consistency across variations', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
          physicalTraits: {
            hair: 'curly brown hair',
            eyes: 'green eyes',
          },
        })

        const variations = service.generateCharacterVariations(profile.id, [
          { scene: 'running' },
          { scene: 'sitting' },
          { scene: 'flying' },
        ])

        // All variations should contain consistent character traits
        variations.forEach((variation: CharacterVariation) => {
          expect(variation.prompt).toContain('Luna')
          expect(variation.prompt).toContain('curly brown hair')
          expect(variation.prompt).toContain('green eyes')
          expect(variation.characterId).toBe(profile.id)
        })
      })
    })
  })

  describe('Similarity Analysis', () => {
    describe('Image Similarity Scoring', () => {
      it('should analyze image similarity for character consistency', async () => {
        // Mock image data
        const referenceImage =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
        const testImage =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

        const analysis = await service.analyzeImageSimilarity(
          referenceImage,
          testImage
        )

        expect(analysis.similarityScore).toBeGreaterThanOrEqual(0)
        expect(analysis.similarityScore).toBeLessThanOrEqual(1)
        expect(analysis.faceMatch).toBeDefined()
        expect(analysis.colorSimilarity).toBeDefined()
        expect(analysis.structuralSimilarity).toBeDefined()
        expect(analysis.confidence).toBeGreaterThan(0)
      })

      it('should detect high similarity for identical images', async () => {
        const image =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

        const analysis = await service.analyzeImageSimilarity(image, image)

        expect(analysis.similarityScore).toBeGreaterThan(0.95)
        expect(analysis.faceMatch.score).toBeGreaterThan(0.95)
        expect(analysis.confidence).toBeGreaterThan(0.9)
      })

      it('should provide detailed similarity breakdown', async () => {
        const referenceImage = 'data:image/jpeg;base64,reference'
        const testImage = 'data:image/jpeg;base64,test'

        const analysis = await service.analyzeImageSimilarity(
          referenceImage,
          testImage
        )

        expect(analysis.faceMatch).toHaveProperty('score')
        expect(analysis.faceMatch).toHaveProperty('landmarks')
        expect(analysis.colorSimilarity).toHaveProperty('histogram')
        expect(analysis.colorSimilarity).toHaveProperty('dominantColors')
        expect(analysis.structuralSimilarity).toHaveProperty('edges')
        expect(analysis.structuralSimilarity).toHaveProperty('shapes')
        expect(analysis.metadata).toHaveProperty('processingTime')
      })
    })

    describe('Character Feature Extraction', () => {
      it('should extract character features from images', async () => {
        const imageData =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

        const features = await service.extractCharacterFeatures(imageData)

        expect(features.faceDetection).toBeDefined()
        expect(features.faceDetection.boundingBox).toBeDefined()
        expect(features.faceDetection.landmarks).toBeDefined()
        expect(features.colorAnalysis).toBeDefined()
        expect(features.colorAnalysis.dominantColors).toBeInstanceOf(Array)
        expect(features.poseEstimation).toBeDefined()
        expect(features.clothingDetection).toBeDefined()
        expect(features.confidence).toBeGreaterThan(0)
      })

      it('should handle images without faces gracefully', async () => {
        const landscapeImage = 'data:image/jpeg;base64,landscape'

        const features = await service.extractCharacterFeatures(landscapeImage)

        expect(features.faceDetection.detected).toBe(false)
        expect(features.faceDetection.boundingBox).toBeNull()
        expect(features.colorAnalysis).toBeDefined() // Should still analyze colors
        expect(features.confidence).toBeLessThan(0.5) // Low confidence without face
      })
    })
  })

  describe('Consistency Validation', () => {
    describe('Character Consistency Scoring', () => {
      it('should calculate consistency score for character images', async () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
          physicalTraits: {
            hair: 'brown hair',
            eyes: 'green eyes',
          },
        })

        const referenceImage = 'data:image/jpeg;base64,reference'
        const testImages = [
          'data:image/jpeg;base64,test1',
          'data:image/jpeg;base64,test2',
          'data:image/jpeg;base64,test3',
        ]

        const score = await service.calculateConsistencyScore(
          profile.id,
          referenceImage,
          testImages
        )

        expect(score.overallScore).toBeGreaterThanOrEqual(0)
        expect(score.overallScore).toBeLessThanOrEqual(1)
        expect(score.faceConsistency).toBeDefined()
        expect(score.colorConsistency).toBeDefined()
        expect(score.styleConsistency).toBeDefined()
        expect(score.imageCount).toBe(3)
        expect(score.characterId).toBe(profile.id)
      })

      it('should meet target consistency score of >85%', async () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        // Mock high-quality consistent images
        const referenceImage = 'data:image/jpeg;base64,high_quality_reference'
        const consistentImages = [
          'data:image/jpeg;base64,consistent1',
          'data:image/jpeg;base64,consistent2',
          'data:image/jpeg;base64,consistent3',
        ]

        // Mock the similarity analysis to return high scores
        jest.spyOn(service, 'analyzeImageSimilarity').mockResolvedValue({
          similarityScore: 0.92,
          faceMatch: { score: 0.94, landmarks: [], confidence: 0.95 },
          colorSimilarity: { histogram: 0.89, dominantColors: [] },
          structuralSimilarity: { edges: 0.91, shapes: 0.88 },
          confidence: 0.93,
          metadata: { processingTime: 150 },
        })

        const score = await service.calculateConsistencyScore(
          profile.id,
          referenceImage,
          consistentImages
        )

        expect(score.overallScore).toBeGreaterThan(0.85) // Target: >85%
        expect(score.meetsTarget).toBe(true)
      })

      it('should provide detailed consistency breakdown', async () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        const referenceImage = 'data:image/jpeg;base64,reference'
        const testImages = ['data:image/jpeg;base64,test']

        const score = await service.calculateConsistencyScore(
          profile.id,
          referenceImage,
          testImages
        )

        expect(score.breakdown).toBeDefined()
        expect(score.breakdown.faceMatching).toBeDefined()
        expect(score.breakdown.colorConsistency).toBeDefined()
        expect(score.breakdown.poseVariation).toBeDefined()
        expect(score.breakdown.clothingConsistency).toBeDefined()
        expect(score.recommendations).toBeInstanceOf(Array)
      })
    })

    describe('Consistency Validation Results', () => {
      it('should validate character consistency across multiple images', async () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        const images = [
          'data:image/jpeg;base64,img1',
          'data:image/jpeg;base64,img2',
          'data:image/jpeg;base64,img3',
          'data:image/jpeg;base64,img4',
        ]

        const validation = await service.validateCharacterConsistency(
          profile.id,
          images
        )

        expect(validation.characterId).toBe(profile.id)
        expect(validation.totalImages).toBe(4)
        expect(validation.consistencyScore).toBeGreaterThanOrEqual(0)
        expect(validation.consistencyScore).toBeLessThanOrEqual(1)
        expect(validation.passesThreshold).toBeDefined()
        expect(validation.inconsistentImages).toBeInstanceOf(Array)
        expect(validation.recommendations).toBeInstanceOf(Array)
      })

      it('should identify inconsistent images', async () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        const images = [
          'data:image/jpeg;base64,consistent1',
          'data:image/jpeg;base64,consistent2',
          'data:image/jpeg;base64,inconsistent', // This should be flagged
          'data:image/jpeg;base64,consistent3',
        ]

        // Mock mixed similarity results
        jest
          .spyOn(service, 'analyzeImageSimilarity')
          .mockResolvedValueOnce({
            similarityScore: 0.92,
            faceMatch: { score: 0.94 },
            colorSimilarity: {},
            structuralSimilarity: {},
            confidence: 0.93,
            metadata: {},
          } as any)
          .mockResolvedValueOnce({
            similarityScore: 0.89,
            faceMatch: { score: 0.91 },
            colorSimilarity: {},
            structuralSimilarity: {},
            confidence: 0.9,
            metadata: {},
          } as any)
          .mockResolvedValueOnce({
            similarityScore: 0.45,
            faceMatch: { score: 0.32 },
            colorSimilarity: {},
            structuralSimilarity: {},
            confidence: 0.4,
            metadata: {},
          } as any)
          .mockResolvedValueOnce({
            similarityScore: 0.88,
            faceMatch: { score: 0.9 },
            colorSimilarity: {},
            structuralSimilarity: {},
            confidence: 0.89,
            metadata: {},
          } as any)

        const validation = await service.validateCharacterConsistency(
          profile.id,
          images
        )

        expect(validation.inconsistentImages).toHaveLength(1)
        expect(validation.inconsistentImages[0].imageIndex).toBe(2)
        expect(validation.inconsistentImages[0].similarityScore).toBeLessThan(
          0.7
        )
      })
    })
  })

  describe('Performance and Metrics', () => {
    describe('Consistency Metrics Tracking', () => {
      it('should track character consistency metrics', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        // Simulate consistency scoring
        service.recordConsistencyMetric(profile.id, {
          score: 0.89,
          imageCount: 5,
          processingTime: 2500,
          timestamp: new Date(),
        })

        const metrics = service.getConsistencyMetrics(profile.id)

        expect(metrics.characterId).toBe(profile.id)
        expect(metrics.averageScore).toBe(0.89)
        expect(metrics.totalValidations).toBe(1)
        expect(metrics.averageProcessingTime).toBe(2500)
        expect(metrics.scoreHistory).toHaveLength(1)
      })

      it('should calculate performance statistics', () => {
        const profile = service.createCharacterProfile({
          name: 'Luna',
          age: 8,
          description: 'A magical girl',
        })

        // Record multiple metrics
        service.recordConsistencyMetric(profile.id, {
          score: 0.85,
          imageCount: 3,
          processingTime: 1500,
          timestamp: new Date(),
        })
        service.recordConsistencyMetric(profile.id, {
          score: 0.92,
          imageCount: 4,
          processingTime: 2000,
          timestamp: new Date(),
        })
        service.recordConsistencyMetric(profile.id, {
          score: 0.88,
          imageCount: 5,
          processingTime: 2500,
          timestamp: new Date(),
        })

        const metrics = service.getConsistencyMetrics(profile.id)

        expect(metrics.averageScore).toBeCloseTo(0.883, 2)
        expect(metrics.totalValidations).toBe(3)
        expect(metrics.averageProcessingTime).toBeCloseTo(2000, 0)
        expect(metrics.scoreHistory).toHaveLength(3)
        expect(metrics.trend).toBeDefined() // 'improving', 'declining', or 'stable'
      })
    })

    describe('Batch Processing', () => {
      it('should handle batch character consistency validation', async () => {
        const profiles = [
          service.createCharacterProfile({
            name: 'Luna',
            age: 8,
            description: 'Magical girl',
          }),
          service.createCharacterProfile({
            name: 'Max',
            age: 10,
            description: 'Brave boy',
          }),
        ]

        const batchRequest = {
          validations: [
            {
              characterId: profiles[0].id,
              images: [
                'data:image/jpeg;base64,luna1',
                'data:image/jpeg;base64,luna2',
              ],
            },
            {
              characterId: profiles[1].id,
              images: [
                'data:image/jpeg;base64,max1',
                'data:image/jpeg;base64,max2',
              ],
            },
          ],
        }

        const results = await service.batchValidateConsistency(batchRequest)

        expect(results.results).toHaveLength(2)
        expect(results.summary.totalCharacters).toBe(2)
        expect(results.summary.averageScore).toBeGreaterThanOrEqual(0)
        expect(results.summary.processingTime).toBeGreaterThan(0)
        expect(results.results[0].characterId).toBe(profiles[0].id)
        expect(results.results[1].characterId).toBe(profiles[1].id)
      })
    })
  })
})
