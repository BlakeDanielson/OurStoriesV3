# Encryption Environment Variables

This document outlines the environment variables required for the encryption system.

## Required Encryption Keys

Add these to your `.env.local` file:

```bash
# Database Encryption Key (32+ characters)
DATABASE_ENCRYPTION_KEY=your_database_encryption_key_32_chars_minimum_length

# API Payload Encryption Key (32+ characters)
API_ENCRYPTION_KEY=your_api_encryption_key_32_chars_minimum_length

# Field-Level Encryption Key (32+ characters)
FIELD_ENCRYPTION_KEY=your_field_encryption_key_32_chars_minimum_length

# Storage Encryption Key (32+ characters)
STORAGE_ENCRYPTION_KEY=your_storage_encryption_key_32_chars_minimum_length
```

## Optional Encryption Settings

```bash
# Enable/disable API request encryption
ENABLE_API_REQUEST_ENCRYPTION=false

# Enable/disable API response encryption
ENABLE_API_RESPONSE_ENCRYPTION=false

# Key rotation interval in days (default: 90)
ENCRYPTION_KEY_ROTATION_DAYS=90

# Grace period for old keys in days (default: 30)
ENCRYPTION_GRACE_PERIOD_DAYS=30

# Enable automatic key rotation (default: true)
ENCRYPTION_AUTO_ROTATE=true
```

## Key Generation

You can generate secure encryption keys using Node.js:

```javascript
const crypto = require('crypto')

// Generate a 256-bit (32-byte) key
const key = crypto.randomBytes(32).toString('hex')
console.log(key)
```

Or using OpenSSL:

```bash
openssl rand -hex 32
```

## Security Notes

1. **Never commit encryption keys to version control**
2. **Use different keys for different environments**
3. **Store keys securely in production (e.g., AWS Secrets Manager, Azure Key Vault)**
4. **Rotate keys regularly (recommended: every 90 days)**
5. **Keep backup of keys in secure location**

## Key Purposes

- **DATABASE_ENCRYPTION_KEY**: Used for database-level encryption operations
- **API_ENCRYPTION_KEY**: Used for encrypting API request/response payloads
- **FIELD_ENCRYPTION_KEY**: Used for field-level encryption of sensitive data
- **STORAGE_ENCRYPTION_KEY**: Used for encrypting files and storage objects

## Production Deployment

For production environments, consider:

1. Using a dedicated key management service
2. Implementing hardware security modules (HSM)
3. Setting up automated key rotation
4. Monitoring key usage and access
5. Implementing key escrow for disaster recovery
