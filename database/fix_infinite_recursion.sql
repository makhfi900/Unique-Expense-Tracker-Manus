-- CRITICAL FIX: Resolve infinite recursion in users table RLS policy
-- Run this in Supabase SQL Editor IMMEDIATELY

-- =====================================================
-- FIX INFINITE RECURSION IN USERS TABLE POLICY
-- =====================================================

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;

-- Create corrected policies that don't cause recursion
-- Users can view their own profile (simple check without subquery)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

-- Admins can view all users (using auth.jwt() to avoid recursion)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin' 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        OR
        id = auth.uid()  -- Users can always see their own profile
    );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE TO authenticated 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow admins to update any user profile
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin' 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- Allow admins to insert new users
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT TO authenticated 
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin' 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- =====================================================
-- ALSO FIX INSIGHTS CACHE POLICY (potential recursion)
-- =====================================================

-- Drop and recreate insights cache policies to avoid similar issues
DROP POLICY IF EXISTS "Admins can view all insights" ON insights_cache;

-- Recreate admin policy without subquery to users table
CREATE POLICY "Admins can view all insights" ON insights_cache
    FOR SELECT TO authenticated 
    USING (
        user_id = auth.uid() 
        OR 
        (auth.jwt() ->> 'role') = 'admin'
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- =====================================================
-- FIX EXPENSES TABLE POLICIES (potential recursion)
-- =====================================================

-- Drop problematic expense policies
DROP POLICY IF EXISTS "Account officers can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can view all expenses" ON expenses;

-- Recreate without recursion risk
CREATE POLICY "Account officers can view own expenses" ON expenses
    FOR SELECT TO authenticated 
    USING (
        created_by = auth.uid() 
        AND is_active = true
    );

CREATE POLICY "Admins can view all expenses" ON expenses
    FOR SELECT TO authenticated 
    USING (
        is_active = true 
        AND (
            created_by = auth.uid()
            OR 
            (auth.jwt() ->> 'role') = 'admin'
            OR 
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        )
    );

-- =====================================================
-- FIX ANALYTICS REFRESH LOG POLICY
-- =====================================================

DROP POLICY IF EXISTS "Admins can view refresh logs" ON analytics_refresh_log;

CREATE POLICY "Admins can view refresh logs" ON analytics_refresh_log
    FOR SELECT TO authenticated 
    USING (
        (auth.jwt() ->> 'role') = 'admin'
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test that policies work without recursion
SELECT 'Policy fix verification' as status;

-- This should work without infinite recursion
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Check policy status
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

COMMENT ON TABLE users IS 'Fixed infinite recursion in RLS policies by using auth.jwt() instead of subqueries';