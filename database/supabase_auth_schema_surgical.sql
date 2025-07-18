-- Surgical Fix for Supabase Auth Integration
-- This applies only the essential fixes without dropping existing tables

-- First, let's check what we have and fix the policies that are causing infinite recursion

-- =====================================================
-- STEP 1: Fix the infinite recursion issue
-- =====================================================

-- Drop only the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can view own login activities" ON login_activities;
DROP POLICY IF EXISTS "Authenticated users can modify categories" ON categories;

-- Create a user_role helper function to avoid recursion
CREATE OR REPLACE FUNCTION user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 2: Create fixed RLS policies
-- =====================================================

-- Fixed users policies using the helper function
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

-- Fixed expenses policies using the helper function
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

-- =====================================================
-- STEP 3: Ensure user profiles exist for auth users
-- =====================================================

-- Try to create profiles for existing auth users (this will fail gracefully if they exist)
INSERT INTO users (id, email, full_name, role)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email),
    COALESCE(raw_user_meta_data->>'role', 'account_officer')
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: Ensure essential functions exist
-- =====================================================

-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'account_officer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- STEP 5: Update existing user to admin if needed
-- =====================================================

-- Update the existing user to admin role (assuming admin@test.com should be admin)
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';

-- Add any missing columns that might be needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'account_officer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add check constraint for role if it doesn't exist
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'account_officer'));

-- =====================================================
-- STEP 6: Ensure RLS is enabled
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activities ENABLE ROW LEVEL SECURITY;

COMMENT ON FUNCTION user_role(UUID) IS 'Helper function to get user role without recursion - fixes infinite recursion in RLS policies';