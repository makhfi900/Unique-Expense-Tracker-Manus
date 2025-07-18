-- Fix RLS policies to prevent infinite recursion
-- This addresses the remaining authentication issues

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can view own login activities" ON login_activities;
DROP POLICY IF EXISTS "Authenticated users can modify categories" ON categories;

-- Ensure the user_role helper function exists
CREATE OR REPLACE FUNCTION user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create fixed RLS policies using the helper function to avoid recursion

-- Fixed users policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        auth.uid() = id OR 
        user_role(auth.uid()) = 'admin'
    );

-- Fixed expenses policies
CREATE POLICY "Users can view expenses based on role" ON expenses
    FOR SELECT TO authenticated USING (
        user_role(auth.uid()) = 'admin' OR
        (created_by = auth.uid() AND user_role(auth.uid()) = 'account_officer')
    );

CREATE POLICY "Users can update expenses based on role" ON expenses
    FOR UPDATE TO authenticated USING (
        user_role(auth.uid()) = 'admin' OR
        (created_by = auth.uid())
    );

CREATE POLICY "Users can delete expenses based on role" ON expenses
    FOR DELETE TO authenticated USING (
        user_role(auth.uid()) = 'admin' OR
        (created_by = auth.uid())
    );

-- Fixed login activities policy
CREATE POLICY "Users can view own login activities" ON login_activities
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR 
        user_role(auth.uid()) = 'admin'
    );

-- Fixed categories policy
CREATE POLICY "Authenticated users can modify categories" ON categories
    FOR ALL TO authenticated USING (
        user_role(auth.uid()) IN ('admin', 'account_officer')
    );

-- Make sure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activities ENABLE ROW LEVEL SECURITY;