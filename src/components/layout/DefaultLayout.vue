<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Application Header -->
    <ApplicationHeader 
      :show-navigation="false"
      :show-back-button="showBackButton"
      @back="handleBack"
    />
    
    <!-- Main Content Area -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <slot />
    </main>
    
    <!-- Footer (Optional) -->
    <footer v-if="showFooter" class="bg-white border-t border-gray-200 py-8 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center text-sm text-gray-500">
          <p>&copy; {{ currentYear }} Kitchen Pantry CRM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ApplicationHeader from './ApplicationHeader.vue'

/**
 * Default Layout - Standalone page layout
 * Simple layout for pages that don't need the sidebar navigation
 * Includes header with optional back button and minimal footer
 */

interface Props {
  showBackButton?: boolean
  showFooter?: boolean
}

withDefaults(defineProps<Props>(), {
  showBackButton: false,
  showFooter: true
})

const router = useRouter()

const currentYear = computed(() => new Date().getFullYear())

const handleBack = () => {
  // Navigate back or to dashboard if no history
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>