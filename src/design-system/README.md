# CRM Design System

A comprehensive, scalable design system built for Vue 3 + TypeScript + Tailwind CSS applications.

## Architecture Overview

The design system is organized into several key layers:

```
src/design-system/
├── tokens/           # Design tokens (colors, typography, spacing)
├── composables/      # Reusable logic and utilities
├── components/       # Component library
│   ├── forms/        # Form-related components
│   ├── layout/       # Layout and structure components
│   ├── feedback/     # User feedback components
│   ├── navigation/   # Navigation components
│   ├── overlay/      # Modal, dropdown, tooltip components
│   ├── data/         # Data display components
│   └── utility/      # Utility and helper components
└── README.md         # This documentation
```

## Core Principles

### 1. Token-Based Design
All design decisions are driven by design tokens stored as CSS custom properties:

```css
:root {
  --color-primary-500: #3b82f6;
  --spacing-4: 1rem;
  --font-size-base: 1rem;
}
```

### 2. Component Variants
Components use a systematic variant approach for consistent styling:

```vue
<Button variant="primary" size="md" />
<Card variant="elevated" padding="lg" />
```

### 3. Composition API First
All composables and components leverage Vue 3's Composition API for better TypeScript support and reusability.

### 4. Accessibility by Default
Every component includes proper ARIA attributes, keyboard navigation, and screen reader support.

## Getting Started

### 1. Install the Design System

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './design-system/tokens/index.css'

const app = createApp(App)
app.mount('#app')
```

### 2. Use Components

```vue
<template>
  <div>
    <!-- Import individual components -->
    <Button variant="primary" @click="handleClick">
      Primary Action
    </Button>
    
    <!-- Or use from the design system -->
    <Card variant="elevated" title="User Profile">
      <p>Card content goes here</p>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button, Card } from '@/design-system/components'

const handleClick = () => {
  console.log('Button clicked!')
}
</script>
```

### 3. Use Design Tokens

```vue
<script setup lang="ts">
import { tokens } from '@/design-system/tokens'

// Access tokens programmatically
const primaryColor = tokens.color('primary.500')
const baseSpacing = tokens.space('4')
</script>
```

### 4. Theme Management

```vue
<template>
  <div>
    <Button @click="toggleTheme">
      {{ isDark ? 'Switch to Light' : 'Switch to Dark' }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/design-system/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>
```

## Component Categories

### Form Components
- **Button** - Primary interaction component with multiple variants
- **InputField** - Text input with validation and accessibility
- **SelectField** - Dropdown selection with search and multi-select
- **TextareaField** - Multi-line text input
- **CheckboxField** - Boolean selection with indeterminate state
- **RadioField** - Single selection from multiple options
- **FormGroup** - Logical grouping of form elements

### Layout Components
- **Card** - Content container with header, body, and footer
- **Container** - Responsive page container with max-width constraints
- **Stack** - Vertical layout with consistent spacing
- **Grid** - CSS Grid wrapper with responsive breakpoints

### Feedback Components
- **Alert** - Contextual messages and notifications
- **Badge** - Status indicators and labels
- **Spinner** - Loading states and progress indicators
- **Toast** - Temporary notifications

### Navigation Components  
- **Breadcrumb** - Hierarchical navigation
- **Tabs** - Content switching interface
- **Pagination** - Large dataset navigation

### Overlay Components
- **Modal** - Dialog overlays with focus management
- **Dropdown** - Contextual menus and options
- **Tooltip** - Contextual help text
- **Popover** - Rich contextual content

## Design Tokens

### Color System
```scss
// Primary Colors
--color-primary-50: #eff6ff;
--color-primary-500: #3b82f6;
--color-primary-900: #1e3a8a;

// Semantic Colors
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;
```

### Typography Scale
```scss
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
```

### Spacing System
4px base unit system for consistent spacing:
```scss
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-4: 1rem;     /* 16px */
--spacing-8: 2rem;     /* 32px */
```

### Touch Targets
WCAG-compliant touch target sizes:
```scss
--touch-target-sm: 2rem;     /* 32px */
--touch-target-base: 2.5rem; /* 40px */
--touch-target-lg: 2.75rem;  /* 44px */
```

## Advanced Usage

### Creating Custom Variants

```typescript
import { createVariantConfig } from '@/design-system/composables/useComponentClasses'

const customButtonVariants = createVariantConfig({
  base: 'inline-flex items-center justify-center rounded-md font-medium',
  variants: {
    variant: {
      brand: 'bg-brand-500 text-white hover:bg-brand-600',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50'
    },
    size: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base'
    }
  },
  defaultVariants: {
    variant: 'brand',
    size: 'md'
  }
})
```

### Custom Theme Colors

```css
:root {
  /* Add custom brand colors */
  --color-brand-50: #f0f9ff;
  --color-brand-500: #0ea5e9;
  --color-brand-900: #0c4a6e;
}

.dark {
  /* Dark theme overrides */
  --color-brand-50: #0c4a6e;
  --color-brand-500: #0ea5e9;
  --color-brand-900: #f0f9ff;
}
```

### Responsive Design Patterns

```vue
<template>
  <Stack 
    :space="{ base: '4', md: '6', lg: '8' }"
    direction="{ base: 'column', md: 'row' }"
  >
    <Card class="flex-1">Content 1</Card>
    <Card class="flex-1">Content 2</Card>
  </Stack>
</template>
```

## Accessibility Features

### Focus Management
- All interactive components include visible focus indicators
- Focus trapping in modals and overlays
- Logical tab order throughout components

### Screen Reader Support
- Proper ARIA labels and descriptions
- Role attributes for complex components
- Live regions for dynamic content updates

### Keyboard Navigation
- Full keyboard accessibility for all components
- Standard keyboard shortcuts (Escape, Enter, Arrow keys)
- Skip links and landmarks for page navigation

### Color and Contrast
- WCAG 2.1 AA compliant color contrast ratios
- Color is never the only means of conveying information
- High contrast mode support

## Performance Considerations

### Tree Shaking
Import only the components you need:
```typescript
import { Button } from '@/design-system/components/Button.vue'
// Instead of importing the entire component library
```

### CSS Variables
CSS custom properties allow for efficient theming without duplicating styles.

### Lazy Loading
Large components can be lazy-loaded:
```typescript
const DataTable = defineAsyncComponent(() => 
  import('@/design-system/components/data/DataTable.vue')
)
```

## Migration Guide

### From Existing Components

1. **Audit Current Components**: Identify which components can be replaced
2. **Update Imports**: Change import paths to design system components
3. **Update Props**: Align with design system prop interfaces
4. **Test Accessibility**: Ensure all interactive elements remain accessible
5. **Update Styles**: Replace custom CSS with design system tokens

### Breaking Changes
- Component prop names may have changed for consistency
- Some CSS classes may need updating
- Theme variables use CSS custom properties instead of Sass variables

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **CSS Features**: CSS Custom Properties, CSS Grid, Flexbox
- **JavaScript Features**: ES2020, Dynamic Imports, Optional Chaining

## Contributing

### Adding New Components

1. Create component in appropriate category folder
2. Add to component index exports
3. Include TypeScript interfaces
4. Add comprehensive documentation
5. Include accessibility features
6. Add unit tests
7. Update this README

### Design Token Updates

1. Update CSS custom properties in `tokens/index.css`
2. Update TypeScript definitions in `tokens/index.ts`
3. Test theme switching functionality
4. Verify accessibility compliance
5. Document new tokens

## Resources

- [Vue 3 Composition API](https://vuejs.org/guide/composition-api-introduction.html)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Headless UI](https://headlessui.com/vue)
- [Heroicons](https://heroicons.com/)