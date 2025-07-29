-- =============================================================================
-- Maintenance Queries
-- =============================================================================
-- Database maintenance and troubleshooting queries
-- Use these in Supabase Dashboard or via MCP during development
-- =============================================================================

-- Check table sizes and record counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_inserted(c.oid) as inserts,
    pg_stat_get_tuples_updated(c.oid) as updates,
    pg_stat_get_tuples_deleted(c.oid) as deletes
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public';

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- View RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for duplicate records (by name and age)
SELECT 
    first_name,
    last_name,
    age,
    COUNT(*) as duplicate_count
FROM user_submissions 
GROUP BY first_name, last_name, age
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Find records with potential data quality issues
SELECT 
    id,
    first_name,
    last_name,
    age,
    favorite_color,
    created_at,
    'Unusual age' as issue
FROM user_submissions 
WHERE age > 120 OR age < 1

UNION ALL

SELECT 
    id,
    first_name,
    last_name,
    age,
    favorite_color,
    created_at,
    'Empty name fields' as issue
FROM user_submissions 
WHERE TRIM(first_name) = '' OR TRIM(last_name) = ''

UNION ALL

SELECT 
    id,
    first_name,
    last_name,
    age,
    favorite_color,
    created_at,
    'Unusual color' as issue
FROM user_submissions 
WHERE favorite_color NOT IN ('Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Other');

-- Database connection and performance info
SELECT 
    datname as database_name,
    numbackends as connections,
    xact_commit as transactions_committed,
    xact_rollback as transactions_rolled_back,
    blks_read as blocks_read,
    blks_hit as blocks_hit,
    ROUND(100.0 * blks_hit / (blks_hit + blks_read), 2) as cache_hit_ratio
FROM pg_stat_database 
WHERE datname = current_database();

-- Recent activity log
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as submissions,
    AVG(age) as avg_age,
    COUNT(DISTINCT favorite_color) as color_variety
FROM user_submissions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Clean up test data (USE WITH CAUTION)
-- Uncomment only when you need to remove test records
/*
DELETE FROM user_submissions 
WHERE first_name = 'Test' 
AND last_name = 'User'
AND created_at < NOW() - INTERVAL '1 hour';
*/