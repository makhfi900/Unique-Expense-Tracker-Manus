-- File: database/supabase_auth_complete.sql
-- Run this once at the start - no additional scripts needed

-- =====================================================
-- CLEANUP SECTION
-- =====================================================
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

DROP FUNCTION IF EXISTS user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_login_activities() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all tables (safe in development)
DROP TABLE IF EXISTS login_activities CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- =====================================================
-- ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'account_officer')) DEFAULT 'account_officer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
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

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
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

-- Login Activities Table
CREATE TABLE IF NOT EXISTS login_activities (
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

-- =====================================================
-- CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_login_activities_user_time ON login_activities(user_id, login_time DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user creation - simplified version
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, created_at, updated_at, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'account_officer'),
        NOW(),
        NOW(),
        true
    ) ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RETURN NEW;
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
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- SIMPLIFIED RLS POLICIES (No Circular Dependencies)
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activities ENABLE ROW LEVEL SECURITY;

-- Users table policies - Simplified
CREATE POLICY "Users can view all users" ON users
    FOR SELECT TO authenticated 
    USING (true); -- All authenticated users can see all users (we'll filter in the app)

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id);

-- Categories policies - Everyone can view and modify
CREATE POLICY "Authenticated users can view categories" ON categories
    FOR SELECT TO authenticated 
    USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories" ON categories
    FOR ALL TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Expenses policies - Simplified
CREATE POLICY "Users can view all active expenses" ON expenses
    FOR SELECT TO authenticated 
    USING (is_active = true); -- We'll filter by role in the application

CREATE POLICY "Users can create own expenses" ON expenses
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE TO authenticated 
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE TO authenticated 
    USING (auth.uid() = created_by);

-- Login activities policies
CREATE POLICY "Users can view own login activities" ON login_activities
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "System can insert login activities" ON login_activities
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
    ('Food & Dining', 'Restaurant meals, groceries, and food-related expenses', '#EF4444'),
    ('Transportation', 'Gas, public transport, taxi, and vehicle maintenance', '#3B82F6'),
    ('Office Supplies', 'Stationery, equipment, and office-related purchases', '#10B981'),
    ('Utilities', 'Electricity, water, internet, and other utility bills', '#F59E0B'),
    ('Travel', 'Business trips, accommodation, and travel expenses', '#8B5CF6'),
    ('Marketing', 'Advertising, promotional materials, and marketing campaigns', '#EC4899'),
    ('Professional Services', 'Legal, accounting, consulting, and professional fees', '#6B7280'),
    ('Technology', 'Software licenses, hardware, and IT-related expenses', '#14B8A6'),
    ('Miscellaneous', 'Other expenses that don''t fit into specific categories', '#64748B')
ON CONFLICT (name) DO NOTHING;

-- Create admin user if not exists (password: admin1)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin1@test.com',
    crypt('admin1', gen_salt('bf')),
    NOW(),
    '{"full_name": "Admin User", "role": "admin"}'::jsonb,
    NOW(),
    NOW()
);

-- Create officer user if not exists (password: officer1)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'officer1@test.com',
    crypt('officer1', gen_salt('bf')),
    NOW(),
    '{"full_name": "Account Officer", "role": "account_officer"}'::jsonb,
    NOW(),
    NOW()
);