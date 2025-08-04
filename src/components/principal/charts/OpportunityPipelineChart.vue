<!--
  Opportunity Pipeline Chart - Funnel chart showing opportunities by stage
  Features: Interactive funnel segments, value indicators, responsive design
-->
<template>
  <div class="opportunity-pipeline-chart">
    <!-- Chart Title -->
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-sm font-medium text-gray-900">
        Opportunity Pipeline - {{ principalName }}
      </h4>
      <div class="flex items-center space-x-4 text-xs text-gray-500">
        <div>Total: {{ totalOpportunities }} opportunities</div>
        <div>Value: {{ formatCurrency(totalValue) }}</div>
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
        <!-- Pipeline Funnel -->
        <g class="pipeline-funnel">
          <g
            v-for="(stage, index) in pipelineStages"
            :key="stage.stage"
            class="funnel-segment"
          >
            <!-- Funnel Segment -->
            <path
              :d="getFunnelPath(index)"
              :fill="getStageColor(stage.stage)"
              :stroke="getStageColor(stage.stage)"
              stroke-width="1"
              class="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              @mouseenter="showTooltip(stage, index, $event)"
              @mousemove="updateTooltipPosition($event)"
            />
            
            <!-- Stage Label -->
            <text
              :x="chartWidth / 2"
              :y="getSegmentCenterY(index)"
              text-anchor="middle"
              dominant-baseline="middle"
              class="text-xs fill-white font-medium pointer-events-none"
              style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5)"
            >
              {{ formatStageName(stage.stage) }}
            </text>
            
            <!-- Count and Value -->
            <text
              :x="chartWidth / 2"
              :y="getSegmentCenterY(index) + 12"
              text-anchor="middle"
              dominant-baseline="middle"
              class="text-xs fill-white font-semibold pointer-events-none"
              style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5)"
            >
              {{ stage.count }} ({{ formatCurrency(stage.value) }})
            </text>
          </g>
        </g>
        
        <!-- Pipeline Flow Arrows -->
        <g class="flow-arrows" v-if="pipelineStages.length > 1">
          <g
            v-for="index in pipelineStages.length - 1"
            :key="`arrow-${index}`"
            class="flow-arrow"
          >
            <path
              :d="getArrowPath(index)"
              fill="#6b7280"
              opacity="0.3"
            />
          </g>
        </g>
      </svg>
      
      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        ref="tooltipEl"
        class="absolute z-10 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg pointer-events-none transform -translate-x-1/2"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="font-medium">{{ formatStageName(tooltip.data?.stage) }}</div>
        <div class="text-blue-300">
          {{ tooltip.data?.count }} opportunities
        </div>
        <div class="text-green-300">
          Total Value: {{ formatCurrency(tooltip.data?.value || 0) }}
        </div>
        <div class="text-gray-300 text-xs mt-1">
          Avg Value: {{ formatCurrency((tooltip.data?.value || 0) / Math.max(tooltip.data?.count || 1, 1)) }}
        </div>
        <div class="text-gray-300 text-xs">
          {{ getConversionRate(tooltip.index) }}% conversion rate
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="pipelineStages.length === 0" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <ChartBarIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No pipeline data</h3>
          <p class="mt-1 text-sm text-gray-500">
            No opportunities found in the pipeline.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Pipeline Summary -->
    <div v-if="pipelineStages.length > 0" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-blue-50 rounded-lg p-3">
        <div class="flex items-center">
          <FunnelIcon class="h-4 w-4 text-blue-500 mr-2" />
          <span class="text-xs font-medium text-blue-900">Total Pipeline</span>
        </div>
        <p class="text-lg font-bold text-blue-600 mt-1">{{ totalOpportunities }}</p>
      </div>
      
      <div class="bg-green-50 rounded-lg p-3">
        <div class="flex items-center">
          <CurrencyDollarIcon class="h-4 w-4 text-green-500 mr-2" />
          <span class="text-xs font-medium text-green-900">Total Value</span>
        </div>
        <p class="text-lg font-bold text-green-600 mt-1">{{ formatCurrency(totalValue) }}</p>
      </div>
      
      <div class="bg-purple-50 rounded-lg p-3">
        <div class="flex items-center">
          <TrophyIcon class="h-4 w-4 text-purple-500 mr-2" />
          <span class="text-xs font-medium text-purple-900">Win Rate</span>
        </div>
        <p class="text-lg font-bold text-purple-600 mt-1">{{ overallWinRate }}%</p>
      </div>
      
      <div class="bg-yellow-50 rounded-lg p-3">
        <div class="flex items-center">
          <CalculatorIcon class="h-4 w-4 text-yellow-500 mr-2" />
          <span class="text-xs font-medium text-yellow-900">Avg Value</span>
        </div>
        <p class="text-lg font-bold text-yellow-600 mt-1">{{ formatCurrency(averageValue) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ChartBarIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  CalculatorIcon
} from '@heroicons/vue/24/outline'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface PipelineStage {
  stage: string
  count: number
  value: number
}

interface Props {
  data: PipelineStage[]
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
  right: 40,
  bottom: 20,
  left: 40
}

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: null as PipelineStage | null,
  index: 0
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const pipelineStages = computed(() => {
  if (!props.data || props.data.length === 0) return []
  
  // Sort stages by typical pipeline order
  const stageOrder = [
    'NEW_LEAD',
    'INITIAL_OUTREACH',
    'SAMPLE_VISIT_OFFERED',
    'AWAITING_RESPONSE',
    'FEEDBACK_LOGGED',
    'DEMO_SCHEDULED',
    'CLOSED_WON'
  ]
  
  return [...props.data].sort((a, b) => {
    const aIndex = stageOrder.indexOf(a.stage)
    const bIndex = stageOrder.indexOf(b.stage)
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })
})

const totalOpportunities = computed(() => {
  return pipelineStages.value.reduce((sum, stage) => sum + stage.count, 0)
})

const totalValue = computed(() => {
  return pipelineStages.value.reduce((sum, stage) => sum + stage.value, 0)
})

const averageValue = computed(() => {
  if (totalOpportunities.value === 0) return 0
  return totalValue.value / totalOpportunities.value
})

const overallWinRate = computed(() => {
  const wonStage = pipelineStages.value.find(stage => stage.stage === 'CLOSED_WON')
  if (!wonStage || totalOpportunities.value === 0) return 0
  return Math.round((wonStage.count / totalOpportunities.value) * 100)
})

const maxStageCount = computed(() => {
  if (pipelineStages.value.length === 0) return 1
  return Math.max(...pipelineStages.value.map(stage => stage.count))
})

// ===============================
// METHODS
// ===============================

const getFunnelPath = (index: number): string => {
  const stage = pipelineStages.value[index]
  const stageCount = pipelineStages.value.length
  
  const segmentHeight = (chartHeight.value - padding.top - padding.bottom) / stageCount
  const y = padding.top + index * segmentHeight
  
  // Calculate width based on count (funnel effect)
  const minWidth = 60
  const maxWidth = chartWidth.value - padding.left - padding.right
  const widthRatio = stage.count / maxStageCount.value
  const width = minWidth + (maxWidth - minWidth) * widthRatio
  
  const centerX = chartWidth.value / 2
  const left = centerX - width / 2
  const right = centerX + width / 2
  
  // Calculate connecting points for funnel effect
  let topLeft = left
  let topRight = right
  
  if (index > 0) {
    const prevStage = pipelineStages.value[index - 1]
    const prevWidthRatio = prevStage.count / maxStageCount.value
    const prevWidth = minWidth + (maxWidth - minWidth) * prevWidthRatio
    topLeft = centerX - prevWidth / 2
    topRight = centerX + prevWidth / 2
  }
  
  return `
    M ${topLeft} ${y}
    L ${topRight} ${y}
    L ${right} ${y + segmentHeight}
    L ${left} ${y + segmentHeight}
    Z
  `
}

const getSegmentCenterY = (index: number): number => {
  const stageCount = pipelineStages.value.length
  const segmentHeight = (chartHeight.value - padding.top - padding.bottom) / stageCount
  return padding.top + index * segmentHeight + segmentHeight / 2
}

const getArrowPath = (index: number): string => {
  const y1 = getSegmentCenterY(index) + 20
  const y2 = getSegmentCenterY(index + 1) - 20
  const centerX = chartWidth.value / 2
  
  return `
    M ${centerX - 5} ${y1}
    L ${centerX + 5} ${y1}
    L ${centerX + 5} ${y2 - 5}
    L ${centerX + 10} ${y2 - 5}
    L ${centerX} ${y2}
    L ${centerX - 10} ${y2 - 5}
    L ${centerX - 5} ${y2 - 5}
    Z
  `
}

const getStageColor = (stage: string): string => {
  const colors: Record<string, string> = {
    'NEW_LEAD': '#3b82f6',
    'INITIAL_OUTREACH': '#8b5cf6',
    'SAMPLE_VISIT_OFFERED': '#06b6d4',
    'AWAITING_RESPONSE': '#f59e0b',
    'FEEDBACK_LOGGED': '#ec4899',
    'DEMO_SCHEDULED': '#10b981',
    'CLOSED_WON': '#22c55e'
  }
  return colors[stage] || '#6b7280'
}

const formatStageName = (stage: string): string => {
  const names: Record<string, string> = {
    'NEW_LEAD': 'New Lead',
    'INITIAL_OUTREACH': 'Initial Outreach',
    'SAMPLE_VISIT_OFFERED': 'Sample Visit Offered',
    'AWAITING_RESPONSE': 'Awaiting Response',
    'FEEDBACK_LOGGED': 'Feedback Logged',
    'DEMO_SCHEDULED': 'Demo Scheduled',
    'CLOSED_WON': 'Closed Won'
  }
  return names[stage] || stage.replace(/_/g, ' ')
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

const getConversionRate = (index: number): number => {
  if (index === 0 || pipelineStages.value.length <= 1) return 100
  
  const currentStage = pipelineStages.value[index]
  const previousStage = pipelineStages.value[index - 1]
  
  if (previousStage.count === 0) return 0
  return Math.round((currentStage.count / previousStage.count) * 100)
}

const showTooltip = (data: PipelineStage, index: number, event: MouseEvent) => {
  tooltip.value = {
    visible: true,
    x: chartWidth.value / 2,
    y: getSegmentCenterY(index) - 20,
    data,
    index
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
.opportunity-pipeline-chart {
  /* Custom styles for pipeline chart */
}

/* SVG styling */
.opportunity-pipeline-chart svg {
  overflow: visible;
}

/* Funnel segment hover effects */
.funnel-segment path:hover {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

/* Flow arrows animation */
.flow-arrow {
  animation: flow 2s ease-in-out infinite;
}

@keyframes flow {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

/* Tooltip animation */
.opportunity-pipeline-chart .tooltip {
  transition: all 0.2s ease-in-out;
}

/* Summary cards */
.pipeline-summary .summary-card {
  transition: transform 0.2s ease-in-out;
}

.pipeline-summary .summary-card:hover {
  transform: translateY(-2px);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .opportunity-pipeline-chart text {
    font-size: 10px;
  }
  
  .pipeline-summary {
    grid-template-columns: 1fr 1fr;
  }
}
</style>