# Kitchen Pantry CRM - UI/UX Design Guide

> Comprehensive design system and implementation guide for the Kitchen Pantry CRM application

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Design System Foundation](#design-system-foundation)
4. [Color Palette & Themes](#color-palette--themes)
5. [Typography System](#typography-system)
6. [Spacing & Layout](#spacing--layout)
7. [Component Architecture](#component-architecture)
8. [Navigation System](#navigation-system)
9. [Dashboard Components](#dashboard-components)
10. [Implementation Examples](#implementation-examples)
11. [Accessibility & Performance](#accessibility--performance)
12. [Development Workflow](#development-workflow)

---

## Overview

Kitchen Pantry CRM is a modern, Vue.js-based CRM system designed specifically for the food service industry. The application features a comprehensive design system with atomic design principles, responsive layouts, and accessibility-first development practices.

### Key Design Principles

- **Atomic Design**: Components organized as atoms, molecules, and organisms
- **Responsive-First**: Mobile-optimized with progressive enhancement
- **Accessibility**: WCAG 2.1 AA compliance with focus management
- **Performance**: Optimized bundle sizes and loading states
- **Consistency**: Unified design tokens and component patterns

---

## Tech Stack & Architecture

### Frontend Framework
```json
{
  "framework": "Vue.js 3.3.4",
  "build_tool": "Vite 4.4.0",
  "router": "Vue Router 4.2.4",
  "state_management": "Pinia 2.1.6",
  "styling": "Tailwind CSS 3.3.3 + CSS Variables",
  "typescript": "5.8.3"
}
```

### Development Tools
```json
{
  "testing": {
    "unit": "Vitest 0.34.1",
    "e2e": "Playwright 1.53.2",
    "component": "Vue Test Utils 2.4.1",
    "a11y": "axe-core 4.10.3"
  },
  "storybook": "8.6.14",
  "bundler": "Vite",
  "linting": "ESLint + Vue ESLint",
  "formatting": "Prettier"
}
```

### UI Component Libraries
```json
{
  "headless_ui": "@headlessui/vue 1.7.14",
  "icons": "@heroicons/vue 2.0.18",
  "charts": "Chart.js 4.5.0 + Vue-ChartJS 5.3.2",
  "drag_drop": "vue-draggable-next 2.2.1",
  "date_handling": "date-fns 4.1.0"
}
```

---

## Design System Foundation

### CSS Variables Architecture

The design system is built on CSS custom properties (variables) that provide consistent theming and enable dark mode support.

#### Core Design Token Structure
```css
:root {
  /* Color System */
  --color-primary-50: #f0f9ff;
  --color-primary-500: #0ea5e9;
  --color-primary-600: #0284c7;
  --color-primary-700: #0369a1;
  
  /* Semantic Colors */
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  --color-info-500: #3b82f6;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-base: 1rem;
  --font-size-xl: 1.25rem;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  
  /* Spacing */
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Theme System

#### Light Theme (Default)
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
}
```

#### Dark Theme
```css
[data-theme="dark"] {
  --bg-primary: #1e293b;
  --bg-secondary: #334155;
  --bg-tertiary: #475569;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --border-color: #475569;
  --primary: #60a5fa;
  --primary-hover: #3b82f6;
}
```

---

## Color Palette & Themes

### Primary Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary Blue** | `#3b82f6` | Primary actions, links, active states |
| **Primary Hover** | `#2563eb` | Hover states for primary elements |
| **Primary Light** | `#60a5fa` | Dark theme primary color |

### Semantic Colors

| Purpose | Light Theme | Dark Theme | Usage |
|---------|-------------|------------|-------|
| **Success** | `#10b981` | `#34d399` | Success messages, positive actions |
| **Warning** | `#f59e0b` | `#fbbf24` | Warnings, caution states |
| **Danger** | `#ef4444` | `#f87171` | Error states, destructive actions |
| **Info** | `#3b82f6` | `#60a5fa` | Information messages |

### Neutral Colors

| Purpose | Light Theme | Dark Theme |
|---------|-------------|------------|
| **Background Primary** | `#ffffff` | `#1e293b` |
| **Background Secondary** | `#f8fafc` | `#334155` |
| **Background Tertiary** | `#f1f5f9` | `#475569` |
| **Text Primary** | `#0f172a` | `#f8fafc` |
| **Text Secondary** | `#64748b` | `#cbd5e1` |
| **Border** | `#e2e8f0` | `#475569` |

### Color Implementation Example

```vue
<template>
  <div class="bg-bg-primary text-text-primary border border-border-color">
    <button class="bg-primary hover:bg-primary-hover text-white">
      Primary Action
    </button>
    <div class="text-success bg-success/10 p-4 rounded">
      Success message
    </div>
  </div>
</template>
```

---

## Typography System

### Font Stack
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Font Scale

| Size | Value | Usage |
|------|-------|-------|
| **xs** | `12px` | Helper text, badges |
| **sm** | `14px` | Secondary text, captions |
| **base** | `16px` | Body text, form inputs |
| **lg** | `18px` | Large body text |
| **xl** | `24px` | Page titles, headings |
| **2xl** | `32px` | Section headers |
| **3xl** | `clamp(1.875rem, 5vw, 2.5rem)` | Responsive large headings |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| **Light** | `300` | Subtle text |
| **Normal** | `400` | Body text |
| **Medium** | `500` | Emphasized text |
| **Semi-bold** | `600` | Subheadings |
| **Bold** | `700` | Main headings |

### Line Heights

| Name | Value | Usage |
|------|-------|-------|
| **Tight** | `1.25` | Headings |
| **Normal** | `1.5` | Body text |
| **Relaxed** | `1.625` | Long-form content |

### Typography Implementation

```vue
<template>
  <div>
    <h1 class="text-2xl font-bold text-text-primary">Main Heading</h1>
    <h2 class="text-xl font-semibold text-text-primary">Section Heading</h2>
    <p class="text-base font-normal text-text-primary leading-normal">
      Body content with proper line height and font weight.
    </p>
    <span class="text-sm text-text-secondary">Helper text</span>
  </div>
</template>
```

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-1` | `0.25rem` (4px) | Fine details |
| `--spacing-2` | `0.5rem` (8px) | Tight spacing |
| `--spacing-3` | `0.75rem` (12px) | Compact spacing |
| `--spacing-4` | `1rem` (16px) | Standard spacing |
| `--spacing-6` | `1.5rem` (24px) | Comfortable spacing |
| `--spacing-8` | `2rem` (32px) | Loose spacing |
| `--spacing-12` | `3rem` (48px) | Section spacing |
| `--spacing-16` | `4rem` (64px) | Large sections |

### Container Sizes

| Breakpoint | Max Width | Usage |
|------------|-----------|-------|
| **xs** | `320px` | Mobile phones |
| **sm** | `640px` | Large phones |
| **md** | `768px` | Tablets |
| **lg** | `1024px` | Laptops |
| **xl** | `1280px` | Desktop |
| **2xl** | `1536px` | Large desktop |

### Grid System

```css
:root {
  --grid-cols-12: repeat(12, minmax(0, 1fr));
  --gap-4: var(--spacing-4);
  --gap-6: var(--spacing-6);
  --gap-8: var(--spacing-8);
}
```

### Touch Targets

```css
:root {
  --touch-target: 48px;        /* Recommended minimum */
  --touch-target-sm: 44px;     /* Compact interfaces */
  --touch-target-min: 32px;    /* Absolute minimum */
}
```

---

## Component Architecture

### Atomic Design Structure

```
components/
├── atoms/           # Basic building blocks
│   ├── Button/
│   ├── Input/
│   ├── Icon/
│   ├── Badge/
│   └── Avatar/
├── molecules/       # Simple combinations
│   ├── NavigationItem/
│   ├── FormField/
│   ├── KPICard/
│   └── Dropdown/
└── organisms/       # Complex components
    ├── Sidebar/
    ├── DashboardWidget/
    ├── AppHeader/
    └── DataTable/
```

### Component Design Patterns

#### 1. Props Interface Pattern
```typescript
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}
```

#### 2. Computed Classes Pattern
```typescript
const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-md transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2'
  ]
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]'
  }
  
  return [
    ...baseClasses,
    variantClasses[props.variant],
    sizeClasses[props.size]
  ].join(' ')
})
```

#### 3. Event Emission Pattern
```typescript
interface Emits {
  click: [event: MouseEvent]
  change: [value: string]
  'item-select': [item: any]
}

const emit = defineEmits<Emits>()
```

---

## Navigation System

### Sidebar Component

The main navigation uses a collapsible sidebar with the following features:

#### Key Features
- **Responsive Design**: Mobile overlay on small screens
- **Collapsible**: Can collapse to icon-only mode
- **Multi-level Navigation**: Support for nested menu items
- **User Display**: Shows current user info in footer
- **Badge Support**: Notification badges on menu items

#### Implementation

```vue
<template>
  <aside :class="sidebarClasses">
    <!-- Header with logo and collapse button -->
    <div class="px-4 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <img v-if="logoSrc" :src="logoSrc" class="h-8 w-auto" />
          <span v-if="!collapsed" class="text-lg font-semibold">
            {{ appName }}
          </span>
        </div>
        <Button 
          variant="ghost" 
          :icon="collapsed ? 'chevron-right' : 'chevron-left'"
          @click="toggleCollapse"
        />
      </div>
    </div>

    <!-- Navigation sections -->
    <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      <div v-for="section in navigationSections" class="space-y-1">
        <h3 v-if="section.title && !collapsed" 
            class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
          {{ section.title }}
        </h3>
        
        <NavigationItem
          v-for="item in section.items"
          :key="item.key"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          :active="item.active"
          :badge="item.badge"
          :variant="collapsed ? 'compact' : 'default'"
        />
      </div>
    </nav>

    <!-- Footer with user info -->
    <div class="px-4 py-4 border-t border-gray-200">
      <div class="flex items-center space-x-3">
        <Avatar :src="currentUser.avatar" size="sm" />
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ currentUser.name }}</p>
          <p class="text-xs text-gray-500 truncate">{{ currentUser.email }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
```

#### Navigation Data Structure

```typescript
interface NavigationSection {
  key: string
  title?: string
  items: NavigationItem[]
}

interface NavigationItem {
  key: string
  label: string
  to?: string
  href?: string
  icon?: string
  active?: boolean
  badge?: string | number
  disabled?: boolean
  children?: NavigationItem[]
}
```

### NavigationItem Component

```vue
<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :class="itemClasses"
    @click="handleClick"
  >
    <Icon v-if="icon" :name="icon" :class="iconClasses" />
    <span :class="textClasses">{{ label }}</span>
    <Badge v-if="badge" variant="primary" size="sm">{{ badge }}</Badge>
  </component>
</template>

<script setup lang="ts">
const itemClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center font-medium rounded-md',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500'
  ]
  
  const stateClasses = isActive.value
    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    : 'text-gray-700 hover:bg-gray-100'
    
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm min-h-[40px]',
    md: 'px-3 py-2 text-base min-h-[44px]'
  }
  
  return [...baseClasses, stateClasses, sizeClasses[props.size]].join(' ')
})
</script>
```

---

## Dashboard Components

### DashboardWidget Component

A flexible container for dashboard content with loading states and error handling.

#### Features
- **Loading States**: Skeleton loading animations
- **Error Handling**: Error display with retry functionality
- **Flexible Sizing**: Small, medium, large, and full-width options
- **Header/Footer Slots**: Customizable header actions and footer content

#### Implementation

```vue
<template>
  <div :class="widgetClasses">
    <!-- Widget Header -->
    <div v-if="title || $slots['header-actions']" 
         class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <div class="flex items-center space-x-2">
          <slot name="header-actions" />
        </div>
      </div>
    </div>

    <!-- Widget Content -->
    <div :class="contentClasses">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div class="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
        <div class="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center py-8">
        <Icon name="exclamation-triangle" class="h-12 w-12 text-red-400 mb-4" />
        <h4 class="text-lg font-medium mb-2">Failed to load data</h4>
        <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
        <Button variant="secondary" @click="retry">Try Again</Button>
      </div>

      <!-- Content -->
      <div v-else>
        <slot />
      </div>
    </div>

    <!-- Widget Footer -->
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <slot name="footer" />
    </div>
  </div>
</template>
```

#### Usage Example

```vue
<template>
  <DashboardWidget 
    title="Recent Orders" 
    size="large" 
    :loading="ordersLoading"
    :error="ordersError"
    @retry="fetchOrders"
  >
    <template #header-actions>
      <Button variant="ghost" icon="refresh" @click="refreshOrders" />
      <Button variant="ghost" icon="cog-6-tooth" @click="openSettings" />
    </template>
    
    <!-- Widget content -->
    <OrdersList :orders="orders" />
    
    <template #footer>
      <div class="flex justify-between text-sm text-gray-600">
        <span>Last updated: {{ lastUpdated }}</span>
        <router-link to="/orders" class="text-blue-600 hover:text-blue-800">
          View all orders
        </router-link>
      </div>
    </template>
  </DashboardWidget>
</template>
```

---

## Implementation Examples

### Button Component

```vue
<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <LoadingSpinner v-if="loading" class="mr-2" size="sm" />
    <Icon v-else-if="icon" :name="icon" :class="iconClasses" />
    <span v-if="$slots.default || label">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  icon?: string
  label?: string
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button'
})

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-md transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  const variantClasses = {
    primary: [
      'bg-primary text-white',
      'hover:bg-primary-hover focus:ring-blue-500',
      'shadow-sm hover:shadow-md'
    ],
    secondary: [
      'bg-bg-secondary text-text-primary border border-border-color',
      'hover:bg-bg-tertiary focus:ring-gray-500'
    ],
    danger: [
      'bg-red-600 text-white',
      'hover:bg-red-700 focus:ring-red-500'
    ],
    ghost: [
      'text-text-secondary hover:text-text-primary',
      'hover:bg-bg-secondary focus:ring-gray-500'
    ]
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]'
  }

  const widthClasses = props.fullWidth ? 'w-full' : ''

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    sizeClasses[props.size],
    widthClasses
  ].join(' ')
})
</script>
```

### Form Input Component

```vue
<template>
  <div class="space-y-1">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <!-- Icon -->
      <div v-if="icon" class="absolute inset-y-0 left-0 pl-3 flex items-center">
        <Icon :name="icon" class="h-5 w-5 text-gray-400" />
      </div>
      
      <!-- Clear button -->
      <button
        v-if="clearable && modelValue"
        type="button"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
        @click="clearInput"
      >
        <Icon name="x-mark" class="h-4 w-4 text-gray-400 hover:text-gray-600" />
      </button>
    </div>
    
    <!-- Error message -->
    <p v-if="error" class="form-error">{{ error }}</p>
    
    <!-- Helper text -->
    <p v-else-if="help" class="text-sm text-text-secondary">{{ help }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  error?: string
  help?: string
  icon?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  autocomplete?: string
  size?: 'sm' | 'md' | 'lg'
}

const inputClasses = computed(() => {
  const baseClasses = [
    'block w-full rounded-md border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder:text-gray-400'
  ]

  const stateClasses = props.error
    ? [
        'border-red-300 text-red-900',
        'focus:border-red-500 focus:ring-red-500',
        'bg-red-50'
      ]
    : [
        'border-border-color bg-bg-primary text-text-primary',
        'focus:border-primary focus:ring-primary/20'
      ]

  const sizeClasses = {
    sm: `px-3 py-2 text-sm min-h-[${props.icon ? '40px' : '36px'}]`,
    md: `px-3 py-2 text-base min-h-[${props.icon ? '44px' : '40px'}]`,
    lg: `px-4 py-3 text-lg min-h-[${props.icon ? '48px' : '44px'}]`
  }

  const paddingClasses = props.icon ? 'pl-10' : 'pl-3'

  return [
    ...baseClasses,
    ...stateClasses,
    sizeClasses[props.size || 'md'],
    paddingClasses
  ].join(' ')
})
</script>
```

---

## Accessibility & Performance

### Accessibility Features

#### 1. Keyboard Navigation
```vue
<template>
  <div
    role="button"
    tabindex="0"
    @keydown.enter="handleActivate"
    @keydown.space.prevent="handleActivate"
  >
    Interactive Element
  </div>
</template>
```

#### 2. ARIA Labels and Descriptions
```vue
<template>
  <button
    :aria-label="ariaLabel"
    :aria-describedby="helpId"
    :aria-expanded="isExpanded"
  >
    {{ label }}
  </button>
  <div :id="helpId" class="sr-only">{{ helpText }}</div>
</template>
```

#### 3. Focus Management
```css
/* Focus styles */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Performance Optimizations

#### 1. Component Lazy Loading
```typescript
// Router setup with lazy loading
const router = createRouter({
  routes: [
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue')
    },
    {
      path: '/orders',
      component: () => import('@/views/OrdersView.vue')
    }
  ]
})
```

#### 2. Image Optimization
```vue
<template>
  <img
    :src="imageSrc"
    :alt="imageAlt"
    loading="lazy"
    decoding="async"
    class="w-full h-auto"
  />
</template>
```

#### 3. Bundle Analysis
```bash
pnpm bundle:analyze  # Analyze bundle size
pnpm performance:lighthouse  # Run Lighthouse audits
```

---

## Development Workflow

### Component Development Process

1. **Design Tokens**: Define colors, spacing, typography
2. **Atomic Components**: Build basic atoms (Button, Input, Icon)
3. **Molecule Components**: Combine atoms into molecules
4. **Organism Components**: Build complex organisms
5. **Page Templates**: Compose organisms into layouts
6. **Testing**: Unit, integration, and accessibility tests

### Storybook Integration

```bash
pnpm storybook                    # Start Storybook dev server  
pnpm storybook:build             # Build static Storybook
pnpm storybook:generate          # Generate stories for components
pnpm storybook:audit             # Run accessibility audit
```

#### Example Story
```typescript
// Button.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import Button from './Button.vue'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A flexible button component with multiple variants and sizes.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost']
    },
    size: {
      control: 'select', 
      options: ['sm', 'md', 'lg']
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Primary Button'
  }
}

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="space-x-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    `
  })
}
```

### Testing Strategy

#### Unit Testing with Vitest
```typescript
// Button.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Button from './Button.vue'

describe('Button', () => {
  it('renders with correct variant class', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
        label: 'Test Button'
      }
    })
    
    expect(wrapper.classes()).toContain('bg-primary')
    expect(wrapper.text()).toBe('Test Button')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
```

#### E2E Testing with Playwright
```typescript
// navigation.spec.ts
import { test, expect } from '@playwright/test'

test('sidebar navigation works correctly', async ({ page }) => {
  await page.goto('/dashboard')
  
  // Test sidebar collapse
  await page.click('[aria-label="Collapse sidebar"]')
  await expect(page.locator('.sidebar')).toHaveClass(/w-16/)
  
  // Test navigation
  await page.click('[data-testid="nav-orders"]')
  await expect(page).toHaveURL(/\/orders/)
})
```

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    // Bundle analyzer
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue'],
          charts: ['chart.js', 'vue-chartjs']
        }
      }
    }
  }
})
```

---

## Conclusion

This Kitchen Pantry CRM design system provides a comprehensive foundation for building consistent, accessible, and performant food service industry applications. The atomic design approach, combined with Vue.js 3 and modern CSS practices, creates a scalable and maintainable codebase.

### Key Benefits

- **Consistency**: Unified design tokens and component patterns
- **Accessibility**: WCAG 2.1 AA compliance with comprehensive focus management
- **Performance**: Optimized bundle sizes and lazy loading
- **Developer Experience**: TypeScript support, Storybook documentation, comprehensive testing
- **Scalability**: Atomic design pattern supports growth and maintenance

### Next Steps

1. Expand component library with industry-specific patterns
2. Add advanced data visualization components
3. Implement advanced accessibility features (screen reader optimization)
4. Add animation and microinteraction patterns
5. Develop mobile-first progressive web app features

---

*This design guide serves as the single source of truth for UI/UX implementation across the Kitchen Pantry CRM application.*