import {
  EncryptionService,
  encryptionService,
  encryptSensitiveData,
  decryptSensitiveData,
} from '@/lib/encryption'
import { randomBytes } from 'crypto'

// Mock environment variables for testing
const mockEnvVars = {
  DATABASE_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
  API_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
  FIELD_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
  STORAGE_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
}

// Set up environment variables
Object.assign(process.env, mockEnvVars)

describe('Encryption Service', () => {
  let testEncryptionService: EncryptionService

  beforeEach(() => {
    testEncryptionService = new EncryptionService()
  })

  describe('Key Management', () => {
    test('should generate new encryption key', () => {
      const key = testEncryptionService.generateKey('field', 30)

      expect(key.id).toBeDefined()
      expect(key.key).toBeDefined()
      expect(key.purpose).toBe('field')
      expect(key.isActive).toBe(true)
      expect(key.expiresAt).toBeDefined()
    })

    test('should get active key for purpose', () => {
      const key = testEncryptionService.generateKey('api')
      const activeKey = testEncryptionService.getActiveKey('api')

      expect(activeKey).toBeDefined()
      expect(activeKey?.purpose).toBe('api')
      expect(activeKey?.isActive).toBe(true)
    })

    test('should rotate encryption keys', () => {
      const originalKey = testEncryptionService.generateKey('database')
      const rotatedKey = testEncryptionService.rotateKey('database')

      expect(rotatedKey.id).not.toBe(originalKey.id)
      expect(rotatedKey.purpose).toBe('database')
      expect(rotatedKey.isActive).toBe(true)
      expect(originalKey.isActive).toBe(false)
    })
  })

  describe('Data Encryption/Decryption', () => {
    test('should encrypt and decrypt text data', async () => {
      const testData = 'This is sensitive information'

      const encrypted = await testEncryptionService.encrypt(
        testData,
        undefined,
        'field'
      )
      expect(encrypted.encryptedData).toBeDefined()
      expect(encrypted.iv).toBeDefined()
      expect(encrypted.keyId).toBeDefined()

      const decrypted = await testEncryptionService.decrypt(encrypted)
      expect(decrypted).toBe(testData)
    })

    test('should encrypt and decrypt object fields', async () => {
      const testObject = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        publicInfo: 'This is public',
      }

      const fieldsToEncrypt = [
        'email',
        'password',
      ] as (keyof typeof testObject)[]
      const encrypted = await testEncryptionService.encryptFields(
        testObject,
        fieldsToEncrypt,
        'field'
      )

      expect((encrypted as any)._encrypted_fields).toEqual(fieldsToEncrypt)
      expect(encrypted.name).toBe('John Doe') // Not encrypted
      expect(encrypted.publicInfo).toBe('This is public') // Not encrypted
      expect(typeof encrypted.email).toBe('string')
      expect(encrypted.email).not.toBe('john@example.com') // Should be encrypted

      const decrypted = await testEncryptionService.decryptFields(encrypted)
      expect(decrypted.email).toBe('john@example.com')
      expect(decrypted.password).toBe('secret123')
      expect((decrypted as any)._encrypted_fields).toBeUndefined() // Metadata removed
    })

    test('should handle empty and null values', async () => {
      const testObject = {
        field1: null,
        field2: undefined,
        field3: '',
        field4: 'valid data',
      }

      const encrypted = await testEncryptionService.encryptFields(
        testObject,
        ['field1', 'field2', 'field3', 'field4'],
        'field'
      )
      const decrypted = await testEncryptionService.decryptFields(encrypted)

      expect(decrypted.field1).toBeNull()
      expect(decrypted.field2).toBeUndefined()
      expect(decrypted.field3).toBe('')
      expect(decrypted.field4).toBe('valid data')
    })
  })

  describe('Utility Functions', () => {
    test('should encrypt and decrypt using utility functions', async () => {
      const testData = 'Test sensitive data'

      const encrypted = await encryptSensitiveData(testData, 'field')
      const decrypted = await decryptSensitiveData(encrypted)

      expect(decrypted).toBe(testData)
    })
  })

  describe('Error Handling', () => {
    test('should throw error for invalid key ID', async () => {
      const invalidInput = {
        encryptedData: 'invalid',
        iv: 'invalid',
        keyId: 'nonexistent',
        algorithm: 'aes-256-cbc',
      }

      await expect(testEncryptionService.decrypt(invalidInput)).rejects.toThrow(
        'Encryption key not found'
      )
    })

    test('should throw error when no active key found', async () => {
      const serviceWithoutKeys = new EncryptionService()

      await expect(
        serviceWithoutKeys.encrypt('test', undefined, 'nonexistent' as any)
      ).rejects.toThrow('No active encryption key found')
    })
  })

  describe('Encryption Metadata', () => {
    test('should return encryption metadata', () => {
      testEncryptionService.generateKey('database')
      testEncryptionService.generateKey('api')

      const metadata = testEncryptionService.getEncryptionMetadata()

      expect(metadata.totalKeys).toBeGreaterThan(0)
      expect(metadata.activeKeys.length).toBeGreaterThan(0)
      expect(metadata.activeKeys[0]).toHaveProperty('purpose')
      expect(metadata.activeKeys[0]).toHaveProperty('keyId')
      expect(metadata.activeKeys[0]).toHaveProperty('createdAt')
    })
  })

  describe('Key Expiration', () => {
    test('should handle expired keys', () => {
      const expiredKey = testEncryptionService.generateKey('storage', -1) // Expired yesterday
      const activeKey = testEncryptionService.getActiveKey('storage')

      expect(activeKey).toBeUndefined() // Should not return expired key
    })
  })
})

describe('Integration Tests', () => {
  test('should work with global encryption service', async () => {
    const testData = 'Global service test'

    const encrypted = await encryptSensitiveData(testData)
    const decrypted = await decryptSensitiveData(encrypted)

    expect(decrypted).toBe(testData)
  })
})
