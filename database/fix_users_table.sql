-- Fix for users table with password_hash column
-- This works with the existing table structure

-- First, let's make the password_hash column nullable since we're using Supabase Auth
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create the user_role helper function if it doesn't exist
CREATE OR REPLACE FUNCTION user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create user profile for the existing auth user
INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, is_active)
VALUES (
    'a3fc8908-d1b2-40f1-bb5f-8df90be90102',
    'admin@test.com',
    NULL,  -- No password hash needed since we use Supabase Auth
    'Admin User',
    'admin',
    NOW(),
    NOW(),
    true
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Ensure the trigger exists for future user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        NULL,  -- No password hash needed since we use Supabase Auth
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'account_officer'),
        NOW(),
        NOW(),
        true
    ) ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();