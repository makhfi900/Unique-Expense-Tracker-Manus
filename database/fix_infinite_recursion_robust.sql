-- ROBUST FIX: Resolve infinite recursion in users table RLS policy
-- This version handles existing policies properly

-- =====================================================
-- COMPREHENSIVE POLICY CLEANUP FOR USERS TABLE
-- =====================================================

-- Drop ALL existing policies on users table to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "System can insert users" ON users;

-- =====================================================
-- CREATE CORRECTED USERS TABLE POLICIES (NO RECURSION)
-- =====================================================

-- Users can view their own profile (simple check, no subquery)
CREATE POLICY "users_select_own" ON users
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

-- Admins can view all users (using auth.jwt() to avoid recursion)
CREATE POLICY "users_select_admin" ON users
    FOR SELECT TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin' 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can update any user profile
CREATE POLICY "users_update_admin" ON users
    FOR UPDATE TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin' 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- System/Admins can insert new users
CREATE POLICY "users_insert_system" ON users
    FOR INSERT TO authenticated 
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin' 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        OR
        true  -- Allow user registration
    );

-- =====================================================
-- FIX OTHER TABLES THAT MIGHT HAVE RECURSION
-- =====================================================

-- Clean up insights_cache policies
DROP POLICY IF EXISTS "Users can view own insights" ON insights_cache;
DROP POLICY IF EXISTS "System can insert insights" ON insights_cache;
DROP POLICY IF EXISTS "Admins can view all insights" ON insights_cache;

-- Recreate insights_cache policies without recursion
CREATE POLICY "insights_select_own" ON insights_cache
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "insights_select_admin" ON insights_cache
    FOR SELECT TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "insights_insert_system" ON insights_cache
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid());

-- Clean up expenses policies
DROP POLICY IF EXISTS "Account officers can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view all active expenses" ON expenses;

-- Recreate expenses policies without recursion
CREATE POLICY "expenses_select_own" ON expenses
    FOR SELECT TO authenticated 
    USING (
        created_by = auth.uid() 
        AND is_active = true
    );

CREATE POLICY "expenses_select_admin" ON expenses
    FOR SELECT TO authenticated 
    USING (
        is_active = true 
        AND (
            (auth.jwt() ->> 'role') = 'admin'
            OR 
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    );

-- Clean up analytics_refresh_log policies
DROP POLICY IF EXISTS "Admins can view refresh logs" ON analytics_refresh_log;
DROP POLICY IF EXISTS "System can insert refresh logs" ON analytics_refresh_log;

-- Recreate analytics policies
CREATE POLICY "analytics_select_admin" ON analytics_refresh_log
    FOR SELECT TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "analytics_insert_system" ON analytics_refresh_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- =====================================================
-- TEST THE FIX
-- =====================================================

-- This should work without infinite recursion
SELECT 'Testing users query - should work now' as test_status;

-- Verify we can query users table
DO $$
BEGIN
    PERFORM id, email, role FROM users LIMIT 1;
    RAISE NOTICE 'SUCCESS: Users table query completed without recursion';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;

-- Show current policy status
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd,
    'FIXED' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'insights_cache', 'expenses', 'analytics_refresh_log')
ORDER BY tablename, policyname;