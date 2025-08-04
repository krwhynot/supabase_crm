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
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
          description: 'Your CRM dashboard'
        }
      },
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
      {
        path: 'organizations',
        name: 'OrganizationsList',
        component: () => import('@/views/organizations/OrganizationsListView.vue'),
        meta: {
          title: 'Organizations',
          description: 'Manage your business organizations'
        }
      },
      {
        path: 'organizations/new',
        name: 'OrganizationCreate',
        component: () => import('@/views/organizations/OrganizationCreateView.vue'),
        meta: {
          title: 'New Organization',
          description: 'Add a new organization to your CRM'
        }
      },
      {
        path: 'organizations/:id',
        name: 'OrganizationDetail',
        component: () => import('@/views/organizations/OrganizationDetailView.vue'),
        props: true,
        meta: {
          title: 'Organization Details',
          description: 'View organization information'
        }
      },
      {
        path: 'organizations/:id/edit',
        name: 'OrganizationEdit',
        component: () => import('@/views/organizations/OrganizationEditView.vue'),
        props: true,
        meta: {
          title: 'Edit Organization',
          description: 'Modify organization information'
        }
      },
      {
        path: 'opportunities',
        name: 'OpportunitiesList',
        component: () => import('@/views/opportunities/OpportunitiesListView.vue'),
        meta: {
          title: 'Opportunities',
          description: 'Manage your business opportunities'
        }
      },
      {
        path: 'opportunities/new',
        name: 'OpportunityCreate',
        component: () => import('@/views/opportunities/OpportunityCreateView.vue'),
        meta: {
          title: 'New Opportunity',
          description: 'Add a new opportunity to your CRM'
        }
      },
      {
        path: 'opportunities/:id',
        name: 'OpportunityDetail',
        component: () => import('@/views/opportunities/OpportunityDetailView.vue'),
        props: true,
        meta: {
          title: 'Opportunity Details',
          description: 'View opportunity information'
        }
      },
      {
        path: 'opportunities/:id/edit',
        name: 'OpportunityEdit',
        component: () => import('@/views/opportunities/OpportunityEditView.vue'),
        props: true,
        meta: {
          title: 'Edit Opportunity',
          description: 'Modify opportunity information'
        }
      },
      {
        path: 'interactions',
        name: 'InteractionsList',
        component: () => import('@/views/interactions/InteractionsListView.vue'),
        meta: {
          title: 'Interactions',
          description: 'Track customer interactions and activities'
        }
      },
      {
        path: 'interactions/new',
        name: 'InteractionCreate',
        component: () => import('@/views/interactions/InteractionCreateView.vue'),
        meta: {
          title: 'New Interaction',
          description: 'Record a new customer interaction'
        }
      },
      {
        path: 'interactions/:id',
        name: 'InteractionDetail',
        component: () => import('@/views/interactions/InteractionDetailView.vue'),
        props: true,
        meta: {
          title: 'Interaction Details',
          description: 'View interaction information'
        }
      },
      {
        path: 'interactions/:id/edit',
        name: 'InteractionEdit',
        component: () => import('@/views/interactions/InteractionEditView.vue'),
        props: true,
        meta: {
          title: 'Edit Interaction',
          description: 'Modify interaction information'
        }
      },
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
      {
        path: 'principals/:id/products',
        name: 'PrincipalProducts',
        component: () => import('@/views/principals/PrincipalProductsView.vue'),
        props: true,
        meta: {
          title: 'Principal Products',
          description: 'Product portfolio and performance management'
        }
      },
      {
        path: 'principals/:id/distributors',
        name: 'PrincipalDistributors',
        component: () => import('@/views/principals/PrincipalDistributorsView.vue'),
        props: true,
        meta: {
          title: 'Principal Distributors',
          description: 'Distributor network and relationship management'
        }
      }
    ]
  },
  // Mobile interaction routes will be added during Stage 5 implementation
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guards for page titles and authentication
router.beforeEach((to, from, next) => {
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
      // Redirect mobile-only routes to desktop equivalent (will be implemented in Stage 5)
      next('/')
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
router.afterEach((to, from) => {
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