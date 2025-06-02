import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { encryptionService } from '@/lib/encryption'
import { keyManagementService } from '@/lib/encryption/key-management'

/**
 * GET /api/encryption/status
 * Get encryption system status and key information
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has admin privileges (service role)
    const supabase = createAdminSupabaseClient()

    // Get encryption metadata
    const encryptionMetadata = encryptionService.getEncryptionMetadata()

    // Get key statistics
    const keyStats = await keyManagementService.getKeyStatistics()

    // Check key integrity
    const keyValidation = await keyManagementService.validateKeyIntegrity()

    // Check for keys needing rotation
    const keysNeedingRotation =
      await keyManagementService.checkKeysForRotation()

    return NextResponse.json({
      status: 'success',
      data: {
        encryption: {
          service: {
            totalKeys: encryptionMetadata.totalKeys,
            activeKeys: encryptionMetadata.activeKeys.length,
            expiredKeys: encryptionMetadata.expiredKeys.length,
          },
          database: {
            totalKeys: keyStats.totalKeys,
            activeKeys: keyStats.activeKeys,
            expiredKeys: keyStats.expiredKeys,
            expiringKeys: keyStats.expiringKeys,
            keysByPurpose: keyStats.keysByPurpose,
          },
          validation: {
            valid: keyValidation.valid,
            issues: keyValidation.issues,
          },
          rotation: {
            keysNeedingRotation: keysNeedingRotation.length,
            keys: keysNeedingRotation,
          },
        },
        environment: {
          apiEncryptionEnabled:
            process.env.ENABLE_API_REQUEST_ENCRYPTION === 'true',
          responseEncryptionEnabled:
            process.env.ENABLE_API_RESPONSE_ENCRYPTION === 'true',
          databaseEncryptionKey: !!process.env.DATABASE_ENCRYPTION_KEY,
          apiEncryptionKey: !!process.env.API_ENCRYPTION_KEY,
          fieldEncryptionKey: !!process.env.FIELD_ENCRYPTION_KEY,
          storageEncryptionKey: !!process.env.STORAGE_ENCRYPTION_KEY,
        },
      },
    })
  } catch (error) {
    console.error('Encryption status check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to get encryption status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/encryption/status
 * Perform encryption system operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, purpose } = body

    const supabase = createAdminSupabaseClient()

    switch (action) {
      case 'rotate_key':
        if (!purpose) {
          return NextResponse.json(
            {
              status: 'error',
              message: 'Purpose is required for key rotation',
            },
            { status: 400 }
          )
        }

        const newKey = await keyManagementService.rotateKey(purpose)
        return NextResponse.json({
          status: 'success',
          message: `Key rotated for purpose: ${purpose}`,
          data: {
            keyId: newKey.id,
            purpose: newKey.purpose,
            createdAt: newKey.createdAt,
          },
        })

      case 'initialize_keys':
        await keyManagementService.initializeKeys()
        return NextResponse.json({
          status: 'success',
          message: 'Encryption keys initialized',
        })

      case 'auto_rotate':
        await keyManagementService.autoRotateExpiredKeys()
        return NextResponse.json({
          status: 'success',
          message: 'Auto-rotation completed',
        })

      case 'cleanup_expired':
        const deletedCount = await keyManagementService.cleanupExpiredKeys()
        return NextResponse.json({
          status: 'success',
          message: `Cleaned up ${deletedCount} expired keys`,
        })

      case 'validate_keys':
        const validation = await keyManagementService.validateKeyIntegrity()
        return NextResponse.json({
          status: 'success',
          data: validation,
        })

      default:
        return NextResponse.json(
          { status: 'error', message: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Encryption operation failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Encryption operation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
