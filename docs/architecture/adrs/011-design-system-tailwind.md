# ADR-011: Design System Architecture with Tailwind CSS

## Status
- **Status**: Implemented
- **Date**: 2025-01-08
- **Deciders**: Design Team, Frontend Team
- **Consulted**: UX Team, Accessibility Team
- **Informed**: All Developers

## Context

We needed to establish a comprehensive design system for our CRM application that would ensure visual consistency, improve development velocity, and maintain accessibility standards. The requirements included:

- **Visual Consistency**: Uniform design language across all components
- **Developer Experience**: Fast styling with good developer tools
- **Accessibility**: WCAG 2.1 AA compliance built-in
- **Maintainability**: Easy to update and extend design tokens
- **Performance**: Minimal CSS bundle size in production
- **Component Library**: Reusable UI components following design patterns
- **Responsive Design**: Mobile-first approach with consistent breakpoints
- **Theme Support**: Light/dark mode and customizable themes

The alternatives considered were:
1. **Tailwind CSS + Headless UI**: Utility-first CSS with accessible components
2. **Styled Components**: CSS-in-JS solution
3. **Vuetify**: Material Design component library for Vue
4. **Quasar**: Vue framework with component library
5. **Custom CSS + Component Library**: Hand-written CSS with custom components
6. **CSS Modules**: Scoped CSS with modular approach

## Decision

We will use **Tailwind CSS with Headless UI** as the foundation for our design system, supplemented with custom Vue components that implement our specific design patterns.

**Design System Architecture:**
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Headless UI**: Accessible, unstyled component primitives
- **Custom Components**: Vue components implementing business-specific patterns
- **Design Tokens**: Centralized design values in Tailwind configuration
- **Component Library**: Organized by category with clear documentation

## Rationale

### Tailwind CSS Advantages
- **Utility-First**: Rapid development with consistent utility classes
- **Customizable**: Highly configurable design system through configuration
- **Performance**: Purges unused CSS for minimal bundle size
- **Developer Experience**: Excellent IDE support and developer tools
- **Responsive**: Mobile-first responsive design utilities
- **Consistency**: Enforces design constraints through limited utility options

### Headless UI Benefits
- **Accessibility**: WCAG 2.1 AA compliant components out of the box
- **Unstyled**: Provides behavior without imposing visual design
- **Vue Integration**: Official Vue 3 support with Composition API
- **Flexibility**: Full control over visual design and styling
- **Keyboard Navigation**: Built-in keyboard interaction patterns

### Component Library Strategy
- **Token-Based**: Centralized design tokens for consistency
- **Composable**: Components can be composed together
- **Accessible**: Built-in accessibility patterns and ARIA support
- **Documented**: Clear documentation with usage examples
- **Type-Safe**: Full TypeScript support for component APIs

### Performance Benefits
- **Purged CSS**: Only used utilities included in production bundle
- **Tree Shaking**: Unused components eliminated from bundle
- **Critical CSS**: Above-the-fold styles prioritized
- **Caching**: Utility-based CSS enables effective caching strategies

## Consequences

### Positive
- **Rapid Development**: Fast UI development with utility classes
- **Visual Consistency**: Enforced design constraints and patterns
- **Accessibility**: Built-in WCAG compliance through Headless UI
- **Maintainability**: Centralized design tokens and component patterns
- **Performance**: Optimized CSS bundle with only used utilities
- **Developer Experience**: Excellent tooling and IDE integration
- **Flexibility**: Easy customization and extension

### Negative
- **Learning Curve**: Developers need to learn utility-first approach
- **HTML Verbosity**: Many CSS classes in templates
- **Design Constraints**: Limited by available utility classes
- **Build Complexity**: Additional build configuration required

### Risks
- **Low Risk**: CSS bundle size growth with extensive utility usage
  - **Mitigation**: Proper purging configuration and monitoring
- **Medium Risk**: Inconsistent design patterns across teams
  - **Mitigation**: Clear component documentation and design guidelines
- **Low Risk**: Accessibility regression in custom components
  - **Mitigation**: Regular accessibility audits and automated testing

## Implementation

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem'
      },
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 25px 0 rgba(0, 0, 0, 0.15)'
      }
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px'
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@headlessui/tailwindcss')
  ]
}
```

### Component Library Organization
```
src/design-system/
├── tokens/                 # Design tokens and constants
│   ├── colors.ts          # Color palette definitions
│   ├── typography.ts      # Font and text styles
│   ├── spacing.ts         # Spacing scale
│   └── shadows.ts         # Shadow definitions
├── components/            # Reusable UI components
│   ├── forms/            # Form-related components
│   │   ├── InputField.vue
│   │   ├── SelectField.vue
│   │   ├── TextAreaField.vue
│   │   └── CheckboxField.vue
│   ├── layout/           # Layout components
│   │   ├── Card.vue
│   │   ├── Container.vue
│   │   ├── Stack.vue
│   │   └── Grid.vue
│   ├── feedback/         # User feedback components
│   │   ├── Alert.vue
│   │   ├── Badge.vue
│   │   ├── Spinner.vue
│   │   └── Toast.vue
│   ├── navigation/       # Navigation components
│   │   ├── Breadcrumb.vue
│   │   ├── Tabs.vue
│   │   └── Pagination.vue
│   └── overlays/         # Overlay components
│       ├── Modal.vue
│       ├── Dropdown.vue
│       ├── Tooltip.vue
│       └── Popover.vue
├── composables/          # Design system utilities
│   ├── useTheme.ts       # Theme management
│   ├── useBreakpoints.ts # Responsive utilities
│   └── useAccessibility.ts # A11y helpers
└── styles/               # Global styles and utilities
    ├── base.css          # Base styles and resets
    ├── components.css    # Component-specific styles
    └── utilities.css     # Custom utility classes
```

### Base Component Example
```vue
<!-- src/design-system/components/forms/InputField.vue -->
<template>
  <div class="space-y-1">
    <label 
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-error-500" aria-label="required">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="inputId"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? errorId : undefined"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <div v-if="icon || $slots.icon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <slot name="icon">
          <component :is="icon" class="h-5 w-5 text-gray-400" />
        </slot>
      </div>
    </div>
    
    <p 
      v-if="error" 
      :id="errorId"
      class="text-sm text-error-600 dark:text-error-400"
      role="alert"
    >
      {{ error }}
    </p>
    
    <p 
      v-else-if="hint" 
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  modelValue: string | number
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  hint?: string
  error?: string
  icon?: any
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md'
})

const emit = defineEmits<Emits>()

const inputId = useId()
const errorId = useId()

const inputClasses = computed(() => {
  const base = [
    'block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset',
    'placeholder:text-gray-400 focus:ring-2 focus:ring-inset',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
    'dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500'
  ]
  
  const sizes = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-3.5 py-2.5 text-base'
  }
  
  const states = {
    error: 'ring-error-300 focus:ring-error-500 dark:ring-error-600',
    normal: 'ring-gray-300 focus:ring-primary-500 dark:ring-gray-600'
  }
  
  const iconPadding = props.icon || '$slots.icon' ? 'pl-10' : ''
  
  return [
    ...base,
    sizes[props.size],
    props.error ? states.error : states.normal,
    iconPadding
  ].filter(Boolean).join(' ')
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function handleBlur() {
  emit('blur')
}

function handleFocus() {
  emit('focus')
}
</script>
```

### Theme Management
```typescript
// src/design-system/composables/useTheme.ts
import { ref, computed, watch } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const currentTheme = ref<Theme>('system')
const systemPrefersDark = ref(false)

// Watch for system preference changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = mediaQuery.matches
  
  mediaQuery.addEventListener('change', (e) => {
    systemPrefersDark.value = e.matches
  })
}

export function useTheme() {
  const isDark = computed(() => {
    if (currentTheme.value === 'system') {
      return systemPrefersDark.value
    }
    return currentTheme.value === 'dark'
  })

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
  }

  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  // Apply theme to document
  watch(isDark, (dark) => {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, { immediate: true })

  // Load saved theme preference
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme') as Theme
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      currentTheme.value = saved
    }
  }

  return {
    currentTheme: computed(() => currentTheme.value),
    isDark,
    setTheme,
    toggleTheme
  }
}
```

### Responsive Design Utilities
```typescript
// src/design-system/composables/useBreakpoints.ts
import { ref, onMounted, onUnmounted } from 'vue'

const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

type Breakpoint = keyof typeof breakpoints

export function useBreakpoints() {
  const width = ref(0)

  const updateWidth = () => {
    width.value = window.innerWidth
  }

  onMounted(() => {
    updateWidth()
    window.addEventListener('resize', updateWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })

  const isAtLeast = (breakpoint: Breakpoint) => {
    return width.value >= breakpoints[breakpoint]
  }

  const isBelow = (breakpoint: Breakpoint) => {
    return width.value < breakpoints[breakpoint]
  }

  return {
    width,
    isAtLeast,
    isBelow,
    xs: isAtLeast('xs'),
    sm: isAtLeast('sm'),
    md: isAtLeast('md'),
    lg: isAtLeast('lg'),
    xl: isAtLeast('xl'),
    '2xl': isAtLeast('2xl')
  }
}
```

### Accessibility Utilities
```typescript
// src/design-system/composables/useAccessibility.ts
import { ref, nextTick } from 'vue'

export function useAccessibility() {
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const focusFirstElement = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    if (firstElement) {
      firstElement.focus()
    }
  }

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleTab)
    
    return () => {
      container.removeEventListener('keydown', handleTab)
    }
  }

  return {
    announceToScreenReader,
    focusFirstElement,
    trapFocus
  }
}
```

### Global Styles
```css
/* src/design-system/styles/base.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Focus styles for accessibility */
  *:focus {
    @apply outline-none;
  }
  
  *:focus-visible {
    @apply ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900;
  }
  
  /* Screen reader only text */
  .sr-only {
    @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
    clip: rect(0, 0, 0, 0);
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .text-gray-500 {
      @apply text-gray-800 dark:text-gray-200;
    }
    
    .border-gray-300 {
      @apply border-gray-600;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  /* Component-specific styles that need to be extracted */
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }
  
  .btn-secondary {
    @apply bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500;
  }
  
  .card {
    @apply bg-white shadow-soft rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700;
  }
}
```

## Related Decisions
- [ADR-004: Vue 3 + TypeScript Technology Stack Selection](./004-vue3-typescript-stack.md)
- [ADR-009: Progressive Web App Implementation Strategy](./009-pwa-implementation.md)
- [ADR-012: Vue 3 Composition API Component Architecture](./012-composition-api-architecture.md)

## Notes
- Design system components provide consistent patterns across the application
- Accessibility features built into all components with WCAG 2.1 AA compliance
- Theme management supports light/dark mode with system preference detection
- Responsive design utilities enable consistent breakpoint usage
- Performance optimized through Tailwind's purging and component tree-shaking
- Component documentation maintained alongside implementation for developer reference