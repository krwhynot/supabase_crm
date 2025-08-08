<!--
  Product Performance Chart - Horizontal bar chart showing product performance
  Features: Performance indicators, comparative bars, responsive design
-->
<template>
  <div class="product-performance-chart">
    <!-- Chart Title -->
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-sm font-medium text-gray-900">
        Product Performance - {{ principalName }}
      </h4>
      <div class="text-xs text-gray-500">
        Performance Score
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
        <!-- Performance Bars -->
        <g class="performance-bars">
          <g
            v-for="(product, index) in chartData"
            :key="product.product_id"
            class="product-group"
          >
            <!-- Background Bar -->
            <rect
              :x="padding.left"
              :y="getBarY(index)"
              :width="chartAreaWidth"
              :height="barHeight"
              fill="#f3f4f6"
              rx="2"
            />
            
            <!-- Performance Bar -->
            <rect
              :x="padding.left"
              :y="getBarY(index)"
              :width="getBarWidth(product.product_performance_score || 0)"
              :height="barHeight"
              :fill="getPerformanceColor(product.product_performance_score || 0)"
              rx="2"
              class="performance-bar hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              @mouseenter="showTooltip(product, index, $event)"
              @mousemove="updateTooltipPosition($event)"
            />
            
            <!-- Product Name Label -->
            <text
              :x="padding.left - 10"
              :y="getBarY(index) + barHeight / 2"
              text-anchor="end"
              dominant-baseline="middle"
              class="text-xs fill-gray-700 font-medium"
            >
              {{ truncateProductName(product.product_name) }}
            </text>
            
            <!-- Performance Score Label -->
            <text
              :x="padding.left + getBarWidth(product.product_performance_score || 0) + 8"
              :y="getBarY(index) + barHeight / 2"
              dominant-baseline="middle"
              class="text-xs fill-gray-700 font-semibold"
            >
              {{ Math.round(product.product_performance_score || 0) }}
            </text>
          </g>
        </g>
        
        <!-- X-Axis (Performance Scale) -->
        <g class="x-axis">
          <line
            :x1="padding.left"
            :x2="chartWidth - padding.right"
            :y1="chartHeight - padding.bottom"
            :y2="chartHeight - padding.bottom"
            stroke="#6b7280"
            stroke-width="1"
          />
          
          <!-- X-Axis ticks and labels -->
          <g v-for="tick in performanceTicks" :key="tick">
            <line
              :x1="padding.left + (tick / 100) * chartAreaWidth"
              :x2="padding.left + (tick / 100) * chartAreaWidth"
              :y1="chartHeight - padding.bottom"
              :y2="chartHeight - padding.bottom + 5"
              stroke="#6b7280"
              stroke-width="1"
            />
            <text
              :x="padding.left + (tick / 100) * chartAreaWidth"
              :y="chartHeight - padding.bottom + 15"
              text-anchor="middle"
              class="text-xs fill-gray-600"
            >
              {{ tick }}
            </text>
          </g>
        </g>
        
        <!-- Performance Zones (Background indicators) -->
        <g class="performance-zones" opacity="0.1">
          <!-- Poor (0-40) -->
          <rect
            :x="padding.left"
            :y="padding.top"
            :width="(40 / 100) * chartAreaWidth"
            :height="chartAreaHeight"
            fill="#ef4444"
          />
          
          <!-- Fair (40-70) -->
          <rect
            :x="padding.left + (40 / 100) * chartAreaWidth"
            :y="padding.top"
            :width="(30 / 100) * chartAreaWidth"
            :height="chartAreaHeight"
            fill="#f59e0b"
          />
          
          <!-- Good (70-100) -->
          <rect
            :x="padding.left + (70 / 100) * chartAreaWidth"
            :y="padding.top"
            :width="(30 / 100) * chartAreaWidth"
            :height="chartAreaHeight"
            fill="#10b981"
          />
        </g>
      </svg>
      
      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        ref="tooltipEl"
        class="absolute z-10 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg pointer-events-none transform -translate-x-1/2"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="font-medium">{{ tooltip.data?.product_name }}</div>
        <div class="text-blue-300">
          Performance Score: {{ Math.round(tooltip.data?.product_performance_score || 0) }}
        </div>
        <div class="text-gray-300 text-xs mt-1">
          <div>Opportunities: {{ tooltip.data?.total_opportunities || 0 }}</div>
          <div>Win Rate: {{ Math.round(tooltip.data?.win_rate || 0) }}%</div>
          <div>Total Value: {{ formatCurrency(tooltip.data?.total_value || 0) }}</div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="chartData.length === 0" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <ChartBarIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No product data</h3>
          <p class="mt-1 text-sm text-gray-500">
            No product performance data available.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Performance Legend -->
    <div class="mt-4 flex items-center justify-center space-x-6 text-xs">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded bg-red-500"></div>
        <span class="text-gray-600">Poor (0-40)</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded bg-yellow-500"></div>
        <span class="text-gray-600">Fair (40-70)</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded bg-green-500"></div>
        <span class="text-gray-600">Good (70-100)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChartBarIcon } from '@heroicons/vue/24/outline'
import type { PrincipalProductPerformance } from '@/services/principalActivityApi'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  data: PrincipalProductPerformance[]
  principalName?: string
}

const props = withDefaults(defineProps<Props>(), {
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
  right: 60,
  bottom: 40,
  left: 150
}

const barHeight = 20
const barSpacing = 8

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: null as PrincipalProductPerformance | null
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  // Sort by performance score descending
  return [...props.data]
    .sort((a, b) => (b.product_performance_score || 0) - (a.product_performance_score || 0))
    .slice(0, 10) // Show top 10 products
})

const chartAreaWidth = computed(() => {
  return chartWidth.value - padding.left - padding.right
})

const chartAreaHeight = computed(() => {
  return chartHeight.value - padding.top - padding.bottom
})

const performanceTicks = computed(() => {
  return [0, 20, 40, 60, 80, 100]
})

// ===============================
// METHODS
// ===============================

const getBarY = (index: number): number => {
  return padding.top + index * (barHeight + barSpacing)
}

const getBarWidth = (score: number): number => {
  return (score / 100) * chartAreaWidth.value
}

const getPerformanceColor = (score: number): string => {
  if (score >= 70) return '#10b981' // Green
  if (score >= 40) return '#f59e0b' // Yellow
  return '#ef4444' // Red
}

const truncateProductName = (name: string): string => {
  if (name.length <= 20) return name
  return name.substring(0, 17) + '...'
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const showTooltip = (data: PrincipalProductPerformance, index: number, _event: MouseEvent) => {
  const rect = chartSvg.value?.getBoundingClientRect()
  if (!rect) return
  
  tooltip.value = {
    visible: true,
    x: padding.left + getBarWidth(data.product_performance_score || 0) / 2,
    y: getBarY(index) - 10,
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
      // Adjust height based on number of products
      const minHeight = 250
      const dynamicHeight = chartData.value.length * (barHeight + barSpacing) + padding.top + padding.bottom
      chartHeight.value = Math.max(minHeight, dynamicHeight)
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
.product-performance-chart {
  /* Custom styles for product performance chart */
}

/* SVG styling */
.product-performance-chart svg {
  overflow: visible;
}

/* Bar hover effects */
.performance-bar {
  transition: all 0.2s ease-in-out;
}

.performance-bar:hover {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Tooltip animation */
.product-performance-chart .tooltip {
  transition: all 0.2s ease-in-out;
}

/* Responsive text */
@media (max-width: 640px) {
  .product-performance-chart text {
    font-size: 10px;
  }
  
  .product-performance-chart .padding-left {
    padding-left: 100px;
  }
}
</style>