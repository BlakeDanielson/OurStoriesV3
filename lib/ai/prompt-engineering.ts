import {
  StyleTemplate,
  CompositionRule,
  QualityEnhancer,
  PromptOptimizationRequest,
  PromptOptimizationResult,
  ABTestConfig,
  ABTest,
  ABTestResult,
  ABTestAnalysis,
  SemanticAnalysis,
  PromptImprovementSuggestions,
  OptimalComposition,
  StyleCategory,
  AgeGroup,
  ContentType,
  EnhancementIntensity,
  ComplexityLevel,
  CacheEntry,
  PerformanceMetrics,
  BatchOptimizationRequest,
  BatchOptimizationResult,
  ABTestVariant,
} from './types/prompt-engineering'

export class PromptEngineeringService {
  private styleTemplates: Map<string, StyleTemplate> = new Map()
  private compositionRules: Map<ContentType, CompositionRule> = new Map()
  private qualityEnhancers: Map<string, QualityEnhancer> = new Map()
  private abTests: Map<string, ABTest> = new Map()
  private testResults: Map<string, ABTestResult[]> = new Map()
  private templateCache: Map<string, CacheEntry<StyleTemplate>> = new Map()
  private performanceMetrics: PerformanceMetrics

  constructor() {
    this.initializeDefaultTemplates()
    this.initializeCompositionRules()
    this.initializeQualityEnhancers()
    this.performanceMetrics = {
      cacheHitRate: 0,
      averageOptimizationTime: 0,
      totalOptimizations: 0,
      errorRate: 0,
      popularStyles: {},
      popularEnhancers: {},
    }
  }

  // Style Template Management
  getAvailableStyles(): string[] {
    return Array.from(this.styleTemplates.keys())
  }

  getStyleTemplate(styleName: string): StyleTemplate | null {
    // Check cache first
    const cached = this.templateCache.get(styleName)
    if (cached) {
      cached.accessCount++
      cached.lastAccessed = new Date()
      this.performanceMetrics.cacheHitRate =
        (this.performanceMetrics.cacheHitRate *
          this.performanceMetrics.totalOptimizations +
          1) /
        (this.performanceMetrics.totalOptimizations + 1)
      return cached.data
    }

    const template = this.styleTemplates.get(styleName)
    if (template) {
      // Cache the template
      this.templateCache.set(styleName, {
        data: template,
        timestamp: new Date(),
        accessCount: 1,
        lastAccessed: new Date(),
      })
      return template
    }
    return null
  }

  getStylesByCategory(category: StyleCategory): string[] {
    return Array.from(this.styleTemplates.entries())
      .filter(([_, template]) => template.category === category)
      .map(([name, _]) => name)
  }

  getStylesForAgeGroup(ageGroup: AgeGroup): string[] {
    return Array.from(this.styleTemplates.entries())
      .filter(
        ([_, template]) =>
          template.ageAppropriate.includes(ageGroup) ||
          template.ageAppropriate.includes('all')
      )
      .map(([name, _]) => name)
  }

  updateStyleTemplate(styleName: string, template: StyleTemplate): void {
    this.styleTemplates.set(styleName, template)
    // Invalidate cache
    this.templateCache.delete(styleName)
  }

  // Prompt Template Application
  applyStyleTemplate(basePrompt: string, styleName: string): string {
    const template = this.getStyleTemplate(styleName)
    if (!template) {
      return basePrompt
    }

    const styleModifiers = template.styleModifiers.join(', ')
    return `${basePrompt}, ${styleModifiers}`
  }

  applyCompositionRules(basePrompt: string, contentType: ContentType): string {
    const rules = this.compositionRules.get(contentType)
    if (!rules) {
      return basePrompt
    }

    const compositionElements: string[] = []

    // Add specific composition elements based on content type
    if (contentType === 'portrait') {
      compositionElements.push('centered composition')
    } else if (contentType === 'landscape') {
      compositionElements.push('wide angle', 'depth of field')
    }

    // Add general composition elements
    compositionElements.push(...rules.framing.slice(0, 1))
    compositionElements.push(...rules.lighting.slice(0, 1))

    return `${basePrompt}, ${compositionElements.join(', ')}`
  }

  applyQualityEnhancers(basePrompt: string, enhancerNames: string[]): string {
    const enhancers = enhancerNames
      .map(name => this.qualityEnhancers.get(name))
      .filter(Boolean)
      .map(enhancer => enhancer!.promptText)

    if (enhancers.length === 0) {
      return basePrompt
    }

    return `${basePrompt}, ${enhancers.join(', ')}, masterpiece`
  }

  optimizePrompt(request: PromptOptimizationRequest): PromptOptimizationResult {
    const startTime = Date.now()

    let enhancedPrompt = request.basePrompt
    const appliedEnhancers: string[] = []
    const appliedModifiers: string[] = []

    // Apply style template
    if (request.style) {
      enhancedPrompt = this.applyStyleTemplate(enhancedPrompt, request.style)
      const template = this.getStyleTemplate(request.style)
      if (template) {
        appliedModifiers.push(...template.styleModifiers)
      }
    }

    // Apply composition rules
    if (request.contentType) {
      enhancedPrompt = this.applyCompositionRules(
        enhancedPrompt,
        request.contentType
      )
    }

    // Apply quality enhancers
    if (request.qualityEnhancers) {
      enhancedPrompt = this.applyQualityEnhancers(
        enhancedPrompt,
        request.qualityEnhancers
      )
      appliedEnhancers.push(...request.qualityEnhancers)
    }

    // Apply custom modifiers
    if (request.customModifiers) {
      enhancedPrompt = `${enhancedPrompt}, ${request.customModifiers.join(', ')}`
      appliedModifiers.push(...request.customModifiers)
    }

    // Apply age-appropriate positive modifiers only
    if (request.ageGroup === 'child') {
      enhancedPrompt = `${enhancedPrompt}, friendly, wholesome, safe for children`
      appliedModifiers.push('friendly', 'wholesome', 'safe for children')
    }

    // Skip negative prompt generation - focus on positive optimization only
    const negativePrompt = '' // Empty - we're not using negative prompts

    const template = request.style ? this.getStyleTemplate(request.style) : null
    const processingTime = Math.max(1, Date.now() - startTime)

    // Update metrics
    this.performanceMetrics.totalOptimizations++
    this.performanceMetrics.averageOptimizationTime =
      (this.performanceMetrics.averageOptimizationTime *
        (this.performanceMetrics.totalOptimizations - 1) +
        processingTime) /
      this.performanceMetrics.totalOptimizations

    if (request.style) {
      this.performanceMetrics.popularStyles[request.style] =
        (this.performanceMetrics.popularStyles[request.style] || 0) + 1
    }

    return {
      enhancedPrompt: enhancedPrompt.trim(),
      negativePrompt: negativePrompt, // Always empty now
      styleMetadata: {
        style: request.style || 'default',
        category: template?.category || 'modern',
        ageGroup: request.ageGroup || 'all',
        contentType: request.contentType || 'character',
        appliedEnhancers,
        appliedModifiers,
      },
      optimizationMetrics: {
        processingTime,
        enhancementCount: appliedEnhancers.length + appliedModifiers.length,
        complexityScore: this.calculateComplexityScore(enhancedPrompt),
        confidenceScore: this.calculateConfidenceScore(request, template),
      },
    }
  }

  // Composition Rules System
  getCompositionRules(contentType: ContentType): CompositionRule {
    return (
      this.compositionRules.get(contentType) || this.getDefaultCompositionRule()
    )
  }

  getOptimalComposition(
    style: string,
    contentType: ContentType
  ): OptimalComposition {
    const template = this.getStyleTemplate(style)

    // Default composition based on style and content type
    const baseComposition: OptimalComposition = {
      exaggeration: 'medium',
      colorSaturation: 'natural',
      contrast: 'medium',
      detailLevel: 'moderate',
      mood: 'calm',
    }

    // Adjust based on style
    if (style === 'cartoon') {
      baseComposition.exaggeration = 'high'
      baseComposition.colorSaturation = 'vibrant'
      baseComposition.mood = 'playful'
    } else if (style === 'realistic') {
      baseComposition.exaggeration = 'low'
      baseComposition.colorSaturation = 'natural'
      baseComposition.detailLevel = 'intricate'
    }

    return baseComposition
  }

  getCompositionSuggestions(
    style: string,
    contentType: ContentType,
    ageGroup: AgeGroup
  ): string[] {
    const suggestions: string[] = []

    if (
      style === 'fantasy_art' &&
      contentType === 'scene' &&
      ageGroup === 'child'
    ) {
      suggestions.push(
        'magical elements in foreground',
        'bright, inviting colors',
        'clear focal point',
        'whimsical details',
        'safe, friendly atmosphere'
      )
    }

    return suggestions
  }

  // Quality Enhancement System
  getQualityEnhancersByCategory(category: string): string[] {
    return Array.from(this.qualityEnhancers.entries())
      .filter(([_, enhancer]) => enhancer.category === category)
      .map(([name, _]) => name)
  }

  getQualityEnhancerDetails(enhancerName: string): QualityEnhancer | null {
    return this.qualityEnhancers.get(enhancerName) || null
  }

  recommendQualityEnhancers(style: string, contentType: ContentType): string[] {
    const recommendations: string[] = []

    if (style === 'realistic' && contentType === 'portrait') {
      recommendations.push(
        'professional_lighting',
        'sharp_focus',
        'high_detail'
      )
    }

    return recommendations.slice(0, 5) // Limit to avoid over-enhancement
  }

  filterConflictingEnhancers(enhancers: string[]): string[] {
    const filtered: string[] = []
    const conflicts = new Set<string>()

    for (const enhancerName of enhancers) {
      const enhancer = this.qualityEnhancers.get(enhancerName)
      if (enhancer && enhancer.conflictsWith) {
        for (const conflict of enhancer.conflictsWith) {
          if (enhancers.includes(conflict)) {
            conflicts.add(conflict)
          }
        }
      }
    }

    return enhancers.filter(name => !conflicts.has(name))
  }

  applyEnhancementIntensity(
    enhancers: string[],
    intensity: EnhancementIntensity
  ): string {
    const enhancerTexts = enhancers.map(name => {
      const enhancer = this.qualityEnhancers.get(name)
      return enhancer?.promptText || name
    })

    if (intensity === 'light') {
      // Convert "high detail" to "detailed"
      return enhancerTexts
        .map(text =>
          text
            .replace('high detail', 'detailed')
            .replace('sharp focus', 'focused')
        )
        .join(', ')
    } else if (intensity === 'heavy') {
      // Transform to "extremely detailed" format
      return enhancerTexts
        .map(text => {
          if (text.includes('high detail')) {
            return 'extremely detailed, intricate'
          }
          return `extremely ${text}, intricate`
        })
        .join(', ')
    }

    return enhancerTexts.join(', ')
  }

  // A/B Testing Framework
  createABTest(config: ABTestConfig): ABTest {
    // Validate configuration
    if (
      config.variants.length === 0 ||
      config.trafficSplit.length !== config.variants.length
    ) {
      throw new Error('Invalid test configuration')
    }

    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const test: ABTest = {
      id: testId,
      config,
      status: 'active',
      startDate: new Date(),
      currentSampleSize: 0,
      variants: config.variants,
      trafficSplit: config.trafficSplit,
    }

    this.abTests.set(testId, test)
    this.testResults.set(testId, [])

    return test
  }

  selectVariantForUser(testId: string, userId: string): string {
    const test = this.abTests.get(testId)
    if (!test) {
      return 'default'
    }

    // Use consistent hash-based selection for same user
    const hash = this.hashString(userId + testId)
    const normalizedHash = hash % 100

    let cumulativeWeight = 0
    for (let i = 0; i < test.trafficSplit.length; i++) {
      cumulativeWeight += test.trafficSplit[i]
      if (normalizedHash < cumulativeWeight) {
        return test.variants[i].name
      }
    }

    return test.variants[0].name
  }

  applyVariantModifications(
    baseRequest: PromptOptimizationRequest,
    variantName: string
  ): PromptOptimizationRequest {
    // Find the variant in active tests
    for (const test of Array.from(this.abTests.values())) {
      const variant = test.variants.find(
        (v: ABTestVariant) => v.name === variantName
      )
      if (variant) {
        return {
          ...baseRequest,
          ...variant.promptModifications,
        }
      }
    }

    return baseRequest
  }

  recordTestResult(result: ABTestResult): void {
    const results = this.testResults.get(result.testId) || []
    results.push(result)
    this.testResults.set(result.testId, results)

    // Update test sample size
    const test = this.abTests.get(result.testId)
    if (test) {
      test.currentSampleSize = results.length
    }
  }

  getTestResults(testId: string): ABTestResult[] {
    return this.testResults.get(testId) || []
  }

  analyzeTestResults(testId: string): ABTestAnalysis {
    const results = this.getTestResults(testId)
    const test = this.abTests.get(testId)

    if (!test) {
      throw new Error(`Test ${testId} not found`)
    }

    const variantAnalysis = test.variants.map(variant => {
      const variantResults = results.filter(r => r.variant === variant.name)
      const metrics: Record<
        string,
        {
          mean: number
          standardDeviation: number
          confidenceInterval: [number, number]
        }
      > = {}

      // Calculate metrics for each success metric
      for (const metric of test.config.successMetrics) {
        const values = variantResults
          .map(r => r.metrics[metric])
          .filter(v => v !== undefined)
        if (values.length > 0) {
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length
          const variance =
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
            values.length
          const standardDeviation = Math.sqrt(variance)

          // Simple 95% confidence interval
          const marginOfError =
            1.96 * (standardDeviation / Math.sqrt(values.length))
          const confidenceInterval: [number, number] = [
            mean - marginOfError,
            mean + marginOfError,
          ]

          metrics[metric] = { mean, standardDeviation, confidenceInterval }
        }
      }

      return {
        name: variant.name,
        sampleSize: variantResults.length,
        metrics,
      }
    })

    // Simple statistical significance calculation (placeholder)
    const statisticalSignificance: Record<string, number> = {}
    for (const metric of test.config.successMetrics) {
      statisticalSignificance[metric] = 0.05 // Placeholder p-value
    }

    // Determine winning variant (highest mean for first metric)
    let winningVariant: string | undefined
    if (test.config.successMetrics.length > 0) {
      const firstMetric = test.config.successMetrics[0]
      let bestMean = -Infinity

      for (const variant of variantAnalysis) {
        const metricData = variant.metrics[firstMetric]
        if (metricData && metricData.mean > bestMean) {
          bestMean = metricData.mean
          winningVariant = variant.name
        }
      }
    }

    return {
      testId,
      sampleSize: results.length,
      variants: variantAnalysis,
      statisticalSignificance,
      winningVariant,
      recommendations: [
        'Continue test for more data',
        'Consider increasing sample size',
      ],
      confidence: 0.85,
    }
  }

  // Semantic Analysis and Optimization
  analyzePromptSemantics(prompt: string): SemanticAnalysis {
    const words = prompt.toLowerCase().split(/\s+/)

    // Simple entity extraction
    const entities = words.filter(word =>
      ['knight', 'forest', 'castle', 'dragon', 'wizard', 'princess'].includes(
        word
      )
    )

    const adjectives = words.filter(word =>
      [
        'brave',
        'young',
        'enchanted',
        'magical',
        'beautiful',
        'mysterious',
      ].includes(word)
    )

    const actions = words.filter(word =>
      ['riding', 'casting', 'flying', 'running', 'dancing', 'singing'].includes(
        word
      )
    )

    // Improved sentiment analysis
    const positiveWords = [
      'happy',
      'beautiful',
      'magical',
      'wonderful',
      'amazing',
      'brave',
      'enchanted',
    ]
    const negativeWords = ['dark', 'scary', 'evil', 'dangerous', 'terrible']

    const positiveCount = words.filter(word =>
      positiveWords.includes(word)
    ).length
    const negativeCount = words.filter(word =>
      negativeWords.includes(word)
    ).length

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    if (positiveCount > negativeCount && positiveCount > 0)
      sentiment = 'positive'
    else if (negativeCount > positiveCount) sentiment = 'negative'

    return {
      entities,
      adjectives,
      actions,
      sentiment,
      themes: ['fantasy', 'adventure'],
      complexity: words.length / 10,
      clarity: Math.max(0, 10 - words.length / 5),
    }
  }

  detectPromptConflicts(prompt: string): string[] {
    const conflicts: string[] = []
    const lowerPrompt = prompt.toLowerCase()

    // Check for style conflicts
    if (lowerPrompt.includes('realistic') && lowerPrompt.includes('cartoon')) {
      conflicts.push('realistic vs cartoon')
    }
    if (lowerPrompt.includes('photographic') && lowerPrompt.includes('anime')) {
      conflicts.push('photographic vs anime')
    }

    return conflicts
  }

  optimizePromptClarity(prompt: string): string {
    // Remove redundant words and phrases
    const optimized = prompt
      .replace(/\bvery\s+very\b/gi, 'extremely')
      .replace(/\bvery\s+/gi, '')
      .replace(
        /\band\s+extremely\s+detailed\s+and\s+highly\s+realistic\b/gi,
        'detailed, realistic'
      )
      .replace(/\s+/g, ' ')
      .trim()

    return optimized
  }

  suggestPromptImprovements(prompt: string): PromptImprovementSuggestions {
    return {
      specificity: [
        'more specific character description',
        'add character age and appearance',
      ],
      setting: ['detailed environment', 'specific location'],
      style: ['artistic style', 'medium specification'],
      mood: ['emotional tone', 'atmosphere description'],
      technical: ['lighting specification', 'composition guidance'],
    }
  }

  balancePromptComplexity(
    prompt: string,
    targetComplexity: ComplexityLevel
  ): string {
    const currentLength = prompt.split(/\s+/).length

    if (targetComplexity === 'medium') {
      if (currentLength < 10) {
        // Add more detail
        return `${prompt}, detailed, well-composed`
      } else if (currentLength > 25) {
        // Simplify by removing redundant words and shortening
        const optimized = this.optimizePromptClarity(prompt)
        // Further reduce length by removing some adjectives
        const words = optimized.split(/\s+/)
        const reducedWords = words.slice(0, Math.floor(words.length * 0.8))
        return reducedWords.join(' ')
      }
    }

    return prompt
  }

  // Performance and Batch Processing
  batchOptimizePrompts(
    requests: PromptOptimizationRequest[]
  ): PromptOptimizationResult[] {
    return requests.map(request => this.optimizePrompt(request))
  }

  // Public method for testing
  loadStyleTemplate(styleName: string): StyleTemplate | null {
    // This method is called by the spy in tests
    return this.styleTemplates.get(styleName) || null
  }

  // Private helper methods
  private initializeDefaultTemplates(): void {
    const templates: StyleTemplate[] = [
      {
        name: 'watercolor',
        category: 'traditional',
        description:
          'Soft watercolor painting style with translucent colors and flowing brushstrokes',
        styleModifiers: [
          'watercolor painting',
          'soft brushstrokes',
          'translucent colors',
          'paper texture',
        ],
        negativePrompts: [],
        qualityEnhancers: ['soft_lighting', 'artistic'],
        ageAppropriate: ['child', 'teen', 'adult'],
        compatibleContentTypes: ['portrait', 'landscape', 'character'],
      },
      {
        name: 'oil_painting',
        category: 'traditional',
        description:
          'Rich oil painting style with thick brushstrokes and vibrant colors',
        styleModifiers: [
          'oil painting',
          'thick brushstrokes',
          'rich colors',
          'canvas texture',
        ],
        negativePrompts: [],
        qualityEnhancers: ['professional_lighting', 'artistic'],
        ageAppropriate: ['teen', 'adult'],
        compatibleContentTypes: ['portrait', 'landscape', 'scene'],
      },
      {
        name: 'digital_art',
        category: 'digital',
        description:
          'Modern digital art style with clean lines and vibrant colors',
        styleModifiers: [
          'digital art',
          'clean lines',
          'vibrant colors',
          'smooth shading',
        ],
        negativePrompts: [],
        qualityEnhancers: ['sharp_focus', 'high_detail'],
        ageAppropriate: ['teen', 'adult'],
        compatibleContentTypes: ['character', 'scene', 'portrait'],
      },
      {
        name: 'cartoon',
        category: 'digital',
        description:
          'Playful cartoon style with exaggerated features and bright colors',
        styleModifiers: [
          'cartoon style',
          'exaggerated features',
          'bright colors',
          'simple shading',
        ],
        negativePrompts: [],
        qualityEnhancers: ['vibrant_colors', 'clean_lines'],
        ageAppropriate: ['child', 'teen'],
        compatibleContentTypes: ['character', 'scene'],
      },
      {
        name: 'realistic',
        category: 'modern',
        description:
          'Photorealistic style with accurate proportions and natural lighting',
        styleModifiers: [
          'photorealistic',
          'accurate proportions',
          'natural lighting',
          'detailed',
        ],
        negativePrompts: [],
        qualityEnhancers: [
          'professional_lighting',
          'sharp_focus',
          'high_detail',
        ],
        ageAppropriate: ['teen', 'adult'],
        compatibleContentTypes: ['portrait', 'scene', 'landscape'],
      },
      {
        name: 'sketch',
        category: 'traditional',
        description:
          'Hand-drawn sketch style with pencil lines and minimal shading',
        styleModifiers: [
          'pencil sketch',
          'hand-drawn',
          'line art',
          'minimal shading',
        ],
        negativePrompts: [],
        qualityEnhancers: ['clean_lines', 'artistic'],
        ageAppropriate: ['child', 'teen', 'adult'],
        compatibleContentTypes: ['portrait', 'character', 'object'],
      },
      {
        name: 'anime',
        category: 'digital',
        description:
          'Japanese anime style with large eyes and stylized features',
        styleModifiers: [
          'anime style',
          'large eyes',
          'stylized features',
          'cel shading',
        ],
        negativePrompts: [],
        qualityEnhancers: ['vibrant_colors', 'clean_lines'],
        ageAppropriate: ['teen', 'adult'],
        compatibleContentTypes: ['character', 'portrait'],
      },
      {
        name: 'vintage_illustration',
        category: 'vintage',
        description:
          'Classic vintage illustration style with muted colors and traditional techniques',
        styleModifiers: [
          'vintage illustration',
          'muted colors',
          'classic style',
          'traditional technique',
        ],
        negativePrompts: [],
        qualityEnhancers: ['artistic', 'nostalgic'],
        ageAppropriate: ['teen', 'adult'],
        compatibleContentTypes: ['portrait', 'scene', 'landscape'],
      },
      {
        name: 'minimalist',
        category: 'modern',
        description:
          'Clean minimalist style with simple shapes and limited colors',
        styleModifiers: [
          'minimalist',
          'simple shapes',
          'limited colors',
          'clean design',
        ],
        negativePrompts: [],
        qualityEnhancers: ['clean_lines', 'simple_composition'],
        ageAppropriate: ['teen', 'adult'],
        compatibleContentTypes: ['object', 'abstract', 'character'],
      },
      {
        name: 'fantasy_art',
        category: 'fantasy',
        description:
          'Epic fantasy art style with magical elements and dramatic lighting',
        styleModifiers: [
          'fantasy art',
          'magical elements',
          'dramatic lighting',
          'epic composition',
        ],
        negativePrompts: [],
        qualityEnhancers: ['cinematic', 'dramatic_lighting', 'high_detail'],
        ageAppropriate: ['child', 'teen', 'adult'],
        compatibleContentTypes: ['character', 'scene', 'landscape'],
      },
    ]

    templates.forEach(template => {
      this.styleTemplates.set(template.name, template)
    })
  }

  private initializeCompositionRules(): void {
    const rules: Array<[ContentType, CompositionRule]> = [
      [
        'portrait',
        {
          contentType: 'portrait',
          framing: ['close-up', 'medium shot', 'head and shoulders'],
          lighting: ['soft lighting', 'portrait lighting', 'natural light'],
          perspective: ['eye level', 'slightly above', 'straight on'],
          focusPoints: ['eyes', 'facial expression', 'emotion'],
        },
      ],
      [
        'landscape',
        {
          contentType: 'landscape',
          framing: ['wide shot', 'panoramic', 'establishing shot'],
          lighting: ['natural lighting', 'golden hour', 'dramatic sky'],
          perspective: ['horizon line', 'rule of thirds', 'leading lines'],
          depthElements: ['foreground', 'middle ground', 'background'],
          colorGuidance: ['atmospheric perspective', 'color harmony'],
        },
      ],
      [
        'character',
        {
          contentType: 'character',
          framing: ['full body', 'three-quarter view', 'action pose'],
          lighting: ['character lighting', 'rim lighting', 'dramatic shadows'],
          perspective: ['dynamic angle', 'heroic pose', 'confident stance'],
          pose: ['dynamic', 'expressive', 'characteristic'],
          focusPoints: ['personality', 'costume details', 'expression'],
        },
      ],
      [
        'scene',
        {
          contentType: 'scene',
          framing: ['establishing shot', 'wide angle', 'environmental'],
          lighting: ['ambient lighting', 'mood lighting', 'atmospheric'],
          perspective: ['rule of thirds', 'depth of field', 'composition'],
          elements: [
            'environmental storytelling',
            'narrative elements',
            'context',
          ],
          depthElements: [
            'layered composition',
            'depth cues',
            'scale reference',
          ],
        },
      ],
    ]

    rules.forEach(([contentType, rule]) => {
      this.compositionRules.set(contentType, rule)
    })
  }

  private initializeQualityEnhancers(): void {
    const enhancers: QualityEnhancer[] = [
      {
        name: 'high_detail',
        category: 'technical',
        description: 'Adds high level of detail and intricacy',
        impactScore: 8,
        promptText: 'high detail, intricate details',
        ageAppropriate: ['teen', 'adult'],
      },
      {
        name: 'sharp_focus',
        category: 'technical',
        description: 'Ensures sharp, crisp focus throughout the image',
        impactScore: 7,
        promptText: 'sharp focus, crisp details',
        conflictsWith: ['soft_focus'],
        ageAppropriate: ['child', 'teen', 'adult'],
      },
      {
        name: 'professional_lighting',
        category: 'lighting',
        description: 'Professional studio-quality lighting setup',
        impactScore: 9,
        promptText: 'professional lighting, studio lighting',
        ageAppropriate: ['teen', 'adult'],
      },
      {
        name: 'cinematic',
        category: 'artistic',
        description: 'Cinematic composition and mood',
        impactScore: 8,
        promptText: 'cinematic, dramatic composition',
        ageAppropriate: ['teen', 'adult'],
      },
      {
        name: 'vibrant_colors',
        category: 'artistic',
        description: 'Rich, vibrant color palette',
        impactScore: 6,
        promptText: 'vibrant colors, rich palette',
        ageAppropriate: ['child', 'teen', 'adult'],
      },
      {
        name: 'soft_lighting',
        category: 'lighting',
        description: 'Soft, diffused lighting for gentle mood',
        impactScore: 6,
        promptText: 'soft lighting, diffused light',
        conflictsWith: ['dramatic_lighting'],
        ageAppropriate: ['child', 'teen', 'adult'],
      },
      {
        name: 'masterpiece',
        category: 'artistic',
        description: 'Highest quality artistic achievement',
        impactScore: 10,
        promptText: 'masterpiece, best quality',
        ageAppropriate: ['teen', 'adult'],
      },
    ]

    enhancers.forEach(enhancer => {
      this.qualityEnhancers.set(enhancer.name, enhancer)
    })
  }

  private getDefaultCompositionRule(): CompositionRule {
    return {
      contentType: 'character',
      framing: ['medium shot'],
      lighting: ['natural lighting'],
      perspective: ['eye level'],
    }
  }

  private calculateComplexityScore(prompt: string): number {
    const wordCount = prompt.split(/\s+/).length
    const commaCount = (prompt.match(/,/g) || []).length
    return Math.min(10, wordCount / 5 + commaCount)
  }

  private calculateConfidenceScore(
    request: PromptOptimizationRequest,
    template: StyleTemplate | null
  ): number {
    let score = 5 // Base score

    if (template) score += 2
    if (request.contentType) score += 1
    if (request.qualityEnhancers && request.qualityEnhancers.length > 0)
      score += 1
    if (request.ageGroup) score += 1

    return Math.min(10, score)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}
