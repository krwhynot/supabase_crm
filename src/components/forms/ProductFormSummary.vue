<template>
  <div class="product-form-summary">
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Review Product Details</h3>
          <span class="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
            Step 4 of 4
          </span>
        </div>
        <p class="text-sm text-gray-600 mt-1">
          Review all information before {{ isEditing ? 'updating' : 'creating' }} the product
        </p>
      </div>

      <!-- Summary Content -->
      <div class="px-6 py-4 space-y-6">
        <!-- Basic Information -->
        <div class="summary-section">
          <h4 class="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <InformationCircleIcon class="h-4 w-4 mr-2 text-blue-500" />
            Basic Information
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="summary-item">
              <span class="label">Product Name</span>
              <span class="value">{{ formData.name || 'Not specified' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Category</span>
              <span class="value category-badge" v-if="formData.category">
                <span class="category-icon">{{ getCategoryIcon(formData.category) }}</span>
                {{ formData.category }}
              </span>
              <span v-else class="value text-gray-500">Not specified</span>
            </div>
            <div class="summary-item md:col-span-2">
              <span class="label">Description</span>
              <span class="value">{{ formData.description || 'No description provided' }}</span>
            </div>
          </div>
        </div>

        <!-- SKU and Status -->
        <div class="summary-section">
          <h4 class="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <DocumentIcon class="h-4 w-4 mr-2 text-green-500" />
            Product Identification
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="summary-item">
              <span class="label">SKU</span>
              <div class="flex items-center space-x-2">
                <code class="px-2 py-1 text-sm bg-gray-100 rounded font-mono">
                  {{ formData.sku || 'Auto-generated' }}
                </code>
                <span v-if="formData.autoGenerateSku" class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Auto-generated
                </span>
              </div>
            </div>
            <div class="summary-item">
              <span class="label">Status</span>
              <span :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                formData.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              ]">
                <span :class="[
                  'w-1.5 h-1.5 rounded-full mr-1.5',
                  formData.isActive ? 'bg-green-500' : 'bg-gray-500'
                ]"></span>
                {{ formData.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pricing Information -->
        <div class="summary-section">
          <h4 class="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <CurrencyDollarIcon class="h-4 w-4 mr-2 text-yellow-500" />
            Pricing & Details
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="summary-item">
              <span class="label">Unit Price</span>
              <span class="value font-semibold">
                {{ formData.unitPrice ? `$${formData.unitPrice.toFixed(2)} ${formData.currency}` : 'Not specified' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">Cost Price</span>
              <span class="value">
                {{ formData.costPrice ? `$${formData.costPrice.toFixed(2)} ${formData.currency}` : 'Not specified' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">Profit Margin</span>
              <span v-if="profitMargin !== null" class="value text-green-600 font-medium">
                {{ profitMargin }}%
              </span>
              <span v-else class="value text-gray-500">Not calculated</span>
            </div>
            <div class="summary-item">
              <span class="label">Unit of Measure</span>
              <span class="value">{{ formData.unitOfMeasure || 'Not specified' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Minimum Order</span>
              <span class="value">
                {{ formData.minimumOrderQuantity ? `${formData.minimumOrderQuantity} units` : 'Not specified' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">Lead Time</span>
              <span class="value">
                {{ formData.leadTimeDays ? `${formData.leadTimeDays} days` : 'Not specified' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Specifications -->
        <div v-if="formData.specifications.length > 0" class="summary-section">
          <h4 class="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <DocumentTextIcon class="h-4 w-4 mr-2 text-purple-500" />
            Specifications ({{ formData.specifications.length }})
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="spec in formData.specifications"
              :key="spec.id"
              class="spec-item bg-gray-50 p-3 rounded-md border border-gray-200"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-900">{{ spec.key }}</span>
                  <span v-if="spec.isRequired" class="ml-1 text-red-500 text-xs">*</span>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ spec.value }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Principal Assignment -->
        <div class="summary-section">
          <h4 class="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <UserGroupIcon class="h-4 w-4 mr-2 text-indigo-500" />
            Principal Assignment
          </h4>
          <div class="space-y-3">
            <div class="summary-item">
              <span class="label">Access Control</span>
              <span :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                formData.principalRequired
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              ]">
                {{ formData.principalRequired ? 'Principal Required' : 'Open Access' }}
              </span>
            </div>
            <div v-if="formData.selectedPrincipals.length > 0" class="summary-item">
              <span class="label">Assigned Principals ({{ formData.selectedPrincipals.length }})</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="principalId in formData.selectedPrincipals"
                  :key="principalId"
                  class="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-md"
                >
                  {{ getPrincipalName(principalId) }}
                </span>
              </div>
            </div>
            <div v-else-if="formData.principalRequired" class="summary-item">
              <span class="label text-amber-600">Warning</span>
              <span class="value text-amber-600">No principals assigned (product will be inaccessible)</span>
            </div>
          </div>
        </div>

        <!-- Additional Settings -->
        <div class="summary-section">
          <h4 class="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <CogIcon class="h-4 w-4 mr-2 text-gray-500" />
            Additional Settings
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="summary-item">
              <span class="label">Save as Draft</span>
              <span :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                formData.saveAsDraft
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              ]">
                {{ formData.saveAsDraft ? 'Draft Mode' : 'Publish Immediately' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="label">Terms Accepted</span>
              <span :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                formData.termsAccepted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              ]">
                {{ formData.termsAccepted ? 'Accepted' : 'Not Accepted' }}
              </span>
            </div>
            <div v-if="formData.notificationEmails.length > 0" class="summary-item md:col-span-2">
              <span class="label">Notification Emails</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="email in formData.notificationEmails"
                  :key="email"
                  class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
                >
                  {{ email }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-500">
            Last updated: {{ formatDate(new Date()) }}
          </div>
          <div class="flex items-center space-x-3">
            <button
              type="button"
              @click="$emit('edit-section', 'basic')"
              class="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Edit Details
            </button>
            <div class="text-xs text-gray-300">|</div>
            <button
              type="button"
              @click="$emit('save-draft')"
              class="text-sm font-medium text-gray-600 hover:text-gray-500"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Warnings -->
    <div v-if="validationWarnings.length > 0" class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div class="flex items-start">
        <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 class="text-sm font-medium text-yellow-800">Review Recommendations</h4>
          <ul class="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li v-for="warning in validationWarnings" :key="warning">
              {{ warning }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  InformationCircleIcon,
  DocumentIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CogIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import type { ProductFormWrapperData } from '@/types/productForm'
import type { ProductCategory } from '@/types/products'
import { CATEGORY_ICONS } from '@/types/products'

interface Props {
  formData: ProductFormWrapperData
  isEditing?: boolean
  principalNames?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
  principalNames: () => ({})
})

// interface Emits { // Currently unused
//   'edit-section': [section: string]
//   'save-draft': []
// }

// const emit = defineEmits<Emits>() // Currently unused

// ===============================
// COMPUTED PROPERTIES
// ===============================

const profitMargin = computed(() => {
  if (!props.formData.unitPrice || !props.formData.costPrice) return null
  if (props.formData.unitPrice === 0) return null
  
  const margin = ((props.formData.unitPrice - props.formData.costPrice) / props.formData.unitPrice) * 100
  return margin.toFixed(1)
})

const validationWarnings = computed(() => {
  const warnings: string[] = []
  
  if (!props.formData.description || props.formData.description.length < 20) {
    warnings.push('Consider adding a more detailed product description')
  }
  
  if (!props.formData.unitPrice && !props.formData.costPrice) {
    warnings.push('No pricing information provided - consider adding at least unit price')
  }
  
  if (props.formData.specifications.length === 0) {
    warnings.push('No specifications added - specifications help customers understand the product')
  }
  
  if (props.formData.principalRequired && props.formData.selectedPrincipals.length === 0) {
    warnings.push('Principal access is required but no principals are assigned')
  }
  
  if (!props.formData.termsAccepted) {
    warnings.push('Terms and conditions must be accepted to proceed')
  }
  
  return warnings
})

// ===============================
// UTILITY FUNCTIONS
// ===============================

const getCategoryIcon = (category: ProductCategory): string => {
  return CATEGORY_ICONS[category] || '📦'
}

const getPrincipalName = (principalId: string): string => {
  return props.principalNames[principalId] || `Principal ${principalId.slice(0, 8)}`
}

const formatDate = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.product-form-summary {
  @apply relative;
}

.summary-section {
  @apply pb-6 border-b border-gray-100 last:border-b-0 last:pb-0;
}

.summary-item {
  @apply flex flex-col space-y-1;
}

.summary-item .label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}

.summary-item .value {
  @apply text-sm text-gray-900;
}

.category-badge {
  @apply inline-flex items-center space-x-1;
}

.category-icon {
  @apply text-base;
}

.spec-item {
  @apply transition-colors duration-200 ease-in-out;
}

.spec-item:hover {
  @apply bg-gray-100 border-gray-300;
}

/* Summary card animation */
.summary-section {
  @apply transition-all duration-300 ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .product-form-summary .grid {
    @apply grid-cols-1;
  }
  
  .summary-item .value {
    @apply text-base;
  }
  
  .spec-item {
    @apply p-2;
  }
}

/* Print styles */
@media print {
  .product-form-summary button,
  .product-form-summary .border-t {
    @apply hidden;
  }
  
  .product-form-summary {
    @apply shadow-none border-none;
  }
  
  .summary-section {
    @apply page-break-inside-avoid;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .spec-item,
  .product-form-summary {
    @apply border-2 border-gray-600;
  }
  
  .summary-item .label {
    @apply text-black font-bold;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .product-form-summary {
    @apply bg-gray-800 border-gray-600 text-white;
  }
  
  .spec-item {
    @apply bg-gray-700 border-gray-600;
  }
  
  .summary-item .label {
    @apply text-gray-400;
  }
  
  .summary-item .value {
    @apply text-gray-100;
  }
}

/* Status badges */
.status-active {
  @apply bg-green-100 text-green-800;
}

.status-inactive {
  @apply bg-gray-100 text-gray-800;
}

.status-draft {
  @apply bg-yellow-100 text-yellow-800;
}

.status-published {
  @apply bg-green-100 text-green-800;
}

/* Validation warning styles */
.validation-warning {
  @apply transition-all duration-300 ease-in-out;
}

.validation-warning.show {
  @apply opacity-100 transform translate-y-0;
}

.validation-warning.hide {
  @apply opacity-0 transform -translate-y-2;
}

/* Loading states */
.loading {
  @apply opacity-50 pointer-events-none;
}

/* Focus states for accessibility */
.product-form-summary button:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* Animation for summary updates */
.summary-update-enter-active,
.summary-update-leave-active {
  transition: all 0.3s ease-in-out;
}

.summary-update-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.summary-update-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Code styling for SKU */
code {
  @apply font-mono text-sm;
}

/* Profit margin color coding */
.profit-positive {
  @apply text-green-600;
}

.profit-negative {
  @apply text-red-600;
}

.profit-break-even {
  @apply text-yellow-600;
}
</style>