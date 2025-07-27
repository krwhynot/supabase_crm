# Production Deployment Guide

Complete workflow for deploying Contact Management MVP to Vercel production.

## Overview

This guide covers the complete deployment process from development to production, including troubleshooting common issues and best practices.

## Prerequisites

- Git repository connected to Vercel
- Vercel CLI installed: `npm i -g vercel`
- Environment variables configured
- Local build testing completed

## 1. Standard Deployment Workflow

### Method A: Automatic Git Deployment (Recommended)

```bash
# 1. Ensure you're on main branch
git checkout main

# 2. Merge feature branch
git merge feature/your-feature-branch

# 3. Push to trigger automatic deployment
git push origin main
```

**Vercel automatically:**
- Detects the push to main branch
- Runs build process (`npm run build`)
- Deploys to production URL
- Updates CDN cache

### Method B: Vercel CLI Direct Deploy

```bash
# 1. Install Vercel CLI (if not installed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod
```

### Method C: Force Redeploy

When automatic deployment fails or doesn't trigger:

```bash
# Option 1: Empty commit to force trigger
git commit --allow-empty -m "Force redeploy"
git push origin main

# Option 2: Vercel Dashboard
# Go to vercel.com > Project > Deployments > Click "Redeploy"
```

## 2. Vercel Project Configuration

### Build Settings (vercel.json)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build:prod",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "env": {
    "VITE_SUPABASE_URL": "@vite-supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@vite-supabase-anon-key"
  },
  "build": {
    "env": {
      "VITE_SUPABASE_URL": "@vite-supabase-url",
      "VITE_SUPABASE_ANON_KEY": "@vite-supabase-anon-key"
    }
  }
}
```

### Environment Variables (Vercel Dashboard)

Navigate to: **Vercel Dashboard > Project > Settings > Environment Variables**

Add these variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_ENV=production
```

## 3. Pre-Deployment Checklist

### Local Build Testing
```bash
# 1. Install dependencies
npm ci

# 2. Type checking
npm run type-check

# 3. Linting
npm run lint

# 4. Build verification
npm run build

# 5. Preview build locally
npm run preview
```

### Code Quality Gates
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no errors
- ✅ All routes accessible
- ✅ Database connections working
- ✅ Environment variables configured

## 4. Deployment Monitoring

### Verify Deployment Success

```bash
# Check deployment status
curl -I https://your-domain.com

# Expected response
HTTP/2 200
```

### Test Critical Paths
1. **Home Page**: `https://your-domain.com/`
2. **Contacts List**: `https://your-domain.com/contacts`
3. **New Contact**: `https://your-domain.com/contacts/new`
4. **Contact Detail**: `https://your-domain.com/contacts/[id]`

### Browser Testing
```javascript
// Test in browser console
console.log('App Version:', window.location.href)
console.log('Build Time:', document.querySelector('meta[name="build-time"]')?.content)
```

## 5. Troubleshooting Common Issues

### Issue 1: Deployment Not Updating

**Symptoms**: Old version still showing after push

**Solutions**:
```bash
# A. Clear cache and redeploy
git commit --allow-empty -m "Force cache refresh"
git push origin main

# B. Check Vercel logs
vercel logs --prod

# C. Manual redeploy via CLI
vercel --prod --force
```

### Issue 2: Build Failures

**Symptoms**: Deployment fails during build

**Debug Steps**:
```bash
# 1. Test build locally
npm run build

# 2. Check environment variables
vercel env ls

# 3. View build logs
vercel logs
```

**Common Fixes**:
- Update Node.js version in Vercel settings
- Fix TypeScript errors
- Configure missing environment variables

### Issue 3: Runtime Errors

**Symptoms**: App loads but features don't work

**Debug Steps**:
1. Check browser console for JavaScript errors
2. Verify API endpoints are accessible
3. Test database connections
4. Check environment variable values

### Issue 4: 404 Errors for Routes (SPA Routing Issues) - RESOLVED ✅

**Symptoms**: SPA routes return 404 (e.g., `/contacts` shows "404: NOT_FOUND")

**Example Error**: 
```
404: NOT_FOUND
Code: NOT_FOUND
ID: cle1::4dk8x-1753656047861-b25c13a1e380contacts:1
GET https://crm.kjrcloud.com/contacts 404 (Not Found)
```

**Root Cause**: Vercel doesn't know how to handle Vue Router client-side routes and serves static files directly

**Solution**: Add SPA rewrites to `vercel.json`:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Implementation Steps**:
1. Update `vercel.json` with rewrites configuration
2. Commit and push changes to trigger new deployment:
   ```bash
   git add vercel.json
   git commit -m "fix: add SPA routing configuration for Vercel"
   git push origin main
   ```
3. Wait for deployment (typically 30-60 seconds)
4. Test routes return `HTTP/2 200` status

**Verification**: 
```bash
# Test the fix worked
curl -I https://crm.kjrcloud.com/contacts
# Should return: HTTP/2 200 (not 404)
# Content-Type: text/html (serving index.html)
```

**Why this works**: 
- All requests get redirected to `index.html`
- Vue Router takes over and handles client-side routing
- Based on official Vue Router documentation for Vercel
- Preserves SEO and direct URL access functionality

### Issue 5: Environment Variables Not Working

**Symptoms**: `undefined` values in production or build failures like "Environment Variable 'VITE_SUPABASE_URL' references Secret 'vite-supabase-url', which does not exist"

**Root Cause**: Environment variables not configured in Vercel Dashboard

**Solution**:
```bash
# 1. Remove invalid references from vercel.json
# Don't use: "env": { "VITE_SUPABASE_URL": "@vite-supabase-url" }

# 2. Configure in Vercel Dashboard instead:
# Go to Project Settings → Environment Variables
# Add each variable manually:
```

**Required Variables for Vite Projects**:
- **Name**: `VITE_SUPABASE_URL` 
- **Value**: `https://your-project.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `your-anon-key`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**Important**: 
- Vite requires `VITE_` prefix for client-side variables
- Must redeploy after adding environment variables
- Variables are encrypted at rest in Vercel

### Issue 6: Automatic Git Deployments Not Triggering

**Symptoms**: Code pushed to main branch but no deployment appears in Vercel

**Debug Steps**:
1. Check Vercel Dashboard → Project → Settings → Git
2. Verify repository connection is active
3. Check GitHub webhooks in repo settings
4. Look for failed deployments in Vercel logs

**Solutions**:
```bash
# A. Force trigger with empty commit
git commit --allow-empty -m "trigger: Force Vercel deployment"
git push origin main

# B. Manual redeploy via Vercel Dashboard
# Go to Deployments → Click "Redeploy" on latest commit

# C. Check integration permissions
# Ensure Vercel has access to the repository
```

## 6. Best Practices

### Git Workflow
```bash
# 1. Feature development
git checkout -b feature/new-feature
# ... develop feature ...
git commit -m "feat: implement new feature"

# 2. Testing and review
git checkout main
git pull origin main
git merge feature/new-feature

# 3. Production deployment
git push origin main
```

### Version Management
```bash
# Tag releases for rollback capability
git tag -a v1.0.0 -m "Contact Management MVP"
git push origin v1.0.0
```

### Monitoring
- Set up Vercel monitoring alerts
- Monitor Core Web Vitals
- Track deployment frequency
- Monitor error rates

## 7. Rollback Procedures

### Immediate Rollback
```bash
# Option 1: Revert last commit
git revert HEAD
git push origin main

# Option 2: Redeploy previous version via Vercel dashboard
# Go to Deployments > Select previous deployment > Promote to Production
```

### Planned Rollback
```bash
# Deploy specific tag/commit
git checkout v1.0.0
vercel --prod
```

## 8. Performance Optimization

### Build Optimization
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})
```

### CDN Configuration
- Enable Vercel Edge Network
- Configure cache headers
- Optimize image delivery
- Implement service worker caching

## 9. Security Considerations

### Environment Variables
- Never commit `.env` files
- Use Vercel environment variables for secrets
- Rotate API keys regularly
- Use different keys for production/development

### Database Security
```sql
-- Ensure RLS policies are enabled
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Verify production policies
SELECT * FROM pg_policies WHERE tablename = 'contacts';
```

## 10. Monitoring and Maintenance

### Health Checks
```bash
# Automated health check script
#!/bin/bash
curl -f https://your-domain.com/contacts > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Site is up"
else
  echo "❌ Site is down"
fi
```

### Performance Monitoring
- Vercel Analytics
- Core Web Vitals tracking
- Error monitoring (Sentry)
- Uptime monitoring

## 11. Emergency Procedures

### Site Down
1. Check Vercel status page
2. Review recent deployments
3. Rollback to last known good version
4. Investigate and fix issue
5. Redeploy fix

### Database Issues
1. Check Supabase dashboard
2. Verify connection strings
3. Test database connectivity
4. Review RLS policies
5. Check environment variables

## Summary

This deployment workflow ensures:
- ✅ Reliable automated deployments
- ✅ Quick rollback capabilities
- ✅ Comprehensive monitoring
- ✅ Performance optimization
- ✅ Security best practices
- ✅ Emergency procedures

For the Contact Management MVP:
- **Production URL**: https://crm.kjrcloud.com
- **Repository**: Connected to main branch
- **Build Command**: `npm run build`
- **Framework**: Vue 3 + Vite + TypeScript

## Next Steps

1. Set up monitoring alerts
2. Configure automated testing pipeline
3. Implement staged deployments (preview → production)
4. Add performance monitoring
5. Set up backup and disaster recovery procedures