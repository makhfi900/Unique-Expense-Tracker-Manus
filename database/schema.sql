-- Unique Expense Tracker Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'account_officer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(name)
);

-- Expenses table
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

-- Indexes for better performance
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

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
    ('Miscellaneous', 'Other expenses that don''t fit into specific categories', '#64748B');

-- Insert default admin user (password: admin123)
-- Note: In production, this should be changed immediately
INSERT INTO users (email, password_hash, full_name, role) VALUES
    ('admin@expensetracker.com', '$2b$10$rQZ8kHWKQVz7mXGqGqGqGOqGqGqGqGqGqGqGqGqGqGqGqGqGqGqGq', 'System Administrator', 'admin');

-- Insert default account officer (password: officer123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
    ('officer@expensetracker.com', '$2b$10$rQZ8kHWKQVz7mXGqGqGqGOqGqGqGqGqGqGqGqGqGqGqGqGqGqGqGq', 'Account Officer', 'account_officer');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data (admins can see all)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Categories are visible to all authenticated users
CREATE POLICY "Categories are viewable by authenticated users" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can create/update/delete categories
CREATE POLICY "Only admins can modify categories" ON categories
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Expenses policies
CREATE POLICY "Users can view expenses based on role" ON expenses
    FOR SELECT USING (
        -- Admins can see all expenses
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        -- Account officers can only see expenses they created
        (created_by = auth.uid() AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'account_officer'))
    );

-- Users can create expenses
CREATE POLICY "Authenticated users can create expenses" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

-- Users can update their own expenses, admins can update all
CREATE POLICY "Users can update expenses based on role" ON expenses
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        (created_by = auth.uid())
    );

-- Users can delete their own expenses, admins can delete all
CREATE POLICY "Users can delete expenses based on role" ON expenses
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        (created_by = auth.uid())
    );

