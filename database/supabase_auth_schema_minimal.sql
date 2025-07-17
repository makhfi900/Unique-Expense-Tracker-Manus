-- Supabase Auth Integration Schema (Minimal Version)
-- This schema creates tables in the correct order without complex logic

-- Enable UUID extension first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create users table (linked to auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'account_officer')) DEFAULT 'account_officer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Step 2: Create categories table
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

-- Step 3: Create expenses table
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

-- Step 4: Create login_activities table
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

-- Step 5: Create indexes
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_login_activities_user_time ON login_activities(user_id, login_time DESC);
CREATE INDEX idx_login_activities_time ON login_activities(login_time DESC);

-- Step 6: Insert default categories
INSERT INTO categories (name, description, color) VALUES
    ('Food & Dining', 'Restaurant meals, groceries, and food-related expenses', '#EF4444'),
    ('Transportation', 'Gas, public transport, taxi, and vehicle maintenance', '#3B82F6'),
    ('Office Supplies', 'Stationery, equipment, and office-related purchases', '#10B981'),
    ('Utilities', 'Electricity, water, internet, and other utility bills', '#F59E0B'),
    ('Travel', 'Business trips, accommodation, and travel expenses', '#8B5CF6'),
    ('Marketing', 'Advertising, promotional materials, and marketing campaigns', '#EC4899'),
    ('Professional Services', 'Legal, accounting, consulting, and professional fees', '#6B7280'),
    ('Technology', 'Software licenses, hardware, and IT-related expenses', '#14B8A6'),
    ('Miscellaneous', 'Other expenses that don''t fit into specific categories', '#64748B');

-- Step 7: Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'account_officer')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_login_activities()
RETURNS void AS $$
BEGIN
    DELETE FROM login_activities 
    WHERE login_time < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 9: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activities ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Categories are viewable by authenticated users" ON categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can modify categories" ON categories
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'account_officer')
        )
    );

CREATE POLICY "Users can view expenses based on role" ON expenses
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        (created_by = auth.uid() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'account_officer'))
    );

CREATE POLICY "Authenticated users can create expenses" ON expenses
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update expenses based on role" ON expenses
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        (created_by = auth.uid())
    );

CREATE POLICY "Users can delete expenses based on role" ON expenses
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        (created_by = auth.uid())
    );

CREATE POLICY "Users can view own login activities" ON login_activities
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "System can insert login activities" ON login_activities
    FOR INSERT WITH CHECK (true);

-- Step 11: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 12: Add comments
COMMENT ON TABLE users IS 'User profiles linked to auth.users';
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates user profile when auth user is created';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates user profile automatically on signup';