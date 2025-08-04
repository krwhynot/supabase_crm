# Principal Activity Tracking - Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide covers common issues, diagnostic procedures, and maintenance tasks for the Principal Activity Tracking system. It's designed for developers, system administrators, and support personnel.

## System Health Monitoring

### Key Performance Indicators (KPIs)

Monitor these metrics to ensure optimal system performance:

#### Database Performance
- **Materialized View Refresh Time**: Should complete in <2 seconds
- **Query Response Time**: All analytics queries should complete in <500ms
- **Index Usage**: Verify proper index utilization in query plans
- **Connection Pool Health**: Monitor active/idle connection ratios

#### Frontend Performance
- **Route Navigation Time**: Should complete in <200ms
- **Component Render Time**: Should complete in <100ms for typical datasets
- **API Response Time**: Should receive data in <500ms
- **Memory Usage**: Should stay under 50MB for full dashboard

#### User Experience Metrics
- **Page Load Time**: <3 seconds on 3G networks
- **Error Rate**: <1% of user interactions should result in errors
- **Session Duration**: Track user engagement with principal views
- **Feature Adoption**: Monitor usage of different principal views

### Health Check Endpoints

Use these queries and endpoints to monitor system health:

```sql
-- Check materialized view status
SELECT 
    schemaname, 
    matviewname, 
    ispopulated,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews 
WHERE matviewname = 'principal_activity_summary';

-- Monitor query performance
SELECT 
    substring(query, 1, 100) as query_start,
    mean_exec_time,
    calls,
    total_exec_time
FROM pg_stat_statements 
WHERE query LIKE '%principal_activity%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check trigger function health
SELECT 
    funcname,
    calls,
    total_time,
    mean_time
FROM pg_stat_user_functions 
WHERE funcname LIKE '%principal%'
ORDER BY calls DESC;
```

## Common Issues and Solutions

### Database Issues

#### Issue 1: Slow Query Performance

**Symptoms:**
- Principal dashboard loads slowly (>5 seconds)
- Analytics views timeout
- High CPU usage on database server

**Diagnostic Steps:**
```sql
-- Check query execution plans
EXPLAIN ANALYZE 
SELECT * FROM principal_activity_summary 
WHERE engagement_score > 50 
  AND activity_status = 'ACTIVE';

-- Check index usage
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'principal_activity_summary';

-- Monitor active queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start as duration,
    query
FROM pg_stat_activity
WHERE query LIKE '%principal%'
  AND state = 'active';
```

**Solutions:**
1. **Refresh Materialized Views:**
   ```sql
   SELECT public.refresh_principal_activity_summary();
   ```

2. **Check Index Health:**
   ```sql
   REINDEX INDEX CONCURRENTLY idx_principal_activity_summary_status_engagement;
   ```

3. **Vacuum and Analyze:**
   ```sql
   VACUUM ANALYZE principal_activity_summary;
   ```

#### Issue 2: Data Inconsistency

**Symptoms:**
- Principal data doesn't match source tables
- Missing or outdated metrics
- Incorrect engagement scores

**Diagnostic Steps:**
```sql
-- Compare counts between source and materialized view
SELECT 
    'organizations' as source,
    COUNT(*) as count
FROM organizations 
WHERE is_principal = TRUE AND deleted_at IS NULL
UNION ALL
SELECT 
    'materialized_view' as source,
    COUNT(*) as count
FROM principal_activity_summary;

-- Check trigger execution
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%principal%';

-- Check for failed refresh attempts
SELECT * FROM pg_stat_user_functions 
WHERE funcname = 'refresh_principal_activity_summary';
```

**Solutions:**
1. **Force Refresh:**
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY principal_activity_summary;
   ```

2. **Check Trigger Functions:**
   ```sql
   -- Verify trigger function exists and is working
   SELECT public.schedule_principal_activity_refresh();
   ```

3. **Manual Data Validation:**
   ```sql
   -- Validate specific principal data
   SELECT 
       p.id,
       p.name,
       pas.total_interactions,
       (SELECT COUNT(*) FROM interactions i 
        JOIN opportunities o ON o.id = i.opportunity_id 
        WHERE o.principal_id = p.id) as actual_interactions
   FROM organizations p
   LEFT JOIN principal_activity_summary pas ON pas.principal_id = p.id
   WHERE p.is_principal = TRUE
     AND p.deleted_at IS NULL
   LIMIT 10;
   ```

#### Issue 3: Materialized View Refresh Failures

**Symptoms:**
- Materialized view shows stale data
- Refresh function returns errors
- Performance degradation over time

**Diagnostic Steps:**
```sql
-- Check materialized view dependencies
SELECT 
    classid::regclass as relation,
    objid,
    objsubid,
    refclassid::regclass as referenced_relation,
    refobjid
FROM pg_depend 
WHERE refobjid = 'principal_activity_summary'::regclass::oid;

-- Check for blocking queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Solutions:**
1. **Drop and Recreate Materialized View:**
   ```sql
   DROP MATERIALIZED VIEW principal_activity_summary CASCADE;
   -- Re-run the schema creation script
   ```

2. **Refresh with Different Concurrency:**
   ```sql
   -- Try non-concurrent refresh if concurrent fails
   REFRESH MATERIALIZED VIEW principal_activity_summary;
   ```

3. **Check Disk Space:**
   ```sql
   SELECT 
       pg_database.datname,
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size
   FROM pg_database;
   ```

### Frontend Issues

#### Issue 4: Route Navigation Failures

**Symptoms:**
- Principal routes don't load
- Browser shows 404 errors
- Navigation menu not responsive

**Diagnostic Steps:**
1. **Check Browser Console:**
   - Look for JavaScript errors
   - Verify Vue Router is working
   - Check for module loading failures

2. **Network Tab Analysis:**
   - Verify API calls are successful
   - Check for CORS issues
   - Monitor response times

3. **Vue DevTools:**
   - Verify component mounting
   - Check route parameters
   - Monitor store state changes

**Solutions:**
1. **Clear Browser Cache:**
   ```bash
   # Hard refresh or clear application cache
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Verify Route Configuration:**
   ```typescript
   // Check router/index.ts for correct principal routes
   const routes = [
     {
       path: '/principals',
       name: 'PrincipalsList',
       component: () => import('@/views/principals/PrincipalsListView.vue')
     }
     // ... other routes
   ];
   ```

3. **Component Loading Issues:**
   ```typescript
   // Verify component imports are correct
   import PrincipalsListView from '@/views/principals/PrincipalsListView.vue';
   ```

#### Issue 5: API Connection Problems

**Symptoms:**
- Principal data doesn't load
- Infinite loading states
- API errors in console

**Diagnostic Steps:**
1. **Check Supabase Connection:**
   ```typescript
   // Test basic connectivity
   const { data, error } = await supabase
     .from('organizations')
     .select('id, name')
     .limit(1);
   
   console.log('Connection test:', { data, error });
   ```

2. **Verify API Service:**
   ```typescript
   // Test principal API directly
   import { PrincipalActivityApi } from '@/services/principalActivityApi';
   
   const result = await PrincipalActivityApi.getPrincipalActivitySummary();
   console.log('API test:', result);
   ```

3. **Check Environment Variables:**
   ```bash
   # Verify Supabase configuration
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

**Solutions:**
1. **Verify Supabase Configuration:**
   ```env
   # .env file
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Check RLS Policies:**
   ```sql
   -- Verify principal views have proper RLS policies
   SELECT 
       schemaname,
       tablename,
       policyname,
       cmd,
       qual
   FROM pg_policies 
   WHERE tablename LIKE '%principal%';
   ```

3. **Test API Endpoints:**
   ```bash
   # Test Supabase connection directly
   curl -H "apikey: YOUR_ANON_KEY" \
        -H "Authorization: Bearer YOUR_ANON_KEY" \
        "YOUR_SUPABASE_URL/rest/v1/principal_activity_summary?select=*&limit=1"
   ```

#### Issue 6: Component Rendering Problems

**Symptoms:**
- Components don't display correctly
- Data shows but UI is broken
- Layout issues on mobile devices

**Diagnostic Steps:**
1. **Check Component Props:**
   ```vue
   <!-- Verify props are being passed correctly -->
   <PrincipalKPICards 
     :principal-data="principalData"
     :loading="isLoading"
   />
   ```

2. **Verify Component State:**
   ```typescript
   // Check reactive data
   console.log('Principal data:', toRaw(principalData.value));
   console.log('Loading state:', isLoading.value);
   ```

3. **CSS/Styling Issues:**
   - Check for conflicting CSS rules
   - Verify Tailwind classes are applied
   - Test responsive breakpoints

**Solutions:**
1. **Component Debugging:**
   ```vue
   <template>
     <div>
       <!-- Add debug information -->
       <pre>{{ JSON.stringify(principalData, null, 2) }}</pre>
       <PrincipalKPICards 
         :principal-data="principalData"
         :loading="isLoading"
       />
     </div>
   </template>
   ```

2. **Prop Validation:**
   ```typescript
   // Add prop validation to components
   defineProps<{
     principalData: PrincipalActivitySummary | null;
     loading: boolean;
   }>();
   ```

3. **Error Boundaries:**
   ```vue
   <!-- Add error handling to components -->
   <template>
     <div v-if="error" class="error-state">
       {{ error }}
     </div>
     <div v-else-if="loading" class="loading-state">
       Loading...
     </div>
     <div v-else>
       <!-- Normal content -->
     </div>
   </template>
   ```

## Performance Optimization

### Database Optimization

#### Materialized View Management

**Optimal Refresh Schedule:**
```sql
-- Create a cron job for regular refreshes
-- Run every 15 minutes during business hours
SELECT cron.schedule('refresh-principal-activity', '*/15 6-20 * * *', 
  'SELECT public.refresh_principal_activity_summary();');
```

**Manual Performance Tuning:**
```sql
-- Analyze table statistics
ANALYZE principal_activity_summary;

-- Check fragmentation
SELECT 
  schemaname,
  tablename,
  n_dead_tup,
  n_live_tup,
  round(n_dead_tup * 100.0 / (n_live_tup + n_dead_tup), 2) as dead_ratio
FROM pg_stat_user_tables 
WHERE tablename = 'principal_activity_summary';

-- Vacuum if needed (>10% dead tuples)
VACUUM ANALYZE principal_activity_summary;
```

#### Index Optimization

**Monitor Index Usage:**
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename LIKE '%principal%'
ORDER BY idx_scan DESC;
```

**Identify Missing Indexes:**
```sql
-- Find queries that might benefit from additional indexes
SELECT 
  query,
  calls,
  mean_exec_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%principal%'
  AND mean_exec_time > 100
ORDER BY mean_exec_time * calls DESC;
```

### Frontend Optimization

#### Bundle Size Optimization

**Analyze Bundle Size:**
```bash
# Build with analysis
npm run build -- --analyze

# Check component sizes
npx webpack-bundle-analyzer dist/static/js/*.js
```

**Code Splitting:**
```typescript
// Ensure proper code splitting for principal components
const PrincipalsListView = defineAsyncComponent(() =>
  import('@/views/principals/PrincipalsListView.vue')
);
```

#### Memory Management

**Monitor Memory Usage:**
```javascript
// Add to components for debugging
onMounted(() => {
  console.log('Memory usage:', performance.memory);
});

onUnmounted(() => {
  console.log('Memory after cleanup:', performance.memory);
});
```

**Optimize Data Fetching:**
```typescript
// Use AbortController for request cancellation
const abortController = new AbortController();

onUnmounted(() => {
  abortController.abort();
});

// Use in API calls
const { data, error } = await supabase
  .from('principal_activity_summary')
  .select('*')
  .abortSignal(abortController.signal);
```

## Maintenance Procedures

### Daily Maintenance

1. **Monitor System Health:**
   ```sql
   SELECT public.get_principal_activity_stats();
   ```

2. **Check for Errors:**
   ```bash
   # Check application logs
   tail -f /var/log/application.log | grep -i error
   
   # Check database logs
   tail -f /var/log/postgresql/postgresql.log | grep -i error
   ```

3. **Verify Data Freshness:**
   ```sql
   SELECT 
     principal_name,
     summary_generated_at,
     now() - summary_generated_at as age
   FROM principal_activity_summary
   ORDER BY summary_generated_at ASC
   LIMIT 5;
   ```

### Weekly Maintenance

1. **Performance Review:**
   ```sql
   -- Review slow queries
   SELECT 
     query,
     calls,
     mean_exec_time,
     total_exec_time
   FROM pg_stat_statements 
   WHERE query LIKE '%principal%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Index Maintenance:**
   ```sql
   -- Check index bloat
   SELECT 
     schemaname,
     tablename,
     indexname,
     pg_size_pretty(pg_relation_size(indexrelid)) as index_size
   FROM pg_stat_user_indexes 
   WHERE tablename LIKE '%principal%'
   ORDER BY pg_relation_size(indexrelid) DESC;
   ```

3. **Data Cleanup:**
   ```sql
   -- Clean up old timeline entries (optional)
   DELETE FROM principal_timeline_summary 
   WHERE activity_date < NOW() - INTERVAL '2 years'
     AND activity_type = 'CONTACT_UPDATE';
   ```

### Monthly Maintenance

1. **Full System Analysis:**
   ```sql
   -- Generate comprehensive statistics
   SELECT 
     'Total Principals' as metric,
     COUNT(*)::text as value
   FROM principal_activity_summary
   UNION ALL
   SELECT 
     'Average Engagement Score',
     ROUND(AVG(engagement_score), 2)::text
   FROM principal_activity_summary
   UNION ALL
   SELECT 
     'Active Principals',
     COUNT(*)::text
   FROM principal_activity_summary
   WHERE activity_status = 'ACTIVE';
   ```

2. **Archive Old Data:**
   ```sql
   -- Archive inactive principals (optional)
   CREATE TABLE IF NOT EXISTS principal_activity_archive AS
   SELECT * FROM principal_activity_summary
   WHERE activity_status = 'NO_ACTIVITY'
     AND last_activity_date < NOW() - INTERVAL '6 months';
   ```

3. **Update Documentation:**
   - Review and update troubleshooting procedures
   - Document any new issues and solutions
   - Update performance benchmarks

## Emergency Procedures

### System Outage Response

1. **Immediate Actions:**
   ```bash
   # Check system status
   curl -f https://your-app.com/principals || echo "App down"
   
   # Check database connectivity
   psql -h your-db-host -U your-user -d your-db -c "SELECT 1;"
   ```

2. **Service Recovery:**
   ```bash
   # Restart application services
   sudo systemctl restart nginx
   sudo systemctl restart your-app-service
   
   # Check service status
   sudo systemctl status nginx
   sudo systemctl status your-app-service
   ```

3. **Data Recovery:**
   ```sql
   -- Emergency materialized view refresh
   REFRESH MATERIALIZED VIEW principal_activity_summary;
   
   -- Check data integrity
   SELECT COUNT(*) FROM principal_activity_summary;
   ```

### Data Corruption Recovery

1. **Assess Damage:**
   ```sql
   -- Check for data anomalies
   SELECT 
     principal_name,
     engagement_score,
     total_interactions,
     last_activity_date
   FROM principal_activity_summary
   WHERE engagement_score > 100 
      OR engagement_score < 0
      OR total_interactions < 0;
   ```

2. **Restore from Backup:**
   ```bash
   # Restore database from backup
   pg_restore -h localhost -U postgres -d your_db backup_file.sql
   
   # Or restore specific tables
   pg_restore -h localhost -U postgres -d your_db -t principal_activity_summary backup_file.sql
   ```

3. **Rebuild Materialized View:**
   ```sql
   -- Drop and recreate if corrupted
   DROP MATERIALIZED VIEW IF EXISTS principal_activity_summary CASCADE;
   -- Re-run schema creation script
   \i sql/36_principal_activity_schema.sql
   ```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Database Metrics:**
   - Query response times
   - Connection pool usage
   - Materialized view refresh status
   - Index usage statistics

2. **Application Metrics:**
   - Route navigation times
   - API response times
   - Error rates
   - User session data

3. **Infrastructure Metrics:**
   - CPU usage
   - Memory consumption
   - Disk I/O
   - Network latency

### Alerting Thresholds

**Critical Alerts:**
- Database connection failures
- Query times > 5 seconds
- Error rates > 5%
- System downtime

**Warning Alerts:**
- Query times > 1 second
- Error rates > 1%
- Memory usage > 80%
- Disk usage > 85%

### Monitoring Tools Setup

**Database Monitoring:**
```sql
-- Create monitoring views
CREATE OR REPLACE VIEW principal_system_health AS
SELECT 
  'materialized_view_age' as metric,
  EXTRACT(EPOCH FROM (NOW() - MAX(summary_generated_at)))/3600 as hours_old
FROM principal_activity_summary
UNION ALL
SELECT 
  'total_principals',
  COUNT(*)
FROM principal_activity_summary;
```

**Application Monitoring:**
```typescript
// Add to Vue app for client-side monitoring
app.config.globalProperties.$trackError = (error: Error, context: string) => {
  console.error('Principal System Error:', error, context);
  // Send to monitoring service
};
```

## Support and Escalation

### Support Contact Information

- **Level 1 Support**: System administrators and support staff
- **Level 2 Support**: Development team and database administrators
- **Level 3 Support**: System architects and Supabase experts

### Escalation Procedures

1. **Performance Issues**: Escalate after 30 minutes if not resolved
2. **Data Corruption**: Immediate escalation to Level 2
3. **System Outage**: Immediate escalation to Level 3
4. **Security Issues**: Immediate escalation to security team

### Documentation Requirements

When escalating issues, provide:
- Error messages and stack traces
- System configuration details
- Steps to reproduce the issue
- Impact assessment
- Attempted solutions

This comprehensive troubleshooting guide should help maintain optimal performance and quickly resolve issues in the Principal Activity Tracking system.