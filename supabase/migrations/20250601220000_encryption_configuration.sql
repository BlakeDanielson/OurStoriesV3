-- Enable necessary extensions for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create encryption keys table for key management
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT UNIQUE NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('database', 'api', 'field', 'storage')),
    algorithm TEXT NOT NULL DEFAULT 'aes-256-cbc',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    key_hash TEXT NOT NULL, -- Store hash of the key, not the key itself
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for encryption keys
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access encryption keys
CREATE POLICY "Service role can manage encryption keys" ON encryption_keys
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to encrypt sensitive text fields
CREATE OR REPLACE FUNCTION encrypt_sensitive_text(
    plaintext TEXT,
    key_text TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Use provided key or get default field encryption key
    IF key_text IS NULL THEN
        SELECT current_setting('app.field_encryption_key', true) INTO encryption_key;
        IF encryption_key IS NULL OR encryption_key = '' THEN
            RAISE EXCEPTION 'No encryption key available';
        END IF;
    ELSE
        encryption_key := key_text;
    END IF;
    
    -- Encrypt using pgcrypto
    RETURN encode(
        encrypt(
            plaintext::bytea,
            encryption_key::bytea,
            'aes'
        ),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt sensitive text fields
CREATE OR REPLACE FUNCTION decrypt_sensitive_text(
    ciphertext TEXT,
    key_text TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Use provided key or get default field encryption key
    IF key_text IS NULL THEN
        SELECT current_setting('app.field_encryption_key', true) INTO encryption_key;
        IF encryption_key IS NULL OR encryption_key = '' THEN
            RAISE EXCEPTION 'No encryption key available';
        END IF;
    ELSE
        encryption_key := key_text;
    END IF;
    
    -- Decrypt using pgcrypto
    RETURN convert_from(
        decrypt(
            decode(ciphertext, 'base64'),
            encryption_key::bytea,
            'aes'
        ),
        'UTF8'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Return original text if decryption fails (for backwards compatibility)
        RETURN ciphertext;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if text is encrypted
CREATE OR REPLACE FUNCTION is_encrypted_text(text_value TEXT) RETURNS BOOLEAN AS $$
BEGIN
    -- Simple heuristic: encrypted text should be base64 encoded
    -- and have a certain length pattern
    RETURN text_value ~ '^[A-Za-z0-9+/]+=*$' AND length(text_value) > 20;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add encryption metadata columns to existing tables that handle sensitive data
-- Only add to tables that exist

-- Add encryption metadata to stories for sensitive content (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stories') THEN
        ALTER TABLE stories 
        ADD COLUMN IF NOT EXISTS encrypted_fields JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Add encryption metadata to ai_content for sensitive prompts/content (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_content') THEN
        ALTER TABLE ai_content 
        ADD COLUMN IF NOT EXISTS encrypted_fields JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Add encryption metadata to uploaded_files for sensitive metadata (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'uploaded_files') THEN
        ALTER TABLE uploaded_files 
        ADD COLUMN IF NOT EXISTS encrypted_fields JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Add encryption metadata to users table for sensitive user data (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS encrypted_fields JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Add encryption metadata to child_profiles for sensitive child data (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'child_profiles') THEN
        ALTER TABLE child_profiles 
        ADD COLUMN IF NOT EXISTS encrypted_fields JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Create audit table for encryption operations
CREATE TABLE IF NOT EXISTS encryption_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation TEXT NOT NULL CHECK (operation IN ('encrypt', 'decrypt', 'key_rotation', 'key_creation')),
    table_name TEXT,
    record_id UUID,
    field_name TEXT,
    key_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE encryption_audit ENABLE ROW LEVEL SECURITY;

-- Policy for encryption audit - only service role can read/write
CREATE POLICY "Service role can manage encryption audit" ON encryption_audit
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to log encryption operations
CREATE OR REPLACE FUNCTION log_encryption_operation(
    operation_type TEXT,
    table_name TEXT DEFAULT NULL,
    record_id UUID DEFAULT NULL,
    field_name TEXT DEFAULT NULL,
    key_id TEXT DEFAULT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO encryption_audit (
        operation,
        table_name,
        record_id,
        field_name,
        key_id,
        user_id,
        success,
        error_message
    ) VALUES (
        operation_type,
        table_name,
        record_id,
        field_name,
        key_id,
        auth.uid(),
        success,
        error_message
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if audit logging fails
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to rotate encryption keys
CREATE OR REPLACE FUNCTION rotate_encryption_key(
    key_purpose TEXT,
    new_key_hash TEXT
) RETURNS UUID AS $$
DECLARE
    old_key_id TEXT;
    new_key_uuid UUID;
BEGIN
    -- Deactivate current active key
    UPDATE encryption_keys 
    SET is_active = FALSE,
        expires_at = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE purpose = key_purpose AND is_active = TRUE
    RETURNING key_id INTO old_key_id;
    
    -- Create new key
    INSERT INTO encryption_keys (
        key_id,
        purpose,
        key_hash,
        created_by
    ) VALUES (
        key_purpose || '_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
        key_purpose,
        new_key_hash,
        auth.uid()
    ) RETURNING id INTO new_key_uuid;
    
    -- Log the rotation
    PERFORM log_encryption_operation(
        'key_rotation',
        NULL,
        NULL,
        NULL,
        key_purpose
    );
    
    RETURN new_key_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_encryption_keys_purpose_active 
    ON encryption_keys(purpose, is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_encryption_audit_created_at 
    ON encryption_audit(created_at);

CREATE INDEX IF NOT EXISTS idx_encryption_audit_operation 
    ON encryption_audit(operation);

-- Create view for active encryption keys (without sensitive data)
CREATE OR REPLACE VIEW active_encryption_keys AS
SELECT 
    id,
    key_id,
    purpose,
    algorithm,
    created_at,
    expires_at,
    created_by
FROM encryption_keys 
WHERE is_active = TRUE 
AND (expires_at IS NULL OR expires_at > NOW());

-- Grant necessary permissions
GRANT SELECT ON active_encryption_keys TO authenticated;
GRANT EXECUTE ON FUNCTION encrypt_sensitive_text TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_sensitive_text TO authenticated;
GRANT EXECUTE ON FUNCTION is_encrypted_text TO authenticated;

-- Comments for documentation
COMMENT ON TABLE encryption_keys IS 'Stores metadata about encryption keys used in the application';
COMMENT ON TABLE encryption_audit IS 'Audit log for all encryption/decryption operations';
COMMENT ON FUNCTION encrypt_sensitive_text IS 'Encrypts sensitive text data using application encryption keys';
COMMENT ON FUNCTION decrypt_sensitive_text IS 'Decrypts sensitive text data using application encryption keys';
COMMENT ON FUNCTION is_encrypted_text IS 'Checks if a text value appears to be encrypted';
COMMENT ON FUNCTION rotate_encryption_key IS 'Rotates encryption keys for a specific purpose';
COMMENT ON VIEW active_encryption_keys IS 'View of currently active encryption keys without sensitive data'; 