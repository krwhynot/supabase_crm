# Database Migration Guide

This guide provides step-by-step instructions for applying the Contact Management database schema to your Supabase project.

## Prerequisites

- Active Supabase project
- Database access (via Supabase Dashboard or CLI)
- SQL execution capability

## Migration Files

The following SQL files must be executed in order:

1. `sql/04_contacts_schema.sql` - Core contacts table with validation
2. `sql/05_contacts_rls.sql` - Row Level Security policies  
3. `sql/06_contacts_indexes.sql` - Performance optimization indexes

## Step-by-Step Migration

### Option 1: Via Supabase Dashboard

1. **Navigate to SQL Editor**
   - Open your Supabase project dashboard
   - Go to "SQL Editor" in the sidebar

2. **Execute Schema Migration**
   ```sql
   -- Copy and paste contents of sql/04_contacts_schema.sql
   -- Click "Run" to execute
   ```

3. **Apply RLS Policies**
   ```sql
   -- Copy and paste contents of sql/05_contacts_rls.sql
   -- Click "Run" to execute
   ```

4. **Create Performance Indexes**
   ```sql
   -- Copy and paste contents of sql/06_contacts_indexes.sql
   -- Click "Run" to execute
   ```

### Option 2: Via Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Apply Migrations**
   ```bash
   # Execute each migration file
   supabase db push --file sql/04_contacts_schema.sql
   supabase db push --file sql/05_contacts_rls.sql
   supabase db push --file sql/06_contacts_indexes.sql
   ```

### Option 3: Manual Execution

1. **Connect to Database**
   - Use your preferred PostgreSQL client
   - Connect using Supabase connection string

2. **Execute SQL Files**
   ```bash
   psql "postgresql://postgres:[password]@[host]:5432/postgres" -f sql/04_contacts_schema.sql
   psql "postgresql://postgres:[password]@[host]:5432/postgres" -f sql/05_contacts_rls.sql
   psql "postgresql://postgres:[password]@[host]:5432/postgres" -f sql/06_contacts_indexes.sql
   ```

## Verification

After applying migrations, verify the setup:

1. **Check Table Creation**
   ```sql
   SELECT table_name, column_name, data_type, is_nullable
   FROM information_schema.columns 
   WHERE table_name = 'contacts' 
   ORDER BY ordinal_position;
   ```

2. **Verify RLS Policies**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE tablename = 'contacts';
   ```

3. **Check Indexes**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'contacts';
   ```

## Expected Results

### Table Structure
- **contacts** table with 10 columns
- UUID primary key with auto-generation
- Validation constraints on required fields
- Email format validation
- Automatic timestamp updates

### Security Policies
- Public read access for demo mode
- Authenticated user full access
- Anonymous user read-only access

### Performance Indexes
- Primary key index (automatic)
- Email uniqueness index
- Full-text search index
- Composite indexes for common queries

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you have database admin privileges
   - Check RLS is enabled on your project

2. **Constraint Violations**
   - Verify no existing data conflicts with new constraints
   - Check email format requirements

3. **Index Creation Fails**
   - Ensure table exists before creating indexes
   - Check for naming conflicts

### Recovery

If migrations fail:

1. **Drop and Recreate Table**
   ```sql
   DROP TABLE IF EXISTS public.contacts CASCADE;
   -- Re-run schema migration
   ```

2. **Reset RLS Policies**
   ```sql
   ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Users can view all contacts" ON public.contacts;
   -- Re-run RLS migration
   ```

## Environment Configuration

After successful migration, update your application environment:

1. **Update .env file**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Test Connection**
   ```bash
   npm run dev
   # Navigate to /contacts to test database connection
   ```

## Support

For issues with this migration:
- Check Supabase documentation: https://supabase.com/docs
- Review application logs for specific error messages
- Verify environment configuration matches Supabase project settings