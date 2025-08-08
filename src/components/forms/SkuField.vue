<template>
  <div class="sku-field">
    <label :for="`input-${name}`" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required && !autoGenerate" class="text-red-500 ml-1">*</span>
    </label>
    
    <!-- Auto-generation Toggle -->
    <div class="mb-3">
      <div class="flex items-center space-x-3">
        <input
          :id="`auto-generate-${name}`"
          type="checkbox"
          v-model="internalAutoGenerate"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          @change="handleAutoGenerateChange"
        />
        <label :for="`auto-generate-${name}`" class="text-sm text-gray-700">
          Auto-generate SKU based on product name and category
        </label>
      </div>
    </div>
    
    <!-- SKU Input -->
    <div class="relative">
      <input
        :id="`input-${name}`"
        v-model="internalValue"
        type="text"
        :required="required && !internalAutoGenerate"
        :disabled="internalAutoGenerate"
        :placeholder="getPlaceholder()"
        :class="inputClasses"
        :aria-invalid="!!error"
        :aria-describedby="getAriaDescribedBy()"
        @blur="handleBlur"
        @input="handleInput"
        @focus="handleFocus"
      />
      
      <!-- Auto-generate Indicator -->
      <div v-if="internalAutoGenerate" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <div class="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
          </svg>
          <span>Auto</span>
        </div>
      </div>
      
      <!-- Validation Status -->
      <div v-else-if="showValidationIcon && validationStatus !== 'idle'" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <CheckCircleIcon v-if="validationStatus === 'valid'" class="h-4 w-4 text-green-500" />
        <ExclamationCircleIcon v-else-if="validationStatus === 'invalid'" class="h-4 w-4 text-red-500" />
        <div v-else-if="validationStatus === 'checking'" class="animate-spin h-3 w-3 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
      </div>
    </div>
    
    <!-- SKU Generation Options -->
    <div v-if="internalAutoGenerate && showGenerationOptions" class="mt-3 p-3 bg-blue-50 rounded-md">
      <div class="text-sm font-medium text-blue-900 mb-2">SKU Generation Options</div>
      <div class="space-y-2">
        <!-- Prefix Option -->
        <div class="flex items-center space-x-3">
          <label class="text-sm text-blue-800 w-20">Prefix:</label>
          <input
            v-model="generationOptions.prefix"
            type="text"
            placeholder="PRD"
            class="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            maxlength="5"
            @input="handleOptionsChange"
          />
        </div>
        
        <!-- Include Date Code -->
        <div class="flex items-center space-x-3">
          <input
            :id="`date-code-${name}`"
            type="checkbox"
            v-model="generationOptions.includeDateCode"
            class="h-3 w-3 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
            @change="handleOptionsChange"
          />
          <label :for="`date-code-${name}`" class="text-sm text-blue-800">
            Include date code ({{ getCurrentDateCode() }})
          </label>
        </div>
        
        <!-- Custom Format -->
        <div class="text-xs text-blue-700">
          Format: {{ getPreviewFormat() }}
        </div>
      </div>
    </div>
    
    <!-- Generated SKU Preview -->
    <div v-if="internalAutoGenerate && generatedSku" class="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
      <div class="text-sm text-green-800">
        <span class="font-medium">Generated SKU:</span> 
        <code class="bg-white px-1 py-0.5 rounded text-green-900">{{ generatedSku }}</code>
      </div>
    </div>
    
    <!-- Manual SKU Guidelines -->
    <div v-if="!internalAutoGenerate && showGuidelines" class="mt-2 p-3 bg-gray-50 rounded-md">
      <div class="text-sm text-gray-700">
        <div class="font-medium mb-1">SKU Guidelines:</div>
        <ul class="text-xs space-y-1 text-gray-600">
          <li>• Use only letters, numbers, hyphens, and underscores</li>
          <li>• Keep it short but descriptive (3-20 characters)</li>
          <li>• Use consistent naming convention</li>
          <li>• Avoid special characters and spaces</li>
        </ul>
      </div>
    </div>
    
    <!-- Description -->
    <p
      v-if="description && !error"
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
    
    <!-- SKU Format Examples -->
    <div v-if="showExamples && !internalAutoGenerate" class="mt-2">
      <div class="text-xs text-gray-500 mb-1">Examples:</div>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="example in skuExamples"
          :key="example"
          class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200"
          @click="applySuggestion(example)"
        >
          {{ example }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { debounce } from 'lodash-es'
import type { ProductCategory } from '@/types/products'
import type { SkuGenerationOptions } from '@/types/productForm'

interface Props {
  name: string
  label: string
  modelValue: string
  autoGenerate: boolean
  productName?: string
  category?: ProductCategory | null
  error?: string
  required?: boolean
  placeholder?: string
  description?: string
  showValidationIcon?: boolean
  showGenerationOptions?: boolean
  showGuidelines?: boolean
  showExamples?: boolean
  maxLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  placeholder: 'Enter SKU...',
  showValidationIcon: true,
  showGenerationOptions: true,
  showGuidelines: true,
  showExamples: true,
  maxLength: 50
})

interface Emits {
  'update:modelValue': [value: string]
  'update:autoGenerate': [value: boolean]
  'sku-generated': [sku: string]
  'blur': [value: string]
  'validation-changed': [isValid: boolean, error?: string]
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const internalValue = ref(props.modelValue)
const internalAutoGenerate = ref(props.autoGenerate)
const validationStatus = ref<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
const validationError = ref<string | null>(null)
const generatedSku = ref<string>('')
const hasBeenBlurred = ref(false)

const generationOptions = ref<SkuGenerationOptions>({
  prefix: 'PRD',
  categoryCode: '',
  sequenceNumber: 1,
  includeDateCode: false,
  customFormat: ''
})

// ===============================
// COMPUTED PROPERTIES
// ===============================

const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200'
  const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500'
  const validClasses = validationStatus.value === 'valid' ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''
  const normalClasses = 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
  const disabledClasses = 'bg-gray-50 text-gray-500 cursor-not-allowed'
  
  if (internalAutoGenerate.value) {
    return `${base} ${disabledClasses}`
  } else if (props.error || validationError.value) {
    return `${base} ${errorClasses}`
  } else if (validationStatus.value === 'valid') {
    return `${base} ${validClasses}`
  } else {
    return `${base} ${normalClasses}`
  }
})

const skuExamples = computed(() => {
  const categoryCode = getCategoryCode(props.category)
  return [
    `${categoryCode}-001`,
    `PRD-${categoryCode}-001`,
    `${categoryCode}_PREMIUM`,
    `${categoryCode}-${getCurrentDateCode()}`,
    'CUSTOM-SKU-123'
  ]
})

// ===============================
// UTILITY FUNCTIONS
// ===============================

const getCategoryCode = (category: ProductCategory | null | undefined): string => {
  if (!category) return 'GEN'
  
  const codes: Record<ProductCategory, string> = {
    'Protein': 'PRO',
    'Sauce': 'SAU',
    'Seasoning': 'SEA',
    'Beverage': 'BEV',
    'Snack': 'SNK',
    'Frozen': 'FRZ',
    'Dairy': 'DAI',
    'Bakery': 'BAK',
    'Other': 'OTH'
  }
  
  return codes[category] || 'GEN'
}

const getCurrentDateCode = (): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return `${year}${month}`
}

const getPreviewFormat = (): string => {
  const parts = []
  
  if (generationOptions.value.prefix) {
    parts.push(generationOptions.value.prefix)
  }
  
  if (props.category) {
    parts.push(getCategoryCode(props.category))
  }
  
  if (generationOptions.value.includeDateCode) {
    parts.push(getCurrentDateCode())
  }
  
  parts.push('###') // Sequence number placeholder
  
  return parts.join('-')
}

const generateSku = async (): Promise<string> => {
  if (!internalAutoGenerate.value) return ''
  
  const parts = []
  
  // Add prefix if specified
  if (generationOptions.value.prefix) {
    parts.push(generationOptions.value.prefix.toUpperCase())
  }
  
  // Add category code
  if (props.category) {
    parts.push(getCategoryCode(props.category))
  }
  
  // Add date code if enabled
  if (generationOptions.value.includeDateCode) {
    parts.push(getCurrentDateCode())
  }
  
  // Generate sequence number (simulate checking for uniqueness)
  const sequenceNumber = await getNextSequenceNumber(parts.join('-'))
  parts.push(sequenceNumber.toString().padStart(3, '0'))
  
  return parts.join('-')
}

const getNextSequenceNumber = async (_baseCode: string): Promise<number> => {
  // Simulate API call to get next available sequence number
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Mock sequence number generation
  return Math.floor(Math.random() * 999) + 1
}

const validateSku = (sku: string): string | null => {
  if (internalAutoGenerate.value) return null
  
  if (props.required && !sku.trim()) {
    return 'SKU is required'
  }
  
  if (sku.length > props.maxLength) {
    return `SKU must be less than ${props.maxLength} characters`
  }
  
  if (!/^[A-Z0-9\-_]+$/i.test(sku)) {
    return 'SKU can only contain letters, numbers, hyphens, and underscores'
  }
  
  return null
}

const checkSkuUniqueness = async (sku: string): Promise<string | null> => {
  if (!sku.trim()) return null
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Mock uniqueness check
  const existingSkus = ['PRD-001', 'TEST-SKU', 'DEMO-123']
  if (existingSkus.some(existing => existing.toLowerCase() === sku.toLowerCase())) {
    return 'This SKU is already in use'
  }
  
  return null
}

const getPlaceholder = (): string => {
  if (internalAutoGenerate.value) {
    return generatedSku.value || 'SKU will be generated automatically...'
  }
  return props.placeholder
}

const getAriaDescribedBy = (): string | undefined => {
  const parts = []
  if (props.error) parts.push(`error-${props.name}`)
  if (props.description && !props.error) parts.push(`desc-${props.name}`)
  return parts.length > 0 ? parts.join(' ') : undefined
}

// ===============================
// EVENT HANDLERS
// ===============================

const handleAutoGenerateChange = async () => {
  emit('update:autoGenerate', internalAutoGenerate.value)
  
  if (internalAutoGenerate.value) {
    // Generate SKU when auto-generation is enabled
    await generateAndApplySku()
  } else {
    // Clear generated SKU when disabled
    generatedSku.value = ''
    internalValue.value = ''
    emit('update:modelValue', '')
  }
}

const handleInput = (event: Event) => {
  if (internalAutoGenerate.value) return
  
  const target = event.target as HTMLInputElement
  internalValue.value = target.value.toUpperCase() // Convert to uppercase
  emit('update:modelValue', target.value.toUpperCase())
  
  // Reset validation on input
  if (hasBeenBlurred.value) {
    validationStatus.value = 'idle'
    validationError.value = null
    debouncedValidation(target.value)
  }
}

const handleBlur = () => {
  hasBeenBlurred.value = true
  emit('blur', internalValue.value)
  
  if (!internalAutoGenerate.value) {
    performValidation(internalValue.value)
  }
}

const handleFocus = () => {
  // Optional focus handling
}

const handleOptionsChange = () => {
  if (internalAutoGenerate.value) {
    generateAndApplySku()
  }
}

const applySuggestion = (suggestion: string) => {
  if (internalAutoGenerate.value) return
  
  internalValue.value = suggestion
  emit('update:modelValue', suggestion)
  
  nextTick(() => {
    performValidation(suggestion)
  })
}

const generateAndApplySku = async () => {
  if (!internalAutoGenerate.value) return
  
  try {
    const newSku = await generateSku()
    generatedSku.value = newSku
    internalValue.value = newSku
    emit('update:modelValue', newSku)
    emit('sku-generated', newSku)
  } catch (error) {
    console.error('Failed to generate SKU:', error)
  }
}

const performValidation = async (value: string): Promise<void> => {
  if (internalAutoGenerate.value || !hasBeenBlurred.value) return
  
  validationStatus.value = 'checking'
  validationError.value = null
  
  // Format validation
  const formatError = validateSku(value)
  if (formatError) {
    validationStatus.value = 'invalid'
    validationError.value = formatError
    emit('validation-changed', false, formatError)
    return
  }
  
  // Uniqueness validation
  const uniquenessError = await checkSkuUniqueness(value)
  if (uniquenessError) {
    validationStatus.value = 'invalid'
    validationError.value = uniquenessError
    emit('validation-changed', false, uniquenessError)
    return
  }
  
  validationStatus.value = 'valid'
  emit('validation-changed', true)
}

// Debounced validation
const debouncedValidation = debounce(performValidation, 300)

// ===============================
// WATCHERS
// ===============================

watch(() => props.modelValue, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue
  }
})

watch(() => props.autoGenerate, (newValue) => {
  if (newValue !== internalAutoGenerate.value) {
    internalAutoGenerate.value = newValue
  }
})

// Watch for product name or category changes to regenerate SKU
watch([() => props.productName, () => props.category], () => {
  if (internalAutoGenerate.value) {
    generateAndApplySku()
  }
})

// Watch for error prop changes
watch(() => props.error, (newError) => {
  if (newError) {
    validationStatus.value = 'invalid'
    validationError.value = null
  } else if (!validationError.value) {
    validationStatus.value = 'idle'
  }
})
</script>

<style scoped>
.sku-field {
  @apply relative;
}

/* Loading animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Example button hover effect */
.sku-field .example-button {
  @apply transition-all duration-150 ease-in-out;
}

.sku-field .example-button:hover {
  @apply transform scale-105;
}

/* Generation options animations */
.generation-options-enter-active,
.generation-options-leave-active {
  transition: all 0.3s ease-in-out;
}

.generation-options-enter-from,
.generation-options-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.generation-options-enter-to,
.generation-options-leave-from {
  opacity: 1;
  max-height: 200px;
}

/* Responsive design */
@media (max-width: 640px) {
  .sku-field .generation-options .flex {
    @apply flex-col space-x-0 space-y-2;
  }
  
  .sku-field .examples {
    @apply flex-col gap-1;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .sku-field input,
  .sku-field .generation-options {
    @apply border-2;
  }
  
  .sku-field input:focus {
    @apply border-4;
  }
}

/* Print styles */
@media print {
  .sku-field .generation-options,
  .sku-field .guidelines,
  .sku-field .examples {
    @apply hidden;
  }
}
</style>