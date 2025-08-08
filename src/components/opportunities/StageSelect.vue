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

    <!-- Stage Select Field -->
    <div class="relative">
      <select
        :id="fieldId"
        :name="name"
        :disabled="disabled"
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
        <!-- Placeholder option -->
        <option
          v-if="placeholder"
          value=""
          :disabled="required"
        >
          {{ placeholder }}
        </option>

        <!-- Stage options with progress indicators -->
        <option
          v-for="stage in stageOptions"
          :key="stage.value"
          :value="stage.value"
        >
          {{ stage.label }} {{ stage.progressIcon }}
        </option>
      </select>

      <!-- Custom dropdown arrow -->
      <div
        class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
        aria-hidden="true"
      >
        <svg
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

    <!-- Stage Visual Indicator -->
    <div
      v-if="modelValue && showStageIndicator"
      class="flex items-center space-x-2 mt-2"
    >
      <div
        :class="[
          'w-3 h-3 rounded-full',
          getStageColorClasses(modelValue).bg
        ]"
      />
      <span :class="['text-sm font-medium', getStageColorClasses(modelValue).text]">
        {{ getStageLabel(modelValue) }}
      </span>
      <span class="text-xs text-gray-500">
        ({{ getDefaultProbability(modelValue) }}% typical probability)
      </span>
    </div>

    <!-- Stage Progress Bar -->
    <div
      v-if="modelValue && showProgressBar"
      class="mt-2"
    >
      <div class="flex justify-between text-xs text-gray-600 mb-1">
        <span>Pipeline Progress</span>
        <span>{{ getStageProgress(modelValue) }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          :class="[
            'h-2 rounded-full transition-all duration-300',
            getStageColorClasses(modelValue).bg
          ]"
          :style="{ width: `${getStageProgress(modelValue)}%` }"
        />
      </div>
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
import { computed, ref } from 'vue'
import { 
  OpportunityStage,
  STAGE_DEFAULT_PROBABILITY 
} from '@/types/opportunities'

/**
 * Props interface for StageSelect component
 */
interface Props {
  /** Field name for form identification */
  name: string
  /** Visual label for the field */
  label: string
  /** Current selected stage */
  modelValue: OpportunityStage | ''
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
  /** Show visual stage indicator */
  showStageIndicator?: boolean
  /** Show progress bar */
  showProgressBar?: boolean
  /** Custom CSS classes for the select */
  selectClass?: string
  /** Custom CSS classes for the label */
  labelClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select opportunity stage...',
  showStageIndicator: true,
  showProgressBar: true
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: OpportunityStage | '']
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent] 
  'change': [event: Event]
  'stage-changed': [stage: OpportunityStage, probability: number]
}

const emit = defineEmits<Emits>()

// Reactive state
const isFocused = ref(false)

/**
 * Stage options with progress indicators
 */
const stageOptions = computed(() => [
  { 
    value: OpportunityStage.NEW_LEAD, 
    label: 'New Lead', 
    progressIcon: '🔍' 
  },
  { 
    value: OpportunityStage.INITIAL_OUTREACH, 
    label: 'Initial Outreach', 
    progressIcon: '📞' 
  },
  { 
    value: OpportunityStage.SAMPLE_VISIT_OFFERED, 
    label: 'Sample/Visit Offered', 
    progressIcon: '📦' 
  },
  { 
    value: OpportunityStage.AWAITING_RESPONSE, 
    label: 'Awaiting Response', 
    progressIcon: '⏳' 
  },
  { 
    value: OpportunityStage.FEEDBACK_LOGGED, 
    label: 'Feedback Logged', 
    progressIcon: '📝' 
  },
  { 
    value: OpportunityStage.DEMO_SCHEDULED, 
    label: 'Demo Scheduled', 
    progressIcon: '🗓️' 
  },
  { 
    value: OpportunityStage.CLOSED_WON, 
    label: 'Closed - Won', 
    progressIcon: '✅' 
  }
])

/**
 * Computed properties for accessibility and styling
 */
const fieldId = computed(() => `stage-select-${props.name}`)
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
  
  // State-specific styling with stage color integration
  let stateClasses = ''
  if (hasError.value) {
    stateClasses = 'border-red-500 bg-red-50 focus:ring-red-500 focus:bg-white'
  } else if (props.modelValue && props.modelValue !== '' as OpportunityStage) {
    const stageColors = getStageColorClasses(props.modelValue as OpportunityStage)
    stateClasses = `border-${stageColors.border} bg-${stageColors.bgLight} focus:ring-${stageColors.ring} focus:bg-white`
  } else {
    stateClasses = isFocused.value
      ? 'border-primary-500 bg-white focus:ring-primary-500'
      : 'border-gray-300 bg-white hover:border-gray-400 focus:ring-primary-500'
  }
  
  const disabledClasses = props.disabled 
    ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
    : 'cursor-pointer'
  
  const customClasses = props.selectClass || ''
  
  return `${base} ${stateClasses} ${disabledClasses} ${customClasses}`.trim()
})

/**
 * Stage utility functions
 */
const getStageLabel = (stage: OpportunityStage): string => {
  const option = stageOptions.value.find(opt => opt.value === stage)
  return option ? option.label : stage
}

const getStageColorClasses = (stage: OpportunityStage) => {
  const colorMap = {
    [OpportunityStage.NEW_LEAD]: {
      bg: 'bg-gray-500',
      bgLight: 'gray-50',
      text: 'text-gray-700',
      border: 'gray-400',
      ring: 'gray-500'
    },
    [OpportunityStage.INITIAL_OUTREACH]: {
      bg: 'bg-blue-500',
      bgLight: 'blue-50',
      text: 'text-blue-700',
      border: 'blue-400',
      ring: 'blue-500'
    },
    [OpportunityStage.SAMPLE_VISIT_OFFERED]: {
      bg: 'bg-yellow-500',
      bgLight: 'yellow-50',
      text: 'text-yellow-700',
      border: 'yellow-400',
      ring: 'yellow-500'
    },
    [OpportunityStage.AWAITING_RESPONSE]: {
      bg: 'bg-orange-500',
      bgLight: 'orange-50',
      text: 'text-orange-700',
      border: 'orange-400',
      ring: 'orange-500'
    },
    [OpportunityStage.FEEDBACK_LOGGED]: {
      bg: 'bg-purple-500',
      bgLight: 'purple-50',
      text: 'text-purple-700',
      border: 'purple-400',
      ring: 'purple-500'
    },
    [OpportunityStage.DEMO_SCHEDULED]: {
      bg: 'bg-green-500',
      bgLight: 'green-50',
      text: 'text-green-700',
      border: 'green-400',
      ring: 'green-500'
    },
    [OpportunityStage.CLOSED_WON]: {
      bg: 'bg-emerald-500',
      bgLight: 'emerald-50',
      text: 'text-emerald-700',
      border: 'emerald-400',
      ring: 'emerald-500'
    }
  }
  
  return colorMap[stage] || colorMap[OpportunityStage.NEW_LEAD]
}

const getDefaultProbability = (stage: OpportunityStage): number => {
  return STAGE_DEFAULT_PROBABILITY[stage] || 0
}

const getStageProgress = (stage: OpportunityStage): number => {
  const stageOrder = [
    OpportunityStage.NEW_LEAD,
    OpportunityStage.INITIAL_OUTREACH,
    OpportunityStage.SAMPLE_VISIT_OFFERED,
    OpportunityStage.AWAITING_RESPONSE,
    OpportunityStage.FEEDBACK_LOGGED,
    OpportunityStage.DEMO_SCHEDULED,
    OpportunityStage.CLOSED_WON
  ]
  
  const currentIndex = stageOrder.indexOf(stage)
  if (currentIndex === -1) return 0
  
  return Math.round(((currentIndex + 1) / stageOrder.length) * 100)
}

/**
 * Event handlers
 */
const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value as OpportunityStage | ''
  
  emit('update:modelValue', value)
  emit('change', event)
  
  // Emit stage-specific event with probability
  if (value && value !== '' as OpportunityStage) {
    const probability = getDefaultProbability(value as OpportunityStage)
    emit('stage-changed', value as OpportunityStage, probability)
  }
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
  getStageInfo: (stage: OpportunityStage) => ({
    label: getStageLabel(stage),
    colors: getStageColorClasses(stage),
    probability: getDefaultProbability(stage),
    progress: getStageProgress(stage)
  })
})
</script>