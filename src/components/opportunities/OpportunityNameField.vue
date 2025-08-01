<template>
  <div class="space-y-3">
    <!-- Field Label -->
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

    <!-- Auto-generate Toggle -->
    <div class="flex items-center space-x-3">
      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          :checked="autoGenerate"
          @change="handleAutoGenerateToggle"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <span class="text-sm text-gray-700">Auto-generate opportunity name</span>
      </label>
      
      <!-- Auto-generate info icon -->
      <div class="relative group">
        <svg
          class="h-4 w-4 text-gray-400 cursor-help"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        
        <!-- Tooltip -->
        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Names follow pattern: Organization - Principal - Context - Month Year
        </div>
      </div>
    </div>

    <!-- Live Preview (shown when auto-generate is enabled) -->
    <div
      v-if="autoGenerate && previewName"
      class="bg-blue-50 border border-blue-200 rounded-md p-3"
    >
      <div class="flex items-start space-x-2">
        <svg
          class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-blue-900">Generated Name Preview:</p>
          <p class="text-sm text-blue-700 font-mono mt-1">{{ previewName }}</p>
          <p v-if="nameTemplate" class="text-xs text-blue-600 mt-1">
            Template: <span class="font-mono">{{ nameTemplate }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Multiple Preview Names (for batch creation) -->
    <div
      v-if="autoGenerate && previewNames && previewNames.length > 1"
      class="bg-green-50 border border-green-200 rounded-md p-3"
    >
      <div class="flex items-start space-x-2">
        <svg
          class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-green-900">
            Batch Creation Preview ({{ previewNames.length }} opportunities):
          </p>
          <div class="mt-2 space-y-1 max-h-32 overflow-y-auto">
            <div
              v-for="preview in previewNames.slice(0, maxPreviewDisplay)"
              :key="preview.principal_id"
              class="text-xs font-mono text-green-700 bg-white bg-opacity-50 rounded px-2 py-1"
            >
              {{ preview.generated_name }}
            </div>
            <p
              v-if="previewNames.length > maxPreviewDisplay"
              class="text-xs text-green-600 italic"
            >
              ... and {{ previewNames.length - maxPreviewDisplay }} more
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual Input Field (shown when auto-generate is disabled) -->
    <div
      v-if="!autoGenerate"
      class="relative"
    >
      <input
        :id="fieldId"
        type="text"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength"
        :value="modelValue"
        :aria-describedby="ariaDescribedBy"
        :aria-invalid="hasError"
        :aria-required="required"
        :class="inputClasses"
        @input="handleManualInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- Character count -->
      <div
        v-if="showCharacterCount && modelValue"
        class="absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <span
          class="text-xs text-gray-400"
          :class="{ 'text-red-500': modelValue.length > (maxlength || 255) }"
        >
          {{ modelValue.length }}{{ maxlength ? `/${maxlength}` : '' }}
        </span>
      </div>
    </div>

    <!-- Manual Override Button (when auto-generate is enabled) -->
    <div
      v-if="autoGenerate && !showManualOverride"
      class="flex justify-start"
    >
      <button
        type="button"
        @click="enableManualOverride"
        class="text-sm text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
      >
        Want to customize the name? Click to override
      </button>
    </div>

    <!-- Manual Override Input (when enabled) -->
    <div
      v-if="autoGenerate && showManualOverride"
      class="space-y-2"
    >
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700">Custom Name Override:</label>
        <button
          type="button"
          @click="disableManualOverride"
          class="text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          Cancel override
        </button>
      </div>
      
      <input
        :id="`${fieldId}-override`"
        type="text"
        :placeholder="previewName || 'Enter custom opportunity name...'"
        :value="manualOverride"
        :maxlength="maxlength"
        :class="overrideInputClasses"
        @input="handleOverrideInput"
        @blur="handleOverrideBlur"
      />
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
import { computed, ref, watch, nextTick } from 'vue'
import { opportunityNaming } from '@/services/opportunityNaming'
import type { 
  OpportunityNamePreview, 
  OpportunityContext 
} from '@/types/opportunities'

/**
 * Props interface for OpportunityNameField component
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the field */
  label: string
  /** Current field value */
  modelValue: string
  /** Auto-generation enabled state */
  autoGenerate: boolean
  /** Organization name for auto-generation */
  organizationName?: string
  /** Principal name for single opportunity */
  principalName?: string
  /** Principal data for batch opportunities */
  principalData?: Array<{ id: string; name: string }>
  /** Opportunity context */
  context?: OpportunityContext | null
  /** Custom context string */
  customContext?: string
  /** Validation error message */
  error?: string
  /** Placeholder text for manual input */
  placeholder?: string
  /** Field description */
  description?: string
  /** Help text */
  helpText?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Maximum character length */
  maxlength?: number
  /** Show character count */
  showCharacterCount?: boolean
  /** Maximum preview names to display */
  maxPreviewDisplay?: number
  /** Custom CSS classes for the input */
  inputClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter opportunity name...',
  maxlength: 255,
  showCharacterCount: true,
  maxPreviewDisplay: 5,
  helpText: 'Auto-generated names help maintain consistency across opportunities'
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: string]
  'update:autoGenerate': [value: boolean]
  'update:nameTemplate': [value: string | null]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent]
  'input': [event: Event]
  'name-generated': [name: string, template: string]
  'batch-names-generated': [previews: OpportunityNamePreview[]]
}

const emit = defineEmits<Emits>()

// Reactive state
const isFocused = ref(false)
const showManualOverride = ref(false)
const manualOverride = ref('')
const previewName = ref('')
const nameTemplate = ref<string | null>(null)
const previewNames = ref<OpportunityNamePreview[]>([])

/**
 * Computed properties for accessibility and styling
 */
const fieldId = computed(() => `name-field-${props.name}`)
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
      ? 'text-primary-600' 
      : 'text-gray-700'
  const disabledClasses = props.disabled ? 'opacity-60' : ''
  const customClasses = props.labelClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent'
  
  const stateClasses = hasError.value
    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:bg-white'
    : isFocused.value
      ? 'border-primary-500 bg-white focus:ring-primary-500'
      : 'border-gray-300 bg-white hover:border-gray-400 focus:ring-primary-500'
  
  const disabledClasses = props.disabled 
    ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
    : ''
  
  const paddingClasses = props.showCharacterCount && props.modelValue 
    ? 'pr-16' 
    : ''
  
  const customClasses = props.inputClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${paddingClasses} ${customClasses}`.trim()
})

const overrideInputClasses = computed(() => {
  return 'w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-amber-900 placeholder-amber-600'
})

/**
 * Name generation logic
 */
const generatePreviewName = () => {
  if (!props.autoGenerate || !props.organizationName) {
    previewName.value = ''
    nameTemplate.value = null
    return
  }

  if (props.principalName) {
    // Single opportunity preview
    const generated = opportunityNaming.generateOpportunityName({
      organization_name: props.organizationName,
      principal_name: props.principalName,
      context: props.context,
      custom_context: props.customContext
    })
    
    const template = opportunityNaming.generateNameTemplate({
      organization_name: props.organizationName,
      principal_name: props.principalName,
      context: props.context,
      custom_context: props.customContext
    })
    
    previewName.value = generated
    nameTemplate.value = template
    
    // Update model value if auto-generate is enabled and no manual override
    if (!showManualOverride.value) {
      emit('update:modelValue', generated)
      emit('update:nameTemplate', template)
      emit('name-generated', generated, template)
    }
  } else if (props.principalData && props.principalData.length > 0) {
    // Batch opportunity previews
    const previews = opportunityNaming.generateBatchNamePreviews({
      organization_name: props.organizationName,
      principal_data: props.principalData,
      context: props.context,
      custom_context: props.customContext
    })
    
    previewNames.value = previews
    
    // Set first preview as main preview
    if (previews.length > 0) {
      previewName.value = previews[0].generated_name
      nameTemplate.value = previews[0].name_template
    }
    
    emit('batch-names-generated', previews)
  }
}

/**
 * Event handlers
 */
const handleAutoGenerateToggle = (event: Event) => {
  const target = event.target as HTMLInputElement
  const enabled = target.checked
  
  emit('update:autoGenerate', enabled)
  
  if (enabled) {
    generatePreviewName()
    showManualOverride.value = false
    manualOverride.value = ''
  } else {
    previewName.value = ''
    nameTemplate.value = null
    previewNames.value = []
    emit('update:nameTemplate', null)
  }
}

const handleManualInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emit('input', event)
}

const handleOverrideInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  manualOverride.value = target.value
  emit('update:modelValue', target.value)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleOverrideBlur = (event: FocusEvent) => {
  // If override is empty, revert to generated name
  if (!manualOverride.value.trim() && previewName.value) {
    emit('update:modelValue', previewName.value)
  }
}

const enableManualOverride = () => {
  showManualOverride.value = true
  manualOverride.value = props.modelValue
  
  nextTick(() => {
    const overrideInput = document.getElementById(`${fieldId.value}-override`)
    overrideInput?.focus()
  })
}

const disableManualOverride = () => {
  showManualOverride.value = false
  manualOverride.value = ''
  
  // Revert to generated name
  if (previewName.value) {
    emit('update:modelValue', previewName.value)
  }
}

/**
 * Watchers for reactive updates
 */
watch(
  [
    () => props.autoGenerate,
    () => props.organizationName,
    () => props.principalName,
    () => props.principalData,
    () => props.context,
    () => props.customContext
  ],
  () => {
    if (props.autoGenerate) {
      generatePreviewName()
    }
  },
  { immediate: true }
)

/**
 * Public methods for parent component interaction
 */
defineExpose({
  focus: () => {
    const input = document.getElementById(fieldId.value) as HTMLInputElement
    input?.focus()
  },
  generateName: generatePreviewName,
  getPreviewNames: () => previewNames.value,
  getNameTemplate: () => nameTemplate.value
})
</script>