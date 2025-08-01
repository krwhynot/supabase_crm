<template>
  <div class="space-y-1">
    <!-- Label -->
    <label
      :for="fieldId"
      :class="labelClasses"
    >
      {{ label }}
      <span v-if="required" class="text-danger ml-1" aria-label="required">*</span>
    </label>

    <!-- Description -->
    <p
      v-if="description"
      :id="descriptionId"
      class="text-sm text-gray-600"
    >
      {{ description }}
    </p>

    <!-- Principal Context Info -->
    <div
      v-if="selectedPrincipals.length > 0 && showPrincipalContext"
      class="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
    >
      <svg class="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        Showing products available to {{ selectedPrincipals.length }} selected principal{{ selectedPrincipals.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Product Select Field -->
    <div class="relative">
      <select
        :id="fieldId"
        :name="name"
        :disabled="disabled || isFiltering"
        :required="required"
        :value="modelValue"
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="hasError"
        :aria-required="required"
        :class="selectClasses"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <!-- Loading option -->
        <option
          v-if="isFiltering"
          value=""
          disabled
        >
          Loading products...
        </option>

        <!-- Placeholder option -->
        <option
          v-else-if="placeholder"
          value=""
          :disabled="required"
        >
          {{ placeholder }}
        </option>

        <!-- No principals selected state -->
        <option
          v-else-if="selectedPrincipals.length === 0"
          value=""
          disabled
        >
          Please select principals first
        </option>

        <!-- Product options grouped by category -->
        <template v-if="!isFiltering && availableProducts.length > 0">
          <optgroup
            v-for="category in productCategories"
            :key="category.name"
            :label="category.label"
          >
            <option
              v-for="product in category.products"
              :key="product.id"
              :value="product.id"
              :disabled="!product.is_active"
            >
              {{ product.name }}
              <template v-if="showProductDetails">
                - {{ product.category }} ({{ product.available_principals.length }} principal{{ product.available_principals.length !== 1 ? 's' : '' }})
              </template>
            </option>
          </optgroup>
        </template>

        <!-- Ungrouped products (fallback) -->
        <template v-else-if="!isFiltering && availableProducts.length > 0 && productCategories.length === 0">
          <option
            v-for="product in availableProducts"
            :key="product.id"
            :value="product.id"
            :disabled="!product.is_active"
          >
            {{ product.name }}
            <template v-if="showProductDetails">
              ({{ product.available_principals.length }} principal{{ product.available_principals.length !== 1 ? 's' : '' }})
            </template>
          </option>
        </template>
      </select>

      <!-- Custom dropdown arrow with loading spinner -->
      <div
        class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
        aria-hidden="true"
      >
        <!-- Loading Spinner -->
        <svg
          v-if="isFiltering"
          class="animate-spin h-4 w-4 text-primary-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>

        <!-- Regular Arrow -->
        <svg
          v-else
          class="h-4 w-4 text-gray-400"
          :class="{ 'text-red-500': hasError }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>

    <!-- Product Information Display -->
    <div
      v-if="selectedProduct && showProductInfo"
      class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md"
    >
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-blue-900">{{ selectedProduct.name }}</h4>
          <p v-if="selectedProduct.category" class="text-sm text-blue-700">
            Category: {{ selectedProduct.category }}
          </p>
          <p class="text-sm text-blue-700">
            Available to {{ selectedProduct.available_principals.length }} principal{{ selectedProduct.available_principals.length !== 1 ? 's' : '' }}
          </p>
          <div v-if="selectedProduct.description" class="mt-1">
            <p class="text-xs text-blue-600">{{ selectedProduct.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State Message -->
    <div
      v-if="!isFiltering && selectedPrincipals.length > 0 && availableProducts.length === 0"
      class="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md text-center"
    >
      <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8l-1 1m0 0l-1 1m1-1v4M6 5l1 1v4" />
      </svg>
      <p class="text-sm text-gray-600">
        No products available for the selected principals.
      </p>
      <p class="text-xs text-gray-500 mt-1">
        Try selecting different principals or contact your administrator.
      </p>
    </div>

    <!-- Product Count Summary -->
    <div
      v-if="!isFiltering && availableProducts.length > 0 && showProductCount"
      class="text-xs text-gray-500 mt-1"
    >
      {{ availableProducts.length }} product{{ availableProducts.length !== 1 ? 's' : '' }} available
      <template v-if="productCategories.length > 1">
        across {{ productCategories.length }} categories
      </template>
    </div>

    <!-- Error Message -->
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="text-sm text-danger flex items-center space-x-1"
    >
      <svg
        class="h-4 w-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ error }}</span>
    </p>

    <!-- Help Text -->
    <p
      v-if="helpText && !error"
      :id="helpTextId"
      class="text-sm text-gray-500"
    >
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { ProductOption } from '@/types/products'

/**
 * Props interface for ProductSelect component
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the field */
  label: string
  /** Currently selected product ID */
  modelValue: string
  /** Array of selected principal IDs to filter products */
  selectedPrincipals: string[]
  /** Validation error message */
  error?: string
  /** Placeholder text */
  placeholder?: string
  /** Field description for additional context */
  description?: string
  /** Help text shown when no error is present */
  helpText?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Show principal context info */
  showPrincipalContext?: boolean
  /** Show detailed product information */
  showProductInfo?: boolean
  /** Show product details in options */
  showProductDetails?: boolean
  /** Show product count summary */
  showProductCount?: boolean
  /** Custom CSS classes for the select */
  selectClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select a product...',
  showPrincipalContext: true,
  showProductInfo: true,
  showProductDetails: false,
  showProductCount: true
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: string]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent]
  'change': [event: Event]
  'product-selected': [productId: string, product: ProductOption | undefined]
  'products-filtered': [availableProducts: ProductOption[]]
}

const emit = defineEmits<Emits>()

// Store
const productStore = useProductStore()

// Reactive state
const isFocused = ref(false)
const isFiltering = ref(false)

/**
 * Computed properties for accessibility and styling
 */
const fieldId = computed(() => `product-select-${props.name}`)
const errorId = computed(() => `error-${props.name}`)
const descriptionId = computed(() => `desc-${props.name}`)
const helpTextId = computed(() => `help-${props.name}`)

const hasError = computed(() => !!props.error)

const ariaDescribedBy = computed(() => {
  const ids: string[] = []
  if (props.description) ids.push(descriptionId.value)
  if (props.error) ids.push(errorId.value)
  if (props.helpText && !props.error) ids.push(helpTextId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})

/**
 * Styling with state-aware classes
 */
const labelClasses = computed(() => {
  const base = 'block text-sm font-medium transition-colors duration-200'
  const stateClasses = hasError.value 
    ? 'text-red-700' 
    : isFocused.value 
      ? 'text-primary' 
      : 'text-gray-700'
  const disabledClasses = props.disabled ? 'opacity-60' : ''
  const customClasses = props.labelClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const selectClasses = computed(() => {
  const base = 'w-full px-3 py-2 pr-10 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent'
  
  let stateClasses = ''
  if (hasError.value) {
    stateClasses = 'border-red-500 bg-red-50 focus:ring-red-500 focus:bg-white'
  } else if (props.modelValue && props.modelValue !== '') {
    stateClasses = 'border-green-400 bg-green-50 focus:ring-primary-500 focus:bg-white'
  } else {
    stateClasses = isFocused.value
      ? 'border-primary-500 bg-white focus:ring-primary-500'
      : 'border-gray-300 bg-white hover:border-gray-400 focus:ring-primary-500'
  }
  
  const disabledClasses = props.disabled || isFiltering.value
    ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
    : 'cursor-pointer'
  
  const customClasses = props.selectClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

/**
 * Product filtering logic
 */
const availableProducts = computed(() => {
  if (props.selectedPrincipals.length === 0) {
    return []
  }
  
  return productStore.getProductsForPrincipals(props.selectedPrincipals)
})

const selectedProduct = computed(() => {
  if (!props.modelValue) return null
  return availableProducts.value.find(p => p.id === props.modelValue) || null
})

/**
 * Product categorization for optgroups
 */
const productCategories = computed(() => {
  const categories = new Map<string, ProductOption[]>()
  
  availableProducts.value.forEach(product => {
    const category = product.category || 'Other'
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(product)
  })
  
  // Convert to array and sort
  return Array.from(categories.entries())
    .map(([name, products]) => ({
      name,
      label: name,
      products: products.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => {
      // 'Other' category goes last
      if (a.name === 'Other' && b.name !== 'Other') return 1
      if (b.name === 'Other' && a.name !== 'Other') return -1
      return a.name.localeCompare(b.name)
    })
})

/**
 * Filter products when principals change
 */
const filterProducts = async (): Promise<void> => {
  if (props.selectedPrincipals.length === 0) {
    return
  }
  
  isFiltering.value = true
  
  try {
    await productStore.fetchProductsForPrincipals(props.selectedPrincipals)
    emit('products-filtered', availableProducts.value)
    
    // Clear selection if current product is not available for selected principals
    if (props.modelValue && !availableProducts.value.find(p => p.id === props.modelValue)) {
      emit('update:modelValue', '')
      emit('product-selected', '', undefined)
    }
  } catch (error) {
    console.error('Failed to filter products:', error)
  } finally {
    isFiltering.value = false
  }
}

/**
 * Event handlers
 */
const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  
  emit('update:modelValue', value)
  emit('change', event)
  
  // Emit product-specific event
  const product = availableProducts.value.find(p => p.id === value)
  emit('product-selected', value, product)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

/**
 * Watch for principal changes to filter products
 */
watch(
  () => props.selectedPrincipals,
  async (newPrincipals, oldPrincipals) => {
    // Only filter if principals actually changed
    if (JSON.stringify(newPrincipals) !== JSON.stringify(oldPrincipals)) {
      await filterProducts()
    }
  },
  { immediate: true, deep: true }
)

/**
 * Lifecycle hooks
 */
onMounted(async () => {
  // Initial product filtering if principals are already selected
  if (props.selectedPrincipals.length > 0) {
    await filterProducts()
  }
})

/**
 * Public methods for parent component interaction
 */
defineExpose({
  focus: () => {
    const select = document.getElementById(fieldId.value) as HTMLSelectElement
    select?.focus()
  },
  blur: () => {
    const select = document.getElementById(fieldId.value) as HTMLSelectElement
    select?.blur()
  },
  refresh: filterProducts,
  getSelectedProduct: () => selectedProduct.value,
  getAvailableProducts: () => availableProducts.value,
  isFiltering: () => isFiltering.value
})
</script>