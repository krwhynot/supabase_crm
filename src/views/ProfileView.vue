<template>
  <div class="max-w-4xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">User Profile</h1>
      <p class="text-muted-foreground">Manage your account information and settings</p>
    </div>

    <!-- Profile Content -->
    <div class="grid gap-6 md:grid-cols-2">
      <!-- Personal Information Card -->
      <div class="bg-surface-elevated rounded-lg border border-border p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <p class="text-muted-foreground">User Name</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Email</label>
            <p class="text-muted-foreground">user@example.com</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Role</label>
            <p class="text-muted-foreground">Administrator</p>
          </div>
        </div>

        <button class="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors">
          Edit Profile
        </button>
      </div>

      <!-- Account Settings Card -->
      <div class="bg-surface-elevated rounded-lg border border-border p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Account Security
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Password</label>
            <p class="text-muted-foreground">••••••••</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Two-Factor Authentication</label>
            <p class="text-muted-foreground">Disabled</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Last Login</label>
            <p class="text-muted-foreground">Today at 10:30 AM</p>
          </div>
        </div>

        <button class="mt-6 px-4 py-2 bg-surface-secondary text-foreground rounded-lg hover:bg-surface-tertiary transition-colors border border-border">
          Security Settings
        </button>
      </div>
    </div>

    <!-- Coming Soon Notice -->
    <div class="mt-8 bg-surface-elevated rounded-lg border border-border p-6">
      <div class="text-center">
        <svg class="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
        </svg>
        <h3 class="text-lg font-semibold text-foreground mb-2">Profile Management Coming Soon</h3>
        <p class="text-muted-foreground">
          Full profile editing functionality is currently under development. 
          Check back soon for complete profile management features.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Profile view component
// This is a placeholder component that will be enhanced with full functionality
</script>