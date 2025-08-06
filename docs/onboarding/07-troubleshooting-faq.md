# Troubleshooting and FAQ

This comprehensive guide addresses common issues, provides solutions, and answers frequently asked questions for developing and maintaining our CRM system.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Environment Setup Issues](#environment-setup-issues)
- [Development Server Problems](#development-server-problems)
- [Database Connection Issues](#database-connection-issues)
- [Authentication and Permissions](#authentication-and-permissions)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Testing Framework Problems](#testing-framework-problems)
- [Performance Issues](#performance-issues)
- [Common Error Messages](#common-error-messages)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Getting Help](#getting-help)

## Quick Reference

### Emergency Commands

```bash
# Quick fixes for common issues
npm run lint --fix          # Fix code formatting issues
npm run type-check          # Check TypeScript errors
rm -rf node_modules && npm install  # Reset dependencies
npm cache clean --force     # Clear npm cache
git stash && git pull       # Save changes and update

# Development server restart
pkill -f "vite"            # Kill existing server
npm run dev                # Start fresh server

# Database reset (development)
supabase db reset --local  # Reset local database
supabase db push           # Apply migrations
```

### Health Check Commands

```bash
# System health checks
node --version             # Check Node.js version
npm --version             # Check npm version
git --version             # Check Git version
supabase --version        # Check Supabase CLI

# Project health
npm run type-check        # TypeScript health
npm run lint             # Code quality health
npm test                 # Test suite health
npm run build           # Build health
```

### Diagnostic Commands

```bash
# Environment diagnostics
echo $NODE_ENV            # Check environment
env | grep VITE          # Check environment variables
npm ls                   # Check installed packages
which node              # Check Node.js location
```

## Environment Setup Issues

### Node.js Version Issues

**Problem**: Wrong Node.js version causing build failures
```bash
Error: The engine "node" is incompatible with this module
```

**Solution**:
```bash
# Check current version
node --version

# Install correct version (check .nvmrc)
nvm install 20.11.0
nvm use 20.11.0
nvm alias default 20.11.0

# Verify version
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Permission Errors

**Problem**: Permission denied errors during installation
```bash
EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution**:
```bash
# Option 1: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use npx for global commands
npx create-vue@latest my-project
```

### Git Configuration Issues

**Problem**: Git operations failing due to configuration
```bash
fatal: unable to access 'https://github.com/...': SSL certificate problem
```

**Solution**:
```bash
# Configure Git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Fix SSL issues
git config --global http.sslverify false  # Temporary fix
# OR configure certificates properly
git config --global http.sslcert /path/to/certificate

# SSH key setup (preferred)
ssh-keygen -t ed25519 -C "your.email@example.com"
cat ~/.ssh/id_ed25519.pub  # Add to GitHub
```

## Development Server Problems

### Port Already in Use

**Problem**: Development server fails to start
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9
# OR
npx kill-port 3000

# Use different port
npm run dev -- --port 3001

# Set default port in vite.config.ts
export default defineConfig({
  server: {
    port: 3001
  }
})
```

### Hot Reload Not Working

**Problem**: Changes not reflecting in browser during development

**Solution**:
```bash
# Clear browser cache
# Chrome: Ctrl+Shift+R (hard refresh)
# Firefox: Ctrl+F5

# Check Vite configuration
# vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true  // For WSL/Docker
    }
  }
})

# Restart development server
npm run dev
```

### Module Resolution Errors

**Problem**: Cannot resolve module imports
```bash
Failed to resolve import "./components/MyComponent.vue"
```

**Solution**:
```bash
# Check file exists and path is correct
ls src/components/MyComponent.vue

# Check TypeScript paths in tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

# Check Vite alias configuration
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
```

## Database Connection Issues

### Supabase Connection Failures

**Problem**: Cannot connect to Supabase database
```bash
Error: Invalid API key
```

**Solution**:
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify .env file exists and is loaded
cat .env

# Test connection manually
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "YOUR_SUPABASE_URL/rest/v1/contacts?select=id&limit=1"

# Check Supabase project status
supabase projects list
supabase projects api-keys --project-ref YOUR_PROJECT_REF
```

### Local Database Issues

**Problem**: Local Supabase instance not working
```bash
Error: Docker is not running
```

**Solution**:
```bash
# Start Docker Desktop
# On Windows: Start Docker Desktop application
# On macOS: Start Docker Desktop application
# On Linux: 
sudo systemctl start docker

# Check Docker status
docker --version
docker ps

# Start Supabase locally
supabase start

# Reset local database if corrupted
supabase stop
supabase db reset --local
supabase start
```

### Migration Errors

**Problem**: Database migration failures
```bash
Error: relation "contacts" already exists
```

**Solution**:
```bash
# Check migration status
supabase migration list

# Reset and reapply migrations
supabase db reset --local
supabase db push --local

# Fix migration conflicts
supabase migration repair 20231201000000 --status applied

# Create new migration for fixes
supabase migration new fix_contacts_table
```

## Authentication and Permissions

### Authentication Errors

**Problem**: User authentication failing
```bash
Error: Invalid login credentials
```

**Solution**:
```javascript
// Check authentication flow
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

if (error) {
  console.error('Auth error:', error.message);
  // Handle specific error cases
  switch (error.message) {
    case 'Invalid login credentials':
      showError('Invalid email or password');
      break;
    case 'Email not confirmed':
      showError('Please check your email and confirm your account');
      break;
    case 'Too many requests':
      showError('Too many login attempts. Please wait before trying again');
      break;
  }
}

// Check user session
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

### Permission Denied Errors

**Problem**: Database operations failing due to RLS policies
```bash
Error: new row violates row-level security policy
```

**Solution**:
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'contacts';

-- Test policy conditions
SELECT auth.uid(), auth.role();

-- Temporarily disable RLS for debugging (development only)
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable: ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create or fix policy
CREATE POLICY "Users can access own data" ON contacts
  FOR ALL USING (user_id = auth.uid());
```

### Session Management Issues

**Problem**: User sessions expiring unexpectedly

**Solution**:
```javascript
// Set up session refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    console.log('Auth state changed:', event);
  }
});

// Manual session refresh
const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error('Session refresh failed:', error);
    // Redirect to login
    window.location.href = '/login';
  }
};

// Check and refresh session periodically
setInterval(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.expires_at * 1000 - Date.now() < 60000) {
    await refreshSession();
  }
}, 30000); // Check every 30 seconds
```

## Build and Deployment Issues

### TypeScript Compilation Errors

**Problem**: Build failing due to TypeScript errors
```bash
src/components/MyComponent.vue:25:5 - error TS2322
```

**Solution**:
```bash
# Run type checking to see all errors
npm run type-check

# Fix common issues:
# 1. Missing type imports
import type { Contact } from '@/types/contact';

# 2. Incorrect prop types
interface Props {
  contacts: Contact[];  // Make sure Contact type is imported
}

# 3. Missing type annotations
const handleClick = (event: MouseEvent): void => {
  // ...
};

# 4. Update tsconfig.json if needed
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true  // Skip type checking of declaration files
  }
}
```

### Build Size Issues

**Problem**: Bundle size too large affecting performance

**Solution**:
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for large dependencies
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/assets

# Optimize imports
# Bad: import _ from 'lodash';
# Good: import { debounce } from 'lodash-es';

# Lazy load components
const LazyComponent = defineAsyncComponent(() => 
  import('./components/HeavyComponent.vue')
);

# Configure Vite for better tree shaking
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue']
        }
      }
    }
  }
});
```

### Deployment Failures

**Problem**: Vercel deployment failing
```bash
Error: Command "npm run build" exited with 1
```

**Solution**:
```bash
# Test build locally first
npm run build
npm run preview

# Check environment variables in Vercel dashboard
# Make sure all VITE_ variables are set

# Check build logs in Vercel dashboard
# Look for specific error messages

# Common fixes:
# 1. Node.js version mismatch
echo "20.11.0" > .nvmrc

# 2. Missing dependencies
npm install --save-dev @types/node

# 3. Environment-specific code
if (typeof window !== 'undefined') {
  // Client-side only code
}
```

## Testing Framework Problems

### Playwright Installation Issues

**Problem**: Browser binaries not installing correctly
```bash
Error: Executable doesn't exist at /path/to/chromium
```

**Solution**:
```bash
# Install Playwright browsers
npx playwright install

# Install with dependencies
npx playwright install --with-deps

# Install specific browser
npx playwright install chromium

# Clear and reinstall
rm -rf ~/.cache/ms-playwright
npx playwright install

# Check installation
npx playwright --version
```

### Test Execution Failures

**Problem**: Tests failing due to timing issues
```bash
Error: Timeout 30000ms exceeded
```

**Solution**:
```javascript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  
  await page.goto('/contacts');
  await page.waitForLoadState('networkidle');
  
  // Use explicit waits
  await page.waitForSelector('[data-testid="contact-list"]', { 
    timeout: 10000 
  });
});

// Configure global timeouts in playwright.config.ts
export default defineConfig({
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  use: {
    actionTimeout: 10000,
    navigationTimeout: 30000
  }
});
```

### Headless Mode Issues

**Problem**: Tests work in headed mode but fail in headless
```bash
Error: Page crashed
```

**Solution**:
```javascript
// Debug with screenshots
test('failing test', async ({ page }) => {
  await page.screenshot({ path: 'debug-before.png' });
  
  // Perform action
  await page.click('[data-testid="submit-button"]');
  
  await page.screenshot({ path: 'debug-after.png' });
});

// Run with debugging
npx playwright test --debug
npx playwright test --headed

// Configure browser launch options
export default defineConfig({
  use: {
    headless: false, // For debugging
    slowMo: 1000,   // Slow down operations
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
```

## Performance Issues

### Slow Page Load Times

**Problem**: Application loading slowly in development/production

**Diagnosis**:
```bash
# Use Lighthouse for analysis
npm install -g lighthouse
lighthouse http://localhost:3000 --output=html

# Use browser dev tools
# Network tab: Check for large resources
# Performance tab: Analyze rendering performance
# Coverage tab: Check for unused code
```

**Solutions**:
```javascript
// Lazy load routes
const routes = [
  {
    path: '/contacts',
    component: () => import('@/views/ContactsView.vue')
  }
];

// Optimize images
// Use WebP format when possible
// Implement lazy loading for images

// Optimize bundle
// Use dynamic imports for large libraries
const heavyLibrary = await import('heavy-library');

// Implement virtual scrolling for large lists
import { RecycleScroller } from 'vue-virtual-scroller';
```

### Memory Leaks

**Problem**: Application memory usage growing over time

**Diagnosis**:
```javascript
// Monitor memory usage
if (performance.memory) {
  console.log('Memory usage:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
  });
}
```

**Solutions**:
```javascript
// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  clearInterval(intervalId);
});

// Clean up subscriptions
const unsubscribe = supabase
  .channel('contacts')
  .on('postgres_changes', { ... }, handleChange)
  .subscribe();

onUnmounted(() => {
  unsubscribe();
});

// Use WeakMap/WeakSet for caching
const cache = new WeakMap();
```

## Common Error Messages

### "Module not found" Errors

**Error**: `Cannot resolve module '@/components/MyComponent'`

**Cause**: Incorrect import path or missing alias configuration

**Fix**:
```javascript
// Check file exists
// Verify tsconfig.json paths
// Check vite.config.ts alias configuration

// Correct import format
import MyComponent from '@/components/MyComponent.vue';
```

### "Cannot access before initialization" Errors

**Error**: `ReferenceError: Cannot access 'variable' before initialization`

**Cause**: Circular dependency or hoisting issue

**Fix**:
```javascript
// Move initialization after dependencies
// Check for circular imports
// Use dynamic imports if needed

// Bad
export const store = useStore();

// Good
export const getStore = () => useStore();
```

### "Hydration mismatch" Errors

**Error**: `Hydration node mismatch`

**Cause**: Server-side and client-side rendering differences

**Fix**:
```vue
<template>
  <!-- Use ClientOnly for client-specific content -->
  <ClientOnly>
    <div>{{ new Date().toLocaleString() }}</div>
  </ClientOnly>
</template>
```

### Database Connection Errors

**Error**: `connection to server at "..." failed`

**Cause**: Network issues, wrong credentials, or service unavailable

**Fix**:
```bash
# Check network connectivity
ping your-project-ref.supabase.co

# Verify credentials
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_URL/rest/v1/"

# Check service status
# Visit Supabase status page or dashboard
```

## Frequently Asked Questions

### Development Environment

**Q: What Node.js version should I use?**
A: Use Node.js 18.x or 20.x as specified in `.nvmrc`. Use nvm to manage versions: `nvm use`

**Q: Can I use npm alternatives like yarn or pnpm?**
A: The project is configured for npm. While alternatives work, stick to npm for consistency and to avoid lock file conflicts.

**Q: How do I update dependencies safely?**
A: Use `npm outdated` to check, then `npm update` for minor updates. For major updates, test thoroughly and update one at a time.

### Database and Backend

**Q: How often should I run migrations?**
A: Run migrations whenever you pull changes that include new migration files. Use `supabase migration list` to check status.

**Q: Can I modify production data directly?**
A: Never modify production data directly. Use proper data migration scripts and test in staging first.

**Q: How do I backup local development data?**
A: Use `supabase db dump` to create backups and `supabase db reset` to restore clean state.

### Testing

**Q: Why are my tests flaky?**
A: Usually due to timing issues. Use proper waits, avoid hard-coded delays, and ensure test isolation.

**Q: How do I test database interactions?**
A: Use test database, mock Supabase calls, or use database transactions that rollback after tests.

**Q: Should I test third-party library integrations?**
A: Test your integration code, not the library itself. Mock external dependencies for unit tests.

### Performance

**Q: How can I optimize the application for mobile?**
A: Use responsive design, optimize images, implement lazy loading, and minimize JavaScript bundle size.

**Q: What's causing slow database queries?**
A: Check query execution plans, add appropriate indexes, optimize RLS policies, and use proper filtering.

**Q: How do I handle large datasets?**
A: Implement pagination, virtual scrolling, server-side filtering, and consider data archiving strategies.

### Security

**Q: How do I handle sensitive data in development?**
A: Use environment variables, never commit secrets, use dummy data for testing, and follow the security guide.

**Q: What should I do if I accidentally commit a secret?**
A: Immediately rotate the secret, use `git filter-branch` to remove from history, and notify the security team.

**Q: How do I report a security vulnerability?**
A: Report to the security team immediately through secure channels. Don't discuss publicly until resolved.

### Deployment

**Q: Why is my deployment failing on Vercel?**
A: Check build logs, verify environment variables, ensure dependencies are in package.json, and test build locally first.

**Q: How do I rollback a deployment?**
A: Use Vercel dashboard to redeploy previous version, or use Git to revert commits and redeploy.

**Q: Can I preview changes before deploying to production?**
A: Yes, Vercel creates preview deployments for all branches. Use these for testing before merging.

## Getting Help

### Self-Help Resources

1. **Check this documentation first**
2. **Search codebase for similar patterns**
3. **Review Git history for context**
4. **Use browser dev tools for debugging**
5. **Check official documentation for tools**

### Team Support

1. **Development Channel**: Ask technical questions
2. **Code Review**: Request pair programming session
3. **Office Hours**: Scheduled help sessions
4. **Documentation Updates**: Report gaps or issues

### External Resources

1. **Stack Overflow**: Community-driven solutions
2. **GitHub Issues**: For open-source tools
3. **Official Documentation**: Vue.js, Supabase, Playwright
4. **Discord/Slack Communities**: Real-time help

### Emergency Support

For critical issues affecting production:
1. **Immediate**: Contact team lead or on-call engineer
2. **Document**: Create incident report with details
3. **Communicate**: Update stakeholders on status
4. **Follow-up**: Conduct post-incident review

### Creating Good Bug Reports

When asking for help, include:
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (OS, browser, versions)
- **Error messages** (full stack traces)
- **Screenshots or recordings** if applicable
- **What you've already tried**

This troubleshooting guide should resolve most common issues. Keep it updated as new problems and solutions are discovered.