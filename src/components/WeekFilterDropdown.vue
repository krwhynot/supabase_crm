<template>
  <div class="relative">
    <!-- Week Filter Button -->
    <button
      @click="toggleDropdown"
      :class="dropdownButtonClasses"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      type="button"
    >
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center">
          <CalendarDaysIcon class="h-4 w-4 mr-2 text-gray-500" />
          <span class="text-sm font-medium text-gray-700">
            {{ selectedWeek.label }}
          </span>
        </div>
        <ChevronDownIcon 
          :class="chevronClasses"
          class="h-4 w-4 text-gray-500 transition-transform duration-200"
        />
      </div>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        ref="dropdownMenu"
        :class="dropdownMenuClasses"
        role="menu"
        aria-orientation="vertical"
        @keydown.escape="closeDropdown"
      >
        <!-- Week Options -->
        <div class="py-1">
          <button
            v-for="week in availableWeeks"
            :key="week.label"
            @click="selectWeek(week)"
            :class="getOptionClasses(week)"
            role="menuitem"
            type="button"
          >
            <div class="flex items-center justify-between w-full">
              <div class="flex flex-col items-start">
                <span class="text-sm font-medium">{{ week.label }}</span>
                <span class="text-xs text-gray-500">
                  {{ formatDateRange(week.weekStart, week.weekEnd) }}
                </span>
              </div>
              <CheckIcon
                v-if="isSelectedWeek(week)"
                class="h-4 w-4 text-blue-600"
              />
            </div>
          </button>
        </div>
        
        <!-- Divider -->
        <div class="border-t border-gray-100"></div>
        
        <!-- Navigation Controls -->
        <div class="py-1">
          <button
            @click="goToPreviousWeek"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            role="menuitem"
            type="button"
          >
            <ChevronLeftIcon class="h-4 w-4 mr-2" />
            Previous Week
          </button>
          
          <button
            @click="goToNextWeek"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            role="menuitem"
            type="button"
          >
            <ChevronRightIcon class="h-4 w-4 mr-2" />
            Next Week
          </button>
          
          <button
            @click="goToCurrentWeek"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            role="menuitem"
            type="button"
          >
            <HomeIcon class="h-4 w-4 mr-2" />
            Current Week
          </button>
        </div>
      </div>
    </transition>

    <!-- Backdrop for mobile -->
    <div
      v-if="isOpen && isMobile"
      class="fixed inset-0 z-40"
      @click="closeDropdown"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  HomeIcon
} from '@heroicons/vue/24/outline'

// Composables
import { useWeekFilter } from '@/composables/useWeekFilter'
import { useResponsive } from '@/composables/useResponsive'
import { useDashboardStore } from '@/stores/dashboardStore'

// Week filter functionality
const {
  selectedWeek,
  availableWeeks,
  goToPreviousWeek: weekGoToPrevious,
  goToNextWeek: weekGoToNext,
  goToCurrentWeek: weekGoToCurrent,
  selectWeekInfo,
  formatDate
} = useWeekFilter()

// Responsive design
const { isMobile } = useResponsive()

// Dashboard store
const dashboardStore = useDashboardStore()

// Local state
const isOpen = ref(false)
const dropdownMenu = ref<HTMLElement | null>(null)

// Computed classes
const dropdownButtonClasses = computed(() => {
  const baseClasses = 'w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150'
  return baseClasses
})

const chevronClasses = computed(() => ({
  'rotate-180': isOpen.value
}))

const dropdownMenuClasses = computed(() => {
  const baseClasses = 'absolute z-50 mt-1 w-full max-w-xs bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'
  const positionClasses = isMobile.value 
    ? 'left-0 right-0 mx-auto' 
    : 'left-0'
  
  return `${baseClasses} ${positionClasses}`
})

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectWeek = (week: typeof availableWeeks.value[0]) => {
  selectWeekInfo(week)
  
  // Update dashboard store filter
  dashboardStore.updateWeekFilter({
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    label: week.label
  })
  
  closeDropdown()
}

const isSelectedWeek = (week: typeof availableWeeks.value[0]): boolean => {
  return week.label === selectedWeek.value.label &&
         week.weekStart.getTime() === selectedWeek.value.weekStart.getTime()
}

const getOptionClasses = (week: typeof availableWeeks.value[0]) => {
  const baseClasses = 'flex items-center w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150'
  const selectedClasses = isSelectedWeek(week) 
    ? 'bg-blue-50 text-blue-700' 
    : 'text-gray-900'
  
  return `${baseClasses} ${selectedClasses}`
}

const formatDateRange = (start: Date, end: Date): string => {
  return `${formatDate(start)} - ${formatDate(end)}`
}

// Navigation methods that close dropdown
const goToPreviousWeek = () => {
  weekGoToPrevious()
  dashboardStore.updateWeekFilter(selectedWeek.value)
  closeDropdown()
}

const goToNextWeek = () => {
  weekGoToNext()
  dashboardStore.updateWeekFilter(selectedWeek.value)
  closeDropdown()
}

const goToCurrentWeek = () => {
  weekGoToCurrent()
  dashboardStore.updateWeekFilter(selectedWeek.value)
  closeDropdown()
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownMenu.value && !dropdownMenu.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Custom dropdown positioning for mobile */
@media (max-width: 640px) {
  .dropdown-menu {
    left: 50%;
    transform: translateX(-50%);
    min-width: 280px;
  }
}

/* Enhanced focus styles for accessibility */
.focus\:ring-2:focus {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

/* Smooth transitions for better UX */
.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>