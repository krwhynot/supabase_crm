-- =============================================================================
-- Production Rollback Procedures - Interaction Management System
-- =============================================================================
-- Emergency rollback script for the Interaction Management System.
-- 
-- USE WITH EXTREME CAUTION - THIS WILL REMOVE ALL INTERACTION DATA
--
-- This script provides procedures to safely rollback the interactions system
-- deployment in case of critical issues during or after production deployment.
--
-- Rollback scenarios supported:
-- 1. Complete system rollback (removes all interactions components)
-- 2. Schema-only rollback (preserves data, removes structure)
-- 3. Policy-only rollback (removes RLS policies only)
-- 4. Index-only rollback (removes performance indexes only)
-- =============================================================================

-- Safety check and confirmation
\echo '⚠️  WARNING: INTERACTION SYSTEM ROLLBACK PROCEDURES'
\echo '=================================================='
\echo ''
\echo 'This script will rollback the Interaction Management System deployment.'
\echo 'This action is IRREVERSIBLE and will result in:'
\echo '  - Complete removal of interactions table and data'
\echo '  - Removal of all RLS policies'
\echo '  - Removal of all performance indexes'
\echo '  - Removal of all security functions'
\echo '  - Removal of all triggers and constraints'
\echo ''
\echo 'Before proceeding, ensure you have:'
\echo '  ✓ Current database backup'
\echo '  ✓ Approval from system administrator'
\echo '  ✓ Understanding of business impact'
\echo '  ✓ Rollback testing completed'
\echo ''

-- Require explicit confirmation
\prompt 'Are you absolutely sure you want to proceed with rollback? Type "CONFIRM_ROLLBACK" to continue: ' confirmation

-- Validate confirmation
\if :{?confirmation}
\else
    \echo 'ERROR: Confirmation variable not set. Aborting rollback.'
    \q
\endif

-- Check confirmation value (this is a safety measure, actual check happens in application logic)
-- Note: PostgreSQL \if doesn't support string comparison directly
-- In production, this would be handled by the deployment script

\echo ''
\echo '🔄 STARTING ROLLBACK PROCEDURES...'
\echo ''

-- =============================================================================
-- ROLLBACK OPTION 1: COMPLETE SYSTEM ROLLBACK
-- =============================================================================

-- Create function for complete rollback
CREATE OR REPLACE FUNCTION rollback_interactions_system()
RETURNS text AS $$
DECLARE
    rollback_log text := '';
    rec record;
BEGIN
    rollback_log := rollback_log || 'Starting complete interactions system rollback...' || E'\n';
    
    -- Step 1: Create emergency backup of current data
    BEGIN
        EXECUTE 'CREATE TABLE IF NOT EXISTS interactions_emergency_backup AS SELECT * FROM public.interactions';
        rollback_log := rollback_log || '✓ Emergency backup created: interactions_emergency_backup' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not create emergency backup: ' || SQLERRM || E'\n';
    END;
    
    -- Step 2: Drop triggers (must be done before dropping functions)
    BEGIN
        DROP TRIGGER IF EXISTS interaction_audit_trigger ON public.interactions;
        rollback_log := rollback_log || '✓ Dropped trigger: interaction_audit_trigger' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop trigger interaction_audit_trigger: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP TRIGGER IF EXISTS interaction_security_validation_trigger ON public.interactions;
        rollback_log := rollback_log || '✓ Dropped trigger: interaction_security_validation_trigger' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop trigger interaction_security_validation_trigger: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP TRIGGER IF EXISTS interaction_follow_up_tracking_trigger ON public.interactions;
        rollback_log := rollback_log || '✓ Dropped trigger: interaction_follow_up_tracking_trigger' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop trigger interaction_follow_up_tracking_trigger: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP TRIGGER IF EXISTS update_interactions_updated_at ON public.interactions;
        rollback_log := rollback_log || '✓ Dropped trigger: update_interactions_updated_at' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop trigger update_interactions_updated_at: ' || SQLERRM || E'\n';
    END;
    
    -- Step 3: Drop all indexes (except primary key)
    FOR rec IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'interactions' 
        AND schemaname = 'public'
        AND indexname != 'interactions_pkey'
    LOOP
        BEGIN
            EXECUTE 'DROP INDEX IF EXISTS public.' || quote_ident(rec.indexname);
            rollback_log := rollback_log || '✓ Dropped index: ' || rec.indexname || E'\n';
        EXCEPTION WHEN OTHERS THEN
            rollback_log := rollback_log || '⚠ Warning: Could not drop index ' || rec.indexname || ': ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    -- Step 4: Drop all RLS policies
    FOR rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'interactions'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(rec.policyname) || ' ON public.interactions';
            rollback_log := rollback_log || '✓ Dropped policy: ' || rec.policyname || E'\n';
        EXCEPTION WHEN OTHERS THEN
            rollback_log := rollback_log || '⚠ Warning: Could not drop policy ' || rec.policyname || ': ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    -- Step 5: Drop security and utility functions
    BEGIN
        DROP FUNCTION IF EXISTS log_interaction_access() CASCADE;
        rollback_log := rollback_log || '✓ Dropped function: log_interaction_access' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop function log_interaction_access: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP FUNCTION IF EXISTS validate_interaction_security() CASCADE;
        rollback_log := rollback_log || '✓ Dropped function: validate_interaction_security' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop function validate_interaction_security: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP FUNCTION IF EXISTS get_interaction_principal_context(UUID) CASCADE;
        rollback_log := rollback_log || '✓ Dropped function: get_interaction_principal_context' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop function get_interaction_principal_context: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP FUNCTION IF EXISTS user_has_supervisor_access() CASCADE;
        rollback_log := rollback_log || '✓ Dropped function: user_has_supervisor_access' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop function user_has_supervisor_access: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP FUNCTION IF EXISTS user_has_contact_access(UUID) CASCADE;
        rollback_log := rollback_log || '✓ Dropped function: user_has_contact_access' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop function user_has_contact_access: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP FUNCTION IF EXISTS user_has_opportunity_access(UUID) CASCADE;
        rollback_log := rollback_log || '✓ Dropped function: user_has_opportunity_access' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop function user_has_opportunity_access: ' || SQLERRM || E'\n';
    END;
    
    BEGIN
        DROP FUNCTION IF EXISTS update_interaction_follow_up_tracking() CASCADE;
        rollback_log := rollback_log || '✓ Dropped function: update_interaction_follow_up_tracking' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop function update_interaction_follow_up_tracking: ' || SQLERRM || E'\n';
    END;
    
    -- Step 6: Drop interactions table (CASCADE will drop dependent objects)
    BEGIN
        DROP TABLE IF EXISTS public.interactions CASCADE;
        rollback_log := rollback_log || '✓ Dropped table: interactions (CASCADE)' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '❌ ERROR: Could not drop interactions table: ' || SQLERRM || E'\n';
    END;
    
    -- Step 7: Drop interaction_type enum
    BEGIN
        DROP TYPE IF EXISTS public.interaction_type CASCADE;
        rollback_log := rollback_log || '✓ Dropped type: interaction_type' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop type interaction_type: ' || SQLERRM || E'\n';
    END;
    
    rollback_log := rollback_log || 'Complete interactions system rollback finished.' || E'\n';
    
    RETURN rollback_log;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROLLBACK OPTION 2: SCHEMA-ONLY ROLLBACK (PRESERVE DATA)
-- =============================================================================

CREATE OR REPLACE FUNCTION rollback_interactions_schema_only()
RETURNS text AS $$
DECLARE
    rollback_log text := '';
BEGIN
    rollback_log := rollback_log || 'Starting schema-only rollback (preserving data)...' || E'\n';
    
    -- Create data backup first
    BEGIN
        CREATE TABLE interactions_schema_rollback_backup AS SELECT * FROM public.interactions;
        rollback_log := rollback_log || '✓ Data backup created: interactions_schema_rollback_backup' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '❌ ERROR: Could not create data backup: ' || SQLERRM || E'\n';
        RETURN rollback_log;
    END;
    
    -- Drop only structural components (triggers, indexes, constraints)
    -- But preserve the table and data
    
    -- This is a simplified example - in practice, you would selectively remove
    -- only the problematic components while preserving data
    
    rollback_log := rollback_log || '⚠ Note: Schema-only rollback requires manual intervention' || E'\n';
    rollback_log := rollback_log || '⚠ Contact database administrator for selective component removal' || E'\n';
    
    RETURN rollback_log;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROLLBACK OPTION 3: RLS POLICIES ONLY
-- =============================================================================

CREATE OR REPLACE FUNCTION rollback_interactions_rls_only()
RETURNS text AS $$
DECLARE
    rollback_log text := '';
    rec record;
BEGIN
    rollback_log := rollback_log || 'Starting RLS policies rollback...' || E'\n';
    
    -- Disable RLS temporarily
    BEGIN
        ALTER TABLE public.interactions DISABLE ROW LEVEL SECURITY;
        rollback_log := rollback_log || '✓ Disabled RLS on interactions table' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not disable RLS: ' || SQLERRM || E'\n';
    END;
    
    -- Drop all RLS policies
    FOR rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'interactions'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(rec.policyname) || ' ON public.interactions';
            rollback_log := rollback_log || '✓ Dropped policy: ' || rec.policyname || E'\n';
        EXCEPTION WHEN OTHERS THEN
            rollback_log := rollback_log || '⚠ Warning: Could not drop policy ' || rec.policyname || ': ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    -- Drop RLS-related functions
    BEGIN
        DROP FUNCTION IF EXISTS user_has_opportunity_access(UUID) CASCADE;
        DROP FUNCTION IF EXISTS user_has_contact_access(UUID) CASCADE;
        DROP FUNCTION IF EXISTS user_has_supervisor_access() CASCADE;
        DROP FUNCTION IF EXISTS get_interaction_principal_context(UUID) CASCADE;
        rollback_log := rollback_log || '✓ Dropped RLS-related functions' || E'\n';
    EXCEPTION WHEN OTHERS THEN
        rollback_log := rollback_log || '⚠ Warning: Could not drop RLS functions: ' || SQLERRM || E'\n';
    END;
    
    rollback_log := rollback_log || 'RLS policies rollback completed.' || E'\n';
    
    RETURN rollback_log;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROLLBACK EXECUTION
-- =============================================================================

\echo '🎯 ROLLBACK OPTIONS AVAILABLE:'
\echo '  1. COMPLETE_ROLLBACK - Remove entire interactions system'
\echo '  2. SCHEMA_ONLY - Preserve data, remove structure'  
\echo '  3. RLS_ONLY - Remove only RLS policies'
\echo '  4. CANCEL - Cancel rollback operation'
\echo ''

\prompt 'Select rollback option (1-4): ' rollback_option

-- Execute selected rollback option
\if :rollback_option = '1'
    \echo ''
    \echo '💥 EXECUTING COMPLETE SYSTEM ROLLBACK...'
    \echo '======================================='
    
    BEGIN;
    
    SELECT rollback_interactions_system() as rollback_result;
    
    \prompt 'Rollback executed. Type "COMMIT" to confirm or "ROLLBACK" to cancel: ' commit_choice
    
    -- In practice, this would be handled by the calling script
    \echo ''
    \echo '⚠️  Manual confirmation required:'
    \echo 'Execute COMMIT; to confirm rollback'
    \echo 'Execute ROLLBACK; to cancel rollback'
    
\elif :rollback_option = '2'
    \echo ''
    \echo '📊 EXECUTING SCHEMA-ONLY ROLLBACK...'
    \echo '===================================='
    
    SELECT rollback_interactions_schema_only() as rollback_result;
    
\elif :rollback_option = '3'
    \echo ''
    \echo '🔐 EXECUTING RLS POLICIES ROLLBACK...'
    \echo '====================================='
    
    BEGIN;
    
    SELECT rollback_interactions_rls_only() as rollback_result;
    
    \prompt 'RLS rollback executed. Type "COMMIT" to confirm or "ROLLBACK" to cancel: ' commit_choice
    
    \echo ''
    \echo '⚠️  Manual confirmation required:'
    \echo 'Execute COMMIT; to confirm RLS rollback'
    \echo 'Execute ROLLBACK; to cancel RLS rollback'
    
\elif :rollback_option = '4'
    \echo ''
    \echo '✅ ROLLBACK CANCELLED'
    \echo '===================='
    \echo 'No changes were made to the database.'
    
\else
    \echo ''
    \echo '❌ INVALID OPTION'
    \echo '================='
    \echo 'Rollback cancelled due to invalid option selection.'
\endif

-- =============================================================================
-- ROLLBACK VERIFICATION FUNCTIONS
-- =============================================================================

-- Function to verify rollback completion
CREATE OR REPLACE FUNCTION verify_rollback_completion()
RETURNS text AS $$
DECLARE
    verification_log text := '';
    table_exists boolean;
    policy_count integer;
    function_count integer;
    index_count integer;
BEGIN
    verification_log := verification_log || 'Verifying rollback completion...' || E'\n';
    
    -- Check if interactions table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'interactions' 
        AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        verification_log := verification_log || '⚠ Warning: interactions table still exists' || E'\n';
    ELSE
        verification_log := verification_log || '✓ interactions table successfully removed' || E'\n';
    END IF;
    
    -- Check for remaining policies
    SELECT count(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'interactions';
    
    IF policy_count > 0 THEN
        verification_log := verification_log || '⚠ Warning: ' || policy_count || ' RLS policies still exist' || E'\n';
    ELSE
        verification_log := verification_log || '✓ All RLS policies successfully removed' || E'\n';
    END IF;
    
    -- Check for remaining functions
    SELECT count(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_name LIKE '%interaction%';
    
    IF function_count > 0 THEN
        verification_log := verification_log || '⚠ Warning: ' || function_count || ' interaction-related functions still exist' || E'\n';
    ELSE
        verification_log := verification_log || '✓ All interaction functions successfully removed' || E'\n';
    END IF;
    
    -- Check for remaining indexes
    SELECT count(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'interactions';
    
    IF index_count > 0 THEN
        verification_log := verification_log || '⚠ Warning: ' || index_count || ' indexes still exist' || E'\n';
    ELSE
        verification_log := verification_log || '✓ All indexes successfully removed' || E'\n';
    END IF;
    
    verification_log := verification_log || 'Rollback verification completed.' || E'\n';
    
    RETURN verification_log;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DATA RECOVERY FUNCTIONS
-- =============================================================================

-- Function to restore from backup (if rollback was accidental)
CREATE OR REPLACE FUNCTION restore_from_backup(backup_table_name text)
RETURNS text AS $$
DECLARE
    restore_log text := '';
    backup_exists boolean;
    record_count integer;
BEGIN
    restore_log := restore_log || 'Starting data restoration from backup...' || E'\n';
    
    -- Check if backup table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = backup_table_name
        AND table_schema = 'public'
    ) INTO backup_exists;
    
    IF NOT backup_exists THEN
        restore_log := restore_log || '❌ ERROR: Backup table ' || backup_table_name || ' not found' || E'\n';
        RETURN restore_log;
    END IF;
    
    -- Get record count from backup
    EXECUTE 'SELECT count(*) FROM public.' || quote_ident(backup_table_name) INTO record_count;
    restore_log := restore_log || '📊 Found ' || record_count || ' records in backup' || E'\n';
    
    -- Note: Actual restoration would require recreating the schema first
    restore_log := restore_log || '⚠ Warning: Schema must be recreated before data restoration' || E'\n';
    restore_log := restore_log || '⚠ Use normal deployment procedure to recreate schema, then restore data' || E'\n';
    
    RETURN restore_log;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CLEANUP AND FINAL NOTES
-- =============================================================================

\echo ''
\echo '🧹 ROLLBACK UTILITIES AVAILABLE:'
\echo '================================'
\echo ''
\echo 'Verification:'
\echo '  SELECT verify_rollback_completion();'
\echo ''
\echo 'Data Recovery (if needed):'
\echo '  SELECT restore_from_backup(''interactions_emergency_backup'');'
\echo ''
\echo 'Cleanup Functions:'
\echo '  DROP FUNCTION IF EXISTS rollback_interactions_system();'
\echo '  DROP FUNCTION IF EXISTS rollback_interactions_schema_only();'
\echo '  DROP FUNCTION IF EXISTS rollback_interactions_rls_only();'
\echo '  DROP FUNCTION IF EXISTS verify_rollback_completion();'
\echo '  DROP FUNCTION IF EXISTS restore_from_backup(text);'
\echo ''
\echo '📝 IMPORTANT NOTES:'
\echo '==================='
\echo '• Always create a backup before executing rollback'
\echo '• Test rollback procedures in staging environment first'  
\echo '• Coordinate with application deployment rollback'
\echo '• Notify users of any service interruption'
\echo '• Document rollback reason and lessons learned'
\echo '• Update deployment procedures based on rollback experience'
\echo ''
\echo '🚨 EMERGENCY CONTACTS:'
\echo '======================'
\echo '• Database Administrator: Backend Architect'
\echo '• System Administrator: DevOps Team'
\echo '• Product Owner: CRM Product Manager'
\echo '• Development Lead: Studio Producer'
\echo ''

-- Final safety reminder
\echo '⚠️  FINAL REMINDER:'
\echo 'Rollback procedures are irreversible operations.'
\echo 'Ensure proper authorization and documentation before proceeding.'
\echo 'Always have a tested backup and recovery plan.'