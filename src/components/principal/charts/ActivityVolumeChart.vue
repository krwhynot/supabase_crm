<!--
  Activity Volume Chart - Bar chart showing activity count over time
  Features: Interactive bars, activity type breakdown, responsive design
-->
<template>
  <div class="activity-volume-chart">
    <!-- Chart Title -->
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-sm font-medium text-gray-900">
        Activity Volume - {{ principalName }}
      </h4>
      <div class="text-xs text-gray-500">
        {{ timeRangeLabel }}
      </div>
    </div>
    
    <!-- Chart Container -->
    <div class="relative h-full">
      <!-- SVG Chart -->
      <svg
        ref="chartSvg"
        :width="chartWidth"
        :height="chartHeight"
        class="w-full h-full"
        @mouseleave="hideTooltip"
      >
        <!-- Grid Lines -->
        <g class="grid-lines">
          <!-- Horizontal grid lines -->
          <line
            v-for="(tick, index) in yAxisTicks"
            :key="`h-grid-${index}`"
            :x1="padding.left"
            :x2="chartWidth - padding.right"
            :y1="getYPosition(tick)"
            :y2="getYPosition(tick)"
            stroke="#f3f4f6"
            stroke-width="1"
          />
        </g>
        
        <!-- Activity Bars -->
        <g class="activity-bars">
          <rect
            v-for="(point, index) in chartData"
            :key="`bar-${index}`"
            :x="getBarX(index)"
            :y="getYPosition(point.count)"
            :width="barWidth"
            :height="getBarHeight(point.count)"
            :fill="getBarColor(point.types)"
            class="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
            @mouseenter="showTooltip(point, index, $event)"
            @mousemove="updateTooltipPosition($event)"
          />
          
          <!-- Bar value labels -->
          <text
            v-for="(point, index) in chartData"
            :key="`label-${index}`"
            :x="getBarX(index) + barWidth / 2"
            :y="getYPosition(point.count) - 5"
            text-anchor="middle"
            class="text-xs fill-gray-700 font-medium"
            v-if="point.count > 0"
          >
            {{ point.count }}
          </text>
        </g>
        
        <!-- Y-Axis -->
        <g class="y-axis">
          <line
            :x1="padding.left"
            :x2="padding.left"
            :y1="padding.top"
            :y2="chartHeight - padding.bottom"
            stroke="#6b7280"
            stroke-width="1"
          />
          
          <!-- Y-Axis labels -->
          <text
            v-for="(tick, index) in yAxisTicks"
            :key="`y-label-${index}`"
            :x="padding.left - 10"
            :y="getYPosition(tick)"
            text-anchor="end"
            dominant-baseline="middle"
            class="text-xs fill-gray-600"
          >
            {{ tick }}
          </text>
        </g>
        
        <!-- X-Axis -->
        <g class="x-axis">
          <line
            :x1="padding.left"
            :x2="chartWidth - padding.right"
            :y1="chartHeight - padding.bottom"
            :y2="chartHeight - padding.bottom"
            stroke="#6b7280"
            stroke-width="1"
          />
          
          <!-- X-Axis labels -->
          <text
            v-for="(point, index) in chartData"
            :key="`x-label-${index}`"
            :x="getBarX(index) + barWidth / 2"
            :y="chartHeight - padding.bottom + 15"
            text-anchor="middle"
            class="text-xs fill-gray-600"
            v-if="shouldShowXLabel(index)"
          >
            {{ formatXAxisLabel(point.date) }}
          </text>
        </g>
      </svg>
      
      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        ref="tooltipEl"
        class="absolute z-10 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg pointer-events-none transform -translate-x-1/2"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="font-medium">{{ formatTooltipDate(tooltip.data?.date) }}</div>
        <div class="text-blue-300">
          Total Activities: {{ tooltip.data?.count }}
        </div>
        <div class="text-gray-300 text-xs mt-1">
          <div v-for="type in tooltip.data?.types" :key="type" class="flex items-center">
            <div
              class="w-2 h-2 rounded-full mr-2"
              :style="{ backgroundColor: getActivityTypeColor(type) }"
            ></div>
            {{ formatActivityType(type) }}
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="chartData.length === 0" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <ChartBarIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No activity data</h3>
          <p class="mt-1 text-sm text-gray-500">
            No activities found for the selected time period.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChartBarIcon } from '@heroicons/vue/24/outline'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface ActivityDataPoint {
  date: string
  count: number
  types: string[]
}

interface Props {
  data: ActivityDataPoint[]
  timeRange?: string
  principalName?: string
}

const props = withDefaults(defineProps<Props>(), {
  timeRange: '30d',
  principalName: 'Principal'
})

// ===============================
// REACTIVE STATE
// ===============================

const chartSvg = ref<SVGElement>()
const tooltipEl = ref<HTMLElement>()
const chartWidth = ref(800)
const chartHeight = ref(250)

const padding = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 50
}

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: null as ActivityDataPoint | null
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  // Sort data by date
  return [...props.data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
})

const timeRangeLabel = computed(() => {
  const labels: Record<string, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '1y': 'Last year'
  }
  return labels[props.timeRange] || 'Custom range'
})

const maxCount = computed(() => {
  if (chartData.value.length === 0) return 10
  return Math.max(...chartData.value.map(d => d.count))
})

const yAxisTicks = computed(() => {
  const max = maxCount.value
  const tickCount = 5
  const interval = Math.ceil(max / tickCount)
  
  const ticks = []
  for (let i = 0; i <= tickCount; i++) {
    ticks.push(i * interval)
  }
  
  return ticks
})

const barWidth = computed(() => {
  if (chartData.value.length === 0) return 20
  
  const chartAreaWidth = chartWidth.value - padding.left - padding.right
  const totalBars = chartData.value.length
  const spacing = 4
  
  return Math.max((chartAreaWidth - (totalBars - 1) * spacing) / totalBars, 10)
})

// ===============================
// METHODS
// ===============================

const getBarX = (index: number): number => {
  const chartAreaWidth = chartWidth.value - padding.left - padding.right
  const totalBars = chartData.value.length
  const spacing = 4
  
  if (totalBars === 1) {
    return padding.left + (chartAreaWidth - barWidth.value) / 2
  }
  
  return padding.left + index * (barWidth.value + spacing)
}

const getYPosition = (value: number): number => {
  const chartAreaHeight = chartHeight.value - padding.top - padding.bottom
  const maxValue = Math.max(...yAxisTicks.value)
  
  return padding.top + ((maxValue - value) / maxValue) * chartAreaHeight
}

const getBarHeight = (value: number): number => {
  const chartAreaHeight = chartHeight.value - padding.top - padding.bottom
  const maxValue = Math.max(...yAxisTicks.value)
  
  if (maxValue === 0) return 0
  return (value / maxValue) * chartAreaHeight
}

const getBarColor = (types: string[]): string => {
  // Color based on activity type diversity
  if (types.length === 1) {
    return getActivityTypeColor(types[0])
  } else if (types.length === 2) {
    return '#8b5cf6' // Purple for mixed
  } else {
    return '#f59e0b' // Orange for highly diverse
  }
}

const getActivityTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'PHONE_CALL': '#3b82f6',
    'EMAIL': '#10b981',
    'IN_PERSON': '#f59e0b',
    'VIDEO_CALL': '#8b5cf6',
    'SAMPLE_VISIT': '#ef4444',
    'FOLLOW_UP': '#6b7280',
    'OTHER': '#9ca3af'
  }
  return colors[type] || '#9ca3af'
}

const shouldShowXLabel = (index: number): boolean => {
  const maxLabels = Math.floor(chartWidth.value / 100) // Show label every 100px
  const interval = Math.ceil(chartData.value.length / maxLabels)
  return index % interval === 0
}

const formatXAxisLabel = (dateString: string): string => {
  const date = new Date(dateString)
  
  if (props.timeRange === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else if (props.timeRange === '30d') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else if (props.timeRange === '90d') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short' })
  }
}

const formatTooltipDate = (dateString?: string): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatActivityType = (type: string): string => {
  return type.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const showTooltip = (data: ActivityDataPoint, index: number, event: MouseEvent) => {
  const rect = chartSvg.value?.getBoundingClientRect()
  if (!rect) return
  
  tooltip.value = {
    visible: true,
    x: getBarX(index) + barWidth.value / 2,
    y: getYPosition(data.count) - 10,
    data
  }
}

const updateTooltipPosition = (event: MouseEvent) => {
  if (tooltip.value.visible) {
    const rect = chartSvg.value?.getBoundingClientRect()
    if (rect) {
      tooltip.value.x = event.clientX - rect.left
      tooltip.value.y = event.clientY - rect.top - 20
    }
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const updateDimensions = () => {
  if (chartSvg.value) {
    const container = chartSvg.value.parentElement
    if (container) {
      chartWidth.value = container.clientWidth
      chartHeight.value = container.clientHeight
    }
  }
}

// ===============================
// LIFECYCLE HOOKS
// ===============================

onMounted(() => {
  updateDimensions()
  window.addEventListener('resize', updateDimensions)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDimensions)
})
</script>

<style scoped>
.activity-volume-chart {
  /* Custom styles for activity volume chart */
}

/* SVG styling */
.activity-volume-chart svg {
  overflow: visible;
}

/* Grid lines */
.grid-lines line {
  opacity: 0.3;
}

/* Bar hover effects */
.activity-volume-chart rect:hover {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Tooltip animation */
.activity-volume-chart .tooltip {
  transition: all 0.2s ease-in-out;
}

/* Responsive text */
@media (max-width: 640px) {
  .activity-volume-chart text {
    font-size: 10px;
  }
}
</style>