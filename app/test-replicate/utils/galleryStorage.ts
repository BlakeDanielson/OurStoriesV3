interface GenerationResult {
  success: boolean
  result?: {
    id: string
    status: string
    imageUrl: string
    provider: string
    model: string
    generationTime: number
  }
  cost?: number
  error?: string
}

interface SavedGeneration {
  id: string
  timestamp: number
  prompt: string
  results: Array<{
    model: string
    modelName: string
    success: boolean
    imageUrl?: string
    error?: string
    cost?: number
    generationTime?: number
  }>
  totalCost: number
  successCount: number
  failCount: number
}

const STORAGE_KEY = 'imageGenerationHistory'

// Model name mapping for display
const modelDisplayNames: Record<string, string> = {
  flux1: 'FLUX.1 Schnell',
  'flux-kontext-pro': 'FLUX Kontext Pro',
  'imagen-4': 'Imagen 4',
  'minimax-image-01': 'MiniMax Image 01',
  'flux-1.1-pro-ultra': 'FLUX 1.1 Pro Ultra',
}

export function saveGenerationToGallery(
  prompt: string,
  results: Record<string, GenerationResult | null>
): void {
  try {
    const processedResults = Object.entries(results)
      .filter(([_, result]) => result !== null)
      .map(([model, result]) => ({
        model,
        modelName: modelDisplayNames[model] || model,
        success: result!.success,
        imageUrl: result!.result?.imageUrl,
        error: result!.error,
        cost: result!.cost,
        generationTime: result!.result?.generationTime,
      }))

    const totalCost = processedResults.reduce(
      (sum, result) => sum + (result.cost || 0),
      0
    )
    const successCount = processedResults.filter(
      result => result.success
    ).length
    const failCount = processedResults.filter(result => !result.success).length

    const savedGeneration: SavedGeneration = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      prompt,
      results: processedResults,
      totalCost,
      successCount,
      failCount,
    }

    // Get existing history
    const existingHistory = getGenerationHistory()

    // Add new generation to the beginning
    const updatedHistory = [savedGeneration, ...existingHistory]

    // Keep only the last 50 generations to prevent localStorage from getting too large
    const trimmedHistory = updatedHistory.slice(0, 50)

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory))

    console.log('Saved generation to gallery:', savedGeneration.id)
  } catch (error) {
    console.error('Error saving generation to gallery:', error)
  }
}

export function getGenerationHistory(): SavedGeneration[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading generation history:', error)
  }
  return []
}

export function clearGenerationHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('Cleared generation history')
  } catch (error) {
    console.error('Error clearing generation history:', error)
  }
}

export function deleteGeneration(id: string): void {
  try {
    const history = getGenerationHistory()
    const updatedHistory = history.filter(gen => gen.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
    console.log('Deleted generation:', id)
  } catch (error) {
    console.error('Error deleting generation:', error)
  }
}
