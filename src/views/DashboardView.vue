<template>
  <DashboardLayout>
    <DashboardGrid @openSettings="openSettings" />
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Components
import DashboardLayout from '@/components/DashboardLayout.vue'
import DashboardGrid from '@/components/DashboardGrid.vue'

// Local state
const showSettings = ref(false)

// Methods
const openSettings = () => {
  showSettings.value = true
}
</script>

<style scoped>
/* Dashboard-specific styles */
</style>