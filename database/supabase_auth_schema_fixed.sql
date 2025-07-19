-- Modified Supabase Schema - Safer approach for existing tables
-- This version works around permission issues by avoiding table drops

-- =====================================================
-- SAFER CLEANUP SECTION - Only drop policies and functions
-- =====================================================

-- Drop existing policies first (these usually work)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON categories;
DROP POLICY IF EXISTS "Authenticated users can modify categories" ON categories;
DROP POLICY IF EXISTS "Users can view expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can create expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses based on role" ON expenses;
DROP POLICY IF EXISTS "Users can view own login activities" ON login_activities;
DROP POLICY IF EXISTS "System can insert login activities" ON login_activities;

-- Drop existing functions (usually safe)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_login_activities() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS user_role(UUID) CASCADE;

-- =====================================================
-- CREATE TABLES ONLY IF THEY DON'T EXIST
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (only create if doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'account_officer')) DEFAULT 'account_officer',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT true
        );
    END IF;
END $$;

-- Categories table (only create if doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
        CREATE TABLE categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3B82F6',
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT true,
            UNIQUE(name)
        );
    END IF;
END $$;

-- Expenses table (only create if doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses') THEN
        CREATE TABLE expenses (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
            description TEXT NOT NULL,
            category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
            expense_date DATE NOT NULL,
            receipt_url TEXT,
            notes TEXT,
            created_by UUID REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT true
        );
    END IF;
END $$;

-- Login Activities Table (only create if doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'login_activities') THEN
        CREATE TABLE login_activities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ip_address INET,
            user_agent TEXT,
            device_type VARCHAR(50),
            browser VARCHAR(100),
            operating_system VARCHAR(100),
            location_country VARCHAR(100),
            location_city VARCHAR(100),
            location_region VARCHAR(100),
            success BOOLEAN DEFAULT TRUE,
            failure_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_login_activities_user_time ON login_activities(user_id, login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_activities_time ON login_activities(login_time DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.users (id, email, full_name, role, created_at, updated_at, is_active)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'role', 'account_officer'),
            NOW(),
            NOW(),
            true
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper function to avoid recursion in RLS
CREATE OR REPLACE FUNCTION user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old login activities
CREATE OR REPLACE FUNCTION cleanup_old_login_activities()
RETURNS void AS $$
BEGIN
    DELETE FROM login_activities 
    WHERE login_time < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS (safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

CREATE POLICY "Categories are viewable by authenticated users" ON categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can modify categories" ON categories
    FOR ALL TO authenticated USING (
        user_role(auth.uid()) IN ('admin', 'account_officer')
    );

CREATE POLICY "Users can view expenses based on role" ON expenses
    FOR SELECT TO authenticated USING (
        user_role(auth.uid()) = 'admin' OR
        (created_by = auth.uid() AND user_role(auth.uid()) = 'account_officer')
    );

CREATE POLICY "Authenticated users can create expenses" ON expenses
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = created_by AND
        user_role(auth.uid()) IN ('admin', 'account_officer')
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

CREATE POLICY "Users can view own login activities" ON login_activities
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR 
        user_role(auth.uid()) = 'admin'
    );

CREATE POLICY "System can insert login activities" ON login_activities
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default categories (only if table is empty)
INSERT INTO categories (name, description, color) 
SELECT * FROM (VALUES
    ('Food & Dining', 'Restaurant meals, groceries, and food-related expenses', '#EF4444'),
    ('Transportation', 'Gas, public transport, taxi, and vehicle maintenance', '#3B82F6'),
    ('Office Supplies', 'Stationery, equipment, and office-related purchases', '#10B981'),
    ('Utilities', 'Electricity, water, internet, and other utility bills', '#F59E0B'),
    ('Travel', 'Business trips, accommodation, and travel expenses', '#8B5CF6'),
    ('Marketing', 'Advertising, promotional materials, and marketing campaigns', '#EC4899'),
    ('Professional Services', 'Legal, accounting, consulting, and professional fees', '#6B7280'),
    ('Technology', 'Software licenses, hardware, and IT-related expenses', '#14B8A6'),
    ('Miscellaneous', 'Other expenses that don''t fit into specific categories', '#64748B')
) AS v(name, description, color)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Create profiles for existing auth users
INSERT INTO users (id, email, full_name, role)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email),
    COALESCE(raw_user_meta_data->>'role', 'account_officer')
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;