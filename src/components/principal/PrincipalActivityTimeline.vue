<!--
  Principal Activity Timeline - Chronological activity visualization
  Features: Interactive timeline, activity grouping, responsive design
-->
<template>
  <div class="principal-activity-timeline">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="flex space-x-3">
          <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!timelineData || timelineData.length === 0" class="text-center py-8">
      <ClockIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">No Activity Found</h3>
      <p class="mt-2 text-gray-600">
        No recent activities have been recorded for this principal.
      </p>
    </div>

    <!-- Timeline Content -->
    <div v-else class="flow-root">
      <ul class="-mb-8">
        <li
          v-for="(activity, index) in groupedActivities"
          :key="`${activity.activity_date}-${index}`"
          class="relative"
        >
          <!-- Timeline connector line -->
          <div
            v-if="index < groupedActivities.length - 1"
            class="absolute top-5 left-4 -ml-px h-full w-0.5 bg-gray-200"
          />
          
          <div class="relative flex items-start space-x-3">
            <!-- Activity Icon -->
            <div class="relative">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white"
                :class="getActivityIconBg(activity.activity_type)"
              >
                <component
                  :is="getActivityIcon(activity.activity_type)"
                  class="h-4 w-4"
                  :class="getActivityIconColor(activity.activity_type)"
                />
              </div>
              
              <!-- Activity count badge for grouped activities -->
              <div
                v-if="activity.activity_count && activity.activity_count > 1"
                class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
              >
                {{ activity.activity_count }}
              </div>
            </div>
            
            <!-- Activity Content -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <h4 class="text-sm font-medium text-gray-900">
                    {{ getActivityTitle(activity) }}
                  </h4>
                  <ActivityStatusBadge 
                    v-if="activity.timeline_rank"
                    :status="getEngagementImpactStatus(activity.timeline_rank)"
                    size="xs"
                  />
                </div>
                <time 
                  class="text-sm text-gray-500"
                  :datetime="activity.activity_date"
                >
                  {{ formatActivityDate(activity.activity_date) }}
                </time>
              </div>
              
              <!-- Activity Description -->
              <div class="mt-1">
                <p class="text-sm text-gray-600">
                  {{ getActivityDescription(activity) }}
                </p>
                
                <!-- Activity Metrics - Removed non-existent properties -->
                <!-- Note: interaction_rating, opportunity_value, and product_count are not part of PrincipalTimelineEntry interface -->
                
                <!-- Timeline Rank Impact -->
                <div v-if="activity.timeline_rank" class="mt-2">
                  <div class="flex items-center space-x-2">
                    <span class="text-xs font-medium text-gray-700">Timeline Rank:</span>
                    <div class="flex items-center">
                      <component
                        :is="getImpactIcon(activity.timeline_rank)"
                        class="h-3 w-3 mr-1"
                        :class="getImpactIconColor(activity.timeline_rank)"
                      />
                      <span 
                        class="text-xs font-medium"
                        :class="getImpactTextColor(activity.timeline_rank)"
                      >
                        {{ getImpactLabel(activity.timeline_rank) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Activity Details Expansion -->
              <div v-if="activity.activity_details && expandedActivities.includes(activity.activity_date)">
                <div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  {{ activity.activity_details }}
                </div>
              </div>
              
              <!-- Activity Actions -->
              <div class="mt-3 flex items-center space-x-3">
                <button
                  v-if="activity.activity_details"
                  @click="toggleActivityExpansion(activity.activity_date)"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {{ expandedActivities.includes(activity.activity_date) ? 'Show Less' : 'Show Details' }}
                </button>
                
                <button
                  v-if="canCreateFollowUp(activity)"
                  @click="createFollowUp(activity)"
                  class="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  Create Follow-up
                </button>
                
                <button
                  v-if="canViewRelated(activity)"
                  @click="viewRelated(activity)"
                  class="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  View {{ getRelatedType(activity) }}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Load More Button -->
    <div v-if="canLoadMore" class="mt-6 text-center">
      <button
        @click="loadMore"
        :disabled="loadingMore"
        class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <div v-if="loadingMore" class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
        {{ loadingMore ? 'Loading...' : 'Load More Activities' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ClockIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentIcon,
  TrophyIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'
// Solid icons - removed unused StarIconSolid
import type { PrincipalTimelineEntry } from '@/services/principalActivityApi'

// Component imports
import ActivityStatusBadge from './ActivityStatusBadge.vue'

// ===============================
// COMPONENT INTERFACE
// ===============================

interface Props {
  principalId: string
  timelineData?: PrincipalTimelineEntry[]
  loading?: boolean
  limit?: number
}

interface Emits {
  (e: 'create-follow-up', activity: PrincipalTimelineEntry): void
  (e: 'view-related', activity: PrincipalTimelineEntry, type: string): void
  (e: 'load-more'): void
}

const props = withDefaults(defineProps<Props>(), {
  timelineData: () => [],
  loading: false,
  limit: 20
})

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const expandedActivities = ref<string[]>([])
const loadingMore = ref(false)
const canLoadMore = ref(true)

// ===============================
// COMPUTED PROPERTIES
// ===============================

const groupedActivities = computed(() => {
  if (!props.timelineData) return []
  
  // Group activities by date and type for better visual organization
  const grouped = new Map<string, PrincipalTimelineEntry & { activity_count?: number }>()
  
  props.timelineData.forEach(activity => {
    const key = `${activity.activity_date}-${activity.activity_type}`
    const existing = grouped.get(key)
    
    if (existing) {
      // Increment count for grouped activities
      existing.activity_count = (existing.activity_count || 1) + 1
      
      // Note: engagement_impact property doesn't exist on PrincipalTimelineEntry
      // This functionality has been removed as it's not part of the interface
    } else {
      grouped.set(key, { ...activity, activity_count: 1 })
    }
  })
  
  return Array.from(grouped.values()).sort((a, b) => 
    new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
  )
})

// ===============================
// ACTIVITY HELPERS
// ===============================

const getActivityIcon = (activityType: string) => {
  const iconMap: Record<string, any> = {
    'interaction': ChatBubbleLeftIcon,
    'phone_call': PhoneIcon,
    'email': EnvelopeIcon,
    'meeting': UserGroupIcon,
    'opportunity': TrophyIcon,
    'product_association': CubeIcon,
    'follow_up': CalendarIcon,
    'document': DocumentIcon,
    'default': ClockIcon
  }
  return iconMap[activityType] || iconMap.default
}

const getActivityIconBg = (activityType: string): string => {
  const bgMap: Record<string, string> = {
    'interaction': 'bg-blue-100',
    'phone_call': 'bg-green-100', 
    'email': 'bg-purple-100',
    'meeting': 'bg-orange-100',
    'opportunity': 'bg-yellow-100',
    'product_association': 'bg-indigo-100',
    'follow_up': 'bg-red-100',
    'document': 'bg-gray-100',
    'default': 'bg-gray-100'
  }
  return bgMap[activityType] || bgMap.default
}

const getActivityIconColor = (activityType: string): string => {
  const colorMap: Record<string, string> = {
    'interaction': 'text-blue-600',
    'phone_call': 'text-green-600',
    'email': 'text-purple-600', 
    'meeting': 'text-orange-600',
    'opportunity': 'text-yellow-600',
    'product_association': 'text-indigo-600',
    'follow_up': 'text-red-600',
    'document': 'text-gray-600',
    'default': 'text-gray-600'
  }
  return colorMap[activityType] || colorMap.default
}

const getActivityTitle = (activity: PrincipalTimelineEntry & { activity_count?: number }): string => {
  const titles: Record<string, string> = {
    'interaction': 'Interaction Logged',
    'phone_call': 'Phone Call',
    'email': 'Email Exchange',
    'meeting': 'Meeting Scheduled',
    'opportunity': 'Opportunity Created',
    'product_association': 'Product Associated',
    'follow_up': 'Follow-up Scheduled',
    'document': 'Document Shared'
  }
  
  const baseTitle = titles[activity.activity_type] || 'Activity'
  return activity.activity_count && activity.activity_count > 1 ? `${baseTitle} (${activity.activity_count})` : baseTitle
}

const getActivityDescription = (activity: PrincipalTimelineEntry & { activity_count?: number }): string => {
  // This would typically come from the activity details
  // For now, return a formatted description based on available data
  const descriptions: Record<string, string> = {
    'interaction': `Interaction recorded with ${activity.principal_name}`,
    'phone_call': `Phone call with ${activity.principal_name}`,
    'email': `Email correspondence with ${activity.principal_name}`,
    'meeting': `Meeting scheduled with ${activity.principal_name}`,
    'opportunity': `New opportunity created for ${activity.principal_name}`,
    'product_association': `Product associated with ${activity.principal_name}`,
    'follow_up': `Follow-up scheduled with ${activity.principal_name}`,
    'document': `Document shared with ${activity.principal_name}`
  }
  
  return descriptions[activity.activity_type] || `Activity with ${activity.principal_name}`
}


const getEngagementImpactStatus = (impact: string | number): 'ACTIVE' | 'MODERATE' | 'LOW' | 'NO_ACTIVITY' => {
  const impactValue = typeof impact === 'string' ? parseFloat(impact) : impact
  
  if (impactValue >= 75) return 'ACTIVE'
  if (impactValue >= 50) return 'MODERATE'  
  if (impactValue >= 25) return 'LOW'
  return 'NO_ACTIVITY'
}

const getImpactIcon = (impact: string | number) => {
  const impactValue = typeof impact === 'string' ? parseFloat(impact) : impact
  
  if (impactValue > 0) return ArrowTrendingUpIcon
  if (impactValue < 0) return ArrowTrendingDownIcon
  return MinusIcon
}

const getImpactIconColor = (impact: string | number): string => {
  const impactValue = typeof impact === 'string' ? parseFloat(impact) : impact
  
  if (impactValue > 0) return 'text-green-500'
  if (impactValue < 0) return 'text-red-500'
  return 'text-gray-400'
}

const getImpactTextColor = (impact: string | number): string => {
  const impactValue = typeof impact === 'string' ? parseFloat(impact) : impact
  
  if (impactValue > 0) return 'text-green-600'
  if (impactValue < 0) return 'text-red-600'
  return 'text-gray-500'
}

const getImpactLabel = (impact: string | number): string => {
  const impactValue = typeof impact === 'string' ? parseFloat(impact) : impact
  
  if (impactValue > 0) return `+${impactValue.toFixed(1)} points`
  if (impactValue < 0) return `${impactValue.toFixed(1)} points`
  return 'No impact'
}

const canCreateFollowUp = (activity: PrincipalTimelineEntry & { activity_count?: number }): boolean => {
  return ['interaction', 'phone_call', 'meeting'].includes(activity.activity_type)
}

const canViewRelated = (activity: PrincipalTimelineEntry & { activity_count?: number }): boolean => {
  return ['OPPORTUNITY_CREATED', 'PRODUCT_ASSOCIATION'].includes(activity.activity_type)
}

const getRelatedType = (activity: PrincipalTimelineEntry & { activity_count?: number }): string => {
  if (activity.activity_type === 'OPPORTUNITY_CREATED') return 'Opportunity'
  if (activity.activity_type === 'PRODUCT_ASSOCIATION') return 'Product'
  return 'Related Item'
}

// ===============================
// UTILITY FUNCTIONS  
// ===============================

const formatActivityDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}


// ===============================
// EVENT HANDLERS
// ===============================

const toggleActivityExpansion = (activityDate: string) => {
  const index = expandedActivities.value.indexOf(activityDate)
  if (index >= 0) {
    expandedActivities.value.splice(index, 1)
  } else {
    expandedActivities.value.push(activityDate)
  }
}

const createFollowUp = (activity: PrincipalTimelineEntry & { activity_count?: number }) => {
  emit('create-follow-up', activity)
}

const viewRelated = (activity: PrincipalTimelineEntry & { activity_count?: number }) => {
  const type = getRelatedType(activity)
  emit('view-related', activity, type)
}

const loadMore = async () => {
  loadingMore.value = true
  emit('load-more')
  
  // Simulate loading delay
  setTimeout(() => {
    loadingMore.value = false
  }, 1000)
}

// ===============================
// WATCHERS
// ===============================

watch(
  () => props.timelineData,
  (newData) => {
    // Update can load more based on data length
    canLoadMore.value = newData && newData.length >= props.limit
  }
)
</script>

<style scoped>
.principal-activity-timeline {
  /* Custom styles for timeline */
}

/* Timeline connector animation */
.timeline-connector {
  animation: drawLine 0.5s ease-out forwards;
}

@keyframes drawLine {
  from {
    height: 0;
  }
  to {
    height: 100%;
  }
}

/* Activity item entrance animation */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.principal-activity-timeline li {
  animation: slideInLeft 0.3s ease-out;
}

.principal-activity-timeline li:nth-child(2) {
  animation-delay: 0.1s;
}

.principal-activity-timeline li:nth-child(3) {
  animation-delay: 0.2s;
}

/* Hover effects */
.principal-activity-timeline li:hover {
  transform: translateX(4px);
  transition: transform 0.2s ease-out;
}

/* Accessibility improvements */
.principal-activity-timeline button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .principal-activity-timeline button {
    display: none;
  }
  
  .principal-activity-timeline .timeline-connector {
    border-color: #000 !important;
  }
}
</style>