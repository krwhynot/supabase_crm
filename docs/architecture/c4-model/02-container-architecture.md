# Container Architecture - CRM System

## Overview

The Container Architecture diagram shows the high-level technology choices and how responsibilities are distributed across containers. This represents **Level 2** of the C4 Model hierarchy, zooming into the CRM System from the System Context.

## Container Architecture Diagram

```mermaid
C4Container
    title Container Diagram for CRM System

    Person(sales_user, "Sales User", "Sales representatives managing customer relationships")
    Person(admin_user, "Admin User", "System administrators and configuration managers")
    Person(executive_user, "Executive User", "Leadership accessing analytics and reports")

    System_Boundary(c1, "CRM System") {
        Container(spa, "Single Page Application", "Vue 3, TypeScript, Vite", "Provides the user interface and business logic for the CRM system")
        Container(sw, "Service Worker", "JavaScript, Cache API", "Enables offline functionality, background sync, and PWA capabilities")
        Container(design_system, "Design System", "Vue 3 Components, Tailwind CSS", "Reusable UI components and styling framework")
    }

    System_Boundary(c2, "State Management") {
        Container(pinia_stores, "Pinia Stores", "TypeScript, Reactive State", "Centralized state management with 10 specialized stores")
        Container(local_storage, "Browser Storage", "LocalStorage, IndexedDB", "Client-side data persistence and caching")
    }

    System_Boundary(c3, "Backend Services - Supabase") {
        ContainerDb(postgres, "PostgreSQL Database", "PostgreSQL 15+", "Stores contacts, organizations, opportunities, and all business data")
        Container(supabase_api, "Supabase API", "PostgREST, Node.js", "Auto-generated REST API from PostgreSQL schema")
        Container(supabase_auth, "Supabase Auth", "GoTrue, JWT", "User authentication, session management, and authorization")
        Container(supabase_realtime, "Supabase Realtime", "Phoenix, WebSocket", "Real-time database subscriptions and live updates")
        Container(supabase_storage, "Supabase Storage", "S3-compatible", "File storage for attachments and documents")
    }

    System_Boundary(c4, "Deployment & Infrastructure") {
        Container(vercel_edge, "Vercel Edge Network", "CDN, Edge Functions", "Global content delivery and serverless functions")
        Container(vercel_build, "Vercel Build System", "Node.js, Vite", "Automated build pipeline and deployment")
    }

    System_Boundary(c5, "Development & AI Tools") {
        Container(mcp_knowledge, "MCP Knowledge Graph", "Node.js, Graph Database", "Persistent AI memory and context management")
        Container(mcp_exa, "MCP Exa Search", "Python, REST API", "Advanced web search and research capabilities")
        Container(mcp_github, "MCP GitHub Integration", "Node.js, GitHub API", "Repository management and code collaboration")
        Container(mcp_playwright, "MCP Playwright", "Node.js, Playwright", "Automated testing and browser automation")
    }

    System_Boundary(c6, "Testing & Quality") {
        Container(playwright_tests, "Playwright Test Suite", "TypeScript, Playwright", "End-to-end testing and UI validation")
        Container(vitest_unit, "Vitest Unit Tests", "TypeScript, Vitest", "Unit testing for components and utilities")
        Container(eslint_quality, "ESLint & TypeScript", "Node.js, TypeScript", "Code quality and type checking")
    }

    ' User interactions
    Rel(sales_user, spa, "Uses", "HTTPS")
    Rel(admin_user, spa, "Uses", "HTTPS")
    Rel(executive_user, spa, "Uses", "HTTPS")

    ' SPA relationships
    Rel(spa, sw, "Registers and controls", "Service Worker API")
    Rel(spa, design_system, "Uses components from", "ES Modules")
    Rel(spa, pinia_stores, "Manages state with", "Reactive API")
    Rel(spa, local_storage, "Persists data to", "Web Storage API")

    ' Backend API calls
    Rel(spa, supabase_api, "Makes API calls", "HTTPS/REST")
    Rel(spa, supabase_auth, "Authenticates via", "HTTPS/JWT")
    Rel(spa, supabase_realtime, "Subscribes to updates", "WebSocket")
    Rel(spa, supabase_storage, "Uploads files to", "HTTPS")

    ' Supabase internal relationships
    Rel(supabase_api, postgres, "Reads from and writes to", "SQL/TCP")
    Rel(supabase_auth, postgres, "Stores user data in", "SQL/TCP")
    Rel(supabase_realtime, postgres, "Streams changes from", "PostgreSQL Logical Replication")
    Rel(supabase_storage, postgres, "Stores metadata in", "SQL/TCP")

    ' Deployment relationships
    Rel(spa, vercel_edge, "Served by", "HTTPS/CDN")
    Rel(vercel_build, spa, "Builds and deploys", "CI/CD Pipeline")

    ' Development tool relationships
    Rel(spa, mcp_knowledge, "AI context and memory", "Local IPC")
    Rel(spa, mcp_exa, "Enhanced search", "Local IPC")
    Rel(spa, mcp_github, "Code management", "Local IPC")
    Rel(playwright_tests, spa, "Tests", "HTTP/WebDriver")
    Rel(mcp_playwright, playwright_tests, "Orchestrates", "Local IPC")

    ' Quality and testing
    Rel(vitest_unit, spa, "Unit tests", "ES Modules")
    Rel(eslint_quality, spa, "Analyzes code quality", "Static Analysis")

    UpdateElementStyle(spa, $bgColor="#1f2937", $fontColor="#ffffff", $borderColor="#3b82f6")
    UpdateElementStyle(postgres, $bgColor="#336791", $fontColor="#ffffff")
    UpdateElementStyle(supabase_api, $bgColor="#3ecf8e", $fontColor="#ffffff")
    UpdateElementStyle(vercel_edge, $bgColor="#000000", $fontColor="#ffffff")
```

## Container Descriptions

### Frontend Containers

#### Single Page Application (SPA)
- **Technology**: Vue 3.4+, TypeScript 5.3+, Vite 5.0+
- **Purpose**: Main user interface and business logic container
- **Responsibilities**:
  - User interface rendering and interaction handling
  - Client-side routing with Vue Router 4
  - Form validation with Yup schemas
  - Business logic orchestration
  - API communication with backend services
- **Key Features**:
  - Composition API for component logic
  - TypeScript for type safety
  - Tree-shaking for optimized bundles
  - Code splitting for performance

#### Service Worker
- **Technology**: JavaScript, Cache API, Background Sync
- **Purpose**: Progressive Web App capabilities and offline support
- **Responsibilities**:
  - Application caching for offline access
  - Background synchronization
  - Push notification handling
  - Network request interception and caching
- **Key Features**:
  - Offline-first caching strategy
  - Automatic update management
  - Performance optimization through caching

#### Design System
- **Technology**: Vue 3 Components, Tailwind CSS 3.3+, Headless UI
- **Purpose**: Consistent UI components and styling framework
- **Responsibilities**:
  - Reusable component library
  - Consistent visual design language
  - Accessibility compliance (WCAG 2.1 AA)
  - Responsive design patterns
- **Key Features**:
  - Token-based design system
  - Component composition patterns
  - Built-in accessibility features

### State Management Containers

#### Pinia Stores
- **Technology**: Pinia 2.1+, TypeScript, Vue 3 Reactivity
- **Purpose**: Centralized state management across the application
- **Responsibilities**:
  - Application state coordination
  - API data caching and synchronization
  - Business logic encapsulation
  - Real-time data management
- **Store Organization**:
  - `contactStore.ts` - Contact management
  - `organizationStore.ts` - Organization data
  - `opportunityStore.ts` - Sales pipeline
  - `interactionStore.ts` - Customer interactions
  - `principalActivityStore.ts` - Principal analytics
  - `dashboardStore.ts` - Dashboard metrics
  - `productStore.ts` - Product catalog
  - `principalStore.ts` - Principal data
  - `formStore.ts` - Form state management

#### Browser Storage
- **Technology**: LocalStorage, SessionStorage, IndexedDB
- **Purpose**: Client-side data persistence and caching
- **Responsibilities**:
  - User preferences and settings
  - Authentication token storage
  - Offline data caching
  - Form state persistence
- **Storage Strategy**:
  - LocalStorage for user preferences
  - SessionStorage for temporary data
  - Future: IndexedDB for large datasets

### Backend Services (Supabase)

#### PostgreSQL Database
- **Technology**: PostgreSQL 15+, Row Level Security (RLS)
- **Purpose**: Primary data store for all business information
- **Responsibilities**:
  - Persistent data storage
  - Data integrity and constraints
  - Query performance optimization
  - Security policy enforcement
- **Schema Organization**:
  - 36+ migration files tracking evolution
  - Core entities: contacts, organizations, opportunities
  - Support tables: interactions, products, principals
  - Analytics views and materialized views

#### Supabase API
- **Technology**: PostgREST, Auto-generated REST API
- **Purpose**: HTTP API layer over PostgreSQL database
- **Responsibilities**:
  - RESTful API endpoints for all entities
  - Automatic API generation from schema
  - Query optimization and filtering
  - Data validation and type checking
- **API Features**:
  - Automatic OpenAPI documentation
  - Flexible filtering and pagination
  - Embedded resource queries
  - Real-time query subscriptions

#### Supabase Auth
- **Technology**: GoTrue, JWT tokens, bcrypt
- **Purpose**: User authentication and session management
- **Responsibilities**:
  - User registration and login
  - Session token management
  - Password security and hashing
  - OAuth integration capabilities
- **Security Features**:
  - JWT-based authentication
  - Secure password hashing
  - Session timeout management
  - Role-based access control

#### Supabase Realtime
- **Technology**: Phoenix Framework, WebSocket, PostgreSQL Logical Replication
- **Purpose**: Real-time data synchronization
- **Responsibilities**:
  - Live database change notifications
  - Real-time collaboration features
  - Event-driven data updates
  - Presence and broadcast channels
- **Realtime Features**:
  - Row-level change notifications
  - Custom event broadcasting
  - Presence tracking for collaboration
  - Channel-based communication

#### Supabase Storage
- **Technology**: S3-compatible object storage
- **Purpose**: File and document storage
- **Responsibilities**:
  - File upload and download
  - Access control and permissions
  - File metadata management
  - CDN integration for performance
- **Storage Features**:
  - Automatic image transformations
  - Access policy management
  - CDN integration
  - File versioning capabilities

### Deployment & Infrastructure

#### Vercel Edge Network
- **Technology**: Global CDN, Edge Functions, Serverless
- **Purpose**: Application hosting and content delivery
- **Responsibilities**:
  - Static asset serving with CDN
  - Geographic content distribution
  - SSL certificate management
  - Domain and routing management
- **Performance Features**:
  - Global edge caching
  - Automatic image optimization
  - Compression and minification
  - Edge-side rendering capabilities

#### Vercel Build System
- **Technology**: Node.js, Vite, CI/CD Pipeline
- **Purpose**: Automated build and deployment pipeline
- **Responsibilities**:
  - Source code compilation
  - Asset optimization and bundling
  - Deployment automation
  - Environment management
- **Build Features**:
  - Git-based deployments
  - Preview deployments for PRs
  - Environment variable management
  - Build performance monitoring

### Development & AI Tools

#### MCP Knowledge Graph
- **Technology**: Node.js, Graph Database, Persistent Storage
- **Purpose**: AI memory and context management
- **Responsibilities**:
  - Session context persistence
  - Knowledge relationship mapping
  - Learning from development patterns
  - Cross-session continuity
- **Integration**: Local IPC for development assistance

#### MCP Exa Search
- **Technology**: Python, REST API, Web Scraping
- **Purpose**: Enhanced search and research capabilities
- **Responsibilities**:
  - Web search and content analysis
  - Company and market research
  - Documentation lookup
  - Competitive intelligence
- **Integration**: Local IPC for enhanced development

#### MCP GitHub Integration
- **Technology**: Node.js, GitHub API, Git Operations
- **Purpose**: Repository management and collaboration
- **Responsibilities**:
  - Code review and analysis
  - Pull request management
  - Issue tracking and project management
  - Automated workflow triggers
- **Integration**: Local IPC for code collaboration

#### MCP Playwright
- **Technology**: Node.js, Playwright Framework, Browser Automation
- **Purpose**: Automated testing and quality assurance
- **Responsibilities**:
  - End-to-end test execution
  - UI validation and regression testing
  - Performance testing
  - Accessibility testing
- **Integration**: Local IPC for test orchestration

### Testing & Quality

#### Playwright Test Suite
- **Technology**: TypeScript, Playwright, Browser Automation
- **Purpose**: End-to-end testing and UI validation
- **Responsibilities**:
  - User journey testing
  - Cross-browser compatibility
  - Mobile responsive testing
  - Performance regression testing
- **Test Coverage**:
  - Critical user flows
  - Form validation scenarios
  - API integration testing
  - Accessibility compliance

#### Vitest Unit Tests
- **Technology**: TypeScript, Vitest, JSDOM
- **Purpose**: Unit testing for components and utilities
- **Responsibilities**:
  - Component behavior testing
  - Utility function validation
  - Store logic testing
  - Mock and stub management
- **Testing Strategy**:
  - Component isolation testing
  - State management validation
  - API mocking and simulation

#### ESLint & TypeScript
- **Technology**: ESLint, TypeScript Compiler, Static Analysis
- **Purpose**: Code quality and type checking
- **Responsibilities**:
  - Static code analysis
  - Type checking and validation
  - Code style enforcement
  - Security vulnerability detection
- **Quality Rules**:
  - Strict TypeScript configuration
  - Vue 3 specific linting rules
  - Accessibility linting
  - Security-focused rules

## Container Interactions

### Data Flow Patterns

#### 1. User Interface to Backend
```
User → SPA → Pinia Store → Supabase API → PostgreSQL
```
- User actions trigger store methods
- Stores coordinate API calls
- API updates database
- Realtime updates flow back through WebSocket

#### 2. Real-time Updates
```
PostgreSQL → Supabase Realtime → SPA → Pinia Store → UI Update
```
- Database changes trigger realtime events
- SPA receives WebSocket notifications
- Stores update reactive state
- UI automatically re-renders

#### 3. Offline/Online Synchronization
```
SPA → Service Worker → Cache → Background Sync → Supabase API
```
- Offline actions stored in service worker
- Background sync attempts when online
- Conflict resolution through timestamps
- User notification of sync status

### Security Boundaries

#### 1. Client-Server Boundary
- All communication over HTTPS
- JWT token authentication
- Request/response validation
- Rate limiting and abuse prevention

#### 2. Database Security
- Row Level Security (RLS) policies
- Role-based access control
- Data encryption at rest
- Audit logging for sensitive operations

#### 3. Frontend Security
- Content Security Policy (CSP)
- XSS protection through framework
- Sanitized user input
- Secure token storage

## Performance Characteristics

### Frontend Performance
- **Bundle Size**: < 500KB gzipped main bundle
- **First Contentful Paint**: < 1.5 seconds
- **Time to Interactive**: < 3 seconds
- **Core Web Vitals**: Meets Google requirements

### Backend Performance
- **API Response Time**: < 200ms for typical queries
- **Database Query Time**: < 50ms for indexed queries
- **Real-time Latency**: < 100ms for update propagation
- **Concurrent Users**: 100+ simultaneous users supported

### Scalability Considerations
- **Horizontal Scaling**: Vercel automatic scaling
- **Database Scaling**: Supabase managed scaling
- **CDN Scaling**: Global edge network
- **Client Scaling**: Efficient bundle splitting

---

**Next**: [Component Architecture](./03-component-architecture.md) - Detailed view of internal components and their relationships