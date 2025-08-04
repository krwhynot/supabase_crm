/**
 * Principal Activity Tracking - Component Barrel Export
 * 
 * Provides clean imports for all principal-related components
 * Usage: import { PrincipalActionBar, PrincipalAnalyticsChart } from '@/components/principal'
 */

// ===============================
// CORE DASHBOARD COMPONENTS
// ===============================
export { default as PrincipalDashboard } from './PrincipalDashboard.vue'
export { default as PrincipalActionBar } from './PrincipalActionBar.vue'
export { default as PrincipalSelector } from './PrincipalSelector.vue'
export { default as PrincipalKPICards } from './PrincipalKPICards.vue'
export { default as PrincipalActivityTimeline } from './PrincipalActivityTimeline.vue'

// ===============================
// ANALYTICS COMPONENTS
// ===============================
export { default as PrincipalAnalyticsChart } from './PrincipalAnalyticsChart.vue'
export { default as PrincipalProductTable } from './PrincipalProductTable.vue'

// ===============================
// CHART SUB-COMPONENTS
// ===============================
export { default as EngagementTrendChart } from './charts/EngagementTrendChart.vue'
export { default as ActivityVolumeChart } from './charts/ActivityVolumeChart.vue'
export { default as ProductPerformanceChart } from './charts/ProductPerformanceChart.vue'
export { default as OpportunityPipelineChart } from './charts/OpportunityPipelineChart.vue'

// ===============================
// ACTION COMPONENTS
// ===============================
export { default as LogPrincipalInteractionButton } from './LogPrincipalInteractionButton.vue'
export { default as CreatePrincipalOpportunityButton } from './CreatePrincipalOpportunityButton.vue'
export { default as ManagePrincipalProductsButton } from './ManagePrincipalProductsButton.vue'

// ===============================
// INTEGRATION COMPONENTS
// ===============================
export { default as DistributorRelationshipTable } from './DistributorRelationshipTable.vue'
export { default as ProductPerformanceIndicator } from './ProductPerformanceIndicator.vue'
export { default as PrincipalOpportunityList } from './PrincipalOpportunityList.vue'
export { default as PrincipalInteractionList } from './PrincipalInteractionList.vue'

// ===============================
// TYPE EXPORTS
// ===============================
export type {
  PrincipalActivitySummary,
  PrincipalProductPerformance,
  PrincipalEngagementTrend,
  PrincipalDistributorRelationship
} from '@/services/principalActivityApi'

// ===============================
// COMPONENT USAGE EXAMPLES
// ===============================

/**
 * Example usage in a Principal Detail page:
 * 
 * <template>
 *   <div class="principal-detail">
 *     <!-- Action Bar -->
 *     <PrincipalActionBar
 *       :principal="principal"
 *       :context="'detail'"
 *       @interaction-logged="handleInteractionLogged"
 *       @opportunity-created="handleOpportunityCreated"
 *     />
 *     
 *     <!-- Analytics Chart -->
 *     <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
 *       <PrincipalAnalyticsChart
 *         :principal-id="principal.id"
 *         :time-range="timeRange"
 *         chart-type="engagement"
 *       />
 *       
 *       <PrincipalAnalyticsChart
 *         :principal-id="principal.id"
 *         :time-range="timeRange"
 *         chart-type="activity_volume"
 *       />
 *     </div>
 *     
 *     <!-- Product Performance Table -->
 *     <PrincipalProductTable
 *       :principal-id="principal.id"
 *       :loading="loadingProducts"
 *       view-mode="table"
 *       @manage-products="handleManageProducts"
 *     />
 *     
 *     <!-- Distributor Relationships -->
 *     <DistributorRelationshipTable
 *       :principal-id="principal.id"
 *       :show-hierarchy="true"
 *       @relationship-updated="handleRelationshipUpdated"
 *     />
 *   </div>
 * </template>
 * 
 * <script setup lang="ts">
 * import {
 *   PrincipalActionBar,
 *   PrincipalAnalyticsChart,
 *   PrincipalProductTable,
 *   DistributorRelationshipTable
 * } from '@/components/principal'
 * </script>
 */

/**
 * Example usage of individual chart components:
 * 
 * <template>
 *   <div class="charts-grid">
 *     <!-- Engagement Trend -->
 *     <div class="chart-container">
 *       <EngagementTrendChart
 *         :data="engagementData"
 *         :principal-name="principal.name"
 *         time-range="30d"
 *         :show-trend-line="true"
 *       />
 *     </div>
 *     
 *     <!-- Activity Volume -->
 *     <div class="chart-container">
 *       <ActivityVolumeChart
 *         :data="activityData"
 *         :principal-name="principal.name"
 *         time-range="30d"
 *       />
 *     </div>
 *     
 *     <!-- Product Performance -->
 *     <div class="chart-container">
 *       <ProductPerformanceChart
 *         :data="productPerformanceData"
 *         :principal-name="principal.name"
 *       />
 *     </div>
 *     
 *     <!-- Opportunity Pipeline -->
 *     <div class="chart-container">
 *       <OpportunityPipelineChart
 *         :data="pipelineData"
 *         :principal-name="principal.name"
 *       />
 *     </div>
 *   </div>
 * </template>
 * 
 * <script setup lang="ts">
 * import {
 *   EngagementTrendChart,
 *   ActivityVolumeChart,
 *   ProductPerformanceChart,
 *   OpportunityPipelineChart
 * } from '@/components/principal'
 * </script>
 */

/**
 * Example usage of Performance Indicator:
 * 
 * <template>
 *   <div class="performance-indicators">
 *     <!-- Large indicator with label -->
 *     <ProductPerformanceIndicator
 *       :score="85"
 *       size="lg"
 *       :show-label="true"
 *       :show-badge="true"
 *     />
 *     
 *     <!-- Small indicators in a list -->
 *     <div class="flex items-center space-x-2">
 *       <ProductPerformanceIndicator
 *         v-for="product in products"
 *         :key="product.id"
 *         :score="product.performance_score"
 *         size="sm"
 *         :show-label="false"
 *       />
 *     </div>
 *   </div>
 * </template>
 */