<!--
  InteractionsListView.vue
  Main view for the interactions list page
  Wrapper around InteractionListView component
-->
<template>
  <div class="interactions-list-page">
    <InteractionListView />
  </div>
</template>

<script setup lang="ts">
import InteractionListView from '@/components/interactions/InteractionListView.vue'
</script>

<style scoped>
/* Page-specific styles */
</style>