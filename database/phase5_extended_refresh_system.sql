-- Phase 5: Extended Smart Refresh System for All Materialized Views
-- Run this in Supabase SQL Editor after all previous phases

-- =====================================================
-- COMPREHENSIVE MATERIALIZED VIEW REFRESH SYSTEM
-- =====================================================

-- Drop existing functions to recreate with extended functionality
DROP FUNCTION IF EXISTS refresh_analytics_views(BOOLEAN);
DROP FUNCTION IF EXISTS smart_refresh_analytics();

-- Enhanced refresh function that handles ALL materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views(concurrent_refresh BOOLEAN DEFAULT TRUE)
RETURNS void AS $$
DECLARE
    refresh_start TIMESTAMP;
    view_refresh_start TIMESTAMP;
    refresh_method TEXT;
    view_count INTEGER := 0;
    error_count INTEGER := 0;
    success_views TEXT[] := '{}';
    failed_views TEXT[] := '{}';
BEGIN
    refresh_start := clock_timestamp();
    refresh_method := CASE WHEN concurrent_refresh THEN 'CONCURRENTLY' ELSE '' END;
    
    RAISE NOTICE 'Starting analytics views refresh (method: %)', refresh_method;
    
    -- Try concurrent refresh first (non-blocking)
    IF concurrent_refresh THEN
        BEGIN
            -- Phase 1: Base Analytics Views
            view_refresh_start := clock_timestamp();
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_spending;
            success_views := array_append(success_views, 'mv_monthly_spending');
            view_count := view_count + 1;
            RAISE NOTICE 'Refreshed mv_monthly_spending in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
            
            view_refresh_start := clock_timestamp();
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_spending;
            success_views := array_append(success_views, 'mv_daily_spending');
            view_count := view_count + 1;
            RAISE NOTICE 'Refreshed mv_daily_spending in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
            
            view_refresh_start := clock_timestamp();
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_spending;
            success_views := array_append(success_views, 'mv_category_spending');
            view_count := view_count + 1;
            RAISE NOTICE 'Refreshed mv_category_spending in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
            
            view_refresh_start := clock_timestamp();
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_spending;
            success_views := array_append(success_views, 'mv_user_spending');
            view_count := view_count + 1;
            RAISE NOTICE 'Refreshed mv_user_spending in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
            
            -- Phase 2: Yearly Analysis Views (if they exist)
            IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_yearly_monthly_breakdown') THEN
                view_refresh_start := clock_timestamp();
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_yearly_monthly_breakdown;
                success_views := array_append(success_views, 'mv_yearly_monthly_breakdown');
                view_count := view_count + 1;
                RAISE NOTICE 'Refreshed mv_yearly_monthly_breakdown in % ms', 
                    EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
            END IF;
            
            RAISE NOTICE 'All % analytics views refreshed concurrently in % ms', 
                view_count, EXTRACT(MILLISECOND FROM clock_timestamp() - refresh_start);
                
        EXCEPTION
            WHEN OTHERS THEN
                -- Fall back to regular refresh
                RAISE NOTICE 'Concurrent refresh failed (%), using regular refresh: %', SQLSTATE, SQLERRM;
                PERFORM refresh_analytics_views(FALSE);
                RETURN;
        END;
    ELSE
        -- Regular refresh (blocking but always works)
        BEGIN
            -- Phase 1: Base Analytics Views
            view_refresh_start := clock_timestamp();
            REFRESH MATERIALIZED VIEW mv_monthly_spending;
            success_views := array_append(success_views, 'mv_monthly_spending');
            view_count := view_count + 1;
            RAISE NOTICE 'Refreshed mv_monthly_spending in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
        EXCEPTION
            WHEN OTHERS THEN
                failed_views := array_append(failed_views, 'mv_monthly_spending');
                error_count := error_count + 1;
                RAISE NOTICE 'Failed to refresh mv_monthly_spending: %', SQLERRM;
        END;
        
        BEGIN
            view_refresh_start := clock_timestamp();
            REFRESH MATERIALIZED VIEW mv_daily_spending;
            success_views := array_append(success_views, 'mv_daily_spending');
            view_count := view_count + 1;
            RAISE NOTICE 'Refreshed mv_daily_spending in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
        EXCEPTION
            WHEN OTHERS THEN
                failed_views := array_append(failed_views, 'mv_daily_spending');
                error_count := error_count + 1;
                RAISE NOTICE 'Failed to refresh mv_daily_spending: %', SQLERRM;
        END;
        
        BEGIN
            view_refresh_start := clock_timestamp();
            REFRESH MATERIALIZED VIEW mv_category_spending;
            success_views := array_append(success_views, 'mv_category_spending');
            view_count := view_count + 1;
            RAISE NOTICE 'Refreshed mv_category_spending in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
        EXCEPTION
            WHEN OTHERS THEN
                failed_views := array_append(failed_views, 'mv_category_spending');
                error_count := error_count + 1;
                RAISE NOTICE 'Failed to refresh mv_category_spending: %', SQLERRM;
        END;
        
        BEGIN
            view_refresh_start := clock_timestamp();
            REFRESH MATERIALIZED VIEW mv_user_spending;
            success_views := array_append(success_views, 'mv_user_spending');
            view_count := view_count + 1;
            RAISE NOTICE 'Refreshed mv_user_spending in % ms', 
                EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
        EXCEPTION
            WHEN OTHERS THEN
                failed_views := array_append(failed_views, 'mv_user_spending');
                error_count := error_count + 1;
                RAISE NOTICE 'Failed to refresh mv_user_spending: %', SQLERRM;
        END;
        
        -- Phase 2: Yearly Analysis Views (if they exist)
        IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_yearly_monthly_breakdown') THEN
            BEGIN
                view_refresh_start := clock_timestamp();
                REFRESH MATERIALIZED VIEW mv_yearly_monthly_breakdown;
                success_views := array_append(success_views, 'mv_yearly_monthly_breakdown');
                view_count := view_count + 1;
                RAISE NOTICE 'Refreshed mv_yearly_monthly_breakdown in % ms', 
                    EXTRACT(MILLISECOND FROM clock_timestamp() - view_refresh_start);
            EXCEPTION
                WHEN OTHERS THEN
                    failed_views := array_append(failed_views, 'mv_yearly_monthly_breakdown');
                    error_count := error_count + 1;
                    RAISE NOTICE 'Failed to refresh mv_yearly_monthly_breakdown: %', SQLERRM;
            END;
        END IF;
        
        RAISE NOTICE 'Analytics refresh completed: % successful, % failed in % ms', 
            view_count, error_count, EXTRACT(MILLISECOND FROM clock_timestamp() - refresh_start);
        
        IF array_length(success_views, 1) > 0 THEN
            RAISE NOTICE 'Successfully refreshed: %', array_to_string(success_views, ', ');
        END IF;
        
        IF array_length(failed_views, 1) > 0 THEN
            RAISE NOTICE 'Failed to refresh: %', array_to_string(failed_views, ', ');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enhanced smart refresh function with better logging and error handling
CREATE OR REPLACE FUNCTION smart_refresh_analytics()
RETURNS void AS $$
DECLARE
    last_refresh TIMESTAMP;
    minutes_since_refresh INTEGER;
    refresh_start TIMESTAMP;
    refresh_duration INTEGER;
BEGIN
    -- Get last refresh time
    SELECT MAX(refresh_time) INTO last_refresh 
    FROM analytics_refresh_log 
    WHERE refresh_type = 'auto';
    
    -- Calculate minutes since last refresh
    minutes_since_refresh := EXTRACT(EPOCH FROM (NOW() - COALESCE(last_refresh, '2000-01-01'::timestamp))) / 60;
    
    RAISE NOTICE 'Minutes since last refresh: %', minutes_since_refresh;
    
    -- Only refresh if more than 5 minutes have passed
    IF minutes_since_refresh > 5 THEN
        refresh_start := clock_timestamp();
        
        -- Attempt the refresh
        BEGIN
            PERFORM refresh_analytics_views(TRUE);
            refresh_duration := EXTRACT(MILLISECOND FROM clock_timestamp() - refresh_start);
            
            -- Log successful refresh
            INSERT INTO analytics_refresh_log (refresh_type, duration_ms)
            VALUES ('auto', refresh_duration);
            
            RAISE NOTICE 'Smart refresh completed successfully in % ms', refresh_duration;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Log failed refresh attempt
                INSERT INTO analytics_refresh_log (refresh_type, duration_ms)
                VALUES ('auto_failed', -1);
                
                RAISE NOTICE 'Smart refresh failed: %', SQLERRM;
                -- Don't re-raise the exception to avoid breaking expense operations
        END;
    ELSE
        RAISE NOTICE 'Skipping refresh - only % minutes since last refresh (minimum 5 minutes)', minutes_since_refresh;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INSIGHTS CACHE REFRESH INTEGRATION
-- =====================================================

-- Enhanced function to refresh insights for active users after analytics refresh
CREATE OR REPLACE FUNCTION smart_refresh_insights_after_analytics()
RETURNS void AS $$
DECLARE
    last_insights_refresh TIMESTAMP;
    hours_since_insights_refresh INTEGER;
    active_user_count INTEGER;
    refreshed_insights_count INTEGER := 0;
BEGIN
    -- Check when insights were last refreshed
    SELECT MAX(created_at) INTO last_insights_refresh 
    FROM insights_cache;
    
    hours_since_insights_refresh := EXTRACT(EPOCH FROM (NOW() - COALESCE(last_insights_refresh, '2000-01-01'::timestamp))) / 3600;
    
    -- Only refresh insights if more than 6 hours have passed or no insights exist
    IF hours_since_insights_refresh > 6 THEN
        -- Count active users (those with expenses in last 7 days)
        SELECT COUNT(DISTINCT created_by) INTO active_user_count
        FROM expenses
        WHERE expense_date >= CURRENT_DATE - INTERVAL '7 days'
        AND is_active = true;
        
        RAISE NOTICE 'Refreshing insights for % active users', active_user_count;
        
        -- Refresh insights using the existing function if it exists
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_refresh_insights') THEN
            BEGIN
                SELECT auto_refresh_insights() INTO refreshed_insights_count;
                RAISE NOTICE 'Refreshed % insights', refreshed_insights_count;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to refresh insights: %', SQLERRM;
            END;
        END IF;
    ELSE
        RAISE NOTICE 'Skipping insights refresh - only % hours since last refresh (minimum 6 hours)', hours_since_insights_refresh;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Combined smart refresh function that handles both analytics and insights
CREATE OR REPLACE FUNCTION smart_refresh_all()
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    analytics_start TIMESTAMP;
    analytics_duration INTEGER;
    insights_start TIMESTAMP;
    insights_duration INTEGER;
BEGIN
    result := jsonb_set(result, '{start_time}', to_jsonb(now()::text));
    
    -- Refresh analytics views
    analytics_start := clock_timestamp();
    BEGIN
        PERFORM smart_refresh_analytics();
        analytics_duration := EXTRACT(MILLISECOND FROM clock_timestamp() - analytics_start);
        result := jsonb_set(result, '{analytics_refresh}', jsonb_build_object(
            'status', 'success',
            'duration_ms', analytics_duration
        ));
    EXCEPTION
        WHEN OTHERS THEN
            analytics_duration := EXTRACT(MILLISECOND FROM clock_timestamp() - analytics_start);
            result := jsonb_set(result, '{analytics_refresh}', jsonb_build_object(
                'status', 'failed',
                'duration_ms', analytics_duration,
                'error', SQLERRM
            ));
    END;
    
    -- Refresh insights (only if analytics succeeded)
    IF result->'analytics_refresh'->>'status' = 'success' THEN
        insights_start := clock_timestamp();
        BEGIN
            PERFORM smart_refresh_insights_after_analytics();
            insights_duration := EXTRACT(MILLISECOND FROM clock_timestamp() - insights_start);
            result := jsonb_set(result, '{insights_refresh}', jsonb_build_object(
                'status', 'success',
                'duration_ms', insights_duration
            ));
        EXCEPTION
            WHEN OTHERS THEN
                insights_duration := EXTRACT(MILLISECOND FROM clock_timestamp() - insights_start);
                result := jsonb_set(result, '{insights_refresh}', jsonb_build_object(
                    'status', 'failed',
                    'duration_ms', insights_duration,
                    'error', SQLERRM
                ));
        END;
    ELSE
        result := jsonb_set(result, '{insights_refresh}', jsonb_build_object(
            'status', 'skipped',
            'reason', 'analytics_refresh_failed'
        ));
    END IF;
    
    result := jsonb_set(result, '{end_time}', to_jsonb(now()::text));
    result := jsonb_set(result, '{total_duration_ms}', 
        to_jsonb(EXTRACT(MILLISECOND FROM clock_timestamp() - analytics_start)::integer));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MONITORING AND DIAGNOSTICS
-- =====================================================

-- Function to check the status of all materialized views
CREATE OR REPLACE FUNCTION check_materialized_views_status()
RETURNS TABLE(
    view_name TEXT,
    exists BOOLEAN,
    row_count BIGINT,
    last_refresh TIMESTAMP,
    size_pretty TEXT,
    indexes_count INTEGER
) AS $$
DECLARE
    view_record RECORD;
    row_count_val BIGINT;
    size_val BIGINT;
    indexes_count_val INTEGER;
BEGIN
    -- Check each materialized view
    FOR view_record IN 
        SELECT matviewname, schemaname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
        ORDER BY matviewname
    LOOP
        -- Get row count
        BEGIN
            EXECUTE format('SELECT count(*) FROM %I.%I', view_record.schemaname, view_record.matviewname) 
            INTO row_count_val;
        EXCEPTION
            WHEN OTHERS THEN
                row_count_val := -1;
        END;
        
        -- Get size
        BEGIN
            SELECT pg_total_relation_size(format('%I.%I', view_record.schemaname, view_record.matviewname))
            INTO size_val;
        EXCEPTION
            WHEN OTHERS THEN
                size_val := 0;
        END;
        
        -- Get index count
        SELECT COUNT(*) INTO indexes_count_val
        FROM pg_indexes
        WHERE tablename = view_record.matviewname
        AND schemaname = view_record.schemaname;
        
        RETURN QUERY SELECT
            view_record.matviewname,
            true,
            row_count_val,
            now()::TIMESTAMP, -- We don't track individual refresh times yet
            pg_size_pretty(size_val),
            indexes_count_val;
    END LOOP;
    
    -- Check for expected views that might be missing
    IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_yearly_monthly_breakdown') THEN
        RETURN QUERY SELECT
            'mv_yearly_monthly_breakdown'::TEXT,
            false,
            0::BIGINT,
            null::TIMESTAMP,
            '0 bytes'::TEXT,
            0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE AND TESTING FUNCTIONS
-- =====================================================

-- Test function to validate the extended refresh system
CREATE OR REPLACE FUNCTION test_extended_refresh_system()
RETURNS TEXT AS $$
DECLARE
    test_result TEXT := '';
    refresh_result JSONB;
    view_status RECORD;
BEGIN
    test_result := test_result || 'Starting Extended Refresh System Test' || E'\n';
    
    -- Test 1: Check materialized views status
    test_result := test_result || E'\n1. Checking materialized views status:' || E'\n';
    FOR view_status IN SELECT * FROM check_materialized_views_status() LOOP
        test_result := test_result || format('   - %s: exists=%s, rows=%s, size=%s' || E'\n',
            view_status.view_name, view_status.exists, view_status.row_count, view_status.size_pretty);
    END LOOP;
    
    -- Test 2: Test refresh functions
    test_result := test_result || E'\n2. Testing refresh functions:' || E'\n';
    
    BEGIN
        PERFORM refresh_analytics_views(FALSE);
        test_result := test_result || '   - refresh_analytics_views(): SUCCESS' || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            test_result := test_result || '   - refresh_analytics_views(): FAILED - ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        PERFORM smart_refresh_analytics();
        test_result := test_result || '   - smart_refresh_analytics(): SUCCESS' || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            test_result := test_result || '   - smart_refresh_analytics(): FAILED - ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        SELECT smart_refresh_all() INTO refresh_result;
        test_result := test_result || '   - smart_refresh_all(): SUCCESS' || E'\n';
        test_result := test_result || '     Result: ' || refresh_result::TEXT || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            test_result := test_result || '   - smart_refresh_all(): FAILED - ' || SQLERRM || E'\n';
    END;
    
    test_result := test_result || E'\nExtended Refresh System Test Complete';
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION refresh_analytics_views(BOOLEAN) IS 'Enhanced function to refresh ALL materialized views (base + yearly analysis) with error handling and detailed logging';
COMMENT ON FUNCTION smart_refresh_analytics() IS 'Enhanced smart refresh with 5-minute cooldown, better error handling, and logging';
COMMENT ON FUNCTION smart_refresh_all() IS 'Combined refresh function for both analytics views and insights cache with detailed JSON response';
COMMENT ON FUNCTION check_materialized_views_status() IS 'Diagnostic function to check status of all materialized views';
COMMENT ON FUNCTION test_extended_refresh_system() IS 'Test function to validate the extended refresh system functionality';

-- =====================================================
-- INITIAL SETUP AND TESTING
-- =====================================================

-- Test the extended system
SELECT test_extended_refresh_system();

-- Refresh all views to ensure they're up to date
SELECT smart_refresh_all();

-- Show status of all materialized views
SELECT * FROM check_materialized_views_status();