<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Employee Information</h3>
        <button
          v-if="showDetails"
          @click="toggleExpanded"
          class="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          :aria-label="isExpanded ? 'Show less detail' : 'Show more detail'"
        >
          <ChevronDownIcon 
            :class="[
              'h-4 w-4 mr-1 transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            ]" 
          />
          {{ isExpanded ? 'Less' : 'More' }}
        </button>
      </div>
    </div>
    
    <div class="px-6 py-6">
      <!-- Main Employee Count Display -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <UsersIcon class="h-8 w-8 text-blue-600" />
        </div>
        
        <div class="space-y-2">
          <div class="text-3xl font-bold text-gray-900">
            {{ displayEmployeeCount }}
          </div>
          <div class="text-sm text-gray-500">
            {{ employeeCountLabel }}
          </div>
          
          <!-- Size Category Badge -->
          <div v-if="organization.size" class="inline-flex items-center">
            <span :class="getSizeColor(organization.size)">
              {{ organization.size }} Organization
            </span>
          </div>
        </div>
      </div>
      
      <!-- Employee Growth Trend (if available) -->
      <div v-if="showGrowthTrend && employeeGrowthData" class="mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium text-gray-900">Employee Growth</h4>
          <span :class="getGrowthTrendClass(employeeGrowthData.trend)">
            <ArrowTrendingUpIcon v-if="employeeGrowthData.trend > 0" class="h-4 w-4 mr-1" />
            <ArrowTrendingDownIcon v-else-if="employeeGrowthData.trend < 0" class="h-4 w-4 mr-1" />
            <MinusIcon v-else class="h-4 w-4 mr-1" />
            {{ Math.abs(employeeGrowthData.trend) }}%
          </span>
        </div>
        
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-lg font-semibold text-gray-900">
              {{ employeeGrowthData.previousCount.toLocaleString() }}
            </div>
            <div class="text-xs text-gray-500">Last Year</div>
          </div>
          <div>
            <div class="text-lg font-semibold text-gray-900">
              {{ (employeeGrowthData.currentCount - employeeGrowthData.previousCount).toLocaleString() }}
            </div>
            <div class="text-xs text-gray-500">Change</div>
          </div>
          <div>
            <div class="text-lg font-semibold text-gray-900">
              {{ employeeGrowthData.currentCount.toLocaleString() }}
            </div>
            <div class="text-xs text-gray-500">Current</div>
          </div>
        </div>
      </div>
      
      <!-- Detailed Information (Expandable) -->
      <div v-if="isExpanded && showDetails" class="space-y-6">
        <!-- Employee Size Comparisons -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Size Context</h4>
          <div class="space-y-3">
            <!-- Industry Average -->
            <div v-if="industryAverageEmployees" class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Industry Average ({{ organization.industry }})</span>
              <span class="text-sm font-medium text-gray-900">
                {{ industryAverageEmployees.toLocaleString() }} employees
              </span>
            </div>
            
            <!-- Size Range -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">{{ organization.size }} Range</span>
              <span class="text-sm font-medium text-gray-900">
                {{ getSizeRange(organization.size) }}
              </span>
            </div>
            
            <!-- Percentile -->
            <div v-if="employeePercentile" class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Size Percentile</span>
              <span class="text-sm font-medium text-gray-900">
                {{ employeePercentile }}th percentile
              </span>
            </div>
          </div>
        </div>
        
        <!-- Employee Metrics -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Revenue per Employee -->
          <div v-if="revenuePerEmployee" class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center space-x-2 mb-2">
              <CurrencyDollarIcon class="h-5 w-5 text-green-600" />
              <h4 class="text-sm font-medium text-gray-900">Revenue per Employee</h4>
            </div>
            <div class="text-2xl font-bold text-green-600">
              {{ formatCurrency(revenuePerEmployee) }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ formatCurrency(organization.annual_revenue || 0) }} ÷ {{ displayEmployeeCount }} employees
            </div>
          </div>
          
          <!-- Founded Information -->
          <div v-if="organization.founded_year" class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center space-x-2 mb-2">
              <CalendarIcon class="h-5 w-5 text-blue-600" />
              <h4 class="text-sm font-medium text-gray-900">Company Age</h4>
            </div>
            <div class="text-2xl font-bold text-blue-600">
              {{ companyAge }} years
            </div>
            <div class="text-xs text-gray-500 mt-1">
              Founded in {{ organization.founded_year }}
            </div>
          </div>
        </div>
        
        <!-- Historical Data (if available) -->
        <div v-if="employeeHistory && employeeHistory.length > 0" class="border border-gray-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Employee History</h4>
          <div class="space-y-2">
            <div
              v-for="entry in employeeHistory"
              :key="entry.year"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-gray-600">{{ entry.year }}</span>
              <span class="font-medium text-gray-900">
                {{ entry.count.toLocaleString() }} employees
              </span>
            </div>
          </div>
        </div>
        
        <!-- Data Source and Last Updated -->
        <div class="text-xs text-gray-400 text-center pt-4 border-t border-gray-200">
          <div class="flex items-center justify-center space-x-4">
            <span>Last updated: {{ formatDate(organization.updated_at) }}</span>
            <span v-if="dataSource">Source: {{ dataSource }}</span>
          </div>
        </div>
      </div>
      
      <!-- No Employee Data -->
      <div v-if="!organization.employees_count" class="text-center py-8">
        <UsersIcon class="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-500 mb-2">Employee count not available</p>
        <p class="text-sm text-gray-400">
          Contact information or recent data needed to display employee metrics
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronDownIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'
import type { OrganizationDetailData, OrganizationSize } from '@/types/organizations'

/**
 * Employee Count Display Component
 * Comprehensive employee information and metrics display
 */

interface EmployeeGrowthData {
  currentCount: number
  previousCount: number
  trend: number // percentage change
}

interface EmployeeHistoryEntry {
  year: number
  count: number
}

interface Props {
  organization: OrganizationDetailData
  showDetails?: boolean
  showGrowthTrend?: boolean
  employeeGrowthData?: EmployeeGrowthData | null
  employeeHistory?: EmployeeHistoryEntry[]
  industryAverageEmployees?: number | null
  employeePercentile?: number | null
  dataSource?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  showGrowthTrend: false,
  employeeGrowthData: null,
  employeeHistory: () => [],
  industryAverageEmployees: null,
  employeePercentile: null,
  dataSource: null
})

// State
const isExpanded = ref(false)

// Computed properties
const displayEmployeeCount = computed(() => {
  if (!props.organization.employees_count) return 'N/A'
  return props.organization.employees_count.toLocaleString()
})

const employeeCountLabel = computed(() => {
  const count = props.organization.employees_count
  if (!count) return 'employees'
  return count === 1 ? 'employee' : 'employees'
})

const revenuePerEmployee = computed(() => {
  if (!props.organization.annual_revenue || !props.organization.employees_count) return null
  return props.organization.annual_revenue / props.organization.employees_count
})

const companyAge = computed(() => {
  if (!props.organization.founded_year) return null
  return new Date().getFullYear() - props.organization.founded_year
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const getSizeColor = (size: OrganizationSize | null): string => {
  if (!size) return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
  
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const sizeColors = {
    Startup: 'bg-purple-100 text-purple-800',
    Small: 'bg-blue-100 text-blue-800',
    Medium: 'bg-green-100 text-green-800',
    Large: 'bg-orange-100 text-orange-800',
    Enterprise: 'bg-red-100 text-red-800'
  }
  
  return `${baseClasses} ${sizeColors[size] || 'bg-gray-100 text-gray-800'}`
}

const getGrowthTrendClass = (trend: number): string => {
  const baseClasses = 'inline-flex items-center text-sm font-medium'
  if (trend > 0) return `${baseClasses} text-green-600`
  if (trend < 0) return `${baseClasses} text-red-600`
  return `${baseClasses} text-gray-600`
}

const getSizeRange = (size: OrganizationSize | null): string => {
  const ranges = {
    Startup: '1-10 employees',
    Small: '11-50 employees',
    Medium: '51-250 employees',
    Large: '251-1,000 employees',
    Enterprise: '1,000+ employees'
  }
  return ranges[size as keyof typeof ranges] || 'Range not specified'
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>