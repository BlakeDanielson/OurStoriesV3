# CSRF Protection System

## Overview

The ourStories application implements comprehensive Cross-Site Request Forgery (CSRF) protection to prevent malicious websites from performing unauthorized actions on behalf of authenticated users. The system uses a double-submit cookie pattern with HMAC-based token validation.

## Architecture

### Core Components

1. **Token Generation** (`lib/csrf/tokens.ts`)

   - HMAC-based token generation using Web Crypto API
   - Edge Runtime compatible implementation
   - 24-hour token expiration
   - Cryptographically secure random string generation

2. **Middleware Protection** (`lib/csrf/middleware.ts`)

   - API route wrapper for CSRF protection
   - Origin validation for additional security
   - Request body cloning to avoid consumption issues

3. **Client Integration** (`lib/hooks/use-csrf.ts`)

   - React hook for client-side CSRF token management
   - Automatic token fetching and refresh
   - Helper functions for API requests

4. **Security Configuration** (`lib/utils/security.ts`)
   - CSRF configuration constants
   - Security headers and policies
   - Origin validation helpers

## Implementation Details

### Token Structure

CSRF tokens follow the format: `{timestamp}:{randomPart}:{hmacSignature}`

- **Timestamp**: Unix timestamp for expiration checking
- **Random Part**: 16-character cryptographically secure random string
- **HMAC Signature**: SHA-256 HMAC of timestamp:randomPart using secret

### Cookie Configuration

```typescript
{
  cookieName: '__Host-csrf-token',
  httpOnly: true,
  secure: true, // Production only
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 // 24 hours
}
```

### Protected Methods

CSRF protection is applied to state-changing HTTP methods:

- POST
- PUT
- PATCH
- DELETE

GET, HEAD, and OPTIONS requests are not protected.

### Excluded Paths

The following paths are excluded from CSRF protection:

- `/api/auth/` - Authentication endpoints
- `/api/webhooks/` - Webhook endpoints
- `/api/health` - Health check endpoint
- `/api/csrf-token` - CSRF token endpoint

## Usage

### Protecting API Routes

Use the `withCSRFProtection` wrapper to protect API routes:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withCSRFProtection } from '@/lib/csrf/middleware'

async function postHandler(request: NextRequest) {
  // Your API logic here
  const body = await request.json()
  return NextResponse.json({ success: true })
}

export const POST = withCSRFProtection(postHandler)
```

### Client-Side Usage

#### Using the React Hook

```typescript
import { useCSRF } from '@/lib/hooks/use-csrf'

function MyComponent() {
  const { token, loading, error, makeCSRFRequest, getCSRFHeaders } = useCSRF()

  const handleSubmit = async () => {
    try {
      const response = await makeCSRFRequest('/api/my-endpoint', {
        method: 'POST',
        body: JSON.stringify({ data: 'example' })
      })
      // Handle response
    } catch (error) {
      console.error('Request failed:', error)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return <button onClick={handleSubmit}>Submit</button>
}
```

#### Manual Token Inclusion

**In Headers:**

```typescript
const headers = {
  'X-CSRF-Token': csrfToken,
  'Content-Type': 'application/json',
}
```

**In Request Body:**

```typescript
const body = {
  data: 'example',
  _csrf: csrfToken,
}
```

**In Form Data:**

```typescript
const formData = new FormData()
formData.append('_csrf', csrfToken)
formData.append('data', 'example')
```

### Getting CSRF Tokens

Fetch a CSRF token from the server:

```typescript
const response = await fetch('/api/csrf-token', {
  method: 'GET',
  credentials: 'include',
})
const { csrfToken } = await response.json()
```

## Security Features

### Double Submit Cookie Pattern

1. Server generates a secret and stores it in an HTTP-only cookie
2. Server generates a token using the secret and returns it to the client
3. Client includes the token in requests (header or body)
4. Server validates the token against the secret from the cookie

### Origin Validation

Additional protection through origin header validation:

- Checks `Origin` header for CORS requests
- Falls back to `Referer` header validation
- Allows same-origin requests without origin header

### Token Expiration

- Tokens expire after 24 hours
- Automatic validation of timestamp during verification
- Clients should refresh tokens when they expire

### Secure Cookie Attributes

- `HttpOnly`: Prevents JavaScript access to the secret
- `Secure`: HTTPS-only in production
- `SameSite=Strict`: Prevents cross-site cookie sending
- `__Host-` prefix: Additional security for HTTPS

## Error Handling

### CSRF Validation Failures

When CSRF validation fails, the server returns:

```json
{
  "error": "CSRF token validation failed",
  "message": "Invalid or missing CSRF token. Please refresh the page and try again.",
  "code": "CSRF_TOKEN_INVALID"
}
```

HTTP Status: `403 Forbidden`

### Origin Validation Failures

When origin validation fails:

```json
{
  "error": "Origin validation failed",
  "message": "Request origin is not allowed",
  "code": "INVALID_ORIGIN"
}
```

HTTP Status: `403 Forbidden`

## Testing

### Automated Testing

Run the comprehensive CSRF test suite:

```bash
node scripts/test-csrf.js
```

This tests:

1. CSRF token generation
2. Request blocking without token
3. Request success with token in header
4. Request success with token in body
5. GET request handling (no protection needed)

### Manual Testing

1. **Get Token**: `curl http://localhost:3001/api/csrf-token`
2. **Test Protection**: `curl -X POST -H "Content-Type: application/json" -d '{"test": "data"}' http://localhost:3001/api/test-csrf`
3. **Test With Token**: Include `X-CSRF-Token` header or `_csrf` in body

## Configuration

### Environment Variables

No environment variables are required for basic CSRF protection. Optional configuration:

- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for additional validation

### Runtime Configuration

CSRF settings are configured in `lib/csrf/tokens.ts`:

```typescript
export const CSRF_CONFIG = {
  cookieName: '__Host-csrf-token',
  headerName: 'x-csrf-token',
  secretLength: 32,
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  },
}
```

## Performance Considerations

- Token generation uses Web Crypto API for optimal performance
- Request body cloning ensures original request remains consumable
- Memory-efficient token validation without external dependencies
- Edge Runtime compatible for Vercel deployment

## Security Best Practices

1. **Always use HTTPS in production** for secure cookie transmission
2. **Validate tokens on every state-changing request**
3. **Use the provided wrapper functions** rather than manual implementation
4. **Handle token expiration gracefully** in client applications
5. **Monitor CSRF validation failures** for potential attacks
6. **Keep tokens short-lived** (24-hour expiration)

## Troubleshooting

### Common Issues

1. **"No secret found"**: Client hasn't fetched a CSRF token yet
2. **"Token verification failed"**: Token expired or tampered with
3. **"Request body consumption"**: Use `withCSRFProtection` wrapper
4. **"Origin validation failed"**: Check allowed origins configuration

### Debug Information

Enable debug logging by checking server console for CSRF-related messages during development.

## Integration with Other Security Measures

CSRF protection works alongside:

- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Controls cross-origin requests
- **Security Headers**: Additional browser protections
- **Authentication**: User session validation

The CSRF system is designed to complement, not replace, other security measures in the application.
