# Dashboard Section - UI Migration Plan

## Global Elements

### Application Layout Architecture

**Layout Manager System**
- **LayoutManager Component**: Central orchestrator controlling layout switching based on route meta
- **Layout Types**: 
  - DefaultLayout: Main application interface with sidebar navigation
  - AuthLayout: Authentication pages with centered content
  - FullscreenLayout: Modal and overlay interfaces
- **Layout Persistence**: Sidebar collapse state persisted to localStorage (`kitchen-pantry-sidebar-collapsed`)

**Default Layout Structure**
- **Sidebar Navigation**: Left-side collapsible navigation panel
  - Width: Medium (md) with responsive behavior
  - Sections: Main, CRM, Settings
  - Collapsible functionality with toggle persistence
  - Footer actions and user menu integration
- **Application Header**: Top header bar
  - Application branding and logo
  - Search functionality (configurable)
  - Notifications center with count badges
  - User menu with profile, settings, help, activity, logout options
  - Mobile menu toggle for responsive design
- **Main Content Area**: Central content container
  - Responsive padding using clamp() functions
  - Breadcrumb navigation (configurable)
  - Page-specific content rendering area

### Navigation Architecture

**Primary Navigation Sections**
- **Main Section**:
  - Dashboard (home icon)
  - Sales Overview (chart-bar-square icon)
- **CRM Section**:
  - Organizations (building-office icon)
  - Contacts (users icon)
  - Interactions (chat-bubble-left-right icon)
  - Opportunities (currency-dollar icon)
  - Products (cube icon)
  - Principals (star icon)
- **Settings Section**:
  - User preferences and system configuration

**Navigation Features**
- Active state management with route-based highlighting
- Icon integration using semantic icon names
- Badge support for counters and notifications
- Hierarchical structure with expandable sections
- Mobile-responsive menu system

### Global Design System

**Color Palette**
- **Light Theme (Default)**:
  - Primary Background: #ffffff
  - Secondary Background: #f8fafc
  - Tertiary Background: #f1f5f9
  - Primary Text: #0f172a
  - Secondary Text: #64748b
  - Border Color: #e2e8f0
- **Dark Theme Support**:
  - Primary Background: #1e293b
  - Secondary Background: #334155
  - Tertiary Background: #475569
  - Primary Text: #f8fafc
  - Secondary Text: #cbd5e1
  - Border Color: #475569

**Brand Colors**
- **Primary**: #3b82f6 (hover: #2563eb)
- **Success**: #10b981
- **Warning**: #f59e0b
- **Danger**: #ef4444
- **Accent Primary**: #3b82f6
- **Accent Secondary**: #2563eb

**Typography System**
- **Font Family**: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, etc.)
- **Font Sizes**:
  - Extra Small: 12px
  - Small: 14px
  - Base: 16px
  - Large: 18px
  - Extra Large: 24px
  - 2X Large: 32px
  - Responsive sizes using clamp() for larger headers

**Spacing System**
- **Micro**: 4px
- **Small**: 8px
- **Medium**: 16px
- **Large**: 24px
- **Extra Large**: 32px

**Interaction Design**
- **Touch Targets**: Minimum 48px for accessibility compliance
- **Recommended**: 44px for comfortable interaction
- **Minimum**: 32px for dense interfaces
- **Animation Durations**: Fast (150ms), Normal (300ms), Slow (500ms)
- **Easing Functions**: Spring and bounce effects for enhanced user experience

**Component Styling Standards**
- **Buttons**: Inline-flex layout, consistent padding, transition effects, focus ring for accessibility
- **Cards**: Rounded corners (0.5rem), box shadows, border styling
- **Form Inputs**: Consistent height (40px default), focus states, validation styling
- **Icons**: Semantic sizing scale (12px to 40px)

**Accessibility Features**
- Focus-visible outline styling (2px solid primary color, 2px offset)
- High contrast mode support with enhanced border widths
- Reduced motion support for users with vestibular disorders
- WCAG 2.1 AA compliance standards
- Semantic HTML structure and ARIA attributes

**Responsive Design Strategy**
- Mobile-first approach with progressive enhancement
- Container-based responsive padding using clamp()
- Adaptive navigation with mobile menu system
- Responsive typography scaling
- Touch-friendly interface elements

---

## Section-Specific Elements

### Dashboard Architecture

**Page Structure Hierarchy**
- **DashboardView**: Central command center with comprehensive business intelligence and quick access controls

### Enhanced Accessibility Framework

**Comprehensive Accessibility Implementation**
- **Skip Navigation Links**: Direct keyboard access to main content with focus management
- **Screen Reader Support**: 
  - Live regions for dynamic content announcements (aria-live="polite")
  - Atomic updates for complete message delivery (aria-atomic="true")
  - Semantic HTML structure with proper heading hierarchy
- **Keyboard Navigation**: 
  - Tab order optimization for logical flow
  - Focus indicators with high contrast visibility
  - Keyboard shortcuts for common dashboard actions
- **Visual Accessibility**: 
  - High contrast mode support with enhanced border definitions
  - Font size scaling compatibility
  - Color-blind friendly color combinations
  - Reduced motion support for vestibular disorders

### Sticky Header Architecture

**Persistent Navigation and Context**
- **Fixed Header Design**: 
  - Sticky positioning with z-index management (z-40)
  - White background with subtle border for visual separation
  - Responsive padding with max-width container for content alignment
- **Brand and Identity Section**: 
  - "KitchenPantry CRM" branding with appropriate font weight
  - Semantic role attribution (role="banner") for screen readers
  - Professional typography hierarchy

**Personalized Greeting System**
- **Dynamic Time-Based Greetings**: 
  - Morning, afternoon, evening contextual messaging
  - Personalized user name integration with fallback handling
  - Current date display with proper formatting
- **User Context Display**: 
  - User avatar with icon fallback and color theming
  - Role and permission level indication
  - Responsive user information layout

### Dashboard Widget Architecture

**Modular Dashboard Components**
- **Widget Grid System**: 
  - Responsive grid layout adapting to screen sizes
  - Draggable and resizable widget functionality
  - Customizable widget placement and priority
  - Widget state persistence across user sessions
- **Key Performance Indicator Widgets**: 
  - Sales pipeline health with stage distribution visualization
  - Contact engagement metrics with interaction frequency analysis
  - Product performance tracking

**Real-Time Data Integration**
- **Live Dashboard Updates**: 
  - WebSocket integration for real-time data streaming
  - Automatic refresh intervals with user-configurable timing
  - Visual indicators for stale or updating data
  - Error handling for connectivity issues with graceful degradation
- **Performance Optimization**: 
  - Lazy loading for non-critical dashboard components
  - Data caching strategies for frequently accessed metrics
  - Progressive loading with skeleton screens
  - Efficient re-rendering for data updates

### Business Intelligence Dashboard

**Comprehensive Analytics Visualization**
- **Performance Analytics**: 
  - Team performance comparisons with leaderboard integration
  - Conversion funnel analysis with stage-by-stage breakdown
- **Customer Relationship Metrics**: 
  - Contact engagement scoring with interaction quality assessment
  - Organization health monitoring with relationship strength indicators
  - Communication frequency analysis with channel effectiveness
  - Customer satisfaction tracking with feedback integration

**Interactive Chart and Graph Components**
- **Dynamic Visualization Tools**: 
  - Interactive charts with drill-down capabilities
  - Customizable chart types (bar, line, pie, scatter, heat map)
  - Export functionality for reports and presentations
  - Mobile-responsive chart scaling and touch interaction
- **Data Filtering and Segmentation**: 
  - Advanced filter controls with multi-criteria selection
  - Date range selection with preset options and custom ranges
  - User and team-based data segmentation
  - Geographic and demographic filtering options

### Quick Action Command Center

**Streamlined Workflow Access**
- **One-Click Operations**: 
  - Quick contact creation with minimal required fields
  - Rapid opportunity logging with template-based entry
  - Instant interaction recording with voice-to-text support
  - Fast product lookup and availability checking
- **Shortcut Navigation**: 
  - Bookmarked frequently accessed pages
  - Recent items access with intelligent prioritization
  - Search functionality with autocomplete and suggestion
  - Customizable quick action buttons based on user role

**Task and Activity Management**
- **Centralized Task Dashboard**: 
  - Today's tasks with priority ranking and due time display
  - Overdue items with escalation indicators
  - Upcoming deadlines with proactive alert system
  - Task completion tracking with progress visualization
- **Activity Feed Integration**: 
  - Real-time team activity stream with relevance filtering
  - Personal activity timeline with context and outcome tracking
  - System notifications with customizable alert preferences
  - Integration with external calendar and task management systems

### Customization and Personalization

**User-Centric Dashboard Configuration**
- **Widget Customization**: 
  - Drag-and-drop widget arrangement with grid snapping
  - Widget size adjustment with content-aware resizing
  - Color theme selection with brand alignment options
  - Widget visibility controls based on user role and preferences
- **Data Personalization**: 
  - Customizable KPI selection and calculation methods
  - Personal goal setting and tracking with achievement recognition
  - Favorite reports and dashboard views with quick access
  - Notification preferences with channel and frequency controls

**Role-Based Dashboard Views**
- **Executive Dashboard**: 
  - High-level business metrics with executive summary format
  - Strategic goal tracking with long-term trend analysis
  - Board-ready reports with professional formatting
  - Competitive analysis and market positioning insights
- **Sales Team Dashboard**: 
  - Individual and team performance metrics with gamification
  - Pipeline management with stage progression tracking
  - Quota tracking with achievement visualization
  - Lead and opportunity prioritization with scoring algorithms
- **Operations Dashboard**: 
  - Operational efficiency metrics with process optimization
  - Resource utilization tracking with capacity planning
  - Quality metrics with continuous improvement tracking
  - Compliance monitoring with regulatory requirement tracking

### Mobile and Responsive Dashboard

**Mobile-Optimized Experience**
- **Touch-First Interface Design**: 
  - Large touch targets with appropriate spacing
  - Swipe gestures for navigation and data interaction
  - Responsive card layouts adapting to screen orientation
  - Optimized loading for mobile network conditions
- **Progressive Web App Features**: 
  - Offline dashboard viewing with cached data
  - Push notifications for critical alerts and updates
  - Home screen installation with native app-like experience
  - Background synchronization for data consistency

**Cross-Device Synchronization**
- **Consistent Experience**: 
  - Dashboard customization sync across devices
  - Unified notification system with read state management
  - Seamless handoff between mobile and desktop sessions
  - Cloud-based preference storage with instant synchronization
- **Device-Specific Optimizations**: 
  - Desktop-specific keyboard shortcuts and efficiency features
  - Tablet-optimized layouts with enhanced touch interaction
  - Mobile-specific quick actions and simplified workflows
  - Smart TV and large display optimizations for presentation modes


  # Food Service CRM Dashboard: Vue 3 MVP Implementation Guide

## **Weekly-Filtered Dashboard Architecture**

### **Core Implementation Structure**

**Week Selection Component**
- **Monday-based calendar picker** with dropdown interface highlighting only Mondays[1][2][3]
- **Date filtering logic** applied across all dashboard components using Vue 3's Composition API
- **Default current week view** with ability to navigate to any previous Monday-starting week

**Essential Widget Configuration**

#### **1. Customer & Organization Quick Search**
- **Search input component** with real-time filtering capabilities
- **Card-based display** following minimalist design principles[4][5]
- **Touch-optimized interface** for mobile accessibility

#### **2. Recent Interactions Panel**
- **List display** showing last 5 interactions filtered by selected week
- **Interaction name and account manager** information clearly displayed
- **Jakob's Law compliance** using familiar list patterns users expect[6][7][8]

#### **3. Opportunities Overview**
- **Last 5 opportunities** within the weekly timeframe
- **Name and account manager** pairing for quick reference
- **Visual priority indicators** using color coding for urgency levels

### **Data Visualization Components**

#### **Bar Chart Implementation**
**-Chart.js integration**[9][10][11] with responsive design
- **Horizontal bar configuration** for better mobile viewing[12]
- **Stage-based color coding** for instant visual recognition
- **Real-time updates** based on week filter selection

**Weekly Interactions Chart**
- **Total interaction count** visualization by day within selected week
- **Consistent color palette** following aesthetic-usability principles[4]
- **Touch-friendly hover states** for mobile optimization

#### **Kanban Board Layout**
**Sales Stage Progression**
- **Non-draggable card display** showing organization progression[13][14][15]
- **Three-tier information hierarchy**: Organization name, Principal name, Account Manager
- **Responsive column layout** adapting to mobile screens[16][17]
- **Weekly filtering** applied to show only relevant stage movements

### **Mobile Optimization Strategy**

#### **Responsive Design Implementation**
**Breakpoint Configuration**[18][19][20]
- **Vue 3 responsive utilities** with custom breakpoints at 576px, 768px, 992px
- **Touch-friendly interactions** with minimum 48px target sizes[21]
- **Gesture-based navigation** for Kanban stage swiping[16]

**Card Layout Adaptation**
- **Simplified information density** on smaller screens
- **Generous whitespace** around interactive elements[4]
- **Clear typography hierarchy** maintaining readability across devices

### **Psychological Design Principles Integration**

#### **Cognitive Load Management**
**Hick's Law Application**[22][23]
- **Limited action options** in each interface section
- **Progressive disclosure** of detailed information
- **Recognition over recall** design patterns

**Jakob's Law Implementation**[6][7][8][24]
- **Familiar CRM terminology** and layout patterns
- **Consistent navigation paradigms** users expect from other business applications
- **Conventional interaction patterns** reducing learning curve

#### **Visual Hierarchy Principles**
**Information Architecture**[25][4][5]
- **5-second rule compliance** placing critical information in top-left quadrant
- **Inverted pyramid structure** with insights at top, trends in middle, details at bottom
- **Card-based organization** for consistent visual grouping

**Aesthetic-Usability Effect**[4][22]
- **Professional color palette** with high contrast ratios
- **Quality iconography** for actions and status indicators
- **Consistent spacing** following established grid systems

### **Technical Implementation Details**

#### **Vue 3 Component Structure**[26]
```
src/
├── components/
│   ├── WeekSelector.vue
│   ├── SearchWidget.vue
│   ├── InteractionsList.vue
│   ├── OpportunitiesList.vue
│   ├── OpportunityChart.vue
│   ├── InteractionChart.vue
│   └── KanbanBoard.vue
├── composables/
│   ├── useWeekFilter.js
│   ├── useResponsive.js
│   └── useDashboardData.js
└── views/
    └── DashboardView.vue
```

#### **State Management**
- **Pinia store** for centralized week filter state
- **Reactive data flow** ensuring all components update with filter changes
- **Cached API responses** for performance optimization

#### **Performance Considerations**
- **Lazy loading** for chart components[26]
- **Debounced search** functionality to prevent excessive API calls
- **Optimized re-rendering** using Vue 3's reactivity system

This MVP implementation provides a solid foundation for the food service CRM dashboard while maintaining psychological design principles, responsive functionality, and efficient Vue 3 architecture patterns. The weekly filtering system creates a focused workflow that helps users concentrate on relevant time-bound activities without overwhelming cognitive load.

# Food Service CRM: Left Navigation Sidebar Implementation Guide

## **MVP-Focused Sidebar Component Architecture**

### **Core Design Specifications**

**Left-Side Navigation Structure**[1][2]
- **Collapsible interface** with hamburger toggle functionality
- **Fixed positioning** maintaining visibility across all pages
- **Weekly data filtering** synchronized with dashboard content
- **Professional appearance** following aesthetic-usability principles

### **Essential Navigation Items**

**Primary Menu Structure**
- **Organizations** - Client management hub
- **Contacts** - Individual contact management
- **Opportunities** - Sales pipeline tracking  
- **Interactions** - Communication history
- **Products** - Service/product catalog
- **Reports** - Analytics and insights dashboard

### **Vue 3 Component Implementation**

#### **Technical Architecture**

**Component Structure**[3][4]
```
src/
├── components/
│   ├── sidebar/
│   │   ├── SidebarContainer.vue
│   │   ├── SidebarToggle.vue
│   │   ├── NavigationItem.vue
│   │   └── SidebarFooter.vue
├── composables/
│   ├── useSidebar.js
│   └── useWeekFilter.js
└── layouts/
    └── DashboardLayout.vue
```
- **Pinia store integration** for collapse state persistence
- **localStorage synchronization** maintaining user preferences
- **Reactive collapse state** across all dashboard components

#### **Accessibility Standards Implementation**[5][6]

**WCAG 2.1 AA Compliance**[7][8]
- **Keyboard navigation support** with Tab/Enter/Space key controls
- **Screen reader compatibility** using proper ARIA labels and roles
- **Focus management** with visible focus indicators
- **Skip navigation links** for efficient keyboard users

**Semantic HTML Structure**
```html

  
    Menu Toggle
  
  
    
      Organizations
    
  

```

### **Design Principles Integration**

#### **Jakob's Law Implementation**[9][10]
- **Familiar CRM terminology** reducing cognitive load
- **Standard left-side positioning** following established patterns
- **Consistent iconography** using universally recognized symbols

#### **Progressive Disclosure Pattern**[11][12]
- **Collapsed state** showing only essential icons
- **Expanded state** revealing full navigation labels
- **Smooth transitions** between states for visual continuity

#### **Mobile-First Responsive Design**[13][14]
- **Touch-friendly targets** minimum 48px interaction areas
- **Overlay behavior** on mobile devices with backdrop
- **Gesture support** for swipe-to-close functionality

### **Food Service Industry Optimization**

#### **Context-Aware Navigation**[15][16]
- **Customer-centric organization** prioritizing relationship management
- **Quick access patterns** for frequent food service workflows
- **Industry-specific terminology** aligned with distributor operations

#### **Performance Considerations**[17][18]
- **Lazy loading** for navigation sub-components
- **Efficient state management** preventing unnecessary re-renders
- **Cached preferences** for instant sidebar state restoration

### **Implementation Best Practices**

#### **Component Props Configuration**[1][19]
- **Collapsible state**: Boolean control for expand/collapse
- **Width customization**: Configurable expanded/collapsed widths
- **Animation duration**: Smooth transition timing controls
- **Persistent state**: localStorage integration for user preferences

#### **Event Handling System**[20][21]
- **Toggle events**: Sidebar expand/collapse state changes
- **Navigation events**: Route changes and active state management
- **Keyboard events**: Accessibility navigation support
- **Responsive events**: Breakpoint-based behavior adjustments

### **Visual Design Elements**

#### **Professional Aesthetic**[11][22]
- **Consistent color palette** with high contrast ratios
- **Typography hierarchy** ensuring readability across devices
- **Generous whitespace** preventing visual clutter
- **Subtle animations** enhancing user experience without distraction

#### **Brand Integration**
- **Company logo placement** in sidebar header
- **Brand color application** maintaining visual consistency
- **Custom icon library** reflecting food service industry context

### **Testing and Quality Assurance**

#### **Cross-Browser Compatibility**
- **Modern browser support** (Chrome, Firefox, Safari, Edge)
- **Progressive enhancement** for older browser versions
- **Mobile browser optimization** for field team access

#### **Accessibility Testing**[7]
- **Screen reader validation** using NVDA, JAWS, VoiceOver
- **Keyboard navigation testing** ensuring full functionality
- **Color contrast verification** meeting WCAG standards
- **Mobile accessibility testing** across different devices

This comprehensive sidebar implementation provides a solid foundation for the food service CRM, balancing technical excellence with user-centered design principles while maintaining focus on MVP delivery and industry-specific requirements.