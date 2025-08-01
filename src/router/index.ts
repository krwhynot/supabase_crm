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
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router