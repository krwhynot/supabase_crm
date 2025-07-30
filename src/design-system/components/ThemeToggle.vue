<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    :title="themeTooltip"
    :aria-label="themeTooltip"
  >
    <component :is="themeIcon" class="h-5 w-5 text-foreground" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme';
import { useIcons } from '../composables/useIcons';

const { themeConfig, toggleTheme } = useTheme();
const { getIcon } = useIcons();

const themeIcon = computed(() => {
  const iconName = themeConfig.value.icon;
  return getIcon(iconName, 'outline');
});

const themeTooltip = computed(() => {
  const currentTheme = themeConfig.value.theme;
  const nextTheme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';
  return `Switch to ${nextTheme} theme`;
});
</script>