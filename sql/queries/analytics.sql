-- =============================================================================
-- Analytics Queries
-- =============================================================================
-- Common queries for analyzing form submission data
-- Use these in Supabase Dashboard or via MCP during development
-- =============================================================================

-- Total submissions count
SELECT COUNT(*) as total_submissions 
FROM user_submissions;

-- Submissions by favorite color
SELECT 
    favorite_color,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_submissions), 2) as percentage
FROM user_submissions 
GROUP BY favorite_color 
ORDER BY count DESC;

-- Age distribution
SELECT 
    CASE 
        WHEN age < 18 THEN 'Under 18'
        WHEN age BETWEEN 18 AND 25 THEN '18-25'
        WHEN age BETWEEN 26 AND 35 THEN '26-35'
        WHEN age BETWEEN 36 AND 50 THEN '36-50'
        ELSE 'Over 50'
    END as age_group,
    COUNT(*) as count
FROM user_submissions 
GROUP BY age_group 
ORDER BY count DESC;

-- Daily submission trends (last 30 days)
SELECT 
    DATE(created_at) as submission_date,
    COUNT(*) as daily_count
FROM user_submissions 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY submission_date DESC;

-- Hourly submission patterns
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as submissions
FROM user_submissions 
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;

-- Most recent submissions
SELECT 
    first_name,
    last_name,
    age,
    favorite_color,
    created_at
FROM user_submissions 
ORDER BY created_at DESC 
LIMIT 10;

-- Average age by color preference
SELECT 
    favorite_color,
    ROUND(AVG(age), 1) as average_age,
    COUNT(*) as sample_size
FROM user_submissions 
GROUP BY favorite_color 
HAVING COUNT(*) >= 5  -- Only show colors with at least 5 responses
ORDER BY average_age DESC;