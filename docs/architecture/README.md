# CRM System Architecture Documentation

This directory contains comprehensive architecture documentation for the CRM system, organized using the C4 Model methodology and Architecture Decision Records (ADRs).

## Quick Navigation

### 📋 Overview
- **System Type**: Vue 3 + TypeScript Single Page Application (SPA)
- **Backend**: Supabase (PostgreSQL + REST API + Real-time)
- **Deployment**: Vercel (Production: [crm.kjrcloud.com](https://crm.kjrcloud.com))
- **Architecture Style**: Component-based frontend with serverless backend
- **Key Patterns**: Composition API, Store-based state management, Progressive Web App (PWA)

### 🏗️ Architecture Documentation

#### [C4 Model Diagrams](./c4-model/)
Hierarchical architectural views following the C4 methodology:
- **[System Context](./c4-model/01-system-context.md)** - High-level system overview and external dependencies
- **[Container Architecture](./c4-model/02-container-architecture.md)** - Application containers and infrastructure
- **[Component Architecture](./c4-model/03-component-architecture.md)** - Internal component relationships
- **[Code Architecture](./c4-model/04-code-architecture.md)** - Implementation patterns and conventions

#### [Architecture Decision Records](./adrs/)
Key architectural decisions and their rationale:
- **[ADR-001](./adrs/001-vue3-composition-api.md)** - Vue 3 Composition API over Options API
- **[ADR-002](./adrs/002-pinia-state-management.md)** - Pinia for state management
- **[ADR-003](./adrs/003-supabase-backend.md)** - Supabase as backend platform
- **[ADR-004](./adrs/004-component-architecture.md)** - Component organization strategy
- **[ADR-005](./adrs/005-pwa-implementation.md)** - Progressive Web App implementation
- **[ADR-006](./adrs/006-mcp-integration.md)** - Model Context Protocol integration
- **[ADR-007](./adrs/007-testing-strategy.md)** - Testing framework and strategy

#### [Security Architecture](./security/)
Comprehensive security documentation:
- **[Security Overview](./security/01-security-overview.md)** - Security principles and controls
- **[Authentication & Authorization](./security/02-auth-architecture.md)** - Supabase auth and RLS policies
- **[Threat Model](./security/03-threat-model.md)** - Security threats and mitigations
- **[Compliance](./security/04-compliance.md)** - GDPR, accessibility, and other compliance

#### [Data Architecture](./data/)
Database and data management documentation:
- **[Database Schema](./data/01-database-schema.md)** - Entity relationships and schema design
- **[Migration Evolution](./data/02-migration-history.md)** - Database evolution and migration strategy
- **[Data Flow](./data/03-data-flow.md)** - Data flow between frontend and backend
- **[Performance](./data/04-performance-optimization.md)** - Database performance and optimization

#### [Deployment Architecture](./deployment/)
Infrastructure and deployment documentation:
- **[Deployment Overview](./deployment/01-deployment-overview.md)** - Deployment strategy and environments
- **[Infrastructure](./deployment/02-infrastructure.md)** - Vercel, Supabase, and external services
- **[CI/CD Pipeline](./deployment/03-ci-cd-pipeline.md)** - Build and deployment automation
- **[Monitoring](./deployment/04-monitoring.md)** - Performance monitoring and alerting

#### [Quality Attributes](./quality/)
Non-functional requirements and cross-cutting concerns:
- **[Performance](./quality/01-performance.md)** - Performance characteristics and optimizations
- **[Scalability](./quality/02-scalability.md)** - Scalability patterns and limitations
- **[Accessibility](./quality/03-accessibility.md)** - WCAG 2.1 AA compliance implementation
- **[Maintainability](./quality/04-maintainability.md)** - Code quality and maintenance strategies
- **[Reliability](./quality/05-reliability.md)** - Error handling and recovery patterns

## 🎯 Business Domains

The CRM system is organized around 5 main business domains:

### 1. **Contact Management**
- Individual contact records with comprehensive relationship tracking
- Integration with organizations and opportunity creation
- Activity history and interaction logging

### 2. **Organization Management**
- Company profiles with hierarchical relationships
- Contact associations and distributor networks
- Business intelligence and analytics

### 3. **Opportunity Management**
- 7-stage sales pipeline (NEW_LEAD → CLOSED_WON)
- Auto-naming system and batch creation
- KPI tracking and performance analytics

### 4. **Interaction Tracking**
- Customer touchpoint recording
- Multi-channel interaction support
- Activity timeline and reporting

### 5. **Principal Activity Management**
- Principal performance tracking
- Product portfolio management
- Distributor relationship analytics

## 🏛️ Architectural Principles

### 1. **Component-First Design**
- Vue 3 Composition API for reusable, testable components
- Design system with consistent UI patterns
- Separation of concerns between presentation and business logic

### 2. **Type Safety**
- Full TypeScript implementation with strict mode
- Auto-generated types from Supabase schema
- Form validation with Yup schema-based validation

### 3. **Progressive Enhancement**
- Works without JavaScript (basic functionality)
- Progressive Web App capabilities
- Offline-first data handling where applicable

### 4. **Accessibility First**
- WCAG 2.1 AA compliance by design
- Keyboard navigation support
- Screen reader optimization

### 5. **Performance Optimization**
- Code splitting and lazy loading
- Optimized bundle sizes with tree shaking
- Efficient state management with Pinia

## 🔧 Technology Stack

### Frontend
- **Vue 3.4+** - Progressive framework with Composition API
- **TypeScript 5.3+** - Type-safe JavaScript with strict mode
- **Vite 5.0+** - Fast build tool and development server
- **Pinia 2.1+** - State management with TypeScript support
- **Vue Router 4.2+** - Client-side routing
- **Tailwind CSS 3.3+** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components

### Backend & Infrastructure
- **Supabase** - PostgreSQL database with real-time capabilities
- **Vercel** - Serverless deployment and hosting
- **PostgreSQL 15+** - Primary database with advanced features
- **Row Level Security (RLS)** - Database-level security policies

### Development & Testing
- **Playwright** - End-to-end testing framework
- **Vitest** - Unit testing framework
- **ESLint + TypeScript ESLint** - Code linting and formatting
- **MCP (Model Context Protocol)** - AI-assisted development integration

### External Integrations
- **10 MCP Servers** - Knowledge graph, web search, GitHub, filesystem, etc.
- **PWA Service Worker** - Offline capabilities and caching
- **Real-time Subscriptions** - Live data updates via Supabase

## 📊 System Metrics

- **36+ Database Migrations** - Evolutionary database design
- **200+ Components** - Reusable Vue components
- **10 Pinia Stores** - Organized state management
- **5 Business Domains** - Clear domain separation
- **50+ API Endpoints** - RESTful API surface
- **WCAG 2.1 AA Compliant** - Accessibility standards

## 🔄 Architecture Evolution

This architecture has evolved through multiple phases:
1. **MVP Phase** - Basic CRUD operations with Vue 3 + Supabase
2. **Dashboard Integration** - Centralized navigation and layout
3. **Opportunity Management** - Complex sales pipeline implementation
4. **Interaction System** - Customer touchpoint tracking
5. **Principal Analytics** - Advanced business intelligence
6. **Current State** - Mature CRM with comprehensive feature set

## 📖 Reading Guide

### For New Developers
1. Start with [System Context](./c4-model/01-system-context.md) for high-level overview
2. Review [ADR-001](./adrs/001-vue3-composition-api.md) through [ADR-003](./adrs/003-supabase-backend.md) for key decisions
3. Examine [Component Architecture](./c4-model/03-component-architecture.md) for implementation patterns

### For Architects
1. Review all [Architecture Decision Records](./adrs/) for decision history
2. Study [Security Architecture](./security/) for security posture
3. Analyze [Quality Attributes](./quality/) for non-functional requirements

### For DevOps/Platform Engineers
1. Focus on [Deployment Architecture](./deployment/) for infrastructure
2. Review [Data Architecture](./data/) for database management
3. Study [Monitoring](./deployment/04-monitoring.md) for operational concerns

## 🤝 Contributing to Architecture

When making architectural changes:
1. **Create ADR** - Document significant decisions in [ADRs directory](./adrs/)
2. **Update Diagrams** - Maintain C4 diagrams for major changes
3. **Security Review** - Update threat model if security boundaries change
4. **Performance Impact** - Document performance implications

## 📞 Support

For architecture questions or clarifications:
- Review existing ADRs for historical context
- Check C4 diagrams for current state visualization
- Consult security documentation for compliance requirements

---

*Last Updated: 2025-01-08*  
*Documentation Version: 1.0*  
*System Version: Production (crm.kjrcloud.com)*