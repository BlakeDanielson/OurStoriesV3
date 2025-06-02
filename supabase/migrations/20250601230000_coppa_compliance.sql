-- COPPA Compliance Migration
-- Adds necessary tables and fields for Children's Online Privacy Protection Act compliance

-- Add COPPA-related fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parental_consent_status TEXT DEFAULT 'not_required' CHECK (parental_consent_status IN ('not_required', 'pending', 'granted', 'denied')),
ADD COLUMN IF NOT EXISTS parental_consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS data_collection_consent JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS account_verification_status TEXT DEFAULT 'unverified' CHECK (account_verification_status IN ('unverified', 'pending_parent_verification', 'verified', 'suspended'));

-- Create parental consent requests table
CREATE TABLE IF NOT EXISTS public.parental_consent_requests (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    child_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_email TEXT NOT NULL,
    consent_token TEXT NOT NULL UNIQUE,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
    ip_address INET,
    user_agent TEXT,
    consent_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create age verification logs table
CREATE TABLE IF NOT EXISTS public.age_verification_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('self_reported', 'parent_verified', 'document_verified')),
    verification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_age INTEGER,
    verification_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data collection audit table for COPPA compliance
CREATE TABLE IF NOT EXISTS public.coppa_data_audit (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL,
    collection_purpose TEXT NOT NULL,
    consent_given BOOLEAN DEFAULT FALSE,
    collection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retention_period INTERVAL,
    deletion_date TIMESTAMP WITH TIME ZONE,
    audit_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_minor ON public.users(is_minor);
CREATE INDEX IF NOT EXISTS idx_users_parental_consent_status ON public.users(parental_consent_status);
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON public.users(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_parental_consent_requests_child_user_id ON public.parental_consent_requests(child_user_id);
CREATE INDEX IF NOT EXISTS idx_parental_consent_requests_consent_token ON public.parental_consent_requests(consent_token);
CREATE INDEX IF NOT EXISTS idx_parental_consent_requests_status ON public.parental_consent_requests(status);
CREATE INDEX IF NOT EXISTS idx_parental_consent_requests_expiry_date ON public.parental_consent_requests(expiry_date);
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_user_id ON public.age_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_coppa_data_audit_user_id ON public.coppa_data_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_coppa_data_audit_data_type ON public.coppa_data_audit(data_type);

-- Create function to automatically set is_minor based on date_of_birth
CREATE OR REPLACE FUNCTION public.update_minor_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_of_birth IS NOT NULL THEN
        NEW.is_minor := (EXTRACT(YEAR FROM AGE(NEW.date_of_birth)) < 13);
        
        -- Set parental consent status based on age
        IF NEW.is_minor THEN
            NEW.parental_consent_status := COALESCE(NEW.parental_consent_status, 'pending');
        ELSE
            NEW.parental_consent_status := 'not_required';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update minor status
DROP TRIGGER IF EXISTS trigger_update_minor_status ON public.users;
CREATE TRIGGER trigger_update_minor_status
    BEFORE INSERT OR UPDATE OF date_of_birth ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_minor_status();

-- Create function to clean up expired consent requests
CREATE OR REPLACE FUNCTION public.cleanup_expired_consent_requests()
RETURNS void AS $$
BEGIN
    UPDATE public.parental_consent_requests 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expiry_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get COPPA compliance status for a user
CREATE OR REPLACE FUNCTION public.get_coppa_compliance_status(user_id UUID)
RETURNS TABLE(
    is_compliant BOOLEAN,
    is_minor BOOLEAN,
    consent_status TEXT,
    consent_date TIMESTAMP WITH TIME ZONE,
    verification_status TEXT,
    required_actions TEXT[]
) AS $$
DECLARE
    user_record RECORD;
    actions TEXT[] := '{}';
BEGIN
    SELECT * INTO user_record FROM public.users WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, FALSE, 'user_not_found'::TEXT, NULL::TIMESTAMP WITH TIME ZONE, 'unverified'::TEXT, ARRAY['user_not_found']::TEXT[];
        RETURN;
    END IF;
    
    -- Check if user is a minor
    IF user_record.is_minor THEN
        -- Minor user - check parental consent
        IF user_record.parental_consent_status != 'granted' THEN
            actions := array_append(actions, 'parental_consent_required');
        END IF;
        
        IF user_record.account_verification_status != 'verified' THEN
            actions := array_append(actions, 'account_verification_required');
        END IF;
        
        RETURN QUERY SELECT 
            (user_record.parental_consent_status = 'granted' AND user_record.account_verification_status = 'verified'),
            user_record.is_minor,
            user_record.parental_consent_status,
            user_record.parental_consent_date,
            user_record.account_verification_status,
            actions;
    ELSE
        -- Adult user - automatically compliant
        RETURN QUERY SELECT 
            TRUE,
            user_record.is_minor,
            user_record.parental_consent_status,
            user_record.parental_consent_date,
            user_record.account_verification_status,
            actions;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log data collection for COPPA audit
CREATE OR REPLACE FUNCTION public.log_coppa_data_collection(
    p_user_id UUID,
    p_data_type TEXT,
    p_collection_purpose TEXT,
    p_consent_given BOOLEAN DEFAULT TRUE,
    p_retention_days INTEGER DEFAULT 365
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.coppa_data_audit (
        user_id,
        data_type,
        collection_purpose,
        consent_given,
        retention_period,
        deletion_date
    ) VALUES (
        p_user_id,
        p_data_type,
        p_collection_purpose,
        p_consent_given,
        INTERVAL '1 day' * p_retention_days,
        NOW() + INTERVAL '1 day' * p_retention_days
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for COPPA compliance tables

-- Parental consent requests policies
ALTER TABLE public.parental_consent_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent requests" ON public.parental_consent_requests
    FOR SELECT USING (
        child_user_id = auth.uid() OR 
        parent_email = (SELECT email FROM public.users WHERE id = auth.uid())
    );

CREATE POLICY "System can insert consent requests" ON public.parental_consent_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update consent requests" ON public.parental_consent_requests
    FOR UPDATE USING (true);

-- Age verification logs policies
ALTER TABLE public.age_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification logs" ON public.age_verification_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert verification logs" ON public.age_verification_logs
    FOR INSERT WITH CHECK (true);

-- COPPA data audit policies
ALTER TABLE public.coppa_data_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data audit logs" ON public.coppa_data_audit
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" ON public.coppa_data_audit
    FOR INSERT WITH CHECK (true);

-- Update users table policies to include new COPPA fields
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_parental_consent_requests_updated_at
    BEFORE UPDATE ON public.parental_consent_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a view for COPPA compliance dashboard
CREATE OR REPLACE VIEW public.coppa_compliance_summary AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.date_of_birth,
    u.is_minor,
    u.parental_consent_status,
    u.parental_consent_date,
    u.account_verification_status,
    u.created_at,
    pcr.status as latest_consent_request_status,
    pcr.request_date as latest_consent_request_date,
    (SELECT COUNT(*) FROM public.coppa_data_audit WHERE user_id = u.id) as data_collection_count,
    (SELECT COUNT(*) FROM public.age_verification_logs WHERE user_id = u.id) as verification_attempts
FROM public.users u
LEFT JOIN public.parental_consent_requests pcr ON u.id = pcr.child_user_id 
    AND pcr.id = (
        SELECT id FROM public.parental_consent_requests 
        WHERE child_user_id = u.id 
        ORDER BY created_at DESC 
        LIMIT 1
    )
WHERE u.is_minor = true;

-- Grant necessary permissions
GRANT SELECT ON public.coppa_compliance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_coppa_compliance_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_coppa_data_collection(UUID, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_consent_requests() TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.parental_consent_requests IS 'Stores parental consent requests for users under 13 as required by COPPA';
COMMENT ON TABLE public.age_verification_logs IS 'Audit trail for age verification attempts and methods';
COMMENT ON TABLE public.coppa_data_audit IS 'Tracks data collection for COPPA compliance and retention policies';
COMMENT ON FUNCTION public.get_coppa_compliance_status(UUID) IS 'Returns comprehensive COPPA compliance status for a user';
COMMENT ON FUNCTION public.log_coppa_data_collection(UUID, TEXT, TEXT, BOOLEAN, INTEGER) IS 'Logs data collection events for COPPA audit trail';
COMMENT ON VIEW public.coppa_compliance_summary IS 'Summary view of COPPA compliance status for all minor users'; 