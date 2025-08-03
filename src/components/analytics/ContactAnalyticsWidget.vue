<template>
  <div class="contact-analytics-widget">
    <h3>Contact Analytics</h3>
    <div v-if="loading" class="spinner">Loading...</div>
    <div v-else-if="analytics">
      <p>Total Interactions: {{ analytics.totalInteractions }}</p>
      <p>Last Contact: {{ analytics.lastInteractionDate }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { contactAnalyticsApi } from '@/services/contactAnalyticsApi'

interface Props {
  contactId: string
}

const props = defineProps<Props>()
const loading = ref(false)
const analytics = ref(null)

onMounted(async () => {
  loading.value = true
  const result = await contactAnalyticsApi.getContactAnalytics(props.contactId)
  analytics.value = result.data
  loading.value = false
})
</script>

<style scoped>
.contact-analytics-widget {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}
.spinner {
  text-align: center;
  color: #6b7280;
}
</style>
