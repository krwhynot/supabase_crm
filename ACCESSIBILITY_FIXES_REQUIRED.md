# CRITICAL ACCESSIBILITY FIXES REQUIRED

## Color Contrast Violations (WCAG 1.4.3)

### OrganizationFormWrapper.vue - Lines 74-75
**BEFORE (FAILS 4.5:1):**
```vue
<span
  :class="[
    'text-sm font-medium',
    index + 1 === currentStep 
      ? 'text-primary-600' 
      : index + 1 < currentStep
        ? 'text-green-600'
        : 'text-gray-500'  // ❌ FAILS contrast
  ]"
>
```

**AFTER (PASSES 4.5:1):**
```vue
<span
  :class="[
    'text-sm font-medium',
    index + 1 === currentStep 
      ? 'text-primary-600' 
      : index + 1 < currentStep
        ? 'text-green-600'
        : 'text-gray-600'  // ✅ PASSES contrast
  ]"
>
```

### SegmentSelector.vue - Lines 59, 421
**BEFORE (CRITICAL FAIL 2.8:1):**
```vue
<!-- Dropdown arrow -->
hasError ? 'text-red-500' : 'text-gray-400'  // ❌ CRITICAL FAIL

<!-- Option descriptions -->
class="text-xs text-gray-500 mt-1"  // ❌ FAILS for 12px text
```

**AFTER (PASSES):**
```vue
<!-- Dropdown arrow -->
hasError ? 'text-red-500' : 'text-gray-600'  // ✅ PASSES

<!-- Option descriptions -->
class="text-xs text-gray-600 mt-1"  // ✅ PASSES for 12px text
```

### ContactStatusWarning.vue - Line 36
**BEFORE (FAILS):**
```vue
<div class="mt-2 text-sm text-amber-700">  <!-- ❌ FAILS on amber-50 -->
```

**AFTER (PASSES):**
```vue
<div class="mt-2 text-sm text-amber-800">  <!-- ✅ PASSES on amber-50 -->
```

## Touch Target Violations (WCAG 2.5.5)

### SegmentSelector.vue - Lines 48-54
**BEFORE (TOO SMALL):**
```vue
<button
  type="button"
  :disabled="disabled"
  class="absolute inset-y-0 right-0 flex items-center pr-2"  <!-- ❌ < 44px -->
  aria-label="Toggle dropdown"
  @click="toggleDropdown"
>
```

**AFTER (TOUCH-FRIENDLY):**
```vue
<button
  type="button"
  :disabled="disabled"
  class="absolute inset-y-0 right-0 flex items-center pr-2 min-w-touch min-h-touch"  <!-- ✅ 44px+ -->
  aria-label="Toggle dropdown"
  @click="toggleDropdown"
>
```

### ContactStatusWarning.vue - Lines 121-127
**BEFORE (TOO SMALL):**
```vue
<button
  type="button"
  class="inline-flex rounded-md p-1.5 text-amber-500 hover:bg-amber-100"  <!-- ❌ < 44px -->
  aria-label="Dismiss warning"
  @click="handleClose"
>
```

**AFTER (TOUCH-FRIENDLY):**
```vue
<button
  type="button"
  class="inline-flex rounded-md p-2 text-amber-500 hover:bg-amber-100 min-w-touch min-h-touch"  <!-- ✅ 44px+ -->
  aria-label="Dismiss warning"
  @click="handleClose"
>
```

## Focus Management Issues

### OrganizationFormWrapper.vue - Lines 659-664
**ISSUE**: Focus management too generic, may focus on disabled elements

**BEFORE:**
```typescript
const focusFirstInput = () => {
  nextTick(() => {
    const firstInput = document.querySelector('input, select, textarea') as HTMLElement
    firstInput?.focus()
  })
}
```

**AFTER:**
```typescript
const focusFirstInput = () => {
  nextTick(() => {
    const firstInput = document.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])') as HTMLElement
    if (firstInput) {
      firstInput.focus()
      // Announce step change to screen readers
      announceStepChange()
    }
  })
}

const announceStepChange = () => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = `Now on ${currentStepData.value.title}. ${currentStepData.value.description}`
  
  document.body.appendChild(announcement)
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}
```

## Screen Reader Announcements

### OrganizationFormWrapper.vue - Lines 95-170
**ISSUE**: Auto-save status changes not announced to screen readers

**ADD ARIA-LIVE REGION:**
```vue
<!-- Auto-save Status -->
<div
  v-if="autoSaveStatus"
  class="mb-4 flex items-center justify-center text-sm"
  aria-live="polite"  <!-- ✅ ADD THIS -->
  aria-atomic="true"  <!-- ✅ ADD THIS -->
>
```

## Form Validation Improvements

### All Form Components
**ISSUE**: Validation errors not announced immediately

**ADD TO BaseInputField.vue:**
```vue
<p
  v-if="error"
  :id="errorId"
  role="alert"
  aria-live="assertive"  <!-- ✅ ADD THIS -->
  aria-atomic="true"     <!-- ✅ ADD THIS -->
  class="form-error"
>
```