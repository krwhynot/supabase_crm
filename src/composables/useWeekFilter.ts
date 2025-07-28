/**
 * Week Filter Composable - Monday-based calendar filtering
 * Follows Vue 3 Composition API patterns with reactive state management
 */

import { ref, computed, watch } from 'vue'
import type { WeekFilter, WeekInfo } from '@/types/dashboard.types'

export function useWeekFilter() {
  // State
  const selectedWeek = ref<WeekFilter>({
    weekStart: getMonday(new Date()),
    weekEnd: getSunday(new Date()),
    label: 'Current Week'
  })
  
  const availableWeeks = ref<WeekInfo[]>([])

  // Computed properties
  const currentWeekInfo = computed(() => {
    const now = new Date()
    const monday = getMonday(now)
    const sunday = getSunday(now)
    
    return {
      year: monday.getFullYear(),
      weekNumber: getWeekNumber(monday),
      weekStart: monday,
      weekEnd: sunday,
      isCurrentWeek: true,
      isPreviousWeek: false,
      label: `Week of ${formatDate(monday)}`
    }
  })

  const isCurrentWeekSelected = computed(() => {
    const current = currentWeekInfo.value
    return (
      selectedWeek.value.weekStart.getTime() === current.weekStart.getTime() &&
      selectedWeek.value.weekEnd.getTime() === current.weekEnd.getTime()
    )
  })

  const weekRangeLabel = computed(() => {
    const start = selectedWeek.value.weekStart
    const end = selectedWeek.value.weekEnd
    
    if (start.getMonth() === end.getMonth()) {
      return `${formatDateShort(start)} - ${formatDateShort(end)}`
    } else {
      return `${formatDate(start)} - ${formatDate(end)}`
    }
  })

  const weekDisplayLabel = computed(() => {
    if (isCurrentWeekSelected.value) {
      return 'This Week'
    } else if (isPreviousWeek(selectedWeek.value.weekStart)) {
      return 'Last Week'
    } else {
      return weekRangeLabel.value
    }
  })

  // Helper functions
  function getMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  function getSunday(date: Date): Date {
    const monday = getMonday(date)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return sunday
  }

  function getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  function formatDateShort(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  function isPreviousWeek(weekStart: Date): boolean {
    const lastMonday = getMonday(new Date())
    lastMonday.setDate(lastMonday.getDate() - 7)
    return weekStart.getTime() === lastMonday.getTime()
  }

  // Generate available weeks (last 8 weeks + next 2 weeks)
  const generateAvailableWeeks = () => {
    const weeks: WeekInfo[] = []
    const today = new Date()
    
    // Generate weeks from 8 weeks ago to 2 weeks in the future
    for (let i = -8; i <= 2; i++) {
      const weekDate = new Date(today)
      weekDate.setDate(today.getDate() + (i * 7))
      
      const monday = getMonday(weekDate)
      const sunday = getSunday(weekDate)
      
      const weekInfo: WeekInfo = {
        year: monday.getFullYear(),
        weekNumber: getWeekNumber(monday),
        weekStart: monday,
        weekEnd: sunday,
        isCurrentWeek: i === 0,
        isPreviousWeek: i === -1,
        label: `Week of ${formatDate(monday)}`
      }
      
      weeks.push(weekInfo)
    }
    
    availableWeeks.value = weeks.reverse() // Most recent first
  }

  // Week navigation
  const goToCurrentWeek = () => {
    const current = currentWeekInfo.value
    selectedWeek.value = {
      weekStart: current.weekStart,
      weekEnd: current.weekEnd,
      label: current.label
    }
  }

  const goToPreviousWeek = () => {
    const currentStart = selectedWeek.value.weekStart
    const previousStart = new Date(currentStart)
    previousStart.setDate(currentStart.getDate() - 7)
    
    setWeek(previousStart)
  }

  const goToNextWeek = () => {
    const currentStart = selectedWeek.value.weekStart
    const nextStart = new Date(currentStart)
    nextStart.setDate(currentStart.getDate() + 7)
    
    setWeek(nextStart)
  }

  const setWeek = (date: Date) => {
    const monday = getMonday(date)
    const sunday = getSunday(date)
    
    selectedWeek.value = {
      weekStart: monday,
      weekEnd: sunday,
      label: `Week of ${formatDate(monday)}`
    }
  }

  const selectWeekInfo = (weekInfo: WeekInfo) => {
    selectedWeek.value = {
      weekStart: weekInfo.weekStart,
      weekEnd: weekInfo.weekEnd,
      label: weekInfo.label
    }
  }

  // Week comparison helpers
  const isWeekInRange = (checkDate: Date, startWeek: Date, endWeek: Date): boolean => {
    const checkMonday = getMonday(checkDate)
    const startMonday = getMonday(startWeek)
    const endMonday = getMonday(endWeek)
    
    return checkMonday >= startMonday && checkMonday <= endMonday
  }

  const getWeeksInRange = (startDate: Date, endDate: Date): WeekInfo[] => {
    const weeks: WeekInfo[] = []
    const current = getMonday(startDate)
    const end = getMonday(endDate)
    
    while (current <= end) {
      const monday = new Date(current)
      const sunday = getSunday(current)
      
      weeks.push({
        year: monday.getFullYear(),
        weekNumber: getWeekNumber(monday),
        weekStart: monday,
        weekEnd: sunday,
        isCurrentWeek: monday.getTime() === currentWeekInfo.value.weekStart.getTime(),
        isPreviousWeek: isPreviousWeek(monday),
        label: `Week of ${formatDate(monday)}`
      })
      
      current.setDate(current.getDate() + 7)
    }
    
    return weeks
  }

  // SQL date range helpers for backend queries
  const getWeekStartISO = computed(() => 
    selectedWeek.value.weekStart.toISOString()
  )

  const getWeekEndISO = computed(() => 
    selectedWeek.value.weekEnd.toISOString()
  )

  // Initialize
  generateAvailableWeeks()

  // Watch for week changes to update analytics
  watch(
    () => selectedWeek.value,
    (newWeek) => {
      console.log('Week filter changed:', {
        start: newWeek.weekStart,
        end: newWeek.weekEnd,
        label: newWeek.label
      })
    },
    { deep: true }
  )

  return {
    // State
    selectedWeek,
    availableWeeks,

    // Computed
    currentWeekInfo,
    isCurrentWeekSelected,
    weekRangeLabel,
    weekDisplayLabel,
    getWeekStartISO,
    getWeekEndISO,

    // Methods
    generateAvailableWeeks,
    goToCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    setWeek,
    selectWeekInfo,
    isWeekInRange,
    getWeeksInRange,

    // Helpers
    getMonday,
    getSunday,
    getWeekNumber,
    formatDate,
    formatDateShort
  }
}