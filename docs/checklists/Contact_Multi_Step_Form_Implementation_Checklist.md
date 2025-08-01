# Contact Multi-Step Form Implementation Checklist
## Vertical Scaling Workflow for Vue 3 + Supabase CRM Application

---

## Overview

This checklist provides a systematic approach for implementing the multi-step Contact creation form following the established Vertical Scaling Workflow. The implementation emphasizes Contact as the central relational unit while maintaining Organizations as the reporting unit.

**Target Audience**: Small business CRM (5-10 users)  
**Development Approach**: Single developer, phased implementation  
**Timeline**: 4-6 hours for complete implementation  
**Complexity Level**: Medium (builds on proven OrganizationFormWrapper pattern)

---

## Pre-Development Planning

### 1. Feature Requirements Definition

**Business Requirements Checklist**:
- [ ] **User Story**: As a CRM user, I want to create new contacts through a multi-step form so I can efficiently capture contact information without overwhelming UI
- [ ] **Business Value**: Improves form completion rates and data quality through progressive disclosure design
- [ ] **Success Criteria**: 
  - [ ] All form steps fit iPad viewport (768x1024) without scrolling
  - [ ] Form completion rate improves by 25% over single-page form
  - [ ] Contact creation time reduces by 30% through better UX
  - [ ] Zero accessibility violations (WCAG 2.1 AA compliance)
- [ ] **Priority Level**: High (Core CRM functionality enhancement)

**Contact-Centric Architecture Requirements**:
- [ ] **Contact as Central Unit**: All contacts must be linked to an Organization
- [ ] **Organization Integration**: Seamless organization selection with "Create New" option
- [ ] **Data Validation**: Comprehensive validation for contact authority and influence
- [ ] **Principal Relationships**: Support for principal brand preferences

### 2. Technical Planning

**Technical Requirements**:
- [ ] **Database Changes**: No new tables needed (existing contacts schema sufficient)
- [ ] **UI Components**: Multi-step form wrapper and 3 step components
- [ ] **Form Components**: Reuse existing BaseInputField, SelectField, TextareaField
- [ ] **Validation**: Extend existing Yup schemas for step-based validation
- [ ] **Organization Integration**: Reuse OrganizationCreateModal component

**Multi-Step Form Architecture**:
- **Step 1: Basic Info** (Required fields)
  - First Name*, Last Name*, Position*, Organization*, Email, Phone
- **Step 2: Authority & Influence** (Business relationship)
  - Purchase Influence*, Decision Authority*, Principal Brands
- **Step 3: Contact Details** (Optional information)
  - Address, Website, Account Manager, Notes, Primary Contact flag

**Complexity Assessment**: Medium (4-6 hours)
- Builds on proven OrganizationFormWrapper pattern
- Reuses existing form components and validation
- Requires viewport optimization for tablet compatibility

---

## Stage 1: Component Architecture Planning (30 minutes)

### Multi-Step Form Design

**Step 1: Analyze Existing Pattern**
- [ ] Review `OrganizationFormWrapper.vue` implementation (615 lines)
- [ ] Study step navigation and validation patterns
- [ ] Understand auto-save functionality and localStorage usage
- [ ] Examine floating action bar design for mobile compatibility

**Step 2: Plan Contact Form Components**
```typescript
// Component Structure to Create:
// src/components/forms/ContactFormWrapper.vue - Main container (following OrganizationFormWrapper pattern)
// src/components/forms/ContactStepOne.vue - Basic Info step
// src/components/forms/ContactStepTwo.vue - Authority & Influence step  
// src/components/forms/ContactStepThree.vue - Contact Details step
```

**Step 3: Define Step Configuration**
- [ ] **Step 1 Required Fields**: ['first_name', 'last_name', 'organization_id', 'position']
- [ ] **Step 2 Required Fields**: ['purchase_influence', 'decision_authority']
- [ ] **Step 3 Required Fields**: [] (all optional)

**Validation Checklist**:
- [ ] Step validation prevents navigation until required fields are complete
- [ ] Form-wide validation ensures all required fields before submission
- [ ] Real-time field validation on blur events
- [ ] Accessible error messaging with ARIA attributes

---

## Stage 2: Type Definitions & Validation (45 minutes)

### Extend Existing Contact Types

**Step 1: Review Current Contact Types**
- [ ] Examine `src/types/contacts.ts` (722 lines) for existing schemas
- [ ] Verify `ContactCreateForm` and `ContactUpdateForm` types are complete
- [ ] Check validation schemas include all required fields

**Step 2: Create Multi-Step Form Types**
```typescript
// Add to src/types/contacts.ts

export interface ContactFormStep {
  id: number
  title: string
  description: string
  component: string
  requiredFields: string[]
}

export interface ContactStepValidation {
  [stepNumber: number]: boolean
}

export interface ContactFormData extends ContactCreateForm {
  // Form-specific helpers
  _organizationSearch?: string
  _principalIds?: string[]
}
```

**Step 3: Create Step-Specific Validation Schemas**
```typescript
// Step 1 validation schema
export const contactStepOneSchema = contactCreateSchema.pick([
  'first_name', 'last_name', 'organization_id', 'position', 'email', 'phone'
])

// Step 2 validation schema  
export const contactStepTwoSchema = contactCreateSchema.pick([
  'purchase_influence', 'decision_authority', 'preferred_principals'
])

// Step 3 validation schema (all optional)
export const contactStepThreeSchema = contactCreateSchema.pick([
  'address', 'city', 'state', 'zip_code', 'website', 'account_manager', 'notes', 'is_primary'
])
```

**Validation Implementation Checklist**:
- [ ] Step schemas properly extract required fields
- [ ] Error messages are user-friendly and specific
- [ ] Validation triggers on field blur events
- [ ] Form prevents navigation until step is valid

---

## Stage 3: Contact Form Wrapper Implementation (90 minutes)

### Create ContactFormWrapper.vue

**Step 1: Copy OrganizationFormWrapper Pattern**
- [ ] Create `src/components/forms/ContactFormWrapper.vue`
- [ ] Copy core structure from OrganizationFormWrapper.vue
- [ ] Adapt for Contact-specific requirements

**Step 2: Configure Contact Steps**
```typescript
const steps = [
  {
    id: 1,
    title: 'Basic Info',
    description: 'Enter contact name, position, organization, and contact details',
    component: 'ContactStepOne',
    requiredFields: ['first_name', 'last_name', 'organization_id', 'position']
  },
  {
    id: 2,
    title: 'Authority & Influence',
    description: 'Define purchase influence and decision authority',
    component: 'ContactStepTwo', 
    requiredFields: ['purchase_influence', 'decision_authority']
  },
  {
    id: 3,
    title: 'Contact Details',
    description: 'Add address, notes, and additional information',
    component: 'ContactStepThree',
    requiredFields: []
  }
]
```

**Step 3: Implement Contact-Specific Logic**
- [ ] **Form Data Structure**: Use ContactCreateForm interface
- [ ] **Validation Logic**: Integrate contact validation schemas
- [ ] **Auto-save Key**: Use 'contact-create-draft' for localStorage
- [ ] **Submission Handler**: Format data for contactStore.createContact()

**Step 4: iPad Viewport Optimization**
- [ ] **Compact Progress Indicator**: Height: 1.5rem, reduced margins
- [ ] **Form Padding**: `p-3 md:p-4` for responsive spacing
- [ ] **Floating Action Bar**: Fixed bottom on mobile, relative on desktop
- [ ] **Step Headers**: Compact text sizes (text-base, text-xs)

**Mobile Compatibility Checklist**:
- [ ] Form fits 768x1024 viewport without scrolling
- [ ] Touch targets minimum 44px (11 * 0.25rem)
- [ ] Compact spacing preserves usability
- [ ] Action buttons are easily accessible

---

## Stage 4: Step Component Implementation (120 minutes)

### Step 1: ContactStepOne.vue (Basic Info)

**Implementation Checklist**:
- [ ] Create `src/components/forms/ContactStepOne.vue`
- [ ] Follow OrganizationStepOne.vue pattern with 2-column layout
- [ ] **Required Fields**: First Name, Last Name, Position, Organization
- [ ] **Optional Fields**: Email, Phone

**Key Features**:
```vue
<template>
  <div class="space-y-4 md:space-y-6">
    <!-- Name Fields (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInputField name="first_name" label="First Name" required />
      <BaseInputField name="last_name" label="Last Name" required />
    </div>
    
    <!-- Organization & Position (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Organization with Create New button -->
      <div class="flex space-x-2">
        <SelectField name="organization_id" :options="organizationOptions" searchable required />
        <Button @click="showCreateOrganization = true">New</Button>
      </div>
      
      <!-- Position with Add New option -->
      <SelectField name="position" :options="positionOptions" allow-custom required />
    </div>
    
    <!-- Contact Details (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInputField name="email" type="email" label="Email Address" />
      <BaseInputField name="phone" type="tel" label="Phone Number" />
    </div>
  </div>
</template>
```

**Component Validation**:
- [ ] Real-time validation on field blur
- [ ] Organization dropdown with search functionality
- [ ] Position field supports custom entries
- [ ] Email and phone format validation

### Step 2: ContactStepTwo.vue (Authority & Influence)

**Implementation Checklist**:
- [ ] Create `src/components/forms/ContactStepTwo.vue`
- [ ] **Required Fields**: Purchase Influence, Decision Authority
- [ ] **Optional Fields**: Principal Brands (multi-select)

**Authority & Influence Logic**:
```vue
<template>
  <div class="space-y-6">
    <!-- Authority Fields (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectField 
        name="purchase_influence" 
        label="Purchase Influence"
        :options="purchaseInfluenceOptions"
        required
      />
      <SelectField 
        name="decision_authority"
        label="Decision Authority" 
        :options="decisionAuthorityOptions"
        required
      />
    </div>
    
    <!-- Principal Brands (Full width) -->
    <SelectField
      name="preferred_principals"
      label="Preferred Principal Brands"
      :options="principalOptions"
      multiple
      placeholder="Select brands this contact advocates for..."
    />
  </div>
</template>
```

**Business Logic Validation**:
- [ ] Purchase influence levels: High, Medium, Low, Unknown
- [ ] Decision authority roles: Decision Maker, Influencer, End User, Gatekeeper
- [ ] Principal brands filtered from organizations with Principal status
- [ ] Auto-suggestion of authority level based on position

### Step 3: ContactStepThree.vue (Contact Details)

**Implementation Checklist**:
- [ ] Create `src/components/forms/ContactStepThree.vue`
- [ ] **All Fields Optional**: Address, Website, Account Manager, Notes
- [ ] **Primary Contact**: Checkbox for organization primary contact

**Contact Details Layout**:
```vue
<template>
  <div class="space-y-6">
    <!-- Address Section -->
    <div class="space-y-4">
      <h4 class="text-sm font-medium text-gray-700">Address Information</h4>
      <BaseInputField name="address" label="Street Address" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseInputField name="city" label="City" />
        <BaseInputField name="state" label="State" />
        <BaseInputField name="zip_code" label="ZIP Code" />
      </div>
    </div>
    
    <!-- Additional Info (2-column) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BaseInputField name="website" type="url" label="Website" />
      <BaseInputField name="account_manager" label="Account Manager" />
    </div>
    
    <!-- Notes & Primary Contact -->
    <TextareaField name="notes" label="Notes" rows="3" />
    <CheckboxField name="is_primary" label="Primary Contact" 
                   description="Mark as primary contact for this organization" />
  </div>
</template>
```

**Step Component Validation**:
- [ ] All fields properly validate optional data
- [ ] Website URL format validation
- [ ] Notes character limit (5000 characters)
- [ ] Primary contact checkbox updates organization relationship

---

## Stage 5: Integration & Route Updates (45 minutes)

### Update ContactCreateView.vue

**Step 1: Replace Single Form with Multi-Step Wrapper**
- [ ] Update `src/views/contacts/ContactCreateView.vue`
- [ ] Replace `<ContactForm>` with `<ContactFormWrapper>`
- [ ] Maintain existing error handling and submission logic

**Integration Code**:
```vue
<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-3 mb-4">
        <router-link to="/contacts" class="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon class="h-5 w-5" />
        </router-link>
        <h1 class="text-3xl font-bold text-gray-900">Create New Contact</h1>
      </div>
      <p class="text-gray-600">
        Add a key contact who influences Principal product purchases within their organization.
      </p>
    </div>

    <!-- Multi-Step Contact Form -->
    <ContactFormWrapper
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import ContactFormWrapper from '@/components/forms/ContactFormWrapper.vue'

const router = useRouter()

const handleSuccess = (contactId: string) => {
  router.push(`/contacts/${contactId}`)
}

const handleCancel = () => {
  router.push('/contacts')
}
</script>
```

**Legacy Form Handling**:
- [ ] Keep existing `ContactForm.vue` for editing functionality
- [ ] Update imports and component references
- [ ] Maintain all existing submission error handling

---

## Stage 6: Testing & Validation (60 minutes)

### Viewport Compatibility Testing

**Step 1: Create Playwright Tests**
- [ ] Create `tests/contact-form-multi-step.spec.ts`
- [ ] Test iPad viewport (768x1024) compatibility
- [ ] Verify each step fits without scrolling

**Viewport Test Implementation**:
```typescript
// tests/contact-form-multi-step.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Contact Multi-Step Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/contacts/new')
  })

  test('Step 1 fits iPad viewport without scrolling', async ({ page }) => {
    // Check form wrapper height
    const formWrapper = page.locator('[data-testid="contact-form-wrapper"]')
    const boundingBox = await formWrapper.boundingBox()
    expect(boundingBox?.height).toBeLessThanOrEqual(900) // Allow for header
    
    // Verify no vertical scrollbar
    const hasVerticalScrollbar = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight
    })
    expect(hasVerticalScrollbar).toBeFalsy()
  })

  test('Step navigation works correctly', async ({ page }) => {
    // Fill Step 1 required fields
    await page.fill('[name="first_name"]', 'John')
    await page.fill('[name="last_name"]', 'Doe')
    await page.selectOption('[name="organization_id"]', { label: 'Test Organization' })
    await page.fill('[name="position"]', 'Manager')
    
    // Navigate to Step 2
    await page.click('button:has-text("Next")')
    expect(page.locator('text=Authority & Influence')).toBeVisible()
    
    // Verify Step 1 data persisted
    await page.click('button:has-text("Back")')
    expect(page.locator('[name="first_name"]')).toHaveValue('John')
  })

  test('Form validation prevents invalid submission', async ({ page }) => {
    // Try to submit without required fields
    await page.click('button:has-text("Next")')
    expect(page.locator('text=First name is required')).toBeVisible()
  })
})
```

### Manual Testing Checklist

**UI/UX Testing**:
- [ ] **Step 1**: All required fields validate properly
- [ ] **Step 2**: Authority/influence options display correctly
- [ ] **Step 3**: Optional fields accept valid input
- [ ] **Navigation**: Back/Next buttons work smoothly
- [ ] **Mobile**: Touch targets are minimum 44px
- [ ] **Tablet**: Form fits iPad viewport without scrolling

**Accessibility Testing**:
- [ ] **Keyboard Navigation**: Tab order follows logical flow
- [ ] **Screen Reader**: ARIA labels and descriptions read correctly
- [ ] **Error Messages**: Errors are announced to assistive technology
- [ ] **Focus Management**: Focus moves appropriately between steps
- [ ] **Color Contrast**: All text meets WCAG AA standards

**Business Logic Testing**:
- [ ] **Organization Integration**: "Create New" modal works correctly
- [ ] **Position Field**: Custom positions can be added
- [ ] **Authority Logic**: Position suggests appropriate authority level
- [ ] **Principal Brands**: Multi-select works with organization filtering
- [ ] **Form Persistence**: Auto-save functionality works across steps

### Performance Testing

**Load Testing Checklist**:
- [ ] **Initial Load**: Page loads in <2 seconds
- [ ] **Step Navigation**: Transitions occur in <300ms
- [ ] **Form Submission**: Completes in <3 seconds
- [ ] **Organization Search**: Responds in <500ms
- [ ] **Auto-save**: Persists data within 2 seconds of changes

---

## Stage 7: Deployment & Documentation (30 minutes)

### Pre-Deployment Checklist

**Code Quality Verification**:
- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run build` - Build succeeds without warnings
- [ ] Test all form functionality in development environment

**Component Integration Checklist**:
- [ ] ContactFormWrapper properly imports step components
- [ ] All form validation schemas work correctly
- [ ] Organization creation modal integrates seamlessly
- [ ] Auto-save functionality persists across browser sessions

### Production Deployment

**Deployment Steps**:
```bash
# 1. Commit multi-step form implementation
git add .
git commit -m "feat: implement multi-step Contact creation form

- Add ContactFormWrapper with 3-step progressive disclosure
- Create ContactStepOne, ContactStepTwo, ContactStepThree components  
- Optimize for iPad viewport (768x1024) without scrolling
- Implement auto-save with localStorage persistence
- Add comprehensive form validation and error handling
- Integrate organization creation modal
- Include Playwright tests for viewport compatibility"

# 2. Run pre-deployment checks
npm run type-check
npm run lint  
npm run build

# 3. Deploy to production
git push origin main
```

### User Documentation

**Feature Documentation Creation**:
- [ ] Update user guide with multi-step form instructions
- [ ] Document iPad/mobile usage patterns
- [ ] Include screenshots of each form step
- [ ] Add troubleshooting section for common issues

**Technical Documentation**:
- [ ] Update CLAUDE.md with new component architecture
- [ ] Document step validation patterns for future features
- [ ] Include viewport optimization techniques used
- [ ] Add maintenance notes for form component updates

---

## Post-Deployment Checklist

### Week 1: Monitoring & User Feedback

**Performance Monitoring**:
- [ ] Monitor contact creation completion rates
- [ ] Track step abandonment rates to identify UX issues
- [ ] Review error logs for validation or submission issues
- [ ] Collect user feedback on multi-step experience

**Usage Analytics**:
- [ ] Measure average time to complete form
- [ ] Track mobile vs desktop usage patterns
- [ ] Monitor organization creation from contact form
- [ ] Analyze auto-save usage and recovery rates

### Week 2: Optimization & Iteration

**Improvement Opportunities**:
- [ ] Review user feedback for UX enhancements
- [ ] Optimize loading times if needed
- [ ] Consider additional validation rules based on usage
- [ ] Plan future enhancements (e.g., contact templates)

**Future Enhancement Ideas**:
- [ ] **Contact Templates**: Pre-fill forms based on position/industry
- [ ] **Bulk Contact Import**: CSV import with organization matching
- [ ] **Contact Relationships**: Link contacts to other contacts
- [ ] **Activity Timeline**: Track contact interaction history

---

## Quick Reference

### Key Files Created/Modified
```
src/components/forms/ContactFormWrapper.vue      (New - Main multi-step container)
src/components/forms/ContactStepOne.vue         (New - Basic info step)
src/components/forms/ContactStepTwo.vue         (New - Authority & influence step)
src/components/forms/ContactStepThree.vue       (New - Contact details step)
src/views/contacts/ContactCreateView.vue        (Modified - Integration)
tests/contact-form-multi-step.spec.ts           (New - Viewport tests)
```

### Development Commands
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production  
npm run build

# Run Playwright tests
npx playwright test

# Run specific viewport tests
npx playwright test --grep "iPad viewport"
```

### Troubleshooting Common Issues

**TypeScript Errors**:
- Verify all imports use correct component names
- Check that form data interfaces match validation schemas
- Ensure step component props are properly typed

**Validation Issues**:
- Confirm required fields match between steps and schemas
- Test field validation triggers (on blur events)
- Verify error messages display correctly with ARIA attributes

**Viewport Problems**:
- Check component padding and margins for tablet screens
- Verify floating action bar positioning
- Test step navigation on actual iPad device

**Performance Issues**:
- Review component re-rendering with Vue DevTools
- Check auto-save debouncing effectiveness
- Monitor Supabase query performance

---

This comprehensive checklist ensures successful implementation of the multi-step Contact creation form while maintaining code quality, accessibility standards, and optimal user experience across all device types.