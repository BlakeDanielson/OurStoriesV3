import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals'
import { PromptEngineeringService } from '../prompt-engineering'
import {
  StyleTemplate,
  CompositionRule,
  QualityEnhancer,
  PromptOptimizationRequest,
  PromptOptimizationResult,
  ABTestConfig,
  ABTestResult,
  StyleCategory,
  AgeGroup,
  ContentType,
} from '../types/prompt-engineering'

describe('PromptEngineeringService', () => {
  let service: PromptEngineeringService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new PromptEngineeringService()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Style Template System', () => {
    describe('Style Template Management', () => {
      it('should load default style templates', () => {
        const templates = service.getAvailableStyles()

        expect(templates).toContain('watercolor')
        expect(templates).toContain('oil_painting')
        expect(templates).toContain('digital_art')
        expect(templates).toContain('cartoon')
        expect(templates).toContain('realistic')
        expect(templates).toContain('sketch')
        expect(templates).toContain('anime')
        expect(templates).toContain('vintage_illustration')
        expect(templates).toContain('minimalist')
        expect(templates).toContain('fantasy_art')
      })

      it('should retrieve specific style template details', () => {
        const watercolorTemplate = service.getStyleTemplate('watercolor')

        expect(watercolorTemplate).toBeDefined()
        expect(watercolorTemplate.name).toBe('watercolor')
        expect(watercolorTemplate.category).toBe('traditional')
        expect(watercolorTemplate.description).toContain('watercolor')
        expect(watercolorTemplate.styleModifiers).toBeInstanceOf(Array)
        expect(watercolorTemplate.negativePrompts).toBeInstanceOf(Array)
        expect(watercolorTemplate.qualityEnhancers).toBeInstanceOf(Array)
      })

      it('should handle invalid style template requests', () => {
        const invalidTemplate = service.getStyleTemplate('nonexistent_style')
        expect(invalidTemplate).toBeNull()
      })

      it('should filter styles by category', () => {
        const traditionalStyles = service.getStylesByCategory('traditional')
        const digitalStyles = service.getStylesByCategory('digital')

        expect(traditionalStyles).toContain('watercolor')
        expect(traditionalStyles).toContain('oil_painting')
        expect(digitalStyles).toContain('digital_art')
        expect(digitalStyles).toContain('anime')
      })

      it('should filter styles by age appropriateness', () => {
        const childStyles = service.getStylesForAgeGroup('child')
        const teenStyles = service.getStylesForAgeGroup('teen')

        expect(childStyles).toContain('cartoon')
        expect(childStyles).toContain('watercolor')
        expect(teenStyles).toContain('anime')
        expect(teenStyles).toContain('digital_art')
      })
    })

    describe('Prompt Template Application', () => {
      it('should apply style modifiers to base prompt', () => {
        const basePrompt = 'A happy child reading a book'
        const styledPrompt = service.applyStyleTemplate(
          basePrompt,
          'watercolor'
        )

        expect(styledPrompt).toContain(basePrompt)
        expect(styledPrompt).toContain('watercolor')
        expect(styledPrompt).toContain('soft brushstrokes')
        expect(styledPrompt).toContain('translucent colors')
      })

      it('should apply composition rules for different content types', () => {
        const basePrompt = 'A magical forest scene'
        const portraitPrompt = service.applyCompositionRules(
          basePrompt,
          'portrait'
        )
        const landscapePrompt = service.applyCompositionRules(
          basePrompt,
          'landscape'
        )

        expect(portraitPrompt).toContain('centered composition')
        expect(landscapePrompt).toContain('wide angle')
        expect(landscapePrompt).toContain('depth of field')
      })

      it('should apply quality enhancers appropriately', () => {
        const basePrompt = 'A character illustration'
        const enhancedPrompt = service.applyQualityEnhancers(basePrompt, [
          'high_detail',
          'professional_lighting',
          'sharp_focus',
        ])

        expect(enhancedPrompt).toContain('high detail')
        expect(enhancedPrompt).toContain('professional lighting')
        expect(enhancedPrompt).toContain('sharp focus')
        expect(enhancedPrompt).toContain('masterpiece')
      })

      it('should combine style, composition, and quality enhancers', () => {
        const request: PromptOptimizationRequest = {
          basePrompt: 'A young wizard casting a spell',
          style: 'fantasy_art',
          contentType: 'character',
          ageGroup: 'child',
          qualityEnhancers: ['high_detail', 'cinematic'],
          customModifiers: ['magical aura', 'sparkles'],
        }

        const optimizedPrompt = service.optimizePrompt(request)

        expect(optimizedPrompt.enhancedPrompt).toContain(
          'young wizard casting a spell'
        )
        expect(optimizedPrompt.enhancedPrompt).toContain('fantasy art')
        expect(optimizedPrompt.enhancedPrompt).toContain('high detail')
        expect(optimizedPrompt.enhancedPrompt).toContain('magical aura')
        expect(optimizedPrompt.negativePrompt).toBe('')
        expect(optimizedPrompt.styleMetadata.style).toBe('fantasy_art')
      })
    })

    describe('Age-Appropriate Content Filtering', () => {
      it('should apply child-safe modifiers for young age groups', () => {
        const request: PromptOptimizationRequest = {
          basePrompt: 'A brave knight on an adventure',
          style: 'cartoon',
          ageGroup: 'child',
          contentType: 'character',
        }

        const result = service.optimizePrompt(request)

        expect(result.negativePrompt).toBe('')
        expect(result.enhancedPrompt).toContain('friendly')
        expect(result.enhancedPrompt).toContain('wholesome')
        expect(result.enhancedPrompt).toContain('safe for children')
      })

      it('should allow more mature themes for teen age group', () => {
        const request: PromptOptimizationRequest = {
          basePrompt: 'A mysterious detective solving a case',
          style: 'realistic',
          ageGroup: 'teen',
          contentType: 'character',
        }

        const result = service.optimizePrompt(request)

        expect(result.negativePrompt).toBe('')
        expect(result.enhancedPrompt).toContain('detective')
        expect(result.styleMetadata.ageGroup).toBe('teen')
      })

      it('should handle adult content appropriately', () => {
        const request: PromptOptimizationRequest = {
          basePrompt: 'A sophisticated business meeting',
          style: 'realistic',
          ageGroup: 'adult',
          contentType: 'scene',
        }

        const result = service.optimizePrompt(request)

        expect(result.enhancedPrompt).toContain('sophisticated')
        expect(result.enhancedPrompt).toContain('business meeting')
        expect(result.negativePrompt).toBe('')
        expect(result.styleMetadata.ageGroup).toBe('adult')
      })
    })
  })

  describe('Composition Rules System', () => {
    describe('Content Type Composition', () => {
      it('should apply portrait composition rules', () => {
        const rules = service.getCompositionRules('portrait')

        expect(rules.framing).toContain('close-up')
        expect(rules.lighting).toContain('soft lighting')
        expect(rules.perspective).toContain('eye level')
        expect(rules.focusPoints).toContain('eyes')
      })

      it('should apply landscape composition rules', () => {
        const rules = service.getCompositionRules('landscape')

        expect(rules.framing).toContain('wide shot')
        expect(rules.perspective).toContain('horizon line')
        expect(rules.depthElements).toContain('foreground')
        expect(rules.depthElements).toContain('background')
      })

      it('should apply character composition rules', () => {
        const rules = service.getCompositionRules('character')

        expect(rules.framing).toContain('full body')
        expect(rules.pose).toContain('dynamic')
        expect(rules.lighting).toContain('character lighting')
      })

      it('should apply scene composition rules', () => {
        const rules = service.getCompositionRules('scene')

        expect(rules.framing).toContain('establishing shot')
        expect(rules.elements).toContain('environmental storytelling')
        expect(rules.perspective).toContain('rule of thirds')
      })
    })

    describe('Dynamic Composition Adjustment', () => {
      it('should adjust composition based on style and content type', () => {
        const cartoonPortrait = service.getOptimalComposition(
          'cartoon',
          'portrait'
        )
        const realisticPortrait = service.getOptimalComposition(
          'realistic',
          'portrait'
        )

        expect(cartoonPortrait.exaggeration).toBe('high')
        expect(realisticPortrait.exaggeration).toBe('low')
        expect(cartoonPortrait.colorSaturation).toBe('vibrant')
        expect(realisticPortrait.colorSaturation).toBe('natural')
      })

      it('should provide composition suggestions for complex scenes', () => {
        const suggestions = service.getCompositionSuggestions(
          'fantasy_art',
          'scene',
          'child'
        )

        expect(suggestions).toContain('magical elements in foreground')
        expect(suggestions).toContain('bright, inviting colors')
        expect(suggestions).toContain('clear focal point')
        expect(suggestions.length).toBeGreaterThan(3)
      })
    })
  })

  describe('Quality Enhancement System', () => {
    describe('Quality Enhancer Categories', () => {
      it('should categorize quality enhancers correctly', () => {
        const technicalEnhancers =
          service.getQualityEnhancersByCategory('technical')
        const artisticEnhancers =
          service.getQualityEnhancersByCategory('artistic')
        const lightingEnhancers =
          service.getQualityEnhancersByCategory('lighting')

        expect(technicalEnhancers).toContain('high_detail')
        expect(technicalEnhancers).toContain('sharp_focus')
        expect(artisticEnhancers).toContain('masterpiece')
        expect(lightingEnhancers).toContain('professional_lighting')
      })

      it('should provide enhancer descriptions and impact scores', () => {
        const enhancer = service.getQualityEnhancerDetails('high_detail')

        expect(enhancer.name).toBe('high_detail')
        expect(enhancer.description).toContain('detail')
        expect(enhancer.impactScore).toBeGreaterThan(0)
        expect(enhancer.impactScore).toBeLessThanOrEqual(10)
        expect(enhancer.category).toBe('technical')
      })
    })

    describe('Smart Quality Enhancement', () => {
      it('should recommend optimal enhancers for style and content type', () => {
        const recommendations = service.recommendQualityEnhancers(
          'realistic',
          'portrait'
        )

        expect(recommendations).toContain('professional_lighting')
        expect(recommendations).toContain('sharp_focus')
        expect(recommendations.length).toBeLessThanOrEqual(5) // Avoid over-enhancement
      })

      it('should avoid conflicting enhancers', () => {
        const enhancers = ['sharp_focus', 'soft_focus', 'high_detail']
        const filtered = service.filterConflictingEnhancers(enhancers)

        expect(filtered).not.toContain('soft_focus') // Should remove conflicting enhancer
        expect(filtered).toContain('sharp_focus')
        expect(filtered).toContain('high_detail')
      })

      it('should balance enhancement intensity', () => {
        const lightEnhancement = service.applyEnhancementIntensity(
          ['high_detail'],
          'light'
        )
        const heavyEnhancement = service.applyEnhancementIntensity(
          ['high_detail'],
          'heavy'
        )

        expect(lightEnhancement).toContain('detailed')
        expect(heavyEnhancement).toContain('extremely detailed')
        expect(heavyEnhancement).toContain('intricate')
      })
    })
  })

  describe('A/B Testing Framework', () => {
    describe('Test Configuration', () => {
      it('should create A/B test configurations', () => {
        const config: ABTestConfig = {
          testName: 'style_comparison_test',
          variants: [
            {
              name: 'watercolor_variant',
              promptModifications: {
                style: 'watercolor',
                qualityEnhancers: ['soft_lighting'],
              },
            },
            {
              name: 'digital_art_variant',
              promptModifications: {
                style: 'digital_art',
                qualityEnhancers: ['sharp_focus'],
              },
            },
          ],
          trafficSplit: [50, 50],
          successMetrics: ['user_rating', 'generation_time', 'cost'],
        }

        const test = service.createABTest(config)

        expect(test.id).toBeDefined()
        expect(test.status).toBe('active')
        expect(test.variants).toHaveLength(2)
        expect(test.trafficSplit).toEqual([50, 50])
      })

      it('should validate A/B test configurations', () => {
        const invalidConfig: ABTestConfig = {
          testName: 'invalid_test',
          variants: [],
          trafficSplit: [100], // Mismatch with variants
          successMetrics: [],
        }

        expect(() => service.createABTest(invalidConfig)).toThrow(
          'Invalid test configuration'
        )
      })
    })

    describe('Test Execution', () => {
      it('should select variant based on traffic split', () => {
        // First create a test
        const config: ABTestConfig = {
          testName: 'variant_selection_test',
          variants: [
            {
              name: 'watercolor_variant',
              promptModifications: { style: 'watercolor' },
            },
            {
              name: 'digital_art_variant',
              promptModifications: { style: 'digital_art' },
            },
          ],
          trafficSplit: [50, 50],
          successMetrics: ['user_rating'],
        }

        const test = service.createABTest(config)
        const testId = test.id
        const userId = 'user_456'

        // Mock consistent variant selection
        const variant1 = service.selectVariantForUser(testId, userId)
        const variant2 = service.selectVariantForUser(testId, userId)

        expect(variant1).toBe(variant2) // Should be consistent for same user
        expect(['watercolor_variant', 'digital_art_variant']).toContain(
          variant1
        )
      })

      it('should apply variant modifications to prompts', () => {
        // First create a test with the variant
        const config: ABTestConfig = {
          testName: 'modification_test',
          variants: [
            {
              name: 'watercolor_variant',
              promptModifications: {
                style: 'watercolor',
                qualityEnhancers: ['soft_lighting'],
              },
            },
          ],
          trafficSplit: [100],
          successMetrics: ['user_rating'],
        }

        service.createABTest(config)

        const baseRequest: PromptOptimizationRequest = {
          basePrompt: 'A beautiful landscape',
          style: 'realistic',
          contentType: 'landscape',
        }

        const variantRequest = service.applyVariantModifications(
          baseRequest,
          'watercolor_variant'
        )

        expect(variantRequest.style).toBe('watercolor')
        expect(variantRequest.qualityEnhancers).toContain('soft_lighting')
      })
    })

    describe('Results Analysis', () => {
      it('should track test results and metrics', () => {
        const testId = 'test_123'
        const result: ABTestResult = {
          testId,
          variant: 'watercolor_variant',
          userId: 'user_456',
          metrics: {
            user_rating: 4.5,
            generation_time: 25.3,
            cost: 0.032,
          },
          timestamp: new Date(),
        }

        service.recordTestResult(result)
        const results = service.getTestResults(testId)

        expect(results).toHaveLength(1)
        expect(results[0].variant).toBe('watercolor_variant')
        expect(results[0].metrics.user_rating).toBe(4.5)
      })

      it('should calculate statistical significance', () => {
        // First create a test
        const config: ABTestConfig = {
          testName: 'statistical_test',
          variants: [
            {
              name: 'watercolor_variant',
              promptModifications: { style: 'watercolor' },
            },
            {
              name: 'digital_art_variant',
              promptModifications: { style: 'digital_art' },
            },
          ],
          trafficSplit: [50, 50],
          successMetrics: ['user_rating', 'generation_time', 'cost'],
        }

        const test = service.createABTest(config)
        const testId = test.id

        // Add multiple results for statistical analysis
        for (let i = 0; i < 100; i++) {
          service.recordTestResult({
            testId,
            variant: i % 2 === 0 ? 'watercolor_variant' : 'digital_art_variant',
            userId: `user_${i}`,
            metrics: {
              user_rating: 4.0 + Math.random(),
              generation_time: 20 + Math.random() * 10,
              cost: 0.03 + Math.random() * 0.01,
            },
            timestamp: new Date(),
          })
        }

        const analysis = service.analyzeTestResults(testId)

        expect(analysis.sampleSize).toBe(100)
        expect(analysis.variants).toHaveLength(2)
        expect(analysis.statisticalSignificance).toBeDefined()
        expect(analysis.winningVariant).toBeDefined()
      })
    })
  })

  describe('Prompt Optimization Algorithms', () => {
    describe('Semantic Analysis', () => {
      it('should analyze prompt semantic content', () => {
        const prompt = 'A brave young knight riding through an enchanted forest'
        const analysis = service.analyzePromptSemantics(prompt)

        expect(analysis.entities).toContain('knight')
        expect(analysis.entities).toContain('forest')
        expect(analysis.adjectives).toContain('brave')
        expect(analysis.adjectives).toContain('young')
        expect(analysis.adjectives).toContain('enchanted')
        expect(analysis.actions).toContain('riding')
        expect(analysis.sentiment).toBe('positive')
      })

      it('should detect potential prompt conflicts', () => {
        const conflictingPrompt =
          'A realistic cartoon character with photographic anime style'
        const conflicts = service.detectPromptConflicts(conflictingPrompt)

        expect(conflicts).toContain('realistic vs cartoon')
        expect(conflicts).toContain('photographic vs anime')
        expect(conflicts.length).toBeGreaterThan(0)
      })
    })

    describe('Prompt Optimization', () => {
      it('should optimize prompt length and clarity', () => {
        const verbosePrompt =
          'A very beautiful and extremely detailed and highly realistic portrait of a young child who is very happy and smiling brightly while reading a book in a very cozy library'
        const optimized = service.optimizePromptClarity(verbosePrompt)

        expect(optimized.length).toBeLessThan(verbosePrompt.length)
        expect(optimized).toContain('portrait')
        expect(optimized).toContain('child')
        expect(optimized).toContain('reading')
        expect(optimized).not.toContain('very very')
      })

      it('should suggest prompt improvements', () => {
        const basicPrompt = 'A person in a place'
        const suggestions = service.suggestPromptImprovements(basicPrompt)

        expect(suggestions.specificity).toContain(
          'more specific character description'
        )
        expect(suggestions.setting).toContain('detailed environment')
        expect(suggestions.style).toContain('artistic style')
        expect(suggestions.mood).toContain('emotional tone')
      })

      it('should balance prompt complexity', () => {
        const simplePrompt = 'A cat'
        const complexPrompt =
          'A majestic orange tabby cat with emerald green eyes sitting gracefully on a vintage wooden chair in a sunlit Victorian parlor with intricate wallpaper patterns and antique furniture'

        const balancedSimple = service.balancePromptComplexity(
          simplePrompt,
          'medium'
        )
        const balancedComplex = service.balancePromptComplexity(
          complexPrompt,
          'medium'
        )

        expect(balancedSimple.length).toBeGreaterThan(simplePrompt.length)
        expect(balancedComplex.length).toBeLessThan(complexPrompt.length)
        expect(balancedSimple).toContain('cat')
        expect(balancedComplex).toContain('cat')
      })
    })
  })

  describe('Performance and Caching', () => {
    describe('Template Caching', () => {
      it('should cache frequently used style templates', () => {
        // Spy on the internal method that actually loads templates
        const spy = jest.spyOn(service as any, 'loadStyleTemplate')

        // First call should load template
        const template1 = service.getStyleTemplate('watercolor')
        expect(spy).toHaveBeenCalledWith('watercolor')
        expect(template1).toBeDefined()

        // Second call should use cache (spy should not be called again)
        const template2 = service.getStyleTemplate('watercolor')
        expect(spy).toHaveBeenCalledTimes(1) // Still only called once
        expect(template2).toBe(template1) // Same reference from cache

        spy.mockRestore()
      })

      it('should invalidate cache when templates are updated', () => {
        service.getStyleTemplate('watercolor') // Load into cache

        service.updateStyleTemplate('watercolor', {
          name: 'watercolor',
          category: 'traditional',
          description: 'Updated watercolor style',
          styleModifiers: ['updated modifier'],
          negativePrompts: [],
          qualityEnhancers: [],
        })

        const template = service.getStyleTemplate('watercolor')
        expect(template.description).toBe('Updated watercolor style')
      })
    })

    describe('Performance Optimization', () => {
      it('should handle batch prompt optimization efficiently', () => {
        const requests: PromptOptimizationRequest[] = Array(10)
          .fill(null)
          .map((_, i) => ({
            basePrompt: `Test prompt ${i}`,
            style: 'watercolor',
            contentType: 'character',
          }))

        const startTime = Date.now()
        const results = service.batchOptimizePrompts(requests)
        const endTime = Date.now()

        expect(results).toHaveLength(10)
        expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
        expect(
          results.every((r: PromptOptimizationResult) =>
            r.enhancedPrompt.includes('watercolor')
          )
        ).toBe(true)
      })

      it('should provide optimization metrics', () => {
        const request: PromptOptimizationRequest = {
          basePrompt: 'A simple test prompt',
          style: 'realistic',
          contentType: 'portrait',
        }

        const result = service.optimizePrompt(request)

        expect(result.optimizationMetrics).toBeDefined()
        expect(result.optimizationMetrics.processingTime).toBeGreaterThan(0)
        expect(result.optimizationMetrics.enhancementCount).toBeGreaterThan(0)
        expect(result.optimizationMetrics.complexityScore).toBeGreaterThan(0)
      })
    })
  })
})
