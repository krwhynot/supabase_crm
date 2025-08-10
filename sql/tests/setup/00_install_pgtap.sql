-- =============================================================================
-- pgTAP Installation for Supabase CRM Database Testing
-- =============================================================================
-- This file installs the pgTAP extension and sets up the testing framework.
-- 
-- Execute this file FIRST before running any tests.
-- Requires superuser privileges or appropriate permissions in Supabase.
-- =============================================================================

-- Install pgTAP extension (requires superuser or appropriate permissions)
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Verify pgTAP installation
SELECT plan(1);
SELECT has_extension('pgtap', 'pgTAP extension should be installed');
SELECT finish();

-- Grant necessary permissions to testing roles
DO $$
BEGIN
    -- Create testing role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pgtap_tester') THEN
        CREATE ROLE pgtap_tester;
    END IF;
    
    -- Grant necessary permissions for testing
    GRANT USAGE ON SCHEMA public TO pgtap_tester;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pgtap_tester;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pgtap_tester;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pgtap_tester;
    
    -- Set default privileges for future objects
    ALTER DEFAULT PRIVILEGES IN SCHEMA public 
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pgtap_tester;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public 
        GRANT USAGE, SELECT ON SEQUENCES TO pgtap_tester;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public 
        GRANT EXECUTE ON FUNCTIONS TO pgtap_tester;
END$$;

-- Create test database notification system
CREATE OR REPLACE FUNCTION test_notify(message TEXT)
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE 'TEST: %', message;
END;
$$ LANGUAGE plpgsql;

-- Test completion marker
SELECT test_notify('pgTAP installation completed successfully');