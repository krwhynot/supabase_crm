<template>
  <div class="specifications-editor">
    <div class="flex items-center justify-between mb-4">
      <label class="block text-sm font-medium text-gray-700">
        {{ label }}
        <span v-if="required" class="text-red-500 ml-1">*</span>
      </label>
      <button
        type="button"
        @click="addSpecification"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <PlusIcon class="h-4 w-4 mr-1" />
        Add Specification
      </button>
    </div>

    <!-- Description -->
    <p v-if="description && !error" class="text-sm text-gray-500 mb-3">
      {{ description }}
    </p>

    <!-- Specifications List -->
    <div v-if="internalSpecifications.length > 0" class="space-y-3">
      <div
        v-for="(spec, index) in internalSpecifications"
        :key="spec.id"
        class="specification-item bg-gray-50 p-3 rounded-lg border border-gray-200"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <!-- Key Input -->
          <div>
            <label :for="`spec-key-${spec.id}`" class="block text-xs font-medium text-gray-600 mb-1">
              Specification Name
            </label>
            <input
              :id="`spec-key-${spec.id}`"
              v-model="spec.key"
              type="text"
              placeholder="e.g., Weight, Color, Material"
              :class="[
                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors duration-200',
                getKeyValidation(spec).error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              ]"
              @input="handleSpecificationChange"
              @blur="validateSpecification(spec)"
            />
            <p v-if="getKeyValidation(spec).error" class="mt-1 text-xs text-red-600">
              {{ getKeyValidation(spec).error }}
            </p>
          </div>

          <!-- Value Input -->
          <div>
            <label :for="`spec-value-${spec.id}`" class="block text-xs font-medium text-gray-600 mb-1">
              Value
            </label>
            <input
              :id="`spec-value-${spec.id}`"
              v-model="spec.value"
              type="text"
              placeholder="e.g., 500g, Blue, Cotton"
              :class="[
                'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors duration-200',
                getValueValidation(spec).error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              ]"
              @input="handleSpecificationChange"
              @blur="validateSpecification(spec)"
            />
            <p v-if="getValueValidation(spec).error" class="mt-1 text-xs text-red-600">
              {{ getValueValidation(spec).error }}
            </p>
          </div>
        </div>

        <!-- Specification Actions -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <!-- Unit Input (Optional) -->
            <div class="flex-1 max-w-32">
              <label :for="`spec-unit-${spec.id}`" class="block text-xs font-medium text-gray-600 mb-1">
                Unit (Optional)
              </label>
              <input
                :id="`spec-unit-${spec.id}`"
                disabled
                placeholder="Units not implemented"
                type="text"
                class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                @input="handleSpecificationChange"
              />
            </div>

            <!-- Required Toggle -->
            <div class="flex items-center space-x-2 mt-5">
              <input
                :id="`spec-required-${spec.id}`"
                type="checkbox"
                v-model="spec.isRequired"
                class="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                @change="handleSpecificationChange"
              />
              <label :for="`spec-required-${spec.id}`" class="text-xs text-gray-600">
                Required
              </label>
            </div>
          </div>

          <!-- Remove Button -->
          <button
            type="button"
            @click="removeSpecification(index)"
            class="inline-flex items-center p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
            :aria-label="`Remove specification ${spec.key || 'item'}`"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <DocumentTextIcon class="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <p class="text-sm text-gray-500 mb-3">No specifications added yet</p>
      <button
        type="button"
        @click="addSpecification"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <PlusIcon class="h-4 w-4 mr-2" />
        Add First Specification
      </button>
    </div>

    <!-- Specification Templates -->
    <div v-if="showTemplates && templates.length > 0" class="mt-4">
      <div class="text-sm font-medium text-gray-700 mb-2">Quick Add Templates:</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="template in templates"
          :key="template.name"
          type="button"
          @click="addSpecificationFromTemplate(template)"
          class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          {{ template.name }}
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-2 text-sm text-red-600" role="alert">
      {{ error }}
    </p>

    <!-- Guidelines -->
    <div v-if="showGuidelines" class="mt-4 p-3 bg-blue-50 rounded-lg">
      <div class="text-sm text-blue-800">
        <div class="font-medium mb-1">Specification Guidelines:</div>
        <ul class="text-xs space-y-1 text-blue-700">
          <li>• Use clear, descriptive names (Weight, Dimensions, Color)</li>
          <li>• Be specific with values (500g instead of "heavy")</li>
          <li>• Include units when relevant (kg, cm, %)</li>
          <li>• Mark critical specifications as required</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PlusIcon, TrashIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import type { ProductSpecification } from '@/types/productForm'

interface SpecificationTemplate {
  name: string
  key: string
  value?: string
  unit?: string
  required?: boolean
}

interface Props {
  modelValue: ProductSpecification[]
  label?: string
  required?: boolean
  description?: string
  error?: string
  showTemplates?: boolean
  showGuidelines?: boolean
  maxSpecifications?: number
  templates?: SpecificationTemplate[]
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Product Specifications',
  required: false,
  showTemplates: true,
  showGuidelines: true,
  maxSpecifications: 20,
  templates: () => [
    { name: 'Weight', key: 'Weight', unit: 'g', required: true },
    { name: 'Dimensions', key: 'Dimensions', unit: 'cm', required: false },
    { name: 'Color', key: 'Color', required: false },
    { name: 'Material', key: 'Material', required: false },
    { name: 'Expiry Date', key: 'Expiry Date', required: false },
    { name: 'Storage Temperature', key: 'Storage Temperature', unit: '°C', required: false }
  ]
})

interface Emits {
  'update:modelValue': [specifications: ProductSpecification[]]
  'specifications-changed': [specifications: ProductSpecification[]]
  'validation-changed': [isValid: boolean, errors: string[]]
}

const emit = defineEmits<Emits>()

// ===============================
// REACTIVE STATE
// ===============================

const internalSpecifications = ref<ProductSpecification[]>([...props.modelValue])
const validationErrors = ref<Record<string, { key?: string; value?: string }>>({})

// ===============================
// COMPUTED PROPERTIES
// ===============================

// const isValid = computed(() => { // Currently unused - validation logic
//   if (props.required && internalSpecifications.value.length === 0) {
//     return false
//   }
//   return internalSpecifications.value.every(spec => {
//     const keyValid = !getKeyValidation(spec).error
//     const valueValid = !getValueValidation(spec).error
//     return keyValid && valueValid
//   })
// })

// ===============================
// UTILITY FUNCTIONS
// ===============================

const generateSpecId = (): string => {
  return `spec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const getKeyValidation = (spec: ProductSpecification): { error?: string } => {
  if (!spec.key?.trim()) {
    return { error: 'Specification name is required' }
  }

  if (spec.key.length < 2) {
    return { error: 'Name must be at least 2 characters' }
  }

  if (spec.key.length > 50) {
    return { error: 'Name must be less than 50 characters' }
  }

  // Check for duplicates
  const duplicateCount = internalSpecifications.value.filter(s => 
    s.id !== spec.id && s.key?.toLowerCase().trim() === spec.key?.toLowerCase().trim()
  ).length

  if (duplicateCount > 0) {
    return { error: 'Specification name must be unique' }
  }

  return {}
}

const getValueValidation = (spec: ProductSpecification): { error?: string } => {
  if (spec.isRequired && !spec.value?.trim()) {
    return { error: 'Value is required for this specification' }
  }

  if (spec.value && spec.value.length > 200) {
    return { error: 'Value must be less than 200 characters' }
  }

  return {}
}

const validateSpecification = (spec: ProductSpecification) => {
  const keyError = getKeyValidation(spec).error
  const valueError = getValueValidation(spec).error

  if (keyError || valueError) {
    validationErrors.value[spec.id] = {
      key: keyError,
      value: valueError
    }
  } else {
    delete validationErrors.value[spec.id]
  }

  emitValidation()
}

const validateAllSpecifications = () => {
  internalSpecifications.value.forEach(spec => {
    validateSpecification(spec)
  })
}

const emitValidation = () => {
  const errors: string[] = []
  
  if (props.required && internalSpecifications.value.length === 0) {
    errors.push('At least one specification is required')
  }

  Object.values(validationErrors.value).forEach(error => {
    if (error.key) errors.push(error.key)
    if (error.value) errors.push(error.value)
  })

  emit('validation-changed', errors.length === 0, errors)
}

// ===============================
// EVENT HANDLERS
// ===============================

const addSpecification = () => {
  if (internalSpecifications.value.length >= props.maxSpecifications) {
    return
  }

  const newSpec: ProductSpecification = {
    id: generateSpecId(),
    key: '',
    value: '',
    isRequired: false
  }

  internalSpecifications.value.push(newSpec)
  handleSpecificationChange()
}

const removeSpecification = (index: number) => {
  const spec = internalSpecifications.value[index]
  if (spec) {
    delete validationErrors.value[spec.id]
    internalSpecifications.value.splice(index, 1)
    handleSpecificationChange()
    emitValidation()
  }
}

const addSpecificationFromTemplate = (template: SpecificationTemplate) => {
  if (internalSpecifications.value.length >= props.maxSpecifications) {
    return
  }

  const newSpec: ProductSpecification = {
    id: generateSpecId(),
    key: template.key,
    value: template.value || '',
    isRequired: template.required || false
  }

  internalSpecifications.value.push(newSpec)
  handleSpecificationChange()
}

const handleSpecificationChange = () => {
  emit('update:modelValue', [...internalSpecifications.value])
  emit('specifications-changed', [...internalSpecifications.value])
}

// ===============================
// WATCHERS
// ===============================

watch(() => props.modelValue, (newValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(internalSpecifications.value)) {
    internalSpecifications.value = [...newValue]
    validateAllSpecifications()
  }
}, { deep: true })

watch(internalSpecifications, () => {
  validateAllSpecifications()
}, { deep: true })

// Initial validation
validateAllSpecifications()
</script>

<style scoped>
.specifications-editor {
  @apply relative;
}

/* Specification item animations */
.specification-item {
  @apply transition-all duration-200 ease-in-out;
}

.specification-item:hover {
  @apply shadow-sm border-gray-300;
}

/* Add button animations */
.specifications-editor button {
  @apply transition-all duration-150 ease-in-out;
}

.specifications-editor button:hover {
  @apply transform scale-105;
}

.specifications-editor button:active {
  @apply transform scale-95;
}

/* Template button styles */
.template-button {
  @apply transition-colors duration-150 ease-in-out;
}

/* Empty state animation */
.empty-state {
  @apply transition-all duration-300 ease-in-out;
}

/* Specification enter/leave transitions */
.specification-enter-active,
.specification-leave-active {
  transition: all 0.3s ease-in-out;
}

.specification-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.specification-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Focus states */
.specifications-editor input:focus,
.specifications-editor button:focus {
  @apply outline-none ring-2;
}

/* Responsive design */
@media (max-width: 768px) {
  .specification-item .grid {
    @apply grid-cols-1 gap-2;
  }
  
  .specification-item .flex {
    @apply flex-col space-x-0 space-y-2;
  }
  
  .template-button {
    @apply w-full justify-center;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .specification-item {
    @apply border-2 border-gray-400;
  }
  
  .specifications-editor input:focus {
    @apply border-4;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .specifications-editor * {
    transition: none !important;
    animation: none !important;
  }
}

/* Print styles */
@media print {
  .specifications-editor button,
  .specifications-editor .guidelines {
    @apply hidden;
  }
  
  .specification-item {
    @apply border border-gray-400 p-2;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .specification-item {
    @apply bg-gray-800 border-gray-600;
  }
  
  .specifications-editor input {
    @apply bg-gray-700 border-gray-600 text-white;
  }
}

/* Loading state for async operations */
.specification-loading {
  @apply opacity-50 pointer-events-none;
}

.specification-loading::after {
  content: '';
  @apply absolute inset-0 bg-white bg-opacity-50 rounded-lg;
}

/* Validation states */
.specification-error {
  @apply border-red-300 bg-red-50;
}

.specification-valid {
  @apply border-green-300 bg-green-50;
}

/* Custom scrollbar for specification list */
.specifications-editor::-webkit-scrollbar {
  width: 8px;
}

.specifications-editor::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded;
}

.specifications-editor::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.specifications-editor::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}
</style>