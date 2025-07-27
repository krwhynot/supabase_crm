# 🚨 URGENT: Vercel Environment Variables Setup

## CRITICAL ISSUE
Production site https://crm.kjrcloud.com/ is failing with 401 errors because environment variables are NOT configured in Vercel.

## IMMEDIATE ACTIONS REQUIRED

### Step 1: Manual Vercel Dashboard Setup (REQUIRED)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project (likely named `supabase_crm`)
3. Click on **Settings** → **Environment Variables**
4. Add these EXACT variables:

```
Variable Name: VITE_SUPABASE_URL
Value: https://jzxxwptgsyzhdtulrdjy.supabase.co
Environment: Production
```

```
Variable Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eHh3cHRnc3l6aGR0dWxyZGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDYyNzEsImV4cCI6MjA2OTEyMjI3MX0.X9eZUb_hM2g0pDTHYRbfxjKbrHeRbzYxWsWLrorEzRU
Environment: Production
```

### Step 2: Alternative CLI Setup (if you have Vercel token)
```bash
# If you have VERCEL_TOKEN set:
vercel env add VITE_SUPABASE_URL production --token=$VERCEL_TOKEN
# Enter: https://jzxxwptgsyzhdtulrdjy.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production --token=$VERCEL_TOKEN  
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eHh3cHRnc3l6aGR0dWxyZGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDYyNzEsImV4cCI6MjA2OTEyMjI3MX0.X9eZUb_hM2g0pDTHYRbfxjKbrHeRbzYxWsWLrorEzRU
```

### Step 3: Trigger Redeployment
After adding variables, the deployment will be triggered automatically by the next Git push.

## Verification
Once variables are set, test at: https://crm.kjrcloud.com/

**Expected Result:** Form submissions should work without 401 errors.