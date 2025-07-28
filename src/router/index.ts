import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      title: 'Dashboard',
      description: 'CRM Dashboard with analytics and metrics'
    }
  },
  {
    path: '/contacts',
    name: 'ContactsList',
    component: () => import('@/views/contacts/ContactsListView.vue'),
    meta: {
      title: 'Contacts',
      description: 'Manage your professional contacts'
    }
  },
  {
    path: '/contacts/new',
    name: 'ContactCreate',
    component: () => import('@/views/contacts/ContactCreateView.vue'),
    meta: {
      title: 'New Contact',
      description: 'Add a new contact to your CRM'
    }
  },
  {
    path: '/contacts/:id',
    name: 'ContactDetail',
    component: () => import('@/views/contacts/ContactDetailView.vue'),
    props: true,
    meta: {
      title: 'Contact Details',
      description: 'View contact information'
    }
  },
  {
    path: '/contacts/:id/edit',
    name: 'ContactEdit',
    component: () => import('@/views/contacts/ContactEditView.vue'),
    props: true,
    meta: {
      title: 'Edit Contact',
      description: 'Modify contact information'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router