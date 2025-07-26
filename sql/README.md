# 🗄️ SQL Files Organization

## Purpose

This directory contains SQL files for database schema and operations. These files serve different purposes in development vs production.

## File Structure

```
sql/
├── README.md                          # This file
├── 01_initial_schema.sql              # Initial table creation
├── 02_rls_policies.sql                # Row Level Security policies
├── 03_indexes.sql                     # Performance indexes
├── migrations/                        # Future schema changes
│   ├── 001_add_email_column.sql
│   └── 002_add_user_preferences.sql
└── queries/                           # Common queries for reference
    ├── analytics.sql
    └── maintenance.sql
```

## Usage

### Development (MCP-Enhanced)
```bash
# Instead of running SQL files directly, use MCP:
"Apply the initial schema from sql/01_initial_schema.sql"
"Create indexes from sql/03_indexes.sql"
"Generate TypeScript types after schema changes"
```

### Production (Manual Application)
```bash
# Apply via Supabase Dashboard SQL Editor:
# 1. Copy contents of SQL file
# 2. Paste into SQL Editor
# 3. Execute
# 4. Verify results
```

### CI/CD Integration (Advanced)
```bash
# Future: Integrate with Supabase CLI
supabase db push
supabase gen types typescript > ../src/types/database.types.ts
```

## Files Description

- **01_initial_schema.sql**: Core table definitions
- **02_rls_policies.sql**: Security policies for data access
- **03_indexes.sql**: Performance optimization indexes
- **migrations/**: Incremental schema changes over time
- **queries/**: Reference queries for analytics and maintenance