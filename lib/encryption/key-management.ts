import { createAdminSupabaseClient } from '../supabase'
import { encryptionService, EncryptionKey } from './index'
import { createHash, randomBytes } from 'crypto'

// Key rotation configuration
export interface KeyRotationConfig {
  rotationIntervalDays: number
  gracePeriodDays: number
  autoRotate: boolean
  notifyBeforeExpiry: boolean
  notificationDays: number
}

export const DEFAULT_KEY_ROTATION_CONFIG: KeyRotationConfig = {
  rotationIntervalDays: 90, // Rotate every 3 months
  gracePeriodDays: 30, // 30 days grace period for old keys
  autoRotate: true, // Enable automatic rotation
  notifyBeforeExpiry: true, // Send notifications before expiry
  notificationDays: 7, // Notify 7 days before expiry
}

/**
 * Key Management Service for handling encryption key lifecycle
 */
export class KeyManagementService {
  private config: KeyRotationConfig
  private supabase = createAdminSupabaseClient()

  constructor(config: KeyRotationConfig = DEFAULT_KEY_ROTATION_CONFIG) {
    this.config = config
  }

  /**
   * Initialize encryption keys in the database
   */
  async initializeKeys(): Promise<void> {
    const purposes: EncryptionKey['purpose'][] = [
      'database',
      'api',
      'field',
      'storage',
    ]

    for (const purpose of purposes) {
      const existingKey = await this.getActiveKeyFromDatabase(purpose)
      if (!existingKey) {
        await this.createNewKey(purpose)
      }
    }
  }

  /**
   * Create a new encryption key
   */
  async createNewKey(
    purpose: EncryptionKey['purpose'],
    expiresInDays?: number
  ): Promise<EncryptionKey> {
    const keyId = `${purpose}_${Date.now()}_${randomBytes(4).toString('hex')}`
    const key = randomBytes(32).toString('hex')
    const keyHash = this.hashKey(key)

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : new Date(
          Date.now() + this.config.rotationIntervalDays * 24 * 60 * 60 * 1000
        )

    const newKey: EncryptionKey = {
      id: keyId,
      key,
      algorithm: 'aes-256-cbc',
      createdAt: new Date(),
      expiresAt,
      isActive: true,
      purpose,
    }

    // Store in database
    const { error } = await this.supabase.from('encryption_keys').insert({
      key_id: keyId,
      purpose,
      algorithm: newKey.algorithm,
      expires_at: expiresAt.toISOString(),
      key_hash: keyHash,
      is_active: true,
    })

    if (error) {
      throw new Error(`Failed to create encryption key: ${error.message}`)
    }

    // Add to encryption service
    encryptionService.addKey(newKey)

    // Log the operation
    await this.logKeyOperation('key_creation', keyId, purpose)

    return newKey
  }

  /**
   * Rotate encryption key for a specific purpose
   */
  async rotateKey(purpose: EncryptionKey['purpose']): Promise<EncryptionKey> {
    // Deactivate current active key
    const currentKey = await this.getActiveKeyFromDatabase(purpose)
    if (currentKey) {
      const gracePeriodEnd = new Date(
        Date.now() + this.config.gracePeriodDays * 24 * 60 * 60 * 1000
      )

      await this.supabase
        .from('encryption_keys')
        .update({
          is_active: false,
          expires_at: gracePeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('key_id', currentKey.key_id)

      // Update in encryption service
      const serviceKey = encryptionService.getKey(currentKey.key_id)
      if (serviceKey) {
        serviceKey.isActive = false
        serviceKey.expiresAt = gracePeriodEnd
      }
    }

    // Create new key
    const newKey = await this.createNewKey(purpose)

    // Log the rotation
    await this.logKeyOperation('key_rotation', newKey.id, purpose)

    return newKey
  }

  /**
   * Get active key from database
   */
  private async getActiveKeyFromDatabase(
    purpose: EncryptionKey['purpose']
  ): Promise<any> {
    const { data, error } = await this.supabase
      .from('encryption_keys')
      .select('*')
      .eq('purpose', purpose)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found"
      throw new Error(`Failed to get active key: ${error.message}`)
    }

    return data
  }

  /**
   * Load keys from database into encryption service
   */
  async loadKeysFromDatabase(): Promise<void> {
    const { data: keys, error } = await this.supabase
      .from('encryption_keys')
      .select('*')
      .eq('is_active', true)

    if (error) {
      throw new Error(`Failed to load keys from database: ${error.message}`)
    }

    if (keys) {
      for (const dbKey of keys) {
        // Note: We don't store the actual key in the database for security
        // The key should be provided via environment variables
        const envKey = this.getKeyFromEnvironment(dbKey.purpose)
        if (envKey) {
          const encryptionKey: EncryptionKey = {
            id: dbKey.key_id,
            key: envKey,
            algorithm: dbKey.algorithm,
            createdAt: new Date(dbKey.created_at),
            expiresAt: dbKey.expires_at
              ? new Date(dbKey.expires_at)
              : undefined,
            isActive: dbKey.is_active,
            purpose: dbKey.purpose,
          }
          encryptionService.addKey(encryptionKey)
        }
      }
    }
  }

  /**
   * Get encryption key from environment variables
   */
  private getKeyFromEnvironment(
    purpose: EncryptionKey['purpose']
  ): string | undefined {
    switch (purpose) {
      case 'database':
        return process.env.DATABASE_ENCRYPTION_KEY
      case 'api':
        return process.env.API_ENCRYPTION_KEY
      case 'field':
        return process.env.FIELD_ENCRYPTION_KEY
      case 'storage':
        return process.env.STORAGE_ENCRYPTION_KEY
      default:
        return undefined
    }
  }

  /**
   * Check for keys that need rotation
   */
  async checkKeysForRotation(): Promise<
    { purpose: string; keyId: string; expiresAt: Date }[]
  > {
    const notificationThreshold = new Date(
      Date.now() + this.config.notificationDays * 24 * 60 * 60 * 1000
    )

    const { data: expiringKeys, error } = await this.supabase
      .from('encryption_keys')
      .select('key_id, purpose, expires_at')
      .eq('is_active', true)
      .lt('expires_at', notificationThreshold.toISOString())

    if (error) {
      throw new Error(`Failed to check keys for rotation: ${error.message}`)
    }

    return (expiringKeys || []).map(key => ({
      purpose: key.purpose,
      keyId: key.key_id,
      expiresAt: new Date(key.expires_at),
    }))
  }

  /**
   * Auto-rotate expired keys
   */
  async autoRotateExpiredKeys(): Promise<void> {
    if (!this.config.autoRotate) {
      return
    }

    const { data: expiredKeys, error } = await this.supabase
      .from('encryption_keys')
      .select('purpose')
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString())

    if (error) {
      throw new Error(`Failed to get expired keys: ${error.message}`)
    }

    if (expiredKeys) {
      for (const key of expiredKeys) {
        try {
          await this.rotateKey(key.purpose)
          console.log(`Auto-rotated key for purpose: ${key.purpose}`)
        } catch (error) {
          console.error(`Failed to auto-rotate key for ${key.purpose}:`, error)
        }
      }
    }
  }

  /**
   * Get encryption key statistics
   */
  async getKeyStatistics(): Promise<{
    totalKeys: number
    activeKeys: number
    expiredKeys: number
    expiringKeys: number
    keysByPurpose: Record<string, number>
  }> {
    const { data: allKeys, error } = await this.supabase
      .from('encryption_keys')
      .select('purpose, is_active, expires_at')

    if (error) {
      throw new Error(`Failed to get key statistics: ${error.message}`)
    }

    const now = new Date()
    const notificationThreshold = new Date(
      now.getTime() + this.config.notificationDays * 24 * 60 * 60 * 1000
    )

    const stats = {
      totalKeys: allKeys?.length || 0,
      activeKeys: 0,
      expiredKeys: 0,
      expiringKeys: 0,
      keysByPurpose: {} as Record<string, number>,
    }

    if (allKeys) {
      for (const key of allKeys) {
        const expiresAt = key.expires_at ? new Date(key.expires_at) : null

        // Count by purpose
        stats.keysByPurpose[key.purpose] =
          (stats.keysByPurpose[key.purpose] || 0) + 1

        if (key.is_active) {
          if (!expiresAt || expiresAt > now) {
            stats.activeKeys++
          } else {
            stats.expiredKeys++
          }

          if (
            expiresAt &&
            expiresAt <= notificationThreshold &&
            expiresAt > now
          ) {
            stats.expiringKeys++
          }
        }
      }
    }

    return stats
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    )

    const { data: deletedKeys, error } = await this.supabase
      .from('encryption_keys')
      .delete()
      .eq('is_active', false)
      .lt('expires_at', cutoffDate.toISOString())
      .select('key_id')

    if (error) {
      throw new Error(`Failed to cleanup expired keys: ${error.message}`)
    }

    const deletedCount = deletedKeys?.length || 0

    if (deletedCount > 0) {
      await this.logKeyOperation(
        'key_cleanup',
        `${deletedCount} keys`,
        'cleanup'
      )
    }

    return deletedCount
  }

  /**
   * Hash a key for storage
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex')
  }

  /**
   * Log key management operations
   */
  private async logKeyOperation(
    operation: string,
    keyId: string,
    purpose: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.supabase.from('encryption_audit').insert({
        operation,
        key_id: keyId,
        table_name: 'encryption_keys',
        field_name: purpose,
        success,
        error_message: errorMessage,
      })
    } catch (error) {
      console.error('Failed to log key operation:', error)
    }
  }

  /**
   * Validate key integrity
   */
  async validateKeyIntegrity(): Promise<{
    valid: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    try {
      // Check if all purposes have active keys
      const purposes: EncryptionKey['purpose'][] = [
        'database',
        'api',
        'field',
        'storage',
      ]

      for (const purpose of purposes) {
        const activeKey = await this.getActiveKeyFromDatabase(purpose)
        if (!activeKey) {
          issues.push(`No active key found for purpose: ${purpose}`)
        }
      }

      // Check for keys expiring soon
      const expiringKeys = await this.checkKeysForRotation()
      if (expiringKeys.length > 0) {
        issues.push(
          `${expiringKeys.length} keys expiring within ${this.config.notificationDays} days`
        )
      }

      // Check for expired active keys
      const { data: expiredActiveKeys, error } = await this.supabase
        .from('encryption_keys')
        .select('key_id, purpose')
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString())

      if (error) {
        issues.push(`Failed to check for expired keys: ${error.message}`)
      } else if (expiredActiveKeys && expiredActiveKeys.length > 0) {
        issues.push(`${expiredActiveKeys.length} active keys are expired`)
      }
    } catch (error) {
      issues.push(
        `Key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }
}

// Global key management service instance
export const keyManagementService = new KeyManagementService()

// Utility functions
export const initializeEncryptionKeys = () =>
  keyManagementService.initializeKeys()
export const rotateEncryptionKey = (purpose: EncryptionKey['purpose']) =>
  keyManagementService.rotateKey(purpose)
export const checkKeyRotation = () =>
  keyManagementService.checkKeysForRotation()
export const autoRotateKeys = () => keyManagementService.autoRotateExpiredKeys()
export const getKeyStatistics = () => keyManagementService.getKeyStatistics()
export const validateKeys = () => keyManagementService.validateKeyIntegrity()
