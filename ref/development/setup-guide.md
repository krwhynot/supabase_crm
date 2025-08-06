# Development Setup Guide

## Prerequisites

### Required Software
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 9+ (comes with Node.js)
- **Git**: Latest version for version control
- **VS Code**: Recommended IDE with Vue/TypeScript extensions

### Optional Tools
- **Supabase CLI**: For local database development
- **Playwright**: For running E2E tests locally
- **Vue DevTools**: Browser extension for Vue debugging

## Initial Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone [repository-url]
cd Supabase

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
```

### 2. Environment Configuration

**Required Environment Variables:**
```bash
# .env file configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional configuration
VITE_APP_TITLE="Custom CRM Title"
VITE_ENVIRONMENT=development
```

**Demo Mode Operation:**
The application gracefully operates in demo mode when Supabase credentials are not configured:
- Form submissions are simulated with console logging
- All UI functionality remains operational
- Development-friendly with helpful fallbacks

### 3. Database Setup (Optional)

**For Full Supabase Integration:**
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Obtain your project URL and anon key from Project Settings > API
3. Run the provided SQL scripts in the Supabase SQL editor:
   - `sql/01_initial_schema.sql` - Core table definitions
   - `sql/02_rls_policies.sql` - Row Level Security policies  
   - `sql/03_indexes.sql` - Performance optimization indexes

**Database Schema Overview:**
```sql
-- Core tables
CREATE TABLE organizations (id, name, segment, business_type, ...)
CREATE TABLE contacts (id, first_name, last_name, email, organization_id, ...)
CREATE TABLE opportunities (id, name, stage, organization_id, principal_id, ...)
CREATE TABLE interactions (id, type, title, organization_id, ...)
```

## Development Commands

### Core Development
```bash
# Start development server with hot reload
npm run dev
# Application available at http://localhost:5173

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run type-check

# Linting and code quality
npm run lint
```

### Testing Commands
```bash
# Unit tests (Vitest)
npm run test:unit

# End-to-end tests (Playwright)
npx playwright test

# E2E tests with UI mode for debugging
npx playwright test --ui

# Run specific test file
npx playwright test tests/opportunity-management.spec.ts

# Generate test report
npx playwright test --reporter=html
npx playwright show-report
```

### Database Development
```bash
# Generate TypeScript types from Supabase (if configured)
npm run generate-types

# Validate environment configuration
npm run validate:config
```

## Project Structure

### Directory Organization
```
/src/
├── components/          # Vue components organized by feature
│   ├── common/         # Shared/reusable components
│   ├── contacts/       # Contact management components
│   ├── opportunities/  # Opportunity management components
│   └── dashboard/      # Dashboard-specific components
├── views/              # Route-level components
├── stores/             # Pinia state management
├── services/           # API integration and business logic
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
└── design-system/      # Design system components and tokens

/tests/
├── unit/               # Unit tests (Vitest)
├── components/         # Component integration tests
├── accessibility/      # WCAG compliance tests
├── performance/        # Performance benchmark tests
└── helpers/            # Test utilities and mock data
```

### Key Configuration Files
- `vite.config.ts` - Build system configuration
- `tailwind.config.js` - CSS framework configuration
- `playwright.config.ts` - E2E testing configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

## IDE Setup

### VS Code Extensions
**Essential Extensions:**
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- ESLint
- Prettier - Code formatter

**Recommended Extensions:**
- Vue VSCode Snippets
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Thunder Client (for API testing)

### VS Code Settings
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "vue.codeActions.enabled": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Development Workflow

### Feature Development Process
1. **Create Feature Branch**: `git checkout -b feature/feature-name`
2. **Implement Changes**: Follow Vue 3 Composition API patterns
3. **Add Tests**: Unit tests for logic, E2E tests for workflows
4. **Validate Quality**: Run `npm run lint` and `npm run type-check`
5. **Test Accessibility**: Ensure WCAG 2.1 AA compliance
6. **Performance Check**: Validate performance requirements
7. **Create Pull Request**: Include tests and documentation

### Code Quality Standards

**Vue 3 Patterns:**
- Use Composition API with `<script setup>`
- Implement reactive state with `ref()` and `reactive()`
- Leverage computed properties for derived state
- Follow single responsibility principle for components

**TypeScript Usage:**
- Strong typing for all function parameters and returns
- Interface definitions for complex data structures
- Proper generic usage for reusable components
- Type guards for runtime type checking

**Testing Requirements:**
- Unit tests for business logic functions
- Component tests for user interactions
- E2E tests for complete user workflows
- Accessibility tests for WCAG compliance

## Debugging and Development Tools

### Vue DevTools
Install the browser extension for:
- Component tree inspection
- State management debugging
- Event tracking and performance profiling
- Route navigation debugging

### Network Debugging
**API Request Monitoring:**
- Use browser dev tools Network tab
- Monitor Supabase API calls
- Validate request/response data
- Check authentication headers

### Performance Monitoring
**Development Performance Metrics:**
- Page load times (<3 seconds target)
- Form submission response (<2 seconds target)
- Search and filter operations (<1 second target)
- Memory usage monitoring (<50MB target)

## Database Development

### Local Database Setup (Optional)
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Initialize local project
supabase init

# Start local development
supabase start

# Generate types from schema
supabase gen types typescript --local > src/types/database.types.ts
```

### Schema Management
**Migration Files** (`/sql/migrations/`):
- Incremental schema changes
- Version-controlled database updates
- Rollback procedures for changes
- Production deployment scripts

**Development Queries** (`/sql/queries/`):
- Common data retrieval patterns
- Performance optimization examples
- Analytics and reporting queries
- Data maintenance procedures

## Troubleshooting

### Common Issues

**1. Node.js Version Mismatch**
```bash
# Check Node version (should be 18+)
node --version

# Install correct version using nvm
nvm install 18
nvm use 18
```

**2. Port Already in Use**
```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or specify different port
npm run dev -- --port 3000
```

**3. TypeScript Errors**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run type-check

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

**4. Test Failures**
```bash
# Install Playwright browsers
npx playwright install

# Run tests in headed mode for debugging
npx playwright test --headed

# Run specific test with debug info
npx playwright test tests/specific-test.spec.ts --debug
```

### Environment Issues

**Demo Mode Not Working:**
- Verify `VITE_` prefix for environment variables
- Check console for configuration warnings
- Ensure `.env` file is in project root
- Restart development server after changes

**Database Connection Issues:**
- Verify Supabase URL and key format
- Check project status in Supabase dashboard
- Validate RLS policies are not blocking access
- Test connection with simple API call

## Performance Optimization

### Development Performance
**Build Performance:**
- Enable Vite's dependency pre-bundling
- Use proper ES modules for tree shaking
- Optimize image assets and reduce bundle size
- Leverage browser caching strategies

**Runtime Performance:**
- Implement proper component lazy loading
- Use computed properties for expensive calculations
- Optimize reactive state management
- Monitor memory usage during development

### Production Considerations
**Deployment Preparation:**
- Run production build locally: `npm run build`
- Test with production environment variables
- Validate all functionality in preview mode
- Check performance with production data volumes

## Security Best Practices

### Development Security
- Never commit sensitive credentials to repository
- Use environment variables for all configuration
- Validate all user inputs in forms
- Implement proper error handling without exposing internals

### Authentication Development
- Test authentication flows thoroughly
- Validate session management
- Check token refresh behavior
- Ensure proper logout functionality

## Contributing Guidelines

### Code Standards
- Follow existing patterns and conventions
- Maintain consistent formatting with Prettier
- Write descriptive commit messages
- Include tests for new functionality

### Documentation Requirements
- Update inline code comments for complex logic
- Document API changes in relevant files
- Update user-facing documentation as needed
- Include setup instructions for new features