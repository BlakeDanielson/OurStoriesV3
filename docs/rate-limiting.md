# Rate Limiting System

## Overview

The rate limiting system protects the ourStories API from abuse and DDoS attacks by implementing configurable request limits per endpoint type. It uses Upstash Redis for distributed rate limiting in production with a memory-based fallback for development.

## Features

- **Distributed Rate Limiting**: Uses Upstash Redis for multi-instance deployments
- **Development Fallback**: Memory-based rate limiting when Redis is not configured
- **Endpoint-Specific Limits**: Different limits for different types of endpoints
- **User-Aware**: Separate limits for authenticated vs anonymous users
- **Rate Limit Headers**: Proper X-RateLimit-\* headers in all responses
- **Security Monitoring**: Logs rate limit violations for security analysis
- **Graceful Degradation**: Continues to work even if Redis fails

## Rate Limits by Endpoint Type

| Endpoint Type  | Limit        | Window     | Description                   |
| -------------- | ------------ | ---------- | ----------------------------- |
| Authentication | 5 requests   | 1 minute   | Login, signup, password reset |
| AI Generation  | 10 requests  | 1 minute   | Story/image generation        |
| File Upload    | 20 requests  | 1 hour     | File uploads via UploadThing  |
| Admin          | 30 requests  | 1 minute   | Admin panel operations        |
| Feedback       | 20 requests  | 1 minute   | User feedback submissions     |
| General API    | 100 requests | 15 minutes | All other API endpoints       |

## Configuration

### Environment Variables

```bash
# Required for production
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Optional - Redis will fallback to memory if not configured
```

### Rate Limit Configuration

Rate limits are configured in `lib/rate-limiting/config.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts per minute
    message: 'Too many authentication attempts. Please try again in 1 minute.',
  },
  // ... other configurations
}
```

## Usage in API Routes

### Using API Wrappers (Recommended)

```typescript
import { createProtectedApiRoute } from '@/lib/rate-limiting/api-wrapper'

async function handlePOST(request: NextRequest) {
  // Your API logic here
  return NextResponse.json({ success: true })
}

// Apply rate limiting and authentication
export const POST = createProtectedApiRoute(handlePOST, {
  requireAuth: true,
})
```

### Available Wrappers

```typescript
// Protected route with authentication and rate limiting
export const POST = createProtectedApiRoute(handler, {
  requireAuth: true,
  allowedRoles: ['admin'], // optional
})

// Public route with rate limiting only
export const GET = createPublicApiRoute(handler)

// Admin route with strict rate limiting
export const POST = createAdminApiRoute(handler)

// Simple rate limiting without auth
export const GET = createRateLimitedApiRoute(handler)
```

### Manual Rate Limiting

```typescript
import { withRateLimit } from '@/lib/rate-limiting/middleware'

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    async req => {
      // Your API logic here
      return NextResponse.json({ success: true })
    },
    userId
  ) // optional user ID for user-specific limits
}
```

## Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 900
```

## Rate Limit Exceeded Response

When rate limit is exceeded, the API returns:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

HTTP Status: `429 Too Many Requests`

## Monitoring

Rate limit violations are automatically logged with the following information:

```javascript
{
  path: "/api/feedback",
  userId: "user-123" || "anonymous",
  ip: "192.168.1.1",
  limit: 20,
  remaining: 0,
  timestamp: "2025-06-01T22:00:00.000Z"
}
```

## Key Generation

Rate limit keys are generated based on:

1. **User ID** (for authenticated requests): `ratelimit:user:123:/api/feedback`
2. **IP Address** (for anonymous requests): `ratelimit:ip:192.168.1.1:/api/feedback`

This allows for separate rate limits per user while still protecting against IP-based attacks.

## Development vs Production

### Development

- Uses memory-based rate limiting
- Automatic cleanup of expired entries
- Console warnings when Redis is not configured

### Production

- Uses Upstash Redis for distributed rate limiting
- Persistent rate limit data across server restarts
- Analytics and monitoring through Upstash dashboard

## Security Considerations

1. **IP Spoofing Protection**: Uses multiple headers to determine real IP
2. **User-Based Limits**: Prevents authenticated users from bypassing IP limits
3. **Endpoint-Specific Limits**: Different limits for different risk levels
4. **Monitoring**: All violations are logged for security analysis
5. **Graceful Degradation**: System continues to work even if Redis fails

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**

   - Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - System will fallback to memory-based limiting

2. **Rate Limits Too Strict**

   - Adjust limits in `lib/rate-limiting/config.ts`
   - Consider different limits for different user types

3. **Missing Rate Limit Headers**
   - Ensure API routes use the wrapper functions
   - Check middleware integration

### Debugging

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show rate limiting decisions in the console.

## Future Enhancements

- Dynamic rate limits based on user subscription tier
- Whitelist/blacklist functionality
- Rate limit bypass for trusted IPs
- Integration with external threat detection services
- Custom rate limit rules per API key
