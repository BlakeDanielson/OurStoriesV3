import { NextRequest, NextResponse } from 'next/server'
import { encryptionService, EncryptionResult, DecryptionInput } from './index'

// Configuration for API encryption
export interface ApiEncryptionConfig {
  enableRequestEncryption: boolean
  enableResponseEncryption: boolean
  encryptedPaths: string[]
  excludedPaths: string[]
  sensitiveFields: string[]
}

export const DEFAULT_API_ENCRYPTION_CONFIG: ApiEncryptionConfig = {
  enableRequestEncryption: process.env.ENABLE_API_REQUEST_ENCRYPTION === 'true',
  enableResponseEncryption:
    process.env.ENABLE_API_RESPONSE_ENCRYPTION === 'true',
  encryptedPaths: ['/api/auth', '/api/user', '/api/stories', '/api/ai-content'],
  excludedPaths: ['/api/health', '/api/csrf-token', '/api/test-csrf'],
  sensitiveFields: [
    'password',
    'email',
    'personalInfo',
    'prompt',
    'content',
    'metadata',
  ],
}

/**
 * API Encryption Service for handling request/response encryption
 */
export class ApiEncryptionService {
  private config: ApiEncryptionConfig

  constructor(config: ApiEncryptionConfig = DEFAULT_API_ENCRYPTION_CONFIG) {
    this.config = config
  }

  /**
   * Check if a path should be encrypted
   */
  shouldEncryptPath(pathname: string): boolean {
    // Check if path is excluded
    if (this.config.excludedPaths.some(path => pathname.startsWith(path))) {
      return false
    }

    // Check if path is in encrypted paths
    return this.config.encryptedPaths.some(path => pathname.startsWith(path))
  }

  /**
   * Encrypt API request payload
   */
  async encryptRequest(request: NextRequest): Promise<NextRequest> {
    if (
      !this.config.enableRequestEncryption ||
      !this.shouldEncryptPath(request.nextUrl.pathname)
    ) {
      return request
    }

    try {
      const contentType = request.headers.get('content-type')

      if (!contentType?.includes('application/json')) {
        return request
      }

      const body = await request.text()
      if (!body) {
        return request
      }

      const data = JSON.parse(body)
      const encryptedData = await this.encryptSensitiveFields(data)

      // Create new request with encrypted body
      const encryptedBody = JSON.stringify(encryptedData)
      const newRequest = new NextRequest(request.url, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'content-length': encryptedBody.length.toString(),
          'x-payload-encrypted': 'true',
        },
        body: encryptedBody,
      })

      return newRequest
    } catch (error) {
      console.error('Failed to encrypt API request:', error)
      return request
    }
  }

  /**
   * Decrypt API request payload
   */
  async decryptRequest(request: NextRequest): Promise<any> {
    const isEncrypted = request.headers.get('x-payload-encrypted') === 'true'

    if (!isEncrypted) {
      const body = await request.text()
      return body ? JSON.parse(body) : {}
    }

    try {
      const body = await request.text()
      if (!body) {
        return {}
      }

      const encryptedData = JSON.parse(body)
      return await this.decryptSensitiveFields(encryptedData)
    } catch (error) {
      console.error('Failed to decrypt API request:', error)
      throw new Error('Invalid encrypted payload')
    }
  }

  /**
   * Encrypt API response payload
   */
  async encryptResponse(
    response: NextResponse,
    pathname: string
  ): Promise<NextResponse> {
    if (
      !this.config.enableResponseEncryption ||
      !this.shouldEncryptPath(pathname)
    ) {
      return response
    }

    try {
      const contentType = response.headers.get('content-type')

      if (!contentType?.includes('application/json')) {
        return response
      }

      const body = await response.text()
      if (!body) {
        return response
      }

      const data = JSON.parse(body)
      const encryptedData = await this.encryptSensitiveFields(data)

      // Create new response with encrypted body
      const encryptedBody = JSON.stringify(encryptedData)
      const newResponse = new NextResponse(encryptedBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'content-length': encryptedBody.length.toString(),
          'x-payload-encrypted': 'true',
        },
      })

      return newResponse
    } catch (error) {
      console.error('Failed to encrypt API response:', error)
      return response
    }
  }

  /**
   * Encrypt sensitive fields in an object
   */
  private async encryptSensitiveFields(data: any): Promise<any> {
    if (!data || typeof data !== 'object') {
      return data
    }

    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.encryptSensitiveFields(item)))
    }

    const result = { ...data }
    const fieldsToEncrypt: string[] = []

    // Find sensitive fields
    for (const field of this.config.sensitiveFields) {
      if (result[field] !== undefined && result[field] !== null) {
        fieldsToEncrypt.push(field)
      }
    }

    if (fieldsToEncrypt.length > 0) {
      const encrypted = await encryptionService.encryptFields(
        result,
        fieldsToEncrypt,
        'api'
      )
      return encrypted
    }

    // Recursively encrypt nested objects
    for (const [key, value] of Object.entries(result)) {
      if (value && typeof value === 'object') {
        result[key] = await this.encryptSensitiveFields(value)
      }
    }

    return result
  }

  /**
   * Decrypt sensitive fields in an object
   */
  private async decryptSensitiveFields(data: any): Promise<any> {
    if (!data || typeof data !== 'object') {
      return data
    }

    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.decryptSensitiveFields(item)))
    }

    // Check if this object has encrypted fields metadata
    if (data._encrypted_fields && Array.isArray(data._encrypted_fields)) {
      return await encryptionService.decryptFields(data)
    }

    // Recursively decrypt nested objects
    const result = { ...data }
    for (const [key, value] of Object.entries(result)) {
      if (value && typeof value === 'object') {
        result[key] = await this.decryptSensitiveFields(value)
      }
    }

    return result
  }

  /**
   * Create middleware for API encryption
   */
  createMiddleware() {
    return async (request: NextRequest) => {
      const pathname = request.nextUrl.pathname

      // Skip encryption for excluded paths
      if (!this.shouldEncryptPath(pathname)) {
        return NextResponse.next()
      }

      try {
        // For requests with encrypted payloads, add decryption context
        if (request.headers.get('x-payload-encrypted') === 'true') {
          // Clone the request and add decryption flag
          const newHeaders = new Headers(request.headers)
          newHeaders.set('x-needs-decryption', 'true')

          return NextResponse.next({
            request: {
              headers: newHeaders,
            },
          })
        }

        return NextResponse.next()
      } catch (error) {
        console.error('API encryption middleware error:', error)
        return new NextResponse('Encryption error', { status: 500 })
      }
    }
  }
}

// Global API encryption service instance
export const apiEncryptionService = new ApiEncryptionService()

/**
 * Utility function to encrypt API request body
 */
export async function encryptApiPayload(data: any): Promise<any> {
  return apiEncryptionService['encryptSensitiveFields'](data)
}

/**
 * Utility function to decrypt API response body
 */
export async function decryptApiPayload(data: any): Promise<any> {
  return apiEncryptionService['decryptSensitiveFields'](data)
}

/**
 * Higher-order function to wrap API handlers with encryption/decryption
 */
export function withApiEncryption(
  handler: (request: any, ...args: any[]) => Promise<any>
) {
  return async (request: any, ...args: any[]): Promise<any> => {
    try {
      // Decrypt request if needed
      let decryptedRequest = request

      if (request && typeof request === 'object' && request.headers) {
        const needsDecryption =
          request.headers.get?.('x-needs-decryption') === 'true'
        if (needsDecryption) {
          decryptedRequest = await apiEncryptionService.decryptRequest(request)
        }
      }

      // Call the original handler
      const result = await handler(decryptedRequest, ...args)

      // Encrypt response if needed
      if (result && typeof result === 'object') {
        return await apiEncryptionService['encryptSensitiveFields'](result)
      }

      return result
    } catch (error) {
      console.error('API encryption wrapper error:', error)
      throw error
    }
  }
}

/**
 * Middleware function for Next.js API routes
 */
export async function apiEncryptionMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  return apiEncryptionService.createMiddleware()(request)
}
