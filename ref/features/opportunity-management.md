# Opportunity Management System - Implementation Guide

## Overview

The Opportunity Management System provides comprehensive sales pipeline tracking with a 7-stage workflow, auto-naming capabilities, batch creation, and real-time KPI monitoring. This implementation demonstrates enterprise-level sales management with sophisticated business logic integration.

## Core Features

### 7-Stage Sales Pipeline

**Pipeline Stages**:
1. **NEW_LEAD** - Initial contact or inquiry
2. **INITIAL_OUTREACH** - First communication attempt
3. **SAMPLE_VISIT_OFFERED** - Sample or demo offered
4. **AWAITING_RESPONSE** - Waiting for customer feedback
5. **FEEDBACK_LOGGED** - Customer response recorded
6. **DEMO_SCHEDULED** - Product demonstration scheduled
7. **CLOSED_WON** - Successful opportunity completion

### Auto-Naming System

**Naming Pattern**: `[Organization] - [Principal] - [Context] - [Month Year]`

**Implementation Features**:
- Template-based name generation
- Collision detection and resolution
- Manual override capabilities
- Batch preview functionality

### Batch Creation Workflow

**Multi-Principal Creation**:
1. Select organization and context
2. Choose multiple principals
3. Preview generated opportunity names
4. Configure shared settings (product, stage)
5. Submit batch with progress feedback

## Technical Implementation

### Database Schema

```sql
CREATE TYPE opportunity_stage AS ENUM (
  'NEW_LEAD', 'INITIAL_OUTREACH', 'SAMPLE_VISIT_OFFERED',
  'AWAITING_RESPONSE', 'FEEDBACK_LOGGED', 'DEMO_SCHEDULED', 'CLOSED_WON'
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stage opportunity_stage NOT NULL DEFAULT 'NEW_LEAD',
  probability_percent INTEGER CHECK (probability_percent >= 0 AND probability_percent <= 100),
  organization_id UUID REFERENCES organizations(id),
  principal_id UUID REFERENCES organizations(id),
  product_id UUID REFERENCES products(id),
  name_template TEXT,
  context opportunity_context,
  is_won BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Component Architecture

**Key Components**:
- `OpportunitiesListView.vue` - Main list with KPI cards and filtering
- `OpportunityCreateView.vue` - Multi-step creation wizard
- `OpportunityFormWrapper.vue` - 3-step form orchestration
- `OpportunityKPICards.vue` - Real-time dashboard metrics
- `PrincipalMultiSelect.vue` - Batch selection interface

### State Management

**OpportunityStore Features**:
- Reactive KPI calculations
- Batch creation state management
- Demo data fallbacks
- Comprehensive error handling
- Real-time metric updates

### API Integration

**Service Layer (`opportunitiesApi.ts`)**:
- Batch creation operations
- Auto-naming service integration
- KPI calculation endpoints
- Advanced filtering and search
- Performance monitoring

## KPI Dashboard

### Metrics Calculated
- **Total Opportunities** - All non-deleted opportunities
- **Active Opportunities** - Opportunities not in CLOSED_WON stage
- **Average Probability** - Mean probability across active opportunities
- **Won This Month** - Opportunities marked as won in current month

### Real-Time Updates
- Reactive computed properties
- Automatic refresh on data changes
- Performance-optimized calculations
- Error handling with fallbacks

## Integration Points

### Contact Integration
- Create opportunities from contact detail pages
- Pre-populated organization data
- Contact-opportunity relationship tracking

### Organization Integration
- Bulk opportunity creation from organization view
- Organization-specific opportunity filtering
- Principal-distributor relationship management

### Product Integration
- Principal-filtered product selection
- Product availability validation
- Category-based organization

This implementation provides a comprehensive, production-ready opportunity management system with sophisticated business logic, intuitive user experience, and robust technical architecture.