# Contact Form - Technical Implementation Documentation

## 🧩 UI Elements Summary
• **First Name*** and **Last Name*** text fields with real-time validation
• **Searchable Organization*** dropdown with "Create New Organization" modal integration
• **Position*** dropdown with "Add New Position" modal for custom entries
• **Purchase Influence*** dropdown (High, Medium, Low, Unknown) with descriptive tooltips
• **Decision Authority*** dropdown (Decision Maker, Influencer, End User, Gatekeeper) with role descriptions
• **Preferred Principal Brands** multi-select dropdown for advocacy relationship management
• Optional contact details: phone, email, address fields with format validation
• Website URL field with protocol validation
• Account Manager assignment field
• Notes textarea with character counter
• Primary Contact checkbox for organization designation

## Overview
The Contact Form (`/src/components/forms/ContactForm.vue`) serves as the **primary entry point** for the Kitchen Pantry CRM system. It implements sophisticated Vue 3 Composition API patterns with TypeScript type safety, schema-driven validation, and advanced accessibility features.

## Technical Architecture

### Vue 3 Composition API Implementation
```typescript
// ContactForm.vue - Core component structure
<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ContactValidator, type ContactCreateForm } from '@/types/contacts'

// Form state management with reactive data
const formData = reactive<ContactFormData>({
  first_name: '',
  last_name: '',
  organization_id: '',
  position: '',
  purchase_influence: 'Unknown',
  decision_authority: 'End User',
  preferred_principals: [],
  // ... additional fields
})

// Real-time validation errors
const errors = reactive<Record<string, string>>({})

// Form submission state
const isSubmitting = ref(false)
const showCreateOrganization = ref(false)
const showAddPosition = ref(false)
</script>
```

### TypeScript Interface Architecture
```typescript
// Form data interface for v-model compatibility
interface ContactFormData {
  first_name: string
  last_name: string
  organization_id: string
  position: string
  purchase_influence: 'High' | 'Medium' | 'Low' | 'Unknown'
  decision_authority: 'Decision Maker' | 'Influencer' | 'End User' | 'Gatekeeper'
  preferred_principals: string[]
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
  website: string
  account_manager: string
  notes: string
  is_primary: boolean
}
```

## Form Field Implementation

### Required Fields (marked with *)

#### Name Fields with Validation
```typescript
// First Name and Last Name validation
const validateField = async (fieldName: string) => {
  if (fieldName === 'first_name' || fieldName === 'last_name') {
    const error = fieldValidators.requiredText(value as string, fieldName.replace('_', ' '))
    errors[fieldName] = error || ''
  }
}

// Validation rules from contacts.ts
first_name: yup
  .string()
  .required('First name is required')
  .min(1, 'First name cannot be empty')
  .max(100, 'First name must be less than 100 characters')
  .trim()
```

#### Searchable Organization Dropdown with Modal Integration
```vue
<!-- Organization field with create new functionality -->
<div class="flex">
  <div class="flex-1">
    <SelectField
      v-model="formData.organization_id"
      name="organization_id"
      label="Organization"
      :options="organizationOptions"
      required
      :error="errors.organization_id"
      placeholder="Search and select organization..."
      searchable
      @blur="validateField('organization_id')"
    />
  </div>
  <button
    type="button"
    @click="showCreateOrganization = true"
    class="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    <PlusIcon class="h-4 w-4" />
    <span class="ml-1 hidden sm:inline">New</span>
  </button>
</div>
```

#### Dynamic Position Dropdown with Custom Additions
```typescript
// Position options with dynamic additions
const positionOptions = ref<Array<{value: string, label: string}>>([
  ...POSITION_OPTIONS.map(pos => ({ value: pos, label: pos }))
])

// Handle position addition from modal
const handlePositionAdded = (position: string) => {
  positionOptions.value.push({ value: position, label: position })
  formData.position = position
  showAddPosition.value = false
}

// Default position options from types/contacts.ts
export const POSITION_OPTIONS = [
  'Executive Chef',
  'Manager', 
  'Buyer',
  'Owner',
  'F&B Director',
  'Kitchen Manager',
  'Assistant Manager',
  'Head Chef',
  'Sous Chef',
  'Food Service Director'
] as const
```

### Purchase Decision Information Fields

#### Purchase Influence with Descriptive Options
```typescript
// Purchase influence options with descriptions
const purchaseInfluenceOptions = PURCHASE_INFLUENCE_OPTIONS.map(influence => ({
  value: influence,
  label: influence,
  description: getInfluenceDescription(influence)
}))

function getInfluenceDescription(influence: string): string {
  switch (influence) {
    case 'High': return 'Significant decision-making power'
    case 'Medium': return 'Moderate influence on purchases'
    case 'Low': return 'Limited purchase decision impact'
    case 'Unknown': return 'Influence level needs assessment'
    default: return ''
  }
}
```

#### Decision Authority with Role Descriptions
```typescript
// Decision authority options with role descriptions
const decisionAuthorityOptions = DECISION_AUTHORITY_OPTIONS.map(authority => ({
  value: authority,
  label: authority,
  description: getAuthorityDescription(authority)
}))

function getAuthorityDescription(authority: string): string {
  switch (authority) {
    case 'Decision Maker': return 'Final approval authority'
    case 'Influencer': return 'Influences purchase decisions'
    case 'End User': return 'Uses the products/services'
    case 'Gatekeeper': return 'Controls access to decision makers'
    default: return ''
  }
}
```

### Principal Advocacy Multi-Select
```typescript
// Principal options from organizations filtered as Principal brands
const principalOptions = computed(() => {
  return organizationStore.organizations
    .filter(org => 
      org.name.toLowerCase().includes('principal') ||
      org.status === 'Partner' ||
      org.status === 'Vendor'
    )
    .map(org => ({
      value: org.id,
      label: org.name,
      subtitle: org.industry || undefined
    }))
})
```

## Modal Integration Patterns

### AddPositionModal Component
```vue
<!-- AddPositionModal.vue - Custom position creation -->
<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <form @submit.prevent="handleSubmit">
      <BaseInputField
        v-model="newPosition"
        name="position"
        label="Position Title"
        required
        :error="error"
        placeholder="e.g., F&B Director, Kitchen Manager"
        @blur="validatePosition"
      />
      <button type="submit" :disabled="!isFormValid">
        Add Position
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const handleSubmit = () => {
  if (isFormValid.value) {
    const formatted = newPosition.value
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    emit('added', formatted)
  }
}
</script>
```

### OrganizationCreateModal Component
```vue
<!-- OrganizationCreateModal.vue - Quick organization creation -->
<template>
  <form @submit.prevent="handleSubmit">
    <BaseInputField
      v-model="formData.name"
      name="name"
      label="Organization Name"
      required
      :error="errors.name"
      placeholder="Enter organization name"
    />
    
    <SelectField
      v-model="formData.type"
      name="type"
      label="Organization Type"
      :options="organizationTypeOptions"
      placeholder="Select type..."
    />
  </form>
</template>

<script setup lang="ts">
const handleSubmit = async () => {
  const organizationData: OrganizationInsert = {
    name: formData.name.trim(),
    industry: formData.industry.trim() || null,
    type: formData.type || null,
    status: 'Prospect'
  }

  const createdOrganization = await organizationStore.createOrganization(organizationData)
  emit('created', createdOrganization)
}
</script>
```

## Form Validation System

### Schema-Driven Validation with Yup
```typescript
// contacts.ts - Comprehensive validation schema
export const contactCreateSchema = yup.object({
  first_name: yup
    .string()
    .required('First name is required')
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  
  organization_id: yup
    .string()
    .required('Organization is required')
    .uuid('Organization ID must be valid'),
  
  email: yup
    .string()
    .nullable()
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .lowercase()
    .transform((value) => value === '' ? null : value),

  phone: yup
    .string()
    .nullable()
    .max(20, 'Phone number must be less than 20 characters')
    .matches(PHONE_REGEX, 'Please enter a valid phone number')
    .trim()
    .transform((value) => value === '' ? null : value),

  website: yup
    .string()
    .nullable()
    .matches(/^https?:\/\/[^\s]+$/, 'Website must be a valid URL starting with http:// or https://')
    .max(255, 'Website must be less than 255 characters')
    .trim()
    .transform((value) => value === '' ? null : value)
})
```

### Real-Time Field Validation
```typescript
// Real-time validation on blur events
const validateField = async (fieldName: string) => {
  const value = formData[fieldName as keyof ContactFormData]
  
  try {
    if (fieldName === 'email') {
      const error = fieldValidators.email(value as string)
      errors[fieldName] = error || ''
    } else if (fieldName === 'phone') {
      const error = fieldValidators.phone(value as string)
      errors[fieldName] = error || ''
    } else if (fieldName === 'website') {
      const error = fieldValidators.website(value as string)
      errors[fieldName] = error || ''
    }
  } catch (error) {
    errors[fieldName] = 'Validation error'
  }
}

// Field validation helpers
export const fieldValidators = {
  email: (value: string): string | null => {
    if (!value.trim()) return null // Optional field
    if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address'
    if (value.length > 255) return 'Email must be less than 255 characters'
    return null
  },

  phone: (value: string): string | null => {
    if (value && !PHONE_REGEX.test(value)) return 'Please enter a valid phone number'
    if (value && value.length > 50) return 'Phone number must be less than 50 characters'
    return null
  },

  website: (value: string): string | null => {
    if (value && !/^https?:\/\/[^\s]+$/.test(value)) return 'Website must be a valid URL starting with http:// or https://'
    if (value && value.length > 255) return 'Website must be less than 255 characters'
    return null
  }
}
```

## Principal Advocacy Relationship Management

### Contact Principals API Integration
```typescript
// contactPrincipalsApi.ts - Junction table management
class ContactPrincipalsApiService {
  async updateContactPrincipals(
    contactId: string, 
    principalIds: string[], 
    defaultAdvocacyLevel: 'High' | 'Medium' | 'Low' = 'Medium'
  ): Promise<ApiResponse<ContactPrincipal[]>> {
    try {
      // Delete existing relationships
      const { error: deleteError } = await supabase
        .from('contact_principals')
        .delete()
        .eq('contact_id', contactId)

      if (deleteError) throw deleteError

      // Create new relationships
      const advocacies: ContactPrincipalInsert[] = principalIds.map(principalId => ({
        contact_id: contactId,
        principal_id: principalId,
        advocacy_level: defaultAdvocacyLevel
      }))

      const { data, error } = await supabase
        .from('contact_principals')
        .insert(advocacies)
        .select()

      return { data: data || [], error: null, success: true }
    } catch (error) {
      return {
        data: null,
        error: 'Failed to update contact principals',
        success: false
      }
    }
  }
}
```

### Form Submission with Principal Relationships
```typescript
// Form submission with principal advocacy handling
const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    
    // Convert form data with nullable fields
    const convertedData: ContactCreateForm = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      organization_id: formData.organization_id,
      position: formData.position,
      purchase_influence: formData.purchase_influence,
      decision_authority: formData.decision_authority,
      preferred_principals: formData.preferred_principals,
      phone: formData.phone || null,
      email: formData.email || null,
      // ... additional fields
    }
    
    // Validate with schema
    const result = await ContactValidator.validateCreate(convertedData)
    
    if (!result.isValid) {
      result.errors.forEach(error => {
        errors[error.field] = error.message
      })
      return
    }

    // Include principal IDs for relationship handling
    const submitData = {
      ...result.data!,
      _principalIds: formData.preferred_principals
    }
    
    emit('submit', submitData)
    
  } catch (error) {
    console.error('Form validation error:', error)
  } finally {
    isSubmitting.value = false
  }
}
```

## Component Composition Architecture

### Base Form Components

#### BaseInputField.vue - Enhanced Input Component
```typescript
// BaseInputField.vue - Accessibility-first input component
interface Props {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search'
  modelValue: string | number
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  loading?: boolean
  showValidIcon?: boolean
  autocomplete?: AutocompleteType
}

// Computed accessibility attributes
const ariaDescribedBy = computed(() => {
  const ids: string[] = []
  if (props.description) ids.push(descriptionId.value)
  if (props.error) ids.push(errorId.value)
  if (props.helpText && !props.error) ids.push(helpTextId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})

// State-aware styling
const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent'
  const stateClasses = hasError.value
    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:bg-white'
    : 'border-gray-300 bg-white hover:border-gray-400 focus:ring-primary'
  return `${base} ${stateClasses}`.trim()
})
```

#### SelectField.vue - Advanced Select Component
```typescript
// SelectField.vue - Multi-option select with search and grouping
interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

// Support for both string arrays and object arrays
const isObjectOptions = computed(() => 
  props.options.length > 0 && typeof props.options[0] === 'object'
)

// Group options by group property
const groupedObjectOptions = computed((): SelectOptionGroup[] => {
  if (!isObjectOptions.value) return []
  
  const options = props.options as SelectOption[]
  const groups = new Map<string, SelectOption[]>()
  
  options.forEach(option => {
    const groupName = option.group || 'Options'
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }
    groups.get(groupName)!.push(option)
  })
  
  return Array.from(groups.entries()).map(([label, options]) => ({
    label,
    options
  }))
})
```

#### TextareaField.vue - Rich Textarea Component
```typescript
// TextareaField.vue - Enhanced textarea with character counting
interface Props {
  name: string
  label: string
  modelValue: string
  error?: string
  rows?: number
  maxlength?: number
  showCharacterCount?: boolean
  resizable?: boolean
}

// Character count with warning states
const characterCount = computed(() => props.modelValue?.length || 0)

const textareaClasses = computed(() => {
  const base = 'w-full px-3 py-2 border rounded-md transition-all duration-200 focus:outline-none focus:ring-2'
  const resizeClasses = props.resizable ? 'resize-y' : 'resize-none'
  const paddingClasses = (props.showCharacterCount && props.maxlength) ? 'pb-8' : ''
  
  return `${base} ${resizeClasses} ${paddingClasses}`.trim()
})
```

#### CheckboxField.vue - Custom Checkbox Component
```typescript
// CheckboxField.vue - Styled checkbox with indeterminate support
interface Props {
  name: string
  label: string
  modelValue: boolean | (string | number)[]
  checkboxValue?: string | number
  indeterminate?: boolean
}

// Handle both single checkboxes and checkbox groups
const isChecked = computed(() => {
  if (typeof props.modelValue === 'boolean') {
    return props.modelValue
  }
  
  if (Array.isArray(props.modelValue) && props.checkboxValue !== undefined) {
    return (props.modelValue as (string | number)[]).includes(props.checkboxValue)
  }
  
  return false
})
```

## Database Schema Integration

### Contact Table Structure
```sql
-- Enhanced contacts table with comprehensive fields
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    position VARCHAR(100) NOT NULL,
    purchase_influence VARCHAR(20) NOT NULL CHECK (purchase_influence IN ('High', 'Medium', 'Low', 'Unknown')),
    decision_authority VARCHAR(20) NOT NULL CHECK (decision_authority IN ('Decision Maker', 'Influencer', 'End User', 'Gatekeeper')),
    phone VARCHAR(20),
    email VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    website VARCHAR(255),
    account_manager VARCHAR(100),
    notes TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Contact Principal advocacy junction table
CREATE TABLE contact_principals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    principal_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    advocacy_level VARCHAR(20) DEFAULT 'Medium' CHECK (advocacy_level IN ('High', 'Medium', 'Low')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contact_id, principal_id)
);
```

### Database View for Contact List
```sql
-- Contact list view with organization and advocacy details
CREATE VIEW contact_list_view AS
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.first_name || ' ' || c.last_name AS full_name,
    c.organization_id,
    o.name AS organization_name,
    o.industry AS organization_industry,
    c.position,
    c.purchase_influence,
    c.decision_authority,
    c.phone,
    c.email,
    c.is_primary,
    c.created_at,
    c.updated_at,
    COUNT(cp.id) AS principal_advocacy_count,
    (SELECT COUNT(*) FROM contacts c2 WHERE c2.organization_id = c.organization_id) AS organization_contact_count
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
LEFT JOIN contact_principals cp ON c.id = cp.contact_id
GROUP BY c.id, o.name, o.industry;
```

## Form Accessibility Implementation

### WCAG 2.1 AA Compliance Features
```typescript
// Comprehensive accessibility attributes
const fieldId = computed(() => `field-${props.name}`)
const errorId = computed(() => `error-${props.name}`)
const descriptionId = computed(() => `desc-${props.name}`)

// ARIA attributes for screen readers
const ariaDescribedBy = computed(() => {
  const ids: string[] = []
  if (props.description) ids.push(descriptionId.value)
  if (props.error) ids.push(errorId.value)
  if (props.helpText && !props.error) ids.push(helpTextId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})

// Error announcements with role="alert"
<p
  v-if="error"
  :id="errorId"
  role="alert"
  class="text-sm text-danger flex items-center space-x-1"
>
  <svg class="h-4 w-4 flex-shrink-0" aria-hidden="true">
    <!-- Error icon -->
  </svg>
  <span>{{ error }}</span>
</p>
```

### Keyboard Navigation Support
```typescript
// Enhanced keyboard event handling
const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
  
  // Escape key to blur field
  if (event.key === 'Escape' && isFocused.value) {
    (event.target as HTMLInputElement).blur()
  }
  
  // Tab navigation support
  if (event.key === 'Tab') {
    // Allow default behavior for proper tab sequence
  }
}
```

## Performance Optimization

### Form State Management
```typescript
// Efficient reactive state with minimal re-renders
const formData = reactive<ContactFormData>({
  // Form fields initialized with proper defaults
})

// Computed validation state to prevent unnecessary validations
const isFormValid = computed(() => {
  const requiredFields = ['first_name', 'last_name', 'organization_id', 'position', 'purchase_influence', 'decision_authority']
  return requiredFields.every(field => formData[field as keyof ContactFormData]) && 
         Object.keys(errors).every(key => !errors[key])
})

// Debounced organization search to reduce API calls
const debouncedOrganizationSearch = debounce(async (searchTerm: string) => {
  if (searchTerm.length >= 2) {
    await organizationStore.searchOrganizations(searchTerm)
  }
}, 300)
```

### Lazy Loading and Code Splitting
```typescript
// Lazy load modal components
const OrganizationCreateModal = defineAsyncComponent(() => 
  import('../organizations/OrganizationCreateModal.vue')
)

const AddPositionModal = defineAsyncComponent(() => 
  import('./AddPositionModal.vue')
)
```

## Testing Implementation

### Component Testing with Playwright
```typescript
// contact-form.spec.ts - Comprehensive form testing
import { test, expect } from '@playwright/test'

test.describe('Contact Form', () => {
  test('should validate required fields', async ({ page }) => {
    await page.goto('/contacts/new')
    
    // Submit form without filling required fields
    await page.click('button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('[role="alert"]')).toContainText('First name is required')
    await expect(page.locator('[role="alert"]')).toContainText('Organization is required')
  })

  test('should create new organization from modal', async ({ page }) => {
    await page.goto('/contacts/new')
    
    // Click create organization button
    await page.click('button:has-text("New")')
    
    // Fill organization modal
    await page.fill('input[name="name"]', 'Test Restaurant')
    await page.selectOption('select[name="type"]', 'B2B')
    
    // Submit organization creation
    await page.click('button:has-text("Create Organization")')
    
    // Verify organization is selected in contact form
    await expect(page.locator('select[name="organization_id"]')).toHaveValue(/uuid-pattern/)
  })

  test('should handle principal advocacy multi-select', async ({ page }) => {
    await page.goto('/contacts/new')
    
    // Fill required fields
    await page.fill('input[name="first_name"]', 'John')
    await page.fill('input[name="last_name"]', 'Chef')
    
    // Select multiple principals
    await page.selectOption('select[name="preferred_principals"]', ['principal-1', 'principal-2'])
    
    // Verify multiple selections
    const selectedOptions = await page.locator('select[name="preferred_principals"] option:checked').count()
    expect(selectedOptions).toBe(2)
  })
})
```

## Integration Points

### CRM System Integration
- **Links to Organization Form**: When "Create New Organization" is clicked, opens `OrganizationCreateModal.vue` for seamless organization creation
- **Principal Activity Tracking**: Preferred Principal relationships feed into advocacy analysis and sales pipeline tracking
- **Dashboard Analytics**: Contact creation data populates dashboard metrics and organization relationship insights
- **Contact List View**: Integrates with contact list views through database views for optimized queries

### API Integration Flow
```typescript
// Form submission workflow integration
const handleContactSubmission = async (contactData: ContactCreateForm) => {
  try {
    // 1. Create contact record
    const contact = await contactsApi.createContact(contactData)
    
    // 2. Handle principal advocacy relationships
    if (contactData._principalIds?.length) {
      await contactPrincipalsApi.updateContactPrincipals(
        contact.id,
        contactData._principalIds,
        'Medium' // Default advocacy level
      )
    }
    
    // 3. Update organization analytics
    await organizationAnalyticsService.incrementContactCount(contactData.organization_id)
    
    // 4. Trigger dashboard refresh
    dashboardStore.refreshContactMetrics()
    
    // 5. Navigate to contact detail view
    router.push(`/contacts/${contact.id}`)
    
  } catch (error) {
    // Handle error with user feedback
    errorNotificationService.show('Failed to create contact', error.message)
  }
}
```

### Store Integration Pattern
```typescript
// ContactForm.vue integration with Pinia stores
import { useOrganizationStore } from '@/stores/organizationStore'
import { useContactStore } from '@/stores/contactStore'
import { useDashboardStore } from '@/stores/dashboardStore'

const organizationStore = useOrganizationStore()
const contactStore = useContactStore()
const dashboardStore = useDashboardStore()

// Load organizations on mount
onMounted(async () => {
  if (organizationStore.organizations.length === 0) {
    await organizationStore.fetchOrganizations()
  }
})

// Handle form submission with store updates
const handleSubmit = async () => {
  const result = await contactStore.createContact(validatedData)
  if (result.success) {
    dashboardStore.incrementContactCount()
    emit('contactCreated', result.data)
  }
}
```

## Business Context & Rules

### Contact-Centric Business Rules
- **Every contact must be linked to an organization** - The organization is the entity that makes purchases
- **Contacts are the advocates** - They influence their organization's purchase decisions for Principal products
- **Multiple contacts per organization** - Organizations can have multiple decision makers and influencers
- **Contact purchase influence** - Track each contact's ability to drive Principal product purchases
- **Principal product advocacy** - Contacts champion specific Principal products to their organization

### Data Quality & Validation Rules
- Contact name uniqueness within organization (enforced at database level)
- Organization must exist before contact can be added (foreign key constraint)
- Purchase influence level required for advocacy tracking
- Decision authority required for purchase decision mapping
- Email addresses validated with RFC 5322 compliant regex
- Phone numbers support international formats
- Website URLs must include protocol (http:// or https://)

### Migration Considerations
When migrating from Excel or other systems:
- Excel "Contacts" → `contacts` table
- Excel "Organizations (DropDown)" → `organization_id` (FK relationship)
- Excel "POSITION" → `position` (mapped to dropdown values)
- Position values mapped to standardized options or custom entries
- Email addresses validated for format compliance
- Full names split into `first_name` and `last_name` fields
- Principal relationships require junction table migration

## Form Usage Patterns

### Create New Contact Workflow
1. **Navigate** to `/contacts/new` or click "New Contact" button
2. **Fill required fields**: First Name, Last Name, Organization, Position
3. **Set decision info**: Purchase Influence and Decision Authority
4. **Optional organization creation**: Click "New" button if organization doesn't exist
5. **Optional position creation**: Click "Add" button for custom positions
6. **Select Principal advocacy**: Multi-select Principal brands contact advocates for
7. **Add contact details**: Phone, email, address, notes as needed
8. **Submit**: Form validates and creates contact with Principal relationships

### Edit Existing Contact Workflow
1. **Load contact data**: Form pre-populates with existing contact information
2. **Load Principal relationships**: Queries `contact_principals` table for advocacy data
3. **Modify fields**: All validation rules apply to changes
4. **Update Principal advocacy**: Changes trigger junction table updates
5. **Save changes**: Updates contact record and Principal relationships

### Error Handling & Recovery
```typescript
// Comprehensive error handling patterns
const handleSubmissionError = (errors: ValidationError[]) => {
  // Group errors by field for display
  const fieldErrors = errors.reduce((acc, error) => {
    acc[error.field] = error.message
    return acc
  }, {} as Record<string, string>)
  
  // Set field-specific errors for user feedback
  Object.assign(formErrors, fieldErrors)
  
  // Focus first error field for accessibility
  const firstErrorField = Object.keys(fieldErrors)[0]
  if (firstErrorField) {
    const element = document.getElementById(`field-${firstErrorField}`)
    element?.focus()
  }
  
  // Show global error notification
  if (errors.some(e => e.field === 'general')) {
    notificationStore.showError('Please correct the errors and try again')
  }
}
```

## Implementation File Structure

### Core Files
- `/src/components/forms/ContactForm.vue` - Main form component
- `/src/components/forms/AddPositionModal.vue` - Position creation modal
- `/src/components/organizations/OrganizationCreateModal.vue` - Organization creation modal
- `/src/types/contacts.ts` - TypeScript interfaces and validation schemas
- `/src/services/contactPrincipalsApi.ts` - Principal relationship API service

### Base Components
- `/src/components/forms/BaseInputField.vue` - Enhanced input component
- `/src/components/forms/SelectField.vue` - Advanced select component
- `/src/components/forms/TextareaField.vue` - Rich textarea component
- `/src/components/forms/CheckboxField.vue` - Custom checkbox component

### Database & Types
- `/src/types/database.types.ts` - Supabase-generated TypeScript types
- `/sql/17_contacts_enhanced_schema.sql` - Database schema definitions

### Usage Examples
```vue
<!-- ContactCreateView.vue - Basic usage -->
<template>
  <div class="max-w-4xl mx-auto py-8">
    <ContactForm
      @submit="handleContactCreate"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import ContactForm from '@/components/forms/ContactForm.vue'
import { useContactStore } from '@/stores/contactStore'
import { useRouter } from 'vue-router'

const contactStore = useContactStore()
const router = useRouter()

const handleContactCreate = async (contactData: ContactCreateForm) => {
  try {
    const contact = await contactStore.createContact(contactData)
    router.push(`/contacts/${contact.id}`)
  } catch (error) {
    console.error('Failed to create contact:', error)
  }
}

const handleCancel = () => {
  router.push('/contacts')
}
</script>
```

```vue
<!-- ContactEditView.vue - Edit mode usage -->
<template>
  <div class="max-w-4xl mx-auto py-8">
    <ContactForm
      :contact="contact"
      :is-editing="true"
      @submit="handleContactUpdate"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ContactForm from '@/components/forms/ContactForm.vue'
import { useContactStore } from '@/stores/contactStore'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const contactStore = useContactStore()
const contact = ref<Contact | null>(null)

onMounted(async () => {
  const contactId = route.params.id as string
  contact.value = await contactStore.fetchContact(contactId)
})

const handleContactUpdate = async (contactData: ContactUpdateForm) => {
  try {
    const updated = await contactStore.updateContact(contact.value!.id, contactData)
    router.push(`/contacts/${updated.id}`)
  } catch (error) {
    console.error('Failed to update contact:', error)
  }
}
</script>
```

## Advanced Features

### Form State Persistence
```typescript
// Auto-save draft functionality
import { useLocalStorage } from '@vueuse/core'

const draftData = useLocalStorage('contact-form-draft', () => ({}))

// Save draft on form changes
watch(formData, (newData) => {
  draftData.value = { ...newData, timestamp: Date.now() }
}, { deep: true, debounce: 1000 })

// Restore draft on component mount
onMounted(() => {
  if (draftData.value.timestamp && 
      Date.now() - draftData.value.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
    Object.assign(formData, draftData.value)
  }
})
```

### Bulk Operations Support
```typescript
// Support for bulk contact creation
interface BulkContactImport {
  contacts: ContactCreateForm[]
  skipDuplicates: boolean
  defaultPrincipalIds: string[]
}

const handleBulkImport = async (importData: BulkContactImport) => {
  const results = []
  
  for (const contactData of importData.contacts) {
    try {
      const contact = await contactStore.createContact({
        ...contactData,
        preferred_principals: importData.defaultPrincipalIds
      })
      results.push({ success: true, contact })
    } catch (error) {
      results.push({ success: false, error: error.message, data: contactData })
    }
  }
  
  return results
}
```

## Maintenance & Troubleshooting

### Common Issues
1. **Organization dropdown not loading**: Check `organizationStore.fetchOrganizations()` call
2. **Validation errors persisting**: Ensure `errors` reactive object is properly cleared
3. **Principal relationships not saving**: Verify `contactPrincipalsApi` service integration
4. **Modal not closing**: Check modal state refs (`showCreateOrganization`, `showAddPosition`)

### Debug Helpers
```typescript
// Debug mode for form development
const isDebugMode = import.meta.env.DEV

const debugFormState = () => {
  if (isDebugMode) {
    console.log('Form Data:', formData)
    console.log('Validation Errors:', errors)
    console.log('Is Form Valid:', isFormValid.value)
    console.log('Organization Options:', organizationOptions.value)
  }
}

// Add debug button in development
if (isDebugMode) {
  window.debugContactForm = debugFormState
}
```