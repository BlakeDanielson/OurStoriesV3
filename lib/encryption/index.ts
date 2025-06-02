import {
  createCipher,
  createDecipher,
  randomBytes,
  scrypt,
  createHash,
} from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

// Encryption configuration
export interface EncryptionConfig {
  algorithm: string
  keySize: number
  ivSize: number
  tagSize: number
  iterations: number
}

export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-cbc',
  keySize: 32, // 256 bits
  ivSize: 16, // 128 bits
  tagSize: 16, // 128 bits
  iterations: 10000,
}

// Key management interface
export interface EncryptionKey {
  id: string
  key: string
  algorithm: string
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
  purpose: 'database' | 'api' | 'field' | 'storage'
}

// Encryption result interface
export interface EncryptionResult {
  encryptedData: string
  iv: string
  keyId: string
  algorithm: string
}

// Decryption input interface
export interface DecryptionInput {
  encryptedData: string
  iv: string
  keyId: string
  algorithm: string
}

/**
 * Core encryption service for handling all encryption operations
 */
export class EncryptionService {
  private keys: Map<string, EncryptionKey> = new Map()
  private config: EncryptionConfig

  constructor(config: EncryptionConfig = DEFAULT_ENCRYPTION_CONFIG) {
    this.config = config
    this.initializeDefaultKeys()
  }

  /**
   * Initialize default encryption keys from environment variables
   */
  private initializeDefaultKeys(): void {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY
    const databaseKey = process.env.DATABASE_ENCRYPTION_KEY
    const apiKey = process.env.API_ENCRYPTION_KEY
    const fieldKey = process.env.FIELD_ENCRYPTION_KEY

    if (masterKey) {
      this.addKey({
        id: 'master',
        key: masterKey,
        algorithm: this.config.algorithm,
        createdAt: new Date(),
        isActive: true,
        purpose: 'database',
      })
    }

    if (databaseKey) {
      this.addKey({
        id: 'database',
        key: databaseKey,
        algorithm: this.config.algorithm,
        createdAt: new Date(),
        isActive: true,
        purpose: 'database',
      })
    }

    if (apiKey) {
      this.addKey({
        id: 'api',
        key: apiKey,
        algorithm: this.config.algorithm,
        createdAt: new Date(),
        isActive: true,
        purpose: 'api',
      })
    }

    if (fieldKey) {
      this.addKey({
        id: 'field',
        key: fieldKey,
        algorithm: this.config.algorithm,
        createdAt: new Date(),
        isActive: true,
        purpose: 'field',
      })
    }
  }

  /**
   * Add an encryption key to the service
   */
  addKey(key: EncryptionKey): void {
    this.keys.set(key.id, key)
  }

  /**
   * Get an encryption key by ID
   */
  getKey(keyId: string): EncryptionKey | undefined {
    return this.keys.get(keyId)
  }

  /**
   * Get active key for a specific purpose
   */
  getActiveKey(purpose: EncryptionKey['purpose']): EncryptionKey | undefined {
    const keysArray = Array.from(this.keys.values())
    for (const key of keysArray) {
      if (key.purpose === purpose && key.isActive && !this.isKeyExpired(key)) {
        return key
      }
    }
    return undefined
  }

  /**
   * Check if a key is expired
   */
  private isKeyExpired(key: EncryptionKey): boolean {
    return key.expiresAt ? new Date() > key.expiresAt : false
  }

  /**
   * Generate a new encryption key
   */
  generateKey(
    purpose: EncryptionKey['purpose'],
    expiresInDays?: number
  ): EncryptionKey {
    const keyId = `${purpose}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const key = randomBytes(this.config.keySize).toString('hex')

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined

    const newKey: EncryptionKey = {
      id: keyId,
      key,
      algorithm: this.config.algorithm,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
      purpose,
    }

    this.addKey(newKey)
    return newKey
  }

  /**
   * Derive key from password using scrypt
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return scryptAsync(password, salt, this.config.keySize) as Promise<Buffer>
  }

  /**
   * Create a hash of the key for consistent key derivation
   */
  private hashKey(key: string): string {
    return createHash('sha256')
      .update(key)
      .digest('hex')
      .slice(0, this.config.keySize * 2)
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  async encrypt(
    data: string,
    keyId?: string,
    purpose: EncryptionKey['purpose'] = 'field'
  ): Promise<EncryptionResult> {
    let encryptionKey: EncryptionKey | undefined

    if (keyId) {
      encryptionKey = this.getKey(keyId)
    } else {
      encryptionKey = this.getActiveKey(purpose)
    }

    if (!encryptionKey) {
      throw new Error(`No active encryption key found for purpose: ${purpose}`)
    }

    // Generate random IV
    const iv = randomBytes(this.config.ivSize)

    // Hash the key to ensure consistent length
    const hashedKey = this.hashKey(encryptionKey.key)

    // Create cipher
    const cipher = createCipher(this.config.algorithm, hashedKey)

    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      keyId: encryptionKey.id,
      algorithm: encryptionKey.algorithm,
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   */
  async decrypt(input: DecryptionInput): Promise<string> {
    const encryptionKey = this.getKey(input.keyId)

    if (!encryptionKey) {
      throw new Error(`Encryption key not found: ${input.keyId}`)
    }

    if (!encryptionKey.isActive) {
      throw new Error(`Encryption key is not active: ${input.keyId}`)
    }

    try {
      // Hash the key to ensure consistent length
      const hashedKey = this.hashKey(encryptionKey.key)

      // Create decipher
      const decipher = createDecipher(this.config.algorithm, hashedKey)

      // Decrypt the data
      let decrypted = decipher.update(input.encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Encrypt sensitive fields in an object
   */
  async encryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToEncrypt: (keyof T)[],
    purpose: EncryptionKey['purpose'] = 'field'
  ): Promise<T & { _encrypted_fields?: string[] }> {
    const result = { ...data } as T & { _encrypted_fields?: string[] }
    const encryptedFields: string[] = []

    for (const field of fieldsToEncrypt) {
      if (data[field] !== undefined && data[field] !== null) {
        const fieldValue =
          typeof data[field] === 'string'
            ? data[field]
            : JSON.stringify(data[field])

        const encrypted = await this.encrypt(fieldValue, undefined, purpose)
        result[field] = JSON.stringify(encrypted) as any
        encryptedFields.push(field as string)
      }
    }

    // Add metadata about encrypted fields
    result._encrypted_fields = encryptedFields

    return result
  }

  /**
   * Decrypt sensitive fields in an object
   */
  async decryptFields<T extends Record<string, any>>(
    data: T & { _encrypted_fields?: string[] }
  ): Promise<T> {
    const result = { ...data } as T
    const encryptedFields = data._encrypted_fields || []

    for (const field of encryptedFields) {
      const fieldValue = (data as any)[field]
      if (fieldValue !== undefined && fieldValue !== null) {
        try {
          const encryptionInput = JSON.parse(fieldValue) as DecryptionInput
          const decrypted = await this.decrypt(encryptionInput)

          // Try to parse as JSON, fallback to string
          try {
            ;(result as any)[field] = JSON.parse(decrypted)
          } catch {
            ;(result as any)[field] = decrypted
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error)
          // Keep the encrypted value if decryption fails
        }
      }
    }

    // Remove metadata
    delete (result as any)._encrypted_fields

    return result
  }

  /**
   * Rotate encryption keys
   */
  rotateKey(
    purpose: EncryptionKey['purpose'],
    expiresInDays?: number
  ): EncryptionKey {
    // Deactivate current active key
    const currentKey = this.getActiveKey(purpose)
    if (currentKey) {
      currentKey.isActive = false
      currentKey.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days grace period
    }

    // Generate new key
    return this.generateKey(purpose, expiresInDays)
  }

  /**
   * Get encryption metadata for audit purposes
   */
  getEncryptionMetadata(): {
    activeKeys: { purpose: string; keyId: string; createdAt: Date }[]
    expiredKeys: { purpose: string; keyId: string; expiresAt: Date }[]
    totalKeys: number
  } {
    const activeKeys: { purpose: string; keyId: string; createdAt: Date }[] = []
    const expiredKeys: { purpose: string; keyId: string; expiresAt: Date }[] =
      []

    const keysArray = Array.from(this.keys.values())
    for (const key of keysArray) {
      if (key.isActive && !this.isKeyExpired(key)) {
        activeKeys.push({
          purpose: key.purpose,
          keyId: key.id,
          createdAt: key.createdAt,
        })
      } else if (this.isKeyExpired(key)) {
        expiredKeys.push({
          purpose: key.purpose,
          keyId: key.id,
          expiresAt: key.expiresAt!,
        })
      }
    }

    return {
      activeKeys,
      expiredKeys,
      totalKeys: this.keys.size,
    }
  }
}

// Global encryption service instance
export const encryptionService = new EncryptionService()

// Utility functions for common encryption operations
export const encryptSensitiveData = async (
  data: string,
  purpose: EncryptionKey['purpose'] = 'field'
) => {
  return encryptionService.encrypt(data, undefined, purpose)
}

export const decryptSensitiveData = async (input: DecryptionInput) => {
  return encryptionService.decrypt(input)
}

export const encryptObject = async <T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[],
  purpose: EncryptionKey['purpose'] = 'field'
) => {
  return encryptionService.encryptFields(data, fieldsToEncrypt, purpose)
}

export const decryptObject = async <T extends Record<string, any>>(
  data: T & { _encrypted_fields?: string[] }
) => {
  return encryptionService.decryptFields(data)
}
