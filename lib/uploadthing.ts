import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { getAuthClient } from './auth/supabase'
import {
  getValidationOptions,
  validateFileSize,
  validateFileType,
} from './validations'
import { createUploadedFile } from './services/uploaded-files'

const f = createUploadthing()

// Auth function to validate user
const auth = async (req: Request) => {
  const supabase = getAuthClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new UploadThingError('Unauthorized')
  }

  return { userId: user.id }
}

// Server-side file validation for UploadThing FileUploadData
const validateUploadData = (
  fileData: any,
  validationType: 'general' | 'childPhoto' | 'avatar'
) => {
  const options = getValidationOptions(validationType)
  const errors: string[] = []

  // Create a minimal File-like object for validation
  const fileForValidation = {
    name: fileData.name,
    size: fileData.size,
    type: fileData.type,
  } as File

  // Validate file size
  const sizeValidation = validateFileSize(fileForValidation, options)
  if (!sizeValidation.isValid) {
    errors.push(...sizeValidation.errors)
  }

  // Validate file type
  const typeValidation = validateFileType(fileForValidation, options)
  if (!typeValidation.isValid) {
    errors.push(...typeValidation.errors)
  }

  if (errors.length > 0) {
    throw new UploadThingError(`File validation failed: ${errors.join(', ')}`)
  }

  return { isValid: true, errors: [], warnings: [] }
}

// Helper function to save file metadata to database
const saveFileToDatabase = async (
  userId: string,
  file: any,
  uploadType: 'general' | 'child_photo' | 'avatar',
  validationType: string
) => {
  try {
    const uploadedFile = await createUploadedFile({
      user_id: userId,
      file_url: file.url,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      upload_type: uploadType,
      validation_type: validationType,
      uploadthing_key: file.key,
      uploadthing_file_id: file.fileHash || file.key,
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        customId: file.customId,
        serverData: file.serverData,
      },
    })

    console.log('File metadata saved to database:', uploadedFile.id)
    return uploadedFile
  } catch (error) {
    console.error('Failed to save file metadata to database:', error)
    // Don't throw error here to avoid breaking the upload flow
    // The file is still uploaded to UploadThing successfully
    return null
  }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: '8MB', maxFileCount: 5 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, files }) => {
      // This code runs on your server before upload
      const user = await auth(req)

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError('Unauthorized')

      // Server-side validation for each file
      for (const file of files) {
        validateUploadData(file, 'general')
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.userId, validationType: 'general' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log('Upload complete for userId:', metadata.userId)
      console.log('file url', file.url)
      console.log('validation type:', metadata.validationType)

      // Save file metadata to database
      const dbFile = await saveFileToDatabase(
        metadata.userId,
        file,
        'general',
        metadata.validationType
      )

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        url: file.url,
        type: 'general',
        validationType: metadata.validationType,
        dbId: dbFile?.id || null,
      }
    }),

  // Child photo uploader with specific validation
  childPhotoUploader: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 1,
      minFileCount: 1,
    },
  })
    .middleware(async ({ req, files }) => {
      const user = await auth(req)
      if (!user) throw new UploadThingError('Unauthorized')

      // Server-side validation for child photos
      for (const file of files) {
        validateUploadData(file, 'childPhoto')
      }

      return { userId: user.userId, validationType: 'childPhoto' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Child photo upload complete for userId:', metadata.userId)
      console.log('file url', file.url)
      console.log('validation type:', metadata.validationType)

      // Save file metadata to database
      const dbFile = await saveFileToDatabase(
        metadata.userId,
        file,
        'child_photo',
        metadata.validationType
      )

      return {
        uploadedBy: metadata.userId,
        url: file.url,
        type: 'child_photo',
        validationType: metadata.validationType,
        dbId: dbFile?.id || null,
      }
    }),

  // Avatar uploader for user profiles
  avatarUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
      minFileCount: 1,
    },
  })
    .middleware(async ({ req, files }) => {
      const user = await auth(req)
      if (!user) throw new UploadThingError('Unauthorized')

      // Server-side validation for avatars
      for (const file of files) {
        validateUploadData(file, 'avatar')
      }

      return { userId: user.userId, validationType: 'avatar' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Avatar upload complete for userId:', metadata.userId)
      console.log('file url', file.url)
      console.log('validation type:', metadata.validationType)

      // Save file metadata to database
      const dbFile = await saveFileToDatabase(
        metadata.userId,
        file,
        'avatar',
        metadata.validationType
      )

      return {
        uploadedBy: metadata.userId,
        url: file.url,
        type: 'avatar',
        validationType: metadata.validationType,
        dbId: dbFile?.id || null,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
