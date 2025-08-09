<template>
  <div class="category-select delight-category-select" ref="containerRef" :class="delightClasses">
    <label :for="`select-${name}`" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="relative">
      <select
        :id="`select-${name}`"
        v-model="internalValue"
        :required="required"
        :class="selectClasses"
        :aria-invalid="!!error"
        :aria-describedby="error ? `error-${name}` : description ? `desc-${name}` : undefined"
        @change="handleChange"
        @blur="handleBlur"
        @focus="() => setFieldFocus(true)"
      >
        <option value="">{{ placeholder }}</option>
        <option
          v-for="category in categoryOptions"
          :key="category.value"
          :value="category.value"
        >
          {{ showIcons ? category.icon + ' ' : '' }}{{ category.label }}
        </option>
      </select>
      
      <!-- Custom Dropdown Arrow -->
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDownIcon class="h-4 w-4 text-gray-400" />
      </div>
    </div>
    
    <!-- Delight Message -->
    <Transition
      enter-active-class="transition-all duration-400 ease-out"
      enter-from-class="opacity-0 transform translate-y-2 scale-95"
      enter-to-class="opacity-100 transform translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0 scale-100"
      leave-to-class="opacity-0 transform translate-y-2 scale-95"
    >
      <div v-if="currentMessage" class="mt-2 delight-message success">
        <span v-if="currentMessage.emoji" class="delight-message-emoji">{{ currentMessage.emoji }}</span>
        <div>
          <div class="font-medium">{{ currentMessage.title }}</div>
          <div class="text-sm opacity-90">{{ currentMessage.message }}</div>
        </div>
      </div>
    </Transition>

    <!-- Category Description -->
    <div v-if="selectedCategoryInfo && !error" class="mt-2 p-3 bg-gray-50 rounded-md delight-category-info">
      <div class="flex items-start space-x-2">
        <span class="text-lg">{{ selectedCategoryInfo.icon }}</span>
        <div>
          <div class="text-sm font-medium text-gray-900">{{ selectedCategoryInfo.label }}</div>
          <div class="text-sm text-gray-600">{{ selectedCategoryInfo.description }}</div>
          <div v-if="selectedCategoryInfo.examples" class="text-xs text-gray-500 mt-1">
            Examples: {{ selectedCategoryInfo.examples.join(', ') }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Description -->
    <p
      v-if="description && !error && !selectedCategoryInfo"
      :id="`desc-${name}`"
      class="mt-1 text-sm text-gray-500"
    >
      {{ description }}
    </p>
    
    <!-- Error Message -->
    <p
      v-if="error"
      :id="`error-${name}`"
      class="mt-1 text-sm text-red-600"
      role="alert"
    >
      {{ error }}
    </p>
    
    <!-- Category Statistics -->
    <div v-if="showStats && categoryStats" class="mt-3">
      <div class="text-xs text-gray-500">
        {{ categoryStats.productCount }} products in this category
        <span v-if="categoryStats.averagePrice">
          • Average price: ${{ categoryStats.averagePrice.toFixed(2) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { ProductCategory, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/products'
import { useCategorySelectDelight } from '@/composables/useFormDelight'

interface CategoryOption {
  value: ProductCategory
  label: string
  icon: string
  description: string
  examples: string[]
  color: string
}

interface CategoryStats {
  productCount: number
  averagePrice?: number
  popularProducts?: string[]
}

interface Props {
  name: string
  label: string
  modelValue: ProductCategory | null
  error?: string
  required?: boolean
  placeholder?: string
  description?: string
  showIcons?: boolean
  showStats?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  placeholder: 'Select a category...',
  showIcons: true,
  showStats: false,
  disabled: false
})

interface Emits {
  'update:modelValue': [value: ProductCategory | null]
  'category-changed': [category: ProductCategory | null, categoryInfo?: CategoryOption]
  'blur': []
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const containerRef = ref<HTMLElement>()
const internalValue = ref<ProductCategory | null>(props.modelValue)

// ===============================
// DELIGHT SYSTEM
// ===============================

const {
  currentMessage,
  delightClasses,
  celebrateCategoryChange,
  showValidationFeedback,
  updateCompletionScore,
  setFieldFocus
} = useCategorySelectDelight({ level: 'standard' })

// ===============================
// COMPUTED PROPERTIES
// ===============================

const selectClasses = computed(() => {
  const base = 'w-full pl-3 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 bg-white appearance-none'
  const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500'
  const normalClasses = 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
  const disabledClasses = 'bg-gray-50 text-gray-500 cursor-not-allowed'
  
  if (props.disabled) {
    return `${base} ${disabledClasses}`
  } else if (props.error) {
    return `${base} ${errorClasses}`
  } else {
    return `${base} ${normalClasses}`
  }
})

const categoryOptions = computed((): CategoryOption[] => {
  return Object.values(ProductCategory).map(category => ({
    value: category,
    label: category,
    icon: CATEGORY_ICONS[category],
    color: CATEGORY_COLORS[category],
    description: getCategoryDescription(category),
    examples: getCategoryExamples(category)
  }))
})

const selectedCategoryInfo = computed((): CategoryOption | null => {
  if (!internalValue.value) return null
  return categoryOptions.value.find(option => option.value === internalValue.value) || null
})

const categoryStats = computed((): CategoryStats | null => {
  if (!props.showStats || !internalValue.value) return null
  
  // Mock stats - in real implementation, this would come from a store or API
  return {
    productCount: Math.floor(Math.random() * 100) + 1,
    averagePrice: Math.random() * 100 + 10
  }
})

// ===============================
// UTILITY FUNCTIONS
// ===============================

function getCategoryDescription(category: ProductCategory): string {
  const descriptions: Record<ProductCategory, string> = {
    [ProductCategory.PROTEIN]: 'Meat, fish, poultry, and protein-rich products',
    [ProductCategory.SAUCE]: 'Condiments, sauces, dressings, and liquid seasonings',
    [ProductCategory.SEASONING]: 'Spices, herbs, seasoning blends, and dry flavorings',
    [ProductCategory.BEVERAGE]: 'Drinks, juices, sodas, alcoholic and non-alcoholic beverages',
    [ProductCategory.SNACK]: 'Ready-to-eat snacks, chips, crackers, and convenience foods',
    [ProductCategory.FROZEN]: 'Frozen foods, ice cream, and temperature-controlled products',
    [ProductCategory.DAIRY]: 'Milk, cheese, yogurt, and other dairy products',
    [ProductCategory.BAKERY]: 'Bread, pastries, baked goods, and bakery items',
    [ProductCategory.OTHER]: 'Products that don\'t fit into other categories'
  }
  return descriptions[category] || 'Category description not available'
}

function getCategoryExamples(category: ProductCategory): string[] {
  const examples: Record<ProductCategory, string[]> = {
    [ProductCategory.PROTEIN]: ['Chicken breast', 'Salmon fillet', 'Ground beef', 'Turkey'],
    [ProductCategory.SAUCE]: ['BBQ sauce', 'Hot sauce', 'Marinara', 'Ranch dressing'],
    [ProductCategory.SEASONING]: ['Black pepper', 'Garlic powder', 'Italian blend', 'Paprika'],
    [ProductCategory.BEVERAGE]: ['Orange juice', 'Craft beer', 'Energy drink', 'Sparkling water'],
    [ProductCategory.SNACK]: ['Potato chips', 'Trail mix', 'Granola bars', 'Crackers'],
    [ProductCategory.FROZEN]: ['Ice cream', 'Frozen pizza', 'Vegetables', 'Berries'],
    [ProductCategory.DAIRY]: ['Whole milk', 'Cheddar cheese', 'Greek yogurt', 'Butter'],
    [ProductCategory.BAKERY]: ['Sourdough bread', 'Croissants', 'Muffins', 'Bagels'],
    [ProductCategory.OTHER]: ['Kitchen tools', 'Packaging', 'Gift cards', 'Merchandise']
  }
  return examples[category] || []
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedValue = target.value as ProductCategory | ''
  const newValue = selectedValue || null
  
  internalValue.value = newValue
  emit('update:modelValue', newValue)
  
  if (newValue) {
    const categoryInfo = categoryOptions.value.find(option => option.value === newValue)
    emit('category-changed', newValue, categoryInfo)
    
    // Celebrate category selection with delight
    if (containerRef.value) {
      await nextTick()
      target.classList.add('category-selected')
      await celebrateCategoryChange(containerRef.value, newValue)
      
      // Remove the class after animation
      setTimeout(() => {
        target.classList.remove('category-selected')
      }, 600)
    }
    
    updateCompletionScore(100)
  } else {
    emit('category-changed', null)
    updateCompletionScore(0)
  }
}

const handleBlur = async () => {
  setFieldFocus(false)
  emit('blur')
  
  // Validate on blur
  if (containerRef.value) {
    const isValid = !!internalValue.value || !props.required
    const error = !isValid ? 'Category selection is required' : undefined
    await showValidationFeedback(containerRef.value, isValid, error, 'Category')
  }
}

// ===============================
// WATCHERS
// ===============================

// Watch for external prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue
  }
})
</script>

<style scoped>
.category-select {
  @apply relative;
}

/* Custom select styling */
.category-select select {
  background-image: none;
}

.category-select select:disabled {
  @apply opacity-60;
}

/* Category info card animations */
.category-select .category-info {
  @apply transition-all duration-200 ease-in-out;
}

.category-select .category-info.show {
  @apply opacity-100 transform translate-y-0;
}

.category-select .category-info.hide {
  @apply opacity-0 transform -translate-y-1;
}

/* Focus styles */
.category-select select:focus {
  @apply outline-none ring-2;
}

/* Responsive design */
@media (max-width: 640px) {
  .category-select .category-info {
    @apply p-2;
  }
  
  .category-select .category-info .flex {
    @apply flex-col space-x-0 space-y-2;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .category-select select {
    @apply border-2;
  }
  
  .category-select select:focus {
    @apply border-4;
  }
  
  .category-select .category-info {
    @apply border border-gray-400;
  }
}

/* Print styles */
@media print {
  .category-select .category-info {
    @apply hidden;
  }
}

/* Dark mode support (if needed) */
@media (prefers-color-scheme: dark) {
  .category-select select {
    @apply bg-gray-800 text-white border-gray-600;
  }
  
  .category-select .category-info {
    @apply bg-gray-800 text-white border-gray-600;
  }
}

/* Animation for category change */
.category-change-transition {
  transition: all 0.3s ease-in-out;
}

.category-change-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.category-change-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.category-change-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.category-change-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>