# 🚀 Getting Started - Vue 3 TypeScript CRM

## ✅ Setup Complete & Ready to Run

Your Vue 3 TypeScript CRM application with Supabase backend is fully implemented and ready for development!

---

## 🏃‍♂️ Quick Start

### 1. Start Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173` (or next available port)

### 2. Explore the CRM Dashboard
1. Navigate to the dashboard at the homepage (/)
2. Explore the main sections:
   - **Contacts**: Manage contact information and relationships
   - **Organizations**: Track company and institution data
   - **Opportunities**: Sales pipeline management with 7-stage workflow
   - **Interactions**: Customer engagement tracking
   - **Principal Activity**: Advanced analytics and reporting

### 3. Test Core Features
- Create new contacts with multi-step forms
- Add organizations with comprehensive details
- Track opportunities through the sales pipeline
- Log customer interactions with timeline view

---

## 🔧 Development Commands

### Essential Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint
```

### Database Management (via MCP)
Use Claude Code with these natural language commands:
```bash
# View CRM data
"Show me all contacts" 
"List organizations with their contact counts"
"Display recent opportunities"

# Apply SQL from organized files
"Apply the schema from sql/04_contacts_schema.sql"
"Apply RLS policies from sql/05_contacts_rls.sql"

# Generate updated types after schema changes
"Generate TypeScript types for the database"

# Debug CRM queries  
"Run this SQL query: SELECT * FROM contacts WHERE..."
"Show opportunity pipeline metrics"

# Use reference queries
"Run the analytics query from sql/queries/analytics.sql"
```

---

## 🗄️ SQL File Organization

### CRM Database Files Structure
```
sql/
├── README.md                    # SQL usage documentation
├── 04_contacts_schema.sql       # Contact entity schema
├── 05_contacts_rls.sql         # Contact security policies
├── 10_organizations_schema.sql  # Organization entity schema
├── 30_opportunities_schema.sql  # Opportunity pipeline schema
├── 32_interactions_schema.sql   # Customer interaction schema
├── 36_principal_activity_schema.sql # Principal analytics schema
├── migrations/                 # Schema evolution
└── queries/                    # Reference queries
    ├── analytics.sql           # CRM business intelligence
    └── maintenance.sql         # Database maintenance
```

### How MCP Commands Work with SQL
```bash
# Development: MCP translates natural language to SQL
You: "Create contacts table with organization relationships"
MCP: Executes CREATE TABLE commands automatically

# Production: Manual SQL application
Copy from sql/ files → Paste into Supabase Dashboard → Execute

# Both environments result in identical CRM database structure
```

---

## 🔧 Environment Variables

### Required Variables (Vite)
The application uses `VITE_` prefixed environment variables:

```bash
# In .env.local (for local development)
VITE_SUPABASE_URL=https://jzxxwptgsyzhdtulrdjy.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### For Production Deployment
Set these environment variables in your deployment platform:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

---

## 📊 What's Working

### ✅ CRM Features
- **Contact Management**: Full CRUD operations with relationship tracking
- **Organization Management**: Company profiles with contact associations
- **Opportunity Pipeline**: 7-stage sales workflow with auto-naming
- **Interaction Tracking**: Customer engagement timeline and analytics
- **Principal Activity**: Advanced analytics and performance metrics

### ✅ Database Integration
- **Live Connection**: Direct connection to Supabase cloud database
- **Automatic Types**: TypeScript types generated from live schema
- **RLS Security**: Row Level Security policies for multi-tenant data
- **Real-time**: Live updates across all CRM entities

### ✅ Development Experience
- **Vue 3 + TypeScript**: Modern framework with full type safety
- **Pinia State Management**: Reactive data management across components
- **MCP Enhanced**: Natural language database management
- **SQL Organization**: Structured SQL files for CRM entities
- **Hot Reload**: Instant feedback during development

---

## 🗄️ Database Schema

Your CRM database includes these core entities:
```sql
-- Contacts with organization relationships
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations with comprehensive details
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    status organization_status DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities with 7-stage pipeline
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stage opportunity_stage DEFAULT 'NEW_LEAD',
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Live Database URL**: https://jzxxwptgsyzhdtulrdjy.supabase.co

**Schema Files**: See `sql/` directory for complete CRM database structure

---

## 🧪 Testing the CRM Implementation

### Test Scenarios to Try

1. **Contact Management**
   - Create new contacts with required fields
   - Associate contacts with organizations
   - Test contact editing and updates
   - Verify contact list filtering and search

2. **Organization Management**
   - Create organizations with comprehensive details
   - Link multiple contacts to organizations
   - Test organization status workflows
   - Check organization analytics and metrics

3. **Opportunity Pipeline**
   - Create opportunities with auto-naming
   - Test 7-stage opportunity progression
   - Batch create opportunities for multiple principals
   - Verify opportunity KPI calculations

4. **Database Integration**
   - Use MCP to query: "Show me all contacts with their organizations"
   - Try analytics queries from `sql/queries/analytics.sql`
   - Test real-time updates across browser tabs
   - Verify RLS policies are enforcing data access

---

## 🚀 Production Deployment

When ready to deploy:

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Deploy
vercel --prod
```

### Netlify Deployment
1. Connect your Git repository to Netlify
2. Set environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`: https://jzxxwptgsyzhdtulrdjy.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: [your anon key]
3. Deploy automatically on Git push

### Production Database Management
```bash
# Without MCP - use these methods:
1. Supabase Dashboard SQL Editor
2. Apply CRM schema from sql/ directory files
3. Use Supabase CLI for migrations
4. Monitor via sql/queries/maintenance.sql
5. Deploy RLS policies for secure multi-tenant data
```

---

## 🔍 Troubleshooting

### Common Issues

**"Missing required Supabase environment variables" error?**
- Ensure `.env.local` file exists with `VITE_` prefixed variables
- Restart development server after adding environment variables
- Check that variable names use `VITE_` prefix (not `REACT_APP_` or `NEXT_PUBLIC_`)

**Form not submitting?**
- Check browser console for errors
- Verify network connection
- Use MCP to test database connection: "Test database connection"

**Validation errors?**
- Ensure all required fields are completed
- Email addresses must be valid format
- Phone numbers should follow standard formatting
- Organization relationships must be properly linked

**TypeScript errors?**
- Run `npm run type-check` to identify issues
- Regenerate types: "Generate TypeScript types for the database"

**Build failures?**
- Run `npm run build` to test production build
- Check for missing dependencies
- Verify environment variables are set

**Schema questions?**
- Check `sql/` directory for complete database structure
- Use `sql/queries/maintenance.sql` for database debugging
- Compare application code vs. database schema

---

## 📚 Project Structure Reference

```
/
├── sql/                         # CRM Database SQL organization
│   ├── 04_contacts_schema.sql   # Contact entity definitions
│   ├── 10_organizations_schema.sql # Organization entity schema
│   ├── 30_opportunities_schema.sql # Opportunity pipeline schema
│   ├── migrations/             # Schema changes over time
│   └── queries/                # CRM analytics and reporting queries
├── src/
│   ├── components/
│   │   ├── forms/              # CRM form components
│   │   │   ├── ContactFormWrapper.vue    # Multi-step contact forms
│   │   │   ├── OrganizationFormWrapper.vue # Multi-step organization forms
│   │   │   └── OpportunityFormWrapper.vue  # Multi-step opportunity forms
│   │   ├── opportunities/      # Sales pipeline components
│   │   ├── organizations/      # Organization management
│   │   └── principal/          # Principal activity tracking
│   ├── config/
│   │   └── supabaseClient.ts   # Supabase CRM client configuration
│   ├── services/               # CRM API services
│   │   ├── contactsApi.ts      # Contact management API
│   │   ├── organizationsApi.ts # Organization management API
│   │   └── opportunitiesApi.ts # Opportunity pipeline API
│   ├── stores/                 # Pinia state management
│   │   ├── contactStore.ts     # Contact entity state
│   │   ├── organizationStore.ts # Organization entity state
│   │   └── opportunityStore.ts  # Opportunity pipeline state
│   ├── types/
│   │   ├── database.types.ts   # Generated from CRM database schema
│   │   ├── contacts.ts         # Contact entity types
│   │   ├── organizations.ts    # Organization entity types
│   │   └── opportunities.ts    # Opportunity entity types
│   └── views/                  # CRM route views
│       ├── contacts/           # Contact management views
│       ├── organizations/      # Organization management views
│       └── opportunities/      # Opportunity management views
└── CLAUDE.md                   # Complete CRM architecture guide
```

---

## 🎯 Next Steps

1. **Test the CRM**: Start the dev server and explore the dashboard features
2. **Explore MCP**: Use natural language commands for database management
3. **Study SQL Files**: Review `sql/` directory to understand CRM database structure
4. **Try Analytics**: Run queries from `sql/queries/analytics.sql` via MCP
5. **Customize**: Modify CRM components or styling as needed
6. **Deploy**: Use the provided configurations for production deployment
7. **Scale**: Add more CRM features using the established patterns

**Happy coding! 🎉**