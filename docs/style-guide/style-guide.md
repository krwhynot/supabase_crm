# Global UI Style Guide

**Version:** 1.0  
**Last Updated:** 2025  
**Authority:** System Architecture & UX Strategy

This document serves as the single source of truth for all visual design and front-end implementation standards across our organization. All new UI development must adhere to these guidelines.

---

## Typography

### Font Families

**Primary Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Monospace Font Stack:**
```css
font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
```

### Font Sizes

Use rem-based sizing for accessibility. Base font size: 16px (1rem).

**Scale:**
- **Extra Small:** 0.75rem (12px)
- **Small:** 0.875rem (14px)
- **Base:** 1rem (16px)
- **Large:** 1.125rem (18px)
- **Extra Large:** 1.25rem (20px)
- **2X Large:** 1.5rem (24px)
- **3X Large:** 2rem (32px)
- **4X Large:** 2.5rem (40px)
- **5X Large:** 3rem (48px)

### Font Weights

- **Light:** 300
- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

### Line Heights

- **Tight:** 1.25
- **Normal:** 1.5
- **Relaxed:** 1.75

### Accessibility Requirements

- Minimum font size: 14px (0.875rem) for body text
- Minimum font size: 12px (0.75rem) for supplementary text
- Maintain 4.5:1 contrast ratio for normal text
- Maintain 3:1 contrast ratio for large text (18px+ or 14px+ bold)

---

## Colors

### Primary Palette

**Blue (Primary)**
- `blue-50`: #eff6ff
- `blue-100`: #dbeafe
- `blue-500`: #3b82f6 (Primary)
- `blue-600`: #2563eb (Primary Hover)
- `blue-700`: #1d4ed8
- `blue-900`: #1e3a8a

**Green (Success)**
- `green-50`: #f0fdf4
- `green-100`: #dcfce7
- `green-500`: #22c55e (Success)
- `green-600`: #16a34a (Success Hover)
- `green-700`: #15803d

**Red (Error/Danger)**
- `red-50`: #fef2f2
- `red-100`: #fee2e2
- `red-500`: #ef4444 (Error)
- `red-600`: #dc2626 (Error Hover)
- `red-700`: #b91c1c

**Yellow (Warning)**
- `yellow-50`: #fefce8
- `yellow-100`: #fef3c7
- `yellow-500`: #eab308 (Warning)
- `yellow-600`: #ca8a04 (Warning Hover)

### Neutral Palette

**Gray**
- `gray-50`: #f9fafb
- `gray-100`: #f3f4f6
- `gray-200`: #e5e7eb
- `gray-300`: #d1d5db
- `gray-400`: #9ca3af
- `gray-500`: #6b7280
- `gray-600`: #4b5563
- `gray-700`: #374151
- `gray-800`: #1f2937
- `gray-900`: #111827

### Usage Guidelines

- **Primary Actions:** Use `blue-500` with `blue-600` hover
- **Success Messages:** Use `green-500` background with `green-700` text
- **Error Messages:** Use `red-500` background with `red-700` text
- **Warning Messages:** Use `yellow-500` background with `yellow-700` text
- **Text:** Use `gray-900` for primary text, `gray-600` for secondary text

### Contrast Requirements

All color combinations must meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 minimum contrast ratio
- Large text: 3:1 minimum contrast ratio
- UI components: 3:1 minimum contrast ratio

---

## Layout & Spacing

### Grid System

**Container Widths:**
- **Small:** 640px
- **Medium:** 768px
- **Large:** 1024px
- **Extra Large:** 1280px
- **2X Large:** 1536px

**Grid Columns:** 12-column system with flexible gutters

### Spacing Scale

Use consistent spacing values based on 4px increments:

- `0.5`: 2px
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px
- `6`: 24px
- `8`: 32px
- `10`: 40px
- `12`: 48px
- `16`: 64px
- `20`: 80px
- `24`: 96px

### Margin & Padding Principles

- Use consistent spacing scale for all margins and padding
- Maintain visual hierarchy through spacing relationships
- Ensure touch targets are minimum 44px for mobile interfaces
- Apply consistent vertical rhythm using line-height multiples

### Alignment Rules

- Left-align body text for optimal readability
- Center-align headings and UI elements when appropriate
- Maintain consistent baseline grids for typography
- Use consistent indentation (24px) for nested content

---

## Iconography

### Icon Library

**Required:** Use only icons from our standardized icon library (Heroicons, Lucide, or approved custom set).

### Icon Sizes

- **Extra Small:** 12px
- **Small:** 16px
- **Medium:** 20px
- **Large:** 24px
- **Extra Large:** 32px
- **2X Large:** 40px

### Usage Guidelines

- Use consistent icon sizes within similar contexts
- Ensure icons have proper alt text or aria-label attributes
- Maintain 1:1 aspect ratio for all icons
- Use outline style for primary actions, solid for active states

### Accessibility Requirements

- Provide text alternatives for informative icons
- Use `aria-hidden="true"` for decorative icons
- Ensure icons meet 3:1 contrast ratio requirements
- Include text labels alongside icons when possible

---

## Components

### Component Requirements

**Mandatory:** All new UIs must use documented, reusable components from our component library.

### Core Components

**Buttons**
- Primary, secondary, tertiary, and danger variants
- Small (32px), medium (40px), and large (48px) sizes
- Loading, disabled, and icon states
- Consistent padding and border radius (6px)

**Form Controls**
- Text inputs, textareas, select dropdowns
- Consistent height (40px for medium size)
- Focus states with 2px blue outline
- Error states with red border and icon

**Cards**
- Consistent border radius (8px)
- Standard shadow levels
- Proper padding and content organization

**Modals & Overlays**
- Backdrop blur and dark overlay
- Consistent positioning and sizing
- Escape key and click-outside handling

### Component Guidelines

- Follow established component APIs and props
- Maintain consistent visual hierarchy
- Implement proper focus management
- Include loading and error states

---

## Responsive Design

### Breakpoints

**Required breakpoints for all UI development:**

- **Mobile:** 0px - 767px
- **Tablet:** 768px - 1023px  
- **Desktop:** 1024px - 1279px
- **Large Desktop:** 1280px+

### Testing Requirements

**Mandatory:** All UIs must be tested across multiple devices and screen sizes:

- iPhone SE (375px)
- iPad (768px)
- MacBook Air (1280px)
- Large Desktop (1920px)

### Responsive Principles

- Mobile-first approach for CSS media queries
- Touch-friendly interface elements (44px minimum)
- Readable text without horizontal scrolling
- Appropriate content prioritization across screen sizes

---

## Accessibility (A11y)

### ARIA Guidelines

**Required implementation:**
- Proper ARIA labels for interactive elements
- ARIA live regions for dynamic content updates
- ARIA expanded/collapsed states for toggles
- Descriptive ARIA labels for form controls

### Keyboard Navigation

**Mandatory requirements:**
- All interactive elements must be keyboard accessible
- Logical tab order throughout the interface
- Visible focus indicators (2px blue outline, 2px offset)
- Escape key support for modals and dropdowns

### Semantic HTML

**Required structure:**
- Proper heading hierarchy (h1-h6)
- Semantic landmarks (nav, main, aside, footer)
- Lists for grouped content (ul, ol, dl)
- Form labels properly associated with inputs

### Screen Reader Support

- Meaningful alt text for images
- Descriptive link text (no "click here")
- Hidden content properly marked with `sr-only` classes
- Complex data tables with proper headers

---

## Performance

### Asset Optimization

**Required optimizations:**
- Images: WebP format with fallbacks, proper sizing
- Fonts: Preload critical fonts, font-display: swap
- Icons: Use SVG sprites or icon fonts
- CSS: Minimize and compress, remove unused styles

### Loading Performance

**Benchmarks:**
- First Contentful Paint: <1.5 seconds
- Largest Contentful Paint: <2.5 seconds
- First Input Delay: <100 milliseconds
- Cumulative Layout Shift: <0.1

### Optimization Strategies

- Lazy load non-critical images and content
- Minimize render-blocking resources
- Use efficient CSS selectors and avoid deep nesting
- Implement proper caching strategies
- Bundle splitting for code optimization

### Performance Monitoring

**Required:** Regular performance audits using:
- Lighthouse for Core Web Vitals
- WebPageTest for detailed analysis
- Real user monitoring in production
- Performance budgets for build processes

---

## UI Design Laws & Principles

### Core Design Psychology Laws

These fundamental UI design laws must be applied throughout all interface development to ensure optimal user experience and behavior.

**Jakob's Law** - Users expect familiar patterns from other applications
- Place search functionality in top-right corner consistently
- Position primary navigation in left sidebar following standard CRM conventions
- Use established icon conventions (hamburger menu, magnifying glass for search)

**Hick's Law** - More choices increase decision time exponentially
- Limit main navigation menu to 5-7 items maximum
- Hide advanced options under "More" or secondary menus
- Group related actions to reduce cognitive load

**Fitts's Law** - Larger, closer targets are easier and faster to hit
- Make primary action buttons larger and more prominent (48px minimum)
- Position frequently used actions closer to user's natural interaction zones
- Increase button size for touch interfaces (44px minimum)

**Aesthetic-Usability Effect** - Beautiful interfaces feel more usable and forgiving
- Use high-quality imagery and consistent visual branding
- Maintain clean, uncluttered layouts with proper white space
- Apply consistent color schemes and typography throughout

**Law of Proximity** - Related elements should be grouped together visually
- Group related form fields and information together
- Keep actions close to the content they affect
- Use consistent spacing to show relationships between elements

**Progressive Disclosure** - Show only what's needed now, reveal more on demand
- Display primary information first, allow expansion for details
- Use progressive forms that reveal fields as needed
- Implement collapsible sections for complex interfaces

**Miller's Law** - People can hold 7±2 items in short-term memory
- Limit dashboard widgets to 5-7 key metrics
- Break long lists into chunked sections
- Use pagination or infinite scroll for extensive data sets

**Doherty Threshold** - System response under 400ms feels instant
- Show loading placeholders for any action taking >200ms
- Provide progress indicators for operations >1 second
- Use optimistic UI updates where appropriate

**Law of Similarity** - Similar-looking elements feel functionally related
- Use consistent styling for all buttons of the same type
- Apply uniform icon styles throughout the interface
- Maintain consistent spacing and alignment patterns

**Zeigarnik Effect** - People remember incomplete tasks better than completed ones
- Show progress indicators: "3 of 5 required fields completed"
- Highlight missing information in forms and workflows
- Use visual cues to indicate incomplete processes

### Behavioral Design Principles

**Goal-Gradient Effect** - Motivation increases as users approach goal completion
- Display progress toward completion: "2 more items needed for free shipping"
- Show advancement through multi-step processes
- Highlight proximity to achieving objectives

**Von Restorff Effect** - Different items stand out and are remembered better
- Highlight special offers, alerts, or important actions with distinct styling
- Use color contrast to emphasize critical information
- Make primary actions visually distinct from secondary ones

**Tesler's Law** - Complexity cannot be eliminated, only moved around
- Auto-fill known information to simplify user input
- Move complexity to the system rather than burdening users
- Provide smart defaults while allowing customization

**Peak-End Rule** - Experiences are judged by peak moment and ending
- Ensure confirmation pages and completion states are well-designed
- Make success messages delightful and reassuring
- End user journeys with positive, clear outcomes

**Serial Position Effect** - First and last items in lists are remembered best
- Place most important navigation items first and last
- Position critical information at the beginning or end of content
- Structure forms with essential fields at top and bottom

### Implementation Requirements

**Consistency Principle** - Similar actions should work the same way
- Use identical button styles and placement across all forms
- Maintain consistent interaction patterns throughout the application
- Apply uniform terminology and labeling conventions

**Feedback Principle** - Every user action needs a clear response
- Show "Added to cart" or success messages for all interactions
- Provide visual feedback for hover, focus, and active states
- Use appropriate micro-animations to acknowledge user actions

**Forgiveness Principle** - Make errors easy to recover from
- Provide "Undo" options for destructive actions
- Allow easy correction of form errors without data loss
- Include confirmation dialogs for irreversible actions

### Psychological Influence Patterns

**Anchoring Bias** - First information encountered influences all subsequent decisions
- Show premium options first to establish value perception
- Present pricing in context of higher-value alternatives
- Use reference points to guide user expectations

**Framing Effect** - How information is presented affects decision-making
- Present savings as "Save $X" rather than showing reduced prices
- Frame benefits positively: "90% uptime" vs "10% downtime"
- Use action-oriented language in calls-to-action

**Loss Aversion** - People fear losing more than they value gaining
- Use time-limited offers: "Sale ends in 2 hours"
- Show what users might miss: "Only 3 spots remaining"
- Highlight potential losses from inaction

**Social Proof** - People follow others' behavior and decisions
- Display user counts: "127 people ordered this today"
- Show ratings, reviews, and testimonials prominently
- Indicate popular choices and trending items

**Reciprocity Principle** - People feel obligated to return favors
- Offer valuable content or tools before requesting information
- Provide helpful features or samples to build goodwill
- Frame requests as mutual benefit rather than one-sided asks

**Scarcity Principle** - Limited availability increases perceived value and desire
- Show inventory levels: "Only 3 remaining in stock"
- Use time constraints for special offers or availability
- Highlight exclusive or limited-access features

**Commitment Consistency** - People align future actions with stated commitments
- Ask users to set preferences, then highlight matching content
- Use quiz results to personalize recommendations
- Reference user's previous choices in future interactions

### Application Guidelines

- Apply these laws consistently across all interface elements
- Test implementations against user behavior and expectations
- Document which principles guide specific design decisions
- Review designs regularly to ensure psychological principles are properly applied

---

## Implementation Guidelines

### Code Quality

- Use semantic HTML5 elements
- Write accessible CSS with proper naming conventions
- Implement consistent component patterns
- Follow established linting and formatting rules

### Browser Support

**Minimum supported browsers:**
- Chrome: Last 2 versions
- Firefox: Last 2 versions  
- Safari: Last 2 versions
- Edge: Last 2 versions

### Development Workflow

- Validate designs against this style guide
- Conduct accessibility reviews before deployment
- Test across required breakpoints and devices
- Perform performance audits for all releases

---

**Compliance:** This style guide is mandatory for all UI development. Deviations require approval from the System Architecture and UX Strategy teams.