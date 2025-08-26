-- Create missing secure accessor functions for materialized views
-- These functions replace direct access to materialized views

-- Secure function for category spending (replaces mv_category_spending)
CREATE OR REPLACE FUNCTION get_secure_category_spending()
RETURNS TABLE(
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    total_amount NUMERIC,
    expense_count BIGINT,
    avg_amount NUMERIC
) 
SECURITY DEFINER
AS $$
DECLARE
    requesting_user_role TEXT;
    user_filter UUID;
BEGIN
    -- Get the role from JWT to avoid recursion
    requesting_user_role := auth.jwt() ->> 'role';
    IF requesting_user_role IS NULL THEN
        requesting_user_role := auth.jwt() -> 'user_metadata' ->> 'role';
    END IF;
    
    -- Non-admins can only see their own data
    IF requesting_user_role != 'admin' THEN
        user_filter := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        COALESCE(SUM(e.amount), 0) as total_amount,
        COUNT(e.*) as expense_count,
        COALESCE(AVG(e.amount), 0) as avg_amount
    FROM categories c
    LEFT JOIN expenses e ON c.id = e.category_id 
        AND e.is_active = true
        AND (user_filter IS NULL OR e.created_by = user_filter)
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.color
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Secure function for user spending (replaces mv_user_spending)
CREATE OR REPLACE FUNCTION get_secure_user_spending()
RETURNS TABLE(
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    total_amount NUMERIC,
    expense_count BIGINT,
    avg_amount NUMERIC,
    categories_used BIGINT,
    first_expense_date DATE,
    last_expense_date DATE
) 
SECURITY DEFINER
AS $$
DECLARE
    requesting_user_role TEXT;
    user_filter UUID;
BEGIN
    -- Get the role from JWT to avoid recursion
    requesting_user_role := auth.jwt() ->> 'role';
    IF requesting_user_role IS NULL THEN
        requesting_user_role := auth.jwt() -> 'user_metadata' ->> 'role';
    END IF;
    
    -- Non-admins can only see their own data
    IF requesting_user_role != 'admin' THEN
        user_filter := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email as user_email,
        u.full_name as user_name,
        COALESCE(SUM(e.amount), 0) as total_amount,
        COUNT(e.*) as expense_count,
        COALESCE(AVG(e.amount), 0) as avg_amount,
        COUNT(DISTINCT e.category_id) as categories_used,
        MIN(e.expense_date) as first_expense_date,
        MAX(e.expense_date) as last_expense_date
    FROM users u
    LEFT JOIN expenses e ON u.id = e.created_by 
        AND e.is_active = true
    WHERE u.is_active = true
    AND (user_filter IS NULL OR u.id = user_filter)
    GROUP BY u.id, u.email, u.full_name
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_secure_category_spending() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_monthly_spending(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_secure_user_spending() TO authenticated;

SELECT 'Secure accessor functions created successfully' as status;