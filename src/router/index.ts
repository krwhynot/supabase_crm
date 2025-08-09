import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/layout/DashboardLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import(/* webpackChunkName: "dashboard" */ '@/views/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
          description: 'Your CRM dashboard',
          preload: true
        }
      },
      {
        path: 'contacts',
        name: 'ContactsList',
        component: () => import(/* webpackChunkName: "contacts" */ '@/views/contacts/ContactsListView.vue'),
        meta: {
          title: 'Contacts',
          description: 'Manage your professional contacts'
        }
      },
      {
        path: 'contacts/new',
        name: 'ContactCreate',
        component: () => import(/* webpackChunkName: "contacts" */ '@/views/contacts/ContactCreateView.vue'),
        meta: {
          title: 'New Contact',
          description: 'Add a new contact to your CRM'
        }
      },
      {
        path: 'contacts/:id',
        name: 'ContactDetail',
        component: () => import(/* webpackChunkName: "contacts" */ '@/views/contacts/ContactDetailView.vue'),
        props: true,
        meta: {
          title: 'Contact Details',
          description: 'View contact information'
        }
      },
      {
        path: 'contacts/:id/edit',
        name: 'ContactEdit',
        component: () => import(/* webpackChunkName: "contacts" */ '@/views/contacts/ContactEditView.vue'),
        props: true,
        meta: {
          title: 'Edit Contact',
          description: 'Modify contact information'
        }
      },
      {
        path: 'organizations',
        name: 'OrganizationsList',
        component: () => import(/* webpackChunkName: "organizations" */ '@/views/organizations/OrganizationsListView.vue'),
        meta: {
          title: 'Organizations',
          description: 'Manage your business organizations'
        }
      },
      {
        path: 'organizations/new',
        name: 'OrganizationCreate',
        component: () => import(/* webpackChunkName: "organizations" */ '@/views/organizations/OrganizationCreateView.vue'),
        meta: {
          title: 'New Organization',
          description: 'Add a new organization to your CRM'
        }
      },
      {
        path: 'organizations/:id',
        name: 'OrganizationDetail',
        component: () => import(/* webpackChunkName: "organizations" */ '@/views/organizations/OrganizationDetailView.vue'),
        props: true,
        meta: {
          title: 'Organization Details',
          description: 'View organization information'
        }
      },
      {
        path: 'organizations/:id/edit',
        name: 'OrganizationEdit',
        component: () => import(/* webpackChunkName: "organizations" */ '@/views/organizations/OrganizationEditView.vue'),
        props: true,
        meta: {
          title: 'Edit Organization',
          description: 'Modify organization information'
        }
      },
      {
        path: 'opportunities',
        name: 'OpportunitiesList',
        component: () => import(/* webpackChunkName: "opportunities" */ '@/views/opportunities/OpportunitiesListView.vue'),
        meta: {
          title: 'Opportunities',
          description: 'Manage your business opportunities'
        }
      },
      {
        path: 'opportunities/new',
        name: 'OpportunityCreate',
        component: () => import(/* webpackChunkName: "opportunities" */ '@/views/opportunities/OpportunityCreateView.vue'),
        meta: {
          title: 'New Opportunity',
          description: 'Add a new opportunity to your CRM'
        }
      },
      {
        path: 'opportunities/:id',
        name: 'OpportunityDetail',
        component: () => import(/* webpackChunkName: "opportunities" */ '@/views/opportunities/OpportunityDetailView.vue'),
        props: true,
        meta: {
          title: 'Opportunity Details',
          description: 'View opportunity information'
        }
      },
      {
        path: 'opportunities/:id/edit',
        name: 'OpportunityEdit',
        component: () => import(/* webpackChunkName: "opportunities" */ '@/views/opportunities/OpportunityEditView.vue'),
        props: true,
        meta: {
          title: 'Edit Opportunity',
          description: 'Modify opportunity information'
        }
      },
      {
        path: 'interactions',
        name: 'InteractionsList',
        component: () => import(/* webpackChunkName: "interactions" */ '@/views/interactions/InteractionsListView.vue'),
        meta: {
          title: 'Interactions',
          description: 'Track customer interactions and activities'
        }
      },
      {
        path: 'interactions/new',
        name: 'InteractionCreate',
        component: () => import(/* webpackChunkName: "interactions" */ '@/views/interactions/InteractionCreateView.vue'),
        meta: {
          title: 'New Interaction',
          description: 'Record a new customer interaction'
        }
      },
      {
        path: 'interactions/:id',
        name: 'InteractionDetail',
        component: () => import(/* webpackChunkName: "interactions" */ '@/views/interactions/InteractionDetailView.vue'),
        props: true,
        meta: {
          title: 'Interaction Details',
          description: 'View interaction information'
        }
      },
      {
        path: 'interactions/:id/edit',
        name: 'InteractionEdit',
        component: () => import(/* webpackChunkName: "interactions" */ '@/views/interactions/InteractionEditView.vue'),
        props: true,
        meta: {
          title: 'Edit Interaction',
          description: 'Modify interaction information'
        }
      },
      {
        path: 'principals',
        name: 'PrincipalsList',
        component: () => import(/* webpackChunkName: "principals" */ '@/views/principals/PrincipalsListView.vue'),
        meta: {
          title: 'Principals',
          description: 'Manage principal relationships and activities'
        }
      },
      {
        path: 'principals/dashboard',
        name: 'PrincipalDashboard',
        component: () => import(/* webpackChunkName: "principals" */ '@/views/principals/PrincipalDashboardView.vue'),
        meta: {
          title: 'Principal Dashboard',
          description: 'Comprehensive principal activity analytics and insights'
        }
      },
      {
        path: 'principals/:id',
        name: 'PrincipalDetail',
        component: () => import(/* webpackChunkName: "principals" */ '@/views/principals/PrincipalDetailView.vue'),
        props: true,
        meta: {
          title: 'Principal Details',
          description: 'View principal activity and performance'
        }
      },
      {
        path: 'principals/:id/analytics',
        name: 'PrincipalAnalytics',
        component: () => import(/* webpackChunkName: "principals" */ '@/views/principals/PrincipalAnalyticsView.vue'),
        props: true,
        meta: {
          title: 'Principal Analytics',
          description: 'Comprehensive analytics and performance insights'
        }
      },
      {
        path: 'principals/:id/products',
        name: 'PrincipalProducts',
        component: () => import(/* webpackChunkName: "principals" */ '@/views/principals/PrincipalProductsView.vue'),
        props: true,
        meta: {
          title: 'Principal Products',
          description: 'Product portfolio and performance management'
        }
      },
      {
        path: 'principals/:id/distributors',
        name: 'PrincipalDistributors',
        component: () => import(/* webpackChunkName: "principals" */ '@/views/principals/PrincipalDistributorsView.vue'),
        props: true,
        meta: {
          title: 'Principal Distributors',
          description: 'Distributor network and relationship management'
        }
      },
      {
        path: 'products',
        name: 'ProductsList',
        component: () => import(/* webpackChunkName: "products" */ '@/views/products/ProductsListView.vue'),
        meta: {
          title: 'Products',
          description: 'Manage your product catalog and principal assignments'
        }
      },
      // Temporarily disabled for deployment
      // {
      //   path: 'products/new',
      //   name: 'ProductCreate',
      //   component: () => import('@/views/products/ProductCreateView.vue'),
      //   meta: {
      //     title: 'New Product',
      //     description: 'Add a new product to your catalog'
      //   }
      // },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import(/* webpackChunkName: "products" */ '@/views/products/ProductDetailView.vue'),
        props: true,
        meta: {
          title: 'Product Details',
          description: 'View product information and assignments'
        }
      },
      // Temporarily disabled for deployment  
      // {
      //   path: 'products/:id/edit',
      //   name: 'ProductEdit',
      //   component: () => import('@/views/products/ProductEditView.vue'),
      //   props: true,
      //   meta: {
      //     title: 'Edit Product',
      //     description: 'Modify product information and assignments'
      //   }
      // }
    ]
  },
  // Mobile interaction routes will be added during Stage 5 implementation
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Route validation utilities
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

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

// Navigation guards for page titles, authentication, and validation
router.beforeEach(async (to, _from, next) => {
  // Set page title from route meta
  if (to.meta.title) {
    document.title = `${to.meta.title} - CRM`
  } else {
    document.title = 'CRM Dashboard'
  }

  // Handle mobile PWA routes
  if (to.meta.mobile && to.meta.requiresPWA) {
    // Check if running as PWA or mobile device
    const isMobile = window.innerWidth <= 768
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
    
    if (!isMobile && !isPWA) {
      // Redirect mobile-only routes to desktop equivalent
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
        // Redirect to principals list instead of error
        next('/principals')
        return
      }
    } catch (error) {
      console.error('Principal validation failed:', error)
      next('/principals')
      return
    }
  }

  // Organization/Contact/Opportunity/Product ID validation
  if ((to.path.startsWith('/organizations/') || to.path.startsWith('/contacts/') || to.path.startsWith('/opportunities/') || to.path.startsWith('/products/')) && to.params.id) {
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
      } else if (to.path.startsWith('/products/')) {
        next('/products')
      } else {
        next('/')
      }
      return
    }
  }

  // Future: Add authentication checks here
  // if (to.meta.requiresAuth && !isAuthenticated()) {
  //   next('/login')
  //   return
  // }

  next()
})

// After navigation guards for route tracking
router.afterEach((to, _from) => {
  // Future: Add analytics tracking here
  // analytics.trackPageView(to.path)
  
  // Handle PWA navigation state
  if (to.meta.fullscreen) {
    document.body.classList.add('fullscreen-mode')
  } else {
    document.body.classList.remove('fullscreen-mode')
  }
})

export default router