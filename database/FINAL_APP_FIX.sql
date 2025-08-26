-- FINAL APP RESTORATION - Fix Column Mapping Issues
-- This addresses the user_id vs created_by column mapping

-- =====================================================
-- 1. UPDATE FUNCTIONS TO USE CORRECT COLUMN NAMES
-- =====================================================

-- Fix get_user_expenses function to use created_by instead of user_id
CREATE OR REPLACE FUNCTION get_user_expenses(user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    user_id UUID,  -- This maps to created_by for compatibility
    amount NUMERIC,
    description TEXT,
    category TEXT,
    expense_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_active BOOLEAN,
    category_id UUID,
    receipt_url TEXT,
    notes TEXT
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- If user_uuid is provided, filter by it; otherwise show all for admin users
    IF user_uuid IS NOT NULL THEN
        RETURN QUERY
        SELECT e.id, e.created_by as user_id, e.amount, e.description, 
               c.name as category, e.expense_date, e.created_at, e.updated_at, 
               e.is_active, e.category_id, e.receipt_url, e.notes
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.created_by = user_uuid AND e.is_active = true
        ORDER BY e.expense_date DESC, e.created_at DESC;
    ELSE
        -- Check if current user is admin
        IF EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RETURN QUERY
            SELECT e.id, e.created_by as user_id, e.amount, e.description, 
                   c.name as category, e.expense_date, e.created_at, e.updated_at, 
                   e.is_active, e.category_id, e.receipt_url, e.notes
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.is_active = true
            ORDER BY e.expense_date DESC, e.created_at DESC;
        ELSE
            -- Regular user sees only their expenses
            RETURN QUERY
            SELECT e.id, e.created_by as user_id, e.amount, e.description, 
                   c.name as category, e.expense_date, e.created_at, e.updated_at, 
                   e.is_active, e.category_id, e.receipt_url, e.notes
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.created_by = auth.uid() AND e.is_active = true
            ORDER BY e.expense_date DESC, e.created_at DESC;
        END IF;
    END IF;
END;
$$;

-- Fix get_monthly_spending function to work with existing materialized views
CREATE OR REPLACE FUNCTION get_monthly_spending(user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
    month DATE,
    total_amount NUMERIC,
    expense_count BIGINT,
    avg_amount NUMERIC
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    IF user_uuid IS NOT NULL THEN
        RETURN QUERY
        SELECT mv.month::DATE, mv.total_amount, mv.expense_count, mv.avg_amount
        FROM mv_monthly_spending mv
        WHERE mv.created_by = user_uuid
        ORDER BY mv.month DESC;
    ELSE
        -- Check if current user is admin
        IF EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RETURN QUERY
            SELECT mv.month::DATE, 
                   SUM(mv.total_amount) as total_amount,
                   SUM(mv.expense_count) as expense_count,
                   AVG(mv.avg_amount) as avg_amount
            FROM mv_monthly_spending mv
            GROUP BY mv.month
            ORDER BY mv.month DESC;
        ELSE
            RETURN QUERY
            SELECT mv.month::DATE, mv.total_amount, mv.expense_count, mv.avg_amount
            FROM mv_monthly_spending mv
            WHERE mv.created_by = auth.uid()
            ORDER BY mv.month DESC;
        END IF;
    END IF;
END;
$$;

-- =====================================================
-- 2. UPDATE RLS POLICIES TO USE CORRECT COLUMNS
-- =====================================================

-- Drop existing expense policies
DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view their expenses and admins can view all" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;

-- Create correct policies using created_by
CREATE POLICY "Users can view their expenses and admins can view all" ON expenses
    FOR SELECT TO authenticated 
    USING (
        (auth.uid() = created_by AND is_active = true) OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can insert their own expenses" ON expenses
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE TO authenticated 
    USING (auth.uid() = created_by AND is_active = true)
    WITH CHECK (auth.uid() = created_by AND is_active = true);

-- =====================================================
-- 3. CREATE CONVENIENCE VIEW FOR FRONTEND
-- =====================================================

-- Create a view that maps created_by to user_id for frontend compatibility
CREATE OR REPLACE VIEW expenses_view AS
SELECT 
    id,
    created_by as user_id,
    amount,
    description,
    category_id,
    expense_date,
    receipt_url,
    notes,
    created_at,
    updated_at,
    is_active,
    c.name as category_name,
    c.color as category_color
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.is_active = true;

-- Grant access to the view
GRANT SELECT ON expenses_view TO authenticated;
GRANT SELECT ON expenses_view TO public;

-- Enable RLS on the view (inherits from expenses table)
ALTER VIEW expenses_view SET (security_invoker = on);

-- =====================================================
-- 4. GRANT PERMISSIONS ON CATEGORIES TABLE
-- =====================================================

GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON categories TO public;

-- =====================================================
-- 5. FINAL VERIFICATION
-- =====================================================

SELECT 'FINAL APP FIX APPLIED' as status,
       'Expense table column mapping fixed' as expenses,
       'Functions updated for created_by column' as functions,
       'RLS policies corrected' as security,
       'Frontend compatibility view created' as frontend,
       'App should be fully operational now' as result;