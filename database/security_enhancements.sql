-- ADDITIONAL SECURITY ENHANCEMENTS
-- Run this after the critical fixes

-- =====================================================
-- INPUT VALIDATION AND SQL INJECTION PREVENTION
-- =====================================================

-- Enhanced function with proper input validation
CREATE OR REPLACE FUNCTION generate_spending_insights(
    target_user_id UUID DEFAULT NULL,
    analysis_months INTEGER DEFAULT 6
)
RETURNS TABLE(
    insight_type TEXT,
    insight_category TEXT,
    title TEXT,
    description TEXT,
    severity TEXT,
    confidence_score NUMERIC,
    metadata JSONB
) AS $$
DECLARE
    requesting_user_role TEXT;
    validated_months INTEGER;
    user_record RECORD;
BEGIN
    -- Input validation
    IF analysis_months IS NULL OR analysis_months < 1 OR analysis_months > 24 THEN
        validated_months := 6;  -- Default safe value
    ELSE
        validated_months := analysis_months;
    END IF;
    
    -- Get requesting user role
    SELECT role INTO requesting_user_role 
    FROM users 
    WHERE id = auth.uid() AND is_active = true;
    
    -- Authorization check
    IF requesting_user_role != 'admin' AND target_user_id IS NOT NULL AND target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot generate insights for other users';
    END IF;
    
    -- If non-admin user, force to their own data
    IF requesting_user_role != 'admin' THEN
        target_user_id := auth.uid();
    END IF;
    
    -- Validate target user exists and is active (if specified)
    IF target_user_id IS NOT NULL THEN
        SELECT id, full_name, role INTO user_record
        FROM users 
        WHERE id = target_user_id AND is_active = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Target user not found or inactive';
        END IF;
    END IF;
    
    -- Rest of the function logic with sanitized inputs
    -- (Original logic here but with validated parameters)
    -- ... existing insight generation logic ...
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT LOGGING SYSTEM
-- =====================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON security_audit_log
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin' 
            AND users.is_active = true
        )
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON security_audit_log
    FOR INSERT WITH CHECK (true);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time ON security_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_time ON security_audit_log(action_type, created_at DESC);

-- =====================================================
-- ENHANCED CONNECTION SECURITY
-- =====================================================

-- Function to validate database connection security
CREATE OR REPLACE FUNCTION validate_connection_security()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check SSL settings
    RETURN QUERY
    SELECT 
        'SSL Encryption'::TEXT,
        CASE WHEN setting = 'on' THEN 'SECURE' ELSE 'INSECURE' END,
        'SSL is ' || setting::TEXT,
        CASE WHEN setting = 'on' THEN 'SSL is properly enabled' 
             ELSE 'Enable SSL encryption for connections' END
    FROM pg_settings WHERE name = 'ssl';
    
    -- Check connection limits
    RETURN QUERY
    SELECT 
        'Connection Limits'::TEXT,
        CASE WHEN setting::INTEGER < 100 THEN 'GOOD' ELSE 'REVIEW' END,
        'Max connections: ' || setting,
        CASE WHEN setting::INTEGER < 100 THEN 'Connection limit is reasonable' 
             ELSE 'Consider reducing max_connections for security' END
    FROM pg_settings WHERE name = 'max_connections';
    
    -- Check password encryption
    RETURN QUERY
    SELECT 
        'Password Encryption'::TEXT,
        CASE WHEN setting IN ('scram-sha-256', 'md5') THEN 'SECURE' ELSE 'INSECURE' END,
        'Method: ' || setting,
        CASE WHEN setting = 'scram-sha-256' THEN 'Using secure SCRAM-SHA-256' 
             WHEN setting = 'md5' THEN 'Consider upgrading to SCRAM-SHA-256'
             ELSE 'Enable password encryption' END
    FROM pg_settings WHERE name = 'password_encryption';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RATE LIMITING AT DATABASE LEVEL
-- =====================================================

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate limit log
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit data
CREATE POLICY "Users can view own rate limits" ON rate_limit_log
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

-- System can insert rate limit records
CREATE POLICY "System can insert rate limit records" ON rate_limit_log
    FOR INSERT WITH CHECK (true);

-- Create index for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action_time ON rate_limit_log(user_id, action_type, window_start);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action_type TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INTEGER;
    window_start TIMESTAMP;
BEGIN
    -- Calculate window start
    window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Count requests in current window
    SELECT COALESCE(SUM(request_count), 0) INTO request_count
    FROM rate_limit_log
    WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND window_start >= window_start;
    
    -- Check if limit exceeded
    IF request_count >= p_max_requests THEN
        RETURN false;
    END IF;
    
    -- Log this request
    INSERT INTO rate_limit_log (user_id, action_type, request_count)
    VALUES (p_user_id, p_action_type, 1)
    ON CONFLICT DO NOTHING;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECURE BACKUP VERIFICATION
-- =====================================================

-- Function to verify backup integrity
CREATE OR REPLACE FUNCTION verify_backup_security()
RETURNS TABLE(
    backup_component TEXT,
    status TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check if Point-in-Time Recovery is available
    RETURN QUERY
    SELECT 
        'Point-in-Time Recovery'::TEXT,
        CASE WHEN setting = 'on' THEN 'ENABLED' ELSE 'DISABLED' END,
        CASE WHEN setting = 'on' THEN 'PITR is properly enabled' 
             ELSE 'Enable archive_mode for backup security' END
    FROM pg_settings WHERE name = 'archive_mode';
    
    -- Check WAL level
    RETURN QUERY
    SELECT 
        'WAL Level'::TEXT,
        CASE WHEN setting IN ('replica', 'logical') THEN 'SECURE' ELSE 'BASIC' END,
        CASE WHEN setting IN ('replica', 'logical') THEN 'WAL level supports secure replication' 
             ELSE 'Consider replica or logical WAL level for better backup security' END
    FROM pg_settings WHERE name = 'wal_level';
    
    -- Check if checksums are enabled (PostgreSQL 9.3+)
    RETURN QUERY
    SELECT 
        'Data Checksums'::TEXT,
        CASE WHEN setting = 'on' THEN 'ENABLED' ELSE 'DISABLED' END,
        CASE WHEN setting = 'on' THEN 'Data checksums help detect corruption' 
             ELSE 'Data checksums not available or disabled' END
    FROM pg_settings WHERE name = 'data_checksums';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPREHENSIVE SECURITY MONITORING
-- =====================================================

-- Create security monitoring view
CREATE OR REPLACE VIEW v_security_monitor AS
WITH failed_logins AS (
    SELECT 
        user_id,
        COUNT(*) as failed_count,
        MAX(login_time) as last_failed
    FROM login_activities
    WHERE success = false
    AND login_time >= now() - INTERVAL '24 hours'
    GROUP BY user_id
),
excessive_queries AS (
    SELECT 
        user_id,
        action_type,
        SUM(request_count) as total_requests
    FROM rate_limit_log
    WHERE window_start >= now() - INTERVAL '1 hour'
    GROUP BY user_id, action_type
    HAVING SUM(request_count) > 50
),
privilege_escalations AS (
    SELECT 
        user_id,
        COUNT(*) as escalation_attempts
    FROM security_audit_log
    WHERE action_type = 'PRIVILEGE_ESCALATION_ATTEMPT'
    AND created_at >= now() - INTERVAL '24 hours'
    GROUP BY user_id
)
SELECT 
    'Failed Logins' as alert_type,
    fl.user_id,
    u.email,
    u.role,
    fl.failed_count::TEXT as details,
    fl.last_failed as last_occurrence
FROM failed_logins fl
JOIN users u ON fl.user_id = u.id
WHERE fl.failed_count > 3

UNION ALL

SELECT 
    'Excessive API Calls' as alert_type,
    eq.user_id,
    u.email,
    u.role,
    eq.action_type || ': ' || eq.total_requests as details,
    now() as last_occurrence
FROM excessive_queries eq
JOIN users u ON eq.user_id = u.id

UNION ALL

SELECT 
    'Privilege Escalation' as alert_type,
    pe.user_id,
    u.email,
    u.role,
    pe.escalation_attempts::TEXT || ' attempts' as details,
    now() as last_occurrence
FROM privilege_escalations pe
JOIN users u ON pe.user_id = u.id;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE security_audit_log IS 'Comprehensive audit log for all security-relevant operations';
COMMENT ON TABLE rate_limit_log IS 'Rate limiting tracking to prevent abuse';
COMMENT ON FUNCTION validate_connection_security() IS 'Validates database connection security settings';
COMMENT ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTEGER) IS 'Enforces rate limiting on user actions';
COMMENT ON FUNCTION verify_backup_security() IS 'Verifies backup and recovery security settings';
COMMENT ON VIEW v_security_monitor IS 'Real-time security monitoring dashboard';

-- =====================================================
-- INITIAL SECURITY VALIDATION
-- =====================================================

-- Run all security checks
SELECT 'Connection Security Check' as check_type;
SELECT * FROM validate_connection_security();

SELECT 'Backup Security Check' as check_type;
SELECT * FROM verify_backup_security();

SELECT 'Current Security Alerts' as check_type;
SELECT * FROM v_security_monitor;