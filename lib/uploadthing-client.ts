import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from '@uploadthing/react'

import type { OurFileRouter } from '@/lib/uploadthing'

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>()

// Enhanced upload hook with progress tracking
export function useUploadThingWithProgress(
  endpoint: keyof OurFileRouter,
  options?: {
    onClientUploadComplete?: (res: any[]) => void
    onUploadError?: (error: Error) => void
    onUploadProgress?: (progress: number) => void
    onUploadBegin?: (name: string) => void
  }
) {
  return useUploadThing(endpoint, {
    onClientUploadComplete: options?.onClientUploadComplete,
    onUploadError: options?.onUploadError,
    onUploadProgress: options?.onUploadProgress,
    onUploadBegin: options?.onUploadBegin,
  })
}
