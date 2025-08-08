<!--
  Engagement Trend Chart - Line chart showing engagement score over time
  Features: Interactive hover, trend line, responsive design
-->
<template>
  <div class="engagement-trend-chart">
    <!-- Chart Title -->
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-sm font-medium text-gray-900">
        Engagement Trend - {{ principalName }}
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
        @mousemove="handleMouseMove"
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
          
          <!-- Vertical grid lines -->
          <line
            v-for="(_, index) in chartData"
            :key="`v-grid-${index}`"
            :x1="getXPosition(index as number)"
            :x2="getXPosition(index as number)"
            :y1="padding.top"
            :y2="chartHeight - padding.bottom"
            stroke="#f9fafb"
            stroke-width="1"
            v-show="(index as number) % Math.ceil(chartData.length / 5) === 0"
          />
        </g>
        
        <!-- Engagement Line -->
        <g class="engagement-line">
          <path
            :d="engagementPath"
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
            class="transition-all duration-300"
          />
          
          <!-- Data points -->
          <circle
            v-for="(point, index) in chartData"
            :key="`point-${index}`"
            :cx="getXPosition(index as number)"
            :cy="getYPosition((point as EngagementDataPoint).engagement_score)"
            r="4"
            fill="#3b82f6"
            class="hover:r-6 transition-all duration-200 cursor-pointer"
            @mouseenter="showTooltip(point as EngagementDataPoint, index as number, $event)"
          />
        </g>
        
        <!-- Trend Line -->
        <g v-if="showTrendLine" class="trend-line">
          <line
            :x1="padding.left"
            :x2="chartWidth - padding.right"
            :y1="getTrendY(0)"
            :y2="getTrendY(chartData.length - 1)"
            stroke="#10b981"
            stroke-width="2"
            stroke-dasharray="5,5"
            opacity="0.7"
          />
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
            :x="getXPosition(index as number)"
            :y="chartHeight - padding.bottom + 15"
            text-anchor="middle"
            class="text-xs fill-gray-600"
            v-show="(index as number) % Math.ceil(chartData.length / 5) === 0"
          >
            {{ formatXAxisLabel((point as EngagementDataPoint).date) }}
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
          Engagement: {{ tooltip.data?.engagement_score }}
        </div>
        <div class="text-gray-300 text-xs">
          Activity: {{ tooltip.data?.activity_type }}
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="chartData.length === 0" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <ChartBarIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p class="mt-1 text-sm text-gray-500">
            No engagement data found for the selected time period.
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

interface EngagementDataPoint {
  date: string
  engagement_score: number
  activity_type: string
  principal_name: string
}

interface Props {
  data: EngagementDataPoint[]
  timeRange?: string
  principalName?: string
  showTrendLine?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  timeRange: '30d',
  principalName: 'Principal',
  showTrendLine: true
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
  data: null as EngagementDataPoint | null
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

const yAxisTicks = computed(() => {
  if (chartData.value.length === 0) return [0, 25, 50, 75, 100]
  
  const maxScore = Math.max(...chartData.value.map(d => d.engagement_score))
  const minScore = Math.min(...chartData.value.map(d => d.engagement_score))
  
  const range = maxScore - minScore
  const tickCount = 5
  const tickInterval = Math.ceil(range / tickCount / 10) * 10
  
  const ticks = []
  const startTick = Math.floor(minScore / tickInterval) * tickInterval
  
  for (let i = 0; i <= tickCount; i++) {
    ticks.push(startTick + (i * tickInterval))
  }
  
  return ticks.filter(tick => tick >= 0 && tick <= 100)
})

const engagementPath = computed(() => {
  if (chartData.value.length === 0) return ''
  
  const pathCommands = chartData.value.map((point, index) => {
    const x = getXPosition(index)
    const y = getYPosition(point.engagement_score)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })
  
  return pathCommands.join(' ')
})

const trendLineSlope = computed(() => {
  if (chartData.value.length < 2) return 0
  
  const n = chartData.value.length
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  
  chartData.value.forEach((point, index) => {
    sumX += index
    sumY += point.engagement_score
    sumXY += index * point.engagement_score
    sumXX += index * index
  })
  
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
})

const trendLineIntercept = computed(() => {
  if (chartData.value.length < 2) return 0
  
  const n = chartData.value.length
  const avgX = (n - 1) / 2
  const avgY = chartData.value.reduce((sum, point) => sum + point.engagement_score, 0) / n
  
  return avgY - trendLineSlope.value * avgX
})

// ===============================
// METHODS
// ===============================

const getXPosition = (index: number): number => {
  const chartAreaWidth = chartWidth.value - padding.left - padding.right
  return padding.left + (index / Math.max(chartData.value.length - 1, 1)) * chartAreaWidth
}

const getYPosition = (value: number): number => {
  const chartAreaHeight = chartHeight.value - padding.top - padding.bottom
  const maxValue = Math.max(...yAxisTicks.value)
  const minValue = Math.min(...yAxisTicks.value)
  const range = maxValue - minValue
  
  return padding.top + ((maxValue - value) / range) * chartAreaHeight
}

const getTrendY = (index: number): number => {
  const trendValue = trendLineSlope.value * index + trendLineIntercept.value
  return getYPosition(trendValue)
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

const showTooltip = (data: EngagementDataPoint, index: number, _event: MouseEvent) => {
  const rect = chartSvg.value?.getBoundingClientRect()
  if (!rect) return
  
  tooltip.value = {
    visible: true,
    x: getXPosition(index),
    y: getYPosition(data.engagement_score) - 10,
    data
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const handleMouseMove = (event: MouseEvent) => {
  // Update tooltip position if visible
  if (tooltip.value.visible) {
    const rect = chartSvg.value?.getBoundingClientRect()
    if (rect) {
      tooltip.value.x = event.clientX - rect.left
      tooltip.value.y = event.clientY - rect.top - 20
    }
  }
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
.engagement-trend-chart {
  /* Custom styles for engagement trend chart */
}

/* SVG styling */
.engagement-trend-chart svg {
  overflow: visible;
}

/* Grid lines */
.grid-lines line {
  opacity: 0.3;
}

/* Hover effects */
.engagement-trend-chart circle:hover {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Tooltip animation */
.engagement-trend-chart .tooltip {
  transition: all 0.2s ease-in-out;
}

/* Responsive text */
@media (max-width: 640px) {
  .engagement-trend-chart text {
    font-size: 10px;
  }
}
</style>