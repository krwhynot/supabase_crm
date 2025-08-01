## 🧩 UI Elements Summary
• A text field to enter the opportunity name (with auto-generation option)
• A dropdown to select the current sales stage (7 stages from New Lead to Closed-Won)
• A multi-select dropdown to choose Principal organizations
• A dropdown to select specific products (filtered by selected Principals)
• A dropdown to select opportunity context (Site Visit, Food Show, etc.)
• A percentage slider or field for probability of closing
• A date picker for expected close date
• A dropdown to select the deal owner (sales representative)
• A text area for notes about the opportunity
• A preview showing auto-generated opportunity names
• A submit button to create the opportunity

# Opportunity Form - Sales Pipeline Initiation

## Overview
The Opportunity Form initiates the formal sales relationship and tracks pipeline progression. An Opportunity represents the formal beginning of a sales relationship and is created **first**, before Interactions are logged to support it.

## Purpose
Initiate formal sales relationship and track pipeline progression.

## Structural Model
- **Opportunity** represents the formal beginning of a sales relationship
- **Timing**: Created first, when interest is identified
- **Relationship**: Once created, Interactions are logged to support or advance that opportunity

## Form Structure

### Required Fields
- **Opportunity Name*** - Descriptive deal name (auto-generated option available)
- **Stage*** - 7-point sales funnel (dropdown):
  1. New Lead
  2. Initial Outreach
  3. Sample/Visit Offered
  4. Awaiting Response
  5. Feedback Logged
  6. Demo Scheduled
  7. Closed - Won
- **Principals*** - Multiple Principal organizations (multi-select dropdown)
- **Product*** - Specific product from catalog (dropdown filtered by selected Principals)

### Optional Fields
- **Opportunity Context** - Type of opportunity (dropdown): Site Visit, Food Show, New Product Interest, Follow-up, Demo Request, Sampling, Custom
- Probability % (0-100)
- Expected Close Date
- Deal Owner (Account Manager)
- Notes

## Auto-Generated Opportunity Naming

### Naming Pattern
`[Organization Name] - [Principal] - [Context] - [Month Year]`

### Examples
- "Joe's Market - Tyson - Site Visit - Jul 2025"
- "FreshCo - Impossible Foods - Food Show - Jul 2025"
- "Whole Harvest - Kaufholds - New Product Interest - Jul 2025"

### Features
- **Auto-Name Toggle**: Checkbox to enable/disable auto-naming
- **Name Preview**: Shows generated names before submission
- **Manual Override**: Users can always manually enter opportunity names
- **Context Integration**: Uses selected Opportunity Context for naming

## Multiple Principal Logic

### Separate Opportunities
- **When multiple Principals are selected, system creates separate opportunities - one for each Principal**
- **Individual Naming**: Each opportunity gets unique name with Principal identifier
- **Batch Creation Confirmation**: Shows preview of all opportunity names that will be created
- **User Notification**: Clear indication that multiple opportunities will be created before submission

## Pipeline Rules
- Stage progression must be logical
- Probability increases with stage advancement
- Each opportunity is linked to exactly one Principal (not multiple)
- Product selection is filtered by chosen Principals (only products owned by selected Principals)
- Principal/Product combination drives pricing

## 7-Stage Sales Pipeline

### Stage Definitions
The CRM tracks opportunities through a structured pipeline that mirrors real food service sales workflows:

1. **New Lead** - Initial prospect identification (e.g., distributor provides restaurant list, you identify "Tony's Grill" as good fit for BBQ sauce line)
2. **Initial Outreach** - First contact and follow-up (call restaurant manager, send product sheet via email)
3. **Sample/Visit Offered** - Product sampling and visit scheduling (offer to drop off sauce samples, schedule visit date)
4. **Awaiting Response** - Following up after sample delivery (week after sample drop-off, send "checking in" email)
5. **Feedback Logged** - Recording customer feedback and responses (manager replies "sauce was great but too spicy", still open to alternatives)
6. **Demo Scheduled** - Planning product demonstrations (set up chef demo with three alternative sauces tailored to clientele)
7. **Closed - Won** - Successful deal completion (Tony's Grill decides to bring in mild BBQ sauce across all three locations)

## Migration Mapping

### Excel to Database Mapping
- Excel "Opportunities" → `opportunities` table
- Excel "STAGE-7 point sales funnel" → `stage` (mapped to dropdown values)
- Excel "PRINCIPAL" → linked via `opportunity_principals` junction table
- Excel "PRODUCT" → `product_id` (FK relationship)

### Data Quality Rules
- Stages mapped to: new_lead, initial_outreach, sample_visit_offered, awaiting_response, feedback_logged, demo_scheduled, closed_won
- Opportunities can be linked to multiple Principals (creates separate opportunities)
- Products must be owned by at least one selected Principal

## Integration Points
- Created from [Contact Form](01_Contact_Form.md) and [Organization Form](02_Organization_Form.md)
- Links to [Interaction Form](04_Interaction_Form.md) for touchpoint tracking
- Connects to [Principal Activity Tracking](05_Principal_Activity_Tracking.md) for Principal-focused workflows
- Feeds into [Product Management](06_Product_Management.md) for product-opportunity relationships

