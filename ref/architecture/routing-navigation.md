# Routing & Navigation Architecture - Vue Router 4

## Overview

The Vue 3 CRM project implements a sophisticated routing system using Vue Router 4 with comprehensive navigation patterns, validation strategies, and accessibility features. The architecture demonstrates enterprise-level routing with security, performance optimization, and user experience considerations.

## Route Structure & Organization

### Hierarchical Route Architecture

The application uses a nested route structure with `DashboardLayout` as the master layout:

```typescript
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/layout/DashboardLayout.vue'),
    children: [
      // Dashboard (Default Route)
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
          description: 'Your CRM dashboard'
        }
      },
      
      // Contact Management Routes
      {
        path: 'contacts',
        name: 'ContactsList',
        component: () => import('@/views/contacts/ContactsListView.vue'),
        meta: {
          title: 'Contacts',
          description: 'Manage your professional contacts'
        }
      },
      {
        path: 'contacts/new',
        name: 'ContactCreate',
        component: () => import('@/views/contacts/ContactCreateView.vue'),
        meta: {
          title: 'New Contact',
          description: 'Add a new contact to your CRM'
        }
      },
      {
        path: 'contacts/:id',
        name: 'ContactDetail',
        component: () => import('@/views/contacts/ContactDetailView.vue'),
        props: true,
        meta: {
          title: 'Contact Details',
          description: 'View contact information'
        }
      },
      {
        path: 'contacts/:id/edit',
        name: 'ContactEdit',
        component: () => import('@/views/contacts/ContactEditView.vue'),
        props: true,
        meta: {
          title: 'Edit Contact',
          description: 'Modify contact information'
        }
      },
      
      // Organization Management Routes
      {
        path: 'organizations',
        name: 'OrganizationsList',
        component: () => import('@/views/organizations/OrganizationsListView.vue'),
        meta: {
          title: 'Organizations',
          description: 'Manage your business organizations'
        }
      },
      // ... additional organization routes
      
      // Opportunity Management Routes
      {
        path: 'opportunities',
        name: 'OpportunitiesList',
        component: () => import('@/views/opportunities/OpportunitiesListView.vue'),
        meta: {
          title: 'Opportunities',
          description: 'Manage your business opportunities'
        }
      },
      // ... additional opportunity routes
      
      // Principal Activity Routes
      {
        path: 'principals',
        name: 'PrincipalsList',
        component: () => import('@/views/principals/PrincipalsListView.vue'),
        meta: {
          title: 'Principals',
          description: 'Manage principal relationships and activities'
        }
      },
      {
        path: 'principals/dashboard',
        name: 'PrincipalDashboard',
        component: () => import('@/views/principals/PrincipalDashboardView.vue'),
        meta: {
          title: 'Principal Dashboard',
          description: 'Comprehensive principal activity analytics and insights'
        }
      },
      {
        path: 'principals/:id',
        name: 'PrincipalDetail',
        component: () => import('@/views/principals/PrincipalDetailView.vue'),
        props: true,
        meta: {
          title: 'Principal Details',
          description: 'View principal activity and performance'
        }
      },
      {
        path: 'principals/:id/analytics',
        name: 'PrincipalAnalytics',
        component: () => import('@/views/principals/PrincipalAnalyticsView.vue'),
        props: true,
        meta: {
          title: 'Principal Analytics',
          description: 'Comprehensive analytics and performance insights'
        }
      },
      
      // Interaction Tracking Routes
      {
        path: 'interactions',
        name: 'InteractionsList',
        component: () => import('@/views/interactions/InteractionsListView.vue'),
        meta: {
          title: 'Interactions',
          description: 'Track customer interactions and activities'
        }
      }
      // ... additional interaction routes
    ]
  }
]
```

### Route Organization Patterns

#### CRUD Route Patterns
Each entity follows a consistent CRUD route structure:

- **List View**: `/{entity}` - Display all items with search and filtering
- **Detail View**: `/{entity}/:id` - View individual item details
- **Create View**: `/{entity}/new` - Create new item form
- **Edit View**: `/{entity}/:id/edit` - Edit existing item form

#### Specialized Route Patterns
- **Dashboard Routes**: Dedicated analytics and overview pages
- **Analytics Routes**: Detailed reporting and metrics views
- **Relationship Routes**: Managing entity relationships and associations

## Navigation Guards & Validation

### Route Validation System

#### UUID Validation
```typescript
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}
```

#### Principal Route Validation
```typescript
const isValidPrincipalId = async (principalId: string): Promise<boolean> => {
  try {
    // Basic format validation
    if (!isValidUUID(principalId)) {
      return false
    }
    
    // Future: Add actual principal existence check
    // const principalStore = usePrincipalStore()
    // await principalStore.validatePrincipalAccess(principalId)
    
    return true
  } catch (error) {
    console.error('Principal validation error:', error)
    return false
  }
}
```

### Before Navigation Guards

#### Comprehensive Route Validation
```typescript
router.beforeEach(async (to, from, next) => {
  // Set page title from route meta
  if (to.meta.title) {
    document.title = `${to.meta.title} - CRM`
  } else {
    document.title = 'CRM Dashboard'
  }

  // Handle mobile PWA routes
  if (to.meta.mobile && to.meta.requiresPWA) {
    const isMobile = window.innerWidth <= 768
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    
    if (!isMobile && !isPWA) {
      next('/')
      return
    }
  }

  // Principal route validation
  if (to.path.startsWith('/principals/') && to.params.id) {
    const principalId = to.params.id as string
    
    // Skip validation for special routes
    if (principalId === 'dashboard') {
      next()
      return
    }
    
    try {
      const isValid = await isValidPrincipalId(principalId)
      if (!isValid) {
        console.warn(`Invalid principal ID: ${principalId}`)
        next('/principals')
        return
      }
    } catch (error) {
      console.error('Principal validation failed:', error)
      next('/principals')
      return
    }
  }

  // Entity ID validation for CRUD routes
  if ((to.path.startsWith('/organizations/') || 
       to.path.startsWith('/contacts/') || 
       to.path.startsWith('/opportunities/')) && to.params.id) {
    const id = to.params.id as string
    
    // Skip validation for 'new' routes
    if (id === 'new') {
      next()
      return
    }
    
    if (!isValidUUID(id)) {
      console.warn(`Invalid entity ID: ${id}`)
      // Redirect to respective list view
      if (to.path.startsWith('/organizations/')) {
        next('/organizations')
      } else if (to.path.startsWith('/contacts/')) {
        next('/contacts')
      } else if (to.path.startsWith('/opportunities/')) {
        next('/opportunities')
      } else {
        next('/')
      }
      return
    }
  }

  next()
})
```

### After Navigation Guards

#### Post-Navigation Processing
```typescript
router.afterEach((to, from) => {
  // Analytics tracking (future implementation)
  // analytics.trackPageView(to.path)
  
  // Handle PWA navigation state
  if (to.meta.fullscreen) {
    document.body.classList.add('fullscreen-mode')
  } else {
    document.body.classList.remove('fullscreen-mode')
  }
  
  // Accessibility: announce page changes to screen readers
  const announcement = `Navigated to ${to.meta.title || to.name || 'page'}`
  announceToScreenReader(announcement)
})
```

## Route Meta Configuration

### Comprehensive Meta Properties

Each route includes detailed metadata for enhanced functionality:

```typescript
interface RouteMeta {
  title: string                    // Page title for document.title
  description: string              // Page description for SEO/accessibility
  requiresAuth?: boolean           // Authentication requirement (future)
  permissions?: string[]           // Required permissions (future)
  breadcrumbs?: BreadcrumbItem[]   // Navigation breadcrumbs
  mobile?: boolean                 // Mobile-specific route
  requiresPWA?: boolean            // PWA requirement
  fullscreen?: boolean             // Fullscreen layout mode
  analytics?: {                    // Analytics configuration
    category: string
    action: string
  }
}
```

### Route Meta Examples

```typescript
// Dashboard route with comprehensive meta
{
  path: '',
  name: 'Dashboard',
  component: () => import('@/views/DashboardView.vue'),
  meta: {
    title: 'Dashboard',
    description: 'Your comprehensive CRM dashboard with key metrics and insights',
    breadcrumbs: [
      { text: 'Home', to: '/' }
    ],
    analytics: {
      category: 'dashboard',
      action: 'view'
    }
  }
}

// Principal analytics route with specialized meta
{
  path: 'principals/:id/analytics',
  name: 'PrincipalAnalytics',
  component: () => import('@/views/principals/PrincipalAnalyticsView.vue'),
  props: true,
  meta: {
    title: 'Principal Analytics',
    description: 'Comprehensive analytics and performance insights',
    requiresAuth: true,
    permissions: ['principal.analytics.view'],
    breadcrumbs: [
      { text: 'Home', to: '/' },
      { text: 'Principals', to: '/principals' },
      { text: 'Analytics', to: null }
    ]
  }
}
```

## Dynamic Route Configuration

### Programmatic Route Management

#### Dynamic Route Addition (Future Enhancement)
```typescript
// Capability for adding routes dynamically based on permissions
function addConditionalRoutes(userPermissions: string[]) {
  if (userPermissions.includes('admin.advanced_analytics')) {
    router.addRoute('Dashboard', {
      path: 'advanced-analytics',
      name: 'AdvancedAnalytics',
      component: () => import('@/views/analytics/AdvancedAnalyticsView.vue'),
      meta: {
        title: 'Advanced Analytics',
        description: 'Advanced analytics and reporting',
        permissions: ['admin.advanced_analytics']
      }
    })
  }
}
```

### Route Parameter Handling

#### Props Mode for Type Safety
```typescript
// Contact detail route with props mode
{
  path: 'contacts/:id',
  name: 'ContactDetail',
  component: () => import('@/views/contacts/ContactDetailView.vue'),
  props: (route) => ({
    id: route.params.id as string,
    tab: route.query.tab as string || 'details'
  }),
  meta: {
    title: 'Contact Details',
    description: 'View contact information'
  }
}
```

## Progressive Web App (PWA) Integration

### PWA Route Handling

#### Mobile-Specific Routes
```typescript
// Mobile interaction routes (future implementation)
const mobileRoutes = [
  {
    path: '/mobile/interactions',
    name: 'MobileInteractions',
    component: () => import('@/views/mobile/MobileInteractionsView.vue'),
    meta: {
      title: 'Interactions',
      mobile: true,
      requiresPWA: true,
      fullscreen: true
    }
  }
]
```

### PWA Navigation States

#### Display Mode Detection
```typescript
// PWA display mode handling in navigation guards
const isPWA = window.matchMedia('(display-mode: standalone)').matches
const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches

if (to.meta.requiresPWA && !isPWA && !isFullscreen) {
  // Redirect to web version or show PWA installation prompt
  next('/install-pwa')
  return
}
```

## Navigation Performance Optimization

### Lazy Loading Strategy

#### Route-Based Code Splitting
```typescript
// Dynamic imports for optimal bundle splitting
const routes = [
  {
    path: '/opportunities',
    component: () => import(
      /* webpackChunkName: "opportunities" */ 
      '@/views/opportunities/OpportunitiesListView.vue'
    )
  },
  {
    path: '/analytics',
    component: () => import(
      /* webpackChunkName: "analytics" */ 
      '@/views/analytics/AnalyticsView.vue'
    )
  }
]
```

### Route Prefetching

#### Intelligent Prefetching
```typescript
// Prefetch likely next routes based on user behavior
router.afterEach((to) => {
  // Prefetch related routes
  if (to.name === 'ContactsList') {
    // Likely to navigate to contact details
    import('@/views/contacts/ContactDetailView.vue')
  }
  
  if (to.name === 'Dashboard') {
    // Prefetch frequently accessed routes
    import('@/views/opportunities/OpportunitiesListView.vue')
    import('@/views/contacts/ContactsListView.vue')
  }
})
```

## Accessibility & User Experience

### Screen Reader Announcements

#### Page Change Announcements
```typescript
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.style.position = 'absolute'
  announcement.style.left = '-10000px'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}
```

### Breadcrumb Navigation

#### Accessible Breadcrumbs
```typescript
// Breadcrumb generation from route meta
const generateBreadcrumbs = (route: RouteLocationNormalized): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = []
  
  // Add home breadcrumb
  breadcrumbs.push({ text: 'Home', to: '/', icon: 'HomeIcon' })
  
  // Add route-specific breadcrumbs
  if (route.meta.breadcrumbs) {
    breadcrumbs.push(...route.meta.breadcrumbs)
  }
  
  // Add current page
  if (route.meta.title) {
    breadcrumbs.push({ 
      text: route.meta.title, 
      to: null, 
      current: true 
    })
  }
  
  return breadcrumbs
}
```

## Error Handling & Fallbacks

### Route Error Handling

#### 404 and Error Routes
```typescript
// Error handling routes
const errorRoutes = [
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: {
      title: 'Page Not Found',
      description: 'The requested page could not be found'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]
```

### Navigation Error Recovery

#### Graceful Error Recovery
```typescript
router.onError((error) => {
  console.error('Router error:', error)
  
  // Attempt to recover by navigating to dashboard
  if (router.currentRoute.value.path !== '/') {
    router.push('/')
  }
})
```

## Security Considerations

### Route Authentication (Future Implementation)

#### Authentication Guards
```typescript
// Future authentication implementation
const requiresAuth = (to: RouteLocationNormalized): boolean => {
  return to.meta.requiresAuth || to.meta.permissions?.length > 0
}

router.beforeEach(async (to, from, next) => {
  if (requiresAuth(to)) {
    const isAuthenticated = await checkAuthentication()
    
    if (!isAuthenticated) {
      next('/login')
      return
    }
    
    // Check permissions
    if (to.meta.permissions) {
      const hasPermission = await checkPermissions(to.meta.permissions)
      if (!hasPermission) {
        next('/unauthorized')
        return
      }
    }
  }
  
  next()
})
```

## Architecture Benefits

### Developer Experience
- **Type-safe routing** with comprehensive route definitions
- **Consistent patterns** across all route configurations
- **Comprehensive validation** with helpful error messages
- **Hot module replacement** with Vite integration

### User Experience
- **Smooth navigations** with intelligent prefetching
- **Accessibility compliance** with screen reader support
- **Progressive loading** with lazy route loading
- **Mobile optimization** with PWA support

### Maintainability
- **Centralized route configuration** for easy management
- **Consistent meta properties** across all routes
- **Modular route organization** by feature domain
- **Comprehensive error handling** with graceful fallbacks

### Performance
- **Code splitting** by route for optimal loading
- **Intelligent prefetching** based on user behavior
- **Lazy loading** of route components
- **Efficient bundle sizes** with tree shaking

This routing architecture provides a robust, scalable, and user-friendly navigation system that supports complex enterprise applications while maintaining excellent performance and accessibility standards.