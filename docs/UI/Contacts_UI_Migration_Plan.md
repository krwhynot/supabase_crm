# Contacts Section - UI Migration Plan

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

### Contacts Section Architecture

**Page Structure Hierarchy**
- **ContactsListView**: Main landing page with comprehensive contact management
- **ContactDetailView**: Individual contact information display
- **ContactEditView**: Contact modification interface
- **ContactCreateView**: New contact creation workflow
- **ContactMasterDetail**: Split-view interface for contact browsing and editing

### ContactsListView Components

**Page Header Structure**
- **Title Section**: "Contacts" heading with descriptive subtext
- **Action Toolbar**: 
  - Import functionality (upload icon + "Import" label)
  - Create new contact (plus icon + "New Contact" label)
  - Secondary button styling for import, primary for create action

**Advanced Search Interface**
- **Search Component**: AdvancedSearch with comprehensive filtering
- **Search Features**:
  - Real-time search query input with placeholder "Search contacts..."
  - Quick filter buttons for rapid categorization
  - Advanced filter groups for detailed refinement
  - Filter state management with change event handling
- **View Mode Toggle**:
  - Grid view option for card-based display
  - List view option for tabular presentation
  - Toggle button group with active state styling

**Data Display Components**
- **Contact Grid View**: Card-based layout for visual contact browsing
- **Contact List View**: Tabular format for dense information display
- **Contact Cards**: Individual contact preview components with:
  - Profile avatar or initials
  - Primary contact information (name, title, organization)
  - Secondary metadata (phone, email, last interaction)
  - Action buttons for quick operations

**Filter and Sort Systems**
- **Quick Filters**: Pre-configured filter buttons for common contact segments
- **Filter Groups**: Organized filtering categories (e.g., by organization, contact type, status)
- **Sort Options**: Multiple sorting criteria with ascending/descending toggle
- **Filter State Persistence**: Maintain user filter preferences across sessions

### Contact Detail and Edit Views

**Contact Information Sections**
- **Primary Information Panel**: Essential contact details (name, title, organization)
- **Contact Methods Section**: Phone numbers, email addresses, social profiles
- **Organization Relationship**: Company affiliation and role details
- **Interaction History**: Timeline of past communications and meetings
- **Notes and Tags**: Free-form notes and categorization tags
- **Related Opportunities**: Connected sales opportunities and deals

**Form Interface Components**
- **Multi-step Form Layout**: Organized information input across logical sections
- **Field Validation**: Real-time validation with error state styling
- **Auto-save Functionality**: Draft saving to prevent data loss
- **Media Upload**: Profile image and document attachment support
- **Relationship Mapping**: Organization and opportunity linking interfaces

### Contact Master-Detail Interface

**Split-view Layout**
- **Contact List Panel**: Compressed contact listing for navigation
- **Detail Panel**: Full contact information display
- **Responsive Behavior**: Single-panel view on mobile devices
- **Navigation Controls**: Previous/next contact browsing
- **Quick Edit Mode**: Inline editing capabilities within detail view

**Interaction Patterns**
- **Click-to-Select**: Contact selection updates detail panel
- **Keyboard Navigation**: Arrow key support for contact browsing
- **Search Integration**: Real-time filtering of contact list
- **Context Actions**: Right-click or long-press for action menus

### Data Management Features

**Import/Export Functionality**
- **Contact Import Wizard**: Step-by-step import process for external contact data
- **File Format Support**: CSV, Excel, vCard compatibility
- **Field Mapping Interface**: Column-to-field assignment during import
- **Validation and Preview**: Data validation before final import
- **Export Options**: Selective contact export with format options

**Bulk Operations**
- **Multi-select Interface**: Checkbox selection for multiple contacts
- **Bulk Action Toolbar**: Actions applicable to selected contact groups
- **Progress Indicators**: Status feedback for long-running operations
- **Undo Functionality**: Reversible operations with confirmation dialogs

### State Management Integration

**Contact Data Handling**
- **Real-time Updates**: Live data synchronization with backend
- **Optimistic Updates**: Immediate UI updates with rollback on failure
- **Conflict Resolution**: Handling concurrent edit scenarios
- **Offline Support**: Local data caching and synchronization

**Search and Filter State**
- **URL State Persistence**: Search and filter state in browser URL
- **Session Persistence**: Maintain user preferences across browser sessions
- **Performance Optimization**: Debounced search and efficient filtering
- **Analytics Integration**: User interaction tracking for feature improvement