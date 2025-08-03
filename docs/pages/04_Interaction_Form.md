Here is a structured format for designing and implementing a "Create Interaction" Form and Interaction View List Page, aligned with MVP principles, mobile-first priorities, and data integrity requirements.

**MVP SAFETY PROTOCOL INTEGRATION**
This document has been updated to enforce MVP checkpoint safety protocol and reference opportunity component architecture patterns. All interaction form tasks must pass safety checkpoints before proceeding.

📋 Interaction Module Design
Tracks all communication and touchpoints related to advancing Opportunities.

**OPPORTUNITY COMPONENT REFERENCE ARCHITECTURE**
The interaction form system must follow patterns established in the mature opportunity management system:
- Form architecture references: `OpportunityFormWrapper.vue` (3-step wizard), `OpportunityNameField.vue` (auto-naming)
- Validation patterns: Yup schemas with TypeScript inference from `opportunities.ts`
- Accessibility compliance: WCAG 2.1 AA patterns from opportunity components
- Mobile optimization: Responsive patterns from opportunity mobile implementation

1️⃣ Interaction Form – Create New Interaction

**SAFETY CHECKPOINT #1: FORM ARCHITECTURE DESIGN**
**Status**: ⚠️ BLOCKED - Requires approval before implementation
**Requirements**: Component mapping to opportunity analogs must be documented and approved
**Evidence Required**: Architectural review comparing InteractionFormWrapper to OpportunityFormWrapper patterns
**Note**: Form validation must pass QA *and* document sign-off at Checkpoint #2 per MVP protocol

🔍 Purpose
To record meaningful interactions (e.g., calls, demos, in-person meetings) that support the progression of existing Opportunities.

**COMPONENT MAPPING TO OPPORTUNITY ANALOGS:**
- `InteractionFormWrapper.vue` → follows `OpportunityFormWrapper.vue` 3-step wizard pattern
- `InteractionTypeSelect.vue` → follows `StageSelect.vue` validation and accessibility patterns  
- `OpportunitySelect.vue` → follows `ProductSelect.vue` filtering and principal-specific logic
- `InteractionNotesField.vue` → follows `OpportunityNameField.vue` auto-generation patterns for interaction summaries

🧩 Core Concepts
Concept	Description	**Opportunity Reference**
Interaction	A logged event tied to an Opportunity.	Maps to Opportunity relationship pattern
Timing	Created after an Opportunity exists.	Follows opportunity prerequisite validation
Linking	Must be associated with an existing Opportunity (selected via dropdown).	Uses OpportunitySelect component pattern
Follow-ups	Supports scheduling follow-up tasks directly from the interaction.	Extends opportunity workflow progression logic

**SAFETY CHECKPOINT #2: FORM VALIDATION ARCHITECTURE**
**Status**: ⚠️ BLOCKED - Form validation architecture requires safety validation
**Requirements**: Yup schema must follow opportunity validation patterns with TypeScript inference
**Evidence Required**: Unit tests demonstrating validation compliance + accessibility audit report
**Rollback Procedure**: Revert to opportunity component validation patterns if validation fails
**Note**: All validation rules must be documented and verified before proceeding to implementation

🧱 Form Structure

✅ Required Fields
Field	Type	Description	**Opportunity Pattern Reference**
Interaction Type	Dropdown	Email, Call, In-Person, Demo, Follow-up	Follows `StageSelect.vue` enum validation pattern
Date/Time	DateTime Picker	When the interaction took place	Uses opportunity `expected_close_date` validation pattern
Subject	Text Input	Short description of the interaction	Follows `OpportunityNameField.vue` required field pattern
Opportunity	Dropdown (filtered)	Select related Opportunity	Uses `ProductSelect.vue` principal-filtering pattern

📝 Optional Fields
Field	Type	Purpose	**Opportunity Pattern Reference**
Notes	Text Area	Detailed notes on the interaction	Follows opportunity `notes` field validation (2000 char limit)
Follow-up	Checkbox	Indicates if a follow-up is needed	Maps to opportunity stage progression logic
Follow-up Date	Date Picker	Suggested follow-up timing	Uses opportunity date validation with future-date constraints

2️⃣ Mobile Optimization

**SAFETY CHECKPOINT #3: MOBILE ACCESSIBILITY COMPLIANCE**
**Status**: ⚠️ BLOCKED - Mobile optimization must follow opportunity mobile patterns with safety validation
**Requirements**: Touch targets, responsive breakpoints, and accessibility must match opportunity mobile implementation
**Evidence Required**: Mobile accessibility audit + opportunity component comparison report
**Rollback Procedure**: Revert to opportunity mobile patterns if accessibility tests fail
**Note**: Mobile form optimization must follow opportunity mobile patterns with safety validation

🎯 Mobile-Specific Design Goals
Feature	Description	**Opportunity Mobile Reference**
Quick Templates	Fast-fill interaction types like "Dropped Samples", "Quick Call", etc.	Follows `OpportunityFormWrapper.vue` responsive grid patterns
Voice Input	Supported for notes field	Maps to opportunity notes field accessibility patterns
Touch Optimization	44px minimum touch targets	Uses opportunity component touch target standards

**MOBILE COMPONENT ARCHITECTURE:**
- Responsive grid: Follows `OpportunityFormWrapper.vue` `grid-cols-1 lg:grid-cols-2` pattern
- Touch targets: Minimum 44px following opportunity button standards
- Form steps: Mobile-first progression similar to opportunity 3-step wizard
- Error states: Touch-friendly error messaging from opportunity validation patterns

🏃 Quick Interaction Log Flow (Mobile Field Use)
Step	Action	**Opportunity Reference**
1	Select Organization (type-ahead dropdown)	Uses opportunity organization selection pattern
2	Choose Interaction Type	Follows `StageSelect.vue` mobile dropdown pattern
3	Add Notes (voice input supported)	Maps to opportunity notes field mobile optimization
4	Link to Opportunity	Uses `ProductSelect.vue` filtered selection pattern

3️⃣ View: Interaction List Page

**SAFETY CHECKPOINT #4: TABLE ARCHITECTURE & ACCESSIBILITY**
**Status**: ⚠️ BLOCKED - List view architecture must follow opportunity table patterns
**Requirements**: Component must follow `OpportunityTable.vue` sortable, filterable, accessible table patterns
**Evidence Required**: Accessibility audit report + keyboard navigation testing documentation
**Rollback Procedure**: Revert to `OpportunityTable.vue` component patterns if accessibility tests fail
**Note**: Table implementation requires documented accessibility compliance before proceeding

📄 Overview
A dashboard view that lists past interactions in tabular format. Similar in layout and UX to the Opportunity List Page.

**TABLE COMPONENT MAPPING TO OPPORTUNITY ANALOGS:**
- `InteractionTable.vue` → follows `OpportunityTable.vue` sortable table pattern
- Column sorting → uses opportunity table sort logic with TypeScript type safety
- Filter components → follows `OpportunityKPICards.vue` responsive filter pattern
- Search functionality → maps to opportunity search implementation with debouncing
- Accessibility → follows opportunity table ARIA labels and keyboard navigation

💡 Design Guidelines
**Component Architecture Requirements:**
- MVP-style, responsive table following `OpportunityTable.vue` patterns
- Sortable columns using opportunity table sorting logic
- WCAG 2.1 AA compliance following opportunity table accessibility patterns
- Touch-friendly responsive design from opportunity mobile implementation

**FILTERING ARCHITECTURE:**
Search and filter by (following opportunity filter patterns):
- Account Manager → follows opportunity `deal_owner` filter pattern
- Interaction Type → uses enum validation like opportunity `stage` filtering
- Date range → follows opportunity `expected_close_date` range filtering
- Opportunity Name → maps to opportunity search functionality
- Organization → uses opportunity organization filtering logic

**SAFETY CHECKPOINT #5: DATA DISPLAY COMPLIANCE**
**Status**: ⚠️ BLOCKED - Table data display requires validation against opportunity patterns
**Requirements**: Column structure, data formatting, and responsive behavior must match opportunity table standards
**Evidence Required**: Cross-browser testing report + responsive design validation
**Rollback Procedure**: Use opportunity table component patterns as fallback
**Note**: Data display must be approved and tested before implementation

📋 Table Columns (**Following Opportunity Table Pattern**)
PRIORITY	TYPE	DATE	ACCT. MANAGER	OPPORTUNITY	CONTACT	PRINCIPAL	OPERATOR	NOTES	SAMPLE RATING
A+	Demo	2024-11-01	Sarah	Artisan Pretzel Roll Program	Chef Mike Johnson	Bakeline	National Fresh Foods	Very impressed. Requested cost analysis.	5
A+	Menu Dev Session	2024-11-03	Sarah	Artisan Pretzel Roll Program	Anna Smith	Bakeline	National Fresh Foods	High interest in burger program.	N/A
A	Kitchen Testing	2024-11-02	Michael	Clean Label Sauce Integration	Tom Wilson	Pure Foods	Farm & Plate Group	Heat level perfect in 3 recipes.	4
B	Sample Delivery	2024-11-04	David	Summer Menu Feature	Maria Garcia	Fresh Prep	Campus Dining Solutions	Delivered for next week's kitchen trial.	N/A
A	Implementation	2024-11-05	Lisa	Regional Chain Rollout	Bob Chen	Quality Foods	Midwest Restaurant Group	Trained staff on new breading process.	N/A

5️⃣ Business Logic Rules

**SAFETY CHECKPOINT #6: BUSINESS LOGIC VALIDATION**
**Status**: ⚠️ BLOCKED - Business rules must align with opportunity workflow patterns
**Requirements**: Validation logic must follow opportunity business rule patterns with proper error handling
**Evidence Required**: Business logic testing documentation + opportunity workflow integration tests
**Rollback Procedure**: Revert to opportunity validation patterns if business logic tests fail
**Note**: Business rule implementation requires approval and comprehensive testing

Rule	Behavior	**Opportunity Pattern Reference**
Interaction must be tied to existing Opportunity	Enforced via dropdown filter	Follows opportunity `organization_id` relationship validation
Follow-up date must be >= interaction date	Validated before submission	Uses opportunity `expected_close_date` future-date validation pattern
Interaction timeline builds Opportunity history	Shown on Opportunity detail page	Maps to opportunity related data loading patterns
Follow-ups can trigger notification/reminders	Scheduled if checkbox + date set	Extends opportunity stage progression notification system
All interactions sync to CRM API / backend	With timestamp and user metadata	Follows opportunity API integration patterns with error handling

**VALIDATION SCHEMA MAPPING TO OPPORTUNITIES:**
```typescript
// Interaction validation must follow opportunity validation patterns
const interactionValidationSchema = yup.object({
  interaction_type: yup.string().required('Interaction type is required')
    .oneOf(Object.values(InteractionType), 'Invalid interaction type'), // Follows OpportunityStage pattern
  
  date: yup.date().required('Date is required')
    .max(new Date(), 'Date cannot be in the future'), // Follows opportunity date validation
    
  opportunity_id: yup.string().required('Opportunity is required')
    .uuid('Invalid opportunity ID'), // Follows opportunity organization_id validation
    
  notes: yup.string().max(2000, 'Notes must be less than 2000 characters')
    .nullable() // Follows opportunity notes validation pattern
})
```

**SAFETY CHECKPOINT #7: INTEGRATION & QA VALIDATION**
**Status**: ⚠️ BLOCKED - Final integration requires comprehensive QA approval
**Requirements**: End-to-end testing with opportunity system integration + accessibility audit
**Evidence Required**: Complete test suite results + accessibility compliance certificate
**Rollback Procedure**: Full rollback to opportunity patterns if integration tests fail
**Note**: Final approval required from architecture team before production deployment

✅ Summary
This structure enables (**with MVP Safety Protocol Compliance**):

✍️ Efficient field entry (desktop + mobile) → **Checkpoint #3 Required**
🔍 Complete opportunity progression tracking → **Checkpoint #6 Required**
📱 On-the-go logging with offline-first support → **Checkpoint #3 Mobile Required**
🧩 Tight integration with opportunity workflow → **Checkpoint #6 Integration Required**
📊 Centralized list view with smart filters and ratings → **Checkpoint #5 Table Required**

**OVERALL SAFETY PROTOCOL STATUS:**
- ⚠️ **7 Checkpoints Required** - All must pass before implementation
- 🔒 **Architecture Review** - Component mappings require approval
- 📋 **QA Validation** - Accessibility and integration testing required
- 📝 **Documentation** - All evidence must be documented and signed-off
- 🔄 **Rollback Ready** - Opportunity component patterns serve as fallback architecture

