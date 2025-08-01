<template>
  <!-- Two-Column Layout for Tablet+ Screens -->
  <div class="space-y-4 md:space-y-6">
    <!-- Name Fields (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <!-- First Name (Required) -->
      <BaseInputField
        name="first_name"
        label="First Name"
        type="text"
        :model-value="modelValue.first_name || ''"
        :error="errors.first_name"
        placeholder="Enter first name"
        required
        autocomplete="given-name"
        @update:model-value="updateField('first_name', $event)"
        @validate="validateField('first_name', $event)"
      />

      <!-- Last Name (Required) -->
      <BaseInputField
        name="last_name"
        label="Last Name"
        type="text"
        :model-value="modelValue.last_name || ''"
        :error="errors.last_name"
        placeholder="Enter last name"
        required
        autocomplete="family-name"
        @update:model-value="updateField('last_name', $event)"
        @validate="validateField('last_name', $event)"
      />
    </div>

    <!-- Organization & Position (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <!-- Organization Selection (Required) -->
      <div class="space-y-2">
        <SelectField
          name="organization_id"
          label="Organization"
          :model-value="modelValue.organization_id || ''"
          :options="organizationOptions"
          :error="errors.organization_id"
          placeholder="Select an organization"
          searchable
          required
          @update:model-value="updateField('organization_id', $event)"
          @validate="validateField('organization_id', $event)"
        />
        <!-- Create New Organization Button -->
        <Button
          variant="secondary"
          size="sm"
          class="w-full"
          @click="showCreateOrganization = true"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Create New Organization
        </Button>
      </div>

      <!-- Position (Required with suggestions) -->
      <SelectField
        name="position"
        label="Position"
        :model-value="modelValue.position || ''"
        :options="positionOptions"
        :error="errors.position"
        placeholder="Select or enter position"
        allow-custom
        required
        @update:model-value="updateField('position', $event)"
        @validate="validateField('position', $event)"
      />
    </div>

    <!-- Contact Details (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <!-- Email Address -->
      <BaseInputField
        name="email"
        label="Email Address"
        type="email"
        :model-value="modelValue.email || ''"
        :error="errors.email"
        placeholder="contact@company.com"
        autocomplete="email"
        @update:model-value="updateField('email', $event)"
        @validate="validateField('email', $event)"
      />

      <!-- Phone Number -->
      <BaseInputField
        name="phone"
        label="Phone Number"
        type="tel"
        :model-value="modelValue.phone || ''"
        :error="errors.phone"
        placeholder="(555) 123-4567"
        autocomplete="tel"
        @update:model-value="updateField('phone', $event)"
        @validate="validateField('phone', $event)"
      />
    </div>

    <!-- Organization Creation Modal -->
    <OrganizationCreateModal
      v-if="showCreateOrganization"
      @close="showCreateOrganization = false"
      @success="handleOrganizationCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { contactStepOneSchema, POSITION_OPTIONS } from '@/types/contacts'
import type { ContactCreateForm } from '@/types/contacts'
import { useOrganizationStore } from '@/stores/organizationStore'
import BaseInputField from './BaseInputField.vue'
import SelectField from './SelectField.vue'
import Button from '@/components/atomic/Button.vue'
import OrganizationCreateModal from '@/components/modals/OrganizationCreateModal.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

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

// Dependencies
const organizationStore = useOrganizationStore()

// Component state
const showCreateOrganization = ref(false)

/**
 * Position options for contact dropdown
 */
const positionOptions = POSITION_OPTIONS.map(position => ({
  value: position,
  label: position,
  description: `${position} role`
}))

/**
 * Organization options (loaded from store)
 */
const organizationOptions = computed(() => {
  return organizationStore.organizations.map(org => ({
    value: org.id,
    label: org.name,
    description: org.industry || 'No industry specified'
  }))
})

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
      first_name: props.modelValue.first_name,
      last_name: props.modelValue.last_name,
      organization_id: props.modelValue.organization_id,
      position: props.modelValue.position,
      email: props.modelValue.email,
      phone: props.modelValue.phone
    }
    
    await contactStepOneSchema.validate(stepData, { abortEarly: false })
    
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
  emit('validate', 1, isValid, errors)
}

/**
 * Organization creation handler
 */
const handleOrganizationCreated = (organizationId: string) => {
  // Update the form with the newly created organization
  updateField('organization_id', organizationId)
  showCreateOrganization.value = false
  
  // Refresh organizations in store
  organizationStore.fetchOrganizations({ resetList: true })
}

/**
 * Watch for changes to trigger validation
 */
watch(
  () => [
    props.modelValue.first_name,
    props.modelValue.last_name,
    props.modelValue.organization_id,
    props.modelValue.position,
    props.modelValue.email,
    props.modelValue.phone
  ],
  async () => {
    await validateStep()
  },
  { immediate: true }
)

/**
 * Load organizations on mount
 */
onMounted(async () => {
  // Load organizations if not already loaded
  if (organizationStore.organizations.length === 0) {
    await organizationStore.fetchOrganizations({ resetList: true })
  }
  
  // Initial step validation
  await validateStep()
})
</script>