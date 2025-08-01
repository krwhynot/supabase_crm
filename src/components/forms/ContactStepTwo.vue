<template>
  <!-- Two-Column Layout for Tablet+ Screens -->
  <div class="space-y-4 md:space-y-6">
    <!-- Required Authority Fields (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <!-- Purchase Influence (Required) -->
      <SelectField
        name="purchase_influence"
        label="Purchase Influence"
        :model-value="modelValue.purchase_influence || ''"
        :options="purchaseInfluenceOptions"
        :error="errors.purchase_influence"
        placeholder="Select purchase influence level"
        required
        @update:model-value="updateField('purchase_influence', $event)"
        @validate="validateField('purchase_influence', $event)"
      />

      <!-- Decision Authority (Required) -->
      <SelectField
        name="decision_authority"
        label="Decision Authority"
        :model-value="modelValue.decision_authority || ''"
        :options="decisionAuthorityOptions"
        :error="errors.decision_authority"
        placeholder="Select decision authority role"
        required
        @update:model-value="updateField('decision_authority', $event)"
        @validate="validateField('decision_authority', $event)"
      />
    </div>

    <!-- Preferred Principals (Optional - Full Width) -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        Preferred Principals
        <span class="text-xs text-gray-500 ml-2">(Optional)</span>
      </label>
      <PrincipalMultiSelector
        name="preferred_principals"
        :model-value="(modelValue.preferred_principals || []).filter((id): id is string => typeof id === 'string')"
        :error="errors.preferred_principals"
        placeholder="Select preferred principals..."
        allow-multiple
        @update:model-value="updateField('preferred_principals', $event)"
        @validate="validateField('preferred_principals', $event)"
      />
      <p class="text-xs text-gray-500 mt-1">
        Select the principals this contact prefers to work with or advocate for
      </p>
    </div>

    <!-- Authority & Influence Info Card -->
    <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
      <div class="flex items-start">
        <svg
          class="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0"
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
        <div>
          <h3 class="text-sm font-medium text-blue-800">Authority & Influence Guide</h3>
          <div class="mt-2 text-sm text-blue-700">
            <p class="mb-2"><strong>Purchase Influence</strong> indicates how much this contact can affect buying decisions:</p>
            <ul class="list-disc list-inside space-y-1 mb-3 ml-4">
              <li><strong>High:</strong> Can directly approve or reject purchases</li>
              <li><strong>Medium:</strong> Has significant input in purchase decisions</li>
              <li><strong>Low:</strong> Limited influence on purchase decisions</li>
              <li><strong>Unknown:</strong> Influence level not yet determined</li>
            </ul>
            <p class="mb-2"><strong>Decision Authority</strong> defines their role in the decision process:</p>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>Decision Maker:</strong> Final authority on purchases</li>
              <li><strong>Influencer:</strong> Can sway decisions but doesn't have final say</li>
              <li><strong>End User:</strong> Will use the product/service but may not decide</li>
              <li><strong>Gatekeeper:</strong> Controls access to decision makers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { contactStepTwoSchema, PURCHASE_INFLUENCE_OPTIONS, DECISION_AUTHORITY_OPTIONS } from '@/types/contacts'
import type { ContactCreateForm } from '@/types/contacts'
import SelectField from './SelectField.vue'
import PrincipalMultiSelector from './PrincipalMultiSelector.vue'

/**
 * Props interface
 */
interface Props {
  /** Form data */
  modelValue: Partial<ContactCreateForm>
  /** Validation errors */
  errors: Record<string, string>
  /** Loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

/**
 * Event emissions
 */
interface Emits {
  'update:modelValue': [value: Partial<ContactCreateForm>]
  'validate': [stepNumber: number, isValid: boolean, errors: Record<string, string>]
}

const emit = defineEmits<Emits>()

/**
 * Purchase influence options for contact dropdown
 */
const purchaseInfluenceOptions = PURCHASE_INFLUENCE_OPTIONS.map(influence => ({
  value: influence,
  label: influence,
  description: getInfluenceDescription(influence)
}))

/**
 * Decision authority options for contact dropdown
 */
const decisionAuthorityOptions = DECISION_AUTHORITY_OPTIONS.map(authority => ({
  value: authority,
  label: authority,
  description: getAuthorityDescription(authority)
}))

/**
 * Get description for influence level
 */
function getInfluenceDescription(influence: string): string {
  switch (influence) {
    case 'High': return 'Can directly approve or reject purchases'
    case 'Medium': return 'Has significant input in purchase decisions'
    case 'Low': return 'Limited influence on purchase decisions'
    case 'Unknown': return 'Influence level not yet determined'
    default: return 'Purchase influence level'
  }
}

/**
 * Get description for decision authority
 */
function getAuthorityDescription(authority: string): string {
  switch (authority) {
    case 'Decision Maker': return 'Final authority on purchases'
    case 'Influencer': return 'Can sway decisions but doesn\'t have final say'
    case 'End User': return 'Will use the product/service but may not decide'
    case 'Gatekeeper': return 'Controls access to decision makers'
    default: return 'Decision authority role'
  }
}

/**
 * Field update handlers
 */
const updateField = (field: keyof ContactCreateForm, value: any) => {
  const updatedData = { ...props.modelValue, [field]: value }
  emit('update:modelValue', updatedData)
}

/**
 * Validation handlers
 */
const validateField = async (_fieldName: string, _value: any) => {
  // Individual field validation will be handled by the parent component
  // This component focuses on UI and data binding
  await validateStep()
}

const validateStep = async () => {
  const errors: Record<string, string> = {}
  let isValid = true
  
  try {
    // Use step-specific schema for validation
    const stepData = {
      purchase_influence: props.modelValue.purchase_influence,
      decision_authority: props.modelValue.decision_authority,
      preferred_principals: props.modelValue.preferred_principals
    }
    
    await contactStepTwoSchema.validate(stepData, { abortEarly: false })
    
  } catch (error: any) {
    isValid = false
    if (error.inner) {
      error.inner.forEach((err: any) => {
        if (err.path) {
          errors[err.path] = err.message
        }
      })
    }
  }
  
  // Emit validation result
  emit('validate', 2, isValid, errors)
}

/**
 * Watch for changes to trigger validation
 */
watch(
  () => [
    props.modelValue.purchase_influence,
    props.modelValue.decision_authority,
    props.modelValue.preferred_principals
  ],
  async () => {
    await validateStep()
  },
  { immediate: true }
)

/**
 * Initial validation on mount
 */
onMounted(async () => {
  await validateStep()
})
</script>